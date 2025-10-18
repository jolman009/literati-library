// src/pages/NotesPage.jsx - Material Design 3 Notes Implementation
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useMaterial3Theme } from '../contexts/Material3ThemeContext';
import API from '../config/api';
import { useGamification } from '../contexts/GamificationContext';
import { 
  MD3Card, 
  MD3Button,
  MD3TextField,
  MD3Dialog,
  MD3DialogActions,
  MD3Chip,
  MD3FloatingActionButton,
  useSnackbar
} from '../components/Material3';
import AIReadingCompanion from '../components/AIReadingCompanion';
import ReadingAssistant from '../services/ReadingAssistant';
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
import './NotesPage.css';

const NotesPage = () => {
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
  const [showAICompanion, setShowAICompanion] = useState(false);
  const [selectedBook, setSelectedBook] = useState(null);

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

        // Track locally so Dashboard stats update immediately
        try {
          const serverGamification = response?.data?.gamification;
          await trackAction('note_created', {
            noteId: response?.data?.id,
            bookId: noteData.book_id,
            noteLength: (noteData.content || '').length,
            hasTags: Array.isArray(noteData.tags) && noteData.tags.length > 0
          }, { serverSnapshot: serverGamification });
        } catch (trackErr) {
          console.warn('note_created local tracking failed (non-fatal):', trackErr);
        }
        showSnackbar({
          message: 'Note created successfully!',
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

  // AI-powered note creation
  const handleAICreateNote = async (noteData) => {
    try {
      setLoading(true);
      
      // Enhance note with AI if enabled
      if (noteData.content && noteData.book_id) {
        const bookContext = books.find(book => book.id === noteData.book_id);
        if (bookContext) {
          try {
            const enhancement = await ReadingAssistant.enhanceUserNote(noteData.content, {
              bookId: bookContext.id,
              bookTitle: bookContext.title,
              bookAuthor: bookContext.author,
              bookGenre: bookContext.genre
            });
            
            // If AI provided enhancements, offer them to the user
            if (enhancement.suggestions && enhancement.suggestions.length > 0) {
              const useEnhancements = window.confirm(
                `AI suggests the following improvements:\n\n${enhancement.suggestions.join('\n')}\n\nWould you like to apply these suggestions?`
              );
              
              if (useEnhancements && enhancement.enhancedNote !== noteData.content) {
                noteData.content = enhancement.enhancedNote;
                noteData.tags = [...(noteData.tags || []), 'ai-enhanced'];
              }
            }
          } catch (aiError) {
            console.warn('AI enhancement failed, proceeding with original note:', aiError);
          }
        }
      }

      const response = await API.post('/notes', noteData, { timeout: 30000 });
      
      showSnackbar({
        message: 'AI-powered note created successfully!',
        variant: 'success'
      });
      
      fetchNotes();
      return response.data;
      
    } catch (error) {
      console.error('Error creating AI note:', error);
      showSnackbar({
        message: error.response?.data?.error || 'Failed to create note',
        variant: 'error'
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Handle enhanced book selection for AI companion
  const handleBookSelect = (book) => {
    setSelectedBook(book);
    setShowAICompanion(true);
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
                <MD3Chip
                  label="🧠 AI Helper"
                  variant={showAICompanion ? 'filled' : 'outlined'}
                  selected={showAICompanion}
                  onClick={() => setShowAICompanion(!showAICompanion)}
                />
              </div>
            </div>
          </div>
        </MD3Card>

        {/* AI Reading Companion */}
        {showAICompanion && (
          <MD3Card variant="outlined" className="md3-notes-ai-section">
            {!selectedBook ? (
              <div className="md3-book-selection">
                <h3>Select a Book for AI Analysis</h3>
                <p>Choose a book from your library to enable AI-powered text analysis and smart note suggestions.</p>
                <div className="md3-book-selection-grid">
                  {books.slice(0, 6).map(book => (
                    <div 
                      key={book.id}
                      className="md3-book-selection-item"
                      onClick={() => handleBookSelect(book)}
                    >
                      <div className="md3-book-cover-small">
                        {book.cover_url ? (
                          <img src={book.cover_url} alt={book.title} />
                        ) : (
                          <BookOpen />
                        )}
                      </div>
                      <div className="md3-book-selection-info">
                        <h4>{book.title}</h4>
                        <p>{book.author}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <AIReadingCompanion
                bookId={selectedBook?.id}
                bookTitle={selectedBook?.title}
                bookAuthor={selectedBook?.author}
                bookGenre={selectedBook?.genre}
                onNoteCreate={handleAICreateNote}
                className="md3-notes-ai-companion"
              />
            )}
          </MD3Card>
        )}

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
                  
                  {/* Creation Date */}
                  <p className="md3-note-date">
                    Created: {new Date(note.created_at).toLocaleDateString()}
                  </p>
                </div>
                
                {/* Actions */}
                <div className="md3-note-actions">
                  <button 
                    onClick={() => handleOpenModal(note)}
                    title="Edit note"
                    className="md3-icon-button"
                  >
                    <Edit className="md3-icon-small" />
                  </button>
                  <button 
                    onClick={() => handleDeleteNote(note.id)}
                    title="Delete note"
                    className="md3-icon-button md3-icon-button--error"
                  >
                    <Trash2 className="md3-icon-small" />
                  </button>
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
              <div className="md3-select-field">
                <label className="md3-field-label">Link to Book (Optional)</label>
                <select
                  value={noteForm.book_id}
                  onChange={e => setNoteForm({...noteForm, book_id: e.target.value})}
                  className="md3-select"
                  disabled={false}
                >
                  <option value="">No book selected</option>
                  {books.map(book => (
                    <option key={book.id} value={book.id}>
                      {book.title} {book.author && `by ${book.author}`}
                    </option>
                  ))}
                </select>
              </div>

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

export default NotesPage;
