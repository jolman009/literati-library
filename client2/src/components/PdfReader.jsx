// src/components/PdfReader.jsx
import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Document, Page, pdfjs } from 'react-pdf';
import '../styles/pdf-reader.css';

// Set up PDF.js worker for Vite compatibility
pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

// Zoom constants
const MIN_ZOOM = 0.5;   // 50%
const MAX_ZOOM = 3.0;   // 300%
const ZOOM_STEP = 0.25; // 25% increments

export default function PdfReader({ file, book, token, onClose, onPageChange, initialPage }) {
  // Support both 'file' prop (legacy) and 'book' prop (new) - memoized to prevent unnecessary reloads
  const pdfFile = useMemo(() => {
    // Supabase public storage URLs don't need credentials — they use
    // Access-Control-Allow-Origin: * which is incompatible with withCredentials.
    const result = file || (book?.file_url
      ? { url: book.file_url }
      : null);

    console.warn('📄 PdfReader - Preparing PDF file:', {
      hasFile: !!file,
      hasBook: !!book,
      file_url: book?.file_url,
      pdfFileType: typeof result,
      pdfFileValue: result
    });

    return result;
  }, [file, book?.file_url]);

  // ALL HOOKS MUST BE CALLED BEFORE ANY CONDITIONAL RETURNS
  const containerRef = useRef(null);
  const pageContainerRef = useRef(null);
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(initialPage || 1);
  const [pageHeight, setPageHeight] = useState(undefined);
  const [, setPageWidth] = useState(undefined);
  const touchStartX = useRef(null);

  // Zoom state
  const [zoomLevel, setZoomLevel] = useState(1.0); // 1.0 = 100% (fit to viewport)
  const [isZoomed, setIsZoomed] = useState(false); // Track if user has manually zoomed

  // Pinch-to-zoom refs
  const initialPinchDistance = useRef(null);
  const initialPinchZoom = useRef(null);

  // Memoize PDF.js options to prevent unnecessary reloads
  const pdfOptions = useMemo(() => ({
    verbosity: 0,  // Reduce warnings
    cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version}/cmaps/`,
    cMapPacked: true,
  }), []);

  // Resize observer so the canvas fits the viewport
  useEffect(() => {
    if (!containerRef.current) return;
    const el = containerRef.current;
    const ro = new ResizeObserver(() => {
      // Calculate available height (viewport height minus controls bar)
      const controlsHeight = 60; // Approximate height of controls bar
      const availableHeight = window.innerHeight - controlsHeight - 24; // 24px padding
      const availableWidth = el.clientWidth - 24;

      setPageHeight(availableHeight);
      setPageWidth(availableWidth);
    });
    ro.observe(el);

    // Initial calculation
    const controlsHeight = 60;
    const availableHeight = window.innerHeight - controlsHeight - 24;
    const availableWidth = el.clientWidth - 24;
    setPageHeight(availableHeight);
    setPageWidth(availableWidth);

    return () => ro.disconnect();
  }, []);

  const onLoadSuccess = useCallback(({ numPages }) => {
    setNumPages(numPages);
    // Guard: if current page > numPages (e.g., new doc), clamp to last
    setPageNumber(p => Math.max(1, Math.min(p, numPages)));
    // Debug (optional): console.warn('PDF pages:', numPages);
  }, []);

  const nextPage = useCallback(() => {
    setPageNumber(p => (numPages ? Math.min(p + 1, numPages) : p));
  }, [numPages]);

  const prevPage = useCallback(() => {
    setPageNumber(p => Math.max(p - 1, 1));
  }, []);

  // Zoom control functions
  const zoomIn = useCallback(() => {
    setZoomLevel(z => {
      const newZoom = Math.min(z + ZOOM_STEP, MAX_ZOOM);
      setIsZoomed(newZoom !== 1.0);
      return newZoom;
    });
  }, []);

  const zoomOut = useCallback(() => {
    setZoomLevel(z => {
      const newZoom = Math.max(z - ZOOM_STEP, MIN_ZOOM);
      setIsZoomed(newZoom !== 1.0);
      return newZoom;
    });
  }, []);

  const resetZoom = useCallback(() => {
    setZoomLevel(1.0);
    setIsZoomed(false);
    // Scroll back to center when resetting zoom
    if (pageContainerRef.current) {
      pageContainerRef.current.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
    }
  }, []);

  // Keyboard shortcuts: arrows for pages, +/- for zoom
  useEffect(() => {
    const onKey = (e) => {
      // Page navigation (only when not zoomed or using arrow keys)
      if (e.key === 'ArrowRight' || e.key === 'PageDown') nextPage();
      if (e.key === 'ArrowLeft'  || e.key === 'PageUp')   prevPage();

      // Zoom controls: Ctrl/Cmd + Plus/Minus or just +/- keys
      const isModifier = e.ctrlKey || e.metaKey;
      if (e.key === '+' || e.key === '=' || (isModifier && e.key === '=')) {
        e.preventDefault();
        zoomIn();
      }
      if (e.key === '-' || (isModifier && e.key === '-')) {
        e.preventDefault();
        zoomOut();
      }
      // Reset zoom with '0' or Ctrl/Cmd + 0
      if (e.key === '0' && isModifier) {
        e.preventDefault();
        resetZoom();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [nextPage, prevPage, zoomIn, zoomOut, resetZoom]);

  // Wheel handling: Ctrl+Scroll for zoom, regular scroll for page navigation (when not zoomed)
  const onWheel = useCallback((e) => {
    // Ctrl/Cmd + Scroll = Zoom
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      if (e.deltaY < 0) zoomIn();
      else if (e.deltaY > 0) zoomOut();
      return;
    }

    // When zoomed in, allow natural scrolling instead of page navigation
    if (isZoomed) return;

    // Regular scroll = page navigation (only when not zoomed)
    if (!numPages) return;
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      if (e.deltaY > 0) nextPage();
      else prevPage();
    }
  }, [numPages, nextPage, prevPage, zoomIn, zoomOut, isZoomed]);

  // Helper to calculate distance between two touch points
  const getTouchDistance = (touches) => {
    if (touches.length < 2) return 0;
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  // Touch handlers: swipe for pages, pinch for zoom
  const onTouchStart = useCallback((e) => {
    if (e.touches.length === 2) {
      // Pinch gesture start
      initialPinchDistance.current = getTouchDistance(e.touches);
      initialPinchZoom.current = zoomLevel;
    } else if (e.touches.length === 1) {
      // Single touch for swipe
      touchStartX.current = e.changedTouches[0].clientX;
    }
  }, [zoomLevel]);

  const onTouchMove = useCallback((e) => {
    if (e.touches.length === 2 && initialPinchDistance.current) {
      // Pinch gesture in progress
      e.preventDefault();
      const currentDistance = getTouchDistance(e.touches);
      const scale = currentDistance / initialPinchDistance.current;
      const newZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, initialPinchZoom.current * scale));
      setZoomLevel(newZoom);
      setIsZoomed(newZoom !== 1.0);
    }
  }, []);

  const onTouchEnd = useCallback((e) => {
    if (initialPinchDistance.current) {
      // End of pinch gesture
      initialPinchDistance.current = null;
      initialPinchZoom.current = null;
      return;
    }

    // Single touch swipe for page navigation (only when not zoomed)
    if (!isZoomed && touchStartX.current !== null) {
      const dx = e.changedTouches[0].clientX - touchStartX.current;
      if (dx < -40) nextPage();
      if (dx > 40) prevPage();
    }
    touchStartX.current = null;
  }, [isZoomed, nextPage, prevPage]);

  // Click-to-advance: left half = prev, right half = next (disabled when zoomed to allow panning)
  const onCanvasClick = useCallback((e) => {
    // Don't navigate pages when zoomed - user needs to pan/scroll
    if (isZoomed) return;
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    if (x > rect.width / 2) nextPage();
    else prevPage();
  }, [isZoomed, nextPage, prevPage]);

  // Calculate the actual height to render based on zoom level
  const scaledHeight = useMemo(() => {
    if (!pageHeight) return undefined;
    return pageHeight * zoomLevel;
  }, [pageHeight, zoomLevel]);

  // Helpful: reset to first page when pdfFile changes
  useEffect(() => setPageNumber(1), [pdfFile]);

  // Call onPageChange callback when page number changes
  useEffect(() => {
    if (onPageChange && pageNumber) {
      onPageChange(pageNumber);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageNumber]);

  // Check if we have a valid PDF file (after all hooks)
  if (!pdfFile) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: 'var(--md-sys-color-surface, #121212)',
        color: 'var(--md-sys-color-on-surface, #ffffff)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <h2>No PDF file specified.</h2>
          {book && (
            <>
              <p style={{ marginTop: '10px' }}>Book: {book.title || 'Unknown'}</p>
              <p style={{ fontSize: '14px', opacity: 0.7 }}>
                File URL: {book.file_url || 'Missing'}
              </p>
            </>
          )}
          {onClose && (
            <button
              onClick={onClose}
              style={{
                marginTop: '20px',
                padding: '10px 20px',
                background: 'var(--md-sys-color-primary)',
                color: 'var(--md-sys-color-on-primary)',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              Go Back
            </button>
          )}
        </div>
      </div>
    );
  }

  // Portal target: render controls inside the reader-topbar if the slot exists
  const portalTarget = document.getElementById('pdf-controls-portal');

  const controlsJSX = (
    <div className={portalTarget ? 'pdf-controls-inline' : 'pdf-controls-bar'}>
      {/* Page navigation */}
      <div className="pdf-controls-group">
        <button onClick={prevPage} disabled={pageNumber <= 1} title="Previous page (←)">
          ◀
        </button>
        <span className="pdf-page-indicator">{pageNumber} / {numPages ?? '—'}</span>
        <button onClick={nextPage} disabled={!numPages || pageNumber >= numPages} title="Next page (→)">
          ▶
        </button>
      </div>

      {/* Zoom controls */}
      <div className="pdf-controls-group pdf-zoom-controls">
        <button onClick={zoomOut} disabled={zoomLevel <= MIN_ZOOM} title="Zoom out (-)">
          −
        </button>
        <span className="pdf-zoom-indicator" onClick={resetZoom} title="Click to reset zoom (Ctrl+0)">
          {Math.round(zoomLevel * 100)}%
        </span>
        <button onClick={zoomIn} disabled={zoomLevel >= MAX_ZOOM} title="Zoom in (+)">
          +
        </button>
        {isZoomed && (
          <button onClick={resetZoom} className="pdf-fit-button" title="Fit to page (Ctrl+0)">
            Fit
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="pdf-reader-container">
      {/* Render controls via portal into reader-topbar, or inline as fallback */}
      {portalTarget ? createPortal(controlsJSX, portalTarget) : controlsJSX}

      <div
        ref={containerRef}
        className={`pdf-content-area ${isZoomed ? 'pdf-zoomed' : ''}`}
        onWheel={onWheel}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div className="pdf-page-container" ref={pageContainerRef}>
        <Document
          file={pdfFile}
          onLoadSuccess={onLoadSuccess}
          onLoadError={(err) => {
            console.error('❌ PDF load error:', err);
            console.error('PDF file details:', {
              pdfFile,
              book: book?.title,
              file_url: book?.file_url
            });
          }}
          loading={
            <div style={{ padding: '40px', textAlign: 'center', color: 'white' }}>
              <div>Loading PDF…</div>
              <div style={{ fontSize: '12px', marginTop: '8px', opacity: 0.7 }}>
                {book?.title}
              </div>
            </div>
          }
          error={
            <div style={{ padding: '40px', textAlign: 'center', color: 'white' }}>
              <div>❌ Failed to load PDF</div>
              <div style={{ fontSize: '12px', marginTop: '8px', opacity: 0.7 }}>
                {book?.title}
              </div>
              <div style={{ fontSize: '11px', marginTop: '4px', opacity: 0.5 }}>
                Check console for details
              </div>
            </div>
          }
          // If you load via URL and need credentials:
          // options={{ withCredentials: true }}
          // Force a remount when file changes:
          key={typeof pdfFile === 'string' ? pdfFile : (pdfFile?.url || pdfFile?.name || 'doc')}
          options={pdfOptions}
        >
          <div
            onClick={onCanvasClick}
            className="pdf-click-layer"
          >
            <Page
              pageNumber={pageNumber}
              // Make sure layers don't block clicks:
              renderTextLayer={false}
              renderAnnotationLayer={false}
              // Fit to viewport - height scales with zoom level
              height={scaledHeight}
              renderMode="canvas"
            />
          </div>
        </Document>
      </div>
      </div>
    </div>
  );
}
