# ============================================================================
# service-finance Dockerfile - Winaity Pattern
# ============================================================================

FROM oven/bun:1-alpine AS deps
WORKDIR /app/services/service-finance
COPY packages /app/packages
COPY services/service-finance/package.json ./
RUN bun install

FROM oven/bun:1-alpine AS builder
WORKDIR /app/services/service-finance
COPY --from=deps /app/services/service-finance/node_modules ./node_modules
COPY packages /app/packages
COPY services/service-finance .
# Proto files are generated during build via prebuild script
RUN bun run build

FROM oven/bun:1-alpine AS production
WORKDIR /app
COPY packages /packages
COPY services/service-finance/package.json ./
RUN bun install --production
COPY --from=builder /app/services/service-finance/dist ./dist
COPY --from=builder /app/services/service-finance/proto ./proto
EXPOSE 50053
CMD ["bun", "run", "start:prod"]
