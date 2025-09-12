import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useMaterial3Theme } from '../contexts/Material3ThemeContext';
import { useReadingSession } from '../contexts/ReadingSessionContext';
import { BookGridSkeleton, StatsSkeleton } from '../components/ui/LoadingStates';
import API from '../config/api';

// Import the complex components you need
const ReadingPage = React.lazy(() => import('./library/ReadingPage'));
const StatisticsPage = React.lazy(() => import('./library/StatisticsPage'));
const EnhancedStatisticsPage = React.lazy(() => import('./library/EnhancedStatisticsPage'));
const EnhancedCollectionsPage = React.lazy(() => import('./subpages/EnhancedCollectionsPage'));
const NotesSubpage = React.lazy(() => import('./subpages/NotesSubpage'));

// Import dashboard components
import WelcomeWidget from '../components/WelcomeWidget';
import EnhancedBookCard from '../components/EnhancedBookCard';
import { BookCoverManager, BatchCoverProcessor } from '../components/BookCoverManager';
import FloatingTimer from '../components/FloatingTimer';

const LibraryPage = () => {
  const { actualTheme } = useMaterial3Theme();
  const { user, token } = useAuth();
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

  // Analytics data for welcome widget
  const analytics = {
    totalBooks: books.length,
    readingBooks: books.filter(b => b.is_reading && !b.completed).length,
    completedBooks: books.filter(b => b.completed).length,
    unreadBooks: books.filter(b => !b.is_reading && !b.completed).length
  };

  useEffect(() => {
    if (user && token) {
      fetchBooks();
    }
  }, [user, token, activeSession]); // Also refresh when active session changes

  // Handle navigation from global search
  useEffect(() => {
    if (location.state?.page) {
      setCurrentPage(location.state.page);
      
      // Clear the location state to prevent re-triggering
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, navigate]);

  const fetchBooks = async () => {
    try {
      setLoading(true);
      const response = await API.get('/books');
      const booksData = Array.isArray(response.data) ? response.data : response.data.books || [];
      setBooks(booksData);
      setError(null);
    } catch (error) {
      console.error('Failed to fetch books:', error);
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
    navigate(`/read/${book.id}`);
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
    navigate(`/read/${book.id}`);
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

  const renderPageContent = () => {
    switch (currentPage) {
      case 'reading':
        return (
          <React.Suspense fallback={<div className="md3-loading-text">📖 Loading Reading Page...</div>}>
            <ReadingPage 
              books={books} 
              onBookAction={handleBookUpdate}
              readingSessions={[]}
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
          <button className="md3-button md3-button-filled" onClick={fetchBooks}>
            <span className="material-symbols-outlined">refresh</span>
            Try Again
          </button>
        </div>
      );
    }

    return (
      <>
        {/* Welcome Widget - Only show on library page */}
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

        {/* Batch Cover Processor - Only show on library page with books */}
        {currentPage === 'library' && books.length > 0 && (
          <BatchCoverProcessor onComplete={fetchBooks} />
        )}

        {currentPage === 'library' && (
          <div className="md3-library-controls">
            <div className="md3-filter-chips">
              <button 
                className={`md3-filter-chip ${filter === 'all' ? 'selected' : ''}`}
                onClick={() => setFilter('all')}
              >
                All Books ({books.length})
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
                      
                      {/* Menu Button */}
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
                            style={{
                              position: 'absolute',
                              top: '50px',
                              right: '8px',
                              minWidth: '200px',
                              backgroundColor: 'var(--md3-surface-container)',
                              borderRadius: 'var(--md3-shape-corner-large)',
                              boxShadow: 'var(--md3-elevation-3)',
                              border: '1px solid var(--md3-outline-variant)',
                              overflow: 'hidden',
                              zIndex: 110,
                              animation: 'fadeIn 0.2s ease'
                            }}
                          >
                            {/* Reading Session Controls */}
                            {activeSession?.book?.id === book.id ? (
                              <>
                                {isPaused ? (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleResumeSession();
                                    }}
                                    style={{
                                      width: '100%',
                                      padding: '12px 16px',
                                      border: 'none',
                                      backgroundColor: 'transparent',
                                      color: 'var(--md3-on-surface)',
                                      textAlign: 'left',
                                      cursor: 'pointer',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '12px',
                                      fontSize: '14px'
                                    }}
                                  >
                                    ▶️ Resume Reading
                                  </button>
                                ) : (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handlePauseSession();
                                    }}
                                    style={{
                                      width: '100%',
                                      padding: '12px 16px',
                                      border: 'none',
                                      backgroundColor: 'transparent',
                                      color: 'var(--md3-on-surface)',
                                      textAlign: 'left',
                                      cursor: 'pointer',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '12px',
                                      fontSize: '14px'
                                    }}
                                  >
                                    ⏸️ Pause Reading
                                  </button>
                                )}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEndSession();
                                  }}
                                  style={{
                                    width: '100%',
                                    padding: '12px 16px',
                                    border: 'none',
                                    backgroundColor: 'transparent',
                                    color: 'var(--md3-error)',
                                    textAlign: 'left',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    fontSize: '14px'
                                  }}
                                >
                                  ⏹️ End Session
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleStartSession(book);
                                }}
                                style={{
                                  width: '100%',
                                  padding: '12px 16px',
                                  border: 'none',
                                  backgroundColor: 'transparent',
                                  color: 'var(--md3-primary)',
                                  textAlign: 'left',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '12px',
                                  fontSize: '14px',
                                  fontWeight: '500'
                                }}
                              >
                                📖 Start Reading Session
                              </button>
                            )}
                            
                            <div style={{ height: '1px', backgroundColor: 'var(--md3-outline-variant)', margin: '8px 0' }} />
                            
                            {/* Other actions */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRead(book);
                                setOpenMenuBookId(null);
                              }}
                              style={{
                                width: '100%',
                                padding: '12px 16px',
                                border: 'none',
                                backgroundColor: 'transparent',
                                color: 'var(--md3-on-surface)',
                                textAlign: 'left',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                fontSize: '14px'
                              }}
                            >
                              📚 Open Book
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
      className={`md3-library-page ${actualTheme === 'dark' ? 'dark' : ''}`}
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

      {/* Floating Reading Timer */}
      <FloatingTimer />
    </div>
  );
};

export default LibraryPage;