// Fixed Notes Endpoints - Add these to your index.js file

// ============================================================================
// NOTES ENDPOINTS - FIXED VERSION
// ============================================================================

// Get notes for a specific book (used by BookNotesSystem)
app.get('/books/:bookId/notes', authenticateToken, async (req, res) => {
  try {
    const { bookId } = req.params;
    console.log('📝 Fetching notes for book:', bookId, 'user:', req.user.id);

    // First verify the book belongs to the user
    const { data: book, error: bookError } = await supabase
      .from('books')
      .select('id')
      .eq('id', bookId)
      .eq('user_id', req.user.id)
      .single();

    if (bookError || !book) {
      return res.status(404).json({ error: 'Book not found' });
    }

    // Get notes for the book
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

    console.log(`✅ Fetched ${notes?.length || 0} notes for book ${bookId}`);
    res.json(notes || []);
  } catch (error) {
    console.error('Get book notes error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create a note for a specific book (used by BookNotesSystem)
app.post('/books/:bookId/notes', authenticateToken, async (req, res) => {
  try {
    const { bookId } = req.params;
    const { content, type, page, position, color, tags } = req.body;

    console.log('📝 Creating note for book:', bookId, 'user:', req.user.id);

    if (!content?.trim()) {
      return res.status(400).json({ error: 'Note content is required' });
    }

    // First verify the book belongs to the user
    const { data: book, error: bookError } = await supabase
      .from('books')
      .select('id')
      .eq('id', bookId)
      .eq('user_id', req.user.id)
      .single();

    if (bookError || !book) {
      return res.status(404).json({ error: 'Book not found' });
    }

    const noteData = {
      user_id: req.user.id,
      book_id: bookId,
      content: content.trim(),
      type: type || 'note',
      page: page ? parseInt(page) : null,
      position: position || null,
      color: color || 'yellow',
      tags: Array.isArray(tags) ? tags : [],
      created_at: new Date().toISOString()
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

    console.log('✅ Note created successfully:', note.id);
    res.status(201).json(note);
  } catch (error) {
    console.error('Create book note error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get ALL notes for a user (used by NotesPage) - FIXED VERSION
app.get('/notes', authenticateToken, async (req, res) => {
  try {
    console.log('📝 Fetching all notes for user:', req.user.id);

    // Get notes with book information using separate queries
    const { data: notes, error: notesError } = await supabase
      .from('notes')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (notesError) {
      console.error('Notes fetch error:', notesError);
      return res.status(500).json({ error: 'Failed to fetch notes' });
    }

    // If there are notes, get book information for each
    if (notes && notes.length > 0) {
      const bookIds = [...new Set(notes.filter(n => n.book_id).map(n => n.book_id))];
      
      if (bookIds.length > 0) {
        const { data: books, error: booksError } = await supabase
          .from('books')
          .select('id, title, author')
          .in('id', bookIds)
          .eq('user_id', req.user.id);

        if (!booksError && books) {
          // Create a map for quick lookup
          const bookMap = books.reduce((map, book) => {
            map[book.id] = book;
            return map;
          }, {});

          // Add book information to notes
          notes.forEach(note => {
            if (note.book_id && bookMap[note.book_id]) {
              note.books = bookMap[note.book_id];
            }
          });
        }
      }
    }

    console.log(`✅ Fetched ${notes?.length || 0} notes for user`);
    res.json(notes || []);
  } catch (error) {
    console.error('Notes endpoint error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update a note (PUT method for full updates)
app.put('/notes/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { content, type, page, position, color, tags } = req.body;

    console.log('📝 Updating note:', id, 'user:', req.user.id);

    if (!content?.trim()) {
      return res.status(400).json({ error: 'Note content is required' });
    }

    const updateData = {
      content: content.trim(),
      type: type || 'note',
      page: page ? parseInt(page) : null,
      position: position || null,
      color: color || 'yellow',
      tags: Array.isArray(tags) ? tags : [],
      updated_at: new Date().toISOString()
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

    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }

    console.log('✅ Note updated successfully:', note.id);
    res.json(note);
  } catch (error) {
    console.error('Update note error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete a note - FIXED VERSION
app.delete('/notes/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    console.log('📝 Deleting note:', id, 'user:', req.user.id);

    const { error } = await supabase
      .from('notes')
      .delete()
      .eq('id', id)
      .eq('user_id', req.user.id);

    if (error) {
      console.error('Note deletion error:', error);
      return res.status(500).json({ error: 'Failed to delete note' });
    }

    console.log('✅ Note deleted successfully:', id);
    res.json({ message: 'Note deleted successfully' });
  } catch (error) {
    console.error('Delete note error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});