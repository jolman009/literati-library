# Gamification Enhancement Plan

## Overview
This plan outlines new features to add and enhancements to existing gamification elements in the ShelfQuest library app.

---

## PART 1: NEW FEATURES (Missing Elements)

### 1.1 Leaderboard System

**Purpose**: Add friendly competition and social motivation through rankings.

**Proposed Features**:
- **Global Leaderboard**: Top readers by total points
- **Weekly Leaderboard**: Resets every Monday, fresh competition
- **Monthly Leaderboard**: Monthly champions with special recognition
- **Streak Leaderboard**: Longest current reading streaks
- **Category Leaderboards**: Books completed, notes created, reading time

**Implementation Approach**:

**Option A: Simple Anonymous Leaderboard** (Recommended for MVP)
- Show usernames (or anonymous handles) with rankings
- Update daily via server cron job
- Minimal privacy concerns
- Lower complexity

**Option B: Full Social Leaderboard**
- Friend system with following
- Private/public profile toggle
- More engaging but higher complexity

**Database Changes**:
```sql
CREATE TABLE leaderboards (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  period_type VARCHAR(20), -- 'weekly', 'monthly', 'all_time'
  period_start DATE,
  total_points INTEGER,
  rank INTEGER,
  books_completed INTEGER,
  reading_streak INTEGER,
  updated_at TIMESTAMP
);

CREATE INDEX idx_leaderboards_period ON leaderboards(period_type, period_start, rank);
```

**New Files**:
- `client2/src/pages/LeaderboardPage.jsx`
- `client2/src/components/gamification/LeaderboardCard.jsx`
- `client2/src/styles/leaderboard.css`
- `server2/src/routes/leaderboard.js`

**API Endpoints**:
- `GET /api/leaderboard/:type` (weekly, monthly, all_time)
- `GET /api/leaderboard/user/:userId/rank`

---

### 1.2 Daily & Weekly Challenges System

**Purpose**: Time-limited goals that create urgency and routine engagement.

**Proposed Challenge Types**:

**Daily Challenges** (Reset at midnight):
- "Read for 30 minutes today" - 25 bonus points
- "Create 3 notes today" - 20 bonus points
- "Start a new book" - 30 bonus points
- "Read 20 pages" - 15 bonus points
- "Use the AI Mentor" - 10 bonus points

**Weekly Challenges** (Reset every Monday):
- "Complete a book this week" - 100 bonus points
- "Read for 5 hours total" - 75 bonus points
- "Maintain a 5-day streak" - 50 bonus points
- "Create 10 notes" - 40 bonus points
- "Read from 3 different genres" - 60 bonus points

**Special Weekend Challenges** (Sat-Sun only):
- "Weekend Reader: Read for 2 hours" - 50 bonus points
- "Bookworm Weekend: Finish a book" - 150 bonus points

**Database Changes**:
```sql
CREATE TABLE challenges (
  id UUID PRIMARY KEY,
  title VARCHAR(255),
  description TEXT,
  type VARCHAR(20), -- 'daily', 'weekly', 'weekend', 'special'
  requirement_type VARCHAR(50), -- 'reading_time', 'pages', 'notes', etc.
  requirement_value INTEGER,
  reward_points INTEGER,
  icon VARCHAR(50),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP
);

CREATE TABLE user_challenges (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  challenge_id UUID REFERENCES challenges(id),
  period_start DATE,
  progress INTEGER DEFAULT 0,
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP,
  reward_claimed BOOLEAN DEFAULT false,
  created_at TIMESTAMP,
  UNIQUE(user_id, challenge_id, period_start)
);
```

**New Files**:
- `client2/src/components/gamification/DailyChallenges.jsx`
- `client2/src/components/gamification/WeeklyChallenges.jsx`
- `client2/src/components/gamification/ChallengeCard.jsx`
- `server2/src/routes/challenges.js`
- `server2/src/services/challengeService.js`

**API Endpoints**:
- `GET /api/challenges/daily` - Get today's challenges
- `GET /api/challenges/weekly` - Get this week's challenges
- `POST /api/challenges/:id/claim` - Claim reward
- `GET /api/challenges/history` - Past completed challenges

---

### 1.3 Reading Quests/Missions System

**Purpose**: Multi-step journeys that guide users through themed reading experiences.

