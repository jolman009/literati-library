// src/components/PdfReader.jsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { X, Download, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from "lucide-react";
import { Document, Page, pdfjs } from "react-pdf";
// Vite-friendly worker setup
import workerSrc from "pdfjs-dist/build/pdf.worker.min.mjs?url";
pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;

const clamp = (n, min, max) => Math.min(Math.max(n, min), max);

const PdfReader = ({ book, token, onClose, onPageChange }) => {
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.15);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const file = useMemo(() => {
    // Pass auth header if your file_url requires it
    return token
      ? { url: book.file_url, httpHeaders: { Authorization: `Bearer ${token}` } }
      : book.file_url;
  }, [book.file_url, token]);

  // Memoize PDF options to prevent unnecessary reloads
  const pdfOptions = useMemo(() => ({
    verbosity: 0,  // Reduce verbosity to suppress warnings
    cMapUrl: 'https://unpkg.com/pdfjs-dist@5.4.54/cmaps/',
    cMapPacked: true,
  }), []);

  const onLoadSuccess = useCallback(
    ({ numPages }) => {
      setNumPages(numPages);
      setLoading(false);
      setError(null);
      setPageNumber(1);
      onPageChange?.(1); // emit initial page
    },
    [onPageChange]
  );

  const onLoadError = useCallback((err) => {
    setError(err?.message || "Failed to load PDF");
    setLoading(false);
  }, []);

  // Emit when page changes
  useEffect(() => {
    if (numPages) onPageChange?.(pageNumber);
  }, [pageNumber, numPages, onPageChange]);

  const prev = () => setPageNumber((p) => clamp(p - 1, 1, numPages || 1));
  const next = () => setPageNumber((p) => clamp(p + 1, 1, numPages || 1));
  const zoomIn = () => setScale((s) => clamp(s + 0.1, 0.5, 3));
  const zoomOut = () => setScale((s) => clamp(s - 0.1, 0.5, 3));

  return (
    <div className="fixed inset-0 bg-black z-50">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 bg-gray-900/95 backdrop-blur-sm text-white p-4 flex items-center justify-between z-10 shadow-lg">
        <div className="flex items-center gap-4">
          <div>
            <h3 className="text-lg font-semibold">{book.title}</h3>
            <p className="text-sm text-gray-400">by {book.author}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={zoomOut} className="p-2 hover:bg-gray-800 rounded-lg" title="Zoom out">
            <ZoomOut className="w-5 h-5" />
          </button>
          <button onClick={zoomIn} className="p-2 hover:bg-gray-800 rounded-lg" title="Zoom in">
            <ZoomIn className="w-5 h-5" />
          </button>

          <div className="mx-2 text-sm text-gray-300">
            {numPages ? `Page ${pageNumber} / ${numPages}` : "Loading…"}
          </div>

          <button onClick={prev} disabled={!numPages || pageNumber === 1}
                  className="p-2 hover:bg-gray-800 rounded-lg disabled:opacity-40" title="Previous page">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button onClick={next} disabled={!numPages || pageNumber === numPages}
                  className="p-2 hover:bg-gray-800 rounded-lg disabled:opacity-40" title="Next page">
            <ChevronRight className="w-5 h-5" />
          </button>

          <a
            href={book.file_url}
            download
            className="ml-2 flex items-center gap-2 px-3 py-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span className="text-sm hidden sm:inline">Download</span>
          </a>

          <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Canvas area */}
      <div className="pt-16 h-full overflow-auto flex items-start justify-center bg-black">
        <div className="my-6">
          <Document
            file={file}
            onLoadSuccess={onLoadSuccess}
            onLoadError={onLoadError}
            loading={
              <div className="text-white text-center py-10">Loading PDF…</div>
            }
            error={<div className="text-white text-center py-10">Error loading PDF.</div>}
            options={pdfOptions}
          >
            <Page
              pageNumber={pageNumber}
              scale={scale}
              renderTextLayer={false}
              renderAnnotationLayer={false}
            />
          </Document>

          {/* Loading overlay */}
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-white">
              <div className="text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-500 mx-auto mb-4"></div>
                <p className="text-lg">Loading your book...</p>
              </div>
            </div>
          )}

          {/* Error overlay */}
          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/70 text-white">
              <div className="text-center">
                <p className="text-xl mb-2">Unable to display PDF</p>
                <p className="text-gray-400 mb-6">{error}</p>
                <a
                  href={book.file_url}
                  download
                  className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Download className="w-5 h-5" />
                  <span>Download PDF</span>
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PdfReader;
