/**
 * Prometheus Metrics Service for ShelfQuest
 * Exposes application metrics in Prometheus format
 * Integrates with existing monitoring service
 */

import client from 'prom-client';
import { monitor } from './monitoring.js';

class PrometheusMetrics {
  constructor() {
    // Create a Registry to register metrics
    this.register = new client.Registry();

    // Add default metrics (CPU, memory, etc.)
    client.collectDefaultMetrics({
      register: this.register,
      prefix: 'shelfquest_',
      gcDurationBuckets: [0.001, 0.01, 0.1, 1, 2, 5],
    });

    this.initializeCustomMetrics();
  }

  /**
   * Initialize custom application metrics
   */
  initializeCustomMetrics() {
    // HTTP Request Duration Histogram
    this.httpRequestDuration = new client.Histogram({
      name: 'http_request_duration_seconds',
      help: 'Duration of HTTP requests in seconds',
      labelNames: ['method', 'route', 'status_code', 'service'],
      buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10], // seconds
    });

    // HTTP Request Total Counter
    this.httpRequestsTotal = new client.Counter({
      name: 'http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'route', 'status', 'service'],
    });

    // Active Users Gauge
    this.activeUsers = new client.Gauge({
      name: 'active_users_total',
      help: 'Number of currently active users',
    });

    // Reading Sessions Gauge
    this.activeReadingSessions = new client.Gauge({
      name: 'active_reading_sessions_total',
      help: 'Number of active reading sessions',
    });

    // Books Total Counter
    this.booksTotal = new client.Counter({
      name: 'books_total',
      help: 'Total number of books in library',
      labelNames: ['format', 'status'],
    });

    // Books Read Counter
    this.booksRead = new client.Counter({
      name: 'books_read_total',
      help: 'Total number of books read to completion',
      labelNames: ['format', 'genre'],
    });

    // User Signups Counter
    this.userSignups = new client.Counter({
      name: 'user_signups_total',
      help: 'Total number of user signups',
      labelNames: ['source'],
    });

    // Failed Login Attempts Counter
    this.failedLoginAttempts = new client.Counter({
      name: 'failed_login_attempts_total',
      help: 'Total number of failed login attempts',
      labelNames: ['reason'],
    });

    // Account Lockouts Counter
    this.accountLockouts = new client.Counter({
      name: 'account_lockouts_total',
      help: 'Total number of account lockouts due to failed login attempts',
    });

    // Rate Limit Violations Counter
    this.rateLimitViolations = new client.Counter({
      name: 'rate_limit_violations_total',
      help: 'Total number of rate limit violations',
      labelNames: ['endpoint', 'ip'],
    });

    // Security Events Counter
    this.securityEvents = new client.Counter({
      name: 'security_events_total',
      help: 'Total number of security events',
      labelNames: ['type', 'severity'],
    });

    // File Uploads Counter
    this.fileUploads = new client.Counter({
      name: 'file_uploads_total',
      help: 'Total number of file uploads',
      labelNames: ['type', 'status'],
    });

    // File Upload Size Histogram
    this.fileUploadSize = new client.Histogram({
      name: 'file_upload_size_bytes',
      help: 'Size of uploaded files in bytes',
      labelNames: ['type'],
      buckets: [1e5, 5e5, 1e6, 5e6, 1e7, 5e7, 1e8], // 100KB to 100MB
    });

