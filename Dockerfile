# ===========================
# MULTI-STAGE BUILD DOCKERFILE
# ===========================

# Stage 1: Builder
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --legacy-peer-deps

# Copy Prisma schema and generate client
COPY prisma ./prisma
RUN npx prisma generate

# Copy source code
COPY . .

# Build application
RUN npm run build

# Stage 2: Production
FROM node:20-alpine

WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Copy only production dependencies from builder
COPY --from=builder /app/node_modules ./node_modules

# Copy compiled application
COPY --from=builder /app/dist ./dist

# Copy package.json for reference
COPY package*.json ./

# Copy Prisma schema (required for runtime)
COPY prisma ./prisma

# Ensure runtime files belong to non-root user
RUN chown -R node:node /app

# Set environment to production
ENV NODE_ENV=production

# Run container as non-root
USER node

# Expose application port
EXPOSE 3000

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start application
CMD ["node", "dist/main.js"]
