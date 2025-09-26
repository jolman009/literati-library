// src/services/bookStorageService.js
import environmentConfig from '../config/environment.js';

class BookStorageService {
  constructor() {
    this.cache = new Map();
    this.indexedDB = null;
    this.config = environmentConfig;
    this.initIndexedDB();
  }

  // Initialize IndexedDB for offline storage
  async initIndexedDB() {
    try {
      return new Promise((resolve, reject) => {
        const request = indexedDB.open(this.config.storage.indexedDbName, this.config.storage.indexedDbVersion);
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          this.indexedDB = request.result;
          resolve(this.indexedDB);
        };
        
        request.onupgradeneeded = (event) => {
          const db = event.target.result;
          
          // Books store
          if (!db.objectStoreNames.contains('books')) {
            const booksStore = db.createObjectStore('books', { 
              keyPath: 'id' 
            });
            booksStore.createIndex('user_id', 'user_id');
            booksStore.createIndex('title', 'title');
            booksStore.createIndex('author', 'author');
          }
          
          // Upload queue store
          if (!db.objectStoreNames.contains('upload-queue')) {
            const queueStore = db.createObjectStore('upload-queue', { 
              keyPath: 'id',
              autoIncrement: true 
            });
            queueStore.createIndex('timestamp', 'timestamp');
          }
          
          // Offline data store
          if (!db.objectStoreNames.contains('offline-data')) {
            db.createObjectStore('offline-data', { keyPath: 'key' });
          }
        };
      });
    } catch (error) {
      console.error('Failed to initialize IndexedDB:', error);
    }
  }

  // Get API base URL from centralized configuration
  getApiBaseUrl() {
    return this.config.apiUrl;
  }

  // Get authentication token using centralized configuration
  getAuthToken() {
    try {
      const tokenKey = this.config.getTokenKey();
      return localStorage.getItem(tokenKey) || sessionStorage.getItem(tokenKey);
    } catch (error) {
      console.error('Failed to get auth token:', error);
      return null;
    }
  }

  // Make authenticated API request
  async makeAuthenticatedRequest(endpoint, options = {}) {
    const token = this.getAuthToken();
    
    if (!token) {
      throw new Error('No authentication token found. Please log in again.');
    }

    const baseUrl = this.getApiBaseUrl();
    const url = `${baseUrl}${endpoint}`;

    const defaultOptions = {
      headers: {
        ...this.config.getAuthHeaders(token),
        ...options.headers
      }
    };

    const requestOptions = { ...defaultOptions, ...options };

    try {
      const response = await fetch(url, requestOptions);
      
      if (response.status === 401) {
        // Token expired, redirect to login
        this.handleAuthError();
        throw new Error('Session expired. Please log in again.');
      }
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Request failed: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  // Handle authentication errors
  handleAuthError() {
    try {
      const tokenKey = this.config.getTokenKey();
      localStorage.removeItem(tokenKey);
      sessionStorage.removeItem(tokenKey);
      localStorage.removeItem('user');
      // Redirect to login
      window.location.href = '/login';
    } catch (error) {
      console.error('Failed to handle auth error:', error);
    }
  }

  // Store book in IndexedDB cache
  async storeBooksInCache(books) {
    if (!this.indexedDB) await this.initIndexedDB();
    
    try {
      const transaction = this.indexedDB.transaction(['books'], 'readwrite');
      const store = transaction.objectStore('books');
      
      for (const book of books) {
        await store.put({
          ...book,
          cached_at: Date.now()
        });
      }
      
      console.log(`Cached ${books.length} books locally`);
    } catch (error) {
      console.error('Failed to cache books:', error);
    }
  }

  // Retrieve books from cache
  async getBooksFromCache() {
    if (!this.indexedDB) await this.initIndexedDB();
    
    try {
      const transaction = this.indexedDB.transaction(['books'], 'readonly');
      const store = transaction.objectStore('books');
      
      return new Promise((resolve, reject) => {
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Failed to get books from cache:', error);
      return [];
    }
  }

  // Fetch all books with caching
  async fetchBooks(forceRefresh = false) {
    try {
      // Try cache first if not forcing refresh
      if (!forceRefresh) {
        const cachedBooks = await this.getBooksFromCache();
        if (cachedBooks.length > 0) {
          console.log(`Loaded ${cachedBooks.length} books from cache`);
          return cachedBooks;
        }
      }

      // Fetch from API
      console.log('Fetching books from API...');
      const books = await this.makeAuthenticatedRequest('/books');
      
      // Cache the results
      await this.storeBooksInCache(books);
      
      console.log(`Fetched ${books.length} books from API`);
      return books;
    } catch (error) {
      console.error('Failed to fetch books:', error);
      
      // Try to return cached data as fallback
      const cachedBooks = await this.getBooksFromCache();
      if (cachedBooks.length > 0) {
        console.warn('API failed, returning cached books');
        return cachedBooks;
      }
      
      throw error;
    }
  }

  // Upload book file
  async uploadBook(bookFile, metadata = {}) {
    try {
      const formData = new FormData();
      formData.append('book', bookFile);
      
      // Add metadata
      Object.keys(metadata).forEach(key => {
        if (metadata[key] !== undefined && metadata[key] !== null) {
          formData.append(key, metadata[key]);
        }
      });

      const token = this.getAuthToken();
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${this.getApiBaseUrl()}/books/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
          // Don't set Content-Type for FormData
        },
        body: formData
      });

      if (response.status === 401) {
        this.handleAuthError();
        throw new Error('Session expired. Please log in again.');
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Upload failed: ${response.status}`);
      }

      const result = await response.json();
      console.log('Book uploaded successfully:', result);
      
      // Clear cache to force refresh
      await this.clearBooksCache();
      
      return result;
    } catch (error) {
      console.error('Upload failed:', error);
      
      // Queue for retry if offline
      if (!navigator.onLine) {
        await this.queueUploadForRetry(bookFile, metadata);
        throw new Error('Upload queued for when you\'re back online');
      }
      
      throw error;
    }
  }

  // Queue upload for retry when online
  async queueUploadForRetry(bookFile, metadata) {
    if (!this.indexedDB) await this.initIndexedDB();
    
    try {
      const transaction = this.indexedDB.transaction(['upload-queue'], 'readwrite');
      const store = transaction.objectStore('upload-queue');
      
      // Convert file to base64 for storage
      const fileData = await this.fileToBase64(bookFile);
      
      const queueItem = {
        file: fileData,
        metadata,
        timestamp: Date.now(),
        fileName: bookFile.name,
        fileType: bookFile.type,
        fileSize: bookFile.size
      };
      
      await store.add(queueItem);
      console.log('Upload queued for retry');
    } catch (error) {
      console.error('Failed to queue upload:', error);
    }
  }

  // Convert file to base64
  async fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // Process queued uploads
  async processQueuedUploads() {
    if (!this.indexedDB) await this.initIndexedDB();
    
    try {
      const transaction = this.indexedDB.transaction(['upload-queue'], 'readwrite');
      const store = transaction.objectStore('upload-queue');
      
      const queuedItems = await new Promise((resolve, reject) => {
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });

      for (const item of queuedItems) {
        try {
          // Convert base64 back to file
          const file = await this.base64ToFile(item.file, item.fileName, item.fileType);
          
          // Try upload
          await this.uploadBook(file, item.metadata);
          
          // Remove from queue on success
          await store.delete(item.id);
          console.log('Queued upload completed:', item.fileName);
        } catch (error) {
          console.error('Failed to process queued upload:', error);
        }
      }
    } catch (error) {
      console.error('Failed to process upload queue:', error);
    }
  }

  // Convert base64 to file
  async base64ToFile(base64Data, fileName, fileType) {
    const response = await fetch(base64Data);
    const blob = await response.blob();
    return new File([blob], fileName, { type: fileType });
  }

  // Update book
  async updateBook(bookId, updates) {
    try {
      const result = await this.makeAuthenticatedRequest(`/books/${bookId}`, {
        method: 'PUT',
        body: JSON.stringify(updates)
      });
      
      // Update cache
      await this.updateBookInCache(result);
      
      return result;
    } catch (error) {
      console.error('Failed to update book:', error);
      throw error;
    }
  }

  // Delete book
  async deleteBook(bookId) {
    try {
      await this.makeAuthenticatedRequest(`/books/${bookId}`, {
        method: 'DELETE'
      });
      
      // Remove from cache
      await this.removeBookFromCache(bookId);
      
      return true;
    } catch (error) {
      console.error('Failed to delete book:', error);
      throw error;
    }
  }

  // Update book in cache
  async updateBookInCache(book) {
    if (!this.indexedDB) await this.initIndexedDB();
    
    try {
      const transaction = this.indexedDB.transaction(['books'], 'readwrite');
      const store = transaction.objectStore('books');
      await store.put({ ...book, cached_at: Date.now() });
    } catch (error) {
      console.error('Failed to update book in cache:', error);
    }
  }

  // Remove book from cache
  async removeBookFromCache(bookId) {
    if (!this.indexedDB) await this.initIndexedDB();
    
    try {
      const transaction = this.indexedDB.transaction(['books'], 'readwrite');
      const store = transaction.objectStore('books');
      await store.delete(bookId);
    } catch (error) {
      console.error('Failed to remove book from cache:', error);
    }
  }

  // Clear books cache
  async clearBooksCache() {
    if (!this.indexedDB) await this.initIndexedDB();
    
    try {
      const transaction = this.indexedDB.transaction(['books'], 'readwrite');
      const store = transaction.objectStore('books');
      await store.clear();
      console.log('Books cache cleared');
    } catch (error) {
      console.error('Failed to clear books cache:', error);
    }
  }

  // Check network status and sync
  async syncWhenOnline() {
    if (navigator.onLine) {
      try {
        await this.processQueuedUploads();
        await this.fetchBooks(true); // Force refresh
      } catch (error) {
        console.error('Sync failed:', error);
      }
    }
  }
}

// Create singleton instance
export const bookStorageService = new BookStorageService();

// Listen for online events
window.addEventListener('online', () => {
  console.log('Back online, syncing data...');
  bookStorageService.syncWhenOnline();
});

export default bookStorageService;