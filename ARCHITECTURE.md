# 🏗️ MCP Docker Hub - Architecture Overview

## System Architecture

```
                          ┌─────────────────────────────────────┐
                          │     Internet / External Access       │
                          └──────────────┬──────────────────────┘
                                         │
                          ┌──────────────▼──────────────────────┐
                          │      NGINX Reverse Proxy            │
                          │   - Load Balancing                  │
                          │   - SSL Termination                 │
                          │   - Rate Limiting                   │
                          │   - Gzip Compression                │
                          └──┬────────┬──────┬──────────────────┘
                             │        │      │
              ┌──────────────┘        │      └──────────────┐
              │                       │                     │
    ┌─────────▼─────────┐  ┌─────────▼─────────┐  ┌────────▼────────┐
    │   MCP SERVER      │  │     GRAFANA       │  │   ANALYTICS     │
    │   Port: 3001      │  │   Port: 3000      │  │   Port: 3002    │
    │                   │  │                   │  │                 │
    │ ┌───────────────┐ │  │ ┌───────────────┐ │  │ ┌─────────────┐ │
    │ │ HTTP Server   │ │  │ │ Dashboards    │ │  │ │ Metrics API │ │
    │ │ MCP Protocol  │ │  │ │ Visualizations│ │  │ │ Tracking    │ │
    │ │ 13 Tools      │ │  │ │ Alerts        │ │  │ │ Real-time   │ │
    │ └───────────────┘ │  │ └───────────────┘ │  │ └─────────────┘ │
    └─────────┬─────────┘  └─────────┬─────────┘  └────────┬────────┘
              │                      │                     │
              │                      │                     │
    ┌─────────▼──────────────────────▼─────────────────────▼─────────┐
    │                         DATA LAYER                              │
    └─────────┬────────────────────┬─────────────────────┬───────────┘
              │                    │                     │
    ┌─────────▼─────────┐  ┌───────▼───────┐  ┌─────────▼─────────┐
    │      REDIS        │  │  PROMETHEUS   │  │   PERSISTENT      │
    │   Port: 6379      │  │  Port: 9090   │  │    VOLUMES        │
    │                   │  │               │  │                   │
    │ ┌───────────────┐ │  │ ┌───────────┐ │  │ ┌───────────────┐ │
    │ │ Cache         │ │  │ │ Metrics   │ │  │ │ redis-data    │ │
    │ │ Session Store │ │  │ │ Scraping  │ │  │ │ prometheus-   │ │
    │ │ Real-time     │ │  │ │ Alerting  │ │  │ │   data        │ │
    │ │ Analytics     │ │  │ │ Storage   │ │  │ │ grafana-data  │ │
    │ └───────────────┘ │  │ └───────────┘ │  │ │ mcp-data      │ │
    └───────────────────┘  └───────┬───────┘  │ └───────────────┘ │
                                   │          └───────────────────┘
                    ┌──────────────▼──────────────┐
                    │   MONITORING & EXPORTERS     │
                    └─────┬───────────┬────────────┘
                          │           │
              ┌───────────▼──┐    ┌──▼────────────┐
              │ NODE EXPORTER│    │   CADVISOR    │
              │  Port: 9100  │    │  Port: 8080   │
              │              │    │               │
              │ System       │    │ Container     │
              │ Metrics      │    │ Metrics       │
              └──────────────┘    └───────────────┘
```

## Component Breakdown

### 1. **Nginx Reverse Proxy**
- **Purpose**: Entry point for all traffic
- **Responsibilities**:
  - Route traffic to appropriate services
  - Load balance across MCP server instances
  - Rate limiting (100 req/s)
  - Gzip compression
  - SSL/TLS termination
  - Health checks
- **Technology**: Nginx Alpine
- **Port**: 80 (HTTP), 443 (HTTPS)

### 2. **MCP Server**
- **Purpose**: Core application server
- **Responsibilities**:
  - Execute MCP tools
  - Serve HTTP API
  - Provide stdio MCP protocol
  - Track analytics
