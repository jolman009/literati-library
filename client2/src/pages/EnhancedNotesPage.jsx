// src/pages/EnhancedNotesPage.jsx - Interactive Notes with Visualizations
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
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
  MD3Menu,
  MD3MenuItem,
  MD3MenuDivider,
  useSnackbar
} from '../components/Material3';
import ReadingAssistant from '../services/ReadingAssistant';
import {
  PlusCircle,
  Search,
  Edit,
  Trash2,
  FileText,
  BookOpen,
  Tag,
  Plus,
  Calendar,
  BarChart3,
  Cloud,
  Grid,
  Filter,
  TrendingUp,
  Hash,
  Clock,
  Book,
  X,
  ChevronDown,
  CheckSquare,
  Square
} from 'lucide-react';
import './EnhancedNotesPage.css';

// Word Cloud Component
const WordCloud = ({ notes }) => {
  const wordFrequency = useMemo(() => {
    const words = {};
    const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'was', 'are', 'were', 'been', 'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'them', 'their', 'my', 'your', 'our', 'its']);
    
    notes.forEach(note => {
      const text = `${note.title} ${note.content}`.toLowerCase();
      const wordArray = text.match(/\b[a-z]+\b/g) || [];
      
      wordArray.forEach(word => {
        if (word.length > 3 && !stopWords.has(word)) {
          words[word] = (words[word] || 0) + 1;
        }
      });
    });
    
    return Object.entries(words)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 30)
      .map(([word, count]) => ({ word, count }));
  }, [notes]);
  
  const maxCount = Math.max(...wordFrequency.map(w => w.count), 1);
  
  return (
    <div style={{
      display: 'flex',
      flexWrap: 'wrap',
      gap: '12px',
      justifyContent: 'center',
      padding: '24px',
      minHeight: '200px',
      backgroundColor: 'var(--md-sys-color-surface-container)'
    }}>
      {wordFrequency.map(({ word, count }) => {
        const fontSize = 14 + (count / maxCount) * 28;
        const opacity = 0.5 + (count / maxCount) * 0.5;
        const colors = ['#24A8E0', '#24A8E0', '#3F51B5', '#2196F3', '#00BCD4', '#009688', '#4CAF50'];
        const color = colors[Math.floor(Math.random() * colors.length)];
        
        return (
          <span
            key={word}
            style={{
              fontSize: `${fontSize}px`,
              opacity,
              color,
              fontWeight: count > maxCount * 0.5 ? '600' : '400',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              padding: '4px 8px',
              borderRadius: '4px',
              ':hover': {
                backgroundColor: `${color}10`,
                transform: 'scale(1.1)'
              }
            }}
            title={`${word}: ${count} occurrences`}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = `${color}15`;
              e.target.style.transform = 'scale(1.1)';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'transparent';
              e.target.style.transform = 'scale(1)';
            }}
          >
            {word}
          </span>
        );
      })}
      {wordFrequency.length === 0 && (
        <p style={{ color: 'var(--md-sys-color-on-surface-variant)', fontSize: '14px' }}>
          Create more notes to see word frequency visualization
        </p>
      )}
    </div>
  );
};

