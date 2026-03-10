-- =====================================================
-- ShelfQuest Consolidated Migration 015
-- Subscriptions & AI Usage (Freemium Gating)
-- =====================================================
-- Adds subscription tier to users, tracks AI call usage
-- per month, and stores subscription purchase history.

-- =====================================================
-- ENUM TYPE
-- =====================================================
DO $$ BEGIN
    CREATE TYPE subscription_tier AS ENUM ('free', 'pro');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- =====================================================
-- ALTER USERS TABLE
-- =====================================================
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_tier subscription_tier DEFAULT 'free';
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMPTZ;

-- =====================================================
-- AI USAGE TABLE (monthly counters)
-- =====================================================
CREATE TABLE IF NOT EXISTS ai_usage (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    month       VARCHAR(7) NOT NULL,           -- 'YYYY-MM'
    call_count  INTEGER NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, month)
);

-- =====================================================
-- SUBSCRIPTION HISTORY (audit trail)
-- =====================================================
CREATE TABLE IF NOT EXISTS subscription_history (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tier              subscription_tier NOT NULL,
    period_type       VARCHAR(20) NOT NULL CHECK (period_type IN ('monthly', 'annual', 'lifetime')),
    started_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at        TIMESTAMPTZ,
    stripe_session_id VARCHAR(255),
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- INDEXES
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_ai_usage_user_month
    ON ai_usage (user_id, month);

CREATE INDEX IF NOT EXISTS idx_subscription_history_user
    ON subscription_history (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_users_subscription_pro
    ON users (subscription_tier)
    WHERE subscription_tier = 'pro';

-- =====================================================
-- ROW LEVEL SECURITY  (same two-policy pattern as 008)
-- =====================================================

-- ai_usage
DO $$ BEGIN ALTER TABLE ai_usage ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN undefined_table THEN NULL; END $$;

DROP POLICY IF EXISTS "ai_usage_select_own" ON ai_usage;
CREATE POLICY "ai_usage_select_own" ON ai_usage
    FOR SELECT USING (
        auth.uid() = user_id
        OR auth.jwt() ->> 'role' = 'service_role'
    );

DROP POLICY IF EXISTS "ai_usage_service_role_all" ON ai_usage;
CREATE POLICY "ai_usage_service_role_all" ON ai_usage
    FOR ALL USING (
        auth.jwt() ->> 'role' = 'service_role'
    );

-- subscription_history
DO $$ BEGIN ALTER TABLE subscription_history ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN undefined_table THEN NULL; END $$;

DROP POLICY IF EXISTS "subscription_history_select_own" ON subscription_history;
CREATE POLICY "subscription_history_select_own" ON subscription_history
    FOR SELECT USING (
        auth.uid() = user_id
        OR auth.jwt() ->> 'role' = 'service_role'
    );

DROP POLICY IF EXISTS "subscription_history_service_role_all" ON subscription_history;
CREATE POLICY "subscription_history_service_role_all" ON subscription_history
    FOR ALL USING (
        auth.jwt() ->> 'role' = 'service_role'
    );

-- =====================================================
-- TRIGGER — reuse update_updated_at_column() from 007
-- =====================================================
DROP TRIGGER IF EXISTS set_ai_usage_updated_at ON ai_usage;
CREATE TRIGGER set_ai_usage_updated_at
    BEFORE UPDATE ON ai_usage
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
