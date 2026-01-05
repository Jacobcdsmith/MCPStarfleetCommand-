import express from 'express';
import cors from 'cors';
import { createClient } from 'redis';
import { register, Counter, Histogram, Gauge } from 'prom-client';
import cron from 'node-cron';
import winston from 'winston';

const app = express();
const PORT = process.env.PORT || 3002;
const REDIS_HOST = process.env.REDIS_HOST || 'localhost';
const REDIS_PORT = process.env.REDIS_PORT || 6379;

// Logger setup
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'data/analytics.log' })
  ]
});

app.use(cors());
app.use(express.json());

// Redis client setup
const redis = createClient({
  socket: {
    host: REDIS_HOST,
    port: REDIS_PORT
  }
});

redis.on('error', (err) => logger.error('Redis Client Error', err));
redis.on('connect', () => logger.info('Connected to Redis'));

await redis.connect();

// Prometheus metrics
const toolExecutionCounter = new Counter({
  name: 'mcp_tool_executions_total',
  help: 'Total number of MCP tool executions',
  labelNames: ['tool_name', 'status']
});

const toolExecutionDuration = new Histogram({
  name: 'mcp_tool_execution_duration_seconds',
  help: 'Duration of MCP tool executions in seconds',
  labelNames: ['tool_name'],
  buckets: [0.1, 0.5, 1, 2, 5, 10]
});

const activeUsers = new Gauge({
  name: 'mcp_active_users',
  help: 'Number of active users in the last hour'
});

const errorRate = new Gauge({
  name: 'mcp_error_rate',
  help: 'Error rate percentage over the last hour'
});

const systemHealth = new Gauge({
  name: 'mcp_system_health',
  help: 'Overall system health score (0-100)'
});

const toolPopularity = new Gauge({
  name: 'mcp_tool_popularity',
  help: 'Tool popularity score based on usage',
  labelNames: ['tool_name']
});

// Analytics data structures
class AnalyticsEngine {
  constructor() {
    this.metrics = {
      toolUsage: {},
      errors: [],
      performance: {},
      users: new Set(),
      systemEvents: []
    };
  }

  async trackToolExecution(toolName, status, duration, userId = 'anonymous') {
    try {
      // Update Prometheus metrics
      toolExecutionCounter.inc({ tool_name: toolName, status });
      toolExecutionDuration.observe({ tool_name: toolName }, duration / 1000);

      // Store in Redis
      const timestamp = Date.now();
      const eventKey = `tool:${toolName}:${timestamp}`;

      await redis.hSet(eventKey, {
        tool: toolName,
        status,
        duration,
        userId,
        timestamp
      });

      // Set expiry for 30 days
      await redis.expire(eventKey, 30 * 24 * 60 * 60);

      // Increment tool counter
      await redis.zIncrBy('tool:popularity', 1, toolName);

      // Track user activity
      await redis.sAdd(`users:${Date.now()}`, userId);
      this.metrics.users.add(userId);

      // Update tool usage stats
      if (!this.metrics.toolUsage[toolName]) {
        this.metrics.toolUsage[toolName] = { count: 0, avgDuration: 0, errors: 0 };
      }

      this.metrics.toolUsage[toolName].count++;
      this.metrics.toolUsage[toolName].avgDuration =
        (this.metrics.toolUsage[toolName].avgDuration + duration) / 2;

      if (status === 'error') {
        this.metrics.toolUsage[toolName].errors++;
      }

      logger.info('Tool execution tracked', { toolName, status, duration, userId });
    } catch (error) {
      logger.error('Error tracking tool execution', error);
    }
  }

  async trackError(toolName, errorMessage, userId = 'anonymous') {
    try {
      const timestamp = Date.now();
      const errorEvent = {
        tool: toolName,
        message: errorMessage,
        userId,
        timestamp
      };

      await redis.lPush('errors:recent', JSON.stringify(errorEvent));
      await redis.lTrim('errors:recent', 0, 999); // Keep last 1000 errors

      this.metrics.errors.push(errorEvent);

      logger.error('Error tracked', errorEvent);
    } catch (error) {
      logger.error('Error tracking error event', error);
    }
  }

