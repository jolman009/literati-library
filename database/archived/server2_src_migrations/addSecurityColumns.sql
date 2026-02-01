-- Database Migration: Add Security Columns
-- This script adds necessary columns for enhanced security features

-- Add security columns to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS token_version INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_login TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS account_locked_until TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS two_factor_secret VARCHAR(255),
ADD COLUMN IF NOT EXISTS backup_codes TEXT[],
ADD COLUMN IF NOT EXISTS security_questions JSONB,
ADD COLUMN IF NOT EXISTS login_history JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS last_ip_address INET,
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS email_verification_token VARCHAR(255),
ADD COLUMN IF NOT EXISTS password_reset_token VARCHAR(255),
ADD COLUMN IF NOT EXISTS password_reset_expires TIMESTAMP WITH TIME ZONE;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_users_token_version ON users(token_version);
CREATE INDEX IF NOT EXISTS idx_users_email_verified ON users(email_verified);
CREATE INDEX IF NOT EXISTS idx_users_last_login ON users(last_login);

-- Add security audit log table
CREATE TABLE IF NOT EXISTS security_audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    event_type VARCHAR(100) NOT NULL,
    event_data JSONB,
    ip_address INET,
    user_agent TEXT,
    success BOOLEAN DEFAULT true,
    risk_score INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for audit log
CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON security_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_event_type ON security_audit_log(event_type);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON security_audit_log(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_log_risk_score ON security_audit_log(risk_score);

-- Add session tracking table
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
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

-- Create indexes for sessions
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_refresh_token ON user_sessions(refresh_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_is_active ON user_sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions(expires_at);

-- Add rate limiting table
CREATE TABLE IF NOT EXISTS rate_limit_tracking (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    identifier VARCHAR(255) NOT NULL, -- IP address or user ID
    endpoint VARCHAR(255) NOT NULL,
    request_count INTEGER DEFAULT 1,
    window_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    blocked_until TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for rate limiting
CREATE INDEX IF NOT EXISTS idx_rate_limit_identifier ON rate_limit_tracking(identifier);
CREATE INDEX IF NOT EXISTS idx_rate_limit_endpoint ON rate_limit_tracking(endpoint);
CREATE INDEX IF NOT EXISTS idx_rate_limit_window_start ON rate_limit_tracking(window_start);
CREATE INDEX IF NOT EXISTS idx_rate_limit_blocked_until ON rate_limit_tracking(blocked_until);

-- Add security settings table
CREATE TABLE IF NOT EXISTS security_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value JSONB NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default security settings
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

-- Add file upload security table
CREATE TABLE IF NOT EXISTS file_upload_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    file_size INTEGER NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_hash VARCHAR(255),
    upload_path TEXT,
    scan_status VARCHAR(50) DEFAULT 'pending', -- pending, clean, infected, error
    scan_result JSONB,
    ip_address INET,
    user_agent TEXT,
    is_quarantined BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for file upload log
CREATE INDEX IF NOT EXISTS idx_file_upload_user_id ON file_upload_log(user_id);
CREATE INDEX IF NOT EXISTS idx_file_upload_scan_status ON file_upload_log(scan_status);
CREATE INDEX IF NOT EXISTS idx_file_upload_created_at ON file_upload_log(created_at);
CREATE INDEX IF NOT EXISTS idx_file_upload_file_hash ON file_upload_log(file_hash);

-- Add API usage tracking table
CREATE TABLE IF NOT EXISTS api_usage_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    endpoint VARCHAR(255) NOT NULL,
    method VARCHAR(10) NOT NULL,
    status_code INTEGER NOT NULL,
    response_time INTEGER, -- milliseconds
    request_size INTEGER,
    response_size INTEGER,
    ip_address INET,
    user_agent TEXT,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for API usage log
CREATE INDEX IF NOT EXISTS idx_api_usage_user_id ON api_usage_log(user_id);
CREATE INDEX IF NOT EXISTS idx_api_usage_endpoint ON api_usage_log(endpoint);
CREATE INDEX IF NOT EXISTS idx_api_usage_status_code ON api_usage_log(status_code);
CREATE INDEX IF NOT EXISTS idx_api_usage_created_at ON api_usage_log(created_at);

-- Add Row Level Security (RLS) policies

-- Enable RLS on sensitive tables
ALTER TABLE security_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_upload_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_usage_log ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own audit logs" ON security_audit_log
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can view their own sessions" ON user_sessions
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update their own sessions" ON user_sessions
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can view their own file uploads" ON file_upload_log
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can view their own API usage" ON api_usage_log
    FOR SELECT USING (user_id = auth.uid());

-- Create functions for common security operations

-- Function to log security events
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
    log_id UUID;
BEGIN
    INSERT INTO security_audit_log (
        user_id, event_type, event_data, ip_address,
        user_agent, success, risk_score
    ) VALUES (
        p_user_id, p_event_type, p_event_data, p_ip_address,
        p_user_agent, p_success, p_risk_score
    ) RETURNING id INTO log_id;

    RETURN log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions() RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM user_sessions
    WHERE expires_at < NOW() OR last_activity < NOW() - INTERVAL '30 days';

    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up old audit logs (keep 1 year)
CREATE OR REPLACE FUNCTION cleanup_old_audit_logs() RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM security_audit_log
    WHERE created_at < NOW() - INTERVAL '1 year';

    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for automatic cleanup (optional)
-- This can be run as a scheduled job instead

-- Grant necessary permissions
GRANT SELECT, INSERT ON security_audit_log TO authenticated;
GRANT SELECT, INSERT, UPDATE ON user_sessions TO authenticated;
GRANT SELECT, INSERT ON file_upload_log TO authenticated;
GRANT SELECT ON api_usage_log TO authenticated;
GRANT SELECT ON security_settings TO authenticated;

-- Create view for user security dashboard
CREATE OR REPLACE VIEW user_security_dashboard AS
SELECT
    u.id as user_id,
    u.email,
    u.is_active,
    u.last_login,
    u.two_factor_enabled,
    u.email_verified,
    u.failed_login_attempts,
    u.account_locked_until,
    (SELECT COUNT(*) FROM user_sessions WHERE user_id = u.id AND is_active = true) as active_sessions,
    (SELECT COUNT(*) FROM security_audit_log WHERE user_id = u.id AND created_at > NOW() - INTERVAL '30 days') as recent_activity_count,
    (SELECT MAX(created_at) FROM security_audit_log WHERE user_id = u.id) as last_activity
FROM users u;

-- Grant access to the view
GRANT SELECT ON user_security_dashboard TO authenticated;

COMMENT ON TABLE security_audit_log IS 'Logs all security-related events for auditing purposes';
COMMENT ON TABLE user_sessions IS 'Tracks active user sessions for enhanced security';
COMMENT ON TABLE rate_limit_tracking IS 'Tracks rate limiting per identifier and endpoint';
COMMENT ON TABLE security_settings IS 'Global security configuration settings';
COMMENT ON TABLE file_upload_log IS 'Logs all file uploads with security scanning results';
COMMENT ON TABLE api_usage_log IS 'Tracks API usage for monitoring and rate limiting';
COMMENT ON VIEW user_security_dashboard IS 'Provides security overview for each user';