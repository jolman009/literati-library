// src/components/BookCarousel/BookCarousel.jsx
import React from 'react';
import './BookCarousel.css';

/**
 * BookCarousel Component (Simplified to Scrollable Grid)
 *
 * A simple, efficient vertical scrollable grid that displays books
 * with full visibility and easy drag-and-drop functionality.
 *
 * Features:
 * - Multiple books visible at once (3-4 columns)
 * - Vertical scrolling for easy browsing
 * - Clear visibility of each book cover
 * - Drag-and-drop support maintained
 * - Compact design with hover effects
 * - Material 3 design system integration
 *
 * @param {Array} books - Array of book objects to display
 * @param {Function} onDragStart - Callback when dragging starts
 * @param {String} title - Optional title for the grid
 * @param {String} subtitle - Optional subtitle for the grid
 */
const BookCarousel = ({
  books = [],
  onDragStart,
  title = '📚 Select Books',
  subtitle = 'Drag books to collections'
}) => {
  return (
    <div className="book-carousel-container">
      <div className="book-carousel-header">
        <h3 className="book-carousel-title">{title}</h3>
        <p className="book-carousel-subtitle">{subtitle}</p>
      </div>

      {books.length > 0 ? (
        <div className="book-grid-scrollable">
          {books.map(book => (
            <div
              key={book.id}
              draggable
              onDragStart={(e) => onDragStart(e, book)}
              className="book-grid-item"
              title={`Drag "${book.title}" to a collection`}
            >
              {book.cover_url ? (
                <img
                  src={book.cover_url}
                  alt={book.title}
                  className="book-grid-cover"
                  draggable={false}
                />
              ) : (
                <div className="book-grid-placeholder">
                  <span className="book-grid-placeholder-text">
                    {book.title.slice(0, 15)}
                  </span>
                </div>
              )}

              {/* Book title tooltip on hover */}
              <div className="book-grid-overlay">
                <p className="book-grid-title">
                  {book.title}
                </p>
                {book.author && (
                  <p className="book-grid-author">
                    {book.author}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="book-carousel-empty">
          <div className="book-carousel-empty-icon">📚</div>
          <p className="book-carousel-empty-text">No books available</p>
        </div>
      )}
    </div>
  );
};

export default BookCarousel;
