import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { execSync, exec } from "child_process";
import { promises as fs } from "fs";
import path from "path";
import os from "os";
import express from "express";
import cors from "cors";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const server = new Server(
  { name: "enhanced-mcp-server", version: "1.0.0" },
  {
    capabilities: {
      tools: {},
      resources: {},
      prompts: {}
    }
  }
);

// HTTP Dashboard Server
const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Debug: Log paths
console.error(`[INFO] __dirname: ${__dirname}`);
console.error(`[INFO] pages path: ${path.join(__dirname, 'pages')}`);

// Serve pages folder - when requesting /pages/git.html, serve pages/git.html
app.use('/pages', express.static(path.join(__dirname, 'pages')));
// Serve root static files (dashboard.html, etc.)
app.use(express.static(__dirname));

// Utility functions
const logger = {
  info: (msg, data) => console.error(`[INFO] ${msg}`, data ? JSON.stringify(data, null, 2) : ''),
  error: (msg, error) => console.error(`[ERROR] ${msg}`, error?.message || error),
  debug: (msg, data) => process.env.DEBUG && console.error(`[DEBUG] ${msg}`, data ? JSON.stringify(data, null, 2) : '')
};

const safeExec = (command, options = {}) => {
  try {
    const result = execSync(command, {
      encoding: 'utf8',
      maxBuffer: 1024 * 1024 * 10, // 10MB buffer
      ...options
    });
    return { success: true, output: result.toString().trim() };
  } catch (error) {
    return { success: false, error: error.message, output: error.stdout || '' };
  }
};

const asyncExec = (command, options = {}) => {
  return new Promise((resolve) => {
    exec(command, {
      encoding: 'utf8',
      maxBuffer: 1024 * 1024 * 10,
      ...options
    }, (error, stdout, stderr) => {
      if (error) {
        resolve({ success: false, error: error.message, output: stdout || stderr || '' });
      } else {
        resolve({ success: true, output: stdout.trim() });
      }
    });
  });
};

