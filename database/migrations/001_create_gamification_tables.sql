-- =====================================================
-- ShelfQuest Database Migration 001
-- Create Gamification System Tables
-- =====================================================

-- Enable Row Level Security by default
-- These tables should be created in your Supabase project

-- =====================================================
-- User Achievements Table
-- =====================================================
CREATE TABLE IF NOT EXISTS user_achievements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    achievement_id VARCHAR(50) NOT NULL,
    unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Constraints
    UNIQUE(user_id, achievement_id),
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_achievement_id ON user_achievements(achievement_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_unlocked_at ON user_achievements(unlocked_at);

-- Row Level Security
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own achievements
CREATE POLICY "Users can view own achievements" ON user_achievements
    FOR SELECT USING (auth.uid() = user_id);

-- Policy: System can insert achievements (for server-side unlocking)
CREATE POLICY "System can insert achievements" ON user_achievements
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- User Goals Table
-- =====================================================
CREATE TABLE IF NOT EXISTS user_goals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    goal_id VARCHAR(50),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    type VARCHAR(50) NOT NULL, -- 'books_completed', 'reading_time', 'reading_streak', etc.
    target INTEGER NOT NULL,
    current INTEGER DEFAULT 0,
    points INTEGER DEFAULT 0,
    period VARCHAR(20) DEFAULT 'monthly', -- 'daily', 'weekly', 'monthly', 'ongoing'
    deadline TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Constraints
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
    CHECK (target > 0),
    CHECK (current >= 0),
    CHECK (current <= target OR completed_at IS NOT NULL)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_goals_user_id ON user_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_user_goals_active ON user_goals(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_user_goals_type ON user_goals(user_id, type);
CREATE INDEX IF NOT EXISTS idx_user_goals_deadline ON user_goals(deadline);

-- Row Level Security
ALTER TABLE user_goals ENABLE ROW LEVEL SECURITY;

-- Policy: Users can manage their own goals
CREATE POLICY "Users can manage own goals" ON user_goals
    FOR ALL USING (auth.uid() = user_id);

-- =====================================================
-- User Actions Table (for detailed points tracking)
-- =====================================================
CREATE TABLE IF NOT EXISTS user_actions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    action VARCHAR(50) NOT NULL,
    points INTEGER NOT NULL DEFAULT 0,
    data JSONB DEFAULT '{}',
    session_id UUID, -- Optional: link to reading session
    book_id UUID, -- Optional: link to specific book
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Constraints
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Indexes for performance and analytics
CREATE INDEX IF NOT EXISTS idx_user_actions_user_id ON user_actions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_actions_action ON user_actions(action);
CREATE INDEX IF NOT EXISTS idx_user_actions_created_at ON user_actions(created_at);
CREATE INDEX IF NOT EXISTS idx_user_actions_user_date ON user_actions(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_user_actions_points ON user_actions(user_id, points);

-- Row Level Security
ALTER TABLE user_actions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own actions
CREATE POLICY "Users can view own actions" ON user_actions
    FOR SELECT USING (auth.uid() = user_id);

-- Policy: System can insert actions
CREATE POLICY "System can insert actions" ON user_actions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- Reading Streaks Table (for optimized streak calculation)
-- =====================================================
CREATE TABLE IF NOT EXISTS reading_streaks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    streak_date DATE NOT NULL,
    reading_time INTEGER DEFAULT 0, -- minutes read that day
    pages_read INTEGER DEFAULT 0,
    books_completed INTEGER DEFAULT 0,
    notes_created INTEGER DEFAULT 0,
    highlights_created INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Constraints
    UNIQUE(user_id, streak_date),
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
    CHECK (reading_time >= 0),
    CHECK (pages_read >= 0),
    CHECK (books_completed >= 0),
    CHECK (notes_created >= 0),
    CHECK (highlights_created >= 0)
);

-- Indexes for streak calculations
CREATE INDEX IF NOT EXISTS idx_reading_streaks_user_id ON reading_streaks(user_id);
CREATE INDEX IF NOT EXISTS idx_reading_streaks_user_date ON reading_streaks(user_id, streak_date DESC);
CREATE INDEX IF NOT EXISTS idx_reading_streaks_date ON reading_streaks(streak_date);

-- Row Level Security
ALTER TABLE reading_streaks ENABLE ROW LEVEL SECURITY;

-- Policy: Users can manage their own streaks
CREATE POLICY "Users can manage own streaks" ON reading_streaks
    FOR ALL USING (auth.uid() = user_id);

-- =====================================================
-- User Preferences Table (for gamification settings)
-- =====================================================
CREATE TABLE IF NOT EXISTS user_preferences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    gamification_enabled BOOLEAN DEFAULT TRUE,
    achievement_notifications BOOLEAN DEFAULT TRUE,
    goal_reminders BOOLEAN DEFAULT TRUE,
    leaderboard_visible BOOLEAN DEFAULT FALSE,
    reading_time_goal INTEGER DEFAULT 300, -- 5 hours per week in minutes
    books_per_month_goal INTEGER DEFAULT 2,
    preferred_reading_time VARCHAR(20) DEFAULT 'any', -- 'morning', 'afternoon', 'evening', 'night', 'any'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Constraints
    UNIQUE(user_id),
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
    CHECK (reading_time_goal > 0),
    CHECK (books_per_month_goal > 0)
);

-- Index for user lookup
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);

