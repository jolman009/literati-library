// src/services/crashReporting.js - Crash Reporting with Sentry Integration
import * as Sentry from '@sentry/react';
import environmentConfig from '../config/environment.js';

class CrashReportingService {
  constructor() {
    this.isInitialized = false;
    this.config = environmentConfig;
    this.contextData = {};

    if (this.config.isFeatureEnabled('crashReporting')) {
      this.initialize();
    }
  }

  /**
   * Initialize Sentry crash reporting
   */
  initialize() {
    if (this.isInitialized) return;

    const dsn = import.meta.env.VITE_SENTRY_DSN;

    // Skip initialization if no DSN provided
    if (!dsn) {
      if (this.config.isDevelopment) {
        console.warn('⚠️ Sentry DSN not configured, crash reporting disabled');
      }
      return;
    }

    try {
      Sentry.init({
        dsn,
        environment: this.config.environment,
        release: `${this.config.app.name}@${this.config.app.version}`,
        debug: this.config.isDevelopment,

        // Integrations - Sentry v10+ includes BrowserTracing automatically
        integrations: [
          Sentry.browserTracingIntegration(),
          Sentry.replayIntegration({
            maskAllText: false,
            blockAllMedia: false,
            maskAllInputs: false,
            networkDetailAllowUrls: [
              window.location.origin,
              this.config.apiUrl
            ]
          })
        ],

        // Performance monitoring
        tracesSampleRate: this.config.isProduction ? 0.1 : 1.0, // 10% in prod, 100% in dev
        replaysSessionSampleRate: this.config.isProduction ? 0.1 : 1.0, // 10% in prod
        replaysOnErrorSampleRate: 1.0, // 100% when there's an error

        // Error filtering
        beforeSend: (event, hint) => {
          return this.filterError(event, hint);
        },

        // Context enrichment
        beforeSendTransaction: (event) => {
          return this.enrichTransactionEvent(event);
        },

        // Privacy settings
        attachStacktrace: true,
        maxBreadcrumbs: 100,

        // Ignore specific errors
        ignoreErrors: [
          'ResizeObserver loop limit exceeded',
          'Script error.',
          'Non-Error promise rejection captured',
          'Network request failed',
          'ChunkLoadError',
          'AbortError',
          // Add more known non-critical errors
          'TypeError: Failed to fetch',
          'TypeError: NetworkError',
          'TypeError: Load failed'
        ],

        // Don't report errors from certain URLs
        denyUrls: [
          /extensions\//i,
          /^chrome:\/\//i,
          /^moz-extension:\/\//i,
          /^safari-extension:\/\//i
        ],

        // Custom tags
        initialScope: {
          tags: {
            component: 'literati-frontend',
            platform: this.getPlatform(),
            feature_flags: JSON.stringify({
              analytics: this.config.isFeatureEnabled('analytics'),
              gamification: this.config.isFeatureEnabled('gamification'),
              ai: this.config.isFeatureEnabled('aiFeatures')
            })
          }
        }
      });

      // Set up error boundary
      this.setupGlobalErrorHandlers();

      this.isInitialized = true;
      console.log('🚨 Crash reporting initialized with Sentry');
    } catch (error) {
      console.error('❌ Failed to initialize crash reporting:', error);
    }
  }

  /**
   * Set up global error handlers
   */
  setupGlobalErrorHandlers() {
    // React error boundary events
    window.addEventListener('unhandledrejection', (event) => {
      this.captureException(
        event.reason || new Error('Unhandled Promise Rejection'),
        {
          type: 'unhandled_promise_rejection',
          promise: event.promise?.toString(),
          reason: event.reason?.toString()
        }
      );
    });

    // Global error handler
    window.addEventListener('error', (event) => {
      this.captureException(
        event.error || new Error(event.message),
        {
          type: 'global_error',
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          source: event.target?.src || event.target?.href
        }
      );
    });
  }

  /**
   * Set user context
   */
  setUser(user) {
    if (!this.isInitialized) return;

    Sentry.setUser({
      id: user.id?.toString(),
      email: user.email,
      username: user.username,
      reading_level: user.reading_level,
      subscription_tier: user.subscription_tier,
      created_at: user.created_at
    });

    this.contextData.user = user;
  }

