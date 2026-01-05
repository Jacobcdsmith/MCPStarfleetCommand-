FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci --only=production && npm cache clean --force

COPY server.js ./

RUN mkdir -p data && \
    addgroup -g 1001 -S analytics && \
    adduser -S analytics -u 1001 && \
    chown -R analytics:analytics /app

USER analytics

EXPOSE 3002

HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3002/api/health', (r) => { process.exit(r.statusCode === 200 ? 0 : 1); })" || exit 1

CMD ["node", "server.js"]
