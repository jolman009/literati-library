-- =====================================================
-- ShelfQuest Database Migration 002
-- Create User Stats Aggregation Table
-- =====================================================

-- This table stores aggregated statistics for fast lookups
-- It's updated via triggers whenever user_actions records are inserted

CREATE TABLE IF NOT EXISTS user_stats (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL UNIQUE,

    -- Points and Level
    total_points INTEGER DEFAULT 0 NOT NULL,
    level INTEGER DEFAULT 1 NOT NULL,

    -- Activity Counters
    notes_created INTEGER DEFAULT 0 NOT NULL,
    highlights_created INTEGER DEFAULT 0 NOT NULL,
    reading_sessions_completed INTEGER DEFAULT 0 NOT NULL,
    books_completed INTEGER DEFAULT 0 NOT NULL,
    books_uploaded INTEGER DEFAULT 0 NOT NULL,
    daily_checkins INTEGER DEFAULT 0 NOT NULL,

    -- Reading Stats
    total_reading_time INTEGER DEFAULT 0 NOT NULL, -- in minutes
    total_pages_read INTEGER DEFAULT 0 NOT NULL,

    -- Streaks
    current_reading_streak INTEGER DEFAULT 0 NOT NULL,
    longest_reading_streak INTEGER DEFAULT 0 NOT NULL,

    -- Timestamps
    last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Constraints
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
    CHECK (total_points >= 0),
    CHECK (level >= 1),
    CHECK (notes_created >= 0),
    CHECK (reading_sessions_completed >= 0)
);

-- Index for fast user lookups
CREATE INDEX IF NOT EXISTS idx_user_stats_user_id ON user_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_user_stats_total_points ON user_stats(total_points DESC);
CREATE INDEX IF NOT EXISTS idx_user_stats_level ON user_stats(level DESC);

-- Row Level Security
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own stats
CREATE POLICY "Users can view own stats" ON user_stats
    FOR SELECT USING (auth.uid() = user_id);

-- Policy: System can manage stats (for server-side updates)
CREATE POLICY "System can manage stats" ON user_stats
    FOR ALL USING (auth.uid() = user_id);

-- =====================================================
-- RPC Function: Get User Total Points
-- =====================================================
-- This function aggregates points from user_actions if user_stats is missing

