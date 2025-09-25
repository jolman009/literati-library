/**
 * Advanced caching service with Redis-like functionality and intelligent invalidation
 * Implements multiple caching layers for optimal database performance
 */

import { supabase } from '../config/supabaseClient.js';

// Cache tiers with different TTL and size limits
const CACHE_TIERS = {
  HOT: { ttl: 60 * 1000, maxSize: 100 },        // 1 minute - frequently accessed
  WARM: { ttl: 300 * 1000, maxSize: 500 },      // 5 minutes - regular access
  COLD: { ttl: 1800 * 1000, maxSize: 1000 },    // 30 minutes - infrequent access
  FROZEN: { ttl: 3600 * 1000, maxSize: 200 }    // 1 hour - static data
};

class AdvancedCacheManager {
  constructor() {
    this.caches = {
      hot: new Map(),
      warm: new Map(),
      cold: new Map(),
      frozen: new Map()
    };

    this.accessCount = new Map();
    this.hitRates = new Map();
    this.evictionCount = 0;
    this.compressionEnabled = true;

    // Start cache maintenance
    this.startMaintenanceTimer();
    this.setupPerformanceMonitoring();
  }

  /**
   * Intelligent cache tier selection based on access patterns
   */
  determineCacheTier(key, data) {
    const accessCount = this.accessCount.get(key) || 0;
    const dataSize = JSON.stringify(data).length;

    // Frequent access -> HOT
    if (accessCount > 10) return 'hot';

    // Large data -> COLD (to avoid memory pressure)
    if (dataSize > 10000) return 'cold';

    // Static data patterns -> FROZEN
    if (key.includes('_stats_') || key.includes('_config_')) return 'frozen';

    // Default to WARM
    return 'warm';
  }

  /**
   * Set cache entry with automatic tier selection
   */
  set(key, data, tier = null) {
    const selectedTier = tier || this.determineCacheTier(key, data);
    const cache = this.caches[selectedTier];
    const config = CACHE_TIERS[selectedTier.toUpperCase()];

    // Implement LRU eviction if cache is full
    if (cache.size >= config.maxSize) {
      const oldestKey = cache.keys().next().value;
      cache.delete(oldestKey);
      this.evictionCount++;
    }

    // Compress large data if enabled
    let processedData = data;
    if (this.compressionEnabled && JSON.stringify(data).length > 1000) {
      processedData = this.compressData(data);
    }

    cache.set(key, {
      data: processedData,
      timestamp: Date.now(),
      tier: selectedTier,
      compressed: processedData !== data,
      hits: 0
    });

    console.log(`📦 Cached [${selectedTier.toUpperCase()}]: ${key}`);
  }

  /**
   * Get cache entry with automatic promotion/demotion
   */
  get(key) {
    for (const [tierName, cache] of Object.entries(this.caches)) {
      const entry = cache.get(key);
      if (entry) {
        const config = CACHE_TIERS[tierName.toUpperCase()];

        // Check if expired
        if (Date.now() - entry.timestamp > config.ttl) {
          cache.delete(key);
          console.log(`⏰ Cache expired [${tierName.toUpperCase()}]: ${key}`);
          return null;
        }

        // Update access statistics
        entry.hits++;
        this.accessCount.set(key, (this.accessCount.get(key) || 0) + 1);

        // Decompress if needed
        const data = entry.compressed ? this.decompressData(entry.data) : entry.data;

        // Promote frequently accessed items to hotter tiers
        if (entry.hits > 5 && tierName !== 'hot') {
          this.promoteToHotTier(key, data, entry);
        }

        console.log(`💾 Cache hit [${tierName.toUpperCase()}]: ${key} (${entry.hits} hits)`);
        return data;
      }
    }

    return null;
  }

  /**
   * Promote frequently accessed data to hot tier
   */
  promoteToHotTier(key, data, originalEntry) {
    // Remove from current tier
    for (const cache of Object.values(this.caches)) {
      cache.delete(key);
    }

    // Add to hot tier
    this.set(key, data, 'hot');
    console.log(`🔥 Promoted to HOT tier: ${key}`);
  }

  /**
   * Simple compression for large data objects
   */
  compressData(data) {
    // Simple string compression - in production, use a proper compression library
    try {
      const jsonString = JSON.stringify(data);
      return {
        _compressed: true,
        data: jsonString
      };
    } catch (error) {
      return data;
    }
  }

  /**
   * Decompress data
   */
  decompressData(compressedData) {
    try {
      if (compressedData._compressed) {
        return JSON.parse(compressedData.data);
      }
      return compressedData;
    } catch (error) {
      return compressedData;
    }
  }

  /**
   * Intelligent cache invalidation with pattern matching
   */
  invalidate(pattern) {
    let invalidatedCount = 0;

    for (const [tierName, cache] of Object.entries(this.caches)) {
      for (const [key] of cache) {
        if (this.matchesPattern(key, pattern)) {
          cache.delete(key);
          invalidatedCount++;
        }
      }
    }

    console.log(`🗑️ Invalidated ${invalidatedCount} cache entries matching: ${pattern}`);
    return invalidatedCount;
  }

  /**
   * Pattern matching for cache keys
   */
  matchesPattern(key, pattern) {
    if (typeof pattern === 'string') {
      return key.includes(pattern);
    }
    if (pattern instanceof RegExp) {
      return pattern.test(key);
    }
    return false;
  }

