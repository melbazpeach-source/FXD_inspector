# ─────────────────────────────────────────────────────────────────
# Inspect360 — Production Dockerfile
# Multi-stage build: build frontend + backend, then run lean image
# ─────────────────────────────────────────────────────────────────

# Stage 1: Build
FROM node:22-alpine AS builder

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@10.4.1 --activate

# Copy package files
COPY package.json pnpm-lock.yaml ./
COPY patches/ ./patches/

# Install all dependencies (including devDeps for build)
RUN pnpm install --frozen-lockfile

# Copy source
COPY . .

# Build frontend (Vite) + backend (esbuild)
RUN pnpm build

# ─────────────────────────────────────────────────────────────────
# Stage 2: Production image
# ─────────────────────────────────────────────────────────────────
FROM node:22-alpine AS runner

WORKDIR /app

# Install pnpm for production deps only
RUN corepack enable && corepack prepare pnpm@10.4.1 --activate

# Copy package files
COPY package.json pnpm-lock.yaml ./
COPY patches/ ./patches/

# Install production dependencies only
RUN pnpm install --frozen-lockfile --prod

# Copy built artifacts from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/client/dist ./client/dist
COPY --from=builder /app/drizzle ./drizzle
COPY --from=builder /app/shared ./shared
COPY --from=builder /app/server/knowledge ./server/knowledge

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && adduser -S inspect360 -u 1001
USER inspect360

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget -qO- http://localhost:${PORT:-3000}/api/health || exit 1

EXPOSE 3000

ENV NODE_ENV=production

CMD ["node", "dist/index.js"]
