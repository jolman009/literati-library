// src/services/analytics.js - Comprehensive Analytics Service
import environmentConfig from '../config/environment.js';

class AnalyticsService {
  constructor() {
    this.isInitialized = false;
    this.analyticsQueue = [];
    this.sessionId = this.generateSessionId();
    this.userId = null;
    this.config = environmentConfig;

    // Initialize analytics if enabled
    if (this.config.isFeatureEnabled('analytics')) {
      this.initializeAnalytics();
    }
  }

  /**
   * Initialize analytics providers
   */
  async initializeAnalytics() {
    if (this.isInitialized) return;

    try {
      // Initialize multiple analytics providers based on configuration
      await Promise.all([
        this.initializeGoogleAnalytics(),
        this.initializeCustomAnalytics(),
        this.initializePerformanceMonitoring()
      ]);

      this.isInitialized = true;
      this.flushQueue();

      console.log('📊 Analytics initialized successfully');
    } catch (error) {
      console.error('❌ Analytics initialization failed:', error);
    }
  }

  /**
   * Initialize Google Analytics 4
   */
  async initializeGoogleAnalytics() {
    const gaId = import.meta.env.VITE_GA_TRACKING_ID;
    if (!gaId || typeof window === 'undefined') return;

    try {
      // Load GA4 script
      const script = document.createElement('script');
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
      document.head.appendChild(script);

      // Initialize gtag
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      window.gtag = gtag;
      gtag('js', new Date());

      gtag('config', gaId, {
        page_title: document.title,
        page_location: window.location.href,
        send_page_view: true,
        app_name: this.config.app.name,
        app_version: this.config.app.version,
        debug_mode: this.config.isDevelopment
      });

      console.log('📊 Google Analytics 4 initialized');
    } catch (error) {
      console.error('❌ Google Analytics initialization failed:', error);
    }
  }

