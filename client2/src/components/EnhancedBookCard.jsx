import React, { useState, useMemo, useRef } from 'react';
// Import all MD3 components from the Material3 index
import { 
  MD3Card, 
  MD3Button,
  MD3Chip,
  MD3FloatingActionButton,
  MD3Dialog,
  useSnackbar
} from './Material3';
import { MD3StatusBadge } from './Material3/MD3StatusBadge';
import { BookCoverManager } from './BookCoverManager';
import { useReadingSession } from '../contexts/ReadingSessionContext';
import './EnhancedBookCard.css';


export default function EnhancedBookCard({ 
  book, 
  onOpen,
  onRead, 
  onStartReading,
  onStopReading, 
  onEdit,
  onDelete,
  onStatusChange,
  batchMode = false,
  selected = false,
  onSelect,
  view = 'grid'
}) {
  const {
    startReadingSession,
    stopReadingSession,
    pauseReadingSession,
    resumeReadingSession,
    activeSession
  } = useReadingSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButtonRef = useRef(null);

  // Debug logging to help with troubleshooting
  React.useEffect(() => {
    if (!book) {
      console.warn('EnhancedBookCard: No book prop provided');
      return;
    }
    if (!book.title) {
      console.warn('EnhancedBookCard: Book missing title:', book);
    }
    // Log book status for debugging progress bars
    console.debug('EnhancedBookCard:', book.title, {
      is_reading: book.is_reading,
      completed: book.completed,
      status: book.status,
      progress: book.progress
    });
  }, [book]);

  // Early return if no book data
  if (!book) {
    return (
      <MD3Card 
        variant="outlined" 
        style={{
          width: '100%',
          maxWidth: '280px',
          margin: '0 auto',
          minHeight: '300px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: 0.6
        }}
      >
        <div style={{ textAlign: 'center', color: 'rgb(var(--md-sys-color-on-surface-variant))' }}>
          <div style={{ fontSize: '2rem', marginBottom: '8px' }}>📚</div>
          <div>No book data</div>
        </div>
      </MD3Card>
    );
  }

  const handleCardClick = () => {
    if (batchMode) {
      onSelect?.(book);
    } else {
      // Prioritize onRead over onOpen for better user experience
      if (onRead && typeof onRead === 'function') {
        onRead(book);
      } else if (onOpen && typeof onOpen === 'function') {
        onOpen(book);
      }
    }
  };

  const handleStartReadingSession = async () => {
    try {
      setMenuOpen(false);
      if (activeSession) {
        const shouldStop = window.confirm(
          'You have an active reading session. Stop it and start a new one?'
        );
        if (!shouldStop) return;
      }
      
      const result = await startReadingSession(book);
      if (result?.success) {
        console.log(`📖 Started reading session for: ${book.title}`);
      }
    } catch (error) {
      console.error('Failed to start reading session:', error);
    }
  };

  const handleEndReadingSession = async () => {
    try {
      setMenuOpen(false);
      if (!activeSession) return;
      
      const result = await stopReadingSession();
      if (result?.success) {
        console.log(`✅ Ended reading session: ${result.duration}m, ${result.pages} pages`);
      }
    } catch (error) {
      console.error('Failed to end reading session:', error);
    }
  };

  const handlePauseResumeSession = async () => {
    try {
      setMenuOpen(false);
      if (!activeSession) return;
      
      if (activeSession.isPaused) {
        const result = await resumeReadingSession();
        if (result?.success) {
          console.log('▶️ Resumed reading session');
        }
      } else {
        const result = await pauseReadingSession();
        if (result?.success) {
          console.log('⏸️ Paused reading session');
        }
      }
    } catch (error) {
      console.error('Failed to pause/resume reading session:', error);
    }
  };

  return (
    <MD3Card
      interactive={!batchMode}
      onClick={handleCardClick}
      variant="elevated"
      role="article"
      aria-label={`${book.title} by ${book.author ?? 'Unknown Author'}`}
      className={`enhanced-book-card ${selected ? 'selected' : ''} ${view === 'list' ? 'list-view' : 'grid-view'}`}
      style={{
        width: '100%',
        maxWidth: view === 'list' ? 'none' : '280px',
        margin: '0 auto',
        cursor: batchMode ? 'default' : 'pointer',
        transition: 'all var(--md-sys-motion-duration-medium2) var(--md-sys-motion-easing-emphasized)',
        borderRadius: 'var(--md-sys-shape-corner-large)',
        overflow: 'visible',
        position: 'relative',
        border: selected ? '2px solid rgb(var(--md-sys-color-primary))' : 'none',
        boxShadow: selected ? 'var(--md-sys-elevation-level3)' : 'var(--md-sys-elevation-level1)'
      }}
    >
      {/* Book Cover Container with Enhanced Manager */}
      <div 
        style={{
          position: 'relative',
          aspectRatio: '2 / 3',
          backgroundColor: 'rgb(var(--md-sys-color-surface-container-highest))',
          overflow: 'hidden',
          borderRadius: 'var(--md-sys-shape-corner-medium) var(--md-sys-shape-corner-medium) 0 0'
        }}
      >
        <BookCoverManager 
          book={book}
          size="medium"
          className="enhanced-book-cover"
          style={{ 
            borderRadius: 'var(--md-sys-shape-corner-medium) var(--md-sys-shape-corner-medium) 0 0',
            width: '100%',
            height: '100%'
          }}
        />

        {/* Status Badge - Enhanced visibility */}
        {(book.status || book.is_reading || book.completed) && (
          <div style={{ 
            position: 'absolute', 
            top: '8px', 
            left: '8px',
            zIndex: 10
          }}>
            <MD3StatusBadge 
              status={book.is_reading ? 'reading' : (book.completed ? 'completed' : (book.status || 'unread'))}
              style={{
                backgroundColor: book.is_reading ? 'rgb(var(--md-sys-color-primary))' : 
                                book.completed ? 'rgb(var(--md-sys-color-tertiary))' : 
                                'rgb(var(--md-sys-color-secondary))',
                color: 'white',
                fontWeight: '600',
                fontSize: '0.75rem',
                padding: '4px 8px',
                borderRadius: 'var(--md-sys-shape-corner-small)',
                boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
              }}
            >
              {(book.is_reading && !book.isPaused) ? '📖 Reading' : 
               book.isPaused || book.status === 'paused' ? '⏸️ Paused' :
               book.completed ? '✅ Done' : 
               book.status === 'paused' ? '⏸️ Paused' : '📚 New'}
            </MD3StatusBadge>
          </div>
        )}
      </div>

      {/* Menu Button - Positioned outside the cover container to avoid clipping */}
      <button
          ref={menuButtonRef}
          className="book-menu-button"
          onClick={(e) => {
            e.stopPropagation();
            setMenuOpen(!menuOpen);
          }}
          aria-label="Book actions menu"
          style={{
            position: 'absolute',
            top: '4px',
            right: '4px',
            width: '80px',
            height: '40px',
            borderRadius: '8px',
            backgroundColor: '#ff0000',
            border: '4px solid #ffffff',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '18px',
            fontWeight: 'bold',
            color: 'white',
            boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            transition: 'all var(--md-sys-motion-duration-short3) var(--md-sys-motion-easing-standard)',
            zIndex: 100,
            opacity: 1,
            visibility: 'visible'
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = 'rgb(var(--md-sys-color-primary))';
            e.target.style.transform = 'scale(1.1)';
            e.target.style.boxShadow = '0 6px 16px rgba(0,0,0,0.5)';
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
            e.target.style.transform = 'scale(1)';
            e.target.style.boxShadow = '0 4px 12px rgba(0,0,0,0.4)';
          }}
        >
          MENU
        </button>

        {/* Menu Dropdown */}
        {menuOpen && (
          <>
            {/* Backdrop to close menu */}
            <div
              className="menu-backdrop"
              onClick={() => setMenuOpen(false)}
            />

            {/* Menu Items */}
            <div
              className="book-actions-menu"
              style={{
                top: `${menuButtonRef.current?.getBoundingClientRect().bottom + 10 || 60}px`,
                right: `${window.innerWidth - (menuButtonRef.current?.getBoundingClientRect().right || window.innerWidth - 8)}px`
              }}
            >
              <button
                className="book-menu-item"
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen(false);
                  onRead?.(book) || onOpen?.(book);
                }}
              >
                <span className="book-menu-item__icon">📖</span>
                Open Book
              </button>

              {/* Reading Session Controls Section */}
              {!activeSession || activeSession.book.id !== book.id ? (
                <button
                  className="book-menu-item book-menu-item--primary"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStartReadingSession();
                  }}
                >
                  <span className="book-menu-item__icon">⏱️</span>
                  Start Reading Session
                </button>
              ) : (
                <>
                  <button
                    className="book-menu-item"
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePauseResumeSession();
                    }}
                  >
                    <span className="book-menu-item__icon">{activeSession?.isPaused ? '▶️' : '⏸️'}</span>
                    {activeSession?.isPaused ? 'Resume Session' : 'Pause Session'}
                  </button>

                  <button
                    className="book-menu-item book-menu-item--error"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEndReadingSession();
                    }}
                  >
                    <span className="book-menu-item__icon">⏹️</span>
                    End Reading Session
                  </button>
                </>
              )}

              <div className="book-menu-divider" />

              <button
                className="book-menu-item"
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen(false);
                  onEdit?.(book);
                }}
              >
                <span className="book-menu-item__icon">✏️</span>
                Edit Book
              </button>

              <div className="book-menu-divider" />

              <button
                className="book-menu-item book-menu-item--error"
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen(false);
                  onDelete?.(book);
                }}
              >
                <span className="book-menu-item__icon">🗑️</span>
                Delete Book
              </button>
            </div>
          </>
        )}

        {/* Enhanced Progress Indicator */}
        {(book.is_reading || book.status === 'reading' || (book.progress && book.progress > 0)) && (
          <div
            className="book-progress-container"
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '6px',
              backgroundColor: 'rgba(var(--md-sys-color-surface-variant), 0.8)',
              borderRadius: '0 0 var(--md-sys-shape-corner-medium) var(--md-sys-shape-corner-medium)',
              overflow: 'hidden'
            }}
          >
            <div
              className="book-progress-bar"
              style={{
                height: '100%',
                width: `${Math.min(100, Math.max(0, book.progress || 0))}%`,
                backgroundColor: book.is_reading || book.status === 'reading' ? 'rgb(var(--md-sys-color-primary))' : 'rgb(var(--md-sys-color-tertiary))',
                transition: 'width var(--md-sys-motion-duration-medium2) var(--md-sys-motion-easing-standard)',
                borderRadius: '0 0 var(--md-sys-shape-corner-medium) var(--md-sys-shape-corner-medium)',
                boxShadow: book.is_reading ? 'inset 0 0 8px rgba(var(--md-sys-color-primary), 0.3)' : 'none',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              {/* Animated shine effect for active reading */}
              {(book.is_reading || book.status === 'reading') && (
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: '-100%',
                    width: '100%',
                    height: '100%',
                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
                    animation: 'md3-shimmer 2s ease-in-out infinite'
                  }}
                />
              )}
            </div>
          </div>
        )}

      {/* Book Information */}
      <div style={{ padding: 'var(--md-sys-spacing-4)' }}>
        {/* Book Title */}
        <h3
          style={{
            fontSize: 'var(--title-font-size, var(--md-sys-typescale-title-medium-font-size))',
            fontWeight: 'var(--md-sys-typescale-title-medium-font-weight)',
            lineHeight: 'var(--md-sys-typescale-title-medium-line-height)',
            letterSpacing: 'var(--md-sys-typescale-title-medium-letter-spacing)',
            color: '#1e293b',
            margin: '0 0 var(--md-sys-spacing-1) 0',
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical'
          }}
        >
          {book.title || 'Untitled Book'}
        </h3>

        {/* Author */}
        {book.author && (
          <div
            style={{
              fontSize: 'var(--body-font-size, var(--md-sys-typescale-body-medium-font-size))',
              fontWeight: 'var(--md-sys-typescale-body-medium-font-weight)',
              lineHeight: 'var(--md-sys-typescale-body-medium-line-height)',
              letterSpacing: 'var(--md-sys-typescale-body-medium-letter-spacing)',
              color: '#475569',
              margin: '0 0 var(--md-sys-spacing-2) 0',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
          >
            {book.author}
          </div>
        )}

        {/* Status and Genre Info */}
        <div 
          className="book-metadata"
          style={{
            display: 'flex',
            gap: '4px',
            flexWrap: 'nowrap',
            alignItems: 'center',
            marginTop: 'var(--md-sys-spacing-2)',
            overflow: 'hidden'
          }}
        >
          {/* Reading Status Indicator */}
          {(book.is_reading || book.status === 'reading') && (
            <MD3Chip
              label="📖"
              size="small"
              variant="filled"
              style={{
                backgroundColor: 'rgb(var(--md-sys-color-primary-container))',
                color: 'rgb(var(--md-sys-color-on-primary-container))',
                fontSize: 'var(--label-font-size, var(--md-sys-typescale-label-small-font-size))',
                fontWeight: 'var(--md-sys-typescale-label-small-font-weight)',
                padding: '2px 6px',
                minWidth: '32px'
              }}
            />
          )}
          
          {/* Completed Status */}
          {(book.completed || book.status === 'completed') && (
            <MD3Chip
              label="✅"
              size="small"
              variant="filled"
              style={{
                backgroundColor: 'rgb(var(--md-sys-color-tertiary-container))',
                color: 'rgb(var(--md-sys-color-on-tertiary-container))',
                fontSize: 'var(--label-font-size, var(--md-sys-typescale-label-small-font-size))',
                fontWeight: 'var(--md-sys-typescale-label-small-font-weight)',
                padding: '2px 6px',
                minWidth: '32px'
              }}
            />
          )}
          
          {/* Genre Chip */}
          {book.genre && (
            <MD3Chip
              label={book.genre.length > 10 ? book.genre.substring(0, 10) + '...' : book.genre}
              title={book.genre}
              size="small"
              variant="outlined"
              style={{
                fontSize: '0.6rem',
                fontWeight: '500',
                padding: '1px 4px',
                maxWidth: '90px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                lineHeight: '1.2'
              }}
            />
          )}
        </div>
      </div>
    </MD3Card>
  );
}



