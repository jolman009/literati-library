-- =====================================================
-- ShelfQuest Consolidated Migration 002
-- Gamification Core Tables
-- =====================================================
-- Merged from: 001_create_gamification_tables.sql + addGamificationTables.sql
-- Conflicts resolved: superset of columns from both definitions
-- FKs reference users(id) (custom users table, not auth.users)

-- =====================================================
-- USER_ACHIEVEMENTS TABLE
-- =====================================================
-- Migration 001 had: achievement_id VARCHAR(50), gen_random_uuid(), FK auth.users
-- addGamificationTables had: achievement_id VARCHAR(100), uuid_generate_v4(), FK users
-- Merged: VARCHAR(100) superset, gen_random_uuid() (built-in), FK users
CREATE TABLE IF NOT EXISTS user_achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    achievement_id VARCHAR(100) NOT NULL,
    achievement_name VARCHAR(255),
    achievement_description TEXT,
    progress INTEGER,
    unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(user_id, achievement_id)
);

-- Add columns that may not exist on older tables
ALTER TABLE user_achievements ADD COLUMN IF NOT EXISTS achievement_name VARCHAR(255);
ALTER TABLE user_achievements ADD COLUMN IF NOT EXISTS achievement_description TEXT;
ALTER TABLE user_achievements ADD COLUMN IF NOT EXISTS progress INTEGER;

-- FK: user_achievements.user_id -> users.id
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'user_achievements_user_id_fkey'
          AND table_name = 'user_achievements'
    ) THEN
        ALTER TABLE user_achievements
            ADD CONSTRAINT user_achievements_user_id_fkey
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- =====================================================
-- USER_GOALS TABLE
-- =====================================================
-- Migration 001 had: goal_id, type, target, current, points, period, deadline
-- addGamificationTables had: goal_type, target_value, current_value, target_date, is_completed
-- Merged: superset of all columns
CREATE TABLE IF NOT EXISTS user_goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    goal_id VARCHAR(50),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50),
    goal_type VARCHAR(50),
    target INTEGER NOT NULL DEFAULT 1,
    target_value INTEGER,
    current INTEGER DEFAULT 0,
    current_value INTEGER DEFAULT 0,
    points INTEGER DEFAULT 0,
    period VARCHAR(20) DEFAULT 'monthly',
    deadline TIMESTAMP WITH TIME ZONE,
    target_date DATE,
    is_active BOOLEAN DEFAULT true,
    is_completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add columns that may not exist
ALTER TABLE user_goals ADD COLUMN IF NOT EXISTS goal_id VARCHAR(50);
ALTER TABLE user_goals ADD COLUMN IF NOT EXISTS goal_type VARCHAR(50);
ALTER TABLE user_goals ADD COLUMN IF NOT EXISTS target_value INTEGER;
ALTER TABLE user_goals ADD COLUMN IF NOT EXISTS current_value INTEGER DEFAULT 0;
ALTER TABLE user_goals ADD COLUMN IF NOT EXISTS target_date DATE;
ALTER TABLE user_goals ADD COLUMN IF NOT EXISTS is_completed BOOLEAN DEFAULT false;
ALTER TABLE user_goals ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 0;
ALTER TABLE user_goals ADD COLUMN IF NOT EXISTS period VARCHAR(20) DEFAULT 'monthly';
ALTER TABLE user_goals ADD COLUMN IF NOT EXISTS deadline TIMESTAMP WITH TIME ZONE;

-- FK: user_goals.user_id -> users.id
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'user_goals_user_id_fkey'
          AND table_name = 'user_goals'
    ) THEN
        ALTER TABLE user_goals
            ADD CONSTRAINT user_goals_user_id_fkey
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- =====================================================
-- USER_ACTIONS TABLE (deprecated but still referenced)
-- =====================================================
-- Migration 001 had: action VARCHAR(50), data JSONB
-- addGamificationTables had: action VARCHAR(100), action_data JSONB, FK books(id)
-- Merged: superset
CREATE TABLE IF NOT EXISTS user_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    action VARCHAR(100) NOT NULL,
    points INTEGER NOT NULL DEFAULT 0,
    data JSONB DEFAULT '{}',
    action_data JSONB,
    session_id UUID,
    book_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add columns that may not exist
ALTER TABLE user_actions ADD COLUMN IF NOT EXISTS action_data JSONB;
ALTER TABLE user_actions ADD COLUMN IF NOT EXISTS data JSONB DEFAULT '{}';
ALTER TABLE user_actions ADD COLUMN IF NOT EXISTS session_id UUID;
ALTER TABLE user_actions ADD COLUMN IF NOT EXISTS book_id UUID;

-- FK: user_actions.user_id -> users.id
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'user_actions_user_id_fkey'
          AND table_name = 'user_actions'
    ) THEN
        ALTER TABLE user_actions
            ADD CONSTRAINT user_actions_user_id_fkey
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- FK: user_actions.book_id -> books.id (optional, SET NULL on delete)
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'user_actions_book_id_fkey'
          AND table_name = 'user_actions'
    ) THEN
        ALTER TABLE user_actions
            ADD CONSTRAINT user_actions_book_id_fkey
            FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE SET NULL;
    END IF;
