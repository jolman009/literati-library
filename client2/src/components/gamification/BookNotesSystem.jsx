// src/components/gamification/BookNotesSystem.jsx - FIXED VERSION
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { gamificationAPI } from '../../config/api';
import { useGamification } from '../../contexts/GamificationContext';


// Constants for better maintainability
const NOTE_TYPES = ['note', 'highlight', 'bookmark'];
const HIGHLIGHT_COLORS = ['yellow', 'green', 'blue', 'pink', 'purple'];

// 🔧 FIXED: Corrected initial form structure to match backend
const INITIAL_NOTE_FORM = {
  note: '',        // Changed from 'content' to 'note' to match component usage
  page_number: '',
  type: 'note',
  color: 'yellow',
  tags: []
};

// Custom hook for note form management
const useNoteForm = () => {
  const [noteForm, setNoteForm] = useState(INITIAL_NOTE_FORM);
  const [currentTag, setCurrentTag] = useState('');

  const resetForm = useCallback(() => {
    setNoteForm(INITIAL_NOTE_FORM);
    setCurrentTag('');
  }, []);

  const updateForm = useCallback((updates) => {
    setNoteForm(prev => ({ ...prev, ...updates }));
  }, []);

  const addTag = useCallback((tag) => {
    if (tag.trim() && !noteForm.tags.includes(tag.trim())) {
      setNoteForm(prev => ({
        ...prev,
        tags: [...prev.tags, tag.trim()]
      }));
      setCurrentTag('');
    }
  }, [noteForm.tags]);

  const removeTag = useCallback((indexToRemove) => {
    setNoteForm(prev => ({
      ...prev,
      tags: prev.tags.filter((_, index) => index !== indexToRemove)
    }));
  }, []);

  return {
    noteForm,
    currentTag,
    setCurrentTag,
    resetForm,
    updateForm,
    addTag,
    removeTag
  };
};

