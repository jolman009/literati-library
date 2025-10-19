import * as Sentry from '@sentry/node';

const SENTRY_CONFIG = {
  development: {
    dsn: null, // Disable Sentry in development
    enabled: false
  },
  staging: {
    dsn: process.env.SENTRY_DSN,
    enabled: true,
    environment: 'staging'
  },
  production: {
    dsn: process.env.SENTRY_DSN,
    enabled: true,
    environment: 'production'
  }
};

export const initializeSentry = () => {
  const environment = process.env.NODE_ENV || 'development';
  const config = SENTRY_CONFIG[environment];

  if (!config.enabled || !config.dsn) {
    console.log('[Sentry] Disabled for environment:', environment);
    return;
  }

  Sentry.init({
    dsn: config.dsn,
    environment: config.environment,
    // Sentry v10+ automatically includes Http and Express integrations by default
    // No need to manually configure integrations - they're auto-enabled

    // Performance Monitoring
    tracesSampleRate: environment === 'production' ? 0.1 : 1.0, // Lower sampling in production

    // Release tracking
    release: process.env.APP_VERSION || 'unknown',

    // Server configuration
    serverName: process.env.SERVER_NAME || 'shelfquest-api',

    // Enhanced error filtering
    beforeSend(event, hint) {
      // Filter out development-only errors
      if (environment === 'development') {
        return null;
      }

      // Filter out known non-critical errors
      if (event.exception) {
        const error = hint.originalException;

        // Filter common non-critical errors
        if (error && error.name === 'ValidationError') {
          // Don't log validation errors as exceptions (they're handled properly)
          return null;
        }

        if (error && error.code === 'ECONNRESET') {
          // Client connection resets are not critical
          return null;
        }
      }

      return event;
    },

    // Performance transaction filtering
    beforeTransaction(transaction) {
      // Sample health check requests less frequently
      if (transaction.name && transaction.name.includes('health')) {
        transaction.sampled = Math.random() < 0.01; // 1% sampling for health checks
      }

      // Sample high-frequency endpoints
      if (transaction.name && (transaction.name.includes('GET /books') || transaction.name.includes('GET /notes'))) {
        transaction.sampled = Math.random() < 0.1; // 10% sampling
      }

      return transaction;
    }
  });

  // Set initial server context
  Sentry.setUser({
    id: 'server',
    environment: config.environment
  });

  // Set server tags
  Sentry.setTag('service', 'shelfquest-api');
  Sentry.setTag('version', process.env.APP_VERSION || 'unknown');

  console.log('[Sentry] Initialized for environment:', environment);
};

// Express.js middleware setup
export const setupSentryMiddleware = (app) => {
  // Add request handler before routes
  app.use(Sentry.Handlers?.requestHandler?.() || ((req, res, next) => next()));

  // Add tracing handler before routes
  app.use(Sentry.Handlers?.tracingHandler?.() || ((req, res, next) => next()));
};

// Express.js error handler (must be added AFTER all routes)
export const sentryErrorHandler = Sentry.Handlers?.errorHandler?.() || ((error, req, res, next) => {
  console.error('Error:', error.message);
  next(error);
});

// Manual error reporting
export const reportError = (error, context = {}) => {
  Sentry.captureException(error, {
    tags: {
      section: 'manual-report',
      ...context.tags
    },
    extra: context,
    user: context.user
  });
};

// Performance monitoring helpers
export const startTransaction = (name, operation = 'http.server') => {
  return Sentry.startTransaction({ name, op: operation });
};

export const addBreadcrumb = (message, category = 'http', level = 'info', data = {}) => {
  Sentry.addBreadcrumb({
    message,
    category,
    level,
    data,
    timestamp: Date.now() / 1000,
  });
};

// Database operation monitoring
export const withSentryTransaction = async (name, operation, callback) => {
  const transaction = Sentry.startTransaction({
    op: operation,
    name: name,
  });

  try {
    const result = await callback(transaction);
    transaction.setStatus('ok');
    return result;
  } catch (error) {
    transaction.setStatus('internal_error');
    Sentry.captureException(error);
    throw error;
  } finally {
    transaction.finish();
  }
};