  /**
   * Initialize custom analytics for ShelfQuest-specific events
   */
  async initializeCustomAnalytics() {
    // Set up custom analytics endpoint
    this.customAnalyticsEndpoint = this.config.getApiEndpoint('/analytics/events');

    // Start session tracking
    this.trackEvent('session_start', {
      session_id: this.sessionId,
      timestamp: Date.now(),
      user_agent: navigator.userAgent,
      viewport: `${window.innerWidth}x${window.innerHeight}`,
      environment: this.config.environment
    });

    // Track page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.trackEvent('session_pause', { session_id: this.sessionId });
      } else {
        this.trackEvent('session_resume', { session_id: this.sessionId });
      }
    });

    // Track window unload
    window.addEventListener('beforeunload', () => {
      this.trackEvent('session_end', {
        session_id: this.sessionId,
        duration: Date.now() - this.sessionStartTime
      }, true); // Send immediately
    });

    this.sessionStartTime = Date.now();
  }

  /**
   * Initialize performance monitoring
   */
  async initializePerformanceMonitoring() {
    if (typeof window === 'undefined' || !window.performance) return;

    // Track performance metrics
    window.addEventListener('load', () => {
      setTimeout(() => {
        const perfData = performance.getEntriesByType('navigation')[0];
        if (perfData) {
          this.trackPerformance('page_load', {
            load_time: perfData.loadEventEnd - perfData.loadEventStart,
            dom_ready: perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart,
            total_time: perfData.loadEventEnd - perfData.fetchStart,
            transfer_size: perfData.transferSize || 0
          });
        }
      }, 100);
    });

    // Track Core Web Vitals
    this.trackWebVitals();
  }

  /**
   * Track Core Web Vitals
   */
  trackWebVitals() {
    // Only track in production to avoid noise
    if (!this.config.isProduction) return;

    try {
      // Import web-vitals dynamically
      import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
        getCLS(this.handleWebVital);
        getFID(this.handleWebVital);
        getFCP(this.handleWebVital);
        getLCP(this.handleWebVital);
        getTTFB(this.handleWebVital);
      }).catch(() => {
        // web-vitals not available, skip
      });
    } catch (error) {
      // Fallback metrics using Performance Observer
      this.trackFallbackWebVitals();
    }
  }

  /**
   * Handle web vitals measurement
   */
  handleWebVital = (metric) => {
    this.trackPerformance('web_vital', {
      name: metric.name,
      value: metric.value,
      rating: metric.rating || 'unknown',
      delta: metric.delta
    });
  }

  /**
   * Fallback web vitals tracking
   */
  trackFallbackWebVitals() {
    if (typeof PerformanceObserver === 'undefined') return;

    // Track Largest Contentful Paint
    try {
      const observer = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        const lastEntry = entries[entries.length - 1];
        this.trackPerformance('lcp', { value: lastEntry.startTime });
      });
      observer.observe({ entryTypes: ['largest-contentful-paint'] });
    } catch (error) {
      // PerformanceObserver not fully supported
    }
  }

  /**
   * Set user ID for analytics
   */
  setUserId(userId) {
    this.userId = userId;

    if (window.gtag) {
      gtag('config', import.meta.env.VITE_GA_TRACKING_ID, {
        user_id: userId
      });
    }

    this.trackEvent('user_identified', { user_id: userId });
  }

  /**
   * Track generic events
   */
  trackEvent(eventName, properties = {}, immediate = false) {
    if (!this.config.isFeatureEnabled('analytics')) return;

    const eventData = {
      event: eventName,
      timestamp: Date.now(),
      session_id: this.sessionId,
      user_id: this.userId,
      ...properties,
      // Add standard properties
      app_version: this.config.app.version,
      environment: this.config.environment,
      platform: this.getPlatform(),
      url: window.location.href,
      referrer: document.referrer
    };

    if (immediate || this.isInitialized) {
      this.sendEvent(eventData);
    } else {
      this.analyticsQueue.push(eventData);
    }

    // Also send to Google Analytics if available
    if (window.gtag) {
      gtag('event', eventName, {
        event_category: properties.category || 'general',
        event_label: properties.label,
        value: properties.value,
        custom_map: properties
      });
    }
  }

  /**
   * Track reading-specific events
   */
  trackReading(eventName, bookData = {}) {
    this.trackEvent(`reading_${eventName}`, {
      category: 'reading',
      book_id: bookData.id,
      book_title: bookData.title,
      book_author: bookData.author,
      book_genre: bookData.genre,
      page_number: bookData.currentPage,
      progress: bookData.progress,
      session_duration: bookData.sessionDuration,
      reading_speed: bookData.readingSpeed
    });
  }

  /**
   * Track gamification events
   */
  trackGamification(eventName, data = {}) {
    this.trackEvent(`gamification_${eventName}`, {
      category: 'gamification',
      achievement_type: data.type,
      points_earned: data.points,
      level: data.level,
      challenge_id: data.challengeId,
      badge_name: data.badgeName
    });
  }

  /**
   * Track feature usage
   */
  trackFeature(featureName, action, properties = {}) {
    this.trackEvent(`feature_${action}`, {
      category: 'feature_usage',
      feature_name: featureName,
      ...properties
    });
  }

  /**
   * Track performance metrics
   */
  trackPerformance(metricName, data = {}) {
    this.trackEvent(`performance_${metricName}`, {
      category: 'performance',
      ...data
    });
  }

  /**
   * Track errors
   */
  trackError(error, context = {}) {
    if (!this.config.isFeatureEnabled('crashReporting')) return;

    this.trackEvent('error', {
      category: 'error',
      error_message: error.message,
      error_stack: error.stack,
      error_name: error.name,
      context: JSON.stringify(context),
      url: window.location.href
    }, true); // Send immediately
  }

  /**
   * Track user engagement
   */
  trackEngagement(type, data = {}) {
    this.trackEvent(`engagement_${type}`, {
      category: 'engagement',
      engagement_time: data.duration,
      interaction_type: type,
      ...data
    });
  }

  /**
   * Send event to custom analytics endpoint
   */
  async sendEvent(eventData) {
    try {
      // Send to custom backend
      await fetch(this.customAnalyticsEndpoint, {
        method: 'POST',
        headers: this.config.getAuthHeaders(),
        body: JSON.stringify(eventData)
      });
    } catch (error) {
      // Fail silently for analytics to not disrupt user experience
      if (this.config.isDevelopment) {
        console.warn('Analytics event failed:', error);
      }
    }
  }

  /**
   * Flush queued events
   */
  flushQueue() {
    if (this.analyticsQueue.length === 0) return;

    const events = [...this.analyticsQueue];
    this.analyticsQueue = [];

    events.forEach(event => this.sendEvent(event));
  }

  /**
   * Generate unique session ID
   */
  generateSessionId() {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Detect platform
   */
  getPlatform() {
    if (typeof window === 'undefined') return 'server';

    const userAgent = navigator.userAgent.toLowerCase();

    if (userAgent.includes('android')) return 'android';
    if (userAgent.includes('iphone') || userAgent.includes('ipad')) return 'ios';
    if (userAgent.includes('windows')) return 'windows';
    if (userAgent.includes('mac')) return 'macos';
    if (userAgent.includes('linux')) return 'linux';

    return 'web';
  }

  /**
   * Track page views
   */
  trackPageView(pageName, properties = {}) {
    this.trackEvent('page_view', {
      category: 'navigation',
      page_name: pageName,
      page_url: window.location.href,
      page_title: document.title,
      ...properties
    });

    // Google Analytics page view
    if (window.gtag) {
      gtag('config', import.meta.env.VITE_GA_TRACKING_ID, {
        page_title: pageName,
        page_location: window.location.href
      });
    }
  }

  /**
   * Track time-based events (for reading sessions)
   */
  startTimer(eventName) {
    this.timers = this.timers || {};
    this.timers[eventName] = Date.now();
  }

  endTimer(eventName, properties = {}) {
    if (!this.timers || !this.timers[eventName]) return;

    const duration = Date.now() - this.timers[eventName];
    delete this.timers[eventName];

    this.trackEvent(eventName, {
      ...properties,
      duration
    });

    return duration;
  }

  /**
   * Get analytics summary for debugging
   */
  getAnalyticsSummary() {
    return {
      initialized: this.isInitialized,
      sessionId: this.sessionId,
      userId: this.userId,
      queueLength: this.analyticsQueue.length,
      platform: this.getPlatform(),
      features: {
        analytics: this.config.isFeatureEnabled('analytics'),
        crashReporting: this.config.isFeatureEnabled('crashReporting')
      }
    };
  }
}

// Create singleton instance
const analyticsService = new AnalyticsService();

// Global error handler
window.addEventListener('error', (event) => {
  analyticsService.trackError(event.error || new Error(event.message), {
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
    type: 'javascript_error'
  });
});

// Unhandled promise rejection handler
window.addEventListener('unhandledrejection', (event) => {
  analyticsService.trackError(event.reason || new Error('Unhandled Promise Rejection'), {
    type: 'unhandled_promise_rejection'
  });
});

export default analyticsService;