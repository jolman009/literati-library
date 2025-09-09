// src/components/PdfReader.jsx
import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';

// Set up PDF.js worker for Vite compatibility
pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

export default function PdfReader({ file, book, token, onClose, onPageChange, initialPage }) {
  // Support both 'file' prop (legacy) and 'book' prop (new) - memoized to prevent unnecessary reloads
  const pdfFile = useMemo(() => {
    return file || (book?.file_url ? (
      token 
        ? { url: book.file_url, httpHeaders: { Authorization: `Bearer ${token}` } }
        : book.file_url
    ) : null);
  }, [file, book?.file_url, token]);

  // Check if we have a valid PDF file
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

  // Now use pdfFile instead of file in the component
  const containerRef = useRef(null);
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(initialPage || 1);
  const [pageWidth, setPageWidth] = useState(undefined);
  const touchStartX = useRef(null);

  // Memoize PDF.js options to prevent unnecessary reloads
  const pdfOptions = useMemo(() => ({
    verbosity: 0,  // Reduce warnings
    cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version}/cmaps/`,
    cMapPacked: true,
  }), []);

  // Resize observer so the canvas fits the container width
  useEffect(() => {
    if (!containerRef.current) return;
    const el = containerRef.current;
    const ro = new ResizeObserver(() => {
      setPageWidth(el.clientWidth ? Math.min(el.clientWidth - 24, 1200) : undefined);
    });
    ro.observe(el);
    setPageWidth(el.clientWidth ? Math.min(el.clientWidth - 24, 1200) : undefined);
    return () => ro.disconnect();
  }, []);

  const onLoadSuccess = useCallback(({ numPages }) => {
    setNumPages(numPages);
    // Guard: if current page > numPages (e.g., new doc), clamp to last
    setPageNumber(p => Math.max(1, Math.min(p, numPages)));
    // Debug (optional): console.log('PDF pages:', numPages);
  }, []);

  const nextPage = useCallback(() => {
    setPageNumber(p => (numPages ? Math.min(p + 1, numPages) : p));
  }, [numPages]);

  const prevPage = useCallback(() => {
    setPageNumber(p => Math.max(p - 1, 1));
  }, []);

  // Keyboard arrows / PageUp / PageDown
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'ArrowRight' || e.key === 'PageDown') nextPage();
      if (e.key === 'ArrowLeft'  || e.key === 'PageUp')   prevPage();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [nextPage, prevPage]);

  // Wheel → paginate (only if vertical delta dominates; adjust if you prefer scroll)
  const onWheel = (e) => {
    if (!numPages) return;
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      if (e.deltaY > 0) nextPage();
      else prevPage();
    }
  };

  // Touch swipe
  const onTouchStart = (e) => { touchStartX.current = e.changedTouches[0].clientX; };
  const onTouchEnd = (e) => {
    const dx = e.changedTouches[0].clientX - (touchStartX.current ?? e.changedTouches[0].clientX);
    if (dx < -40) nextPage();
    if (dx >  40) prevPage();
    touchStartX.current = null;
  };

  // Click-to-advance: left half = prev, right half = next
  const onCanvasClick = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    if (x > rect.width / 2) nextPage();
    else prevPage();
  };

  // Helpful: reset to first page when pdfFile changes
  useEffect(() => setPageNumber(1), [pdfFile]);

  // Call onPageChange callback when page number changes
  useEffect(() => {
    if (onPageChange && pageNumber) {
      onPageChange(pageNumber);
    }
  }, [pageNumber, onPageChange]);

  return (
    <div
      ref={containerRef}
      onWheel={onWheel}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'auto',
        background: 'var(--md-sys-color-surface, #121212)',
      }}
    >
      {/* Top controls; replace with MD3 Buttons later */}
      <div style={{
        display: 'flex', gap: 12, alignItems: 'center',
        padding: 8, position: 'sticky', top: 0, zIndex: 2,
        background: 'var(--md-sys-color-surface, #121212)'
      }}>
        <button onClick={prevPage} disabled={pageNumber <= 1}>Prev</button>
        <span>{pageNumber} / {numPages ?? '—'}</span>
        <button onClick={nextPage} disabled={!numPages || pageNumber >= numPages}>Next</button>
      </div>

      <div style={{ display: 'grid', placeItems: 'center', padding: 12 }}>
        <Document
          file={pdfFile}
          onLoadSuccess={onLoadSuccess}
          onLoadError={(err) => console.error('PDF load error:', err)}
          loading={<div>Loading PDF…</div>}
          error={<div>Failed to load PDF</div>}
          // If you load via URL and need credentials:
          // options={{ withCredentials: true }}
          // Force a remount when file changes:
          key={typeof pdfFile === 'string' ? pdfFile : (pdfFile?.url || pdfFile?.name || 'doc')}
          options={pdfOptions}
        >
          <div
            onClick={onCanvasClick}
            // Let clicks pass through “text layer” if you later enable it
            style={{ cursor: 'pointer' }}
            className="pdf-click-layer"
          >
            <Page
              pageNumber={pageNumber}
              // Make sure layers don't block clicks:
              renderTextLayer={false}
              renderAnnotationLayer={false}
              // Crisp rendering; width auto-adapts:
              width={pageWidth}
              renderMode="canvas"
            />
          </div>
        </Document>
      </div>
    </div>
  );
}
