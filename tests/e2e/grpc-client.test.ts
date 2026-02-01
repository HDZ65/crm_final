/**
 * Tests E2E pour la communication gRPC entre services
 * 
 * Ces tests verifient que:
 * 1. Les fichiers proto sont correctement charges
 * 2. Les clients gRPC peuvent etre crees
 * 3. La communication inter-services fonctionne
 * 
 * Usage:
 *   npx tsx tests/e2e/grpc-client.test.ts
 * 
 * Prerequis:
 *   - Les services doivent etre demarres (docker-compose up)
 *   - Ou lancer en mode mock pour tester uniquement le chargement
 */

import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import * as path from 'path';
import * as fs from 'fs';

// Configuration
const PROTO_BASE_DIR = path.resolve(__dirname, '../../packages/proto/src');
const MOCK_MODE = process.env.MOCK_MODE === 'true' || !process.env.GRPC_HOST;

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  duration: number;
}

const results: TestResult[] = [];

// Helper pour executer un test
async function runTest(name: string, fn: () => Promise<void>): Promise<void> {
  const start = Date.now();
  try {
    await fn();
    results.push({ name, passed: true, duration: Date.now() - start });
    console.log(`  [PASS] ${name}`);
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    results.push({ name, passed: false, error: errorMsg, duration: Date.now() - start });
    console.log(`  [FAIL] ${name}: ${errorMsg}`);
  }
}

// ==========================================
// Tests de chargement des proto
// ==========================================
console.log('\n=== Tests de chargement des fichiers proto ===\n');

const PROTO_FILES = [
  'clients/clients.proto',
  'payments/payment.proto',
  'contrats/contrats.proto',
  'organisations/organisations.proto',
  'organisations/users.proto',
  'calendar/calendar.proto',
  'retry/am04_retry_service.proto',
  'dashboard/dashboard.proto',
  'factures/factures.proto',
  'notifications/notifications.proto',
];

async function testProtoLoading(): Promise<void> {
  for (const protoFile of PROTO_FILES) {
    await runTest(`Charger ${protoFile}`, async () => {
      const protoPath = path.join(PROTO_BASE_DIR, protoFile);
      
      if (!fs.existsSync(protoPath)) {
        throw new Error(`Fichier proto non trouve: ${protoPath}`);
      }
      
      const packageDefinition = protoLoader.loadSync(protoPath, {
        keepCase: true,
        longs: String,
        enums: String,
        defaults: true,
        oneofs: true,
        includeDirs: [PROTO_BASE_DIR],
      });
      
      const grpcObject = grpc.loadPackageDefinition(packageDefinition);
      
      if (!grpcObject) {
        throw new Error('Echec du chargement du package gRPC');
      }
    });
  }
}

// ==========================================
// Tests de creation de clients gRPC
// ==========================================
console.log('\n=== Tests de creation de clients gRPC ===\n');

interface ServiceTestConfig {
  name: string;
  protoFile: string;
  packageName: string;
  serviceName: string;
  defaultPort: number;
}

const SERVICES: ServiceTestConfig[] = [
  { name: 'clients', protoFile: 'clients/clients.proto', packageName: 'clients', serviceName: 'ClientBaseService', defaultPort: 50052 },
  { name: 'payments', protoFile: 'payments/payment.proto', packageName: 'payment', serviceName: 'PaymentService', defaultPort: 50063 },
  { name: 'calendar', protoFile: 'calendar/calendar.proto', packageName: 'calendar', serviceName: 'CalendarEngineService', defaultPort: 50068 },
  { name: 'retry', protoFile: 'retry/am04_retry_service.proto', packageName: 'retry', serviceName: 'RetryAdminService', defaultPort: 50070 },
];