  async getToolStatistics() {
    try {
      const popularity = await redis.zRangeWithScores('tool:popularity', 0, -1, { REV: true });

      const stats = {
        totalExecutions: 0,
        toolBreakdown: {},
        topTools: [],
        errorRate: 0
      };

      for (const item of popularity) {
        const toolName = item.value;
        const count = item.score;

        stats.totalExecutions += count;
        stats.toolBreakdown[toolName] = {
          executions: count,
          ...this.metrics.toolUsage[toolName]
        };
      }

      stats.topTools = popularity.slice(0, 10).map(item => ({
        name: item.value,
        count: item.score
      }));

      // Calculate error rate
      const totalErrors = Object.values(this.metrics.toolUsage).reduce((sum, tool) => sum + (tool.errors || 0), 0);
      stats.errorRate = stats.totalExecutions > 0 ? (totalErrors / stats.totalExecutions * 100).toFixed(2) : 0;

      return stats;
    } catch (error) {
      logger.error('Error getting tool statistics', error);
      return {};
    }
  }

  async getUserAnalytics() {
    try {
      const activeCount = this.metrics.users.size;
      activeUsers.set(activeCount);

      return {
        activeUsers: activeCount,
        totalSessions: await redis.dbSize(),
        recentActivity: Array.from(this.metrics.users).slice(-10)
      };
    } catch (error) {
      logger.error('Error getting user analytics', error);
      return {};
    }
  }

  async getSystemHealth() {
    try {
      const stats = await this.getToolStatistics();
      const errorRateValue = parseFloat(stats.errorRate || 0);

      // Calculate health score (0-100)
      let healthScore = 100;

      // Deduct points for errors
      healthScore -= Math.min(errorRateValue * 2, 50);

      // Deduct points for low activity
      if (stats.totalExecutions < 10) {
        healthScore -= 20;
      }

      healthScore = Math.max(0, Math.min(100, healthScore));

      systemHealth.set(healthScore);
      errorRate.set(errorRateValue);

      return {
        healthScore: healthScore.toFixed(2),
        status: healthScore > 80 ? 'excellent' : healthScore > 60 ? 'good' : healthScore > 40 ? 'degraded' : 'critical',
        errorRate: errorRateValue,
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        timestamp: Date.now()
      };
    } catch (error) {
      logger.error('Error calculating system health', error);
      return {};
    }
  }

  async getRealTimeMetrics() {
    const now = Date.now();
    const oneHourAgo = now - (60 * 60 * 1000);

    return {
      timestamp: now,
      toolUsage: this.metrics.toolUsage,
      recentErrors: this.metrics.errors.filter(e => e.timestamp > oneHourAgo).slice(-20),
      activeUsers: this.metrics.users.size,
      systemHealth: await this.getSystemHealth()
    };
  }
}

const analytics = new AnalyticsEngine();

// Update tool popularity metrics every minute
cron.schedule('* * * * *', async () => {
  try {
    const popularity = await redis.zRangeWithScores('tool:popularity', 0, -1, { REV: true });

    for (const item of popularity) {
      toolPopularity.set({ tool_name: item.value }, item.score);
    }
  } catch (error) {
    logger.error('Error updating tool popularity metrics', error);
  }
});

// API Routes

// Track tool execution
app.post('/api/track/execution', async (req, res) => {
  try {
    const { toolName, status, duration, userId } = req.body;

    if (!toolName || !status || duration === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    await analytics.trackToolExecution(toolName, status, duration, userId);

    res.json({ success: true, message: 'Execution tracked' });
  } catch (error) {
    logger.error('Error in track execution endpoint', error);
    res.status(500).json({ error: error.message });
  }
});

// Track errors
app.post('/api/track/error', async (req, res) => {
  try {
    const { toolName, errorMessage, userId } = req.body;

    if (!toolName || !errorMessage) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    await analytics.trackError(toolName, errorMessage, userId);

    res.json({ success: true, message: 'Error tracked' });
  } catch (error) {
    logger.error('Error in track error endpoint', error);
    res.status(500).json({ error: error.message });
  }
});

// Get tool statistics
app.get('/api/stats/tools', async (req, res) => {
  try {
    const stats = await analytics.getToolStatistics();
    res.json(stats);
  } catch (error) {
    logger.error('Error in tool stats endpoint', error);
    res.status(500).json({ error: error.message });
  }
});

// Get user analytics
app.get('/api/stats/users', async (req, res) => {
  try {
    const userStats = await analytics.getUserAnalytics();
    res.json(userStats);
  } catch (error) {
    logger.error('Error in user stats endpoint', error);
    res.status(500).json({ error: error.message });
  }
});

// Get system health
app.get('/api/health', async (req, res) => {
  try {
    const health = await analytics.getSystemHealth();
    res.json(health);
  } catch (error) {
    logger.error('Error in health endpoint', error);
    res.status(500).json({ error: error.message });
  }
});

// Get real-time metrics
app.get('/api/metrics/realtime', async (req, res) => {
  try {
    const metrics = await analytics.getRealTimeMetrics();
    res.json(metrics);
  } catch (error) {
    logger.error('Error in realtime metrics endpoint', error);
    res.status(500).json({ error: error.message });
  }
});

// Prometheus metrics endpoint
app.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (error) {
    logger.error('Error in prometheus metrics endpoint', error);
    res.status(500).end(error.message);
  }
});

