import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useMaterial3Theme } from '../contexts/Material3ThemeContext';
import { useReadingSession } from '../contexts/ReadingSessionContext';
import { useGamification } from '../contexts/GamificationContext';
import API from '../config/api';
import './MockLibraryPage.css';

/**
 * MockLibraryPage - Full-featured library with pagination
 * Matches LibraryPageV2 functionality + adds pagination
 */
const BOOKS_PER_PAGE = 20;

const MockLibraryPage = () => {
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

  const [sortBy, setSortBy] = useState('date_added');
  const [sortOrder, setSortOrder] = useState('desc');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });

  // Real book data from API
  const [books, setBooks] = useState([]);
  const [notesCount, setNotesCount] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch books from API
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

  const handleStartSession = async (book) => {
    try {
      await startReadingSession(book);
      setBooks(prev => prev.map(b =>
        b.id === book.id ? { ...b, is_reading: true } : b
      ));
      setOpenMenuId(null);
    } catch (err) {
      console.error('Failed to start session:', err);
    }
  };

  const handlePauseSession = () => {
    pauseReadingSession();
    setOpenMenuId(null);
  };

  const handleResumeSession = () => {
    resumeReadingSession();
    setOpenMenuId(null);
  };

  const handleEndSession = async () => {
    await stopReadingSession();
    setOpenMenuId(null);
  };

  const handleMarkCompleted = async (book) => {
    try {
      if (activeSession?.book?.id === book.id) {
        await stopReadingSession();
      }

      await API.patch(`/books/${book.id}`, {
        status: 'completed',
        is_reading: false,
        completed: true,
        progress: 100,
        completed_at: new Date().toISOString()
      });

      if (trackAction) {
        await trackAction('book_completed', {
          bookId: book.id,
          bookTitle: book.title,
          timestamp: new Date().toISOString()
        });
      }

      setBooks(prev => prev.map(b =>
        b.id === book.id
          ? { ...b, status: 'completed', is_reading: false, completed: true, progress: 100, completed_at: new Date().toISOString() }
          : b
      ));

      setOpenMenuId(null);
    } catch (err) {
      console.error('Failed to mark as completed:', err);
    }
  };

  const handleMarkToRead = async (book) => {
    try {
      if (activeSession?.book?.id === book.id) {
        await stopReadingSession();
      }

      await API.patch(`/books/${book.id}`, {
        status: 'unread',
        is_reading: false,
        completed: false,
        progress: 0
      });

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

  const getBookStatus = (book) => {
    if (book.completed) return 'completed';
    if (book.is_reading) return 'reading';
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

  const isActiveSessionBook = (bookId) => activeSession?.book?.id === bookId;

  // Filter books by status
  const filteredBooks = useMemo(() => {
    if (statusFilter === 'all') return books;
    return books.filter(book => {
      const status = getBookStatus(book);
      return status === statusFilter;
    });
  }, [books, statusFilter]);

  // Sort filtered books
  const sortedBooks = useMemo(() => {
    return [...filteredBooks].sort((a, b) => {
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
  }, [filteredBooks, sortBy, sortOrder, notesCount]);

  // Pagination
  const totalPages = Math.ceil(sortedBooks.length / BOOKS_PER_PAGE);
  const startIndex = (currentPage - 1) * BOOKS_PER_PAGE;
  const paginatedBooks = sortedBooks.slice(startIndex, startIndex + BOOKS_PER_PAGE);

  // Reset to page 1 when filter or sort changes
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, sortBy, sortOrder]);

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  const SortIndicator = ({ column }) => {
    if (sortBy !== column) return <span className="sort-indicator inactive">↕</span>;
    return <span className="sort-indicator active">{sortOrder === 'asc' ? '↑' : '↓'}</span>;
  };

  const statusCounts = useMemo(() => ({
    all: books.length,
    reading: books.filter(b => b.is_reading && !b.completed).length,
    completed: books.filter(b => b.completed).length,
    'to-read': books.filter(b => !b.is_reading && !b.completed).length,
  }), [books]);

  // Loading state
  if (loading) {
    return (
      <div className={`mock-library-page ${actualTheme}`}>
        <div className="mock-empty-state">Loading your library...</div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={`mock-library-page ${actualTheme}`}>
        <div className="mock-empty-state" style={{ color: '#dc2626' }}>{error}</div>
      </div>
    );
  }

  return (
    <div className={`mock-library-page ${actualTheme}`}>
      <header className="library-header">
        <h1>My Library</h1>
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

      {/* Filter tabs */}
      <div className="mock-filter-bar">
        <div className="filter-tabs">
          {[
            { key: 'all', label: 'All' },
            { key: 'reading', label: 'Reading' },
            { key: 'completed', label: 'Completed' },
            { key: 'to-read', label: 'To Read' }
          ].map(tab => (
            <button
              key={tab.key}
              className={`filter-tab ${statusFilter === tab.key ? 'active' : ''}`}
              onClick={() => setStatusFilter(tab.key)}
            >
              {tab.label} ({statusCounts[tab.key]})
            </button>
          ))}
        </div>

        {/* Sort controls */}
        <div className="sort-controls">
          <span className="sort-label">Sort:</span>
          <button
            className={`sort-btn ${sortBy === 'title' ? 'active' : ''}`}
            onClick={() => handleSort('title')}
          >
            Title {sortBy === 'title' && (sortOrder === 'asc' ? '↑' : '↓')}
          </button>
          <button
            className={`sort-btn ${sortBy === 'author' ? 'active' : ''}`}
            onClick={() => handleSort('author')}
          >
            Author {sortBy === 'author' && (sortOrder === 'asc' ? '↑' : '↓')}
          </button>
        </div>
      </div>

      <div className="showing-count-row">
        Showing {startIndex + 1}–{Math.min(startIndex + BOOKS_PER_PAGE, sortedBooks.length)} of {sortedBooks.length} books
        {statusFilter !== 'all' && ` (filtered from ${books.length})`}
      </div>

      {/* Table with 8 columns */}
      <div className="mock-table-container">
        <table className="mock-books-table">
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
            {paginatedBooks.map(book => {
              const status = getBookStatus(book);
              const bookNotesCount = notesCount[book.id] || 0;
              return (
                <tr key={book.id} className={isActiveSessionBook(book.id) ? 'active-session-row' : ''}>
                  <td className="col-cover" onClick={() => navigate(`/read/${book.id}`)}>
                    <div className="book-cover-thumb">
                      {book.cover_url ? (
                        <img src={book.cover_url} alt={book.title} loading="lazy" />
                      ) : (
                        <div className="cover-placeholder">
                          <span className="material-symbols-outlined">menu_book</span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="col-title" onClick={() => navigate(`/read/${book.id}`)}>
                    {book.title}
                  </td>
                  <td className="col-author">{book.author || '—'}</td>
                  <td className="col-status">
                    <span className={`status-badge ${status}`}>
                      {status.replace('-', ' ')}
                    </span>
                  </td>
                  <td className="col-date">{book.completed ? formatDate(book.completed_at) : '—'}</td>
                  <td className="col-date">{formatDate(book.created_at)}</td>
                  <td className="col-notes">
                    {bookNotesCount > 0 ? <span className="notes-badge">{bookNotesCount}</span> : '—'}
                  </td>
                  <td className="col-actions">
                    <div className="actions-dropdown">
                      <button
                        className="actions-trigger"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (openMenuId === book.id) {
                            setOpenMenuId(null);
                          } else {
                            const rect = e.currentTarget.getBoundingClientRect();
                            setMenuPosition({
                              top: rect.bottom + 4,
                              left: rect.right - 200 // Menu width is 200px
                            });
                            setOpenMenuId(book.id);
                          }
                        }}
                      >
                        ⋮
                      </button>

                      {openMenuId === book.id && (
                        <div
                          className="actions-menu"
                          style={{ top: menuPosition.top, left: Math.max(8, menuPosition.left) }}
                          onClick={(e) => e.stopPropagation()}
                        >
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

                          {!activeSession && (
                            <button
                              className="menu-item primary"
                              onClick={() => handleStartSession(book)}
                            >
                              ▶️ Start Reading Session
                            </button>
                          )}

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

                          {book.completed && (
                            <button
                              className="menu-item"
                              onClick={() => handleMarkToRead(book)}
                            >
                              📚 Mark as To Read
                            </button>
                          )}

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
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination controls */}
      {totalPages > 1 && (
        <div className="pagination-controls">
          <button
            className="pagination-btn"
            onClick={() => setCurrentPage(prev => prev - 1)}
            disabled={currentPage === 1}
          >
            ← Back
          </button>
          <span className="pagination-info">
            Page {currentPage} of {totalPages}
          </span>
          <button
            className="pagination-btn"
            onClick={() => setCurrentPage(prev => prev + 1)}
            disabled={currentPage === totalPages}
          >
            Next →
          </button>
        </div>
      )}

      {paginatedBooks.length === 0 && (
        <div className="mock-empty-state">
          No books match the selected filter.
        </div>
      )}
    </div>
  );
};

export default MockLibraryPage;