END $$;

-- =====================================================
-- READING_STREAKS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS reading_streaks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    streak_date DATE NOT NULL,
    reading_time INTEGER DEFAULT 0,
    pages_read INTEGER DEFAULT 0,
    books_completed INTEGER DEFAULT 0,
    notes_created INTEGER DEFAULT 0,
    highlights_created INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(user_id, streak_date)
);

-- FK: reading_streaks.user_id -> users.id
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'reading_streaks_user_id_fkey'
          AND table_name = 'reading_streaks'
    ) THEN
        ALTER TABLE reading_streaks
            ADD CONSTRAINT reading_streaks_user_id_fkey
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- =====================================================
-- USER_PREFERENCES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS user_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE,
    gamification_enabled BOOLEAN DEFAULT true,
    achievement_notifications BOOLEAN DEFAULT true,
    goal_reminders BOOLEAN DEFAULT true,
    leaderboard_visible BOOLEAN DEFAULT false,
    reading_time_goal INTEGER DEFAULT 300,
    books_per_month_goal INTEGER DEFAULT 2,
    preferred_reading_time VARCHAR(20) DEFAULT 'any',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- FK: user_preferences.user_id -> users.id
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'user_preferences_user_id_fkey'
          AND table_name = 'user_preferences'
    ) THEN
        ALTER TABLE user_preferences
            ADD CONSTRAINT user_preferences_user_id_fkey
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- =====================================================
-- USER_STATS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS user_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE,
    total_points INTEGER DEFAULT 0 NOT NULL,
    level INTEGER DEFAULT 1 NOT NULL,
    notes_created INTEGER DEFAULT 0 NOT NULL,
    highlights_created INTEGER DEFAULT 0 NOT NULL,
    reading_sessions_completed INTEGER DEFAULT 0 NOT NULL,
    books_completed INTEGER DEFAULT 0 NOT NULL,
    books_uploaded INTEGER DEFAULT 0 NOT NULL,
    books_read INTEGER DEFAULT 0,
    daily_checkins INTEGER DEFAULT 0 NOT NULL,
    total_reading_time INTEGER DEFAULT 0 NOT NULL,
    total_pages_read INTEGER DEFAULT 0 NOT NULL,
    pages_read INTEGER DEFAULT 0,
    reading_streak INTEGER DEFAULT 0,
    current_reading_streak INTEGER DEFAULT 0 NOT NULL,
    longest_reading_streak INTEGER DEFAULT 0 NOT NULL,
    last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add columns that may not exist
ALTER TABLE user_stats ADD COLUMN IF NOT EXISTS books_read INTEGER DEFAULT 0;
ALTER TABLE user_stats ADD COLUMN IF NOT EXISTS pages_read INTEGER DEFAULT 0;
ALTER TABLE user_stats ADD COLUMN IF NOT EXISTS reading_streak INTEGER DEFAULT 0;

-- FK: user_stats.user_id -> users.id
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'user_stats_user_id_fkey'
          AND table_name = 'user_stats'
    ) THEN
        ALTER TABLE user_stats
            ADD CONSTRAINT user_stats_user_id_fkey
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- =====================================================
-- GOAL_TEMPLATES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS goal_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    goal_type VARCHAR(50) NOT NULL,
    suggested_target INTEGER NOT NULL,
    difficulty_level VARCHAR(20) DEFAULT 'medium',
    category VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seed default goal templates
INSERT INTO goal_templates (title, description, goal_type, suggested_target, difficulty_level, category) VALUES
('Beginner Reader', 'Read your first 5 books', 'books_read', 5, 'easy', 'reading'),
('Consistent Reader', 'Read 12 books this year', 'books_read', 12, 'medium', 'reading'),
('Avid Reader', 'Read 25 books this year', 'books_read', 25, 'medium', 'reading'),
('Bookworm', 'Read 50 books this year', 'books_read', 50, 'hard', 'reading'),
('Page Turner', 'Read 10,000 pages', 'pages_read', 10000, 'medium', 'reading'),
('Speed Reader', 'Read 25,000 pages', 'pages_read', 25000, 'hard', 'reading'),
('Daily Reader', 'Read for 30 days straight', 'reading_streak', 30, 'medium', 'consistency'),
('Reading Habit', 'Read for 100 days straight', 'reading_streak', 100, 'hard', 'consistency'),
('Reading Marathon', 'Read for 100 hours total', 'reading_time', 6000, 'medium', 'time'),
('Reading Devotee', 'Read for 500 hours total', 'reading_time', 30000, 'hard', 'time')
ON CONFLICT DO NOTHING;

-- =====================================================
-- Migration 002 Complete
-- =====================================================
-- Tables: user_achievements, user_goals, user_actions, reading_streaks,
--         user_preferences, user_stats, goal_templates
