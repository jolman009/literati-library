// src/services/crashReporting.js - Server-side Crash Reporting
import * as Sentry from '@sentry/node';

class ServerCrashReporting {
  constructor() {
    this.isInitialized = false;
    this.initialize();
  }

  initialize() {
    const dsn = process.env.SENTRY_DSN;
    const environment = process.env.NODE_ENV || 'development';
    const appVersion = process.env.APP_VERSION || '1.0.0';

    if (!dsn) {
      if (environment === 'development') {
        console.warn('⚠️ Sentry DSN not configured for server, crash reporting disabled');
      }
      return;
    }

    try {
      Sentry.init({
        dsn,
        environment,
        release: `shelfquest-server@${appVersion}`,
        debug: environment === 'development',

        // Performance monitoring
        tracesSampleRate: environment === 'production' ? 0.1 : 1.0,

        // Error filtering
        beforeSend: (event) => {
          return this.filterServerError(event);
        },

        // Ignore certain errors
        ignoreErrors: [
          'DatabaseConnectionError',
          'ECONNRESET',
          'ENOTFOUND',
          'ETIMEDOUT',
          'ECONNREFUSED'
        ],

        // Initial scope
        initialScope: {
          tags: {
            component: 'shelfquest-backend',
            node_version: process.version
          }
        }
      });

      // Set up global handlers
      this.setupGlobalHandlers();

      this.isInitialized = true;
      console.log('🚨 Server crash reporting initialized with Sentry');
    } catch (error) {
      console.error('❌ Failed to initialize server crash reporting:', error);
    }
  }

