// src/pages/subpages/NotesSubpage.jsx
import React, { useState, useEffect } from 'react';
import { MD3Card, MD3TextField, MD3Chip, MD3Button } from '../../components/Material3';
import { useMaterial3Theme } from '../../contexts/Material3ThemeContext';
import API from '../../config/api';

const NotesSubpage = ({ books = [], onNoteAction }) => {
  const { actualTheme } = useMaterial3Theme();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBook, setSelectedBook] = useState(null);
  const [filteredNotes, setFilteredNotes] = useState([]);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch notes when component mounts
  useEffect(() => {
    fetchNotes();
  }, []);

  useEffect(() => {
    filterNotes();
  }, [notes, searchQuery, selectedBook]);

  const fetchNotes = async () => {
    try {
      setLoading(true);
      console.log('🔍 NotesSubpage fetching notes from:', `${API.defaults.baseURL}/notes`);
      const response = await API.get('/notes', { timeout: 30000 });
      setNotes(response.data || []);
    } catch (error) {
      console.error('NotesSubpage: Error fetching notes:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterNotes = () => {
    let filtered = [...notes];

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(note => 
        note.content?.toLowerCase().includes(query) ||
        note.highlight?.toLowerCase().includes(query) ||
        note.book_title?.toLowerCase().includes(query)
      );
    }

    // Filter by selected book
    if (selectedBook) {
      filtered = filtered.filter(note => note.book_id === selectedBook);
    }

    // Sort by most recent first
    filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    
    setFilteredNotes(filtered);
  };


  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const NoteCard = ({ note }) => {
    const book = books.find(b => b.id === note.book_id);
    
    return (
      <MD3Card style={{
        padding: '20px',
        background: actualTheme === 'dark' 
          ? 'linear-gradient(135deg, #1e293b, #334155)'
          : 'linear-gradient(135deg, #ffffff, #f8fafc)',
        border: `1px solid ${actualTheme === 'dark' ? '#334155' : '#e5e7eb'}`,
        transition: 'all 0.2s ease'
      }}>
        {/* Book Info */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '16px'
        }}>
          <div style={{
            width: '40px',
            height: '60px',
            borderRadius: '4px',
            background: book?.coverUrl 
              ? `url(${book.coverUrl}) center/cover`
              : 'linear-gradient(135deg, #667eea, #764ba2)',
            flexShrink: 0
          }} />
          <div style={{ flex: 1 }}>
            <div style={{
              fontSize: '14px',
              fontWeight: '600',
              color: actualTheme === 'dark' ? '#f1f5f9' : '#1f2937'
            }}>
              {book?.title || note.book_title || 'Unknown Book'}
            </div>
            <div style={{
              fontSize: '12px',
              color: actualTheme === 'dark' ? '#94a3b8' : '#64748b'
            }}>
              {formatDate(note.created_at)}
            </div>
          </div>
          {note.type && (
            <MD3Chip
              label={note.type}
              size="small"
              style={{
                backgroundColor: note.type === 'highlight' ? '#fef3c7' : '#dbeafe',
                color: note.type === 'highlight' ? '#92400e' : '#1e40af'
              }}
            />
          )}
        </div>

        {/* Highlight Text */}
        {note.highlight && (
          <div style={{
            padding: '12px',
            background: actualTheme === 'dark' ? '#334155' : '#fef3c7',
            borderLeft: `4px solid #f59e0b`,
            borderRadius: '4px',
            marginBottom: '12px',
            fontStyle: 'italic',
            fontSize: '14px',
            color: actualTheme === 'dark' ? '#fbbf24' : '#92400e'
          }}>
            "{note.highlight}"
          </div>
        )}

        {/* Note Content */}
        <div style={{
          fontSize: '14px',
          lineHeight: '1.6',
          color: actualTheme === 'dark' ? '#e2e8f0' : '#334155',
          whiteSpace: 'pre-wrap'
        }}>
          {note.content}
        </div>

        {/* Page/Chapter Info */}
        {(note.page_number || note.chapter) && (
          <div style={{
            display: 'flex',
            gap: '12px',
            marginTop: '12px',
            paddingTop: '12px',
            borderTop: `1px solid ${actualTheme === 'dark' ? '#475569' : '#e5e7eb'}`
          }}>
            {note.page_number && (
              <span style={{
                fontSize: '12px',
                color: actualTheme === 'dark' ? '#94a3b8' : '#64748b'
              }}>
                📄 Page {note.page_number}
              </span>
            )}
            {note.chapter && (
              <span style={{
                fontSize: '12px',
                color: actualTheme === 'dark' ? '#94a3b8' : '#64748b'
              }}>
                📑 {note.chapter}
              </span>
            )}
          </div>
        )}
      </MD3Card>
    );
  };

  const booksWithNotes = books.filter(book => 
    notes.some(note => note.book_id === book.id)
  );

  return (
    <div style={{ padding: '24px' }}>
      <h2 style={{
        fontSize: '28px',
        fontWeight: 'bold',
        color: actualTheme === 'dark' ? '#f1f5f9' : '#1f2937',
        marginBottom: '24px'
      }}>
        📝 Notes & Highlights
      </h2>

      {/* Search and Filter Bar */}
      <MD3Card style={{
        padding: '20px',
        marginBottom: '24px',
        background: actualTheme === 'dark' ? '#1e293b' : '#ffffff'
      }}>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
          <MD3TextField
            label="Search notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leadingIcon="🔍"
            style={{ flex: '1', minWidth: '250px' }}
          />
          
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <MD3Chip
              label="All Books"
              onClick={() => setSelectedBook(null)}
              style={{
                backgroundColor: !selectedBook ? '#6750a4' : '#e7e0ec',
                color: !selectedBook ? '#ffffff' : '#1c1b1f',
                cursor: 'pointer'
              }}
            />
            {booksWithNotes.map(book => (
              <MD3Chip
                key={book.id}
                label={book.title}
                onClick={() => setSelectedBook(book.id)}
                style={{
                  backgroundColor: selectedBook === book.id ? '#6750a4' : '#e7e0ec',
                  color: selectedBook === book.id ? '#ffffff' : '#1c1b1f',
                  cursor: 'pointer'
                }}
              />
            ))}
          </div>
        </div>

        {/* Stats */}
        <div style={{
          display: 'flex',
          gap: '24px',
          marginTop: '20px',
          paddingTop: '20px',
          borderTop: `1px solid ${actualTheme === 'dark' ? '#334155' : '#e5e7eb'}`
        }}>
          <div>
            <span style={{
              fontSize: '20px',
              fontWeight: 'bold',
              color: '#6750a4'
            }}>
              {filteredNotes.length}
            </span>
            <span style={{
              fontSize: '14px',
              color: actualTheme === 'dark' ? '#94a3b8' : '#64748b',
              marginLeft: '8px'
            }}>
              Notes
            </span>
          </div>
          <div>
            <span style={{
              fontSize: '20px',
              fontWeight: 'bold',
              color: '#f59e0b'
            }}>
              {filteredNotes.filter(n => n.type === 'highlight').length}
            </span>
            <span style={{
              fontSize: '14px',
              color: actualTheme === 'dark' ? '#94a3b8' : '#64748b',
              marginLeft: '8px'
            }}>
              Highlights
            </span>
          </div>
          <div>
            <span style={{
              fontSize: '20px',
              fontWeight: 'bold',
              color: '#10b981'
            }}>
              {booksWithNotes.length}
            </span>
            <span style={{
              fontSize: '14px',
              color: actualTheme === 'dark' ? '#94a3b8' : '#64748b',
              marginLeft: '8px'
            }}>
              Books with Notes
            </span>
          </div>
        </div>
      </MD3Card>

      {/* Notes List */}
      {filteredNotes.length === 0 ? (
        <MD3Card style={{
          padding: '48px',
          textAlign: 'center',
          background: actualTheme === 'dark' ? '#1e293b' : '#ffffff'
        }}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>📝</div>
          <h3 style={{
            fontSize: '20px',
            fontWeight: '600',
            color: actualTheme === 'dark' ? '#f1f5f9' : '#1f2937',
            marginBottom: '8px'
          }}>
            {searchQuery || selectedBook ? 'No notes found' : 'No notes yet'}
          </h3>
          <p style={{
            fontSize: '14px',
            color: actualTheme === 'dark' ? '#94a3b8' : '#64748b'
          }}>
            {searchQuery || selectedBook 
              ? 'Try adjusting your filters'
              : 'Start reading and add notes to see them here'}
          </p>
        </MD3Card>
      ) : (
        <div style={{
          display: 'grid',
          gap: '20px'
        }}>
          {filteredNotes.map(note => (
            <NoteCard key={note.id} note={note} />
          ))}
        </div>
      )}
    </div>
  );
};

export default NotesSubpage;