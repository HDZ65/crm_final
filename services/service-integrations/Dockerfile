# ============================================================================
# service-integrations Dockerfile - Winaity Pattern
# ============================================================================

FROM oven/bun:1-alpine AS deps
WORKDIR /app/services/service-integrations
COPY packages /app/packages
COPY services/service-integrations/package.json ./
RUN bun install

FROM oven/bun:1-alpine AS builder
WORKDIR /app/services/service-integrations
COPY --from=deps /app/services/service-integrations/node_modules ./node_modules
COPY packages /app/packages
COPY services/service-integrations .
RUN bun run build

FROM oven/bun:1-alpine AS production
WORKDIR /app
COPY packages /packages
COPY services/service-integrations/package.json ./
RUN bun install --production
COPY --from=builder /app/services/service-integrations/dist ./dist
EXPOSE 50058
CMD ["bun", "run", "start:prod"]
