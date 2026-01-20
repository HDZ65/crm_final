# ==========================================
# Stage 1: Build
# ==========================================
FROM node:20-alpine AS builder

RUN apk add --no-cache python3 make g++

WORKDIR /app

COPY services/service-factures/package*.json ./

RUN npm install

COPY services/service-factures/ .

# Copy proto source files
COPY proto/src/factures ./proto

# Copy generated TypeScript files for @proto/* alias
COPY proto/gen/ts ./proto/gen/ts

# Update tsconfig paths for Docker context
RUN if [ -f tsconfig.json ]; then \
    sed -i 's|"../../proto/gen/ts/\*"|"./proto/gen/ts/*"|g' tsconfig.json; \
fi

RUN npm run build

RUN npm prune --production

# ==========================================
# Stage 2: Production
# ==========================================
FROM node:20-alpine AS production

RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

WORKDIR /app

COPY --from=builder --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /app/proto ./proto

USER nestjs

ENV NODE_ENV=production

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('net').connect({port:${GRPC_PORT:-50051},host:'0.0.0.0'}).on('connect',()=>process.exit(0)).on('error',()=>process.exit(1))"

CMD ["node", "dist/src/main.js"]
