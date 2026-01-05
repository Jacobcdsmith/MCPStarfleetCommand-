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
    version: '1.0.0',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
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
      { name: "git_status", description: "Get git repository status" },
      { name: "git_log", description: "Get git commit history" },
      { name: "git_diff", description: "Show git differences" },
      { name: "git_branch", description: "List git branches" },
      { name: "list_files", description: "List files and directories" },
      { name: "read_file", description: "Read file contents" },
      { name: "write_file", description: "Write content to file" },
      { name: "create_directory", description: "Create a directory" },
      { name: "run_command", description: "Execute system command" },
      { name: "system_info", description: "Get system information" },
      { name: "parse_json", description: "Parse and validate JSON string" },
      { name: "format_json", description: "Format JSON with proper indentation" },
      { name: "search_files", description: "Search for text within files" }
    ]
  });
});

// Start HTTP server
app.listen(PORT, () => {
  logger.info(`Dashboard server running on http://localhost:${PORT}`);
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