CREATE OR REPLACE FUNCTION get_user_total_points(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
    v_total_points INTEGER;
BEGIN
    -- First try to get from user_stats (fast)
    SELECT total_points INTO v_total_points
    FROM user_stats
    WHERE user_id = p_user_id;

    -- If not found, aggregate from user_actions (slower but works)
    IF v_total_points IS NULL THEN
        SELECT COALESCE(SUM(points), 0) INTO v_total_points
        FROM user_actions
        WHERE user_id = p_user_id;
    END IF;

    RETURN COALESCE(v_total_points, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- RPC Function: Get User Action Counts
-- =====================================================

CREATE OR REPLACE FUNCTION get_user_action_counts(p_user_id UUID)
RETURNS TABLE(
    action VARCHAR(50),
    count BIGINT,
    total_points BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        ua.action,
        COUNT(*)::BIGINT as count,
        SUM(ua.points)::BIGINT as total_points
    FROM user_actions ua
    WHERE ua.user_id = p_user_id
    GROUP BY ua.action
    ORDER BY total_points DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Trigger: Auto-Update user_stats on user_actions INSERT
-- =====================================================

CREATE OR REPLACE FUNCTION update_user_stats_on_action()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert or update user_stats
    INSERT INTO user_stats (
        user_id,
        total_points,
        level,
        notes_created,
        reading_sessions_completed,
        daily_checkins,
        last_activity_at
    )
    VALUES (
        NEW.user_id,
        NEW.points,
        1, -- Start at level 1
        CASE WHEN NEW.action = 'note_created' THEN 1 ELSE 0 END,
        CASE WHEN NEW.action = 'reading_session_completed' THEN 1 ELSE 0 END,
        CASE WHEN NEW.action = 'daily_checkin' THEN 1 ELSE 0 END,
        NOW()
    )
    ON CONFLICT (user_id) DO UPDATE SET
        total_points = user_stats.total_points + NEW.points,
        level = CASE
            WHEN (user_stats.total_points + NEW.points) >= 10000 THEN 10
            WHEN (user_stats.total_points + NEW.points) >= 6000 THEN 9
            WHEN (user_stats.total_points + NEW.points) >= 4000 THEN 8
            WHEN (user_stats.total_points + NEW.points) >= 2500 THEN 7
            WHEN (user_stats.total_points + NEW.points) >= 1500 THEN 6
            WHEN (user_stats.total_points + NEW.points) >= 1000 THEN 5
            WHEN (user_stats.total_points + NEW.points) >= 600 THEN 4
            WHEN (user_stats.total_points + NEW.points) >= 300 THEN 3
            WHEN (user_stats.total_points + NEW.points) >= 100 THEN 2
            ELSE 1
        END,
        notes_created = CASE
            WHEN NEW.action = 'note_created'
            THEN user_stats.notes_created + 1
            ELSE user_stats.notes_created
        END,
        reading_sessions_completed = CASE
            WHEN NEW.action = 'reading_session_completed'
            THEN user_stats.reading_sessions_completed + 1
            ELSE user_stats.reading_sessions_completed
        END,
        daily_checkins = CASE
            WHEN NEW.action = 'daily_checkin'
            THEN user_stats.daily_checkins + 1
            ELSE user_stats.daily_checkins
        END,
        last_activity_at = NOW(),
        updated_at = NOW();

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to user_actions table
DROP TRIGGER IF EXISTS trigger_update_user_stats ON user_actions;
CREATE TRIGGER trigger_update_user_stats
    AFTER INSERT ON user_actions
    FOR EACH ROW
    EXECUTE FUNCTION update_user_stats_on_action();

-- =====================================================
-- Backfill Existing Data (if any user_actions exist)
-- =====================================================

-- Initialize user_stats from existing user_actions
INSERT INTO user_stats (
    user_id,
    total_points,
    level,
    notes_created,
    reading_sessions_completed,
    daily_checkins,
    last_activity_at
)
SELECT
    user_id,
    COALESCE(SUM(points), 0) as total_points,
    CASE
        WHEN COALESCE(SUM(points), 0) >= 10000 THEN 10
        WHEN COALESCE(SUM(points), 0) >= 6000 THEN 9
        WHEN COALESCE(SUM(points), 0) >= 4000 THEN 8
        WHEN COALESCE(SUM(points), 0) >= 2500 THEN 7
        WHEN COALESCE(SUM(points), 0) >= 1500 THEN 6
        WHEN COALESCE(SUM(points), 0) >= 1000 THEN 5
        WHEN COALESCE(SUM(points), 0) >= 600 THEN 4
        WHEN COALESCE(SUM(points), 0) >= 300 THEN 3
        WHEN COALESCE(SUM(points), 0) >= 100 THEN 2
        ELSE 1
    END as level,
    COUNT(*) FILTER (WHERE action = 'note_created') as notes_created,
    COUNT(*) FILTER (WHERE action = 'reading_session_completed') as reading_sessions_completed,
    COUNT(*) FILTER (WHERE action = 'daily_checkin') as daily_checkins,
    MAX(created_at) as last_activity_at
FROM user_actions
GROUP BY user_id
ON CONFLICT (user_id) DO NOTHING;

-- =====================================================
-- Update Trigger for updated_at timestamp
-- =====================================================

DROP TRIGGER IF EXISTS update_user_stats_updated_at ON user_stats;
CREATE TRIGGER update_user_stats_updated_at
    BEFORE UPDATE ON user_stats
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- Analyze for Query Optimization
-- =====================================================

ANALYZE user_stats;

-- =====================================================
-- Migration Complete
-- =====================================================
