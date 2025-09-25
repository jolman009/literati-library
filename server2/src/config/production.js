/**
 * Production configuration and optimization settings
 * Ensures optimal performance and security for production deployment
 */

import { cpus } from 'os';
import cluster from 'cluster';

// Production environment validation
export const validateProductionEnv = () => {
  const requiredVars = [
    'NODE_ENV',
    'PORT',
    'SUPABASE_URL',
    'SUPABASE_SERVICE_KEY',
    'JWT_SECRET',
    'DOMAIN',
    'FRONTEND_URL'
  ];

  const missing = requiredVars.filter(key => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  // Validate JWT secret strength
  if (process.env.JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters long for production');
  }

  // Validate domain configuration
  if (!process.env.DOMAIN.includes('.')) {
    throw new Error('DOMAIN must be a valid domain name for production');
  }

  console.log('✅ Production environment validation passed');
};

// Production optimization settings
export const productionConfig = {
  // Server optimization
  server: {
    port: parseInt(process.env.PORT) || 5000,
    host: process.env.HOST || '0.0.0.0',
    backlog: 511,
    keepAliveTimeout: parseInt(process.env.KEEP_ALIVE_TIMEOUT) || 5000,
    headersTimeout: parseInt(process.env.HEADERS_TIMEOUT) || 60000,
    maxHeadersCount: 100,
    requestTimeout: 300000 // 5 minutes
  },

  // Security settings
  security: {
    trustProxy: process.env.TRUSTED_PROXIES?.split(',') || ['127.0.0.1', '::1'],
    corsOrigin: process.env.CORS_ORIGIN?.split(',') || [process.env.FRONTEND_URL],
    rateLimiting: {
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000, // 15 minutes
      max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
      skipSuccessfulRequests: process.env.RATE_LIMIT_SKIP_SUCCESSFUL_REQUESTS === 'true',
      standardHeaders: true,
      legacyHeaders: false
    },
    helmet: {
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
          fontSrc: ["'self'", "https://fonts.gstatic.com"],
          imgSrc: ["'self'", "data:", "https:", process.env.SUPABASE_URL],
          scriptSrc: ["'self'"],
          connectSrc: ["'self'", process.env.SUPABASE_URL, process.env.AI_SERVICE_URL],
          reportUri: process.env.CSP_REPORT_URI
        }
      },
      hsts: {
        maxAge: parseInt(process.env.HSTS_MAX_AGE) || 31536000,
        includeSubDomains: true,
        preload: true
      }
    }
  },

  // Database optimization
  database: {
    pool: {
      min: parseInt(process.env.DB_POOL_MIN) || 5,
      max: parseInt(process.env.DB_POOL_MAX) || 20,
      idle: parseInt(process.env.DB_IDLE_TIMEOUT) || 30000,
      acquire: parseInt(process.env.DB_CONNECTION_TIMEOUT) || 60000
    },
    logging: process.env.DB_LOGGING === 'true',
    ssl: process.env.DB_SSL !== 'false'
  },

  // Caching configuration
  cache: {
    ttl: parseInt(process.env.CACHE_TTL) || 300,
    maxSize: parseInt(process.env.CACHE_MAX_SIZE) || 1000,
    checkPeriod: 60,
    queryCache: process.env.ENABLE_QUERY_CACHE === 'true',
    responseCache: process.env.ENABLE_RESPONSE_CACHE === 'true'
  },

  // File upload settings
  upload: {
    maxSize: parseInt(process.env.UPLOAD_MAX_SIZE) || 52428800, // 50MB
    allowedTypes: process.env.UPLOAD_ALLOWED_TYPES?.split(',') || [
      'application/pdf',
      'application/epub+zip',
      'application/epub'
    ],
    tempDir: process.env.TEMP_PATH || '/tmp/uploads',
    storageDir: process.env.STORAGE_PATH || '/app/storage'
  },

  // Monitoring settings
  monitoring: {
    enabled: process.env.ENABLE_MONITORING === 'true',
    endpoint: process.env.METRICS_ENDPOINT || '/api/monitoring',
    healthCheck: process.env.HEALTH_CHECK_ENDPOINT || '/api/monitoring/health',
    interval: parseInt(process.env.HEALTH_CHECK_INTERVAL) || 30000,
    timeout: parseInt(process.env.HEALTH_CHECK_TIMEOUT) || 5000,
    retries: parseInt(process.env.HEALTH_CHECK_RETRIES) || 3
  },

  // Logging configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'json',
    maxSize: parseInt(process.env.LOG_MAX_SIZE) || 10 * 1024 * 1024, // 10MB
    maxFiles: parseInt(process.env.LOG_MAX_FILES) || 5,
    datePattern: process.env.LOG_DATE_PATTERN || 'YYYY-MM-DD',
    accessLog: process.env.ACCESS_LOG_ENABLED === 'true',
    errorLog: process.env.ERROR_LOG_ENABLED === 'true'
  },

  // Feature flags
  features: {
    registration: process.env.ENABLE_REGISTRATION === 'true',
    bookUpload: process.env.ENABLE_BOOK_UPLOAD === 'true',
    aiFeatures: process.env.ENABLE_AI_FEATURES === 'true',
    notifications: process.env.ENABLE_NOTIFICATIONS === 'true',
    analytics: process.env.ENABLE_ANALYTICS === 'true',
    maintenanceMode: process.env.MAINTENANCE_MODE === 'true'
  },

  // Performance settings
  performance: {
    compression: {
      enabled: process.env.COMPRESSION_ENABLED === 'true',
      level: parseInt(process.env.COMPRESSION_LEVEL) || 6,
      threshold: 1024
    },
    clustering: {
      enabled: process.env.CLUSTER_ENABLED === 'true',
      workers: parseInt(process.env.CLUSTER_WORKERS) || cpus().length
    }
  }
};

