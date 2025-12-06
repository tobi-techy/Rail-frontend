# Multi-stage Dockerfile for Expo React Native App with Bun
FROM oven/bun:1-alpine AS base

# Install system dependencies
RUN apk add --no-cache \
    git \
    bash \
    curl \
    openssh-client \
    python3 \
    make \
    g++ \
    && rm -rf /var/cache/apk/*

# Set working directory
WORKDIR /app

# Install global dependencies
RUN bun add -g @expo/cli@latest eas-cli

# Development stage
FROM base AS development

# Copy package files
COPY package.json bun.lockb bunfig.toml ./

# Install dependencies
RUN bun install --frozen-lockfile --production

# Copy source code
COPY . .

# Expose ports
EXPOSE 8081 19000 19001 19002

# Start development server
CMD ["bun", "start"]

# Production build stage
FROM base AS build

# Copy package files
COPY package.json bun.lockb bunfig.toml ./

# Install dependencies
RUN bun install --frozen-lockfile --production

# Copy source code
COPY . .

# Build for production
RUN bun run prebuild

# Production stage
FROM nginx:alpine AS production

# Copy built files to nginx
COPY --from=build /app/dist /usr/share/nginx/html

# Copy custom nginx config if needed
# COPY nginx.conf /etc/nginx/nginx.conf

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]