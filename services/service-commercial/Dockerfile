# ============================================================================
# service-commercial Dockerfile - Winaity Pattern
# ============================================================================

FROM oven/bun:1-alpine AS deps
WORKDIR /app/services/service-commercial
COPY packages /app/packages
COPY services/service-commercial/package.json ./
RUN bun install

FROM oven/bun:1-alpine AS builder
WORKDIR /app/services/service-commercial
COPY --from=deps /app/services/service-commercial/node_modules ./node_modules
COPY packages /app/packages
COPY services/service-commercial .
# Proto files are generated during build via prebuild script
RUN bun run build

FROM oven/bun:1-alpine AS production
WORKDIR /app
COPY packages /packages
COPY services/service-commercial/package.json ./
RUN bun install --production
COPY --from=builder /app/services/service-commercial/dist ./dist
COPY --from=builder /app/services/service-commercial/proto ./proto
EXPOSE 50052
CMD ["bun", "run", "start:prod"]
