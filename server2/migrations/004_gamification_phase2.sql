-- Migration: Gamification Phase 2
-- Features: Challenges, Leaderboards, Social Features, Streak Shields

-- ============================================
-- USER CHALLENGES TABLE
-- Tracks user progress on daily/weekly challenges
-- ============================================
CREATE TABLE IF NOT EXISTS user_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  challenge_id VARCHAR(100) NOT NULL,
  challenge_type VARCHAR(20) NOT NULL CHECK (challenge_type IN ('daily', 'weekly', 'weekend', 'special')),
  period_start DATE NOT NULL,
  progress INTEGER DEFAULT 0,
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  reward_claimed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Prevent duplicate challenge entries for same period
  UNIQUE(user_id, challenge_id, period_start)
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_user_challenges_user_id ON user_challenges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_challenges_period ON user_challenges(period_start, challenge_type);
CREATE INDEX IF NOT EXISTS idx_user_challenges_completed ON user_challenges(user_id, is_completed);

-- ============================================
-- USER FOLLOWS TABLE
-- Social following system for friend leaderboards
-- ============================================
CREATE TABLE IF NOT EXISTS user_follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Prevent duplicate follows
  UNIQUE(follower_id, following_id),

  -- Cannot follow yourself
  CHECK (follower_id != following_id)
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_user_follows_follower ON user_follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_user_follows_following ON user_follows(following_id);

-- ============================================
-- USER SETTINGS TABLE
-- Privacy and display preferences
-- ============================================
CREATE TABLE IF NOT EXISTS user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,

  -- Leaderboard settings
  leaderboard_visible BOOLEAN DEFAULT true,
  display_name VARCHAR(100),

  -- Notification preferences
  challenge_notifications BOOLEAN DEFAULT true,
  achievement_notifications BOOLEAN DEFAULT true,
  streak_notifications BOOLEAN DEFAULT true,

  -- Streak shields
  streak_shields INTEGER DEFAULT 0,
  max_streak_shields INTEGER DEFAULT 3,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);

-- ============================================
-- STREAK SHIELDS LOG
-- Track when shields are earned and used
-- ============================================
CREATE TABLE IF NOT EXISTS streak_shield_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action VARCHAR(20) NOT NULL CHECK (action IN ('earned', 'used', 'expired')),
  shield_count INTEGER NOT NULL,
  streak_at_action INTEGER,
  reason VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_streak_shield_log_user ON streak_shield_log(user_id);

-- ============================================
-- LEADERBOARD CACHE TABLE (Optional - for performance)
-- Pre-computed leaderboard rankings updated periodically
-- ============================================
CREATE TABLE IF NOT EXISTS leaderboard_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  period_type VARCHAR(20) NOT NULL CHECK (period_type IN ('weekly', 'monthly', 'all_time')),
  period_start DATE,
  total_points INTEGER DEFAULT 0,
  rank INTEGER,
  books_completed INTEGER DEFAULT 0,
  reading_streak INTEGER DEFAULT 0,
  total_reading_time INTEGER DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(user_id, period_type, period_start)
);

CREATE INDEX IF NOT EXISTS idx_leaderboard_cache_period ON leaderboard_cache(period_type, period_start, rank);

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to user_challenges
DROP TRIGGER IF EXISTS update_user_challenges_updated_at ON user_challenges;
CREATE TRIGGER update_user_challenges_updated_at
  BEFORE UPDATE ON user_challenges
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to user_settings
DROP TRIGGER IF EXISTS update_user_settings_updated_at ON user_settings;
CREATE TRIGGER update_user_settings_updated_at
  BEFORE UPDATE ON user_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on new tables
ALTER TABLE user_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE streak_shield_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboard_cache ENABLE ROW LEVEL SECURITY;

-- user_challenges: Users can only access their own challenges
CREATE POLICY user_challenges_policy ON user_challenges
  FOR ALL USING (auth.uid() = user_id OR user_id = current_setting('app.current_user_id', true)::uuid);

-- user_follows: Users can see follows involving them
CREATE POLICY user_follows_select_policy ON user_follows
  FOR SELECT USING (true); -- Anyone can see follow relationships

CREATE POLICY user_follows_insert_policy ON user_follows
  FOR INSERT WITH CHECK (auth.uid() = follower_id OR follower_id = current_setting('app.current_user_id', true)::uuid);

CREATE POLICY user_follows_delete_policy ON user_follows
  FOR DELETE USING (auth.uid() = follower_id OR follower_id = current_setting('app.current_user_id', true)::uuid);

-- user_settings: Users can only access their own settings
CREATE POLICY user_settings_policy ON user_settings
  FOR ALL USING (auth.uid() = user_id OR user_id = current_setting('app.current_user_id', true)::uuid);

-- streak_shield_log: Users can only access their own logs
CREATE POLICY streak_shield_log_policy ON streak_shield_log
  FOR ALL USING (auth.uid() = user_id OR user_id = current_setting('app.current_user_id', true)::uuid);

-- leaderboard_cache: Anyone can read (it's public), only system can write
CREATE POLICY leaderboard_cache_select_policy ON leaderboard_cache
  FOR SELECT USING (true);

-- ============================================
-- INITIAL DATA / SEED
-- ============================================

-- Grant initial streak shield to all existing users with 7+ day streaks
-- (Run this separately if needed)
-- INSERT INTO user_settings (user_id, streak_shields)
-- SELECT DISTINCT user_id, 1
-- FROM reading_streaks rs
-- WHERE NOT EXISTS (SELECT 1 FROM user_settings WHERE user_id = rs.user_id)
-- GROUP BY user_id
-- HAVING COUNT(DISTINCT streak_date) >= 7;

COMMENT ON TABLE user_challenges IS 'Tracks user progress on daily and weekly challenges';
COMMENT ON TABLE user_follows IS 'Social following relationships for friend leaderboards';
COMMENT ON TABLE user_settings IS 'User preferences for privacy, notifications, and gamification';
COMMENT ON TABLE streak_shield_log IS 'Audit log for streak shield earning and usage';
COMMENT ON TABLE leaderboard_cache IS 'Pre-computed leaderboard rankings for performance';
