/**
 * Comprehensive error handling service for production-ready application
 * Implements structured logging, error classification, and monitoring
 */

import { createLogger, format, transports } from 'winston';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Error severity levels
export const ERROR_LEVELS = {
  CRITICAL: 'critical',    // System failure, immediate attention required
  HIGH: 'high',           // Feature broken, affects user experience
  MEDIUM: 'medium',       // Degraded performance, workaround available
  LOW: 'low',            // Minor issues, logging only
  INFO: 'info'           // Informational, not an error
};

// Error categories for better organization
export const ERROR_CATEGORIES = {
  DATABASE: 'database',
  AUTHENTICATION: 'authentication',
  AUTHORIZATION: 'authorization',
  VALIDATION: 'validation',
  FILE_UPLOAD: 'file_upload',
  EXTERNAL_API: 'external_api',
  RATE_LIMIT: 'rate_limit',
  SYSTEM: 'system',
  BUSINESS_LOGIC: 'business_logic'
};

class ErrorHandlingService {
  constructor() {
    this.errorCount = new Map();
    this.errorHistory = [];
    this.alertThresholds = {
      critical: 1,    // Alert immediately
      high: 3,        // Alert after 3 occurrences in 5 minutes
      medium: 10,     // Alert after 10 occurrences in 10 minutes
      low: 50         // Alert after 50 occurrences in 1 hour
    };

    this.setupLogger();
    this.setupMetrics();
  }

