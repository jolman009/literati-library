// src/config/securityConfig.js
import 'dotenv/config';

// =====================================================
// Security Configuration
// =====================================================

export const securityConfig = {
  // JWT Configuration
  jwt: {
    secret: process.env.JWT_SECRET || (() => {
      if (process.env.NODE_ENV === 'production') {
        throw new Error('JWT_SECRET must be set in production');
      }
      console.warn('⚠️  Using fallback JWT secret. Set JWT_SECRET in production!');
      return 'fallback-jwt-secret-change-in-production';
    })(),

    refreshSecret: process.env.JWT_REFRESH_SECRET || (() => {
      if (process.env.NODE_ENV === 'production') {
        throw new Error('JWT_REFRESH_SECRET must be set in production');
      }
      console.warn('⚠️  Using fallback refresh secret. Set JWT_REFRESH_SECRET in production!');
      return 'fallback-refresh-secret-change-in-production';
    })(),

    accessTokenExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',
    refreshTokenExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',

    options: {
      issuer: 'shelfquest-api',
      audience: 'shelfquest-client',
      algorithm: 'HS256'
    }
  },

  // Rate Limiting Configuration
  rateLimit: {
    general: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100,
      message: 'Too many requests from this IP'
    },

    auth: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 5,
      message: 'Too many authentication attempts'
    },

    upload: {
      windowMs: 60 * 60 * 1000, // 1 hour
      max: 20,
      message: 'Too many file uploads'
    },

    sensitive: {
      windowMs: 60 * 60 * 1000, // 1 hour
      max: 3,
      message: 'Too many sensitive operations'
    }
  },

  // Cookie Configuration
  cookies: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
    domain: process.env.COOKIE_DOMAIN || undefined,
    path: '/'
  },

  // Password Policy
  password: {
    minLength: 8,
    maxLength: 128,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
    saltRounds: 12
  },

  // Account Security
  account: {
    maxLoginAttempts: 5,
    lockoutDuration: 15 * 60 * 1000, // 15 minutes
    sessionTimeout: 24 * 60 * 60 * 1000, // 24 hours
    tokenVersion: true // Enable token versioning for forced logout
  },

  // File Upload Security
  fileUpload: {
    maxSize: 50 * 1024 * 1024, // 50MB
    allowedTypes: ['application/pdf', 'application/epub+zip', 'text/plain'],
    allowedExtensions: ['.pdf', '.epub', '.txt'],
    scanForMalware: process.env.NODE_ENV === 'production',
    quarantinePath: process.env.QUARANTINE_PATH || '/tmp/quarantine'
  },

  // CORS Configuration
  cors: {
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Origin',
      'X-Requested-With',
      'Content-Type',
      'Accept',
      'Authorization',
      'X-CSRF-Token'
    ],

    // Dynamic origin configuration
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, etc.)
      if (!origin) return callback(null, true);

      // Development origins
      if (process.env.NODE_ENV === 'development') {
        if (origin.startsWith('http://localhost:') ||
            origin.startsWith('http://127.0.0.1:')) {
          return callback(null, true);
        }
      }

      // Production origins
      const allowedOrigins = (process.env.ALLOWED_ORIGINS || '').split(',').filter(Boolean);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      // Log and deny unauthorized origins
      console.warn(`CORS: Blocked origin ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },

  // Content Security Policy
  csp: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      scriptSrc: ["'self'"],
      connectSrc: [
        "'self'",
        "https://api.gemini.google.com",
        "wss:",
        "https:",
        ...(process.env.ALLOWED_CONNECT_SRC || '').split(',').filter(Boolean)
      ],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"]
    }
  },

  // Logging Configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    logFailedAuth: true,
    logSuspiciousActivity: true,
    logRateLimiting: true,
    maxLogSize: process.env.MAX_LOG_SIZE || '100MB',
    logRotation: process.env.LOG_ROTATION || 'daily'
  },

  // Monitoring and Alerting
  monitoring: {
    enabled: process.env.NODE_ENV === 'production',

    // Thresholds for alerts
    thresholds: {
      failedAuthAttempts: 10, // per minute
      suspiciousActivity: 5,   // per minute
      errorRate: 0.05,         // 5% error rate
      responseTime: 5000       // 5 second response time
    },

    // Alert channels
    alerts: {
      email: process.env.ALERT_EMAIL || null,
      webhook: process.env.ALERT_WEBHOOK || null,
      slack: process.env.SLACK_WEBHOOK || null
    }
  },

  // Database Security
  database: {
    connectionTimeout: 30000,
    queryTimeout: 30000,
    ssl: process.env.NODE_ENV === 'production',
    encryptionAtRest: true
  },

  // API Security Headers
  headers: {
    hsts: {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true
    },

    contentType: {
      noSniff: true
    },

    frameOptions: {
      action: 'deny'
    },

    xssFilter: true,
    referrerPolicy: 'same-origin'
  },

  // Environment Validation
  requiredEnvVars: {
    production: [
      'JWT_SECRET',
      'JWT_REFRESH_SECRET',
      'SUPABASE_URL',
      'SUPABASE_SERVICE_KEY',
      'ALLOWED_ORIGINS'
    ],
    development: [
      'SUPABASE_URL',
      'SUPABASE_SERVICE_KEY'
    ]
  }
};

// =====================================================
// Environment Validation
// =====================================================

export const validateEnvironment = () => {
  const env = process.env.NODE_ENV || 'development';
  const required = securityConfig.requiredEnvVars[env] || [];
  const missing = required.filter(varName => !process.env[varName]);

  if (missing.length > 0) {
    console.error(`❌ Missing required environment variables for ${env}:`, missing);

    if (env === 'production') {
      throw new Error(`Missing critical environment variables: ${missing.join(', ')}`);
    } else {
      console.warn('⚠️  Missing environment variables. Some features may not work properly.');
    }
  }

  // Validate JWT secrets strength in production
  if (env === 'production') {
    const jwtSecret = process.env.JWT_SECRET;
    const refreshSecret = process.env.JWT_REFRESH_SECRET;

    if (jwtSecret && jwtSecret.length < 32) {
      throw new Error('JWT_SECRET must be at least 32 characters in production');
    }

    if (refreshSecret && refreshSecret.length < 32) {
      throw new Error('JWT_REFRESH_SECRET must be at least 32 characters in production');
    }
  }

  console.log(`✅ Environment validation passed for ${env}`);
};

// =====================================================
// Security Health Check
// =====================================================

export const getSecurityStatus = () => {
  const env = process.env.NODE_ENV || 'development';
  const issues = [];
  const warnings = [];

  // Check environment
  if (env !== 'production' && env !== 'development') {
    warnings.push('Unknown NODE_ENV value');
  }

  // Check secrets
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.includes('fallback')) {
    if (env === 'production') {
      issues.push('JWT_SECRET not properly configured');
    } else {
      warnings.push('Using fallback JWT_SECRET');
    }
  }

  // Check HTTPS
  if (env === 'production' && !securityConfig.cookies.secure) {
    issues.push('Cookies not configured for HTTPS');
  }

  // Check CORS
  if (!process.env.ALLOWED_ORIGINS && env === 'production') {
    issues.push('ALLOWED_ORIGINS not configured');
  }

  return {
    environment: env,
    status: issues.length === 0 ? 'healthy' : 'issues_detected',
    issues,
    warnings,
    lastChecked: new Date().toISOString()
  };
};

// =====================================================
// Initialize Security Configuration
// =====================================================

export const initializeSecurity = () => {
  console.log('🔒 Initializing security configuration...');

  try {
    validateEnvironment();

    const status = getSecurityStatus();

    if (status.issues.length > 0) {
      console.error('❌ Security issues detected:', status.issues);
      if (process.env.NODE_ENV === 'production') {
        throw new Error('Cannot start server with security issues in production');
      }
    }

    if (status.warnings.length > 0) {
      console.warn('⚠️  Security warnings:', status.warnings);
    }

    console.log('✅ Security configuration initialized successfully');

    return securityConfig;

  } catch (error) {
    console.error('❌ Failed to initialize security configuration:', error.message);
    throw error;
  }
};

export default securityConfig;