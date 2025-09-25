// src/routes/reading.js
import { Router } from 'express';
import { supabase } from '../config/supabaseClient.js';

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
        .eq('user_id', req.user.id)
        .select()
        .single();

      if (error) {
        console.error('Reading session end error:', error);
        return res.status(500).json({ error: 'Failed to end reading session' });
      }

      // Backfill duration in minutes
      if (session?.start_time) {
        const startTime = new Date(session.start_time);
        const endTimeObj = new Date(endTime);
        const duration = Math.max(0, Math.floor((endTimeObj - startTime) / 60000));
        await supabase.from('reading_sessions').update({ duration }).eq('id', id);
        session.duration = duration;
      }

      res.json(session);
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

      res.json({
        success: true,
        session,
        message: `Reading session saved${duration ? `: ${duration} minutes` : ''}`,
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

      res.json({ success: true, session });
    } catch (e) {
      console.error('Legacy /api/reading-session error:', e);
      res.status(500).json({ error: 'Failed to save reading session', details: e.message });
    }
  });
};
