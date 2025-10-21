// src/services/database-optimization.js
// Database optimization service for improved query performance

import { supabase } from '../config/supabaseClient.js';
import { normalizeBookUpdate } from '../utils/bookStatus.js';

/**
 * Database Optimization Service
 * Implements optimized queries and caching strategies
 */
export class DatabaseOptimizer {
  constructor() {
    this.queryCache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    this.queryMetrics = new Map();
  }

  /**
   * Track query performance metrics
   */
  trackQuery(queryName, startTime, resultCount = 0) {
    const duration = Date.now() - startTime;
    
    if (!this.queryMetrics.has(queryName)) {
      this.queryMetrics.set(queryName, {
        count: 0,
        totalTime: 0,
        avgTime: 0,
        minTime: Infinity,
        maxTime: 0
      });
    }
    
    const metrics = this.queryMetrics.get(queryName);
    metrics.count += 1;
    metrics.totalTime += duration;
    metrics.avgTime = metrics.totalTime / metrics.count;
    metrics.minTime = Math.min(metrics.minTime, duration);
    metrics.maxTime = Math.max(metrics.maxTime, duration);
    metrics.lastResultCount = resultCount;
    
    // Log slow queries
    if (duration > 1000) {
      console.warn(`🐌 Slow query detected: ${queryName} took ${duration}ms`);
    }
    
    return duration;
  }

  /**
   * Get cached result or execute query with caching
   */
  async getCachedQuery(cacheKey, queryFunction) {
    const cached = this.queryCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      console.log(`💾 Cache hit: ${cacheKey}`);
      return cached.data;
    }
    
    const startTime = Date.now();
    const result = await queryFunction();
    const duration = Date.now() - startTime;
    
    // Cache successful results
    if (result && !result.error) {
      this.queryCache.set(cacheKey, {
        data: result,
        timestamp: Date.now()
      });
    }
    
