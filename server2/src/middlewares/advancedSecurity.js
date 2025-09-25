// src/middlewares/advancedSecurity.js
// import rateLimit from 'express-rate-limit'; // Temporarily disabled due to IPv6 issue
import crypto from 'crypto';
import { validationResult } from 'express-validator';

// =====================================================
// Advanced Input Sanitization
// =====================================================

/**
 * Deep sanitization of request body, query, and params
 */
export const deepSanitize = (req, res, next) => {
  const sanitizeValue = (value) => {
    if (typeof value === 'string') {
      // Remove potentially dangerous characters and sequences
      return value
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
        .replace(/javascript:/gi, '') // Remove javascript: protocol
        .replace(/on\w+\s*=/gi, '') // Remove event handlers
        .replace(/data:text\/html/gi, '') // Remove data URLs
        .replace(/vbscript:/gi, '') // Remove vbscript
        .replace(/mocha:/gi, '') // Remove mocha protocol
        .replace(/livescript:/gi, '') // Remove livescript protocol
        .trim();
    }

    if (Array.isArray(value)) {
      return value.map(sanitizeValue);
    }

    if (value && typeof value === 'object') {
      const sanitized = {};
      for (const [key, val] of Object.entries(value)) {
        sanitized[key] = sanitizeValue(val);
      }
      return sanitized;
    }

    return value;
  };

  // Sanitize request body
  if (req.body) {
    req.body = sanitizeValue(req.body);
  }

  // Sanitize query parameters
  if (req.query) {
    req.query = sanitizeValue(req.query);
  }

  // Sanitize URL parameters
  if (req.params) {
    req.params = sanitizeValue(req.params);
  }

  next();
};

/**
 * SQL Injection protection
 */
