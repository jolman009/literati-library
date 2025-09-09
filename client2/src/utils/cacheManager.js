// src/utils/cacheManager.js
// Advanced client-side caching system with intelligent invalidation

/**
 * Multi-layer caching system for optimal performance
 * Layers: Memory -> LocalStorage -> IndexedDB -> Network
 */
export class CacheManager {
  constructor() {
    this.memoryCache = new Map();
    this.memoryTtl = new Map();
    this.defaultTtl = {
      books: 10 * 60 * 1000,      // 10 minutes
      covers: 24 * 60 * 60 * 1000, // 24 hours  
      sessions: 5 * 60 * 1000,     // 5 minutes
      notes: 15 * 60 * 1000,       // 15 minutes
      stats: 30 * 60 * 1000        // 30 minutes
    };
    this.maxMemorySize = 50; // Maximum items in memory cache
    this.metrics = {
      hits: 0,
      misses: 0,
      stores: 0,
      invalidations: 0
    };
    
    // Initialize cache cleanup
    this.initCleanup();
  }

  /**
   * Get cache key with user context
   */
  getCacheKey(type, identifier, userId = null) {
    const userPrefix = userId ? `u_${userId}_` : '';
    return `${userPrefix}${type}_${identifier}`;
  }

  /**
   * Check if cache entry is expired
   */
  isExpired(key) {
    const expiry = this.memoryTtl.get(key);
    return expiry && Date.now() > expiry;
  }

  /**
   * Get from memory cache
   */
  getFromMemory(key) {
    if (this.isExpired(key)) {
      this.memoryCache.delete(key);
      this.memoryTtl.delete(key);
      return null;
    }
    
    const value = this.memoryCache.get(key);
    if (value) {
      this.metrics.hits++;
      console.log(`💾 Memory cache hit: ${key}`);
      return value;
    }
    
    return null;
  }

  /**
   * Store in memory cache with TTL
   */
  setInMemory(key, value, ttl) {
    // Implement LRU eviction if cache is full
    if (this.memoryCache.size >= this.maxMemorySize) {
      const oldestKey = this.memoryCache.keys().next().value;
      this.memoryCache.delete(oldestKey);
      this.memoryTtl.delete(oldestKey);
    }
    
    this.memoryCache.set(key, value);
    this.memoryTtl.set(key, Date.now() + ttl);
    this.metrics.stores++;
  }

  /**
   * Get from localStorage with fallback
   */
  getFromStorage(key) {
    try {
      const item = localStorage.getItem(key);
      if (!item) return null;
      
      const { data, expiry, version = 1 } = JSON.parse(item);
      
      // Check version compatibility
      if (version !== this.getCacheVersion()) {
        localStorage.removeItem(key);
        return null;
      }
      
      if (expiry && Date.now() > expiry) {
        localStorage.removeItem(key);
        return null;
      }
      
      this.metrics.hits++;
      console.log(`💿 Storage cache hit: ${key}`);
      return data;
      
    } catch (error) {
      console.warn('Storage cache read error:', error);
      localStorage.removeItem(key);
      return null;
    }
  }

  /**
   * Store in localStorage with metadata
   */
  setInStorage(key, value, ttl) {
    try {
      const item = {
        data: value,
        expiry: Date.now() + ttl,
        version: this.getCacheVersion(),
        cached_at: new Date().toISOString()
      };
      
      localStorage.setItem(key, JSON.stringify(item));
      this.metrics.stores++;
      
    } catch (error) {
      console.warn('Storage cache write error:', error);
      // Handle quota exceeded by clearing old cache
      this.clearExpiredStorage();
    }
  }

  /**
   * Multi-layer cache get
   */
  async get(type, identifier, userId = null) {
    const key = this.getCacheKey(type, identifier, userId);
    
    // Layer 1: Memory cache (fastest)
    let value = this.getFromMemory(key);
    if (value) return value;
    
    // Layer 2: LocalStorage cache
    value = this.getFromStorage(key);
    if (value) {
      // Promote to memory cache
      const ttl = this.defaultTtl[type] || this.defaultTtl.books;
      this.setInMemory(key, value, ttl);
      return value;
    }
    
    // Layer 3: IndexedDB cache (for large data)
    if (['covers', 'files'].includes(type)) {
      value = await this.getFromIndexedDB(key);
      if (value) {
        this.setInMemory(key, value, this.defaultTtl[type]);
        return value;
      }
    }
    
    this.metrics.misses++;
    return null;
  }

