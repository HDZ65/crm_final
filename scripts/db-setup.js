#!/usr/bin/env node
/**
 * CRM Final - Database Migration Manager
 * 
 * Usage: node scripts/db-setup.js [command]
 * 
 * Commands:
 *   migrate   - Run pending migrations on all services (default)
 *   generate  - Generate a new migration for services with entity changes
 *   status    - Show migration status for all services
 *   help      - Show this help message
 * 
 * Note: Use 'npm run db:create' to create databases first
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const SERVICES_DIR = path.join(__dirname, '..', 'services');

// Services with database (excluding dashboard which is read-only)
const SERVICES = [
  'service-activites',
  'service-calendar',
  'service-clients',
  'service-commerciaux',
  'service-commission',
  'service-contrats',
  'service-documents',
  'service-email',
  'service-factures',
  'service-logistics',
  'service-notifications',
  'service-organisations',
  'service-payments',
  'service-products',
  'service-referentiel',
  'service-relance',
  'service-retry',
  'service-users',
];

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  dim: '\x1b[2m',
};

const log = (msg, color = 'reset') => console.log(`${colors[color]}${msg}${colors.reset}`);

function runCommand(command, cwd, silent = false) {
  try {
    const result = execSync(command, {
      cwd,
      encoding: 'utf-8',
      stdio: silent ? 'pipe' : 'inherit',
    });
    return { success: true, output: result };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

function hasMigrations(servicePath) {
  const migrationsPath = path.join(servicePath, 'src', 'migrations');
  if (!fs.existsSync(migrationsPath)) return false;
  const files = fs.readdirSync(migrationsPath).filter(f => f.endsWith('.ts') && !f.startsWith('.'));
  return files.length > 0;
}

async function runMigrations() {
  log('\n🔄 Running migrations for all services...\n', 'cyan');
  
  let success = 0, skipped = 0, failed = 0;
  
  for (const service of SERVICES) {
    const servicePath = path.join(SERVICES_DIR, service);
    
    if (!fs.existsSync(servicePath)) {
      log(`  ⚠  ${service}: not found`, 'yellow');
      skipped++;
      continue;
    }

    if (!hasMigrations(servicePath)) {
      log(`  ○  ${service}: no migrations`, 'dim');
      skipped++;
      continue;
    }

    process.stdout.write(`  ◉  ${service}: `);
    const result = runCommand('npm run migration:run --silent', servicePath, true);
    
    if (result.success) {
      log('done', 'green');
      success++;
    } else {
      log('failed', 'red');
      failed++;
    }
  }

  log(`\n📊 Results: ${success} migrated, ${skipped} skipped, ${failed} failed`, 'cyan');
}

async function generateMigrations() {
  log('\n📝 Generating migrations for services with changes...\n', 'cyan');
  log('   This compares entities with current database schema.\n', 'dim');
  
  for (const service of SERVICES) {
    const servicePath = path.join(SERVICES_DIR, service);
    
    if (!fs.existsSync(servicePath)) continue;

    process.stdout.write(`  ◉  ${service}: `);
    
    const result = runCommand(
      'npx ts-node -r tsconfig-paths/register ./node_modules/typeorm/cli.js -d src/datasource.ts migration:generate src/migrations/Migration',
      servicePath,
      true
    );
    
    if (result.success) {
      log('generated', 'green');
    } else if (result.error?.includes('No changes')) {
      log('no changes', 'dim');
    } else {
      log('error', 'red');
    }
  }
}

async function showStatus() {
  log('\n📊 Migration status for all services...\n', 'cyan');
  
  for (const service of SERVICES) {
    const servicePath = path.join(SERVICES_DIR, service);
    
    if (!fs.existsSync(servicePath)) continue;

    log(`\n── ${service} ──`, 'cyan');
    
    if (!hasMigrations(servicePath)) {
      log('   No migrations found', 'dim');
      continue;
    }
    
    runCommand('npm run migration:show --silent', servicePath, false);
  }
}

function showHelp() {
  console.log(`
CRM Final - Database Migration Manager

Usage: node scripts/db-setup.js [command]

Commands:
  migrate     Run pending migrations on all services (default)
  generate    Generate new migrations for services with entity changes
  status      Show migration status for all services
  help        Show this help message

Examples:
  npm run db:migrate          # Run all pending migrations
  npm run db:generate         # Generate migrations for changed entities
  npm run db:status           # Check migration status

Prerequisites:
  1. PostgreSQL must be running: npm run docker:db
  2. Databases must exist: npm run db:create
`);
}

async function main() {
  const command = process.argv[2] || 'migrate';
  
  switch (command) {
    case 'migrate':
      await runMigrations();
      break;
    case 'generate':
      await generateMigrations();
      break;
    case 'status':
      await showStatus();
      break;
    case 'help':
    case '--help':
    case '-h':
      showHelp();
      break;
    default:
      log(`Unknown command: ${command}`, 'red');
      showHelp();
      process.exit(1);
  }
}

main().catch(err => {
  log(`\n❌ Error: ${err.message}`, 'red');
  process.exit(1);
});
