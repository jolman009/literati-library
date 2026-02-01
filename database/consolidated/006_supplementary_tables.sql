-- =====================================================
-- ShelfQuest Consolidated Migration 006
-- Supplementary Tables
-- =====================================================
-- daily_checkins: fixed from broken SQL Server syntax to PostgreSQL
-- cloud_storage_connections: inferred from cloudStorage.js
-- reading_progress, reading_goals, daily_reading_stats: inferred from dataExport.js

-- =====================================================
-- DAILY_CHECKINS TABLE
-- =====================================================
-- Original file (supabase_daily_checkins_table.sql) used SQL Server syntax
-- This is the corrected PostgreSQL version
CREATE TABLE IF NOT EXISTS daily_checkins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    check_in_date DATE NOT NULL,
    streak INTEGER DEFAULT 1,
    points INTEGER DEFAULT 10,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(user_id, check_in_date)
);

-- FK: daily_checkins.user_id -> users.id
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'daily_checkins_user_id_fkey'
          AND table_name = 'daily_checkins'
    ) THEN
        ALTER TABLE daily_checkins
            ADD CONSTRAINT daily_checkins_user_id_fkey
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- =====================================================
-- CLOUD_STORAGE_CONNECTIONS TABLE
-- =====================================================
-- Inferred from cloudStorage.js route file
CREATE TABLE IF NOT EXISTS cloud_storage_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    provider VARCHAR(50) NOT NULL,
    access_token TEXT,
    refresh_token TEXT,
    expires_at TIMESTAMP WITH TIME ZONE,
    connected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_used TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(user_id, provider)
);

-- FK: cloud_storage_connections.user_id -> users.id
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'cloud_storage_connections_user_id_fkey'
          AND table_name = 'cloud_storage_connections'
    ) THEN
        ALTER TABLE cloud_storage_connections
            ADD CONSTRAINT cloud_storage_connections_user_id_fkey
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- =====================================================
-- READING_PROGRESS TABLE
-- =====================================================
-- Inferred from dataExport.js: book_id, current_page, total_pages,
-- progress_percentage, last_read_date, reading_status, time_spent_seconds
CREATE TABLE IF NOT EXISTS reading_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    book_id UUID,
    current_page INTEGER DEFAULT 0,
    total_pages INTEGER,
    progress_percentage NUMERIC DEFAULT 0,
    last_read_date TIMESTAMP WITH TIME ZONE,
    reading_status VARCHAR(50) DEFAULT 'not_started',
    time_spent_seconds INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(user_id, book_id)
);

-- FK: reading_progress.user_id -> users.id
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'reading_progress_user_id_fkey'
          AND table_name = 'reading_progress'
    ) THEN
        ALTER TABLE reading_progress
            ADD CONSTRAINT reading_progress_user_id_fkey
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- FK: reading_progress.book_id -> books.id
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'reading_progress_book_id_fkey'
          AND table_name = 'reading_progress'
    ) THEN
        ALTER TABLE reading_progress
            ADD CONSTRAINT reading_progress_book_id_fkey
            FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE;
    END IF;
END $$;

-- =====================================================
-- READING_GOALS TABLE
-- =====================================================
-- Inferred from dataExport.js: goal_type, target_value, current_value,
-- period, start_date, end_date, status, completed_at
CREATE TABLE IF NOT EXISTS reading_goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    goal_type VARCHAR(50) NOT NULL,
    target_value INTEGER NOT NULL,
    current_value INTEGER DEFAULT 0,
    period VARCHAR(50),
    start_date DATE,
    end_date DATE,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- FK: reading_goals.user_id -> users.id
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'reading_goals_user_id_fkey'
          AND table_name = 'reading_goals'
    ) THEN
        ALTER TABLE reading_goals
            ADD CONSTRAINT reading_goals_user_id_fkey
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- =====================================================
-- DAILY_READING_STATS TABLE
-- =====================================================
-- Inferred from dataExport.js: stat_date, books_read, pages_read,
-- time_spent_seconds, notes_created, achievements_earned, streak_days
CREATE TABLE IF NOT EXISTS daily_reading_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    stat_date DATE NOT NULL,
    books_read INTEGER DEFAULT 0,
    pages_read INTEGER DEFAULT 0,
    time_spent_seconds INTEGER DEFAULT 0,
    notes_created INTEGER DEFAULT 0,
    achievements_earned INTEGER DEFAULT 0,
    streak_days INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(user_id, stat_date)
);

-- FK: daily_reading_stats.user_id -> users.id
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'daily_reading_stats_user_id_fkey'
          AND table_name = 'daily_reading_stats'
    ) THEN
        ALTER TABLE daily_reading_stats
            ADD CONSTRAINT daily_reading_stats_user_id_fkey
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- =====================================================
-- Migration 006 Complete
-- =====================================================
-- Tables: daily_checkins, cloud_storage_connections, reading_progress,
--         reading_goals, daily_reading_stats
