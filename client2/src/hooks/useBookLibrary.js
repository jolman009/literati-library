// src/hooks/useBookLibrary.js
//
// This hook manages the client-side book library state. It wraps all common
// operations for loading, refreshing, uploading, updating and deleting books
// and exposes convenient helpers for computing reading statistics and
// filtering the collection by category. The implementation below is based on
// the upstream code from the user's repository with one important
// enhancement: when the library is initially loaded from the backend, it
// checks the browser's localStorage for an `active_reading_session`.  If a
// session exists, the corresponding book in the fetched list is marked as
// `is_reading: true`.  This ensures that a book which was being read when
// the user last visited remains flagged as currently being read after a
// page reload.  Without this step the reading status would be lost on
// refresh because the server API does not yet persist the `is_reading`
// attribute.
// src/hooks/useBookLibrary.js
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { bookStorageService } from '../services/bookStorageServices';
import { useSnackbar } from '../components/Material3';
import { useGamification } from '../contexts/GamificationContext';

export const useBookLibrary = () => {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [lastSync, setLastSync] = useState(null);

  const { showSnackbar } = useSnackbar();
  const { trackAction } = useGamification();

  // ---- NEW: fetch de-dupe & throttle guards ----
  const inFlight = useRef(false);
  const lastKeyRef = useRef(null);
  const lastAtRef = useRef(0);
  const COOLDOWN_MS = 800; // ignore repeated loads inside this window

  const safeNow = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());

  // Load once on mount (do NOT include loadBooks in deps to avoid re-running)
  useEffect(() => {
    loadBooks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadBooks = useCallback(
    async (forceRefresh = false) => {
      const key = forceRefresh ? 'force' : 'normal';
      const now = safeNow();

      // De-dupe by key + cooldown
      if (inFlight.current) {
        if (process.env.NODE_ENV === 'development') {
          console.debug('📚 loadBooks ignored (in flight)', { key });
        }
        return;
      }
      if (lastKeyRef.current === key && now - lastAtRef.current < COOLDOWN_MS) {
        if (process.env.NODE_ENV === 'development') {
          console.debug('📚 loadBooks ignored (cooldown)', { key });
        }
        return;
      }

      inFlight.current = true;
      lastKeyRef.current = key;
      lastAtRef.current = now;

      try {
        setLoading(true);
        setError(null);

        let fetchedBooks = await bookStorageService.fetchBooks(forceRefresh);

        // Apply active reading session (resilient JSON parse)
        try {
          const savedSession = localStorage.getItem('active_reading_session');
          if (savedSession) {
            const sessionData = JSON.parse(savedSession);
            const activeBookId = sessionData?.book?.id;
            if (activeBookId) {
              fetchedBooks = fetchedBooks.map((b) =>
                b.id === activeBookId ? { ...b, is_reading: true } : b
              );
            }
          }
        } catch (err) {
          console.warn('Failed to apply reading session to fetched books:', err);
        }

        setBooks(fetchedBooks);
        setLastSync(new Date());

        if (forceRefresh) {
          showSnackbar?.({
            message: `Refreshed ${fetchedBooks.length} books`,
            variant: 'success',
          });
        }
      } catch (err) {
        console.error('Failed to load books:', err);
        setError(err.message);
        showSnackbar?.({
          message: `Failed to load books: ${err.message}`,
          variant: 'error',
        });
      } finally {
        inFlight.current = false;
        setLoading(false);
      }
    },
    [showSnackbar]
  );

  const refreshBooks = useCallback(() => loadBooks(true), [loadBooks]);

  const uploadBook = useCallback(
    async (file, metadata = {}) => {
      try {
        setUploading(true);
        setError(null);
        showSnackbar?.({ message: `Uploading "${file.name}"...`, variant: 'info' });

        const result = await bookStorageService.uploadBook(file, metadata);

        await loadBooks(true);
        showSnackbar?.({
          message: `"${result.title || file.name}" uploaded successfully!`,
          variant: 'success',
        });
        return result;
      } catch (err) {
        console.error('Upload failed:', err);
        setError(err.message);
        showSnackbar?.({ message: `Upload failed: ${err.message}`, variant: 'error' });
        throw err;
      } finally {
        setUploading(false);
      }
    },
    [loadBooks, showSnackbar]
  );

  const updateBook = useCallback(
    async (bookId, updates) => {
      try {
        const updatedBook = await bookStorageService.updateBook(bookId, updates);
        setBooks((prev) => prev.map((b) => (b.id === bookId ? { ...b, ...updatedBook } : b)));
        showSnackbar?.({ message: 'Book updated successfully', variant: 'success' });
        return updatedBook;
      } catch (err) {
        console.error('Failed to update book:', err);
        setError(err.message);
        showSnackbar?.({ message: `Failed to update book: ${err.message}`, variant: 'error' });
        throw err;
      }
    },
    [showSnackbar]
  );

  const deleteBook = useCallback(
    async (bookId) => {
      try {
        const bookToDelete = books.find((b) => b.id === bookId);
        await bookStorageService.deleteBook(bookId);
        setBooks((prev) => prev.filter((b) => b.id !== bookId));
        showSnackbar?.({
          message: `"${bookToDelete?.title || 'Book'}" deleted successfully`,
          variant: 'success',
        });
        return true;
      } catch (err) {
        console.error('Failed to delete book:', err);
        setError(err.message);
        showSnackbar?.({ message: `Failed to delete book: ${err.message}`, variant: 'error' });
        throw err;
      }
    },
    [books, showSnackbar]
  );

  const updateProgress = useCallback(
    async (bookId, progress, currentPage = null) => {
      try {
        const updates = {
          progress: Math.max(0, Math.min(100, progress)),
          last_read: new Date().toISOString(),
        };
        if (currentPage !== null) updates.current_page = currentPage;

        const wasJustCompleted = progress >= 100;
        if (wasJustCompleted) {
          updates.completed = true;
          updates.completed_at = new Date().toISOString();
        }

        const result = await updateBook(bookId, updates);

        // Track book completion for gamification
        if (wasJustCompleted && trackAction) {
          try {
            const book = books.find(b => b.id === bookId);
            await trackAction('complete_book', {
              bookId,
              bookTitle: book?.title,
              bookAuthor: book?.author,
              totalPages: book?.total_pages,
              completedAt: updates.completed_at
            });
          } catch (trackError) {
            console.error('Failed to track book completion:', trackError);
            // Don't fail the progress update if tracking fails
          }
        }

        return result;
      } catch (err) {
        console.error('Failed to update progress:', err);
        throw err;
      }
    },
    [updateBook, trackAction, books]
  );

  const startReading = useCallback(
    async (bookId) => {
      try {
        return await updateBook(bookId, { is_reading: true, last_read: new Date().toISOString() });
      } catch (err) {
        console.error('Failed to start reading:', err);
        throw err;
      }
    },
    [updateBook]
  );

  // ---- NEW: refresh once when tab becomes visible (but not if in-flight) ----
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        refreshBooks();
      }
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [refreshBooks]);

  // ---- Computed stats ----
  const stats = useMemo(() => {
    const totalBooks = books.length;
    const completedBooks = books.filter((b) => b.completed).length;
    const currentlyReading = books.filter((b) => b.is_reading && !b.completed).length;
    const unreadBooks = books.filter((b) => !b.is_reading && !b.completed).length;
    const totalPages = books.reduce((sum, b) => sum + (b.total_pages || 0), 0);
    const readPages = books.reduce((sum, b) => {
      if (b.completed) return sum + (b.total_pages || 0);
      if (b.current_page && b.total_pages) return sum + Math.min(b.current_page, b.total_pages);
      return sum;
    }, 0);
    const readingProgress = totalPages > 0 ? (readPages / totalPages) * 100 : 0;
    return {
      totalBooks,
      completedBooks,
      currentlyReading,
      unreadBooks,
      totalPages,
      readPages,
      readingProgress: Math.round(readingProgress * 100) / 100,
    };
  }, [books]);

  const getBooksByCategory = useCallback(
    (category) => {
      switch (category) {
        case 'reading':
          return books.filter((b) => b.is_reading && !b.completed);
        case 'completed':
          return books.filter((b) => b.completed);
        case 'unread':
          return books.filter((b) => !b.is_reading && !b.completed);
        default:
          return books;
      }
    },
    [books]
  );

  const searchBooks = useCallback(
    (query) => {
      if (!query) return books;
      const q = query.toLowerCase();
      return books.filter(
        (b) =>
          b.title?.toLowerCase().includes(q) ||
          b.author?.toLowerCase().includes(q) ||
          b.genre?.toLowerCase().includes(q) ||
          b.description?.toLowerCase().includes(q)
      );
    },
    [books]
  );

  const clearError = useCallback(() => setError(null), []);

  const syncData = useCallback(
    async () => {
      try {
        await bookStorageService.syncWhenOnline();
        await loadBooks(true);
      } catch (err) {
        console.error('Sync failed:', err);
        showSnackbar?.({ message: 'Sync failed. Please try again.', variant: 'error' });
      }
    },
    [loadBooks, showSnackbar]
  );

  return {
    // Data
    books,
    stats,
    loading,
    uploading,
    error,
    lastSync,

    // Actions
    loadBooks,
    refreshBooks,
    uploadBook,
    updateBook,
    deleteBook,
    updateProgress,
    startReading,
    syncData,
    clearError,

    // Utilities
    getBooksByCategory,
    searchBooks,

    // Status
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  };
};

export default useBookLibrary;
