// src/routes/guide.js - In-app Guide Assistant API
import express from 'express';
import guideService from '../services/guideService.js';
import OpenAI from 'openai';
import { supabase } from '../config/supabaseClient.js';

export default function guideRouter(authenticateToken) {
  const router = express.Router();

  // Non-streaming chat endpoint
  router.post('/chat', authenticateToken, async (req, res) => {
    try {
      const { messages = [], context = {} } = req.body || {};
      if (!Array.isArray(messages)) {
        return res.status(400).json({ error: 'messages must be an array' });
      }
      const reply = await guideService.chat(messages, context);
      res.json({ message: reply });
    } catch (e) {
      console.error('Guide chat error:', e);
      res.status(500).json({ error: 'Guide chat failed' });
    }
  });

  // Placeholder streaming endpoint (SSE-style not implemented yet)
  router.post('/chat/stream', authenticateToken, async (req, res) => {
    try {
      const { messages = [], context = {} } = req.body || {};
      const reply = await guideService.chat(messages, context);
      res.json({ message: reply, stream: false });
    } catch (e) {
      console.error('Guide stream error:', e);
      res.status(500).json({ error: 'Guide stream failed' });
    }
  });

  // RAG search endpoint: returns top-k chunks for a query
  router.post('/rag-search', authenticateToken, async (req, res) => {
    try {
      const { query, route, topK = 6, tags } = req.body || {};
      if (!query || typeof query !== 'string') {
        return res.status(400).json({ error: 'query is required' });
      }
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const embed = await openai.embeddings.create({
        model: process.env.EMBEDDING_MODEL || 'text-embedding-3-small',
        input: query
      });
      const vector = embed.data?.[0]?.embedding;
      if (!vector) throw new Error('Failed to compute embedding');

      const { data, error } = await supabase.rpc('rag_search', {
        p_query_embedding: vector,
        p_match_count: topK,
        p_route: route || null,
        p_tags: Array.isArray(tags) && tags.length ? tags : null
      });
      if (error) throw error;
      res.json({ chunks: data || [] });
    } catch (e) {
      console.error('RAG search error:', e);
      res.status(500).json({ error: 'RAG search failed' });
    }
  });

  // Fetch a specific chunk by content SHA
  router.get('/source', authenticateToken, async (req, res) => {
    try {
      const { sha } = req.query;
      if (!sha) return res.status(400).json({ error: 'sha is required' });
      const { data, error } = await supabase
        .from('rag_chunks')
        .select('content, metadata, content_sha')
        .eq('content_sha', sha)
        .single();
      if (error) throw error;
      if (!data) return res.status(404).json({ error: 'Not found' });
      res.json({ chunk: data });
    } catch (e) {
      console.error('Get source by sha error:', e);
      res.status(500).json({ error: 'Failed to fetch source' });
    }
  });

  // Fetch most recent chunks by metadata.sourcePath
  router.get('/source-by-path', authenticateToken, async (req, res) => {
    try {
      const pathParam = req.query.path;
      const limit = Math.min(parseInt(req.query.limit || '3', 10), 10);
      if (!pathParam) return res.status(400).json({ error: 'path is required' });
      const { data, error } = await supabase
        .from('rag_chunks')
        .select('content, metadata, content_sha, created_at')
        .filter('metadata->>sourcePath', 'eq', pathParam)
        .order('created_at', { ascending: false })
        .limit(limit);
      if (error) throw error;
      res.json({ chunks: data || [] });
    } catch (e) {
      console.error('Get source by path error:', e);
      res.status(500).json({ error: 'Failed to fetch sources' });
    }
  });

  // Health/status
  router.get('/status', authenticateToken, (_req, res) => {
    res.json({ ok: true, mode: guideService.useFallback ? 'fallback' : 'llm' });
  });

  return router;
}
