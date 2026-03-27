# ============================================================================
# service-gateway Dockerfile - Winaity Pattern
# ============================================================================

FROM oven/bun:1-alpine AS deps
WORKDIR /app/services/service-gateway
COPY packages /app/packages
COPY services/service-gateway/package.json ./
RUN bun install

FROM oven/bun:1-alpine AS builder
WORKDIR /app/services/service-gateway
COPY --from=deps /app/services/service-gateway/node_modules ./node_modules
COPY packages /app/packages
COPY services/service-gateway .
RUN bun run build

FROM oven/bun:1-alpine AS production
WORKDIR /app
COPY packages /packages
COPY services/service-gateway/package.json ./
RUN bun install --production
COPY --from=builder /app/services/service-gateway/dist ./dist
EXPOSE 3001
CMD ["bun", "run", "start:prod"]