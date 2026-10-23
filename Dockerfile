# Multi-stage Dockerfile for AssemblyFlow
# -------------------------------------------------------------
# Stage 1: Build Frontend and Backend
# -------------------------------------------------------------
FROM node:22-alpine AS builder

WORKDIR /app

# Copy root and package manifests for caching
COPY package.json ./
COPY assemblyflow/backend/package*.json ./assemblyflow/backend/
COPY assemblyflow/frontend/package*.json ./assemblyflow/frontend/

# Install dependencies
RUN cd assemblyflow/backend && npm install
RUN cd assemblyflow/frontend && npm install

# Copy source code
COPY . .

# Build frontend and backend
RUN cd assemblyflow/frontend && npm run build
RUN cd assemblyflow/backend && npm run build

# -------------------------------------------------------------
# Stage 2: Production Runtime
# -------------------------------------------------------------
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

# Copy production backend dependencies and built dist
COPY --from=builder /app/assemblyflow/backend/package*.json ./
RUN npm install --only=production

COPY --from=builder /app/assemblyflow/backend/dist ./dist
COPY --from=builder /app/assemblyflow/frontend/dist ./frontend/dist

# Expose port (default 5000)
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:5000/api/health || exit 1

# Start the unified AssemblyFlow application
CMD ["node", "dist/server.js"]
