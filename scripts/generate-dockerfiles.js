#!/usr/bin/env node
/**
 * Script pour generer les Dockerfiles de tous les services
 * Usage: bun scripts/generate-dockerfiles.js
 */

const fs = require('fs');
const path = require('path');

const SERVICE_PORTS = {
  'service-activites': 50051,
  'service-clients': 50052,
  'service-commerciaux': 50053,
  'service-commission': 50054,
  'service-contrats': 50055,
  'service-dashboard': 50056,
  'service-documents': 50057,
  'service-email': 50058,
  'service-factures': 50059,
  'service-logistics': 50060,
  'service-notifications': 50061,
  'service-organisations': 50062,
  'service-payments': 50063,
  'service-products': 50064,
  'service-referentiel': 50065,
  'service-relance': 50066,
  'service-users': 50067,
  'service-calendar': 50068,
  'service-retry': 50070,
};

function generateDockerfile(serviceName, port) {
  return `# ==========================================
# ${serviceName} Dockerfile
# ==========================================
# Build: docker build -f services/${serviceName}/Dockerfile -t crm/${serviceName} .
# Run:   docker run -p ${port}:${port} crm/${serviceName}
# ==========================================

# ==========================================
# Stage 1: Build
# ==========================================
FROM oven/bun:1-alpine AS builder

RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copier les fichiers package du monorepo
COPY package.json bun.lock turbo.json ./

# Copier les packages partages
COPY packages/proto/package.json ./packages/proto/
COPY packages/grpc-utils/package.json ./packages/grpc-utils/
COPY packages/shared/package.json ./packages/shared/

# Copier le package.json du service
COPY services/${serviceName}/package.json ./services/${serviceName}/

# Installer les dependances
RUN bun install --frozen-lockfile

# Copier le code source des packages
COPY packages/proto/ ./packages/proto/
COPY packages/grpc-utils/ ./packages/grpc-utils/
COPY packages/shared/ ./packages/shared/

# Copier le code source du service
COPY services/${serviceName}/ ./services/${serviceName}/

# Build des packages puis du service
RUN bun run build --workspace=@crm/grpc-utils && \\
    bun run build --workspace=@crm/shared && \\
    bun run build --workspace=@crm/${serviceName}

# Pruner les devDependencies
RUN bun prune --production --workspace=@crm/${serviceName}

# ==========================================
# Stage 2: Production
# ==========================================
FROM oven/bun:1-alpine AS production

RUN addgroup -g 1001 -S nodejs && \\
    adduser -S nestjs -u 1001

WORKDIR /app

# Copier node_modules et dist
COPY --from=builder --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nodejs /app/services/${serviceName}/node_modules ./services/${serviceName}/node_modules 2>/dev/null || true
COPY --from=builder --chown=nestjs:nodejs /app/services/${serviceName}/dist ./dist

# Copier les packages compiles
COPY --from=builder --chown=nestjs:nodejs /app/packages/proto ./packages/proto
COPY --from=builder --chown=nestjs:nodejs /app/packages/grpc-utils/dist ./packages/grpc-utils/dist
COPY --from=builder --chown=nestjs:nodejs /app/packages/grpc-utils/package.json ./packages/grpc-utils/
COPY --from=builder --chown=nestjs:nodejs /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder --chown=nestjs:nodejs /app/packages/shared/package.json ./packages/shared/

USER nestjs

ENV NODE_ENV=production
ENV GRPC_PORT=${port}

EXPOSE ${port}

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \\
  CMD node -e "require('net').connect({port:${port},host:'0.0.0.0'}).on('connect',()=>process.exit(0)).on('error',()=>process.exit(1))"

CMD ["node", "dist/src/main.js"]
`;
}

// Main
const servicesDir = path.join(__dirname, '..', 'services');
let updated = 0;

for (const [serviceName, port] of Object.entries(SERVICE_PORTS)) {
  const serviceDir = path.join(servicesDir, serviceName);
  const dockerfilePath = path.join(serviceDir, 'Dockerfile');
  
  if (!fs.existsSync(serviceDir)) {
    console.log(`[SKIP] ${serviceName} - directory not found`);
    continue;
  }
  
  const content = generateDockerfile(serviceName, port);
  fs.writeFileSync(dockerfilePath, content);
  console.log(`[OK] ${serviceName} - Dockerfile updated (port ${port})`);
  updated++;
}

console.log(`\\nUpdated ${updated} Dockerfiles`);