const formatBytes = (bytes) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Tool execution function (shared between MCP and HTTP)
const executeTool = async (name, args = {}) => {
  try {
    logger.debug(`Tool called: ${name}`, args);

    switch (name) {
      // Git Operations
      case "git_status":
        const gitStatus = safeExec("git status --porcelain");
        return {
          success: true,
          output: gitStatus.success ?
            (gitStatus.output || "Working directory clean") :
            `Error: ${gitStatus.error}`
        };

      case "git_log":
        const { count = 10 } = args || {};
        const gitLog = safeExec(`git log --oneline -${count}`);
        return {
          success: true,
          output: gitLog.success ? gitLog.output : `Error: ${gitLog.error}`
        };

      case "git_diff":
        const { file = "", staged = false } = args || {};
        const diffCmd = `git diff ${staged ? '--staged' : ''} ${file}`.trim();
        const gitDiff = safeExec(diffCmd);
        return {
          success: true,
          output: gitDiff.success ?
            (gitDiff.output || "No changes") :
            `Error: ${gitDiff.error}`
        };

      case "git_branch":
        const gitBranch = safeExec("git branch -v");
        return {
          success: true,
          output: gitBranch.success ? gitBranch.output : `Error: ${gitBranch.error}`
        };

      // File System Operations
      case "list_files":
        const { directory = ".", pattern = "*", hidden = false } = args || {};
        try {
          const files = await fs.readdir(path.resolve(directory), { withFileTypes: true });
          const filteredFiles = files
            .filter(file => hidden || !file.name.startsWith('.'))
            .map(file => ({
              name: file.name,
              type: file.isDirectory() ? 'directory' : 'file',
              path: path.join(directory, file.name)
            }));

          return {
            success: true,
            output: JSON.stringify(filteredFiles, null, 2)
          };
        } catch (error) {
          return {
            success: false,
            error: `Error listing files: ${error.message}`
          };
        }

      case "read_file":
        const { filepath } = args || {};
        if (!filepath) {
          return { success: false, error: "filepath is required" };
        }
        try {
          const content = await fs.readFile(path.resolve(filepath), 'utf8');
          return {
            success: true,
            output: content
          };
        } catch (error) {
          return {
            success: false,
            error: `Error reading file: ${error.message}`
          };
        }

      case "write_file":
        const { filepath: writePath, content: fileContent } = args || {};
        if (!writePath || fileContent === undefined) {
          return { success: false, error: "filepath and content are required" };
        }
        try {
          await fs.writeFile(path.resolve(writePath), fileContent, 'utf8');
          return {
            success: true,
            output: `File written successfully: ${writePath}`
          };
        } catch (error) {
          return {
            success: false,
            error: `Error writing file: ${error.message}`
          };
        }

      case "create_directory":
        const { dirpath, recursive = true } = args || {};
        if (!dirpath) {
          return { success: false, error: "dirpath is required" };
        }
        try {
          await fs.mkdir(path.resolve(dirpath), { recursive });
          return {
            success: true,
            output: `Directory created: ${dirpath}`
          };
        } catch (error) {
          return {
            success: false,
            error: `Error creating directory: ${error.message}`
          };
        }

      // Process Operations
      case "run_command":
        const { command, async: isAsync = false } = args || {};
        if (!command) {
          return { success: false, error: "command is required" };
        }

        if (isAsync) {
          const result = await asyncExec(command);
          return {
            success: result.success,
            output: result.success ? result.output : result.error,
            error: result.success ? undefined : result.error
          };
        } else {
          const result = safeExec(command);
          return {
            success: result.success,
            output: result.success ? result.output : result.error,
            error: result.success ? undefined : result.error
          };
        }

      case "system_info":
        const sysInfo = {
          platform: os.platform(),
          arch: os.arch(),
          cpus: os.cpus().length,
          memory: {
            total: Math.round(os.totalmem() / 1024 / 1024 / 1024 * 100) / 100,
            free: Math.round(os.freemem() / 1024 / 1024 / 1024 * 100) / 100
          },
          uptime: Math.round(os.uptime() / 60),
          hostname: os.hostname(),
          user: os.userInfo().username
        };
        return {
          success: true,
          output: JSON.stringify(sysInfo, null, 2)
        };

      // Data Processing
      case "parse_json":
        const { jsonString } = args || {};
        if (!jsonString) {
          return { success: false, error: "jsonString is required" };
        }
        try {
          const parsed = JSON.parse(jsonString);
          return {
            success: true,
            output: JSON.stringify(parsed, null, 2)
          };
        } catch (error) {
          return {
            success: false,
            error: `JSON parsing error: ${error.message}`
          };
        }

      case "format_json":
        const { jsonString: formatString, indent = 2 } = args || {};
        if (!formatString) {
          return { success: false, error: "jsonString is required" };
        }
        try {
          const parsed = JSON.parse(formatString);
          return {
            success: true,
            output: JSON.stringify(parsed, null, indent)
          };
        } catch (error) {
          return {
            success: false,
            error: `JSON formatting error: ${error.message}`
          };
        }

      case "search_files":
        const { query, searchDir = ".", fileExtensions = [] } = args || {};
        if (!query) {
          return { success: false, error: "query is required" };
        }

        const grepCmd = `grep -r ${fileExtensions.length ? `--include="*.{${fileExtensions.join(',')}}"` : ''} "${query}" "${searchDir}"`;
        const result = safeExec(grepCmd);
        return {
          success: true,
          output: result.success ?
            (result.output || "No matches found") :
            `Search error: ${result.error}`
        };

      // HTTP Client
      case "fetch_url": {
        const { url: fUrl, method: fMethod = "GET", body: fBody = "", headers: fHeaders = {} } = args || {};
        if (!fUrl) return { success: false, error: "url is required" };
        try {
          const opts = { method: fMethod, headers: fHeaders, signal: AbortSignal.timeout(15000) };
          if (fBody && fMethod !== "GET" && fMethod !== "HEAD") opts.body = fBody;
          const resp = await fetch(fUrl, opts);
          const text = await resp.text();
          const headersObj = {};
          resp.headers.forEach((v, k) => { headersObj[k] = v; });
          return {
            success: true,
            output: `${fMethod} ${fUrl}\nHTTP ${resp.status} ${resp.statusText}\n${'─'.repeat(50)}\n` +
              `Headers: ${JSON.stringify(headersObj, null, 2)}\n${'─'.repeat(50)}\n` +
              `Body:\n${text.substring(0, 4000)}${text.length > 4000 ? '\n[truncated]' : ''}`
          };
        } catch (e) {
          return { success: false, error: `Request failed: ${e.message}` };
        }
      }

      // Environment variables
      case "env_list": {
        const { filter: envFilter = "" } = args || {};
        const entries = Object.entries(process.env)
          .sort(([a], [b]) => a.localeCompare(b))
          .filter(([k]) => !envFilter || k.toLowerCase().includes(envFilter.toLowerCase()))
          .map(([k, v]) => `${k}=${v.length > 100 ? v.substring(0, 100) + '...' : v}`);
        return { success: true, output: `${entries.length} environment variables${envFilter ? ` matching "${envFilter}"` : ''}:\n\n${entries.join('\n')}` };
      }

      // File operations (proper Node.js implementations)
      case "file_stats": {
        const { filepath: sfp } = args || {};
        if (!sfp) return { success: false, error: "filepath is required" };
        try {
          const stat = await fs.stat(path.resolve(sfp));
          return {
            success: true,
            output: JSON.stringify({
              path: sfp,
              size: stat.size,
              sizeFormatted: formatBytes(stat.size),
              created: stat.birthtime.toISOString(),
              modified: stat.mtime.toISOString(),
              accessed: stat.atime.toISOString(),
              isFile: stat.isFile(),
              isDirectory: stat.isDirectory(),
              permissions: '0' + (stat.mode & 0o777).toString(8)
            }, null, 2)
          };
        } catch (e) {
          return { success: false, error: e.message };
        }
      }

      case "delete_file": {
        const { filepath: dfp, recursive: dfr = false } = args || {};
        if (!dfp) return { success: false, error: "filepath is required" };
        try {
          await fs.rm(path.resolve(dfp), { recursive: dfr });
          return { success: true, output: `Deleted: ${dfp}` };
        } catch (e) {
          return { success: false, error: e.message };
        }
      }

      case "move_file": {
        const { source: mfsrc, destination: mfdst } = args || {};
        if (!mfsrc || !mfdst) return { success: false, error: "source and destination required" };
        try {
          await fs.rename(path.resolve(mfsrc), path.resolve(mfdst));
          return { success: true, output: `Moved: ${mfsrc} → ${mfdst}` };
        } catch (e) {
          return { success: false, error: e.message };
        }
      }

      case "copy_file": {
        const { source: cfsrc, destination: cfdst } = args || {};
        if (!cfsrc || !cfdst) return { success: false, error: "source and destination required" };
        try {
          await fs.copyFile(path.resolve(cfsrc), path.resolve(cfdst));
          return { success: true, output: `Copied: ${cfsrc} → ${cfdst}` };
        } catch (e) {
          return { success: false, error: e.message };
        }
      }

      case "find_files": {
        const { pattern: ffpat, directory: ffdir = ".", maxdepth: ffmax = 5 } = args || {};
        if (!ffpat) return { success: false, error: "pattern is required" };
        const ff = safeExec(`find "${ffdir}" -maxdepth ${ffmax} -name "${ffpat}" 2>/dev/null | head -100`);
        return { success: true, output: ff.output || "No files found matching pattern" };
      }

      // System info tools
      case "node_info": {
        const nvout = safeExec("npm -v 2>/dev/null");
        return {
          success: true,
          output: JSON.stringify({
            nodeVersion: process.version,
            npmVersion: nvout.success ? nvout.output.trim() : "unknown",
            platform: process.platform,
            arch: process.arch,
            pid: process.pid,
            uptime: Math.round(process.uptime()) + "s",
            memoryUsage: {
              rss: formatBytes(process.memoryUsage().rss),
              heapUsed: formatBytes(process.memoryUsage().heapUsed),
              heapTotal: formatBytes(process.memoryUsage().heapTotal),
              external: formatBytes(process.memoryUsage().external)
            },
            nodeVersions: process.versions
          }, null, 2)
        };
      }

      case "disk_usage": {
        const df = safeExec("df -h 2>/dev/null");
        return { success: true, output: df.output || df.error || "Disk info unavailable" };
      }

      case "cpu_load": {
        const loadavg = os.loadavg();
        const cpuCount = os.cpus().length;
        const cpuModel = os.cpus()[0]?.model?.trim() || "Unknown";
        return {
          success: true,
          output: `CPU Model: ${cpuModel}\nCores: ${cpuCount}\nLoad Average: ${loadavg[0].toFixed(2)} (1m)  ${loadavg[1].toFixed(2)} (5m)  ${loadavg[2].toFixed(2)} (15m)\nEstimated Usage: ${Math.min(100, (loadavg[0] / cpuCount * 100)).toFixed(1)}%`
        };
      }

      case "npm_list": {
        const nl = safeExec("npm list --depth=0 2>/dev/null");
        return { success: true, output: nl.output || nl.error || "npm list unavailable" };
      }

      case "npm_audit": {
        const na = safeExec("npm audit 2>/dev/null");
        return { success: true, output: na.output || na.error || "npm audit unavailable" };
      }

      case "memory_detail": {
        const memTotal = os.totalmem();
        const memFree = os.freemem();
        const memUsed = memTotal - memFree;
        const procMem = process.memoryUsage();
        return {
          success: true,
          output: JSON.stringify({
            system: {
              total: formatBytes(memTotal),
              used: formatBytes(memUsed),
              free: formatBytes(memFree),
              usagePercent: (memUsed / memTotal * 100).toFixed(1) + '%'
            },
            process: {
              rss: formatBytes(procMem.rss),
              heapTotal: formatBytes(procMem.heapTotal),
              heapUsed: formatBytes(procMem.heapUsed),
              external: formatBytes(procMem.external)
            }
          }, null, 2)
        };
      }

      default:
        return { success: false, error: `Unknown tool: ${name}` };
    }
  } catch (error) {
    logger.error(`Tool execution error: ${name}`, error);
    return {
      success: false,
      error: error.message
    };
  }
};