**Proposed Quest Types**:

**Starter Quests** (One-time, for new users):
1. "First Steps" - Upload first book, read for 10 min, create first note
2. "Getting Started" - Complete first book, set a goal, earn 100 points
3. "Building Habits" - Achieve 3-day streak, use mentor, explore achievements

**Recurring Quests**:
1. "Weekly Reader" - Read 5 days this week, read 3 hours, create 5 notes
2. "Genre Explorer" - Read from 2 different genres this month
3. "Note Master" - Create 20 notes this week

**Seasonal/Special Quests**:
1. "Summer Reading Challenge" - Complete 10 books over summer
2. "Holiday Reading Marathon" - Read for 10 hours during holiday week

**Database Changes**:
```sql
CREATE TABLE quests (
  id UUID PRIMARY KEY,
  title VARCHAR(255),
  description TEXT,
  quest_type VARCHAR(20), -- 'starter', 'recurring', 'seasonal'
  steps JSONB, -- Array of step definitions
  total_reward_points INTEGER,
  icon VARCHAR(50),
  start_date DATE,
  end_date DATE,
  is_active BOOLEAN DEFAULT true
);

CREATE TABLE user_quests (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  quest_id UUID REFERENCES quests(id),
  current_step INTEGER DEFAULT 0,
  step_progress JSONB, -- Progress for each step
  is_completed BOOLEAN DEFAULT false,
  started_at TIMESTAMP,
  completed_at TIMESTAMP
);
```

---

## PART 2: ENHANCEMENTS TO EXISTING FEATURES

### 2.1 Enhanced Achievement System

**Current State**: 37 achievements, 6 categories, 5 tiers

**Proposed Enhancements**:

1. **Achievement Showcase/Display Case**
   - Featured achievements on profile
   - Animated achievement frames for rare ones
   - "Pin" favorite achievements

2. **Achievement Progress Tracking**
   - Show progress toward locked achievements
   - "X more books until Bibliophile"
   - Progress bars on achievement cards

3. **New Achievement Categories**:
   - **Speed Achievements**: "Read 50 pages in under an hour"
   - **Consistency Achievements**: "Read at the same time 5 days in a row"
   - **Completionist Achievements**: "Unlock all Bronze achievements"
   - **Hidden/Easter Egg Achievements**: More secret achievements

4. **Achievement Rarity Display**:
   - Show percentage of users who have each achievement
   - "Only 5% of readers have this!"

**Implementation**:
- Add `rarity_percentage` field calculated weekly
- Add `is_featured` and `display_order` to user_achievements
- New component: `AchievementShowcase.jsx`

---

### 2.2 Enhanced Streak System

**Current State**: Activity-based streaks with milestone rewards

**Proposed Enhancements**:

1. **Streak Freeze/Shield**
   - Earn "Streak Shields" as rewards (e.g., at 7-day, 30-day milestones)
   - Use one shield to protect streak for one missed day
   - Max 3 shields stored at a time

2. **Streak Recovery**
   - "Recovery Challenge": If streak breaks, complete a challenge to partially restore
   - "Read for 1 hour within 24 hours to recover 50% of your streak"

3. **Streak Multipliers**
   - Longer streaks = bonus point multiplier
   - 7-day streak: 1.1x points
   - 14-day streak: 1.2x points
   - 30-day streak: 1.5x points

4. **Visual Streak Enhancements**
   - Fire animation intensity increases with streak length
   - Streak calendar heatmap view
   - Streak milestone celebrations

**Database Changes**:
```sql
ALTER TABLE users ADD COLUMN streak_shields INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN streak_multiplier DECIMAL(3,2) DEFAULT 1.0;

CREATE TABLE streak_history (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  streak_length INTEGER,
  started_at DATE,
  ended_at DATE,
  end_reason VARCHAR(50) -- 'broken', 'shield_used', 'ongoing'
);
```

---

### 2.3 Enhanced Level/Tier System

**Current State**: 10 levels, 6 tiers with theme unlocks

**Proposed Enhancements**:

1. **Prestige System**
   - After reaching Level 10, "Prestige" to reset level but keep achievements
   - Prestige levels: Star 1, Star 2, Star 3, etc.
   - Special prestige badges and frames

