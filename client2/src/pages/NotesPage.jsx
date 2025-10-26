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
  Plus,
  CheckSquare,
  Square
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
  const [selectedNoteIds, setSelectedNoteIds] = useState([]);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [summaryResult, setSummaryResult] = useState(null);
  const [summarizing, setSummarizing] = useState(false);
  const [tagToSummarize, setTagToSummarize] = useState('');
  const [summaryContext, setSummaryContext] = useState(null);

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
      const response = await API.get('/books', { params: { limit: 200, offset: 0 }, timeout: 30000 });
      const { items = [] } = response.data || {};
      setBooks(items);
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

  // Selection helpers
  const toggleSelectNote = (noteId) => {
    setSelectedNoteIds(prev => prev.includes(noteId) ? prev.filter(id => id !== noteId) : [...prev, noteId]);
  };
  const clearSelection = () => setSelectedNoteIds([]);

  const handleSummarizeSelection = async () => {
    if (selectedNoteIds.length === 0) return;
    try {
      const count = selectedNoteIds.length;
      if (count > 100) {
        showSnackbar({ message: `Large selection (${count} notes). Summarization may be slow.`, variant: 'warning' });
        const proceed = window.confirm(`You are about to summarize ${count} notes. This may take a while. Continue?`);
        if (!proceed) return;
      }
      if (count < 2) {
        showSnackbar({ message: `Only ${count} note selected. Consider selecting more for a stronger summary.`, variant: 'warning' });
      }
      setSummarizing(true);
      const selected = notes.filter(n => selectedNoteIds.includes(n.id));
      const contents = selected.map(n => n.content).filter(Boolean);
      const title = selected.length === 1 ? (selected[0].title || 'Note Summary') : `Summary of ${selected.length} Notes`;
      const tags = Array.from(new Set(selected.flatMap(n => Array.isArray(n.tags) ? n.tags : []))).slice(0, 10);
      const result = await ReadingAssistant.summarizeNotes({ notes: contents, title, mode: 'book', tags });
      if (result) {
        setSummaryResult(result);
        setSummaryContext({ mode: 'selection', ids: selectedNoteIds.slice() });
        setSummaryOpen(true);
      } else {
        showSnackbar({ message: 'Failed to summarize selected notes', variant: 'error' });
      }
    } catch (e) {
      console.error('Summarize selection error:', e);
      showSnackbar({ message: 'Summarization failed', variant: 'error' });
    } finally {
      setSummarizing(false);
    }
  };

  const handleSummarizeByTag = async () => {
    const tag = tagToSummarize.trim();
    if (!tag) return;
    try {
      setSummarizing(true);
      const tagged = notes.filter(n => Array.isArray(n.tags) && n.tags.some(t => t.toLowerCase().includes(tag.toLowerCase())));
      const count = tagged.length;
      if (tagged.length === 0) {
        showSnackbar({ message: `No notes found with tag: ${tag}`, variant: 'warning' });
        return;
      }
      if (count > 100) {
        showSnackbar({ message: `Large selection (${count} notes). Summarization may be slow.`, variant: 'warning' });
        const proceed = window.confirm(`You are about to summarize ${count} notes. This may take a while. Continue?`);
        if (!proceed) return;
      }
      if (count < 3) {
        showSnackbar({ message: `Only ${count} note${count === 1 ? '' : 's'} with this tag. Consider adding more for a stronger summary.`, variant: 'warning' });
      }
      const contents = tagged.map(n => n.content).filter(Boolean);
      const title = `Summary: #${tag}`;
      const tags = [tag];
      const result = await ReadingAssistant.summarizeNotes({ notes: contents, title, mode: 'tags', tags });
      if (result) {
        setSummaryResult(result);
        setSummaryContext({ mode: 'tags', tag });
        setSummaryOpen(true);
      } else {
        showSnackbar({ message: 'Failed to summarize by tag', variant: 'error' });
      }
    } catch (e) {
      console.error('Summarize by tag error:', e);
      showSnackbar({ message: 'Summarization failed', variant: 'error' });
    } finally {
      setSummarizing(false);
    }
  };

  const handleSummarizeFiltered = async () => {
    try {
      if (!filteredNotes || filteredNotes.length === 0) return;
      const count = filteredNotes.length;
      if (count > 100) {
        showSnackbar({ message: `Large selection (${count} notes). Summarization may be slow.`, variant: 'warning' });
        const proceed = window.confirm(`You are about to summarize ${count} notes. This may take a while. Continue?`);
        if (!proceed) return;
      }
      if (count < 3) {
        showSnackbar({ message: `Only ${count} note${count === 1 ? '' : 's'} in filtered view. Consider adding more for a stronger summary.`, variant: 'warning' });
      }
      setSummarizing(true);
      const contents = filteredNotes.map(n => n.content).filter(Boolean);
      if (contents.length === 0) {
        showSnackbar({ message: 'No content to summarize in filtered view', variant: 'warning' });
        return;
      }
      // Aggregate top tags from filtered notes
      const tagCounts = new Map();
      for (const n of filteredNotes) {
        const t = Array.isArray(n.tags) ? n.tags : [];
        for (const tag of t) tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
      }
      const topTags = Array.from(tagCounts.entries()).sort((a,b) => b[1]-a[1]).slice(0,5).map(([k]) => k);
      const titleBase = searchTerm ? `Summary: search:"${searchTerm}"` : 'Summary: Filtered Notes';
      const title = `${titleBase} (${contents.length})`;
      const result = await ReadingAssistant.summarizeNotes({ notes: contents, title, mode: 'filtered', tags: topTags });
      if (result) {
        setSummaryResult(result);
        setSummaryContext({ mode: 'filtered', searchTerm, selectedFilter });
        setSummaryOpen(true);
      } else {
        showSnackbar({ message: 'Failed to summarize filtered notes', variant: 'error' });
      }
    } catch (e) {
      console.error('Summarize filtered error:', e);
      showSnackbar({ message: 'Summarization failed', variant: 'error' });
    } finally {
      setSummarizing(false);
    }
  };

  const handleSaveSummaryAsNote = async () => {
    if (!summaryResult) return;
    try {
      const mode = summaryContext?.mode;
      let candidateNotes = [];
      if (mode === 'selection' && Array.isArray(summaryContext?.ids)) {
        candidateNotes = notes.filter(n => summaryContext.ids.includes(n.id));
      } else if (mode === 'tags' && summaryContext?.tag) {
        const tag = summaryContext.tag;
        candidateNotes = notes.filter(n => Array.isArray(n.tags) && n.tags.some(t => t.toLowerCase().includes(tag.toLowerCase())));
      } else if (mode === 'filtered') {
        candidateNotes = filteredNotes;
      }

      const uniqueBooks = Array.from(new Set(candidateNotes.map(n => n.book_id).filter(Boolean)));
      const book_id = uniqueBooks.length === 1 ? uniqueBooks[0] : null;

      const title = summaryResult.title || 'Notes Summary';
      const parts = [];
      if (summaryResult.summary) parts.push(summaryResult.summary);
      if (Array.isArray(summaryResult.bullets) && summaryResult.bullets.length) {
        parts.push('\nKey Points:\n' + summaryResult.bullets.slice(0, 10).map(b => `- ${b}`).join('\n'));
      }
      if (Array.isArray(summaryResult.themes) && summaryResult.themes.length) {
        parts.push('\nThemes:\n' + summaryResult.themes.slice(0, 8).map(t => `- ${t.name}: ${t.explanation}`).join('\n'));
      }
      if (Array.isArray(summaryResult.questions) && summaryResult.questions.length) {
        parts.push('\nQuestions:\n' + summaryResult.questions.slice(0, 6).map(q => `- ${q}`).join('\n'));
      }
      if (Array.isArray(summaryResult.nextSteps) && summaryResult.nextSteps.length) {
        parts.push('\nNext Steps:\n' + summaryResult.nextSteps.slice(0, 6).map(s => `- ${s}`).join('\n'));
      }
      const content = parts.join('\n\n').trim();

      // Build tags: base + context + top source tags
      const tags = ['ai-summary'];
      if (mode === 'tags' && summaryContext?.tag) tags.push(`tag:${summaryContext.tag}`);
      if (mode === 'selection') tags.push('selection-summary');
      if (mode === 'filtered') tags.push('filtered-summary');
      if (summaryContext?.searchTerm) tags.push(`search:${summaryContext.searchTerm}`);
      if (summaryContext?.selectedFilter && summaryContext.selectedFilter !== 'all') tags.push(`filter:${summaryContext.selectedFilter}`);

      const tagCounts = new Map();
      for (const n of candidateNotes) {
        const t = Array.isArray(n.tags) ? n.tags : [];
        for (const tag of t) tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
      }
      const topTags = Array.from(tagCounts.entries()).sort((a,b) => b[1]-a[1]).slice(0,5).map(([k]) => k);
      const mergedTags = Array.from(new Set([...tags, ...topTags]));

      const payload = { title, content, book_id, tags: mergedTags };
      await API.post('/notes', payload, { timeout: 30000 });
      showSnackbar({ message: 'Summary saved as note!', variant: 'success' });
      setSummaryOpen(false);
      setSummaryResult(null);
      setSummaryContext(null);
      setTagToSummarize('');
      clearSelection();
      fetchNotes();
    } catch (e) {
      console.error('Save summary as note failed:', e);
      showSnackbar({ message: 'Failed to save summary note', variant: 'error' });
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
              {/* Summarize by Tag controls */}
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginLeft: 8 }}>
                <MD3TextField
                  variant="outlined"
                  label="Tag to summarize"
                  value={tagToSummarize}
                  onChange={(e) => setTagToSummarize(e.target.value)}
                  leadingIcon={<Tag className="md3-icon" />}
                  className="md3-notes-search"
                />
                <MD3Button
                  variant="filled"
                  disabled={!tagToSummarize.trim() || summarizing}
                  onClick={handleSummarizeByTag}
                >
                  {summarizing ? 'Summarizing…' : 'Summarize by Tag'}
                </MD3Button>
                <MD3Button
                  variant="filled"
                  disabled={filteredNotes.length === 0 || summarizing}
                  onClick={handleSummarizeFiltered}
                  style={{ whiteSpace: 'nowrap' }}
                >
                  {summarizing ? 'Summarizing…' : `Summarize Filtered (${filteredNotes.length})`}
                </MD3Button>
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
          <>
          {/* Selection toolbar */}
          <div className="md3-notes-toolbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, margin: '12px 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="md-body-small">Selected: {selectedNoteIds.length}</span>
              {selectedNoteIds.length > 0 && (
                <button onClick={clearSelection} className="md3-icon-button" title="Clear selection">
                  <X className="md3-icon-small" />
                </button>
              )}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <MD3Button
                variant="filled"
                disabled={selectedNoteIds.length === 0 || summarizing}
                onClick={handleSummarizeSelection}
                icon={<FileText className="md3-icon" />}
              >
                {summarizing ? 'Summarizing…' : 'Summarize Selection'}
              </MD3Button>
            </div>
          </div>

          <div className="md3-notes-grid">
            {filteredNotes.map(note => (
              <MD3Card 
                key={note.id} 
                variant="elevated" 
                className="md3-note-card"
                interactive
              >
                {/* Selection checkbox */}
                <div style={{ position: 'absolute', top: 10, right: 10 }}>
                  <button
                    onClick={() => toggleSelectNote(note.id)}
                    className="md3-icon-button"
                    title={selectedNoteIds.includes(note.id) ? 'Deselect' : 'Select'}
                  >
                    {selectedNoteIds.includes(note.id) ? <CheckSquare className="md3-icon-small" /> : <Square className="md3-icon-small" />}
                  </button>
                </div>
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
          </>
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

        {/* Summary Dialog */}
        <MD3Dialog
          open={summaryOpen}
          onClose={() => setSummaryOpen(false)}
          title={summaryResult?.title || 'Notes Summary'}
          maxWidth="md"
        >
          <div className="md3-dialog-content">
            {summaryResult ? (
              <>
                {summaryResult.summary && (
                  <p className="md-body-large" style={{ marginBottom: 12 }}>{summaryResult.summary}</p>
                )}
                {Array.isArray(summaryResult.bullets) && summaryResult.bullets.length > 0 && (
                  <div style={{ marginBottom: 12 }}>
                    <h4 className="md-title-small">Key Points</h4>
                    <ul>
                      {summaryResult.bullets.slice(0, 10).map((b, i) => (
                        <li key={i} className="md-body-medium">{b}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {Array.isArray(summaryResult.themes) && summaryResult.themes.length > 0 && (
                  <div style={{ marginBottom: 12 }}>
                    <h4 className="md-title-small">Themes</h4>
                    <ul>
                      {summaryResult.themes.slice(0, 8).map((t, i) => (
                        <li key={i} className="md-body-medium">{t.name}: {t.explanation}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {Array.isArray(summaryResult.questions) && summaryResult.questions.length > 0 && (
                  <div style={{ marginBottom: 12 }}>
                    <h4 className="md-title-small">Questions</h4>
                    <ul>
                      {summaryResult.questions.slice(0, 6).map((q, i) => (
                        <li key={i} className="md-body-medium">{q}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {Array.isArray(summaryResult.nextSteps) && summaryResult.nextSteps.length > 0 && (
                  <div>
                    <h4 className="md-title-small">Next Steps</h4>
                    <ul>
                      {summaryResult.nextSteps.slice(0, 6).map((s, i) => (
                        <li key={i} className="md-body-medium">{s}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            ) : (
              <p>Generating summary…</p>
            )}
          </div>
          <MD3DialogActions>
            <MD3Button variant="text" onClick={() => setSummaryOpen(false)}>Close</MD3Button>
            <MD3Button
              variant="filled"
              onClick={handleSaveSummaryAsNote}
              disabled={!summaryResult}
            >
              Save as Note
            </MD3Button>
          </MD3DialogActions>
        </MD3Dialog>
      </div>
    </div>
  );
};

export default NotesPage;
