/**
 * Bundle optimization utilities for production deployment
 * Monitors bundle sizes, analyzes loading patterns, and provides optimization insights
 */

import React from 'react';

// Bundle size thresholds for different chunk types
const SIZE_THRESHOLDS = {
  critical: 150 * 1024,      // 150KB for critical chunks
  important: 300 * 1024,     // 300KB for important chunks
  secondary: 500 * 1024,     // 500KB for secondary chunks
  lazy: 1024 * 1024          // 1MB for lazy-loaded chunks
};

// Performance metrics collection
class BundleOptimizer {
  constructor() {
    this.metrics = {
      loadTimes: new Map(),
      chunkSizes: new Map(),
      cacheHitRates: new Map(),
      errorRates: new Map()
    };

    this.setupPerformanceObserver();
    this.setupResourceTiming();
  }

  // Setup Performance Observer for resource monitoring
  setupPerformanceObserver() {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.entryType === 'resource' &&
              (entry.name.includes('.js') || entry.name.includes('.css'))) {
            this.recordResourceMetrics(entry);
          }
        });
      });

      observer.observe({ entryTypes: ['resource'] });
    }
  }

  // Setup resource timing API monitoring
  setupResourceTiming() {
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const startTime = performance.now();
      try {
        const response = await originalFetch(...args);
        this.recordFetchMetrics(args[0], performance.now() - startTime, response.ok);
        return response;
      } catch (error) {
        this.recordFetchMetrics(args[0], performance.now() - startTime, false);
        throw error;
      }
    };
  }

  // Record resource loading metrics
  recordResourceMetrics(entry) {
    const chunkName = this.extractChunkName(entry.name);

    this.metrics.loadTimes.set(chunkName, {
      duration: entry.duration,
      transferSize: entry.transferSize,
      decodedBodySize: entry.decodedBodySize,
      cached: entry.transferSize === 0
    });

    // Update cache hit rates
    const cached = entry.transferSize === 0;
    const currentStats = this.metrics.cacheHitRates.get(chunkName) || { hits: 0, total: 0 };
    this.metrics.cacheHitRates.set(chunkName, {
      hits: currentStats.hits + (cached ? 1 : 0),
      total: currentStats.total + 1
    });
  }

  // Record fetch metrics
  recordFetchMetrics(url, duration, success) {
    if (typeof url === 'string' && (url.includes('.js') || url.includes('.css'))) {
      const chunkName = this.extractChunkName(url);

      const currentErrors = this.metrics.errorRates.get(chunkName) || { errors: 0, total: 0 };
      this.metrics.errorRates.set(chunkName, {
        errors: currentErrors.errors + (success ? 0 : 1),
        total: currentErrors.total + 1
      });
    }
  }

  // Extract chunk name from URL
  extractChunkName(url) {
    const filename = url.split('/').pop().split('?')[0];
    const match = filename.match(/^(.+?)-[a-zA-Z0-9]+\.(js|css)$/);
    return match ? match[1] : filename;
  }

  // Analyze bundle performance
  analyzeBundlePerformance() {
    const analysis = {
      totalSize: 0,
      criticalPathSize: 0,
      chunkAnalysis: [],
      recommendations: []
    };

    this.metrics.loadTimes.forEach((metrics, chunkName) => {
      const size = metrics.decodedBodySize || metrics.transferSize;
      analysis.totalSize += size;

      const chunkAnalysis = {
        name: chunkName,
        size,
        loadTime: metrics.duration,
        cached: metrics.cached,
        cacheHitRate: this.getCacheHitRate(chunkName),
        errorRate: this.getErrorRate(chunkName),
        category: this.categorizeChunk(chunkName),
        recommendations: this.getChunkRecommendations(chunkName, size, metrics)
      };

      analysis.chunkAnalysis.push(chunkAnalysis);

      // Add to critical path if it's a critical chunk
      if (chunkAnalysis.category === 'critical') {
        analysis.criticalPathSize += size;
      }
    });

    // Sort by size descending
    analysis.chunkAnalysis.sort((a, b) => b.size - a.size);

    // Generate global recommendations
    analysis.recommendations = this.generateGlobalRecommendations(analysis);

    return analysis;
  }

  // Get cache hit rate for a chunk
  getCacheHitRate(chunkName) {
    const stats = this.metrics.cacheHitRates.get(chunkName);
    return stats ? (stats.hits / stats.total) * 100 : 0;
  }

  // Get error rate for a chunk
  getErrorRate(chunkName) {
    const stats = this.metrics.errorRates.get(chunkName);
    return stats ? (stats.errors / stats.total) * 100 : 0;
  }

  // Categorize chunk by name and importance
  categorizeChunk(chunkName) {
    const criticalChunks = ['react-core', 'index', 'main'];
    const importantChunks = ['react-router', 'supabase', 'utils'];
    const secondaryChunks = ['material-ui', 'icons', 'animations'];

    if (criticalChunks.some(critical => chunkName.includes(critical))) {
      return 'critical';
    }
    if (importantChunks.some(important => chunkName.includes(important))) {
      return 'important';
    }
    if (secondaryChunks.some(secondary => chunkName.includes(secondary))) {
      return 'secondary';
    }
    return 'lazy';
  }

  // Get recommendations for a specific chunk
  getChunkRecommendations(chunkName, size, metrics) {
    const recommendations = [];
    const category = this.categorizeChunk(chunkName);
    const threshold = SIZE_THRESHOLDS[category];

    if (size > threshold) {
      recommendations.push({
        type: 'size',
        severity: 'high',
        message: `Chunk size (${(size / 1024).toFixed(1)}KB) exceeds ${category} threshold (${(threshold / 1024).toFixed(1)}KB)`
      });
    }

    if (metrics.duration > 1000 && category === 'critical') {
      recommendations.push({
        type: 'performance',
        severity: 'high',
        message: `Critical chunk taking too long to load (${metrics.duration.toFixed(0)}ms)`
      });
    }

    const cacheHitRate = this.getCacheHitRate(chunkName);
    if (cacheHitRate < 80 && category !== 'lazy') {
      recommendations.push({
        type: 'caching',
        severity: 'medium',
        message: `Low cache hit rate (${cacheHitRate.toFixed(1)}%) - consider cache headers optimization`
      });
    }

    const errorRate = this.getErrorRate(chunkName);
    if (errorRate > 5) {
      recommendations.push({
        type: 'reliability',
        severity: 'high',
        message: `High error rate (${errorRate.toFixed(1)}%) - check network conditions and chunk integrity`
      });
    }

    return recommendations;
  }

  // Generate global optimization recommendations
  generateGlobalRecommendations(analysis) {
    const recommendations = [];

    // Check total bundle size
    if (analysis.totalSize > 2 * 1024 * 1024) { // 2MB
      recommendations.push({
        type: 'bundle-size',
        severity: 'high',
        message: `Total bundle size (${(analysis.totalSize / 1024 / 1024).toFixed(1)}MB) is very large. Consider aggressive code splitting.`
      });
    }

    // Check critical path size
    if (analysis.criticalPathSize > 300 * 1024) { // 300KB
      recommendations.push({
        type: 'critical-path',
        severity: 'high',
        message: `Critical path size (${(analysis.criticalPathSize / 1024).toFixed(1)}KB) is too large. Move non-essential code to lazy chunks.`
      });
    }

    // Check for large lazy chunks
    const largeChunks = analysis.chunkAnalysis.filter(chunk =>
      chunk.size > 500 * 1024 && chunk.category === 'lazy'
    );
    if (largeChunks.length > 0) {
      recommendations.push({
        type: 'chunk-splitting',
        severity: 'medium',
        message: `${largeChunks.length} lazy chunks are over 500KB. Consider further splitting: ${largeChunks.map(c => c.name).join(', ')}`
      });
    }

    return recommendations;
  }

  // Get real-time metrics
  getRealTimeMetrics() {
    return {
      timestamp: Date.now(),
      metrics: {
        loadTimes: Object.fromEntries(this.metrics.loadTimes),
        cacheHitRates: Object.fromEntries(this.metrics.cacheHitRates),
        errorRates: Object.fromEntries(this.metrics.errorRates)
      }
    };
  }

  // Export metrics for external analysis
  exportMetrics() {
    const analysis = this.analyzeBundlePerformance();
    const blob = new Blob([JSON.stringify(analysis, null, 2)], {
      type: 'application/json'
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `bundle-analysis-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

// Create global instance
const bundleOptimizer = new BundleOptimizer();

// React hook for bundle optimization
export const useBundleOptimizer = () => {
  return {
    analyze: () => bundleOptimizer.analyzeBundlePerformance(),
    getMetrics: () => bundleOptimizer.getRealTimeMetrics(),
    export: () => bundleOptimizer.exportMetrics()
  };
};

// Development helper component
export const BundleAnalyzer = () => {
  if (process.env.NODE_ENV !== 'development') return null;

  const [analysis, setAnalysis] = React.useState(null);
  const [showDetails, setShowDetails] = React.useState(false);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setAnalysis(bundleOptimizer.analyzeBundlePerformance());
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  if (!analysis) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      background: '#000',
      color: '#fff',
      padding: '10px',
      borderRadius: '8px',
      fontSize: '12px',
      zIndex: 9999,
      maxWidth: '300px'
    }}>
      <div
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setShowDetails(!showDetails);
          }
        }}
        onClick={() => setShowDetails(!showDetails)}
        style={{ cursor: 'pointer' }}
      >
        📊 Bundle: {(analysis.totalSize / 1024).toFixed(1)}KB
        ({analysis.chunkAnalysis.length} chunks)
      </div>

      {showDetails && (
        <div style={{ marginTop: '10px', maxHeight: '300px', overflow: 'auto' }}>
          {analysis.chunkAnalysis.slice(0, 5).map(chunk => (
            <div key={chunk.name} style={{ margin: '5px 0' }}>
              <strong>{chunk.name}</strong>: {(chunk.size / 1024).toFixed(1)}KB
              {chunk.recommendations.length > 0 && (
                <div style={{ color: '#ff6b6b', fontSize: '10px' }}>
                  ⚠️ {chunk.recommendations.length} issues
                </div>
              )}
            </div>
          ))}

          <button
            onClick={() => bundleOptimizer.exportMetrics()}
            style={{
              marginTop: '10px',
              padding: '5px 10px',
              background: '#4CAF50',
              border: 'none',
              borderRadius: '4px',
              color: 'white',
              cursor: 'pointer'
            }}
          >
            Export Analysis
          </button>
        </div>
      )}
    </div>
  );
};

export default bundleOptimizer;
