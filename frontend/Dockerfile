# ============================================================================
# Frontend Dockerfile - Winaity Pattern
# ============================================================================

FROM oven/bun:1-alpine AS deps
WORKDIR /app
COPY packages/proto /packages/proto
COPY frontend/package.json frontend/bun.lock ./
RUN bun install --frozen-lockfile

FROM oven/bun:1-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY packages/proto /packages/proto
COPY frontend .
RUN mkdir -p src/proto && \
    cp -r /packages/proto/gen/ts-frontend/* src/proto/ && \
    bun run build

FROM oven/bun:1-alpine AS production
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

RUN addgroup -S bun 2>/dev/null || true && adduser -S nextjs -G bun -u 1001

COPY --from=builder --chown=nextjs:bun /app/public ./public
COPY --from=builder --chown=nextjs:bun /app/.next/standalone ./
COPY --from=builder --chown=nextjs:bun /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD bun -e "fetch('http://localhost:3000/api/health').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["bun", "server.js"]

# Development stage
FROM oven/bun:1-alpine AS development
WORKDIR /app
COPY packages/proto /packages/proto
COPY --from=deps /app/node_modules ./node_modules
COPY frontend .
ENV NODE_ENV=development
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
EXPOSE 3000
CMD sh -c "mkdir -p src/proto && cp -r /packages/proto/gen/ts-frontend/* src/proto/ 2>/dev/null || true && bun dev"