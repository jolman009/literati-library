/**
 * Advanced query optimization service
 * Implements connection pooling, query analysis, and performance tuning
 */

import { supabase } from '../config/supabaseClient.js';
import { advancedCache, withCache } from './advanced-caching.js';

// Query optimization configuration
const OPTIMIZATION_CONFIG = {
  // Query timeouts in milliseconds
  queryTimeout: 30000,
  // Maximum retry attempts for failed queries
  maxRetries: 3,
  // Batch operation limits
  batchSize: 100,
  // Connection pool settings (Supabase handles this, but we track usage)
  maxConcurrentQueries: 10,
  // Query complexity analysis thresholds
  complexityThresholds: {
    simple: 100,    // < 100ms
    moderate: 500,  // 100-500ms
    complex: 1000,  // 500ms-1s
    heavy: 1000     // > 1s
  }
};

class QueryOptimizer {
  constructor() {
    this.queryQueue = [];
    this.activeQueries = new Set();
    this.queryHistory = [];
    this.queryStats = new Map();
    this.connectionPool = {
      active: 0,
      total: 0,
      errors: 0
    };

    this.setupQueryMonitoring();
  }

  /**
   * Execute optimized query with automatic retry and caching
   */
  async executeOptimizedQuery(queryBuilder, options = {}) {
    const {
      cacheKey = null,
      cacheTier = 'warm',
      timeout = OPTIMIZATION_CONFIG.queryTimeout,
      retries = OPTIMIZATION_CONFIG.maxRetries,
      priority = 'normal'
    } = options;

    const queryId = this.generateQueryId();
    const startTime = Date.now();

    try {
      // Check cache first if cache key provided
      if (cacheKey) {
        const cached = advancedCache.get(cacheKey);
        if (cached) {
          this.recordQueryExecution(queryId, 'cache_hit', Date.now() - startTime, true);
          return cached;
        }
      }

      // Queue management for high load
      if (this.activeQueries.size >= OPTIMIZATION_CONFIG.maxConcurrentQueries) {
        await this.waitForQuerySlot(priority);
      }

      // Execute query with monitoring
      const result = await this.executeWithMonitoring(queryBuilder, queryId, timeout);

      // Cache successful results
      if (cacheKey && result && !result.error) {
        advancedCache.set(cacheKey, result, cacheTier);
      }

      const duration = Date.now() - startTime;
      this.recordQueryExecution(queryId, 'success', duration, result?.data?.length || 0);

      return result;

    } catch (error) {
      const duration = Date.now() - startTime;
      this.recordQueryExecution(queryId, 'error', duration, 0);

      // Retry logic for transient errors
      if (retries > 0 && this.isRetryableError(error)) {
        console.warn(`🔄 Retrying query ${queryId} (${retries} attempts left):`, error.message);
        await this.exponentialBackoff(OPTIMIZATION_CONFIG.maxRetries - retries);
        return this.executeOptimizedQuery(queryBuilder, { ...options, retries: retries - 1 });
      }

      throw error;
    }
  }

  /**
   * Execute query with comprehensive monitoring
   */
  async executeWithMonitoring(queryBuilder, queryId, timeout) {
    this.activeQueries.add(queryId);
    this.connectionPool.active++;

    try {
      // Add timeout to query
      const queryPromise = queryBuilder;
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Query timeout')), timeout);
      });

      const result = await Promise.race([queryPromise, timeoutPromise]);

