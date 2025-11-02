// src/api/cachedApi.js
// API wrapper with intelligent caching and offline support

import API from '../config/api.js';
import environmentConfig from '../config/environment.js';
import { cacheManager } from '../utils/cacheManager.js';
import { measureCustomMetric } from '../utils/webVitals.js';

/**
 * Cached API service with offline-first capabilities
 */
export class CachedApiService {
  constructor() {
    this.isOnline = navigator.onLine;
    this.requestQueue = [];
    this.maxRetries = 3;
    
    // Listen for online/offline events
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.processQueue();
    });
    
    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  /**
   * Make API request with caching and offline support
   */
  async request(config, cacheConfig = {}) {
    const startTime = performance.now();
    const {
      cacheKey,
      cacheTtl,
      cacheType = 'api',
      useCache = true,
      userId = this.getCurrentUserId(),
      invalidatePattern = null
    } = cacheConfig;

    // Try cache first (if enabled and online is not required)
    if (useCache && cacheKey && config.method === 'GET') {
      const cached = await cacheManager.get(cacheType, cacheKey, userId);
      if (cached) {
        measureCustomMetric(`API_CACHE_HIT_${cacheKey}`, startTime);
        console.log(`💾 API cache hit: ${cacheKey}`);
        return { data: cached, fromCache: true };
      }
    }

    // Handle offline requests
    if (!this.isOnline) {
      if (config.method === 'GET' && cacheKey) {
        // Return stale cache if available
        const staleCache = await this.getStaleCache(cacheType, cacheKey, userId);
        if (staleCache) {
          console.log(`📱 Offline: returning stale cache for ${cacheKey}`);
          return { data: staleCache, fromCache: true, stale: true };
        }
      } else if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(config.method)) {
        // Queue mutation requests for when online
        return this.queueRequest(config, cacheConfig);
      }
      
      throw new Error('No network connection and no cached data available');
    }

    // Make network request
    try {
      const response = await API(config);
      const duration = measureCustomMetric(`API_REQUEST_${cacheKey || 'unknown'}`, startTime);
      
      // Cache successful GET responses
      if (useCache && cacheKey && config.method === 'GET' && response.data) {
        await cacheManager.set(cacheType, cacheKey, response.data, userId, cacheTtl);
      }
      
      // Invalidate related cache on mutations
      if (invalidatePattern && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(config.method)) {
        cacheManager.invalidate(invalidatePattern, userId);
      }
      
      console.log(`⚡ API request: ${config.url} (${Math.round(duration)}ms)`);
      return response;
      
    } catch (error) {
      // Return stale cache on error if available
      if (config.method === 'GET' && cacheKey) {
        const staleCache = await this.getStaleCache(cacheType, cacheKey, userId);
        if (staleCache) {
          console.warn(`⚠️ API error: returning stale cache for ${cacheKey}`, error.message);
          return { data: staleCache, fromCache: true, stale: true, error: error.message };
        }
      }
      
      throw error;
    }
  }

  /**
   * Books API with intelligent caching
   */
  async getBooks(options = {}) {
    const { limit = 50, offset = 0, status, genre } = options;
    const cacheKey = `list_${JSON.stringify({ limit, offset, status, genre })}`;
    
    return this.request({
      method: 'GET',
      url: '/books',
      params: options
    }, {
      cacheKey,
      cacheType: 'books',
      cacheTtl: 10 * 60 * 1000, // 10 minutes
      useCache: true
    });
  }

  /**
   * Get single book with caching
   */
  async getBook(bookId) {
    return this.request({
      method: 'GET',
      url: `/books/${bookId}`
    }, {
      cacheKey: bookId,
      cacheType: 'books',
      cacheTtl: 30 * 60 * 1000, // 30 minutes
      useCache: true
    });
  }

  /**
   * Update book with cache invalidation
   */
  async updateBook(bookId, updates) {
    return this.request({
      method: 'PATCH',
      url: `/books/${bookId}`,
      data: updates
    }, {
      invalidatePattern: 'books',
      useCache: false
    });
  }

  /**
   * Get reading sessions with caching
   */
  async getReadingSessions(options = {}) {
    const cacheKey = `sessions_${JSON.stringify(options)}`;
    
    return this.request({
      method: 'GET',
      url: '/reading/sessions',
      params: options
    }, {
      cacheKey,
      cacheType: 'sessions',
      cacheTtl: 5 * 60 * 1000, // 5 minutes
      useCache: true
    });
  }

  /**
   * Create reading session with cache invalidation
   */
  async createReadingSession(sessionData) {
    return this.request({
      method: 'POST',
      url: '/reading/session',
      data: sessionData
    }, {
      invalidatePattern: 'sessions',
      useCache: false
    });
  }

  /**
   * Get notes with caching
   */
  async getNotes(bookId, options = {}) {
    const cacheKey = `notes_${bookId}_${JSON.stringify(options)}`;
    
    return this.request({
      method: 'GET',
      url: `/notes/${bookId}`,
      params: options
    }, {
      cacheKey,
      cacheType: 'notes',
      cacheTtl: 15 * 60 * 1000, // 15 minutes
      useCache: true
    });
  }

  /**
   * Create note with cache invalidation
   */
  async createNote(noteData) {
    return this.request({
      method: 'POST',
      url: '/notes',
      data: noteData
    }, {
      invalidatePattern: `notes_${noteData.book_id}`,
      useCache: false
    });
  }

  /**
   * Batch operations with intelligent caching
   */
  async batchUpdateBooks(updates) {
    const promises = updates.map(({ id, data }) => 
      this.updateBook(id, data)
    );
    
    const results = await Promise.allSettled(promises);
    
    // Invalidate all book caches after batch operation
    cacheManager.invalidate('books', this.getCurrentUserId());
    
    return results;
  }

  /**
   * Prefetch commonly accessed data
   */
  async prefetchData(userId) {
    console.log('🔄 Prefetching critical data...');
    
    const prefetchPromises = [
      // Recent books
      this.getBooks({ limit: 20 }).catch(e => console.warn('Prefetch books failed:', e)),
      
      // Reading sessions for stats
      this.getReadingSessions({ limit: 30 }).catch(e => console.warn('Prefetch sessions failed:', e))
    ];
    
    await Promise.allSettled(prefetchPromises);
    console.log('✅ Data prefetching completed');
  }

  /**
   * Get stale cache (expired but potentially useful)
   */
  async getStaleCache(cacheType, identifier, userId) {
    try {
      // Check localStorage for expired entries
      const key = cacheManager.getCacheKey(cacheType, identifier, userId);
      const item = localStorage.getItem(key);
      
      if (item) {
        const { data } = JSON.parse(item);
        return data;
      }
      
      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Queue requests for offline processing
   */
  async queueRequest(config, cacheConfig) {
    const queueItem = {
      id: Date.now() + Math.random(),
      config,
      cacheConfig,
      timestamp: Date.now(),
      retries: 0
    };
    
    this.requestQueue.push(queueItem);
    console.log(`📥 Request queued: ${config.method} ${config.url}`);
    
    // Save queue to localStorage for persistence
    try {
      localStorage.setItem('api_request_queue', JSON.stringify(this.requestQueue));
    } catch (error) {
      console.warn('Failed to persist request queue:', error);
    }
    
    return {
      queued: true,
      queueId: queueItem.id,
      message: 'Request queued for when online'
    };
  }

  /**
   * Process queued requests when online
   */
  async processQueue() {
    if (this.requestQueue.length === 0) return;
    
    console.log(`🔄 Processing ${this.requestQueue.length} queued requests...`);
    
    const processPromises = this.requestQueue.map(async (queueItem) => {
      try {
        const result = await this.request(queueItem.config, queueItem.cacheConfig);
        console.log(`✅ Processed queued request: ${queueItem.config.method} ${queueItem.config.url}`);
        return { success: true, queueId: queueItem.id, result };
      } catch (error) {
        queueItem.retries++;
        
        if (queueItem.retries < this.maxRetries) {
          console.warn(`⚠️ Queued request failed, will retry: ${error.message}`);
          return { success: false, queueId: queueItem.id, retry: true };
        } else {
          console.error(`❌ Queued request failed permanently: ${error.message}`);
          return { success: false, queueId: queueItem.id, error: error.message };
        }
      }
    });
    
    const results = await Promise.allSettled(processPromises);
    
    // Remove processed requests
    this.requestQueue = this.requestQueue.filter(item => {
      const result = results.find(r => r.value?.queueId === item.id);
      return result?.value?.retry === true;
    });
    
    // Update localStorage
    try {
      localStorage.setItem('api_request_queue', JSON.stringify(this.requestQueue));
    } catch (error) {
      console.warn('Failed to persist updated queue:', error);
    }
    
    console.log(`✅ Queue processing completed. ${this.requestQueue.length} items remaining.`);
  }

  /**
   * Get current user ID from auth context
   */
  getCurrentUserId() {
    // Try to get from localStorage token
    try {
      const token = localStorage.getItem(environmentConfig.getTokenKey()) || localStorage.getItem('shelfquest_token');
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.sub || payload.user_id || payload.id;
      }
    } catch (error) {
      console.warn('Failed to extract user ID from token');
    }
    
    return null;
  }

  /**
   * Get API performance metrics
   */
  getMetrics() {
    return {
      isOnline: this.isOnline,
      queueSize: this.requestQueue.length,
      cacheMetrics: cacheManager.getMetrics()
    };
  }

  /**
   * Clear all API caches
   */
  clearCache() {
    cacheManager.invalidate('', this.getCurrentUserId());
    console.log('🗑️ All API caches cleared');
  }
}

// Singleton instance
export const cachedApi = new CachedApiService();

// Initialize queue from localStorage on startup
try {
  const savedQueue = localStorage.getItem('api_request_queue');
  if (savedQueue) {
    cachedApi.requestQueue = JSON.parse(savedQueue);
    console.log(`📥 Restored ${cachedApi.requestQueue.length} queued requests from storage`);
  }
} catch (error) {
  console.warn('Failed to restore request queue from storage:', error);
}

// Export convenience functions
export const getCachedBooks = (options) => cachedApi.getBooks(options);
export const getCachedBook = (bookId) => cachedApi.getBook(bookId);
export const updateCachedBook = (bookId, updates) => cachedApi.updateBook(bookId, updates);
export const getCachedSessions = (options) => cachedApi.getReadingSessions(options);
export const createCachedSession = (data) => cachedApi.createReadingSession(data);
export const prefetchAppData = (userId) => cachedApi.prefetchData(userId);
export const getApiMetrics = () => cachedApi.getMetrics();

export default cachedApi;
