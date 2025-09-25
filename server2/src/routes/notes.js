// src/routes/notes.js
import { Router } from 'express';
import { supabase } from '../config/supabaseClient.js';

export const notesRouter = (authenticateToken) => {
  const router = Router();

  // All routes in this router require auth
  router.use(authenticateToken);

  // GET /api/notes  → all notes for the user (used by NotesPage)
  router.get('/', async (req, res) => {
    try {
      const { data: notes, error: notesError } = await supabase
        .from('notes')
        .select('*')
        .eq('user_id', req.user.id)
        .order('created_at', { ascending: false });

      if (notesError) {
        console.error('Notes fetch error:', notesError);
        return res.status(500).json({ error: 'Failed to fetch notes' });
      }

      // Attach minimal book info (id, title, author) for any notes with book_id
      if (notes?.length) {
        const bookIds = [...new Set(notes.filter(n => n.book_id).map(n => n.book_id))];
        if (bookIds.length) {
          const { data: books, error: booksError } = await supabase
            .from('books')
            .select('id, title, author')
            .in('id', bookIds)
            .eq('user_id', req.user.id);

          if (!booksError && books) {
            const map = new Map(books.map(b => [b.id, b]));
            notes.forEach(n => {
              if (n.book_id && map.has(n.book_id)) n.book = map.get(n.book_id);
            });
          }
        }
      }

      res.json(notes || []);
    } catch (e) {
      console.error('Notes endpoint error:', e);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // POST /api/notes → create a general note (used by NotesPage)
  router.post('/', async (req, res) => {
    try {
      const { title, content, book_id, tags } = req.body;
      if (!content?.trim()) return res.status(400).json({ error: 'Note content is required' });

      const noteData = {
        user_id: req.user.id,
        book_id: book_id || null,
        content: content.trim(),
        title: title?.trim() || null,
        type: 'note',
        tags: Array.isArray(tags) ? tags : [],
        created_at: new Date().toISOString(),
      };

      const { data: note, error } = await supabase
        .from('notes')
        .insert(noteData)
        .select()
        .single();

      if (error) {
        console.error('Note creation error:', error);
        return res.status(500).json({ error: 'Failed to create note' });
      }

      res.status(201).json(note);
    } catch (e) {
      console.error('Create note error:', e);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // GET /api/notes/book/:bookId → notes for a specific book (used by BookNotesSystem)
  router.get('/book/:bookId', async (req, res) => {
    try {
      const { bookId } = req.params;

      // Ensure the book belongs to the user
      const { data: book, error: bookError } = await supabase
        .from('books')
        .select('id')
        .eq('id', bookId)
        .eq('user_id', req.user.id)
        .single();

      if (bookError || !book) return res.status(404).json({ error: 'Book not found' });

      const { data: notes, error } = await supabase
        .from('notes')
        .select('*')
        .eq('book_id', bookId)
        .eq('user_id', req.user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Notes fetch error:', error);
        return res.status(500).json({ error: 'Failed to fetch notes' });
      }

      res.json(notes || []);
    } catch (e) {
      console.error('Get book notes error:', e);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // POST /api/notes/book/:bookId → create a note for a specific book (BookNotesSystem)
  router.post('/book/:bookId', async (req, res) => {
    try {
      const { bookId } = req.params;
      const { content, type, page, position, color, tags } = req.body;

      if (!content?.trim()) return res.status(400).json({ error: 'Note content is required' });

      // Ensure the book belongs to the user
      const { data: book, error: bookError } = await supabase
        .from('books')
        .select('id')
        .eq('id', bookId)
        .eq('user_id', req.user.id)
        .single();

      if (bookError || !book) return res.status(404).json({ error: 'Book not found' });

      const noteData = {
        user_id: req.user.id,
        book_id: bookId,
        content: content.trim(),
        type: type || 'note',
        page: page ? parseInt(page, 10) : null,
        position: position || null,
        color: color || 'yellow',
        tags: Array.isArray(tags) ? tags : [],
        created_at: new Date().toISOString(),
      };

      const { data: note, error } = await supabase
        .from('notes')
        .insert(noteData)
        .select()
        .single();

      if (error) {
        console.error('Note creation error:', error);
        return res.status(500).json({ error: 'Failed to create note' });
      }

      res.status(201).json(note);
    } catch (e) {
      console.error('Create book note error:', e);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // PUT /api/notes/:id → update a note
  router.put('/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const { content, type, page, position, color, tags } = req.body;

      if (!content?.trim()) return res.status(400).json({ error: 'Note content is required' });

      const updateData = {
        content: content.trim(),
        type: type || 'note',
        page: page ? parseInt(page, 10) : null,
        position: position || null,
        color: color || 'yellow',
        tags: Array.isArray(tags) ? tags : [],
        updated_at: new Date().toISOString(),
      };

      const { data: note, error } = await supabase
        .from('notes')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', req.user.id)
        .select()
        .single();

      if (error) {
        console.error('Note update error:', error);
        return res.status(500).json({ error: 'Failed to update note' });
      }
      if (!note) return res.status(404).json({ error: 'Note not found' });

      res.json(note);
    } catch (e) {
      console.error('Update note error:', e);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // DELETE /api/notes/:id → delete a note
  router.delete('/:id', async (req, res) => {
    try {
      const { id } = req.params;

      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', id)
        .eq('user_id', req.user.id);

      if (error) {
        console.error('Note deletion error:', error);
        return res.status(500).json({ error: 'Failed to delete note' });
      }

      res.json({ message: 'Note deleted successfully' });
    } catch (e) {
      console.error('Delete note error:', e);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  return router;
};
