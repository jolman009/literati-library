-- 016_user_interests.sql
-- Onboarding interests captured by the first-run SetupWizard (genre tags).
-- Consumed server-side by the PUT /auth/profile route. Idempotent; safe to
-- re-run. Run this in the Supabase SQL editor BEFORE deploying the matching
-- server route (so profile updates can write the column).

ALTER TABLE users ADD COLUMN IF NOT EXISTS interests JSONB DEFAULT '[]'::jsonb;
