// src/routes/ai.js - AI Reading Companion API Routes
import express from 'express';
import aiService from '../services/aiService.js';

export function aiRouter(authenticateToken) {
  const router = express.Router();

  // Summarize a collection of user notes (per-book or selection)
  router.post('/summarize-notes', authenticateToken, async (req, res) => {
    try {
      const { notes, title, mode, tags } = req.body || {};

      if (!Array.isArray(notes) || notes.length === 0) {
        return res.status(400).json({ error: 'notes (string[]) is required' });
      }

      const result = await aiService.summarizeNotes(notes, { title, mode, tags });
      res.json(result);
    } catch (error) {
      console.error('Summarize notes error:', error);
      res.status(500).json({ error: 'Summarization failed' });
    }
  });

  // Note enhancement
  router.post('/enhance-note', authenticateToken, async (req, res) => {
    try {
      const { originalNote, bookContext } = req.body;

      const enhancement = await aiService.enhanceNote(originalNote, bookContext);
      res.json(enhancement);
    } catch (error) {
      console.error('Note enhancement error:', error);
      res.status(500).json({ error: 'Note enhancement failed' });
    }
  });

  // Mentor AI discussion response (Mentor Page)
  router.post('/mentor-discuss', authenticateToken, async (req, res) => {
    try {
      const { bookContext, userMessage, history } = req.body;
      if (!bookContext?.title || !userMessage) {
        return res.status(400).json({ error: 'Book context and user message are required' });
      }
      const result = await aiService.mentorDiscuss(bookContext, userMessage, history || []);
      res.json(result);
    } catch (error) {
      console.error('Mentor discuss error:', error);
      res.status(500).json({ error: 'Discussion response failed' });
    }
  });

  // Mentor AI quiz generation (Mentor Page)
  router.post('/mentor-quiz', authenticateToken, async (req, res) => {
    try {
      const { bookContext, userLevel } = req.body;
      if (!bookContext?.title) {
        return res.status(400).json({ error: 'Book context is required' });
      }
      const result = await aiService.mentorQuiz(bookContext, userLevel || 'intermediate');
      res.json(result);
    } catch (error) {
      console.error('Mentor quiz error:', error);
      res.status(500).json({ error: 'Quiz generation failed' });
    }
  });

  // Extract topics from page context for smart reading queue (Phase 3.1)
  router.post('/extract-topics', authenticateToken, async (req, res) => {
    try {
      const { url, title, description, tags, site_name } = req.body;
      if (!title && !url) {
        return res.status(400).json({ error: 'Page title or URL is required' });
      }
      const result = await aiService.extractPageTopics({ url, title, description, tags, site_name });
      res.json(result);
    } catch (error) {
      console.error('Topic extraction error:', error);
      res.status(500).json({ error: 'Topic extraction failed' });
    }
  });

  // AI auto-tag task from web selection (Phase 3.3)
  router.post('/auto-tag-task', authenticateToken, async (req, res) => {
    try {
      const { text, source_url, source_title } = req.body;
      if (!text || text.length < 5) {
        return res.status(400).json({ error: 'Text too short for task categorization' });
      }
      const result = await aiService.autoTagTask(text, { url: source_url, title: source_title });
      res.json(result);
    } catch (error) {
      console.error('Auto-tag task error:', error);
      res.status(500).json({ error: 'Task categorization failed' });
    }
  });

  // AI book recommendations based on user's library
  router.post('/book-recommendations', authenticateToken, async (req, res) => {
    try {
      const { books, limit, refresh, exclude } = req.body;
      if (!Array.isArray(books) || books.length === 0) {
        return res.status(400).json({ error: 'books array is required' });
      }
      const result = await aiService.generateBookRecommendations(books, {
        limit: limit || 6,
        refresh: !!refresh,
        exclude: Array.isArray(exclude) ? exclude : []
      });
      res.json(result);
    } catch (error) {
      console.error('Book recommendations error:', error);
      res.status(500).json({ error: 'Recommendation generation failed' });
    }
  });

  // AI service health check
  router.get('/status', authenticateToken, async (req, res) => {
    try {
      const status = aiService.getStatus();
      res.json({
        ...status,
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      });
    } catch (error) {
      console.error('AI status error:', error);
      res.status(500).json({ error: 'Failed to get AI service status' });
    }
  });

  return router;
}
