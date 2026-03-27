# ============================================================================
# service-telecom Dockerfile - Winaity Pattern
# ============================================================================

FROM oven/bun:1-alpine AS deps
WORKDIR /app/services/service-telecom
COPY packages /app/packages
COPY services/service-telecom/package.json ./
RUN bun install

FROM oven/bun:1-alpine AS builder
WORKDIR /app/services/service-telecom
COPY --from=deps /app/services/service-telecom/node_modules ./node_modules
COPY packages /app/packages
COPY services/service-telecom .
RUN bun run build

FROM oven/bun:1-alpine AS production
WORKDIR /app
COPY packages /packages
COPY services/service-telecom/package.json ./
RUN bun install --production
COPY --from=builder /app/services/service-telecom/dist ./dist
EXPOSE 50055
CMD ["bun", "run", "start:prod"]
