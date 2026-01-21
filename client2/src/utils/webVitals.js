// src/utils/webVitals.js
// Web Vitals monitoring for performance tracking

import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

// Performance thresholds (Google's recommendations)
const THRESHOLDS = {
  CLS: { good: 0.1, poor: 0.25 },
  FID: { good: 100, poor: 300 },
  FCP: { good: 1800, poor: 3000 },
  LCP: { good: 2500, poor: 4000 },
  TTFB: { good: 800, poor: 1800 }
};

// Performance data storage
let performanceData = {
  metrics: {},
  timestamp: Date.now(),
  url: window.location.href,
  userAgent: navigator.userAgent
};

// Classify metric performance
const getMetricRating = (name, value) => {
  const threshold = THRESHOLDS[name];
  if (!threshold) return 'unknown';
  
  if (value <= threshold.good) return 'good';
  if (value <= threshold.poor) return 'needs-improvement';
  return 'poor';
};

// Format metric values for display
const formatMetricValue = (name, value) => {
  switch (name) {
    case 'CLS':
      return value.toFixed(3);
    case 'FID':
    case 'FCP':
    case 'LCP':
    case 'TTFB':
      return `${Math.round(value)}ms`;
    default:
      return value.toString();
  }
};

// Enhanced metric reporting
const reportWebVitals = (metric) => {
  const { name, value, id, delta } = metric;
  const rating = getMetricRating(name, value);
  const formattedValue = formatMetricValue(name, value);
  
  // Store metric data
  performanceData.metrics[name] = {
    value,
    formattedValue,
    rating,
    id,
    delta,
    timestamp: Date.now()
  };
  
  // Console logging with color coding
  const color = rating === 'good' ? '🟢' : rating === 'needs-improvement' ? '🟡' : '🔴';
  console.warn(`${color} Web Vital [${name}]: ${formattedValue} (${rating})`);
  
  // Send to analytics (if available)
  if (window.gtag) {
    window.gtag('event', name, {
      value: Math.round(name === 'CLS' ? value * 1000 : value),
      event_label: id,
      non_interaction: true,
      custom_map: { metric_rating: rating }
    });
  }
  
  // Send to console for debugging
  if (process.env.NODE_ENV === 'development') {
    // eslint-disable-next-line no-console
    console.table({
      [name]: {
        'Value': formattedValue,
        'Rating': rating,
        'ID': id,
        'Delta': delta,
        'Timestamp': new Date().toISOString()
      }
    });
  }
  
  // Trigger custom event for other parts of the app
  window.dispatchEvent(new CustomEvent('webvital', { 
    detail: { name, value, rating, formattedValue } 
  }));
};

// Initialize all Web Vitals measurements
export const initWebVitals = () => {
  console.warn('🚀 Initializing Web Vitals monitoring...');
  
  // Measure all Core Web Vitals
  getCLS(reportWebVitals);
  getFID(reportWebVitals);
  getFCP(reportWebVitals);
  getLCP(reportWebVitals);
  getTTFB(reportWebVitals);
  
  // Custom performance observer for additional metrics
  if ('PerformanceObserver' in window) {
    // First Input Delay (FID) observer
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'first-input') {
            console.warn('⚡ First Input Delay:', Math.round(entry.processingStart - entry.startTime), 'ms');
          }
        }
      });
      observer.observe({ entryTypes: ['first-input'] });
    } catch {
      console.warn('Performance Observer not supported for first-input');
    }
    
    // Long Task observer
    try {
      const longTaskObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.duration > 50) {
            console.warn('⏳ Long Task detected:', Math.round(entry.duration), 'ms');
          }
        }
      });
      longTaskObserver.observe({ entryTypes: ['longtask'] });
    } catch {
      console.warn('Performance Observer not supported for longtask');
    }
  }
  
  // Navigation timing metrics
  window.addEventListener('load', () => {
    setTimeout(() => {
      const navigation = performance.getEntriesByType('navigation')[0];
      if (navigation) {
        const metrics = {
          'DNS Lookup': navigation.domainLookupEnd - navigation.domainLookupStart,
          'Connection': navigation.connectEnd - navigation.connectStart,
          'TLS Setup': navigation.connectEnd - navigation.secureConnectionStart,
          'Request': navigation.responseStart - navigation.requestStart,
          'Response': navigation.responseEnd - navigation.responseStart,
          'DOM Processing': navigation.domComplete - navigation.responseEnd,
          'Load Complete': navigation.loadEventEnd - navigation.loadEventStart
        };
        
        console.warn('📊 Navigation Timing Breakdown:');
        // eslint-disable-next-line no-console
        console.table(metrics);
      }
    }, 0);
  });
};

// Get current performance summary
export const getPerformanceSummary = () => {
  return {
    ...performanceData,
    overallRating: getOverallRating(),
    recommendations: getRecommendations()
  };
};

// Calculate overall performance rating
const getOverallRating = () => {
  const metrics = performanceData.metrics;
  const ratings = Object.values(metrics).map(m => m.rating);
  
  if (ratings.every(r => r === 'good')) return 'excellent';
  if (ratings.filter(r => r === 'good').length >= 3) return 'good';
  if (ratings.filter(r => r === 'poor').length <= 1) return 'needs-improvement';
  return 'poor';
};

// Generate performance recommendations
const getRecommendations = () => {
  const recommendations = [];
  const metrics = performanceData.metrics;
  
  if (metrics.FCP && metrics.FCP.rating === 'poor') {
    recommendations.push('Optimize First Contentful Paint by reducing server response time and eliminating render-blocking resources');
  }
  
  if (metrics.LCP && metrics.LCP.rating === 'poor') {
    recommendations.push('Improve Largest Contentful Paint by optimizing images and removing unused JavaScript');
  }
  
  if (metrics.CLS && metrics.CLS.rating === 'poor') {
    recommendations.push('Reduce Cumulative Layout Shift by setting dimensions on images and avoiding dynamic content insertion');
  }
  
  if (metrics.FID && metrics.FID.rating === 'poor') {
    recommendations.push('Improve First Input Delay by reducing JavaScript execution time and using code splitting');
  }
  
  if (metrics.TTFB && metrics.TTFB.rating === 'poor') {
    recommendations.push('Optimize Time to First Byte by improving server response time and using CDN');
  }
  
  return recommendations;
};

// Performance monitoring dashboard (for development)
export const showPerformanceDashboard = () => {
  const summary = getPerformanceSummary();
  
  console.group('🎯 Web Vitals Performance Dashboard');
  console.warn('📊 Overall Rating:', summary.overallRating.toUpperCase());
  console.warn('📈 Metrics:', summary.metrics);
  
  if (summary.recommendations.length > 0) {
    console.group('💡 Recommendations');
    summary.recommendations.forEach((rec, index) => {
      console.warn(`${index + 1}. ${rec}`);
    });
    console.groupEnd();
  }
  
  console.groupEnd();
  
  return summary;
};

// Export for use in performance testing
export const measureCustomMetric = (name, startTime) => {
  const endTime = performance.now();
  const duration = endTime - startTime;
  
  console.warn(`⏱️ Custom Metric [${name}]: ${Math.round(duration)}ms`);
  
  return {
    name,
    duration,
    startTime,
    endTime,
    timestamp: Date.now()
  };
};

export default initWebVitals;