import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useMaterial3Theme } from '../contexts/Material3ThemeContext';
import { useReadingSession } from '../contexts/ReadingSessionContext';
import { BookGridSkeleton, StatsSkeleton } from '../components/ui/LoadingStates';
import API from '../config/api';
import '../components/EnhancedBookCard.css';
import { useSnackbar } from '../components/Material3';

// Import the complex components you need
const ReadingPage = React.lazy(() => import('./library/ReadingPage'));
const StatisticsPage = React.lazy(() => import('./library/StatisticsPage'));
const EnhancedStatisticsPage = React.lazy(() => import('./library/EnhancedStatisticsPage'));
const EnhancedCollectionsPage = React.lazy(() => import('./subpages/EnhancedCollectionsPage'));
const NotesSubpage = React.lazy(() => import('./subpages/NotesSubpage'));

// Import dashboard components
import WelcomeWidget from '../components/WelcomeWidget';
// import EnhancedBookCard from '../components/EnhancedBookCard';
import { BookCoverManager } from '../components/BookCoverManager';
// ❌ REMOVED: FloatingTimer - using global ReadingSessionTimer instead
import VirtualizedBookGrid from '../components/performance/VirtualizedBookGrid';

const LibraryPage = () => {
  const { actualTheme } = useMaterial3Theme();
  const { user, makeAuthenticatedApiCall } = useAuth();
  const { 
    startReadingSession, 
    stopReadingSession,
    pauseReadingSession,
    resumeReadingSession,
    activeSession,
    isPaused 
  } = useReadingSession();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('grid');
  const [filter, setFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState('library');
  const [batchMode, setBatchMode] = useState(false);
  const [selectedBooks, setSelectedBooks] = useState([]);
  const [highlightedBookId, setHighlightedBookId] = useState(null);
  const [openMenuBookId, setOpenMenuBookId] = useState(null);
  const [useVirtualization, setUseVirtualization] = useState(true);
  const [confirmDeleteBulk, setConfirmDeleteBulk] = useState(false);
  const [isDeletingBulk, setIsDeletingBulk] = useState(false);
  const { showSnackbar } = useSnackbar();
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Pull-to-refresh state
  const [pullStartY, setPullStartY] = useState(0);
  const [pullDistance, setPullDistance] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const pullThreshold = 80; // pixels to pull before triggering refresh

  // Temporarily disable virtualization to avoid react-window grid crash
  // TODO: Re-enable after stabilizing Grid sizing lifecycle
  useEffect(() => {
    setUseVirtualization(false);
  }, [books.length]);

  // Analytics data for welcome widget
  const analytics = {
    totalBooks: books.length,
    readingBooks: books.filter(b => b.is_reading && !b.completed).length,
    completedBooks: books.filter(b => b.completed).length,
    unreadBooks: books.filter(b => !b.is_reading && !b.completed).length
  };

  // Pagination controls for initial load (can be extended to infinite scroll)
  const PAGE_LIMIT = 200;
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    if (user) {
      fetchBooks(0);
    }
  }, [user]); // Fetch books when user is available

  // Handle navigation from global search
  useEffect(() => {
    if (location.state?.page) {
      setCurrentPage(location.state.page);
      
      // Clear the location state to prevent re-triggering
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, navigate]);

  const fetchBooks = async (offset = 0) => {
    try {
      console.log('📚 LibraryPage: Starting to fetch books...');
      setLoading(true);
      const response = await makeAuthenticatedApiCall(`/books?limit=${PAGE_LIMIT}&offset=${offset}`);

      console.log('📚 LibraryPage: Response received:', {
        dataType: typeof response,
        isArray: Array.isArray(response),
        hasBooks: !!response?.books,
        hasItems: !!response?.items,
        dataKeys: Object.keys(response || {}),
        sampleData: response
      });

      const { items = [], total } = response || {};
      const booksData = items;

      console.log('📚 LibraryPage: Books data processed:', {
        bookCount: booksData.length,
        totalCount: typeof total === 'number' ? total : booksData.length,
        firstBook: booksData[0],
        allTitles: booksData.map(b => b.title)
      });

      setBooks(booksData);
      setTotalCount(typeof total === 'number' ? total : booksData.length);
      setError(null);
      console.log('✅ LibraryPage: Books set successfully!');
    } catch (error) {
      console.error('❌ LibraryPage: Failed to fetch books:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response,
        status: error.response?.status,
        data: error.response?.data
      });
      setError('Failed to load your library');
    } finally {
      setLoading(false);
    }
  };

  // Pull-to-refresh handlers
  const handleTouchStart = (e) => {
    // Only activate pull-to-refresh if we're at the top of the page
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    if (scrollTop === 0 && !isRefreshing) {
      setPullStartY(e.touches[0].clientY);
      setIsPulling(true);
    }
  };

  const handleTouchMove = (e) => {
    if (!isPulling || isRefreshing) return;

    const currentY = e.touches[0].clientY;
    const distance = currentY - pullStartY;

    // Only allow pulling down (positive distance)
    if (distance > 0) {
      // Apply resistance: the further you pull, the harder it gets
      const resistance = 0.5;
      const adjustedDistance = Math.min(distance * resistance, 120); // Max 120px
      setPullDistance(adjustedDistance);

      // Prevent default scrolling when pulling
      if (adjustedDistance > 10) {
        e.preventDefault();
      }

      // Haptic feedback when reaching threshold
      if (adjustedDistance >= pullThreshold && navigator.vibrate) {
        navigator.vibrate(10);
      }
    }
  };

  const handleTouchEnd = async () => {
    if (!isPulling) return;

    setIsPulling(false);

    // Trigger refresh if pulled beyond threshold
    if (pullDistance >= pullThreshold && !isRefreshing) {
      setIsRefreshing(true);

      // Haptic feedback for successful trigger
      if (navigator.vibrate) {
        navigator.vibrate([30, 20, 30]);
      }

      try {
        await fetchBooks(0);
        showSnackbar({ message: '✓ Library refreshed!', variant: 'success' });
      } catch (error) {
        showSnackbar({ message: 'Failed to refresh library', variant: 'error' });
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
      }
    } else {
      // Reset pull distance with animation
      setPullDistance(0);
    }
  };

  // Delete/Patch helpers with fallback for servers using '/api' prefix
  const deleteBookServer = async (bookId) => {
    try {
      await makeAuthenticatedApiCall(`/books/${bookId}`, { method: 'DELETE' });
    } catch (err1) {
      try {
        await makeAuthenticatedApiCall(`/api/books/${bookId}`, { method: 'DELETE' });
      } catch (err2) {
        throw err2 || err1;
      }
    }
  };

  const patchBookServer = async (bookId, updates) => {
    const options = { method: 'PATCH', body: JSON.stringify(updates) };
    try {
      return await makeAuthenticatedApiCall(`/books/${bookId}`, options);
    } catch (err1) {
      try {
        return await makeAuthenticatedApiCall(`/api/books/${bookId}`, options);
      } catch (err2) {
        throw err2 || err1;
      }
    }
  };

  const filteredBooks = books.filter(book => {
    switch (filter) {
      case 'reading':
        return book.is_reading && !book.completed;
      case 'completed':
        return book.completed;
      case 'unread':
        return !book.is_reading && !book.completed;
      default:
        return true;
    }
  });

  const handleBookClick = (book) => {
    console.log('📖 LibraryPage: handleBookClick called for book:', {
      id: book.id,
      title: book.title,
      navigatingTo: `/read/${book.id}`
    });
    navigate(`/read/${book.id}`);
    console.log('✅ LibraryPage: navigate() called successfully');
  };

  const handleBookUpdate = async (updatedBook) => {
    try {
      await API.patch(`/books/${updatedBook.id}`, updatedBook);
      setBooks(prevBooks => 
        prevBooks.map(book => 
          book.id === updatedBook.id ? { ...book, ...updatedBook } : book
        )
      );
    } catch (error) {
      console.error('Failed to update book:', error);
    }
  };

  const handleRead = (book) => {
    console.log('📖 LibraryPage: handleRead called for book:', {
      id: book.id,
      title: book.title,
      format: book.format,
      file_url: book.file_url,
      navigatingTo: `/read/${book.id}`
    });
    navigate(`/read/${book.id}`);
    console.log('✅ LibraryPage: navigate() to reader called successfully');
  };

  // Reading session handlers
  const handleStartSession = async (book) => {
    const result = await startReadingSession(book);
    if (result.success) {
      console.log('📖 Reading session started for:', book.title);
    }
    setOpenMenuBookId(null);
  };

  const handlePauseSession = async () => {
    const result = await pauseReadingSession();
    if (result.success) {
      console.log('⏸️ Reading session paused');
    }
    setOpenMenuBookId(null);
  };

  const handleResumeSession = async () => {
    const result = await resumeReadingSession();
    if (result.success) {
      console.log('▶️ Reading session resumed');
    }
    setOpenMenuBookId(null);
  };

  const handleEndSession = async () => {
    const result = await stopReadingSession();
    if (result.success) {
      console.log('⏹️ Reading session ended');
    }
    setOpenMenuBookId(null);
  };

  const handleEdit = (book) => {
    console.log('Edit book:', book);
    // TODO: Implement edit functionality
  };

  const handleDelete = async (book) => {
    try {
      setIsDeleting(true);
      await makeAuthenticatedApiCall(`/books/${book.id}`, { method: 'DELETE' });
      setBooks(prevBooks => prevBooks.filter(b => b.id !== book.id));
      try { localStorage.setItem('books_updated', Date.now().toString()); } catch {}
      window.dispatchEvent(new CustomEvent('bookDeleted', { detail: { bookId: book.id } }));
      showSnackbar({ message: `Deleted "${book.title}"`, variant: 'success' });
    } catch (error) {
      console.error('Failed to delete book:', error);
      showSnackbar({ message: error?.message || 'Failed to delete book', variant: 'error' });
    } finally {
      setIsDeleting(false);
      setConfirmDelete(null);
    }
  };

  const handleSelectBook = (bookId) => {
    setSelectedBooks(prev => 
      prev.includes(bookId) 
        ? prev.filter(id => id !== bookId)
        : [...prev, bookId]
    );
  };

  const handleDeleteSelected = async () => {
    if (!Array.isArray(selectedBooks) || selectedBooks.length === 0) return;
    try {
      setIsDeletingBulk(true);
      const results = await Promise.allSettled(
        selectedBooks.map(id => makeAuthenticatedApiCall(`/books/${id}`, { method: 'DELETE' }))
      );
      const succeeded = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.length - succeeded;
      if (succeeded > 0) {
        setBooks(prev => prev.filter(b => !selectedBooks.includes(b.id)));
      }
      try { localStorage.setItem('books_updated', Date.now().toString()); } catch {}
      setSelectedBooks([]);
      setConfirmDeleteBulk(false);
      if (failed > 0) {
        alert(`${failed} item(s) failed to delete`);
      }
    } catch (err) {
      console.error('Bulk delete failed:', err);
      alert(err?.message || 'Failed to delete selected books');
    } finally {
      setIsDeletingBulk(false);
    }
  };

  const handleDragDrop = (e) => {
    e.preventDefault();
    // TODO: Implement drag and drop functionality
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleRecentBookClick = (book) => {
    // Scroll to the book in the main grid and highlight it
    const bookElement = document.querySelector(`[data-book-id="${book.id}"]`);
    if (bookElement) {
      // Scroll to the book with smooth behavior
      bookElement.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center',
        inline: 'nearest'
      });
      
      // Highlight the book for 2 seconds
      setHighlightedBookId(book.id);
      setTimeout(() => {
        setHighlightedBookId(null);
      }, 2000);
    } else {
      // If book not visible due to filters, show it by clearing filters
      setFilter('all');
      // Wait for re-render then scroll
      setTimeout(() => {
        const bookElementAfterFilter = document.querySelector(`[data-book-id="${book.id}"]`);
        if (bookElementAfterFilter) {
          bookElementAfterFilter.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center',
            inline: 'nearest'
          });
          setHighlightedBookId(book.id);
          setTimeout(() => {
            setHighlightedBookId(null);
          }, 2000);
        }
      }, 100);
    }
  };

  // Handler for virtualized grid menu clicks
  const handleVirtualizedMenuClick = (bookId) => {
    setOpenMenuBookId(openMenuBookId === bookId ? null : bookId);
  };


  const renderPageContent = () => {
    switch (currentPage) {
      case 'reading':
        return (
          <React.Suspense fallback={<div className="md3-loading-text">📖 Loading Reading Page...</div>}>
            <ReadingPage
              books={books}
              onBookAction={handleBookUpdate}
            />
          </React.Suspense>
        );

      case 'stats':
        return (
          <React.Suspense fallback={<div className="md3-loading-text">📊 Loading Statistics...</div>}>
            <EnhancedStatisticsPage 
              books={books} 
              user={user} 
            />
          </React.Suspense>
        );
         
      case 'collections':
        return (
          <React.Suspense fallback={<div className="md3-loading-text">📁 Loading Collections...</div>}>
            <EnhancedCollectionsPage books={books} />
          </React.Suspense>
        );

      case 'notes':
        return (
          <NotesSubpage 
            books={books} 
            onNoteAction={(action, noteData) => {
              console.log('Note action:', action, noteData);
            }}
          />
        );

      case 'library':
      default:
        return renderLibraryView();
    }
  };

  const renderLibraryView = () => {
    if (loading) {
      return (
        <div className="md3-library-loading">
          <div className="md3-loading-spinner">
            <div className="md3-circular-progress"></div>
          </div>
          <p className="md3-loading-text">Loading your library...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="md3-library-error">
          <span className="material-symbols-outlined md3-error-icon">error</span>
          <h3 className="md3-error-title">Oops! Something went wrong</h3>
          <p className="md3-error-message">{error}</p>
          <button className="md3-button md3-button-filled" onClick={() => fetchBooks(0)}>
            <span className="material-symbols-outlined">refresh</span>
            Try Again
          </button>
        </div>
      );
    }

    return (
      <>
        {/* Welcome Widget - Only show on                                                        */}
        {currentPage === 'library' && (
          <WelcomeWidget
            user={user}
            books={books} 
            currentPage={currentPage}
            onNavigate={setCurrentPage}
            analytics={analytics}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
          />
        )}

        {/* Recently Added Books Section - Only show on library page */}
        {currentPage === 'library' && (() => {
          // Get recently added books for display
          const recentBooks = filteredBooks
            .filter(book => book.created_at || book.dateAdded)
            .sort((a, b) => {
              const dateA = new Date(a.created_at || a.dateAdded || 0);
              const dateB = new Date(b.created_at || b.dateAdded || 0);
              return dateB - dateA;
            })
            .slice(0, 6); // Show 6 recent books for better layout
          
          if (recentBooks.length === 0) return null;
          
          return (
            <div className="md3-recent-books-section">
              <div className="md3-recent-books-header">
                <h3 className="md3-recent-books-title">
                  <span className="material-symbols-outlined">new_releases</span>
                  Recently Added
                </h3>
                <span className="md3-recent-books-count">
                  {recentBooks.length} books
                </span>
              </div>
              
              <div className="md3-recent-books-scroll">
                {recentBooks.map((book) => (
                  <div key={book.id} className="md3-recent-book-item">
                    <div 
                      className="md3-recent-book-card"
                      onClick={() => handleRecentBookClick(book)}
                    >
                      <div className="md3-recent-book-cover">
                        <BookCoverManager 
                          book={book}
                          size="small"
                          onClick={() => handleRecentBookClick(book)}
                          className="recent-book-cover-manager"
                        />
                      </div>
                      <div className="md3-recent-book-info">
                        <h4 className="md3-recent-book-title">{book.title}</h4>
                        <p className="md3-recent-book-author">{book.author}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}


        {currentPage === 'library' && (
          <div className="md3-library-controls">
            <div className="md3-filter-chips">
              <button 
                className={`md3-filter-chip ${filter === 'all' ? 'selected' : ''}`}
                onClick={() => setFilter('all')}
              >
                All Books ({totalCount})
              </button>
              <button 
                className={`md3-filter-chip ${filter === 'reading' ? 'selected' : ''}`}
                onClick={() => setFilter('reading')}
              >
                Currently Reading ({books.filter(b => b.is_reading && !b.completed).length})
              </button>
              <button 
                className={`md3-filter-chip ${filter === 'completed' ? 'selected' : ''}`}
                onClick={() => setFilter('completed')}
              >
                Completed ({books.filter(b => b.completed).length})
              </button>
              <button 
                className={`md3-filter-chip ${filter === 'unread' ? 'selected' : ''}`}
                onClick={() => setFilter('unread')}
              >
                Unread ({books.filter(b => !b.is_reading && !b.completed).length})
              </button>
            </div>

            <div className="md3-view-controls">
              <button 
                className={`md3-icon-button ${viewMode === 'grid' ? 'selected' : ''}`}
                onClick={() => setViewMode('grid')}
                title="Grid view"
              >
                <span className="material-symbols-outlined">grid_view</span>
              </button>
              <button 
                className={`md3-icon-button ${viewMode === 'list' ? 'selected' : ''}`}
                onClick={() => setViewMode('list')}
                title="List view"
              >
                <span className="material-symbols-outlined">view_list</span>
              </button>
            </div>
          </div>
        )}

        {currentPage === 'library' && (
          <>
            {filteredBooks.length === 0 ? (
              <div className="md3-library-empty">
                <span className="material-symbols-outlined md3-empty-icon">menu_book</span>
                <h3 className="md3-empty-title">
                  {filter === 'all' ? 'No books in your library yet' : `No ${filter} books`}
                </h3>
                <p className="md3-empty-message">
                  {filter === 'all' 
                    ? 'Start building your digital library by uploading your first book!'
                    : `You don't have any ${filter} books at the moment.`
                  }
                </p>
                {filter === 'all' && (
                  <button 
                    className="md3-button md3-button-filled"
                    onClick={() => navigate('/upload')}
                  >
                    <span className="material-symbols-outlined">upload</span>
                    Upload Your First Book
                  </button>
                )}
              </div>
            ) : useVirtualization ? (
              <>
              <div className="md3-notes-toolbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, margin: '12px 0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="md-body-small">Selected: {selectedBooks.length}</span>
                  {selectedBooks.length > 0 && (
                    <button onClick={() => setSelectedBooks([])} className="md3-icon-button" title="Clear selection">
                      <span className="material-symbols-outlined">close</span>
                    </button>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    className="md3-button md3-button--filled"
                    disabled={selectedBooks.length === 0}
                    onClick={() => setConfirmDeleteBulk(true)}
                    style={{ background: 'var(--md-sys-color-error)', color: 'var(--md-sys-color-on-error)' }}
                  >
                    Delete Selected
                  </button>
                </div>
              </div>
              <div className="md3-virtualized-container" style={{ height: '600px' }}>
              <VirtualizedBookGrid
                books={filteredBooks}
                onBookClick={handleBookClick}
                onBookMenuClick={handleVirtualizedMenuClick}
                highlightedBookId={highlightedBookId}
                openMenuBookId={openMenuBookId}
                activeSession={activeSession}
                isPaused={isPaused}
                onResumeSession={handleResumeSession}
                onPauseSession={handlePauseSession}
                onEndSession={handleEndSession}
                onStatusChange={async (updated) => {
                  try {
                    await API.patch(`/books/${updated.id}`, updated);
                    setBooks(prev => prev.map(b => b.id === updated.id ? { ...b, ...updated } : b));
                    setOpenMenuBookId(null);
                  } catch (err) {
                    console.error('Failed to update status:', err);
                  }
                }}
                onEditBook={(book) => {
                  // Placeholder: open read page as edit entry point or emit event
                  console.log('Edit book requested:', book.id);
                  // You could navigate to an edit dialog/page here
                }}
                onDeleteBook={(book) => {
                  setConfirmDelete(book);
                  setOpenMenuBookId(null);
                }}
                selectedIds={selectedBooks}
                onToggleSelect={handleSelectBook}
                viewMode={viewMode}
                className="library-virtualized-grid"
              />
              </div>
              </>
            ) : (
              <div className={`md3-books-container ${viewMode}`}>
                {filteredBooks.map(book => (
                  <div 
                    key={book.id} 
                    className={`md3-book-card ${highlightedBookId === book.id ? 'highlighted' : ''}`}
                    data-book-id={book.id}
                    role="button"
                    tabIndex={0}
                    aria-label={`Open ${book.title}`}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleBookClick(book);
                      } else if (e.key === 'Escape' && openMenuBookId === book.id) {
                        setOpenMenuBookId(null);
                      }
                    }}
                    onClick={() => handleBookClick(book)}
                  >
                    <div className="md3-book-cover">
                      <BookCoverManager 
                        book={book}
                        size="medium"
                        onClick={() => handleBookClick(book)}
                        className="library-book-cover-manager"
                      />
                      {book.is_reading && (
                        <div className="md3-book-badge reading">
                          <span className="material-symbols-outlined">play_arrow</span>
                        </div>
                      )}
                      {book.completed && (
                        <div className="md3-book-badge completed">
                          <span className="material-symbols-outlined">check_circle</span>
                        </div>
                      )}
                      
                      {/* Red Stop button when this is the active session */}
                      {activeSession?.book?.id === book.id && (
                        <button
                          className="book-menu-button"
                          title="End reading session"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEndSession();
                          }}
                          style={{
                            position: 'absolute',
                            top: '8px',
                            right: '8px',
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            backgroundColor: '#ef4444',
                            border: '2px solid rgba(255, 255, 255, 0.9)',
                            color: '#fff',
                            fontSize: '18px',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            zIndex: 100,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s ease',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
                          }}
                        >
                          <span className="material-symbols-outlined">stop</span>
                        </button>
                      )}
                      {/* Red Stop when status=reading (no active session) */}
                      {activeSession?.book?.id !== book.id && (book.is_reading || book.status === 'reading') && (
                        <button
                          className="book-menu-button"
                          title="Stop reading (return to normal)"
                          onClick={(e) => {
                            e.stopPropagation();
                            (async () => {
                              try {
                                await API.patch(`/books/${book.id}`, {
                                  status: 'unread',
                                  is_reading: false,
                                });
                                setBooks(prev => prev.map(b => b.id === book.id ? { ...b, status: 'unread', is_reading: false, completed: false } : b));
                                window.dispatchEvent(new CustomEvent('bookUpdated', { detail: { bookId: book.id, action: 'stop_reading', status: 'unread' } }));
                                localStorage.setItem('books_updated', Date.now().toString());
                              } catch (err) {
                                console.error('Failed to pause reading status:', err);
                              }
                            })();
                          }}
                          style={{
                            position: 'absolute',
                            top: '8px',
                            right: '8px',
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            backgroundColor: '#ef4444',
                            border: '2px solid rgba(255, 255, 255, 0.9)',
                            color: '#fff',
                            fontSize: '18px',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            zIndex: 100,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s ease',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
                          }}
                        >
                          <span className="material-symbols-outlined">stop</span>
                        </button>
                      )}
                      {/* Menu Button: always available to access actions incl. Delete */}
                      <button
                        className="book-menu-button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenMenuBookId(openMenuBookId === book.id ? null : book.id);
                        }}
                        style={{
                          position: 'absolute',
                          top: '8px',
                          right: '8px',
                          width: '40px',
                          height: '40px',
                          minWidth: '40px',
                          minHeight: '40px',
                          maxWidth: '40px',
                          maxHeight: '40px',
                          borderRadius: '50%',
                          backgroundColor: 'rgba(0, 0, 0, 0.8)',
                          border: '2px solid rgba(255, 255, 255, 0.9)',
                          color: 'white',
                          fontSize: '18px',
                          fontWeight: 'bold',
                          cursor: 'pointer',
                          zIndex: 120,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.2s ease',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                          flexShrink: 0,
                          overflow: 'hidden',
                          padding: 0
                        }}
                        aria-haspopup="menu"
                        aria-expanded={openMenuBookId === book.id}
                        aria-label={`Open menu for ${book.title}`}
                        title="More actions"
                      >
                        ⋮
                      </button>

                      {/* Menu Dropdown */}
                      {openMenuBookId === book.id && (
                        <>
                          {/* Backdrop */}
                          <div
                            style={{
                              position: 'fixed',
                              inset: 0,
                              backgroundColor: 'rgba(0, 0, 0, 0.1)',
                              zIndex: 90,
                              backdropFilter: 'blur(2px)'
                            }}
                            onClick={() => setOpenMenuBookId(null)}
                          />
                          
                          {/* Menu */}
                          <div
                            className="book-actions-menu"
                            style={{
                              position: 'absolute',
                              top: '50px',
                              right: '8px'
                            }}
                            role="menu"
                            aria-label={`Actions for ${book.title}`}
                            onKeyDown={(e) => { if (e.key === 'Escape') { e.stopPropagation(); setOpenMenuBookId(null); } }}
                          >
                            {/* Reading Session Controls */}
                            {activeSession?.book?.id === book.id ? (
                              <>
                                {isPaused ? (
                                  <button
                                    className="book-menu-item"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleResumeSession();
                                    }}
                                  >
                                    <span className="book-menu-item__icon">▶️</span>
                                    Resume Reading
                                  </button>
                                ) : (
                                  <button
                                    className="book-menu-item"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handlePauseSession();
                                    }}
                                  >
                                    <span className="book-menu-item__icon">⏸️</span>
                                    Pause Reading
                                  </button>
                                )}
                                <button
                                  className="book-menu-item book-menu-item--error"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEndSession();
                                  }}
                                >
                                  <span className="book-menu-item__icon">⏹️</span>
                                  End Session
                                </button>
                              </>
                            ) : (
                              <button
                                className="book-menu-item book-menu-item--primary"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleStartSession(book);
                                }}
                              >
                                <span className="book-menu-item__icon">📖</span>
                                Start Reading Session
                              </button>
                            )}

                            <div className="book-menu-divider" />

                            {/* Other actions */}
                            <button
                              className="book-menu-item"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRead(book);
                                setOpenMenuBookId(null);
                              }}
                            >
                              <span className="book-menu-item__icon">📚</span>
                              Open Book
                            </button>

                            <button
                              className="book-menu-item"
                              onClick={async (e) => {
                                e.stopPropagation();
                                try {
                                  await API.patch(`/books/${book.id}`, { status: 'completed', is_reading: false, completed: true, progress: 100 });
                                  setBooks(prev => prev.map(b => b.id === book.id ? { ...b, status: 'completed', is_reading: false, completed: true, progress: 100 } : b));
                                  setOpenMenuBookId(null);
                                } catch (err) {
                                  console.error('Failed to mark as completed:', err);
                                }
                              }}
                            >
                              <span className="book-menu-item__icon">✅</span>
                              Mark as Completed
                            </button>

                            <button
                              className="book-menu-item"
                              onClick={async (e) => {
                                e.stopPropagation();
                                try {
                                  await API.patch(`/books/${book.id}`, { status: 'unread', is_reading: false, completed: false, progress: 0 });
                                  setBooks(prev => prev.map(b => b.id === book.id ? { ...b, status: 'unread', is_reading: false, completed: false, progress: 0 } : b));
                                  setOpenMenuBookId(null);
                                } catch (err) {
                                  console.error('Failed to mark as want to read:', err);
                                }
                              }}
                            >
                              <span className="book-menu-item__icon">🔖</span>
                              Mark as Want to Read
                            </button>

                            <button
                              className="book-menu-item"
                              onClick={(e) => {
                                e.stopPropagation();
                                console.log('Edit book requested:', book.id);
                                // TODO: Implement edit UI
                                setOpenMenuBookId(null);
                              }}
                            >
                              <span className="book-menu-item__icon">✏️</span>
                              Edit Book
                            </button>

                            <button
                              className="book-menu-item book-menu-item--error"
                              onClick={(e) => {
                                e.stopPropagation();
                                setConfirmDelete(book);
                                setOpenMenuBookId(null);
                              }}
                            >
                              <span className="book-menu-item__icon">🗑️</span>
                              Delete Book
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                    <div className="md3-book-info">
                      <h4 className="md3-book-title">{book.title}</h4>
                      <p className="md3-book-author">{book.author}</p>
                      {book.genre && (
                        <p className="md3-book-genre">{book.genre}</p>
                      )}
                      {book.progress > 0 && (
                        <div className="md3-progress-bar">
                          <div 
                            className="md3-progress-fill" 
                            style={{ width: `${book.progress}%` }}
                          ></div>
                        </div>
                      )}
                    </div>
                    {/* Inline Delete control removed: use overflow menu Delete instead to prevent accidental taps */}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </>
    );
  };

  return (
   <div
    className={`md3-library-page actual-theme-${actualTheme}`}
   onDrop={handleDragDrop}
   onDragOver={handleDragOver}
    onTouchStart={handleTouchStart}
    onTouchMove={handleTouchMove}
    onTouchEnd={handleTouchEnd}
    style={{
      position: 'relative',
      transition: 'transform 0.3s ease',
      transform: isPulling ? `translateY(${pullDistance}px)` : 'translateY(0)'
    }}
    >
    {/* Pull-to-Refresh Indicator */}
    {(isPulling || isRefreshing) && (
      <div style={{
        position: 'fixed',
        top: 0,
        left: '50%',
        transform: `translateX(-50%) translateY(${Math.max(pullDistance - 40, 0)}px)`,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '8px',
        padding: '12px 24px',
        background: actualTheme === 'dark'
          ? 'rgba(30, 41, 59, 0.95)'
          : 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(8px)',
        borderRadius: '0 0 16px 16px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        transition: 'transform 0.3s ease, opacity 0.3s ease',
        opacity: isPulling ? Math.min(pullDistance / pullThreshold, 1) : 1
      }}>
        <div style={{
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          border: `3px solid ${pullDistance >= pullThreshold ? '#10b981' : '#3b82f6'}`,
          borderTopColor: 'transparent',
          animation: isRefreshing ? 'spin 0.8s linear infinite' : 'none',
          transform: isPulling ? `rotate(${pullDistance * 3}deg)` : 'rotate(0deg)',
          transition: 'border-color 0.3s ease'
        }} />
        <span style={{
          fontSize: '13px',
          fontWeight: '500',
          color: actualTheme === 'dark' ? '#e2e8f0' : '#334155',
          opacity: 0.9
        }}>
          {isRefreshing
            ? 'Refreshing...'
            : pullDistance >= pullThreshold
            ? 'Release to refresh'
            : 'Pull to refresh'}
        </span>
      </div>
    )}

    {renderPageContent()}

    {/* Bulk Delete Confirmation Dialog */}
    {confirmDeleteBulk && (
      <div
        role="dialog"
        aria-modal="true"
        style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1300 }}
      >
        <div
          onClick={() => !isDeletingBulk && setConfirmDeleteBulk(false)}
          style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)' }}
        />
        <div className="bg-surface-container-high rounded-large shadow-lg border border-outline-variant"
             style={{ position: 'relative', maxWidth: 420, width: '92%', padding: 20 }}>
          <div className="md-title-large mb-1">Delete selected books?</div>
          <div className="md-body-medium text-on-surface-variant mb-4">
            This will permanently delete {selectedBooks.length} book{selectedBooks.length === 1 ? '' : 's'}. This action cannot be undone.
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

    {/* MD3 Confirmation Dialog for Delete */}
    {confirmDelete && (
      <div
        role="dialog"
        aria-modal="true"
        style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1300 }}
      >
        <div
          onClick={() => !isDeleting && setConfirmDelete(null)}
          style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)' }}
        />
        <div className="bg-surface-container-high rounded-large shadow-lg border border-outline-variant"
             style={{ position: 'relative', maxWidth: 420, width: '92%', padding: 20 }}>
          <div className="md-title-large mb-1">Delete book?</div>
          <div className="md-body-medium text-on-surface-variant mb-4">
            This will remove "{confirmDelete.title}" and its file. This action cannot be undone.
          </div>
          <div className="flex items-center justify-end gap-2">
            <button className="md3-button md3-button--text" onClick={() => setConfirmDelete(null)} disabled={isDeleting}>Cancel</button>
            <button className="md3-button md3-button--filled" style={{ background: 'var(--md-sys-color-error)', color: 'var(--md-sys-color-on-error)' }} onClick={() => handleDelete(confirmDelete)} disabled={isDeleting}>
              {isDeleting ? 'Deleting…' : 'Delete'}
            </button>
          </div>
        </div>
      </div>
    )}

    <button
     className="md3-fab"
     onClick={() => navigate('/upload')}
    title="Upload new book"
    >
    <span className="material-symbols-outlined">add</span>
    </button>

      {/* ✅ Timer now handled globally by ReadingSessionTimer in App.jsx */}

    {/* Add CSS animation for pull-to-refresh spinner */}
    <style>{`
      @keyframes spin {
        from {
          transform: rotate(0deg);
        }
        to {
          transform: rotate(360deg);
        }
      }
    `}</style>
    </div>
  );
 };
export default LibraryPage;
