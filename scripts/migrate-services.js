#!/usr/bin/env node
/**
 * Script to migrate all services to use @crm/* packages
 * 
 * Changes:
 * 1. Updates package.json: name, dependencies, scripts
 * 2. Updates tsconfig.json: removes path aliases, uses node16
 * 3. Updates main.ts: uses @crm/grpc-utils
 * 4. Updates all @proto/* imports to @crm/proto/*
 */

const fs = require('fs');
const path = require('path');

const servicesDir = path.join(__dirname, '..', 'services');

// Service to proto mapping
const serviceConfig = {
  'service-activites': { grpcName: 'activites', protoModule: 'activites' },
  'service-calendar': { grpcName: 'calendar', protoModule: 'calendar' },
  'service-clients': { grpcName: 'clients', protoModule: 'clients' },
  'service-commerciaux': { grpcName: 'commerciaux', protoModule: 'commerciaux' },
  'service-commission': { grpcName: 'commission', protoModule: 'commission' },
  'service-contrats': { grpcName: 'contrats', protoModule: 'contrats' },
  'service-dashboard': { grpcName: 'dashboard', protoModule: 'dashboard' },
  'service-documents': { grpcName: 'documents', protoModule: 'documents' },
  'service-email': { grpcName: 'email', protoModule: 'email' },
  'service-factures': { grpcName: 'factures', protoModule: 'factures' },
  'service-logistics': { grpcName: 'logistics', protoModule: 'logistics' },
  'service-notifications': { grpcName: 'notifications', protoModule: 'notifications' },
  'service-organisations': { grpcName: 'organisations', protoModule: 'organisations' },
  'service-payments': { grpcName: 'payments', protoModule: 'payments' },
  'service-products': { grpcName: 'products', protoModule: 'products' },
  'service-referentiel': { grpcName: 'referentiel', protoModule: 'referentiel' },
  'service-relance': { grpcName: 'relance', protoModule: 'relance' },
  'service-retry': { grpcName: 'retry', protoModule: 'retry' },
  'service-users': { grpcName: 'users', protoModule: 'users' },
};

// Skip already migrated
const skipServices = ['service-clients'];

function updatePackageJson(serviceDir, serviceName) {
  const pkgPath = path.join(serviceDir, 'package.json');
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  
  // Update name
  pkg.name = `@crm/${serviceName}`;
  
  // Update main and scripts
  pkg.main = 'dist/main.js';
  pkg.scripts = pkg.scripts || {};
  pkg.scripts.clean = 'rimraf dist';
  pkg.scripts['start:prod'] = 'node dist/main.js';
  
  // Add @crm/* dependencies
  pkg.dependencies = pkg.dependencies || {};
  pkg.dependencies['@crm/grpc-utils'] = '*';
  pkg.dependencies['@crm/proto'] = '*';
  pkg.dependencies['@crm/shared'] = '*';
  
  // Add rimraf to devDependencies
  pkg.devDependencies = pkg.devDependencies || {};
  pkg.devDependencies['rimraf'] = '^6.1.2';
  
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
  console.log(`  [OK] Updated package.json`);
}

function updateTsConfig(serviceDir) {
  const tsconfigPath = path.join(serviceDir, 'tsconfig.json');
  
  const tsconfig = {
    compilerOptions: {
      module: 'node16',
      target: 'ES2022',
      lib: ['ES2022'],
      declaration: true,
      removeComments: true,
      emitDecoratorMetadata: true,
      experimentalDecorators: true,
      allowSyntheticDefaultImports: true,
      sourceMap: true,
      outDir: './dist',
      rootDir: './src',
      baseUrl: './src',
      incremental: true,
      skipLibCheck: true,
      strict: false,
      strictNullChecks: true,
      noImplicitAny: false,
      strictBindCallApply: false,
      forceConsistentCasingInFileNames: true,
      noFallthroughCasesInSwitch: true,
      esModuleInterop: true,
      resolveJsonModule: true,
      moduleResolution: 'node16'
    },
    include: ['src/**/*'],
    exclude: ['node_modules', 'dist', 'test', '**/*spec.ts']
  };
  
  fs.writeFileSync(tsconfigPath, JSON.stringify(tsconfig, null, 2) + '\n');
  console.log(`  [OK] Updated tsconfig.json`);
  
  // Remove tsconfig.build.json if exists
  const buildPath = path.join(serviceDir, 'tsconfig.build.json');
  if (fs.existsSync(buildPath)) {
    fs.unlinkSync(buildPath);
    console.log(`  [OK] Removed tsconfig.build.json`);
  }
}

