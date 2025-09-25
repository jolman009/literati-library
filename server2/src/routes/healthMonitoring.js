import express from 'express';
import { supabase } from '../config/supabaseClient.js';
import { reportError } from '../config/sentry.js';
import {
  logHealthCheck,
  performanceLogger,
  createComponentLogger
} from '../config/logging.js';

const router = express.Router();
const healthLogger = createComponentLogger('health');

// Basic health check
const basicHealthCheck = async () => {
  const start = Date.now();
  const result = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    responseTime: 0,
  };

  result.responseTime = Date.now() - start;
  return result;
};

// Database connectivity check
const databaseHealthCheck = async () => {
  const start = Date.now();

  try {
    // Simple query to test database connectivity
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);

    const responseTime = Date.now() - start;

    if (error) {
      throw error;
    }

    return {
      status: 'healthy',
      responseTime,
      lastChecked: new Date().toISOString(),
    };
  } catch (error) {
    const responseTime = Date.now() - start;

    reportError(error, {
      tags: { section: 'health-check', service: 'database' },
      extra: { responseTime }
    });

    return {
      status: 'unhealthy',
      error: error.message,
      responseTime,
      lastChecked: new Date().toISOString(),
    };
  }
};

// AI Service connectivity check
const aiServiceHealthCheck = async () => {
  const start = Date.now();
  const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';

  try {
    const response = await fetch(`${aiServiceUrl}/health`, {
      method: 'GET',
      timeout: 5000, // 5 second timeout
    });

    const responseTime = Date.now() - start;

    if (!response.ok) {
      throw new Error(`AI Service responded with status ${response.status}`);
    }

    const data = await response.json();

    return {
      status: 'healthy',
      responseTime,
      lastChecked: new Date().toISOString(),
      aiServiceStatus: data.status,
    };
  } catch (error) {
    const responseTime = Date.now() - start;

    // Don't report errors to Sentry for expected failures during development
    if (process.env.NODE_ENV !== 'development') {
      reportError(error, {
        tags: { section: 'health-check', service: 'ai-service' },
        extra: { responseTime, aiServiceUrl }
      });
    }

    return {
      status: 'unhealthy',
      error: error.message,
      responseTime,
      lastChecked: new Date().toISOString(),
    };
  }
};

// Memory and performance metrics
const performanceMetrics = () => {
  const memoryUsage = process.memoryUsage();
  const cpuUsage = process.cpuUsage();

  return {
    memory: {
      rss: Math.round(memoryUsage.rss / 1024 / 1024), // MB
      heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024), // MB
      heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
      external: Math.round(memoryUsage.external / 1024 / 1024), // MB
    },
    cpu: {
      user: cpuUsage.user,
      system: cpuUsage.system,
    },
    uptime: Math.floor(process.uptime()),
    nodeVersion: process.version,
  };
};

// System resource checks
const systemResourceCheck = () => {
  const memoryUsage = process.memoryUsage();
  const memoryUsedMB = Math.round(memoryUsage.heapUsed / 1024 / 1024);
  const memoryTotalMB = Math.round(memoryUsage.heapTotal / 1024 / 1024);
  const memoryUsagePercent = (memoryUsedMB / memoryTotalMB) * 100;

  // Basic thresholds
  const memoryWarningThreshold = 80; // 80%
  const memoryCriticalThreshold = 95; // 95%

  let status = 'healthy';
  const warnings = [];

  if (memoryUsagePercent > memoryCriticalThreshold) {
    status = 'critical';
    warnings.push('Memory usage is critically high');
  } else if (memoryUsagePercent > memoryWarningThreshold) {
    status = 'warning';
    warnings.push('Memory usage is high');
  }

  return {
    status,
    warnings,
    metrics: {
      memoryUsagePercent: Math.round(memoryUsagePercent),
      memoryUsedMB,
      memoryTotalMB,
    }
  };
};

// Routes

// Basic health endpoint
router.get('/health', async (req, res) => {
  try {
    const health = await basicHealthCheck();
    logHealthCheck('api', health.status);
    res.status(200).json(health);
  } catch (error) {
    healthLogger.error('Health check failed', { error: error.message });
    res.status(500).json({
      status: 'unhealthy',
      error: 'Health check failed',
      timestamp: new Date().toISOString(),
    });
  }
});