- **Technology**: Node.js 18 Alpine
- **Port**: 3001
- **Scaling**: Horizontal (3 replicas in prod)

### 3. **Analytics Service**
- **Purpose**: Real-time metrics and tracking
- **Responsibilities**:
  - Track tool executions
  - Monitor errors
  - Calculate health scores
  - Provide Prometheus metrics
  - Store analytics in Redis
- **Technology**: Node.js 18 Alpine
- **Port**: 3002
- **Key Metrics**:
  - `mcp_tool_executions_total`
  - `mcp_tool_execution_duration_seconds`
  - `mcp_active_users`
  - `mcp_error_rate`
  - `mcp_system_health`
  - `mcp_tool_popularity`

### 4. **Grafana**
- **Purpose**: Visualization and dashboards
- **Responsibilities**:
  - Display metrics dashboards
  - Configure alerts
  - Provide drill-down analytics
  - User management
- **Technology**: Grafana Latest
- **Port**: 3000
- **Features**:
  - Pre-configured Prometheus datasource
  - MCP Overview dashboard
  - Redis datasource support

### 5. **Prometheus**
- **Purpose**: Metrics storage and querying
- **Responsibilities**:
  - Scrape metrics from all services
  - Store time-series data
  - Evaluate alert rules
  - Provide query API
- **Technology**: Prometheus Latest
- **Port**: 9090
- **Configuration**:
  - 15s scrape interval
  - 30-90 day retention
  - Alert rules for critical metrics

### 6. **Redis**
- **Purpose**: Cache and data store
- **Responsibilities**:
  - Cache tool execution data
  - Store analytics events
  - Session management
  - Real-time data
- **Technology**: Redis 7 Alpine
- **Port**: 6379
- **Configuration**:
  - 256-512MB memory limit
  - LRU eviction policy
  - AOF persistence
  - 30-day TTL on analytics

### 7. **Node Exporter**
- **Purpose**: System metrics collection
- **Responsibilities**:
  - Collect host system metrics
  - CPU, memory, disk, network stats
  - Expose to Prometheus
- **Technology**: Prometheus Node Exporter
- **Port**: 9100

### 8. **cAdvisor**
- **Purpose**: Container metrics
- **Responsibilities**:
  - Monitor container performance
  - CPU, memory, network per container
  - Resource usage tracking
- **Technology**: Google cAdvisor
- **Port**: 8080

## Data Flow

### Tool Execution Flow
```
User Request
    ↓
Nginx (Load Balance)
    ↓
MCP Server
    ↓
Tool Execution
    ↓
Analytics Tracking ──→ Redis (Store)
    ↓                     ↓
Return Result      Prometheus (Scrape)
    ↓                     ↓
User Response      Grafana (Visualize)
```

### Metrics Collection Flow
```
Application Metrics
    ↓
Prometheus Scrape (15s interval)
    ↓
Time-Series Storage (30-90 days)
    ↓
Grafana Query & Display
    ↓
User Dashboard
```

### Health Check Flow
```
Docker Health Check (30s)
    ↓
HTTP Health Endpoint
    ↓
Service Status Check
    ↓
Restart if Failed (3 retries)
```

## Network Architecture

### Network: `mcp-network`
- **Type**: Bridge network
- **Subnet**: 172.20.0.0/16
- **Purpose**: Internal service communication

### Service Discovery
All services use DNS names for communication:
- `mcp-server` → MCP Server instances
- `redis` → Redis cache
- `prometheus` → Prometheus server
- `grafana` → Grafana instance
- `analytics-service` → Analytics service

## Volume Architecture

### Persistent Volumes
```
mcp-data          → Application data
  └── /app/data

redis-data        → Redis persistence
  └── /data
      ├── dump.rdb      (snapshots)
      └── appendonly.aof (append-only file)

prometheus-data   → Metrics storage
  └── /prometheus
      └── [time-series blocks]

grafana-data      → Dashboards & config
  └── /var/lib/grafana
      ├── dashboards/
      └── grafana.db
```

