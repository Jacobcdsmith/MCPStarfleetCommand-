// Analytics Integration Module for MCP Server
// Add this to your main server.js after the logger definition

const ANALYTICS_URL = process.env.ANALYTICS_URL || 'http://analytics-service:3002';
const ANALYTICS_ENABLED = process.env.PROMETHEUS_ENABLED === 'true';

// Analytics tracking wrapper
async function trackToolExecution(toolName, fn, userId = 'anonymous') {
  const startTime = Date.now();
  let status = 'success';
  let result;

  try {
    result = await fn();
    return result;
  } catch (error) {
    status = 'error';

    // Track error if analytics is enabled
    if (ANALYTICS_ENABLED) {
      try {
        await fetch(`${ANALYTICS_URL}/api/track/error`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            toolName,
            errorMessage: error.message,
            userId
          })
        }).catch(() => {}); // Silently fail if analytics unavailable
      } catch (e) {
        // Ignore analytics errors
      }
    }

    throw error;
  } finally {
    const duration = Date.now() - startTime;

    // Track execution if analytics is enabled
    if (ANALYTICS_ENABLED) {
      try {
        await fetch(`${ANALYTICS_URL}/api/track/execution`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            toolName,
            status,
            duration,
            userId
          })
        }).catch(() => {}); // Silently fail if analytics unavailable
      } catch (e) {
        // Ignore analytics errors
      }
    }
  }
}

// Enhanced executeTool with analytics - Replace the existing executeTool function with this
const executeToolWithAnalytics = async (name, args = {}, userId = 'anonymous') => {
  return trackToolExecution(name, async () => {
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
  }, userId);
};

// Export for use in main server
export { trackToolExecution, executeToolWithAnalytics };
