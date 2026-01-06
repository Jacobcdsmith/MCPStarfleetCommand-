# Enhanced MCP Server

A comprehensive Model Context Protocol (MCP) server with a custom-built dashboard UI that provides developer tools, system operations, and data processing capabilities.

## Features

🚀 **Dual Interface**
- MCP Protocol (stdio) for Claude Code integration
- HTTP Dashboard (Web UI) for interactive use

🛠️ **Developer Tools**
- Git operations (status, log, diff, branches)
- File system management
- Code search and analysis

💻 **System Operations**
- Command execution (sync/async)
- System monitoring and information
- Process management

📊 **Data Processing**
- JSON parsing and formatting
- File content manipulation
- Search capabilities

## Quick Start

### Installation
```bash
npm install
```

### Run Server
```bash
npm start                # Production mode
npm run dev             # Development with debug logging
```

### Access Dashboard
Open your browser to: **http://localhost:3001**

## Dashboard Features

- **Interactive Terminal** - Real-time command execution with output
- **System Monitoring** - Live system stats and metrics
- **Tool Categories** - Organized by functionality with one-click execution
- **Responsive Design** - Works on desktop and mobile devices

## Architecture

- **MCP Server**: Protocol-compliant server for integration with Claude Code
- **HTTP Server**: Express.js dashboard with RESTful API
- **Shared Engine**: Common tool execution for both interfaces
- **Error Handling**: Comprehensive logging and error management

## Available Tools

### Developer Tools
- `git_status` - Repository status
- `git_log` - Commit history  
- `git_diff` - File differences
- `git_branch` - Branch listing
- `search_files` - Code search

### System Operations
- `list_files` - Directory browsing
- `read_file` / `write_file` - File I/O
- `create_directory` - Directory creation
- `run_command` - System commands
- `system_info` - System metrics

### Data Processing
- `parse_json` - JSON validation
- `format_json` - JSON formatting

## API Usage

### HTTP REST API
```bash
# Get server status
curl http://localhost:3001/api/status

# List available tools
curl http://localhost:3001/api/tools

# Execute a tool
curl -X POST http://localhost:3001/api/tools/execute \
  -H "Content-Type: application/json" \
  -d '{"tool": "system_info", "args": {}}'
```

### MCP Protocol
The server automatically handles MCP protocol requests via stdio transport.

## Configuration

- **PORT**: HTTP server port (default: 3001)
- **DEBUG**: Enable debug logging (set DEBUG=1)

## Security

- Input validation on all parameters
- Path resolution to prevent directory traversal
- Command execution limits (10MB buffer)
- Error message sanitization

## Development

Built with:
- Node.js 18+ 
- Express.js for HTTP server
- MCP SDK for protocol compliance
- Vanilla HTML/CSS/JS for dashboard

---

**Transform your basic MCP server into something great!** 🚀# MCPStarfleetCommand-
