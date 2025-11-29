// src/routes/challenges.js
import { Router } from 'express';
import { supabase } from '../config/supabaseClient.js';

/**
 * Challenge Definitions - Daily & Weekly challenges
 * These rotate and provide time-limited goals for engagement
 */
const DAILY_CHALLENGES = [
  {
    id: 'daily_read_30',
    title: 'Reading Sprint',
    description: 'Read for 30 minutes today',
    requirement_type: 'reading_time',
    requirement_value: 30,
    reward_points: 25,
    icon: 'timer'
  },
  {
    id: 'daily_notes_3',
    title: 'Note Taker',
    description: 'Create 3 notes today',
    requirement_type: 'notes_created',
    requirement_value: 3,
    reward_points: 20,
    icon: 'edit_note'
  },
  {
    id: 'daily_pages_20',
    title: 'Page Turner',
    description: 'Read 20 pages today',
    requirement_type: 'pages_read',
    requirement_value: 20,
    reward_points: 15,
    icon: 'menu_book'
  },
  {
    id: 'daily_mentor',
    title: 'Mentor Session',
    description: 'Use the AI Mentor once',
    requirement_type: 'mentor_uses',
    requirement_value: 1,
    reward_points: 10,
    icon: 'psychology'
  },
  {
    id: 'daily_start_book',
    title: 'New Adventure',
    description: 'Start reading a new book',
    requirement_type: 'books_started',
    requirement_value: 1,
    reward_points: 30,
    icon: 'auto_stories'
  },
  {
    id: 'daily_highlight_5',
    title: 'Highlighter',
    description: 'Create 5 highlights today',
    requirement_type: 'highlights_created',
    requirement_value: 5,
    reward_points: 15,
    icon: 'highlight'
  }
];

const WEEKLY_CHALLENGES = [
  {
    id: 'weekly_complete_book',
    title: 'Book Finisher',
    description: 'Complete a book this week',
    requirement_type: 'books_completed',
    requirement_value: 1,
    reward_points: 100,
    icon: 'emoji_events'
  },
  {
    id: 'weekly_read_5h',
    title: 'Dedicated Reader',
    description: 'Read for 5 hours total this week',
    requirement_type: 'reading_time',
    requirement_value: 300,
    reward_points: 75,
    icon: 'schedule'
  },
  {
    id: 'weekly_streak_5',
    title: 'Consistency King',
    description: 'Maintain a 5-day reading streak',
    requirement_type: 'streak_maintained',
    requirement_value: 5,
    reward_points: 50,
    icon: 'local_fire_department'
  },
  {
    id: 'weekly_notes_10',
    title: 'Thoughtful Reader',
    description: 'Create 10 notes this week',
    requirement_type: 'notes_created',
    requirement_value: 10,
    reward_points: 40,
    icon: 'note_add'
  },
  {
    id: 'weekly_pages_100',
    title: 'Century Club',
    description: 'Read 100 pages this week',
    requirement_type: 'pages_read',
    requirement_value: 100,
    reward_points: 60,
    icon: 'menu_book'
  },
  {
    id: 'weekly_genres_2',
    title: 'Genre Explorer',
    description: 'Read from 2 different genres',
    requirement_type: 'unique_genres',
    requirement_value: 2,
    reward_points: 45,
    icon: 'explore'
  }
];

// Helper: Get start of today (midnight)
const getTodayStart = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today.toISOString().split('T')[0];
};