const EnhancedBookCardWithCollections = ({ 
  book, 
  onOpen, 
  onEdit, 
  onDelete, 
  onStartReading, 
  onStopReading, 
  onMenuAction,
  onAddToCollection,
  onRemoveFromCollection,
  collections = [],
  viewMode = 'grid',
  className = '',
  showCollectionIndicators = true,
  maxCollectionBadges = 3
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [showCollectionDialog, setShowCollectionDialog] = useState(false);
  const { showSnackbar } = useSnackbar();

  // Get collections this book belongs to
  const bookCollections = useMemo(() => {
    if (!book?.collections || !collections) return [];
    return collections.filter(collection => 
      book.collections.includes(collection.id)
    );
  }, [book?.collections, collections]);

  // Get available collections (not already containing this book)
  const availableCollections = useMemo(() => {
    if (!collections) return [];
    return collections.filter(collection => 
      !book?.collections?.includes(collection.id)
    );
  }, [book?.collections, collections]);

  const handleCardClick = (e) => {
    if (e.target.closest('.menu-button') || e.target.closest('.book-menu')) {
      return;
    }
    onOpen?.(book);
  };

  const handleMenuClick = (e) => {
    e.stopPropagation();
    setShowMenu(!showMenu);
  };

  const handleMenuAction = (action) => {
    setShowMenu(false);
    
    switch (action) {
      case 'read':
        onOpen?.(book);
        break;
      case 'start-reading':
        onStartReading?.(book);
        break;
      case 'stop-reading':
        onStopReading?.(book);
        break;
      case 'edit':
        onEdit?.(book);
        break;
      case 'delete':
        onDelete?.(book);
        break;
      case 'add-to-collection':
        setShowCollectionDialog(true);
        break;
      case 'manage-collections':
        setShowCollectionDialog(true);
        break;
      default:
        onMenuAction?.(action, book);
    }
  };

  const handleAddToCollection = (collectionId) => {
    if (book?.id) {
      onAddToCollection?.(book.id, collectionId);
    }
    setShowCollectionDialog(false);
  };

  const handleRemoveFromCollection = (collectionId) => {
    if (book?.id) {
      onRemoveFromCollection?.(book.id, collectionId);
    }
  };

  const getStatusColor = () => {
    if (book?.completed) return '#4CAF50';
    if (book?.isReading) return '#2196F3';
    return '#FF9800';
  };

  const getStatusText = () => {
    if (book?.completed) return 'Completed';
    if (book?.isReading) return 'Reading';
    return 'Unread';
  };

  return (
    <>
      <div className={`enhanced-book-card ${viewMode} ${className}`}>
        {/* Main card area */}
        <div 
          className="book-card-content"
          onClick={handleCardClick}
          style={{
            borderRadius: '12px',
            background: 'rgb(var(--md-sys-color-surface-container-low))',
            border: '1px solid rgb(var(--md-sys-color-outline-variant))',
            padding: '16px',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            position: 'relative',
            overflow: 'hidden'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.1)';
            e.currentTarget.style.transform = 'translateY(-4px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = 'none';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          {/* Book Cover with Enhanced Manager */}
          <div className="book-cover" style={{ 
            marginBottom: '12px', 
            position: 'relative',
            borderRadius: '8px',
            overflow: 'hidden',
            aspectRatio: '3/4',
            backgroundColor: '#f0f0f0'
          }}>
            <BookCoverManager 
              book={book}
              size="small"
              className="collections-book-cover"
              style={{ 
                borderRadius: '8px',
                width: '100%',
                height: '100%'
              }}
            />

            {/* Reading Status Badge */}
            <div style={{
              position: 'absolute',
              top: '8px',
              left: '8px',
              backgroundColor: getStatusColor(),
              color: 'white',
              padding: '4px 8px',
              borderRadius: '12px',
              fontSize: '10px',
              fontWeight: '600',
              textTransform: 'uppercase',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
              zIndex: 10
            }}>
              {getStatusText()}
            </div>

            {/* Reading Progress (if available) */}
            {book?.progress && book.progress > 0 && (
              <div style={{
                position: 'absolute',
                bottom: '0',
                left: '0',
                right: '0',
                height: '4px',
                backgroundColor: 'rgba(0,0,0,0.1)'
              }}>
                <div style={{
                  height: '100%',
                  width: `${book?.progress || 0}%`,
                  backgroundColor: '#4CAF50',
                  transition: 'width 0.3s ease'
                }} />
              </div>
            )}

            {/* Quick Action Button */}
            <div style={{
              position: 'absolute',
              bottom: '8px',
              right: '8px'
            }}>
              <MD3FloatingActionButton
                size="small"
                icon={book?.isReading ? '⏸️' : '▶️'}
                onClick={(e) => {
                  e.stopPropagation();
                  book?.isReading ? onStopReading?.(book) : onStartReading?.(book);
                }}
                style={{
                  backgroundColor: book?.isReading ? '#FF5722' : '#4CAF50',
                  width: '32px',
                  height: '32px'
                }}
              />
            </div>
          </div>

          {/* Book Information */}
          <div className="book-info">
            <h3 style={{
              margin: '0 0 4px 0',
              fontSize: '1rem',
              fontWeight: '600',
              color: '#1e293b',
              lineHeight: '1.2',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              {book?.title || 'Untitled Book'}
            </h3>
            
            <p style={{
              margin: '0 0 8px 0',
              fontSize: '0.875rem',
              color: '#475569',
              fontWeight: '500',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              {book?.author || 'Unknown Author'}
            </p>

            {/* Genre Chip */}
            {book?.genre && (
              <MD3Chip
                label={book?.genre || 'Fiction'}
                size="small"
                style={{
                  marginBottom: '8px',
                  backgroundColor: 'rgb(var(--md-sys-color-secondary-container))',
                  color: 'rgb(var(--md-sys-color-on-secondary-container))'
                }}
              />
            )}

            {/* Collection Badges */}
            {showCollectionIndicators && bookCollections.length > 0 && (
              <div style={{
                display: 'flex',
                gap: '4px',
                flexWrap: 'wrap',
                marginTop: '8px'
              }}>
                {bookCollections.slice(0, maxCollectionBadges).map(collection => (
                  <div
                    key={collection.id}
                    className="collection-badge"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '4px 8px',
                      backgroundColor: `${collection.color}20`,
                      border: `1px solid ${collection.color}40`,
                      borderRadius: '12px',
                      fontSize: '10px',
                      fontWeight: '500',
                      color: collection.color,
                      cursor: 'pointer'
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      // Could navigate to collection view
                    }}
                    title={`In collection: ${collection.name}`}
                  >
                    <span>{collection.icon}</span>
                    <span>{collection.name}</span>
                    {/* Remove from collection button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveFromCollection(collection.id);
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: collection.color,
                        cursor: 'pointer',
                        padding: '0',
                        marginLeft: '2px',
                        fontSize: '8px',
                        opacity: 0.7
                      }}
                      title="Remove from collection"
                    >
                      ✕
                    </button>
                  </div>
                ))}
                
                {bookCollections.length > maxCollectionBadges && (
                  <div
                    style={{
                      padding: '4px 8px',
                      backgroundColor: 'rgb(var(--md-sys-color-surface-variant))',
                      borderRadius: '12px',
                      fontSize: '10px',
                      fontWeight: '500',
                      color: 'rgb(var(--md-sys-color-on-surface-variant))',
                      cursor: 'pointer'
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowCollectionDialog(true);
                    }}
                  >
                    +{bookCollections.length - maxCollectionBadges}
                  </div>
                )}
              </div>
            )}

            {/* Quick Collection Add Button */}
            {availableCollections.length > 0 && (
              <MD3Button
                variant="text"
                size="small"
                icon="📁"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowCollectionDialog(true);
                }}
                style={{
                  marginTop: '8px',
                  fontSize: '12px',
                  padding: '4px 8px',
                  minHeight: 'auto'
                }}
              >
                Add to Collection
              </MD3Button>
            )}
          </div>

          {/* Menu Button */}
          <button
            className="menu-button"
            onClick={handleMenuClick}
            style={{
              position: 'absolute',
              top: '8px',
              right: '8px',
              background: 'rgba(0,0,0,0.6)',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'white',
              fontSize: '16px',
              opacity: 0.8,
              transition: 'opacity 0.2s ease'
            }}
            onMouseEnter={(e) => e.target.style.opacity = '1'}
            onMouseLeave={(e) => e.target.style.opacity = '0.8'}
          >
            ⋮
          </button>
        </div>

        {/* Context Menu */}
        {showMenu && (
          <div
            className="book-menu"
            style={{
              position: 'absolute',
              right: '8px',
              top: '48px',
              backgroundColor: 'white',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              border: '1px solid rgb(var(--md-sys-color-outline-variant))',
              zIndex: 1000,
              minWidth: '160px',
              overflow: 'hidden'
            }}
          >
            <button
              onClick={() => handleMenuAction('read')}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: 'none',
                backgroundColor: 'rgb(var(--md-sys-color-surface-container))',
                textAlign: 'left',
                cursor: 'pointer',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              📖 Open Book
            </button>
            
            <button
              onClick={() => handleMenuAction(book?.isReading ? 'stop-reading' : 'start-reading')}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: 'none',
                backgroundColor: 'rgb(var(--md-sys-color-surface-container))',
                textAlign: 'left',
                cursor: 'pointer',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              {book?.isReading ? '⏸️ Pause Reading' : '▶️ Start Reading'}
            </button>

            <hr style={{ margin: '4px 0', border: 'none', borderTop: '1px solid rgb(var(--md-sys-color-outline-variant))' }} />
            
            <button
              onClick={() => handleMenuAction('manage-collections')}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: 'none',
                backgroundColor: 'rgb(var(--md-sys-color-surface-container))',
                textAlign: 'left',
                cursor: 'pointer',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              📁 Manage Collections
            </button>
            
            <button
              onClick={() => handleMenuAction('edit')}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: 'none',
                backgroundColor: 'rgb(var(--md-sys-color-surface-container))',
                textAlign: 'left',
                cursor: 'pointer',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              ✏️ Edit Book
            </button>
            
            <hr style={{ margin: '4px 0', border: 'none', borderTop: '1px solid rgb(var(--md-sys-color-outline-variant))' }} />
            
            <button
              onClick={() => handleMenuAction('delete')}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: 'none',
                backgroundColor: 'rgb(var(--md-sys-color-surface-container))',
                textAlign: 'left',
                cursor: 'pointer',
                fontSize: '14px',
                color: '#f44336',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              🗑️ Delete Book
            </button>
          </div>
        )}

        {/* Click outside menu to close */}
        {showMenu && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 999
            }}
            onClick={() => setShowMenu(false)}
          />
        )}
      </div>

      {/* Collection Management Dialog */}
      <MD3Dialog
        open={showCollectionDialog}
        onClose={() => setShowCollectionDialog(false)}
        title="Manage Collections"
        maxWidth="sm"
      >
        <div style={{ padding: '20px' }}>
          <h4 style={{ margin: '0 0 12px 0', fontSize: '1rem', fontWeight: '600' }}>
            Current Collections
          </h4>
          
          {bookCollections.length > 0 ? (
            <div style={{ marginBottom: '20px' }}>
              {bookCollections.map(collection => (
                <div
                  key={collection.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    backgroundColor: `${collection.color}15`,
                    border: `1px solid ${collection.color}30`,
                    borderRadius: '8px',
                    marginBottom: '8px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>{collection.icon}</span>
                    <span>{collection.name}</span>
                  </div>
                  <MD3Button
                    variant="text"
                    size="small"
                    onClick={() => handleRemoveFromCollection(collection.id)}
                    style={{ color: '#f44336' }}
                  >
                    Remove
                  </MD3Button>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ margin: '0 0 20px 0', color: 'rgb(var(--md-sys-color-on-surface-variant))' }}>
              This book isn't in any collections yet.
            </p>
          )}

          <h4 style={{ margin: '0 0 12px 0', fontSize: '1rem', fontWeight: '600' }}>
            Add to Collection
          </h4>
          
          {availableCollections.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {availableCollections.map(collection => (
                <MD3Button
                  key={collection.id}
                  variant="outlined"
                  onClick={() => handleAddToCollection(collection.id)}
                  style={{
                    justifyContent: 'flex-start',
                    borderColor: collection.color,
                    color: collection.color
                  }}
                  icon={collection.icon}
                >
                  {collection.name}
                </MD3Button>
              ))}
            </div>
          ) : (
            <p style={{ margin: 0, color: 'rgb(var(--md-sys-color-on-surface-variant))' }}>
              This book is already in all available collections.
            </p>
          )}
        </div>
      </MD3Dialog>
    </>
  );
};

export { EnhancedBookCardWithCollections };