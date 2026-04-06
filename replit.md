# Enhanced MCP Server

## Overview
An Enhanced Model Context Protocol (MCP) Server with a web-based dashboard (LCARS/Star Trek themed UI). Provides both an MCP protocol interface for AI model integration and an HTTP dashboard for manual interaction and monitoring.

## Architecture
- **Runtime**: Node.js v18.20.8, npm 10.8.2
- **Framework**: Express.js (HTTP dashboard)
- **MCP SDK**: `@modelcontextprotocol/sdk`
- **Entry point**: `server.js`

## Project Layout
- `server.js` — Main server (MCP protocol + Express HTTP dashboard)
- `dashboard.html` — Main LCARS-styled dashboard UI (4100+ lines)
- `mcp-console.html` — MCP console interface
- `pages/` — Additional static dashboard pages

## Running the Server
```
PORT=5000 node server.js
```
- HTTP dashboard: `http://0.0.0.0:5000`
- MCP protocol: via stdio (for AI client connections)

## Workflow
- **Start application**: `PORT=5000 node server.js` on port 5000

## API Endpoints
| Endpoint | Description |
|---|---|
| `GET /` | Dashboard HTML |
| `GET /health` | Health check |
| `GET /api/status` | Server status & uptime |
| `GET /api/metrics` | Live CPU, memory, process metrics |
| `GET /api/tools` | Tool manifest (26 tools) |
| `POST /api/tools/execute` | Execute any MCP tool |
| `GET /favicon.ico` | Suppressed (204) |

## MCP Tools (26 total)

### Git (4)
- `git_status` — Repository status
- `git_log` — Commit history (configurable count)
- `git_diff` — File diffs (staged/unstaged)
- `git_branch` — Branch listing

### File System (9)
- `list_files` — Directory listing with hidden file support
- `read_file` — Read file contents
- `write_file` — Write to file
- `create_directory` — Create directories (recursive)
- `file_stats` — File metadata (size, dates, permissions, type)
- `delete_file` — Delete file or directory (recursive option)
- `move_file` — Move or rename file
- `copy_file` — Copy file to new location
- `find_files` — Find files by name pattern with maxdepth

### System (8)
- `run_command` — Execute shell commands (sync/async)
- `system_info` — OS, CPU count, memory, uptime, hostname
- `cpu_load` — CPU load averages (1m/5m/15m), estimated usage %
- `disk_usage` — Filesystem disk space (df -h)
- `memory_detail` — System + process memory breakdown
- `node_info` — Node version, npm, PID, heap usage, process.versions
- `npm_list` — Installed npm packages (depth 0)
- `npm_audit` — npm security audit

### Network (1)
- `fetch_url` — HTTP client (GET/POST/PUT/DELETE/PATCH) with response headers

### Data (3)
- `parse_json` — Parse and validate JSON strings
- `format_json` — Format JSON with configurable indentation
- `search_files` — grep-based text search across files

### Environment (1)
- `env_list` — List environment variables with optional name filter

## Dashboard Panels (12 panels + 1 full-width analytics)
1. **Git Operations** — status, log, diff, branch, stash, remotes, blame
2. **File System** — browse, read, write, create dir, copy, move, delete, file stats, find, tree, disk usage
3. **System Operations** — run command, list processes, kill process, env vars, network info, ports
4. **Data Processing** — parse/format JSON, base64 encode/decode, UUID, hash, timestamp, text stats, search
5. **Runtime Environment** *(new)* — Node info, npm list/audit/update, CPU load, disk, memory, package.json, run script
6. **API & Endpoints** *(new)* — Live endpoint tiles, health check, custom HTTP request, live metrics
7. **Quick Actions** — File open, command history, keyboard shortcuts display
8. **Network** — ping, curl, DNS lookup, network interfaces, route table, download, public IP
9. **NPM/Node** — install, update, audit, outdated, run script, global packages, cache clear, eval
10. **HTTP Client** *(new)* — GET/POST/PUT/DELETE/PATCH, ping server, fetch metrics, cURL, download, DNS, ping, public IP
11. **Environment Variables** *(new)* — list all, search, filter by NODE/PATH/REPLIT, read .env, count
12. **Ship's Status** — Real-time system stats (platform, CPUs, memory, uptime, hostname)
13. **Real-Time Analytics** *(full-width)* — Live CPU/memory charts (blended real + animated), gauges, heatmap, sparklines, activity feed — now pulling real data from `/api/metrics` every 5s

## Output Console (right pane)
- Sticky split-pane layout: 65% left (scrollable panels), 35% right (sticky console)
- All tool output appears in right-pane console without losing scroll position
- Empty-state placeholder until first tool activated; restored on clear

## Dependencies
- `@modelcontextprotocol/sdk` — MCP protocol implementation
- `express` — HTTP server
- `cors` — CORS middleware
- `zod` — Schema validation

## Notes
- Docker/Docker Compose configs exist but are not used in Replit (Docker not available)
- Analytics data is blended: real CPU/memory from `/api/metrics` + animated noise for visual smoothness
- `formatBytes()` helper used across all size formatting
- Favicon returns 204 to suppress browser 404 noise
