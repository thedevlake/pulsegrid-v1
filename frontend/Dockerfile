# Multi-stage build for production
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files for dependency caching
COPY package*.json ./

# Install dependencies
# Use --legacy-peer-deps to handle peer dependency conflicts with @react-three/drei
RUN npm ci --legacy-peer-deps

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage with nginx
FROM nginx:alpine

# Copy custom nginx configuration for SPA routing
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built files from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]

