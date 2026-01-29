# Monitoring Stack - Loki + Grafana

This directory contains the monitoring infrastructure for TwinkForSale using Grafana Loki for centralized logging and Grafana for visualization.

## Quick Start

### Option 1: Run with Full Stack

```bash
cd docker
cp .env.example .env
# Edit .env with your configuration
docker-compose --profile full --profile monitoring up -d
```

### Option 2: Run Monitoring Stack Separately

```bash
cd docker
docker-compose -f docker-compose.monitoring.yml up -d
```

## Services

### Grafana Loki (Port 3100)
- **Purpose**: Centralized log aggregation
- **URL**: http://localhost:3100
- **Health Check**: http://localhost:3100/ready

### Grafana (Port 3200)
- **Purpose**: Log visualization and dashboards
- **URL**: http://localhost:3200
- **Default Credentials**: admin / admin (change via `GRAFANA_PASSWORD` env var)

## Configuration

### Environment Variables

See `docker/.env.example` for all available options:

```bash
# Loki URL for backend and frontend
LOKI_URL=http://loki:3100

# Grafana credentials
GRAFANA_ADMIN_USER=admin
GRAFANA_PASSWORD=admin

# Anonymous access (useful for demos)
GRAFANA_ANONYMOUS=false
GRAFANA_ANONYMOUS_ROLE=Viewer
```

### Automatic Data Source Provisioning

Loki is automatically configured as a data source in Grafana via:
- `docker/grafana/provisioning/datasources/loki.yml`

## Viewing Logs in Grafana

1. Open Grafana: http://localhost:3200
2. Login with admin credentials
3. Go to **Explore** (compass icon)
4. Select **Loki** data source
5. Use LogQL queries:

```logql
# All logs from frontend
{app="twinkforsale-frontend"}

# All logs from backend
{app="twinkforsale-backend"}

# Error logs only
{app=~"twinkforsale-.*"} |= "error"

# HTTP requests
{app="twinkforsale-frontend"} | json | method="GET"

# Logs for specific user
{app="twinkforsale-backend"} | json | userId="<user-id>"
```

## Log Labels

### Frontend Logs
- `app`: "twinkforsale-frontend"
- `level`: debug, info, warn, error
- `userId`: User ID (if available)
- `method`: HTTP method (GET, POST, etc.)
- `path`: Request path
- `status`: HTTP status code

### Backend Logs
- `app`: "twinkforsale-backend"
- `level`: Information, Warning, Error, Critical
- `SourceContext`: .NET class name
- `RequestPath`: API endpoint
- `StatusCode`: HTTP status code

## Example Queries

### Monitor Failed Requests
```logql
{app="twinkforsale-frontend"} | json | status >= 400
```

### Track User Activity
```logql
{app="twinkforsale-frontend"} | json | userId!="" | line_format "{{.timestamp}} [{{.userId}}] {{.message}}"
```

### API Performance
```logql
rate({app="twinkforsale-backend"} | json | RequestPath="/api/uploads"[5m])
```

### Error Rate
```logql
sum(rate({app=~"twinkforsale-.*"} |= "error" [5m])) by (app)
```

## Creating Dashboards

1. Go to **Dashboards** → **New Dashboard**
2. Add panels with LogQL queries
3. Save dashboard

**Recommended Panels:**
- Request rate over time
- Error rate by app
- P95/P99 response times
- Top errors
- User activity heatmap

## Troubleshooting

### Logs not appearing in Grafana?

1. Check Loki is running:
   ```bash
   curl http://localhost:3100/ready
   ```

2. Check apps are sending logs:
   ```bash
   curl 'http://localhost:3100/loki/api/v1/query?query={app="twinkforsale-frontend"}&limit=10'
   ```

3. Check environment variables:
   ```bash
   docker exec twinkforsale-frontend env | grep LOKI_URL
   docker exec twinkforsale-backend env | grep Loki__Url
   ```

### Can't connect to Grafana?

1. Check container is running:
   ```bash
   docker ps | grep grafana
   ```

2. Check logs:
   ```bash
   docker logs twinkforsale-grafana
   ```

3. Reset password:
   ```bash
   docker exec -it twinkforsale-grafana grafana-cli admin reset-admin-password newpassword
   ```

## Data Retention

By default, Loki stores logs for 30 days. To change this, create a custom Loki config:

```yaml
# docker/loki/loki-config.yml
limits_config:
  retention_period: 720h  # 30 days
```

Then mount it in docker-compose:
```yaml
volumes:
  - ./loki/loki-config.yml:/etc/loki/local-config.yaml
```

## Production Considerations

1. **Change default passwords** in `.env`
2. **Disable anonymous access** (`GRAFANA_ANONYMOUS=false`)
3. **Enable authentication** on both Loki and Grafana
4. **Set up alerting** in Grafana for critical errors
5. **Configure retention** based on your needs
6. **Use external storage** for Loki data (S3/GCS)
7. **Set up backups** for Grafana dashboards

## Volumes

- `loki_data`: Stores Loki logs (persistent)
- `grafana_data`: Stores Grafana dashboards and config (persistent)

To reset:
```bash
docker-compose down -v  # WARNING: Deletes all logs and dashboards
```

## Resources

- [Grafana Loki Documentation](https://grafana.com/docs/loki/latest/)
- [LogQL Query Language](https://grafana.com/docs/loki/latest/logql/)
- [Grafana Dashboards](https://grafana.com/docs/grafana/latest/dashboards/)
