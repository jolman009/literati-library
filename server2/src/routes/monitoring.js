// src/routes/monitoring.js
// Monitoring and error handling endpoints for production deployment

import express from 'express';
import { monitor } from '../services/monitoring.js';
import { errorHandler } from '../services/error-handler.js';
import { getQueryMetrics } from '../services/query-optimizer.js';
import { advancedCache } from '../services/advanced-caching.js';
import { supabase } from '../config/supabaseClient.js';

export function monitoringRouter(authenticateToken) {
  const router = express.Router();

  // Real-time monitoring dashboard
  router.get('/dashboard', authenticateToken, async (req, res) => {
    try {
      const dashboardData = monitor.getDashboardData();

      res.json({
        success: true,
        data: dashboardData,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      errorHandler.handleError(error, {
        endpoint: '/monitoring/dashboard',
        userId: req.user?.id
      });
      res.status(500).json({ error: 'Failed to fetch monitoring dashboard' });
    }
  });

  // Application health check
  router.get('/health', async (req, res) => {
    try {
      const healthData = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        checks: {}
      };

      // Database connectivity check
      try {
        const { data, error } = await supabase
          .from('books')
          .select('id')
          .limit(1);

        healthData.checks.database = {
          status: error ? 'fail' : 'pass',
          responseTime: Date.now(),
          error: error?.message
        };
      } catch (dbError) {
        healthData.checks.database = {
          status: 'fail',
          error: dbError.message
        };
        healthData.status = 'degraded';
      }

      // Memory check
      const memUsage = process.memoryUsage();
      const memUsagePercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;
      healthData.checks.memory = {
        status: memUsagePercent < 80 ? 'pass' : memUsagePercent < 95 ? 'warning' : 'fail',
        usage: `${memUsagePercent.toFixed(1)}%`,
        heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024) + 'MB',
        heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024) + 'MB'
      };

      // Error handler check
      const errorStats = errorHandler.getErrorStats();
      const criticalErrors = errorStats.errorRates.criticalInLastHour;
      healthData.checks.errors = {
        status: criticalErrors === 0 ? 'pass' : criticalErrors < 5 ? 'warning' : 'fail',
        criticalInLastHour: criticalErrors,
        totalErrors: errorStats.totalErrors
      };

      // Query performance check
      const queryMetrics = getQueryMetrics();
      const avgQueryTime = queryMetrics.recentPerformance?.avgDuration || 0;
      healthData.checks.queryPerformance = {
        status: avgQueryTime < 500 ? 'pass' : avgQueryTime < 1000 ? 'warning' : 'fail',
        averageTime: `${avgQueryTime}ms`,
        errorRate: `${(queryMetrics.errorRate * 100).toFixed(1)}%`
      };

      // Determine overall status
      const failedChecks = Object.values(healthData.checks).filter(check => check.status === 'fail');
      const warningChecks = Object.values(healthData.checks).filter(check => check.status === 'warning');

      if (failedChecks.length > 0) {
        healthData.status = 'unhealthy';
      } else if (warningChecks.length > 0) {
        healthData.status = 'degraded';
      }

      // Set appropriate HTTP status code
      const statusCode = healthData.status === 'healthy' ? 200 :
        healthData.status === 'degraded' ? 200 : 503;

      res.status(statusCode).json(healthData);
    } catch (error) {
      res.status(503).json({
        status: 'unhealthy',
        error: 'Health check failed',
        timestamp: new Date().toISOString()
      });
    }
  });

  // Error statistics and management
  router.get('/errors', authenticateToken, async (req, res) => {
    try {
      const { category, severity, limit = 50 } = req.query;

      const errorStats = errorHandler.getErrorStats();
      let filteredErrors = errorStats.recentErrors;

      // Apply filters
      if (category) {
        filteredErrors = filteredErrors.filter(error => error.category === category);
      }

      if (severity) {
        filteredErrors = filteredErrors.filter(error => error.severity === severity);
      }

      // Limit results
      filteredErrors = filteredErrors.slice(0, parseInt(limit));

      res.json({
        success: true,
        data: {
          statistics: errorStats,
          errors: filteredErrors,
          filters: { category, severity, limit }
        }
      });
    } catch (error) {
      errorHandler.handleError(error, {
        endpoint: '/monitoring/errors',
        userId: req.user?.id
      });
      res.status(500).json({ error: 'Failed to fetch error statistics' });
    }
  });

  // Performance metrics
  router.get('/performance', authenticateToken, async (req, res) => {
    try {
      const { timeframe = '1h' } = req.query;

      const monitoringData = monitor.getDashboardData();
      const queryMetrics = getQueryMetrics();
      const cacheStats = advancedCache.getStatistics();

      const performanceData = {
        timestamp: new Date().toISOString(),
        timeframe,
        metrics: {
          requests: monitoringData.requests,
          responseTime: monitoringData.performance,
          database: queryMetrics,
          cache: cacheStats,
          memory: {
            usage: monitoringData.performance.memoryUsage,
            process: process.memoryUsage()
          },
          endpoints: monitoringData.endpoints
        },
        trends: calculatePerformanceTrends(timeframe),
        recommendations: generatePerformanceRecommendations(monitoringData, queryMetrics)
      };

      res.json({
        success: true,
        data: performanceData
      });
    } catch (error) {
      errorHandler.handleError(error, {
        endpoint: '/monitoring/performance',
        userId: req.user?.id
      });
      res.status(500).json({ error: 'Failed to fetch performance metrics' });
    }
  });

  // Active alerts
  router.get('/alerts', authenticateToken, async (req, res) => {
    try {
      const { acknowledged = false } = req.query;

      const monitoringData = monitor.getDashboardData();
      let alerts = monitoringData.alerts.recent;

      if (acknowledged === 'false') {
        alerts = alerts.filter(alert => !alert.acknowledged);
      }

      res.json({
        success: true,
        data: {
          activeCount: monitoringData.alerts.active,
          alerts: alerts.map(alert => ({
            ...alert,
            timeAgo: getTimeAgo(alert.timestamp)
          }))
        }
      });
    } catch (error) {
      errorHandler.handleError(error, {
        endpoint: '/monitoring/alerts',
        userId: req.user?.id
      });
      res.status(500).json({ error: 'Failed to fetch alerts' });
    }
  });

  // Acknowledge alert
  router.patch('/alerts/:alertId/acknowledge', authenticateToken, async (req, res) => {
    try {
      const { alertId } = req.params;

      // Find and acknowledge alert
      const monitoringData = monitor.getDashboardData();
      const alert = monitoringData.alerts.recent.find(a => a.id === alertId);

      if (!alert) {
        return res.status(404).json({ error: 'Alert not found' });
      }

      alert.acknowledged = true;
      alert.acknowledgedBy = req.user.id;
      alert.acknowledgedAt = new Date().toISOString();

      res.json({
        success: true,
        message: 'Alert acknowledged',
        alert
      });
    } catch (error) {
      errorHandler.handleError(error, {
        endpoint: '/monitoring/alerts/acknowledge',
        userId: req.user?.id
      });
      res.status(500).json({ error: 'Failed to acknowledge alert' });
    }
  });

  // System information
  router.get('/system', authenticateToken, async (req, res) => {
    try {
      const systemInfo = {
        timestamp: new Date().toISOString(),
        process: {
          pid: process.pid,
          version: process.version,
          platform: process.platform,
          arch: process.arch,
          uptime: process.uptime(),
          memoryUsage: process.memoryUsage(),
          cpuUsage: process.cpuUsage()
        },
        environment: {
          nodeEnv: process.env.NODE_ENV,
          port: process.env.PORT,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
        },
        versions: process.versions,
        features: {
          monitoring: true,
          errorHandling: true,
          caching: true,
          queryOptimization: true,
          security: true
        }
      };

      res.json({
        success: true,
        data: systemInfo
      });
    } catch (error) {
      errorHandler.handleError(error, {
        endpoint: '/monitoring/system',
        userId: req.user?.id
      });
      res.status(500).json({ error: 'Failed to fetch system information' });
    }
  });

  // Export monitoring data
  router.get('/export', authenticateToken, async (req, res) => {
    try {
      const { format = 'json', days = 1 } = req.query;

      const exportData = {
        metadata: {
          exportDate: new Date().toISOString(),
          timeframe: `${days} days`,
          format,
          exportedBy: req.user.id
        },
        monitoring: monitor.getDashboardData(),
        errors: errorHandler.exportErrorData(),
        performance: getQueryMetrics(),
        cache: advancedCache.export()
      };

      // Set appropriate headers
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="monitoring-export-${Date.now()}.json"`);

      res.json(exportData);
    } catch (error) {
      errorHandler.handleError(error, {
        endpoint: '/monitoring/export',
        userId: req.user?.id
      });
      res.status(500).json({ error: 'Failed to export monitoring data' });
    }
  });

  // Test error handling (development only)
  if (process.env.NODE_ENV === 'development') {
    router.post('/test-error', authenticateToken, async (req, res) => {
      const { type = 'generic', severity = 'medium' } = req.body;

      try {
        switch (type) {
          case 'database':
            throw new Error('Test database connection error');
          case 'validation':
            const validationError = new Error('Test validation error');
            validationError.status = 422;
            throw validationError;
          case 'auth':
            const authError = new Error('Test authentication error');
            authError.status = 401;
            throw authError;
          default:
            throw new Error('Test generic error');
        }
      } catch (error) {
        errorHandler.handleError(error, {
          endpoint: '/monitoring/test-error',
          userId: req.user?.id,
          testError: true,
          requestedType: type,
          requestedSeverity: severity
        });

        res.status(error.status || 500).json({
          success: false,
          message: 'Test error generated successfully',
          errorType: type,
          errorMessage: error.message
        });
      }
    });
  }

  return router;
}

// Helper functions

function calculatePerformanceTrends(timeframe) {
  // In a real implementation, this would analyze historical data
  return {
    responseTime: 'stable',
    errorRate: 'improving',
    memoryUsage: 'stable',
    requestVolume: 'increasing'
  };
}

function generatePerformanceRecommendations(monitoringData, queryMetrics) {
  const recommendations = [];

  // Check response time
  if (monitoringData.performance.averageResponseTime > 1000) {
    recommendations.push({
      type: 'performance',
      priority: 'high',
      message: 'Average response time exceeds 1 second',
      suggestion: 'Implement response caching and optimize slow queries'
    });
  }

  // Check error rate
  if (monitoringData.requests.errorRate > 0.05) {
    recommendations.push({
      type: 'reliability',
      priority: 'high',
      message: 'High error rate detected',
      suggestion: 'Review error logs and implement better error handling'
    });
  }

  // Check memory usage
  if (monitoringData.performance.memoryUsage > 80) {
    recommendations.push({
      type: 'resource',
      priority: 'medium',
      message: 'High memory usage detected',
      suggestion: 'Consider implementing more aggressive caching or scaling horizontally'
    });
  }

  return recommendations;
}

function getTimeAgo(timestamp) {
  const now = Date.now();
  const diffMs = now - timestamp;
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins} minutes ago`;
  if (diffHours < 24) return `${diffHours} hours ago`;
  return `${diffDays} days ago`;
}