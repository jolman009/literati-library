// src/pages/ReadBook.jsx
import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useReadingSession } from "../contexts/ReadingSessionContext";
import { useSnackbar } from "../components/Material3";
import ReadestReader from "../components/ReadestReader";
import ThemeToggle from "../components/ThemeToggle";
import FloatingNotepad from "../components/FloatingNotepad";
// ❌ REMOVED: FloatingTimer - using global ReadingSessionTimer instead
import API from "../config/api";

const ReadBook = () => {
  console.log('🚀 ReadBook component mounting...');

  const { bookId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();              // <-- for deep-link ?cfi=...

  // Get auth context
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const { activeSession, hasActiveSession, stopReadingSession } = useReadingSession();
  const { showSnackbar } = useSnackbar();
  const [stopping, setStopping] = useState(false);
  const [elapsedSec, setElapsedSec] = useState(0);

  console.log('✅ Auth state:', {
    hasUser: !!user,
    isAuthenticated,
    authLoading,
    userId: user?.id
  });
  console.log('✅ Reading session state:', { hasActiveSession });

  const [book, setBook] = useState(null);
  const [currentPage, setCurrentPage] = useState(null);  // (PDF-only; iframe can't update)
  const [currentLocator, setCurrentLocator] = useState(null); // <-- EPUB location { cfi, percent? }
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  console.log('📊 ReadBook state:', { bookId, loading, error, hasBook: !!book });

  // --- fetch book (cancellable) ---
  const fetchBook = useCallback(async () => {
    if (!bookId) {
      setError("No book ID provided");
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);

      const controller = new AbortController();
      const res = await API.get(`/books/${bookId}`, {
        signal: controller.signal,
        timeout: 30000,
      });

      const bookData = res.data || null;

      console.log('📖 Book data received:', {
        id: bookData?.id,
        title: bookData?.title,
        file_url: bookData?.file_url,
        file_type: bookData?.file_type,
        format: bookData?.format,
        filename: bookData?.filename
      });

      // Client-side fallback: ensure format is set
      if (bookData && !bookData.format) {
        if (bookData.file_type?.includes('pdf')) {
          bookData.format = 'pdf';
        } else if (bookData.file_type?.includes('epub') || bookData.filename?.toLowerCase().endsWith('.epub')) {
          bookData.format = 'epub';
        } else if (bookData.filename) {
          const ext = bookData.filename.split('.').pop()?.toLowerCase();
          bookData.format = ext === 'pdf' ? 'pdf' : ext === 'epub' ? 'epub' : 'pdf';
        } else {
          bookData.format = 'pdf';
        }
        console.log(`📚 Derived book format: ${bookData.format} from file_type: ${bookData.file_type}, filename: ${bookData.filename}`);
      }

      // Validate file_url exists
      if (!bookData?.file_url) {
        console.error('❌ Book has no file_url!', bookData);
        setError('Book file is missing');
        setLoading(false);
        return;
      }

      console.log(`✅ Book ready to render: format=${bookData.format}, file_url=${bookData.file_url}`);

      setBook(bookData);
      setError(null);
    } catch (err) {
      if (err?.name !== "CanceledError" && err?.message !== "canceled") {
        setError(err?.response?.data?.error || "Failed to load book");
      }
    } finally {
      setLoading(false);
    }
  }, [bookId]);

  useEffect(() => {
    console.log('🔄 ReadBook useEffect triggered', {
      authLoading,
      isAuthenticated,
      hasUser: !!user
    });

    // Wait for auth to finish loading
    if (authLoading) {
      console.log('⏳ Auth still loading, waiting...');
      return;
    }

    // Auth gate - only after loading is complete
    if (!isAuthenticated || !user) {
      console.warn('⚠️ Not authenticated, redirecting to login');
      navigate("/login");
      return;
    }

    console.log('✅ User authenticated, fetching book...');
    fetchBook().catch(err => {
      console.error('❌ fetchBook failed in useEffect:', err);
      setError(err.message);
      setLoading(false);
    });
  }, [authLoading, isAuthenticated, user, navigate, fetchBook]);

  // Track elapsed time for the top-bar Stop button badge (complements the floating timer)
  useEffect(() => {
    if (!activeSession) {
      setElapsedSec(0);
      return;
    }
    const compute = () => {
      const start = new Date(activeSession.startTime);
      const now = new Date();
      const current = Math.floor((now - start) / 1000);
      const total = (activeSession.accumulatedTime || 0) + (activeSession.isPaused ? 0 : current);
      setElapsedSec(Math.max(0, total));
    };
    compute();
    const id = setInterval(compute, 1000);
    return () => clearInterval(id);
  }, [activeSession]);

  // Fallback: if PDF viewer (iframe) doesn't emit page, default to 1 after book loads.
  // Only set for PDFs, not EPUBs (EPUBs use currentLocator instead)
  useEffect(() => {
    if (book && book.format === 'pdf' && currentPage == null) {
      setCurrentPage(1);
    }
  }, [book, currentPage]);

  const handleClose = async () => {
    if (hasActiveSession) {
      const ok = window.confirm('You have an active reading session. Do you want to stop it and leave the reader?');
      if (!ok) return;
      try {
        const result = await stopReadingSession();
        if (result?.success) {
          showSnackbar({ message: `Session saved (${result.duration} min)`, variant: 'success' });
        }
      } catch {}
    }
    navigate("/library");
  };

  // Optional deep-linking to EPUB location: /read/:bookId?cfi=epubcfi(...)
  const initialLocation = searchParams.get("cfi") || null;

  return (
    <>
      {/* Reader Top Bar: dashboard link + theme toggle */}
      {!loading && !error && book?.file_url && (
        <div className="reader-topbar" role="navigation" aria-label="Reader toolbar">
          <div className="reader-topbar-left">
            <button
              type="button"
              className="reader-topbar-btn"
              onClick={() => navigate('/dashboard')}
              aria-label="Back to Dashboard"
            >
              <span className="reader-topbar-back">←</span>
              <span className="reader-topbar-text">Dashboard</span>
            </button>
          </div>
          <div className="reader-topbar-right">
            <ThemeToggle ariaLabel="Toggle light/dark mode" />
          </div>
        </div>
      )}
      {/* Loading overlay */}
      {loading && (
        <div className="fixed inset-0 bg-gray-900 flex items-center justify-center z-50">
          <div className="text-center text-white">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-500 mx-auto mb-4"></div>
            <p className="text-lg">Loading your book...</p>
            <p className="text-sm text-gray-400 mt-2">Book ID: {bookId}</p>
          </div>
        </div>
      )}

      {/* Error overlay */}
      {!loading && error && (
        <div className="fixed inset-0 bg-gray-900 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-8 max-w-md w-full text-center shadow-2xl">
            <div className="w-16 h-16 bg-red-500/20 rounded-full mx-auto mb-4 flex items-center justify-center">
              <span className="text-2xl">⚠️</span>
            </div>
            <h3 className="text-xl font-semibold mb-2 dark:text-white">Error Loading Book</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mb-6">
              Book ID: {bookId || "Not provided"}
            </p>
            <div className="space-y-3">
              <button
                onClick={() => window.location.reload()}
                className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={handleClose}
                className="w-full px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Back to Library
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Book not found overlay */}
      {!loading && !error && !book && (
        <div className="fixed inset-0 bg-gray-900 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-8 max-w-md w-full text-center shadow-2xl">
            <div className="w-16 h-16 bg-yellow-500/20 rounded-full mx-auto mb-4 flex items-center justify-center">
              <span className="text-2xl">📚</span>
            </div>
            <h3 className="text-xl font-semibold mb-2 dark:text-white">Book Not Found</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              The requested book could not be found in your library.
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mb-6">Book ID: {bookId}</p>
            <div className="space-y-3">
              <button
                onClick={() => navigate("/upload")}
                className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Upload a Book
              </button>
              <button
                onClick={handleClose}
                className="w-full px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Back to Library
              </button>
            </div>
          </div>
        </div>
      )}

      {/* File missing overlay */}
      {!loading && !error && book && !book.file_url && (
        <div className="fixed inset-0 bg-gray-900 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-8 max-w-md w-full text-center shadow-2xl">
            <div className="w-16 h-16 bg-orange-500/20 rounded-full mx-auto mb-4 flex items-center justify-center">
              <span className="text-2xl">📄</span>
            </div>
            <h3 className="text-xl font-semibold mb-2 dark:text-white">File Not Available</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-2">
              <strong>{book?.title}</strong>
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mb-4">by {book?.author}</p>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              The book file is missing or was not uploaded properly.
            </p>
            <div className="space-y-3">
              <button
                onClick={() => navigate("/upload")}
                className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Upload File for This Book
              </button>
              <button
                onClick={handleClose}
                className="w-full px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Back to Library
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success: show reader + floating components */}
      {!loading && !error && book?.file_url && (
        <>
          {/* Reader top bar */}
          <div className="reader-topbar" role="navigation" aria-label="Reader toolbar">
            <div className="reader-topbar-left">
              <button
                type="button"
                className="reader-topbar-btn"
                onClick={async () => {
                  if (hasActiveSession) {
                    const ok = window.confirm('You have an active reading session. Stop the session and return to Dashboard?');
                    if (!ok) return;
                    try {
                      const result = await stopReadingSession();
                      if (result?.success) {
                        showSnackbar({ message: `Session saved (${result.duration} min)`, variant: 'success' });
                      }
                    } catch {}
                  }
                  navigate('/dashboard');
                }}
                aria-label="Back to Dashboard"
              >
                <span className="reader-topbar-back">←</span>
                <span className="reader-topbar-text">Dashboard</span>
              </button>
            </div>
            <div className="reader-topbar-right" style={{ gap: 8, display: 'flex', alignItems: 'center' }}>
              {hasActiveSession && (
                <button
                  type="button"
                  className="reader-topbar-btn"
                  disabled={stopping}
                  aria-disabled={stopping}
                  onClick={async () => {
                    if (stopping) return;
                    setStopping(true);
                    try {
                      const result = await stopReadingSession();
                      if (result?.success) {
                        showSnackbar({ message: `Session saved (${result.duration} min)`, variant: 'success' });
                      }
                    } catch (e) {
                      showSnackbar({ message: 'Failed to stop session', variant: 'error' });
                    } finally {
                      setStopping(false);
                    }
                  }}
                  aria-label="Stop session"
                >
                  <span className="reader-topbar-text">{stopping ? 'Stopping…' : 'Stop Session'}</span>
                  <span className="reader-topbar-badge" aria-label="elapsed minutes">
                    {Math.floor(elapsedSec / 60)}m
                  </span>
                </button>
              )}
              <ThemeToggle ariaLabel="Toggle light/dark mode" />
            </div>
          </div>

          <ReadestReader
            book={book}
            onClose={handleClose}
            onLocationChange={(loc) => setCurrentLocator(loc)} // EPUB
            initialLocation={initialLocation}
            onPageChange={(p) => setCurrentPage(p)}            // ✅ PDF
          />
          <FloatingNotepad
            title={`Note — ${book.title}`}
            book={book}
            currentPage={currentPage}
            currentLocator={currentLocator}
          />
          {/* ✅ Timer now handled globally by ReadingSessionTimer in App.jsx */}
        </>
      )}
    </>
  );
};

export default ReadBook;