// Timeline View Component
const TimelineView = ({ notes, onNoteClick }) => {
  const groupedNotes = useMemo(() => {
    const groups = {};
    notes.forEach(note => {
      const date = new Date(note.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      if (!groups[date]) groups[date] = [];
      groups[date].push(note);
    });
    return Object.entries(groups).sort((a, b) => new Date(b[0]) - new Date(a[0]));
  }, [notes]);

  return (
    <div style={{
      padding: '24px',
      backgroundColor: 'var(--md-sys-color-surface-container)'
    }}>
      {groupedNotes.map(([date, dateNotes]) => (
        <div key={date} style={{ marginBottom: '32px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: '16px',
            position: 'relative'
          }}>
            <div style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              backgroundColor: '#24A8E0',
              marginRight: '16px',
              position: 'relative',
              zIndex: 2
            }} />
            <h3 style={{
              margin: 0,
              fontSize: '16px',
              fontWeight: '600',
              color: 'var(--md-sys-color-primary)'
            }}>
              {date}
            </h3>
            <div style={{
              flex: 1,
              height: '1px',
              backgroundColor: 'var(--md-sys-color-outline-variant)',
              marginLeft: '16px'
            }} />
          </div>

          <div style={{
            marginLeft: '28px',
            borderLeft: '2px solid var(--md-sys-color-outline-variant)',
            paddingLeft: '24px'
          }}>
            {dateNotes.map(note => (
              <div
                key={note.id}
                onClick={() => onNoteClick(note)}
                className="timeline-note-item"
                style={{
                  marginBottom: '16px',
                  padding: '12px 16px',
                  backgroundColor: 'var(--md-sys-color-surface-container-low)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  border: '1px solid var(--md-sys-color-outline-variant)'
                }}
              >
                <h4 style={{
                  margin: '0 0 8px 0',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: 'var(--md-sys-color-on-surface)'
                }}>
                  {note.title}
                </h4>
                <p style={{
                  margin: '0 0 8px 0',
                  fontSize: '13px',
                  color: 'var(--md-sys-color-on-surface-variant)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical'
                }}>
                  {note.content}
                </p>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {note.tags?.slice(0, 3).map((tag, i) => (
                    <span key={i} style={{
                      fontSize: '11px',
                      padding: '2px 8px',
                      backgroundColor: 'var(--md-sys-color-surface-container-high)',
                      color: 'var(--md-sys-color-primary)',
                      borderRadius: '12px'
                    }}>
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

// Statistics Dashboard
const StatsDashboard = ({ notes, books }) => {
  const stats = useMemo(() => {
    const totalNotes = notes.length;
    const notesWithBooks = notes.filter(n => n.book_id).length;
    const totalTags = new Set(notes.flatMap(n => n.tags || [])).size;
    const avgLength = notes.reduce((acc, n) => acc + n.content.length, 0) / (totalNotes || 1);

    // Notes per month
    const monthlyNotes = {};
    notes.forEach(note => {
      const month = new Date(note.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short'
      });
      monthlyNotes[month] = (monthlyNotes[month] || 0) + 1;
    });

    // Top books with notes
    const bookNotes = {};
    notes.forEach(note => {
      if (note.book_id) {
        bookNotes[note.book_id] = (bookNotes[note.book_id] || 0) + 1;
      }
    });

    const topBooks = Object.entries(bookNotes)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([bookId, count]) => ({
        book: books.find(b => b.id === bookId),
        count
      }));

    return {
      totalNotes,
      notesWithBooks,
      totalTags,
      avgLength: Math.round(avgLength),
      monthlyNotes,
      topBooks
    };
  }, [notes, books]);

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '16px',
      padding: '24px',
      backgroundColor: 'var(--md-sys-color-surface-container)'
    }}>
      <MD3Card style={{
        padding: '20px',
        textAlign: 'center',
        backgroundColor: 'var(--md-sys-color-surface-container-high)',
        border: '1px solid var(--md-sys-color-outline-variant)'
      }}>
        <FileText size={32} style={{ color: 'var(--md-sys-color-primary)', marginBottom: '8px' }} />
        <h3 style={{
          margin: '0 0 4px 0',
          fontSize: '24px',
          fontWeight: '600',
          color: 'var(--md-sys-color-on-surface)'
        }}>
          {stats.totalNotes}
        </h3>
        <p style={{
          margin: 0,
          fontSize: '14px',
          color: 'var(--md-sys-color-on-surface-variant)'
        }}>Total Notes</p>
      </MD3Card>

      <MD3Card style={{
        padding: '20px',
        textAlign: 'center',
        backgroundColor: 'var(--md-sys-color-surface-container-high)',
        border: '1px solid var(--md-sys-color-outline-variant)'
      }}>
        <Book size={32} style={{ color: '#2196F3', marginBottom: '8px' }} />
        <h3 style={{
          margin: '0 0 4px 0',
          fontSize: '24px',
          fontWeight: '600',
          color: 'var(--md-sys-color-on-surface)'
        }}>
          {stats.notesWithBooks}
        </h3>
        <p style={{
          margin: 0,
          fontSize: '14px',
          color: 'var(--md-sys-color-on-surface-variant)'
        }}>Linked to Books</p>
      </MD3Card>

      <MD3Card style={{
        padding: '20px',
        textAlign: 'center',
        backgroundColor: 'var(--md-sys-color-surface-container-high)',
        border: '1px solid var(--md-sys-color-outline-variant)'
      }}>
        <Hash size={32} style={{ color: '#4CAF50', marginBottom: '8px' }} />
        <h3 style={{
          margin: '0 0 4px 0',
          fontSize: '24px',
          fontWeight: '600',
          color: 'var(--md-sys-color-on-surface)'
        }}>
          {stats.totalTags}
        </h3>
        <p style={{
          margin: 0,
          fontSize: '14px',
          color: 'var(--md-sys-color-on-surface-variant)'
        }}>Unique Tags</p>
      </MD3Card>

      <MD3Card style={{
        padding: '20px',
        textAlign: 'center',
        backgroundColor: 'var(--md-sys-color-surface-container-high)',
        border: '1px solid var(--md-sys-color-outline-variant)'
      }}>
        <TrendingUp size={32} style={{ color: '#FF9800', marginBottom: '8px' }} />
        <h3 style={{
          margin: '0 0 4px 0',
          fontSize: '24px',
          fontWeight: '600',
          color: 'var(--md-sys-color-on-surface)'
        }}>
          {stats.avgLength}
        </h3>
        <p style={{
          margin: 0,
          fontSize: '14px',
          color: 'var(--md-sys-color-on-surface-variant)'
        }}>Avg. Characters</p>
      </MD3Card>
    </div>
  );
};

const EnhancedNotesPage = () => {
  const { user, makeAuthenticatedApiCall } = useAuth();
  const { showSnackbar } = useSnackbar();
  
  // Core state
  const [notes, setNotes] = useState([]);
  const [books, setBooks] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [loading, setLoading] = useState(false);
  // AI summary & selection state
  const [selectedNoteIds, setSelectedNoteIds] = useState([]);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [summaryResult, setSummaryResult] = useState(null);
  const [summarizing, setSummarizing] = useState(false);
  const [tagToSummarize, setTagToSummarize] = useState('');
  const [summaryContext, setSummaryContext] = useState(null);
  const [summarizeMenuOpen, setSummarizeMenuOpen] = useState(false);
  const [summarizeAnchor, setSummarizeAnchor] = useState(null);
  const [autoSaveSummary, setAutoSaveSummary] = useState(false);
  
  // View and filter state
  const [viewMode, setViewMode] = useState('grid'); // grid, timeline, cloud, stats
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [selectedTags, setSelectedTags] = useState(new Set());
  const [dateRange] = useState({ start: null, end: null });
  
  // Form state
  const [noteForm, setNoteForm] = useState({
    title: '',
    content: '',
    book_id: '',
    tags: ''
  });

  // Load data
  useEffect(() => {
    if (user) {
      fetchNotes();
      fetchBooks();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);
  
  const fetchNotes = useCallback(async () => {
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
  }, [showSnackbar]);
  
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
  
  // Note management functions
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
    console.warn('✅ About to set isModalOpen to true');
    setIsModalOpen(true);
    console.warn('✅ setIsModalOpen(true) called');
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
  
  // Ensure Dashboard stats update immediately after note creation
  const { trackAction } = useGamification();

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

        // Track locally so Dashboard stats refresh without waiting for server breakdown
        try {
          console.warn('🎯 EnhancedNotesPage: About to call trackAction for note_created');
          const serverGamification = response?.data?.gamification;
          console.warn('📊 EnhancedNotesPage: Server gamification snapshot:', serverGamification);
          console.warn('🎮 EnhancedNotesPage: trackAction function exists?', typeof trackAction);

          await trackAction('note_created', {
            noteId: response?.data?.id,
            bookId: noteData.book_id,
            noteLength: (noteData.content || '').length,
            hasTags: Array.isArray(noteData.tags) && noteData.tags.length > 0
          }, { serverSnapshot: serverGamification });

          console.warn('✅ EnhancedNotesPage: trackAction completed successfully');
        } catch (trackErr) {
          console.error('❌ EnhancedNotesPage: note_created local tracking failed:', trackErr);
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
  
  const [confirmDeleteNote, setConfirmDeleteNote] = useState(null); // single note object
  const [isDeletingNote, setIsDeletingNote] = useState(false);
  const [confirmDeleteBulk, setConfirmDeleteBulk] = useState(false); // bulk delete confirm
  const [isDeletingBulk, setIsDeletingBulk] = useState(false);

  const handleDeleteNote = async (noteId) => {
    try {
      setIsDeletingNote(true);
      await makeAuthenticatedApiCall(`/notes/${noteId}`, { method: 'DELETE' });
      showSnackbar({ message: 'Note deleted successfully!', variant: 'success' });
      await fetchNotes();
    } catch (error) {
      console.error('Error deleting note:', error);
      showSnackbar({ message: error?.message || 'Failed to delete note. Please try again.', variant: 'error' });
    } finally {
      setIsDeletingNote(false);
      setConfirmDeleteNote(null);
    }
  };

  const handleDeleteSelected = async () => {
    if (!Array.isArray(selectedNoteIds) || selectedNoteIds.length === 0) return;
    try {
      setIsDeletingBulk(true);
      const results = await Promise.allSettled(
        selectedNoteIds.map(id => makeAuthenticatedApiCall(`/notes/${id}`, { method: 'DELETE' }))
      );
      const succeeded = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.length - succeeded;
      if (succeeded > 0) {
        showSnackbar({ message: `Deleted ${succeeded} note${succeeded === 1 ? '' : 's'}`, variant: failed ? 'warning' : 'success' });
      }
      if (failed > 0) {
        showSnackbar({ message: `${failed} note${failed === 1 ? '' : 's'} failed to delete`, variant: 'error' });
      }
      clearSelection();
      await fetchNotes();
    } catch (error) {
      console.error('Bulk delete failed:', error);
      showSnackbar({ message: error?.message || 'Failed to delete selected notes', variant: 'error' });
    } finally {
      setIsDeletingBulk(false);
      setConfirmDeleteBulk(false);
    }
  };
  
  // Get all unique tags
  const allTags = useMemo(() => {
    const tags = new Set();
    notes.forEach(note => {
      (note.tags || []).forEach(tag => tags.add(tag));
    });
    return Array.from(tags).sort();
  }, [notes]);
  
  // Advanced filtering
  const filteredNotes = useMemo(() => {
    return notes.filter(note => {
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
        case 'recent':
          { const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          matchesFilter = new Date(note.created_at) > weekAgo;
          break; }
        default:
          matchesFilter = true;
      }
      
      // Tag filter
      const matchesTags = selectedTags.size === 0 || 
        (note.tags || []).some(tag => selectedTags.has(tag));
      
      // Date range filter
      let matchesDate = true;
      if (dateRange.start || dateRange.end) {
        const noteDate = new Date(note.created_at);
        if (dateRange.start && noteDate < new Date(dateRange.start)) matchesDate = false;
        if (dateRange.end && noteDate > new Date(dateRange.end)) matchesDate = false;
      }
      
      return matchesSearch && matchesFilter && matchesTags && matchesDate;
    });
  }, [notes, searchTerm, selectedFilter, selectedTags, dateRange]);

  // Selection helpers
  const toggleSelectNote = useCallback((noteId) => {
    setSelectedNoteIds(prev => prev.includes(noteId) ? prev.filter(id => id !== noteId) : [...prev, noteId]);
  }, []);
  const clearSelection = useCallback(() => setSelectedNoteIds([]), []);

  // handleSaveSummaryAsNote must be defined BEFORE the summarization handlers that depend on it
  const handleSaveSummaryAsNote = useCallback(async (resultOverride = null, contextOverride = null) => {
    const effectiveResult = resultOverride || summaryResult;
    const effectiveContext = contextOverride || summaryContext;
    if (!effectiveResult) return;
    try {
      const mode = effectiveContext?.mode;
      let candidateNotes = [];
      if (mode === 'selection' && Array.isArray(effectiveContext?.ids)) {
        candidateNotes = notes.filter(n => effectiveContext.ids.includes(n.id));
      } else if (mode === 'tags' && effectiveContext?.tag) {
        const tag = effectiveContext.tag;
        candidateNotes = notes.filter(n => Array.isArray(n.tags) && n.tags.some(t => t.toLowerCase().includes(tag.toLowerCase())));
      } else if (mode === 'filtered') {
        candidateNotes = filteredNotes;
      }

      const uniqueBooks = Array.from(new Set(candidateNotes.map(n => n.book_id).filter(Boolean)));
      const book_id = uniqueBooks.length === 1 ? uniqueBooks[0] : null;

      const title = effectiveResult.title || 'Notes Summary';
      const parts = [];
      if (effectiveResult.summary) parts.push(effectiveResult.summary);
      if (Array.isArray(effectiveResult.bullets) && effectiveResult.bullets.length) {
        parts.push('\nKey Points:\n' + effectiveResult.bullets.slice(0, 10).map(b => `- ${b}`).join('\n'));
      }
      if (Array.isArray(effectiveResult.themes) && effectiveResult.themes.length) {
        parts.push('\nThemes:\n' + effectiveResult.themes.slice(0, 8).map(t => `- ${t.name}: ${t.explanation}`).join('\n'));
      }
      if (Array.isArray(effectiveResult.questions) && effectiveResult.questions.length) {
        parts.push('\nQuestions:\n' + effectiveResult.questions.slice(0, 6).map(q => `- ${q}`).join('\n'));
      }
      if (Array.isArray(effectiveResult.nextSteps) && effectiveResult.nextSteps.length) {
        parts.push('\nNext Steps:\n' + effectiveResult.nextSteps.slice(0, 6).map(s => `- ${s}`).join('\n'));
      }
      const content = parts.join('\n\n').trim();

      const tags = ['ai-summary'];
      if (mode === 'tags' && effectiveContext?.tag) tags.push(`tag:${effectiveContext.tag}`);
      if (mode === 'selection') tags.push('selection-summary');
      if (mode === 'filtered') tags.push('filtered-summary');
      if (effectiveContext?.searchTerm) tags.push(`search:${effectiveContext.searchTerm}`);
      if (effectiveContext?.selectedFilter && effectiveContext.selectedFilter !== 'all') tags.push(`filter:${effectiveContext.selectedFilter}`);

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
  }, [summaryResult, summaryContext, notes, filteredNotes, showSnackbar, clearSelection, fetchNotes]);

  // Summarization handlers
  const handleSummarizeSelection = useCallback(async () => {
    if (selectedNoteIds.length === 0) return;
    try {
      const count = selectedNoteIds.length;
      if (count > 100) {
        showSnackbar({ message: `Large selection (${count} notes). Summarization may be slow.`, variant: 'warning' });
        const proceed = window.confirm(`You are about to summarize ${count} notes. Continue?`);
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
      const context = { mode: 'selection', ids: selectedNoteIds.slice() };
      const result = await ReadingAssistant.summarizeNotes({ notes: contents, title, mode: 'book', tags });
      if (result) {
        if (autoSaveSummary) {
          await handleSaveSummaryAsNote(result, context);
        } else {
          setSummaryResult(result);
          setSummaryContext(context);
          setSummaryOpen(true);
        }
      } else {
        showSnackbar({ message: 'Failed to summarize selected notes', variant: 'error' });
      }
    } catch (e) {
      console.error('Summarize selection error:', e);
      showSnackbar({ message: 'Summarization failed', variant: 'error' });
    } finally {
      setSummarizing(false);
    }
  }, [selectedNoteIds, notes, showSnackbar, autoSaveSummary, handleSaveSummaryAsNote]);

  const handleSummarizeByTag = useCallback(async () => {
    const tag = tagToSummarize.trim();
    if (!tag) return;
    try {
      setSummarizing(true);
      const tagged = notes.filter(n => Array.isArray(n.tags) && n.tags.some(t => t.toLowerCase().includes(tag.toLowerCase())));
      const count = tagged.length;
      if (count === 0) {
        showSnackbar({ message: `No notes found with tag: ${tag}`, variant: 'warning' });
        return;
      }
      if (count > 100) {
        showSnackbar({ message: `Large selection (${count} notes). Summarization may be slow.`, variant: 'warning' });
        const proceed = window.confirm(`You are about to summarize ${count} notes. Continue?`);
        if (!proceed) return;
      }
      if (count < 3) {
        showSnackbar({ message: `Only ${count} note${count === 1 ? '' : 's'} with this tag. Consider adding more for a stronger summary.`, variant: 'warning' });
      }
      const contents = tagged.map(n => n.content).filter(Boolean);
      const title = `Summary: #${tag}`;
      const tags = [tag];
      const context = { mode: 'tags', tag };
      const result = await ReadingAssistant.summarizeNotes({ notes: contents, title, mode: 'tags', tags });
      if (result) {
        if (autoSaveSummary) {
          await handleSaveSummaryAsNote(result, context);
        } else {
          setSummaryResult(result);
          setSummaryContext(context);
          setSummaryOpen(true);
        }
      } else {
        showSnackbar({ message: 'Failed to summarize by tag', variant: 'error' });
      }
    } catch (e) {
      console.error('Summarize by tag error:', e);
      showSnackbar({ message: 'Summarization failed', variant: 'error' });
    } finally {
      setSummarizing(false);
    }
  }, [tagToSummarize, notes, showSnackbar, autoSaveSummary, handleSaveSummaryAsNote]);

  const handleSummarizeFiltered = useCallback(async () => {
    try {
      if (!filteredNotes || filteredNotes.length === 0) return;
      const count = filteredNotes.length;
      if (count > 100) {
        showSnackbar({ message: `Large selection (${count} notes). Summarization may be slow.`, variant: 'warning' });
        const proceed = window.confirm(`You are about to summarize ${count} notes. Continue?`);
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
      const tagCounts = new Map();
      for (const n of filteredNotes) {
        const t = Array.isArray(n.tags) ? n.tags : [];
        for (const tag of t) tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
      }
      const topTags = Array.from(tagCounts.entries()).sort((a,b) => b[1]-a[1]).slice(0,5).map(([k]) => k);
      const titleBase = searchTerm ? `Summary: search:"${searchTerm}"` : 'Summary: Filtered Notes';
      const title = `${titleBase} (${contents.length})`;
      const context = { mode: 'filtered', searchTerm, selectedFilter };
      const result = await ReadingAssistant.summarizeNotes({ notes: contents, title, mode: 'filtered', tags: topTags });
      if (result) {
        if (autoSaveSummary) {
          await handleSaveSummaryAsNote(result, context);
        } else {
          setSummaryResult(result);
          setSummaryContext(context);
          setSummaryOpen(true);
        }
      } else {
        showSnackbar({ message: 'Failed to summarize filtered notes', variant: 'error' });
      }
    } catch (e) {
      console.error('Summarize filtered error:', e);
      showSnackbar({ message: 'Summarization failed', variant: 'error' });
    } finally {
      setSummarizing(false);
    }
  }, [filteredNotes, searchTerm, selectedFilter, showSnackbar, autoSaveSummary, handleSaveSummaryAsNote]);

  // Render note card
  const renderNoteCard = (note) => (
    <MD3Card 
      key={note.id} 
      variant="elevated" 
      className="md3-note-card"
      interactive
      style={{
        position: 'relative',
        overflow: 'hidden',
        transition: 'all 0.3s ease'
      }}
    >
      {/* Selection checkbox */}
      <div style={{ position: 'absolute', top: 10, right: 10, zIndex: 2 }}>
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
        <p className="md3-note-text" style={{
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          display: '-webkit-box',
          WebkitLineClamp: 4,
          WebkitBoxOrient: 'vertical'
        }}>
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
                onClick={(e) => {
                  e.stopPropagation();
                  const newTags = new Set(selectedTags);
                  if (newTags.has(tag)) {
                    newTags.delete(tag);
                  } else {
                    newTags.add(tag);
                  }
                  setSelectedTags(newTags);
                }}
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
          <Clock size={14} style={{
            marginRight: '4px',
            verticalAlign: 'middle'
          }} />
          {new Date(note.created_at).toLocaleDateString()}
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
          onClick={() => setConfirmDeleteNote(note)}
          title="Delete note"
          className="md3-icon-button md3-icon-button--error"
        >
          <Trash2 className="md3-icon-small" />
        </button>
      </div>
    </MD3Card>
  );
  
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
        {/* Enhanced Header */}
        <MD3Card variant="filled" className="md3-notes-header" style={{
          background: 'linear-gradient(135deg, var(--brand-gradient-start), var(--brand-gradient-end))',
          color: 'white',
          padding: '32px 24px',
          marginBottom: '24px'
        }}>
          <div className="md3-notes-header-content">
            <div className="md3-notes-header-text">
              <h1 className="md3-notes-title" style={{ color: 'white', fontSize: '2.5rem' }}>
                📝 My Notes Hub
              </h1>
              <p className="md3-notes-subtitle" style={{ color: 'rgba(255,255,255,0.9)' }}>
                {filteredNotes.length} {filteredNotes.length === 1 ? 'note' : 'notes'} • 
                {allTags.length} tags • 
                {books.filter(b => notes.some(n => n.book_id === b.id)).length} books
              </p>
            </div>
            
            <div className="md3-notes-header-actions" style={{ gap: '16px' }}>
              {/* Search Field */}
              <MD3TextField
                variant="outlined"
                placeholder="Search notes, tags, content..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                leadingIcon={<Search className="md3-icon" />}
                trailingIcon={
                  searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'rgba(255,255,255,0.7)',
                        borderRadius: '50%',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)';
                        e.currentTarget.style.color = 'white';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = 'rgba(255,255,255,0.7)';
                      }}
                      title="Clear search"
                    >
                      <X size={18} />
                    </button>
                  )
                }
                className="md3-notes-search"
                style={{
                  borderRadius: '12px',
                  minWidth: '300px'
                }}
              />
              
              {/* Create Note Button */}
              <button
                onClick={() => {
                  console.warn('New Note button clicked!');
                  handleOpenModal();
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  backgroundColor: 'white',
                  color: '#24A8E0',
                  fontWeight: '600',
                  padding: '12px 24px',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '16px',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                }}
              >
                <Plus size={20} />
                New Note
              </button>

              {/* Summarize split-button */}
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                <MD3Button
                  variant="filled"
                  icon={<FileText className="md3-icon" />}
                  trailingIcon={<ChevronDown size={16} />}
                  onClick={(e) => { setSummarizeMenuOpen(prev => !prev); setSummarizeAnchor(e.currentTarget); }}
                  aria-haspopup="menu"
                  aria-expanded={summarizeMenuOpen}
                >
                  Summarize
                </MD3Button>
              </div>

              {/* View Mode Toggles */}
              <div style={{ display: 'flex', gap: '12px' }}>
                {/* Grid View */}
                <div
                  onClick={() => setViewMode('grid')}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 12px',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    backgroundColor: viewMode === 'grid' ? 'rgba(255,255,255,0.2)' : 'transparent',
                    transition: 'all 0.3s ease',
                    border: viewMode === 'grid' ? '1px solid rgba(255,255,255,0.3)' : '1px solid transparent'
                  }}
                >
                  <Grid size={24} style={{ color: viewMode === 'grid' ? 'white' : 'rgba(255,255,255,0.7)' }} />
                  <span style={{
                    fontSize: '11px',
                    fontWeight: '500',
                    color: viewMode === 'grid' ? 'white' : 'rgba(255,255,255,0.7)',
                    whiteSpace: 'nowrap'
                  }}>
                    Grid
                  </span>
                </div>

                {/* Timeline View */}
                <div
                  onClick={() => setViewMode('timeline')}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 12px',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    backgroundColor: viewMode === 'timeline' ? 'rgba(255,255,255,0.2)' : 'transparent',
                    transition: 'all 0.3s ease',
                    border: viewMode === 'timeline' ? '1px solid rgba(255,255,255,0.3)' : '1px solid transparent'
                  }}
                >
                  <Calendar size={24} style={{ color: viewMode === 'timeline' ? 'white' : 'rgba(255,255,255,0.7)' }} />
                  <span style={{
                    fontSize: '11px',
                    fontWeight: '500',
                    color: viewMode === 'timeline' ? 'white' : 'rgba(255,255,255,0.7)',
                    whiteSpace: 'nowrap'
                  }}>
                    Timeline
                  </span>
                </div>

                {/* Word Cloud View */}
                <div
                  onClick={() => setViewMode('cloud')}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 12px',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    backgroundColor: viewMode === 'cloud' ? 'rgba(255,255,255,0.2)' : 'transparent',
                    transition: 'all 0.3s ease',
                    border: viewMode === 'cloud' ? '1px solid rgba(255,255,255,0.3)' : '1px solid transparent'
                  }}
                >
                  <Cloud size={24} style={{ color: viewMode === 'cloud' ? 'white' : 'rgba(255,255,255,0.7)' }} />
                  <span style={{
                    fontSize: '11px',
                    fontWeight: '500',
                    color: viewMode === 'cloud' ? 'white' : 'rgba(255,255,255,0.7)',
                    whiteSpace: 'nowrap'
                  }}>
                    Word Cloud
                  </span>
                </div>

                {/* Statistics View */}
                <div
                  onClick={() => setViewMode('stats')}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 12px',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    backgroundColor: viewMode === 'stats' ? 'rgba(255,255,255,0.2)' : 'transparent',
                    transition: 'all 0.3s ease',
                    border: viewMode === 'stats' ? '1px solid rgba(255,255,255,0.3)' : '1px solid transparent'
                  }}
                >
                  <BarChart3 size={24} style={{ color: viewMode === 'stats' ? 'white' : 'rgba(255,255,255,0.7)' }} />
                  <span style={{
                    fontSize: '11px',
                    fontWeight: '500',
                    color: viewMode === 'stats' ? 'white' : 'rgba(255,255,255,0.7)',
                    whiteSpace: 'nowrap'
                  }}>
                    Statistics
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Filter Bar */}
          <div style={{ marginTop: '24px', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
            <MD3Chip
              label="All Notes"
              selected={selectedFilter === 'all'}
              onClick={() => setSelectedFilter('all')}
              style={{ backgroundColor: selectedFilter === 'all' ? 'rgba(255,255,255,0.2)' : 'transparent' }}
            />
            <MD3Chip
              label="Recent"
              selected={selectedFilter === 'recent'}
              onClick={() => setSelectedFilter('recent')}
              style={{ backgroundColor: selectedFilter === 'recent' ? 'rgba(255,255,255,0.2)' : 'transparent' }}
            />
            <MD3Chip
              label="With Books"
              selected={selectedFilter === 'with-book'}
              onClick={() => setSelectedFilter('with-book')}
              style={{ backgroundColor: selectedFilter === 'with-book' ? 'rgba(255,255,255,0.2)' : 'transparent' }}
            />
            <MD3Chip
              label="Tagged"
              selected={selectedFilter === 'tags'}
              onClick={() => setSelectedFilter('tags')}
              style={{ backgroundColor: selectedFilter === 'tags' ? 'rgba(255,255,255,0.2)' : 'transparent' }}
            />
            
            {selectedTags.size > 0 && (
              <>
                <div style={{ width: '1px', height: '24px', backgroundColor: 'rgba(255,255,255,0.3)' }} />
                {Array.from(selectedTags).map(tag => (
                  <MD3Chip
                    key={tag}
                    label={`#${tag}`}
                    onDelete={() => {
                      const newTags = new Set(selectedTags);
                      newTags.delete(tag);
                      setSelectedTags(newTags);
                    }}
                    style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
                  />
                ))}
              </>
            )}
          </div>
        </MD3Card>
        {/* Summarize menu */}
        <MD3Menu
          open={summarizeMenuOpen}
          onClose={() => setSummarizeMenuOpen(false)}
          anchorEl={summarizeAnchor}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
          transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        >
          <MD3MenuItem
            icon={<CheckSquare size={16} />}
            onClick={() => { setSummarizeMenuOpen(false); handleSummarizeSelection(); }}
            disabled={selectedNoteIds.length === 0 || summarizing}
          >
            Summarize Selection
          </MD3MenuItem>
          <MD3MenuItem
            icon={<Filter size={16} />}
            onClick={() => { setSummarizeMenuOpen(false); handleSummarizeFiltered(); }}
            disabled={filteredNotes.length === 0 || summarizing}
          >
            Summarize Filtered ({filteredNotes.length})
          </MD3MenuItem>
          <MD3MenuDivider />
          <div style={{ padding: '8px 12px', width: '260px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <Hash size={16} style={{ opacity: 0.8 }} />
              <span className="md-body-small" style={{ opacity: 0.8 }}>Summarize by tag</span>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <MD3TextField
                placeholder="e.g. quotes"
                value={tagToSummarize}
                onChange={(e) => setTagToSummarize(e.target.value)}
                style={{ flex: 1 }}
              />
              <MD3Button
                variant="filled"
                disabled={!tagToSummarize.trim() || summarizing}
                onClick={() => { setSummarizeMenuOpen(false); handleSummarizeByTag(); }}
              >
                Go
              </MD3Button>
            </div>
          </div>
          <MD3MenuDivider />
          <MD3MenuItem
            icon={autoSaveSummary ? <CheckSquare size={16} /> : <Square size={16} />}
            onClick={() => setAutoSaveSummary(v => !v)}
          >
            Auto-save as Note
          </MD3MenuItem>
        </MD3Menu>
        
        {/* Tag Cloud Quick Filter */}
        {allTags.length > 0 && viewMode === 'grid' && (
          <MD3Card variant="outlined" className="md3-tag-filter-card">
            <h3 className="md3-tag-filter-title">
              <Tag size={18} className="md3-tag-filter-icon" />
              Quick Tag Filter
            </h3>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {allTags.slice(0, 15).map(tag => (
                <MD3Chip
                  key={tag}
                  label={`#${tag}`}
                  size="small"
                  selected={selectedTags.has(tag)}
                  onClick={() => {
                    const newTags = new Set(selectedTags);
                    if (newTags.has(tag)) {
                      newTags.delete(tag);
                    } else {
                      newTags.add(tag);
                    }
                    setSelectedTags(newTags);
                  }}
                />
              ))}
              {allTags.length > 15 && (
                <MD3Chip
                  label={`+${allTags.length - 15} more`}
                  size="small"
                  variant="outlined"
                />
              )}
            </div>
          </MD3Card>
        )}
        
        {/* Main Content Area */}
        {loading && !isModalOpen ? (
          <MD3Card variant="outlined" className="md3-notes-loading">
            <div className="md3-notes-spinner" />
            <p>Loading notes...</p>
          </MD3Card>
        ) : (
          <>
            {/* MD3 Delete Confirmation Dialog */}
            {confirmDeleteNote && (
              <div role="dialog" aria-modal="true" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1300 }}>
                <div onClick={() => !isDeletingNote && setConfirmDeleteNote(null)} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)' }} />
                <div className="bg-surface-container-high rounded-large shadow-lg border border-outline-variant" style={{ position: 'relative', maxWidth: 420, width: '92%', padding: 20 }}>
                  <div className="md-title-large mb-1">Delete note?</div>
                  <div className="md-body-medium text-on-surface-variant mb-4">
                    This will permanently delete "{confirmDeleteNote.title || 'Untitled'}".
                  </div>
                  <div className="flex items-center justify-end gap-2">
                    <button className="md3-button md3-button--text" onClick={() => setConfirmDeleteNote(null)} disabled={isDeletingNote}>Cancel</button>
                    <button className="md3-button md3-button--filled" style={{ background: 'var(--md-sys-color-error)', color: 'var(--md-sys-color-on-error)' }} onClick={() => handleDeleteNote(confirmDeleteNote.id)} disabled={isDeletingNote}>
                      {isDeletingNote ? 'Deleting…' : 'Delete'}
                    </button>
                  </div>
                </div>
              </div>
            )}
            {/* Bulk Delete Confirmation Dialog */}
            {confirmDeleteBulk && (
              <div role="dialog" aria-modal="true" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1300 }}>
                <div onClick={() => !isDeletingBulk && setConfirmDeleteBulk(false)} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)' }} />
                <div className="bg-surface-container-high rounded-large shadow-lg border border-outline-variant" style={{ position: 'relative', maxWidth: 420, width: '92%', padding: 20 }}>
                  <div className="md-title-large mb-1">Delete selected notes?</div>
                  <div className="md-body-medium text-on-surface-variant mb-4">
                    This will permanently delete {selectedNoteIds.length} note{selectedNoteIds.length === 1 ? '' : 's'}. This action cannot be undone.
                  </div>
                  <div className="flex items-center justify-end gap-2">
                    <button className="md3-button md3-button--text" onClick={() => setConfirmDeleteBulk(false)} disabled={isDeletingBulk}>Cancel</button>
                    <button className="md3-button md3-button--filled" style={{ background: 'var(--md-sys-color-error)', color: 'var(--md-sys-color-on-error)' }} onClick={handleDeleteSelected} disabled={isDeletingBulk}>
                      {isDeletingBulk ? 'Deleting…' : 'Delete'}
                    </button>
                  </div>
                </div>
              </div>
            )}
            {/* Grid View */}
            {viewMode === 'grid' && (
              filteredNotes.length > 0 ? (
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
                        style={{ backgroundColor: 'var(--md-sys-color-primary-container)', color: 'var(--md-sys-color-on-primary-container)' }} 
                        border="outlined" 
                        disabled={selectedNoteIds.length === 0 || summarizing}
                        onClick={handleSummarizeSelection}
                        icon={<FileText className="md3-icon" />}
                      > 
                        {summarizing ? 'Summarizing…' : 'Summarize Selection'}
                      </MD3Button>
                      <MD3Button
                        variant="filled"
                        disabled={selectedNoteIds.length === 0 || isDeletingBulk}
                        onClick={() => setConfirmDeleteBulk(true)}
                        icon={<Trash2 className="md3-icon" />}
                        style={{ background: 'var(--md-sys-color-error)', color: 'var(--md-sys-color-on-error)' }}
                      >
                        {isDeletingBulk ? 'Deleting…' : 'Delete Selected'}
                      </MD3Button>
                    </div>
                  </div>

                  <div className="md3-notes-grid">
                    {filteredNotes.map(renderNoteCard)}
                  </div>
                </>
              ) : (
                <MD3Card variant="outlined" className="md3-notes-empty-state">
                  <FileText className="md3-notes-empty-icon" />
                  <h3 className="md3-notes-empty-title">
                    {searchTerm || selectedTags.size > 0 ? 'No notes found' : 'No notes yet'}
                  </h3>
                  <p className="md3-notes-empty-text">
                    {searchTerm || selectedTags.size > 0
                      ? "Try adjusting your filters." 
                      : "Create your first note to get started!"
                    }
                  </p>
                  {!searchTerm && selectedTags.size === 0 && (
                    <MD3Button
                      variant="filled"
                      onClick={() => handleOpenModal()}
                      icon={<PlusCircle className="md3-icon" />}
                    >
                      Create Your First Note
                    </MD3Button>
                  )}
                </MD3Card>
              )
            )}
            
            {/* Timeline View */}
            {viewMode === 'timeline' && (
              <MD3Card variant="outlined" className="md3-view-container">
                <TimelineView
                  notes={filteredNotes}
                  onNoteClick={handleOpenModal}
                />
              </MD3Card>
            )}
            
            {/* Word Cloud View */}
            {viewMode === 'cloud' && (
              <MD3Card variant="outlined" className="md3-view-container">
                <h3 className="md3-view-title">
                  Word Frequency Cloud
                </h3>
                <p className="md3-view-subtitle">
                  Most frequently used words across all your notes
                </p>
                <WordCloud notes={filteredNotes} />
              </MD3Card>
            )}
            
            {/* Statistics View */}
            {viewMode === 'stats' && (
              <>
                <StatsDashboard notes={filteredNotes} books={books} />
                
                {/* Top Tags */}
                <MD3Card className="md3-top-tags-card">
                  <h3 className="md3-section-title">
                    Top Tags
                  </h3>
                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    {allTags.map(tag => {
                      const count = notes.filter(n => n.tags?.includes(tag)).length;
                      return (
                        <div key={tag} className="md3-tag-chip">
                          <span style={{ fontSize: '14px' }}>#{tag}</span>
                          <span className="md3-tag-count">
                            {count}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </MD3Card>
              </>
            )}
          </>
        )}

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
            <MD3Button variant="filled" onClick={handleSaveSummaryAsNote} disabled={!summaryResult}>Save as Note</MD3Button>
          </MD3DialogActions>
        </MD3Dialog>
        
        {/* Floating Action Button */}
        <MD3FloatingActionButton
          className="md3-notes-fab"
          onClick={() => handleOpenModal()}
          icon={<Plus size={24} />}
          label="New Note"
          extended
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            backgroundColor: '#24A8E0'
          }}
        />
        
        {/* Modal Dialog */}
        <MD3Dialog
          open={isModalOpen}
          onClose={handleCloseModal}
          title={editingNote ? 'Edit Note' : 'Create New Note'}
          maxWidth="md"
        >
          <form onSubmit={handleSaveNote}>
            <div className="md3-dialog-content">
              <MD3TextField
                label="Title"
                required
                fullWidth
                value={noteForm.title}
                onChange={e => setNoteForm({...noteForm, title: e.target.value})}
                placeholder="Enter note title..."
              />
              
              <MD3TextField
                label="Content"
                required
                multiline
                rows={12}
                fullWidth
                value={noteForm.content}
                onChange={e => setNoteForm({...noteForm, content: e.target.value})}
                placeholder="Write your note content here..."
              />
              
              <div className="md3-select-field">
                <label className="md3-field-label">Link to Book (Optional)</label>
                <select
                  value={noteForm.book_id}
                  onChange={e => setNoteForm({...noteForm, book_id: e.target.value})}
                  className="md3-select"
                >
                  <option value="">No book selected</option>
                  {books.map(book => (
                    <option key={book.id} value={book.id}>
                      {book.title} {book.author && `by ${book.author}`}
                    </option>
                  ))}
                </select>
              </div>
              
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

export default EnhancedNotesPage;


