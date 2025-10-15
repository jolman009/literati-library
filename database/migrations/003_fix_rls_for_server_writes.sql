-- =====================================================
-- Literati Database Migration 003
-- Fix RLS Policies for Server-Side Authentication
-- =====================================================

-- PROBLEM: Current RLS policies use auth.uid() which only works with Supabase Auth
-- Our app uses custom JWT authentication, so server writes are blocked
-- SOLUTION: Add policies that allow service role (server) to write, while users can read their own data

-- =====================================================
-- user_actions Table - Fix Policies
-- =====================================================

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can view own actions" ON user_actions;
DROP POLICY IF EXISTS "System can insert actions" ON user_actions;

-- New policies: Users can read their own, service role can write anything
CREATE POLICY "Users can view own actions" ON user_actions
    FOR SELECT
    USING (
        auth.uid() = user_id  -- Supabase Auth users can see their own
        OR auth.jwt() ->> 'role' = 'service_role' -- Service role can see all
    );

CREATE POLICY "Service role can insert actions" ON user_actions
    FOR INSERT
    WITH CHECK (
        auth.jwt() ->> 'role' = 'service_role' -- Only service role can insert
    );

CREATE POLICY "Service role can update actions" ON user_actions
    FOR UPDATE
    USING (auth.jwt() ->> 'role' = 'service_role')
    WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- =====================================================
-- user_stats Table - Fix Policies
-- =====================================================

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view own stats" ON user_stats;
DROP POLICY IF EXISTS "System can manage stats" ON user_stats;

-- New policies
CREATE POLICY "Users can view own stats" ON user_stats
    FOR SELECT
    USING (
        auth.uid() = user_id
        OR auth.jwt() ->> 'role' = 'service_role'
    );

CREATE POLICY "Service role can manage stats" ON user_stats
    FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role')
    WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- =====================================================
-- user_achievements Table - Fix Policies
-- =====================================================

DROP POLICY IF EXISTS "Users can view own achievements" ON user_achievements;
DROP POLICY IF EXISTS "System can insert achievements" ON user_achievements;

CREATE POLICY "Users can view own achievements" ON user_achievements
    FOR SELECT
    USING (
        auth.uid() = user_id
        OR auth.jwt() ->> 'role' = 'service_role'
    );

CREATE POLICY "Service role can manage achievements" ON user_achievements
    FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role')
    WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- =====================================================
-- user_goals Table - Fix Policies
-- =====================================================

DROP POLICY IF EXISTS "Users can manage own goals" ON user_goals;

CREATE POLICY "Users can view own goals" ON user_goals
    FOR SELECT
    USING (
        auth.uid() = user_id
        OR auth.jwt() ->> 'role' = 'service_role'
    );

CREATE POLICY "Service role can manage goals" ON user_goals
    FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role')
    WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- =====================================================
-- reading_streaks Table - Fix Policies
-- =====================================================

DROP POLICY IF EXISTS "Users can manage own streaks" ON reading_streaks;

CREATE POLICY "Users can view own streaks" ON reading_streaks
    FOR SELECT
    USING (
        auth.uid() = user_id
        OR auth.jwt() ->> 'role' = 'service_role'
    );

CREATE POLICY "Service role can manage streaks" ON reading_streaks
    FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role')
    WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- =====================================================
-- Verification Query
-- =====================================================

-- Run this to verify policies are applied:
-- SELECT tablename, policyname, cmd, qual, with_check
-- FROM pg_policies
-- WHERE tablename IN ('user_actions', 'user_stats', 'user_achievements', 'user_goals', 'reading_streaks')
-- ORDER BY tablename, policyname;

-- =====================================================
-- Migration Complete
-- =====================================================

-- Summary:
-- - Changed RLS policies to allow service role (backend server) to write
-- - Users can still only read their own data
-- - Server writes using service role key will now work
-- - Frontend reads using user JWTs will work if migrated to Supabase Auth later
