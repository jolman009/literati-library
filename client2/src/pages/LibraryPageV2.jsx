// LibraryPageV2.jsx - Goodreads-inspired table layout
// Experimental clean rebuild with SINGLE CSS file
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useMaterial3Theme } from '../contexts/Material3ThemeContext';
import API from '../config/api';
import './library-v2.css';

const LibraryPageV2 = () => {
  const { actualTheme } = useMaterial3Theme();
  const { user, makeAuthenticatedApiCall } = useAuth();
  const navigate = useNavigate();

  const [books, setBooks] = useState([]);
  const [notesCount, setNotesCount] = useState({}); // { bookId: count }
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date_added');
  const [sortOrder, setSortOrder] = useState('desc');

  // Fetch books
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

      // Count notes per book
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

  // Get book status
  const getStatus = (book) => {
    if (book.completed) return 'read';
    if (book.is_reading) return 'currently-reading';
    return 'to-read';
  };

  // Format date
  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

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

  // Handle sort click
  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  // Sort indicator
  const SortIndicator = ({ column }) => {
    if (sortBy !== column) return null;
    return <span className="sort-indicator">{sortOrder === 'asc' ? '▲' : '▼'}</span>;
  };

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
              <tr key={book.id} onClick={() => navigate(`/read/${book.id}`)}>
                <td className="col-cover">
                  <div className="book-cover-thumb">
                    {book.cover_url ? (
                      <img
                        src={book.cover_url}
                        alt={book.title}
                        loading="lazy"
                      />
                    ) : (
                      <div className="cover-placeholder">
                        <span className="material-symbols-outlined">menu_book</span>
                      </div>
                    )}
                  </div>
                </td>
                <td className="col-title">
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
                  <button
                    className="action-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/read/${book.id}`);
                    }}
                  >
                    Read
                  </button>
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
