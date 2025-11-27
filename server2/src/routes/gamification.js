// src/routes/gamification.js
import { Router } from 'express';
import { supabase } from '../config/supabaseClient.js';

// Achievement definitions (synchronized with client)
const ACHIEVEMENTS = {
  FIRST_BOOK: { id: 'first_book', title: 'First Steps', description: 'Upload your first book', points: 50, icon: '📚', threshold: 1, type: 'books_uploaded' },
  BOOKWORM: { id: 'bookworm', title: 'Bookworm', description: 'Upload 10 books', points: 200, icon: '🐛', threshold: 10, type: 'books_uploaded' },
  COLLECTOR: { id: 'collector', title: 'Collector', description: 'Upload 25 books', points: 500, icon: '📖', threshold: 25, type: 'books_uploaded' },
  LIBRARIAN: { id: 'librarian', title: 'Librarian', description: 'Upload 50 books', points: 1000, icon: '📚', threshold: 50, type: 'books_uploaded' },

  EARLY_BIRD: { id: 'early_bird', title: 'Early Bird', description: 'Read before 8 AM', points: 75, icon: '🌅', type: 'time_based' },
  NIGHT_OWL: { id: 'night_owl', title: 'Night Owl', description: 'Read after 10 PM', points: 75, icon: '🦉', type: 'time_based' },
  SPEED_READER: { id: 'speed_reader', title: 'Speed Reader', description: 'Read 100 pages in one session', points: 150, icon: '⚡', threshold: 100, type: 'pages_per_session' },
  MARATHON_READER: { id: 'marathon_reader', title: 'Marathon Reader', description: 'Read for 2+ hours straight', points: 200, icon: '🏃', threshold: 120, type: 'minutes_per_session' },

  STREAK_3: { id: 'streak_3', title: '3-Day Streak', description: 'Read for 3 consecutive days', points: 100, icon: '🔥', threshold: 3, type: 'reading_streak' },
  STREAK_7: { id: 'streak_7', title: 'Week Warrior', description: 'Read for 7 consecutive days', points: 250, icon: '🔥', threshold: 7, type: 'reading_streak' },
  STREAK_30: { id: 'streak_30', title: 'Monthly Master', description: 'Read for 30 consecutive days', points: 1000, icon: '🔥', threshold: 30, type: 'reading_streak' },

  NOTE_TAKER: { id: 'note_taker', title: 'Note Taker', description: 'Create 10 notes', points: 150, icon: '📝', threshold: 10, type: 'notes_created' },
  HIGHLIGHTER: { id: 'highlighter', title: 'Highlighter', description: 'Create 25 highlights', points: 200, icon: '✏️', threshold: 25, type: 'highlights_created' },

  FINISHER: { id: 'finisher', title: 'Finisher', description: 'Complete your first book', points: 100, icon: '✅', threshold: 1, type: 'books_completed' },
  COMPLETIONIST: { id: 'completionist', title: 'Completionist', description: 'Complete 10 books', points: 500, icon: '🏆', threshold: 10, type: 'books_completed' },
};

// Helpers
const calculateUserLevel = (points) => {
  const thresholds = [
    { level: 1, points: 0 },
    { level: 2, points: 100 },
    { level: 3, points: 300 },
    { level: 4, points: 600 },
    { level: 5, points: 1000 },
    { level: 6, points: 1500 },
    { level: 7, points: 2500 },
    { level: 8, points: 4000 },
    { level: 9, points: 6000 },
    { level: 10, points: 10000 },
  ];
  for (let i = thresholds.length - 1; i >= 0; i--) {
    if (points >= thresholds[i].points) return thresholds[i].level;
  }
  return 1;
};

