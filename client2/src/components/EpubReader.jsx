// src/components/EpubReader.jsx
import React, { useCallback, useRef, useState } from "react";
import { X, Download } from "lucide-react";
import { ReactReader } from "react-reader";
import "../styles/epub-reader.css";

/**
 * Props:
 * - book: { title, author, file_url, ... }
 * - onClose: () => void
 * - onLocationChange: ({ cfi: string, percent?: number }) => void  // [WIRING]
 * - initialLocation: string | null  // epubcfi(...) from query or a saved note  // [WIRING]
 */
const EpubReader = ({ book, onClose, onLocationChange, initialLocation }) => {
  // Use proxy endpoint for EPUB files to ensure proper authentication and CORS
  const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const epubUrl = `${apiBaseUrl}/books/${book?.id}/file`;

  console.log('📖 EpubReader - Initializing:', {
    bookTitle: book?.title,
    bookId: book?.id,
    original_file_url: book?.file_url,
    proxy_epub_url: epubUrl,
    hasFile: !!book?.file_url,
    initialLocation
  });

  // Track current CFI we're rendering at
  const [location, setLocation] = useState(initialLocation || null); // [WIRING]
  // Keep refs for the last known cfi and percent so we can send both together
  const lastCfiRef = useRef(initialLocation || null);
  const percentRef = useRef(null);

  // Called by ReactReader whenever the location changes via UI (taps/keys)
  const handleLocationChanged = useCallback(
    (cfi) => {
      setLocation(cfi);
      lastCfiRef.current = cfi;
      // We only call onLocationChange here if we *don’t* have a percent yet.
      // The rendition 'relocated' handler (below) will send cfi + percent together.
      if (!percentRef.current && onLocationChange) {
        onLocationChange({ cfi });
      }
    },
    [onLocationChange]
  );

  // ReactReader gives us the underlying epub.js rendition instance
  const getRendition = useCallback(
    (rendition) => {
      console.log('📚 EPUB rendition created successfully');

      // Set readable font size
      rendition.themes.fontSize("110%");

      // Apply custom theme with proper contrast for readability
      rendition.themes.default({
        body: {
          lineHeight: '1.6',
          color: '#1a1a1a !important',  // Force dark text
          background: '#ffffff !important',  // Force white background
          padding: '20px !important',
        },
        p: {
          color: '#1a1a1a !important',
          margin: '0.8em 0',
        },
        'h1, h2, h3, h4, h5, h6': {
          color: '#1a1a1a !important',
          marginTop: '1.2em',
          marginBottom: '0.6em',
        },
        a: {
          color: '#2563eb !important',  // Blue links
        }
      });

      console.log('✅ EPUB theme applied: white background, dark text');

      // epub.js emits 'relocated' with detailed info (incl. percentage)
      rendition.on("relocated", (loc) => {
        const cfi = loc?.start?.cfi || lastCfiRef.current;
        // epub.js percentage is 0..1 — keep it as a fraction; you can multiply by 100 for UI
        const pct = typeof loc?.start?.percentage === "number" ? loc.start.percentage : null;

        lastCfiRef.current = cfi;
        percentRef.current = pct;

        // [WIRING] — this is the primary place we emit both cfi + percent
        if (onLocationChange && cfi) {
          onLocationChange({ cfi, percent: pct });
        }
      });

      // Listen for errors
      rendition.on("displayError", (err) => {
        console.error('❌ EPUB display error:', err);
      });
    },
    [onLocationChange]
  );

  return (
    <div className="fixed inset-0 bg-black z-50">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 bg-gray-900/95 backdrop-blur-sm text-white p-4 flex items-center justify-between z-10 shadow-lg">
        <div>
          <h3 className="text-lg font-semibold">{book?.title}</h3>
          <p className="text-sm text-gray-400">by {book?.author}</p>
        </div>
        <div className="flex items-center gap-3">
          <a
            href={book?.file_url}
            download
            className="flex items-center gap-2 px-3 py-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span className="text-sm hidden sm:inline">Download</span>
          </a>
          <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Reader */}
      <div className="pt-16 h-full">
        <div className="epub-shell">
        <ReactReader
          // [WIRING] — the EPUB file to render via proxy endpoint
          url={epubUrl}
          // [WIRING] — controlled location (CFI). Initial value is from props.
          location={location}
          // [WIRING] — called when user navigates; we update state + (optionally) parent
          locationChanged={handleLocationChanged}
          // [WIRING] — get the rendition to hook 'relocated' and compute percent
          getRendition={getRendition}
        />
      </div>
      </div>
    </div>
  );
};

export default EpubReader;
