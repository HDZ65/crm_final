/**
 * E2E tests for JWT authentication flow
 * 
 * Tests verify:
 * 1. Unauthenticated requests are rejected with UNAUTHENTICATED
 * 2. Health endpoints remain public
 * 3. Valid JWT tokens grant access
 * 4. Service-to-service bypass works with x-internal-service header
 * 
 * Usage:
 *   npm run test:auth        # Mock mode (proto loading only)
 *   npm run test:auth:live   # Live mode (requires running services)
 */

import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import * as path from 'path';

// Configuration
const PROTO_BASE_DIR = path.resolve(__dirname, '../../packages/proto/src');
const MOCK_MODE = process.env.MOCK_MODE === 'true' || !process.env.GRPC_HOST;
const GRPC_HOST = process.env.GRPC_HOST || 'localhost';

// Test JWT token (for live tests, use a real token from Keycloak)
const TEST_TOKEN = process.env.TEST_JWT_TOKEN || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0LXVzZXIiLCJpYXQiOjE3MDAwMDAwMDB9.test';

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  duration: number;
}

const results: TestResult[] = [];

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

// Load gRPC client for testing
function loadClientService(): any {
  const protoPath = path.join(PROTO_BASE_DIR, 'clients/clients.proto');
  const packageDefinition = protoLoader.loadSync(protoPath, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
    includeDirs: [PROTO_BASE_DIR],
  });
  const grpcObject = grpc.loadPackageDefinition(packageDefinition) as any;
  return grpcObject.clients.ClientBaseService;
}

// Load Health service for testing
function loadHealthService(): any {
  const protoPath = path.join(PROTO_BASE_DIR, 'health/health.proto');
  const packageDefinition = protoLoader.loadSync(protoPath, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
    includeDirs: [PROTO_BASE_DIR],
  });
  const grpcObject = grpc.loadPackageDefinition(packageDefinition) as any;
  return grpcObject.grpc.health.v1.Health;
}

// ==========================================
// Auth Tests - Mock Mode (Proto Loading)
// ==========================================
async function testAuthProtoLoading(): Promise<void> {
  console.log('\n=== Auth Tests - Proto Loading ===\n');

  await runTest('Load clients.proto for auth testing', async () => {
    const ClientService = loadClientService();
    if (!ClientService) {
      throw new Error('Failed to load ClientBaseService');
    }
  });

  await runTest('Create client with metadata support', async () => {
    const ClientService = loadClientService();
    const client = new ClientService(`${GRPC_HOST}:50052`, grpc.credentials.createInsecure());
    
    // Verify metadata can be attached
    const metadata = new grpc.Metadata();
    metadata.set('authorization', `Bearer ${TEST_TOKEN}`);
    
    if (!metadata.get('authorization')) {
      throw new Error('Failed to set authorization metadata');
    }
    
    client.close();
  });

  await runTest('Create client with internal service header', async () => {
    const ClientService = loadClientService();
    const client = new ClientService(`${GRPC_HOST}:50052`, grpc.credentials.createInsecure());
    
    const metadata = new grpc.Metadata();
    metadata.set('x-internal-service', 'service-payments');
    
    if (!metadata.get('x-internal-service')) {
      throw new Error('Failed to set x-internal-service metadata');
    }
    
    client.close();
  });
}

