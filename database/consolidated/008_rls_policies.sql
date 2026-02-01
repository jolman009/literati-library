-- =====================================================
-- ShelfQuest Consolidated Migration 008
-- Row Level Security (RLS) Policies
-- =====================================================
-- Standardized pattern:
--   SELECT: auth.uid() = user_id OR auth.jwt() ->> 'role' = 'service_role'
--   ALL (service): auth.jwt() ->> 'role' = 'service_role'
-- This lets both Supabase Auth users and the server service role work.
-- DROP POLICY IF EXISTS + CREATE POLICY ensures idempotency.

-- =====================================================
-- ENABLE RLS ON ALL TABLES
-- =====================================================
-- Each wrapped in DO block so one missing table doesn't abort the rest.
DO $$ BEGIN ALTER TABLE users ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN undefined_table THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE books ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN undefined_table THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE reading_sessions ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN undefined_table THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE notes ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN undefined_table THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN undefined_table THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE user_goals ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN undefined_table THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE user_actions ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN undefined_table THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE reading_streaks ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN undefined_table THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN undefined_table THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN undefined_table THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE goal_templates ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN undefined_table THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE user_challenges ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN undefined_table THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE user_follows ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN undefined_table THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN undefined_table THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE streak_shield_log ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN undefined_table THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE leaderboard_cache ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN undefined_table THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE security_audit_log ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN undefined_table THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN undefined_table THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE rate_limit_tracking ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN undefined_table THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE security_settings ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN undefined_table THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE file_upload_log ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN undefined_table THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE api_usage_log ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN undefined_table THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE daily_checkins ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN undefined_table THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE cloud_storage_connections ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN undefined_table THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE reading_progress ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN undefined_table THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE reading_goals ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN undefined_table THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE daily_reading_stats ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN undefined_table THEN NULL; END $$;

-- =====================================================
-- USERS TABLE
-- =====================================================
DROP POLICY IF EXISTS "users_select_own" ON users;
CREATE POLICY "users_select_own" ON users
    FOR SELECT USING (
        auth.uid() = id
        OR auth.jwt() ->> 'role' = 'service_role'
    );

DROP POLICY IF EXISTS "users_service_role_all" ON users;
CREATE POLICY "users_service_role_all" ON users
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role')
    WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- =====================================================
-- BOOKS TABLE
-- =====================================================
DROP POLICY IF EXISTS "books_select_own" ON books;
CREATE POLICY "books_select_own" ON books
    FOR SELECT USING (
        auth.uid() = user_id
        OR auth.jwt() ->> 'role' = 'service_role'
    );

DROP POLICY IF EXISTS "books_service_role_all" ON books;
CREATE POLICY "books_service_role_all" ON books
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role')
    WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- =====================================================
-- READING_SESSIONS TABLE
-- =====================================================
DROP POLICY IF EXISTS "reading_sessions_select_own" ON reading_sessions;
CREATE POLICY "reading_sessions_select_own" ON reading_sessions
    FOR SELECT USING (
        auth.uid() = user_id
        OR auth.jwt() ->> 'role' = 'service_role'
    );

DROP POLICY IF EXISTS "reading_sessions_service_role_all" ON reading_sessions;
CREATE POLICY "reading_sessions_service_role_all" ON reading_sessions
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role')
    WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- =====================================================
-- NOTES TABLE
-- =====================================================
DROP POLICY IF EXISTS "notes_select_own" ON notes;
CREATE POLICY "notes_select_own" ON notes
    FOR SELECT USING (
        auth.uid() = user_id
        OR auth.jwt() ->> 'role' = 'service_role'
    );

DROP POLICY IF EXISTS "notes_service_role_all" ON notes;
CREATE POLICY "notes_service_role_all" ON notes
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role')
    WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- =====================================================
-- USER_ACHIEVEMENTS TABLE
-- =====================================================
DROP POLICY IF EXISTS "Users can view own achievements" ON user_achievements;
DROP POLICY IF EXISTS "System can insert achievements" ON user_achievements;
DROP POLICY IF EXISTS "Users can view their own achievements" ON user_achievements;
DROP POLICY IF EXISTS "Users can insert their own achievements" ON user_achievements;
DROP POLICY IF EXISTS "Service role can manage achievements" ON user_achievements;

