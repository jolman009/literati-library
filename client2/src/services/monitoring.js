// src/services/monitoring.js - Unified Monitoring Service
import analyticsService from './analytics.js';
import crashReporting from './crashReporting.js';
import environmentConfig from '../config/environment.js';

class MonitoringService {
  constructor() {
    this.analytics = analyticsService;
    this.crashReporting = crashReporting;
    this.config = environmentConfig;
    this.isInitialized = false;

    this.initialize();
  }

  /**
   * Initialize monitoring services
   */
  async initialize() {
    try {
      // Initialize crash reporting first (it sets up error handlers)
      await this.crashReporting.initialize?.();

      // Initialize analytics
      await this.analytics.initialize?.();

      this.isInitialized = true;
      console.log('📊 Monitoring services initialized');

      // Track initialization
      this.trackEvent('monitoring_initialized', {
        analytics_enabled: this.config.isFeatureEnabled('analytics'),
        crash_reporting_enabled: this.config.isFeatureEnabled('crashReporting'),
        environment: this.config.environment
      });
    } catch (error) {
      console.error('❌ Failed to initialize monitoring:', error);
      this.crashReporting.captureException?.(error, {
        type: 'monitoring_init_error'
      });
    }
  }

  /**
   * Set user context across all services
   */
  setUser(user) {
    try {
      this.analytics.setUserId?.(user.id);
      this.crashReporting.setUser?.(user);

      this.trackEvent('user_context_set', {
        user_id: user.id,
        reading_level: user.reading_level,
        subscription_tier: user.subscription_tier
      });
    } catch (error) {
      console.error('Failed to set user context:', error);
    }
  }

  /**
   * Track events with automatic error handling
   */
  trackEvent(eventName, properties = {}) {
    try {
      this.analytics.trackEvent?.(eventName, properties);

      // Add breadcrumb for crash reporting context
      this.crashReporting.addBreadcrumb?.(
        `Event: ${eventName}`,
        'user_action',
        'info',
        properties
      );
    } catch (error) {
      console.error('Failed to track event:', error);
    }
  }

  /**
   * Track reading-specific events
   */
  trackReading(eventName, bookData = {}) {
    try {
      this.analytics.trackReading?.(eventName, bookData);

      // Set reading context for crash reporting
      this.crashReporting.setReadingContext?.({
        bookId: bookData.id,
        bookTitle: bookData.title,
        bookAuthor: bookData.author,
        currentPage: bookData.currentPage,
        progress: bookData.progress,
        sessionDuration: bookData.sessionDuration,
        readingSpeed: bookData.readingSpeed
      });

      this.crashReporting.addBreadcrumb?.(
        `Reading: ${eventName} - ${bookData.title || 'Unknown'}`,
        'reading',
        'info',
        bookData
      );
    } catch (error) {
      console.error('Failed to track reading event:', error);
    }
  }

  /**
   * Track gamification events
   */
  trackGamification(eventName, data = {}) {
    try {
      this.analytics.trackGamification?.(eventName, data);

      this.crashReporting.addBreadcrumb?.(
        `Gamification: ${eventName}`,
        'gamification',
        'info',
        data
      );
    } catch (error) {
      console.error('Failed to track gamification event:', error);
    }
  }

  /**
   * Track feature usage
   */
  trackFeature(featureName, action, properties = {}) {
    try {
      this.analytics.trackFeature?.(featureName, action, properties);

      this.crashReporting.addBreadcrumb?.(
        `Feature: ${featureName} - ${action}`,
        'feature_usage',
        'info',
        { feature: featureName, action, ...properties }
      );
    } catch (error) {
      console.error('Failed to track feature usage:', error);
    }
  }

  /**
   * Track page views
   */
  trackPageView(pageName, properties = {}) {
    try {
      this.analytics.trackPageView?.(pageName, properties);

      this.crashReporting.addBreadcrumb?.(
        `Page view: ${pageName}`,
        'navigation',
        'info',
        properties
      );
    } catch (error) {
      console.error('Failed to track page view:', error);
    }
  }

  /**
   * Track performance issues
   */
  trackPerformance(metricName, data = {}) {
    try {
      this.analytics.trackPerformance?.(metricName, data);
      this.crashReporting.trackPerformanceIssue?.(metricName, data.duration || data.value || 0, data);
    } catch (error) {
      console.error('Failed to track performance:', error);
    }
  }

  /**
   * Handle errors with both crash reporting and analytics
   */
  handleError(error, context = {}) {
    try {
      // Report to crash reporting service
      const sentryId = this.crashReporting.captureException?.(error, context);

      // Track error event in analytics
      this.analytics.trackError?.(error, {
        sentry_id: sentryId,
        ...context
      });

      return sentryId;
    } catch (reportingError) {
      console.error('Failed to handle error:', reportingError);
      console.error('Original error:', error);
      return null;
    }
  }

