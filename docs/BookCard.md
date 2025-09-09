// src/components/BookCard.jsx
import React, { useState, useCallback } from 'react';
import { MD3Button, MD3Chip, MD3Dialog } from './Material3';
// Safe snackbar hook with fallback
const useSafeSnackbar = () => {
  try {
    const { useSnackbar } = require('./Material3');
    return useSnackbar();
  } catch (error) {
    console.warn('useSnackbar not available, using fallback');
    return {
      showSnackbar: (options) => {
        console.log('Snackbar would show:', options.message);
        // Simple alert fallback for now
        if (options.variant === 'error') {
          alert('Error: ' + options.message);
        } else {
          console.log(options.message);
        }
      }
    };
  }
};

const BookCard = ({ 
  book, 
  view = 'grid', // 'grid' or 'list'
  onRead,
  onEdit, 
  onDelete,
  onStatusChange,
  batchMode = false,
  selected = false,
  onSelect,
  className = ''
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [findingCover, setFindingCover] = useState(false);
  const { showSnackbar } = useSafeSnackbar();

  // Helper functions
  const getBookStatus = useCallback(() => {
    if (book.is_reading) return 'Reading';
    if (book.completed) return 'Completed';
    return 'To Read';
  }, [book.is_reading, book.completed]);

  const getStatusColor = useCallback(() => {
    if (book.is_reading) return 'primary';
    if (book.completed) return 'tertiary';
    return 'secondary';
  }, [book.is_reading, book.completed]);

  // Event handlers
  const handleCardClick = useCallback((e) => {
    e.preventDefault();
    if (batchMode) {
      onSelect?.(book);
    } else {
      onRead?.(book);
    }
  }, [batchMode, book, onRead, onSelect]);

  const handleMenuClick = useCallback((e) => {
    e.stopPropagation();
    setMenuOpen(!menuOpen);
  }, [menuOpen]);

  const handleStartReading = useCallback(() => {
    const updatedBook = { ...book, is_reading: true, completed: false };
    onStatusChange?.(updatedBook);
    setMenuOpen(false);
    showSnackbar({
      message: `Started reading "${book.title}"`,
      variant: 'success'
    });
  }, [book, onStatusChange, showSnackbar]);

  const handleCompleteBook = useCallback(() => {
    const updatedBook = { ...book, is_reading: false, completed: true };
    onStatusChange?.(updatedBook);
    setMenuOpen(false);
    showSnackbar({
      message: `Completed "${book.title}"!`,
      variant: 'success'
    });
  }, [book, onStatusChange, showSnackbar]);

  const handleStopReading = useCallback(() => {
    const updatedBook = { ...book, is_reading: false, completed: false };
    onStatusChange?.(updatedBook);
    setMenuOpen(false);
    showSnackbar({
      message: `Paused reading "${book.title}"`,
      variant: 'info'
    });
  }, [book, onStatusChange, showSnackbar]);

  const handleDelete = useCallback(() => {
    setDeleteDialogOpen(false);
    setMenuOpen(false);
    onDelete?.(book);
  }, [book, onDelete]);

  const handleView = useCallback((e) => {
    e.stopPropagation();
    if (book.file_url) {
      // Open the book file in a new tab
      window.open(book.file_url, '_blank');
      showSnackbar({
        message: `Opening "${book.title}"`,
        variant: 'info'
      });
    } else {
      showSnackbar({
        message: 'No file available for this book',
        variant: 'warning'
      });
    }
    setMenuOpen(false);
  }, [book, showSnackbar]);

  const handleDownload = useCallback((e) => {
    e.stopPropagation();
    if (book.file_url) {
      // Create a temporary anchor element to trigger download
      const link = document.createElement('a');
      link.href = book.file_url;
      link.download = book.filename || `${book.title}.${book.file_type?.split('/')[1] || 'pdf'}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      showSnackbar({
        message: `Downloading "${book.title}"`,
        variant: 'success'
      });
    } else {
      showSnackbar({
        message: 'No file available for download',
        variant: 'warning'
      });
    }
    setMenuOpen(false);
  }, [book, showSnackbar]);

  const handleFindCover = useCallback(async (e) => {
    e.stopPropagation();
    setFindingCover(true);
    
    try {
      // Simple Google Books API call to find cover
      const query = `intitle:${book.title}+inauthor:${book.author || ''}`;
      const response = await fetch(
        `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=1`
      );
      const data = await response.json();
      
      if (data.items && data.items.length > 0) {
        const foundBook = data.items[0];
        const coverUrl = foundBook.volumeInfo.imageLinks?.thumbnail?.replace('http:', 'https:');
        
        if (coverUrl) {
          const updatedBook = { ...book, cover_url: coverUrl };
          onStatusChange?.(updatedBook);
          showSnackbar({
            message: 'Cover found and updated!',
            variant: 'success'
          });
        } else {
          showSnackbar({
            message: 'No cover found for this book',
            variant: 'info'
          });
        }
      } else {
        showSnackbar({
          message: 'No cover found for this book',
          variant: 'info'
        });
      }
    } catch (error) {
      console.error('Error finding cover:', error);
      showSnackbar({
        message: 'Error finding cover',
        variant: 'error'
      });
    } finally {
      setFindingCover(false);
    }
  }, [book, onStatusChange, showSnackbar]);

  // Grid view (default)
  if (view === 'grid') {
    return (
      <div className={`book-card book-card--grid ${selected ? 'book-card--selected' : ''} ${className}`}>
        {/* Batch mode checkbox */}
        {batchMode && (
          <div className="book-card__batch-select">
            <input
              type="checkbox"
              checked={selected}
              onChange={() => onSelect?.(book)}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}

        {/* Main card content */}
        <div className="book-card__content" onClick={handleCardClick}>
          {/* Book cover section */}
          <div className="book-card__cover">
            {book.cover_url ? (
              <img 
                src={book.cover_url} 
                alt={`${book.title} cover`}
                className="book-card__cover-image"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
            ) : null}
            
            {/* Fallback cover */}
            <div 
              className="book-card__cover-fallback"
              style={{ display: book.cover_url ? 'none' : 'flex' }}
            >
              <span className="book-card__cover-icon">📚</span>
              <span className="book-card__cover-title">
                {book.title?.substring(0, 20)}
                {book.title?.length > 20 ? '...' : ''}
              </span>
            </div>

            {/* Status badge */}
            <div className="book-card__status-badge">
              <MD3Chip 
                size="small" 
                variant="filled"
                color={getStatusColor()}
              >
                {getBookStatus()}
              </MD3Chip>
            </div>

            {/* Find cover button */}
            {!book.cover_url && (
              <button
                className="book-card__find-cover"
                onClick={handleFindCover}
                disabled={findingCover}
                title="Find book cover"
              >
                {findingCover ? '⟳' : '🎨'}
              </button>
            )}

            {/* Menu button */}
            <button 
              className="book-card__menu"
              onClick={handleMenuClick}
              title="Book options"
            >
              ⋮
            </button>
          </div>

          {/* Book info */}
          <div className="book-card__info">
            <h3 className="book-card__title" title={book.title}>
              {book.title}
            </h3>
            <p className="book-card__author" title={book.author}>
              {book.author || 'Unknown Author'}
            </p>
            
            {/* Reading progress */}
            {book.is_reading && book.progress !== undefined && (
              <div className="book-card__progress">
                <div className="book-card__progress-bar">
                  <div 
                    className="book-card__progress-fill"
                    style={{ width: `${book.progress}%` }}
                  />
                </div>
                <span className="book-card__progress-text">
                  {book.progress}% complete
                </span>
              </div>
            )}

            {/* Metadata */}
            <div className="book-card__metadata">
              {book.genre && (
                <MD3Chip size="small" variant="outlined">
                  {book.genre}
                </MD3Chip>
              )}
              {book.year && (
                <span className="book-card__year">{book.year}</span>
              )}
            </div>
          </div>
        </div>

        {/* Context menu */}
        {menuOpen && (
          <div className="book-card__menu-overlay" onClick={() => setMenuOpen(false)}>
            <div className="book-card__menu-content" onClick={(e) => e.stopPropagation()}>
              <MD3Button
                variant="text"
                onClick={() => {
                  onRead?.(book);
                  setMenuOpen(false);
                }}
                fullWidth
              >
                📖 Read
              </MD3Button>

              {book.file_url && (
                <>
                  <MD3Button
                    variant="text"
                    onClick={handleView}
                    fullWidth
                  >
                    👁️ View File
                  </MD3Button>
                  
                  <MD3Button
                    variant="text"
                    onClick={handleDownload}
                    fullWidth
                  >
                    ⬇️ Download
                  </MD3Button>
                </>
              )}
              
              {!book.is_reading && !book.completed && (
                <MD3Button
                  variant="text"
                  onClick={handleStartReading}
                  fullWidth
                >
                  ▶️ Start Reading
                </MD3Button>
              )}
              
              {book.is_reading && (
                <>
                  <MD3Button
                    variant="text"
                    onClick={handleCompleteBook}
                    fullWidth
                  >
                    ✅ Mark Complete
                  </MD3Button>
                  <MD3Button
                    variant="text"
                    onClick={handleStopReading}
                    fullWidth
                  >
                    ⏸️ Stop Reading
                  </MD3Button>
                </>
              )}
              
              <MD3Button
                variant="text"
                onClick={() => {
                  onEdit?.(book);
                  setMenuOpen(false);
                }}
                fullWidth
              >
                ✏️ Edit
              </MD3Button>
              
              <MD3Button
                variant="text"
                onClick={() => setDeleteDialogOpen(true)}
                fullWidth
                style={{ color: 'rgb(var(--md-sys-color-error))' }}
              >
                🗑️ Delete
              </MD3Button>
            </div>
          </div>
        )}

        {/* Delete confirmation dialog */}
        <MD3Dialog
          open={deleteDialogOpen}
          onClose={() => setDeleteDialogOpen(false)}
          title="Delete Book"
          actions={
            <>
              <MD3Button 
                variant="text" 
                onClick={() => setDeleteDialogOpen(false)}
              >
                Cancel
              </MD3Button>
              <MD3Button 
                variant="filled" 
                onClick={handleDelete}
                style={{ 
                  background: 'rgb(var(--md-sys-color-error))',
                  color: 'rgb(var(--md-sys-color-on-error))'
                }}
              >
                Delete
              </MD3Button>
            </>
          }
        >
          <p>Are you sure you want to delete "{book.title}"? This action cannot be undone.</p>
        </MD3Dialog>
      </div>
    );
  }

  // List view
  return (
    <div className={`book-card book-card--list ${selected ? 'book-card--selected' : ''} ${className}`}>
      {/* Batch mode checkbox */}
      {batchMode && (
        <div className="book-card__batch-select">
          <input
            type="checkbox"
            checked={selected}
            onChange={() => onSelect?.(book)}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* Main card content */}
      <div className="book-card__content" onClick={handleCardClick}>
        {/* Book cover - smaller in list view */}
        <div className="book-card__cover book-card__cover--list">
          {book.cover_url ? (
            <img 
              src={book.cover_url} 
              alt={`${book.title} cover`}
              className="book-card__cover-image"
            />
          ) : (
            <div className="book-card__cover-fallback">
              <span className="book-card__cover-icon">📚</span>
            </div>
          )}
        </div>

        {/* Book info - expanded in list view */}
        <div className="book-card__info book-card__info--list">
          <div className="book-card__main-info">
            <h3 className="book-card__title">{book.title}</h3>
            <p className="book-card__author">{book.author || 'Unknown Author'}</p>
            
            <div className="book-card__metadata">
              <MD3Chip size="small" variant="filled" color={getStatusColor()}>
                {getBookStatus()}
              </MD3Chip>
              {book.genre && (
                <MD3Chip size="small" variant="outlined">
                  {book.genre}
                </MD3Chip>
              )}
              {book.year && (
                <span className="book-card__year">{book.year}</span>
              )}
            </div>
          </div>

          {/* Progress in list view */}
          {book.is_reading && book.progress !== undefined && (
            <div className="book-card__progress">
              <div className="book-card__progress-bar">
                <div 
                  className="book-card__progress-fill"
                  style={{ width: `${book.progress}%` }}
                />
              </div>
              <span className="book-card__progress-text">
                {book.progress}% complete
              </span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="book-card__actions">
          <MD3Button variant="outlined" size="small" onClick={(e) => {
            e.stopPropagation();
            onRead?.(book);
          }}>
            Read
          </MD3Button>
          <button 
            className="book-card__menu"
            onClick={handleMenuClick}
            title="More options"
          >
            ⋮
          </button>
        </div>
      </div>

      {/* Same context menu and delete dialog as grid view */}
      {menuOpen && (
        <div className="book-card__menu-overlay" onClick={() => setMenuOpen(false)}>
          <div className="book-card__menu-content" onClick={(e) => e.stopPropagation()}>
            <MD3Button variant="text" onClick={() => { onRead?.(book); setMenuOpen(false); }} fullWidth>
              📖 Read
            </MD3Button>
            {!book.is_reading && !book.completed && (
              <MD3Button variant="text" onClick={handleStartReading} fullWidth>
                ▶️ Start Reading
              </MD3Button>
            )}
            {book.is_reading && (
              <>
                <MD3Button variant="text" onClick={handleCompleteBook} fullWidth>
                  ✅ Mark Complete
                </MD3Button>
                <MD3Button variant="text" onClick={handleStopReading} fullWidth>
                  ⏸️ Stop Reading
                </MD3Button>
              </>
            )}
            <MD3Button variant="text" onClick={() => { onEdit?.(book); setMenuOpen(false); }} fullWidth>
              ✏️ Edit
            </MD3Button>
            <MD3Button 
              variant="text" 
              onClick={() => setDeleteDialogOpen(true)} 
              fullWidth
              style={{ color: 'rgb(var(--md-sys-color-error))' }}
            >
              🗑️ Delete
            </MD3Button>
          </div>
        </div>
      )}

      <MD3Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        title="Delete Book"
        actions={
          <>
            <MD3Button variant="text" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </MD3Button>
            <MD3Button 
              variant="filled" 
              onClick={handleDelete}
              style={{ 
                background: 'rgb(var(--md-sys-color-error))',
                color: 'rgb(var(--md-sys-color-on-error))'
              }}
            >
              Delete
            </MD3Button>
          </>
        }
      >
        <p>Are you sure you want to delete "{book.title}"? This action cannot be undone.</p>
      </MD3Dialog>
    </div>
  );
};

export default BookCard;