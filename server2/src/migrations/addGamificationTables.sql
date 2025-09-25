-- Database Migration: Add Gamification Tables
-- This script creates the missing tables required for the gamification system

-- Create user_achievements table
CREATE TABLE IF NOT EXISTS user_achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    achievement_id VARCHAR(100) NOT NULL,
    unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Ensure a user can't unlock the same achievement twice
    UNIQUE(user_id, achievement_id)
);

-- Create indexes for user_achievements
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_achievement_id ON user_achievements(achievement_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_unlocked_at ON user_achievements(unlocked_at);

-- Create user_goals table
CREATE TABLE IF NOT EXISTS user_goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    goal_type VARCHAR(50) NOT NULL, -- 'books_read', 'pages_read', 'reading_time', 'reading_streak'
    target_value INTEGER NOT NULL,
    current_value INTEGER DEFAULT 0,
    target_date DATE,
    is_active BOOLEAN DEFAULT true,
    is_completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for user_goals
CREATE INDEX IF NOT EXISTS idx_user_goals_user_id ON user_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_user_goals_is_active ON user_goals(is_active);
CREATE INDEX IF NOT EXISTS idx_user_goals_is_completed ON user_goals(is_completed);
CREATE INDEX IF NOT EXISTS idx_user_goals_goal_type ON user_goals(goal_type);
CREATE INDEX IF NOT EXISTS idx_user_goals_target_date ON user_goals(target_date);

-- Create user_actions table (for tracking point-earning actions)
CREATE TABLE IF NOT EXISTS user_actions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action VARCHAR(100) NOT NULL, -- 'book_upload', 'reading_session', 'note_created', etc.
    points INTEGER NOT NULL DEFAULT 0,
    action_data JSONB, -- Additional data about the action
    book_id UUID REFERENCES books(id) ON DELETE SET NULL,
    session_id UUID, -- Can reference reading_sessions if needed
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for user_actions
CREATE INDEX IF NOT EXISTS idx_user_actions_user_id ON user_actions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_actions_action ON user_actions(action);
CREATE INDEX IF NOT EXISTS idx_user_actions_book_id ON user_actions(book_id);
CREATE INDEX IF NOT EXISTS idx_user_actions_created_at ON user_actions(created_at);
CREATE INDEX IF NOT EXISTS idx_user_actions_points ON user_actions(points);

-- Enable Row Level Security (RLS) on gamification tables
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_actions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_achievements
CREATE POLICY "Users can view their own achievements" ON user_achievements
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own achievements" ON user_achievements
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Create RLS policies for user_goals
CREATE POLICY "Users can view their own goals" ON user_goals
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own goals" ON user_goals
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own goals" ON user_goals
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own goals" ON user_goals
    FOR DELETE USING (user_id = auth.uid());

-- Create RLS policies for user_actions
CREATE POLICY "Users can view their own actions" ON user_actions
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own actions" ON user_actions
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Grant necessary permissions
GRANT SELECT, INSERT ON user_achievements TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON user_goals TO authenticated;
GRANT SELECT, INSERT ON user_actions TO authenticated;

-- Create trigger to automatically update user_goals.updated_at
CREATE OR REPLACE FUNCTION update_user_goals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_user_goals_updated_at
    BEFORE UPDATE ON user_goals
    FOR EACH ROW
    EXECUTE FUNCTION update_user_goals_updated_at();

-- Create function to check and mark goals as completed
CREATE OR REPLACE FUNCTION check_goal_completion()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if goal is completed
    IF NEW.current_value >= NEW.target_value AND NEW.is_completed = false THEN
        NEW.is_completed = true;
        NEW.completed_at = NOW();
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_check_goal_completion
    BEFORE UPDATE ON user_goals
    FOR EACH ROW
    EXECUTE FUNCTION check_goal_completion();

-- Create view for user gamification summary
CREATE OR REPLACE VIEW user_gamification_summary AS
SELECT
    u.id as user_id,
    u.email,
    -- Achievement stats
    (SELECT COUNT(*) FROM user_achievements WHERE user_id = u.id) as total_achievements,
    (SELECT COUNT(*) FROM user_achievements WHERE user_id = u.id AND unlocked_at > NOW() - INTERVAL '30 days') as recent_achievements,
    -- Goal stats
    (SELECT COUNT(*) FROM user_goals WHERE user_id = u.id AND is_active = true) as active_goals,
    (SELECT COUNT(*) FROM user_goals WHERE user_id = u.id AND is_completed = true) as completed_goals,
    -- Action/Points stats
    (SELECT COALESCE(SUM(points), 0) FROM user_actions WHERE user_id = u.id) as total_points,
    (SELECT COALESCE(SUM(points), 0) FROM user_actions WHERE user_id = u.id AND created_at > NOW() - INTERVAL '7 days') as points_this_week,
    (SELECT COUNT(*) FROM user_actions WHERE user_id = u.id) as total_actions,
    -- Recent activity
    (SELECT MAX(created_at) FROM user_actions WHERE user_id = u.id) as last_action_at
FROM users u;

-- Grant access to the view
GRANT SELECT ON user_gamification_summary TO authenticated;

-- Create helper function to get user's total points
CREATE OR REPLACE FUNCTION get_user_total_points(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
    total_points INTEGER;
BEGIN
    SELECT COALESCE(SUM(points), 0) INTO total_points
    FROM user_actions
    WHERE user_id = p_user_id;

    RETURN total_points;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create helper function to get user's level based on points
CREATE OR REPLACE FUNCTION get_user_level(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
    total_points INTEGER;
    user_level INTEGER;
BEGIN
    total_points := get_user_total_points(p_user_id);

    -- Level calculation based on points thresholds
    CASE
        WHEN total_points >= 10000 THEN user_level := 10;
        WHEN total_points >= 6000 THEN user_level := 9;
        WHEN total_points >= 4000 THEN user_level := 8;
        WHEN total_points >= 2500 THEN user_level := 7;
        WHEN total_points >= 1500 THEN user_level := 6;
        WHEN total_points >= 1000 THEN user_level := 5;
        WHEN total_points >= 600 THEN user_level := 4;
        WHEN total_points >= 300 THEN user_level := 3;
        WHEN total_points >= 100 THEN user_level := 2;
        ELSE user_level := 1;
    END CASE;

    RETURN user_level;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to award achievement
CREATE OR REPLACE FUNCTION award_achievement(
    p_user_id UUID,
    p_achievement_id VARCHAR(100)
) RETURNS BOOLEAN AS $$
DECLARE
    achievement_exists BOOLEAN;
BEGIN
    -- Check if user already has this achievement
    SELECT EXISTS (
        SELECT 1 FROM user_achievements
        WHERE user_id = p_user_id AND achievement_id = p_achievement_id
    ) INTO achievement_exists;

    -- If they don't have it, award it
    IF NOT achievement_exists THEN
        INSERT INTO user_achievements (user_id, achievement_id)
        VALUES (p_user_id, p_achievement_id);
        RETURN true;
    END IF;

    RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execution permissions on functions
GRANT EXECUTE ON FUNCTION get_user_total_points(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_level(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION award_achievement(UUID, VARCHAR) TO authenticated;

-- Add comments for documentation
COMMENT ON TABLE user_achievements IS 'Stores unlocked achievements for each user';
COMMENT ON TABLE user_goals IS 'Stores user-defined reading goals and their progress';
COMMENT ON TABLE user_actions IS 'Logs all point-earning actions performed by users';
COMMENT ON VIEW user_gamification_summary IS 'Provides a comprehensive overview of user gamification statistics';
COMMENT ON FUNCTION get_user_total_points(UUID) IS 'Returns total points earned by a user';
COMMENT ON FUNCTION get_user_level(UUID) IS 'Calculates user level based on total points';
COMMENT ON FUNCTION award_achievement(UUID, VARCHAR) IS 'Awards an achievement to a user if they don\'t already have it';

-- Insert some sample default goals (optional - can be removed if not needed)
-- These can be used as templates for users to create their own goals
CREATE TABLE IF NOT EXISTS goal_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    goal_type VARCHAR(50) NOT NULL,
    suggested_target INTEGER NOT NULL,
    difficulty_level VARCHAR(20) DEFAULT 'medium', -- easy, medium, hard
    category VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for goal_templates
CREATE INDEX IF NOT EXISTS idx_goal_templates_goal_type ON goal_templates(goal_type);
CREATE INDEX IF NOT EXISTS idx_goal_templates_difficulty ON goal_templates(difficulty_level);
CREATE INDEX IF NOT EXISTS idx_goal_templates_is_active ON goal_templates(is_active);

-- Insert default goal templates
INSERT INTO goal_templates (title, description, goal_type, suggested_target, difficulty_level, category) VALUES
('Beginner Reader', 'Read your first 5 books', 'books_read', 5, 'easy', 'reading'),
('Consistent Reader', 'Read 12 books this year', 'books_read', 12, 'medium', 'reading'),
('Avid Reader', 'Read 25 books this year', 'books_read', 25, 'medium', 'reading'),
('Bookworm', 'Read 50 books this year', 'books_read', 50, 'hard', 'reading'),
('Page Turner', 'Read 10,000 pages', 'pages_read', 10000, 'medium', 'reading'),
('Speed Reader', 'Read 25,000 pages', 'pages_read', 25000, 'hard', 'reading'),
('Daily Reader', 'Read for 30 days straight', 'reading_streak', 30, 'medium', 'consistency'),
('Reading Habit', 'Read for 100 days straight', 'reading_streak', 100, 'hard', 'consistency'),
('Reading Marathon', 'Read for 100 hours total', 'reading_time', 6000, 'medium', 'time'), -- 100 hours in minutes
('Reading Devotee', 'Read for 500 hours total', 'reading_time', 30000, 'hard', 'time') -- 500 hours in minutes
ON CONFLICT DO NOTHING;

-- Grant access to goal templates
GRANT SELECT ON goal_templates TO authenticated;

COMMENT ON TABLE goal_templates IS 'Predefined goal templates that users can use to create their own goals';