const getUserPoints = async (userId) => {
  try {
    // Calculate points from actual activity tables (user_actions table deleted)
    const [{ data: books }, { data: notes }, { data: sessions }] = await Promise.all([
      supabase.from('books').select('id').eq('user_id', userId),
      supabase.from('notes').select('type').eq('user_id', userId),
      supabase.from('reading_sessions').select('duration').eq('user_id', userId),
    ]);

    // Point values
    const BOOK_UPLOAD_POINTS = 25;
    const NOTE_POINTS = 15;
    const HIGHLIGHT_POINTS = 10;
    const SESSION_COMPLETION_POINTS = 10;
    const TIME_POINTS_PER_MINUTE = 1;

    let totalPoints = 0;

    // Books: 25 points each
    totalPoints += (books || []).length * BOOK_UPLOAD_POINTS;

    // Notes: 15 points per note, 10 per highlight
    const notesList = notes || [];
    totalPoints += notesList.filter(n => n.type === 'note').length * NOTE_POINTS;
    totalPoints += notesList.filter(n => n.type === 'highlight').length * HIGHLIGHT_POINTS;

    // Reading sessions: 10 points completion + 1 per minute
    const sessionsList = sessions || [];
    totalPoints += sessionsList.length * SESSION_COMPLETION_POINTS;
    totalPoints += sessionsList.reduce((sum, s) => sum + (s.duration || 0), 0) * TIME_POINTS_PER_MINUTE;

    return totalPoints;
  } catch (e) {
    console.error('Error calculating user points:', e);
    return 0;
  }
};

// Record daily activity to reading_streaks table (enables activity-based streak tracking)
// This function is called when users: open a book, upload a book, create a note, or interact with mentor
const recordDailyActivity = async (userId, activityType = 'general') => {
  try {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

    // Check if there's already a record for today
    const { data: existingRecord, error: selectError } = await supabase
      .from('reading_streaks')
      .select('*')
      .eq('user_id', userId)
      .eq('streak_date', today)
      .single();

    if (selectError && selectError.code !== 'PGRST116') {
      // PGRST116 = no rows found (expected for first activity of the day)
      console.warn('⚠️ Error checking existing streak record:', selectError.message);
    }

    if (existingRecord) {
      // Update existing record for today - increment relevant counter
      const updates = { updated_at: new Date().toISOString() };

      if (activityType === 'reading') {
        updates.reading_time = (existingRecord.reading_time || 0) + 1;
      } else if (activityType === 'note') {
        updates.notes_created = (existingRecord.notes_created || 0) + 1;
      } else if (activityType === 'highlight') {
        updates.highlights_created = (existingRecord.highlights_created || 0) + 1;
      }

      const { error: updateError } = await supabase
        .from('reading_streaks')
        .update(updates)
        .eq('id', existingRecord.id);

      if (updateError) {
        console.warn('⚠️ Failed to update streak record:', updateError.message);
      } else {
        console.log(`✅ Daily activity recorded (updated): ${activityType} for user ${userId}`);
      }
      return { success: true, isNewDay: false };
    }

    // Insert new record for today (first activity of the day)
    const { error: insertError } = await supabase
      .from('reading_streaks')
      .insert([{
        user_id: userId,
        streak_date: today,
        reading_time: activityType === 'reading' ? 1 : 0,
        pages_read: 0,
        books_completed: 0,
        notes_created: activityType === 'note' ? 1 : 0,
        highlights_created: activityType === 'highlight' ? 1 : 0
      }]);

    if (insertError) {
      console.warn('⚠️ Failed to insert streak record:', insertError.message);
      return { success: false, error: insertError.message };
    }

    console.log(`✅ Daily activity recorded (new day): ${activityType} for user ${userId}`);
    return { success: true, isNewDay: true };
  } catch (e) {
    console.error('Error recording daily activity:', e);
    return { success: false, error: e.message };
  }
};

// Calculate reading streak from reading_streaks table (activity-based, not button-based)
const calculateReadingStreak = async (userId) => {
  try {
    // Query the reading_streaks table for consecutive days with activity
    const { data, error } = await supabase
      .from('reading_streaks')
      .select('streak_date')
      .eq('user_id', userId)
      .order('streak_date', { ascending: false });

    if (error) {
      console.warn('⚠️ Error querying reading_streaks, falling back to reading_sessions:', error.message);
      // Fallback to reading_sessions if reading_streaks table doesn't exist
      return await calculateReadingStreakFromSessions(userId);
    }

    if (!data?.length) return 0;

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

    console.log(`📊 Calculated activity streak for user ${userId}: ${streak} days`);
    return streak;
  } catch (e) {
    console.error('Error calculating reading streak:', e);
    return 0;
  }
};

