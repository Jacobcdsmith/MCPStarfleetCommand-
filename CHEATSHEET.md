# 🚀 MCP Docker Hub - Cheat Sheet

## Quick Commands

### Start/Stop
```bash
make up              # Start all services
make down            # Stop all services
make restart         # Restart all
make dev             # Development mode
make prod            # Production mode
```

### Monitoring
```bash
make status          # Service status
make logs            # View all logs
make health          # Health check
docker stats         # Resource usage
```

### Access
```bash
make analytics       # Open analytics (3002)
make grafana         # Open Grafana (3000)
make prometheus      # Open Prometheus (9090)
```

### Scaling
```bash
make scale-up        # Scale to 3 instances
make scale-down      # Scale to 1 instance
docker-compose up -d --scale mcp-server=5
```

### Backup/Restore
```bash
make backup          # Backup all data
# Restore from backups/ directory
```

## Service URLs

| Service | URL | Credentials |
|---------|-----|-------------|
| MCP Server | http://localhost:3001 | - |
| Grafana | http://localhost:3000 | admin/mcpadmin123 |
| Analytics | http://localhost:3002 | - |
| Prometheus | http://localhost:9090 | - |
| cAdvisor | http://localhost:8080 | - |

## API Endpoints

### MCP Server (3001)
```bash
GET  /                    # Dashboard
GET  /api/status          # Server status
GET  /api/tools           # List tools
POST /api/tools/execute   # Execute tool
```

### Analytics (3002)
```bash
POST /api/track/execution # Track execution
POST /api/track/error     # Track error
GET  /api/stats/tools     # Tool statistics
GET  /api/stats/users     # User analytics
GET  /api/health          # Health status
GET  /metrics             # Prometheus metrics
```

## Docker Commands

```bash
# View logs
docker-compose logs -f mcp-server
docker-compose logs --tail=100

# Restart service
docker-compose restart mcp-server

# Rebuild
docker-compose build mcp-server
docker-compose up -d --no-deps mcp-server

# Execute commands
docker-compose exec mcp-server sh
docker-compose exec redis redis-cli

# View stats
docker stats --no-stream

# Clean up
docker-compose down -v
docker system prune -a
```

## Configuration Files

```
my-mcp-server/
├── docker-compose.yml       # Main config
├── docker-compose.dev.yml   # Dev overrides
├── docker-compose.prod.yml  # Prod optimizations
├── Dockerfile               # MCP server image
├── .env                     # Environment vars
├── redis.conf               # Redis config
├── nginx/nginx.conf         # Nginx config
├── prometheus/
│   ├── prometheus.yml       # Prometheus config
│   └── rules/
│       └── mcp_alerts.yml   # Alert rules
└── grafana/
    ├── provisioning/        # Auto-config
    └── dashboards/          # Dashboard JSON
```

## Environment Variables

```env
NODE_ENV=production
PORT=3001
DEBUG=0
REDIS_HOST=redis
REDIS_PORT=6379
PROMETHEUS_ENABLED=true
GF_SECURITY_ADMIN_PASSWORD=mcpadmin123
```

## Troubleshooting

### Service won't start
```bash
docker-compose logs SERVICE_NAME
docker-compose restart SERVICE_NAME
make clean && make build && make up
```

### Port already in use
```bash
# Find process
netstat -ano | findstr :3001  # Windows
lsof -i :3001                 # Mac/Linux

# Kill process or change port in docker-compose.yml
```

### Out of disk space
```bash
docker system df              # Check usage
docker system prune -a        # Clean up
docker volume prune           # Remove volumes
```

### High memory usage
```bash
docker stats                  # Check usage
# Edit docker-compose.prod.yml resource limits
```

### Redis connection failed
```bash
docker-compose exec redis redis-cli ping
docker-compose logs redis
docker-compose restart redis
```

## Metrics

### Key Prometheus Metrics
```
mcp_tool_executions_total
mcp_tool_execution_duration_seconds
mcp_active_users
mcp_error_rate
mcp_system_health
mcp_tool_popularity
```

### Query Examples
```promql
# Total executions
sum(mcp_tool_executions_total)

# Error rate
rate(mcp_tool_executions_total{status="error"}[5m])

# Top tools
topk(10, mcp_tool_popularity)

# 95th percentile latency
histogram_quantile(0.95, rate(mcp_tool_execution_duration_seconds_bucket[5m]))
```

## Health Checks

```bash
# Quick health check
curl http://localhost:3001/api/status
curl http://localhost:3002/api/health
curl http://localhost:9090/-/healthy
curl http://localhost:3000/api/health

# Full check
make health
```

## Logs

```bash
# All logs
docker-compose logs

# Specific service
docker-compose logs -f mcp-server

# Last N lines
docker-compose logs --tail=100 analytics-service

# Since time
docker-compose logs --since 2024-01-01T00:00:00

# Errors only
docker-compose logs | grep ERROR
```

## Performance Tips

### Increase Redis Memory
```yaml
# docker-compose.yml
command: redis-server --maxmemory 512mb
```

### Scale Horizontally
```bash
docker-compose up -d --scale mcp-server=5
```

### Optimize Prometheus
```yaml
# prometheus.yml
scrape_interval: 30s  # Less frequent
retention.time: 30d   # Less retention
```

### Enable Nginx Caching
```nginx
# nginx.conf
proxy_cache_path /tmp/cache levels=1:2 keys_zone=my_cache:10m;
proxy_cache my_cache;
```

## Security Checklist

- [ ] Change Grafana password
- [ ] Enable SSL/TLS in Nginx
- [ ] Set Redis password
- [ ] Configure firewall
- [ ] Update Docker images
- [ ] Review exposed ports
- [ ] Enable rate limiting
- [ ] Set up backups

## Quick Debugging

```bash
# Check all containers
docker ps -a

# Check networks
docker network ls
docker network inspect mcp_mcp-network

# Check volumes
docker volume ls
docker volume inspect mcp_redis-data

# Container shell access
docker-compose exec mcp-server sh
docker-compose exec redis sh

# Check container logs
docker logs CONTAINER_ID --tail=50 -f

# Inspect container
docker inspect CONTAINER_ID
```

## Common Issues & Fixes

| Issue | Fix |
|-------|-----|
| Port conflict | Change ports in docker-compose.yml |
| Out of memory | Increase Docker memory limit |
| Slow performance | Add more replicas, optimize Redis |
| Analytics not tracking | Check Redis connection, restart analytics |
| Grafana no data | Verify Prometheus datasource |
| Can't connect to service | Check `docker network inspect` |

## Backup & Restore

### Backup
```bash
make backup
# Creates: backups/prometheus-*.tar.gz
#          backups/grafana-*.tar.gz
```

### Restore
```bash
make down

docker run --rm \
  -v mcp_prometheus-data:/data \
  -v $(PWD)/backups:/backup alpine \
  tar xzf /backup/prometheus-*.tar.gz -C /data

make up
```

## Useful One-Liners

```bash
# Find container IP
docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' CONTAINER

# Watch logs in real-time
watch -n 1 'docker-compose logs --tail=20'

# Export Prometheus data
curl http://localhost:9090/api/v1/query?query=up > metrics.json

# Test Nginx config
docker-compose exec nginx nginx -t

# Redis CLI
docker-compose exec redis redis-cli
```

---

**Print this and keep it handy! 📋**
