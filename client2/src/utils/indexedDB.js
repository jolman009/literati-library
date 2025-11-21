// src/utils/indexedDB.js
// IndexedDB wrapper for offline storage

const DB_NAME = 'ShelfQuestOfflineDB';
const DB_VERSION = 1;

// Store names
export const STORES = {
  BOOKS: 'books',              // Cached book content (PDF/EPUB)
  READING_PROGRESS: 'reading_progress',  // User's reading progress
  NOTES: 'notes',              // User notes and highlights
  SYNC_QUEUE: 'sync_queue',    // Offline actions to sync
  METADATA: 'metadata',        // Book metadata and covers
};

/**
 * Initialize IndexedDB database with all required stores
 */
export function initDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      // Books store - stores actual book content (files)
      if (!db.objectStoreNames.contains(STORES.BOOKS)) {
        const booksStore = db.createObjectStore(STORES.BOOKS, { keyPath: 'id' });
        booksStore.createIndex('bookId', 'bookId', { unique: false });
        booksStore.createIndex('lastAccessed', 'lastAccessed', { unique: false });
      }

      // Reading progress store
      if (!db.objectStoreNames.contains(STORES.READING_PROGRESS)) {
        const progressStore = db.createObjectStore(STORES.READING_PROGRESS, { keyPath: 'id', autoIncrement: true });
        progressStore.createIndex('bookId', 'bookId', { unique: false });
        progressStore.createIndex('timestamp', 'timestamp', { unique: false });
        progressStore.createIndex('synced', 'synced', { unique: false });
      }

      // Notes store
      if (!db.objectStoreNames.contains(STORES.NOTES)) {
        const notesStore = db.createObjectStore(STORES.NOTES, { keyPath: 'id', autoIncrement: true });
        notesStore.createIndex('bookId', 'bookId', { unique: false });
        notesStore.createIndex('timestamp', 'timestamp', { unique: false });
        notesStore.createIndex('synced', 'synced', { unique: false });
      }

      // Sync queue store - stores offline actions
      if (!db.objectStoreNames.contains(STORES.SYNC_QUEUE)) {
        const syncStore = db.createObjectStore(STORES.SYNC_QUEUE, { keyPath: 'id', autoIncrement: true });
        syncStore.createIndex('timestamp', 'timestamp', { unique: false });
        syncStore.createIndex('type', 'type', { unique: false });
        syncStore.createIndex('status', 'status', { unique: false });
      }

      // Metadata store - book info, covers, etc.
      if (!db.objectStoreNames.contains(STORES.METADATA)) {
        const metaStore = db.createObjectStore(STORES.METADATA, { keyPath: 'bookId' });
        metaStore.createIndex('title', 'title', { unique: false });
        metaStore.createIndex('cachedAt', 'cachedAt', { unique: false });
      }

      console.warn('📚 IndexedDB initialized with version', DB_VERSION);
    };
  });
}

/**
 * Generic function to add/update data in a store
 */
export async function setItem(storeName, data) {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.put(data);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Get item by key from store
 */
export async function getItem(storeName, key) {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.get(key);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Get all items from a store
 */
export async function getAllItems(storeName) {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Get items by index
 */
export async function getItemsByIndex(storeName, indexName, value) {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const index = store.index(indexName);
    const request = index.getAll(value);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Delete item from store
 */
export async function deleteItem(storeName, key) {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.delete(key);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Clear all items from a store
 */
export async function clearStore(storeName) {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.clear();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Get database size estimate
 */
export async function getStorageEstimate() {
  if ('storage' in navigator && 'estimate' in navigator.storage) {
    const estimate = await navigator.storage.estimate();
    return {
      usage: estimate.usage,
      quota: estimate.quota,
      percentage: (estimate.usage / estimate.quota * 100).toFixed(2),
      usageInMB: (estimate.usage / (1024 * 1024)).toFixed(2),
      quotaInMB: (estimate.quota / (1024 * 1024)).toFixed(2),
    };
  }
  return null;
}

/**
 * Check if storage is available
 */
export async function isStorageAvailable() {
  try {
    if (!('indexedDB' in window)) {
      return { available: false, reason: 'IndexedDB not supported' };
    }

    const estimate = await getStorageEstimate();
    if (estimate && estimate.percentage > 90) {
      return { available: false, reason: 'Storage quota exceeded', estimate };
    }

    return { available: true, estimate };
  } catch (error) {
    return { available: false, reason: error.message };
  }
}
