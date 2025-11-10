# Prometheus & Grafana Integration Guide

This guide explains how to integrate PulseGrid with Prometheus and Grafana for advanced observability.

## Overview

PulseGrid exposes metrics in Prometheus format and can be integrated with Grafana for advanced visualization and alerting.

## Prometheus Metrics Endpoint

PulseGrid exposes metrics at the following endpoint:

```
GET /api/v1/metrics
```

This endpoint returns metrics in Prometheus text format and is **publicly accessible** (no authentication required) to allow Prometheus to scrape it.

### Available Metrics

#### Service Uptime Metrics
- `pulsegrid_service_uptime_percent{service_id, service_name}` - Uptime percentage per service
- `pulsegrid_service_total_checks{service_id, service_name}` - Total health checks per service

#### Response Time Metrics
- `pulsegrid_service_response_time_avg_ms{service_id, service_name}` - Average response time
- `pulsegrid_service_response_time_min_ms{service_id, service_name}` - Minimum response time
- `pulsegrid_service_response_time_max_ms{service_id, service_name}` - Maximum response time

#### Status Metrics
- `pulsegrid_service_status{service_id, service_name, status}` - Current service status (1.0 = up, 0.0 = down, 0.5 = degraded)
- `pulsegrid_service_status_count{service_id, service_name, status}` - Count of checks by status

#### Alert Metrics
- `pulsegrid_alerts_active{severity}` - Active alerts by severity
- `pulsegrid_alerts_active_total` - Total active alerts

## Prometheus Configuration

### 1. Install Prometheus

Download and install Prometheus from [prometheus.io](https://prometheus.io/download/)

### 2. Configure Prometheus

Edit `prometheus.yml`:

```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'pulsegrid'
    static_configs:
      - targets: ['localhost:8080']
    metrics_path: '/api/v1/metrics'
    scrape_interval: 30s
```

### 3. Start Prometheus

```bash
./prometheus --config.file=prometheus.yml
```

Prometheus will be available at `http://localhost:9090`

## Grafana Setup

### 1. Install Grafana

Download and install Grafana from [grafana.com](https://grafana.com/grafana/download)

### 2. Add Prometheus Data Source

1. Open Grafana at `http://localhost:3000`
2. Go to **Configuration** → **Data Sources**
3. Click **Add data source**
4. Select **Prometheus**
5. Set URL: `http://localhost:9090`
6. Click **Save & Test**

### 3. Import Dashboard

Create a new dashboard or use the following queries:

#### Service Uptime Panel
```promql
pulsegrid_service_uptime_percent
```

#### Response Time Panel
```promql
pulsegrid_service_response_time_avg_ms
```

#### Service Status Panel
```promql
pulsegrid_service_status
```

#### Active Alerts Panel
```promql
pulsegrid_alerts_active_total
```

## Example Grafana Dashboard JSON

```json
{
  "dashboard": {
    "title": "PulseGrid Monitoring",
    "panels": [
      {
        "title": "Service Uptime",
        "targets": [
          {
            "expr": "pulsegrid_service_uptime_percent",
            "legendFormat": "{{service_name}}"
          }
        ],
        "type": "graph"
      },
      {
        "title": "Response Time",
        "targets": [
          {
            "expr": "pulsegrid_service_response_time_avg_ms",
            "legendFormat": "{{service_name}}"
          }
        ],
        "type": "graph"
      },
      {
        "title": "Active Alerts",
        "targets": [
          {
            "expr": "pulsegrid_alerts_active_total"
          }
        ],
        "type": "stat"
      }
    ]
  }
}
```

## Advanced Queries

### Service Availability Over Time
```promql
avg_over_time(pulsegrid_service_uptime_percent[1h])
```

### Services with Low Uptime
```promql
pulsegrid_service_uptime_percent < 95
```

### High Response Times
```promql
pulsegrid_service_response_time_avg_ms > 1000
```

### Critical Alerts
```promql
pulsegrid_alerts_active{severity="critical"}
```

## Alerting Rules

Create `alerts.yml` in Prometheus:

```yaml
groups:
  - name: pulsegrid_alerts
    interval: 30s
    rules:
      - alert: ServiceDown
        expr: pulsegrid_service_status == 0
        for: 5m
        annotations:
          summary: "Service {{ $labels.service_name }} is down"
      
      - alert: LowUptime
        expr: pulsegrid_service_uptime_percent < 95
        for: 10m
        annotations:
          summary: "Service {{ $labels.service_name }} has low uptime"
      
      - alert: HighResponseTime
        expr: pulsegrid_service_response_time_avg_ms > 2000
        for: 5m
        annotations:
          summary: "Service {{ $labels.service_name }} has high response time"
```

## Docker Compose Setup

For easy setup, use Docker Compose:

```yaml
version: '3.8'
services:
  pulsegrid-api:
    # Your PulseGrid API service
    ports:
      - "8080:8080"
  
  prometheus:
    image: prom/prometheus:latest
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus-data:/prometheus
    ports:
      - "9090:9090"
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
  
  grafana:
    image: grafana/grafana:latest
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    volumes:
      - grafana-data:/var/lib/grafana

volumes:
  prometheus-data:
  grafana-data:
```

## Troubleshooting

### Metrics Not Appearing

1. Verify the endpoint is accessible:
   ```bash
   curl http://localhost:8080/api/v1/metrics
   ```

2. Check Prometheus targets:
   - Go to `http://localhost:9090/targets`
   - Verify PulseGrid target is "UP"

3. Check for errors in Prometheus logs

### Grafana Not Showing Data

1. Verify Prometheus data source is connected
2. Check time range in Grafana
3. Verify queries return data in Prometheus UI first

## Best Practices

1. **Scrape Interval**: Set appropriate scrape intervals (30s recommended)
2. **Retention**: Configure Prometheus retention based on your needs
3. **Labels**: Use service_id and service_name labels for filtering
4. **Alerts**: Set up alerting rules for critical metrics
5. **Dashboards**: Create dashboards for different user roles

## Security Considerations

⚠️ **Note**: The `/api/v1/metrics` endpoint is publicly accessible. In production:

1. Use network-level security (firewall rules)
2. Consider adding basic authentication
3. Use reverse proxy with authentication
4. Restrict access to Prometheus server IPs only

## Next Steps

- Set up alerting rules in Prometheus
- Create custom Grafana dashboards
- Integrate with Alertmanager for notifications
- Set up long-term storage with Thanos or Cortex

