// Enhanced covers route with batch processing
import { Router } from 'express';
import { ensureBookCover, ensureCoversForBooks } from '../services/coverEnhanced.js';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

export default function coversEnhancedRouter(authenticateToken) {
  const router = Router();

// Get or create cover for a single book
  router.post('/ensure', authenticateToken, async (req, res) => {
  try {
    const { bookId, title, author, isbn, isbn10, isbn13, genre } = req.body;
    
    if (!bookId) {
      return res.status(400).json({ error: 'Book ID is required' });
    }
    
    // Get book details if not provided
    let book = { id: bookId, title, author, isbn, isbn10, isbn13, genre };
    
    if (!title || !author) {
      const { data: bookData, error } = await supabase
        .from('books')
        .select('*')
        .eq('id', bookId)
        .eq('user_id', req.user.id)
        .single();
      
      if (error || !bookData) {
        return res.status(404).json({ error: 'Book not found' });
      }
      
      book = bookData;
    }
    
    const result = await ensureBookCover(book);
    
    res.json({
      success: true,
      ...result
    });
    
  } catch (error) {
    console.error('Cover ensure error:', error);
    res.status(500).json({ 
      error: 'Failed to ensure cover',
      message: error.message 
    });
  }
  });

// Batch process covers for multiple books
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
    
    // Process in background and return immediately
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

// Get cover processing status
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

// Regenerate cover for a book (force new fetch/generation)
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
    const result = await ensureBookCover(book);
    
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

  return router;
}
