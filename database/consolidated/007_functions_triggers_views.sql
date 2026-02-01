-- =====================================================
-- ShelfQuest Consolidated Migration 007
-- Functions, Triggers, and Views
-- =====================================================
-- All use CREATE OR REPLACE for idempotency

-- =====================================================
-- UTILITY FUNCTION: update_updated_at_column
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- GAMIFICATION FUNCTIONS
-- =====================================================

-- Get user total points (from user_stats first, fallback to user_actions)
CREATE OR REPLACE FUNCTION get_user_total_points(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
    v_total_points INTEGER;
BEGIN
    SELECT total_points INTO v_total_points
    FROM user_stats
    WHERE user_id = p_user_id;

    IF v_total_points IS NULL THEN
        SELECT COALESCE(SUM(points), 0) INTO v_total_points
        FROM user_actions
        WHERE user_id = p_user_id;
    END IF;

    RETURN COALESCE(v_total_points, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get user action counts grouped by action type
CREATE OR REPLACE FUNCTION get_user_action_counts(p_user_id UUID)
RETURNS TABLE(
    action VARCHAR(100),
    count BIGINT,
    total_points BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        ua.action,
        COUNT(*)::BIGINT AS count,
        SUM(ua.points)::BIGINT AS total_points
    FROM user_actions ua
    WHERE ua.user_id = p_user_id
    GROUP BY ua.action
    ORDER BY total_points DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get user level based on total points
CREATE OR REPLACE FUNCTION get_user_level(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
    v_total_points INTEGER;
    v_level INTEGER;
BEGIN
    v_total_points := get_user_total_points(p_user_id);

    CASE
        WHEN v_total_points >= 10000 THEN v_level := 10;
        WHEN v_total_points >= 6000  THEN v_level := 9;
        WHEN v_total_points >= 4000  THEN v_level := 8;
        WHEN v_total_points >= 2500  THEN v_level := 7;
        WHEN v_total_points >= 1500  THEN v_level := 6;
        WHEN v_total_points >= 1000  THEN v_level := 5;
        WHEN v_total_points >= 600   THEN v_level := 4;
        WHEN v_total_points >= 300   THEN v_level := 3;
        WHEN v_total_points >= 100   THEN v_level := 2;
        ELSE v_level := 1;
    END CASE;

    RETURN v_level;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Award achievement to user (idempotent)
CREATE OR REPLACE FUNCTION award_achievement(
    p_user_id UUID,
    p_achievement_id VARCHAR(100)
) RETURNS BOOLEAN AS $$
DECLARE
    v_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM user_achievements
        WHERE user_id = p_user_id AND achievement_id = p_achievement_id
    ) INTO v_exists;

    IF NOT v_exists THEN
        INSERT INTO user_achievements (user_id, achievement_id)
        VALUES (p_user_id, p_achievement_id);
        RETURN true;
    END IF;

    RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check and auto-complete goals on update
CREATE OR REPLACE FUNCTION check_goal_completion()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.current_value >= NEW.target_value AND NEW.is_completed = false THEN
        NEW.is_completed = true;
        NEW.completed_at = NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- USER_STATS AUTO-UPDATE TRIGGER FUNCTION
-- =====================================================
CREATE OR REPLACE FUNCTION update_user_stats_on_action()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_stats (
        user_id, total_points, level,
        notes_created, reading_sessions_completed, daily_checkins,
        last_activity_at
    )
    VALUES (
        NEW.user_id, NEW.points, 1,
        CASE WHEN NEW.action = 'note_created' THEN 1 ELSE 0 END,
        CASE WHEN NEW.action = 'reading_session_completed' THEN 1 ELSE 0 END,
        CASE WHEN NEW.action = 'daily_checkin' THEN 1 ELSE 0 END,
        NOW()
    )
    ON CONFLICT (user_id) DO UPDATE SET
        total_points = user_stats.total_points + NEW.points,
        level = CASE
            WHEN (user_stats.total_points + NEW.points) >= 10000 THEN 10
            WHEN (user_stats.total_points + NEW.points) >= 6000  THEN 9
            WHEN (user_stats.total_points + NEW.points) >= 4000  THEN 8
            WHEN (user_stats.total_points + NEW.points) >= 2500  THEN 7
            WHEN (user_stats.total_points + NEW.points) >= 1500  THEN 6
            WHEN (user_stats.total_points + NEW.points) >= 1000  THEN 5
            WHEN (user_stats.total_points + NEW.points) >= 600   THEN 4
            WHEN (user_stats.total_points + NEW.points) >= 300   THEN 3
            WHEN (user_stats.total_points + NEW.points) >= 100   THEN 2
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

-- =====================================================
-- SECURITY FUNCTIONS
-- =====================================================

-- Log security events
CREATE OR REPLACE FUNCTION log_security_event(
    p_user_id UUID,
    p_event_type VARCHAR(100),
    p_event_data JSONB DEFAULT NULL,
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL,
    p_success BOOLEAN DEFAULT true,
    p_risk_score INTEGER DEFAULT 0
) RETURNS UUID AS $$
DECLARE
    v_log_id UUID;
BEGIN
    INSERT INTO security_audit_log (
        user_id, event_type, event_data, ip_address,
        user_agent, success, risk_score
    ) VALUES (
        p_user_id, p_event_type, p_event_data, p_ip_address,
        p_user_agent, p_success, p_risk_score
    ) RETURNING id INTO v_log_id;

    RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Cleanup expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions() RETURNS INTEGER AS $$
DECLARE
    v_deleted INTEGER;
BEGIN
    DELETE FROM user_sessions
    WHERE expires_at < NOW() OR last_activity < NOW() - INTERVAL '30 days';

    GET DIAGNOSTICS v_deleted = ROW_COUNT;
    RETURN v_deleted;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Cleanup old audit logs (keep 1 year)
CREATE OR REPLACE FUNCTION cleanup_old_audit_logs() RETURNS INTEGER AS $$
DECLARE
    v_deleted INTEGER;
BEGIN
    DELETE FROM security_audit_log
    WHERE created_at < NOW() - INTERVAL '1 year';

    GET DIAGNOSTICS v_deleted = ROW_COUNT;
    RETURN v_deleted;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- TRIGGERS: updated_at auto-update
-- =====================================================

-- users
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- books
DROP TRIGGER IF EXISTS update_books_updated_at ON books;
CREATE TRIGGER update_books_updated_at
    BEFORE UPDATE ON books
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- reading_sessions
DROP TRIGGER IF EXISTS update_reading_sessions_updated_at ON reading_sessions;
CREATE TRIGGER update_reading_sessions_updated_at
    BEFORE UPDATE ON reading_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- notes
DROP TRIGGER IF EXISTS update_notes_updated_at ON notes;
CREATE TRIGGER update_notes_updated_at
    BEFORE UPDATE ON notes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- user_goals
DROP TRIGGER IF EXISTS update_user_goals_updated_at ON user_goals;
CREATE TRIGGER update_user_goals_updated_at
    BEFORE UPDATE ON user_goals
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- reading_streaks
DROP TRIGGER IF EXISTS update_reading_streaks_updated_at ON reading_streaks;
CREATE TRIGGER update_reading_streaks_updated_at
    BEFORE UPDATE ON reading_streaks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- user_preferences
DROP TRIGGER IF EXISTS update_user_preferences_updated_at ON user_preferences;
CREATE TRIGGER update_user_preferences_updated_at
    BEFORE UPDATE ON user_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- user_stats
DROP TRIGGER IF EXISTS update_user_stats_updated_at ON user_stats;
CREATE TRIGGER update_user_stats_updated_at
    BEFORE UPDATE ON user_stats
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- user_challenges
DROP TRIGGER IF EXISTS update_user_challenges_updated_at ON user_challenges;
CREATE TRIGGER update_user_challenges_updated_at
    BEFORE UPDATE ON user_challenges
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- user_settings
DROP TRIGGER IF EXISTS update_user_settings_updated_at ON user_settings;
CREATE TRIGGER update_user_settings_updated_at
    BEFORE UPDATE ON user_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- reading_progress
DROP TRIGGER IF EXISTS update_reading_progress_updated_at ON reading_progress;
CREATE TRIGGER update_reading_progress_updated_at
    BEFORE UPDATE ON reading_progress
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- rate_limit_tracking
DROP TRIGGER IF EXISTS update_rate_limit_tracking_updated_at ON rate_limit_tracking;
CREATE TRIGGER update_rate_limit_tracking_updated_at
    BEFORE UPDATE ON rate_limit_tracking
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- security_settings
DROP TRIGGER IF EXISTS update_security_settings_updated_at ON security_settings;
CREATE TRIGGER update_security_settings_updated_at
    BEFORE UPDATE ON security_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- TRIGGER: Auto-update user_stats on user_actions INSERT
-- =====================================================
DROP TRIGGER IF EXISTS trigger_update_user_stats ON user_actions;
CREATE TRIGGER trigger_update_user_stats
    AFTER INSERT ON user_actions
    FOR EACH ROW
    EXECUTE FUNCTION update_user_stats_on_action();

-- =====================================================
-- TRIGGER: Auto-complete goals when current_value >= target_value
-- =====================================================
DROP TRIGGER IF EXISTS trigger_check_goal_completion ON user_goals;
CREATE TRIGGER trigger_check_goal_completion
    BEFORE UPDATE ON user_goals
    FOR EACH ROW
    EXECUTE FUNCTION check_goal_completion();

-- =====================================================
-- VIEWS
-- =====================================================

-- User stats summary (gamification overview)
CREATE OR REPLACE VIEW user_stats_summary AS
SELECT
    u.id AS user_id,
    u.email,
    COUNT(DISTINCT ua.id) AS total_achievements,
    COUNT(DISTINCT ug.id) AS total_goals,
    COUNT(DISTINCT CASE WHEN ug.completed_at IS NOT NULL THEN ug.id END) AS completed_goals,
    COALESCE(SUM(uact.points), 0) AS total_points,
    COUNT(DISTINCT CASE WHEN uact.created_at >= CURRENT_DATE THEN uact.id END) AS actions_today,
    MAX(rs.streak_date) AS last_reading_date,
    COALESCE(MAX(rs.reading_time), 0) AS reading_time_today
FROM users u
LEFT JOIN user_achievements ua ON u.id = ua.user_id
LEFT JOIN user_goals ug ON u.id = ug.user_id
LEFT JOIN user_actions uact ON u.id = uact.user_id
LEFT JOIN reading_streaks rs ON u.id = rs.user_id AND rs.streak_date = CURRENT_DATE
GROUP BY u.id, u.email;

-- Achievement progress summary
CREATE OR REPLACE VIEW achievement_progress AS
SELECT
    user_id,
    COUNT(*) AS achievements_unlocked,
    array_agg(achievement_id ORDER BY unlocked_at DESC) AS achievement_ids,
    MAX(unlocked_at) AS last_achievement_date
FROM user_achievements
GROUP BY user_id;

-- User gamification summary (comprehensive)
CREATE OR REPLACE VIEW user_gamification_summary AS
SELECT
    u.id AS user_id,
    u.email,
    (SELECT COUNT(*) FROM user_achievements WHERE user_id = u.id) AS total_achievements,
    (SELECT COUNT(*) FROM user_achievements WHERE user_id = u.id AND unlocked_at > NOW() - INTERVAL '30 days') AS recent_achievements,
    (SELECT COUNT(*) FROM user_goals WHERE user_id = u.id AND is_active = true) AS active_goals,
    (SELECT COUNT(*) FROM user_goals WHERE user_id = u.id AND is_completed = true) AS completed_goals,
    (SELECT COALESCE(SUM(points), 0) FROM user_actions WHERE user_id = u.id) AS total_points,
    (SELECT COALESCE(SUM(points), 0) FROM user_actions WHERE user_id = u.id AND created_at > NOW() - INTERVAL '7 days') AS points_this_week,
    (SELECT COUNT(*) FROM user_actions WHERE user_id = u.id) AS total_actions,
    (SELECT MAX(created_at) FROM user_actions WHERE user_id = u.id) AS last_action_at
FROM users u;

-- User security dashboard
CREATE OR REPLACE VIEW user_security_dashboard AS
SELECT
    u.id AS user_id,
    u.email,
    u.is_active,
    u.last_login,
    u.two_factor_enabled,
    u.email_verified,
    u.failed_login_attempts,
    u.account_locked_until,
    (SELECT COUNT(*) FROM user_sessions WHERE user_id = u.id AND is_active = true) AS active_sessions,
    (SELECT COUNT(*) FROM security_audit_log WHERE user_id = u.id AND created_at > NOW() - INTERVAL '30 days') AS recent_activity_count,
    (SELECT MAX(created_at) FROM security_audit_log WHERE user_id = u.id) AS last_activity
FROM users u;

-- =====================================================
-- Migration 007 Complete
-- =====================================================
-- Functions: update_updated_at_column, get_user_total_points,
--   get_user_action_counts, get_user_level, award_achievement,
--   check_goal_completion, update_user_stats_on_action,
--   log_security_event, cleanup_expired_sessions, cleanup_old_audit_logs
-- Triggers on all tables with updated_at columns
-- Views: user_stats_summary, achievement_progress,
--   user_gamification_summary, user_security_dashboard