function updateMainTs(serviceDir, serviceName, config) {
  const mainPath = path.join(serviceDir, 'src', 'main.ts');
  if (!fs.existsSync(mainPath)) {
    console.log(`  [SKIP] No main.ts found`);
    return;
  }
  
  let content = fs.readFileSync(mainPath, 'utf8');
  
  // Check if already migrated
  if (content.includes("from '@crm/grpc-utils'")) {
    console.log(`  [SKIP] main.ts already migrated`);
    return;
  }
  
  // Simple services - standard template
  const newMainTs = `import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { getGrpcOptions } from '@crm/grpc-utils';
import { AppModule } from './app.module';

async function bootstrap() {
  const grpcOptions = getGrpcOptions('${config.grpcName}');
  
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
    transport: Transport.GRPC,
    options: grpcOptions,
  });

  await app.listen();
  console.log(\`Service ${serviceName} gRPC listening on \${grpcOptions.url}\`);
}

bootstrap();
`;
  
  fs.writeFileSync(mainPath, newMainTs);
  console.log(`  [OK] Updated main.ts`);
}

function updateProtoImports(serviceDir) {
  // Find all .ts files
  function walkDir(dir, callback) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      if (stat.isDirectory() && !['node_modules', 'dist', '.git'].includes(file)) {
        walkDir(filePath, callback);
      } else if (file.endsWith('.ts')) {
        callback(filePath);
      }
    }
  }
  
  let updatedCount = 0;
  
  walkDir(serviceDir, (filePath) => {
    let content = fs.readFileSync(filePath, 'utf8');
    const original = content;
    
    // Replace @proto/* imports with @crm/proto/*
    // @proto/clients/clients -> @crm/proto/clients
    // @proto/organisations/users -> @crm/proto/users
    // @proto/organisations/organisations -> @crm/proto/organisations
    content = content.replace(/@proto\/clients\/clients/g, '@crm/proto/clients');
    content = content.replace(/@proto\/organisations\/users/g, '@crm/proto/users');
    content = content.replace(/@proto\/organisations\/organisations/g, '@crm/proto/organisations');
    content = content.replace(/@proto\/calendar\/calendar/g, '@crm/proto/calendar');
    content = content.replace(/@proto\/payments\/payment/g, '@crm/proto/payments');
    content = content.replace(/@proto\/factures\/factures/g, '@crm/proto/factures');
    content = content.replace(/@proto\/contrats\/contrats/g, '@crm/proto/contrats');
    content = content.replace(/@proto\/retry\/am04_retry_service/g, '@crm/proto/retry');
    content = content.replace(/@proto\/retry\/am04_retry/g, '@crm/proto/retry/types');
    
    // Generic pattern for other modules
    content = content.replace(/@proto\/(\w+)\/\1/g, '@crm/proto/$1');
    
    if (content !== original) {
      fs.writeFileSync(filePath, content);
      updatedCount++;
    }
  });
  
  if (updatedCount > 0) {
    console.log(`  [OK] Updated ${updatedCount} files with @crm/proto imports`);
  }
}

// Main
console.log('Migrating services to use @crm/* packages...\n');

const services = fs.readdirSync(servicesDir)
  .filter(f => f.startsWith('service-'))
  .filter(f => fs.statSync(path.join(servicesDir, f)).isDirectory());

for (const serviceName of services) {
  console.log(`Processing ${serviceName}...`);
  
  if (skipServices.includes(serviceName)) {
    console.log(`  [SKIP] Already migrated\n`);
    continue;
  }
  
  const serviceDir = path.join(servicesDir, serviceName);
  const config = serviceConfig[serviceName];
  
  if (!config) {
    console.log(`  [WARN] No config found\n`);
    continue;
  }
  
  updatePackageJson(serviceDir, serviceName);
  updateTsConfig(serviceDir);
  updateMainTs(serviceDir, serviceName, config);
  updateProtoImports(serviceDir);
  
  console.log('');
}

console.log('Migration complete!');
console.log('Next steps:');
console.log('1. Run: npm install');
console.log('2. Run: npx turbo run build');
