# 🚀 Monitoring Stack Quick Start Guide

Get the ShelfQuest monitoring stack running in 5 minutes!

## Step 1: Start the Monitoring Stack

**Windows:**
```cmd
start-monitoring.bat
```

**macOS/Linux:**
```bash
chmod +x start-monitoring.sh
./start-monitoring.sh
```

This will start:
- ✅ Grafana (dashboards)
- ✅ Prometheus (metrics)
- ✅ Loki (logs)
- ✅ Tempo (traces)
- ✅ Alertmanager (alerts)

## Step 2: Integrate with Your Server

Add these lines to your server's main file ([server2/src/index.js](../server2/src/index.js) or wherever you initialize Express):

```javascript
// Import monitoring components
import { prometheusMetrics } from './services/prometheus-metrics.js';
import metricsRouter from './routes/metrics.js';
import logger from './config/logger.js';

// Add metrics middleware (before other routes)
app.use(prometheusMetrics.requestMetricsMiddleware());

// Add metrics endpoint
app.use('/', metricsRouter);

// Replace console.log with logger
logger.info('Server started', { port: PORT });
```

## Step 3: Access Grafana

1. Open **http://localhost:3001**
2. Login with:
   - Username: `admin`
   - Password: `admin`
3. Change password when prompted

## Step 4: Verify Everything Works

### Check Metrics

1. Visit **http://localhost:5000/metrics**
2. You should see Prometheus-formatted metrics

### Check Prometheus

1. Open **http://localhost:9090**
2. Go to Status → Targets
3. Verify `shelfquest-server` is **UP**

### View Logs in Grafana

1. In Grafana, click **Explore** (compass icon)
2. Select **Loki** datasource
3. Run query: `{service="server"}`
4. You should see server logs

### Create Your First Dashboard

1. Click **+** → **Dashboard** → **Add visualization**
2. Select **Prometheus** datasource
3. Enter query: `rate(http_requests_total[5m])`
4. Click **Apply**
5. Save dashboard

## Step 5: Set Up Alerts (Optional)

1. Edit `monitoring/.env`:
   ```env
   GRAFANA_ADMIN_PASSWORD=your-password
   SMTP_USERNAME=your-email@gmail.com
   SMTP_PASSWORD=your-app-password
   ```

2. Restart Alertmanager:
   ```bash
   docker-compose -f docker-compose.monitoring.yml restart alertmanager
   ```

## Useful Commands

```bash
# View logs
docker-compose -f docker-compose.monitoring.yml logs -f

# Restart everything
docker-compose -f docker-compose.monitoring.yml restart

# Stop monitoring
stop-monitoring.bat  # Windows
./stop-monitoring.sh # macOS/Linux

# Remove all data
docker-compose -f docker-compose.monitoring.yml down -v
```

## What to Monitor First

1. **Request Rate**: `rate(http_requests_total[5m])`
2. **Error Rate**: `rate(http_requests_total{status=~"5.."}[5m])`
3. **API Latency**: `histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))`
4. **Active Users**: `active_users_total`
5. **Memory Usage**: `process_resident_memory_bytes`

## Next Steps

- Read the [full README](README.md) for advanced configuration
- Explore pre-built dashboards
- Set up custom alerts
- Configure Slack/PagerDuty notifications

---

**Need help?** See [README.md](README.md#troubleshooting) or check logs.
