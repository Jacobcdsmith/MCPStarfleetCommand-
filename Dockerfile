# Enhanced MCP Server - Multi-stage Docker Build
FROM node:20-alpine AS base

# Install dependencies required for native modules
RUN apk add --no-cache \
    git \
    python3 \
    make \
    g++ \
    bash \
    curl \
    ca-certificates

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies
RUN npm ci --only=production && npm cache clean --force

# Development stage
FROM base AS development
RUN npm ci
COPY . .
ENV NODE_ENV=development
CMD ["npm", "run", "dev"]

# Production stage
FROM base AS production

# Copy application code
COPY . .

# Create non-root user for security
RUN addgroup -g 1001 -S mcpuser && \
    adduser -S mcpuser -u 1001 && \
    chown -R mcpuser:mcpuser /app

USER mcpuser

# Expose HTTP dashboard port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3001/api/status', (r) => { process.exit(r.statusCode === 200 ? 0 : 1); })" || exit 1

# Environment variables
ENV NODE_ENV=production \
    PORT=3001

# Start the server
CMD ["node", "server.js"]