  setupGlobalHandlers() {
    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      console.error('Uncaught Exception:', error);

      this.captureException(error, {
        type: 'uncaught_exception',
        fatal: true
      });

      // Give Sentry time to send the error
      setTimeout(() => {
        process.exit(1);
      }, 2000);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      console.error('Unhandled Rejection at:', promise, 'reason:', reason);

      this.captureException(
        reason instanceof Error ? reason : new Error(String(reason)),
        {
          type: 'unhandled_promise_rejection',
          promise: promise.toString()
        }
      );
    });

    // Graceful shutdown
    const gracefulShutdown = (signal) => {
      console.log(`Received ${signal}, shutting down gracefully...`);

      this.captureMessage(`Server shutting down: ${signal}`, 'info', {
        shutdown_signal: signal,
        uptime: process.uptime()
      });

      // Close Sentry client
      Sentry.close(2000).then(() => {
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  }

  /**
   * Express middleware for request context
   */
  getRequestHandler() {
    if (!this.isInitialized) {
      return (req, res, next) => next();
    }

    return Sentry.Handlers.requestHandler({
      user: ['id', 'email', 'username'],
      request: true,
      serverName: false
    });
  }

  /**
   * Express error handler middleware
   */
  getErrorHandler() {
    if (!this.isInitialized) {
      return (err, req, res, next) => {
        console.error('Server error:', err);
        next(err);
      };
    }

    return Sentry.Handlers.errorHandler({
      shouldHandleError: (error) => {
        // Log all errors to Sentry
        return true;
      }
    });
  }

  /**
   * Set user context for current request
   */
  setUser(user) {
    if (!this.isInitialized) return;

    Sentry.setUser({
      id: user.id?.toString(),
      email: user.email,
      username: user.username,
      subscription_tier: user.subscription_tier,
      created_at: user.created_at
    });
  }

  /**
   * Set request context
   */
  setRequestContext(req) {
    if (!this.isInitialized) return;

    Sentry.setContext('request', {
      method: req.method,
      url: req.url,
      user_agent: req.headers['user-agent'],
      ip: req.ip,
      body_size: JSON.stringify(req.body || {}).length,
      query_params: Object.keys(req.query || {}).length
    });
  }

  /**
   * Capture exception with context
   */
  captureException(error, context = {}, level = 'error') {
    if (!this.isInitialized) {
      console.error('Server error:', error, context);
      return null;
    }

    return Sentry.captureException(error, {
      level,
      extra: {
        context,
        server_info: this.getServerInfo(),
        memory_usage: this.getMemoryUsage(),
        system_load: this.getSystemLoad()
      },
      tags: {
        service: context.service || 'unknown',
        endpoint: context.endpoint || 'unknown',
        user_id: context.userId || 'anonymous'
      }
    });
  }

  /**
   * Capture message
   */
  captureMessage(message, level = 'info', context = {}) {
    if (!this.isInitialized) {
      console[level](message, context);
      return null;
    }

    return Sentry.captureMessage(message, {
      level,
      extra: context,
      tags: {
        service: context.service || 'general'
      }
    });
  }

  /**
   * Add breadcrumb
   */
  addBreadcrumb(message, category = 'server', level = 'info', data = {}) {
    if (!this.isInitialized) return;

    Sentry.addBreadcrumb({
      message,
      category,
      level,
      data: {
        timestamp: Date.now(),
        ...data
      }
    });
  }

  /**
   * Report database errors
   */
  reportDatabaseError(error, operation, query = null) {
    this.addBreadcrumb(
      `Database error during: ${operation}`,
      'database',
      'error',
      {
        operation,
        query: query ? this.sanitizeQuery(query) : null
      }
    );

    return this.captureException(error, {
      type: 'database_error',
      operation,
      service: 'database',
      query: query ? this.sanitizeQuery(query) : null
    });
  }

  /**
   * Report API errors
   */
  reportAPIError(error, endpoint, method, body = null) {
    this.addBreadcrumb(
      `API error: ${method} ${endpoint}`,
      'api',
      'error',
      {
        endpoint,
        method,
        body_size: body ? JSON.stringify(body).length : 0
      }
    );

    return this.captureException(error, {
      type: 'api_error',
      endpoint,
      method,
      service: 'api',
      request_body: body ? this.sanitizeRequestData(body) : null
    });
  }

  /**
   * Report authentication errors
   */
  reportAuthError(error, action, userId = null) {
    this.addBreadcrumb(
      `Auth error: ${action}`,
      'authentication',
      'error',
      { action, user_id: userId }
    );

    return this.captureException(error, {
      type: 'auth_error',
      action,
      service: 'authentication',
      user_id: userId
    });
  }

  /**
   * Report file system errors
   */
  reportFileSystemError(error, operation, filepath = null) {
    this.addBreadcrumb(
      `File system error: ${operation}`,
      'filesystem',
      'error',
      { operation, filepath }
    );

    return this.captureException(error, {
      type: 'filesystem_error',
      operation,
      service: 'filesystem',
      filepath: filepath ? this.sanitizeFilePath(filepath) : null
    });
  }

  /**
   * Track performance issues
   */
  trackPerformanceIssue(operation, duration, context = {}) {
    if (!this.isInitialized) return;

    this.addBreadcrumb(
      `Performance issue: ${operation} took ${duration}ms`,
      'performance',
      duration > 5000 ? 'warning' : 'info',
      {
        operation,
        duration,
        ...context
      }
    );

    // Create performance transaction
    const transaction = Sentry.startTransaction({
      name: operation,
      op: 'performance_issue'
    });

    transaction.setData('duration', duration);
    transaction.setData('context', context);
    transaction.finish();
  }

  /**
   * Monitor database query performance
   */
  monitorDatabaseQuery(query, duration, rowCount = null) {
    if (duration > 1000) { // Log slow queries (>1s)
      this.addBreadcrumb(
        `Slow database query: ${duration}ms`,
        'database_performance',
        'warning',
        {
          query: this.sanitizeQuery(query),
          duration,
          row_count: rowCount
        }
      );
    }

    // Track as transaction
    if (this.isInitialized) {
      const transaction = Sentry.startTransaction({
        name: 'database_query',
        op: 'db.query'
      });

      transaction.setData('query', this.sanitizeQuery(query));
      transaction.setData('duration', duration);
      transaction.setData('rowCount', rowCount);
      transaction.finish();
    }
  }

  /**
   * Filter server errors
   */
  filterServerError(event) {
    // Don't report in development unless explicitly enabled
    if (process.env.NODE_ENV === 'development' && !process.env.SENTRY_DEV_ENABLED) {
      return null;
    }

    // Filter out known network errors in production
    if (event.exception?.values?.[0]?.type === 'ECONNRESET') {
      return null; // Client disconnected
    }

    return event;
  }

  /**
   * Get server information
   */
  getServerInfo() {
    return {
      node_version: process.version,
      platform: process.platform,
      uptime: Math.round(process.uptime()),
      environment: process.env.NODE_ENV,
      memory: this.getMemoryUsage()
    };
  }

  /**
   * Get memory usage
   */
  getMemoryUsage() {
    const usage = process.memoryUsage();
    return {
      rss: Math.round(usage.rss / 1024 / 1024), // MB
      heap_used: Math.round(usage.heapUsed / 1024 / 1024),
      heap_total: Math.round(usage.heapTotal / 1024 / 1024),
      external: Math.round(usage.external / 1024 / 1024)
    };
  }

  /**
   * Get system load
   */
  getSystemLoad() {
    try {
      const os = require('os');
      return {
        load_avg: os.loadavg(),
        cpu_count: os.cpus().length,
        free_memory: Math.round(os.freemem() / 1024 / 1024),
        total_memory: Math.round(os.totalmem() / 1024 / 1024)
      };
    } catch (error) {
      return { available: false };
    }
  }

  /**
   * Sanitize SQL queries for logging
   */
  sanitizeQuery(query) {
    if (typeof query !== 'string') return String(query);

    return query
      .replace(/('[^']*')/g, "'***'") // Replace string literals
      .replace(/(\d{4,})/g, '***') // Replace long numbers (potential IDs)
      .substring(0, 500); // Limit length
  }

  /**
   * Sanitize file paths
   */
  sanitizeFilePath(filepath) {
    if (!filepath) return null;

    // Remove absolute paths, keep relative structure
    return filepath.replace(process.cwd(), '.');
  }

  /**
   * Sanitize request data
   */
  sanitizeRequestData(data) {
    const sanitized = { ...data };

    // Remove sensitive fields
    delete sanitized.password;
    delete sanitized.token;
    delete sanitized.secret;
    delete sanitized.apiKey;
    delete sanitized.privateKey;

    // Truncate large text fields
    Object.keys(sanitized).forEach(key => {
      if (typeof sanitized[key] === 'string' && sanitized[key].length > 1000) {
        sanitized[key] = sanitized[key].substring(0, 1000) + '...';
      }
    });

    return sanitized;
  }

  /**
   * Health check for crash reporting
   */
  healthCheck() {
    return {
      initialized: this.isInitialized,
      dsn_configured: !!process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV,
      uptime: Math.round(process.uptime())
    };
  }

  /**
   * Test error reporting
   */
  testErrorReporting() {
    if (!this.isInitialized) {
      console.warn('Crash reporting not initialized');
      return;
    }

    this.captureMessage('Test message from ShelfQuest server', 'info', {
      test: true,
      timestamp: Date.now()
    });

    const testError = new Error('Test error from ShelfQuest server');
    this.captureException(testError, {
      test: true,
      service: 'crash_reporting_test'
    });

    console.log('Test messages sent to Sentry');
  }
}

// Create singleton instance
const serverCrashReporting = new ServerCrashReporting();

export default serverCrashReporting;