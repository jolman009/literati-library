-- 011_notifications.sql
-- In-app notification inbox and web push subscription storage
-- Part of ShelfQuest Push Notification System (Phase 1 + 2)

-- In-app notification inbox
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,        -- 'achievement_unlocked', 'level_up', 'streak_milestone', etc.
    title VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    icon VARCHAR(50),                 -- material icon name
    data JSONB DEFAULT '{}',          -- arbitrary payload (achievement_id, points, etc.)
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);

-- Web push + native device token storage
CREATE TABLE IF NOT EXISTS push_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    platform VARCHAR(20) NOT NULL,    -- 'web', 'ios', 'android'
    subscription JSONB NOT NULL,      -- PushSubscription JSON or FCM token
    endpoint_hash VARCHAR(64) NOT NULL,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, endpoint_hash)
);

CREATE INDEX IF NOT EXISTS idx_push_subs_user_active ON push_subscriptions(user_id, active);
