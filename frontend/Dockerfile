# Production Dockerfile for UA Volunteering Platform Frontend
# Multi-stage build for optimized production image

# Stage 1: Build
FROM node:24-alpine AS builder

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml .npmrc ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build the application
RUN pnpm build

# Stage 2: Production
FROM nginx:alpine AS production

# Copy nginx config template (will be processed at runtime)
COPY nginx.conf.template /etc/nginx/conf.d/default.conf.template

# Copy entrypoint script
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Copy built assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Add healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:80/ || exit 1

# Default backend URL (can be overridden at runtime)
ENV BACKEND_URL=http://backend:8080

# Expose port 80
EXPOSE 80

# Use entrypoint script to process nginx config at runtime
ENTRYPOINT ["/docker-entrypoint.sh"]
