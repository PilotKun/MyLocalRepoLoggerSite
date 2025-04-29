# Use an official Node.js runtime as a parent image
FROM node:18-alpine AS base

WORKDIR /app

# Install dependencies
FROM base AS deps
COPY package.json package-lock.json* ./
RUN npm ci

# Build the client application
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx vite build

# Use a lightweight Nginx image to serve the static files
FROM nginx:stable-alpine AS runner

# Copy the built assets from the correct build output directory
COPY --from=builder /app/dist/public /usr/share/nginx/html

# Copy custom Nginx configuration if needed (optional)
# COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"] 