  /**
   * Setup Winston logger with multiple transports
   */
  setupLogger() {
    const logFormat = format.combine(
      format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      format.errors({ stack: true }),
      format.json(),
      format.printf(({ timestamp, level, message, stack, ...meta }) => {
        return JSON.stringify({
          timestamp,
          level: level.toUpperCase(),
          message,
          stack,
          ...meta
        });
      })
    );

    this.logger = createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: logFormat,
      transports: [
        // Console logging for development
        new transports.Console({
          format: format.combine(
            format.colorize(),
            format.simple(),
            format.printf(({ timestamp, level, message, stack }) => {
              return `${timestamp} [${level}]: ${message}${stack ? '\n' + stack : ''}`;
            })
          )
        }),

        // File logging for production
        new transports.File({
          filename: path.join(__dirname, '../logs/error.log'),
          level: 'error',
          maxsize: 10 * 1024 * 1024, // 10MB
          maxFiles: 5
        }),

        new transports.File({
          filename: path.join(__dirname, '../logs/combined.log'),
          maxsize: 10 * 1024 * 1024, // 10MB
          maxFiles: 10
        })
      ],

      // Handle logger errors
      exceptionHandlers: [
        new transports.File({
          filename: path.join(__dirname, '../logs/exceptions.log')
        })
      ],

      rejectionHandlers: [
        new transports.File({
          filename: path.join(__dirname, '../logs/rejections.log')
        })
      ]
    });
  }

  /**
   * Setup error metrics tracking
   */
  setupMetrics() {
    // Reset error counts periodically
    setInterval(() => {
      this.resetErrorCounts();
    }, 60 * 60 * 1000); // Every hour

    // Cleanup old error history
    setInterval(() => {
      this.cleanupErrorHistory();
    }, 10 * 60 * 1000); // Every 10 minutes
  }

  /**
   * Main error handling method
   */
  handleError(error, context = {}) {
    const errorInfo = this.classifyError(error, context);

    // Log the error
    this.logError(errorInfo);

    // Track metrics
    this.trackErrorMetrics(errorInfo);

    // Check for alerts
    this.checkAlertThresholds(errorInfo);

    // Store in history
    this.storeErrorHistory(errorInfo);

    return errorInfo;
  }

  /**
   * Classify error by severity and category
   */
  classifyError(error, context) {
    const errorInfo = {
      id: this.generateErrorId(),
      timestamp: new Date().toISOString(),
      message: error.message || 'Unknown error',
      stack: error.stack,
      name: error.name || 'Error',
      code: error.code,
      severity: ERROR_LEVELS.MEDIUM,
      category: ERROR_CATEGORIES.SYSTEM,
      context: {
        userId: context.userId,
        endpoint: context.endpoint,
        method: context.method,
        ip: context.ip,
        userAgent: context.userAgent,
        requestId: context.requestId,
        ...context
      },
      metadata: {}
    };

    // Classify by error type and message
    this.applySeverityRules(errorInfo, error);
    this.applyCategoryRules(errorInfo, error);
    this.addMetadata(errorInfo, error, context);

    return errorInfo;
  }

  /**
   * Apply severity classification rules
   */
  applySeverityRules(errorInfo, error) {
    const message = error.message?.toLowerCase() || '';
    const code = error.code;

    // Critical errors
    if (
      message.includes('database connection') ||
      message.includes('out of memory') ||
      code === 'ECONNREFUSED' ||
      code === 'ENOTFOUND'
    ) {
      errorInfo.severity = ERROR_LEVELS.CRITICAL;
      return;
    }

    // High severity errors
    if (
      message.includes('authentication failed') ||
      message.includes('unauthorized') ||
      message.includes('file upload failed') ||
      code === 'EADDRINUSE' ||
      error.status === 500
    ) {
      errorInfo.severity = ERROR_LEVELS.HIGH;
      return;
    }

    // Low severity errors
    if (
      message.includes('validation failed') ||
      message.includes('bad request') ||
      error.status === 400 ||
      error.status === 422
    ) {
      errorInfo.severity = ERROR_LEVELS.LOW;
      return;
    }

    // Default to medium
    errorInfo.severity = ERROR_LEVELS.MEDIUM;
  }

  /**
   * Apply category classification rules
   */
  applyCategoryRules(errorInfo, error) {
    const message = error.message?.toLowerCase() || '';
    const stack = error.stack?.toLowerCase() || '';

    if (message.includes('database') || message.includes('supabase')) {
      errorInfo.category = ERROR_CATEGORIES.DATABASE;
    } else if (message.includes('auth') || message.includes('token')) {
      errorInfo.category = ERROR_CATEGORIES.AUTHENTICATION;
    } else if (message.includes('permission') || message.includes('unauthorized')) {
      errorInfo.category = ERROR_CATEGORIES.AUTHORIZATION;
    } else if (message.includes('validation') || message.includes('invalid')) {
      errorInfo.category = ERROR_CATEGORIES.VALIDATION;
    } else if (message.includes('upload') || message.includes('file')) {
      errorInfo.category = ERROR_CATEGORIES.FILE_UPLOAD;
    } else if (message.includes('rate limit') || message.includes('too many')) {
      errorInfo.category = ERROR_CATEGORIES.RATE_LIMIT;
    } else if (stack.includes('external') || message.includes('api')) {
      errorInfo.category = ERROR_CATEGORIES.EXTERNAL_API;
    }
  }

  /**
   * Add relevant metadata to error
   */
  addMetadata(errorInfo, error, context) {
    // Database errors
    if (errorInfo.category === ERROR_CATEGORIES.DATABASE) {
      errorInfo.metadata = {
        query: context.query,
        params: context.params,
        table: context.table,
        operation: context.operation
      };
    }

    // Authentication errors
    if (errorInfo.category === ERROR_CATEGORIES.AUTHENTICATION) {
      errorInfo.metadata = {
        tokenExpired: error.name === 'TokenExpiredError',
        invalidToken: error.name === 'JsonWebTokenError',
        loginAttempt: context.loginAttempt
      };
    }

    // File upload errors
    if (errorInfo.category === ERROR_CATEGORIES.FILE_UPLOAD) {
      errorInfo.metadata = {
        fileSize: context.fileSize,
        fileType: context.fileType,
        fileName: context.fileName,
        uploadStep: context.uploadStep
      };
    }

    // Add performance metrics if available
    if (context.duration) {
      errorInfo.metadata.duration = context.duration;
    }

    if (context.memoryUsage) {
      errorInfo.metadata.memoryUsage = context.memoryUsage;
    }
  }

  /**
   * Log error with appropriate level
   */
  logError(errorInfo) {
    const logLevel = this.getLogLevel(errorInfo.severity);

    this.logger[logLevel]({
      errorId: errorInfo.id,
      message: errorInfo.message,
      severity: errorInfo.severity,
      category: errorInfo.category,
      context: errorInfo.context,
      metadata: errorInfo.metadata,
      stack: errorInfo.stack
    });
  }

  /**
   * Get appropriate log level for severity
   */
  getLogLevel(severity) {
    switch (severity) {
      case ERROR_LEVELS.CRITICAL:
      case ERROR_LEVELS.HIGH:
        return 'error';
      case ERROR_LEVELS.MEDIUM:
        return 'warn';
      case ERROR_LEVELS.LOW:
        return 'info';
      default:
        return 'debug';
    }
  }

  /**
   * Track error metrics
   */
  trackErrorMetrics(errorInfo) {
    const key = `${errorInfo.category}_${errorInfo.severity}`;
    const current = this.errorCount.get(key) || 0;
    this.errorCount.set(key, current + 1);

    // Track by endpoint if available
    if (errorInfo.context.endpoint) {
      const endpointKey = `endpoint_${errorInfo.context.endpoint}`;
      const endpointCount = this.errorCount.get(endpointKey) || 0;
      this.errorCount.set(endpointKey, endpointCount + 1);
    }
  }

  /**
   * Check if error thresholds are exceeded and trigger alerts
   */
  checkAlertThresholds(errorInfo) {
    const threshold = this.alertThresholds[errorInfo.severity];
    const key = `${errorInfo.category}_${errorInfo.severity}`;
    const count = this.errorCount.get(key) || 0;

    if (count >= threshold) {
      this.triggerAlert(errorInfo, count);
    }
  }

  /**
   * Trigger alert for high error rates
   */
  triggerAlert(errorInfo, count) {
    const alert = {
      id: this.generateErrorId(),
      timestamp: new Date().toISOString(),
      type: 'ERROR_THRESHOLD_EXCEEDED',
      severity: errorInfo.severity,
      category: errorInfo.category,
      count,
      threshold: this.alertThresholds[errorInfo.severity],
      message: `${errorInfo.category} errors (${errorInfo.severity}) exceeded threshold: ${count} occurrences`,
      context: errorInfo.context
    };

    // Log alert
    this.logger.error('ALERT_TRIGGERED', alert);

    // In production, you would send this to monitoring services
    if (process.env.NODE_ENV === 'production') {
      this.sendToMonitoringService(alert);
    }

    console.error('🚨 ALERT TRIGGERED:', alert.message);
  }

  /**
   * Send alert to external monitoring service
   */
  async sendToMonitoringService(alert) {
    // Implementation for external monitoring services
    // Example: Sentry, Datadog, New Relic, etc.
    try {
      // await monitoringService.sendAlert(alert);
      console.log('Alert would be sent to monitoring service:', alert.type);
    } catch (error) {
      this.logger.error('Failed to send alert to monitoring service', { error: error.message });
    }
  }

  /**
   * Store error in history for analysis
   */
  storeErrorHistory(errorInfo) {
    this.errorHistory.push(errorInfo);

    // Keep only last 1000 errors to prevent memory issues
    if (this.errorHistory.length > 1000) {
      this.errorHistory.shift();
    }
  }

  /**
   * Get error statistics
   */
  getErrorStats() {
    const stats = {
      totalErrors: this.errorHistory.length,
      errorsByCategory: {},
      errorsBySeverity: {},
      recentErrors: this.errorHistory.slice(-10),
      errorRates: this.calculateErrorRates(),
      timestamp: new Date().toISOString()
    };

    // Count by category
    Object.values(ERROR_CATEGORIES).forEach(category => {
      stats.errorsByCategory[category] = this.errorHistory.filter(
        e => e.category === category
      ).length;
    });

    // Count by severity
    Object.values(ERROR_LEVELS).forEach(severity => {
      stats.errorsBySeverity[severity] = this.errorHistory.filter(
        e => e.severity === severity
      ).length;
    });

    return stats;
  }

  /**
   * Calculate error rates over time
   */
  calculateErrorRates() {
    const now = Date.now();
    const hourAgo = now - (60 * 60 * 1000);
    const dayAgo = now - (24 * 60 * 60 * 1000);

    const recentErrors = this.errorHistory.filter(
      e => new Date(e.timestamp).getTime() > hourAgo
    );

    const dailyErrors = this.errorHistory.filter(
      e => new Date(e.timestamp).getTime() > dayAgo
    );

    return {
      lastHour: recentErrors.length,
      last24Hours: dailyErrors.length,
      averagePerHour: Math.round(dailyErrors.length / 24),
      criticalInLastHour: recentErrors.filter(e => e.severity === ERROR_LEVELS.CRITICAL).length
    };
  }

  /**
   * Generate unique error ID
   */
  generateErrorId() {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Reset error counts (called periodically)
   */
  resetErrorCounts() {
    this.errorCount.clear();
    console.log('🔄 Error counts reset');
  }

  /**
   * Cleanup old error history
   */
  cleanupErrorHistory() {
    const cutoff = Date.now() - (7 * 24 * 60 * 60 * 1000); // 7 days
    const originalLength = this.errorHistory.length;

    this.errorHistory = this.errorHistory.filter(
      error => new Date(error.timestamp).getTime() > cutoff
    );

    const cleaned = originalLength - this.errorHistory.length;
    if (cleaned > 0) {
      console.log(`🧹 Cleaned ${cleaned} old error records`);
    }
  }

  /**
   * Export error data for analysis
   */
  exportErrorData() {
    return {
      stats: this.getErrorStats(),
      errorCounts: Object.fromEntries(this.errorCount),
      recentHistory: this.errorHistory.slice(-100),
      configuration: {
        alertThresholds: this.alertThresholds,
        logLevel: this.logger.level
      }
    };
  }

  /**
   * Health check for error handling system
   */
  healthCheck() {
    const stats = this.getErrorStats();
    const criticalErrors = stats.errorRates.criticalInLastHour;

    return {
      status: criticalErrors > 0 ? 'degraded' : 'healthy',
      criticalErrors,
      totalErrors: stats.totalErrors,
      errorRate: stats.errorRates.lastHour,
      systemHealth: criticalErrors === 0 ? 'good' : 'needs_attention'
    };
  }
}

