// src/components/EpubReader.jsx
import { useEffect, useRef, useState, useCallback } from "react";
import { X, Download, ChevronLeft, ChevronRight } from "lucide-react";
import ePub from "epubjs";
import "../styles/epub-reader.css";

/**
 * Custom EPUB reader built directly with EPUB.js
 * No inline styles - fully controlled via CSS
 * MD3 design system compatible
 *
 * Props:
 * - book: { title, author, file_url, id, ... }
 * - onClose: () => void
 * - onLocationChange: ({ cfi: string, percent?: number }) => void
 * - initialLocation: string | null  // epubcfi(...) from query or a saved note
 */
const EpubReader = ({ book, onClose, onLocationChange, initialLocation }) => {
  // Use proxy endpoint for EPUB files to ensure proper authentication and CORS
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const epubUrl = `${apiBaseUrl}/books/${book?.id}/file`;

  console.log('📖 EpubReader - Initializing custom EPUB.js reader:', {
    bookTitle: book?.title,
    bookId: book?.id,
    proxy_epub_url: epubUrl,
    initialLocation
  });

  const viewerRef = useRef(null);
  const renditionRef = useRef(null);
  const bookRef = useRef(null);
  const currentCFIRef = useRef(null); // Track CFI in ref for scroll handler

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [canGoNext, setCanGoNext] = useState(true);
  const [canGoPrev, setCanGoPrev] = useState(false);
  const [scrollPercent, setScrollPercent] = useState(0);
  const [currentCFI, setCurrentCFI] = useState(null);

  // Store callback in ref to avoid recreating effect when it changes
  const onLocationChangeRef = useRef(onLocationChange);
  useEffect(() => {
    onLocationChangeRef.current = onLocationChange;
  }, [onLocationChange]);

  // Initialize EPUB book
  useEffect(() => {
    if (!viewerRef.current || !epubUrl) return;

    console.log('📚 Initializing EPUB.js with URL:', epubUrl);

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

    // Fetch the file with credentials, then load into EPUB.js
    console.log('🔧 Fetching EPUB file with credentials...');

    fetch(epubUrl, {
      method: 'GET',
      credentials: 'include', // Send cookies for authentication
      headers: {
        'Accept': 'application/epub+zip'
      }
    })
    .then(response => {
      if (!response.ok) {
        throw new Error(`Failed to fetch EPUB: ${response.status} ${response.statusText}`);
      }
      console.log('✅ EPUB file fetched successfully');
      return response.arrayBuffer();
    })
    .then(arrayBuffer => {
      console.log('📦 Creating EPUB book from arrayBuffer, size:', arrayBuffer.byteLength);

      // Create book instance from the arrayBuffer
      epubBook = ePub(arrayBuffer);
      bookRef.current = epubBook;

      console.log('📘 EPUB book instance created');

      // Wait for book to be ready
      return epubBook.ready;
    })
    .then(() => {
      clearTimeout(loadTimeout);
      console.log('✅ EPUB book ready!');

      if (isCleanedUp || !viewerRef.current) {
        console.log('⚠️ Component unmounted during load, skipping render');
        return;
      }

      // Create rendition (the visual display)
      console.log('🎨 Creating rendition in viewer element');
      rendition = epubBook.renderTo(viewerRef.current, {
        width: '100%',
        height: '100%',
        flow: 'scrolled-doc', // Use scrolled mode instead of paginated for better reading experience
        manager: 'continuous'
      });

      renditionRef.current = rendition;
      console.log('✅ Rendition created');

      // Apply theme for readability
      rendition.themes.default({
        body: {
          'font-family': '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
          'font-size': '18px',
          'line-height': '1.6',
          'color': '#1a1a1a',
          'background': '#ffffff',
          'padding': '20px',
          'max-width': '800px',
          'margin': '0 auto'
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

      // Listen for location changes
      rendition.on('relocated', (location) => {
        console.log('📍 Location changed:', location.start.cfi);

        const cfi = location.start.cfi;
        const percent = location.start.percentage;

        setCurrentCFI(cfi);
        currentCFIRef.current = cfi; // Update ref for scroll handler
        setCanGoPrev(!location.atStart);
        setCanGoNext(!location.atEnd);

        if (onLocationChangeRef.current) {
          onLocationChangeRef.current({ cfi, percent });
        }
      });

      // Track scroll position in the viewer
      const handleScroll = () => {
        if (!viewerRef.current) return;

        const scrollTop = viewerRef.current.scrollTop;
        const scrollHeight = viewerRef.current.scrollHeight;
        const clientHeight = viewerRef.current.clientHeight;

        // Calculate percentage through the book
        const percent = scrollHeight > clientHeight
          ? (scrollTop / (scrollHeight - clientHeight)) * 100
          : 0;

        setScrollPercent(Math.round(percent));

        // Update location callback with scroll percentage
        // Use ref to get current CFI value (avoids stale closure)
        if (onLocationChangeRef.current) {
          onLocationChangeRef.current({
            cfi: currentCFIRef.current || null,
            percent: percent / 100, // Convert to 0-1 range
            scrollPercent: Math.round(percent)
          });
        }
      };

      if (viewerRef.current) {
        viewerRef.current.addEventListener('scroll', handleScroll);
      }

      // Display the book
      const displayPromise = initialLocation
        ? rendition.display(initialLocation)
        : rendition.display();

      return displayPromise;
    })
    .then(() => {
      console.log('✅ EPUB rendered successfully');
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
      if (viewerRef.current) {
        viewerRef.current.removeEventListener('scroll', handleScroll);
      }
      renditionRef.current?.destroy();
      bookRef.current?.destroy();
      console.log('🧹 EPUB reader cleaned up');
    };
  }, [epubUrl, initialLocation]); // Removed onLocationChange - using ref instead

  const handleNext = useCallback(() => {
    // In scrolled mode, scroll down by viewport height
    if (viewerRef.current) {
      viewerRef.current.scrollBy({
        top: viewerRef.current.clientHeight * 0.9, // Scroll 90% of viewport for some overlap
        behavior: 'smooth'
      });
    }
  }, []);

  const handlePrev = useCallback(() => {
    // In scrolled mode, scroll up by viewport height
    if (viewerRef.current) {
      viewerRef.current.scrollBy({
        top: -(viewerRef.current.clientHeight * 0.9), // Scroll up 90% of viewport
        behavior: 'smooth'
      });
    }
  }, []);

  return (
    <div className="epub-reader-container">
      {/* Header */}
      <div className="epub-reader-header">
        <div className="epub-reader-header-info">
          <h3 className="epub-reader-title">{book?.title}</h3>
          <p className="epub-reader-author">by {book?.author}</p>
        </div>
        <div className="epub-reader-header-actions">
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

        {/* EPUB Viewer */}
        <div
          ref={viewerRef}
          className="epub-viewer"
          style={{ opacity: isLoading ? 0 : 1 }}
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
          </>
        )}
      </div>
    </div>
  );
};

export default EpubReader;
