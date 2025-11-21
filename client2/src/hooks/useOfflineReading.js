// src/hooks/useOfflineReading.js
// Main hook for offline reading functionality

import { useState, useEffect, useCallback } from 'react';
import { useNetworkStatus } from './useOfflineDetection';
import { getCachedBook, cacheBook, isBookCached, uncacheBook } from '../services/bookCacheService';
import { queueAction, SYNC_ACTIONS } from '../services/syncQueue';
import { setItem, getItemsByIndex, STORES } from '../utils/indexedDB';

/**
 * Hook for offline reading with automatic sync
 */
export function useOfflineReading(bookId) {
  const networkStatus = useNetworkStatus();
  const [bookData, setBookData] = useState(null);
  const [isCached, setIsCached] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if book is cached
  useEffect(() => {
    async function checkCache() {
      if (!bookId) {
        setIsLoading(false);
        return;
      }

      try {
        const cached = await isBookCached(bookId);
        setIsCached(cached);

        if (cached) {
          const cachedBookData = await getCachedBook(bookId);
          if (cachedBookData) {
            setBookData(cachedBookData);
          }
        }

        setIsLoading(false);
      } catch (err) {
        console.error('Error checking book cache:', err);
        setError(err);
        setIsLoading(false);
      }
    }

    checkCache();
  }, [bookId]);

  // Download book for offline access
  const downloadBook = useCallback(async (url, metadata) => {
    if (!bookId) return;

    try {
      setIsLoading(true);
      const result = await cacheBook(bookId, { url, ...metadata });
      setIsCached(true);
      setBookData(result);
      setIsLoading(false);
      return result;
    } catch (err) {
      console.error('Error downloading book:', err);
      setError(err);
      setIsLoading(false);
      throw err;
    }
  }, [bookId]);

  // Remove book from offline storage
  const removeOfflineBook = useCallback(async () => {
    if (!bookId) return;

    try {
      await uncacheBook(bookId);
      setIsCached(false);
      setBookData(null);
    } catch (err) {
      console.error('Error removing offline book:', err);
      setError(err);
    }
  }, [bookId]);

  // Save reading progress (with offline support)
  const saveProgress = useCallback(async (progressData) => {
    if (!bookId) return;

    const progress = {
      bookId,
      ...progressData,
      timestamp: Date.now(),
      synced: networkStatus.fullyOnline,
    };

    try {
      // Save to IndexedDB immediately
      await setItem(STORES.READING_PROGRESS, progress);

      // Queue for sync if offline or server unreachable
      if (!networkStatus.fullyOnline) {
        await queueAction(SYNC_ACTIONS.UPDATE_PROGRESS, progress);
        console.warn('📝 Progress saved offline, will sync when online');
      } else {
        // Sync immediately if online
        await queueAction(SYNC_ACTIONS.UPDATE_PROGRESS, progress);
      }

      return progress;
    } catch (err) {
      console.error('Error saving progress:', err);
      throw err;
    }
  }, [bookId, networkStatus.fullyOnline]);

  // Save note (with offline support)
  const saveNote = useCallback(async (noteData) => {
    if (!bookId) return;

    const note = {
      bookId,
      ...noteData,
      timestamp: Date.now(),
      synced: networkStatus.fullyOnline,
    };

    try {
      // Save to IndexedDB
      const noteId = await setItem(STORES.NOTES, note);

      // Queue for sync
      await queueAction(SYNC_ACTIONS.CREATE_NOTE, { ...note, noteId });

      if (!networkStatus.fullyOnline) {
        console.warn('📝 Note saved offline, will sync when online');
      }

      return { ...note, id: noteId };
    } catch (err) {
      console.error('Error saving note:', err);
      throw err;
    }
  }, [bookId, networkStatus.fullyOnline]);

  // Update note
  const updateNote = useCallback(async (noteId, content) => {
    try {
      const payload = {
        noteId,
        content,
        timestamp: Date.now(),
      };

      await queueAction(SYNC_ACTIONS.UPDATE_NOTE, payload);

      if (!networkStatus.fullyOnline) {
        console.warn('📝 Note update saved offline, will sync when online');
      }

      return payload;
    } catch (err) {
      console.error('Error updating note:', err);
      throw err;
    }
  }, [networkStatus.fullyOnline]);

  // Delete note
  const deleteNote = useCallback(async (noteId) => {
    try {
      await queueAction(SYNC_ACTIONS.DELETE_NOTE, { noteId });

      if (!networkStatus.fullyOnline) {
        console.warn('🗑️ Note deletion saved offline, will sync when online');
      }
    } catch (err) {
      console.error('Error deleting note:', err);
      throw err;
    }
  }, [networkStatus.fullyOnline]);

  // Get all notes for this book
  const getNotes = useCallback(async () => {
    if (!bookId) return [];

    try {
      const notes = await getItemsByIndex(STORES.NOTES, 'bookId', bookId);
      return notes.sort((a, b) => b.timestamp - a.timestamp);
    } catch (err) {
      console.error('Error getting notes:', err);
      return [];
    }
  }, [bookId]);

  // Save highlight
  const saveHighlight = useCallback(async (highlightData) => {
    if (!bookId) return;

    const highlight = {
      bookId,
      ...highlightData,
      timestamp: Date.now(),
    };

    try {
      await queueAction(SYNC_ACTIONS.CREATE_HIGHLIGHT, highlight);

      if (!networkStatus.fullyOnline) {
        console.warn('✨ Highlight saved offline, will sync when online');
      }

      return highlight;
    } catch (err) {
      console.error('Error saving highlight:', err);
      throw err;
    }
  }, [bookId, networkStatus.fullyOnline]);

  // Update bookmark
  const saveBookmark = useCallback(async (page) => {
    if (!bookId) return;

    try {
      await queueAction(SYNC_ACTIONS.UPDATE_BOOKMARK, {
        bookId,
        page,
        timestamp: Date.now(),
      });

      if (!networkStatus.fullyOnline) {
        console.warn('🔖 Bookmark saved offline, will sync when online');
      }
    } catch (err) {
      console.error('Error saving bookmark:', err);
      throw err;
    }
  }, [bookId, networkStatus.fullyOnline]);

  return {
    // Book data
    bookData,
    isCached,
    isLoading,
    error,

    // Network status
    isOnline: networkStatus.isOnline,
    isOffline: networkStatus.isOffline,
    serverReachable: networkStatus.serverReachable,

    // Book caching
    downloadBook,
    removeOfflineBook,

    // Reading actions (all work offline)
    saveProgress,
    saveNote,
    updateNote,
    deleteNote,
    getNotes,
    saveHighlight,
    saveBookmark,
  };
}

export default useOfflineReading;
