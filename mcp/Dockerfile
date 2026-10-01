# Build context = thư mục gốc repo (cần api/_lib.js). Xem mcp/docker-compose.yml.
FROM node:22-alpine
WORKDIR /app/mcp
COPY mcp/package.json mcp/package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY api/_lib.js /app/api/_lib.js
COPY mcp/server.js mcp/tools.js ./
USER node
EXPOSE 3001
CMD ["node", "--max-old-space-size=96", "server.js"]
