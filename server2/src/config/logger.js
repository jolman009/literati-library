/**
 * Winston Logger Configuration with Loki Transport
 * Centralized logging for ShelfQuest server
 */

import winston from 'winston';
import LokiTransport from 'winston-loki';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure logs directory exists
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...metadata }) => {
    let msg = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(metadata).length > 0) {
      msg += ` ${JSON.stringify(metadata)}`;
    }
    return msg;
  })
);

// Transports array
const transports = [];

// Console transport (always enabled)
transports.push(
  new winston.transports.Console({
    format: process.env.NODE_ENV === 'production' ? logFormat : consoleFormat,
    level: process.env.LOG_LEVEL || 'info'
  })
);

// File transports
transports.push(
  // All logs
  new winston.transports.File({
    filename: path.join(logsDir, 'combined.log'),
    format: logFormat,
    maxsize: 10485760, // 10MB
    maxFiles: 5,
    tailable: true
  }),
  // Error logs
  new winston.transports.File({
    filename: path.join(logsDir, 'error.log'),
    level: 'error',
    format: logFormat,
    maxsize: 10485760, // 10MB
    maxFiles: 5,
    tailable: true
  })
);

// Loki transport (production or if explicitly enabled)
if (process.env.NODE_ENV === 'production' || process.env.ENABLE_LOKI === 'true') {
  const lokiHost = process.env.LOKI_HOST || 'http://localhost:3100';

  transports.push(
    new LokiTransport({
      host: lokiHost,
      labels: {
        app: 'shelfquest',
        service: 'server',
        environment: process.env.NODE_ENV || 'development'
      },
      json: true,
      format: winston.format.json(),
      replaceTimestamp: true,
      onConnectionError: (err) => {
        console.error('Error connecting to Loki:', err);
      },
      // Batching configuration
      batching: true,
      interval: 5, // seconds
      // Additional metadata
      basicAuth: process.env.LOKI_BASIC_AUTH || undefined,
    })
  );

  console.log(`📡 Loki transport enabled: ${lokiHost}`);
}

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: {
    service: 'shelfquest-server',
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0'
  },
  transports,
  // Handle exceptions and rejections
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(logsDir, 'exceptions.log'),
      maxsize: 10485760,
      maxFiles: 3
    })
  ],
  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(logsDir, 'rejections.log'),
      maxsize: 10485760,
      maxFiles: 3
    })
  ]
});

// Helper methods for structured logging
logger.logRequest = (req, res, duration) => {
  logger.info('HTTP Request', {
    method: req.method,
    url: req.originalUrl,
    statusCode: res.statusCode,
    duration: `${duration}ms`,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.id,
    requestId: req.requestId
  });
};

logger.logError = (error, context = {}) => {
  logger.error('Application Error', {
    message: error.message,
    stack: error.stack,
    ...context
  });
};

logger.logSecurity = (event, details = {}) => {
  logger.warn('Security Event', {
    event,
    ...details,
    timestamp: new Date().toISOString()
  });
};

logger.logDatabase = (operation, table, duration, details = {}) => {
  logger.debug('Database Operation', {
    operation,
    table,
    duration: `${duration}ms`,
    ...details
  });
};

logger.logBusiness = (metric, value, metadata = {}) => {
  logger.info('Business Metric', {
    metric,
    value,
    ...metadata
  });
};

// Stream for Morgan (HTTP request logging)
logger.stream = {
  write: (message) => {
    logger.info(message.trim());
  }
};

// Log startup information
logger.info('Logger initialized', {
  level: process.env.LOG_LEVEL || 'info',
  environment: process.env.NODE_ENV || 'development',
  lokiEnabled: process.env.NODE_ENV === 'production' || process.env.ENABLE_LOKI === 'true',
  transports: transports.map(t => t.constructor.name)
});

export default logger;
