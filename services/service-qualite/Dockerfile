# ============================================================================
# service-qualite Dockerfile - Winaity Pattern
# ============================================================================

FROM oven/bun:1-alpine AS deps
WORKDIR /app/services/service-qualite
COPY packages /app/packages
COPY services/service-qualite/package.json ./
RUN bun install

FROM oven/bun:1-alpine AS builder
WORKDIR /app/services/service-qualite
COPY --from=deps /app/services/service-qualite/node_modules ./node_modules
COPY packages /app/packages
COPY services/service-qualite .
# Proto files are generated during build via prebuild script
RUN bun run build

FROM oven/bun:1-alpine AS production
WORKDIR /app
COPY packages /packages
COPY services/service-qualite/package.json ./
RUN bun install --production
COPY --from=builder /app/services/service-qualite/dist ./dist
COPY --from=builder /app/services/service-qualite/proto ./proto
EXPOSE 50059
CMD ["bun", "run", "start:prod"]