// Helper: Get start of current week (Monday)
const getWeekStart = () => {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday
  const monday = new Date(now.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday.toISOString().split('T')[0];
};

// Helper: Select N random challenges using date as seed
const selectDailyChallenges = (count = 3) => {
  const today = getTodayStart();
  // Use date string to create deterministic "random" selection
  const seed = today.split('-').reduce((acc, val) => acc + parseInt(val), 0);

  // Create shuffled copy
  const shuffled = [...DAILY_CHALLENGES].sort((a, b) => {
    const hashA = (seed * a.id.length) % 100;
    const hashB = (seed * b.id.length) % 100;
    return hashA - hashB;
  });

  return shuffled.slice(0, count);
};

// Helper: Select weekly challenges
const selectWeeklyChallenges = (count = 3) => {
  const weekStart = getWeekStart();
  const seed = weekStart.split('-').reduce((acc, val) => acc + parseInt(val), 0);

  const shuffled = [...WEEKLY_CHALLENGES].sort((a, b) => {
    const hashA = (seed * a.id.length) % 100;
    const hashB = (seed * b.id.length) % 100;
    return hashA - hashB;
  });

  return shuffled.slice(0, count);
};

// Calculate user's progress for a specific requirement type within a time period
const calculateProgress = async (userId, requirementType, periodStart) => {
  try {
    const periodStartDate = new Date(periodStart);

    switch (requirementType) {
      case 'reading_time': {
        const { data } = await supabase
          .from('reading_sessions')
          .select('duration')
          .eq('user_id', userId)
          .gte('session_date', periodStart);
        return (data || []).reduce((sum, s) => sum + (s.duration || 0), 0);
      }

      case 'notes_created': {
        const { data } = await supabase
          .from('notes')
          .select('id')
          .eq('user_id', userId)
          .eq('type', 'note')
          .gte('created_at', periodStartDate.toISOString());
        return (data || []).length;
      }

      case 'highlights_created': {
        const { data } = await supabase
          .from('notes')
          .select('id')
          .eq('user_id', userId)
          .eq('type', 'highlight')
          .gte('created_at', periodStartDate.toISOString());
        return (data || []).length;
      }

      case 'pages_read': {
        const { data } = await supabase
          .from('reading_sessions')
          .select('pages_read')
          .eq('user_id', userId)
          .gte('session_date', periodStart);
        return (data || []).reduce((sum, s) => sum + (s.pages_read || 0), 0);
      }

      case 'books_completed': {
        const { data } = await supabase
          .from('books')
          .select('id')
          .eq('user_id', userId)
          .eq('status', 'completed')
          .gte('updated_at', periodStartDate.toISOString());
        return (data || []).length;
      }

      case 'books_started': {
        const { data } = await supabase
          .from('reading_sessions')
          .select('book_id')
          .eq('user_id', userId)
          .gte('session_date', periodStart);
        // Count unique books started
        const uniqueBooks = new Set((data || []).map(s => s.book_id));
        return uniqueBooks.size;
      }

      case 'mentor_uses': {
        // Check reading_streaks for mentor interactions recorded today
        const { data } = await supabase
          .from('reading_streaks')
          .select('*')
          .eq('user_id', userId)
          .gte('streak_date', periodStart);
        // For now, count any activity as potential mentor use
        // In production, you'd have a dedicated mentor_interactions table
        return (data || []).length > 0 ? 1 : 0;
      }

      case 'streak_maintained': {
        // Get current streak from reading_streaks table
        const { data } = await supabase
          .from('reading_streaks')
          .select('streak_date')
          .eq('user_id', userId)
          .order('streak_date', { ascending: false });

        if (!data || data.length === 0) return 0;

        // Calculate consecutive days
        let streak = 0;
        let current = new Date();
        current.setHours(0, 0, 0, 0);

        for (const row of data) {
          const d = new Date(row.streak_date);
          d.setHours(0, 0, 0, 0);
          const diff = Math.floor((current - d) / (1000 * 60 * 60 * 24));
          if (diff === streak) {
            streak++;
            current.setDate(current.getDate() - 1);
          } else if (diff > streak) break;
        }
        return streak;
      }

      case 'unique_genres': {
        const { data } = await supabase
          .from('books')
          .select('genre')
          .eq('user_id', userId)
          .not('genre', 'is', null);
        const genres = new Set((data || []).map(b => b.genre).filter(Boolean));
        return genres.size;
      }

      default:
        return 0;
    }
  } catch (error) {
    console.error(`Error calculating progress for ${requirementType}:`, error);
    return 0;
  }
};

// Get or create user challenge record
const getOrCreateUserChallenge = async (userId, challengeId, periodStart, challengeType) => {
  try {
    // Check if record exists
    const { data: existing } = await supabase
      .from('user_challenges')
      .select('*')
      .eq('user_id', userId)
      .eq('challenge_id', challengeId)
      .eq('period_start', periodStart)
      .single();

    if (existing) return existing;

    // Create new record
    const { data: newRecord, error } = await supabase
      .from('user_challenges')
      .insert({
        user_id: userId,
        challenge_id: challengeId,
        challenge_type: challengeType,
        period_start: periodStart,
        progress: 0,
        is_completed: false,
        reward_claimed: false
      })
      .select()
      .single();

    if (error) {
      console.warn('Could not create user challenge record:', error.message);
      return null;
    }

    return newRecord;
  } catch (error) {
    console.warn('Error in getOrCreateUserChallenge:', error.message);
    return null;
  }
};

export const challengesRouter = (authenticateToken) => {
  const router = Router();
  router.use(authenticateToken);

  // GET /api/challenges/daily - Get today's daily challenges with progress
  router.get('/daily', async (req, res) => {
    try {
      const userId = req.user.id;
      const today = getTodayStart();

      // Get today's 3 challenges
      const todaysChallenges = selectDailyChallenges(3);

      // Calculate progress for each challenge
      const challengesWithProgress = await Promise.all(
        todaysChallenges.map(async (challenge) => {
          const progress = await calculateProgress(userId, challenge.requirement_type, today);
          const isCompleted = progress >= challenge.requirement_value;
          const progressPercent = Math.min(100, (progress / challenge.requirement_value) * 100);

          // Get or create user challenge record
          const userChallenge = await getOrCreateUserChallenge(
            userId,
            challenge.id,
            today,
            'daily'
          );

          return {
            ...challenge,
            type: 'daily',
            period_start: today,
            current_progress: progress,
            progress_percent: Math.round(progressPercent),
            is_completed: isCompleted,
            reward_claimed: userChallenge?.reward_claimed || false,
            completed_at: userChallenge?.completed_at || null
          };
        })
      );

      res.json({
        challenges: challengesWithProgress,
        period: 'daily',
        period_start: today,
        resets_at: new Date(new Date(today).getTime() + 24 * 60 * 60 * 1000).toISOString()
      });
    } catch (error) {
      console.error('Error fetching daily challenges:', error);
      res.status(500).json({ error: 'Failed to fetch daily challenges' });
    }
  });

  // GET /api/challenges/weekly - Get this week's weekly challenges with progress
  router.get('/weekly', async (req, res) => {
    try {
      const userId = req.user.id;
      const weekStart = getWeekStart();

      // Get this week's 3 challenges
      const weeksChallenges = selectWeeklyChallenges(3);

      // Calculate progress for each challenge
      const challengesWithProgress = await Promise.all(
        weeksChallenges.map(async (challenge) => {
          const progress = await calculateProgress(userId, challenge.requirement_type, weekStart);
          const isCompleted = progress >= challenge.requirement_value;
          const progressPercent = Math.min(100, (progress / challenge.requirement_value) * 100);

          // Get or create user challenge record
          const userChallenge = await getOrCreateUserChallenge(
            userId,
            challenge.id,
            weekStart,
            'weekly'
          );

          return {
            ...challenge,
            type: 'weekly',
            period_start: weekStart,
            current_progress: progress,
            progress_percent: Math.round(progressPercent),
            is_completed: isCompleted,
            reward_claimed: userChallenge?.reward_claimed || false,
            completed_at: userChallenge?.completed_at || null
          };
        })
      );

      // Calculate when week ends (next Monday)
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);

      res.json({
        challenges: challengesWithProgress,
        period: 'weekly',
        period_start: weekStart,
        resets_at: weekEnd.toISOString()
      });
    } catch (error) {
      console.error('Error fetching weekly challenges:', error);
      res.status(500).json({ error: 'Failed to fetch weekly challenges' });
    }
  });

  // GET /api/challenges/all - Get both daily and weekly challenges
  router.get('/all', async (req, res) => {
    try {
      const userId = req.user.id;
      const today = getTodayStart();
      const weekStart = getWeekStart();

      // Get challenges
      const dailyChallenges = selectDailyChallenges(3);
      const weeklyChallenges = selectWeeklyChallenges(3);

      // Calculate progress for daily
      const dailyWithProgress = await Promise.all(
        dailyChallenges.map(async (challenge) => {
          const progress = await calculateProgress(userId, challenge.requirement_type, today);
          const isCompleted = progress >= challenge.requirement_value;
          const userChallenge = await getOrCreateUserChallenge(userId, challenge.id, today, 'daily');

          return {
            ...challenge,
            type: 'daily',
            period_start: today,
            current_progress: progress,
            progress_percent: Math.min(100, Math.round((progress / challenge.requirement_value) * 100)),
            is_completed: isCompleted,
            reward_claimed: userChallenge?.reward_claimed || false
          };
        })
      );

      // Calculate progress for weekly
      const weeklyWithProgress = await Promise.all(
        weeklyChallenges.map(async (challenge) => {
          const progress = await calculateProgress(userId, challenge.requirement_type, weekStart);
          const isCompleted = progress >= challenge.requirement_value;
          const userChallenge = await getOrCreateUserChallenge(userId, challenge.id, weekStart, 'weekly');

          return {
            ...challenge,
            type: 'weekly',
            period_start: weekStart,
            current_progress: progress,
            progress_percent: Math.min(100, Math.round((progress / challenge.requirement_value) * 100)),
            is_completed: isCompleted,
            reward_claimed: userChallenge?.reward_claimed || false
          };
        })
      );

      res.json({
        daily: {
          challenges: dailyWithProgress,
          resets_at: new Date(new Date(today).getTime() + 24 * 60 * 60 * 1000).toISOString()
        },
        weekly: {
          challenges: weeklyWithProgress,
          resets_at: new Date(new Date(weekStart).getTime() + 7 * 24 * 60 * 60 * 1000).toISOString()
        }
      });
    } catch (error) {
      console.error('Error fetching all challenges:', error);
      res.status(500).json({ error: 'Failed to fetch challenges' });
    }
  });

  // POST /api/challenges/:id/claim - Claim reward for completed challenge
  router.post('/:id/claim', async (req, res) => {
    try {
      const userId = req.user.id;
      const { id: challengeId } = req.params;
      const { type, period_start } = req.body;

      if (!type || !period_start) {
        return res.status(400).json({ error: 'Challenge type and period_start are required' });
      }

      // Find the challenge definition
      const challengePool = type === 'daily' ? DAILY_CHALLENGES : WEEKLY_CHALLENGES;
      const challenge = challengePool.find(c => c.id === challengeId);

      if (!challenge) {
        return res.status(404).json({ error: 'Challenge not found' });
      }

      // Verify challenge is actually completed
      const progress = await calculateProgress(userId, challenge.requirement_type, period_start);

      if (progress < challenge.requirement_value) {
        return res.status(400).json({
          error: 'Challenge not completed yet',
          current_progress: progress,
          required: challenge.requirement_value
        });
      }

      // Check if already claimed
      const { data: existingClaim } = await supabase
        .from('user_challenges')
        .select('*')
        .eq('user_id', userId)
        .eq('challenge_id', challengeId)
        .eq('period_start', period_start)
        .single();

      if (existingClaim?.reward_claimed) {
        return res.status(400).json({ error: 'Reward already claimed' });
      }

      // Update or create the claim record
      const now = new Date().toISOString();

      if (existingClaim) {
        await supabase
          .from('user_challenges')
          .update({
            is_completed: true,
            completed_at: now,
            reward_claimed: true,
            progress: progress
          })
          .eq('id', existingClaim.id);
      } else {
        await supabase
          .from('user_challenges')
          .insert({
            user_id: userId,
            challenge_id: challengeId,
            challenge_type: type,
            period_start: period_start,
            progress: progress,
            is_completed: true,
            completed_at: now,
            reward_claimed: true
          });
      }

      console.log(`Challenge claimed: ${challengeId} by user ${userId} for ${challenge.reward_points} points`);

      res.json({
        success: true,
        challenge_id: challengeId,
        reward_points: challenge.reward_points,
        message: `Congratulations! You earned ${challenge.reward_points} points!`
      });
    } catch (error) {
      console.error('Error claiming challenge reward:', error);
      res.status(500).json({ error: 'Failed to claim reward' });
    }
  });

  // GET /api/challenges/history - Get past completed challenges
  router.get('/history', async (req, res) => {
    try {
      const userId = req.user.id;
      const limit = parseInt(req.query.limit) || 20;

      const { data, error } = await supabase
        .from('user_challenges')
        .select('*')
        .eq('user_id', userId)
        .eq('is_completed', true)
        .order('completed_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.warn('Error fetching challenge history:', error.message);
        return res.json([]);
      }

      // Enrich with challenge details
      const enrichedHistory = (data || []).map(record => {
        const challengePool = record.challenge_type === 'daily' ? DAILY_CHALLENGES : WEEKLY_CHALLENGES;
        const challenge = challengePool.find(c => c.id === record.challenge_id);

        return {
          ...record,
          title: challenge?.title || 'Unknown Challenge',
          description: challenge?.description || '',
          reward_points: challenge?.reward_points || 0,
          icon: challenge?.icon || 'emoji_events'
        };
      });

      res.json(enrichedHistory);
    } catch (error) {
      console.error('Error fetching challenge history:', error);
      res.json([]);
    }
  });

  // GET /api/challenges/stats - Get challenge completion statistics
  router.get('/stats', async (req, res) => {
    try {
      const userId = req.user.id;

      const { data, error } = await supabase
        .from('user_challenges')
        .select('challenge_type, is_completed, reward_claimed')
        .eq('user_id', userId);

      if (error) {
        console.warn('Error fetching challenge stats:', error.message);
      }

      const records = data || [];

      const stats = {
        total_challenges_completed: records.filter(r => r.is_completed).length,
        daily_completed: records.filter(r => r.challenge_type === 'daily' && r.is_completed).length,
        weekly_completed: records.filter(r => r.challenge_type === 'weekly' && r.is_completed).length,
        total_rewards_claimed: records.filter(r => r.reward_claimed).length,
        current_daily_streak: 0, // TODO: Calculate consecutive days of completing daily challenges
        best_daily_streak: 0     // TODO: Track best streak
      };

      res.json(stats);
    } catch (error) {
      console.error('Error fetching challenge stats:', error);
      res.json({
        total_challenges_completed: 0,
        daily_completed: 0,
        weekly_completed: 0,
        total_rewards_claimed: 0
      });
    }
  });

  return router;
};
