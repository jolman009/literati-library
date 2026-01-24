# Node.js server Dockerfile
FROM node:20-alpine AS base

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create app directory and user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S server -u 1001

WORKDIR /app

# Enable corepack and install pnpm 8.15.6 to match lockfile version 6.0
RUN corepack enable && corepack prepare pnpm@8.15.6 --activate

# Copy workspace metadata from repo root (build context must be repo root)
COPY --chown=server:nodejs pnpm-lock.yaml pnpm-workspace.yaml package.json .npmrc ./
COPY --chown=server:nodejs server2/package.json server2/package.json

# Install only server2 production deps using the workspace lockfile
RUN pnpm install --prod --frozen-lockfile --filter server2...

# Copy server source
COPY --chown=server:nodejs server2/ ./server2

# Switch to service directory
WORKDIR /app/server2

# Switch to non-root user
USER server

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node healthcheck.js

# Expose port
EXPOSE 5000

# Use dumb-init to handle signals properly
ENTRYPOINT ["/usr/bin/dumb-init", "--"]

# Start the application
CMD ["node", "src/server.js"]
