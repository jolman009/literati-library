// src/middleware/security.js
import rateLimit from 'express-rate-limit';
import slowDown from 'express-slow-down';
import helmet from 'helmet';
import morgan from 'morgan';

// =====================================================
// Rate Limiting Configuration
// =====================================================

// General API rate limiting
export const generalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path === '/health' || req.path === '/ping';
  }
});

// Strict rate limiting for authentication endpoints
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 auth requests per windowMs
  message: {
    error: 'Too many authentication attempts, please try again later.',
    retryAfter: '15 minutes',
    hint: 'For security, authentication requests are limited.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
});

// Rate limiting for file uploads
export const uploadRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // limit each IP to 20 uploads per hour
  message: {
    error: 'Too many file uploads, please try again later.',
    retryAfter: '1 hour'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting for gamification actions (prevent point farming)
export const gamificationRateLimit = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 50, // limit each IP to 50 gamification actions per 5 minutes
  message: {
    error: 'Too many gamification actions, please slow down.',
    retryAfter: '5 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// =====================================================
// Slow Down Middleware (Progressive delays)
// =====================================================

export const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutes
  delayAfter: 50, // allow 50 requests per 15 minutes at full speed
  delayMs: () => 100, // add 100ms delay per request after delayAfter
  maxDelayMs: 2000, // max delay of 2 seconds
  skip: (req) => {
    return req.path === '/health' || req.path === '/ping';
  }
});

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
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", "https://api.gemini.google.com", "wss:", "https:"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
    },
  },

  // Configure other security headers
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
// =====================================================

export const securitySuite = {
  headers: securityHeaders,
  rateLimit: {
    general: generalRateLimit,
    auth: authRateLimit,
    upload: uploadRateLimit,
    gamification: gamificationRateLimit
  },
  slowDown: speedLimiter,
  logging: requestLogger,
  utils: {
    fileUpload: fileUploadSecurity,
    sanitizeHeaders,
    addRequestId,
    ipWhitelist
  },
  errorHandler: securityErrorHandler
};