    // Database Query Duration Histogram
    this.databaseQueryDuration = new client.Histogram({
      name: 'database_query_duration_seconds',
      help: 'Duration of database queries in seconds',
      labelNames: ['operation', 'table'],
      buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 5],
    });

    // Database Connections Gauge
    this.databaseConnections = new client.Gauge({
      name: 'database_connections_active',
      help: 'Number of active database connections',
    });

    // Database Connections Max Gauge
    this.databaseConnectionsMax = new client.Gauge({
      name: 'database_connections_max',
      help: 'Maximum number of database connections',
    });

    // Cache Hit/Miss Counters
    this.cacheHits = new client.Counter({
      name: 'cache_hits_total',
      help: 'Total number of cache hits',
      labelNames: ['cache_name'],
    });

    this.cacheMisses = new client.Counter({
      name: 'cache_misses_total',
      help: 'Total number of cache misses',
      labelNames: ['cache_name'],
    });

    // AI Service Requests Counter
    this.aiServiceRequests = new client.Counter({
      name: 'ai_service_requests_total',
      help: 'Total number of AI service requests',
      labelNames: ['operation', 'status'],
    });

    // AI Service Duration Histogram
    this.aiServiceDuration = new client.Histogram({
      name: 'ai_service_duration_seconds',
      help: 'Duration of AI service requests in seconds',
      labelNames: ['operation'],
      buckets: [0.5, 1, 2, 5, 10, 20, 30],
    });

    // Gamification Events Counter
    this.gamificationEvents = new client.Counter({
      name: 'gamification_events_total',
      help: 'Total number of gamification events',
      labelNames: ['event_type'],
    });

    // Reading Streaks Gauge
    this.readingStreaks = new client.Gauge({
      name: 'reading_streaks_active',
      help: 'Number of users with active reading streaks',
    });

    // Achievements Unlocked Counter
    this.achievementsUnlocked = new client.Counter({
      name: 'achievements_unlocked_total',
      help: 'Total number of achievements unlocked',
      labelNames: ['achievement_type'],
    });

    // Error Rate Summary
    this.errorRate = new client.Gauge({
      name: 'error_rate',
      help: 'Current error rate (percentage)',
    });

    // Register all custom metrics
    this.register.registerMetric(this.httpRequestDuration);
    this.register.registerMetric(this.httpRequestsTotal);
    this.register.registerMetric(this.activeUsers);
    this.register.registerMetric(this.activeReadingSessions);
    this.register.registerMetric(this.booksTotal);
    this.register.registerMetric(this.booksRead);
    this.register.registerMetric(this.userSignups);
    this.register.registerMetric(this.failedLoginAttempts);
    this.register.registerMetric(this.accountLockouts);
    this.register.registerMetric(this.rateLimitViolations);
    this.register.registerMetric(this.securityEvents);
    this.register.registerMetric(this.fileUploads);
    this.register.registerMetric(this.fileUploadSize);
    this.register.registerMetric(this.databaseQueryDuration);
    this.register.registerMetric(this.databaseConnections);
    this.register.registerMetric(this.databaseConnectionsMax);
    this.register.registerMetric(this.cacheHits);
    this.register.registerMetric(this.cacheMisses);
    this.register.registerMetric(this.aiServiceRequests);
    this.register.registerMetric(this.aiServiceDuration);
    this.register.registerMetric(this.gamificationEvents);
    this.register.registerMetric(this.readingStreaks);
    this.register.registerMetric(this.achievementsUnlocked);
    this.register.registerMetric(this.errorRate);

    console.log('📊 Prometheus metrics initialized');
  }

  /**
   * Express middleware to track HTTP requests
   */
  requestMetricsMiddleware() {
    return (req, res, next) => {
      const start = Date.now();

      // Override res.end to capture metrics
      const originalEnd = res.end;
      res.end = (...args) => {
        const duration = (Date.now() - start) / 1000; // convert to seconds
        const route = req.route?.path || req.path;
        const method = req.method;
        const statusCode = res.statusCode;
        const status = statusCode < 400 ? 'success' : statusCode < 500 ? 'client_error' : 'server_error';

        // Record metrics
        this.httpRequestDuration.observe(
          { method, route, status_code: statusCode, service: 'server' },
          duration
        );

        this.httpRequestsTotal.inc({
          method,
          route,
          status,
          service: 'server'
        });

        // Update error rate
        if (monitor?.metrics) {
          const errorRate = monitor.calculateErrorRate() * 100;
          this.errorRate.set(errorRate);
        }

        originalEnd.apply(res, args);
      };

      next();
    };
  }

  /**
   * Get metrics in Prometheus format
   */
  async getMetrics() {
    return await this.register.metrics();
  }

  /**
   * Get metrics as JSON (for debugging)
   */
  async getMetricsJSON() {
    return await this.register.getMetricsAsJSON();
  }

  /**
   * Get content type for Prometheus
   */
  getContentType() {
    return this.register.contentType;
  }

  /**
   * Helper method to track user signup
   */
  trackUserSignup(source = 'direct') {
    this.userSignups.inc({ source });
  }

  /**
   * Helper method to track failed login
   */
  trackFailedLogin(reason = 'invalid_credentials') {
    this.failedLoginAttempts.inc({ reason });
  }

  /**
   * Helper method to track account lockout
   */
  trackAccountLockout() {
    this.accountLockouts.inc();
  }

  /**
   * Helper method to track rate limit violation
   */
  trackRateLimitViolation(endpoint, ip) {
    this.rateLimitViolations.inc({ endpoint, ip: ip.substring(0, 15) }); // truncate IP for cardinality
  }

  /**
   * Helper method to track security event
   */
  trackSecurityEvent(type, severity) {
    this.securityEvents.inc({ type, severity });
  }

  /**
   * Helper method to track file upload
   */
  trackFileUpload(type, status, sizeBytes = null) {
    this.fileUploads.inc({ type, status });
    if (sizeBytes) {
      this.fileUploadSize.observe({ type }, sizeBytes);
    }
  }

  /**
   * Helper method to track database query
   */
  trackDatabaseQuery(operation, table, durationSeconds) {
    this.databaseQueryDuration.observe({ operation, table }, durationSeconds);
  }

  /**
   * Helper method to set database connection metrics
   */
  setDatabaseConnections(active, max) {
    this.databaseConnections.set(active);
    this.databaseConnectionsMax.set(max);
  }

  /**
   * Helper method to track cache operations
   */
  trackCacheHit(cacheName) {
    this.cacheHits.inc({ cache_name: cacheName });
  }

  trackCacheMiss(cacheName) {
    this.cacheMisses.inc({ cache_name: cacheName });
  }

  /**
   * Helper method to track AI service requests
   */
  trackAIService(operation, status, durationSeconds) {
    this.aiServiceRequests.inc({ operation, status });
    this.aiServiceDuration.observe({ operation }, durationSeconds);
  }

  /**
   * Helper method to track gamification events
   */
  trackGamificationEvent(eventType) {
    this.gamificationEvents.inc({ event_type: eventType });
  }

  /**
   * Helper method to track achievement unlock
   */
  trackAchievementUnlock(achievementType) {
    this.achievementsUnlocked.inc({ achievement_type: achievementType });
  }

  /**
   * Helper method to set active users
   */
  setActiveUsers(count) {
    this.activeUsers.set(count);
  }

  /**
   * Helper method to set active reading sessions
   */
  setActiveReadingSessions(count) {
    this.activeReadingSessions.set(count);
  }

  /**
   * Helper method to set reading streaks
   */
  setReadingStreaks(count) {
    this.readingStreaks.set(count);
  }

  /**
   * Helper method to track book addition
   */
  trackBookAdded(format, status) {
    this.booksTotal.inc({ format, status });
  }

  /**
   * Helper method to track book read completion
   */
  trackBookReadComplete(format, genre = 'unknown') {
    this.booksRead.inc({ format, genre });
  }
}

// Create singleton instance
export const prometheusMetrics = new PrometheusMetrics();

export default prometheusMetrics;
