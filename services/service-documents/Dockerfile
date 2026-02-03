# ==========================================
# Stage 1: Dependencies
# ==========================================
FROM oven/bun:1-alpine AS deps

RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy monorepo configuration
COPY package.json bun.lock turbo.json ./

# Copy shared packages
COPY packages/proto/package.json ./packages/proto/
COPY packages/grpc-utils/package.json ./packages/grpc-utils/
COPY packages/shared/package.json ./packages/shared/
COPY packages/nats-utils/package.json ./packages/nats-utils/
COPY frontend/package.json ./frontend/
COPY services ./services
RUN find services -mindepth 2 -maxdepth 2 ! -name package.json -exec rm -rf {} +

# Copy service package.json
COPY services/service-documents/package.json ./services/service-documents/

# Install dependencies
RUN bun install --frozen-lockfile

# Copy proto source files and generate TypeScript
COPY packages/proto/src ./packages/proto/src
COPY packages/proto/buf.yaml packages/proto/buf.gen.yaml ./packages/proto/
RUN cd packages/proto && bunx buf generate

# ==========================================
# Stage 2: Development (target: development)
# ==========================================
FROM deps AS development

ENV NODE_ENV=development

WORKDIR /app

# Copy source code of shared packages
COPY packages/proto/ ./packages/proto/
COPY packages/grpc-utils/ ./packages/grpc-utils/
COPY packages/shared/ ./packages/shared/

# Copy service source code
COPY services/service-documents/ ./services/service-documents/

WORKDIR /app/services/service-documents

CMD ["bun", "run", "start:dev"]

# ==========================================
# Stage 3: Builder
# ==========================================
FROM deps AS builder

WORKDIR /app

# Copy source code of shared packages
COPY packages/proto/ ./packages/proto/
COPY packages/grpc-utils/ ./packages/grpc-utils/
COPY packages/shared/ ./packages/shared/

# Copy service source code
COPY services/service-documents/ ./services/service-documents/

# Build packages and service
RUN bun run build --workspace=@crm/grpc-utils && \
    bun run build --workspace=@crm/shared && \
    bun run build --workspace=@crm/service-documents

# Remove source maps to reduce image size
RUN find services/service-documents/dist -name "*.map" -type f -delete

# ==========================================
# Stage 4: Production (target: production)
# ==========================================
FROM oven/bun:1-alpine AS production

RUN apk add --no-cache dumb-init

RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

WORKDIR /app

COPY package.json bun.lock turbo.json ./

# Copy shared packages
COPY packages/proto/package.json ./packages/proto/
COPY packages/grpc-utils/package.json ./packages/grpc-utils/
COPY packages/shared/package.json ./packages/shared/
COPY packages/nats-utils/package.json ./packages/nats-utils/
COPY frontend/package.json ./frontend/
COPY services ./services
RUN find services -mindepth 2 -maxdepth 2 ! -name package.json -exec rm -rf {} +

# Copy service package.json
COPY services/service-documents/package.json ./services/service-documents/

# Install production dependencies
RUN bun install --production --frozen-lockfile

# Copy compiled service
COPY --from=builder --chown=nestjs:nodejs /app/services/service-documents/dist ./services/service-documents/dist

# Copy compiled shared packages
COPY --from=builder --chown=nestjs:nodejs /app/packages/proto ./packages/proto
COPY --from=builder --chown=nestjs:nodejs /app/packages/grpc-utils/dist ./packages/grpc-utils/dist
COPY --from=builder --chown=nestjs:nodejs /app/packages/grpc-utils/package.json ./packages/grpc-utils/
COPY --from=builder --chown=nestjs:nodejs /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder --chown=nestjs:nodejs /app/packages/shared/package.json ./packages/shared/

USER nestjs

ENV NODE_ENV=production

EXPOSE 50057

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD bun -e "require('net').connect(50057, 'localhost').on('connect', () => process.exit(0)).on('error', () => process.exit(1))"

ENTRYPOINT ["dumb-init", "--"]

CMD ["bun", "services/service-documents/dist/src/main.js"]
