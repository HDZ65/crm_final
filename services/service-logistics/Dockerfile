# ==========================================
# Stage 1: Dependencies
# ==========================================
FROM oven/bun:1-alpine AS deps

RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy monorepo tsconfig base (needed by all services)
COPY tsconfig.base.json ./tsconfig.base.json

# Copy shared packages (needed for file: references)
COPY packages/proto/ ./packages/proto/
COPY packages/shared-kernel/ ./packages/shared-kernel/

# Copy service
COPY services/service-logistics/ ./services/service-logistics/

# Install dependencies from service directory
WORKDIR /app/services/service-logistics
RUN bun install

# ==========================================
# Stage 2: Development (target: development)
# ==========================================
FROM deps AS development

ENV NODE_ENV=development

CMD ["bun", "run", "start:dev"]

# ==========================================
# Stage 3: Builder
# ==========================================
FROM deps AS builder

RUN bun run --cwd /app/packages/shared-kernel build && \
    bun run build

# ==========================================
# Stage 4: Production (target: production)
# ==========================================
FROM oven/bun:1-alpine AS production

RUN apk add --no-cache dumb-init

RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

WORKDIR /app

COPY --from=builder --chown=nestjs:nodejs /app/services/service-logistics/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /app/services/service-logistics/package.json ./
COPY --from=builder --chown=nestjs:nodejs /app/services/service-logistics/node_modules ./node_modules

USER nestjs

ENV NODE_ENV=production

EXPOSE 50060

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD bun -e "require('net').connect(50060, 'localhost').on('connect', () => process.exit(0)).on('error', () => process.exit(1))"

ENTRYPOINT ["dumb-init", "--"]

CMD ["bun", "dist/src/main.js"]
