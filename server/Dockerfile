# Use an official Node.js runtime as a parent image
FROM node:18-alpine AS base

# Set the working directory in the container
WORKDIR /app

# Install dependencies only when needed
FROM base AS deps
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# This will do the trick, use the corresponding env file for each environment.
# RUN npm run build -- --filter=server... # Adapt if your build command differs

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

# Copy built application files from builder stage
COPY --from=builder /app .

# Expose the port the server listens on (adjust if different)
EXPOSE 4000

# Define the command to run your app using PM2 or similar for production
# CMD ["npm", "run", "start:prod"] # Adjust based on your package.json scripts
CMD ["npm", "run", "dev:server"] # Using dev script for now, adjust as needed 