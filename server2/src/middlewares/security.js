// src/middlewares/security.js
// Consolidated security middleware (rate limiting moved to rateLimitConfig.js)
import helmet from 'helmet';
import morgan from 'morgan';

// =====================================================
// Security Headers with Helmet
// =====================================================

export const securityHeaders = helmet({
  // Configure Content Security Policy
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      scriptSrc: ["'self'", "https://accounts.google.com"],
      connectSrc: ["'self'", "https://api.gemini.google.com", "https://accounts.google.com", "https://oauth2.googleapis.com", "wss:", "https:"],
      frameSrc: ["https://accounts.google.com"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
    },
  },

  // Configure other security headers
  crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" }, // Required for Google Sign-In popup flow
  crossOriginEmbedderPolicy: false, // Disable for file uploads
  crossOriginResourcePolicy: { policy: "cross-origin" },

  // HSTS (HTTP Strict Transport Security)
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  },

  // Additional security headers
  noSniff: true,
  frameguard: { action: 'deny' },
  xssFilter: true,
  referrerPolicy: { policy: 'same-origin' }
});

// =====================================================
// Request Logging
// =====================================================

// Development logging format
const devLogFormat = ':method :url :status :res[content-length] - :response-time ms :user-agent';

// Production logging format (more comprehensive)
const prodLogFormat = ':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" :response-time ms';

export const requestLogger = morgan(process.env.NODE_ENV === 'production' ? prodLogFormat : devLogFormat, {
  skip: (req) => {
    // Skip logging for health checks in production
    if (process.env.NODE_ENV === 'production') {
      return req.path === '/health' || req.path === '/ping';
    }
    return false;
  }
});

// =====================================================
// Security Utilities
// =====================================================

// Middleware to add security headers for file uploads
export const fileUploadSecurity = (req, res, next) => {
  // Set additional headers for file uploads
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');

  // Validate file upload headers
  const contentType = req.headers['content-type'];
  if (contentType && contentType.includes('multipart/form-data')) {
    // Validate Content-Length for uploads
    const contentLength = parseInt(req.headers['content-length'] || '0');
    const maxSize = 50 * 1024 * 1024; // 50MB max

    if (contentLength > maxSize) {
      return res.status(413).json({
        error: 'File too large',
        maxSize: '50MB'
      });
    }
  }

  next();
};

// Middleware to sanitize request headers
export const sanitizeHeaders = (req, res, next) => {
  // Remove potentially dangerous headers
  delete req.headers['x-forwarded-host'];
  delete req.headers['x-forwarded-proto'];

  // Validate critical headers
  if (req.headers.authorization) {
    const authHeader = req.headers.authorization;
    if (!authHeader.startsWith('Bearer ') && !authHeader.startsWith('Basic ')) {
      delete req.headers.authorization;
    }
  }

  next();
};

// Middleware to add request ID for tracking
export const addRequestId = (req, res, next) => {
  req.requestId = Math.random().toString(36).substring(2, 15) +
                  Math.random().toString(36).substring(2, 15);
  res.setHeader('X-Request-ID', req.requestId);
  next();
};

// =====================================================
// Error Handling Security
// =====================================================

// Security-aware error handler
export const securityErrorHandler = (err, req, res, next) => {
  // Log security-related errors
  if (err.status === 429) {
    console.warn(`Rate limit exceeded for IP: ${req.ip}, Path: ${req.path}, Time: ${new Date().toISOString()}`);
  }

  // Don't expose internal errors in production
  if (process.env.NODE_ENV === 'production') {
    // Generic error response for production
    if (err.status >= 500) {
      return res.status(500).json({
        error: 'Internal server error',
        requestId: req.requestId
      });
    }
  }

  // Pass to default error handler
  next(err);
};

// =====================================================
// IP Whitelist/Blacklist (optional)
// =====================================================

// Middleware to check IP whitelist (if configured)
export const ipWhitelist = (req, res, next) => {
  const whitelist = process.env.IP_WHITELIST?.split(',') || [];

  if (whitelist.length > 0) {
    const clientIP = req.ip || req.connection.remoteAddress;

    if (!whitelist.includes(clientIP)) {
      return res.status(403).json({
        error: 'Access denied from this IP address'
      });
    }
  }

  next();
};

// =====================================================
// Export all middleware as a security suite
// Note: Rate limiting is now in rateLimitConfig.js
// =====================================================

export const securitySuite = {
  headers: securityHeaders,
  logging: requestLogger,
  utils: {
    fileUpload: fileUploadSecurity,
    sanitizeHeaders,
    addRequestId,
    ipWhitelist
  },
  errorHandler: securityErrorHandler
};