// Custom hook for notes management
const useNotes = (selectedBook, token) => {
  const { trackAction } = useGamification();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchNotes = useCallback(async () => {
    if (!token || !selectedBook?.id) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const data = await gamificationAPI.getNotes(token, selectedBook.id);
      setNotes(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching notes:', err);
      setError('Failed to fetch notes. Please try again.');
      setNotes([]);
    } finally {
      setLoading(false);
    }
  }, [selectedBook?.id, token]);

  const createNote = useCallback(async (noteData) => {
    if (!token || !selectedBook) return { success: false, error: 'Missing required data' };
    
    // 🔧 FIXED: Better validation
    if (!noteData.note?.trim()) {
      return { success: false, error: 'Note content is required' };
    }
    
    setLoading(true);
    setError(null);
    
    try {
      await gamificationAPI.createNote(token, {
        ...noteData,
        book_id: selectedBook.id
      });

      // 🔧 NEW: Track note creation for gamification
      try {
        await trackAction('note_created', {
          noteType: noteData.type,
          bookId: selectedBook.id,
          bookTitle: selectedBook.title
        });
      } catch (trackError) {
        console.warn('Failed to track note creation:', trackError);
        // Don't fail the note creation if tracking fails
      }

      await fetchNotes();
      return { success: true };
    } catch (err) {
      console.error('Error creating note:', err);
      const errorMessage = 'Failed to save note. Please try again.';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [token, selectedBook, fetchNotes]);

  const deleteNote = useCallback(async (noteId) => {
    if (!token || !window.confirm('Are you sure you want to delete this note?')) {
      return { success: false };
    }
    
    setLoading(true);
    setError(null);
    
    try {
      await gamificationAPI.deleteNote(token, noteId);
      await fetchNotes();
      return { success: true };
    } catch (err) {
      console.error('Error deleting note:', err);
      const errorMessage = 'Failed to delete note. Please try again.';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [token, fetchNotes]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  return {
    notes,
    loading,
    error,
    createNote,
    deleteNote,
    refetchNotes: fetchNotes
  };
};

// Utility functions
const getColorClass = (color) => {
  const colorMap = {
    yellow: 'bg-yellow-100 border-yellow-300',
    green: 'bg-green-100 border-green-300',
    blue: 'bg-blue-100 border-blue-300',
    pink: 'bg-pink-100 border-pink-300',
    purple: 'bg-purple-100 border-purple-300'
  };
  return colorMap[color] || colorMap.yellow;
};

const formatDate = (dateString) => {
  try {
    return new Date(dateString).toLocaleDateString();
  } catch {
    return 'Invalid date';
  }
};

// Memoized components
const NoteTypeIcon = React.memo(({ type }) => {
  const iconMap = {
    highlight: <span className="text-yellow-500">🖍️</span>,
    bookmark: <span className="text-purple-500">🔖</span>,
    note: <span className="text-blue-500">📝</span>
  };
  return iconMap[type] || iconMap.note;
});

const ErrorMessage = React.memo(({ message, onDismiss }) => (
  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
    <div className="flex items-center justify-between">
      <div className="flex items-center">
        <span className="text-red-500 mr-2">⚠️</span>
        <span className="text-red-700">{message}</span>
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="text-red-500 hover:text-red-700"
          aria-label="Dismiss error"
        >
          ×
        </button>
      )}
    </div>
  </div>
));

const LoadingSpinner = React.memo(() => (
  <div className="flex items-center justify-center p-4">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
  </div>
));

const BookNotesSystem = ({ books = [] }) => {
  const { token } = useAuth();
  const [selectedBook, setSelectedBook] = useState(null);
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const { notes, loading, error, createNote, deleteNote } = useNotes(selectedBook, token);
  const {
    noteForm,
    currentTag,
    setCurrentTag,
    resetForm,
    updateForm,
    addTag,
    removeTag
  } = useNoteForm();

  // Memoized filtered notes for performance
  const filteredNotes = useMemo(() => {
    return notes.filter(note => {
      const matchesType = filterType === 'all' || note.type === filterType;
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = !searchQuery || 
        (note.content?.toLowerCase().includes(searchLower)) ||
        (note.tags?.some(tag => tag.toLowerCase().includes(searchLower)));
      
      return matchesType && matchesSearch;
    });
  }, [notes, filterType, searchQuery]);

  // Event handlers
  const handleSubmitNote = useCallback(async (e) => {
    e.preventDefault();
    
    if (!noteForm.note.trim()) {
      return;
    }

    const result = await createNote(noteForm);
    if (result.success) {
      resetForm();
      setShowNoteForm(false);
    }
  }, [noteForm, createNote, resetForm]);

  const handleAddTag = useCallback((e) => {
    if (e.key === 'Enter' && currentTag.trim()) {
      e.preventDefault();
      addTag(currentTag);
    }
  }, [currentTag, addTag]);

  const handleDeleteNote = useCallback(async (noteId) => {
    await deleteNote(noteId);
  }, [deleteNote]);

  const handleCancelForm = useCallback(() => {
    setShowNoteForm(false);
    resetForm();
  }, [resetForm]);

  // Early return for no token
  if (!token) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <p className="text-gray-600">Please log in to view your notes.</p>
      </div>
    );
  }

  // Book selection view
  if (!selectedBook) {
    return (
      <div className="space-y-6">
        {error && <ErrorMessage message={error} />}
        
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Select a Book to View Notes</h2>
          
          {loading ? (
            <LoadingSpinner />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {books.map(book => (
                <div
                  key={book.id}
                  onClick={() => setSelectedBook(book)}
                  className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all cursor-pointer"
                >
                  <h3 className="font-medium text-gray-900 truncate">{book.title}</h3>
                  <p className="text-sm text-gray-600 truncate">{book.author}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-xs text-gray-500">{book.format?.toUpperCase()}</span>
                    <div className="text-center">
                      <div className="text-sm font-medium text-blue-600">
                        {notes.filter(n => n.book_id === book.id).length}
                      </div>
                      <div className="text-xs text-gray-500">Notes</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Main notes view
  return (
    <div className="space-y-6">
      {error && <ErrorMessage message={error} />}
      
      {/* Book Header */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-start justify-between">
          <div>
            <button
              onClick={() => setSelectedBook(null)}
              className="text-sm text-gray-500 hover:text-gray-700 mb-2 focus:outline-none focus:underline"
            >
              ← Back to books
            </button>
            <h2 className="text-2xl font-bold text-gray-900">{selectedBook.title}</h2>
            <p className="text-gray-600">{selectedBook.author}</p>
          </div>
          <div className="flex items-center space-x-3">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{filteredNotes.length}</div>
              <div className="text-xs text-gray-500">Total Notes</div>
            </div>
            <button
              onClick={() => setShowNoteForm(!showNoteForm)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            >
              + Add Note
            </button>
          </div>
        </div>
      </div>

      {/* Add Note Form */}
      {showNoteForm && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Note</h3>
          <form onSubmit={handleSubmitNote} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type
              </label>
              <div className="flex space-x-3">
                {NOTE_TYPES.map(type => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => updateForm({ type })}
                    className={`px-4 py-2 rounded-lg capitalize transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      noteForm.type === type
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Note Content *
              </label>
              <textarea
                value={noteForm.note}
                onChange={(e) => updateForm({ note: e.target.value })}
                placeholder="Write your note here..."
                rows={4}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Page Number
                </label>
                <input
                  type="number"
                  value={noteForm.page_number}
                  onChange={(e) => updateForm({ page_number: e.target.value })}
                  placeholder="Optional"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Color
                </label>
                <select
                  value={noteForm.color}
                  onChange={(e) => updateForm({ color: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {HIGHLIGHT_COLORS.map(color => (
                    <option key={color} value={color} className="capitalize">
                      {color}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tags
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {noteForm.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(index)}
                      className="ml-1 text-blue-600 hover:text-blue-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <input
                type="text"
                value={currentTag}
                onChange={(e) => setCurrentTag(e.target.value)}
                onKeyPress={handleAddTag}
                placeholder="Add tags (press Enter)"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex space-x-3">
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save Note'}
              </button>
              <button
                type="button"
                onClick={handleCancelForm}
                className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filter and Search */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div className="flex space-x-2">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1 rounded-lg text-sm ${
                filterType === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
              }`}
            >
              All ({notes.length})
            </button>
            {NOTE_TYPES.map(type => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-3 py-1 rounded-lg text-sm capitalize ${
                  filterType === type ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
                }`}
              >
                {type} ({notes.filter(n => n.type === type).length})
              </button>
            ))}
          </div>
          <input
            type="text"
            placeholder="Search notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="px-3 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Notes List */}
      <div className="space-y-4">
        {loading ? (
          <LoadingSpinner />
        ) : filteredNotes.length > 0 ? (
          filteredNotes.map(note => (
            <div
              key={note.id}
              className={`bg-white rounded-xl p-4 shadow-sm border border-gray-100 ${getColorClass(note.color)}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <NoteTypeIcon type={note.type} />
                    <span className="text-xs text-gray-500 capitalize">{note.type}</span>
                    {note.page && (
                      <span className="text-xs text-gray-500">• Page {note.page}</span>
                    )}
                    <span className="text-xs text-gray-500">• {formatDate(note.created_at)}</span>
                  </div>
                  <p className="text-gray-900">{note.content}</p>
                  {note.tags && note.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {note.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-600"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => handleDeleteNote(note.id)}
                  className="text-red-500 hover:text-red-700 p-1"
                  title="Delete note"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">
              {searchQuery ? 'No notes found matching your search.' : 'No notes yet. Create your first note!'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookNotesSystem;