  /**
   * Handle reading-specific errors
   */
  handleReadingError(error, bookContext = {}, userAction = '') {
    try {
      const sentryId = this.crashReporting.reportReadingError?.(error, bookContext, userAction);

      this.analytics.trackEvent?.('reading_error', {
        error_type: error.name,
        error_message: error.message,
        book_id: bookContext.bookId,
        book_title: bookContext.bookTitle,
        user_action: userAction,
        sentry_id: sentryId
      });

      return sentryId;
    } catch (reportingError) {
      console.error('Failed to handle reading error:', reportingError);
      return null;
    }
  }

  /**
   * Handle AI service errors
   */
  handleAIError(error, serviceType, requestData = {}) {
    try {
      const sentryId = this.crashReporting.reportAIError?.(error, serviceType, requestData);

      this.analytics.trackEvent?.('ai_service_error', {
        error_type: error.name,
        service_type: serviceType,
        request_size: JSON.stringify(requestData).length,
        sentry_id: sentryId
      });

      return sentryId;
    } catch (reportingError) {
      console.error('Failed to handle AI error:', reportingError);
      return null;
    }
  }

  /**
   * Start timing an operation
   */
  startTimer(operationName) {
    try {
      this.analytics.startTimer?.(operationName);
      return Date.now(); // Fallback timer
    } catch (error) {
      console.error('Failed to start timer:', error);
      return Date.now();
    }
  }

  /**
   * End timing and track performance
   */
  endTimer(operationName, startTime, properties = {}) {
    try {
      const duration = this.analytics.endTimer?.(operationName, properties) ||
                      (Date.now() - startTime);

      this.trackPerformance(operationName, {
        duration,
        ...properties
      });

      return duration;
    } catch (error) {
      console.error('Failed to end timer:', error);
      return Date.now() - startTime;
    }
  }

  /**
   * Track user engagement
   */
  trackEngagement(type, data = {}) {
    try {
      this.analytics.trackEngagement?.(type, data);

      this.crashReporting.addBreadcrumb?.(
        `Engagement: ${type}`,
        'engagement',
        'info',
        data
      );
    } catch (error) {
      console.error('Failed to track engagement:', error);
    }
  }

  /**
   * Create React Error Boundary component
   */
  createErrorBoundary() {
    const ErrorBoundary = this.crashReporting.createErrorBoundary?.();

    if (!ErrorBoundary) {
      // Fallback error boundary
      return ({ children, fallback }) => {
        class FallbackErrorBoundary extends React.Component {
          constructor(props) {
            super(props);
            this.state = { hasError: false, error: null };
          }

          static getDerivedStateFromError(error) {
            return { hasError: true, error };
          }

          componentDidCatch(error, errorInfo) {
            this.handleError(error, {
              component_stack: errorInfo.componentStack,
              error_boundary: true
            });
          }

          render() {
            if (this.state.hasError) {
              return fallback || (
                <div style={{ padding: '20px', textAlign: 'center' }}>
                  <h2>Something went wrong</h2>
                  <p>We've been notified of this error and are working to fix it.</p>
                  <button onClick={() => window.location.reload()}>
                    Reload Page
                  </button>
                </div>
              );
            }

            return this.props.children;
          }
        }

        return FallbackErrorBoundary;
      };
    }

    return ErrorBoundary;
  }

  /**
   * Get monitoring status
   */
  getStatus() {
    return {
      initialized: this.isInitialized,
      services: {
        analytics: {
          initialized: this.analytics.isInitialized,
          enabled: this.config.isFeatureEnabled('analytics')
        },
        crash_reporting: {
          initialized: this.crashReporting.isInitialized,
          enabled: this.config.isFeatureEnabled('crashReporting')
        }
      },
      session: {
        session_id: this.analytics.sessionId,
        user_id: this.analytics.userId
      }
    };
  }

  /**
   * Debug information
   */
  getDebugInfo() {
    return {
      monitoring: this.getStatus(),
      analytics: this.analytics.getAnalyticsSummary?.(),
      environment: {
        features: this.config.features,
        environment: this.config.environment,
        api_url: this.config.apiUrl
      }
    };
  }

  /**
   * Test monitoring services
   */
  testServices() {
    try {
      this.trackEvent('monitoring_test', {
        test: true,
        timestamp: Date.now()
      });

      this.handleError(new Error('Test error for monitoring service'), {
        test: true,
        component: 'monitoring_test'
      });

      console.log('✅ Monitoring services test completed');
      return true;
    } catch (error) {
      console.error('❌ Monitoring services test failed:', error);
      return false;
    }
  }

  /**
   * Flush all pending data
   */
  flush() {
    try {
      this.analytics.flushQueue?.();
      // Sentry automatically flushes, but we can wait for it
      return true;
    } catch (error) {
      console.error('Failed to flush monitoring data:', error);
      return false;
    }
  }
}

// Create singleton instance
const monitoring = new MonitoringService();

// Expose on window for debugging (development only)
if (typeof window !== 'undefined' && environmentConfig.isDevelopment) {
  window.shelfquestMonitoring = monitoring;
  console.log('🔧 Monitoring service available at window.shelfquestMonitoring');
}

export default monitoring;