  /**
   * Multi-layer cache set
   */
  async set(type, identifier, value, userId = null, customTtl = null) {
    const key = this.getCacheKey(type, identifier, userId);
    const ttl = customTtl || this.defaultTtl[type] || this.defaultTtl.books;
    
    // Store in memory
    this.setInMemory(key, value, ttl);
    
    // Store in localStorage for smaller data
    const dataSize = JSON.stringify(value).length;
    if (dataSize < 100000) { // 100KB limit for localStorage
      this.setInStorage(key, value, ttl);
    }
    
    // Store in IndexedDB for larger data
    if (['covers', 'files'].includes(type) || dataSize >= 100000) {
      await this.setInIndexedDB(key, value, ttl);
    }
    
    console.log(`💾 Cached: ${key} (${dataSize} bytes, ${ttl}ms TTL)`);
  }

  /**
   * Intelligent cache invalidation
   */
  invalidate(pattern, userId = null) {
    this.metrics.invalidations++;
    const userPrefix = userId ? `u_${userId}_` : '';
    const fullPattern = `${userPrefix}${pattern}`;
    
    // Clear from memory
    for (const [key] of this.memoryCache) {
      if (key.includes(fullPattern)) {
        this.memoryCache.delete(key);
        this.memoryTtl.delete(key);
      }
    }
    
    // Clear from localStorage
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.includes(fullPattern)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    console.log(`🗑️ Cache invalidated: ${fullPattern} (${keysToRemove.length} items)`);
  }

  /**
   * Smart cache warming for frequently accessed data
   */
  async warmCache(userId, priorities = ['books', 'stats']) {
    console.log(`🔥 Warming cache for user ${userId}...`);
    
    for (const priority of priorities) {
      try {
        switch (priority) {
          case 'books':
            // Pre-cache recent books
            const { fetchBooksWithCovers } = await import('../api/books');
            const books = await fetchBooksWithCovers(userId, { limit: 20 });
            if (books) {
              await this.set('books', 'recent', books, userId);
            }
            break;
            
          case 'stats':
            // Pre-cache reading statistics
            // Implementation depends on your stats API
            break;
        }
      } catch (error) {
        console.warn(`Cache warming failed for ${priority}:`, error);
      }
    }
  }

  /**
   * IndexedDB operations for large data
   */
  async getFromIndexedDB(key) {
    try {
      return new Promise((resolve, reject) => {
        const request = indexedDB.open('LiteratiCache', 1);
        
        request.onerror = () => resolve(null);
        
        request.onupgradeneeded = (event) => {
          const db = event.target.result;
          if (!db.objectStoreNames.contains('cache')) {
            db.createObjectStore('cache', { keyPath: 'key' });
          }
        };
        
        request.onsuccess = (event) => {
          const db = event.target.result;
          const transaction = db.transaction(['cache'], 'readonly');
          const store = transaction.objectStore('cache');
          const getRequest = store.get(key);
          
          getRequest.onsuccess = () => {
            const result = getRequest.result;
            if (result && (!result.expiry || Date.now() < result.expiry)) {
              resolve(result.data);
            } else {
              resolve(null);
            }
          };
          
          getRequest.onerror = () => resolve(null);
        };
      });
    } catch (error) {
      console.warn('IndexedDB get error:', error);
      return null;
    }
  }