// Create singleton instance
export const errorHandler = new ErrorHandlingService();

// Express error handling middleware
export const globalErrorHandler = (err, req, res, next) => {
  const context = {
    userId: req.user?.id,
    endpoint: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    requestId: req.id || req.headers['x-request-id'],
    body: req.method !== 'GET' ? req.body : undefined,
    query: req.query
  };

  const errorInfo = errorHandler.handleError(err, context);

  // Don't expose internal errors in production
  const isProduction = process.env.NODE_ENV === 'production';

  let statusCode = err.status || err.statusCode || 500;
  let message = err.message || 'Internal server error';

  // Sanitize error message for production
  if (isProduction && statusCode === 500) {
    message = 'An unexpected error occurred. Please try again.';
  }

  res.status(statusCode).json({
    error: {
      message,
      errorId: errorInfo.id,
      timestamp: errorInfo.timestamp,
      ...(isProduction ? {} : { stack: err.stack })
    }
  });
};

// Async error wrapper
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Error factory functions
export const createError = (message, status = 500, category = ERROR_CATEGORIES.SYSTEM) => {
  const error = new Error(message);
  error.status = status;
  error.category = category;
  return error;
};

export const createValidationError = (message, field = null) => {
  const error = createError(message, 422, ERROR_CATEGORIES.VALIDATION);
  error.field = field;
  return error;
};

export const createAuthError = (message = 'Authentication failed') => {
  return createError(message, 401, ERROR_CATEGORIES.AUTHENTICATION);
};

export const createAuthorizationError = (message = 'Insufficient permissions') => {
  return createError(message, 403, ERROR_CATEGORIES.AUTHORIZATION);
};

export default errorHandler;