// Fallback streak calculation from reading_sessions (legacy support)
const calculateReadingStreakFromSessions = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('reading_sessions')
      .select('session_date')
      .eq('user_id', userId)
      .order('session_date', { ascending: false });

    if (error || !data?.length) return 0;

    let streak = 0;
    let current = new Date();
    current.setHours(0, 0, 0, 0);

    for (const row of data) {
      const d = new Date(row.session_date);
      d.setHours(0, 0, 0, 0);
      const diff = Math.floor((current - d) / (1000 * 60 * 60 * 24));
      if (diff === streak) {
        streak++;
        current.setDate(current.getDate() - 1);
      } else if (diff > streak) break;
    }
    return streak;
  } catch (e) {
    console.error('Error calculating reading streak from sessions:', e);
    return 0;
  }
};

// Get user's unlocked achievements
const getUserAchievements = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('user_achievements')
      .select('achievement_id, unlocked_at')
      .eq('user_id', userId);

    if (error && error.code !== 'PGRST116') { // Ignore "table not found" errors
      console.error('Error fetching achievements:', error);
      return [];
    }

    return data || [];
  } catch (e) {
    console.warn('Achievements table not available:', e.message);
    return [];
  }
};

// Check and unlock achievements based on current stats
const checkAchievements = async (userId, currentStats) => {
  const unlockedAchievements = await getUserAchievements(userId);
  const unlockedIds = new Set(unlockedAchievements.map(a => a.achievement_id));
  const newlyUnlocked = [];

  for (const achievement of Object.values(ACHIEVEMENTS)) {
    if (unlockedIds.has(achievement.id)) continue;

    let shouldUnlock = false;

    switch (achievement.type) {
      case 'books_uploaded':
        shouldUnlock = currentStats.booksRead >= achievement.threshold;
        break;
      case 'books_completed':
        shouldUnlock = currentStats.booksCompleted >= achievement.threshold;
        break;
      case 'notes_created':
        shouldUnlock = currentStats.notesCreated >= achievement.threshold;
        break;
      case 'highlights_created':
        shouldUnlock = currentStats.highlightsCreated >= achievement.threshold;
        break;
      case 'reading_streak':
        shouldUnlock = currentStats.readingStreak >= achievement.threshold;
        break;
      // time_based, pages_per_session, minutes_per_session can be checked in real-time during actions
    }

    if (shouldUnlock) {
      try {
        const unlockedAt = new Date().toISOString();
        // Record unlock in achievements table (idempotency handled at DB or by the absence of prior record)
        await supabase.from('user_achievements').insert({
          user_id: userId,
          achievement_id: achievement.id,
          unlocked_at: unlockedAt
        });

        // Note: Achievement points are now tracked via getUserPoints() calculation
        // from actual activity tables, not user_actions table (which was deleted)

        newlyUnlocked.push(achievement);
      } catch (dbErr) {
        console.warn('Failed to persist achievement unlock:', dbErr?.message || dbErr);
      }
    }
  }

  return newlyUnlocked;
};

