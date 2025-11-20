// src/pages/ReadBookEnhanced.jsx
// Enhanced ReadBook component with full offline reading capabilities
import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useReadingSession } from "../contexts/ReadingSessionContext";
import { useOfflineReading } from "../hooks/useOfflineReading";
import { useNetworkStatus } from "../hooks/useOfflineDetection";
import ReadestReader from "../components/ReadestReader";
import NotesSidebar from "../components/NotesSidebar";
import BottomSheetNotes from "../components/BottomSheetNotes";
import MD3Fab from "../components/Material3/MD3Fab";
// ❌ REMOVED: FloatingTimer - using global ReadingSessionTimer instead
import API from "../config/api";
import { Download, Trash2, WifiOff, Wifi, CheckCircle } from "lucide-react";

const ReadBookEnhanced = () => {
  console.log('🚀 ReadBookEnhanced component mounting...');

  const { bookId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Get auth context
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const { activeSession, hasActiveSession, stopReadingSession, isPaused } = useReadingSession();

  // Get network status
  const networkStatus = useNetworkStatus();

  // Get offline reading capabilities
  const {
    bookData: cachedBookData,
    isCached,
    isOnline,
    isOffline,
    serverReachable,
    downloadBook,
    removeOfflineBook,
    saveProgress,
    saveNote,
    updateNote,
    deleteNote,
    getNotes,
    saveHighlight,
    saveBookmark,
  } = useOfflineReading(bookId);

  console.log('📡 Network status:', networkStatus);
  console.log('💾 Offline reading status:', { isCached, isOnline, isOffline, serverReachable });

  const [book, setBook] = useState(null);
  const [currentPage, setCurrentPage] = useState(null);
  const [currentLocator, setCurrentLocator] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [showOfflineControls, setShowOfflineControls] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Notes sidebar state
  const [isMobile, setIsMobile] = useState(false); // Mobile detection for bottom sheet

  console.log('📊 ReadBookEnhanced state:', {
    bookId, loading, error, hasBook: !!book,
    isCached, downloading, isOnline
  });

  // ===== MOBILE DETECTION =====
  useEffect(() => {
    const updateMobileState = () => {
      setIsMobile(window.innerWidth < 768);
    };

    updateMobileState();
    window.addEventListener('resize', updateMobileState);
    return () => window.removeEventListener('resize', updateMobileState);
  }, []);

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

      // If offline and book is cached, use cached version
      if (isOffline && isCached && cachedBookData) {
        console.log('📚 Using cached book data (offline mode)');

        // Convert cached blob to URL
        const blobUrl = URL.createObjectURL(cachedBookData.blob);
        const bookDataFromCache = {
          id: cachedBookData.bookId,
          title: cachedBookData.title,
          author: cachedBookData.author,
          file_url: blobUrl,
          file_type: cachedBookData.fileType,
          format: cachedBookData.fileType === 'application/pdf' ? 'pdf' : 'epub',
          cached: true,
        };

        setBook(bookDataFromCache);
        setError(null);
        setLoading(false);
        return;
      }

      // Online: fetch from server
      if (serverReachable) {
        const controller = new AbortController();
        const res = await API.get(`/books/${bookId}`, {
          signal: controller.signal,
          timeout: 30000,
        });

        const bookData = res.data || null;

        console.log('📖 Book data received from server:', {
          id: bookData?.id,
          title: bookData?.title,
          file_url: bookData?.file_url,
          file_type: bookData?.file_type,
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
        }

        // Validate file_url exists
        if (!bookData?.file_url) {
          console.error('❌ Book has no file_url!', bookData);
          setError('Book file is missing');
          setLoading(false);
          return;
        }

        setBook(bookData);
        setError(null);
      } else {
        // Server not reachable and no cache
        setError('Cannot connect to server. Download books for offline reading.');
      }
    } catch (err) {
      if (err?.name !== "CanceledError" && err?.message !== "canceled") {
        const errorMessage = err?.response?.data?.error || "Failed to load book";

        // If offline and we have cached data, use it despite error
        if (isOffline && isCached && cachedBookData) {
          console.log('⚠️ Server error but using cached data');
          const blobUrl = URL.createObjectURL(cachedBookData.blob);
          setBook({
            id: cachedBookData.bookId,
            title: cachedBookData.title,
            author: cachedBookData.author,
            file_url: blobUrl,
            file_type: cachedBookData.fileType,
            format: cachedBookData.fileType === 'application/pdf' ? 'pdf' : 'epub',
            cached: true,
          });
          setError(null);
        } else {
          setError(errorMessage);
        }
      }
    } finally {
      setLoading(false);
    }
  }, [bookId, isOffline, isCached, cachedBookData, serverReachable]);

  useEffect(() => {
    console.log('🔄 ReadBookEnhanced useEffect triggered', {
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

  // Default page for PDFs
  useEffect(() => {
    if (book && book.format === 'pdf' && currentPage == null) {
      setCurrentPage(1);
    }
  }, [book, currentPage]);

  const handleClose = () => navigate("/library");

  // Handle downloading book for offline
  const handleDownloadForOffline = async () => {
    if (!book || downloading) return;

    try {
      setDownloading(true);
      setDownloadProgress(0);

      console.log('📥 Downloading book for offline access...');

      await downloadBook(book.file_url, {
        title: book.title,
        author: book.author,
        coverUrl: book.cover_url,
        fileType: book.file_type,
      });

      setDownloadProgress(100);
      console.log('✅ Book downloaded successfully');

      // Show success message
      setTimeout(() => {
        setDownloading(false);
        setDownloadProgress(0);
      }, 1000);
    } catch (error) {
      console.error('❌ Failed to download book:', error);
      setError('Failed to download book for offline reading');
      setDownloading(false);
      setDownloadProgress(0);
    }
  };

  // Handle removing offline book
  const handleRemoveOffline = async () => {
    if (!isCached) return;

    try {
      console.log('🗑️ Removing offline book...');
      await removeOfflineBook(bookId);
      console.log('✅ Book removed from offline storage');
    } catch (error) {
      console.error('❌ Failed to remove offline book:', error);
    }
  };

  // Enhanced progress saving (works offline)
  const handleProgressChange = useCallback(async (progressData) => {
    try {
      await saveProgress(progressData);
      console.log(isOffline ? '💾 Progress saved offline' : '✅ Progress synced');
    } catch (error) {
      console.error('❌ Failed to save progress:', error);
    }
  }, [saveProgress, isOffline]);

  // Enhanced note saving (works offline)
  const handleNoteSave = useCallback(async (noteData) => {
    try {
      const savedNote = await saveNote(noteData);
      console.log(isOffline ? '💾 Note saved offline' : '✅ Note synced');
      return savedNote;
    } catch (error) {
      console.error('❌ Failed to save note:', error);
      throw error;
    }
  }, [saveNote, isOffline]);

  const initialLocation = searchParams.get("cfi") || null;

  return (
    <>
      {/* Loading overlay */}
      {loading && (
        <div className="fixed inset-0 bg-gray-900 flex items-center justify-center z-50">
          <div className="text-center text-white">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-500 mx-auto mb-4"></div>
            <p className="text-lg">Loading your book...</p>
            {isOffline && <p className="text-sm text-yellow-400 mt-2">Offline mode - checking cache...</p>}
            {!isOffline && !serverReachable && (
              <p className="text-sm text-orange-400 mt-2">Checking server connectivity...</p>
            )}
            <p className="text-sm text-gray-400 mt-2">Book ID: {bookId}</p>
          </div>
        </div>
      )}

      {/* Error overlay */}
      {!loading && error && (
        <div className="fixed inset-0 bg-gray-900 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-8 max-w-md w-full text-center shadow-2xl">
            <div className="w-16 h-16 bg-red-500/20 rounded-full mx-auto mb-4 flex items-center justify-center">
              {isOffline ? <WifiOff className="w-8 h-8 text-red-500" /> : <span className="text-2xl">⚠️</span>}
            </div>
            <h3 className="text-xl font-semibold mb-2 dark:text-white">
              {isOffline ? 'Offline - Book Not Cached' : 'Error Loading Book'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
            {isOffline && (
              <p className="text-sm text-yellow-600 dark:text-yellow-500 mb-4">
                Connect to internet and download this book for offline reading.
              </p>
            )}
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

      {/* Success: show reader + floating components + offline controls */}
      {!loading && !error && book?.file_url && (
        <>
          {/* Offline controls toolbar */}
          <div className="fixed top-4 right-4 z-40 flex flex-col gap-2">
            {/* Network status badge */}
            <div className={`px-3 py-2 rounded-lg shadow-lg flex items-center gap-2 ${
              isOffline ? 'bg-orange-500 text-white' :
              serverReachable ? 'bg-green-500 text-white' :
              'bg-yellow-500 text-white'
            }`}>
              {isOffline ? <WifiOff className="w-4 h-4" /> : <Wifi className="w-4 h-4" />}
              <span className="text-sm font-medium">
                {isOffline ? 'Offline' : serverReachable ? 'Online' : 'Limited Connection'}
              </span>
              {isCached && <CheckCircle className="w-4 h-4" />}
            </div>

            {/* Stop Reading Session button */}
            {hasActiveSession && (
              <button
                onClick={stopReadingSession}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg shadow-lg hover:shadow-xl transition-all text-sm font-medium flex items-center gap-2"
                title="End current reading session"
              >
                <span>⏹️</span>
                <span>Stop Session</span>
              </button>
            )}

            {/* Download/Remove button */}
            {isOnline && serverReachable && (
              <button
                onClick={() => setShowOfflineControls(!showOfflineControls)}
                className="px-4 py-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg hover:shadow-xl transition-all text-sm font-medium flex items-center gap-2"
              >
                {isCached ? (
                  <>
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Available Offline</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>Download</span>
                  </>
                )}
              </button>
            )}

            {/* Expanded controls */}
            {showOfflineControls && isOnline && serverReachable && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-4 space-y-3 animate-slideIn">
                <div className="text-sm font-medium dark:text-white">Offline Reading</div>

                {!isCached ? (
                  <button
                    onClick={handleDownloadForOffline}
                    disabled={downloading}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors flex items-center justify-center gap-2 text-sm"
                  >
                    <Download className="w-4 h-4" />
                    {downloading ? `Downloading... ${downloadProgress}%` : 'Download for Offline'}
                  </button>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-500">
                      <CheckCircle className="w-4 h-4" />
                      <span>Available offline</span>
                    </div>
                    <button
                      onClick={handleRemoveOffline}
                      className="w-full px-4 py-2 border border-red-300 text-red-600 dark:border-red-700 dark:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center justify-center gap-2 text-sm"
                    >
                      <Trash2 className="w-4 h-4" />
                      Remove Offline Copy
                    </button>
                  </div>
                )}

                {downloading && (
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${downloadProgress}%` }}
                    ></div>
                  </div>
                )}

                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {isCached
                    ? 'This book is saved on your device and can be read offline.'
                    : 'Download this book to read it without an internet connection.'}
                </p>
              </div>
            )}
          </div>

          {/* Reader component */}
          <ReadestReader
            book={book}
            onClose={handleClose}
            onLocationChange={(loc) => {
              setCurrentLocator(loc);
              // Save location for EPUBs
              if (book.format === 'epub') {
                handleProgressChange({
                  currentPage: loc.page || 0,
                  totalPages: loc.totalPages || 0,
                  percentage: loc.percentage || 0,
                });
              }
            }}
            initialLocation={initialLocation}
            onPageChange={(p) => {
              setCurrentPage(p);
              // Save progress for PDFs
              if (book.format === 'pdf') {
                handleProgressChange({
                  currentPage: p,
                  totalPages: book.total_pages || 0,
                  percentage: book.total_pages ? (p / book.total_pages) * 100 : 0,
                });
              }
            }}
          />

          {/* Notes: BottomSheet on mobile, Sidebar on desktop (with offline support) */}
          {isMobile ? (
            <BottomSheetNotes
              isOpen={isSidebarOpen}
              onClose={() => setIsSidebarOpen(false)}
              title={`Note — ${book.title}`}
              book={book}
              currentPage={currentPage}
              currentLocator={currentLocator}
            />
          ) : (
            <NotesSidebar
              isOpen={isSidebarOpen}
              onClose={() => setIsSidebarOpen(false)}
              title={`Note — ${book.title}`}
              book={book}
              currentPage={currentPage}
              currentLocator={currentLocator}
            />
          )}

          {/* Toggle Notes Button (FAB) */}
          <MD3Fab
            icon={isSidebarOpen ? '✕' : '📝'}
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            ariaLabel={isSidebarOpen ? "Close notes" : "Open notes"}
            variant="primary"
          />

          {/* ✅ Timer now handled globally by ReadingSessionTimer in App.jsx */}

          {/* Offline indicator at bottom */}
          {isOffline && (
            <div className="fixed bottom-4 left-4 right-4 bg-orange-500 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 z-30">
              <WifiOff className="w-5 h-5 flex-shrink-0" />
              <div className="flex-1 text-sm">
                <div className="font-medium">Reading Offline</div>
                <div className="text-xs opacity-90">Your notes and progress will sync when you reconnect.</div>
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
};

export default ReadBookEnhanced;
