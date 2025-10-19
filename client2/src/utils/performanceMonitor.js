// src/utils/performanceMonitor.js
// Performance monitoring utility for ShelfQuest app
// Tracks the specific metrics mentioned in your console performance data

class ShelfQuestPerformanceMonitor {
  constructor() {
    this.interactions = [];
    this.metrics = {
      inp: 0,
      cls: 0,
      fcp: 0,
      lcp: 0
    };
    this.thresholds = {
      inp: 40, // Target < 40ms for good INP
      button: 20, // Target < 20ms for button interactions
      keyboard: 16, // Target < 16ms for keyboard inputs
      pointer: 20 // Target < 20ms for pointer interactions
    };
    this.reportQueue = [];
    this.isReporting = false;
    this.init();
  }

  init() {
    this.setupPerformanceObserver();
    this.setupInteractionTracking();
    this.setupWebVitals();
    this.setupCustomMetrics();
  }

  // Setup Performance Observer for Web Vitals
  setupPerformanceObserver() {
    if (!('PerformanceObserver' in window)) {
      console.warn('PerformanceObserver not supported');
      return;
    }

    // Track Interaction to Next Paint (INP)
    const inpObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.interactionId) {
          this.trackInteraction({
            type: entry.name,
            duration: entry.duration,
            startTime: entry.startTime,
            target: entry.target?.tagName || 'unknown',
            interactionId: entry.interactionId
          });
        }
      }
    });

    inpObserver.observe({ 
      type: 'event', 
      buffered: true 
    });

    // Track Cumulative Layout Shift (CLS)
    const clsObserver = new PerformanceObserver((list) => {
      let clsValue = 0;
      for (const entry of list.getEntries()) {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
        }
      }
      this.metrics.cls = Math.max(this.metrics.cls, clsValue);
      this.checkThreshold('cls', clsValue);
    });

    clsObserver.observe({ 
      type: 'layout-shift', 
      buffered: true 
    });
  }

  // Setup interaction tracking for buttons and form elements
  setupInteractionTracking() {
    // Track button clicks specifically (your main performance issue)
    document.addEventListener('click', (event) => {
      const target = event.target.closest('button, [role="button"]');
      if (target) {
        this.trackButtonInteraction(event, target);
      }
    }, { passive: true });

    // Track keyboard interactions
    document.addEventListener('keydown', (event) => {
      this.trackKeyboardInteraction(event);
    }, { passive: true });

    // Track input field interactions
    document.addEventListener('input', (event) => {
      if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
        this.trackInputInteraction(event);
      }
    }, { passive: true });
  }

  // Track button interaction performance
  trackButtonInteraction(event, button) {
    const startTime = performance.now();
    const buttonText = button.textContent?.trim() || 'Unknown Button';
    const buttonType = button.className.includes('filled') ? 'filled' : 
                      button.className.includes('outlined') ? 'outlined' : 'text';

    // Use requestAnimationFrame to measure when the interaction completes
    requestAnimationFrame(() => {
      const endTime = performance.now();
      const duration = endTime - startTime;

      this.logInteraction({
        type: 'button_click',
        element: buttonText,
        buttonType,
        duration,
        timestamp: Date.now(),
        exceededThreshold: duration > this.thresholds.button
      });

      if (duration > this.thresholds.button) {
        console.warn(`🐌 Slow button interaction: ${buttonText} took ${duration.toFixed(1)}ms`);
      }
    });
  }

  // Track keyboard interaction performance
  trackKeyboardInteraction(event) {
    const startTime = performance.now();
    
    requestAnimationFrame(() => {
      const duration = performance.now() - startTime;
      
      this.logInteraction({
        type: 'keyboard',
        key: event.key,
        duration,
        timestamp: Date.now(),
        exceededThreshold: duration > this.thresholds.keyboard
      });
    });
  }

  // Track input field performance
  trackInputInteraction(event) {
    const startTime = performance.now();
    const fieldType = event.target.type || 'text';
    
    requestAnimationFrame(() => {
      const duration = performance.now() - startTime;
      
      this.logInteraction({
        type: 'input',
        fieldType,
        duration,
        timestamp: Date.now(),
        exceededThreshold: duration > this.thresholds.keyboard
      });
    });
  }

  // Setup Web Vitals tracking
  setupWebVitals() {
    // First Contentful Paint
    const fcpObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.name === 'first-contentful-paint') {
          this.metrics.fcp = entry.startTime;
          console.log(`📊 FCP: ${entry.startTime.toFixed(1)}ms`);
        }
      }
    });

    fcpObserver.observe({ 
      type: 'paint', 
      buffered: true 
    });

    // Largest Contentful Paint
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      this.metrics.lcp = lastEntry.startTime;
      console.log(`📊 LCP: ${lastEntry.startTime.toFixed(1)}ms`);
    });

    lcpObserver.observe({ 
      type: 'largest-contentful-paint', 
      buffered: true 
    });
  }

  // Setup custom metrics for ShelfQuest app
  setupCustomMetrics() {
    // Track React component render times
    this.measureComponentRender = (componentName, renderFn) => {
      const startTime = performance.now();
      const result = renderFn();
      const duration = performance.now() - startTime;
      
      if (duration > 16) { // More than one frame
        console.warn(`🔴 Slow render: ${componentName} took ${duration.toFixed(1)}ms`);
      }
      
      return result;
    };

    // Track API call performance
    this.measureApiCall = async (apiName, apiCall) => {
      const startTime = performance.now();
      try {
        const result = await apiCall();
        const duration = performance.now() - startTime;
        
        this.logInteraction({
          type: 'api_call',
          api: apiName,
          duration,
          success: true,
          timestamp: Date.now()
        });
        
        return result;
      } catch (error) {
        const duration = performance.now() - startTime;
        
        this.logInteraction({
          type: 'api_call',
          api: apiName,
          duration,
          success: false,
          error: error.message,
          timestamp: Date.now()
        });
        
        throw error;
      }
    };
  }

  // Generic interaction tracking
  trackInteraction(interaction) {
    this.interactions.push(interaction);
    
    // Update INP (worst interaction)
    if (interaction.duration > this.metrics.inp) {
      this.metrics.inp = interaction.duration;
    }

    // Keep only last 100 interactions to prevent memory issues
    if (this.interactions.length > 100) {
      this.interactions = this.interactions.slice(-100);
    }

    this.checkThreshold('inp', interaction.duration);
  }

  // Log interactions with detailed info
  logInteraction(interaction) {
    this.interactions.push(interaction);
    
    // Real-time logging for debugging
    if (interaction.exceededThreshold) {
      console.group(`⚠️ Performance Warning: ${interaction.type}`);
      console.log('Duration:', `${interaction.duration.toFixed(1)}ms`);
      console.log('Threshold:', `${this.getThresholdForType(interaction.type)}ms`);
      console.log('Details:', interaction);
      console.groupEnd();
    }

    // Queue for batch reporting
    this.queueReport(interaction);
  }

  // Get threshold for interaction type
  getThresholdForType(type) {
    switch (type) {
      case 'button_click': return this.thresholds.button;
      case 'keyboard': return this.thresholds.keyboard;
      case 'input': return this.thresholds.keyboard;
      default: return this.thresholds.inp;
    }
  }

  // Check if metrics exceed thresholds
  checkThreshold(metric, value) {
    const threshold = this.thresholds[metric];
    if (threshold && value > threshold) {
      console.warn(`🚨 ${metric.toUpperCase()} threshold exceeded: ${value.toFixed(1)}ms (threshold: ${threshold}ms)`);
    }
  }

  // Queue performance reports for batch sending
  queueReport(data) {
    this.reportQueue.push({
      ...data,
      url: window.location.pathname,
      userAgent: navigator.userAgent,
      timestamp: Date.now()
    });

    // Batch send reports every 10 seconds or when queue reaches 20 items
    if (this.reportQueue.length >= 20 || !this.isReporting) {
      this.sendReports();
    }
  }

  // Send performance reports to analytics
  async sendReports() {
    if (this.isReporting || this.reportQueue.length === 0) return;
    
    this.isReporting = true;
    const reports = [...this.reportQueue];
    this.reportQueue = [];

    try {
      // Send to your analytics endpoint
      /* await fetch('/api/performance-metrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reports })
      });
      */

    console.log('Performance reports (analytics disabled):', reports);
    
  } catch (error) {
    console.error('Failed to send performance reports:', error);
    // Re-queue failed reports
    this.reportQueue.unshift(...reports);
  } finally {
    this.isReporting = false;
  }
}

  // Get performance summary
  getPerformanceSummary() {
    const recentInteractions = this.interactions.slice(-20);
    const averageDuration = recentInteractions.reduce((sum, i) => sum + (i.duration || 0), 0) / recentInteractions.length;
    
    const summary = {
      metrics: this.metrics,
      averageInteractionTime: averageDuration.toFixed(1),
      slowInteractions: recentInteractions.filter(i => i.duration > 40).length,
      totalInteractions: this.interactions.length,
      worstInteraction: Math.max(...recentInteractions.map(i => i.duration || 0)),
      recommendations: this.getRecommendations()
    };

    return summary;
  }

  // Get performance recommendations
  getRecommendations() {
    const recommendations = [];
    
    if (this.metrics.inp > 40) {
      recommendations.push('INP is above 40ms - optimize button interactions and event handlers');
    }
    
    if (this.metrics.cls > 0.1) {
      recommendations.push('Layout shifts detected - ensure content has reserved space');
    }
    
    if (this.metrics.lcp > 2500) {
      recommendations.push('LCP is slow - optimize largest content elements');
    }

    const buttonInteractions = this.interactions.filter(i => i.type === 'button_click');
    const slowButtons = buttonInteractions.filter(i => i.duration > 20);
    
    if (slowButtons.length > 0) {
      recommendations.push(`${slowButtons.length} button interactions are slow - check Material3 Button component`);
    }

    return recommendations;
  }

  // Export data for analysis
  exportData() {
    const data = {
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      metrics: this.metrics,
      interactions: this.interactions,
      summary: this.getPerformanceSummary()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `shelfquest-performance-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Console logging with performance data
  logPerformanceReport() {
    console.group('📊 ShelfQuest Performance Report');
    console.log('Current Metrics:', this.metrics);
    console.log('Recent Interactions:', this.interactions.slice(-10));
    console.log('Summary:', this.getPerformanceSummary());
    console.groupEnd();
  }

  // Start monitoring specific to your console issues
  startConsoleMonitoring() {
    console.log('🚀 ShelfQuest Performance Monitor Started');
    console.log('Monitoring button interactions, keyboard input, and pointer events...');
    
    // Log performance every 30 seconds
    setInterval(() => {
      const summary = this.getPerformanceSummary();
      if (summary.slowInteractions > 0) {
        console.warn(`⚠️ Found ${summary.slowInteractions} slow interactions in last 20 events`);
      }
    }, 30000);
  }
}

// Export singleton instance
const performanceMonitor = new ShelfQuestPerformanceMonitor();

// Start monitoring immediately
if (typeof window !== 'undefined') {
  performanceMonitor.startConsoleMonitoring();
  
  // Expose to window for debugging
  window.shelfquestPerf = performanceMonitor;
  
  // Add keyboard shortcut for quick performance report
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && e.key === 'P') {
      performanceMonitor.logPerformanceReport();
    }
  });
}

export default performanceMonitor;