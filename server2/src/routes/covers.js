// src/routes/covers.js
// Unified Covers Route - single book, batch, status, and regeneration endpoints
import { Router } from 'express';
import { createClient } from '@supabase/supabase-js';
import { ensureCoverForBook, ensureCoversForBooks } from '../services/covers.js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

export function coversRouter(authenticateToken) {
  const router = Router();

  // =====================================================
  // Single Book Cover Operations
  // =====================================================

  /**
   * POST /covers/resolve - Get or create cover for a single book
   * Body: { bookId, title?, author?, isbn?, isbn10?, isbn13?, genre? }
   */
  router.post('/resolve', authenticateToken, async (req, res) => {
    try {
      const { bookId, title, author, isbn, isbn10, isbn13, genre } = req.body;
      const id = bookId || req.query?.bookId;

      if (!id) {
        return res.status(400).json({ error: 'bookId required' });
      }

      // Get book details if not fully provided
      let book = { id, title, author, isbn, isbn10, isbn13, genre };

      if (!title || !author) {
        const { data: bookData, error } = await supabase
          .from('books')
          .select('*')
          .eq('id', id)
          .eq('user_id', req.user.id)
          .single();

        if (error || !bookData) {
          return res.status(404).json({ error: 'Book not found' });
        }

        book = bookData;
      }

      const result = await ensureCoverForBook(book);

      res.json({
        success: true,
        ...result
      });

    } catch (error) {
      console.error('Cover resolve error:', error);
      res.status(500).json({
        error: 'Cover resolve failed',
        message: error.message
      });
    }
  });

  /**
   * POST /covers/regenerate/:bookId - Force regenerate cover for a book
   */
  router.post('/regenerate/:bookId', authenticateToken, async (req, res) => {
    try {
      const { bookId } = req.params;

      // Get book and verify ownership
      const { data: book, error } = await supabase
        .from('books')
        .select('*')
        .eq('id', bookId)
        .eq('user_id', req.user.id)
        .single();

      if (error || !book) {
        return res.status(404).json({ error: 'Book not found' });
      }

      // Clear existing cover to force regeneration
      await supabase
        .from('books')
        .update({
          cover_url: null,
          cover_base: null,
          cover_source: null
        })
        .eq('id', bookId);

      // Generate new cover
      const result = await ensureCoverForBook(book);

      res.json({
        success: true,
        message: 'Cover regenerated',
        ...result
      });

    } catch (error) {
      console.error('Regenerate error:', error);
      res.status(500).json({
        error: 'Failed to regenerate cover',
        message: error.message
      });
    }
  });

  // =====================================================
  // Batch Operations
  // =====================================================

  /**
   * POST /covers/batch - Batch process covers for multiple books
   * Body: { bookIds?: string[], processAll?: boolean }
   */
  router.post('/batch', authenticateToken, async (req, res) => {
    try {
      const { bookIds, processAll = false } = req.body;

      let books;

      if (processAll) {
        // Process all user's books without covers
        const { data, error } = await supabase
          .from('books')
          .select('*')
          .eq('user_id', req.user.id)
          .or('cover_url.is.null,cover_url.eq.placeholder');

        if (error) throw error;
        books = data || [];

      } else if (bookIds && Array.isArray(bookIds)) {
        // Process specific books
        const { data, error } = await supabase
          .from('books')
          .select('*')
          .eq('user_id', req.user.id)
          .in('id', bookIds);

        if (error) throw error;
        books = data || [];

      } else {
        return res.status(400).json({
          error: 'Provide bookIds array or set processAll to true'
        });
      }

      if (books.length === 0) {
        return res.json({
          success: true,
          message: 'No books to process',
          processed: 0
        });
      }

      // Return immediately, process in background
      res.json({
        success: true,
        message: `Processing ${books.length} books in background`,
        booksCount: books.length,
        estimatedTime: `${Math.ceil(books.length * 0.5)} seconds`
      });

      // Continue processing in background
      ensureCoversForBooks(books, { batchSize: 5, delay: 300 })
        .then(results => {
          const succeeded = results.filter(r => r.success).length;
          console.log(`✅ Batch cover processing complete: ${succeeded}/${books.length} successful`);
        })
        .catch(error => {
          console.error('❌ Batch processing error:', error);
        });

    } catch (error) {
      console.error('Batch covers error:', error);
      res.status(500).json({
        error: 'Failed to process covers',
        message: error.message
      });
    }
  });

  // =====================================================
  // Status & Metadata
  // =====================================================

  /**
   * GET /covers/status - Get cover processing status for user's library
   */
  router.get('/status', authenticateToken, async (req, res) => {
    try {
      const { data: stats, error } = await supabase
        .from('books')
        .select('cover_url, cover_source')
        .eq('user_id', req.user.id);

      if (error) throw error;

      const total = stats.length;
      const withCovers = stats.filter(b => b.cover_url && !b.cover_url.includes('placeholder')).length;
      const generated = stats.filter(b => b.cover_source === 'generated').length;
      const external = stats.filter(b => b.cover_source && b.cover_source !== 'generated').length;
      const missing = total - withCovers;

      res.json({
        total,
        withCovers,
        missing,
        coverage: total > 0 ? Math.round((withCovers / total) * 100) : 0,
        sources: {
          generated,
          external,
          missing
        }
      });

    } catch (error) {
      console.error('Status error:', error);
      res.status(500).json({
        error: 'Failed to get status',
        message: error.message
      });
    }
  });

  /**
   * GET /covers/etag - Get cover etag for cache validation
   */
  router.get('/etag', authenticateToken, async (req, res) => {
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({ error: 'id required' });
    }

    const { data, error } = await supabase
      .from('books')
      .select('cover_etag')
      .eq('id', id)
      .eq('user_id', req.user.id)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'Not found' });
    }

    return res.json({ etag: data.cover_etag });
  });

  return router;
}
