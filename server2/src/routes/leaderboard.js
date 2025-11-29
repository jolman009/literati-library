// src/routes/leaderboard.js
import { Router } from 'express';
import { supabase } from '../config/supabaseClient.js';

/**
 * Leaderboard System with Social Features
 * - Global rankings by points, streaks, books
 * - Weekly/Monthly leaderboards
 * - Friend system with following
 * - Privacy controls (opt-in leaderboards)
 */

// Helper: Get start of current week (Monday)
const getWeekStart = () => {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(now.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday.toISOString().split('T')[0];
};

// Helper: Get start of current month
const getMonthStart = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
};

// Calculate user stats for leaderboard
const calculateUserStats = async (userId, periodStart = null) => {
  try {
    // Build date filter
    const dateFilter = periodStart ? `.gte('created_at', '${periodStart}')` : '';

    // Get books
    let booksQuery = supabase.from('books').select('id, status').eq('user_id', userId);
    if (periodStart) {
      booksQuery = booksQuery.gte('created_at', periodStart);
    }
    const { data: books } = await booksQuery;

    // Get reading sessions
    let sessionsQuery = supabase.from('reading_sessions').select('duration, pages_read').eq('user_id', userId);
    if (periodStart) {
      sessionsQuery = sessionsQuery.gte('session_date', periodStart);
    }
    const { data: sessions } = await sessionsQuery;

    // Get notes
    let notesQuery = supabase.from('notes').select('id, type').eq('user_id', userId);
    if (periodStart) {
      notesQuery = notesQuery.gte('created_at', periodStart);
    }
    const { data: notes } = await notesQuery;

    // Calculate points
    const BOOK_UPLOAD_POINTS = 25;
    const NOTE_POINTS = 15;
    const HIGHLIGHT_POINTS = 10;
    const SESSION_COMPLETION_POINTS = 10;
    const TIME_POINTS_PER_MINUTE = 1;

    let totalPoints = 0;
    totalPoints += (books || []).length * BOOK_UPLOAD_POINTS;
    totalPoints += (notes || []).filter(n => n.type === 'note').length * NOTE_POINTS;
    totalPoints += (notes || []).filter(n => n.type === 'highlight').length * HIGHLIGHT_POINTS;
    totalPoints += (sessions || []).length * SESSION_COMPLETION_POINTS;
    totalPoints += (sessions || []).reduce((sum, s) => sum + (s.duration || 0), 0) * TIME_POINTS_PER_MINUTE;

    // Calculate reading streak
    const { data: streakData } = await supabase
      .from('reading_streaks')
      .select('streak_date')
      .eq('user_id', userId)
      .order('streak_date', { ascending: false });

    let streak = 0;
    if (streakData && streakData.length > 0) {
      let current = new Date();
      current.setHours(0, 0, 0, 0);

      for (const row of streakData) {
        const d = new Date(row.streak_date);
        d.setHours(0, 0, 0, 0);
        const diff = Math.floor((current - d) / (1000 * 60 * 60 * 24));
        if (diff === streak) {
          streak++;
          current.setDate(current.getDate() - 1);
        } else if (diff > streak) break;
      }
    }

    return {
      total_points: totalPoints,
      books_uploaded: (books || []).length,
      books_completed: (books || []).filter(b => b.status === 'completed').length,
      reading_streak: streak,
      total_reading_time: (sessions || []).reduce((sum, s) => sum + (s.duration || 0), 0),
      notes_created: (notes || []).filter(n => n.type === 'note').length,
      highlights_created: (notes || []).filter(n => n.type === 'highlight').length
    };
  } catch (error) {
    console.error('Error calculating user stats:', error);
    return {
      total_points: 0,
      books_uploaded: 0,
      books_completed: 0,
      reading_streak: 0,
      total_reading_time: 0,
      notes_created: 0,
      highlights_created: 0
    };
  }
};

// Get display name for user (respects privacy settings)
const getUserDisplayInfo = async (userId) => {
  try {
    const { data: user } = await supabase
      .from('users')
      .select('id, name, avatar')
      .eq('id', userId)
      .single();

    // Check privacy settings
    const { data: settings } = await supabase
      .from('user_settings')
      .select('leaderboard_visible, display_name')
      .eq('user_id', userId)
      .single();

    const isVisible = settings?.leaderboard_visible !== false; // Default to visible

    return {
      id: userId,
      name: isVisible ? (settings?.display_name || user?.name || 'Anonymous Reader') : 'Anonymous Reader',
      avatar: isVisible ? user?.avatar : null,
      is_anonymous: !isVisible
    };
  } catch (error) {
    return {
      id: userId,
      name: 'Anonymous Reader',
      avatar: null,
      is_anonymous: true
    };
  }
};

