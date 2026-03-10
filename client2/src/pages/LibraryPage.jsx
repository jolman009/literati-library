import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useMaterial3Theme } from '../contexts/Material3ThemeContext';
import { useReadingSession } from '../contexts/ReadingSessionContext';
import { useGamification } from '../contexts/GamificationContext';
import API from '../config/api';
import { bookshopUrl, amazonUrl } from '../utils/affiliateLinks';
import './LibraryPage.css';

/**
 * LibraryPage - Full-featured library with pagination
 * Matches LibraryPageV2 functionality + adds pagination
 */
const BOOKS_PER_PAGE = 20;

const getNormalizedLanguage = (book) => {
  const rawLanguage = typeof book?.language === 'string' ? book.language.trim() : '';
  if (!rawLanguage) {
    return { key: 'unknown', label: 'Unknown' };
  }

  const compactLanguage = rawLanguage.replace(/\s+/g, ' ');
  return {
    key: compactLanguage.toLowerCase(),
    label: compactLanguage
  };
};

const getNormalizedFileType = (book) => {
  const rawFormat = typeof book?.format === 'string' ? book.format.trim().toLowerCase() : '';
  if (rawFormat) {
    if (rawFormat.includes('epub')) return { key: 'epub', label: 'EPUB' };
    if (rawFormat.includes('pdf')) return { key: 'pdf', label: 'PDF' };
    return { key: rawFormat, label: rawFormat.toUpperCase() };
  }

  const mimeType = typeof book?.file_type === 'string' ? book.file_type.toLowerCase() : '';
  if (mimeType.includes('epub')) return { key: 'epub', label: 'EPUB' };
  if (mimeType.includes('pdf')) return { key: 'pdf', label: 'PDF' };

  const filename = typeof book?.filename === 'string' ? book.filename.toLowerCase() : '';
  if (filename.endsWith('.epub')) return { key: 'epub', label: 'EPUB' };
  if (filename.endsWith('.pdf')) return { key: 'pdf', label: 'PDF' };

  return { key: 'unknown', label: 'Unknown' };
};