// Initialize cluster for production if enabled
export const initializeCluster = () => {
  if (productionConfig.performance.clustering.enabled && cluster.isPrimary) {
    console.log(`🚀 Starting ${productionConfig.performance.clustering.workers} worker processes`);

    // Fork workers
    for (let i = 0; i < productionConfig.performance.clustering.workers; i++) {
      cluster.fork();
    }

    // Handle worker exit
    cluster.on('exit', (worker, code, signal) => {
      console.log(`⚠️ Worker ${worker.process.pid} died (${signal || code}). Restarting...`);
      cluster.fork();
    });

    // Handle graceful shutdown
    process.on('SIGTERM', () => {
      console.log('📴 SIGTERM received. Shutting down gracefully...');

      for (const worker of Object.values(cluster.workers)) {
        worker.kill('SIGTERM');
      }

      setTimeout(() => {
        console.log('⏰ Force shutdown after timeout');
        process.exit(1);
      }, 30000);
    });

    return true; // Primary process
  }

  return false; // Worker process or clustering disabled
};

// Production middleware factory
export const createProductionMiddleware = () => {
  const middlewares = [];

  // Compression middleware
  if (productionConfig.performance.compression.enabled) {
    const compression = await import('compression');
    middlewares.push(compression.default({
      level: productionConfig.performance.compression.level,
      threshold: productionConfig.performance.compression.threshold,
      filter: (req, res) => {
        if (req.headers['x-no-compression']) return false;
        return compression.default.filter(req, res);
      }
    }));
  }

  // Trust proxy
  middlewares.push((req, res, next) => {
    req.app.set('trust proxy', productionConfig.security.trustProxy);
    next();
  });

  return middlewares;
};

// Health check configuration
export const healthCheckConfig = {
  endpoint: productionConfig.monitoring.healthCheck,
  interval: productionConfig.monitoring.interval,
  timeout: productionConfig.monitoring.timeout,
  retries: productionConfig.monitoring.retries,
  gracePeriod: parseInt(process.env.HEALTH_CHECK_GRACE_PERIOD) || 10000,

  // Health check handlers
  checks: {
    database: async () => {
      try {
        const { supabase } = await import('../config/supabaseClient.js');
        const { data, error } = await supabase
          .from('books')
          .select('id')
          .limit(1);

        return {
          status: error ? 'fail' : 'pass',
          responseTime: Date.now(),
          error: error?.message
        };
      } catch (error) {
        return {
          status: 'fail',
          error: error.message
        };
      }
    },

    memory: () => {
      const usage = process.memoryUsage();
      const usagePercent = (usage.heapUsed / usage.heapTotal) * 100;

      return {
        status: usagePercent < 80 ? 'pass' : usagePercent < 95 ? 'warning' : 'fail',
        usage: `${usagePercent.toFixed(1)}%`,
        heapUsed: Math.round(usage.heapUsed / 1024 / 1024) + 'MB',
        heapTotal: Math.round(usage.heapTotal / 1024 / 1024) + 'MB'
      };
    },

    disk: async () => {
      try {
        const fs = await import('fs/promises');
        const stats = await fs.stat(productionConfig.upload.storageDir);

        return {
          status: 'pass',
          storageAccessible: true,
          lastModified: stats.mtime
        };
      } catch (error) {
        return {
          status: 'fail',
          storageAccessible: false,
          error: error.message
        };
      }
    }
  }
};

// Graceful shutdown handler
export const setupGracefulShutdown = (server) => {
  const shutdown = (signal) => {
    console.log(`📴 ${signal} received. Starting graceful shutdown...`);

    // Stop accepting new connections
    server.close(() => {
      console.log('✅ HTTP server closed');

      // Close database connections
      // Close cache connections
      // Finish processing current requests

      console.log('✅ Graceful shutdown completed');
      process.exit(0);
    });

    // Force shutdown after timeout
    setTimeout(() => {
      console.error('⏰ Could not close connections in time, forcefully shutting down');
      process.exit(1);
    }, 30000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
};

// Production startup checks
export const performStartupChecks = async () => {
  console.log('🔍 Performing production startup checks...');

  const checks = [
    {
      name: 'Environment Validation',
      check: () => validateProductionEnv()
    },
    {
      name: 'Database Connection',
      check: async () => {
        const result = await healthCheckConfig.checks.database();
        if (result.status === 'fail') {
          throw new Error(`Database check failed: ${result.error}`);
        }
      }
    },
    {
      name: 'Storage Directory',
      check: async () => {
        const result = await healthCheckConfig.checks.disk();
        if (result.status === 'fail') {
          throw new Error(`Storage check failed: ${result.error}`);
        }
      }
    },
    {
      name: 'Memory Check',
      check: () => {
        const result = healthCheckConfig.checks.memory();
        if (result.status === 'fail') {
          throw new Error(`Memory check failed: ${result.usage}`);
        }
      }
    }
  ];

  for (const { name, check } of checks) {
    try {
      await check();
      console.log(`✅ ${name}: Passed`);
    } catch (error) {
      console.error(`❌ ${name}: Failed - ${error.message}`);
      throw error;
    }
  }

  console.log('✅ All startup checks passed');
};

export default productionConfig;