-- Row Level Security
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Policy: Users can manage their own preferences
CREATE POLICY "Users can manage own preferences" ON user_preferences
    FOR ALL USING (auth.uid() = user_id);

-- =====================================================
-- Update Triggers for maintaining updated_at timestamps
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to tables with updated_at columns
DROP TRIGGER IF EXISTS update_user_goals_updated_at ON user_goals;
CREATE TRIGGER update_user_goals_updated_at
    BEFORE UPDATE ON user_goals
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_reading_streaks_updated_at ON reading_streaks;
CREATE TRIGGER update_reading_streaks_updated_at
    BEFORE UPDATE ON reading_streaks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_preferences_updated_at ON user_preferences;
CREATE TRIGGER update_user_preferences_updated_at
    BEFORE UPDATE ON user_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- Sample Data Insertion (Optional - for testing)
-- =====================================================

-- Note: In production, this section should be removed or commented out
-- This is included for development and testing purposes only

/*
-- Insert sample user preferences for existing users (if any)
INSERT INTO user_preferences (user_id, gamification_enabled, achievement_notifications)
SELECT id, true, true
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM user_preferences);

-- Note: Achievements and goals will be created dynamically by the application
*/

-- =====================================================
-- Views for Analytics (Optional but recommended)
-- =====================================================

-- View for user stats summary
CREATE OR REPLACE VIEW user_stats_summary AS
SELECT
    u.id as user_id,
    u.email,
    COUNT(DISTINCT ua.id) as total_achievements,
    COUNT(DISTINCT ug.id) as total_goals,
    COUNT(DISTINCT CASE WHEN ug.completed_at IS NOT NULL THEN ug.id END) as completed_goals,
    COALESCE(SUM(uact.points), 0) as total_points,
    COUNT(DISTINCT CASE WHEN uact.created_at >= CURRENT_DATE THEN uact.id END) as actions_today,
    MAX(rs.streak_date) as last_reading_date,
    COALESCE(MAX(rs.reading_time), 0) as reading_time_today
FROM auth.users u
LEFT JOIN user_achievements ua ON u.id = ua.user_id
LEFT JOIN user_goals ug ON u.id = ug.user_id
LEFT JOIN user_actions uact ON u.id = uact.user_id
LEFT JOIN reading_streaks rs ON u.id = rs.user_id AND rs.streak_date = CURRENT_DATE
GROUP BY u.id, u.email;

-- View for achievement progress
CREATE OR REPLACE VIEW achievement_progress AS
SELECT
    user_id,
    COUNT(*) as achievements_unlocked,
    array_agg(achievement_id ORDER BY unlocked_at DESC) as achievement_ids,
    MAX(unlocked_at) as last_achievement_date
FROM user_achievements
GROUP BY user_id;

-- =====================================================
-- Performance Optimization
-- =====================================================

-- Analyze tables for query optimization
ANALYZE user_achievements;
ANALYZE user_goals;
ANALYZE user_actions;
ANALYZE reading_streaks;
ANALYZE user_preferences;

-- =====================================================
-- Migration Complete
-- =====================================================

-- This migration creates the essential tables for the ShelfQuest gamification system
-- Tables created:
-- - user_achievements: Track unlocked achievements
-- - user_goals: User reading goals and progress
-- - user_actions: Detailed action tracking for points
-- - reading_streaks: Optimized daily reading activity tracking
-- - user_preferences: User gamification preferences
--
-- Security:
-- - Row Level Security enabled on all tables
-- - Policies ensure users can only access their own data
-- - Foreign key constraints maintain data integrity
--
-- Performance:
-- - Proper indexes for common query patterns
-- - Optimized for gamification analytics
-- - Views for common reporting needs