const LibraryPage = () => {
  const { actualTheme } = useMaterial3Theme();
  const { user, makeAuthenticatedApiCall } = useAuth();
  const navigate = useNavigate();

  const {
    activeSession,
    isPaused,
    startReadingSession,
    pauseReadingSession,
    resumeReadingSession,
    stopReadingSession
  } = useReadingSession();

  const { trackAction } = useGamification();

  const [sortBy, setSortBy] = useState('date_added');
  const [sortOrder, setSortOrder] = useState('desc');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedLanguages, setSelectedLanguages] = useState([]);
  const [selectedFileTypes, setSelectedFileTypes] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });

  const [books, setBooks] = useState([]);
  const [notesCount, setNotesCount] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user) {
      fetchBooks();
      fetchNotesCount();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

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

  const toggleLanguageFilter = (languageKey) => {
    setSelectedLanguages(prev =>
      prev.includes(languageKey)
        ? prev.filter(key => key !== languageKey)
        : [...prev, languageKey]
    );
  };

  const toggleFileTypeFilter = (fileTypeKey) => {
    setSelectedFileTypes(prev =>
      prev.includes(fileTypeKey)
        ? prev.filter(key => key !== fileTypeKey)
        : [...prev, fileTypeKey]
    );
  };

  const clearAllMetadataFilters = () => {
    setSelectedLanguages([]);
    setSelectedFileTypes([]);
  };

  const availableLanguages = useMemo(() => {
    const languageMap = new Map();

    books.forEach(book => {
      const language = getNormalizedLanguage(book);
      if (!languageMap.has(language.key)) {
        languageMap.set(language.key, { ...language, count: 0 });
      }
      languageMap.get(language.key).count += 1;
    });

    return Array.from(languageMap.values()).sort((a, b) => a.label.localeCompare(b.label));
  }, [books]);

  const availableFileTypes = useMemo(() => {
    const typeMap = new Map();

    books.forEach(book => {
      const fileType = getNormalizedFileType(book);
      if (!typeMap.has(fileType.key)) {
        typeMap.set(fileType.key, { ...fileType, count: 0 });
      }
      typeMap.get(fileType.key).count += 1;
    });

    return Array.from(typeMap.values()).sort((a, b) => a.label.localeCompare(b.label));
  }, [books]);

  const statusFilteredBooks = useMemo(() => {
    if (statusFilter === 'all') return books;
    return books.filter(book => {
      const status = getBookStatus(book);
      return status === statusFilter;
    });
  }, [books, statusFilter]);

  const filteredBooks = useMemo(() => {
    return statusFilteredBooks.filter(book => {
      const language = getNormalizedLanguage(book);
      const fileType = getNormalizedFileType(book);

      const languageMatch = selectedLanguages.length === 0 || selectedLanguages.includes(language.key);
      const fileTypeMatch = selectedFileTypes.length === 0 || selectedFileTypes.includes(fileType.key);

      return languageMatch && fileTypeMatch;
    });
  }, [statusFilteredBooks, selectedLanguages, selectedFileTypes]);

  const sortedBooks = useMemo(() => {
    return [...filteredBooks].sort((a, b) => {
      let aVal;
      let bVal;

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
        case 'language':
          aVal = getNormalizedLanguage(a).key;
          bVal = getNormalizedLanguage(b).key;
          break;
        case 'file_type':
          aVal = getNormalizedFileType(a).key;
          bVal = getNormalizedFileType(b).key;
          break;
        default:
          return 0;
      }

      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredBooks, sortBy, sortOrder, notesCount]);

  const totalPages = Math.ceil(sortedBooks.length / BOOKS_PER_PAGE);
  const startIndex = (currentPage - 1) * BOOKS_PER_PAGE;
  const paginatedBooks = sortedBooks.slice(startIndex, startIndex + BOOKS_PER_PAGE);
  const hasResults = sortedBooks.length > 0;
  const showingStart = hasResults ? startIndex + 1 : 0;
  const showingEnd = hasResults ? Math.min(startIndex + BOOKS_PER_PAGE, sortedBooks.length) : 0;
  const hasMetadataFilters = selectedLanguages.length > 0 || selectedFileTypes.length > 0;

  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, selectedLanguages, selectedFileTypes, sortBy, sortOrder]);

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

  if (loading) {
    return (
      <div className={`library-page ${actualTheme}`}>
        <div className="library-empty-state">Loading your library...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`library-page ${actualTheme}`}>
        <div className="library-empty-state" style={{ color: '#dc2626' }}>{error}</div>
      </div>
    );
  }

  return (
    <div className={`library-page ${actualTheme}`}>
      <header className="library-header">
        <h1>My Library</h1>
      </header>

      {activeSession && (
        <div className="active-session-banner">
          <span className="session-icon">Reading</span>
          <span className="session-text">
            Reading: <strong>{activeSession.book.title}</strong>
            {isPaused && <span className="paused-badge">PAUSED</span>}
          </span>
          <div className="session-actions">
            {isPaused ? (
              <button className="session-btn resume" onClick={handleResumeSession}>
                Resume
              </button>
            ) : (
              <button className="session-btn pause" onClick={handlePauseSession}>
                Pause
              </button>
            )}
            <button className="session-btn end" onClick={handleEndSession}>
              End Session
            </button>
          </div>
        </div>
      )}

      <div className="library-filter-bar">
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
          <button
            className={`sort-btn ${sortBy === 'language' ? 'active' : ''}`}
            onClick={() => handleSort('language')}
          >
            Language {sortBy === 'language' && (sortOrder === 'asc' ? '↑' : '↓')}
          </button>
          <button
            className={`sort-btn ${sortBy === 'file_type' ? 'active' : ''}`}
            onClick={() => handleSort('file_type')}
          >
            File Type {sortBy === 'file_type' && (sortOrder === 'asc' ? '↑' : '↓')}
          </button>
        </div>
      </div>

      <div className="metadata-filter-panel">
        <div className="metadata-filter-group">
          <span className="metadata-filter-label">Language:</span>
          <div className="metadata-filter-chips">
            {availableLanguages.map(language => (
              <button
                key={language.key}
                className={`metadata-filter-chip ${selectedLanguages.includes(language.key) ? 'active' : ''}`}
                onClick={() => toggleLanguageFilter(language.key)}
              >
                {language.label} ({language.count})
              </button>
            ))}
          </div>
          {selectedLanguages.length > 0 && (
            <button className="metadata-clear-btn" onClick={() => setSelectedLanguages([])}>
              Clear languages
            </button>
          )}
        </div>

        <div className="metadata-filter-group">
          <span className="metadata-filter-label">File Type:</span>
          <div className="metadata-filter-chips">
            {availableFileTypes.map(fileType => (
              <button
                key={fileType.key}
                className={`metadata-filter-chip ${selectedFileTypes.includes(fileType.key) ? 'active' : ''}`}
                onClick={() => toggleFileTypeFilter(fileType.key)}
              >
                {fileType.label} ({fileType.count})
              </button>
            ))}
          </div>
          {selectedFileTypes.length > 0 && (
            <button className="metadata-clear-btn" onClick={() => setSelectedFileTypes([])}>
              Clear file types
            </button>
          )}
        </div>

        {hasMetadataFilters && (
          <button className="metadata-clear-all-btn" onClick={clearAllMetadataFilters}>
            Clear all filters
          </button>
        )}
      </div>

      <div className="showing-count-row">
        Showing {showingStart}-{showingEnd} of {sortedBooks.length} books
        {(statusFilter !== 'all' || hasMetadataFilters) && ` (filtered from ${books.length})`}
      </div>

      <div className="library-table-container">
        <table className="library-books-table">
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
                              left: rect.right - 200
                            });
                            setOpenMenuId(book.id);
                          }
                        }}
                      >
                        ...
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
                            Open Book
                          </button>

                          <div className="menu-divider" />

                          {isActiveSessionBook(book.id) && (
                            <>
                              {isPaused ? (
                                <button className="menu-item" onClick={handleResumeSession}>
                                  Resume Timer
                                </button>
                              ) : (
                                <button className="menu-item" onClick={handlePauseSession}>
                                  Pause Timer
                                </button>
                              )}
                              <button className="menu-item" onClick={handleEndSession}>
                                Stop Timer
                              </button>
                              <div className="menu-divider" />
                            </>
                          )}

                          {!activeSession && (
                            <button
                              className="menu-item primary"
                              onClick={() => handleStartSession(book)}
                            >
                              Start Reading Session
                            </button>
                          )}

                          {book.is_reading && !book.completed && (
                            <>
                              <button
                                className="menu-item"
                                onClick={() => handleMarkToRead(book)}
                              >
                                End Session (Stop Reading)
                              </button>
                              <button
                                className="menu-item success"
                                onClick={() => handleMarkCompleted(book)}
                              >
                                Mark as Completed
                              </button>
                            </>
                          )}

                          {book.completed && (
                            <button
                              className="menu-item"
                              onClick={() => handleMarkToRead(book)}
                            >
                              Mark as To Read
                            </button>
                          )}

                          {!book.is_reading && !book.completed && (
                            <button
                              className="menu-item success"
                              onClick={() => handleMarkCompleted(book)}
                            >
                              Mark as Completed
                            </button>
                          )}

                          <div className="menu-divider" />
                          <a
                            href={bookshopUrl(book.title, book.author)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="menu-item"
                            onClick={() => setOpenMenuId(null)}
                          >
                            Buy on Bookshop.org
                          </a>
                          <a
                            href={amazonUrl(book.title, book.author)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="menu-item"
                            onClick={() => setOpenMenuId(null)}
                          >
                            Buy on Amazon
                          </a>
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

      {totalPages > 1 && (
        <div className="pagination-controls">
          <button
            className="pagination-btn"
            onClick={() => setCurrentPage(prev => prev - 1)}
            disabled={currentPage === 1}
          >
            Back
          </button>
          <span className="pagination-info">
            Page {currentPage} of {totalPages}
          </span>
          <button
            className="pagination-btn"
            onClick={() => setCurrentPage(prev => prev + 1)}
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>
      )}

      {paginatedBooks.length === 0 && (
        <div className="library-empty-state">
          {statusFilter !== 'all' || hasMetadataFilters
            ? 'No books match the selected filters.'
            : 'No books in your library yet.'}
        </div>
      )}
    </div>
  );
};

export default LibraryPage;
