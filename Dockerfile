# Multi-stage build for React Frontend - Delivery Tracking

# Stage 1: Build the application
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (include devDependencies so the build step has Vite/TypeScript/etc.)
RUN npm ci --silent

# Copy source code
COPY . .

# Add an optional ARG to select the environment
ARG BUILD_MODE=production
ENV VITE_BUILD_MODE=$BUILD_MODE

# Use the mode dynamically
RUN npm run build -- --mode $VITE_BUILD_MODE

# Stage 2: Serve with Nginx
FROM nginx:alpine

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy built files from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
