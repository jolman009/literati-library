// src/components/EpubReader.jsx
import React, { useEffect, useRef, useState, useCallback } from "react";
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
  const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
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

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [canGoNext, setCanGoNext] = useState(true);
  const [canGoPrev, setCanGoPrev] = useState(false);

  // Initialize EPUB book
  useEffect(() => {
    if (!viewerRef.current || !epubUrl) return;

    console.log('📚 Initializing EPUB.js with URL:', epubUrl);

    try {
      // Create book instance
      const epubBook = ePub(epubUrl, {
        openAs: 'epub',
        requestCredentials: true,
        requestHeaders: {
          'X-Requested-With': 'XMLHttpRequest'
        }
      });

      bookRef.current = epubBook;

      // Create rendition (the visual display)
      const rendition = epubBook.renderTo(viewerRef.current, {
        width: '100%',
        height: '100%',
        flow: 'paginated',
        spread: 'none'
      });

      renditionRef.current = rendition;

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

      // Display the book
      const displayPromise = initialLocation
        ? rendition.display(initialLocation)
        : rendition.display();

      displayPromise.then(() => {
        console.log('✅ EPUB rendered successfully');
        setIsLoading(false);
        setError(null);
      }).catch((err) => {
        console.error('❌ Failed to render EPUB:', err);
        setError('Failed to display book content');
        setIsLoading(false);
      });

      // Listen for location changes
      rendition.on('relocated', (location) => {
        console.log('📍 Location changed:', location.start.cfi);

        const cfi = location.start.cfi;
        const percent = location.start.percentage;

        setCurrentLocation(cfi);
        setCanGoPrev(!location.atStart);
        setCanGoNext(!location.atEnd);

        if (onLocationChange) {
          onLocationChange({ cfi, percent });
        }
      });

      // Keyboard navigation
      const handleKeyDown = (e) => {
        if (e.key === 'ArrowRight' || e.key === 'PageDown') {
          rendition.next();
        } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
          rendition.prev();
        }
      };

      document.addEventListener('keydown', handleKeyDown);

      // Cleanup
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
        rendition?.destroy();
        epubBook?.destroy();
        console.log('🧹 EPUB reader cleaned up');
      };

    } catch (err) {
      console.error('❌ Error initializing EPUB:', err);
      setError('Failed to load book');
      setIsLoading(false);
    }
  }, [epubUrl, initialLocation, onLocationChange]);

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