2. **Level-Up Rewards**
   - Each level up grants a small reward (streak shield, bonus points, etc.)
   - Random "loot box" style rewards for excitement

3. **Tier Perks**
   - Higher tiers unlock actual features:
     - Scholar: Custom reading goal templates
     - Sage: Priority AI mentor access
     - Master: Export statistics
     - Legend: Beta features early access

4. **XP Boost Events**
   - "Double XP Weekends" for engagement
   - "Reading Week" with 1.5x points

---

### 2.4 Enhanced Goal System

**Current State**: Custom goals with pages/time/streak/books types

**Proposed Enhancements**:

1. **Smart Goal Suggestions**
   - AI-powered goal recommendations based on user patterns
   - "Based on your reading pace, try reading 150 pages this week"

2. **Goal Templates Library**
   - Pre-made goal templates:
     - "Book-a-Month Club": 1 book per month
     - "Power Hour": 60 minutes daily for 7 days
     - "Note Ninja": 5 notes per book

3. **Collaborative Goals** (Social Feature)
   - Group goals: "Our team reads 50 books this month"
   - Shared progress tracking

4. **Goal Streaks**
   - Completing goals consecutively builds a "goal streak"
   - Bonus points for goal streak milestones

---

### 2.5 Points System Enhancements

**Current State**: Fixed point values per action

**Proposed Enhancements**:

1. **Combo System**
   - Rapid actions earn combo multipliers
   - "Reading Combo: 3 pages in a row = 1.5x points"
   - Combo timer (5 minutes between actions)

2. **Bonus Point Events**
   - Random "bonus point" opportunities
   - "Surprise! Double points for next 10 minutes"

3. **Point Categories Visualization**
   - Detailed breakdown pie chart
   - "Your points come from: 45% reading, 30% notes, 25% books"

4. **Points Spending** (Optional Gamification Currency)
   - Spend points on:
     - Custom profile themes
     - Achievement frames
     - Profile badges
     - Streak shields

---

## PART 3: UI/UX ENHANCEMENTS

### 3.1 Gamification Hub Page

Create a central hub that consolidates all gamification features:
- Daily/Weekly challenges at top
- Current quests progress
- Leaderboard preview
- Achievement showcase
- Stats overview

**New File**: `client2/src/pages/GamificationHubPage.jsx`

### 3.2 Notification & Celebration System

Enhance feedback for gamification events:
- Toast notifications for achievements
- Full-screen celebration for major milestones
- Sound effects (optional, toggleable)
- Haptic feedback on mobile

### 3.3 Progress Dashboard Widget

Add gamification widget to main dashboard:
- Mini streak display
- Today's challenge progress
- Points earned today
- Next achievement preview

---

## PART 4: IMPLEMENTATION PRIORITY

### Phase 1: Quick Wins (1-2 weeks)
1. Daily Challenges system
2. Achievement progress tracking
3. Streak multipliers
4. Enhanced notifications

### Phase 2: Core Features (2-4 weeks)
1. Weekly Challenges
2. Leaderboard (simple version)
3. Streak shields/recovery
4. Goal templates

### Phase 3: Advanced Features (4-6 weeks)
1. Quest/Mission system
2. Prestige system
3. Points spending shop
4. Social/collaborative goals

---

## PART 5: TECHNICAL CONSIDERATIONS

### Performance
- Cache leaderboard data (update every 15 min, not real-time)
- Use database indexes for challenge/quest queries
- Lazy load gamification components

### Offline Support
- Queue challenge completions for sync
- Local challenge progress tracking
- Optimistic UI updates

### Database Migrations
- All new tables should have proper indexes
- Consider data archival for old challenge/quest data

---

## Questions for User

Before implementation, please clarify:

1. **Leaderboard Scope**:
   - Global leaderboard or opt-in only?
   - Anonymous usernames or real names?

2. **Challenge Frequency**:
   - How many daily challenges? (Suggest: 3-5)
   - Should challenges be randomized or curated?

3. **Rewards Balance**:
   - Should new features inflate point economy?
   - Need to rebalance existing point values?

4. **Social Features**:
   - Interest in friend/following system?
   - Collaborative goals priority?

5. **Implementation Priority**:
   - Which features are highest priority?
   - Any features to skip entirely?