  /**
   * Cache warming for predictable data access
   */
  async warmCache(userId, options = {}) {
    const { preloadBooks = true, preloadStats = true } = options;

    console.log(`🔥 Warming cache for user: ${userId}`);

    const warmingPromises = [];

    if (preloadBooks) {
      warmingPromises.push(this.preloadUserBooks(userId));
    }

    if (preloadStats) {
      warmingPromises.push(this.preloadUserStats(userId));
    }

    try {
      await Promise.all(warmingPromises);
      console.log(`✅ Cache warmed for user: ${userId}`);
    } catch (error) {
      console.error(`❌ Cache warming failed for user ${userId}:`, error);
    }
  }

  /**
   * Preload user's most accessed books
   */
  async preloadUserBooks(userId) {
    try {
      const { data: books } = await supabase
        .from('books')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (books) {
        this.set(`books_${userId}_recent`, books, 'warm');
        console.log(`📚 Preloaded ${books.length} books for user ${userId}`);
      }
    } catch (error) {
      console.error('Book preloading failed:', error);
    }
  }

  /**
   * Preload user statistics
   */
  async preloadUserStats(userId) {
    try {
      const { data: sessions } = await supabase
        .from('reading_sessions')
        .select('*')
        .eq('user_id', userId)
        .gte('session_date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .order('session_date', { ascending: false });

      if (sessions) {
        this.set(`reading_stats_${userId}_30`, sessions, 'cold');
        console.log(`📊 Preloaded reading stats for user ${userId}`);
      }
    } catch (error) {
      console.error('Stats preloading failed:', error);
    }
  }

  /**
   * Cache maintenance - cleanup expired entries
   */
  performMaintenance() {
    let cleanedCount = 0;

    for (const [tierName, cache] of Object.entries(this.caches)) {
      const config = CACHE_TIERS[tierName.toUpperCase()];
      const now = Date.now();

      for (const [key, entry] of cache) {
        if (now - entry.timestamp > config.ttl) {
          cache.delete(key);
          cleanedCount++;
        }
      }
    }

    if (cleanedCount > 0) {
      console.log(`🧹 Cache maintenance: cleaned ${cleanedCount} expired entries`);
    }
  }

  /**
   * Start automatic cache maintenance
   */
  startMaintenanceTimer() {
    setInterval(() => {
      this.performMaintenance();
    }, 60000); // Every minute
  }

  /**
   * Setup performance monitoring
   */
  setupPerformanceMonitoring() {
    setInterval(() => {
      this.calculateHitRates();
      this.logPerformanceMetrics();
    }, 300000); // Every 5 minutes
  }

  /**
   * Calculate cache hit rates
   */
  calculateHitRates() {
    for (const [tierName, cache] of Object.entries(this.caches)) {
      let totalHits = 0;
      let totalEntries = cache.size;

      for (const [, entry] of cache) {
        totalHits += entry.hits;
      }

      const avgHitRate = totalEntries > 0 ? totalHits / totalEntries : 0;
      this.hitRates.set(tierName, avgHitRate);
    }
  }

  /**
   * Get comprehensive cache statistics
   */
  getStatistics() {
    const stats = {
      timestamp: new Date().toISOString(),
      tiers: {},
      totalEntries: 0,
      evictionCount: this.evictionCount,
      memoryEstimate: 0
    };

    for (const [tierName, cache] of Object.entries(this.caches)) {
      const tierStats = {
        size: cache.size,
        maxSize: CACHE_TIERS[tierName.toUpperCase()].maxSize,
        utilization: (cache.size / CACHE_TIERS[tierName.toUpperCase()].maxSize * 100).toFixed(1),
        avgHitRate: this.hitRates.get(tierName) || 0,
        ttl: CACHE_TIERS[tierName.toUpperCase()].ttl / 1000 // in seconds
      };

      stats.tiers[tierName] = tierStats;
      stats.totalEntries += cache.size;

      // Rough memory estimate
      for (const [, entry] of cache) {
        stats.memoryEstimate += JSON.stringify(entry).length;
      }
    }

    stats.memoryEstimate = `${(stats.memoryEstimate / 1024).toFixed(1)} KB`;

    return stats;
  }

  /**
   * Log performance metrics
   */
  logPerformanceMetrics() {
    const stats = this.getStatistics();
    console.log('📊 Cache Performance Metrics:', {
      totalEntries: stats.totalEntries,
      memoryUsage: stats.memoryEstimate,
      hotTierUtilization: stats.tiers.hot?.utilization + '%',
      avgHitRate: Object.values(stats.tiers).reduce((sum, tier) => sum + tier.avgHitRate, 0) / 4
    });
  }

  /**
   * Clear all caches
   */
  clear() {
    for (const cache of Object.values(this.caches)) {
      cache.clear();
    }
    this.accessCount.clear();
    this.hitRates.clear();
    this.evictionCount = 0;
    console.log('🗑️ All caches cleared');
  }

  /**
   * Export cache for debugging
   */
  export() {
    const exportData = {
      timestamp: new Date().toISOString(),
      statistics: this.getStatistics(),
      accessCounts: Object.fromEntries(this.accessCount),
      hitRates: Object.fromEntries(this.hitRates)
    };

    return exportData;
  }
}

// Create singleton instance
export const advancedCache = new AdvancedCacheManager();

// Wrapper function for easy cache integration
export const withCache = (key, asyncFunction, tier = null) => {
  return async (...args) => {
    const fullKey = typeof key === 'function' ? key(...args) : key;

    // Try cache first
    const cached = advancedCache.get(fullKey);
    if (cached) {
      return cached;
    }

    // Execute function and cache result
    try {
      const result = await asyncFunction(...args);
      if (result && !result.error) {
        advancedCache.set(fullKey, result, tier);
      }
      return result;
    } catch (error) {
      console.error(`Function execution failed for key ${fullKey}:`, error);
      throw error;
    }
  };
};

export default advancedCache;