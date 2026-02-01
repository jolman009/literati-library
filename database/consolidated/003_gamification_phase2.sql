-- =====================================================
-- ShelfQuest Consolidated Migration 003
-- Gamification Phase 2: Challenges, Social, Streak Shields
-- =====================================================
-- From: server2/migrations/004_gamification_phase2.sql (already clean)

-- =====================================================
-- USER_CHALLENGES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS user_challenges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    challenge_id VARCHAR(100) NOT NULL,
    challenge_type VARCHAR(20) NOT NULL CHECK (challenge_type IN ('daily', 'weekly', 'weekend', 'special')),
    period_start DATE NOT NULL,
    progress INTEGER DEFAULT 0,
    is_completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMP WITH TIME ZONE,
    reward_claimed BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(user_id, challenge_id, period_start)
);

-- FK: user_challenges.user_id -> users.id
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'user_challenges_user_id_fkey'
          AND table_name = 'user_challenges'
    ) THEN
        ALTER TABLE user_challenges
            ADD CONSTRAINT user_challenges_user_id_fkey
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- =====================================================
-- USER_FOLLOWS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS user_follows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    follower_id UUID NOT NULL,
    following_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(follower_id, following_id),
    CHECK (follower_id != following_id)
);

-- FK: user_follows.follower_id -> users.id
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'user_follows_follower_id_fkey'
          AND table_name = 'user_follows'
    ) THEN
        ALTER TABLE user_follows
            ADD CONSTRAINT user_follows_follower_id_fkey
            FOREIGN KEY (follower_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- FK: user_follows.following_id -> users.id
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'user_follows_following_id_fkey'
          AND table_name = 'user_follows'
    ) THEN
        ALTER TABLE user_follows
            ADD CONSTRAINT user_follows_following_id_fkey
            FOREIGN KEY (following_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- =====================================================
-- USER_SETTINGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS user_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE,
    leaderboard_visible BOOLEAN DEFAULT true,
    display_name VARCHAR(100),
    challenge_notifications BOOLEAN DEFAULT true,
    achievement_notifications BOOLEAN DEFAULT true,
    streak_notifications BOOLEAN DEFAULT true,
    streak_shields INTEGER DEFAULT 0,
    max_streak_shields INTEGER DEFAULT 3,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- FK: user_settings.user_id -> users.id
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'user_settings_user_id_fkey'
          AND table_name = 'user_settings'
    ) THEN
        ALTER TABLE user_settings
            ADD CONSTRAINT user_settings_user_id_fkey
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- =====================================================
-- STREAK_SHIELD_LOG TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS streak_shield_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    action VARCHAR(20) NOT NULL CHECK (action IN ('earned', 'used', 'expired')),
    shield_count INTEGER NOT NULL,
    streak_at_action INTEGER,
    reason VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- FK: streak_shield_log.user_id -> users.id
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'streak_shield_log_user_id_fkey'
          AND table_name = 'streak_shield_log'
    ) THEN
        ALTER TABLE streak_shield_log
            ADD CONSTRAINT streak_shield_log_user_id_fkey
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- =====================================================
-- LEADERBOARD_CACHE TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS leaderboard_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    period_type VARCHAR(20) NOT NULL CHECK (period_type IN ('weekly', 'monthly', 'all_time')),
    period_start DATE,
    total_points INTEGER DEFAULT 0,
    rank INTEGER,
    books_completed INTEGER DEFAULT 0,
    reading_streak INTEGER DEFAULT 0,
    total_reading_time INTEGER DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(user_id, period_type, period_start)
);

-- FK: leaderboard_cache.user_id -> users.id
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'leaderboard_cache_user_id_fkey'
          AND table_name = 'leaderboard_cache'
    ) THEN
        ALTER TABLE leaderboard_cache
            ADD CONSTRAINT leaderboard_cache_user_id_fkey
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- =====================================================
-- Migration 003 Complete
-- =====================================================
-- Tables: user_challenges, user_follows, user_settings,
--         streak_shield_log, leaderboard_cache
