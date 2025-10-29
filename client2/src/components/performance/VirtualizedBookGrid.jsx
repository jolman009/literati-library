import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Grid } from 'react-window';
import { LazyBookCover } from './LazyImage';
import './VirtualizedBookGrid.css';
import '../EnhancedBookCard.css';
import { getBookStatus } from '../BookStatus';
import { applyStatus, BOOK_STATUS } from '../../utils/bookStatus';

const VirtualizedBookGrid = ({
  books = [],
  onBookClick,
  onBookMenuClick,
  highlightedBookId,
  openMenuBookId,
  activeSession,
  isPaused,
  onResumeSession,
  onPauseSession,
  onEndSession,
  onStatusChange,
  onEditBook,
  onDeleteBook,
  viewMode = 'grid',
  className = ''
}) => {
  const containerRef = useRef(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  // Responsive grid configuration
  const gridConfig = useMemo(() => {
    const { width } = containerSize;

    if (viewMode === 'list') {
      return {
        itemWidth: width,
        itemHeight: 120,
        columnCount: 1,
        itemsPerRow: 1
      };
    }

    // Grid mode - responsive columns
    let itemWidth = 200;
    let gap = 16;

    if (width < 600) {
      itemWidth = 150;
      gap = 12;
    } else if (width < 900) {
      itemWidth = 180;
      gap = 14;
    }

    const columnCount = Math.floor((width + gap) / (itemWidth + gap)) || 1;
    const actualItemWidth = (width - (gap * (columnCount - 1))) / columnCount;

    return {
      itemWidth: actualItemWidth,
      itemHeight: viewMode === 'compact' ? 280 : 320,
      columnCount,
      itemsPerRow: columnCount
    };
  }, [containerSize.width, viewMode]);

  // Calculate grid dimensions with safety checks
  const { itemWidth, itemHeight, columnCount } = gridConfig || {};
  const safeColumnCount = Number.isFinite(columnCount) && columnCount > 0 ? columnCount : 1;
  const safeItemWidth = Number.isFinite(itemWidth) && itemWidth > 0 ? itemWidth : 200;
  const safeItemHeight = Number.isFinite(itemHeight) && itemHeight > 0 ? itemHeight : 320;
  const rowCount = Math.ceil((Array.isArray(books) ? books.length : 0) / safeColumnCount);

  // Resize observer to track container size
  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setContainerSize({ width, height });
      }
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // Virtual grid item renderer
  const GridItem = useCallback(({ columnIndex, rowIndex, style }) => {
    const bookIndex = rowIndex * columnCount + columnIndex;
    const book = books[bookIndex];

    if (!book) {
      return <div style={style} />; // Empty cell
    }

    const isHighlighted = highlightedBookId === book.id;
    const hasActiveSession = activeSession?.book?.id === book.id;
    const status = getBookStatus(book);

    const handleCardKeyDown = (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onBookClick && onBookClick(book);
      } else if (e.key === 'Escape' && openMenuBookId === book.id) {
        onBookMenuClick && onBookMenuClick(null);
      }
    };

    return (
      <div
        style={{
          ...style,
          padding: '8px',
          boxSizing: 'border-box'
        }}
      >
        <div
          className={`virtualized-book-card ${isHighlighted ? 'highlighted' : ''} ${viewMode}`}
          data-book-id={book.id}
          role="button"
          tabIndex={0}
          aria-label={`Open ${book.title}`}
          onKeyDown={handleCardKeyDown}
          onClick={() => onBookClick(book)}
        >
          <div className="book-cover-container">
            <LazyBookCover
              book={book}
              size={viewMode === 'compact' ? 'small' : 'medium'}
              onClick={() => onBookClick(book)}
              className="virtualized-book-cover"
            />

            {/* Status badges */}
            {book.is_reading && (
              <div className="book-badge reading">
                <span className="material-symbols-outlined">play_arrow</span>
              </div>
            )}
            {book.completed && (
              <div className="book-badge completed">
                <span className="material-symbols-outlined">check_circle</span>
              </div>
            )}

            {/* Quick action buttons when status is reading */}
            {status === 'reading' && (
              <div style={{ position: 'absolute', left: 8, bottom: 8, display: 'flex', gap: 8, zIndex: 3 }}>
                {/* Red Stop */}
                <button
                  title="Stop reading session"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (hasActiveSession) {
                      onEndSession && onEndSession();
                    } else if (onStatusChange) {
                      // Return to normal state (unread)
                      onStatusChange(applyStatus(book, BOOK_STATUS.UNREAD));
                    }
                  }}
                  style={{ backgroundColor: '#ef4444', color: '#fff' }}
                >
                  <span className="material-symbols-outlined">stop</span>
                </button>
                {/* Mark Completed */}
                <button
                  title="Mark as completed"
                  onClick={(e) => {
                    e.stopPropagation();
                    onStatusChange && onStatusChange(applyStatus(book, BOOK_STATUS.COMPLETED));
                  }}
                  style={{ backgroundColor: '#22c55e', color: '#fff' }}
                >
                  <span className="material-symbols-outlined">check</span>
                </button>
              </div>
            )}

            {/* Action button: if active session, show red Stop; else open menu */}
            {hasActiveSession ? (
              <button
                className="book-menu-button"
                style={{ backgroundColor: '#ef4444', color: '#fff' }}
                title="End reading session"
                onClick={(e) => { e.stopPropagation(); onEndSession && onEndSession(); }}
              >
                <span className="material-symbols-outlined">stop</span>
              </button>
            ) : (
              <button
                className="book-menu-button"
                onClick={(e) => { e.stopPropagation(); onBookMenuClick && onBookMenuClick(book.id); }}
                title="More actions"
                aria-haspopup="menu"
                aria-expanded={openMenuBookId === book.id}
              >
                <span className="material-symbols-outlined">more_horiz</span>
              </button>
            )}

            {/* Menu dropdown */}
            {openMenuBookId === book.id && (
              <>
                <div
                  className="menu-backdrop"
                  onClick={() => onBookMenuClick(null)}
                />

                <div
                  className="book-actions-menu"
                  role="menu"
                  aria-label={`Actions for ${book.title}`}
                  onKeyDown={(e) => { if (e.key === 'Escape') { e.stopPropagation(); onBookMenuClick && onBookMenuClick(null); } }}
                >
                  {hasActiveSession ? (
                    <>
                      {isPaused ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onResumeSession();
                          }}
                          className="book-menu-item"
                          role="menuitem"
                        >
                          <span className="material-symbols-outlined book-menu-item__icon">play_arrow</span>
                          Resume Reading
                        </button>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onPauseSession();
                          }}
                          className="book-menu-item"
                          role="menuitem"
                        >
                          <span className="material-symbols-outlined book-menu-item__icon">pause</span>
                          Pause Reading
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onEndSession();
                        }}
                        className="book-menu-item book-menu-item--error"
                        role="menuitem"
                      >
                        <span className="material-symbols-outlined book-menu-item__icon">stop</span>
                        End Session
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onBookClick(book);
                      }}
                      className="book-menu-item book-menu-item--primary"
                      role="menuitem"
                    >
                      <span className="material-symbols-outlined book-menu-item__icon">menu_book</span>
                      Start Reading
                    </button>
                  )}

                  <div className="book-menu-divider" />

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onStatusChange && onStatusChange(applyStatus(book, BOOK_STATUS.COMPLETED));
                    }}
                    className="book-menu-item"
                    role="menuitem"
                  >
                    <span className="material-symbols-outlined book-menu-item__icon">check_circle</span>
                    Mark as Completed
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onStatusChange && onStatusChange(applyStatus(book, BOOK_STATUS.UNREAD));
                    }}
                    className="book-menu-item"
                    role="menuitem"
                  >
                    <span className="material-symbols-outlined book-menu-item__icon">bookmark_add</span>
                    Mark as Want to Read
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditBook && onEditBook(book);
                    }}
                    className="book-menu-item"
                    role="menuitem"
                  >
                    <span className="material-symbols-outlined book-menu-item__icon">edit</span>
                    Edit Book
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onDeleteBook) onDeleteBook(book);
                    }}
                    className="book-menu-item book-menu-item--error"
                    role="menuitem"
                  >
                    <span className="material-symbols-outlined book-menu-item__icon">delete</span>
                    Delete Book
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      // Handle add to collection
                    }}
                    className="book-menu-item"
                    role="menuitem"
                  >
                    <span className="material-symbols-outlined book-menu-item__icon">collections_bookmark</span>
                    Add to Collection
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Book info */}
          <div className="book-info">
            <h3 className="book-title">{book.title}</h3>
            <p className="book-author">{book.author}</p>
            {viewMode !== 'compact' && (
              <>
                {book.progress > 0 && (
                  <div className="book-progress">
                    <div className="progress-bar">
                      <div
                        className="progress-fill"
                        style={{ width: `${book.progress}%` }}
                      />
                    </div>
                    <span className="progress-text">{book.progress}%</span>
                  </div>
                )}
                {book.genre && (
                  <span className="book-genre">{book.genre}</span>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    );
  }, [
    books,
    columnCount,
    highlightedBookId,
    openMenuBookId,
    activeSession,
    isPaused,
    viewMode,
    onBookClick,
    onBookMenuClick,
    onResumeSession,
    onPauseSession,
    onEndSession,
    onStatusChange
  ]);

  if (books.length === 0) {
    return (
      <div className="virtualized-empty-state">
        <div className="empty-state-content">
          <span className="material-symbols-outlined">menu_book</span>
          <h3>No books found</h3>
          <p>Try adjusting your filters or upload some books to get started.</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`virtualized-book-grid ${className}`}
      style={{ width: '100%', height: '100%' }}
    >
      {containerSize.width > 0 && Number.isFinite(rowCount) && rowCount >= 0 && (
        <Grid
          columnCount={safeColumnCount}
          columnWidth={safeItemWidth}
          height={containerSize.height || 600}
          rowCount={rowCount}
          rowHeight={safeItemHeight}
          width={containerSize.width}
          overscanRowCount={2}
          overscanColumnCount={1}
          className="virtual-grid"
        >
          {GridItem}
        </Grid>
      )}
    </div>
  );
};

export default VirtualizedBookGrid;
