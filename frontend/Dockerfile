# ============================================================================
# Frontend Dockerfile - Multi-stage build for Next.js with bun
# ============================================================================

# ---------------------------------------------------------
# Stage 1: Proto Generation
# ---------------------------------------------------------
FROM oven/bun:1-alpine AS proto

WORKDIR /app

COPY packages/proto/package.json packages/proto/bun.lock* ./packages/proto/
RUN cd packages/proto && bun install --frozen-lockfile

COPY packages/proto/src ./packages/proto/src
COPY packages/proto/buf.yaml packages/proto/buf.gen.yaml ./packages/proto/
RUN cd packages/proto && bunx buf generate

# ---------------------------------------------------------
# Stage 2: Dependencies - Install all dependencies (cache friendly)
# ---------------------------------------------------------
FROM oven/bun:1-alpine AS deps

RUN apk add --no-cache libc6-compat

WORKDIR /app

COPY frontend/package.json frontend/bun.lock* ./

RUN bun install --frozen-lockfile

# ---------------------------------------------------------
# Stage 2: Development - Hot-reload mode (target: development)
# ---------------------------------------------------------
FROM oven/bun:1-alpine AS development

WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy generated proto files from proto stage
COPY --from=proto /app/packages/proto/gen /packages/proto/gen

# Copy package.json for scripts
COPY frontend/package.json ./

# Environment
ENV NODE_ENV=development
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

EXPOSE 3000

# Copy proto files at startup and run dev server
CMD sh -c "mkdir -p src/proto && cp -r /packages/proto/gen/ts-frontend/* src/proto/ 2>/dev/null || true && bun --bun run dev"

# ---------------------------------------------------------
# Stage 3: Builder - Build the application
# ---------------------------------------------------------
FROM oven/bun:1-alpine AS builder

WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy generated proto files from proto stage
COPY --from=proto /app/packages/proto/gen /packages/proto/gen

# Build argument for environment (development, staging, production)
ARG BUILD_ENV=production

# Copy configuration files
COPY frontend/package.json ./
COPY frontend/tsconfig.json ./
COPY frontend/next.config.ts ./
COPY frontend/postcss.config.mjs ./
COPY frontend/biome.json ./
COPY frontend/components.json ./

# Copy env file for build
COPY frontend/.env.${BUILD_ENV} ./.env.local

# Copy source code
COPY frontend/src ./src
COPY frontend/public ./public

# Copy proto files from ts-frontend (generated types without NestJS)
RUN mkdir -p src/proto && \
    cp -r /packages/proto/gen/ts-frontend/* ./src/proto/ 2>/dev/null || true

# Set production environment for build
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Build Next.js application
RUN bun --bun run build

# ---------------------------------------------------------
# Stage 4: Production - Runtime image (target: production)
# ---------------------------------------------------------
FROM oven/bun:1-alpine AS production

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy build output with correct ownership
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Set correct permissions for prerender cache
RUN mkdir .next && chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD bun -e "require('http').get('http://localhost:3000/api/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

CMD ["bun", "run", "server.js"]
