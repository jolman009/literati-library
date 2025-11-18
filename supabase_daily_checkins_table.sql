-- ============================================
-- Daily Check-ins Table Creation Script
-- ============================================
-- Purpose: Store daily check-in records with streak tracking
-- Date: 2025-11-03

-- SQL Server Version
-- Drop table if exists
IF OBJECT_ID('dbo.daily_checkins', 'U') IS NOT NULL
  DROP TABLE dbo.daily_checkins;

-- Create the daily_checkins table
CREATE TABLE dbo.daily_checkins (
  id uniqueidentifier PRIMARY KEY DEFAULT NEWID(),
  user_id uniqueidentifier NOT NULL,
  check_in_date date NOT NULL,
  streak int DEFAULT 1,
  points int DEFAULT 10,
  created_at datetime2 DEFAULT GETDATE(),
  
  -- Unique constraint to prevent duplicate check-ins on same day for a user
  CONSTRAINT UQ_user_checkin_date UNIQUE(user_id, check_in_date)
);

-- Create index for faster queries by user and date
CREATE INDEX idx_daily_checkins_user_date ON dbo.daily_checkins(user_id, check_in_date DESC);

-- ============================================
-- PostgreSQL/Supabase Version (commented out)
-- ============================================
-- If you're using PostgreSQL/Supabase, use this version instead:
/*
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
*/

-- ============================================
-- Sample Queries (SQL Server)
-- ============================================

-- Get user's check-in history (last 30 days)
-- SELECT TOP 30 * FROM dbo.daily_checkins
-- WHERE user_id = @userId
-- ORDER BY check_in_date DESC;

-- Calculate current streak (SQL Server version)
-- WITH consecutive_dates AS (
--   SELECT
--     check_in_date,
--     DATEADD(day, -ROW_NUMBER() OVER (ORDER BY check_in_date DESC), check_in_date) AS grp
--   FROM dbo.daily_checkins
--   WHERE user_id = @userId
-- )
-- SELECT COUNT(*) as current_streak
-- FROM consecutive_dates
-- WHERE grp = (SELECT MAX(grp) FROM consecutive_dates WHERE check_in_date >= DATEADD(day, -1, CAST(GETDATE() AS date)));

-- ============================================
-- Verification Queries (SQL Server)
-- ============================================

-- Verify table exists
-- SELECT 
--   c.TABLE_NAME,
--   c.COLUMN_NAME,
--   c.DATA_TYPE,
--   c.IS_NULLABLE,
--   c.COLUMN_DEFAULT
-- FROM INFORMATION_SCHEMA.COLUMNS c
-- WHERE c.TABLE_NAME = 'daily_checkins'
-- ORDER BY c.ORDINAL_POSITION;

-- Check constraints
-- SELECT 
--   tc.CONSTRAINT_NAME,
--   tc.CONSTRAINT_TYPE,
--   kcu.COLUMN_NAME
-- FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS tc
-- JOIN INFORMATION_SCHEMA.KEY_COLUMN_USAGE kcu
--   ON tc.CONSTRAINT_NAME = kcu.CONSTRAINT_NAME
-- WHERE tc.TABLE_NAME = 'daily_checkins';
