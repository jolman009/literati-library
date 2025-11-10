# 📊 ShelfQuest Monitoring Stack

Enterprise-grade observability for ShelfQuest using the **Grafana Observability Stack** (Grafana + Prometheus + Loki + Tempo + Alertmanager).

## 📑 Table of Contents

- [Overview](#overview)
- [Quick Start](#quick-start)
- [Architecture](#architecture)
- [Components](#components)
- [Configuration](#configuration)
- [Usage Guide](#usage-guide)
- [Dashboards](#dashboards)
- [Alerting](#alerting)
- [Troubleshooting](#troubleshooting)
- [Best Practices](#best-practices)

---

## 🎯 Overview

The ShelfQuest monitoring stack provides:

- **Metrics Collection**: Prometheus scrapes metrics from all services
- **Log Aggregation**: Loki collects logs from all services
- **Distributed Tracing**: Tempo tracks requests across services
- **Visualization**: Grafana dashboards for comprehensive insights
- **Alerting**: Prometheus Alertmanager for critical notifications

### Why This Stack?

✅ **Cost**: 100% free and open-source
✅ **Scalability**: Proven at companies like DigitalOcean, GitLab, CERN
✅ **Integration**: All components designed to work together
✅ **Community**: Large community, extensive documentation
✅ **Flexibility**: Highly customizable for your needs

---

## 🚀 Quick Start

### Prerequisites

- Docker and Docker Compose installed
- At least 4GB RAM available for monitoring stack
- Ports 3001, 3100, 3200, 9090, 9093 available

### Installation

1. **Start the monitoring stack:**

   **Windows:**
   ```cmd
   start-monitoring.bat
   ```

   **macOS/Linux:**
   ```bash
   chmod +x start-monitoring.sh
   ./start-monitoring.sh
   ```

2. **Access Grafana:**
   - Open http://localhost:3001
   - Login: `admin` / `admin` (change on first login)

3. **Verify services:**
   - Prometheus: http://localhost:9090
   - Loki: http://localhost:3100
   - Tempo: http://localhost:3200
   - Alertmanager: http://localhost:9093

### First-Time Setup

1. **Change Grafana admin password:**
   - Click on user icon → Preferences → Change Password

2. **Explore pre-configured dashboards:**
   - Navigate to Dashboards → Browse
   - Open "ShelfQuest Overview" dashboard

3. **Configure alert notifications:**
   - Edit `monitoring/alertmanager/alertmanager.yml`
   - Add your email or Slack webhook
   - Restart: `docker-compose -f docker-compose.monitoring.yml restart alertmanager`

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Grafana (Port 3001)                   │
│              Visualization & Dashboards                  │
└────────────┬───────────────┬────────────────┬───────────┘
             │               │                 │
    ┌────────▼────────┐ ┌───▼──────┐  ┌──────▼──────┐
    │   Prometheus    │ │   Loki   │  │    Tempo    │
    │   (Metrics)     │ │  (Logs)  │  │  (Traces)   │
    │   Port 9090     │ │Port 3100 │  │  Port 3200  │
    └────────┬────────┘ └────┬─────┘  └──────┬──────┘
             │               │                 │
    ┌────────▼───────────────▼────────────────▼──────┐
    │                                                  │
    │          ShelfQuest Application Services        │
    │                                                  │
    │  ┌─────────┐  ┌──────────┐  ┌──────────────┐  │
    │  │  Server │  │  Client  │  │  AI Service  │  │
    │  │ Node.js │  │  React   │  │   FastAPI    │  │
    │  └─────────┘  └──────────┘  └──────────────┘  │
    │                                                  │
    └──────────────────────────────────────────────────┘
             │
    ┌────────▼────────┐
    │  Alertmanager   │
    │    Port 9093    │
    │  (Notifications)│
    └─────────────────┘
```

---

## 🧩 Components

### 1. **Prometheus** (Metrics Database)

**Purpose**: Time-series database for metrics
**Port**: 9090
**Data Retention**: 30 days

**Metrics Collected**:
- HTTP request duration and count
- System resources (CPU, memory, disk)
- Application-specific metrics (users, books, sessions)
- Database query performance
- Security events

**Configuration**: `monitoring/prometheus/prometheus.yml`

### 2. **Loki** (Log Aggregation)

**Purpose**: Log aggregation and querying
**Port**: 3100
**Data Retention**: 31 days

**Logs Collected**:
- Application logs (server, client, AI service)
- System logs
- Docker container logs
- Security audit logs

**Configuration**: `monitoring/loki/loki-config.yml`

### 3. **Promtail** (Log Shipper)

**Purpose**: Ships logs from files to Loki

**Log Sources**:
- `server2/logs/*.log` - Server logs
- `client2/logs/*.log` - Client logs
- `ai-service/logs/*.log` - AI service logs
- `/var/log` - System logs

**Configuration**: `monitoring/promtail/promtail-config.yml`

### 4. **Tempo** (Distributed Tracing)

**Purpose**: Distributed request tracing
**Port**: 3200
**Data Retention**: 7 days

**Trace Collection**:
- OTLP (OpenTelemetry Protocol)
- Jaeger protocol support

**Configuration**: `monitoring/tempo/tempo.yml`

### 5. **Grafana** (Visualization)

**Purpose**: Dashboards and visualization
**Port**: 3001
**Default Login**: admin/admin

**Features**:
- Pre-configured datasources
- Custom dashboards for ShelfQuest
- Alert visualization
- Log exploration
- Trace visualization

**Configuration**: `monitoring/grafana/provisioning/`

### 6. **Alertmanager** (Alert Management)

**Purpose**: Alert routing and notifications
**Port**: 9093

**Notification Channels**:
- Email (SMTP)
- Slack (webhook)
- PagerDuty (optional)
- Webhook (custom)

**Configuration**: `monitoring/alertmanager/alertmanager.yml`

---

## ⚙️ Configuration

### Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
# Grafana admin password
GRAFANA_ADMIN_PASSWORD=your-secure-password

# Email alerts (SMTP)
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# Slack alerts (optional)
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL

# Loki configuration
LOKI_HOST=http://localhost:3100
ENABLE_LOKI=true
```

### Prometheus Scrape Targets

Edit `monitoring/prometheus/prometheus.yml` to add or modify scrape targets:

```yaml
scrape_configs:
  - job_name: 'shelfquest-server'
    static_configs:
      - targets: ['host.docker.internal:5000']
    metrics_path: '/metrics'
    scrape_interval: 10s
```

**Note**: Use `host.docker.internal` to access services running on your host machine from Docker containers.

### Alert Rules

Add custom alerts in `monitoring/prometheus/alerts.yml`:

```yaml
groups:
  - name: custom_alerts
    rules:
      - alert: MyCustomAlert
        expr: your_metric > threshold
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Custom alert triggered"
          description: "Description of what happened"
```

### Loki Retention

Modify retention period in `monitoring/loki/loki-config.yml`:

```yaml
limits_config:
  retention_period: 744h  # 31 days (default)
```

---

## 📖 Usage Guide

### Viewing Metrics in Prometheus

1. Open http://localhost:9090
2. Go to "Graph" tab
3. Enter a metric query, example:
   ```promql
   rate(http_requests_total[5m])
   ```
4. Click "Execute"

**Useful Queries**:
- Request rate: `rate(http_requests_total[5m])`
- Error rate: `rate(http_requests_total{status=~"5.."}[5m])`
- P95 latency: `histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))`
- Active users: `active_users_total`
- Memory usage: `process_resident_memory_bytes`

### Querying Logs in Loki

1. Open Grafana (http://localhost:3001)
2. Go to "Explore"
3. Select "Loki" datasource
4. Enter LogQL query, example:
   ```logql
   {service="server"} |= "error"
   ```

**Useful Queries**:
- All server errors: `{service="server"} |= "error"`
- Last 100 lines: `{service="server"} | limit 100`
- HTTP 500 errors: `{service="server"} | json | statusCode="500"`
- Security events: `{service="server"} |= "security"`

### Using Grafana Dashboards

1. Navigate to Dashboards → Browse
2. Available dashboards:
   - **ShelfQuest Overview**: High-level metrics
   - **System Resources**: CPU, memory, disk
   - **Application Performance**: Request latency, error rates
   - **Security Dashboard**: Security events, failed logins
   - **Business Metrics**: User growth, engagement

### Distributed Tracing

1. Open Grafana → Explore
2. Select "Tempo" datasource
3. Search by:
   - Trace ID
   - Service name
   - Operation name
   - Duration

---

## 📊 Dashboards

### Pre-configured Dashboards

#### 1. ShelfQuest Overview
- Active users (DAU, WAU, MAU)
- Request rate and latency
- Error rate
- System health
- Top endpoints
- Recent errors

#### 2. System Resources
- CPU usage
- Memory usage
- Disk usage
- Network I/O
- Container metrics

#### 3. Application Performance
- API response times (P50, P95, P99)
- Request throughput
- Error rates by endpoint
- Slow query detection
- Cache hit/miss ratios

#### 4. Security Monitoring
- Failed login attempts
- Account lockouts
- Rate limit violations
- Security events timeline
- Top blocked IPs

#### 5. Business Metrics
- User signups
- Books uploaded
- Reading sessions
- Gamification engagement
- Achievement unlocks

### Creating Custom Dashboards

1. In Grafana, click "+ Create" → "Dashboard"
2. Add a panel
3. Configure visualization type
4. Write PromQL or LogQL query
5. Save dashboard

**Example Panel Query** (Request Rate):
```promql
sum(rate(http_requests_total[5m])) by (service)
```

---

## 🚨 Alerting

### Alert Severity Levels

- 🔴 **Critical**: Immediate action required (service down, high error rate)
- 🟡 **Warning**: Attention needed (high resource usage, slow responses)
- 🔵 **Info**: Informational (daily reports, trends)

### Configured Alerts

| Alert Name | Condition | Duration | Severity |
|------------|-----------|----------|----------|
| ServiceDown | Service unreachable | 2 min | Critical |
| HighErrorRate | Error rate > 1% | 5 min | Critical |
| HighAPILatency | P95 latency > 2s | 10 min | Warning |
| HighCPUUsage | CPU > 80% | 10 min | Warning |
| HighMemoryUsage | Memory > 85% | 10 min | Warning |
| LowDiskSpace | Disk < 20% | 5 min | Warning |
| BruteForceAttack | Failed logins > 20/min | 2 min | Critical |

### Alert Notification Setup

#### Email (SMTP)

Edit `monitoring/alertmanager/alertmanager.yml`:

```yaml
global:
  smtp_smarthost: 'smtp.gmail.com:587'
  smtp_from: 'alerts@shelfquest.com'
  smtp_auth_username: 'your-email@gmail.com'
  smtp_auth_password: 'your-app-password'
```

#### Slack

1. Create a Slack incoming webhook: https://api.slack.com/messaging/webhooks
2. Update `alertmanager.yml`:

```yaml
receivers:
  - name: 'critical-alerts'
    slack_configs:
      - api_url: 'https://hooks.slack.com/services/YOUR/WEBHOOK/URL'
        channel: '#alerts'
        title: 'Critical Alert: {{ .GroupLabels.alertname }}'
```

#### PagerDuty

1. Get PagerDuty service key
2. Update `alertmanager.yml`:

```yaml
receivers:
  - name: 'critical-alerts'
    pagerduty_configs:
      - service_key: 'your-pagerduty-key'
```

### Testing Alerts

```bash
# Trigger test alert
curl -X POST http://localhost:9093/api/v1/alerts -d '[{
  "labels": {
    "alertname": "TestAlert",
    "severity": "warning"
  },
  "annotations": {
    "summary": "This is a test alert"
  }
}]'
```

---

## 🔧 Troubleshooting

### Common Issues

#### 1. "Cannot connect to Prometheus"

**Solution**:
```bash
# Check if Prometheus is running
docker ps | grep prometheus

# Check logs
docker logs shelfquest-prometheus

# Restart Prometheus
docker-compose -f docker-compose.monitoring.yml restart prometheus
```

#### 2. "No data in Grafana dashboards"

**Causes**:
- Application not exposing metrics
- Prometheus not scraping targets
- Time range too narrow

**Solution**:
```bash
# Check if server is exposing metrics
curl http://localhost:5000/metrics

# Check Prometheus targets
# Open http://localhost:9090/targets

# Verify scrape configuration
cat monitoring/prometheus/prometheus.yml
```

#### 3. "Loki not receiving logs"

**Solution**:
```bash
# Check if Promtail is running
docker ps | grep promtail

# Check Promtail logs
docker logs shelfquest-promtail

# Verify log files exist
ls -la server2/logs/
```

#### 4. "High memory usage"

**Solution**:
```bash
# Reduce retention periods
# Edit monitoring/loki/loki-config.yml
retention_period: 168h  # 7 days instead of 31

# Edit monitoring/prometheus/prometheus.yml
--storage.tsdb.retention.time=15d  # 15 days instead of 30
```

### Accessing Container Logs

```bash
# All services
docker-compose -f docker-compose.monitoring.yml logs -f

# Specific service
docker logs -f shelfquest-grafana
docker logs -f shelfquest-prometheus
docker logs -f shelfquest-loki
```

### Restarting Services

```bash
# Restart all
docker-compose -f docker-compose.monitoring.yml restart

# Restart specific service
docker-compose -f docker-compose.monitoring.yml restart grafana
```

---

## ✨ Best Practices

### 1. **Security**

- Change default Grafana password immediately
- Restrict access to monitoring ports (use firewall/VPN)
- Use HTTPS in production (configure reverse proxy)
- Rotate credentials regularly
- Don't expose metrics endpoints publicly

### 2. **Performance**

- Set appropriate retention periods (don't keep data forever)
- Use recording rules for complex queries
- Limit label cardinality (don't use user IDs as labels)
- Clean up old dashboards and alerts
- Monitor the monitoring stack itself

### 3. **Alerting**

- Start with critical alerts only
- Avoid alert fatigue (< 10 alerts per week ideal)
- Make alerts actionable (what should I do?)
- Group related alerts
- Test alert notifications regularly

### 4. **Dashboards**

- Keep dashboards focused (one purpose per dashboard)
- Use templating for reusable dashboards
- Set appropriate time ranges
- Add descriptions to panels
- Use consistent color schemes

### 5. **Logging**

- Use structured logging (JSON format)
- Include correlation IDs for tracing
- Log at appropriate levels (DEBUG, INFO, WARN, ERROR)
- Don't log sensitive data (passwords, tokens)
- Rotate logs regularly

### 6. **Metrics**

- Follow Prometheus naming conventions
- Use histograms for latencies, summaries for sizes
- Add helpful labels (but not too many)
- Document custom metrics
- Use counters for monotonically increasing values

---

## 📚 Additional Resources

### Official Documentation

- **Prometheus**: https://prometheus.io/docs/
- **Grafana**: https://grafana.com/docs/grafana/latest/
- **Loki**: https://grafana.com/docs/loki/latest/
- **Tempo**: https://grafana.com/docs/tempo/latest/
- **Alertmanager**: https://prometheus.io/docs/alerting/latest/alertmanager/

### Tutorials

- [PromQL Basics](https://prometheus.io/docs/prometheus/latest/querying/basics/)
- [LogQL Guide](https://grafana.com/docs/loki/latest/logql/)
- [Grafana Dashboard Best Practices](https://grafana.com/docs/grafana/latest/dashboards/build-dashboards/best-practices/)

### Community

- Prometheus Community: https://prometheus.io/community/
- Grafana Community Forums: https://community.grafana.com/
- Stack Overflow: Tag `prometheus`, `grafana`, `loki`

---

## 🆘 Getting Help

If you encounter issues:

1. Check logs: `docker-compose -f docker-compose.monitoring.yml logs`
2. Review this documentation
3. Check official docs
4. Search community forums
5. Create an issue in the repository

---

**📊 Happy Monitoring!**