// Detailed health check
router.get('/health/detailed', async (req, res) => {
  const startTime = Date.now();

  try {
    const [
      basicHealth,
      databaseHealth,
      aiServiceHealth,
      systemResources
    ] = await Promise.allSettled([
      basicHealthCheck(),
      databaseHealthCheck(),
      aiServiceHealthCheck(),
      Promise.resolve(systemResourceCheck())
    ]);

    const totalResponseTime = Date.now() - startTime;

    // Determine overall status
    const services = [
      { name: 'api', ...basicHealth.value || { status: 'unhealthy' } },
      { name: 'database', ...databaseHealth.value || { status: 'unhealthy' } },
      { name: 'aiService', ...aiServiceHealth.value || { status: 'unhealthy' } },
      { name: 'system', ...systemResources.value || { status: 'unhealthy' } },
    ];

    const unhealthyServices = services.filter(s => s.status !== 'healthy');
    const overallStatus = unhealthyServices.length === 0 ? 'healthy' :
                         unhealthyServices.some(s => s.status === 'critical') ? 'critical' : 'degraded';

    const result = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      responseTime: totalResponseTime,
      services: {
        api: services.find(s => s.name === 'api'),
        database: services.find(s => s.name === 'database'),
        aiService: services.find(s => s.name === 'aiService'),
        system: services.find(s => s.name === 'system'),
      }
    };

    // Log detailed health check
    logHealthCheck('detailed', overallStatus, {
      unhealthyServices: unhealthyServices.length,
      totalResponseTime,
    });

    const statusCode = overallStatus === 'healthy' ? 200 :
                      overallStatus === 'degraded' ? 200 : 503;

    res.status(statusCode).json(result);
  } catch (error) {
    healthLogger.error('Detailed health check failed', { error: error.message });
    reportError(error, {
      tags: { section: 'health-check', type: 'detailed' }
    });

    res.status(500).json({
      status: 'unhealthy',
      error: 'Detailed health check failed',
      timestamp: new Date().toISOString(),
      responseTime: Date.now() - startTime,
    });
  }
});

// Performance metrics endpoint
router.get('/metrics', (req, res) => {
  try {
    const metrics = performanceMetrics();
    performanceLogger.info('Performance metrics requested', metrics);
    res.status(200).json(metrics);
  } catch (error) {
    healthLogger.error('Metrics collection failed', { error: error.message });
    res.status(500).json({
      error: 'Failed to collect metrics',
      timestamp: new Date().toISOString(),
    });
  }
});

// Liveness probe (Kubernetes style)
router.get('/health/live', (req, res) => {
  // Simple check that the process is running
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
  });
});

// Readiness probe (Kubernetes style)
router.get('/health/ready', async (req, res) => {
  try {
    // Check if the service is ready to serve traffic
    const databaseHealth = await databaseHealthCheck();

    if (databaseHealth.status === 'healthy') {
      res.status(200).json({
        status: 'ready',
        timestamp: new Date().toISOString(),
        checks: {
          database: databaseHealth.status,
        },
      });
    } else {
      res.status(503).json({
        status: 'not-ready',
        timestamp: new Date().toISOString(),
        checks: {
          database: databaseHealth.status,
        },
      });
    }
  } catch (error) {
    healthLogger.error('Readiness check failed', { error: error.message });
    res.status(503).json({
      status: 'not-ready',
      error: 'Readiness check failed',
      timestamp: new Date().toISOString(),
    });
  }
});

// Version and build info
router.get('/info', (req, res) => {
  res.status(200).json({
    service: 'Literati API',
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    nodeVersion: process.version,
    uptime: Math.floor(process.uptime()),
    startTime: new Date(Date.now() - process.uptime() * 1000).toISOString(),
    buildInfo: {
      commit: process.env.GIT_COMMIT || 'unknown',
      branch: process.env.GIT_BRANCH || 'unknown',
      buildTime: process.env.BUILD_TIME || 'unknown',
    },
  });
});

export { router as healthMonitoringRouter };