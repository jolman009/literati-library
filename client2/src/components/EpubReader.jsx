// src/components/EpubReader.jsx
import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { X, Download, ChevronLeft, ChevronRight, List, Minus, Plus } from "lucide-react";
import ePub from "epubjs";
import "../styles/epub-reader.css";

/**
 * Custom EPUB reader built directly with EPUB.js
 * Uses PAGINATED mode for consistent page-by-page navigation
 * MD3 design system compatible
 *
 * Props:
 * - book: { title, author, file_url, id, ... }
 * - token: string (optional; for Authorization header when fetching EPUB file)
 * - onClose: () => void
 * - onLocationChange: ({ cfi: string, percent?: number }) => void
 * - initialLocation: string | null  // epubcfi(...) from query or a saved note
 */
const EpubReader = React.memo(({ book, token, onClose, onLocationChange, initialLocation }) => {
  // Use proxy endpoint for EPUB files to ensure proper authentication and CORS
  // Use environment config for consistent API URL across environments
  // Memoize epubUrl to prevent recalculation on every render
  const epubUrl = useMemo(() => {
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
    return `${apiBaseUrl}/books/${book?.id}/file`;
  }, [book?.id]);

  console.warn('📖 EpubReader - Initializing paginated EPUB.js reader:', {
    bookTitle: book?.title,
    bookId: book?.id,
    proxy_epub_url: epubUrl,
    initialLocation,
    hasToken: !!token
  });

  const viewerRef = useRef(null);
  const renditionRef = useRef(null);
  const bookRef = useRef(null);
  const touchStartRef = useRef({ x: 0, y: 0 });

  // Use ref for callback to prevent re-initialization when callback identity changes
  const onLocationChangeRef = useRef(onLocationChange);
  onLocationChangeRef.current = onLocationChange;

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [canGoNext, setCanGoNext] = useState(true);
  const [canGoPrev, setCanGoPrev] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  // Table of Contents state
  const [toc, setToc] = useState([]);
  const [isTocOpen, setIsTocOpen] = useState(false);
  const [currentChapter, setCurrentChapter] = useState('');

  // Font size state (in pixels)
  const [fontSize, setFontSize] = useState(18);
  const FONT_SIZE_MIN = 12;
  const FONT_SIZE_MAX = 28;
  const FONT_SIZE_STEP = 2;

  // Initialize EPUB book
  useEffect(() => {
    if (!viewerRef.current || !epubUrl) return;

    console.warn('📚 Initializing EPUB.js with URL:', epubUrl);

    let rendition = null;
    let epubBook = null;
    let isCleanedUp = false;

    // Timeout to catch hanging loads
    const loadTimeout = setTimeout(() => {
      if (!isCleanedUp) {
        console.error('❌ EPUB loading timeout - taking too long to load');
        setError('Book is taking too long to load. Please check your connection and try again.');
        setIsLoading(false);
      }
    }, 30000); // 30 second timeout

    // Fetch the file with Authorization header (Bearer token) for authentication
    console.warn('🔧 Fetching EPUB file with Authorization header...');

    // Build headers - always include Accept, add Authorization if token is available
    const fetchHeaders = {
      'Accept': 'application/epub+zip'
    };
    if (token) {
      fetchHeaders['Authorization'] = `Bearer ${token}`;
    }

    fetch(epubUrl, {
      method: 'GET',
      credentials: 'include', // Also send cookies as fallback
      headers: fetchHeaders
    })
    .then(response => {
      if (!response.ok) {
        throw new Error(`Failed to fetch EPUB: ${response.status} ${response.statusText}`);
      }
      console.warn('✅ EPUB file fetched successfully');
      return response.arrayBuffer();
    })
    .then(arrayBuffer => {
      console.warn('📦 Creating EPUB book from arrayBuffer, size:', arrayBuffer.byteLength);

      // Create book instance from the arrayBuffer
      epubBook = ePub(arrayBuffer);
      bookRef.current = epubBook;

      console.warn('📘 EPUB book instance created');

      // Wait for book to be ready
      return epubBook.ready;
    })
    .then(() => {
      clearTimeout(loadTimeout);
      console.warn('✅ EPUB book ready!');

      if (isCleanedUp || !viewerRef.current) {
        console.warn('⚠️ Component unmounted during load, skipping render');
        return;
      }

      // Create rendition (the visual display) - PAGINATED MODE
      // This ensures consistent page-by-page navigation with next()/prev()
      console.warn('🎨 Creating PAGINATED rendition in viewer element');
      rendition = epubBook.renderTo(viewerRef.current, {
        width: '100%',
        height: '100%',
        flow: 'paginated',      // TRUE page-by-page mode
        manager: 'default',      // Default manager works best with paginated
        spread: 'none',          // Single page view (no side-by-side)
        allowScriptedContent: true
      });

      renditionRef.current = rendition;
      console.warn('✅ Paginated rendition created');

      // Apply theme for readability
      rendition.themes.default({
        body: {
          'font-family': '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
          'font-size': '18px',
          'line-height': '1.6',
          'color': 'var(--md-sys-color-on-surface, #1a1a1a)',
          'background': 'var(--md-sys-color-surface, #ffffff)',
          'padding': '20px 40px',
          'box-sizing': 'border-box'
        },
        p: {
          'margin': '0.8em 0'
        },
        'h1, h2, h3, h4, h5, h6': {
          'margin-top': '1.2em',
          'margin-bottom': '0.6em',
          'font-weight': '600'
        },
        a: {
          'color': '#2563eb',
          'text-decoration': 'underline'
        }
      });

      // Listen for location changes - now properly tracks page turns
      rendition.on('relocated', (location) => {
        console.warn('📍 Page relocated:', {
          cfi: location.start.cfi,
          atStart: location.atStart,
          atEnd: location.atEnd
        });
        setCanGoPrev(!location.atStart);
        setCanGoNext(!location.atEnd);

        // Calculate approximate page info from location
        if (location.start.displayed) {
          setCurrentPage(location.start.displayed.page);
          setTotalPages(location.start.displayed.total);
        }

        // Update current chapter name from TOC
        if (location.start.href) {
          const chapter = epubBook.navigation?.toc?.find(item =>
            location.start.href.includes(item.href.split('#')[0])
          );
          if (chapter) {
            setCurrentChapter(chapter.label);
          }
        }

        // Notify parent of location change for bookmarks/notes (use ref to avoid re-init)
        if (onLocationChangeRef.current && location.start.cfi) {
          onLocationChangeRef.current({
            cfi: location.start.cfi,
            percent: location.start.percentage ? Math.round(location.start.percentage * 100) : undefined
          });
        }
      });

      // Load Table of Contents from EPUB navigation
      if (epubBook.navigation) {
        const tocItems = epubBook.navigation.toc || [];
        console.warn('📑 Loaded TOC with', tocItems.length, 'items');
        setToc(tocItems);
      }

      // Display the book at initial location or start
      const displayPromise = initialLocation
        ? rendition.display(initialLocation)
        : rendition.display();

      return displayPromise;
    })
    .then(() => {
      console.warn('✅ EPUB rendered successfully in paginated mode');
      setIsLoading(false);
      setError(null);
    })
    .catch((err) => {
      clearTimeout(loadTimeout);
      console.error('❌ Failed to load/render EPUB:', err);
      if (!isCleanedUp) {
        setError(err.message || 'Failed to load book');
        setIsLoading(false);
      }
    });

    // Keyboard navigation
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight' || e.key === 'PageDown') {
        renditionRef.current?.next();
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        renditionRef.current?.prev();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    // Cleanup function
    return () => {
      isCleanedUp = true;
      clearTimeout(loadTimeout);
      document.removeEventListener('keydown', handleKeyDown);
      renditionRef.current?.destroy();
      bookRef.current?.destroy();
      console.warn('🧹 EPUB reader cleaned up');
    };
  // Note: onLocationChange is accessed via ref to prevent re-initialization
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [epubUrl, initialLocation, token]);

  // UNIFIED NAVIGATION - both buttons and keyboard use epub.js next()/prev()
  const handleNext = useCallback(() => {
    if (renditionRef.current) {
      renditionRef.current.next();
    }
  }, []);

  const handlePrev = useCallback(() => {
    if (renditionRef.current) {
      renditionRef.current.prev();
    }
  }, []);

  // Touch/swipe handling for mobile devices
  const handleTouchStart = useCallback((e) => {
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  }, []);

  const handleTouchEnd = useCallback((e) => {
    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = Math.abs(touch.clientY - touchStartRef.current.y);

    // Only trigger if horizontal swipe is significant and mostly horizontal
    const SWIPE_THRESHOLD = 50;
    if (Math.abs(deltaX) > SWIPE_THRESHOLD && deltaY < 100) {
      if (deltaX < 0) {
        // Swipe left = next page
        handleNext();
      } else {
        // Swipe right = previous page
        handlePrev();
      }
    }
  }, [handleNext, handlePrev]);

  // Font size controls - updates epub.js theme dynamically
  const handleFontSizeChange = useCallback((delta) => {
    setFontSize(prevSize => {
      const newSize = Math.min(FONT_SIZE_MAX, Math.max(FONT_SIZE_MIN, prevSize + delta));
      // Apply new font size to rendition
      if (renditionRef.current) {
        renditionRef.current.themes.fontSize(`${newSize}px`);
      }
      return newSize;
    });
  }, [FONT_SIZE_MIN, FONT_SIZE_MAX]);

  const increaseFontSize = useCallback(() => {
    handleFontSizeChange(FONT_SIZE_STEP);
  }, [handleFontSizeChange, FONT_SIZE_STEP]);

  const decreaseFontSize = useCallback(() => {
    handleFontSizeChange(-FONT_SIZE_STEP);
  }, [handleFontSizeChange, FONT_SIZE_STEP]);

  // TOC navigation - jump to chapter
  const handleTocClick = useCallback((href) => {
    if (renditionRef.current) {
      renditionRef.current.display(href);
      setIsTocOpen(false); // Close TOC after selection
    }
  }, []);

  // Toggle TOC sidebar
  const toggleToc = useCallback(() => {
    setIsTocOpen(prev => !prev);
  }, []);

  return (
    <div className="epub-reader-container">
      {/* Header */}
      <div className="epub-reader-header">
        <div className="epub-reader-header-left">
          {/* TOC Toggle Button */}
          <button
            onClick={toggleToc}
            className={`epub-reader-btn epub-reader-btn-secondary ${isTocOpen ? 'epub-btn-active' : ''}`}
            title="Table of Contents"
            aria-label="Toggle table of contents"
          >
            <List className="w-5 h-5" />
          </button>
          <div className="epub-reader-header-info">
            <h3 className="epub-reader-title">{book?.title}</h3>
            <p className="epub-reader-author">
              {currentChapter || `by ${book?.author}`}
            </p>
          </div>
        </div>
        <div className="epub-reader-header-actions">
          {/* Font Size Controls */}
          <div className="epub-font-controls">
            <button
              onClick={decreaseFontSize}
              disabled={fontSize <= FONT_SIZE_MIN}
              className="epub-reader-btn epub-reader-btn-secondary"
              title="Decrease font size"
              aria-label="Decrease font size"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="epub-font-size-label">{fontSize}px</span>
            <button
              onClick={increaseFontSize}
              disabled={fontSize >= FONT_SIZE_MAX}
              className="epub-reader-btn epub-reader-btn-secondary"
              title="Increase font size"
              aria-label="Increase font size"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <a
            href={book?.file_url}
            download
            className="epub-reader-btn epub-reader-btn-secondary"
            title="Download book"
          >
            <Download className="w-4 h-4" />
            <span className="epub-reader-btn-text">Download</span>
          </a>
          <button
            onClick={onClose}
            className="epub-reader-btn epub-reader-btn-secondary"
            title="Close reader"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Table of Contents Sidebar */}
      <div className={`epub-toc-sidebar ${isTocOpen ? 'epub-toc-open' : ''}`}>
        <div className="epub-toc-header">
          <h4>Table of Contents</h4>
          <button
            onClick={toggleToc}
            className="epub-reader-btn epub-reader-btn-secondary"
            aria-label="Close table of contents"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <nav className="epub-toc-list">
          {toc.length === 0 ? (
            <p className="epub-toc-empty">No table of contents available</p>
          ) : (
            toc.map((item, index) => (
              <button
                key={index}
                onClick={() => handleTocClick(item.href)}
                className="epub-toc-item"
              >
                {item.label}
              </button>
            ))
          )}
        </nav>
      </div>

      {/* Overlay to close TOC when clicking outside */}
      {isTocOpen && (
        <div
          className="epub-toc-overlay"
          onClick={toggleToc}
          aria-hidden="true"
        />
      )}

      {/* Reader Content Area */}
      <div className="epub-reader-content">
        {/* Loading State */}
        {isLoading && (
          <div className="epub-reader-loading">
            <div className="epub-reader-spinner"></div>
            <p>Loading {book?.title}...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="epub-reader-error">
            <p className="epub-reader-error-title">Error Loading Book</p>
            <p className="epub-reader-error-message">{error}</p>
            <button onClick={onClose} className="epub-reader-btn epub-reader-btn-primary">
              Back to Library
            </button>
          </div>
        )}

        {/* EPUB Viewer - with touch support for mobile swipe navigation */}
        <div
          ref={viewerRef}
          className="epub-viewer"
          style={{ opacity: isLoading ? 0 : 1 }}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        />

        {/* Navigation Arrows */}
        {!isLoading && !error && (
          <>
            <button
              onClick={handlePrev}
              disabled={!canGoPrev}
              className="epub-nav-arrow epub-nav-arrow-left"
              aria-label="Previous page"
            >
              <ChevronLeft className="w-8 h-8" />
            </button>
            <button
              onClick={handleNext}
              disabled={!canGoNext}
              className="epub-nav-arrow epub-nav-arrow-right"
              aria-label="Next page"
            >
              <ChevronRight className="w-8 h-8" />
            </button>

            {/* Page indicator */}
            {totalPages > 0 && (
              <div className="epub-page-indicator">
                Page {currentPage} of {totalPages}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
});

// Display name for React DevTools
EpubReader.displayName = 'EpubReader';

export default EpubReader;