  /**
   * Set reading context
   */
  setReadingContext(context) {
    if (!this.isInitialized) return;

    Sentry.setContext('reading_session', {
      book_id: context.bookId,
      book_title: context.bookTitle,
      book_author: context.bookAuthor,
      current_page: context.currentPage,
      progress_percentage: context.progress,
      session_duration: context.sessionDuration,
      reading_speed: context.readingSpeed
    });

    this.contextData.reading = context;
  }

  /**
   * Add breadcrumb for user actions
   */
  addBreadcrumb(message, category = 'user_action', level = 'info', data = {}) {
    if (!this.isInitialized) return;

    Sentry.addBreadcrumb({
      message,
      category,
      level,
      data: {
        timestamp: Date.now(),
        ...data
      }
    });
  }

  /**
   * Capture exception with context
   */
  captureException(error, context = {}, level = 'error') {
    if (!this.isInitialized) {
      // Fallback logging
      console.error('Unhandled error:', error, context);
      return null;
    }

    return Sentry.captureException(error, {
      level,
      extra: {
        context,
        app_state: this.getAppState(),
        performance: this.getPerformanceData(),
        feature_usage: this.getFeatureUsage()
      },
      tags: {
        error_boundary: context.errorBoundary || false,
        user_action: context.userAction || 'unknown',
        component: context.component || 'unknown'
      }
    });
  }

  /**
   * Capture message/warning
   */
  captureMessage(message, level = 'info', context = {}) {
    if (!this.isInitialized) {
      console[level](message, context);
      return null;
    }

    return Sentry.captureMessage(message, {
      level,
      extra: context
    });
  }

  /**
   * Track performance issues
   */
  trackPerformanceIssue(name, duration, context = {}) {
    if (!this.isInitialized) return;

    // Add performance breadcrumb
    this.addBreadcrumb(
      `Performance issue: ${name} took ${duration}ms`,
      'performance',
      duration > 5000 ? 'warning' : 'info',
      {
        duration,
        ...context
      }
    );

    // Create performance transaction
    const transaction = Sentry.startTransaction({
      name,
      op: 'performance_issue'
    });

    transaction.setData('duration', duration);
    transaction.setData('context', context);
    transaction.finish();
  }

  /**
   * Report reading-specific errors
   */
  reportReadingError(error, bookContext = {}, userAction = '') {
    this.addBreadcrumb(
      `Reading error during: ${userAction}`,
      'reading',
      'error',
      {
        book_id: bookContext.bookId,
        book_title: bookContext.bookTitle,
        current_page: bookContext.currentPage,
        user_action: userAction
      }
    );

    return this.captureException(error, {
      type: 'reading_error',
      user_action: userAction,
      book_context: bookContext,
      component: 'reading_engine'
    });
  }

  /**
   * Report AI service errors
   */
  reportAIError(error, serviceType, requestData = {}) {
    this.addBreadcrumb(
      `AI service error: ${serviceType}`,
      'ai_service',
      'error',
      {
        service_type: serviceType,
        request_size: JSON.stringify(requestData).length
      }
    );

    return this.captureException(error, {
      type: 'ai_service_error',
      service_type: serviceType,
      request_data: this.sanitizeRequestData(requestData),
      component: 'ai_engine'
    });
  }

  /**
   * Report authentication errors
   */
  reportAuthError(error, action) {
    this.addBreadcrumb(
      `Auth error during: ${action}`,
      'authentication',
      'error',
      { action }
    );

    return this.captureException(error, {
      type: 'auth_error',
      action,
      component: 'auth_system'
    });
  }

  /**
   * Create React error boundary
   */
  createErrorBoundary() {
    if (!this.isInitialized) {
      // Return a simple error boundary fallback
      return ({ children, fallback }) => {
        class SimpleErrorBoundary extends React.Component {
          constructor(props) {
            super(props);
            this.state = { hasError: false };
          }

          static getDerivedStateFromError() {
            return { hasError: true };
          }

          componentDidCatch(error, errorInfo) {
            console.error('Error boundary caught error:', error, errorInfo);
          }

          render() {
            if (this.state.hasError) {
              return fallback || <div>Something went wrong.</div>;
            }
            return this.props.children;
          }
        }
        return SimpleErrorBoundary;
      };
    }

    return Sentry.withErrorBoundary;
  }

