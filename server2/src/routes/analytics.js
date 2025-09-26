// src/routes/analytics.js - Analytics Data Collection Routes
import express from 'express';

export function analyticsRouter(authenticateToken, db) {
  const router = express.Router();

  // Create analytics tables if they don't exist
  initializeAnalyticsTables(db);

  /**
   * Receive analytics events from frontend
   */
  router.post('/events', async (req, res) => {
    try {
      const eventData = req.body;

      // Validate event data
      if (!eventData.event || !eventData.timestamp) {
        return res.status(400).json({ error: 'Invalid event data' });
      }

      // Add server-side metadata
      const enrichedEvent = {
        ...eventData,
        ip_address: getClientIP(req),
        server_timestamp: Date.now(),
        user_agent: req.headers['user-agent'] || '',
        received_at: new Date().toISOString()
      };

      // Store in database
      await storeAnalyticsEvent(db, enrichedEvent);

      // Process real-time analytics if needed
      await processRealTimeAnalytics(enrichedEvent);

      res.status(200).json({ status: 'success' });
    } catch (error) {
      console.error('Analytics event storage failed:', error);
      // Don't fail the request, just log the error
      res.status(200).json({ status: 'logged' });
    }
  });

  /**
   * Get analytics dashboard data
   */
  router.get('/dashboard', authenticateToken, async (req, res) => {
    try {
      const userId = req.user?.id;
      const timeframe = req.query.timeframe || '7d'; // 1d, 7d, 30d, 90d

      const dashboardData = await getAnalyticsDashboard(db, userId, timeframe);
      res.json(dashboardData);
    } catch (error) {
      console.error('Analytics dashboard error:', error);
      res.status(500).json({ error: 'Failed to fetch analytics data' });
    }
  });

  /**
   * Get reading analytics for a specific user
   */
  router.get('/reading-stats', authenticateToken, async (req, res) => {
    try {
      const userId = req.user?.id;
      const timeframe = req.query.timeframe || '30d';

      const readingStats = await getReadingAnalytics(db, userId, timeframe);
      res.json(readingStats);
    } catch (error) {
      console.error('Reading analytics error:', error);
      res.status(500).json({ error: 'Failed to fetch reading stats' });
    }
  });

  /**
   * Get performance metrics
   */
  router.get('/performance', authenticateToken, async (req, res) => {
    try {
      const timeframe = req.query.timeframe || '7d';
      const performanceData = await getPerformanceMetrics(db, timeframe);
      res.json(performanceData);
    } catch (error) {
      console.error('Performance analytics error:', error);
      res.status(500).json({ error: 'Failed to fetch performance data' });
    }
  });

  /**
   * Get user engagement metrics
   */
  router.get('/engagement', authenticateToken, async (req, res) => {
    try {
      const userId = req.user?.id;
      const timeframe = req.query.timeframe || '30d';

      const engagementData = await getEngagementMetrics(db, userId, timeframe);
      res.json(engagementData);
    } catch (error) {
      console.error('Engagement analytics error:', error);
      res.status(500).json({ error: 'Failed to fetch engagement data' });
    }
  });

  /**
   * Export analytics data
   */
  router.get('/export', authenticateToken, async (req, res) => {
    try {
      const userId = req.user?.id;
      const format = req.query.format || 'json'; // json, csv
      const timeframe = req.query.timeframe || '30d';

      const exportData = await exportAnalyticsData(db, userId, timeframe, format);

      if (format === 'csv') {
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=analytics_export.csv');
      } else {
        res.setHeader('Content-Type', 'application/json');
      }

      res.send(exportData);
    } catch (error) {
      console.error('Analytics export error:', error);
      res.status(500).json({ error: 'Failed to export analytics data' });
    }
  });

  return router;
}

/**
 * Initialize analytics database tables
 */
