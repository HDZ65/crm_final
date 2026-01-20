# ==========================================
# Stage 1: Proto Generation
# ==========================================
FROM alpine:3.19 AS proto-gen

WORKDIR /output/grpc

# Copy pre-generated proto files from proto/gen/ts-frontend
COPY proto/gen/ts-frontend/ .

# ==========================================
# Stage 2: Dependencies
# ==========================================
FROM node:20-alpine AS deps

RUN apk add --no-cache libc6-compat

WORKDIR /app

COPY frontend/package*.json ./

RUN npm ci

# ==========================================
# Stage 3: Build
# ==========================================
FROM node:20-alpine AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY frontend/ .

# Copy generated proto files
COPY --from=proto-gen /output/grpc ./src/generated/grpc

ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# ==========================================
# Stage 4: Production
# ==========================================
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Set correct permissions for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000',(r)=>process.exit(r.statusCode===200?0:1)).on('error',()=>process.exit(1))"

CMD ["node", "server.js"]