DROP POLICY IF EXISTS "user_achievements_select_own" ON user_achievements;
CREATE POLICY "user_achievements_select_own" ON user_achievements
    FOR SELECT USING (
        auth.uid() = user_id
        OR auth.jwt() ->> 'role' = 'service_role'
    );

DROP POLICY IF EXISTS "user_achievements_service_role_all" ON user_achievements;
CREATE POLICY "user_achievements_service_role_all" ON user_achievements
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role')
    WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- =====================================================
-- USER_GOALS TABLE
-- =====================================================
DROP POLICY IF EXISTS "Users can manage own goals" ON user_goals;
DROP POLICY IF EXISTS "Users can view own goals" ON user_goals;
DROP POLICY IF EXISTS "Service role can manage goals" ON user_goals;
DROP POLICY IF EXISTS "Users can view their own goals" ON user_goals;
DROP POLICY IF EXISTS "Users can insert their own goals" ON user_goals;
DROP POLICY IF EXISTS "Users can update their own goals" ON user_goals;
DROP POLICY IF EXISTS "Users can delete their own goals" ON user_goals;

DROP POLICY IF EXISTS "user_goals_select_own" ON user_goals;
CREATE POLICY "user_goals_select_own" ON user_goals
    FOR SELECT USING (
        auth.uid() = user_id
        OR auth.jwt() ->> 'role' = 'service_role'
    );

DROP POLICY IF EXISTS "user_goals_service_role_all" ON user_goals;
CREATE POLICY "user_goals_service_role_all" ON user_goals
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role')
    WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- =====================================================
-- USER_ACTIONS TABLE
-- =====================================================
DROP POLICY IF EXISTS "Users can view own actions" ON user_actions;
DROP POLICY IF EXISTS "System can insert actions" ON user_actions;
DROP POLICY IF EXISTS "Service role can insert actions" ON user_actions;
DROP POLICY IF EXISTS "Service role can update actions" ON user_actions;
DROP POLICY IF EXISTS "Users can view their own actions" ON user_actions;
DROP POLICY IF EXISTS "Users can insert their own actions" ON user_actions;

DROP POLICY IF EXISTS "user_actions_select_own" ON user_actions;
CREATE POLICY "user_actions_select_own" ON user_actions
    FOR SELECT USING (
        auth.uid() = user_id
        OR auth.jwt() ->> 'role' = 'service_role'
    );

DROP POLICY IF EXISTS "user_actions_service_role_all" ON user_actions;
CREATE POLICY "user_actions_service_role_all" ON user_actions
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role')
    WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- =====================================================
-- READING_STREAKS TABLE
-- =====================================================
DROP POLICY IF EXISTS "Users can manage own streaks" ON reading_streaks;
DROP POLICY IF EXISTS "Users can view own streaks" ON reading_streaks;
DROP POLICY IF EXISTS "Service role can manage streaks" ON reading_streaks;

DROP POLICY IF EXISTS "reading_streaks_select_own" ON reading_streaks;
CREATE POLICY "reading_streaks_select_own" ON reading_streaks
    FOR SELECT USING (
        auth.uid() = user_id
        OR auth.jwt() ->> 'role' = 'service_role'
    );

DROP POLICY IF EXISTS "reading_streaks_service_role_all" ON reading_streaks;
CREATE POLICY "reading_streaks_service_role_all" ON reading_streaks
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role')
    WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- =====================================================
-- USER_PREFERENCES TABLE
-- =====================================================
DROP POLICY IF EXISTS "Users can manage own preferences" ON user_preferences;

DROP POLICY IF EXISTS "user_preferences_select_own" ON user_preferences;
CREATE POLICY "user_preferences_select_own" ON user_preferences
    FOR SELECT USING (
        auth.uid() = user_id
        OR auth.jwt() ->> 'role' = 'service_role'
    );

DROP POLICY IF EXISTS "user_preferences_service_role_all" ON user_preferences;
CREATE POLICY "user_preferences_service_role_all" ON user_preferences
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role')
    WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- =====================================================