## Scaling Strategy

### Horizontal Scaling
```bash
# Scale MCP servers
docker-compose up -d --scale mcp-server=5

# Nginx automatically distributes load
```

### Vertical Scaling
Edit `docker-compose.prod.yml`:
```yaml
resources:
  limits:
    cpus: '2'      # Increase CPU
    memory: 2G     # Increase memory
```

## Security Layers

1. **Network Isolation**
   - Services communicate only within `mcp-network`
   - Only Nginx exposed to public

2. **Resource Limits**
   - CPU and memory limits per service
   - Prevents resource exhaustion

3. **Health Checks**
   - Automatic restart on failure
   - 3 retries before failure

4. **Rate Limiting**
   - Nginx limits: 100 req/s
   - Connection limits: 10 concurrent

5. **Non-root Users**
   - All services run as non-root
   - UID 1001 for applications

## Performance Characteristics

### Latency Targets
- **Tool Execution**: < 1s (p95)
- **Analytics Tracking**: < 100ms
- **Metrics Scraping**: < 5s
- **Dashboard Loading**: < 2s

### Throughput
- **MCP Server**: 100-500 req/s per instance
- **Redis**: 10,000+ ops/s
- **Prometheus**: 1M+ samples/s
- **Analytics**: 1,000+ events/s

### Resource Usage (Typical)
```
Service          CPU      Memory    Disk
─────────────────────────────────────────
MCP Server      10-30%   128-256M  100M
Analytics       5-15%    64-128M   50M
Grafana         5-10%    128-256M  200M
Prometheus      10-20%   256-512M  1-10G
Redis           5-15%    128-256M  100M-1G
Nginx           2-5%     32-64M    10M
Node Exporter   1-2%     16-32M    5M
cAdvisor        2-5%     64-128M   10M
```

## Monitoring & Observability

### Metrics Collection
- **Application**: Custom Prometheus metrics
- **System**: Node Exporter metrics
- **Container**: cAdvisor metrics
- **Service**: Health check endpoints

### Logging
- **Format**: JSON structured logging
- **Rotation**: 10MB max, 3 files
- **Aggregation**: Docker log driver
- **Retention**: 7 days default

### Tracing
- Request tracking via Nginx logs
- Tool execution timing
- Error tracking with stack traces

## Disaster Recovery

### Backup Strategy
```bash
# Automated daily backups
make backup

# Creates:
- prometheus-YYYYMMDD-HHMMSS.tar.gz
- grafana-YYYYMMDD-HHMMSS.tar.gz
- redis-YYYYMMDD-HHMMSS.tar.gz
```

### Recovery
```bash
# Stop services
make down

# Restore volumes
docker run --rm -v mcp_prometheus-data:/data \
  -v $(PWD)/backups:/backup alpine \
  tar xzf /backup/prometheus-*.tar.gz -C /data

# Restart
make up
```

### High Availability
- Multiple MCP server instances
- Redis AOF + RDB persistence
- Prometheus local storage
- Grafana persistent database

## Deployment Patterns

### Development
```bash
make dev
# Features: Hot reload, debug logs, local mounts
```

### Staging
```bash
docker-compose up -d
# Features: Production-like, testing environment
```

### Production
```bash
docker-compose -f docker-compose.yml \
  -f docker-compose.prod.yml up -d
# Features: Replicas, resource limits, optimized
```

## Future Enhancements

### Planned Features
- [ ] Distributed tracing with Jaeger
- [ ] Log aggregation with ELK stack
- [ ] Message queue with RabbitMQ
- [ ] Database with PostgreSQL
- [ ] Service mesh with Istio
- [ ] Auto-scaling with Kubernetes
- [ ] Multi-region deployment
- [ ] CDN integration

---

**Architecture Version**: 1.0.0
**Last Updated**: 2024
**Maintainer**: MCP Team
