// src/routes/performance.js
// Database and application performance monitoring endpoints

import express from 'express';
import { dbOptimizer } from '../services/database-optimization.js';
import { getQueryMetrics } from '../services/query-optimizer.js';
import { advancedCache } from '../services/advanced-caching.js';
import { supabase } from '../config/supabaseClient.js';

export function performanceRouter(authenticateToken) {
  const router = express.Router();

  // Comprehensive performance dashboard
  router.get('/dashboard', authenticateToken, async (req, res) => {
    try {
      const metrics = {
        timestamp: new Date().toISOString(),
        database: {
          optimization: dbOptimizer.getPerformanceMetrics(),
          queries: getQueryMetrics(),
          health: await dbOptimizer.healthCheck()
        },
        cache: {
          advanced: advancedCache.getStatistics(),
          basic: dbOptimizer.getPerformanceMetrics()
        },
        system: await getSystemMetrics(),
        recommendations: await generatePerformanceRecommendations(req.user.id)
      };

      res.json(metrics);
    } catch (error) {
      console.error('Performance dashboard error:', error);
      res.status(500).json({ error: 'Failed to fetch performance metrics' });
    }
  });

  // Cache management endpoints
  router.post('/cache/warm', authenticateToken, async (req, res) => {
    try {
      const { preloadBooks = true, preloadStats = true } = req.body;

      await advancedCache.warmCache(req.user.id, {
        preloadBooks,
        preloadStats
      });

      res.json({
        success: true,
        message: 'Cache warming initiated',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Cache warming error:', error);
      res.status(500).json({ error: 'Cache warming failed' });
    }
  });

  router.delete('/cache/clear', authenticateToken, async (req, res) => {
    try {
      const { pattern } = req.query;

      let clearedCount = 0;
      if (pattern) {
        clearedCount = advancedCache.invalidate(pattern);
      } else {
        advancedCache.clear();
        dbOptimizer.clearAllCaches();
        clearedCount = 'all';
      }

      res.json({
        success: true,
        clearedCount,
        message: 'Cache cleared successfully'
      });
    } catch (error) {
      console.error('Cache clear error:', error);
      res.status(500).json({ error: 'Cache clear failed' });
    }
  });

  // Query performance analysis
  router.get('/queries/slow', authenticateToken, async (req, res) => {
    try {
      const metrics = getQueryMetrics();
      const slowQueries = await identifySlowQueries(metrics);

      res.json({
        slowQueries,
        thresholds: {
          slow: 1000,
          warning: 500,
          acceptable: 100
        },
        recommendations: generateQueryOptimizationTips(slowQueries)
      });
    } catch (error) {
      console.error('Slow queries analysis error:', error);
      res.status(500).json({ error: 'Failed to analyze slow queries' });
    }
  });

  // Database health check
  router.get('/health', authenticateToken, async (req, res) => {
    try {
      const healthChecks = await performHealthChecks(req.user.id);

      const overallHealth = calculateOverallHealth(healthChecks);

      res.json({
        status: overallHealth.status,
        score: overallHealth.score,
        checks: healthChecks,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Health check error:', error);
      res.status(500).json({
        status: 'error',
        error: 'Health check failed',
        timestamp: new Date().toISOString()
      });
    }
  });

  // Performance optimization recommendations
  router.get('/recommendations', authenticateToken, async (req, res) => {
    try {
      const recommendations = await generateDetailedRecommendations(req.user.id);

      res.json({
        recommendations,
        priority: recommendations.filter(r => r.priority === 'high').length,
        implementationGuide: getImplementationGuide(),
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Recommendations error:', error);
      res.status(500).json({ error: 'Failed to generate recommendations' });
    }
  });

  // Export performance data for analysis
  router.get('/export', authenticateToken, async (req, res) => {
    try {
      const { format = 'json', days = 7 } = req.query;

      const exportData = {
        metadata: {
          userId: req.user.id,
          exportDate: new Date().toISOString(),
          timeframe: days,
          format
        },
        performance: {
          database: dbOptimizer.getPerformanceMetrics(),
          queries: getQueryMetrics(),
          cache: advancedCache.export()
        },
        analysis: await generatePerformanceAnalysis(req.user.id, days)
      };

      // Set appropriate headers for download
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="performance-export-${Date.now()}.json"`);

      res.json(exportData);
    } catch (error) {
      console.error('Performance export error:', error);
      res.status(500).json({ error: 'Export failed' });
    }
  });

  return router;
}

// Helper functions

async function getSystemMetrics() {
  return {
    memory: process.memoryUsage(),
    uptime: process.uptime(),
    nodeVersion: process.version,
    platform: process.platform,
    cpu: process.cpuUsage()
  };
}

async function generatePerformanceRecommendations(userId) {
  const recommendations = [];

  // Analyze cache hit rates
  const cacheStats = advancedCache.getStatistics();
  const totalEntries = cacheStats.totalEntries;

  if (totalEntries < 10) {
    recommendations.push({
      type: 'cache',
      priority: 'medium',
      message: 'Consider implementing cache warming for better performance',
      action: 'Enable automatic cache warming for frequently accessed data'
    });
  }

  // Analyze query performance
  const queryMetrics = getQueryMetrics();
  const avgDuration = queryMetrics.recentPerformance?.avgDuration || 0;

  if (avgDuration > 1000) {
    recommendations.push({
      type: 'query',
      priority: 'high',
      message: 'Query performance degradation detected',
      action: 'Review and optimize slow database queries'
    });
  }

  // Check error rates
  const errorRate = queryMetrics.errorRate || 0;
  if (errorRate > 0.05) {
    recommendations.push({
      type: 'reliability',
      priority: 'high',
      message: `High error rate: ${(errorRate * 100).toFixed(1)}%`,
      action: 'Investigate and fix database connection issues'
    });
  }

  return recommendations;
}

async function identifySlowQueries(metrics) {
  const slowQueries = [];

  if (metrics.recentPerformance) {
    const { avgDuration, slowQueries: slowCount } = metrics.recentPerformance;

    if (avgDuration > 500) {
      slowQueries.push({
        type: 'average_performance',
        duration: avgDuration,
        severity: avgDuration > 1000 ? 'high' : 'medium',
        description: `Average query time: ${avgDuration}ms`
      });
    }

    if (slowCount > 0) {
      slowQueries.push({
        type: 'slow_query_count',
        count: slowCount,
        severity: slowCount > 5 ? 'high' : 'medium',
        description: `${slowCount} queries exceeded 1 second`
      });
    }
  }

  return slowQueries;
}

function generateQueryOptimizationTips(slowQueries) {
  const tips = [
    'Add appropriate database indexes for frequently queried columns',
    'Implement query result caching for expensive operations',
    'Use pagination to limit result set sizes',
    'Consider database query optimization and EXPLAIN analysis',
    'Implement connection pooling for better resource management'
  ];

  return tips;
}

async function performHealthChecks(userId) {
  const checks = {};

  // Database connectivity check
  try {
    const { data, error } = await supabase
      .from('books')
      .select('id')
      .eq('user_id', userId)
      .limit(1);

    checks.database = {
      status: error ? 'fail' : 'pass',
      responseTime: Date.now(),
      error: error?.message
    };
  } catch (error) {
    checks.database = {
      status: 'fail',
      error: error.message
    };
  }

  // Cache performance check
  const cacheStats = advancedCache.getStatistics();
  checks.cache = {
    status: cacheStats.totalEntries > 0 ? 'pass' : 'warning',
    totalEntries: cacheStats.totalEntries,
    memoryUsage: cacheStats.memoryEstimate
  };

  // Query performance check
  const queryMetrics = getQueryMetrics();
  const avgDuration = queryMetrics.recentPerformance?.avgDuration || 0;
  checks.queryPerformance = {
    status: avgDuration < 500 ? 'pass' : avgDuration < 1000 ? 'warning' : 'fail',
    avgDuration,
    errorRate: queryMetrics.errorRate
  };

  return checks;
}

function calculateOverallHealth(checks) {
  const checkValues = Object.values(checks);
  const passCount = checkValues.filter(c => c.status === 'pass').length;
  const warnCount = checkValues.filter(c => c.status === 'warning').length;
  const failCount = checkValues.filter(c => c.status === 'fail').length;

  const score = Math.round((passCount + warnCount * 0.5) / checkValues.length * 100);

  let status = 'healthy';
  if (failCount > 0) status = 'critical';
  else if (warnCount > passCount) status = 'warning';

  return { status, score };
}

async function generateDetailedRecommendations(userId) {
  const recommendations = await generatePerformanceRecommendations(userId);

  // Add implementation details
  return recommendations.map(rec => ({
    ...rec,
    implementation: getImplementationDetails(rec.type),
    estimatedImpact: getEstimatedImpact(rec.type),
    difficulty: getDifficultyLevel(rec.type)
  }));
}

function getImplementationDetails(type) {
  const details = {
    cache: 'Enable cache warming endpoints and implement automatic background caching',
    query: 'Add database indexes, implement query result caching, and optimize query structure',
    reliability: 'Implement retry logic, improve error handling, and add connection monitoring'
  };

  return details[type] || 'Review and optimize based on specific requirements';
}

function getEstimatedImpact(type) {
  const impacts = {
    cache: 'High - 30-50% improvement in response times',
    query: 'Very High - 50-80% improvement in database performance',
    reliability: 'Medium - Improved user experience and reduced errors'
  };

  return impacts[type] || 'Medium impact expected';
}

function getDifficultyLevel(type) {
  const difficulties = {
    cache: 'Easy - Configuration changes only',
    query: 'Medium - Requires database analysis and optimization',
    reliability: 'Medium - Code changes and monitoring setup'
  };

  return difficulties[type] || 'Medium difficulty';
}

function getImplementationGuide() {
  return {
    quickWins: [
      'Enable cache warming for frequently accessed data',
      'Implement query result caching',
      'Add database connection monitoring'
    ],
    mediumTerm: [
      'Optimize slow database queries',
      'Implement intelligent caching strategies',
      'Add performance monitoring dashboards'
    ],
    longTerm: [
      'Implement advanced query optimization',
      'Add predictive caching based on usage patterns',
      'Implement automated performance tuning'
    ]
  };
}

async function generatePerformanceAnalysis(userId, days) {
  const analysis = {
    timeframe: `${days} days`,
    summary: 'Performance analysis based on recent activity',
    trends: [],
    insights: []
  };

  // Add basic analysis - in production, this would analyze historical data
  const queryMetrics = getQueryMetrics();

  if (queryMetrics.recentPerformance) {
    analysis.trends.push({
      metric: 'Average Query Time',
      value: `${queryMetrics.recentPerformance.avgDuration}ms`,
      trend: queryMetrics.recentPerformance.avgDuration < 500 ? 'improving' : 'needs attention'
    });
  }

  const cacheStats = advancedCache.getStatistics();
  analysis.trends.push({
    metric: 'Cache Utilization',
    value: `${cacheStats.totalEntries} entries`,
    trend: cacheStats.totalEntries > 50 ? 'good' : 'low'
  });

  return analysis;
}