#!/usr/bin/env node
/**
 * Script to fix service configurations for proper build and runtime paths
 * 
 * This script:
 * 1. Updates tsconfig.json to include src files only
 * 2. Updates package.json to use correct dist path
 * 3. Updates main.ts to use findProtoPath helper
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

function updateTsConfig(serviceDir, serviceName) {
  const tsconfigPath = path.join(serviceDir, 'tsconfig.json');
  
  if (!fs.existsSync(tsconfigPath)) {
    console.log(`  [SKIP] No tsconfig.json found for ${serviceName}`);
    return;
  }
  
  const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'));
  
  // Add include and exclude if not present
  if (!tsconfig.include) {
    tsconfig.include = ['src/**/*'];
  }
  if (!tsconfig.exclude) {
    tsconfig.exclude = ['node_modules', 'dist', 'test', '**/*spec.ts'];
  }
  
  fs.writeFileSync(tsconfigPath, JSON.stringify(tsconfig, null, 2) + '\n');
  console.log(`  [OK] Updated tsconfig.json for ${serviceName}`);
}

function updatePackageJson(serviceDir, serviceName) {
  const pkgPath = path.join(serviceDir, 'package.json');
  
  if (!fs.existsSync(pkgPath)) {
    console.log(`  [SKIP] No package.json found for ${serviceName}`);
    return;
  }
  
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  
  // Update main entry point
  pkg.main = `dist/services/${serviceName}/src/main.js`;
  
  // Update start:prod script
  if (pkg.scripts && pkg.scripts['start:prod']) {
    pkg.scripts['start:prod'] = `node dist/services/${serviceName}/src/main`;
  }
  
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
  console.log(`  [OK] Updated package.json for ${serviceName}`);
}

function createTsConfigBuild(serviceDir, serviceName) {
  const buildPath = path.join(serviceDir, 'tsconfig.build.json');
  
  const content = {
    extends: './tsconfig.json',
    exclude: ['node_modules', 'dist', 'test', '**/*spec.ts']
  };
  
  fs.writeFileSync(buildPath, JSON.stringify(content, null, 2) + '\n');
  console.log(`  [OK] Created tsconfig.build.json for ${serviceName}`);
}

// Main
console.log('Fixing service configurations...\n');

const services = fs.readdirSync(servicesDir)
  .filter(f => f.startsWith('service-'))
  .filter(f => fs.statSync(path.join(servicesDir, f)).isDirectory());

for (const serviceName of services) {
  console.log(`Processing ${serviceName}...`);
  const serviceDir = path.join(servicesDir, serviceName);
  
  updateTsConfig(serviceDir, serviceName);
  updatePackageJson(serviceDir, serviceName);
  createTsConfigBuild(serviceDir, serviceName);
  
  console.log('');
}

console.log('Done! Now run: bun run build --workspaces');
