# ============================================================================
# Service-Core Dockerfile - Winaity Pattern
# ============================================================================

FROM oven/bun:1-alpine AS deps
WORKDIR /app/services/service-core
COPY packages /app/packages
COPY services/service-core/package.json ./
RUN bun install

FROM oven/bun:1-alpine AS builder
WORKDIR /app/services/service-core
COPY --from=deps /app/services/service-core/node_modules ./node_modules
COPY packages /app/packages
COPY services/service-core .
# Proto files are generated during build via prebuild script
RUN bun run build

FROM oven/bun:1-alpine AS production
WORKDIR /app
COPY packages /packages
COPY services/service-core/package.json ./
RUN bun install --production
COPY --from=builder /app/services/service-core/dist ./dist
COPY --from=builder /app/services/service-core/proto ./proto
EXPOSE 50051
CMD ["bun", "run", "start:prod"]