-- USER_STATS TABLE
-- =====================================================
DROP POLICY IF EXISTS "Users can view own stats" ON user_stats;
DROP POLICY IF EXISTS "System can manage stats" ON user_stats;
DROP POLICY IF EXISTS "Service role can manage stats" ON user_stats;

DROP POLICY IF EXISTS "user_stats_select_own" ON user_stats;
CREATE POLICY "user_stats_select_own" ON user_stats
    FOR SELECT USING (
        auth.uid() = user_id
        OR auth.jwt() ->> 'role' = 'service_role'
    );

DROP POLICY IF EXISTS "user_stats_service_role_all" ON user_stats;
CREATE POLICY "user_stats_service_role_all" ON user_stats
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role')
    WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- =====================================================
-- GOAL_TEMPLATES TABLE (public read)
-- =====================================================
DROP POLICY IF EXISTS "goal_templates_public_read" ON goal_templates;
CREATE POLICY "goal_templates_public_read" ON goal_templates
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "goal_templates_service_role_all" ON goal_templates;
CREATE POLICY "goal_templates_service_role_all" ON goal_templates
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role')
    WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- =====================================================
-- USER_CHALLENGES TABLE
-- =====================================================
DROP POLICY IF EXISTS "user_challenges_policy" ON user_challenges;

DROP POLICY IF EXISTS "user_challenges_select_own" ON user_challenges;
CREATE POLICY "user_challenges_select_own" ON user_challenges
    FOR SELECT USING (
        auth.uid() = user_id
        OR auth.jwt() ->> 'role' = 'service_role'
    );

DROP POLICY IF EXISTS "user_challenges_service_role_all" ON user_challenges;
CREATE POLICY "user_challenges_service_role_all" ON user_challenges
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role')
    WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- =====================================================
-- USER_FOLLOWS TABLE (public read for follow lists)
-- =====================================================
DROP POLICY IF EXISTS "user_follows_select_policy" ON user_follows;
DROP POLICY IF EXISTS "user_follows_insert_policy" ON user_follows;
DROP POLICY IF EXISTS "user_follows_delete_policy" ON user_follows;

DROP POLICY IF EXISTS "user_follows_public_read" ON user_follows;
CREATE POLICY "user_follows_public_read" ON user_follows
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "user_follows_service_role_all" ON user_follows;
CREATE POLICY "user_follows_service_role_all" ON user_follows
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role')
    WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

DROP POLICY IF EXISTS "user_follows_insert_own" ON user_follows;
CREATE POLICY "user_follows_insert_own" ON user_follows
    FOR INSERT WITH CHECK (
        auth.uid() = follower_id
        OR auth.jwt() ->> 'role' = 'service_role'
    );

DROP POLICY IF EXISTS "user_follows_delete_own" ON user_follows;
CREATE POLICY "user_follows_delete_own" ON user_follows
    FOR DELETE USING (
        auth.uid() = follower_id
        OR auth.jwt() ->> 'role' = 'service_role'
    );

-- =====================================================
-- USER_SETTINGS TABLE
-- =====================================================
DROP POLICY IF EXISTS "user_settings_policy" ON user_settings;

DROP POLICY IF EXISTS "user_settings_select_own" ON user_settings;
CREATE POLICY "user_settings_select_own" ON user_settings
    FOR SELECT USING (
        auth.uid() = user_id
        OR auth.jwt() ->> 'role' = 'service_role'
    );

DROP POLICY IF EXISTS "user_settings_service_role_all" ON user_settings;
CREATE POLICY "user_settings_service_role_all" ON user_settings
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role')
    WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- =====================================================
-- STREAK_SHIELD_LOG TABLE
-- =====================================================
DROP POLICY IF EXISTS "streak_shield_log_policy" ON streak_shield_log;

DROP POLICY IF EXISTS "streak_shield_log_select_own" ON streak_shield_log;
CREATE POLICY "streak_shield_log_select_own" ON streak_shield_log
    FOR SELECT USING (
        auth.uid() = user_id
        OR auth.jwt() ->> 'role' = 'service_role'
    );

DROP POLICY IF EXISTS "streak_shield_log_service_role_all" ON streak_shield_log;
CREATE POLICY "streak_shield_log_service_role_all" ON streak_shield_log
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role')
    WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- =====================================================
