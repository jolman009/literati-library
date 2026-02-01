-- =====================================================
-- ShelfQuest Consolidated Migration 001
-- Core Tables: users, books, reading_sessions, notes
-- =====================================================
-- Safe to run on existing DB: all statements are additive
-- Schemas inferred from: secureAuth.js, books.js, reading.js, notes.js, fix-notes-foreign-key.sql

-- =====================================================
-- USERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    avatar TEXT,
    is_active BOOLEAN DEFAULT true,
    token_version INTEGER DEFAULT 0,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add columns that may not exist yet (from addSecurityColumns.sql)
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE users ADD COLUMN IF NOT EXISTS token_version INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login TIMESTAMP WITH TIME ZONE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- =====================================================
-- BOOKS TABLE
-- =====================================================
-- Columns inferred from books.js: user_id, title, author, genre, description,
-- file_url, file_path, file_size, file_type, filename, cover_url, format,
-- is_reading, progress, last_opened, completed, completed_date, status
CREATE TABLE IF NOT EXISTS books (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    title VARCHAR(500) NOT NULL,
    author VARCHAR(500),
    isbn VARCHAR(20),
    publisher VARCHAR(500),
    published_date VARCHAR(50),
    page_count INTEGER,
    language VARCHAR(10),
    description TEXT,
    genre VARCHAR(100),
    file_url TEXT,
    file_path TEXT,
    file_size INTEGER,
    file_type VARCHAR(100),
    filename VARCHAR(500),
    cover_url TEXT,
    cover_image_url TEXT,
    format VARCHAR(20),
    status VARCHAR(50) DEFAULT 'uploaded',
    is_reading BOOLEAN DEFAULT false,
    progress NUMERIC DEFAULT 0,
    last_opened TIMESTAMP WITH TIME ZONE,
    last_accessed TIMESTAMP WITH TIME ZONE,
    added_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed BOOLEAN DEFAULT false,
    completed_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add columns that may not exist on older tables
ALTER TABLE books ADD COLUMN IF NOT EXISTS isbn VARCHAR(20);
ALTER TABLE books ADD COLUMN IF NOT EXISTS publisher VARCHAR(500);
ALTER TABLE books ADD COLUMN IF NOT EXISTS published_date VARCHAR(50);
ALTER TABLE books ADD COLUMN IF NOT EXISTS page_count INTEGER;
ALTER TABLE books ADD COLUMN IF NOT EXISTS language VARCHAR(10);
ALTER TABLE books ADD COLUMN IF NOT EXISTS cover_url TEXT;
ALTER TABLE books ADD COLUMN IF NOT EXISTS cover_image_url TEXT;
ALTER TABLE books ADD COLUMN IF NOT EXISTS format VARCHAR(20);
ALTER TABLE books ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'uploaded';
ALTER TABLE books ADD COLUMN IF NOT EXISTS is_reading BOOLEAN DEFAULT false;
ALTER TABLE books ADD COLUMN IF NOT EXISTS progress NUMERIC DEFAULT 0;
ALTER TABLE books ADD COLUMN IF NOT EXISTS last_opened TIMESTAMP WITH TIME ZONE;
ALTER TABLE books ADD COLUMN IF NOT EXISTS last_accessed TIMESTAMP WITH TIME ZONE;
ALTER TABLE books ADD COLUMN IF NOT EXISTS added_date TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE books ADD COLUMN IF NOT EXISTS completed BOOLEAN DEFAULT false;
ALTER TABLE books ADD COLUMN IF NOT EXISTS completed_date TIMESTAMP WITH TIME ZONE;

-- FK: books.user_id -> users.id
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'books_user_id_fkey'
          AND table_name = 'books'
    ) THEN
        ALTER TABLE books
            ADD CONSTRAINT books_user_id_fkey
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- =====================================================
-- READING_SESSIONS TABLE
-- =====================================================
-- Columns inferred from reading.js: user_id, book_id, start_time, end_time,
-- start_page, end_page, start_position, end_position, notes, duration, session_date
CREATE TABLE IF NOT EXISTS reading_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    book_id UUID NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE,
    end_time TIMESTAMP WITH TIME ZONE,
    start_page INTEGER,
    end_page INTEGER,
    start_position TEXT,
    end_position TEXT,
    notes TEXT,
    duration INTEGER, -- minutes
    duration_seconds INTEGER,
    pages_read INTEGER,
    session_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add columns that may not exist
ALTER TABLE reading_sessions ADD COLUMN IF NOT EXISTS start_position TEXT;
ALTER TABLE reading_sessions ADD COLUMN IF NOT EXISTS end_position TEXT;
ALTER TABLE reading_sessions ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE reading_sessions ADD COLUMN IF NOT EXISTS duration INTEGER;
ALTER TABLE reading_sessions ADD COLUMN IF NOT EXISTS duration_seconds INTEGER;
ALTER TABLE reading_sessions ADD COLUMN IF NOT EXISTS pages_read INTEGER;
ALTER TABLE reading_sessions ADD COLUMN IF NOT EXISTS session_date DATE;
ALTER TABLE reading_sessions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- FK: reading_sessions.user_id -> users.id
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'reading_sessions_user_id_fkey'
          AND table_name = 'reading_sessions'
    ) THEN
        ALTER TABLE reading_sessions
            ADD CONSTRAINT reading_sessions_user_id_fkey
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- FK: reading_sessions.book_id -> books.id
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'reading_sessions_book_id_fkey'
          AND table_name = 'reading_sessions'
    ) THEN
        ALTER TABLE reading_sessions
            ADD CONSTRAINT reading_sessions_book_id_fkey
            FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE;
    END IF;
END $$;

-- =====================================================
-- NOTES TABLE
-- =====================================================
-- Columns from fix-notes-foreign-key.sql + notes.js
CREATE TABLE IF NOT EXISTS notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    book_id UUID,
    content TEXT NOT NULL,
    title TEXT,
    type VARCHAR(20) DEFAULT 'note',
    page INTEGER,
    position TEXT,
    color VARCHAR(20) DEFAULT 'yellow',
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add columns that may not exist
ALTER TABLE notes ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE notes ADD COLUMN IF NOT EXISTS type VARCHAR(20) DEFAULT 'note';
ALTER TABLE notes ADD COLUMN IF NOT EXISTS page INTEGER;
ALTER TABLE notes ADD COLUMN IF NOT EXISTS position TEXT;
ALTER TABLE notes ADD COLUMN IF NOT EXISTS color VARCHAR(20) DEFAULT 'yellow';
ALTER TABLE notes ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- FK: notes.user_id -> users.id
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'notes_user_id_fkey'
          AND table_name = 'notes'
    ) THEN
        ALTER TABLE notes
            ADD CONSTRAINT notes_user_id_fkey
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- FK: notes.book_id -> books.id
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'notes_book_id_fkey'
          AND table_name = 'notes'
    ) THEN
        ALTER TABLE notes
            ADD CONSTRAINT notes_book_id_fkey
            FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE;
    END IF;
END $$;

-- =====================================================
-- Migration 001 Complete
-- =====================================================
-- Tables: users, books, reading_sessions, notes
-- All statements are idempotent (safe to run multiple times)
