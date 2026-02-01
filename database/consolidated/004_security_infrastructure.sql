-- =====================================================
-- ShelfQuest Consolidated Migration 004
-- Security Infrastructure
-- =====================================================
-- From: server2/src/migrations/addSecurityColumns.sql

-- =====================================================
-- ALTER USERS TABLE: Add Security Columns
-- =====================================================
ALTER TABLE users ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS account_locked_until TIMESTAMP WITH TIME ZONE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE users ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS two_factor_secret VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS backup_codes TEXT[];
ALTER TABLE users ADD COLUMN IF NOT EXISTS security_questions JSONB;
ALTER TABLE users ADD COLUMN IF NOT EXISTS login_history JSONB DEFAULT '[]'::jsonb;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_ip_address INET;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verification_token VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_reset_token VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_reset_expires TIMESTAMP WITH TIME ZONE;

-- =====================================================
-- SECURITY_AUDIT_LOG TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS security_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    event_type VARCHAR(100) NOT NULL,
    event_data JSONB,
    ip_address INET,
    user_agent TEXT,
    success BOOLEAN DEFAULT true,
    risk_score INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- FK: security_audit_log.user_id -> users.id
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'security_audit_log_user_id_fkey'
          AND table_name = 'security_audit_log'
    ) THEN
        ALTER TABLE security_audit_log
            ADD CONSTRAINT security_audit_log_user_id_fkey
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- =====================================================
-- USER_SESSIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    refresh_token VARCHAR(255) UNIQUE,
    ip_address INET,
    user_agent TEXT,
    device_info JSONB,
    is_active BOOLEAN DEFAULT true,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- FK: user_sessions.user_id -> users.id
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'user_sessions_user_id_fkey'
          AND table_name = 'user_sessions'
    ) THEN
        ALTER TABLE user_sessions
            ADD CONSTRAINT user_sessions_user_id_fkey
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- =====================================================
-- RATE_LIMIT_TRACKING TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS rate_limit_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    identifier VARCHAR(255) NOT NULL,
    endpoint VARCHAR(255) NOT NULL,
    request_count INTEGER DEFAULT 1,
    window_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    blocked_until TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- SECURITY_SETTINGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS security_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value JSONB NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seed default security settings
INSERT INTO security_settings (setting_key, setting_value, description) VALUES
('max_login_attempts', '5', 'Maximum failed login attempts before account lockout'),
('lockout_duration', '900', 'Account lockout duration in seconds (15 minutes)'),
('session_timeout', '86400', 'Session timeout in seconds (24 hours)'),
('password_min_length', '8', 'Minimum password length'),
('password_require_special', 'true', 'Require special characters in passwords'),
('rate_limit_general', '100', 'General API rate limit per 15 minutes'),
('rate_limit_auth', '5', 'Authentication rate limit per 15 minutes'),
('two_factor_required', 'false', 'Require two-factor authentication for all users'),
('email_verification_required', 'true', 'Require email verification for new accounts')
ON CONFLICT (setting_key) DO NOTHING;

-- =====================================================
-- FILE_UPLOAD_LOG TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS file_upload_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    file_size INTEGER NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_hash VARCHAR(255),
    upload_path TEXT,
    scan_status VARCHAR(50) DEFAULT 'pending',
    scan_result JSONB,
    ip_address INET,
    user_agent TEXT,
    is_quarantined BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- FK: file_upload_log.user_id -> users.id
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'file_upload_log_user_id_fkey'
          AND table_name = 'file_upload_log'
    ) THEN
        ALTER TABLE file_upload_log
            ADD CONSTRAINT file_upload_log_user_id_fkey
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- =====================================================
-- API_USAGE_LOG TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS api_usage_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    endpoint VARCHAR(255) NOT NULL,
    method VARCHAR(10) NOT NULL,
    status_code INTEGER NOT NULL,
    response_time INTEGER,
    request_size INTEGER,
    response_size INTEGER,
    ip_address INET,
    user_agent TEXT,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- FK: api_usage_log.user_id -> users.id (SET NULL on delete)
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'api_usage_log_user_id_fkey'
          AND table_name = 'api_usage_log'
    ) THEN
        ALTER TABLE api_usage_log
            ADD CONSTRAINT api_usage_log_user_id_fkey
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;
    END IF;
END $$;

-- =====================================================
-- Migration 004 Complete
-- =====================================================
-- Security columns added to users table
-- Tables: security_audit_log, user_sessions, rate_limit_tracking,
--         security_settings, file_upload_log, api_usage_log
