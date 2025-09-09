// src/components/VirtualizedBookGrid.jsx
// Virtual scrolling implementation for handling 1000+ books efficiently

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { FixedSizeGrid as Grid } from 'react-window';
import EnhancedBookCard from './EnhancedBookCard';

const VirtualizedBookGrid = ({
  books = [],
  viewMode = 'grid',
  onRead,
  onStartReading,
  onStopReading,
  onEdit,
  onDelete,
  onStatusChange,
  batchMode = false,
  selectedBooks = [],
  onSelectBook,
  className = ''
}) => {
  const gridRef = useRef(null);
  const containerRef = useRef(null);
  const [dimensions, setDimensions] = useState({
    width: 0,
    height: 600,
    columnCount: 1,
    rowCount: 1
  });
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [isKeyboardNavigation, setIsKeyboardNavigation] = useState(false);

  // Book card dimensions based on view mode
  const cardDimensions = useMemo(() => {
    if (viewMode === 'list') {
      return {
        width: 1200, // Full width for list view
        height: 120,
        minWidth: 800
      };
    }
    return {
      width: 220, // Reduced card width to fit more columns
      height: 420, // Further increased height for proper gaps
      minWidth: 180,
      cardHeight: 375 // Actual card height (total height - gap)
    };
  }, [viewMode]);

  // Calculate responsive columns and rows
  const gridLayout = useMemo(() => {
    const { width } = dimensions;
    const { width: cardWidth, minWidth } = cardDimensions;
    
    if (viewMode === 'list') {
      return {
        columnCount: 1,
        rowCount: books.length,
        columnWidth: Math.max(width, minWidth),
        rowHeight: cardDimensions.height
      };
    }
    
    // Grid mode - calculate columns based on available width
    const availableWidth = width || 1200;
    // Add some padding/margin compensation and be more aggressive with column fitting
    const effectiveWidth = availableWidth - 32; // Account for container padding
    const columnsPerRow = Math.max(1, Math.floor(effectiveWidth / (cardWidth - 20))); // Reduce effective card width for tighter fit
    const adjustedColumnWidth = Math.floor(effectiveWidth / columnsPerRow); // Distribute available space evenly
    const rowCount = Math.ceil(books.length / columnsPerRow);
    
    return {
      columnCount: columnsPerRow,
      rowCount,
      columnWidth: adjustedColumnWidth,
      rowHeight: cardDimensions.height
    };
  }, [dimensions.width, books.length, viewMode, cardDimensions]);

  // Handle container resize
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDimensions(prev => ({
          ...prev,
          width: rect.width,
          height: Math.min(window.innerHeight - 200, Math.max(600, rect.height))
        }));
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    
    // Use ResizeObserver if available for more accurate tracking
    let resizeObserver;
    if (window.ResizeObserver && containerRef.current) {
      resizeObserver = new ResizeObserver(updateDimensions);
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      window.removeEventListener('resize', updateDimensions);
      if (resizeObserver) resizeObserver.disconnect();
    };
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (!isKeyboardNavigation || books.length === 0) return;

      const { columnCount } = gridLayout;
      let newIndex = focusedIndex;

      switch (event.key) {
        case 'ArrowRight':
          event.preventDefault();
          newIndex = Math.min(books.length - 1, focusedIndex + 1);
          break;
        case 'ArrowLeft':
          event.preventDefault();
          newIndex = Math.max(0, focusedIndex - 1);
          break;
        case 'ArrowDown':
          event.preventDefault();
          newIndex = Math.min(books.length - 1, focusedIndex + columnCount);
          break;
        case 'ArrowUp':
          event.preventDefault();
          newIndex = Math.max(0, focusedIndex - columnCount);
          break;
        case 'Home':
          event.preventDefault();
          newIndex = 0;
          break;
        case 'End':
          event.preventDefault();
          newIndex = books.length - 1;
          break;
        case 'PageDown':
          event.preventDefault();
          newIndex = Math.min(books.length - 1, focusedIndex + (columnCount * 3));
          break;
        case 'PageUp':
          event.preventDefault();
          newIndex = Math.max(0, focusedIndex - (columnCount * 3));
          break;
        case 'Enter':
        case ' ':
          event.preventDefault();
          if (books[focusedIndex] && onRead) {
            onRead(books[focusedIndex]);
          }
          break;
        default:
          return;
      }

      if (newIndex !== focusedIndex) {
        setFocusedIndex(newIndex);
        scrollToIndex(newIndex, 'smooth');
      }
    };

    const handleFocus = () => setIsKeyboardNavigation(true);
    const handleBlur = () => setIsKeyboardNavigation(false);
    const handleMouseMove = () => setIsKeyboardNavigation(false);

    const container = containerRef.current;
    if (container) {
      container.addEventListener('keydown', handleKeyDown);
      container.addEventListener('focus', handleFocus);
      container.addEventListener('blur', handleBlur);
      container.addEventListener('mousemove', handleMouseMove);

      return () => {
        container.removeEventListener('keydown', handleKeyDown);
        container.removeEventListener('focus', handleFocus);
        container.removeEventListener('blur', handleBlur);
        container.removeEventListener('mousemove', handleMouseMove);
      };
    }
  }, [books.length, focusedIndex, isKeyboardNavigation, gridLayout, onRead]);

  // Scroll to specific index with smooth animation
  const scrollToIndex = useCallback((index, behavior = 'auto') => {
    if (!gridRef.current || index < 0 || index >= books.length) return;

    const { columnCount } = gridLayout;
    const rowIndex = Math.floor(index / columnCount);
    const columnIndex = index % columnCount;

    if (behavior === 'smooth') {
      // Smooth scrolling implementation
      const currentScrollTop = gridRef.current._outerRef ? 
        gridRef.current._outerRef.scrollTop : 0;
      const targetScrollTop = rowIndex * gridLayout.rowHeight;
      const distance = Math.abs(targetScrollTop - currentScrollTop);

      if (distance > 0) {
        const duration = Math.min(300, distance / 2); // Max 300ms, adaptive to distance
        const startTime = performance.now();
        
        const animateScroll = (currentTime) => {
          const elapsed = currentTime - startTime;
          const progress = Math.min(elapsed / duration, 1);
          
          // Easing function for smooth animation
          const easeOutQuart = 1 - Math.pow(1 - progress, 4);
          const currentScrollPos = currentScrollTop + (targetScrollTop - currentScrollTop) * easeOutQuart;
          
          if (gridRef.current?._outerRef) {
            gridRef.current._outerRef.scrollTop = currentScrollPos;
          }
          
          if (progress < 1) {
            requestAnimationFrame(animateScroll);
          }
        };
        
        requestAnimationFrame(animateScroll);
      }
    } else {
      gridRef.current.scrollToItem({
        rowIndex,
        columnIndex,
        align: 'start'
      });
    }
  }, [books.length, gridLayout]);

  // Item renderer for react-window
  const ItemRenderer = useCallback(({ columnIndex, rowIndex, style, data }) => {
    const { books: itemBooks, columnCount } = data;
    const bookIndex = rowIndex * columnCount + columnIndex;
    const book = itemBooks[bookIndex];

    // Don't render if no book (happens at the end of the grid)
    if (!book) {
      return <div style={style} />;
    }

    const isFocused = isKeyboardNavigation && bookIndex === focusedIndex;

    return (
      <div style={style}>
        <div 
          style={{ 
            padding: '8px', // Increased padding for proper gaps
            paddingBottom: '20px', // Extra bottom padding for row gap
            outline: isFocused ? '2px solid #2563eb' : 'none',
            borderRadius: isFocused ? '8px' : '0',
            transition: 'outline 0.2s ease, box-shadow 0.2s ease',
            boxShadow: isFocused ? '0 0 0 4px rgba(37, 99, 235, 0.1)' : 'none'
          }}
        >
          <EnhancedBookCard
            key={book.id}
            book={book}
            view={viewMode === 'list' ? 'list' : 'grid'}
            onRead={onRead}
            onStartReading={onStartReading}
            onStopReading={onStopReading}
            onEdit={onEdit}
            onDelete={onDelete}
            onStatusChange={onStatusChange}
            batchMode={batchMode}
            selected={selectedBooks.includes(book.id)}
            onSelect={onSelectBook}
            style={{
              width: '100%',
              height: 'calc(100% - 20px)', // Account for bottom padding
              maxWidth: '100%',
              boxSizing: 'border-box',
              fontSize: cardDimensions.width < 200 ? '0.85rem' : '1rem', // Responsive font sizing
              '--title-font-size': cardDimensions.width < 200 ? '0.9rem' : '1.1rem',
              '--body-font-size': cardDimensions.width < 200 ? '0.75rem' : '0.875rem',
              '--label-font-size': cardDimensions.width < 200 ? '0.65rem' : '0.75rem'
            }}
          />
        </div>
      </div>
    );
  }, [
    viewMode,
    onRead,
    onStartReading,
    onStopReading,
    onEdit,
    onDelete,
    onStatusChange,
    batchMode,
    selectedBooks,
    onSelectBook,
    isKeyboardNavigation,
    focusedIndex
  ]);

  // Scroll to specific book (useful for search/navigation)
  const scrollToBook = useCallback((bookId) => {
    const bookIndex = books.findIndex(book => book.id === bookId);
    if (bookIndex === -1 || !gridRef.current) return;

    const rowIndex = Math.floor(bookIndex / gridLayout.columnCount);
    const columnIndex = bookIndex % gridLayout.columnCount;
    
    gridRef.current.scrollToItem({
      rowIndex,
      columnIndex,
      align: 'start'
    });
  }, [books, gridLayout.columnCount]);

  // Expose scroll method to parent component
  React.useImperativeHandle(gridRef, () => ({
    scrollToBook,
    scrollToTop: () => {
      if (gridRef.current) {
        gridRef.current.scrollToItem({ rowIndex: 0, columnIndex: 0 });
      }
    }
  }));

  // Loading state
  if (books.length === 0) {
    return (
      <div 
        ref={containerRef}
        className={`virtualized-book-grid empty ${className}`}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '400px',
          fontSize: '18px',
          color: '#666'
        }}
      >
        📚 No books to display
      </div>
    );
  }

  // Prepare data for the grid
  const itemData = {
    books,
    columnCount: gridLayout.columnCount
  };

  return (
    <div 
      ref={containerRef}
      className={`virtualized-book-grid ${viewMode} ${className}`}
      style={{ 
        width: '100%', 
        height: '100%',
        outline: 'none' // Remove default focus outline
      }}
      tabIndex={0}
      role="grid"
      aria-label={`Book library with ${books.length} books`}
      aria-rowcount={gridLayout.rowCount}
      aria-colcount={gridLayout.columnCount}
    >
      <Grid
        ref={gridRef}
        className={`virtualized-books-grid ${viewMode}`}
        columnCount={gridLayout.columnCount}
        rowCount={gridLayout.rowCount}
        columnWidth={gridLayout.columnWidth}
        rowHeight={gridLayout.rowHeight}
        height={dimensions.height}
        width={dimensions.width}
        itemData={itemData}
        overscanRowCount={2} // Pre-render 2 rows above/below viewport for smooth scrolling
        overscanColumnCount={1}
        style={{
          // Override CSS Grid to prevent conflicts
          display: 'block'
        }}
      >
        {ItemRenderer}
      </Grid>
      
      {/* Keyboard navigation indicator */}
      {isKeyboardNavigation && (
        <div style={{
          position: 'absolute',
          top: '10px',
          left: '10px',
          background: 'rgba(37, 99, 235, 0.9)',
          color: 'white',
          padding: '8px 12px',
          borderRadius: '8px',
          fontSize: '12px',
          pointerEvents: 'none',
          zIndex: 10,
          boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
        }}>
          <div style={{ fontWeight: '600', marginBottom: '4px' }}>Keyboard Navigation Active</div>
          <div style={{ opacity: 0.9 }}>
            ↑↓←→ Navigate • Enter/Space Open • Home/End Jump • PgUp/PgDn Scroll
          </div>
        </div>
      )}

      {/* Performance info (dev mode only) */}
      {process.env.NODE_ENV === 'development' && (
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          background: 'rgba(0,0,0,0.7)',
          color: 'white',
          padding: '4px 8px',
          borderRadius: '4px',
          fontSize: '12px',
          pointerEvents: 'none'
        }}>
          Virtual: {books.length} books, {gridLayout.rowCount}×{gridLayout.columnCount}
          {isKeyboardNavigation && ` • Focus: ${focusedIndex + 1}`}
        </div>
      )}
    </div>
  );
};

export default VirtualizedBookGrid;