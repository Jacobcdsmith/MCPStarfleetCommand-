# Enhanced MCP Server

## Overview
An Enhanced Model Context Protocol (MCP) Server with a web-based dashboard (LCARS/Star Trek themed UI). It provides both an MCP protocol interface for AI model integration and an HTTP dashboard for manual interaction and monitoring.

## Architecture
- **Runtime**: Node.js 18+ (ES Modules)
- **Framework**: Express.js (HTTP dashboard)
- **MCP SDK**: `@modelcontextprotocol/sdk`
- **Entry point**: `server.js`

## Project Layout
- `server.js` — Main server (MCP protocol + Express HTTP dashboard)
- `dashboard.html` — Main LCARS-styled dashboard UI
- `mcp-console.html` — MCP console interface
- `pages/` — Additional static dashboard pages
- `analytics/` — Analytics tracking service (separate Node.js service)
- `grafana/` — Grafana provisioning configs
- `prometheus/` — Prometheus scrape configs
- `nginx/` — Nginx reverse proxy configs (for Docker deployments)

## Running the Server
The server starts with:
```
PORT=5000 node server.js
```
- HTTP dashboard on `0.0.0.0:5000`
- MCP protocol via stdio

## Workflow
- **Start application**: `PORT=5000 node server.js` on port 5000 (webview)

## MCP Tools Available
1. `git_status` — Git repository status
2. `git_log` — Commit history
3. `git_diff` — File diffs
4. `git_branch` — Branch info
5. `list_files` — Directory listing
6. `read_file` — Read file contents
7. `write_file` — Write to file
8. `create_directory` — Create directories
9. `run_command` — Execute shell commands
10. `system_info` — System information
11. `parse_json` — Parse JSON strings
12. `format_json` — Format JSON with indentation
13. `search_files` — Search text within files

## Dependencies
- `@modelcontextprotocol/sdk` — MCP protocol implementation
- `express` — HTTP server
- `cors` — CORS middleware
- `zod` — Schema validation

## Notes
- Docker/Docker Compose setup is available for full stack (with Redis, Grafana, Prometheus) but not used in Replit
- The analytics service (`analytics/`) requires Redis and is intended for Docker deployments
- PORT environment variable controls the HTTP dashboard port (default 3001, set to 5000 for Replit)
