// src/services/bookCacheService.js
// Book caching service - proactively cache book content for offline reading

import { setItem, getItem, deleteItem, getAllItems, STORES } from '../utils/indexedDB';

const MAX_CACHED_BOOKS = 10; // Maximum number of books to keep cached
const CACHE_EXPIRY_DAYS = 30; // Remove cached books older than 30 days

/**
 * Cache a book's content for offline access
 */
export async function cacheBook(bookId, bookData) {
  try {
    const { url, title, author, coverUrl, fileType, fileSize: _fileSize } = bookData;

    console.warn(`📥 Caching book: ${title} (${bookId})`);

    // Fetch the book file
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch book: ${response.statusText}`);
    }

    // Get the blob
    const blob = await response.blob();

    // Store book content in IndexedDB
    const bookEntry = {
      id: `book_${bookId}`,
      bookId,
      blob,
      title,
      author,
      fileType,
      fileSize: blob.size,
      cachedAt: Date.now(),
      lastAccessed: Date.now(),
    };

    await setItem(STORES.BOOKS, bookEntry);

    // Store metadata separately for quick access
    const metadata = {
      bookId,
      title,
      author,
      coverUrl,
      fileType,
      fileSize: blob.size,
      cachedAt: Date.now(),
      isCached: true,
    };

    await setItem(STORES.METADATA, metadata);

    // Cache cover image if provided
    if (coverUrl) {
      await cacheResource(coverUrl, 'img-cache');
    }

    console.warn(`✅ Book cached successfully: ${title}`);

    // Check cache limits
    await enforceBookCacheLimit();

    return bookEntry;
  } catch (error) {
    console.error(`Failed to cache book ${bookId}:`, error);
    throw error;
  }
}

/**
 * Get cached book content
 */
export async function getCachedBook(bookId) {
  try {
    const bookEntry = await getItem(STORES.BOOKS, `book_${bookId}`);

    if (bookEntry) {
      // Update last accessed time
      bookEntry.lastAccessed = Date.now();
      await setItem(STORES.BOOKS, bookEntry);

      return bookEntry;
    }

    return null;
  } catch (error) {
    console.error(`Failed to get cached book ${bookId}:`, error);
    return null;
  }
}

/**
 * Check if a book is cached
 */
export async function isBookCached(bookId) {
  try {
    const metadata = await getItem(STORES.METADATA, bookId);
    return metadata?.isCached || false;
  } catch (error) {
    console.error(`Failed to check if book ${bookId} is cached:`, error);
    return false;
  }
}

/**
 * Remove a book from cache
 */
export async function uncacheBook(bookId) {
  try {
    await deleteItem(STORES.BOOKS, `book_${bookId}`);

    const metadata = await getItem(STORES.METADATA, bookId);
    if (metadata) {
      metadata.isCached = false;
      await setItem(STORES.METADATA, metadata);
    }

    console.warn(`🗑️ Book ${bookId} removed from cache`);
  } catch (error) {
    console.error(`Failed to uncache book ${bookId}:`, error);
  }
}

/**
 * Get all cached books
 */
export async function getAllCachedBooks() {
  try {
    const books = await getAllItems(STORES.BOOKS);
    return books.sort((a, b) => b.lastAccessed - a.lastAccessed);
  } catch (error) {
    console.error('Failed to get all cached books:', error);
    return [];
  }
}

/**
 * Enforce cache limits - remove least recently accessed books
 */
export async function enforceBookCacheLimit() {
  try {
    const cachedBooks = await getAllCachedBooks();

    if (cachedBooks.length > MAX_CACHED_BOOKS) {
      // Sort by last accessed (oldest first)
      const booksToRemove = cachedBooks
        .sort((a, b) => a.lastAccessed - b.lastAccessed)
        .slice(0, cachedBooks.length - MAX_CACHED_BOOKS);

      console.warn(`🗑️ Removing ${booksToRemove.length} old cached books to enforce limit`);

      for (const book of booksToRemove) {
        await uncacheBook(book.bookId);
      }
    }
  } catch (error) {
    console.error('Failed to enforce book cache limit:', error);
  }
}

/**
 * Clean up expired cached books
 */
export async function cleanupExpiredBooks() {
  try {
    const cachedBooks = await getAllCachedBooks();
    const now = Date.now();
    const expiryMs = CACHE_EXPIRY_DAYS * 24 * 60 * 60 * 1000;

    const expiredBooks = cachedBooks.filter(book => {
      return (now - book.cachedAt) > expiryMs;
    });

    if (expiredBooks.length > 0) {
      console.warn(`🗑️ Cleaning up ${expiredBooks.length} expired cached books`);

      for (const book of expiredBooks) {
        await uncacheBook(book.bookId);
      }
    }
  } catch (error) {
    console.error('Failed to cleanup expired books:', error);
  }
}

/**
 * Get cache statistics
 */
export async function getCacheStats() {
  try {
    const books = await getAllCachedBooks();
    const totalSize = books.reduce((sum, book) => sum + (book.fileSize || 0), 0);

    return {
      totalBooks: books.length,
      totalSizeBytes: totalSize,
      totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2),
      oldestCache: books.length > 0 ? new Date(Math.min(...books.map(b => b.cachedAt))) : null,
      newestCache: books.length > 0 ? new Date(Math.max(...books.map(b => b.cachedAt))) : null,
      books: books.map(b => ({
        id: b.bookId,
        title: b.title,
        sizeMB: (b.fileSize / (1024 * 1024)).toFixed(2),
        cachedAt: new Date(b.cachedAt),
        lastAccessed: new Date(b.lastAccessed),
      })),
    };
  } catch (error) {
    console.error('Failed to get cache stats:', error);
    return null;
  }
}

/**
 * Preload a book for offline reading (download in background)
 */
export async function preloadBook(bookId, bookData, options = {}) {
  const { priority = false } = options;

  try {
    // Check if already cached
    const isCached = await isBookCached(bookId);
    if (isCached && !options.force) {
      console.warn(`📚 Book ${bookId} already cached`);
      return;
    }

    if (priority) {
      // Immediate caching
      return await cacheBook(bookId, bookData);
    } else {
      // Background caching - use requestIdleCallback if available
      if ('requestIdleCallback' in window) {
        requestIdleCallback(async () => {
          await cacheBook(bookId, bookData);
        }, { timeout: 10000 });
      } else {
        // Fallback to setTimeout
        setTimeout(async () => {
          await cacheBook(bookId, bookData);
        }, 1000);
      }
    }
  } catch (error) {
    console.error(`Failed to preload book ${bookId}:`, error);
  }
}

/**
 * Cache a resource in service worker cache
 */
async function cacheResource(url, cacheName) {
  try {
    if ('caches' in window) {
      const cache = await caches.open(cacheName);
      await cache.add(url);
    }
  } catch (error) {
    console.error(`Failed to cache resource ${url}:`, error);
  }
}

/**
 * Batch cache multiple books
 */
export async function batchCacheBooks(books, options = {}) {
  const { maxConcurrent = 2, onProgress } = options;

  console.warn(`📥 Batch caching ${books.length} books...`);

  const results = [];
  const chunks = [];

  // Split into chunks for concurrent processing
  for (let i = 0; i < books.length; i += maxConcurrent) {
    chunks.push(books.slice(i, i + maxConcurrent));
  }

  for (const chunk of chunks) {
    const chunkResults = await Promise.allSettled(
      chunk.map(book => cacheBook(book.id, book))
    );

    results.push(...chunkResults);

    if (onProgress) {
      onProgress({
        completed: results.length,
        total: books.length,
        percentage: (results.length / books.length * 100).toFixed(1),
      });
    }
  }

  const successful = results.filter(r => r.status === 'fulfilled').length;
  const failed = results.filter(r => r.status === 'rejected').length;

  console.warn(`✅ Batch cache complete: ${successful} successful, ${failed} failed`);

  return {
    total: books.length,
    successful,
    failed,
    results,
  };
}