    console.log(`⚡ Query executed: ${cacheKey} (${duration}ms)`);
    return result;
  }

  /**
   * Optimized book list query with intelligent caching
   */
  async getOptimizedBookList(userId, options = {}) {
    const startTime = Date.now();
    const {
      limit = 500,
      offset = 0,
      status = null,
      genre = null,
      orderBy = 'created_at',
      orderDirection = 'desc'
    } = options;
    
    const cacheKey = `books_${userId}_${JSON.stringify(options)}`;
    
    try {
      const result = await this.getCachedQuery(cacheKey, async () => {
        let query = supabase
          .from('books')
          // Request total count for pagination alongside paged data
          .select('*', { count: 'exact' })
          .eq('user_id', userId);
        
        // Add filters with optimized index usage
        if (status) {
          query = query.eq('status', status);
        }
        
        if (genre) {
          query = query.eq('genre', genre);
        }
        
        // Add ordering (stable) and pagination
        query = query
          .order(orderBy, { ascending: orderDirection === 'asc' })
          // Secondary stable ordering to avoid dupes/skips on ties
          .order('id', { ascending: orderDirection === 'asc' })
          .range(offset, offset + limit - 1);

        return await query;
      });
      
      this.trackQuery('getBookList', startTime, result.data?.length);
      return result;
      
    } catch (error) {
      console.error('Optimized book list query failed:', error);
      this.trackQuery('getBookList_ERROR', startTime);
      throw error;
    }
  }

  /**
   * Optimized reading session statistics
   */
  async getReadingSessionStats(userId, options = {}) {
    const startTime = Date.now();
    const {
      days = 30,
      bookId = null
    } = options;
    
    const cacheKey = `reading_stats_${userId}_${days}_${bookId || 'all'}`;
    
    try {
      const result = await this.getCachedQuery(cacheKey, async () => {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);
        const cutoffStr = cutoffDate.toISOString().split('T')[0];
        
        let query = supabase
          .from('reading_sessions')
          .select('*')
          .eq('user_id', userId)
          .gte('session_date', cutoffStr)
          .not('duration', 'is', null);
        
        if (bookId) {
          query = query.eq('book_id', bookId);
        }
        
        return await query.order('session_date', { ascending: false });
      });
      
      // Process statistics from raw data
      if (result.data) {
        const stats = this.calculateReadingStats(result.data);
        result.processedStats = stats;
      }
      
      this.trackQuery('getReadingStats', startTime, result.data?.length);
      return result;
      
    } catch (error) {
      console.error('Reading session stats query failed:', error);
      this.trackQuery('getReadingStats_ERROR', startTime);
      throw error;
    }
  }

  /**
   * Calculate reading statistics from session data
   */
  calculateReadingStats(sessions) {
    if (!sessions || sessions.length === 0) {
      return {
        totalSessions: 0,
        totalMinutes: 0,
        averageSessionLength: 0,
        daysRead: 0,
        longestSession: 0,
        currentStreak: 0
      };
    }
    
    const totalSessions = sessions.length;
    const totalMinutes = sessions.reduce((sum, s) => sum + (s.duration || 0), 0);
    const averageSessionLength = Math.round(totalMinutes / totalSessions);
    const uniqueDates = new Set(sessions.map(s => s.session_date));
    const daysRead = uniqueDates.size;
    const longestSession = Math.max(...sessions.map(s => s.duration || 0));
    
    // Calculate reading streak
    const sortedDates = Array.from(uniqueDates).sort().reverse();
    let currentStreak = 0;
    let yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    for (const dateStr of sortedDates) {
      const sessionDate = new Date(dateStr);
      const daysDiff = Math.floor((yesterday - sessionDate) / (1000 * 60 * 60 * 24));
      
      if (daysDiff === currentStreak) {
        currentStreak++;
        yesterday.setDate(yesterday.getDate() - 1);
      } else if (daysDiff > currentStreak + 1) {
        break;
      }
    }
    
    return {
      totalSessions,
      totalMinutes,
      averageSessionLength,
      daysRead,
      longestSession,
      currentStreak,
      sessionsPerDay: Math.round((totalSessions / daysRead) * 100) / 100
    };
  }

  /**
   * Optimized notes query with book title
   */
  async getOptimizedNotes(bookId, userId, options = {}) {
    const startTime = Date.now();
    const { limit = 100 } = options;
    
    const cacheKey = `notes_${bookId}_${userId}_${limit}`;
    
    try {
      const result = await this.getCachedQuery(cacheKey, async () => {
        // Use JOIN to get book title efficiently
        return await supabase
          .from('notes')
          .select(`
            *,
            books!inner (
              title,
              author
            )
          `)
          .eq('book_id', bookId)
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(limit);
      });
      
      this.trackQuery('getNotes', startTime, result.data?.length);
      return result;
      
    } catch (error) {
      console.error('Optimized notes query failed:', error);
      this.trackQuery('getNotes_ERROR', startTime);
      throw error;
    }
  }

  /**
   * Batch book updates for better performance
   */
  async batchUpdateBooks(userId, updates) {
    const startTime = Date.now();
    
    try {
      const promises = updates.map(({ id, data }) => {
        const normalized = normalizeBookUpdate(data);
        return supabase
          .from('books')
          .update({ ...data, ...normalized, updated_at: new Date().toISOString() })
          .eq('id', id)
          .eq('user_id', userId);
      });
      
      const results = await Promise.all(promises);
      
      // Clear relevant cache entries
      this.clearUserCache(userId, 'books_');
      
      this.trackQuery('batchUpdateBooks', startTime, updates.length);
      return results;
      
    } catch (error) {
      console.error('Batch update failed:', error);
      this.trackQuery('batchUpdateBooks_ERROR', startTime);
      throw error;
    }
  }

  /**
   * Clear cache entries for a specific user
   */
  clearUserCache(userId, prefix = '') {
    for (const [key] of this.queryCache) {
      if (key.includes(`${prefix}${userId}`)) {
        this.queryCache.delete(key);
      }
    }
    console.log(`🗑️ Cleared cache for user ${userId} (prefix: ${prefix})`);
  }

  /**
   * Get query performance metrics
   */
  getPerformanceMetrics() {
    const metrics = {};
    for (const [queryName, data] of this.queryMetrics) {
      metrics[queryName] = {
        ...data,
        minTime: data.minTime === Infinity ? 0 : data.minTime
      };
    }
    return metrics;
  }

  /**
   * Clear all caches (use sparingly)
   */
  clearAllCaches() {
    this.queryCache.clear();
    console.log('🗑️ All query caches cleared');
  }

  /**
   * Health check for database optimization
   */
  async healthCheck() {
    const checks = {
      cacheSize: this.queryCache.size,
      metricsTracked: this.queryMetrics.size,
      avgQueryTime: 0,
      slowQueries: 0,
      timestamp: new Date().toISOString()
    };
    
    // Calculate average query time
    let totalQueries = 0;
    let totalTime = 0;
    let slowQueries = 0;
    
    for (const [, metrics] of this.queryMetrics) {
      totalQueries += metrics.count;
      totalTime += metrics.totalTime;
      if (metrics.avgTime > 1000) slowQueries++;
    }
    
    checks.avgQueryTime = totalQueries > 0 ? Math.round(totalTime / totalQueries) : 0;
    checks.slowQueries = slowQueries;
    
    return checks;
  }
}

// Singleton instance
export const dbOptimizer = new DatabaseOptimizer();

// Helper functions for backwards compatibility
export const getOptimizedBooks = (userId, options) => 
  dbOptimizer.getOptimizedBookList(userId, options);

export const getOptimizedReadingStats = (userId, options) =>
  dbOptimizer.getReadingSessionStats(userId, options);

export const getOptimizedNotes = (bookId, userId, options) =>
  dbOptimizer.getOptimizedNotes(bookId, userId, options);

export const clearUserCache = (userId, prefix) =>
  dbOptimizer.clearUserCache(userId, prefix);

export const getDbMetrics = () =>
  dbOptimizer.getPerformanceMetrics();
