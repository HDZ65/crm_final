# ============================================================================
# Frontend Dockerfile - Multi-stage build for Next.js 16 with Bun
# ============================================================================

# ---------------------------------------------------------
# Stage 1: Dependencies - Install all dependencies (cache friendly)
# ---------------------------------------------------------
FROM oven/bun:1-alpine AS deps

WORKDIR /app

# Copy only dependency files first (cache layer)
COPY frontend/package.json frontend/bun.lock ./

# Install dependencies with frozen lockfile
RUN bun install --frozen-lockfile

# ---------------------------------------------------------
# Stage 2: Development - Hot-reload mode
# ---------------------------------------------------------
FROM node:22-alpine AS development

WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy proto package for runtime
COPY packages/proto /packages/proto

# Copy package.json and config files
COPY frontend/package.json ./
COPY frontend/tsconfig.json ./
COPY frontend/next.config.ts ./
COPY frontend/postcss.config.mjs ./
COPY frontend/biome.json ./
COPY frontend/components.json ./

# Copy env files for development
COPY frontend/.env.development ./.env.development

# Copy source code (needed on remote server without volume mounts)
COPY frontend/src ./src
COPY frontend/public ./public

# Environment
ENV NODE_ENV=development
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

EXPOSE 3000

# Copy proto files at startup and run dev server with Node.js runtime
# (Bun runtime has a known bug with Turbopack serverExternalPackages - oven-sh/bun#25370)
CMD sh -c "mkdir -p src/proto && cp -r /packages/proto/gen/ts-frontend/* src/proto/ && npx next dev"

# ---------------------------------------------------------
# Stage 3: Builder - Build the application
# ---------------------------------------------------------
FROM oven/bun:1-alpine AS builder

WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy shared proto package (for ts-frontend generation)
COPY packages/proto /packages/proto

# Build argument for environment (development or production)
ARG BUILD_ENV=development

# Copy configuration files
COPY frontend/package.json ./
COPY frontend/tsconfig.json ./
COPY frontend/next.config.ts ./
COPY frontend/postcss.config.mjs ./
COPY frontend/biome.json ./
COPY frontend/components.json ./
COPY frontend/.env.${BUILD_ENV} ./.env

# Copy source code
COPY frontend/src ./src
COPY frontend/public ./public

# Copy proto files from ts-frontend (generated without NestJS dependencies)
RUN mkdir -p src/proto && \
    cp -r /packages/proto/gen/ts-frontend/* ./src/proto/

# Set production environment for build
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Build Next.js application
RUN bun run next build

# ---------------------------------------------------------
# Stage 3: Production - Runtime image (standalone mode)
# ---------------------------------------------------------
FROM oven/bun:1-alpine AS production

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# User non-root (Alpine style with explicit group)
RUN addgroup -S bun 2>/dev/null || true && adduser -S nextjs -G bun -u 1001

# Copy build output with correct ownership
COPY --from=builder --chown=nextjs:bun /app/public ./public
COPY --from=builder --chown=nextjs:bun /app/.next/standalone ./
COPY --from=builder --chown=nextjs:bun /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:bun /app/.env ./.env

USER nextjs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD bun -e "fetch('http://localhost:3000/api/health').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["bun", "server.js"]