  /**
   * Filter errors before sending to Sentry
   */
  filterError(event, hint) {
    const error = hint.originalException;

    // Don't report in development unless explicitly enabled
    if (this.config.isDevelopment && !import.meta.env.VITE_SENTRY_DEV_ENABLED) {
      return null;
    }

    // Filter out known non-critical errors
    if (error?.message?.includes('AbortError')) {
      return null; // User cancelled request
    }

    if (error?.message?.includes('ChunkLoadError')) {
      return null; // Code splitting load error, usually network related
    }

    // Add user context if available
    if (this.contextData.user) {
      event.user = {
        ...event.user,
        reading_stats: this.contextData.user.reading_stats
      };
    }

    return event;
  }

  /**
   * Enrich transaction events
   */
  enrichTransactionEvent(event) {
    // Add performance context
    event.extra = {
      ...event.extra,
      memory_usage: this.getMemoryUsage(),
      connection_type: this.getConnectionType(),
      viewport: this.getViewportSize()
    };

    return event;
  }

  /**
   * Get current app state
   */
  getAppState() {
    return {
      url: window.location.href,
      timestamp: Date.now(),
      viewport: this.getViewportSize(),
      connection: this.getConnectionType(),
      memory: this.getMemoryUsage(),
      storage_available: this.getStorageInfo()
    };
  }

  /**
   * Get performance data
   */
  getPerformanceData() {
    if (!window.performance) return {};

    const nav = performance.getEntriesByType('navigation')[0];
    return {
      load_time: nav?.loadEventEnd - nav?.loadEventStart || 0,
      dom_ready_time: nav?.domContentLoadedEventEnd - nav?.domContentLoadedEventStart || 0,
      memory_used: this.getMemoryUsage()
    };
  }

  /**
   * Get feature usage data
   */
  getFeatureUsage() {
    return {
      features_enabled: {
        analytics: this.config.isFeatureEnabled('analytics'),
        gamification: this.config.isFeatureEnabled('gamification'),
        ai: this.config.isFeatureEnabled('aiFeatures'),
        offline: this.config.isFeatureEnabled('offlineMode')
      },
      current_session: {
        reading_active: !!this.contextData.reading,
        user_authenticated: !!this.contextData.user
      }
    };
  }

  /**
   * Sanitize request data for privacy
   */
  sanitizeRequestData(data) {
    const sanitized = { ...data };

    // Remove potentially sensitive data
    delete sanitized.password;
    delete sanitized.token;
    delete sanitized.apiKey;

    // Truncate long text fields
    if (sanitized.text && sanitized.text.length > 500) {
      sanitized.text = sanitized.text.substring(0, 500) + '...';
    }

    return sanitized;
  }

  /**
   * Utility methods
   */
  getPlatform() {
    if (typeof window === 'undefined') return 'server';

    const ua = navigator.userAgent.toLowerCase();
    if (ua.includes('android')) return 'android';
    if (ua.includes('iphone') || ua.includes('ipad')) return 'ios';
    if (ua.includes('windows')) return 'windows';
    if (ua.includes('mac')) return 'macos';
    return 'web';
  }

  getMemoryUsage() {
    if (!window.performance?.memory) return {};

    return {
      used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
      total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024),
      limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024)
    };
  }

  getConnectionType() {
    if (!navigator.connection) return 'unknown';

    return {
      type: navigator.connection.effectiveType,
      downlink: navigator.connection.downlink,
      rtt: navigator.connection.rtt
    };
  }

  getViewportSize() {
    return {
      width: window.innerWidth,
      height: window.innerHeight,
      device_pixel_ratio: window.devicePixelRatio || 1
    };
  }

  getStorageInfo() {
    try {
      return {
        local_storage: !!window.localStorage,
        session_storage: !!window.sessionStorage,
        indexed_db: !!window.indexedDB,
        cookies_enabled: navigator.cookieEnabled
      };
    } catch (error) {
      return { available: false };
    }
  }

  /**
   * Manual testing methods
   */
  testCrashReporting() {
    if (!this.isInitialized) {
      console.warn('Crash reporting not initialized');
      return;
    }

    this.captureMessage('Test message from Literati', 'info', {
      test: true,
      timestamp: Date.now()
    });

    console.log('Test message sent to Sentry');
  }

  testErrorReporting() {
    if (!this.isInitialized) {
      console.warn('Crash reporting not initialized');
      return;
    }

    const testError = new Error('Test error from Literati crash reporting');
    this.captureException(testError, {
      test: true,
      component: 'crash_reporting_test'
    });

    console.log('Test error sent to Sentry');
  }
}

// Create singleton instance
const crashReporting = new CrashReportingService();

export default crashReporting;