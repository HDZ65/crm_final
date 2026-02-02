# ==========================================
# Stage 1: Dependencies
# ==========================================
FROM node:20-alpine AS deps

RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy monorepo configuration
COPY package.json package-lock.json turbo.json ./

# Copy shared packages
COPY packages/proto/package.json ./packages/proto/
COPY packages/grpc-utils/package.json ./packages/grpc-utils/
COPY packages/shared/package.json ./packages/shared/

# Copy service package.json
COPY services/service-commission/package.json ./services/service-commission/

# Install dependencies
RUN npm ci

# Copy proto source files and generate TypeScript
COPY packages/proto/src ./packages/proto/src
COPY packages/proto/buf.yaml packages/proto/buf.gen.yaml ./packages/proto/
RUN cd packages/proto && npx buf generate

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
COPY services/service-commission/ ./services/service-commission/

WORKDIR /app/services/service-commission

CMD ["npm", "run", "start:dev"]

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
COPY services/service-commission/ ./services/service-commission/

# Build packages and service
RUN npm run build --workspace=@crm/grpc-utils && \
    npm run build --workspace=@crm/shared && \
    npm run build --workspace=@crm/service-commission

# Remove source maps to reduce image size
RUN find services/service-commission/dist -name "*.map" -type f -delete

# ==========================================
# Stage 4: Production (target: production)
# ==========================================
FROM node:20-alpine AS production

RUN apk add --no-cache dumb-init

RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

WORKDIR /app

# Copy node_modules from deps stage
COPY --from=builder --chown=nestjs:nodejs /app/node_modules ./node_modules

# Copy service node_modules (for non-hoisted dependencies)
COPY --from=builder --chown=nestjs:nodejs /app/services/service-commission/node_modules ./services/service-commission/node_modules

# Copy compiled service
COPY --from=builder --chown=nestjs:nodejs /app/services/service-commission/dist ./services/service-commission/dist

# Copy compiled shared packages
COPY --from=builder --chown=nestjs:nodejs /app/packages/proto ./packages/proto
COPY --from=builder --chown=nestjs:nodejs /app/packages/grpc-utils/dist ./packages/grpc-utils/dist
COPY --from=builder --chown=nestjs:nodejs /app/packages/grpc-utils/package.json ./packages/grpc-utils/
COPY --from=builder --chown=nestjs:nodejs /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder --chown=nestjs:nodejs /app/packages/shared/package.json ./packages/shared/

# Copy service package.json
COPY --from=builder --chown=nestjs:nodejs /app/services/service-commission/package.json ./services/service-commission/

USER nestjs

ENV NODE_ENV=production

EXPOSE 50054

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('net').connect(50054, 'localhost').on('connect', () => process.exit(0)).on('error', () => process.exit(1))"

ENTRYPOINT ["dumb-init", "--"]

CMD ["node", "services/service-commission/dist/src/main.js"]
