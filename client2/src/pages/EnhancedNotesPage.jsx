// src/pages/EnhancedNotesPage.jsx - Interactive Notes with Visualizations
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
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
  MD3Surface,
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
  BookOpen,
  Tag,
  Plus,
  Calendar,
  BarChart3,
  Cloud,
  Grid,
  List,
  Filter,
  TrendingUp,
  Hash,
  Clock,
  Book
} from 'lucide-react';
import './EnhancedNotesPage.css';

// Word Cloud Component
const WordCloud = ({ notes, actualTheme }) => {
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
      backgroundColor: actualTheme === 'dark' ? '#1e293b' : '#ffffff'
    }}>
      {wordFrequency.map(({ word, count }) => {
        const fontSize = 14 + (count / maxCount) * 28;
        const opacity = 0.5 + (count / maxCount) * 0.5;
        const colors = ['#6750A4', '#7C4DFF', '#3F51B5', '#2196F3', '#00BCD4', '#009688', '#4CAF50'];
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
        <p style={{ color: actualTheme === 'dark' ? '#94a3b8' : '#666', fontSize: '14px' }}>
          Create more notes to see word frequency visualization
        </p>
      )}
    </div>
  );
};

// Timeline View Component
const TimelineView = ({ notes, onNoteClick, actualTheme }) => {
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
  
  const isDark = actualTheme === 'dark';
  
  return (
    <div style={{ 
      padding: '24px',
      backgroundColor: isDark ? '#1e293b' : '#ffffff'
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
              backgroundColor: '#6750A4',
              marginRight: '16px',
              position: 'relative',
              zIndex: 2
            }} />
            <h3 style={{
              margin: 0,
              fontSize: '16px',
              fontWeight: '600',
              color: isDark ? '#a78bfa' : '#6750A4'
            }}>
              {date}
            </h3>
            <div style={{
              flex: 1,
              height: '1px',
              backgroundColor: isDark ? '#475569' : '#E7E0EC',
              marginLeft: '16px'
            }} />
          </div>
          
          <div style={{
            marginLeft: '28px',
            borderLeft: `2px solid ${isDark ? '#475569' : '#E7E0EC'}`,
            paddingLeft: '24px'
          }}>
            {dateNotes.map(note => (
              <div
                key={note.id}
                onClick={() => onNoteClick(note)}
                style={{
                  marginBottom: '16px',
                  padding: '12px 16px',
                  backgroundColor: isDark ? '#334155' : '#F5F5F5',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  border: '1px solid transparent'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = isDark ? '#475569' : '#EEEEEE';
                  e.currentTarget.style.borderColor = '#6750A4';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = isDark ? '#334155' : '#F5F5F5';
                  e.currentTarget.style.borderColor = 'transparent';
                }}
              >
                <h4 style={{ 
                  margin: '0 0 8px 0', 
                  fontSize: '14px', 
                  fontWeight: '600',
                  color: isDark ? '#f1f5f9' : '#1f2937'
                }}>
                  {note.title}
                </h4>
                <p style={{ 
                  margin: '0 0 8px 0', 
                  fontSize: '13px', 
                  color: isDark ? '#94a3b8' : '#666', 
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
                      backgroundColor: isDark ? '#475569' : '#E7E0EC',
                      color: isDark ? '#a78bfa' : '#6750A4',
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
const StatsDashboard = ({ notes, books, actualTheme }) => {
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
  
  const isDark = actualTheme === 'dark';
  
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '16px',
      padding: '24px',
      backgroundColor: isDark ? '#1e293b' : '#ffffff'
    }}>
      <MD3Card style={{ 
        padding: '20px', 
        textAlign: 'center',
        backgroundColor: isDark ? '#334155' : '#ffffff',
        border: `1px solid ${isDark ? '#475569' : '#e5e7eb'}`
      }}>
        <FileText size={32} style={{ color: '#6750A4', marginBottom: '8px' }} />
        <h3 style={{ 
          margin: '0 0 4px 0', 
          fontSize: '24px', 
          fontWeight: '600',
          color: isDark ? '#f1f5f9' : '#1f2937'
        }}>
          {stats.totalNotes}
        </h3>
        <p style={{ 
          margin: 0, 
          fontSize: '14px', 
          color: isDark ? '#94a3b8' : '#666'
        }}>Total Notes</p>
      </MD3Card>
      
      <MD3Card style={{ 
        padding: '20px', 
        textAlign: 'center',
        backgroundColor: isDark ? '#334155' : '#ffffff',
        border: `1px solid ${isDark ? '#475569' : '#e5e7eb'}`
      }}>
        <Book size={32} style={{ color: '#2196F3', marginBottom: '8px' }} />
        <h3 style={{ 
          margin: '0 0 4px 0', 
          fontSize: '24px', 
          fontWeight: '600',
          color: isDark ? '#f1f5f9' : '#1f2937'
        }}>
          {stats.notesWithBooks}
        </h3>
        <p style={{ 
          margin: 0, 
          fontSize: '14px', 
          color: isDark ? '#94a3b8' : '#666'
        }}>Linked to Books</p>
      </MD3Card>
      
      <MD3Card style={{ 
        padding: '20px', 
        textAlign: 'center',
        backgroundColor: isDark ? '#334155' : '#ffffff',
        border: `1px solid ${isDark ? '#475569' : '#e5e7eb'}`
      }}>
        <Hash size={32} style={{ color: '#4CAF50', marginBottom: '8px' }} />
        <h3 style={{ 
          margin: '0 0 4px 0', 
          fontSize: '24px', 
          fontWeight: '600',
          color: isDark ? '#f1f5f9' : '#1f2937'
        }}>
          {stats.totalTags}
        </h3>
        <p style={{ 
          margin: 0, 
          fontSize: '14px', 
          color: isDark ? '#94a3b8' : '#666'
        }}>Unique Tags</p>
      </MD3Card>
      
      <MD3Card style={{ 
        padding: '20px', 
        textAlign: 'center',
        backgroundColor: isDark ? '#334155' : '#ffffff',
        border: `1px solid ${isDark ? '#475569' : '#e5e7eb'}`
      }}>
        <TrendingUp size={32} style={{ color: '#FF9800', marginBottom: '8px' }} />
        <h3 style={{ 
          margin: '0 0 4px 0', 
          fontSize: '24px', 
          fontWeight: '600',
          color: isDark ? '#f1f5f9' : '#1f2937'
        }}>
          {stats.avgLength}
        </h3>
        <p style={{ 
          margin: 0, 
          fontSize: '14px', 
          color: isDark ? '#94a3b8' : '#666'
        }}>Avg. Characters</p>
      </MD3Card>
    </div>
  );
};

const EnhancedNotesPage = () => {
  const { user } = useAuth();
  const { actualTheme } = useMaterial3Theme();
  const { showSnackbar } = useSnackbar();
  
  // Core state
  const [notes, setNotes] = useState([]);
  const [books, setBooks] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // View and filter state
  const [viewMode, setViewMode] = useState('grid'); // grid, timeline, cloud, stats
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [selectedTags, setSelectedTags] = useState(new Set());
  const [dateRange, setDateRange] = useState({ start: null, end: null });
  const [showAICompanion, setShowAICompanion] = useState(false);
  const [selectedBook, setSelectedBook] = useState(null);
  
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
        await API.post('/notes', noteData, { timeout: 30000 });
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
    if (!window.confirm('Are you sure you want to delete this note?')) {
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
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          matchesFilter = new Date(note.created_at) > weekAgo;
          break;
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
          onClick={() => handleDeleteNote(note.id)}
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
          background: 'linear-gradient(135deg, #6750A4, #7C4DFF)',
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
                className="md3-notes-search"
                style={{
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  borderRadius: '12px',
                  minWidth: '300px'
                }}
              />
              
              {/* View Mode Toggles */}
              <div style={{ display: 'flex', gap: '8px' }}>
                <MD3IconButton
                  icon={<Grid size={20} />}
                  selected={viewMode === 'grid'}
                  onClick={() => setViewMode('grid')}
                  title="Grid View"
                  style={{ color: viewMode === 'grid' ? 'white' : 'rgba(255,255,255,0.7)' }}
                />
                <MD3IconButton
                  icon={<Calendar size={20} />}
                  selected={viewMode === 'timeline'}
                  onClick={() => setViewMode('timeline')}
                  title="Timeline View"
                  style={{ color: viewMode === 'timeline' ? 'white' : 'rgba(255,255,255,0.7)' }}
                />
                <MD3IconButton
                  icon={<Cloud size={20} />}
                  selected={viewMode === 'cloud'}
                  onClick={() => setViewMode('cloud')}
                  title="Word Cloud"
                  style={{ color: viewMode === 'cloud' ? 'white' : 'rgba(255,255,255,0.7)' }}
                />
                <MD3IconButton
                  icon={<BarChart3 size={20} />}
                  selected={viewMode === 'stats'}
                  onClick={() => setViewMode('stats')}
                  title="Statistics"
                  style={{ color: viewMode === 'stats' ? 'white' : 'rgba(255,255,255,0.7)' }}
                />
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
        
        {/* Tag Cloud Quick Filter */}
        {allTags.length > 0 && viewMode === 'grid' && (
          <MD3Card variant="outlined" style={{ 
            padding: '16px', 
            marginBottom: '24px',
            backgroundColor: actualTheme === 'dark' ? '#334155' : '#ffffff',
            border: `1px solid ${actualTheme === 'dark' ? '#475569' : '#e5e7eb'}`
          }}>
            <h3 style={{ 
              margin: '0 0 12px 0', 
              fontSize: '16px', 
              fontWeight: '600',
              color: actualTheme === 'dark' ? '#f1f5f9' : '#1f2937'
            }}>
              <Tag size={18} style={{ 
                verticalAlign: 'middle', 
                marginRight: '8px',
                color: actualTheme === 'dark' ? '#a78bfa' : '#6750A4'
              }} />
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
                  style={{
                    backgroundColor: selectedTags.has(tag) 
                      ? (actualTheme === 'dark' ? '#6366f1' : '#6750A4')
                      : (actualTheme === 'dark' ? '#475569' : '#f3f4f6'),
                    color: selectedTags.has(tag)
                      ? 'white'
                      : (actualTheme === 'dark' ? '#f1f5f9' : '#1f2937')
                  }}
                />
              ))}
              {allTags.length > 15 && (
                <MD3Chip
                  label={`+${allTags.length - 15} more`}
                  size="small"
                  variant="outlined"
                  style={{
                    backgroundColor: actualTheme === 'dark' ? '#475569' : '#f9fafb',
                    color: actualTheme === 'dark' ? '#f1f5f9' : '#6b7280',
                    borderColor: actualTheme === 'dark' ? '#64748b' : '#d1d5db'
                  }}
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
            {/* Grid View */}
            {viewMode === 'grid' && (
              filteredNotes.length > 0 ? (
                <div className="md3-notes-grid">
                  {filteredNotes.map(renderNoteCard)}
                </div>
              ) : (
                <MD3Card variant="outlined" className="md3-notes-empty-state" style={{
                  backgroundColor: actualTheme === 'dark' ? '#334155' : '#ffffff',
                  border: `1px solid ${actualTheme === 'dark' ? '#475569' : '#e5e7eb'}`
                }}>
                  <FileText className="md3-notes-empty-icon" style={{
                    color: actualTheme === 'dark' ? '#6366f1' : '#6750A4'
                  }} />
                  <h3 className="md3-notes-empty-title" style={{
                    color: actualTheme === 'dark' ? '#f1f5f9' : '#1f2937'
                  }}>
                    {searchTerm || selectedTags.size > 0 ? 'No notes found' : 'No notes yet'}
                  </h3>
                  <p className="md3-notes-empty-text" style={{
                    color: actualTheme === 'dark' ? '#94a3b8' : '#6b7280'
                  }}>
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
              <MD3Card variant="outlined" style={{
                backgroundColor: actualTheme === 'dark' ? '#334155' : '#ffffff',
                border: `1px solid ${actualTheme === 'dark' ? '#475569' : '#e5e7eb'}`
              }}>
                <TimelineView 
                  notes={filteredNotes} 
                  onNoteClick={handleOpenModal}
                  actualTheme={actualTheme}
                />
              </MD3Card>
            )}
            
            {/* Word Cloud View */}
            {viewMode === 'cloud' && (
              <MD3Card variant="outlined" style={{
                backgroundColor: actualTheme === 'dark' ? '#334155' : '#ffffff',
                border: `1px solid ${actualTheme === 'dark' ? '#475569' : '#e5e7eb'}`
              }}>
                <h3 style={{ 
                  padding: '24px 24px 0', 
                  margin: 0, 
                  fontSize: '20px', 
                  fontWeight: '600',
                  color: actualTheme === 'dark' ? '#f1f5f9' : '#1f2937'
                }}>
                  Word Frequency Cloud
                </h3>
                <p style={{ 
                  padding: '0 24px', 
                  margin: '8px 0 0 0', 
                  fontSize: '14px', 
                  color: actualTheme === 'dark' ? '#94a3b8' : '#666'
                }}>
                  Most frequently used words across all your notes
                </p>
                <WordCloud notes={filteredNotes} actualTheme={actualTheme} />
              </MD3Card>
            )}
            
            {/* Statistics View */}
            {viewMode === 'stats' && (
              <>
                <StatsDashboard notes={filteredNotes} books={books} actualTheme={actualTheme} />
                
                {/* Top Tags */}
                <MD3Card style={{ 
                  padding: '24px', 
                  marginTop: '16px',
                  backgroundColor: actualTheme === 'dark' ? '#334155' : '#ffffff',
                  border: `1px solid ${actualTheme === 'dark' ? '#475569' : '#e5e7eb'}`
                }}>
                  <h3 style={{ 
                    margin: '0 0 16px 0', 
                    fontSize: '18px', 
                    fontWeight: '600',
                    color: actualTheme === 'dark' ? '#f1f5f9' : '#1f2937'
                  }}>
                    Top Tags
                  </h3>
                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    {allTags.map(tag => {
                      const count = notes.filter(n => n.tags?.includes(tag)).length;
                      return (
                        <div key={tag} style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '8px 12px',
                          backgroundColor: actualTheme === 'dark' ? '#475569' : '#F5F5F5',
                          borderRadius: '16px'
                        }}>
                          <span style={{ 
                            fontSize: '14px',
                            color: actualTheme === 'dark' ? '#f1f5f9' : '#1f2937'
                          }}>#{tag}</span>
                          <span style={{
                            fontSize: '12px',
                            padding: '2px 6px',
                            backgroundColor: '#6750A4',
                            color: 'white',
                            borderRadius: '10px'
                          }}>
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
            backgroundColor: '#6750A4'
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
                rows={6}
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