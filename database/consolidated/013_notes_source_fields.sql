-- 013_notes_source_fields.sql
-- Phase 2.3: Add web source fields to notes table for Citation & Notes Collector.
-- These columns are nullable so existing notes are unaffected.

ALTER TABLE notes
  ADD COLUMN IF NOT EXISTS source_url   TEXT,
  ADD COLUMN IF NOT EXISTS source_title TEXT,
  ADD COLUMN IF NOT EXISTS source_favicon TEXT;

-- Index for finding notes captured from the web (non-null source_url)
CREATE INDEX IF NOT EXISTS idx_notes_source_url
  ON notes (user_id, created_at DESC)
  WHERE source_url IS NOT NULL;