async function testClientCreation(): Promise<void> {
  for (const service of SERVICES) {
    await runTest(`Creer client ${service.name}`, async () => {
      const protoPath = path.join(PROTO_BASE_DIR, service.protoFile);
      
      const packageDefinition = protoLoader.loadSync(protoPath, {
        keepCase: true,
        longs: String,
        enums: String,
        defaults: true,
        oneofs: true,
        includeDirs: [PROTO_BASE_DIR],
      });
      
      const grpcObject = grpc.loadPackageDefinition(packageDefinition) as any;
      
      // Naviguer vers le service dans le package
      const packageParts = service.packageName.split('.');
      let current = grpcObject;
      for (const part of packageParts) {
        current = current[part];
        if (!current) {
          throw new Error(`Package ${part} non trouve dans ${service.packageName}`);
        }
      }
      
      const ServiceClass = current[service.serviceName];
      if (!ServiceClass) {
        throw new Error(`Service ${service.serviceName} non trouve dans le package ${service.packageName}`);
      }
      
      // Creer le client (sans connexion reelle en mode mock)
      const url = `localhost:${service.defaultPort}`;
      const client = new ServiceClass(url, grpc.credentials.createInsecure());
      
      if (!client) {
        throw new Error('Echec de creation du client');
      }
      
      // Fermer le client
      client.close();
    });
  }
}

// ==========================================
// Tests de connectivite (si services demarres)
// ==========================================
async function testConnectivity(): Promise<void> {
  if (MOCK_MODE) {
    console.log('\n=== Tests de connectivite (IGNORES en mode mock) ===\n');
    console.log('  [SKIP] Demarrer les services et definir GRPC_HOST pour executer ces tests');
    return;
  }
  
  console.log('\n=== Tests de connectivite ===\n');
  
  const host = process.env.GRPC_HOST || 'localhost';
  
  for (const service of SERVICES) {
    await runTest(`Ping ${service.name}`, async () => {
      const protoPath = path.join(PROTO_BASE_DIR, service.protoFile);
      
      const packageDefinition = protoLoader.loadSync(protoPath, {
        keepCase: true,
        longs: String,
        enums: String,
        defaults: true,
        oneofs: true,
        includeDirs: [PROTO_BASE_DIR],
      });
      
      const grpcObject = grpc.loadPackageDefinition(packageDefinition) as any;
      
      const packageParts = service.packageName.split('.');
      let current = grpcObject;
      for (const part of packageParts) {
        current = current[part];
      }
      
      const ServiceClass = current[service.serviceName];
      const url = `${host}:${service.defaultPort}`;
      const client = new ServiceClass(url, grpc.credentials.createInsecure());
      
      // Tenter une connexion avec timeout
      await new Promise<void>((resolve, reject) => {
        const deadline = new Date();
        deadline.setSeconds(deadline.getSeconds() + 5);
        
        client.waitForReady(deadline, (error: Error | undefined) => {
          client.close();
          if (error) {
            reject(new Error(`Connexion echouee: ${error.message}`));
          } else {
            resolve();
          }
        });
      });
    });
  }
}

// ==========================================
// Execution des tests
// ==========================================
async function main(): Promise<void> {
  console.log('==========================================');
  console.log('  Tests E2E - Communication gRPC');
  console.log('==========================================');
  console.log(`Mode: ${MOCK_MODE ? 'Mock (chargement uniquement)' : 'Connectivite complete'}`);
  
  await testProtoLoading();
  await testClientCreation();
  await testConnectivity();
  
  // Resume
  console.log('\n==========================================');
  console.log('  Resume');
  console.log('==========================================\n');
  
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  const total = results.length;
  
  console.log(`Total: ${total} tests`);
  console.log(`Passes: ${passed}`);
  console.log(`Echecs: ${failed}`);
  
  if (failed > 0) {
    console.log('\nTests echoues:');
    results.filter(r => !r.passed).forEach(r => {
      console.log(`  - ${r.name}: ${r.error}`);
    });
    process.exit(1);
  }
  
  console.log('\nTous les tests sont passes!');
}

main().catch(console.error);
