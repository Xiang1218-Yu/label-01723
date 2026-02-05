# Tetris Online Frontend Dockerfile
# Multi-platform support: ARM64 and AMD64

# Build stage - using Node for any build tools if needed
FROM --platform=$BUILDPLATFORM node:20-alpine AS builder

WORKDIR /app

# Copy source files
COPY . .

# Production stage - using nginx for serving static files
FROM --platform=$TARGETPLATFORM nginx:alpine

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy static files from builder
COPY --from=builder /app /usr/share/nginx/html

# Remove default nginx index page
RUN rm -f /usr/share/nginx/html/default.conf /usr/share/nginx/html/nginx.conf /usr/share/nginx/html/Dockerfile

# Expose port 80
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
