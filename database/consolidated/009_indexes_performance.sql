-- =====================================================
-- ShelfQuest Consolidated Migration 009
-- Indexes and Performance Optimization
-- =====================================================
-- All indexes from database-optimization.sql + individual migration files.
-- Each table's indexes are wrapped in DO $$ ... EXCEPTION ... $$ so that
-- a missing table or column skips that group instead of aborting the script.

-- =====================================================
-- USERS TABLE INDEXES
-- =====================================================
DO $$ BEGIN
    ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS token_version INTEGER DEFAULT 0;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login TIMESTAMP WITH TIME ZONE;
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);
    CREATE INDEX IF NOT EXISTS idx_users_token_version ON users(token_version);
    CREATE INDEX IF NOT EXISTS idx_users_email_verified ON users(email_verified);
    CREATE INDEX IF NOT EXISTS idx_users_last_login ON users(last_login);
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'users indexes: %', SQLERRM;
END $$;

-- =====================================================
-- BOOKS TABLE INDEXES
-- =====================================================
DO $$ BEGIN
    ALTER TABLE books ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'uploaded';
    ALTER TABLE books ADD COLUMN IF NOT EXISTS genre VARCHAR(100);
    ALTER TABLE books ADD COLUMN IF NOT EXISTS is_reading BOOLEAN DEFAULT false;
    ALTER TABLE books ADD COLUMN IF NOT EXISTS progress NUMERIC DEFAULT 0;
    CREATE INDEX IF NOT EXISTS idx_books_user_created ON books(user_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_books_user_id ON books(user_id, id);
    CREATE INDEX IF NOT EXISTS idx_books_user_status ON books(user_id, status);
    CREATE INDEX IF NOT EXISTS idx_books_user_genre ON books(user_id, genre);
    CREATE INDEX IF NOT EXISTS idx_books_user_status_created ON books(user_id, status, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_books_user_genre_created ON books(user_id, genre, created_at DESC);
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'books indexes: %', SQLERRM;
END $$;

-- =====================================================
-- READING_SESSIONS TABLE INDEXES
-- =====================================================
DO $$ BEGIN
    ALTER TABLE reading_sessions ADD COLUMN IF NOT EXISTS session_date DATE;
    CREATE INDEX IF NOT EXISTS idx_reading_sessions_user_date ON reading_sessions(user_id, session_date DESC);
    CREATE INDEX IF NOT EXISTS idx_reading_sessions_user_book ON reading_sessions(user_id, book_id, session_date DESC);
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'reading_sessions indexes: %', SQLERRM;
END $$;

-- =====================================================
-- NOTES TABLE INDEXES
-- =====================================================
DO $$ BEGIN
    CREATE INDEX IF NOT EXISTS idx_notes_user_id ON notes(user_id);
    CREATE INDEX IF NOT EXISTS idx_notes_book_id ON notes(book_id);
    CREATE INDEX IF NOT EXISTS idx_notes_book_user ON notes(book_id, user_id);
    CREATE INDEX IF NOT EXISTS idx_notes_user_created ON notes(user_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_notes_created_at ON notes(created_at);
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'notes indexes: %', SQLERRM;
END $$;

-- =====================================================
-- USER_ACHIEVEMENTS TABLE INDEXES
-- =====================================================
DO $$ BEGIN
    CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);
    CREATE INDEX IF NOT EXISTS idx_user_achievements_achievement_id ON user_achievements(achievement_id);
    CREATE INDEX IF NOT EXISTS idx_user_achievements_unlocked_at ON user_achievements(unlocked_at);
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'user_achievements indexes: %', SQLERRM;
END $$;

-- =====================================================
-- USER_GOALS TABLE INDEXES
-- =====================================================
DO $$ BEGIN
    ALTER TABLE user_goals ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
    ALTER TABLE user_goals ADD COLUMN IF NOT EXISTS is_completed BOOLEAN DEFAULT false;
    ALTER TABLE user_goals ADD COLUMN IF NOT EXISTS goal_type VARCHAR(50);
    ALTER TABLE user_goals ADD COLUMN IF NOT EXISTS type VARCHAR(50);
    ALTER TABLE user_goals ADD COLUMN IF NOT EXISTS deadline TIMESTAMP WITH TIME ZONE;
    ALTER TABLE user_goals ADD COLUMN IF NOT EXISTS target_date DATE;
    CREATE INDEX IF NOT EXISTS idx_user_goals_user_id ON user_goals(user_id);
    CREATE INDEX IF NOT EXISTS idx_user_goals_active ON user_goals(user_id, is_active);
    CREATE INDEX IF NOT EXISTS idx_user_goals_type ON user_goals(user_id, type);
    CREATE INDEX IF NOT EXISTS idx_user_goals_deadline ON user_goals(deadline);
    CREATE INDEX IF NOT EXISTS idx_user_goals_is_active ON user_goals(is_active);
    CREATE INDEX IF NOT EXISTS idx_user_goals_is_completed ON user_goals(is_completed);
    CREATE INDEX IF NOT EXISTS idx_user_goals_goal_type ON user_goals(goal_type);
    CREATE INDEX IF NOT EXISTS idx_user_goals_target_date ON user_goals(target_date);
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'user_goals indexes: %', SQLERRM;
END $$;

-- =====================================================
-- USER_ACTIONS TABLE INDEXES
-- =====================================================
DO $$ BEGIN
    CREATE INDEX IF NOT EXISTS idx_user_actions_user_id ON user_actions(user_id);
    CREATE INDEX IF NOT EXISTS idx_user_actions_action ON user_actions(action);
    CREATE INDEX IF NOT EXISTS idx_user_actions_created_at ON user_actions(created_at);
    CREATE INDEX IF NOT EXISTS idx_user_actions_user_date ON user_actions(user_id, created_at);
    CREATE INDEX IF NOT EXISTS idx_user_actions_points ON user_actions(user_id, points);
    CREATE INDEX IF NOT EXISTS idx_user_actions_book_id ON user_actions(book_id);
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'user_actions indexes: %', SQLERRM;
END $$;

-- =====================================================
-- READING_STREAKS TABLE INDEXES
-- =====================================================
DO $$ BEGIN
    ALTER TABLE reading_streaks ADD COLUMN IF NOT EXISTS streak_date DATE;
    ALTER TABLE reading_streaks ADD COLUMN IF NOT EXISTS reading_time INTEGER DEFAULT 0;
    CREATE INDEX IF NOT EXISTS idx_reading_streaks_user_id ON reading_streaks(user_id);
    CREATE INDEX IF NOT EXISTS idx_reading_streaks_user_date ON reading_streaks(user_id, streak_date DESC);
    CREATE INDEX IF NOT EXISTS idx_reading_streaks_date ON reading_streaks(streak_date);
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'reading_streaks indexes: %', SQLERRM;
END $$;

-- =====================================================
-- USER_PREFERENCES TABLE INDEXES
-- =====================================================
DO $$ BEGIN
    CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'user_preferences indexes: %', SQLERRM;
END $$;

-- =====================================================
-- USER_STATS TABLE INDEXES
-- =====================================================
DO $$ BEGIN
    CREATE INDEX IF NOT EXISTS idx_user_stats_user_id ON user_stats(user_id);
    CREATE INDEX IF NOT EXISTS idx_user_stats_total_points ON user_stats(total_points DESC);
    CREATE INDEX IF NOT EXISTS idx_user_stats_level ON user_stats(level DESC);
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'user_stats indexes: %', SQLERRM;
END $$;

-- =====================================================
-- GOAL_TEMPLATES TABLE INDEXES
-- =====================================================
DO $$ BEGIN
    ALTER TABLE goal_templates ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
    ALTER TABLE goal_templates ADD COLUMN IF NOT EXISTS difficulty_level VARCHAR(20) DEFAULT 'medium';
    ALTER TABLE goal_templates ADD COLUMN IF NOT EXISTS goal_type VARCHAR(50);
    CREATE INDEX IF NOT EXISTS idx_goal_templates_goal_type ON goal_templates(goal_type);
    CREATE INDEX IF NOT EXISTS idx_goal_templates_difficulty ON goal_templates(difficulty_level);
    CREATE INDEX IF NOT EXISTS idx_goal_templates_is_active ON goal_templates(is_active);
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'goal_templates indexes: %', SQLERRM;
END $$;

-- =====================================================
-- USER_CHALLENGES TABLE INDEXES
-- =====================================================
DO $$ BEGIN
    ALTER TABLE user_challenges ADD COLUMN IF NOT EXISTS is_completed BOOLEAN DEFAULT false;
    ALTER TABLE user_challenges ADD COLUMN IF NOT EXISTS challenge_type VARCHAR(20);
    ALTER TABLE user_challenges ADD COLUMN IF NOT EXISTS period_start DATE;
    CREATE INDEX IF NOT EXISTS idx_user_challenges_user_id ON user_challenges(user_id);
    CREATE INDEX IF NOT EXISTS idx_user_challenges_period ON user_challenges(period_start, challenge_type);
    CREATE INDEX IF NOT EXISTS idx_user_challenges_completed ON user_challenges(user_id, is_completed);
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'user_challenges indexes: %', SQLERRM;
END $$;

-- =====================================================
-- USER_FOLLOWS TABLE INDEXES
-- =====================================================
DO $$ BEGIN
    CREATE INDEX IF NOT EXISTS idx_user_follows_follower ON user_follows(follower_id);
    CREATE INDEX IF NOT EXISTS idx_user_follows_following ON user_follows(following_id);
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'user_follows indexes: %', SQLERRM;
END $$;

-- =====================================================
-- USER_SETTINGS TABLE INDEXES
-- =====================================================
DO $$ BEGIN
    CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'user_settings indexes: %', SQLERRM;
END $$;

-- =====================================================
-- STREAK_SHIELD_LOG TABLE INDEXES
-- =====================================================
DO $$ BEGIN
    CREATE INDEX IF NOT EXISTS idx_streak_shield_log_user ON streak_shield_log(user_id);
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'streak_shield_log indexes: %', SQLERRM;
END $$;

-- =====================================================
-- LEADERBOARD_CACHE TABLE INDEXES
-- =====================================================
DO $$ BEGIN
    CREATE INDEX IF NOT EXISTS idx_leaderboard_cache_period ON leaderboard_cache(period_type, period_start, rank);
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'leaderboard_cache indexes: %', SQLERRM;
END $$;

-- =====================================================
-- SECURITY_AUDIT_LOG TABLE INDEXES
-- =====================================================
DO $$ BEGIN
    CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON security_audit_log(user_id);
    CREATE INDEX IF NOT EXISTS idx_audit_log_event_type ON security_audit_log(event_type);
    CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON security_audit_log(created_at);
    CREATE INDEX IF NOT EXISTS idx_audit_log_risk_score ON security_audit_log(risk_score);
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'security_audit_log indexes: %', SQLERRM;
END $$;

-- =====================================================
-- USER_SESSIONS TABLE INDEXES
-- =====================================================
DO $$ BEGIN
    ALTER TABLE user_sessions ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
    CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
    CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);
    CREATE INDEX IF NOT EXISTS idx_user_sessions_refresh_token ON user_sessions(refresh_token);
    CREATE INDEX IF NOT EXISTS idx_user_sessions_is_active ON user_sessions(is_active);
    CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions(expires_at);
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'user_sessions indexes: %', SQLERRM;
END $$;

-- =====================================================
-- RATE_LIMIT_TRACKING TABLE INDEXES
-- =====================================================
DO $$ BEGIN
    CREATE INDEX IF NOT EXISTS idx_rate_limit_identifier ON rate_limit_tracking(identifier);
    CREATE INDEX IF NOT EXISTS idx_rate_limit_endpoint ON rate_limit_tracking(endpoint);
    CREATE INDEX IF NOT EXISTS idx_rate_limit_window_start ON rate_limit_tracking(window_start);
    CREATE INDEX IF NOT EXISTS idx_rate_limit_blocked_until ON rate_limit_tracking(blocked_until);
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'rate_limit_tracking indexes: %', SQLERRM;
END $$;

-- =====================================================
-- FILE_UPLOAD_LOG TABLE INDEXES
-- =====================================================
DO $$ BEGIN
    CREATE INDEX IF NOT EXISTS idx_file_upload_user_id ON file_upload_log(user_id);
    CREATE INDEX IF NOT EXISTS idx_file_upload_scan_status ON file_upload_log(scan_status);
    CREATE INDEX IF NOT EXISTS idx_file_upload_created_at ON file_upload_log(created_at);
    CREATE INDEX IF NOT EXISTS idx_file_upload_file_hash ON file_upload_log(file_hash);
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'file_upload_log indexes: %', SQLERRM;
END $$;

-- =====================================================
-- API_USAGE_LOG TABLE INDEXES
-- =====================================================
DO $$ BEGIN
    CREATE INDEX IF NOT EXISTS idx_api_usage_user_id ON api_usage_log(user_id);
    CREATE INDEX IF NOT EXISTS idx_api_usage_endpoint ON api_usage_log(endpoint);
    CREATE INDEX IF NOT EXISTS idx_api_usage_status_code ON api_usage_log(status_code);
    CREATE INDEX IF NOT EXISTS idx_api_usage_created_at ON api_usage_log(created_at);
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'api_usage_log indexes: %', SQLERRM;
END $$;

-- =====================================================
-- SUPPLEMENTARY TABLE INDEXES (006)
-- =====================================================
DO $$ BEGIN
    CREATE INDEX IF NOT EXISTS idx_daily_checkins_user_date ON daily_checkins(user_id, check_in_date DESC);
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'daily_checkins indexes: %', SQLERRM;
END $$;

DO $$ BEGIN
    CREATE INDEX IF NOT EXISTS idx_cloud_storage_user_id ON cloud_storage_connections(user_id);
    CREATE INDEX IF NOT EXISTS idx_cloud_storage_provider ON cloud_storage_connections(provider);
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'cloud_storage_connections indexes: %', SQLERRM;
END $$;

DO $$ BEGIN
    CREATE INDEX IF NOT EXISTS idx_reading_progress_user_id ON reading_progress(user_id);
    CREATE INDEX IF NOT EXISTS idx_reading_progress_book_id ON reading_progress(book_id);
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'reading_progress indexes: %', SQLERRM;
END $$;

DO $$ BEGIN
    CREATE INDEX IF NOT EXISTS idx_reading_goals_user_id ON reading_goals(user_id);
    CREATE INDEX IF NOT EXISTS idx_reading_goals_status ON reading_goals(status);
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'reading_goals indexes: %', SQLERRM;
END $$;

DO $$ BEGIN
    CREATE INDEX IF NOT EXISTS idx_daily_reading_stats_user_id ON daily_reading_stats(user_id);
    CREATE INDEX IF NOT EXISTS idx_daily_reading_stats_date ON daily_reading_stats(stat_date);
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'daily_reading_stats indexes: %', SQLERRM;
END $$;

-- =====================================================
-- MATERIALIZED VIEWS
-- =====================================================

-- User reading statistics (aggregated from books table)
DO $$ BEGIN
    CREATE MATERIALIZED VIEW IF NOT EXISTS user_reading_stats AS
    SELECT
        user_id,
        COUNT(*) AS total_books,
        COUNT(*) FILTER (WHERE status = 'completed') AS completed_books,
        COUNT(*) FILTER (WHERE status = 'reading' OR is_reading = true) AS currently_reading,
        COUNT(*) FILTER (WHERE status = 'want_to_read') AS want_to_read_books,
        COUNT(DISTINCT genre) AS unique_genres,
        AVG(progress) FILTER (WHERE progress > 0) AS average_progress,
        MAX(created_at) AS last_book_added,
        MIN(created_at) AS first_book_added
    FROM books
    GROUP BY user_id;

    CREATE UNIQUE INDEX IF NOT EXISTS idx_user_reading_stats_user
        ON user_reading_stats(user_id);
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'user_reading_stats materialized view: %', SQLERRM;
END $$;

-- User session statistics (aggregated from reading_sessions table)
DO $$ BEGIN
    CREATE MATERIALIZED VIEW IF NOT EXISTS user_session_stats AS
    SELECT
        user_id,
        COUNT(*) AS total_sessions,
        SUM(duration) AS total_reading_time_minutes,
        AVG(duration) AS average_session_duration,
        COUNT(DISTINCT session_date) AS days_read,
        COUNT(DISTINCT book_id) AS books_with_sessions,
        MAX(session_date) AS last_reading_date,
        MIN(session_date) AS first_reading_date
    FROM reading_sessions
    WHERE duration > 0
    GROUP BY user_id;

    CREATE UNIQUE INDEX IF NOT EXISTS idx_user_session_stats_user
        ON user_session_stats(user_id);
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'user_session_stats materialized view: %', SQLERRM;
END $$;

-- =====================================================
-- Migration 009 Complete
-- =====================================================
-- Every table group is isolated — a missing column or table
-- logs a NOTICE and continues instead of aborting.
-- ADD COLUMN IF NOT EXISTS calls before each group ensure
-- indexed columns exist even if earlier migrations rolled back.
