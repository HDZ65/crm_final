#!/usr/bin/env node
/**
 * Script to generate service-specific Dockerfiles from the template
 * Usage: bunx ts-node scripts/generate-dockerfiles.ts
 * or:    bun scripts/generate-dockerfiles.js (after compilation)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SERVICE_PORTS: Record<string, number> = {
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

/**
 * Generate a service-specific Dockerfile from the template
 * Adapts the 4-stage template for a specific service with its port and dependencies
 */
function generateDockerfile(serviceName: string, port: number): string {
  return `# ==========================================
# ${serviceName} Dockerfile
# ==========================================
# Generated from docker/Dockerfile.template
# Build: docker build -f services/${serviceName}/Dockerfile -t crm/${serviceName} .
# Run:   docker run -p ${port}:${port} crm/${serviceName}
# ==========================================

# ==========================================
# Stage 1: Dependencies
# ==========================================
FROM oven/bun:1-alpine AS deps

RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy monorepo configuration
COPY package.json bun.lock turbo.json ./

# Copy shared packages
COPY packages/proto/package.json ./packages/proto/
COPY packages/grpc-utils/package.json ./packages/grpc-utils/
COPY packages/shared/package.json ./packages/shared/

# Copy service package.json
COPY services/${serviceName}/package.json ./services/${serviceName}/

# Install dependencies
RUN bun install --frozen-lockfile

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
COPY services/${serviceName}/ ./services/${serviceName}/

WORKDIR /app/services/${serviceName}

CMD ["bun", "run", "start:dev"]

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
COPY services/${serviceName}/ ./services/${serviceName}/

# Build packages and service
RUN bun run build --workspace=@crm/grpc-utils && \\
    bun run build --workspace=@crm/shared && \\
    bun run build --workspace=@crm/${serviceName}

# Remove source maps to reduce image size
RUN find services/${serviceName}/dist -name "*.map" -type f -delete

# ==========================================
# Stage 4: Production
# ==========================================
FROM oven/bun:1-alpine AS production

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

RUN addgroup -g 1001 -S nodejs && \\
    adduser -S nestjs -u 1001

WORKDIR /app

# Copy node_modules from deps stage
COPY --from=builder --chown=nestjs:nodejs /app/node_modules ./node_modules

# Copy service node_modules (for non-hoisted dependencies)
COPY --from=builder --chown=nestjs:nodejs /app/services/${serviceName}/node_modules ./services/${serviceName}/node_modules

# Copy compiled service
COPY --from=builder --chown=nestjs:nodejs /app/services/${serviceName}/dist ./services/${serviceName}/dist

# Copy compiled shared packages
COPY --from=builder --chown=nestjs:nodejs /app/packages/proto ./packages/proto
COPY --from=builder --chown=nestjs:nodejs /app/packages/grpc-utils/dist ./packages/grpc-utils/dist
COPY --from=builder --chown=nestjs:nodejs /app/packages/grpc-utils/package.json ./packages/grpc-utils/
COPY --from=builder --chown=nestjs:nodejs /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder --chown=nestjs:nodejs /app/packages/shared/package.json ./packages/shared/

# Copy service package.json
COPY --from=builder --chown=nestjs:nodejs /app/services/${serviceName}/package.json ./services/${serviceName}/

USER nestjs

ENV NODE_ENV=production
ENV GRPC_PORT=${port}

EXPOSE ${port}

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \\
  CMD node -e "require('net').connect({port:${port},host:'0.0.0.0'}).on('connect',()=>process.exit(0)).on('error',()=>process.exit(1))"

# Use dumb-init as entrypoint for proper signal handling
ENTRYPOINT ["dumb-init", "--"]

CMD ["node", "services/${serviceName}/dist/src/main.js"]
`;
}

/**
 * Main function to generate all service Dockerfiles
 */
function main(): void {
  const servicesDir = path.join(__dirname, '..', 'services');
  let updated = 0;
  let skipped = 0;

  console.log('Generating service Dockerfiles from template...\n');

  for (const [serviceName, port] of Object.entries(SERVICE_PORTS)) {
    const serviceDir = path.join(servicesDir, serviceName);
    const dockerfilePath = path.join(serviceDir, 'Dockerfile');

    if (!fs.existsSync(serviceDir)) {
      console.log(`[SKIP] ${serviceName} - directory not found`);
      skipped++;
      continue;
    }

    const content = generateDockerfile(serviceName, port);
    fs.writeFileSync(dockerfilePath, content);
    console.log(`[OK] ${serviceName} - Dockerfile generated (port ${port})`);
    updated++;
  }

  console.log(`\n✓ Generated ${updated} Dockerfiles`);
  if (skipped > 0) {
    console.log(`⊘ Skipped ${skipped} services (directory not found)`);
  }
}

// Run main function
main();
