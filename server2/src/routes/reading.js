// src/routes/reading.js
import { Router } from 'express';
import { supabase } from '../config/supabaseClient.js';

// Gamification constants (synchronized with gamification.js)
const READING_SESSION_COMPLETED_POINTS = 10;
const READING_TIME_POINTS_PER_MINUTE = 1;
const READING_SESSION_STARTED_POINTS = 5;

const LEVEL_THRESHOLDS = [
  { level: 10, points: 10000 },
  { level: 9, points: 6000 },
  { level: 8, points: 4000 },
  { level: 7, points: 2500 },
  { level: 6, points: 1500 },
  { level: 5, points: 1000 },
  { level: 4, points: 600 },
  { level: 3, points: 300 },
  { level: 2, points: 100 },
  { level: 1, points: 0 },
];

const deriveLevelFromPoints = (totalPoints) => {
  for (const threshold of LEVEL_THRESHOLDS) {
    if (totalPoints >= threshold.points) return threshold.level;
  }
  return 1;
};

const buildGamificationSnapshot = async (userId) => {
  const snapshot = {
    pointsAwarded: 0,
    totalPoints: null,
    level: null,
    sessionsCompleted: null,
    totalReadingTime: null,
  };

  try {
    const { data: statsRow, error: statsError } = await supabase
      .from('user_stats')
      .select('total_points, level, sessions_completed, total_reading_time')
      .eq('user_id', userId)
      .single();

    if (statsError) {
      if (statsError.code !== 'PGRST116') {
        console.warn('⚠️ Unable to load gamification stats from user_stats:', statsError.message);
      }
    } else if (statsRow) {
      snapshot.totalPoints = statsRow.total_points ?? null;
      snapshot.level = statsRow.level ?? null;
      snapshot.sessionsCompleted = statsRow.sessions_completed ?? null;
      snapshot.totalReadingTime = statsRow.total_reading_time ?? null;
    }

    if (snapshot.totalPoints == null) {
      const { data: totalPointsData, error: totalPointsError } = await supabase
        .rpc('get_user_total_points', { p_user_id: userId });

      if (totalPointsError) {
        console.warn('⚠️ Unable to fetch total points via RPC:', totalPointsError.message);
      } else if (typeof totalPointsData === 'number') {
        snapshot.totalPoints = totalPointsData;
        if (!snapshot.level) {
          snapshot.level = deriveLevelFromPoints(totalPointsData);
        }
      }
    } else if (!snapshot.level && typeof snapshot.totalPoints === 'number') {
      snapshot.level = deriveLevelFromPoints(snapshot.totalPoints);
    }
  } catch (statsErr) {
    console.warn('⚠️ Gamification snapshot collection failed:', statsErr.message || statsErr);
  }

  return snapshot;
};