// Helper: Format action names into user-friendly labels
const formatActionLabel = (action) => {
  const labels = {
    'note_created': 'Created Note',
    'highlight_created': 'Created Highlight',
    'book_uploaded': 'Uploaded Book',
    'page_read': 'Read Page',
    'pages_read': 'Read Pages',
    'reading_session_started': 'Started Reading Session',
    'reading_session_completed': 'Completed Reading Session',
    'reading_time': 'Reading Time',
    'book_completed': 'Completed Book',
    'daily_login': 'Daily Login',
    'daily_checkin': 'Daily Check-in'
  };
  return labels[action] || action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

// Helper: Get icon for action type
const getActionIcon = (action) => {
  const icons = {
    'note_created': '📋',
    'highlight_created': '✏️',
    'book_uploaded': '📤',
    'page_read': '📄',
    'pages_read': '📖',
    'reading_session_started': '🚀',
    'reading_session_completed': '✅',
    'reading_time': '⏱️',
    'book_completed': '🎉',
    'daily_login': '🌅',
    'daily_checkin': '✔️'
  };
  return icons[action] || '⭐';
};

// Helper: Calculate time ago in human-readable format
const getTimeAgo = (date) => {
  const seconds = Math.floor((new Date() - date) / 1000);

  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;

  return date.toLocaleDateString();
};

export const gamificationRouter = (authenticateToken) => {
  const router = Router();
  router.use(authenticateToken);

  // GET /api/gamification/stats
  router.get('/stats', async (req, res) => {
    try {
      const userId = req.user.id;

      const [{ data: books }, { data: sessions }, { data: notes }] = await Promise.all([
        supabase.from('books').select('*').eq('user_id', userId),
        supabase.from('reading_sessions').select('*').eq('user_id', userId),
        supabase.from('notes').select('type').eq('user_id', userId),
      ]);

      const totalPoints = await getUserPoints(userId);
      const readingStreak = await calculateReadingStreak(userId);

      // Calculate time-based stats
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);
      const monthAgo = new Date(today);
      monthAgo.setMonth(monthAgo.getMonth() - 1);

      const todayReadingTime = (sessions || [])
        .filter(s => new Date(s.session_date) >= today)
        .reduce((sum, s) => sum + (s.duration || 0), 0);

      const weeklyReadingTime = (sessions || [])
        .filter(s => new Date(s.session_date) >= weekAgo)
        .reduce((sum, s) => sum + (s.duration || 0), 0);

      const monthlyReadingTime = (sessions || [])
        .filter(s => new Date(s.session_date) >= monthAgo)
        .reduce((sum, s) => sum + (s.duration || 0), 0);

      const stats = {
        totalPoints,
        level: calculateUserLevel(totalPoints),
        booksRead: books?.length || 0,
        booksCompleted: (books || []).filter(b => b.status === 'completed').length || 0,
        pagesRead: (books || []).reduce((sum, b) => sum + (b.pages_read || 0), 0) || 0,
        totalReadingTime: (sessions || []).reduce((sum, s) => sum + (s.duration || 0), 0) || 0,
        sessionsCompleted: sessions?.length || 0, // ✅ FIX: Add session count for Dashboard
        readingStreak,
        notesCreated: (notes || []).filter(n => n.type === 'note').length || 0,
        highlightsCreated: (notes || []).filter(n => n.type === 'highlight').length || 0,
        todayReadingTime,
        weeklyReadingTime,
        monthlyReadingTime,
        averageSessionDuration: (sessions?.length || 0) > 0
          ? Math.round((sessions || []).reduce((sum, s) => sum + (s.duration || 0), 0) / sessions.length)
          : 0,
      };

      // Check for newly unlocked achievements
      const newlyUnlocked = await checkAchievements(userId, stats);

      res.json({
        ...stats,
        newlyUnlockedAchievements: newlyUnlocked
      });
    } catch (e) {
      console.error('Error fetching gamification stats:', e);
      res.status(500).json({ error: 'Failed to fetch stats' });
    }
  });

  // GET /api/gamification/achievements
  router.get('/achievements', async (req, res) => {
    try {
      const userId = req.user.id;
      const userAchievements = await getUserAchievements(userId);

      // Return achievements with unlock status and dates
      const achievementsWithStatus = Object.values(ACHIEVEMENTS).map(achievement => {
        const userAchievement = userAchievements.find(ua => ua.achievement_id === achievement.id);
        return {
          ...achievement,
          isUnlocked: !!userAchievement,
          unlockedAt: userAchievement?.unlocked_at || null
        };
      });

      res.json(achievementsWithStatus);
    } catch (e) {
      console.error('Error fetching achievements:', e);
      res.status(500).json({ error: 'Failed to fetch achievements' });
    }
  });

  // GET /api/gamification/goals
  router.get('/goals', async (req, res) => {
    try {
      const userId = req.user.id;

      // Try to get user goals from database, fallback to auto-generated goals
      let userGoals = [];
      try {
        const { data, error } = await supabase
          .from('user_goals')
          .select('*')
          .eq('user_id', userId)
          .eq('is_active', true);

        if (!error) {
          userGoals = data || [];
        }
      } catch (dbErr) {
        console.warn('Goals table not available, generating default goals:', dbErr.message);
      }

      // If no custom goals, generate smart defaults based on user stats
      if (userGoals.length === 0) {
        const [{ data: books }, { data: sessions }] = await Promise.all([
          supabase.from('books').select('*').eq('user_id', userId),
          supabase.from('reading_sessions').select('*').eq('user_id', userId),
        ]);

        const currentBooksRead = books?.length || 0;
        const totalReadingTime = (sessions || []).reduce((sum, s) => sum + (s.duration || 0), 0);
        const averageSessionTime = sessions?.length > 0 ? totalReadingTime / sessions.length : 30;

        // Generate adaptive goals based on current progress
        const today = new Date();
        const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        const daysLeftInMonth = Math.ceil((endOfMonth - today) / (1000 * 60 * 60 * 24));

        userGoals = [
          {
            id: 'monthly_books',
            title: 'Monthly Reading Goal',
            description: `Read ${Math.max(2, Math.ceil(currentBooksRead / 4))} books this month`,
            type: 'books_completed',
            target: Math.max(2, Math.ceil(currentBooksRead / 4)),
            current: 0, // Would need to calculate current month's completed books
            deadline: endOfMonth.toISOString(),
            points: 200,
            period: 'monthly'
          },
          {
            id: 'weekly_reading_time',
            title: 'Weekly Reading Time',
            description: 'Read for 5 hours this week',
            type: 'reading_time',
            target: 300, // 5 hours in minutes
            current: 0, // Would need to calculate current week's reading time
            deadline: new Date(today.getTime() + (7 - today.getDay()) * 24 * 60 * 60 * 1000).toISOString(),
            points: 100,
            period: 'weekly'
          },
          {
            id: 'daily_streak',
            title: 'Reading Streak',
            description: 'Maintain a 7-day reading streak',
            type: 'reading_streak',
            target: 7,
            current: await calculateReadingStreak(userId),
            deadline: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            points: 150,
            period: 'ongoing'
          }
        ];
      }

      res.json(userGoals);
    } catch (e) {
      console.error('Error fetching goals:', e);
      res.status(500).json({ error: 'Failed to fetch goals' });
    }
  });

  // GET /api/gamification/actions/breakdown - Get points broken down by action type
  router.get('/actions/breakdown', async (req, res) => {
    try {
      const userId = req.user.id;

      const { data, error } = await supabase
        .from('user_actions')
        .select('action, points')
        .eq('user_id', userId);

      // Handle table not found or other errors gracefully
      if (error) {
        console.warn('user_actions table query failed:', error.message);
        // Return empty data instead of throwing
        return res.json({
          breakdown: [],
          categories: {
            reading: 0,
            notes: 0,
            library: 0,
            total: 0
          }
        });
      }

      // Group by action type and sum points
      const breakdown = (data || []).reduce((acc, row) => {
        const action = row.action;
        if (!acc[action]) {
          acc[action] = {
            action,
            totalPoints: 0,
            count: 0
          };
        }
        acc[action].totalPoints += row.points || 0;
        acc[action].count += 1;
        return acc;
      }, {});

      // Calculate category totals
      const categoryTotals = {
        reading: 0,
        notes: 0,
        library: 0,
        total: 0
      };

      Object.values(breakdown).forEach(item => {
        categoryTotals.total += item.totalPoints;

        // Categorize actions
        if (['reading_session_started', 'reading_session_completed', 'page_read', 'pages_read', 'reading_time', 'book_completed'].includes(item.action)) {
          categoryTotals.reading += item.totalPoints;
        } else if (['note_created', 'highlight_created'].includes(item.action)) {
          categoryTotals.notes += item.totalPoints;
        } else if (['book_uploaded', 'daily_login', 'daily_checkin'].includes(item.action)) {
          categoryTotals.library += item.totalPoints;
        }
      });

      res.json({
        breakdown: Object.values(breakdown),
        categories: categoryTotals
      });
    } catch (e) {
      console.error('Error fetching action breakdown:', e);
      // Return empty data instead of 500 error for graceful degradation
      res.json({
        breakdown: [],
        categories: {
          reading: 0,
          notes: 0,
          library: 0,
          total: 0
        }
      });
    }
  });

  // GET /api/gamification/actions/history - Get recent point-earning actions
  // ✅ Now queries actual activity tables instead of deleted user_actions table
  router.get('/actions/history', async (req, res) => {
    try {
      const userId = req.user.id;
      const limit = parseInt(req.query.limit) || 20;
      const actions = [];

      // Query recent reading sessions
      const { data: sessions } = await supabase
        .from('reading_sessions')
        .select('id, duration, session_date, created_at')
        .eq('user_id', userId)
        .not('duration', 'is', null)
        .order('created_at', { ascending: false })
        .limit(limit);

      (sessions || []).forEach(session => {
        actions.push({
          id: session.id,
          action: 'reading_session_completed',
          label: `Read for ${session.duration} minutes`,
          icon: '📖',
          points: Math.min(session.duration, 60), // 1 point per minute, max 60
          created_at: session.created_at,
          timeAgo: getTimeAgo(new Date(session.created_at))
        });
      });

      // Query recent notes
      const { data: notes } = await supabase
        .from('notes')
        .select('id, type, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      (notes || []).forEach(note => {
        const isHighlight = note.type === 'highlight';
        actions.push({
          id: note.id,
          action: isHighlight ? 'highlight_created' : 'note_created',
          label: isHighlight ? 'Highlighted text' : 'Created note',
          icon: isHighlight ? '✨' : '📝',
          points: isHighlight ? 10 : 15,
          created_at: note.created_at,
          timeAgo: getTimeAgo(new Date(note.created_at))
        });
      });

      // Query recent books added
      const { data: books } = await supabase
        .from('books')
        .select('id, title, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      (books || []).forEach(book => {
        actions.push({
          id: book.id,
          action: 'book_uploaded',
          label: `Added "${book.title}"`,
          icon: '📚',
          points: 25,
          created_at: book.created_at,
          timeAgo: getTimeAgo(new Date(book.created_at))
        });
      });

      // Query recent daily check-ins
      const { data: checkIns } = await supabase
        .from('daily_checkins')
        .select('id, check_in_date, streak, points, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      (checkIns || []).forEach(checkIn => {
        const streakText = checkIn.streak > 1 ? ` (${checkIn.streak}-day streak!)` : '';
        actions.push({
          id: checkIn.id,
          action: 'daily_checkin',
          label: `Daily check-in${streakText}`,
          icon: '✅',
          points: checkIn.points,
          created_at: checkIn.created_at,
          timeAgo: getTimeAgo(new Date(checkIn.created_at))
        });
      });

      // Sort all actions by timestamp and limit
      const sortedActions = actions
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, limit);

      res.json(sortedActions);
    } catch (e) {
      console.error('Error fetching action history:', e);
      res.json([]);
    }
  });

  // GET /api/gamification/checkin/status - Get current check-in status
  router.get('/checkin/status', async (req, res) => {
    try {
      const userId = req.user.id;
      const today = new Date().toISOString().split('T')[0];

      // Check if user checked in today
      const { data: todayCheckIn } = await supabase
        .from('daily_checkins')
        .select('id, check_in_date, streak, points, created_at')
        .eq('user_id', userId)
        .eq('check_in_date', today)
        .single();

      // Get the most recent check-in for streak calculation
      const { data: latestCheckIn } = await supabase
        .from('daily_checkins')
        .select('id, check_in_date, streak, created_at')
        .eq('user_id', userId)
        .order('check_in_date', { ascending: false })
        .limit(1)
        .single();

      res.json({
        hasCheckedInToday: !!todayCheckIn,
        todayCheckIn: todayCheckIn || null,
        currentStreak: latestCheckIn?.streak || 0,
        lastCheckIn: latestCheckIn || null
      });
    } catch (e) {
      console.error('Error fetching check-in status:', e);
      res.json({
        hasCheckedInToday: false,
        todayCheckIn: null,
        currentStreak: 0,
        lastCheckIn: null
      });
    }
  });

  // POST /api/gamification/actions
  router.post('/actions', async (req, res) => {
    try {
      const { action, data, timestamp } = req.body;
      const userId = req.user.id;

      if (!action) return res.status(400).json({ error: 'Action is required' });

      // Standardized point mapping (aligned with client values)
      let points = 0;
      switch (action) {
        case 'note_created': points = 15; break;
        case 'highlight_created': points = 10; break;
        case 'book_uploaded': points = 25; break;
        case 'page_read': points = 1; break;
        case 'pages_read': points = (data?.pages || 0); break;
        case 'reading_session_started': points = 5; break;
        case 'reading_session_completed': points = 10; break;
        case 'reading_time': points = (data?.minutes || 0); break;
        case 'book_completed': points = 100; break;
        case 'daily_login': points = 10; break;
        case 'daily_checkin': points = 10; break;
        case 'mentor_interaction': points = 5; break;
        default: points = 1;
      }

      // Special handling for daily check-in - persist to database
      if (action === 'daily_checkin') {
        try {
          const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

          // Check if user already checked in today
          const { data: existingCheckIn } = await supabase
            .from('daily_checkins')
            .select('id, check_in_date, streak')
            .eq('user_id', userId)
            .eq('check_in_date', today)
            .single();

          if (existingCheckIn) {
            return res.status(400).json({
              error: 'Already checked in today',
              checkIn: existingCheckIn
            });
          }

          // Calculate streak by checking yesterday's check-in
          let streak = 1;
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          const yesterdayStr = yesterday.toISOString().split('T')[0];

          const { data: yesterdayCheckIn } = await supabase
            .from('daily_checkins')
            .select('streak')
            .eq('user_id', userId)
            .eq('check_in_date', yesterdayStr)
            .single();

          if (yesterdayCheckIn) {
            // Continue streak
            streak = yesterdayCheckIn.streak + 1;
          }

          // Insert new check-in record
          const { data: newCheckIn, error: insertError } = await supabase
            .from('daily_checkins')
            .insert([{
              user_id: userId,
              check_in_date: today,
              streak: streak,
              points: points
            }])
            .select()
            .single();

          if (insertError) {
            console.error('❌ Failed to insert daily check-in:', insertError);
            throw insertError;
          }

          console.log(`✅ Daily check-in saved: user=${userId}, streak=${streak}`);
          return res.json({
            success: true,
            action,
            points,
            streak,
            checkIn: newCheckIn,
            message: `Daily check-in complete! ${streak > 1 ? `${streak}-day streak!` : ''}`
          });

        } catch (dbError) {
          console.error('❌ Database error during check-in:', dbError);
          return res.status(500).json({
            error: 'Failed to save check-in',
            details: dbError.message
          });
        }
      }

      // ✅ Record activity for streak tracking (activity-based streak system)
      // Qualifying activities: reading sessions, book uploads, notes, highlights, mentor interactions
      const streakQualifyingActions = [
        'reading_session_started',
        'reading_session_completed',
        'book_uploaded',
        'note_created',
        'highlight_created',
        'book_completed',
        'mentor_interaction',
        'daily_login'
      ];

      let streakResult = null;
      if (streakQualifyingActions.includes(action)) {
        // Map action to activity type for streak recording
        let activityType = 'general';
        if (action.includes('reading') || action === 'book_completed') {
          activityType = 'reading';
        } else if (action === 'note_created') {
          activityType = 'note';
        } else if (action === 'highlight_created') {
          activityType = 'highlight';
        }

        streakResult = await recordDailyActivity(userId, activityType);
        console.log(`📊 Streak activity recorded for ${action}: ${JSON.stringify(streakResult)}`);
      }

      // Calculate current streak after recording activity
      const currentStreak = await calculateReadingStreak(userId);

      console.log(`✅ Action tracked: ${action}, ${points} points, streak: ${currentStreak} days`);
      res.json({
        success: true,
        action,
        points,
        streak: currentStreak,
        streakRecorded: streakResult?.success || false,
        message: `${action} tracked successfully!${currentStreak > 1 ? ` 🔥 ${currentStreak}-day streak!` : ''}`
      });
    } catch (e) {
      console.error('Error tracking action:', e);
      res.status(500).json({ error: 'Failed to track action' });
    }
  });

  return router;
};