      this.connectionPool.total++;
      return result;

    } catch (error) {
      this.connectionPool.errors++;
      throw error;
    } finally {
      this.activeQueries.delete(queryId);
      this.connectionPool.active--;
    }
  }

  /**
   * Optimized batch operations
   */
  async executeBatchOperation(operations, options = {}) {
    const {
      batchSize = OPTIMIZATION_CONFIG.batchSize,
      concurrency = 3,
      failFast = false
    } = options;

    const batches = this.createBatches(operations, batchSize);
    const results = [];

    console.log(`📦 Executing ${operations.length} operations in ${batches.length} batches`);

    for (let i = 0; i < batches.length; i += concurrency) {
      const currentBatches = batches.slice(i, i + concurrency);

      try {
        const batchPromises = currentBatches.map(batch => this.executeBatch(batch));
        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults.flat());

        console.log(`✅ Completed batch ${i + 1}-${Math.min(i + concurrency, batches.length)} of ${batches.length}`);

      } catch (error) {
        console.error(`❌ Batch operation failed:`, error);

        if (failFast) {
          throw error;
        }

        // Continue with individual execution for failed batch
        const failedBatch = currentBatches.find(batch => !batch.completed);
        if (failedBatch) {
          const individualResults = await this.executeIndividually(failedBatch);
          results.push(...individualResults);
        }
      }
    }

    return results;
  }

  /**
   * Execute a single batch of operations
   */
  async executeBatch(batch) {
    const startTime = Date.now();

    try {
      const promises = batch.map(operation => operation.execute());
      const results = await Promise.all(promises);

      batch.completed = true;
      console.log(`⚡ Batch completed in ${Date.now() - startTime}ms`);

      return results;
    } catch (error) {
      console.error(`Batch execution failed:`, error);
      throw error;
    }
  }

  /**
   * Execute operations individually when batch fails
   */
  async executeIndividually(batch) {
    const results = [];

    for (const operation of batch) {
      try {
        const result = await operation.execute();
        results.push(result);
      } catch (error) {
        console.error(`Individual operation failed:`, error);
        results.push({ error: error.message });
      }
    }

    return results;
  }

  /**
   * Create batches from operations array
   */
  createBatches(operations, batchSize) {
    const batches = [];
    for (let i = 0; i < operations.length; i += batchSize) {
      batches.push(operations.slice(i, i + batchSize));
    }
    return batches;
  }

  /**
   * Optimized book search with full-text search capabilities
   */
  async optimizedBookSearch(userId, searchOptions = {}) {
    const {
      query = '',
      filters = {},
      sort = 'relevance',
      limit = 20,
      offset = 0
    } = searchOptions;

    const cacheKey = `search_${userId}_${JSON.stringify(searchOptions)}`;

    return this.executeOptimizedQuery(
      this.buildSearchQuery(userId, searchOptions),
      {
        cacheKey,
        cacheTier: 'warm',
        priority: 'high'
      }
    );
  }

  /**
   * Build optimized search query
   */
  buildSearchQuery(userId, { query, filters, sort, limit, offset }) {
    let queryBuilder = supabase
      .from('books')
      .select('*')
      .eq('user_id', userId);

    // Full-text search if query provided
    if (query) {
      // Use Supabase's text search capabilities
      queryBuilder = queryBuilder.or(
        `title.ilike.%${query}%,author.ilike.%${query}%,genre.ilike.%${query}%`
      );
    }

    // Apply filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        queryBuilder = queryBuilder.eq(key, value);
      }
    });

    // Apply sorting
    switch (sort) {
      case 'title':
        queryBuilder = queryBuilder.order('title', { ascending: true });
        break;
      case 'author':
        queryBuilder = queryBuilder.order('author', { ascending: true });
        break;
      case 'date_added':
        queryBuilder = queryBuilder.order('created_at', { ascending: false });
        break;
      default: // relevance or recent
        queryBuilder = queryBuilder.order('updated_at', { ascending: false });
    }

    // Apply pagination
    queryBuilder = queryBuilder.range(offset, offset + limit - 1);

    return queryBuilder;
  }

  /**
   * Advanced reading analytics with aggregation
   */
  async getAdvancedReadingAnalytics(userId, options = {}) {
    const {
      timeframe = 30,
      groupBy = 'day',
      includeBooks = true
    } = options;

    const cacheKey = `analytics_${userId}_${timeframe}_${groupBy}`;

    return this.executeOptimizedQuery(
      this.buildAnalyticsQuery(userId, options),
      {
        cacheKey,
        cacheTier: 'cold',
        priority: 'low'
      }
    );
  }

  /**
   * Build complex analytics query
   */
  async buildAnalyticsQuery(userId, { timeframe, groupBy, includeBooks }) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - timeframe);

    // Main reading sessions query
    const sessionsQuery = supabase
      .from('reading_sessions')
      .select(`
        session_date,
        duration,
        book_id,
        ${includeBooks ? 'books!inner(title, author, genre)' : ''}
      `)
      .eq('user_id', userId)
      .gte('session_date', cutoffDate.toISOString().split('T')[0])
      .order('session_date', { ascending: false });

    return sessionsQuery;
  }

  /**
   * Intelligent query plan analysis
   */
  analyzeQueryComplexity(queryBuilder, resultCount, duration) {
    const complexity = {
      level: 'simple',
      score: duration,
      factors: [],
      recommendations: []
    };

    // Determine complexity level
    const thresholds = OPTIMIZATION_CONFIG.complexityThresholds;

    if (duration > thresholds.heavy) {
      complexity.level = 'heavy';
      complexity.factors.push('Execution time > 1s');
      complexity.recommendations.push('Consider query optimization or caching');
    } else if (duration > thresholds.complex) {
      complexity.level = 'complex';
      complexity.factors.push('Execution time 500ms-1s');
      complexity.recommendations.push('Monitor for performance degradation');
    } else if (duration > thresholds.moderate) {
      complexity.level = 'moderate';
      complexity.factors.push('Execution time 100-500ms');
    }

    // Analyze result set size
    if (resultCount > 1000) {
      complexity.factors.push('Large result set (>1000 rows)');
      complexity.recommendations.push('Implement pagination');
    }

    // Add caching recommendations
    if (duration > thresholds.moderate) {
      complexity.recommendations.push('Consider aggressive caching');
    }

    return complexity;
  }

  /**
   * Wait for available query slot
   */
  async waitForQuerySlot(priority) {
    return new Promise((resolve) => {
      const checkSlot = () => {
        if (this.activeQueries.size < OPTIMIZATION_CONFIG.maxConcurrentQueries) {
          resolve();
        } else {
          // High priority queries wait less
          const waitTime = priority === 'high' ? 50 : 100;
          setTimeout(checkSlot, waitTime);
        }
      };
      checkSlot();
    });
  }

  /**
   * Check if error is retryable
   */
  isRetryableError(error) {
    const retryableErrors = [
      'timeout',
      'network',
      'connection',
      'temporary',
      'rate limit'
    ];

    const errorMessage = error.message.toLowerCase();
    return retryableErrors.some(retryableError =>
      errorMessage.includes(retryableError)
    );
  }

  /**
   * Exponential backoff for retries
   */
  async exponentialBackoff(attempt) {
    const delay = Math.min(1000 * Math.pow(2, attempt), 10000);
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  /**
   * Generate unique query ID
   */
  generateQueryId() {
    return `query_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Record query execution metrics
   */
  recordQueryExecution(queryId, status, duration, resultCount) {
    const execution = {
      queryId,
      status,
      duration,
      resultCount,
      timestamp: Date.now()
    };

    this.queryHistory.push(execution);

    // Keep only last 1000 executions
    if (this.queryHistory.length > 1000) {
      this.queryHistory.shift();
    }

    // Update aggregated stats
    if (!this.queryStats.has(status)) {
      this.queryStats.set(status, {
        count: 0,
        totalDuration: 0,
        avgDuration: 0
      });
    }

    const stats = this.queryStats.get(status);
    stats.count++;
    stats.totalDuration += duration;
    stats.avgDuration = stats.totalDuration / stats.count;
  }

  /**
   * Setup query monitoring and alerts
   */
  setupQueryMonitoring() {
    setInterval(() => {
      this.analyzePerformanceTrends();
      this.checkForAnomalies();
    }, 60000); // Every minute
  }

  /**
   * Analyze performance trends
   */
  analyzePerformanceTrends() {
    const recentQueries = this.queryHistory.slice(-100);
    const avgDuration = recentQueries.reduce((sum, q) => sum + q.duration, 0) / recentQueries.length;

    if (avgDuration > 2000) {
      console.warn(`⚠️ Performance degradation detected: avg query time ${avgDuration.toFixed(0)}ms`);
    }
  }

  /**
   * Check for query anomalies
   */
  checkForAnomalies() {
    const errorRate = this.calculateErrorRate();

    if (errorRate > 0.1) { // 10% error rate
      console.error(`🚨 High error rate detected: ${(errorRate * 100).toFixed(1)}%`);
    }

    if (this.activeQueries.size > OPTIMIZATION_CONFIG.maxConcurrentQueries * 0.8) {
      console.warn(`⚠️ High query concurrency: ${this.activeQueries.size} active queries`);
    }
  }

  /**
   * Calculate current error rate
   */
  calculateErrorRate() {
    const recentQueries = this.queryHistory.slice(-100);
    const errors = recentQueries.filter(q => q.status === 'error').length;
    return recentQueries.length > 0 ? errors / recentQueries.length : 0;
  }

  /**
   * Get comprehensive performance metrics
   */
  getPerformanceMetrics() {
    return {
      connectionPool: { ...this.connectionPool },
      activeQueries: this.activeQueries.size,
      queryStats: Object.fromEntries(this.queryStats),
      recentPerformance: this.calculateRecentPerformance(),
      errorRate: this.calculateErrorRate(),
      cacheStats: advancedCache.getStatistics()
    };
  }

  /**
   * Calculate recent performance metrics
   */
  calculateRecentPerformance() {
    const recentQueries = this.queryHistory.slice(-100);

    if (recentQueries.length === 0) {
      return { avgDuration: 0, slowQueries: 0, totalQueries: 0 };
    }

    const avgDuration = recentQueries.reduce((sum, q) => sum + q.duration, 0) / recentQueries.length;
    const slowQueries = recentQueries.filter(q => q.duration > 1000).length;

    return {
      avgDuration: Math.round(avgDuration),
      slowQueries,
      totalQueries: recentQueries.length
    };
  }

  /**
   * Reset all metrics (for testing/debugging)
   */
  resetMetrics() {
    this.queryHistory = [];
    this.queryStats.clear();
    this.connectionPool = { active: 0, total: 0, errors: 0 };
    console.log('📊 Query metrics reset');
  }
}

// Create singleton instance
export const queryOptimizer = new QueryOptimizer();

// Export utility functions
export const optimizedQuery = (queryBuilder, options) =>
  queryOptimizer.executeOptimizedQuery(queryBuilder, options);

export const optimizedBatch = (operations, options) =>
  queryOptimizer.executeBatchOperation(operations, options);

export const optimizedSearch = (userId, searchOptions) =>
  queryOptimizer.optimizedBookSearch(userId, searchOptions);

export const getQueryMetrics = () =>
  queryOptimizer.getPerformanceMetrics();

export default queryOptimizer;