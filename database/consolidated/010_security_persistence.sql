-- =====================================================
-- ShelfQuest Consolidated Migration 010
-- Security State Persistence
-- =====================================================
-- Adds persistence for security structures that were previously
-- in-memory only (lost on server restart):
--   1. Token blacklist (revoked JWTs)
--   2. Refresh token families (rotation/breach detection)
-- Login attempts use existing users.failed_login_attempts
-- and users.account_locked_until columns (from migration 004).

-- =====================================================
-- TOKEN_BLACKLIST TABLE
-- =====================================================
-- Stores SHA-256 hashes of revoked JWTs so they remain
-- invalid across server restarts until natural expiry.
CREATE TABLE IF NOT EXISTS token_blacklist (
    token_hash VARCHAR(64) PRIMARY KEY,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    blacklisted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reason VARCHAR(50) DEFAULT 'logout'
);

CREATE INDEX IF NOT EXISTS idx_token_blacklist_expires
    ON token_blacklist(expires_at);

-- =====================================================
-- REFRESH_TOKEN_FAMILIES TABLE
-- =====================================================
-- Tracks refresh token rotation families for breach detection.
-- Each family represents a login session's token lineage.
CREATE TABLE IF NOT EXISTS refresh_token_families (
    family_id VARCHAR(128) PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tokens TEXT[] NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rtf_user_id
    ON refresh_token_families(user_id);
CREATE INDEX IF NOT EXISTS idx_rtf_last_used
    ON refresh_token_families(last_used_at);

-- =====================================================
-- Migration 010 Complete
-- =====================================================
-- Tables: token_blacklist, refresh_token_families
-- Login attempts: uses existing users columns from migration 004
