import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useMaterial3Theme } from '../contexts/Material3ThemeContext';
import { useReadingSession } from '../contexts/ReadingSessionContext';
import { useGamification } from '../contexts/GamificationContext';
import API from '../config/api';
import { bookshopUrl, amazonUrl } from '../utils/affiliateLinks';
import './LibraryPage.css';
import { SkeletonGrid, EmptyState, ErrorState } from '../components/ui/StateKit';
import BookCard from '../components/ui/BookCard';
import { LibraryBig, Plus, SearchX, X, Search, LayoutGrid, List, MoreVertical } from 'lucide-react';

/**
 * LibraryPage — card/list library, restyled from the "Core App" design handoff.
 * Visual layer recreated (welcome banner + stat tiles + filter chips + book
 * grid/list) while preserving all existing wiring: status + language + file-type
 * filters, 7-key sort, pagination, reading-session controls, per-book actions,
 * and loading/empty/error states. Search is a new client-side title/author filter.
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

  const { trackAction, stats } = useGamification();

  const [view, setView] = useState('grid');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('date_added');
  const [sortOrder, setSortOrder] = useState('desc');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedLanguages, setSelectedLanguages] = useState([]);
  const [selectedFileTypes, setSelectedFileTypes] = useState([]);
  const [showMetaFilters, setShowMetaFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });

  const [books, setBooks] = useState([]);
  const [notesCount, setNotesCount] = useState({});
  const [notesTotal, setNotesTotal] = useState(0);
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
      setNotesTotal(Array.isArray(notes) ? notes.length : 0);
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
      // Open the reader in the same action so the timer and the book
      // appear together — no separate "Open Book" click needed.
      navigate(`/read/${book.id}`);
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
    const q = search.trim().toLowerCase();
    return statusFilteredBooks.filter(book => {
      const language = getNormalizedLanguage(book);
      const fileType = getNormalizedFileType(book);

      const languageMatch = selectedLanguages.length === 0 || selectedLanguages.includes(language.key);
      const fileTypeMatch = selectedFileTypes.length === 0 || selectedFileTypes.includes(fileType.key);
      const searchMatch = !q || `${book.title || ''} ${book.author || ''}`.toLowerCase().includes(q);

      return languageMatch && fileTypeMatch && searchMatch;
    });
  }, [statusFilteredBooks, selectedLanguages, selectedFileTypes, search]);

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
  }, [statusFilter, selectedLanguages, selectedFileTypes, sortBy, sortOrder, search]);

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  const sortArrow = (column) => (sortBy === column ? (sortOrder === 'asc' ? ' ↑' : ' ↓') : '');

  const statusCounts = useMemo(() => ({
    all: books.length,
    reading: books.filter(b => b.is_reading && !b.completed).length,
    completed: books.filter(b => b.completed).length,
    'to-read': books.filter(b => !b.is_reading && !b.completed).length,
  }), [books]);

  // Open the per-book actions menu, anchored to the clicked trigger.
  const openActionsMenu = (book, e) => {
    e.stopPropagation();
    if (openMenuId === book.id) {
      setOpenMenuId(null);
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    setMenuPosition({ top: rect.bottom + 4, left: rect.right - 220 });
    setOpenMenuId(book.id);
  };

  const renderActionsMenu = () => {
    if (!openMenuId) return null;
    const book = paginatedBooks.find(b => b.id === openMenuId);
    if (!book) return null;
    return (
      <div
        className="actions-menu"
        style={{ position: 'fixed', top: menuPosition.top, left: Math.max(8, menuPosition.left) }}
      >
        <button className="menu-item" onClick={() => { setOpenMenuId(null); navigate(`/read/${book.id}`); }}>
          Open Book
        </button>
        <div className="menu-divider" />

        {isActiveSessionBook(book.id) && (
          <>
            {isPaused ? (
              <button className="menu-item" onClick={handleResumeSession}>Resume Timer</button>
            ) : (
              <button className="menu-item" onClick={handlePauseSession}>Pause Timer</button>
            )}
            <button className="menu-item" onClick={handleEndSession}>Stop Timer</button>
            <div className="menu-divider" />
          </>
        )}

        {!activeSession && (
          <button className="menu-item primary" onClick={() => handleStartSession(book)}>
            Start Reading Session
          </button>
        )}

        {book.is_reading && !book.completed && (
          <>
            <button className="menu-item" onClick={() => handleMarkToRead(book)}>End Session (Stop Reading)</button>
            <button className="menu-item success" onClick={() => handleMarkCompleted(book)}>Mark as Completed</button>
          </>
        )}

        {book.completed && (
          <button className="menu-item" onClick={() => handleMarkToRead(book)}>Mark as To Read</button>
        )}

        {!book.is_reading && !book.completed && (
          <button className="menu-item success" onClick={() => handleMarkCompleted(book)}>Mark as Completed</button>
        )}

        <div className="menu-divider" />
        <a href={bookshopUrl(book.title, book.author)} target="_blank" rel="noopener noreferrer" className="menu-item" onClick={() => setOpenMenuId(null)}>
          Buy on Bookshop.org
        </a>
        <a href={amazonUrl(book.title, book.author)} target="_blank" rel="noopener noreferrer" className="menu-item" onClick={() => setOpenMenuId(null)}>
          Buy on Amazon
        </a>
      </div>
    );
  };

  if (loading) {
    return (
      <div className={`library-page ${actualTheme}`} data-testid="library-page">
        <header className="library-header"><h1>My Library</h1></header>
        <SkeletonGrid of="book" count={12} />
      </div>
    );
  }

  if (error) {
    return (
      <div className={`library-page ${actualTheme}`} data-testid="library-page">
        <ErrorState title="Couldn't load your library" body={error} onRetry={fetchBooks} />
      </div>
    );
  }

  const SORT_KEYS = [
    { key: 'date_added', label: 'Date Added' },
    { key: 'title', label: 'Title' },
    { key: 'author', label: 'Author' },
    { key: 'date_read', label: 'Date Read' },
    { key: 'notes', label: 'Notes' },
    { key: 'language', label: 'Language' },
    { key: 'file_type', label: 'File Type' },
  ];

  const STAT_TILES = [
    { value: books.length, label: 'Books' },
    { value: statusCounts.reading, label: 'Reading' },
    { value: notesTotal, label: 'Notes' },
    { value: stats?.readingStreak ?? 0, label: 'Day streak' },
  ];

  return (
    <div className={`library-page ${actualTheme}`} data-testid="library-page">
      {/* Welcome banner */}
      <div className="library-banner">
        <div className="library-banner__top">
          <div className="library-banner__greeting">
            Welcome back, {user?.name?.split(' ')[0] || 'reader'}! <span aria-hidden="true">📚</span>
          </div>
          <div className="library-view-toggle" role="group" aria-label="View mode">
            <button
              className={`view-toggle-btn ${view === 'grid' ? 'active' : ''}`}
              onClick={() => setView('grid')}
              aria-pressed={view === 'grid'}
            >
              <LayoutGrid size={16} /> Grid
            </button>
            <button
              className={`view-toggle-btn ${view === 'list' ? 'active' : ''}`}
              onClick={() => setView('list')}
              aria-pressed={view === 'list'}
            >
              <List size={16} /> List
            </button>
          </div>
        </div>
        <div className="library-banner__stats">
          {STAT_TILES.map(s => (
            <div key={s.label} className="library-stat-tile">
              <div className="library-stat-tile__value">{s.value}</div>
              <div className="library-stat-tile__label">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {activeSession && (
        <div className="active-session-banner">
          <span className="session-icon">Reading</span>
          <span className="session-text">
            Reading: <strong>{activeSession.book.title}</strong>
            {isPaused && <span className="paused-badge">PAUSED</span>}
          </span>
          <div className="session-actions">
            {isPaused ? (
              <button className="session-btn resume" onClick={handleResumeSession}>Resume</button>
            ) : (
              <button className="session-btn pause" onClick={handlePauseSession}>Pause</button>
            )}
            <button className="session-btn end" onClick={handleEndSession}>End Session</button>
          </div>
        </div>
      )}

      {/* Filter chips + search */}
      <div className="library-controls">
        <div className="filter-chips">
          {[
            { key: 'all', label: 'All Books' },
            { key: 'reading', label: 'Reading' },
            { key: 'completed', label: 'Completed' },
            { key: 'to-read', label: 'Unread' }
          ].map(tab => (
            <button
              key={tab.key}
              className={`filter-chip ${statusFilter === tab.key ? 'active' : ''}`}
              onClick={() => setStatusFilter(tab.key)}
            >
              {tab.label} <span className="chip-count">{statusCounts[tab.key]}</span>
            </button>
          ))}
        </div>

        <div className="library-search">
          <Search size={16} className="library-search__icon" />
          <input
            type="search"
            placeholder="Search your library…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            data-testid="search-input"
            aria-label="Search your library"
          />
        </div>
      </div>

      {/* Sort + metadata filter toggle */}
      <div className="library-sortbar">
        <span className="sortbar-label">Sort:</span>
        {SORT_KEYS.map(s => (
          <button
            key={s.key}
            className={`sort-chip ${sortBy === s.key ? 'active' : ''}`}
            onClick={() => handleSort(s.key)}
          >
            {s.label}{sortArrow(s.key)}
          </button>
        ))}
        <button
          className={`sort-chip meta-toggle ${showMetaFilters || hasMetadataFilters ? 'active' : ''}`}
          onClick={() => setShowMetaFilters(v => !v)}
        >
          Filters{hasMetadataFilters ? ` (${selectedLanguages.length + selectedFileTypes.length})` : ''}
        </button>
      </div>

      {showMetaFilters && (
        <div className="metadata-filter-panel">
          <div className="metadata-filter-group">
            <span className="metadata-filter-label">Language</span>
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
          </div>

          <div className="metadata-filter-group">
            <span className="metadata-filter-label">File Type</span>
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
          </div>

          {hasMetadataFilters && (
            <button className="metadata-clear-all-btn" onClick={clearAllMetadataFilters}>Clear all filters</button>
          )}
        </div>
      )}

      <div className="showing-count-row">
        Showing {showingStart}-{showingEnd} of {sortedBooks.length} books
        {(statusFilter !== 'all' || hasMetadataFilters || search.trim()) && ` (filtered from ${books.length})`}
      </div>

      {/* Body: grid or list */}
      {paginatedBooks.length === 0 ? (
        (statusFilter !== 'all' || hasMetadataFilters || search.trim()) ? (
          <EmptyState
            tone="neutral"
            icon={<SearchX />}
            title="No books match"
            body="Nothing on this shelf matches your current filters. Try another shelf or clear them."
            primary={{
              label: 'Clear filters',
              icon: <X size={18} />,
              onClick: () => { setStatusFilter('all'); setSelectedLanguages([]); setSelectedFileTypes([]); setSearch(''); },
            }}
          />
        ) : (
          <EmptyState
            tone="brand"
            icon={<LibraryBig />}
            title="Your shelf is waiting"
            body="Add your first book to start tracking progress, taking notes, and earning badges."
            primary={{ label: 'Add a book', icon: <Plus size={18} />, onClick: () => navigate('/upload') }}
          />
        )
      ) : view === 'grid' ? (
        <div className="library-grid">
          {paginatedBooks.map(book => (
            <BookCard
              key={book.id}
              book={book}
              status={getBookStatus(book)}
              notesCount={notesCount[book.id] || 0}
              active={isActiveSessionBook(book.id)}
              onOpen={() => navigate(`/read/${book.id}`)}
              onMenu={(e) => openActionsMenu(book, e)}
              testId={`book-${book.id}`}
            />
          ))}
        </div>
      ) : (
        <div className="library-list">
          {paginatedBooks.map(book => {
            const status = getBookStatus(book);
            const bookNotesCount = notesCount[book.id] || 0;
            return (
              <div
                key={book.id}
                className={`library-row ${isActiveSessionBook(book.id) ? 'is-active' : ''}`}
                data-testid={`book-${book.id}`}
                role="button"
                tabIndex={0}
                onClick={() => navigate(`/read/${book.id}`)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate(`/read/${book.id}`); } }}
              >
                <div className="library-row__cover">
                  {book.cover_url ? (
                    <img src={book.cover_url} alt="" loading="lazy" />
                  ) : (
                    <span className="library-row__placeholder"><LibraryBig size={18} /></span>
                  )}
                </div>
                <div className="library-row__main">
                  <div className="library-row__title" data-testid={`book-title-${book.id}`}>{book.title}</div>
                  <div className="library-row__author" data-testid={`book-author-${book.id}`}>{book.author || '—'}</div>
                </div>
                <span className={`status-badge ${status}`}>{status.replace('-', ' ')}</span>
                <span className="library-row__meta">{bookNotesCount > 0 ? `${bookNotesCount} notes` : '—'}</span>
                <span className="library-row__meta library-row__date">{formatDate(book.created_at)}</span>
                <button
                  className="library-row__actions"
                  aria-label="Book actions"
                  onClick={(e) => openActionsMenu(book, e)}
                >
                  <MoreVertical size={18} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {renderActionsMenu()}

      {totalPages > 1 && (
        <div className="pagination-controls" data-testid="pagination">
          <button
            className="pagination-btn"
            onClick={() => setCurrentPage(prev => prev - 1)}
            disabled={currentPage === 1}
            data-testid="prev-page"
          >
            Back
          </button>
          <span className="pagination-info">Page {currentPage} of {totalPages}</span>
          <button
            className="pagination-btn"
            onClick={() => setCurrentPage(prev => prev + 1)}
            disabled={currentPage === totalPages}
            data-testid="next-page"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default LibraryPage;