export const leaderboardRouter = (authenticateToken) => {
  const router = Router();
  router.use(authenticateToken);

  // GET /api/leaderboard/global - Get global all-time leaderboard
  router.get('/global', async (req, res) => {
    try {
      const userId = req.user.id;
      const limit = Math.min(parseInt(req.query.limit) || 50, 100);
      const sortBy = req.query.sort || 'points'; // points, streak, books

      // Get all users who have opted into leaderboard (or haven't set preference)
      const { data: users } = await supabase
        .from('users')
        .select('id');

      if (!users || users.length === 0) {
        return res.json({ leaderboard: [], user_rank: null });
      }

      // Calculate stats for each user
      const userStats = await Promise.all(
        users.map(async (user) => {
          const stats = await calculateUserStats(user.id);
          const displayInfo = await getUserDisplayInfo(user.id);

          return {
            ...displayInfo,
            ...stats,
            is_current_user: user.id === userId
          };
        })
      );

      // Sort based on requested criteria
      let sortedStats;
      switch (sortBy) {
        case 'streak':
          sortedStats = userStats.sort((a, b) => b.reading_streak - a.reading_streak);
          break;
        case 'books':
          sortedStats = userStats.sort((a, b) => b.books_completed - a.books_completed);
          break;
        case 'time':
          sortedStats = userStats.sort((a, b) => b.total_reading_time - a.total_reading_time);
          break;
        default: // points
          sortedStats = userStats.sort((a, b) => b.total_points - a.total_points);
      }

      // Add ranks
      const rankedStats = sortedStats.map((user, index) => ({
        ...user,
        rank: index + 1
      }));

      // Find current user's rank
      const currentUserRank = rankedStats.find(u => u.is_current_user);

      res.json({
        leaderboard: rankedStats.slice(0, limit),
        user_rank: currentUserRank || null,
        total_participants: rankedStats.length,
        sort_by: sortBy,
        period: 'all_time'
      });
    } catch (error) {
      console.error('Error fetching global leaderboard:', error);
      res.status(500).json({ error: 'Failed to fetch leaderboard' });
    }
  });

  // GET /api/leaderboard/weekly - Get weekly leaderboard
  router.get('/weekly', async (req, res) => {
    try {
      const userId = req.user.id;
      const limit = Math.min(parseInt(req.query.limit) || 50, 100);
      const weekStart = getWeekStart();

      const { data: users } = await supabase.from('users').select('id');

      if (!users || users.length === 0) {
        return res.json({ leaderboard: [], user_rank: null });
      }

      // Calculate weekly stats for each user
      const userStats = await Promise.all(
        users.map(async (user) => {
          const stats = await calculateUserStats(user.id, weekStart);
          const displayInfo = await getUserDisplayInfo(user.id);

          return {
            ...displayInfo,
            ...stats,
            is_current_user: user.id === userId
          };
        })
      );

      // Sort by points (weekly earned)
      const sortedStats = userStats
        .filter(u => u.total_points > 0) // Only show active users
        .sort((a, b) => b.total_points - a.total_points);

      // Add ranks
      const rankedStats = sortedStats.map((user, index) => ({
        ...user,
        rank: index + 1
      }));

      // Find current user's rank
      const currentUserRank = rankedStats.find(u => u.is_current_user);

      // Calculate when week ends
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);

      res.json({
        leaderboard: rankedStats.slice(0, limit),
        user_rank: currentUserRank || null,
        total_participants: rankedStats.length,
        period: 'weekly',
        period_start: weekStart,
        resets_at: weekEnd.toISOString()
      });
    } catch (error) {
      console.error('Error fetching weekly leaderboard:', error);
      res.status(500).json({ error: 'Failed to fetch weekly leaderboard' });
    }
  });

  // GET /api/leaderboard/monthly - Get monthly leaderboard
  router.get('/monthly', async (req, res) => {
    try {
      const userId = req.user.id;
      const limit = Math.min(parseInt(req.query.limit) || 50, 100);
      const monthStart = getMonthStart();

      const { data: users } = await supabase.from('users').select('id');

      if (!users || users.length === 0) {
        return res.json({ leaderboard: [], user_rank: null });
      }

      // Calculate monthly stats for each user
      const userStats = await Promise.all(
        users.map(async (user) => {
          const stats = await calculateUserStats(user.id, monthStart);
          const displayInfo = await getUserDisplayInfo(user.id);

          return {
            ...displayInfo,
            ...stats,
            is_current_user: user.id === userId
          };
        })
      );

      // Sort by points
      const sortedStats = userStats
        .filter(u => u.total_points > 0)
        .sort((a, b) => b.total_points - a.total_points);

      // Add ranks
      const rankedStats = sortedStats.map((user, index) => ({
        ...user,
        rank: index + 1
      }));

      const currentUserRank = rankedStats.find(u => u.is_current_user);

      // Calculate when month ends
      const now = new Date();
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);

      res.json({
        leaderboard: rankedStats.slice(0, limit),
        user_rank: currentUserRank || null,
        total_participants: rankedStats.length,
        period: 'monthly',
        period_start: monthStart,
        resets_at: monthEnd.toISOString()
      });
    } catch (error) {
      console.error('Error fetching monthly leaderboard:', error);
      res.status(500).json({ error: 'Failed to fetch monthly leaderboard' });
    }
  });

  // GET /api/leaderboard/friends - Get leaderboard of followed users
  router.get('/friends', async (req, res) => {
    try {
      const userId = req.user.id;
      const limit = Math.min(parseInt(req.query.limit) || 50, 100);

      // Get users that current user follows
      const { data: following } = await supabase
        .from('user_follows')
        .select('following_id')
        .eq('follower_id', userId);

      // Include current user in friends leaderboard
      const friendIds = [(following || []).map(f => f.following_id), userId].flat();

      if (friendIds.length === 0) {
        return res.json({
          leaderboard: [],
          user_rank: null,
          message: 'Follow other readers to see them on your friends leaderboard!'
        });
      }

      // Calculate stats for friends
      const userStats = await Promise.all(
        friendIds.map(async (friendId) => {
          const stats = await calculateUserStats(friendId);
          const displayInfo = await getUserDisplayInfo(friendId);

          return {
            ...displayInfo,
            ...stats,
            is_current_user: friendId === userId
          };
        })
      );

      // Sort by points
      const sortedStats = userStats.sort((a, b) => b.total_points - a.total_points);

      // Add ranks
      const rankedStats = sortedStats.map((user, index) => ({
        ...user,
        rank: index + 1
      }));

      const currentUserRank = rankedStats.find(u => u.is_current_user);

      res.json({
        leaderboard: rankedStats.slice(0, limit),
        user_rank: currentUserRank || null,
        total_friends: friendIds.length - 1, // Exclude self
        period: 'all_time'
      });
    } catch (error) {
      console.error('Error fetching friends leaderboard:', error);
      res.status(500).json({ error: 'Failed to fetch friends leaderboard' });
    }
  });

  // POST /api/leaderboard/follow/:userId - Follow a user
  router.post('/follow/:targetUserId', async (req, res) => {
    try {
      const userId = req.user.id;
      const { targetUserId } = req.params;

      if (userId === targetUserId) {
        return res.status(400).json({ error: 'Cannot follow yourself' });
      }

      // Check if target user exists
      const { data: targetUser } = await supabase
        .from('users')
        .select('id, name')
        .eq('id', targetUserId)
        .single();

      if (!targetUser) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Check if already following
      const { data: existingFollow } = await supabase
        .from('user_follows')
        .select('id')
        .eq('follower_id', userId)
        .eq('following_id', targetUserId)
        .single();

      if (existingFollow) {
        return res.status(400).json({ error: 'Already following this user' });
      }

      // Create follow relationship
      const { error } = await supabase
        .from('user_follows')
        .insert({
          follower_id: userId,
          following_id: targetUserId
        });

      if (error) {
        console.error('Error creating follow:', error);
        return res.status(500).json({ error: 'Failed to follow user' });
      }

      res.json({
        success: true,
        message: `Now following ${targetUser.name}`
      });
    } catch (error) {
      console.error('Error following user:', error);
      res.status(500).json({ error: 'Failed to follow user' });
    }
  });

  // DELETE /api/leaderboard/follow/:userId - Unfollow a user
  router.delete('/follow/:targetUserId', async (req, res) => {
    try {
      const userId = req.user.id;
      const { targetUserId } = req.params;

      const { error } = await supabase
        .from('user_follows')
        .delete()
        .eq('follower_id', userId)
        .eq('following_id', targetUserId);

      if (error) {
        console.error('Error unfollowing:', error);
        return res.status(500).json({ error: 'Failed to unfollow user' });
      }

      res.json({
        success: true,
        message: 'Unfollowed successfully'
      });
    } catch (error) {
      console.error('Error unfollowing user:', error);
      res.status(500).json({ error: 'Failed to unfollow user' });
    }
  });

  // GET /api/leaderboard/following - Get list of users being followed
  router.get('/following', async (req, res) => {
    try {
      const userId = req.user.id;

      const { data: following } = await supabase
        .from('user_follows')
        .select('following_id, created_at')
        .eq('follower_id', userId);

      if (!following || following.length === 0) {
        return res.json({ following: [], count: 0 });
      }

      // Get user details for each followed user
      const followingDetails = await Promise.all(
        following.map(async (f) => {
          const displayInfo = await getUserDisplayInfo(f.following_id);
          const stats = await calculateUserStats(f.following_id);

          return {
            ...displayInfo,
            total_points: stats.total_points,
            reading_streak: stats.reading_streak,
            followed_at: f.created_at
          };
        })
      );

      res.json({
        following: followingDetails,
        count: followingDetails.length
      });
    } catch (error) {
      console.error('Error fetching following:', error);
      res.status(500).json({ error: 'Failed to fetch following list' });
    }
  });

  // GET /api/leaderboard/followers - Get list of followers
  router.get('/followers', async (req, res) => {
    try {
      const userId = req.user.id;

      const { data: followers } = await supabase
        .from('user_follows')
        .select('follower_id, created_at')
        .eq('following_id', userId);

      if (!followers || followers.length === 0) {
        return res.json({ followers: [], count: 0 });
      }

      // Get user details for each follower
      const followerDetails = await Promise.all(
        followers.map(async (f) => {
          const displayInfo = await getUserDisplayInfo(f.follower_id);
          const stats = await calculateUserStats(f.follower_id);

          return {
            ...displayInfo,
            total_points: stats.total_points,
            reading_streak: stats.reading_streak,
            followed_at: f.created_at
          };
        })
      );

      res.json({
        followers: followerDetails,
        count: followerDetails.length
      });
    } catch (error) {
      console.error('Error fetching followers:', error);
      res.status(500).json({ error: 'Failed to fetch followers list' });
    }
  });

  // PUT /api/leaderboard/settings - Update leaderboard privacy settings
  router.put('/settings', async (req, res) => {
    try {
      const userId = req.user.id;
      const { leaderboard_visible, display_name } = req.body;

      // Check if settings exist
      const { data: existing } = await supabase
        .from('user_settings')
        .select('id')
        .eq('user_id', userId)
        .single();

      const updates = {};
      if (typeof leaderboard_visible === 'boolean') {
        updates.leaderboard_visible = leaderboard_visible;
      }
      if (display_name !== undefined) {
        updates.display_name = display_name;
      }

      if (existing) {
        await supabase
          .from('user_settings')
          .update(updates)
          .eq('user_id', userId);
      } else {
        await supabase
          .from('user_settings')
          .insert({
            user_id: userId,
            ...updates
          });
      }

      res.json({
        success: true,
        message: 'Settings updated successfully'
      });
    } catch (error) {
      console.error('Error updating settings:', error);
      res.status(500).json({ error: 'Failed to update settings' });
    }
  });

  // GET /api/leaderboard/settings - Get leaderboard settings
  router.get('/settings', async (req, res) => {
    try {
      const userId = req.user.id;

      const { data: settings } = await supabase
        .from('user_settings')
        .select('leaderboard_visible, display_name')
        .eq('user_id', userId)
        .single();

      res.json({
        leaderboard_visible: settings?.leaderboard_visible ?? true,
        display_name: settings?.display_name || null
      });
    } catch (error) {
      console.error('Error fetching settings:', error);
      res.json({
        leaderboard_visible: true,
        display_name: null
      });
    }
  });

  // GET /api/leaderboard/search - Search for users to follow
  router.get('/search', async (req, res) => {
    try {
      const userId = req.user.id;
      const query = req.query.q;

      if (!query || query.length < 2) {
        return res.status(400).json({ error: 'Search query must be at least 2 characters' });
      }

      // Search for users by name (case-insensitive)
      const { data: users } = await supabase
        .from('users')
        .select('id, name, avatar')
        .ilike('name', `%${query}%`)
        .neq('id', userId)
        .limit(20);

      if (!users || users.length === 0) {
        return res.json({ users: [] });
      }

      // Check which users current user is following
      const { data: following } = await supabase
        .from('user_follows')
        .select('following_id')
        .eq('follower_id', userId);

      const followingIds = new Set((following || []).map(f => f.following_id));

      // Get privacy settings and stats for each user
      const userResults = await Promise.all(
        users.map(async (user) => {
          const stats = await calculateUserStats(user.id);

          // Check if user is visible on leaderboard
          const { data: settings } = await supabase
            .from('user_settings')
            .select('leaderboard_visible')
            .eq('user_id', user.id)
            .single();

          const isVisible = settings?.leaderboard_visible !== false;

          return {
            id: user.id,
            name: isVisible ? user.name : 'Private User',
            avatar: isVisible ? user.avatar : null,
            total_points: isVisible ? stats.total_points : null,
            reading_streak: isVisible ? stats.reading_streak : null,
            is_following: followingIds.has(user.id),
            is_private: !isVisible
          };
        })
      );

      res.json({ users: userResults });
    } catch (error) {
      console.error('Error searching users:', error);
      res.status(500).json({ error: 'Failed to search users' });
    }
  });

  return router;
};