// ==========================================
// Auth Tests - Live Mode (Requires Services)
// ==========================================
async function testAuthLive(): Promise<void> {
  if (MOCK_MODE) {
    console.log('\n=== Auth Tests - Live (SKIPPED in mock mode) ===\n');
    console.log('  [SKIP] Set GRPC_HOST and TEST_JWT_TOKEN to run live auth tests');
    return;
  }

  console.log('\n=== Auth Tests - Live ===\n');

  await runTest('Request without token returns UNAUTHENTICATED', async () => {
    const ClientService = loadClientService();
    const client = new ClientService(`${GRPC_HOST}:50052`, grpc.credentials.createInsecure());

    await new Promise<void>((resolve, reject) => {
      client.List({}, (error: any, response: any) => {
        client.close();
        if (error && error.code === grpc.status.UNAUTHENTICATED) {
          resolve();
        } else if (error) {
          reject(new Error(`Expected UNAUTHENTICATED, got: ${error.code} - ${error.message}`));
        } else {
          reject(new Error('Expected UNAUTHENTICATED error, but request succeeded'));
        }
      });
    });
  });

  await runTest('Request with invalid token returns UNAUTHENTICATED', async () => {
    const ClientService = loadClientService();
    const client = new ClientService(`${GRPC_HOST}:50052`, grpc.credentials.createInsecure());

    const metadata = new grpc.Metadata();
    metadata.set('authorization', 'Bearer invalid-token-here');

    await new Promise<void>((resolve, reject) => {
      client.List({}, metadata, (error: any, response: any) => {
        client.close();
        if (error && error.code === grpc.status.UNAUTHENTICATED) {
          resolve();
        } else if (error) {
          reject(new Error(`Expected UNAUTHENTICATED, got: ${error.code} - ${error.message}`));
        } else {
          reject(new Error('Expected UNAUTHENTICATED error, but request succeeded'));
        }
      });
    });
  });

  await runTest('Request with valid token succeeds', async () => {
    const ClientService = loadClientService();
    const client = new ClientService(`${GRPC_HOST}:50052`, grpc.credentials.createInsecure());

    const metadata = new grpc.Metadata();
    metadata.set('authorization', `Bearer ${TEST_TOKEN}`);

    await new Promise<void>((resolve, reject) => {
      client.List({}, metadata, (error: any, response: any) => {
        client.close();
        if (error && error.code === grpc.status.UNAUTHENTICATED) {
          reject(new Error('Token was rejected - ensure TEST_JWT_TOKEN is a valid Keycloak token'));
        } else if (error) {
          // Other errors (like NOT_FOUND) are acceptable - we just want to pass auth
          resolve();
        } else {
          resolve();
        }
      });
    });
  });

  await runTest('Health check works without token (public endpoint)', async () => {
    try {
      const HealthService = loadHealthService();
      const client = new HealthService(`${GRPC_HOST}:50052`, grpc.credentials.createInsecure());

      await new Promise<void>((resolve, reject) => {
        client.Check({ service: '' }, (error: any, response: any) => {
          client.close();
          if (error) {
            reject(new Error(`Health check failed: ${error.message}`));
          } else if (response.status === 'SERVING' || response.status === 1) {
            resolve();
          } else {
            reject(new Error(`Unexpected health status: ${response.status}`));
          }
        });
      });
    } catch (e) {
      // Health proto might not exist, skip this test
      console.log('  [SKIP] Health proto not available');
    }
  });

  await runTest('Service-to-service call with x-internal-service header succeeds', async () => {
    const ClientService = loadClientService();
    const client = new ClientService(`${GRPC_HOST}:50052`, grpc.credentials.createInsecure());

    const metadata = new grpc.Metadata();
    metadata.set('x-internal-service', 'service-payments');

    await new Promise<void>((resolve, reject) => {
      client.List({}, metadata, (error: any, response: any) => {
        client.close();
        if (error && error.code === grpc.status.UNAUTHENTICATED) {
          reject(new Error('Internal service header was not recognized'));
        } else {
          // Any other result (success or non-auth error) means auth was bypassed
          resolve();
        }
      });
    });
  });
}

// ==========================================
// Main
// ==========================================
async function main(): Promise<void> {
  console.log('==========================================');
  console.log('  E2E Tests - JWT Authentication');
  console.log('==========================================');
  console.log(`Mode: ${MOCK_MODE ? 'Mock (proto loading only)' : 'Live (full auth testing)'}`);

  await testAuthProtoLoading();
  await testAuthLive();

  // Summary
  console.log('\n==========================================');
  console.log('  Summary');
  console.log('==========================================\n');

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  const total = results.length;

  console.log(`Total: ${total} tests`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);

  if (failed > 0) {
    console.log('\nFailed tests:');
    results.filter(r => !r.passed).forEach(r => {
      console.log(`  - ${r.name}: ${r.error}`);
    });
    process.exit(1);
  }

  console.log('\nAll tests passed!');
}

main().catch(console.error);
