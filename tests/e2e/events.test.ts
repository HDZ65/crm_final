import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import * as path from 'path';
import * as fs from 'fs';

const PROTO_BASE_DIR = path.resolve(__dirname, '../../packages/proto/src');
const MOCK_MODE = process.env.MOCK_MODE === 'true' || !process.env.NATS_URL;

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

const EVENT_PROTOS = [
  'events/client_events.proto',
  'events/invoice_events.proto',
  'events/payment_events.proto',
  'events/contract_events.proto',
];

const EVENTS = [
  { name: 'client.created', subject: 'crm.events.client.created', proto: 'events/client_events.proto' },
  { name: 'invoice.created', subject: 'crm.events.invoice.created', proto: 'events/invoice_events.proto' },
  { name: 'payment.received', subject: 'crm.events.payment.received', proto: 'events/payment_events.proto' },
  { name: 'payment.rejected', subject: 'crm.events.payment.rejected', proto: 'events/payment_events.proto' },
  { name: 'contract.signed', subject: 'crm.events.contract.signed', proto: 'events/contract_events.proto' },
];

async function testEventProtoLoading(): Promise<void> {
  console.log('\n=== Event Proto Loading Tests ===\n');

  for (const protoFile of EVENT_PROTOS) {
    await runTest(`Load ${protoFile}`, async () => {
      const protoPath = path.join(PROTO_BASE_DIR, protoFile);
      
      if (!fs.existsSync(protoPath)) {
        throw new Error(`Proto file not found: ${protoPath}`);
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
        throw new Error('Failed to load gRPC package');
      }
    });
  }
}

async function testEventSchemaStructure(): Promise<void> {
  console.log('\n=== Event Schema Structure Tests ===\n');

  for (const event of EVENTS) {
    await runTest(`Verify ${event.name} schema structure`, async () => {
      const protoPath = path.join(PROTO_BASE_DIR, event.proto);
      
      if (!fs.existsSync(protoPath)) {
        throw new Error(`Proto file not found: ${protoPath}`);
      }

      const content = fs.readFileSync(protoPath, 'utf-8');
      
      if (!content.includes('event_id')) {
        throw new Error('Missing event_id field');
      }
      if (!content.includes('timestamp')) {
        throw new Error('Missing timestamp field');
      }
    });
  }
}

async function testEventSubjects(): Promise<void> {
  console.log('\n=== Event Subject Configuration Tests ===\n');

  for (const event of EVENTS) {
    await runTest(`Verify ${event.name} subject format`, async () => {
      if (!event.subject.startsWith('crm.events.')) {
        throw new Error(`Invalid subject prefix: ${event.subject}`);
      }
      
      const parts = event.subject.split('.');
      if (parts.length !== 3) {
        throw new Error(`Invalid subject format: ${event.subject}`);
      }
    });
  }
}

async function testNatsConnectivity(): Promise<void> {
  if (MOCK_MODE) {
    console.log('\n=== NATS Connectivity Tests (SKIPPED in mock mode) ===\n');
    console.log('  [SKIP] Set NATS_URL to run live NATS tests');
    return;
  }

  console.log('\n=== NATS Connectivity Tests ===\n');

  await runTest('Connect to NATS server', async () => {
    const { connect } = await import('nats');
    const nc = await connect({ servers: process.env.NATS_URL });
    await nc.close();
  });

  await runTest('Publish and subscribe to test event', async () => {
    const { connect, StringCodec } = await import('nats');
    const nc = await connect({ servers: process.env.NATS_URL });
    const sc = StringCodec();
    
    const testSubject = 'crm.events.test';
    const testPayload = JSON.stringify({ test: true, timestamp: Date.now() });
    
    const sub = nc.subscribe(testSubject, { max: 1 });
    
    nc.publish(testSubject, sc.encode(testPayload));
    
    for await (const msg of sub) {
      const received = sc.decode(msg.data);
      if (received !== testPayload) {
        throw new Error('Payload mismatch');
      }
      break;
    }
    
    await nc.close();
  });
}

async function main(): Promise<void> {
  console.log('==========================================');
  console.log('  E2E Tests - NATS Event Architecture');
  console.log('==========================================');
  console.log(`Mode: ${MOCK_MODE ? 'Mock (proto loading only)' : 'Live (NATS connectivity)'}`);

  await testEventProtoLoading();
  await testEventSchemaStructure();
  await testEventSubjects();
  await testNatsConnectivity();

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
