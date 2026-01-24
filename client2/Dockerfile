# Multi-stage build for React client
FROM node:20-alpine AS builder

# Enable corepack and install pnpm 8.15.6 to match lockfile version 6.0
RUN corepack enable && corepack prepare pnpm@8.15.6 --activate

# Set working directory (repo root as build context)
WORKDIR /app

# Copy workspace metadata and client package definition
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json .npmrc ./
COPY client2/package.json client2/package.json

# Install only client production deps using workspace lockfile
RUN pnpm install --frozen-lockfile --filter client2...

# Copy client source
COPY client2/ ./client2

# Switch to client workspace
WORKDIR /app/client2

# Build the application
ENV NODE_ENV=production
RUN pnpm run build

# Production stage
FROM nginx:alpine AS production

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Copy custom nginx configuration
COPY --from=builder /app/client2/nginx.conf /etc/nginx/nginx.conf

# Copy built assets from builder stage
COPY --from=builder /app/client2/dist /usr/share/nginx/html

# Copy environment template and script
COPY --from=builder /app/client2/docker-entrypoint.sh /docker-entrypoint.sh
COPY --from=builder /app/client2/env.template.js /usr/share/nginx/html/env.template.js

# Make script executable and ensure proper ownership
RUN chmod +x /docker-entrypoint.sh && \
    chown nginx:nginx /docker-entrypoint.sh

# Create nginx user and set permissions
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx && \
    chown -R nginx:nginx /etc/nginx/conf.d && \
    touch /var/run/nginx.pid && \
    chown -R nginx:nginx /var/run/nginx.pid

# Switch to non-root user
USER nginx

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:80/ || exit 1

# Expose port
EXPOSE 80

# Use dumb-init to handle signals properly
ENTRYPOINT ["/usr/bin/dumb-init", "--"]

# Start nginx
CMD ["/docker-entrypoint.sh"]
