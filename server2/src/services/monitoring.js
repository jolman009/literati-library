/**
 * Application monitoring service for real-time performance and health tracking
 * Provides comprehensive system monitoring for production deployment
 */

import { performance } from 'perf_hooks';
import { errorHandler } from './error-handler.js';

class ApplicationMonitor {
  constructor() {
    this.metrics = {
      requests: {
        total: 0,
        successful: 0,
        failed: 0,
        byEndpoint: new Map(),
        byUser: new Map()
      },
      performance: {
        responseTime: [],
        memoryUsage: [],
        cpuUsage: [],
        activeConnections: 0
      },
      health: {
        status: 'healthy',
        lastCheck: Date.now(),
        uptime: process.uptime(),
        checks: {}
      },
      alerts: []
    };

    this.thresholds = {
      responseTime: {
        warning: 1000,    // 1 second
        critical: 5000    // 5 seconds
      },
      memoryUsage: {
        warning: 80,      // 80% of available memory
        critical: 95      // 95% of available memory
      },
      errorRate: {
        warning: 0.05,    // 5% error rate
        critical: 0.10    // 10% error rate
      }
    };

    this.startMonitoring();
  }

  /**
   * Start background monitoring processes
   */
  startMonitoring() {
    // Collect system metrics every 30 seconds
    setInterval(() => {
      this.collectSystemMetrics();
    }, 30000);

    // Perform health checks every minute
    setInterval(() => {
      this.performHealthCheck();
    }, 60000);

    // Clean up old metrics every 10 minutes
    setInterval(() => {
      this.cleanupOldMetrics();
    }, 600000);

    // Check alert conditions every 2 minutes
    setInterval(() => {
      this.checkAlertConditions();
    }, 120000);

    console.log('📊 Application monitoring started');
  }

  /**
   * Request monitoring middleware
   */
  requestMonitoringMiddleware() {
    return (req, res, next) => {
      const startTime = performance.now();
      const requestId = this.generateRequestId();

      // Add request ID to request object
      req.requestId = requestId;

      // Track request start
      this.trackRequestStart(req);

      // Override res.end to capture completion
      const originalEnd = res.end;
      res.end = (...args) => {
        const duration = performance.now() - startTime;
        this.trackRequestComplete(req, res, duration);
        originalEnd.apply(res, args);
      };

      next();
    };
  }

  /**
   * Track request initiation
   */
  trackRequestStart(req) {
    this.metrics.requests.total++;
    this.metrics.performance.activeConnections++;

    // Track by endpoint
    const endpoint = `${req.method} ${req.route?.path || req.path}`;
    const endpointCount = this.metrics.requests.byEndpoint.get(endpoint) || 0;
    this.metrics.requests.byEndpoint.set(endpoint, endpointCount + 1);

    // Track by user (if authenticated)
    if (req.user?.id) {
      const userCount = this.metrics.requests.byUser.get(req.user.id) || 0;
      this.metrics.requests.byUser.set(req.user.id, userCount + 1);
    }
  }

  /**
   * Track request completion
   */
  trackRequestComplete(req, res, duration) {
    this.metrics.performance.activeConnections--;

    // Track response time
    this.metrics.performance.responseTime.push({
      timestamp: Date.now(),
      duration,
      endpoint: `${req.method} ${req.route?.path || req.path}`,
      statusCode: res.statusCode,
      userId: req.user?.id
    });

    // Track success/failure
    if (res.statusCode < 400) {
      this.metrics.requests.successful++;
    } else {
      this.metrics.requests.failed++;

      // Log failed requests
      if (res.statusCode >= 500) {
        errorHandler.handleError(new Error(`Request failed with status ${res.statusCode}`), {
          endpoint: req.originalUrl,
          method: req.method,
          statusCode: res.statusCode,
          duration,
          userId: req.user?.id,
          requestId: req.requestId
        });
      }
    }

    // Alert on slow requests
    if (duration > this.thresholds.responseTime.warning) {
      this.recordSlowRequest(req, duration);
    }
  }

  /**
   * Record slow request for analysis
   */
  recordSlowRequest(req, duration) {
    const slowRequest = {
      timestamp: Date.now(),
      endpoint: req.originalUrl,
      method: req.method,
      duration,
      userId: req.user?.id,
      userAgent: req.get('User-Agent'),
      severity: duration > this.thresholds.responseTime.critical ? 'critical' : 'warning'
    };

    console.warn(`🐌 Slow request detected: ${req.method} ${req.originalUrl} (${duration.toFixed(0)}ms)`);

    if (duration > this.thresholds.responseTime.critical) {
      this.triggerAlert('SLOW_REQUEST', slowRequest);
    }
  }

