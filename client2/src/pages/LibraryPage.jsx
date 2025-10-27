import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useMaterial3Theme } from '../contexts/Material3ThemeContext';
import { useReadingSession } from '../contexts/ReadingSessionContext';
import { BookGridSkeleton, StatsSkeleton } from '../components/ui/LoadingStates';
import API from '../config/api';
import '../components/EnhancedBookCard.css';

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
  const [useVirtualization, setUseVirtualization] = useState(false);

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
    if (window.confirm(`Are you sure you want to delete "${book.title}"?`)) {
      try {
        await API.delete(`/books/${book.id}`);
        setBooks(prevBooks => prevBooks.filter(b => b.id !== book.id));
      } catch (error) {
        console.error('Failed to delete book:', error);
      }
    }
  };

  const handleSelectBook = (bookId) => {
    setSelectedBooks(prev => 
      prev.includes(bookId) 
        ? prev.filter(id => id !== bookId)
        : [...prev, bookId]
    );
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
                  viewMode={viewMode}
                  className="library-virtualized-grid"
                />
              </div>
            ) : (
              <div className={`md3-books-container ${viewMode}`}>
                {filteredBooks.map(book => (
                  <div 
                    key={book.id} 
                    className={`md3-book-card ${highlightedBookId === book.id ? 'highlighted' : ''}`}
                    data-book-id={book.id}
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
                          title="Stop reading (set to paused)"
                          onClick={(e) => {
                            e.stopPropagation();
                            (async () => {
                              try {
                                await API.patch(`/books/${book.id}`, {
                                  status: 'paused',
                                  is_reading: true,
                                  last_opened: new Date().toISOString()
                                });
                                setBooks(prev => prev.map(b => b.id === book.id ? { ...b, status: 'paused', is_reading: true } : b));
                                window.dispatchEvent(new CustomEvent('bookUpdated', { detail: { bookId: book.id, action: 'stop_reading', status: 'paused' } }));
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
                      {/* Menu Button (hidden when active session matches or reading) */}
                      {activeSession?.book?.id !== book.id && !(book.is_reading || book.status === 'reading') && (
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
                          borderRadius: '50%',
                          backgroundColor: 'rgba(0, 0, 0, 0.8)',
                          border: '2px solid rgba(255, 255, 255, 0.9)',
                          color: 'white',
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
                        ⋮
                      </button>
                      )}

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
    className={`md3-library-page' actual-theme-${actualTheme}`}
   onDrop={handleDragDrop}
   onDragOver={handleDragOver}
    >
    {renderPageContent()}

    <button 
     className="md3-fab"
     onClick={() => navigate('/upload')}
    title="Upload new book"
    >
    <span className="material-symbols-outlined">add</span>
    </button>

      {/* ✅ Timer now handled globally by ReadingSessionTimer in App.jsx */}
    </div>
  );
 };
export default LibraryPage;