export const sqlInjectionProtection = (req, res, next) => {
  const sqlPatterns = [
    /(\b(ALTER|CREATE|DELETE|DROP|EXEC(UTE)?|INSERT( +INTO)?|MERGE|SELECT|UPDATE|UNION( +ALL)?)\b)/i,
    /((\b(AND|OR)\b.{1,6}?(=|>|<|\bIN\b|\bLIKE\b))|(\bLIKE\b.{1,10}?%)|(\bIN\b.{1,10}?\()|(\b(AND|OR)\b.{1,6}?\b(true|false)\b))/i,
    /\b(DROP|EXEC|EXECUTE|SP_|XP_)\b/i,
    /((\%27)|(\'))((\%6F)|o|(\%4F))((\%72)|r|(\%52))/i, // Common SQL injection patterns
    /((\%27)|(\'))union/i
  ];

  const checkForSQLInjection = (value) => {
    if (typeof value === 'string') {
      return sqlPatterns.some(pattern => pattern.test(value));
    }

    if (Array.isArray(value)) {
      return value.some(checkForSQLInjection);
    }

    if (value && typeof value === 'object') {
      return Object.values(value).some(checkForSQLInjection);
    }

    return false;
  };

  // Check all input sources
  const inputs = [req.body, req.query, req.params].filter(Boolean);

  for (const input of inputs) {
    if (checkForSQLInjection(input)) {
      console.warn(`SQL injection attempt detected from IP: ${req.ip}, Path: ${req.path}, Time: ${new Date().toISOString()}`);
      return res.status(400).json({
        error: 'Invalid input detected',
        code: 'INVALID_INPUT',
        requestId: req.requestId
      });
    }
  }

  next();
};

/**
 * NoSQL Injection protection
 */
export const noSQLInjectionProtection = (req, res, next) => {
  const checkForNoSQLInjection = (obj) => {
    if (!obj || typeof obj !== 'object') return false;

    // Check for MongoDB injection patterns
    const dangerousKeys = ['$where', '$ne', '$in', '$nin', '$gt', '$gte', '$lt', '$lte', '$regex', '$exists'];

    const hasDangerousKeys = (object) => {
      if (Array.isArray(object)) {
        return object.some(hasDangerousKeys);
      }

      if (object && typeof object === 'object') {
        return Object.keys(object).some(key =>
          dangerousKeys.includes(key) || hasDangerousKeys(object[key])
        );
      }

      return false;
    };

    return hasDangerousKeys(obj);
  };

  if (checkForNoSQLInjection(req.body) || checkForNoSQLInjection(req.query)) {
    console.warn(`NoSQL injection attempt detected from IP: ${req.ip}, Path: ${req.path}, Time: ${new Date().toISOString()}`);
    return res.status(400).json({
      error: 'Invalid query structure detected',
      code: 'INVALID_QUERY',
      requestId: req.requestId
    });
  }

  next();
};

// =====================================================
// Advanced Rate Limiting
// =====================================================

/**
 * Adaptive rate limiting based on user behavior
 */
export const adaptiveRateLimit = (req, res, next) => {
  // Temporarily disable rate limiting to fix server startup
  next();
};

/**
 * Strict rate limiting for sensitive operations
 */
export const sensitiveOperationRateLimit = (req, res, next) => {
  // Temporarily disable rate limiting to fix server startup
  next();
};

// =====================================================
// Request Validation and Monitoring
// =====================================================

/**
 * Monitor suspicious request patterns
 */
export const suspiciousActivityMonitor = (req, res, next) => {
  const suspicious = {
    score: 0,
    reasons: []
  };

  // Check for missing or suspicious User-Agent
  const userAgent = req.headers['user-agent'] || '';
  if (!userAgent || userAgent.length < 10) {
    suspicious.score += 2;
    suspicious.reasons.push('Missing or suspicious User-Agent');
  }

  // Check for too many requests from same IP in short time
  // (This would be better implemented with Redis in production)
  const ipKey = `requests_${req.ip}`;
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute window

  // Simple in-memory tracking (replace with Redis in production)
  if (!global.requestTracker) {
    global.requestTracker = new Map();
  }

  const requests = global.requestTracker.get(ipKey) || [];
  const recentRequests = requests.filter(time => now - time < windowMs);
  recentRequests.push(now);
  global.requestTracker.set(ipKey, recentRequests);

  if (recentRequests.length > 50) {
    suspicious.score += 3;
    suspicious.reasons.push('High request frequency');
  }

  // Check for malformed headers
  const hasInvalidHeaders = Object.keys(req.headers).some(header => {
    return header.includes('\n') || header.includes('\r') || header.length > 100;
  });

  if (hasInvalidHeaders) {
    suspicious.score += 3;
    suspicious.reasons.push('Malformed headers');
  }

  // Check request size
  const contentLength = parseInt(req.headers['content-length'] || '0');
  if (contentLength > 50 * 1024 * 1024) { // 50MB
    suspicious.score += 2;
    suspicious.reasons.push('Large request size');
  }

  // Log suspicious activity
  if (suspicious.score >= 4) {
    console.warn(`Suspicious activity detected:`, {
      ip: req.ip,
      path: req.path,
      method: req.method,
      userAgent,
      score: suspicious.score,
      reasons: suspicious.reasons,
      timestamp: new Date().toISOString()
    });

    // You could implement blocking here based on score
    // For now, just log and continue
  }

  // Add suspicious score to request for potential use in other middleware
  req.suspiciousScore = suspicious.score;

  next();
};

/**
 * CSRF Protection
 */
export const csrfProtection = (req, res, next) => {
  // Skip CSRF for GET, HEAD, OPTIONS
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  // Skip for API endpoints using Bearer tokens
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    return next();
  }

  // Check for CSRF token in header or body
  const csrfToken = req.headers['x-csrf-token'] || req.body.csrfToken;

  if (!csrfToken) {
    return res.status(403).json({
      error: 'CSRF token required',
      code: 'CSRF_TOKEN_REQUIRED',
      requestId: req.requestId
    });
  }

  // Verify CSRF token (simplified - in production use a proper CSRF library)
  const expectedToken = crypto
    .createHmac('sha256', process.env.JWT_SECRET || 'fallback-secret')
    .update(`${req.ip}:${req.headers['user-agent']}`)
    .digest('hex');

  if (csrfToken !== expectedToken) {
    console.warn(`CSRF token mismatch from IP: ${req.ip}, Path: ${req.path}`);
    return res.status(403).json({
      error: 'Invalid CSRF token',
      code: 'INVALID_CSRF_TOKEN',
      requestId: req.requestId
    });
  }

  next();
};

/**
 * Generate CSRF token endpoint
 */
export const generateCSRFToken = (req, res) => {
  const token = crypto
    .createHmac('sha256', process.env.JWT_SECRET || 'fallback-secret')
    .update(`${req.ip}:${req.headers['user-agent']}`)
    .digest('hex');

  res.json({ csrfToken: token });
};

// =====================================================
// File Upload Security
// =====================================================

/**
 * Enhanced file upload security
 */
export const secureFileUpload = (req, res, next) => {
  if (!req.file && !req.files) {
    return next();
  }

  const file = req.file || (req.files && req.files[0]);

  if (!file) {
    return next();
  }

  // Check file signature (magic numbers) to verify actual file type
  const fileSignatures = {
    'application/pdf': [0x25, 0x50, 0x44, 0x46], // %PDF
    'application/epub+zip': [0x50, 0x4B, 0x03, 0x04], // ZIP file signature
    'text/plain': null // Text files don't have a specific signature
  };

  if (file.buffer) {
    const signature = fileSignatures[file.mimetype];
    if (signature) {
      const matches = signature.every((byte, index) => file.buffer[index] === byte);
      if (!matches) {
        return res.status(400).json({
          error: 'File content does not match declared type',
          code: 'INVALID_FILE_SIGNATURE'
        });
      }
    }
  }

  // Scan for malicious content patterns
  const maliciousPatterns = [
    /<script/i,
    /javascript:/i,
    /vbscript:/i,
    /onload=/i,
    /onerror=/i,
    /<iframe/i,
    /<object/i,
    /<embed/i
  ];

  if (file.buffer) {
    const content = file.buffer.toString('utf8', 0, Math.min(file.buffer.length, 1024));
    const hasMaliciousContent = maliciousPatterns.some(pattern => pattern.test(content));

    if (hasMaliciousContent) {
      console.warn(`Malicious file upload attempt from IP: ${req.ip}, filename: ${file.originalname}`);
      return res.status(400).json({
        error: 'File contains potentially malicious content',
        code: 'MALICIOUS_FILE_DETECTED'
      });
    }
  }

  next();
};

// =====================================================
// Password Security
// =====================================================

/**
 * Enhanced password validation with advanced security checks
 */
export const validatePasswordStrength = (req, res, next) => {
  const { password, email = '', name = '' } = req.body;

  if (!password) {
    return next();
  }

  const issues = [];
  let score = 0;

  // Length checks with scoring
  if (password.length < 8) {
    issues.push('Password must be at least 8 characters long');
  } else if (password.length >= 8) {
    score += 1;
  }

  if (password.length >= 12) {
    score += 1;
  }

  if (password.length > 128) {
    issues.push('Password must not exceed 128 characters');
  }

  // Complexity checks with scoring
  if (!/[a-z]/.test(password)) {
    issues.push('Password must contain at least one lowercase letter');
  } else {
    score += 1;
  }

  if (!/[A-Z]/.test(password)) {
    issues.push('Password must contain at least one uppercase letter');
  } else {
    score += 1;
  }

  if (!/\d/.test(password)) {
    issues.push('Password must contain at least one number');
  } else {
    score += 1;
  }

  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    issues.push('Password must contain at least one special character');
  } else {
    score += 1;
  }

  // Advanced entropy check
  const uniqueChars = new Set(password).size;
  if (uniqueChars < 6) {
    issues.push('Password must contain more variety of characters');
  } else if (uniqueChars >= 8) {
    score += 1;
  }

  // Enhanced common password checks
  const commonPasswords = [
    'password', '123456', '123456789', 'qwerty', 'abc123',
    'password123', 'admin', 'letmein', 'welcome', 'monkey',
    'dragon', 'master', 'football', 'baseball', 'superman',
    'trustno1', 'freedom', 'whatever', 'ninja', 'mustang',
    'access', 'shadow', 'jordan23', 'hunter', 'tiger',
    'google', 'facebook', 'linkedin', 'twitter', 'instagram'
  ];

  if (commonPasswords.includes(password.toLowerCase())) {
    issues.push('Password is too common and easily guessable');
  }

  // Sequential character check (enhanced)
  if (/(.)\1{2,}/.test(password)) {
    issues.push('Password cannot contain 3 or more repeated characters');
  }

  // Sequential patterns check
  const sequentialPatterns = [
    /123456/, /abcdef/, /qwerty/, /asdfgh/, /zxcvbn/,
    /654321/, /fedcba/, /987654/
  ];

  if (sequentialPatterns.some(pattern => pattern.test(password.toLowerCase()))) {
    issues.push('Password cannot contain sequential patterns');
  }

  // Personal information check
  if (email && password.toLowerCase().includes(email.split('@')[0].toLowerCase())) {
    issues.push('Password cannot contain your email username');
  }

  if (name && name.length > 2 && password.toLowerCase().includes(name.toLowerCase())) {
    issues.push('Password cannot contain your name');
  }

  // Date pattern check (common weakness)
  if (/\b(19|20)\d{2}\b/.test(password) || /\b\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}\b/.test(password)) {
    issues.push('Password should not contain dates');
  }

  // Keyboard pattern check
  const keyboardPatterns = [
    /qwert/, /asdf/, /zxcv/, /1234/, /098/, /yuiop/, /hjkl/, /bnm/
  ];

  if (keyboardPatterns.some(pattern => pattern.test(password.toLowerCase()))) {
    issues.push('Password cannot contain keyboard patterns');
  }

  // Calculate password strength
  let strength = 'weak';
  if (score >= 7 && issues.length === 0) {
    strength = 'very strong';
  } else if (score >= 5 && issues.length === 0) {
    strength = 'strong';
  } else if (score >= 3 && issues.length === 0) {
    strength = 'moderate';
  }

  // Add strength info to response for client-side feedback
  req.passwordStrength = {
    score,
    strength,
    issues: issues.length
  };

  if (issues.length > 0) {
    return res.status(400).json({
      error: 'Password does not meet security requirements',
      issues,
      code: 'WEAK_PASSWORD',
      strength: {
        score,
        level: strength,
        maxScore: 7
      },
      suggestions: [
        'Use a mix of uppercase and lowercase letters',
        'Include numbers and special characters',
        'Make it at least 12 characters long',
        'Avoid personal information and common words',
        'Avoid keyboard patterns and sequences'
      ]
    });
  }

  // Log password strength for monitoring (without password content)
  console.log(`Password validation passed - Strength: ${strength}, Score: ${score}/7, IP: ${req.ip}`);

  next();
};

/**
 * Check password against known breach databases
 * Uses k-Anonymity approach to protect password privacy
 */
export const checkPasswordBreach = async (req, res, next) => {
  const { password } = req.body;

  if (!password) {
    return next();
  }

  try {
    // Use SHA-1 hash for HIBP API (industry standard)
    const crypto = await import('crypto');
    const hash = crypto.createHash('sha1').update(password).digest('hex').toUpperCase();
    const prefix = hash.substring(0, 5);
    const suffix = hash.substring(5);

    // Check against Have I Been Pwned API using k-Anonymity
    // This only sends the first 5 characters of the hash for privacy
    const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`);

    if (!response.ok) {
      // If API is down, log warning but don't block user
      console.warn('Password breach check API unavailable');
      return next();
    }

    const breachData = await response.text();
    const lines = breachData.split('\n');

    for (const line of lines) {
      const [hashSuffix, count] = line.split(':');
      if (hashSuffix === suffix) {
        const breachCount = parseInt(count, 10);

        if (breachCount > 0) {
          return res.status(400).json({
            error: 'Password has been found in data breaches',
            code: 'BREACHED_PASSWORD',
            breachCount,
            suggestion: 'Please choose a different password that has not been compromised',
            requestId: req.requestId
          });
        }
      }
    }

    // Password not found in breaches
    console.log(`Password breach check passed for IP: ${req.ip}`);
    next();

  } catch (error) {
    // If breach check fails, log error but don't block user
    console.warn('Password breach check failed:', error.message);
    next();
  }
};

/**
 * Real-time password strength calculator (for API responses)
 */
export const calculatePasswordStrength = (password, email = '', name = '') => {
  if (!password) {
    return { score: 0, strength: 'none', issues: ['Password is required'] };
  }

  const issues = [];
  let score = 0;

  // Reuse the same logic as the middleware for consistency
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[a-z]/.test(password)) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score += 1;

  const uniqueChars = new Set(password).size;
  if (uniqueChars >= 8) score += 1;

  // Calculate strength level
  let strength = 'weak';
  if (score >= 7) strength = 'very strong';
  else if (score >= 5) strength = 'strong';
  else if (score >= 3) strength = 'moderate';

  return {
    score,
    strength,
    maxScore: 7,
    uniqueCharacters: uniqueChars,
    length: password.length
  };
};

// =====================================================
// Export Security Suite
// =====================================================

export const advancedSecuritySuite = {
  sanitization: {
    deep: deepSanitize,
    sqlInjection: sqlInjectionProtection,
    noSQLInjection: noSQLInjectionProtection
  },
  rateLimit: {
    adaptive: adaptiveRateLimit,
    sensitive: sensitiveOperationRateLimit
  },
  monitoring: {
    suspicious: suspiciousActivityMonitor
  },
  csrf: {
    protection: csrfProtection,
    generateToken: generateCSRFToken
  },
  fileUpload: {
    secure: secureFileUpload
  },
  password: {
    validate: validatePasswordStrength,
    checkBreach: checkPasswordBreach,
    calculateStrength: calculatePasswordStrength
  }
};

export default advancedSecuritySuite;