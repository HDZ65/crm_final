#!/usr/bin/env node
/**
 * Script to update main.ts files with findProtoPath helper
 */

const fs = require('fs');
const path = require('path');

const servicesDir = path.join(__dirname, '..', 'services');

// Proto path mapping for each service
const serviceProtoMapping = {
  'service-activites': { package: 'activites', proto: 'activites/activites.proto', port: 50051 },
  'service-calendar': { package: 'calendar', proto: 'calendar/calendar.proto', port: 50068 },
  'service-clients': { package: 'clients', proto: 'clients/clients.proto', port: 50052 },
  'service-commerciaux': { package: 'commerciaux', proto: 'commerciaux/commerciaux.proto', port: 50053 },
  'service-commission': { package: 'commission', proto: 'commission/commission.proto', port: 50054 },
  'service-contrats': { package: 'contrats', proto: 'contrats/contrats.proto', port: 50055 },
  'service-dashboard': { package: 'dashboard', proto: 'dashboard/dashboard.proto', port: 50056 },
  'service-documents': { package: 'documents', proto: 'documents/documents.proto', port: 50057 },
  'service-email': { package: 'email', proto: 'email/email.proto', port: 50058 },
  'service-factures': { package: 'factures', proto: 'factures/factures.proto', port: 50059 },
  'service-logistics': { package: 'logistics', proto: 'logistics/logistics.proto', port: 50060 },
  'service-notifications': { package: 'notifications', proto: 'notifications/notifications.proto', port: 50061 },
  'service-organisations': { package: 'organisations', proto: 'organisations/organisations.proto', port: 50062 },
  'service-payments': { package: 'payment', proto: 'payments/payment.proto', port: 50063 },
  'service-products': { package: 'products', proto: 'products/products.proto', port: 50064 },
  'service-referentiel': { package: 'referentiel', proto: 'referentiel/referentiel.proto', port: 50065 },
  'service-relance': { package: 'relance', proto: 'relance/relance.proto', port: 50066 },
  'service-retry': { package: 'retry', proto: ['retry/am04_retry.proto', 'retry/am04_retry_service.proto'], port: 50070 },
  'service-users': { package: 'users', proto: 'organisations/users.proto', port: 50067 },
};

// Services that already have the helper (skip these)
const skipServices = ['service-users', 'service-clients'];

// Helper function template
const findProtoPathHelper = `
function findProtoPath(relativePath: string): string {
  const candidates = [
    join(process.cwd(), 'proto/src', relativePath),
    join(process.cwd(), 'proto', relativePath.split('/').pop() || relativePath),
    join(process.cwd(), '../../proto/src', relativePath),
  ];
  for (const candidate of candidates) {
    if (existsSync(candidate)) return candidate;
  }
  console.error(\`Proto file not found: \${relativePath}\`);
  return candidates[0];
}
`;

const findProtoPathsHelper = `
function findProtoPaths(relativePaths: string[]): string[] {
  return relativePaths.map(findProtoPath);
}
`;

function updateMainTs(serviceDir, serviceName, config) {
  const mainPath = path.join(serviceDir, 'src', 'main.ts');
  
  if (!fs.existsSync(mainPath)) {
    console.log(`  [SKIP] No main.ts found for ${serviceName}`);
    return;
  }
  
  let content = fs.readFileSync(mainPath, 'utf8');
  
  // Check if already has findProtoPath
  if (content.includes('findProtoPath')) {
    console.log(`  [SKIP] ${serviceName} already has findProtoPath`);
    return;
  }
  
  // Add existsSync import if not present
  if (!content.includes("from 'fs'") && !content.includes('from "fs"')) {
    content = content.replace(
      /import { join } from ['"]path['"];/,
      `import { join } from 'path';\nimport { existsSync } from 'fs';`
    );
  }
  
  // Add helper function after imports
  const importEndRegex = /^import .*;\n(?=\n|async|const|function|class|@)/m;
  const match = content.match(importEndRegex);
  if (match) {
    const insertPos = match.index + match[0].length;
    
    if (Array.isArray(config.proto)) {
      content = content.slice(0, insertPos) + findProtoPathHelper + findProtoPathsHelper + content.slice(insertPos);
    } else {
      content = content.slice(0, insertPos) + findProtoPathHelper + content.slice(insertPos);
    }
  }
  
  // Update protoPath usage
  if (Array.isArray(config.proto)) {
    // Multiple protos (e.g., service-retry)
    const protoArray = config.proto.map(p => `'${p}'`).join(', ');
    content = content.replace(
      /protoPath:\s*\[[\s\S]*?\]/,
      `protoPath: findProtoPaths([${protoArray}])`
    );
  } else {
    // Single proto
    content = content.replace(
      /protoPath:\s*join\([^)]+\)/g,
      `protoPath: findProtoPath('${config.proto}')`
    );
  }
  
  // Update port to use correct default
  const portRegex = /process\.env\.GRPC_PORT \|\| ['"]?\d+['"]?/g;
  content = content.replace(portRegex, `process.env.GRPC_PORT || ${config.port}`);
  
  fs.writeFileSync(mainPath, content);
  console.log(`  [OK] Updated main.ts for ${serviceName}`);
}

// Main
console.log('Updating main.ts files with findProtoPath helper...\n');

const services = fs.readdirSync(servicesDir)
  .filter(f => f.startsWith('service-'))
  .filter(f => fs.statSync(path.join(servicesDir, f)).isDirectory());

for (const serviceName of services) {
  console.log(`Processing ${serviceName}...`);
  
  if (skipServices.includes(serviceName)) {
    console.log(`  [SKIP] Already updated manually`);
    console.log('');
    continue;
  }
  
  const serviceDir = path.join(servicesDir, serviceName);
  const config = serviceProtoMapping[serviceName];
  
  if (!config) {
    console.log(`  [WARN] No proto mapping found for ${serviceName}`);
    console.log('');
    continue;
  }
  
  updateMainTs(serviceDir, serviceName, config);
  console.log('');
}

console.log('Done! Now rebuild services: bun run build --workspaces');
