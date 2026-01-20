# ==========================================
# Stage 1: Dependencies
# ==========================================
FROM node:20-alpine AS deps

RUN apk add --no-cache libc6-compat

WORKDIR /app

COPY frontend/package.json ./

RUN npm install --legacy-peer-deps

# ==========================================
# Stage 2: Build
# ==========================================
FROM node:20-alpine AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY frontend/ .

# Copy generated proto files:
# @proto-grpc/* = gRPC clients WITHOUT NestJS (for lib/grpc server-side calls)
# @proto-frontend/* = frontend types only (no gRPC, for client components)
COPY proto/gen/ts-grpc/ ./proto/gen/ts-grpc/
COPY proto/gen/ts-frontend/ ./proto/gen/ts-frontend/

# Update tsconfig.json paths for Docker build context
RUN sed -i 's|"../proto/gen/ts-grpc/\*"|"./proto/gen/ts-grpc/*"|g' tsconfig.json && \
    sed -i 's|"../proto/gen/ts-frontend/\*"|"./proto/gen/ts-frontend/*"|g' tsconfig.json

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
  CMD node -e "require('http').get('http://localhost:3000',(r)=>process.exit([200,301,302,307,308].includes(r.statusCode)?0:1)).on('error',()=>process.exit(1))"

CMD ["node", "server.js"]
