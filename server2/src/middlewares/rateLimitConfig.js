// src/middlewares/rateLimitConfig.js
import rateLimit from 'express-rate-limit';
import slowDown from 'express-slow-down';

/**
 * Production-ready rate limiting configuration for ShelfQuest API
 * Following Priority 1.2 from PRODUCTION_DEPLOYMENT_GUIDE.md
 */

// =====================================================
// Helper: Check if request is from localhost (development)
// =====================================================

/**
 * Check if request is from localhost in development mode
 * Handles IPv4, IPv6, and IPv4-mapped IPv6 addresses
 */
const isLocalhostDev = (req) => {
  if (process.env.NODE_ENV !== 'development') {
    return false;
  }
  const ip = req.ip || '';
  return (
    ip === '::1' ||
    ip === '127.0.0.1' ||
    ip === 'localhost' ||
    ip === '::ffff:127.0.0.1' ||
    ip.startsWith('::ffff:127.')
  );
};

// =====================================================
// Rate Limit Configurations
// =====================================================

/**
 * General API rate limiter
 * Protects all endpoints from abuse
 */
export const generalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    code: 'RATE_LIMIT_EXCEEDED',
    retryAfter: '15 minutes'
  },
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  // Skip rate limiting for localhost in development
  skip: isLocalhostDev,
  handler: (req, res) => {
    console.warn(`⚠️ Rate limit exceeded for IP: ${req.ip}, Path: ${req.path}`);
    res.status(429).json({
      error: 'Too many requests from this IP, please try again later.',
      code: 'RATE_LIMIT_EXCEEDED',
      retryAfter: '15 minutes'
    });
  }
});

/**
 * Authentication endpoints rate limiter
 * Stricter limits to prevent brute force attacks
 */
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 failed auth attempts per windowMs
  message: {
    error: 'Too many authentication attempts, please try again later.',
    code: 'AUTH_RATE_LIMIT_EXCEEDED',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
  // Skip rate limiting for localhost in development
  skip: isLocalhostDev,
  handler: (req, res) => {
    console.warn(`🔐 Auth rate limit exceeded for IP: ${req.ip}, Path: ${req.path}`);
    res.status(429).json({
      error: 'Too many authentication attempts from this IP. Your account security is important to us.',
      code: 'AUTH_RATE_LIMIT_EXCEEDED',
      retryAfter: '15 minutes',
      suggestion: 'If you forgot your password, please use the password reset function.'
    });
  }
});

/**
 * File upload rate limiter
 * Prevents abuse of upload endpoints
 */
export const uploadRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Limit each IP to 10 uploads per hour
  message: {
    error: 'Upload limit exceeded. Please try again later.',
    code: 'UPLOAD_RATE_LIMIT_EXCEEDED',
    retryAfter: '1 hour'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip rate limiting for localhost in development
  skip: isLocalhostDev,
  handler: (req, res) => {
    console.warn(`📤 Upload rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      error: 'You have exceeded the upload limit. Please try again later.',
      code: 'UPLOAD_RATE_LIMIT_EXCEEDED',
      retryAfter: '1 hour',
      currentLimit: '10 uploads per hour'
    });
  }
});

/**
 * API endpoints rate limiter
 * Moderate limits for general API usage
 */
export const apiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Limit each IP to 200 API requests per windowMs
  message: {
    error: 'API rate limit exceeded.',
    code: 'API_RATE_LIMIT_EXCEEDED',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip rate limiting for localhost in development
  skip: isLocalhostDev,
  handler: (req, res) => {
    console.warn(`🔌 API rate limit exceeded for IP: ${req.ip}, Path: ${req.path}`);
    res.status(429).json({
      error: 'You have exceeded the API rate limit. Please try again later.',
      code: 'API_RATE_LIMIT_EXCEEDED',
      retryAfter: '15 minutes'
    });
  }
});

/**
 * Gamification endpoints rate limiter
 * Prevents farming/exploitation of points system
 */
export const gamificationRateLimit = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 30, // Limit each IP to 30 gamification actions per 5 minutes
  message: {
    error: 'Too many actions. Please slow down.',
    code: 'GAMIFICATION_RATE_LIMIT_EXCEEDED',
    retryAfter: '5 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip rate limiting for localhost in development
  skip: isLocalhostDev,
  handler: (req, res) => {
    console.warn(`🎮 Gamification rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      error: 'Too many actions detected. Please slow down to prevent gaming the system.',
      code: 'GAMIFICATION_RATE_LIMIT_EXCEEDED',
      retryAfter: '5 minutes'
    });
  }
});

// =====================================================
// Slow Down Configurations
// =====================================================

/**
 * Slow down middleware for auth endpoints
 * Gradually slows down responses after multiple attempts
 */
export const authSlowDown = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutes
  delayAfter: 3, // Allow 3 requests at full speed, then...
  delayMs: (hits) => hits * 500, // Add 500ms delay per request after delayAfter
  maxDelayMs: 10000, // Maximum delay of 10 seconds
  skipSuccessfulRequests: true // Don't count successful requests
  // Note: onLimitReached removed - deprecated in express-slow-down v2
});

/**
 * General slow down middleware
 * Applies to all routes as a secondary defense
 */
export const generalSlowDown = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutes
  delayAfter: 50, // Allow 50 requests at full speed
  delayMs: (hits) => hits * 100, // Add 100ms delay per request after delayAfter
  maxDelayMs: 5000, // Maximum delay of 5 seconds
  skip: (req) => {
    // Skip slowdown for health checks and static files
    return req.path === '/health' || req.path === '/' || req.path.startsWith('/static');
  }
});

// =====================================================
// Export grouped configuration
// =====================================================

export const rateLimitSuite = {
  general: generalRateLimit,
  auth: authRateLimit,
  upload: uploadRateLimit,
  api: apiRateLimit,
  gamification: gamificationRateLimit
};

export const slowDownSuite = {
  auth: authSlowDown,
  general: generalSlowDown
};

// Default export for backward compatibility
export default rateLimitSuite;
