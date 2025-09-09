-- Fix foreign key relationship between notes and books tables
-- Run this in your Supabase SQL editor

-- First, let's check if the notes table exists and see its structure
-- If it doesn't exist, create it
CREATE TABLE IF NOT EXISTS notes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
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

-- Add foreign key constraint to books table if it doesn't exist
ALTER TABLE notes 
DROP CONSTRAINT IF EXISTS notes_book_id_fkey;

ALTER TABLE notes 
ADD CONSTRAINT notes_book_id_fkey 
FOREIGN KEY (book_id) 
REFERENCES books(id) 
ON DELETE CASCADE;

-- Add foreign key constraint to users table if it doesn't exist
ALTER TABLE notes 
DROP CONSTRAINT IF EXISTS notes_user_id_fkey;

ALTER TABLE notes 
ADD CONSTRAINT notes_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES users(id) 
ON DELETE CASCADE;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notes_user_id ON notes(user_id);
CREATE INDEX IF NOT EXISTS idx_notes_book_id ON notes(book_id);
CREATE INDEX IF NOT EXISTS idx_notes_created_at ON notes(created_at);

-- Enable Row Level Security (RLS)
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DROP POLICY IF EXISTS "Users can view their own notes" ON notes;
CREATE POLICY "Users can view their own notes" ON notes
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own notes" ON notes;
CREATE POLICY "Users can insert their own notes" ON notes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own notes" ON notes;
CREATE POLICY "Users can update their own notes" ON notes
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own notes" ON notes;
CREATE POLICY "Users can delete their own notes" ON notes
    FOR DELETE USING (auth.uid() = user_id);