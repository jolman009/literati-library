import winston from 'winston';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Custom format for structured logging
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Console format for development
const consoleFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'HH:mm:ss'
  }),
  winston.format.colorize(),
  winston.format.printf(({ timestamp, level, message, service, requestId, userId, ...meta }) => {
    let logMessage = `${timestamp} [${level}] ${service || 'literati-api'}: ${message}`;

    if (requestId) {
      logMessage += ` [req:${requestId}]`;
    }

    if (userId) {
      logMessage += ` [user:${userId}]`;
    }

    if (Object.keys(meta).length > 0) {
      logMessage += ` ${JSON.stringify(meta)}`;
    }

    return logMessage;
  })
);

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../../logs');

// Configure transports based on environment
const createTransports = () => {
  const transports = [];
  const environment = process.env.NODE_ENV || 'development';

  // Console transport for all environments
  transports.push(
    new winston.transports.Console({
      level: environment === 'production' ? 'info' : 'debug',
      format: environment === 'production' ? logFormat : consoleFormat
    })
  );

  // File transports for production and staging
  if (environment !== 'development') {
    // Error logs
    transports.push(
      new winston.transports.File({
        filename: path.join(logsDir, 'error.log'),
        level: 'error',
        format: logFormat,
        maxsize: 10 * 1024 * 1024, // 10MB
        maxFiles: 5,
      })
    );

    // Combined logs
    transports.push(
      new winston.transports.File({
        filename: path.join(logsDir, 'combined.log'),
        format: logFormat,
        maxsize: 10 * 1024 * 1024, // 10MB
        maxFiles: 5,
      })
    );

    // Access logs (separate from general application logs)
    transports.push(
      new winston.transports.File({
        filename: path.join(logsDir, 'access.log'),
        level: 'info',
        format: logFormat,
        maxsize: 10 * 1024 * 1024, // 10MB
        maxFiles: 10,
      })
    );
  }

  return transports;
};

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
  format: logFormat,
  transports: createTransports(),
  // Don't exit on handled exceptions
  exitOnError: false,
  // Handle uncaught exceptions
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(logsDir, 'exceptions.log'),
      format: logFormat,
    })
  ],
  // Handle unhandled rejections
  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(logsDir, 'rejections.log'),
      format: logFormat,
    })
  ]
});

// Create specialized loggers for different components
const createComponentLogger = (component) => {
  return logger.child({ service: `literati-api-${component}` });
};

// Specialized loggers
export const authLogger = createComponentLogger('auth');
export const apiLogger = createComponentLogger('api');
export const securityLogger = createComponentLogger('security');
export const errorLogger = createComponentLogger('error');
export const performanceLogger = createComponentLogger('performance');
export const dbLogger = createComponentLogger('database');

// Request logging middleware
export const requestLoggingMiddleware = (req, res, next) => {
  const start = Date.now();

  // Add request metadata
  req.requestId = req.requestId || Math.random().toString(36).substr(2, 9);

  // Log request start
  apiLogger.info('Request started', {
    method: req.method,
    url: req.url,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    requestId: req.requestId,
    userId: req.user?.id
  });

  // Override res.json to log response
  const originalJson = res.json;
  res.json = function(data) {
    const duration = Date.now() - start;

    // Log response
    apiLogger.info('Request completed', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration,
      requestId: req.requestId,
      userId: req.user?.id,
      responseSize: JSON.stringify(data).length
    });

    return originalJson.call(this, data);
  };

  next();
};

// Error logging middleware
export const errorLoggingMiddleware = (err, req, res, next) => {
  const errorInfo = {
    error: {
      message: err.message,
      stack: err.stack,
      name: err.name,
    },
    request: {
      method: req.method,
      url: req.url,
      headers: req.headers,
      body: req.body,
      params: req.params,
      query: req.query,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    },
    user: req.user ? { id: req.user.id, email: req.user.email } : null,
    requestId: req.requestId,
    timestamp: new Date().toISOString(),
  };

  // Log based on error severity
  if (err.status >= 500 || !err.status) {
    errorLogger.error('Server error occurred', errorInfo);
  } else if (err.status >= 400) {
    errorLogger.warn('Client error occurred', errorInfo);
  }

  next(err);
};

// Security event logging
export const logSecurityEvent = (eventType, details, req = null) => {
  const securityEvent = {
    eventType,
    details,
    timestamp: new Date().toISOString(),
    ...(req && {
      request: {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        url: req.url,
        method: req.method,
      },
      user: req.user ? { id: req.user.id, email: req.user.email } : null,
      requestId: req.requestId,
    })
  };

  securityLogger.warn('Security event', securityEvent);
};

// Performance logging
export const logPerformanceMetric = (metric, value, context = {}) => {
  performanceLogger.info('Performance metric', {
    metric,
    value,
    context,
    timestamp: new Date().toISOString(),
  });
};

// Database operation logging
export const logDatabaseOperation = (operation, table, duration, success = true, error = null) => {
  const logData = {
    operation,
    table,
    duration,
    success,
    timestamp: new Date().toISOString(),
  };

  if (error) {
    logData.error = {
      message: error.message,
      stack: error.stack,
    };
  }

  if (success) {
    dbLogger.debug('Database operation completed', logData);
  } else {
    dbLogger.error('Database operation failed', logData);
  }
};

// Authentication logging
export const logAuthEvent = (eventType, userId, details = {}, req = null) => {
  const authEvent = {
    eventType,
    userId,
    details,
    timestamp: new Date().toISOString(),
    ...(req && {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      requestId: req.requestId,
    })
  };

  authLogger.info('Authentication event', authEvent);
};

// Health check logging (minimal)
export const logHealthCheck = (service, status, details = {}) => {
  logger.debug('Health check', {
    service,
    status,
    details,
    timestamp: new Date().toISOString(),
  });
};

// Export main logger and utility functions
export default logger;

// Export utility function to create child loggers
export { createComponentLogger };

// Graceful shutdown logging
process.on('SIGTERM', () => {
  logger.info('Received SIGTERM, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('Received SIGINT, shutting down gracefully');
  process.exit(0);
});