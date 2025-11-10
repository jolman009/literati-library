/**
 * Metrics endpoint for Prometheus scraping
 */

import express from 'express';
import { prometheusMetrics } from '../services/prometheus-metrics.js';
import { monitor } from '../services/monitoring.js';

const router = express.Router();

/**
 * GET /metrics
 * Returns Prometheus-formatted metrics
 * This endpoint should be accessible to Prometheus but not publicly exposed
 */
router.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', prometheusMetrics.getContentType());
    const metrics = await prometheusMetrics.getMetrics();
    res.end(metrics);
  } catch (error) {
    console.error('Error generating metrics:', error);
    res.status(500).end('Error generating metrics');
  }
});

/**
 * GET /metrics/json
 * Returns metrics in JSON format (for debugging)
 * Should be protected in production
 */
router.get('/metrics/json', async (req, res) => {
  try {
    const metrics = await prometheusMetrics.getMetricsJSON();
    res.json(metrics);
  } catch (error) {
    console.error('Error generating JSON metrics:', error);
    res.status(500).json({ error: 'Error generating metrics' });
  }
});

/**
 * GET /health
 * Health check endpoint for monitoring
 */
router.get('/health', (req, res) => {
  const health = monitor.metrics.health;

  const statusCode =
    health.status === 'healthy' ? 200 :
    health.status === 'degraded' ? 200 :
    health.status === 'critical' ? 503 : 500;

  res.status(statusCode).json({
    status: health.status,
    timestamp: health.timestamp || Date.now(),
    uptime: process.uptime(),
    checks: health.checks || {}
  });
});

/**
 * GET /health/live
 * Liveness probe - is the service running?
 */
router.get('/health/live', (req, res) => {
  res.status(200).json({
    status: 'alive',
    timestamp: Date.now(),
    uptime: process.uptime()
  });
});

/**
 * GET /health/ready
 * Readiness probe - is the service ready to accept traffic?
 */
router.get('/health/ready', (req, res) => {
  const health = monitor.metrics.health;

  // Consider service ready if not in critical state
  const isReady = health.status !== 'critical' && health.status !== 'error';

  res.status(isReady ? 200 : 503).json({
    status: isReady ? 'ready' : 'not_ready',
    health: health.status,
    timestamp: Date.now()
  });
});

export default router;