  /**
   * Collect system performance metrics
   */
  collectSystemMetrics() {
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();

    // Memory metrics
    const memoryMetric = {
      timestamp: Date.now(),
      rss: memUsage.rss,
      heapUsed: memUsage.heapUsed,
      heapTotal: memUsage.heapTotal,
      external: memUsage.external,
      usagePercent: (memUsage.heapUsed / memUsage.heapTotal) * 100
    };

    this.metrics.performance.memoryUsage.push(memoryMetric);

    // CPU metrics
    const cpuMetric = {
      timestamp: Date.now(),
      user: cpuUsage.user,
      system: cpuUsage.system
    };

    this.metrics.performance.cpuUsage.push(cpuMetric);

    // Check memory thresholds
    if (memoryMetric.usagePercent > this.thresholds.memoryUsage.warning) {
      this.handleMemoryWarning(memoryMetric);
    }
  }

  /**
   * Handle memory usage warnings
   */
  handleMemoryWarning(memoryMetric) {
    const severity = memoryMetric.usagePercent > this.thresholds.memoryUsage.critical ? 'critical' : 'warning';

    const alert = {
      type: 'HIGH_MEMORY_USAGE',
      severity,
      timestamp: Date.now(),
      memoryUsage: memoryMetric.usagePercent,
      threshold: this.thresholds.memoryUsage[severity],
      details: memoryMetric
    };

    console.warn(`⚠️ High memory usage: ${memoryMetric.usagePercent.toFixed(1)}%`);

    if (severity === 'critical') {
      this.triggerAlert('HIGH_MEMORY_USAGE', alert);

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
        console.log('🗑️ Forced garbage collection');
      }
    }
  }

  /**
   * Perform comprehensive health check
   */
  async performHealthCheck() {
    const healthCheck = {
      timestamp: Date.now(),
      uptime: process.uptime(),
      status: 'healthy',
      checks: {}
    };

    try {
      // Check memory health
      const latestMemory = this.metrics.performance.memoryUsage.slice(-1)[0];
      healthCheck.checks.memory = {
        status: latestMemory?.usagePercent < this.thresholds.memoryUsage.warning ? 'healthy' : 'warning',
        usage: latestMemory?.usagePercent,
        details: latestMemory
      };

      // Check response time health
      const recentResponses = this.metrics.performance.responseTime.slice(-100);
      const avgResponseTime = recentResponses.length > 0 ?
        recentResponses.reduce((sum, r) => sum + r.duration, 0) / recentResponses.length : 0;

      healthCheck.checks.responseTime = {
        status: avgResponseTime < this.thresholds.responseTime.warning ? 'healthy' : 'warning',
        average: avgResponseTime,
        samples: recentResponses.length
      };

      // Check error rate
      const errorRate = this.calculateErrorRate();
      healthCheck.checks.errorRate = {
        status: errorRate < this.thresholds.errorRate.warning ? 'healthy' : 'warning',
        rate: errorRate,
        total: this.metrics.requests.total,
        failed: this.metrics.requests.failed
      };

      // Check active connections
      healthCheck.checks.connections = {
        status: this.metrics.performance.activeConnections < 100 ? 'healthy' : 'warning',
        active: this.metrics.performance.activeConnections
      };

      // Determine overall health
      const unhealthyChecks = Object.values(healthCheck.checks).filter(check => check.status !== 'healthy');
      healthCheck.status = unhealthyChecks.length === 0 ? 'healthy' :
        unhealthyChecks.some(check => check.status === 'critical') ? 'critical' : 'degraded';

      this.metrics.health = healthCheck;

    } catch (error) {
      healthCheck.status = 'error';
      healthCheck.error = error.message;
      errorHandler.handleError(error, { context: 'health_check' });
    }
  }

  /**
   * Calculate current error rate
   */
  calculateErrorRate() {
    const total = this.metrics.requests.total;
    const failed = this.metrics.requests.failed;
    return total > 0 ? failed / total : 0;
  }

  /**
   * Check for alert conditions
   */
  checkAlertConditions() {
    const errorRate = this.calculateErrorRate();

    // Check error rate thresholds
    if (errorRate > this.thresholds.errorRate.critical) {
      this.triggerAlert('HIGH_ERROR_RATE', {
        errorRate,
        threshold: this.thresholds.errorRate.critical,
        total: this.metrics.requests.total,
        failed: this.metrics.requests.failed
      });
    }

    // Check for endpoint-specific issues
    this.checkEndpointHealth();
  }

  /**
   * Check health of individual endpoints
   */
  checkEndpointHealth() {
    const recentResponses = this.metrics.performance.responseTime.slice(-200);
    const endpointStats = new Map();

    // Aggregate by endpoint
    recentResponses.forEach(response => {
      const endpoint = response.endpoint;
      if (!endpointStats.has(endpoint)) {
        endpointStats.set(endpoint, { totalTime: 0, count: 0, failures: 0 });
      }

      const stats = endpointStats.get(endpoint);
      stats.totalTime += response.duration;
      stats.count++;

      if (response.statusCode >= 400) {
        stats.failures++;
      }
    });

    // Check each endpoint
    endpointStats.forEach((stats, endpoint) => {
      const avgTime = stats.totalTime / stats.count;
      const errorRate = stats.failures / stats.count;

      if (avgTime > this.thresholds.responseTime.critical || errorRate > this.thresholds.errorRate.critical) {
        this.triggerAlert('ENDPOINT_DEGRADATION', {
          endpoint,
          averageResponseTime: avgTime,
          errorRate,
          requestCount: stats.count
        });
      }
    });
  }

  /**
   * Trigger alert
   */
  triggerAlert(type, details) {
    const alert = {
      id: this.generateAlertId(),
      type,
      timestamp: Date.now(),
      severity: details.severity || 'warning',
      details,
      acknowledged: false
    };

    this.metrics.alerts.push(alert);

    // Log alert
    console.error(`🚨 ALERT: ${type}`, details);

    // In production, send to external monitoring service
    if (process.env.NODE_ENV === 'production') {
      this.sendAlertToExternalService(alert);
    }

    return alert;
  }

  /**
   * Send alert to external monitoring service
   */
  async sendAlertToExternalService(alert) {
    try {
      // Implementation for external services (Slack, PagerDuty, etc.)
      console.log('Would send alert to external service:', alert.type);
    } catch (error) {
      console.error('Failed to send alert to external service:', error);
    }
  }

  /**
   * Clean up old metrics to prevent memory leaks
   */
  cleanupOldMetrics() {
    const cutoff = Date.now() - (24 * 60 * 60 * 1000); // 24 hours

    // Clean response times
    this.metrics.performance.responseTime = this.metrics.performance.responseTime.filter(
      metric => metric.timestamp > cutoff
    );

    // Clean memory usage
    this.metrics.performance.memoryUsage = this.metrics.performance.memoryUsage.filter(
      metric => metric.timestamp > cutoff
    );

    // Clean CPU usage
    this.metrics.performance.cpuUsage = this.metrics.performance.cpuUsage.filter(
      metric => metric.timestamp > cutoff
    );

    // Clean old alerts
    this.metrics.alerts = this.metrics.alerts.filter(
      alert => alert.timestamp > cutoff
    );

    console.log('🧹 Cleaned up old monitoring metrics');
  }

  /**
   * Get comprehensive monitoring dashboard data
   */
  getDashboardData() {
    const now = Date.now();
    const lastHour = now - (60 * 60 * 1000);

    const recentResponses = this.metrics.performance.responseTime.filter(
      r => r.timestamp > lastHour
    );

    const recentMemory = this.metrics.performance.memoryUsage.filter(
      m => m.timestamp > lastHour
    );

    return {
      timestamp: now,
      uptime: process.uptime(),
      health: this.metrics.health,
      requests: {
        total: this.metrics.requests.total,
        successful: this.metrics.requests.successful,
        failed: this.metrics.requests.failed,
        errorRate: this.calculateErrorRate(),
        activeConnections: this.metrics.performance.activeConnections
      },
      performance: {
        averageResponseTime: recentResponses.length > 0 ?
          recentResponses.reduce((sum, r) => sum + r.duration, 0) / recentResponses.length : 0,
        slowRequests: recentResponses.filter(r => r.duration > this.thresholds.responseTime.warning).length,
        memoryUsage: recentMemory.slice(-1)[0]?.usagePercent || 0
      },
      endpoints: this.getEndpointStats(),
      alerts: {
        active: this.metrics.alerts.filter(a => !a.acknowledged).length,
        recent: this.metrics.alerts.slice(-10)
      },
      errors: errorHandler.getErrorStats()
    };
  }

  /**
   * Get endpoint statistics
   */
  getEndpointStats() {
    const stats = [];

    this.metrics.requests.byEndpoint.forEach((count, endpoint) => {
      const recentResponses = this.metrics.performance.responseTime
        .filter(r => r.endpoint === endpoint)
        .slice(-50);

      const avgResponseTime = recentResponses.length > 0 ?
        recentResponses.reduce((sum, r) => sum + r.duration, 0) / recentResponses.length : 0;

      const errorCount = recentResponses.filter(r => r.statusCode >= 400).length;

      stats.push({
        endpoint,
        requests: count,
        averageResponseTime: Math.round(avgResponseTime),
        errorRate: recentResponses.length > 0 ? errorCount / recentResponses.length : 0,
        status: avgResponseTime > this.thresholds.responseTime.warning ? 'warning' : 'healthy'
      });
    });

    return stats.sort((a, b) => b.requests - a.requests);
  }

  /**
   * Generate unique request ID
   */
  generateRequestId() {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate unique alert ID
   */
  generateAlertId() {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Reset monitoring metrics (for testing)
   */
  reset() {
    this.metrics = {
      requests: {
        total: 0,
        successful: 0,
        failed: 0,
        byEndpoint: new Map(),
        byUser: new Map()
      },
      performance: {
        responseTime: [],
        memoryUsage: [],
        cpuUsage: [],
        activeConnections: 0
      },
      health: {
        status: 'healthy',
        lastCheck: Date.now(),
        uptime: process.uptime(),
        checks: {}
      },
      alerts: []
    };

    console.log('📊 Monitoring metrics reset');
  }
}

// Create singleton instance
export const monitor = new ApplicationMonitor();

export default monitor;