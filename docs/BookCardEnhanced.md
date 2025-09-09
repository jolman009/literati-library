// src/components/BookCardEnhanced.jsx

import React, { useState, useCallback, memo } from 'react';
import { MD3Button, MD3Chip, MD3Dialog, MD3BookProgressControls } from './Material3';
import API from '../config/api';
import './BookCard.css'; // Reuse existing styles

/**
 * Enhanced BookCard with Material Design 3 progress controls
 * Integrates the new MD3BookProgressControls component
 */
const BookCardEnhanced = memo(({ 
  book, 
  view = 'grid',
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
  const [progressControlsVisible, setProgressControlsVisible] = useState(false);
  const [findingCover, setFindingCover] = useState(false);
  const [updating, setUpdating] = useState(false);

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

  // Handle progress update using the API
  const handleProgressUpdate = useCallback(async (bookData, newProgress) => {
    if (updating) return;

    setUpdating(true);
    try {
      // Update progress and reading status
      const updates = {
        progress: newProgress,
        is_reading: newProgress > 0 && newProgress < 100,
        completed: newProgress === 100,
        completed_date: newProgress === 100 ? new Date().toISOString() : null,
        last_opened: new Date().toISOString()
      };

      const response = await API.patch(`/books/${book.id}`, updates);
      
      if (response.data) {
        // Update the book in parent component
        onStatusChange?.(response.data);
        
        // Show success message
        console.log(`Progress updated to ${newProgress}% for "${book.title}"`);
        
        // Auto-hide progress controls after successful update
        setTimeout(() => {
          setProgressControlsVisible(false);
        }, 1000);
      }
    } catch (error) {
      console.error('Failed to update book progress:', error);
      throw error; // Re-throw to let the progress controls handle the error
    } finally {
      setUpdating(false);
    }
  }, [book.id, book.title, onStatusChange, updating]);

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
  }, [book, onStatusChange]);

  const handleCompleteBook = useCallback(() => {
    const updatedBook = { ...book, is_reading: false, completed: true, progress: 100 };
    onStatusChange?.(updatedBook);
    setMenuOpen(false);
  }, [book, onStatusChange]);

  const handleStopReading = useCallback(() => {
    const updatedBook = { ...book, is_reading: false, completed: false };
    onStatusChange?.(updatedBook);
    setMenuOpen(false);
  }, [book, onStatusChange]);

  const handleDelete = useCallback(() => {
    setDeleteDialogOpen(false);
    setMenuOpen(false);
    onDelete?.(book);
  }, [book, onDelete]);

  const handleFindCover = useCallback(async (e) => {
    e.stopPropagation();
    setFindingCover(true);
    
    try {
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
        }
      }
    } catch (error) {
      console.error('Error finding cover:', error);
    } finally {
      setFindingCover(false);
    }
  }, [book, onStatusChange]);

  const handleToggleProgressControls = useCallback((e) => {
    e.stopPropagation();
    setProgressControlsVisible(!progressControlsVisible);
    setMenuOpen(false);
  }, [progressControlsVisible]);

  const containerClasses = [
    'book-card',
    `book-card--${view}`,
    selected && 'book-card--selected',
    progressControlsVisible && 'book-card--progress-expanded',
    className
  ].filter(Boolean).join(' ');

  // Grid view with enhanced progress controls
  if (view === 'grid') {
    return (
      <div className={containerClasses}>
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
            
            {/* Basic Progress Display */}
            {book.is_reading && book.progress !== undefined && !progressControlsVisible && (
              <div className="book-card__progress">
                <div className="book-card__progress-bar">
                  <div 
                    className="book-card__progress-fill"
                    style={{ width: `${book.progress}%` }}
                  />
                </div>
                <div className="book-card__progress-actions">
                  <span className="book-card__progress-text">
                    {book.progress}% complete
                  </span>
                  <button
                    className="book-card__progress-edit"
                    onClick={handleToggleProgressControls}
                    title="Update progress"
                  >
                    ✏️
                  </button>
                </div>
              </div>
            )}

            {/* Enhanced Progress Controls */}
            {progressControlsVisible && (
              <div className="book-card__progress-enhanced">
                <MD3BookProgressControls
                  book={book}
                  onProgressUpdate={handleProgressUpdate}
                  compact={true}
                  showLabel={false}
                />
                <div className="book-card__progress-actions">
                  <MD3Button
                    variant="text"
                    size="small"
                    onClick={handleToggleProgressControls}
                  >
                    Close
                  </MD3Button>
                </div>
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

              {/* Progress update menu item */}
              {(book.is_reading || book.progress > 0) && (
                <MD3Button
                  variant="text"
                  onClick={handleToggleProgressControls}
                  fullWidth
                >
                  📊 Update Progress
                </MD3Button>
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

  // List view implementation (similar structure but adapted for horizontal layout)
  return (
    <div className={containerClasses}>
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
          {!progressControlsVisible && book.is_reading && book.progress !== undefined && (
            <div className="book-card__progress">
              <div className="book-card__progress-bar">
                <div 
                  className="book-card__progress-fill"
                  style={{ width: `${book.progress}%` }}
                />
              </div>
              <div className="book-card__progress-actions">
                <span className="book-card__progress-text">
                  {book.progress}% complete
                </span>
                <button
                  className="book-card__progress-edit"
                  onClick={handleToggleProgressControls}
                  title="Update progress"
                >
                  ✏️
                </button>
              </div>
            </div>
          )}

          {/* Enhanced Progress Controls for List View */}
          {progressControlsVisible && (
            <div className="book-card__progress-enhanced book-card__progress-enhanced--list">
              <MD3BookProgressControls
                book={book}
                onProgressUpdate={handleProgressUpdate}
                compact={true}
                showLabel={true}
              />
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="book-card__actions">
          {progressControlsVisible && (
            <MD3Button variant="text" size="small" onClick={handleToggleProgressControls}>
              Close
            </MD3Button>
          )}
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
            
            {(book.is_reading || book.progress > 0) && (
              <MD3Button
                variant="text"
                onClick={handleToggleProgressControls}
                fullWidth
              >
                📊 Update Progress
              </MD3Button>
            )}
            
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
});

BookCardEnhanced.displayName = 'BookCardEnhanced';

export default BookCardEnhanced;