export const readingRouter = (authenticateToken) => {
  const router = Router();
  router.use(authenticateToken);

  // POST /api/reading/sessions/start
  router.post('/sessions/start', async (req, res) => {
    try {
      const { book_id, page, position } = req.body;
      if (!book_id) return res.status(400).json({ error: 'Book ID is required' });

      const nowIso = new Date().toISOString();
      const sessionData = {
        user_id: req.user.id,
        book_id,
        start_time: nowIso,
        start_page: page ?? null,
        start_position: position ?? null,
        session_date: nowIso.split('T')[0],
      };

      const { data: session, error } = await supabase
        .from('reading_sessions')
        .insert(sessionData)
        .select()
        .single();

      if (error) {
        console.error('Reading session start error:', error);
        return res.status(500).json({ error: 'Failed to start reading session' });
      }

      res.status(201).json(session);
    } catch (e) {
      console.error('Start reading session error:', e);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // POST /api/reading/sessions/:id/end
  router.post('/sessions/:id/end', async (req, res) => {
    try {
      const { id } = req.params;
      const { end_page, end_position, notes } = req.body;
      const endTime = new Date().toISOString();
      const userId = req.user.id;

      const { data: session, error } = await supabase
        .from('reading_sessions')
        .update({
          end_time: endTime,
          end_page: end_page ?? null,
          end_position: end_position ?? null,
          notes: notes ?? null,
          updated_at: endTime,
        })
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        console.error('Reading session end error:', error);
        return res.status(500).json({ error: 'Failed to end reading session' });
      }

      // Backfill duration in minutes
      let duration = 0;
      if (session?.start_time) {
        const startTime = new Date(session.start_time);
        const endTimeObj = new Date(endTime);
        duration = Math.max(0, Math.floor((endTimeObj - startTime) / 60000));
        await supabase.from('reading_sessions').update({ duration }).eq('id', id);
        session.duration = duration;
      }

      console.log('✅ Reading session ended successfully:', id, `${duration} minutes`);

      // ✅ FIX: Track reading session completion in gamification system
      const completionPoints = READING_SESSION_COMPLETED_POINTS;
      const timePoints = duration * READING_TIME_POINTS_PER_MINUTE;
      const totalPoints = completionPoints + timePoints;

      try {
        await supabase.from('user_actions').insert({
          user_id: userId,
          action: 'reading_session_completed',
          points: totalPoints,
          data: {
            duration,
            bookId: session.book_id,
            sessionId: session.id
          },
          created_at: endTime,
        });
        console.log(`✅ Gamification tracked: ${totalPoints} points (${completionPoints} completion + ${timePoints} time)`);
      } catch (actionError) {
        console.warn('⚠️ Failed to track reading session action:', actionError.message);
      }

      // ✅ FIX: Build gamification snapshot
      let gamificationSnapshot = null;
      try {
        gamificationSnapshot = await buildGamificationSnapshot(userId);
        gamificationSnapshot.pointsAwarded = totalPoints;
        console.log('✅ Gamification snapshot generated:', gamificationSnapshot);
      } catch (gamError) {
        console.warn('⚠️ Gamification snapshot failed (session still saved):', gamError.message);
      }

      res.json({
        ...session,
        gamification: gamificationSnapshot,
      });
    } catch (e) {
      console.error('End reading session error:', e);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // POST /api/reading/session  (convenience endpoint used by your frontend)
  router.post('/session', async (req, res) => {
    try {
      const { bookId, duration, pagesRead, startTime, endTime } = req.body;
      const userId = req.user.id;

      if (!bookId) return res.status(400).json({ error: 'bookId is required' });
      if (!duration && !pagesRead) {
        return res.status(400).json({ error: 'Provide duration and/or pagesRead' });
      }

      const startIso = startTime || new Date(Date.now() - (duration || 0) * 60000).toISOString();
      const endIso = endTime || new Date().toISOString();

      const { data: session, error: sessionError } = await supabase
        .from('reading_sessions')
        .insert([{
          user_id: userId,
          book_id: bookId,
          start_time: startIso,
          end_time: endIso,
          duration: duration || null,
          start_page: 0,
          end_page: pagesRead || 0,
          session_date: new Date().toISOString().split('T')[0],
        }])
        .select()
        .single();

      if (sessionError) {
        console.error('Failed to create reading session:', sessionError);
        return res.status(400).json({ error: sessionError.message });
      }

      console.log('✅ Reading session created successfully:', session.id);

      // ✅ FIX: Track reading session in gamification system
      const sessionDuration = duration || 0;
      const completionPoints = READING_SESSION_COMPLETED_POINTS;
      const timePoints = sessionDuration * READING_TIME_POINTS_PER_MINUTE;
      const totalPoints = completionPoints + timePoints;

      try {
        // Insert gamification action for session completion
        await supabase.from('user_actions').insert({
          user_id: userId,
          action: 'reading_session_completed',
          points: totalPoints,
          data: {
            duration: sessionDuration,
            bookId,
            sessionId: session.id
          },
          created_at: endIso,
        });
        console.log(`✅ Gamification tracked: ${totalPoints} points (${completionPoints} completion + ${timePoints} time)`);
      } catch (actionError) {
        console.warn('⚠️ Failed to track reading session action:', actionError.message);
        // Continue even if gamification tracking fails
      }

      // ✅ FIX: Build gamification snapshot (like notes.js does)
      let gamificationSnapshot = null;
      try {
        gamificationSnapshot = await buildGamificationSnapshot(userId);
        gamificationSnapshot.pointsAwarded = totalPoints;
        console.log('✅ Gamification snapshot generated:', gamificationSnapshot);
      } catch (gamError) {
        console.warn('⚠️ Gamification snapshot failed (session still saved):', gamError.message);
      }

      res.json({
        success: true,
        session,
        gamification: gamificationSnapshot,
        message: `Reading session saved: ${duration} minutes, ${totalPoints} points earned`,
      });
    } catch (e) {
      console.error('Failed to save reading session:', e);
      res.status(500).json({ error: 'Failed to save reading session', details: e.message });
    }
  });

  return router;
};

/**
 * Optional: register legacy endpoint for existing clients expecting POST /api/reading-session
 * Usage in server.js:
 *   import { registerLegacyReadingEndpoints } from './routes/reading.js';
 *   registerLegacyReadingEndpoints(app, authenticateToken);
 */
export const registerLegacyReadingEndpoints = (app, authenticateToken) => {
  app.post('/api/reading-session', authenticateToken, async (req, res) => {
    // Delegate to the /api/reading/session logic by recreating the call:
    req.url = '/api/reading/session'; // not actually re-routed; duplicate handler below
    try {
      const { bookId, duration, pagesRead, startTime, endTime } = req.body;
      const userId = req.user.id;

      if (!bookId) return res.status(400).json({ error: 'bookId is required' });
      if (!duration && !pagesRead) {
        return res.status(400).json({ error: 'Provide duration and/or pagesRead' });
      }

      const startIso = startTime || new Date(Date.now() - (duration || 0) * 60000).toISOString();
      const endIso = endTime || new Date().toISOString();

      const { data: session, error: sessionError } = await supabase
        .from('reading_sessions')
        .insert([{
          user_id: userId,
          book_id: bookId,
          start_time: startIso,
          end_time: endIso,
          duration: duration || null,
          start_page: 0,
          end_page: pagesRead || 0,
          session_date: new Date().toISOString().split('T')[0],
        }])
        .select()
        .single();

      if (sessionError) {
        console.error('Failed to create reading session (legacy):', sessionError);
        return res.status(400).json({ error: sessionError.message });
      }

      console.log('✅ Reading session created successfully (legacy):', session.id);

      // ✅ FIX: Track reading session in gamification system (legacy endpoint)
      const sessionDuration = duration || 0;
      const completionPoints = READING_SESSION_COMPLETED_POINTS;
      const timePoints = sessionDuration * READING_TIME_POINTS_PER_MINUTE;
      const totalPoints = completionPoints + timePoints;

      try {
        await supabase.from('user_actions').insert({
          user_id: userId,
          action: 'reading_session_completed',
          points: totalPoints,
          data: {
            duration: sessionDuration,
            bookId,
            sessionId: session.id
          },
          created_at: endIso,
        });
        console.log(`✅ Gamification tracked (legacy): ${totalPoints} points`);
      } catch (actionError) {
        console.warn('⚠️ Failed to track reading session action (legacy):', actionError.message);
      }

      // ✅ FIX: Build gamification snapshot (legacy endpoint)
      let gamificationSnapshot = null;
      try {
        gamificationSnapshot = await buildGamificationSnapshot(userId);
        gamificationSnapshot.pointsAwarded = totalPoints;
        console.log('✅ Gamification snapshot generated (legacy):', gamificationSnapshot);
      } catch (gamError) {
        console.warn('⚠️ Gamification snapshot failed (legacy):', gamError.message);
      }

      res.json({
        success: true,
        session,
        gamification: gamificationSnapshot,
      });
    } catch (e) {
      console.error('Legacy /api/reading-session error:', e);
      res.status(500).json({ error: 'Failed to save reading session', details: e.message });
    }
  });
};
