// src/services/sentry.js - Simple Sentry Integration
import * as Sentry from "@sentry/react";
import environmentConfig from '../config/environment.js';

/**
 * Initialize Sentry crash reporting
 */
export function initializeSentry() {
  const dsn = import.meta.env.VITE_SENTRY_DSN;

  // Skip if no DSN provided
  if (!dsn) {
    if (environmentConfig.isDevelopment) {
      console.warn('⚠️ Sentry DSN not configured, crash reporting disabled');
    }
    return false;
  }

  // Skip in development unless explicitly enabled
  if (environmentConfig.isDevelopment && !import.meta.env.VITE_SENTRY_DEV_ENABLED) {
    console.log('🔧 Sentry disabled in development');
    return false;
  }

  try {
    Sentry.init({
      dsn,
      environment: environmentConfig.environment,
      release: `${environmentConfig.app.name}@${environmentConfig.app.version}`,
      debug: environmentConfig.isDevelopment,

      // Performance monitoring
      tracesSampleRate: environmentConfig.isProduction ? 0.1 : 1.0,

      // Session replay
      replaysSessionSampleRate: environmentConfig.isProduction ? 0.1 : 1.0,
      replaysOnErrorSampleRate: 1.0,

      // Setting this option to true will send default PII data to Sentry
      sendDefaultPii: true,

      // Ignore known non-critical errors
      ignoreErrors: [
        'ResizeObserver loop limit exceeded',
        'Script error.',
        'Non-Error promise rejection captured',
        'Network request failed',
        'ChunkLoadError',
        'AbortError',
        'TypeError: Failed to fetch',
        'TypeError: NetworkError',
        'TypeError: Load failed'
      ],

      // Don't report errors from extensions
      denyUrls: [
        /extensions\//i,
        /^chrome:\/\//i,
        /^moz-extension:\/\//i,
        /^safari-extension:\/\//i
      ],

      beforeSend(event, hint) {
        // Don't send in development unless explicitly enabled
        if (environmentConfig.isDevelopment && !import.meta.env.VITE_SENTRY_DEV_ENABLED) {
          return null;
        }

        // Filter out known non-critical errors
        const error = hint.originalException;
        if (error?.message?.includes('AbortError') || error?.message?.includes('ChunkLoadError')) {
          return null;
        }

        return event;
      }
    });

    console.log('🚨 Sentry crash reporting initialized');
    return true;
  } catch (error) {
    console.error('❌ Failed to initialize Sentry:', error);
    return false;
  }
}

/**
 * Set user context
 */
export function setSentryUser(user) {
  Sentry.setUser({
    id: user.id?.toString(),
    email: user.email,
    username: user.username
  });
}

/**
 * Add context for debugging
 */
export function setSentryContext(key, context) {
  Sentry.setContext(key, context);
}

/**
 * Add breadcrumb
 */
export function addSentryBreadcrumb(message, category = 'user', level = 'info', data = {}) {
  Sentry.addBreadcrumb({
    message,
    category,
    level,
    data
  });
}

/**
 * Capture exception manually
 */
export function captureSentryException(error, context = {}) {
  return Sentry.captureException(error, {
    extra: context
  });
}

/**
 * Capture message
 */
export function captureSentryMessage(message, level = 'info') {
  return Sentry.captureMessage(message, level);
}

/**
 * Create Sentry Error Boundary (HOC)
 */
export function withSentryErrorBoundary(Component, options = {}) {
  return Sentry.withErrorBoundary(Component, {
    fallback: ({ error, resetError }) => (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2>Something went wrong</h2>
        <p>We've been notified of this error and are working to fix it.</p>
        <details style={{ margin: '20px 0' }}>
          <summary>Error details</summary>
          <pre style={{ textAlign: 'left', background: '#f5f5f5', padding: '10px' }}>
            {error.message}
          </pre>
        </details>
        <button onClick={resetError} style={{ marginRight: '10px' }}>
          Try again
        </button>
        <button onClick={() => window.location.reload()}>
          Reload page
        </button>
      </div>
    ),
    ...options
  });
}

export default {
  init: initializeSentry,
  setUser: setSentryUser,
  setContext: setSentryContext,
  addBreadcrumb: addSentryBreadcrumb,
  captureException: captureSentryException,
  captureMessage: captureSentryMessage,
  withErrorBoundary: withSentryErrorBoundary
};