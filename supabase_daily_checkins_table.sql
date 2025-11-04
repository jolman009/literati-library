-- ============================================
-- Daily Check-ins Table Creation Script
-- ============================================
-- Purpose: Store daily check-in records with streak tracking
-- Date: 2025-11-03

-- Create the daily_checkins table
CREATE TABLE IF NOT EXISTS daily_checkins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  check_in_date date NOT NULL,
  streak integer DEFAULT 1,
  points integer DEFAULT 10,
  created_at timestamptz DEFAULT now(),

  -- Prevent duplicate check-ins on same day for a user
  UNIQUE(user_id, check_in_date)
);

-- Create index for faster queries by user and date
CREATE INDEX idx_daily_checkins_user_date ON daily_checkins(user_id, check_in_date DESC);

-- ============================================
-- Row Level Security (RLS) Policies
-- ============================================

-- Enable RLS
ALTER TABLE daily_checkins ENABLE ROW LEVEL SECURITY;

-- Policy 1: Users can view their own check-ins
CREATE POLICY "Users can view own check-ins"
  ON daily_checkins
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy 2: Users can insert their own check-ins
CREATE POLICY "Users can insert own check-ins"
  ON daily_checkins
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy 3: Users can update their own check-ins (for streak corrections)
CREATE POLICY "Users can update own check-ins"
  ON daily_checkins
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy 4: Users can delete their own check-ins
CREATE POLICY "Users can delete own check-ins"
  ON daily_checkins
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- Sample Queries
-- ============================================

-- Get user's check-in history (last 30 days)
-- SELECT * FROM daily_checkins
-- WHERE user_id = auth.uid()
-- ORDER BY check_in_date DESC
-- LIMIT 30;

-- Calculate current streak
-- WITH consecutive_dates AS (
--   SELECT
--     check_in_date,
--     check_in_date - ROW_NUMBER() OVER (ORDER BY check_in_date DESC)::integer AS grp
--   FROM daily_checkins
--   WHERE user_id = auth.uid()
--   ORDER BY check_in_date DESC
-- )
-- SELECT COUNT(*) as current_streak
-- FROM consecutive_dates
-- WHERE grp = (SELECT MAX(grp) FROM consecutive_dates WHERE check_in_date >= CURRENT_DATE - INTERVAL '1 day');

-- ============================================
-- Verification Queries
-- ============================================

-- Verify table exists
-- SELECT table_name, column_name, data_type
-- FROM information_schema.columns
-- WHERE table_name = 'daily_checkins';

-- Verify RLS policies
-- SELECT policyname, permissive, roles, qual, with_check
-- FROM pg_policies
-- WHERE tablename = 'daily_checkins';
