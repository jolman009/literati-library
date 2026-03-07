-- 014_user_goals_source_fields.sql
-- Phase 3.3: Add web source fields to user_goals table for Task-from-Page Quick Capture.
-- These columns are nullable so existing goals are unaffected.

ALTER TABLE user_goals
  ADD COLUMN IF NOT EXISTS source_url      TEXT,
  ADD COLUMN IF NOT EXISTS source_title    VARCHAR(500),
  ADD COLUMN IF NOT EXISTS source_favicon  TEXT,
  ADD COLUMN IF NOT EXISTS ai_category     VARCHAR(50),
  ADD COLUMN IF NOT EXISTS ai_tags         TEXT[] DEFAULT '{}';

-- Index for finding goals captured from the web (non-null source_url)
CREATE INDEX IF NOT EXISTS idx_user_goals_source_url
  ON user_goals (user_id, created_at DESC)
  WHERE source_url IS NOT NULL;
