// src/pages/MD3NotesPage.jsx - Material Design 3 Notes Implementation
import React, { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";

import { useAuth } from '../contexts/AuthContext';
import { useGamification } from '../contexts/GamificationContext';
import { useMaterial3Theme } from '../contexts/Material3ThemeContext';
import API from '../config/api';
import { 
  MD3Card, 
  MD3Button,
  MD3TextField,
  MD3Dialog,
  MD3DialogActions,
  MD3Chip,
  MD3FloatingActionButton,
  MD3IconButton,
  MD3Select,
  useSnackbar
} from '../components/Material3';
import { 
  PlusCircle, 
  Search, 
  Edit, 
  Trash2, 
  FileText, 
  X,
  BookOpen,
  Tag,
  Plus
} from 'lucide-react';
import './MD3NotesPage.css';

import { useReadingSession } from '../contexts/ReadingSessionContext';

const MD3NotesPage = () => {
  const { user } = useAuth();
  const { actualTheme } = useMaterial3Theme();
  const { showSnackbar } = useSnackbar();
  const { trackAction } = useGamification();
  const [notes, setNotes] = useState([]);
  const [books, setBooks] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('all'); // all, with-book, no-book, tags

  const navigate = useNavigate();

  const extractPageFromNote = (note) => {
  // 1) tags like "page:7" or "p.7"
  if (Array.isArray(note.tags)) {
    for (const t of note.tags) {
      const s = String(t);
      let m = s.match(/^page:(\d+)$/i);
      if (m) return parseInt(m[1], 10);
      m = s.match(/^p[.:]?(\d+)$/i); // p.7 or p:7
      if (m) return parseInt(m[1], 10);
    }
  }
  // 2) content prefix like "[p.7] ..."
  const m2 = note.content?.match(/^\s*\[p\.(\d+)\]/i);
  if (m2) return parseInt(m2[1], 10);

  return null;
};

const extractCfiFromNote = (note) => {
  // If you later store CFI server-side, check here:
  return note.locator_cfi || note.cfi || null;
};

const openAtLocation = (note) => {
  if (!note.book_id) return;
  const cfi = extractCfiFromNote(note);
  if (cfi) {
    navigate(`/read/${note.book_id}?cfi=${encodeURIComponent(cfi)}`);
    return;
  }
  const page = extractPageFromNote(note);
  if (page) {
    navigate(`/read/${note.book_id}?page=${page}`);
  } else {
    navigate(`/read/${note.book_id}`);
  }
};


  // Form state
  const [noteForm, setNoteForm] = useState({
    title: '',
    content: '',
    book_id: '',
    tags: ''
  });

  // Load notes and books when user is available
  useEffect(() => {
    if (user) {
      fetchNotes();
      fetchBooks();
    }
  }, [user]);

  const fetchNotes = async () => {
    try {
      setLoading(true);
      const response = await API.get('/notes', { timeout: 30000 });
      setNotes(response.data || []);
    } catch (error) {
      console.error('Error fetching notes:', error);
      showSnackbar({
        message: 'Failed to load notes. Please try again.',
        variant: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchBooks = async () => {
    try {
      const response = await API.get('/books', { timeout: 30000 });
      let booksData = [];
      if (Array.isArray(response.data)) {
        booksData = response.data;
      } else if (Array.isArray(response.data.books)) {
        booksData = response.data.books;
      }
      setBooks(booksData);
    } catch (error) {
      console.error('Error fetching books:', error);
      setBooks([]);
    }
  };

  const handleOpenModal = (note = null) => {
    if (note) {
      setEditingNote(note);
      setNoteForm({
        title: note.title || '',
        content: note.content || '',
        book_id: note.book_id || '',
        tags: Array.isArray(note.tags) ? note.tags.join(', ') : ''
      });
    } else {
      setEditingNote(null);
      setNoteForm({
        title: '',
        content: '',
        book_id: '',
        tags: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingNote(null);
    setNoteForm({
      title: '',
      content: '',
      book_id: '',
      tags: ''
    });
  };

  const handleSaveNote = async (e) => {
    e.preventDefault();
    
    if (!noteForm.title.trim() || !noteForm.content.trim()) {
      showSnackbar({
        message: 'Title and content are required',
        variant: 'error'
      });
      return;
    }

    try {
      setLoading(true);

      const noteData = {
        title: noteForm.title.trim(),
        content: noteForm.content.trim(),
        book_id: noteForm.book_id || null,
        tags: noteForm.tags ? noteForm.tags.split(',').map(tag => tag.trim()).filter(Boolean) : []
      };

      if (editingNote) {
        await API.patch(`/notes/${editingNote.id}`, noteData, { timeout: 30000 });
        showSnackbar({
          message: 'Note updated successfully!',
          variant: 'success'
        });
      } else {
        const response = await API.post('/notes', noteData, { timeout: 30000 });

        // Track note creation for gamification
        try {
          await trackAction('note_created', {
            noteId: response.data.id,
            bookId: noteData.book_id,
            noteLength: noteData.content.length,
            hasTags: noteData.tags.length > 0
          });
          console.log('✅ Note creation tracked - 15 points awarded');
        } catch (trackError) {
          console.error('Failed to track note creation:', trackError);
          // Don't fail note creation if tracking fails
        }

        showSnackbar({
          message: 'Note created successfully! +15 points earned!',
          variant: 'success'
        });
      }

      handleCloseModal();
      fetchNotes();
    } catch (error) {
      console.error('Error saving note:', error);
      showSnackbar({
        message: error.response?.data?.error || 'Failed to save note',
        variant: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteNote = async (noteId) => {
    if (!window.confirm('Are you sure you want to delete this note? This action cannot be undone.')) {
      return;
    }

    try {
      setLoading(true);
      await API.delete(`/notes/${noteId}`, { timeout: 30000 });
      showSnackbar({
        message: 'Note deleted successfully!',
        variant: 'success'
      });
      fetchNotes();
    } catch (error) {
      console.error('Error deleting note:', error);
      showSnackbar({
        message: 'Failed to delete note. Please try again.',
        variant: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Filter notes based on search term and filter type
  const filteredNotes = notes.filter(note => {
    // Search filter
    const matchesSearch = 
      note.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      note.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (Array.isArray(note.tags) && note.tags.some(tag => 
        tag.toLowerCase().includes(searchTerm.toLowerCase())
      ));

    // Category filter
    let matchesFilter = true;
    switch(selectedFilter) {
      case 'with-book':
        matchesFilter = !!note.book_id;
        break;
      case 'no-book':
        matchesFilter = !note.book_id;
        break;
      case 'tags':
        matchesFilter = note.tags && note.tags.length > 0;
        break;
      default:
        matchesFilter = true;
    }

    return matchesSearch && matchesFilter;
  });

  if (!user) {
    return (
      <div className="md3-notes-page">
        <div className="md3-notes-container">
          <MD3Card variant="outlined" className="md3-notes-empty-state">
            <FileText className="md3-notes-empty-icon" />
            <h3 className="md3-notes-empty-title">
              Please log in to access your notes
            </h3>
          </MD3Card>
        </div>
      </div>
    );
  }

  return (
    <div className="md3-notes-page">
      <div className="md3-notes-container">
        {/* Header Card */}
        <MD3Card variant="filled" className="md3-notes-header">
          <div className="md3-notes-header-content">
            <div className="md3-notes-header-text">
              <h1 className="md3-notes-title">
                📝 My Notes
              </h1>
              <p className="md3-notes-subtitle">
                You have {filteredNotes.length} {filteredNotes.length === 1 ? 'note' : 'notes'}
              </p>
            </div>
            
            <div className="md3-notes-header-actions">
              {/* Search Field */}
              <MD3TextField
                variant="outlined"
                label="Search notes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                leadingIcon={<Search className="md3-icon" />}
                className="md3-notes-search"
              />
              
              {/* Filter Chips */}
              <div className="md3-notes-filter-chips">
                <MD3Chip
                  label="All"
                  selected={selectedFilter === 'all'}
                  onClick={() => setSelectedFilter('all')}
                />
                <MD3Chip
                  label="With Book"
                  selected={selectedFilter === 'with-book'}
                  onClick={() => setSelectedFilter('with-book')}
                />
                <MD3Chip
                  label="No Book"
                  selected={selectedFilter === 'no-book'}
                  onClick={() => setSelectedFilter('no-book')}
                />
                <MD3Chip
                  label="Tagged"
                  selected={selectedFilter === 'tags'}
                  onClick={() => setSelectedFilter('tags')}
                />
              </div>
            </div>
          </div>
        </MD3Card>

        {/* Notes Grid */}
        {loading && !isModalOpen ? (
          <MD3Card variant="outlined" className="md3-notes-loading">
            <div className="md3-notes-spinner" />
            <p>Loading notes...</p>
          </MD3Card>
        ) : filteredNotes.length > 0 ? (
          <div className="md3-notes-grid">
            {filteredNotes.map(note => (
              <MD3Card 
                key={note.id} 
                variant="elevated" 
                className="md3-note-card"
                interactive
              >
                <div className="md3-note-content">
                  <h3 className="md3-note-title">
                    {note.title}
                  </h3>
                  <p className="md3-note-text">
                    {note.content}
                  </p>
                  
                  {/* Tags */}
                  {note.tags && note.tags.length > 0 && (
                    <div className="md3-note-tags">
                      {note.tags.slice(0, 3).map((tag, index) => (
                        <MD3Chip 
                          key={index} 
                          label={`#${tag}`} 
                          size="small"
                          variant="assist"
                        />
                      ))}
                      {note.tags.length > 3 && (
                        <MD3Chip 
                          label={`+${note.tags.length - 3}`} 
                          size="small"
                          variant="outlined"
                        />
                      )}
                    </div>
                  )}
                  
                  {/* Linked Book */}
                  {note.book_id && (
                    <div className="md3-note-book">
                      <BookOpen className="md3-note-book-icon" />
                      <span className="md3-note-book-text">
                        {books.find(book => book.id === note.book_id)?.title || 'Unknown Book'}
                      </span>
                    </div>
                  )}
                  
                  {/* Jump back into the book at this note's spot */}
                {note.book_id && (
                  <div className="md3-note-open">
    <MD3Button
      variant="filled-tonal"
      size="small"
      onClick={() => openAtLocation(note)}
      icon={<BookOpen className="md3-icon" />}
    >
      Open at location
    </MD3Button>
  </div>
)}

                  {/* Creation Date */}
                  <p className="md3-note-date">
                    Created: {new Date(note.created_at).toLocaleDateString()}
                  </p>
                </div>
                
                {/* Actions */}
                <div className="md3-note-actions">
                  <MD3IconButton 
                    onClick={() => handleOpenModal(note)}
                    title="Edit note"
                  >
                    <Edit className="md3-icon-small" />
                  </MD3IconButton>
                  <MD3IconButton 
                    onClick={() => handleDeleteNote(note.id)}
                    title="Delete note"
                    variant="error"
                  >
                    <Trash2 className="md3-icon-small" />
                  </MD3IconButton>
                </div>
              </MD3Card>
            ))}
          </div>
        ) : (
          <MD3Card variant="outlined" className="md3-notes-empty-state">
            <FileText className="md3-notes-empty-icon" />
            <h3 className="md3-notes-empty-title">
              {searchTerm ? 'No notes found' : 'No notes yet'}
            </h3>
            <p className="md3-notes-empty-text">
              {searchTerm 
                ? "Try adjusting your search term." 
                : "Create your first note to get started!"
              }
            </p>
            {!searchTerm && (
              <MD3Button
                variant="filled"
                onClick={() => handleOpenModal()}
                icon={<PlusCircle className="md3-icon" />}
              >
                Create Your First Note
              </MD3Button>
            )}
          </MD3Card>
        )}

        {/* Floating Action Button */}
        {filteredNotes.length > 0 && (
          <MD3FloatingActionButton
            className="md3-notes-fab"
            onClick={() => handleOpenModal()}
            icon={<Plus size={24} />}
            label="New Note"
            extended
          />
        )}

        {/* Modal Dialog */}
        <MD3Dialog
          open={isModalOpen}
          onClose={handleCloseModal}
          title={editingNote ? 'Edit Note' : 'Create New Note'}
          maxWidth="md"
        >
          <form onSubmit={handleSaveNote}>
            <div className="md3-dialog-content">
              {/* Title Field */}
              <MD3TextField
                label="Title"
                required
                fullWidth
                value={noteForm.title}
                onChange={e => setNoteForm({...noteForm, title: e.target.value})}
                placeholder="Enter note title..."
              />

              {/* Content Field */}
              <MD3TextField
                label="Content"
                required
                multiline
                rows={6}
                fullWidth
                value={noteForm.content}
                onChange={e => setNoteForm({...noteForm, content: e.target.value})}
                placeholder="Write your note content here..."
              />

              {/* Book Selection */}
              <MD3Select
                label="Link to Book (Optional)"
                value={noteForm.book_id}
                onChange={e => setNoteForm({...noteForm, book_id: e.target.value})}
                fullWidth
              >
                <option value="">No book selected</option>
                {books.map(book => (
                  <option key={book.id} value={book.id}>
                    {book.title} {book.author && `by ${book.author}`}
                  </option>
                ))}
              </MD3Select>

              {/* Tags Field */}
              <MD3TextField
                label="Tags (Optional)"
                fullWidth
                value={noteForm.tags}
                onChange={e => setNoteForm({...noteForm, tags: e.target.value})}
                placeholder="Enter tags separated by commas..."
                helperText="Example: book review, philosophy, quotes"
                leadingIcon={<Tag className="md3-icon" />}
              />
            </div>

            <MD3DialogActions>
              <MD3Button 
                variant="text" 
                onClick={handleCloseModal}
              >
                Cancel
              </MD3Button>
              <MD3Button 
                variant="filled"
                type="submit"
                disabled={loading}
                loading={loading}
              >
                {editingNote ? 'Update Note' : 'Create Note'}
              </MD3Button>
            </MD3DialogActions>
          </form>
        </MD3Dialog>
      </div>
    </div>
  );
};

export default MD3NotesPage;