-- LEADERBOARD_CACHE TABLE (public read)
-- =====================================================
DROP POLICY IF EXISTS "leaderboard_cache_select_policy" ON leaderboard_cache;

DROP POLICY IF EXISTS "leaderboard_cache_public_read" ON leaderboard_cache;
CREATE POLICY "leaderboard_cache_public_read" ON leaderboard_cache
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "leaderboard_cache_service_role_all" ON leaderboard_cache;
CREATE POLICY "leaderboard_cache_service_role_all" ON leaderboard_cache
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role')
    WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- =====================================================
-- SECURITY_AUDIT_LOG TABLE
-- =====================================================
DROP POLICY IF EXISTS "Users can view their own audit logs" ON security_audit_log;

DROP POLICY IF EXISTS "security_audit_log_select_own" ON security_audit_log;
CREATE POLICY "security_audit_log_select_own" ON security_audit_log
    FOR SELECT USING (
        auth.uid() = user_id
        OR auth.jwt() ->> 'role' = 'service_role'
    );

DROP POLICY IF EXISTS "security_audit_log_service_role_all" ON security_audit_log;
CREATE POLICY "security_audit_log_service_role_all" ON security_audit_log
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role')
    WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- =====================================================
-- USER_SESSIONS TABLE
-- =====================================================
DROP POLICY IF EXISTS "Users can view their own sessions" ON user_sessions;
DROP POLICY IF EXISTS "Users can update their own sessions" ON user_sessions;

DROP POLICY IF EXISTS "user_sessions_select_own" ON user_sessions;
CREATE POLICY "user_sessions_select_own" ON user_sessions
    FOR SELECT USING (
        auth.uid() = user_id
        OR auth.jwt() ->> 'role' = 'service_role'
    );

DROP POLICY IF EXISTS "user_sessions_service_role_all" ON user_sessions;
CREATE POLICY "user_sessions_service_role_all" ON user_sessions
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role')
    WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- =====================================================
-- RATE_LIMIT_TRACKING TABLE (service role only)
-- =====================================================
DROP POLICY IF EXISTS "rate_limit_tracking_service_role_all" ON rate_limit_tracking;
CREATE POLICY "rate_limit_tracking_service_role_all" ON rate_limit_tracking
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role')
    WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- =====================================================
-- SECURITY_SETTINGS TABLE (public read, service write)
-- =====================================================
DROP POLICY IF EXISTS "security_settings_public_read" ON security_settings;
CREATE POLICY "security_settings_public_read" ON security_settings
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "security_settings_service_role_all" ON security_settings;
CREATE POLICY "security_settings_service_role_all" ON security_settings
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role')
    WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- =====================================================
-- FILE_UPLOAD_LOG TABLE
-- =====================================================
DROP POLICY IF EXISTS "Users can view their own file uploads" ON file_upload_log;

DROP POLICY IF EXISTS "file_upload_log_select_own" ON file_upload_log;
CREATE POLICY "file_upload_log_select_own" ON file_upload_log
    FOR SELECT USING (
        auth.uid() = user_id
        OR auth.jwt() ->> 'role' = 'service_role'
    );

DROP POLICY IF EXISTS "file_upload_log_service_role_all" ON file_upload_log;
CREATE POLICY "file_upload_log_service_role_all" ON file_upload_log
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role')
    WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- =====================================================
-- API_USAGE_LOG TABLE
-- =====================================================
DROP POLICY IF EXISTS "Users can view their own API usage" ON api_usage_log;

DROP POLICY IF EXISTS "api_usage_log_select_own" ON api_usage_log;
CREATE POLICY "api_usage_log_select_own" ON api_usage_log
    FOR SELECT USING (
        auth.uid() = user_id
        OR auth.jwt() ->> 'role' = 'service_role'
    );

DROP POLICY IF EXISTS "api_usage_log_service_role_all" ON api_usage_log;
CREATE POLICY "api_usage_log_service_role_all" ON api_usage_log
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role')
    WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- =====================================================
-- SUPPLEMENTARY TABLES (006) — wrapped in exception blocks
-- These tables are code-inferred and may not exist yet in all environments.
-- =====================================================

