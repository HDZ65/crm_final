# ============================================================================
# service-logistics Dockerfile - Winaity Pattern
# ============================================================================

FROM oven/bun:1-alpine AS deps
WORKDIR /app/services/service-logistics
COPY packages /app/packages
COPY services/service-logistics/package.json ./
RUN bun install

FROM oven/bun:1-alpine AS builder
WORKDIR /app/services/service-logistics
COPY --from=deps /app/services/service-logistics/node_modules ./node_modules
COPY packages /app/packages
COPY services/service-logistics .
# Proto files are generated during build via prebuild script
RUN bun run build

FROM oven/bun:1-alpine AS production
WORKDIR /app
COPY packages /packages
COPY services/service-logistics/package.json ./
RUN bun install --production
COPY --from=builder /app/services/service-logistics/dist ./dist
COPY --from=builder /app/services/service-logistics/proto ./proto
EXPOSE 50056
CMD ["bun", "run", "start:prod"]
