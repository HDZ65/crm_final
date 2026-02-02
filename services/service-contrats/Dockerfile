# ==========================================
# service-contrats Dockerfile
# ==========================================
# Generated from docker/Dockerfile.template
# Build: docker build -f services/service-contrats/Dockerfile -t crm/service-contrats .
# Run:   docker run -p 50055:50055 crm/service-contrats
# ==========================================

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
COPY services/service-contrats/package.json ./services/service-contrats/

# Install dependencies
RUN npm ci

# ==========================================
# Stage 2: Development
# ==========================================
FROM deps AS development

ENV NODE_ENV=development
ENV PROTO_ROOT=./proto

WORKDIR /app

# Copy source code of shared packages
COPY packages/proto/ ./packages/proto/
COPY packages/grpc-utils/ ./packages/grpc-utils/
COPY packages/shared/ ./packages/shared/

# Copy service source code
COPY services/service-contrats/ ./services/service-contrats/

WORKDIR /app/services/service-contrats

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
COPY services/service-contrats/ ./services/service-contrats/

# Build packages and service
RUN npm run build --workspace=@crm/grpc-utils && \
    npm run build --workspace=@crm/shared && \
    npm run build --workspace=@crm/service-contrats

# Remove source maps to reduce image size
RUN find services/service-contrats/dist -name "*.map" -type f -delete

# ==========================================
# Stage 4: Production
# ==========================================
FROM node:20-alpine AS production

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

WORKDIR /app

# Copy node_modules from deps stage
COPY --from=builder --chown=nestjs:nodejs /app/node_modules ./node_modules

# Copy service node_modules (for non-hoisted dependencies)
COPY --from=builder --chown=nestjs:nodejs /app/services/service-contrats/node_modules ./services/service-contrats/node_modules

# Copy compiled service
COPY --from=builder --chown=nestjs:nodejs /app/services/service-contrats/dist ./services/service-contrats/dist

# Copy compiled shared packages
COPY --from=builder --chown=nestjs:nodejs /app/packages/proto ./packages/proto
COPY --from=builder --chown=nestjs:nodejs /app/packages/grpc-utils/dist ./packages/grpc-utils/dist
COPY --from=builder --chown=nestjs:nodejs /app/packages/grpc-utils/package.json ./packages/grpc-utils/
COPY --from=builder --chown=nestjs:nodejs /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder --chown=nestjs:nodejs /app/packages/shared/package.json ./packages/shared/

# Copy service package.json
COPY --from=builder --chown=nestjs:nodejs /app/services/service-contrats/package.json ./services/service-contrats/

USER nestjs

ENV NODE_ENV=production
ENV GRPC_PORT=50055

EXPOSE 50055

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('net').connect({port:50055,host:'0.0.0.0'}).on('connect',()=>process.exit(0)).on('error',()=>process.exit(1))"

# Use dumb-init as entrypoint for proper signal handling
ENTRYPOINT ["dumb-init", "--"]

CMD ["node", "services/service-contrats/dist/src/main.js"]
