// LibraryPageV2.jsx - Goodreads-inspired table layout
// Experimental clean rebuild with SINGLE CSS file
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useMaterial3Theme } from '../contexts/Material3ThemeContext';
import { useReadingSession } from '../contexts/ReadingSessionContext';
import { useGamification } from '../contexts/GamificationContext';
import API from '../config/api';
import './library-v2.css';

const LibraryPageV2 = () => {
  const { actualTheme } = useMaterial3Theme();
  const { user, makeAuthenticatedApiCall } = useAuth();
  const navigate = useNavigate();

  // Reading session context
  const {
    activeSession,
    isPaused,
    startReadingSession,
    pauseReadingSession,
    resumeReadingSession,
    stopReadingSession
  } = useReadingSession();

  // Gamification for completion tracking
  const { trackAction } = useGamification();

  const [books, setBooks] = useState([]);
  const [notesCount, setNotesCount] = useState({}); // { bookId: count }
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date_added');
  const [sortOrder, setSortOrder] = useState('desc');
  const [openMenuId, setOpenMenuId] = useState(null); // Which book's menu is open

  // Fetch books
  useEffect(() => {
    if (user) {
      fetchBooks();
      fetchNotesCount();
    }
  }, [user]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setOpenMenuId(null);
    if (openMenuId) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [openMenuId]);

  const fetchBooks = async () => {
    try {
      setLoading(true);
      const response = await makeAuthenticatedApiCall('/books?limit=200&offset=0');
      const { items = [] } = response || {};
      setBooks(items);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch books:', err);
      setError('Failed to load your library');
    } finally {
      setLoading(false);
    }
  };

  const fetchNotesCount = async () => {
    try {
      const response = await makeAuthenticatedApiCall('/notes');
      const notes = response?.notes || response || [];
      const counts = {};
      notes.forEach(note => {
        const bookId = note.book_id;
        counts[bookId] = (counts[bookId] || 0) + 1;
      });
      setNotesCount(counts);
    } catch (err) {
      console.error('Failed to fetch notes:', err);
    }
  };

  // ========================================
  // SESSION & STATUS HANDLERS
  // ========================================

  // Start a reading session (with timer + gamification)
  const handleStartSession = async (book) => {
    try {
      await startReadingSession(book);
      // Update local state
      setBooks(prev => prev.map(b =>
        b.id === book.id ? { ...b, is_reading: true } : b
      ));
      setOpenMenuId(null);
    } catch (err) {
      console.error('Failed to start session:', err);
    }
  };

  // Pause the active session
  const handlePauseSession = () => {
    pauseReadingSession();
    setOpenMenuId(null);
  };

  // Resume a paused session
  const handleResumeSession = () => {
    resumeReadingSession();
    setOpenMenuId(null);
  };

  // End the session (book back on shelf, still "reading/paused" status)
  const handleEndSession = async () => {
    await stopReadingSession();
    setOpenMenuId(null);
  };

  // Mark book as completed (finished reading)
  const handleMarkCompleted = async (book) => {
    try {
      // If this book has an active session, end it first
      if (activeSession?.book?.id === book.id) {
        await stopReadingSession();
      }

      // Update book status
      await API.patch(`/books/${book.id}`, {
        status: 'completed',
        is_reading: false,
        completed: true,
        progress: 100,
        completed_at: new Date().toISOString()
      });

      // Track gamification
      if (trackAction) {
        await trackAction('book_completed', {
          bookId: book.id,
          bookTitle: book.title,
          timestamp: new Date().toISOString()
        });
      }

      // Update local state
      setBooks(prev => prev.map(b =>
        b.id === book.id
          ? { ...b, status: 'completed', is_reading: false, completed: true, progress: 100, completed_at: new Date().toISOString() }
          : b
      ));

      setOpenMenuId(null);
      console.log('✅ Book marked as completed:', book.title);
    } catch (err) {
      console.error('Failed to mark as completed:', err);
    }
  };

  // Mark book as "To Read" (reset status)
  const handleMarkToRead = async (book) => {
    try {
      // If this book has an active session, end it first
      if (activeSession?.book?.id === book.id) {
        await stopReadingSession();
      }

      await API.patch(`/books/${book.id}`, {
        status: 'unread',
        is_reading: false,
        completed: false,
        progress: 0
      });

      // Update local state
      setBooks(prev => prev.map(b =>
        b.id === book.id
          ? { ...b, status: 'unread', is_reading: false, completed: false, progress: 0 }
          : b
      ));

      setOpenMenuId(null);
    } catch (err) {
      console.error('Failed to mark as to-read:', err);
    }
  };

  // ========================================
  // HELPERS
  // ========================================

  const getStatus = (book) => {
    if (book.completed) return 'read';
    if (book.is_reading) return 'currently-reading';
    return 'to-read';
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Check if book has active session
  const isActiveSessionBook = (bookId) => activeSession?.book?.id === bookId;

  // Filter books
  const filteredBooks = books.filter(book => {
    if (filter === 'all') return true;
    if (filter === 'reading') return book.is_reading && !book.completed;
    if (filter === 'completed') return book.completed;
    if (filter === 'unread') return !book.is_reading && !book.completed;
    return true;
  });

  // Sort books
  const sortedBooks = [...filteredBooks].sort((a, b) => {
    let aVal, bVal;
    switch (sortBy) {
      case 'title':
        aVal = (a.title || '').toLowerCase();
        bVal = (b.title || '').toLowerCase();
        break;
      case 'author':
        aVal = (a.author || '').toLowerCase();
        bVal = (b.author || '').toLowerCase();
        break;
      case 'date_added':
        aVal = new Date(a.created_at || 0);
        bVal = new Date(b.created_at || 0);
        break;
      case 'date_read':
        aVal = new Date(a.completed_at || 0);
        bVal = new Date(b.completed_at || 0);
        break;
      case 'notes':
        aVal = notesCount[a.id] || 0;
        bVal = notesCount[b.id] || 0;
        break;
      default:
        return 0;
    }
    if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  const SortIndicator = ({ column }) => {
    if (sortBy !== column) return null;
    return <span className="sort-indicator">{sortOrder === 'asc' ? '▲' : '▼'}</span>;
  };

  // ========================================
  // RENDER
  // ========================================

  if (loading) {
    return (
      <div className={`library-v2 ${actualTheme}`}>
        <div className="loading-state">Loading your library...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`library-v2 ${actualTheme}`}>
        <div className="error-state">{error}</div>
      </div>
    );
  }

  return (
    <div className={`library-v2 ${actualTheme}`}>
      {/* Header */}
      <header className="library-header">
        <h1>My Library</h1>
        <div className="header-actions">
          <button
            className="back-to-original"
            onClick={() => navigate('/library')}
          >
            ← Back to Original
          </button>
        </div>
      </header>

      {/* Active Session Banner */}
      {activeSession && (
        <div className="active-session-banner">
          <span className="session-icon">📖</span>
          <span className="session-text">
            Reading: <strong>{activeSession.book.title}</strong>
            {isPaused && <span className="paused-badge">PAUSED</span>}
          </span>
          <div className="session-actions">
            {isPaused ? (
              <button className="session-btn resume" onClick={handleResumeSession}>
                ▶ Resume
              </button>
            ) : (
              <button className="session-btn pause" onClick={handlePauseSession}>
                ⏸ Pause
              </button>
            )}
            <button className="session-btn end" onClick={handleEndSession}>
              ⏹ End Session
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="filter-bar">
        <div className="filter-tabs">
          {[
            { key: 'all', label: `All (${books.length})` },
            { key: 'reading', label: `Reading (${books.filter(b => b.is_reading && !b.completed).length})` },
            { key: 'completed', label: `Completed (${books.filter(b => b.completed).length})` },
            { key: 'unread', label: `To Read (${books.filter(b => !b.is_reading && !b.completed).length})` }
          ].map(tab => (
            <button
              key={tab.key}
              className={`filter-tab ${filter === tab.key ? 'active' : ''}`}
              onClick={() => setFilter(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="showing-count">
          Showing {sortedBooks.length} books
        </div>
      </div>

      {/* Table */}
      <div className="table-container">
        <table className="books-table">
          <thead>
            <tr>
              <th className="col-cover">Cover</th>
              <th className="col-title sortable" onClick={() => handleSort('title')}>
                Title <SortIndicator column="title" />
              </th>
              <th className="col-author sortable" onClick={() => handleSort('author')}>
                Author <SortIndicator column="author" />
              </th>
              <th className="col-status">Status</th>
              <th className="col-date sortable" onClick={() => handleSort('date_read')}>
                Date Read <SortIndicator column="date_read" />
              </th>
              <th className="col-date sortable" onClick={() => handleSort('date_added')}>
                Date Added <SortIndicator column="date_added" />
              </th>
              <th className="col-notes sortable" onClick={() => handleSort('notes')}>
                Notes <SortIndicator column="notes" />
              </th>
              <th className="col-actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedBooks.map(book => (
              <tr
                key={book.id}
                className={isActiveSessionBook(book.id) ? 'active-session-row' : ''}
              >
                <td className="col-cover" onClick={() => navigate(`/read/${book.id}`)}>
                  <div className="book-cover-thumb">
                    {book.cover_url ? (
                      <img src={book.cover_url} alt={book.title} loading="lazy" />
                    ) : (
                      <div className="cover-placeholder">
                        <span className="material-symbols-outlined">menu_book</span>
                      </div>
                    )}
                    {isActiveSessionBook(book.id) && (
                      <div className="active-indicator">{isPaused ? '⏸' : '▶'}</div>
                    )}
                  </div>
                </td>
                <td className="col-title" onClick={() => navigate(`/read/${book.id}`)}>
                  <span className="book-title">{book.title}</span>
                </td>
                <td className="col-author">{book.author || '—'}</td>
                <td className="col-status">
                  <span className={`status-badge ${getStatus(book)}`}>
                    {getStatus(book).replace('-', ' ')}
                  </span>
                </td>
                <td className="col-date">
                  {book.completed ? formatDate(book.completed_at) : '—'}
                </td>
                <td className="col-date">{formatDate(book.created_at)}</td>
                <td className="col-notes">
                  {notesCount[book.id] ? (
                    <span className="notes-badge">{notesCount[book.id]}</span>
                  ) : '—'}
                </td>
                <td className="col-actions">
                  <div className="actions-dropdown">
                    <button
                      className="actions-trigger"
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenMenuId(openMenuId === book.id ? null : book.id);
                      }}
                    >
                      ⋮
                    </button>

                    {openMenuId === book.id && (
                      <div className="actions-menu" onClick={(e) => e.stopPropagation()}>
                        {/* Open Book (no session) */}
                        <button
                          className="menu-item"
                          onClick={() => {
                            setOpenMenuId(null);
                            navigate(`/read/${book.id}`);
                          }}
                        >
                          📖 Open Book
                        </button>

                        <div className="menu-divider" />

                        {/* Timer Session Controls (only if this book has active timer) */}
                        {isActiveSessionBook(book.id) && (
                          <>
                            {isPaused ? (
                              <button className="menu-item" onClick={handleResumeSession}>
                                ▶️ Resume Timer
                              </button>
                            ) : (
                              <button className="menu-item" onClick={handlePauseSession}>
                                ⏸️ Pause Timer
                              </button>
                            )}
                            <button className="menu-item" onClick={handleEndSession}>
                              ⏹️ Stop Timer
                            </button>
                            <div className="menu-divider" />
                          </>
                        )}

                        {/* Start Session (if no active timer for any book) */}
                        {!activeSession && (
                          <button
                            className="menu-item primary"
                            onClick={() => handleStartSession(book)}
                          >
                            ▶️ Start Reading Session
                          </button>
                        )}

                        {/* For "Currently Reading" books: show End Session & Mark Completed */}
                        {book.is_reading && !book.completed && (
                          <>
                            <button
                              className="menu-item"
                              onClick={() => handleMarkToRead(book)}
                            >
                              ⏹️ End Session (Stop Reading)
                            </button>
                            <button
                              className="menu-item success"
                              onClick={() => handleMarkCompleted(book)}
                            >
                              ✅ Mark as Completed
                            </button>
                          </>
                        )}

                        {/* For completed books: option to move back to To Read */}
                        {book.completed && (
                          <button
                            className="menu-item"
                            onClick={() => handleMarkToRead(book)}
                          >
                            📚 Mark as To Read
                          </button>
                        )}

                        {/* For unread books: can mark as completed directly */}
                        {!book.is_reading && !book.completed && (
                          <button
                            className="menu-item success"
                            onClick={() => handleMarkCompleted(book)}
                          >
                            ✅ Mark as Completed
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {sortedBooks.length === 0 && (
        <div className="empty-state">
          No books found. Try a different filter.
        </div>
      )}
    </div>
  );
};

export default LibraryPageV2;
