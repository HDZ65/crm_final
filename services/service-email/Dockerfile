# ==========================================
# service-email Dockerfile
# ==========================================

FROM node:20-alpine AS builder

RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copier les fichiers package du monorepo
COPY package.json package-lock.json turbo.json ./

# Copier tous les package.json des packages et services
COPY packages/proto/package.json ./packages/proto/
COPY packages/grpc-utils/package.json ./packages/grpc-utils/
COPY packages/shared/package.json ./packages/shared/
COPY frontend/package.json ./frontend/
COPY services/service-activites/package.json ./services/service-activites/
COPY services/service-calendar/package.json ./services/service-calendar/
COPY services/service-clients/package.json ./services/service-clients/
COPY services/service-commerciaux/package.json ./services/service-commerciaux/
COPY services/service-commission/package.json ./services/service-commission/
COPY services/service-contrats/package.json ./services/service-contrats/
COPY services/service-dashboard/package.json ./services/service-dashboard/
COPY services/service-documents/package.json ./services/service-documents/
COPY services/service-email/package.json ./services/service-email/
COPY services/service-factures/package.json ./services/service-factures/
COPY services/service-logistics/package.json ./services/service-logistics/
COPY services/service-notifications/package.json ./services/service-notifications/
COPY services/service-organisations/package.json ./services/service-organisations/
COPY services/service-payments/package.json ./services/service-payments/
COPY services/service-products/package.json ./services/service-products/
COPY services/service-referentiel/package.json ./services/service-referentiel/
COPY services/service-relance/package.json ./services/service-relance/
COPY services/service-retry/package.json ./services/service-retry/
COPY services/service-users/package.json ./services/service-users/

# Installer les dependances
RUN npm ci

# Copier le code source des packages
COPY packages/proto/ ./packages/proto/
COPY packages/grpc-utils/ ./packages/grpc-utils/
COPY packages/shared/ ./packages/shared/

# Copier le code source du service
COPY services/service-email/ ./services/service-email/

# Build des packages puis du service
RUN npm run build --workspace=@crm/grpc-utils &&     npm run build --workspace=@crm/shared &&     npm run build --workspace=@crm/service-email

# ==========================================
# Stage 2: Production
# ==========================================
FROM node:20-alpine AS production

RUN addgroup -g 1001 -S nodejs &&     adduser -S nestjs -u 1001

WORKDIR /app/services/service-email

# Copier node_modules racine
COPY --from=builder --chown=nestjs:nodejs /app/node_modules /app/node_modules

# Copier node_modules du service (pour les deps non-hoisted comme @nestjs/typeorm)
COPY --from=builder --chown=nestjs:nodejs /app/services/service-email/node_modules ./node_modules

# Copier le dist du service
COPY --from=builder --chown=nestjs:nodejs /app/services/service-email/dist ./dist

# Copier les packages compiles
COPY --from=builder --chown=nestjs:nodejs /app/packages/proto /app/packages/proto
COPY --from=builder --chown=nestjs:nodejs /app/packages/grpc-utils/dist /app/packages/grpc-utils/dist
COPY --from=builder --chown=nestjs:nodejs /app/packages/grpc-utils/package.json /app/packages/grpc-utils/
COPY --from=builder --chown=nestjs:nodejs /app/packages/shared/dist /app/packages/shared/dist
COPY --from=builder --chown=nestjs:nodejs /app/packages/shared/package.json /app/packages/shared/

# Copier le package.json du service
COPY --from=builder --chown=nestjs:nodejs /app/services/service-email/package.json ./

USER nestjs

ENV NODE_ENV=production
ENV GRPC_PORT=50058

EXPOSE 50058

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3   CMD node -e "require('net').connect({port:50058,host:'0.0.0.0'}).on('connect',()=>process.exit(0)).on('error',()=>process.exit(1))"

CMD ["node", "dist/main.js"]