  /**
   * Store in IndexedDB
   */
  async setInIndexedDB(key, value, ttl) {
    try {
      return new Promise((resolve, reject) => {
        const request = indexedDB.open('LiteratiCache', 1);
        
        request.onerror = () => resolve(false);
        
        request.onupgradeneeded = (event) => {
          const db = event.target.result;
          if (!db.objectStoreNames.contains('cache')) {
            db.createObjectStore('cache', { keyPath: 'key' });
          }
        };
        
        request.onsuccess = (event) => {
          const db = event.target.result;
          const transaction = db.transaction(['cache'], 'readwrite');
          const store = transaction.objectStore('cache');
          
          const item = {
            key,
            data: value,
            expiry: Date.now() + ttl,
            cached_at: new Date().toISOString()
          };
          
          store.put(item);
          resolve(true);
        };
      });
    } catch (error) {
      console.warn('IndexedDB set error:', error);
      return false;
    }
  }

  /**
   * Cache version for compatibility
   */
  getCacheVersion() {
    return 2; // Increment when cache structure changes
  }

  /**
   * Clear expired localStorage entries
   */
  clearExpiredStorage() {
    const keysToRemove = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('u_')) {
        try {
          const item = JSON.parse(localStorage.getItem(key));
          if (item.expiry && Date.now() > item.expiry) {
            keysToRemove.push(key);
          }
        } catch (error) {
          keysToRemove.push(key); // Remove malformed entries
        }
      }
    }
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
    console.log(`🧹 Cleaned ${keysToRemove.length} expired cache entries`);
  }

  /**
   * Initialize cleanup procedures
   */
  initCleanup() {
    // Clear expired entries on startup
    this.clearExpiredStorage();
    
    // Periodic cleanup every 10 minutes
    setInterval(() => {
      this.clearExpiredStorage();
      
      // Clear expired memory cache
      for (const [key] of this.memoryCache) {
        if (this.isExpired(key)) {
          this.memoryCache.delete(key);
          this.memoryTtl.delete(key);
        }
      }
    }, 10 * 60 * 1000);
  }

  /**
   * Get cache performance metrics
   */
  getMetrics() {
    const hitRate = this.metrics.hits + this.metrics.misses > 0 
      ? (this.metrics.hits / (this.metrics.hits + this.metrics.misses) * 100).toFixed(1)
      : '0';
    
    return {
      ...this.metrics,
      hitRate: `${hitRate}%`,
      memorySize: this.memoryCache.size,
      storageUsage: this.getStorageUsage()
    };
  }

  /**
   * Get storage usage statistics
   */
  getStorageUsage() {
    try {
      let totalSize = 0;
      let cacheCount = 0;
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('u_')) {
          totalSize += localStorage.getItem(key).length;
          cacheCount++;
        }
      }
      
      return {
        totalSize: Math.round(totalSize / 1024), // KB
        itemCount: cacheCount,
        available: this.getAvailableStorage()
      };
    } catch (error) {
      return { totalSize: 0, itemCount: 0, available: 0 };
    }
  }

  /**
   * Check available storage space
   */
  getAvailableStorage() {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      return navigator.storage.estimate().then(estimate => ({
        quota: Math.round(estimate.quota / 1024 / 1024), // MB
        usage: Math.round(estimate.usage / 1024 / 1024)   // MB
      }));
    }
    return Promise.resolve({ quota: '?', usage: '?' });
  }

  /**
   * Clear all cache data
   */
  clearAll() {
    // Clear memory
    this.memoryCache.clear();
    this.memoryTtl.clear();
    
    // Clear localStorage
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('u_')) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    // Clear IndexedDB
    indexedDB.deleteDatabase('LiteratiCache');
    
    console.log('🗑️ All cache data cleared');
    this.metrics = { hits: 0, misses: 0, stores: 0, invalidations: 0 };
  }
}

// Singleton instance
export const cacheManager = new CacheManager();

// Convenience functions
export const getCache = (type, identifier, userId) => 
  cacheManager.get(type, identifier, userId);

export const setCache = (type, identifier, value, userId, ttl) => 
  cacheManager.set(type, identifier, value, userId, ttl);

export const invalidateCache = (pattern, userId) => 
  cacheManager.invalidate(pattern, userId);

export const getCacheMetrics = () => 
  cacheManager.getMetrics();

// Make available globally for debugging
if (typeof window !== 'undefined') {
  window.cacheManager = cacheManager;
  console.log('🛠️ Cache manager available via window.cacheManager');
}