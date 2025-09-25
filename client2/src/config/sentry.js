import * as Sentry from '@sentry/react';

const SENTRY_CONFIG = {
  development: {
    dsn: null, // Disable Sentry in development
    enabled: false
  },
  staging: {
    dsn: import.meta.env.VITE_SENTRY_DSN,
    enabled: true,
    environment: 'staging'
  },
  production: {
    dsn: import.meta.env.VITE_SENTRY_DSN,
    enabled: true,
    environment: 'production'
  }
};

export const initializeSentry = () => {
  const environment = import.meta.env.VITE_APP_ENV || 'development';
  const config = SENTRY_CONFIG[environment];

  if (!config.enabled || !config.dsn) {
    console.log('[Sentry] Disabled for environment:', environment);
    return;
  }

  Sentry.init({
    dsn: config.dsn,
    environment: config.environment,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: false,
        blockAllMedia: false,
      }),
    ],
    // Performance Monitoring
    tracesSampleRate: environment === 'production' ? 0.1 : 1.0, // Lower sampling in production

    // Session Replay
    replaysSessionSampleRate: environment === 'production' ? 0.01 : 0.1, // Very low in production
    replaysOnErrorSampleRate: 1.0, // Always capture replays on errors

    // Release tracking
    release: import.meta.env.VITE_APP_VERSION || 'unknown',

    // Error filtering
    beforeSend(event, hint) {
      // Filter out development-only errors
      if (environment === 'development') {
        return null;
      }

      // Filter out known non-critical errors
      if (event.exception) {
        const error = hint.originalException;
        if (error && error.name === 'ChunkLoadError') {
          // These happen during deployments, not critical
          return null;
        }
      }

      return event;
    },

    // Performance options
    beforeTransaction(transaction) {
      // Sample navigation transactions
      if (transaction.name === 'pageload' || transaction.name === 'navigation') {
        transaction.sampled = Math.random() < 0.1; // 10% sampling for navigation
      }
      return transaction;
    }
  });

  // Set user context
  Sentry.setUser({
    id: 'anonymous',
    environment: config.environment
  });

  console.log('[Sentry] Initialized for environment:', environment);
};

// Custom error boundary component
export const SentryErrorBoundary = Sentry.withErrorBoundary;

// Manual error reporting
export const reportError = (error, context = {}) => {
  Sentry.captureException(error, {
    tags: {
      section: 'manual-report',
      ...context.tags
    },
    extra: context
  });
};

// Performance monitoring helpers
export const startTransaction = (name, operation = 'navigation') => {
  return Sentry.startSpan({ name, op: operation }, (span) => {
    return span;
  });
};

export const addBreadcrumb = (message, category = 'user-action', level = 'info') => {
  Sentry.addBreadcrumb({
    message,
    category,
    level,
    timestamp: Date.now() / 1000,
  });
};