// src/routes/clippings.js
// CRUD endpoints for web clippings captured by the browser extension.
// Follows the same factory pattern as notes.js.

import { Router } from 'express';
import { supabase } from '../config/supabaseClient.js';

export const clippingsRouter = (authenticateToken) => {
  const router = Router();
  router.use(authenticateToken);

  // GET /api/clippings — paginated list, optional ?unread=true filter
  router.get('/', async (req, res) => {
    try {
      const { unread, limit = 50, offset = 0 } = req.query;

      let query = supabase
        .from('clippings')
        .select('*')
        .eq('user_id', req.user.id)
        .order('created_at', { ascending: false })
        .range(Number(offset), Number(offset) + Number(limit) - 1);

      if (unread === 'true') {
        query = query.eq('is_read', false);
      }

      const { data: clippings, error } = await query;

      if (error) {
        console.error('Clippings fetch error:', error);
        return res.status(500).json({ error: 'Failed to fetch clippings' });
      }

      // Enrich linked books with title/author
      if (clippings?.length) {
        const bookIds = [...new Set(clippings.filter(c => c.book_id).map(c => c.book_id))];
        if (bookIds.length) {
          const { data: books, error: booksError } = await supabase
            .from('books')
            .select('id, title, author')
            .in('id', bookIds)
            .eq('user_id', req.user.id);

          if (!booksError && books) {
            const map = new Map(books.map(b => [b.id, b]));
            clippings.forEach(c => {
              if (c.book_id && map.has(c.book_id)) c.book = map.get(c.book_id);
            });
          }
        }
      }

      res.json(clippings || []);
    } catch (e) {
      console.error('Clippings endpoint error:', e);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // POST /api/clippings — create a new clipping
  router.post('/', async (req, res) => {
    try {
      const {
        url, title, selected_text, content, site_name,
        description, image_url, favicon_url, tags, book_id,
      } = req.body;

      if (!url?.trim() || !title?.trim()) {
        return res.status(400).json({ error: 'url and title are required' });
      }

      const clippingData = {
        user_id: req.user.id,
        url: url.trim(),
        title: title.trim(),
        selected_text: selected_text || null,
        content: content || null,
        site_name: site_name || null,
        description: description || null,
        image_url: image_url || null,
        favicon_url: favicon_url || null,
        tags: Array.isArray(tags) ? tags : [],
        book_id: book_id || null,
      };

      const { data: clipping, error } = await supabase
        .from('clippings')
        .insert(clippingData)
        .select()
        .single();

      if (error) {
        console.error('Clipping creation error:', error);
        return res.status(500).json({ error: 'Failed to create clipping', details: error.message });
      }

      res.status(201).json(clipping);
    } catch (e) {
      console.error('Create clipping error:', e);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // PATCH /api/clippings/:id — partial update (is_read, tags, book_id)
  router.patch('/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const allowed = ['is_read', 'tags', 'book_id', 'title', 'content'];
      const updateData = {};

      for (const key of allowed) {
        if (req.body[key] !== undefined) {
          updateData[key] = req.body[key];
        }
      }

      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({ error: 'No valid fields to update' });
      }

      const { data: clipping, error } = await supabase
        .from('clippings')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', req.user.id)
        .select()
        .single();

      if (error) {
        console.error('Clipping update error:', error);
        return res.status(500).json({ error: 'Failed to update clipping' });
      }
      if (!clipping) return res.status(404).json({ error: 'Clipping not found' });

      res.json(clipping);
    } catch (e) {
      console.error('Update clipping error:', e);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // DELETE /api/clippings/:id — delete with ownership check
  router.delete('/:id', async (req, res) => {
    try {
      const { id } = req.params;

      const { error } = await supabase
        .from('clippings')
        .delete()
        .eq('id', id)
        .eq('user_id', req.user.id);

      if (error) {
        console.error('Clipping deletion error:', error);
        return res.status(500).json({ error: 'Failed to delete clipping' });
      }

      res.json({ message: 'Clipping deleted successfully' });
    } catch (e) {
      console.error('Delete clipping error:', e);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  return router;
};