-- DAILY_CHECKINS
DO $$ BEGIN
    DROP POLICY IF EXISTS "daily_checkins_select_own" ON daily_checkins;
    CREATE POLICY "daily_checkins_select_own" ON daily_checkins
        FOR SELECT USING (auth.uid() = user_id OR auth.jwt() ->> 'role' = 'service_role');
    DROP POLICY IF EXISTS "daily_checkins_service_role_all" ON daily_checkins;
    CREATE POLICY "daily_checkins_service_role_all" ON daily_checkins
        FOR ALL USING (auth.jwt() ->> 'role' = 'service_role')
        WITH CHECK (auth.jwt() ->> 'role' = 'service_role');
EXCEPTION WHEN undefined_table THEN
    RAISE NOTICE 'Skipping daily_checkins policies — table does not exist yet';
END $$;

-- CLOUD_STORAGE_CONNECTIONS
DO $$ BEGIN
    DROP POLICY IF EXISTS "cloud_storage_connections_select_own" ON cloud_storage_connections;
    CREATE POLICY "cloud_storage_connections_select_own" ON cloud_storage_connections
        FOR SELECT USING (auth.uid() = user_id OR auth.jwt() ->> 'role' = 'service_role');
    DROP POLICY IF EXISTS "cloud_storage_connections_service_role_all" ON cloud_storage_connections;
    CREATE POLICY "cloud_storage_connections_service_role_all" ON cloud_storage_connections
        FOR ALL USING (auth.jwt() ->> 'role' = 'service_role')
        WITH CHECK (auth.jwt() ->> 'role' = 'service_role');
EXCEPTION WHEN undefined_table THEN
    RAISE NOTICE 'Skipping cloud_storage_connections policies — table does not exist yet';
END $$;

-- READING_PROGRESS
DO $$ BEGIN
    DROP POLICY IF EXISTS "reading_progress_select_own" ON reading_progress;
    CREATE POLICY "reading_progress_select_own" ON reading_progress
        FOR SELECT USING (auth.uid() = user_id OR auth.jwt() ->> 'role' = 'service_role');
    DROP POLICY IF EXISTS "reading_progress_service_role_all" ON reading_progress;
    CREATE POLICY "reading_progress_service_role_all" ON reading_progress
        FOR ALL USING (auth.jwt() ->> 'role' = 'service_role')
        WITH CHECK (auth.jwt() ->> 'role' = 'service_role');
EXCEPTION WHEN undefined_table THEN
    RAISE NOTICE 'Skipping reading_progress policies — table does not exist yet';
END $$;

-- READING_GOALS
DO $$ BEGIN
    DROP POLICY IF EXISTS "reading_goals_select_own" ON reading_goals;
    CREATE POLICY "reading_goals_select_own" ON reading_goals
        FOR SELECT USING (auth.uid() = user_id OR auth.jwt() ->> 'role' = 'service_role');
    DROP POLICY IF EXISTS "reading_goals_service_role_all" ON reading_goals;
    CREATE POLICY "reading_goals_service_role_all" ON reading_goals
        FOR ALL USING (auth.jwt() ->> 'role' = 'service_role')
        WITH CHECK (auth.jwt() ->> 'role' = 'service_role');
EXCEPTION WHEN undefined_table THEN
    RAISE NOTICE 'Skipping reading_goals policies — table does not exist yet';
END $$;

-- DAILY_READING_STATS
DO $$ BEGIN
    DROP POLICY IF EXISTS "daily_reading_stats_select_own" ON daily_reading_stats;
    CREATE POLICY "daily_reading_stats_select_own" ON daily_reading_stats
        FOR SELECT USING (auth.uid() = user_id OR auth.jwt() ->> 'role' = 'service_role');
    DROP POLICY IF EXISTS "daily_reading_stats_service_role_all" ON daily_reading_stats;
    CREATE POLICY "daily_reading_stats_service_role_all" ON daily_reading_stats
        FOR ALL USING (auth.jwt() ->> 'role' = 'service_role')
        WITH CHECK (auth.jwt() ->> 'role' = 'service_role');
EXCEPTION WHEN undefined_table THEN
    RAISE NOTICE 'Skipping daily_reading_stats policies — table does not exist yet';
END $$;

-- =====================================================
-- Migration 008 Complete
-- =====================================================
-- RLS enabled on all 27 tables
-- Standardized policy pattern across the board
-- Old conflicting policies dropped before recreation
