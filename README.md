<div align="center">

```
 ██████╗████████╗ █████╗ ██████╗ ███████╗██╗     ███████╗███████╗████████╗
██╔════╝╚══██╔══╝██╔══██╗██╔══██╗██╔════╝██║     ██╔════╝██╔════╝╚══██╔══╝
╚█████╗    ██║   ███████║██████╔╝█████╗  ██║     █████╗  █████╗     ██║   
 ╚═══██╗   ██║   ██╔══██║██╔══██╗██╔══╝  ██║     ██╔══╝  ██╔══╝     ██║   
██████╔╝   ██║   ██║  ██║██║  ██║██║     ███████╗███████╗███████╗   ██║   
╚═════╝    ╚═╝   ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝     ╚══════╝╚══════╝╚══════╝   ╚═╝   
```

# ⚡ MCPStarfleetCommand ⚡

### *Where the Final Frontier Meets the Model Context Protocol*

[![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![MCP SDK](https://img.shields.io/badge/MCP_SDK-1.17%2B-5555ff?style=for-the-badge)](https://modelcontextprotocol.io)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://docker.com)
[![Express](https://img.shields.io/badge/Express-5.x-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com)
[![License: ISC](https://img.shields.io/badge/License-ISC-ff9900?style=for-the-badge)](https://opensource.org/licenses/ISC)

</div>

---

## 🖖 Mission Briefing

**MCPStarfleetCommand** is a production-ready **Model Context Protocol (MCP) server** wrapped inside a fully-immersive **LCARS-style Starfleet Command dashboard**. It equips Claude AI with **41 powerful tools** spanning git operations, file management, system diagnostics, security auditing, network forensics, and more — all accessible through a stunning Star Trek-inspired browser interface or directly via the MCP protocol.

> *"The needs of the many outweigh the needs of the few — and so does a well-instrumented MCP server."*

---

## 🌌 What's On Screen

<div align="center">

| Interface | URL | Purpose |
|:---:|:---:|:---:|
| 🖥️ **LCARS Dashboard** | `http://localhost:3001` | Primary Starfleet command console |
| 📊 **Grafana** | `http://localhost:3000` | Mission analytics & visualizations |
| 📡 **Analytics Service** | `http://localhost:3002` | Real-time telemetry engine |
| 🔭 **Prometheus** | `http://localhost:9090` | Metrics time-series database |
| 🐳 **cAdvisor** | `http://localhost:8080` | Container performance monitoring |

</div>

---

## 🚀 Warp Speed Launch

### Standalone Mode (No Docker)

```bash
# Install dependencies
npm install

# Engage!
npm start          # Production — steady as she goes
npm run dev        # Debug mode — full sensor sweep
```

Open your browser: **http://localhost:3001**

---

### Full Fleet Deployment (Docker)

```bash
# Deploy the entire fleet in one command
docker-compose up -d

# Wait ~30 seconds, then access:
# http://localhost:3001  →  LCARS Dashboard
# http://localhost:3000  →  Grafana  (admin / mcpadmin123)
# http://localhost:3002  →  Analytics
```

> **Makefile shortcuts are available** — run `make up`, `make down`, `make logs`, `make health`, and more.

---

## 🖥️ LCARS Command Dashboard

The browser interface is built with an authentic **LCARS aesthetic** — the Library Computer Access/Retrieval System made famous by Starfleet. It uses the `Orbitron` and `Rajdhani` fonts, a deep-space starfield background, animated warp-core visuals, and the classic LCARS color palette.

### Dashboard Sections

| Panel | Tools |
|-------|-------|
| 🔀 **Git Operations** | Status, log, diff, branch management, secrets scan |
| 📁 **File System** | List, read, write, copy, move, delete, stats, checksum |
| 🖥️ **System** | System info, CPU load, disk usage, memory detail, process forensics |
| 🌐 **Network** | Open ports, network connections, HTTP header check, SSL check |
| 🔴 **Red Team / Security** | Security audit, CVE check, sensitive file scan, hex dump, file strings |
| 📊 **Analytics** | Live metrics, tool popularity, execution histograms |
| 🐳 **Docker Services** | Docker status and service management |

---

## 🛠️ The Full Arsenal — 41 Tools

### 🔀 Git Operations
| Tool | Description |
|------|-------------|
| `git_status` | Repository working-tree status |
| `git_log` | Commit history with author & messages |
| `git_diff` | File differences (staged or unstaged) |
| `git_branch` | List local and remote branches |
| `git_secrets_scan` | Scan commit history for leaked secrets |

### 📁 File System
| Tool | Description |
|------|-------------|
| `list_files` | Directory listing with metadata |
| `read_file` | Read file contents |
| `write_file` | Write or overwrite a file |
| `create_directory` | Create directory trees |
| `delete_file` | Remove a file |
| `move_file` | Move or rename a file |
| `copy_file` | Duplicate a file |
| `file_stats` | Size, permissions, timestamps |
| `file_type` | Detect file MIME type |
| `file_checksum` | MD5/SHA256 integrity hash |
| `find_files` | Recursive file search by pattern |
| `search_files` | Full-text code search |
| `recent_files` | Most recently modified files |

### 🖥️ System & Process
| Tool | Description |
|------|-------------|
| `system_info` | OS, CPU, memory, uptime |
| `cpu_load` | Real-time CPU utilization |
| `disk_usage` | Disk capacity and usage |
| `memory_detail` | Detailed memory breakdown |
| `run_command` | Execute shell commands |
| `node_info` | Node.js runtime details |
| `env_list` | Environment variable inspection |
| `process_forensics` | Running processes and resource usage |
| `log_tail` | Tail log files in real-time |

### 🌐 Network & Web
| Tool | Description |
|------|-------------|
| `fetch_url` | HTTP GET with response metadata |
| `http_headers_check` | Inspect HTTP response headers |
| `ssl_check` | SSL/TLS certificate details |
| `open_ports` | Scan for listening ports |
| `network_connections` | Active TCP/UDP connections |

### 🔴 Security & Forensics
| Tool | Description |
|------|-------------|
| `security_audit` | Comprehensive security posture report |
| `scan_sensitive_files` | Locate potentially sensitive files |
| `cve_check` | Check npm dependencies for known CVEs |
| `npm_list` | Installed packages inventory |
| `npm_audit` | npm security audit report |
| `file_strings` | Extract printable strings from binary files |
| `file_hexdump` | Hex dump of file contents |

### 📊 Data
| Tool | Description |
|------|-------------|
| `parse_json` | Validate and parse JSON |
| `format_json` | Pretty-print JSON with indentation |

---

## 📡 Dual-Interface Architecture

```
┌─────────────────────────────────────────────────────┐
│                   Claude AI / Client                │
└──────────────┬──────────────────────┬───────────────┘
               │  MCP Protocol (stdio)│  HTTP / Browser
               ▼                      ▼
┌──────────────────────┐  ┌──────────────────────────┐
│  MCP Server Engine   │  │  LCARS Dashboard (3001)  │
│  (41 Tools)          │  │  Express REST API         │
└──────────┬───────────┘  └────────────┬─────────────┘
           └──────────────┬────────────┘
                          ▼
             ┌────────────────────────┐
             │   Shared Tool Engine   │
             │  (executeTool core)    │
             └────────────────────────┘
```

Both the MCP stdio transport **and** the HTTP dashboard share the same underlying tool execution engine — so every capability is available from both interfaces simultaneously.

---

## 🏗️ Production Fleet — 8 Services

When deployed with Docker Compose, MCPStarfleetCommand becomes a full enterprise-grade stack:

```
                    ┌──────────────────────┐
                    │   Nginx (Port 80/443) │
                    │   Reverse Proxy       │
                    │   Rate Limiting       │
                    │   Load Balancing      │
                    └───────────┬──────────┘
            ┌──────────────────┼──────────────────┐
            ▼                  ▼                  ▼
   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
   │  MCP Server  │  │   Grafana    │  │  Analytics   │
   │  Port: 3001  │  │  Port: 3000  │  │  Port: 3002  │
   └──────┬───────┘  └──────┬───────┘  └──────┬───────┘
          └──────────────────┼──────────────────┘
                             ▼
   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
   │    Redis     │  │  Prometheus  │  │ Node Exporter│
   │  Port: 6379  │  │  Port: 9090  │  │  Port: 9100  │
   └──────────────┘  └──────────────┘  └──────────────┘
                          + cAdvisor (Port 8080)
```

| Service | Role |
|---------|------|
| **MCP Server** | Core application — tools, dashboard, REST API |
| **Analytics** | Real-time event tracking and health scoring (0–100) |
| **Grafana** | Pre-configured dashboards: execution rates, latency, tool rankings |
| **Prometheus** | Scrapes 6 custom `mcp_*` metrics every 15 seconds |
| **Redis** | Cache, session store, analytics event bus (AOF + RDB persistence) |
| **Nginx** | Load balancer, rate limiter (100 req/s), gzip, SSL termination |
| **Node Exporter** | Host-level system metrics for Prometheus |
| **cAdvisor** | Per-container CPU/memory/network metrics |

---

## 📊 Observability & Metrics

### Custom Prometheus Metrics

```promql
mcp_tool_executions_total              # Lifetime tool execution count
mcp_tool_execution_duration_seconds    # Latency histogram (p50/p95/p99)
mcp_active_users                       # Concurrent active sessions
mcp_error_rate                         # Percentage of failed executions
mcp_system_health                      # Composite health score (0–100)
mcp_tool_popularity                    # Per-tool usage rankings
```

### Example Queries

```promql
# Top 10 most-used tools
topk(10, mcp_tool_popularity)

# 95th-percentile latency
histogram_quantile(0.95, rate(mcp_tool_execution_duration_seconds_bucket[5m]))

# Rolling error rate
rate(mcp_tool_executions_total{status="error"}[5m]) * 100
```

---

## 🔌 REST API Reference

```bash
# Server health
GET  /api/status

# List all 41 tools
GET  /api/tools

# Execute any tool
POST /api/tools/execute
     Body: { "tool": "system_info", "args": {} }
```

#### Example

```bash
curl -X POST http://localhost:3001/api/tools/execute \
  -H "Content-Type: application/json" \
  -d '{"tool": "git_status", "args": {}}'
```

---

## ⚙️ Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3001` | HTTP dashboard port |
| `DEBUG` | `0` | Enable verbose debug logging (`DEBUG=1`) |
| `NODE_ENV` | `development` | Runtime environment |
| `REDIS_HOST` | `redis` | Redis hostname |
| `REDIS_PORT` | `6379` | Redis port |
| `PROMETHEUS_ENABLED` | `true` | Enable metrics endpoint |
| `GF_SECURITY_ADMIN_PASSWORD` | `mcpadmin123` | Grafana admin password |

Copy `.env.example` → `.env` and customize before deploying.

---

## 🔒 Security

- ✅ **Input validation** on every tool parameter
- ✅ **Path traversal prevention** via `path.resolve` guards
- ✅ **Command output limits** (10 MB buffer cap)
- ✅ **Error message sanitization** — no stack traces to clients
- ✅ **Non-root containers** — all Docker services run as UID 1001
- ✅ **Rate limiting** — Nginx enforces 100 req/s per source IP
- ✅ **Network isolation** — services communicate only within `mcp-network`

### Pre-Production Checklist

```bash
# 1. Change the Grafana password in .env
GF_SECURITY_ADMIN_PASSWORD=your-strong-password

# 2. Set a Redis password in redis.conf
requirepass your-redis-password

# 3. Enable TLS — uncomment HTTPS block in nginx/nginx.conf
#    and place certs in nginx/ssl/

# 4. Restrict firewall — expose only ports 80 and 443 publicly
```

---

## 🧰 Makefile Quick Reference

```bash
make up           # Start all services
make down         # Stop all services
make restart      # Restart everything
make dev          # Development mode (hot reload)
make prod         # Production mode (replicas + resource limits)
make logs         # Stream all logs
make health       # Full health check across all services
make status       # Docker service status table
make scale-up     # Scale MCP server to 3 replicas
make backup       # Backup Prometheus, Grafana, and Redis data
make grafana      # Open Grafana in browser
make analytics    # Open analytics dashboard
make prometheus   # Open Prometheus in browser
```

---

## 🗂️ Repository Structure

```
MCPStarfleetCommand/
├── server.js                       # Core MCP + HTTP server (41 tools)
├── server-analytics-integration.js # Analytics tracking wrapper
├── dashboard.html                  # LCARS main command console
├── mcp-console.html                # MCP protocol console view
├── pages/                          # Modular dashboard panels
│   ├── index.html                  # Overview / home
│   ├── git.html                    # Git operations panel
│   ├── files.html                  # File system panel
│   ├── system.html                 # System diagnostics panel
│   ├── network.html                # Network & web panel
│   ├── redteam.html                # Security & forensics panel
│   ├── analytics.html              # Analytics panel
│   ├── docker.html                 # Docker services panel
│   ├── data.html                   # Data processing panel
│   └── services.html               # Services overview
├── analytics/                      # Standalone analytics microservice
├── prometheus/                     # Metrics config + alert rules
├── grafana/                        # Pre-built dashboards + provisioning
├── nginx/                          # Reverse proxy configuration
├── Dockerfile                      # Multi-stage MCP server image
├── docker-compose.yml              # Full 8-service orchestration
├── docker-compose.dev.yml          # Development overrides
├── docker-compose.prod.yml         # Production optimizations
├── Makefile                        # Command shortcuts
├── redis.conf                      # Redis cache configuration
└── .env.example                    # Environment variable template
```

---

## 🛸 Performance Targets

| Metric | Target |
|--------|--------|
| Tool execution latency (p95) | < 1 second |
| Analytics tracking overhead | < 100 ms |
| Dashboard load time | < 2 seconds |
| MCP server throughput | 100–500 req/s per instance |
| Redis operations | 10,000+ ops/s |
| Prometheus ingestion | 1M+ samples/s |

### Resource Usage (Full Stack)

```
Service          CPU        Memory      Disk
───────────────────────────────────────────────
MCP Server       10–30%     128–256 MB  100 MB
Analytics         5–15%     64–128 MB   50 MB
Grafana           5–10%     128–256 MB  200 MB
Prometheus       10–20%     256–512 MB  1–10 GB
Redis             5–15%     128–256 MB  100 MB–1 GB
Nginx             2–5%      32–64 MB    10 MB
```

---

## 🔭 Built With

| Technology | Role |
|------------|------|
| **Node.js 18+** | Runtime |
| **@modelcontextprotocol/sdk** | MCP protocol compliance |
| **Express.js 5** | HTTP server and REST API |
| **Zod** | Schema validation |
| **Orbitron + Rajdhani** | LCARS typefaces |
| **Docker + Docker Compose** | Container orchestration |
| **Prometheus** | Metrics collection |
| **Grafana** | Visualization |
| **Redis 7** | Cache and event store |
| **Nginx** | Reverse proxy |

---

<div align="center">

```
┌─────────────────────────────────────────┐
│  ██╗     ██████╗ █████╗ ██████╗ ███████╗│
│  ██║    ██╔════╝██╔══██╗██╔══██╗██╔════╝│
│  ██║    ██║     ███████║██████╔╝███████╗│
│  ██║    ██║     ██╔══██║██╔══██╗╚════██║│
│  ███████╗╚██████╗██║  ██║██║  ██║███████║│
│  ╚══════╝ ╚═════╝╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝│
│                                         │
│      ════ STARFLEET COMMAND ════        │
│         COMPUTER — ENGAGE 🖖            │
└─────────────────────────────────────────┘
```

*"To boldly MCP where no server has gone before."*

**Star Trek aesthetic proudly inspired by the LCARS interface of the USS Enterprise.**

</div>
