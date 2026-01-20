# ==========================================
# Stage 1: Build
# ==========================================
FROM node:20-alpine AS builder

RUN apk add --no-cache python3 make g++

WORKDIR /app

COPY services/service-clients/package*.json ./

RUN npm install

COPY services/service-clients/ .
COPY proto/clients ./proto

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

EXPOSE 50052

ENV NODE_ENV=production
ENV GRPC_PORT=50052

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('net').connect({port:50052,host:'0.0.0.0'}).on('connect',()=>process.exit(0)).on('error',()=>process.exit(1))"

CMD ["node", "dist/main.js"]