function initializeAnalyticsTables(db) {
  try {
    // Analytics events table
    db.exec(`
      CREATE TABLE IF NOT EXISTS analytics_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        event_name TEXT NOT NULL,
        user_id TEXT,
        session_id TEXT,
        timestamp INTEGER NOT NULL,
        server_timestamp INTEGER NOT NULL,
        properties TEXT, -- JSON string
        ip_address TEXT,
        user_agent TEXT,
        platform TEXT,
        app_version TEXT,
        environment TEXT,
        url TEXT,
        referrer TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Performance metrics table
    db.exec(`
      CREATE TABLE IF NOT EXISTS performance_metrics (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        metric_name TEXT NOT NULL,
        value REAL NOT NULL,
        user_id TEXT,
        session_id TEXT,
        timestamp INTEGER NOT NULL,
        properties TEXT, -- JSON string
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create indexes for better query performance
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_analytics_events_timestamp ON analytics_events(timestamp);
      CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON analytics_events(user_id);
      CREATE INDEX IF NOT EXISTS idx_analytics_events_event_name ON analytics_events(event_name);
      CREATE INDEX IF NOT EXISTS idx_performance_metrics_timestamp ON performance_metrics(timestamp);
    `);

    console.log('📊 Analytics tables initialized');
  } catch (error) {
    console.error('❌ Failed to initialize analytics tables:', error);
  }
}

/**
 * Store analytics event in database
 */
async function storeAnalyticsEvent(db, eventData) {
  const {
    event,
    user_id,
    session_id,
    timestamp,
    server_timestamp,
    ip_address,
    user_agent,
    platform,
    app_version,
    environment,
    url,
    referrer,
    ...properties
  } = eventData;

  // Separate performance metrics
  if (event.startsWith('performance_')) {
    await storePerformanceMetric(db, {
      metric_name: event,
      value: properties.value || properties.load_time || properties.duration || 0,
      user_id,
      session_id,
      timestamp,
      properties: JSON.stringify(properties)
    });
  }

  // Store main event
  const stmt = db.prepare(`
    INSERT INTO analytics_events (
      event_name, user_id, session_id, timestamp, server_timestamp,
      properties, ip_address, user_agent, platform, app_version,
      environment, url, referrer
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run([
    event,
    user_id,
    session_id,
    timestamp,
    server_timestamp,
    JSON.stringify(properties),
    ip_address,
    user_agent,
    platform,
    app_version,
    environment,
    url,
    referrer
  ]);
}

/**
 * Store performance metric
 */
async function storePerformanceMetric(db, metricData) {
  const stmt = db.prepare(`
    INSERT INTO performance_metrics (
      metric_name, value, user_id, session_id, timestamp, properties
    ) VALUES (?, ?, ?, ?, ?, ?)
  `);

  stmt.run([
    metricData.metric_name,
    metricData.value,
    metricData.user_id,
    metricData.session_id,
    metricData.timestamp,
    metricData.properties
  ]);
}

/**
 * Process real-time analytics
 */
async function processRealTimeAnalytics(eventData) {
  // This could trigger real-time notifications, alerts, or updates
  // For now, just log important events
  const criticalEvents = [
    'error',
    'session_start',
    'reading_completed',
    'achievement_earned'
  ];

  if (criticalEvents.includes(eventData.event)) {
    console.log(`📊 Critical event: ${eventData.event}`, {
      user_id: eventData.user_id,
      timestamp: eventData.timestamp
    });
  }
}

/**
 * Get analytics dashboard data
 */
async function getAnalyticsDashboard(db, userId, timeframe) {
  const timeframeMs = getTimeframeMs(timeframe);
  const startTime = Date.now() - timeframeMs;

  const stmt = db.prepare(`
    SELECT
      event_name,
      COUNT(*) as count,
      COUNT(DISTINCT user_id) as unique_users,
      COUNT(DISTINCT session_id) as unique_sessions,
      MIN(timestamp) as first_occurrence,
      MAX(timestamp) as last_occurrence
    FROM analytics_events
    WHERE timestamp >= ?
      AND (? IS NULL OR user_id = ?)
    GROUP BY event_name
    ORDER BY count DESC
  `);

  const events = stmt.all([startTime, userId, userId]);

  // Get session data
  const sessionStmt = db.prepare(`
    SELECT
      COUNT(DISTINCT session_id) as total_sessions,
      COUNT(DISTINCT user_id) as total_users,
      AVG(
        CASE WHEN event_name = 'session_end'
        THEN json_extract(properties, '$.duration')
        END
      ) as avg_session_duration
    FROM analytics_events
    WHERE timestamp >= ?
      AND (? IS NULL OR user_id = ?)
  `);

  const sessionData = sessionStmt.get([startTime, userId, userId]);

  return {
    timeframe,
    period: {
      start: new Date(startTime).toISOString(),
      end: new Date().toISOString()
    },
    events,
    sessions: sessionData,
    summary: {
      total_events: events.reduce((sum, e) => sum + e.count, 0),
      unique_users: sessionData.total_users || 0,
      unique_sessions: sessionData.total_sessions || 0,
      avg_session_duration: Math.round(sessionData.avg_session_duration || 0)
    }
  };
}

/**
 * Get reading analytics
 */
async function getReadingAnalytics(db, userId, timeframe) {
  const timeframeMs = getTimeframeMs(timeframe);
  const startTime = Date.now() - timeframeMs;

  const readingStmt = db.prepare(`
    SELECT
      json_extract(properties, '$.book_id') as book_id,
      json_extract(properties, '$.book_title') as book_title,
      json_extract(properties, '$.session_duration') as session_duration,
      json_extract(properties, '$.reading_speed') as reading_speed,
      json_extract(properties, '$.progress') as progress,
      timestamp
    FROM analytics_events
    WHERE event_name LIKE 'reading_%'
      AND timestamp >= ?
      AND user_id = ?
    ORDER BY timestamp DESC
  `);

  const readingSessions = readingStmt.all([startTime, userId]);

  // Calculate statistics
  const stats = {
    total_sessions: readingSessions.length,
    total_reading_time: readingSessions.reduce((sum, s) => sum + (parseInt(s.session_duration) || 0), 0),
    average_session_duration: 0,
    average_reading_speed: 0,
    books_read: new Set(readingSessions.map(s => s.book_id).filter(Boolean)).size,
    reading_days: new Set(
      readingSessions.map(s => new Date(s.timestamp).toDateString())
    ).size
  };

  const validSessions = readingSessions.filter(s => s.session_duration > 0);
  if (validSessions.length > 0) {
    stats.average_session_duration = Math.round(
      stats.total_reading_time / validSessions.length
    );

    const speedSessions = readingSessions.filter(s => s.reading_speed > 0);
    if (speedSessions.length > 0) {
      stats.average_reading_speed = Math.round(
        speedSessions.reduce((sum, s) => sum + parseInt(s.reading_speed), 0) / speedSessions.length
      );
    }
  }

  return {
    timeframe,
    stats,
    sessions: readingSessions.slice(0, 50) // Return recent sessions
  };
}

/**
 * Get performance metrics
 */
async function getPerformanceMetrics(db, timeframe) {
  const timeframeMs = getTimeframeMs(timeframe);
  const startTime = Date.now() - timeframeMs;

  const perfStmt = db.prepare(`
    SELECT
      metric_name,
      AVG(value) as avg_value,
      MIN(value) as min_value,
      MAX(value) as max_value,
      COUNT(*) as measurements,
      percentile_90
    FROM (
      SELECT
        metric_name,
        value,
        ROW_NUMBER() OVER (
          PARTITION BY metric_name
          ORDER BY value
        ) as row_num,
        COUNT(*) OVER (PARTITION BY metric_name) as total_count,
        CASE
          WHEN ROW_NUMBER() OVER (PARTITION BY metric_name ORDER BY value) =
               CAST(COUNT(*) OVER (PARTITION BY metric_name) * 0.9 AS INTEGER)
          THEN value
          ELSE NULL
        END as percentile_90
      FROM performance_metrics
      WHERE timestamp >= ?
    )
    GROUP BY metric_name
    ORDER BY avg_value DESC
  `);

  const metrics = perfStmt.all([startTime]);

  return {
    timeframe,
    metrics,
    summary: {
      total_measurements: metrics.reduce((sum, m) => sum + m.measurements, 0),
      metric_types: metrics.length
    }
  };
}

/**
 * Get engagement metrics
 */
async function getEngagementMetrics(db, userId, timeframe) {
  const timeframeMs = getTimeframeMs(timeframe);
  const startTime = Date.now() - timeframeMs;

  const engagementStmt = db.prepare(`
    SELECT
      DATE(timestamp/1000, 'unixepoch') as date,
      COUNT(*) as total_events,
      COUNT(CASE WHEN event_name LIKE 'reading_%' THEN 1 END) as reading_events,
      COUNT(CASE WHEN event_name LIKE 'feature_%' THEN 1 END) as feature_events,
      COUNT(CASE WHEN event_name LIKE 'gamification_%' THEN 1 END) as gamification_events,
      AVG(
        CASE WHEN event_name = 'engagement_session'
        THEN json_extract(properties, '$.engagement_time')
        END
      ) as avg_engagement_time
    FROM analytics_events
    WHERE timestamp >= ?
      AND user_id = ?
    GROUP BY DATE(timestamp/1000, 'unixepoch')
    ORDER BY date DESC
  `);

  const dailyEngagement = engagementStmt.all([startTime, userId]);

  return {
    timeframe,
    daily_engagement: dailyEngagement,
    summary: {
      total_days_active: dailyEngagement.length,
      avg_events_per_day: dailyEngagement.reduce((sum, d) => sum + d.total_events, 0) / Math.max(dailyEngagement.length, 1),
      avg_engagement_time: Math.round(
        dailyEngagement.reduce((sum, d) => sum + (d.avg_engagement_time || 0), 0) / Math.max(dailyEngagement.length, 1)
      )
    }
  };
}

/**
 * Export analytics data
 */
async function exportAnalyticsData(db, userId, timeframe, format) {
  const timeframeMs = getTimeframeMs(timeframe);
  const startTime = Date.now() - timeframeMs;

  const stmt = db.prepare(`
    SELECT
      event_name,
      timestamp,
      session_id,
      properties,
      platform,
      app_version,
      created_at
    FROM analytics_events
    WHERE timestamp >= ?
      AND user_id = ?
    ORDER BY timestamp DESC
    LIMIT 10000
  `);

  const events = stmt.all([startTime, userId]);

  if (format === 'csv') {
    const csv = [
      'Event,Timestamp,Session ID,Properties,Platform,App Version,Created At',
      ...events.map(e => [
        e.event_name,
        new Date(e.timestamp).toISOString(),
        e.session_id,
        e.properties || '{}',
        e.platform,
        e.app_version,
        e.created_at
      ].join(','))
    ].join('\n');

    return csv;
  }

  return JSON.stringify({ events, exported_at: new Date().toISOString() }, null, 2);
}

/**
 * Get client IP address
 */
function getClientIP(req) {
  return req.ip ||
         req.connection.remoteAddress ||
         req.socket.remoteAddress ||
         (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
         'unknown';
}

/**
 * Convert timeframe string to milliseconds
 */
function getTimeframeMs(timeframe) {
  const timeframes = {
    '1d': 24 * 60 * 60 * 1000,
    '7d': 7 * 24 * 60 * 60 * 1000,
    '30d': 30 * 24 * 60 * 60 * 1000,
    '90d': 90 * 24 * 60 * 60 * 1000
  };

  return timeframes[timeframe] || timeframes['7d'];
}