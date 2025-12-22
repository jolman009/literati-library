import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import './MockLibraryPage.css';

/**
 * MockLibraryPage - Table layout matching LibraryPageV2
 * With sorting and filtering functionality
 * Now uses REAL book data from the API
 */
const BOOKS_PER_PAGE = 20;

const MockLibraryPage = () => {
  const { user, makeAuthenticatedApiCall } = useAuth();
  const [sortBy, setSortBy] = useState('title'); // 'title' | 'author'
  const [sortOrder, setSortOrder] = useState('asc'); // 'asc' | 'desc'
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'reading' | 'completed' | 'to-read'
  const [currentPage, setCurrentPage] = useState(1);

  // Real book data from API
  const [books, setBooks] = useState([]);
  const [notesCount, setNotesCount] = useState({}); // { bookId: count }
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch books from API
  useEffect(() => {
    if (user) {
      fetchBooks();
      fetchNotesCount();
    }
  }, [user]);

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

  // Helper to get book status for filtering
  const getBookStatus = (book) => {
    if (book.completed) return 'completed';
    if (book.is_reading) return 'reading';
    return 'to-read';
  };

  // Helper to format date
  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

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
      const aVal = (a[sortBy] || '').toString().toLowerCase();
      const bVal = (b[sortBy] || '').toString().toLowerCase();
      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredBooks, sortBy, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(sortedBooks.length / BOOKS_PER_PAGE);
  const startIndex = (currentPage - 1) * BOOKS_PER_PAGE;
  const paginatedBooks = sortedBooks.slice(startIndex, startIndex + BOOKS_PER_PAGE);

  // Reset to page 1 when filter or sort changes
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, sortBy, sortOrder]);

  // Handle column header click for sorting
  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  // Sort indicator component
  const SortIndicator = ({ column }) => {
    if (sortBy !== column) return <span className="sort-indicator inactive">↕</span>;
    return <span className="sort-indicator active">{sortOrder === 'asc' ? '↑' : '↓'}</span>;
  };

  // Count books by status
  const statusCounts = useMemo(() => ({
    all: books.length,
    reading: books.filter(b => b.is_reading && !b.completed).length,
    completed: books.filter(b => b.completed).length,
    'to-read': books.filter(b => !b.is_reading && !b.completed).length,
  }), [books]);

  // Loading state
  if (loading) {
    return (
      <div className="mock-library-page">
        <div className="mock-empty-state">Loading your library...</div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="mock-library-page">
        <div className="mock-empty-state" style={{ color: '#dc2626' }}>{error}</div>
      </div>
    );
  }

  return (
    <div className="mock-library-page">
      <header className="library-header">
        <h1>My Library</h1>
      </header>

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

        {/* Sort controls - visible on all screen sizes */}
        <div className="sort-controls">
          <span className="sort-label">Sort by:</span>
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
              <th className="col-date">Date Read</th>
              <th className="col-date">Date Added</th>
              <th className="col-notes">Notes</th>
              <th className="col-actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedBooks.map(book => {
              const status = getBookStatus(book);
              const bookNotesCount = notesCount[book.id] || 0;
              return (
                <tr key={book.id}>
                  <td className="col-cover">
                    <div className="book-cover-thumb">
                      {book.cover_url ? (
                        <img src={book.cover_url} alt={book.title} />
                      ) : (
                        <div className="cover-placeholder">
                          <span>📚</span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="col-title">{book.title}</td>
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
                    <button className="action-btn">⋮</button>
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

      <div className="mock-explanation">
        <strong>Features:</strong> Click Title or Author headers to sort. Use filter tabs to filter by status.
        <br />
        <strong>Responsive:</strong> At &lt;1000px hides Status/Dates. At &lt;600px switches to card layout.
      </div>
    </div>
  );
};

export default MockLibraryPage;