// HTTP Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'dashboard.html'));
});

// Direct test route for pages
app.get('/pages-test', (req, res) => {
  const pagesDir = path.join(__dirname, 'pages');
  res.json({
    pagesDir,
    exists: require('fs').existsSync(pagesDir),
    files: require('fs').existsSync(pagesDir) ? require('fs').readdirSync(pagesDir) : []
  });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    server: 'enhanced-mcp-server',
    version: '1.0.0',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

app.get('/console', (req, res) => {
  res.sendFile(path.resolve('mcp-console.html'));
});

app.get('/api/status', (req, res) => {
  res.json({
    status: 'online',
    server: 'enhanced-mcp-server',
    version: '2.0.0',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

app.get('/api/metrics', (req, res) => {
  const cpus = os.cpus();
  const loadavg = os.loadavg();
  const memTotal = os.totalmem();
  const memFree = os.freemem();
  const memUsed = memTotal - memFree;
  const procMem = process.memoryUsage();
  res.json({
    cpu: {
      count: cpus.length,
      model: cpus[0]?.model?.trim() || 'Unknown',
      loadavg: { '1m': loadavg[0], '5m': loadavg[1], '15m': loadavg[2] },
      usagePercent: Math.min(100, parseFloat((loadavg[0] / cpus.length * 100).toFixed(1)))
    },
    memory: {
      total: memTotal,
      free: memFree,
      used: memUsed,
      totalFormatted: formatBytes(memTotal),
      usedFormatted: formatBytes(memUsed),
      freeFormatted: formatBytes(memFree),
      usagePercent: parseFloat((memUsed / memTotal * 100).toFixed(1))
    },
    process: {
      pid: process.pid,
      uptime: Math.round(process.uptime()),
      version: process.version,
      memory: {
        rss: formatBytes(procMem.rss),
        heapUsed: formatBytes(procMem.heapUsed),
        heapTotal: formatBytes(procMem.heapTotal)
      }
    },
    system: {
      uptime: Math.round(os.uptime()),
      hostname: os.hostname(),
      platform: os.platform(),
      arch: os.arch()
    },
    timestamp: Date.now()
  });
});

app.post('/api/tools/execute', async (req, res) => {
  try {
    const { tool, args } = req.body;

    if (!tool) {
      return res.status(400).json({ success: false, error: 'Tool name is required' });
    }

    const result = await executeTool(tool, args);
    res.json(result);
  } catch (error) {
    logger.error('HTTP API error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/tools', async (req, res) => {
  res.json({
    tools: [
      // Git
      { name: "git_status", description: "Get git repository status", category: "git" },
      { name: "git_log", description: "Get git commit history", category: "git" },
      { name: "git_diff", description: "Show git differences", category: "git" },
      { name: "git_branch", description: "List git branches", category: "git" },
      // File System
      { name: "list_files", description: "List files and directories", category: "filesystem" },
      { name: "read_file", description: "Read file contents", category: "filesystem" },
      { name: "write_file", description: "Write content to file", category: "filesystem" },
      { name: "create_directory", description: "Create a directory", category: "filesystem" },
      { name: "file_stats", description: "Get file metadata and stats", category: "filesystem" },
      { name: "delete_file", description: "Delete a file or directory", category: "filesystem" },
      { name: "move_file", description: "Move or rename a file", category: "filesystem" },
      { name: "copy_file", description: "Copy a file to new location", category: "filesystem" },
      { name: "find_files", description: "Find files by name pattern", category: "filesystem" },
      // System
      { name: "run_command", description: "Execute system command", category: "system" },
      { name: "system_info", description: "Get system information", category: "system" },
      { name: "cpu_load", description: "Get CPU load average", category: "system" },
      { name: "disk_usage", description: "Get disk space usage", category: "system" },
      { name: "memory_detail", description: "Detailed memory breakdown", category: "system" },
      { name: "node_info", description: "Node.js runtime information", category: "system" },
      { name: "npm_list", description: "List installed npm packages", category: "system" },
      { name: "npm_audit", description: "Run npm security audit", category: "system" },
      // Network
      { name: "fetch_url", description: "Make HTTP requests to any URL", category: "network" },
      // Data
      { name: "parse_json", description: "Parse and validate JSON string", category: "data" },
      { name: "format_json", description: "Format JSON with proper indentation", category: "data" },
      { name: "search_files", description: "Search for text within files", category: "data" },
      // Environment
      { name: "env_list", description: "List environment variables", category: "environment" }
    ]
  });
});

// Suppress browser favicon 404
app.get('/favicon.ico', (req, res) => res.status(204).end());

// Start HTTP server

app.listen(PORT, '0.0.0.0', () => {
  logger.info(`Dashboard server running on http://0.0.0.0:${PORT}`);
});

// MCP Tools Handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    const result = await executeTool(name, args);

    if (result.success) {
      return {
        content: [{
          type: "text",
          text: result.output
        }]
      };
    } else {
      return {
        content: [{
          type: "text",
          text: result.error || 'Unknown error'
        }],
        isError: true
      };
    }
  } catch (error) {
    logger.error(`MCP tool execution error: ${name}`, error);
    return {
      content: [{
        type: "text",
        text: `Error: ${error.message}`
      }],
      isError: true
    };
  }
});

// Tool definitions
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      // Git Tools
      {
        name: "git_status",
        description: "Get git repository status",
        inputSchema: {
          type: "object",
          properties: {},
          required: []
        }
      },
      {
        name: "git_log",
        description: "Get git commit history",
        inputSchema: {
          type: "object",
          properties: {
            count: { type: "number", description: "Number of commits to show", default: 10 }
          },
          required: []
        }
      },
      {
        name: "git_diff",
        description: "Show git differences",
        inputSchema: {
          type: "object",
          properties: {
            file: { type: "string", description: "Specific file to diff" },
            staged: { type: "boolean", description: "Show staged changes", default: false }
          },
          required: []
        }
      },
      {
        name: "git_branch",
        description: "List git branches",
        inputSchema: {
          type: "object",
          properties: {},
          required: []
        }
      },

      // File System Tools
      {
        name: "list_files",
        description: "List files and directories",
        inputSchema: {
          type: "object",
          properties: {
            directory: { type: "string", description: "Directory to list", default: "." },
            pattern: { type: "string", description: "File pattern to match", default: "*" },
            hidden: { type: "boolean", description: "Include hidden files", default: false }
          },
          required: []
        }
      },
      {
        name: "read_file",
        description: "Read file contents",
        inputSchema: {
          type: "object",
          properties: {
            filepath: { type: "string", description: "Path to file to read" }
          },
          required: ["filepath"]
        }
      },
      {
        name: "write_file",
        description: "Write content to file",
        inputSchema: {
          type: "object",
          properties: {
            filepath: { type: "string", description: "Path to file to write" },
            content: { type: "string", description: "Content to write" }
          },
          required: ["filepath", "content"]
        }
      },
      {
        name: "create_directory",
        description: "Create a directory",
        inputSchema: {
          type: "object",
          properties: {
            dirpath: { type: "string", description: "Path of directory to create" },
            recursive: { type: "boolean", description: "Create parent directories", default: true }
          },
          required: ["dirpath"]
        }
      },

      // System Tools
      {
        name: "run_command",
        description: "Execute system command",
        inputSchema: {
          type: "object",
          properties: {
            command: { type: "string", description: "Command to execute" },
            async: { type: "boolean", description: "Run asynchronously", default: false }
          },
          required: ["command"]
        }
      },
      {
        name: "system_info",
        description: "Get system information",
        inputSchema: {
          type: "object",
          properties: {},
          required: []
        }
      },

      // Data Processing Tools  
      {
        name: "parse_json",
        description: "Parse and validate JSON string",
        inputSchema: {
          type: "object",
          properties: {
            jsonString: { type: "string", description: "JSON string to parse" }
          },
          required: ["jsonString"]
        }
      },
      {
        name: "format_json",
        description: "Format JSON with proper indentation",
        inputSchema: {
          type: "object",
          properties: {
            jsonString: { type: "string", description: "JSON string to format" },
            indent: { type: "number", description: "Number of spaces for indentation", default: 2 }
          },
          required: ["jsonString"]
        }
      },
      {
        name: "search_files",
        description: "Search for text within files",
        inputSchema: {
          type: "object",
          properties: {
            query: { type: "string", description: "Text to search for" },
            searchDir: { type: "string", description: "Directory to search in", default: "." },
            fileExtensions: {
              type: "array",
              items: { type: "string" },
              description: "File extensions to include in search"
            }
          },
          required: ["query"]
        }
      }
    ]
  };
});

// Ping handler is now built into the server by default

process.on('SIGINT', async () => {
  logger.info('Shutting down server...');
  process.exit(0);
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception:', error);
  process.exit(1);
});

logger.info('Enhanced MCP Server starting...');
server.connect(new StdioServerTransport());
logger.info('Enhanced MCP Server ready!');

