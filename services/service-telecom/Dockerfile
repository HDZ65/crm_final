FROM oven/bun:1-alpine AS deps

RUN apk add --no-cache python3 make g++

WORKDIR /app

COPY tsconfig.base.json ./tsconfig.base.json
COPY packages/proto/ ./packages/proto/
COPY packages/shared-kernel/ ./packages/shared-kernel/
COPY services/service-telecom/ ./services/service-telecom/

WORKDIR /app/services/service-telecom
RUN bun install

FROM deps AS development

ENV NODE_ENV=development
CMD ["bun", "run", "start:dev"]

FROM deps AS builder

RUN bun run --cwd /app/packages/shared-kernel build && bun run build

FROM oven/bun:1-alpine AS production

RUN apk add --no-cache dumb-init

RUN addgroup -g 1001 -S nodejs && adduser -S nestjs -u 1001

WORKDIR /app

COPY --from=builder --chown=nestjs:nodejs /app/services/service-telecom/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /app/services/service-telecom/package.json ./
COPY --from=builder --chown=nestjs:nodejs /app/services/service-telecom/node_modules ./node_modules

USER nestjs

ENV NODE_ENV=production

EXPOSE 3056

ENTRYPOINT ["dumb-init", "--"]

CMD ["bun", "dist/src/main.js"]