// Dashboard HTML
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>MCP Analytics Dashboard</title>
      <style>
        body {
          font-family: 'Courier New', monospace;
          background: #0a0a0a;
          color: #00ff41;
          padding: 20px;
          margin: 0;
        }
        .container { max-width: 1400px; margin: 0 auto; }
        h1 {
          text-align: center;
          color: #ffd700;
          text-shadow: 0 0 10px #ffd700;
          font-size: 2.5em;
          margin-bottom: 30px;
        }
        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 20px;
          margin-bottom: 30px;
        }
        .metric-card {
          background: rgba(0,255,65,0.1);
          border: 2px solid #00ff41;
          border-radius: 10px;
          padding: 20px;
          box-shadow: 0 0 20px rgba(0,255,65,0.3);
        }
        .metric-title {
          font-size: 1.2em;
          color: #ffd700;
          margin-bottom: 10px;
          font-weight: bold;
        }
        .metric-value {
          font-size: 2.5em;
          font-weight: bold;
          text-shadow: 0 0 10px #00ff41;
        }
        .chart {
          background: rgba(0,255,65,0.05);
          border: 1px solid #00ff41;
          padding: 20px;
          margin-top: 20px;
          border-radius: 10px;
        }
        .refresh-btn {
          background: #00ff41;
          color: #0a0a0a;
          border: none;
          padding: 15px 30px;
          font-size: 1.1em;
          font-weight: bold;
          border-radius: 5px;
          cursor: pointer;
          margin: 20px auto;
          display: block;
          box-shadow: 0 0 20px rgba(0,255,65,0.5);
        }
        .refresh-btn:hover {
          background: #ffd700;
          box-shadow: 0 0 30px rgba(255,215,0,0.7);
        }
        .status-excellent { color: #00ff41; }
        .status-good { color: #ffff00; }
        .status-degraded { color: #ff9900; }
        .status-critical { color: #ff0000; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>⚡ MCP ANALYTICS HUB ⚡</h1>

        <div class="metrics-grid" id="metrics-container">
          <div class="metric-card">
            <div class="metric-title">LOADING...</div>
            <div class="metric-value">⏳</div>
          </div>
        </div>

        <button class="refresh-btn" onclick="loadMetrics()">REFRESH METRICS</button>

        <div class="chart" id="tool-stats"></div>
      </div>

      <script>
        async function loadMetrics() {
          try {
            const [tools, users, health] = await Promise.all([
              fetch('/api/stats/tools').then(r => r.json()),
              fetch('/api/stats/users').then(r => r.json()),
              fetch('/api/health').then(r => r.json())
            ]);

            const container = document.getElementById('metrics-container');
            container.innerHTML = `
              <div class="metric-card">
                <div class="metric-title">Total Executions</div>
                <div class="metric-value">${tools.totalExecutions || 0}</div>
              </div>
              <div class="metric-card">
                <div class="metric-title">Active Users</div>
                <div class="metric-value">${users.activeUsers || 0}</div>
              </div>
              <div class="metric-card">
                <div class="metric-title">Error Rate</div>
                <div class="metric-value">${tools.errorRate || 0}%</div>
              </div>
              <div class="metric-card">
                <div class="metric-title">System Health</div>
                <div class="metric-value status-${health.status}">${health.healthScore || 0}</div>
              </div>
            `;

            const toolStats = document.getElementById('tool-stats');
            toolStats.innerHTML = '<h2 style="color: #ffd700;">📊 Top Tools</h2>' +
              (tools.topTools || []).map(tool =>
                `<div style="margin: 10px 0; padding: 10px; background: rgba(0,255,65,0.1); border-left: 3px solid #00ff41;">
                  <strong>${tool.name}</strong>: ${tool.count} executions
                </div>`
              ).join('');
          } catch (error) {
            console.error('Error loading metrics:', error);
          }
        }

        // Auto-refresh every 10 seconds
        setInterval(loadMetrics, 10000);
        loadMetrics();
      </script>
    </body>
    </html>
  `);
});

app.listen(PORT, () => {
  logger.info(`Analytics service running on port ${PORT}`);
  console.log(`Analytics Dashboard: http://localhost:${PORT}`);
  console.log(`Prometheus Metrics: http://localhost:${PORT}/metrics`);
});
