# gRPC Testing Guide

This guide explains how to test your gRPC services using various tools and methods.

## Table of Contents

1. [Testing with grpcurl](#testing-with-grpcurl)
2. [Testing with BloomRPC / Postman](#testing-with-bloomrpc--postman)
3. [Unit Testing (Jest)](#unit-testing-jest)
4. [Integration Testing](#integration-testing)
5. [Load Testing](#load-testing)

## Testing with grpcurl

grpcurl is a command-line tool for interacting with gRPC servers.

### Installation

```bash
# macOS
brew install grpcurl

# Linux
go install github.com/fullstorydev/grpcurl/cmd/grpcurl@latest

# Or download binary from: https://github.com/fullstorydev/grpcurl/releases
```

### Basic Commands

**List all services:**
```bash
grpcurl -plaintext localhost:50051 list
```

**List methods of a service:**
```bash
grpcurl -plaintext localhost:50051 list payment.PaymentService
```

**Describe a method:**
```bash
grpcurl -plaintext localhost:50051 describe payment.PaymentService.CreateStripeCheckoutSession
```

### Example Requests

**1. Create Stripe Checkout Session:**
```bash
grpcurl -plaintext \
  -d '{
    "societeId": "123",
    "amount": 2000,
    "currency": "eur",
    "mode": "payment",
    "successUrl": "https://example.com/success",
    "cancelUrl": "https://example.com/cancel"
  }' \
  localhost:50051 \
  payment.PaymentService/CreateStripeCheckoutSession
```

**2. Create PayPal Order:**
```bash
grpcurl -plaintext \
  -d '{
    "societeId": "123",
    "intent": "CAPTURE",
    "purchaseUnits": [
      {
        "amount": 2999,
        "currency": "EUR",
        "description": "Test purchase"
      }
    ],
    "returnUrl": "https://example.com/success",
    "cancelUrl": "https://example.com/cancel"
  }' \
  localhost:50051 \
  payment.PaymentService/CreatePayPalOrder
```

**3. Setup GoCardless Mandate:**
```bash
grpcurl -plaintext \
  -d '{
    "clientId": "client-123",
    "societeId": "societe-456",
    "scheme": "sepa_core",
    "successRedirectUrl": "https://example.com/mandate-success"
  }' \
  localhost:50051 \
  payment.PaymentService/SetupGoCardlessMandate
```

**4. Create Invoice:**
```bash
grpcurl -plaintext \
  -d '{
    "customerName": "John Doe",
    "customerEmail": "john@example.com",
    "customerAddress": "123 Main St",
    "issueDate": "2024-01-15T10:00:00Z",
    "dueDate": "2024-02-15T10:00:00Z",
    "paymentTermsDays": 30,
    "items": [
      {
        "description": "Consulting Services",
        "quantity": 1,
        "unit": "hour",
        "unitPriceHT": 100,
        "vatRate": 20,
        "discount": 0
      }
    ]
  }' \
  localhost:50052 \
  invoice.InvoiceService/CreateInvoice
```

**5. Track Shipment:**
```bash
grpcurl -plaintext \
  -d '{
    "trackingNumber": "1234567890"
  }' \
  localhost:50053 \
  logistics.LogisticsService/TrackShipment
```

**6. Send Email:**
```bash
grpcurl -plaintext \
  -d '{
    "mailboxId": "mailbox-123",
    "to": [{"email": "recipient@example.com"}],
    "subject": "Test Email",
    "htmlBody": "<h1>Hello</h1><p>This is a test email.</p>"
  }' \
  localhost:50054 \
  email.EmailService/SendEmail
```

**7. Create Notification:**
```bash
grpcurl -plaintext \
  -d '{
    "organisationId": "org-123",
    "utilisateurId": "user-456",
    "type": 9,
    "titre": "Test Notification",
    "message": "This is a test notification",
    "broadcastWebsocket": true
  }' \
  localhost:50055 \
  notifications.NotificationService/CreateNotification
```

**8. Calculate Commission:**
```bash
grpcurl -plaintext \
  -d '{
    "organisationId": "org-123",
    "apporteurId": "apporteur-456",
    "contratId": "contrat-789",
    "typeProduit": "ASSURANCE_VIE",
    "profilRemuneration": "STANDARD",
    "montantBase": "10000.00",
    "periode": "2024-01"
  }' \
  localhost:50056 \
  commission.CommissionService/CalculerCommission
```

## Testing with BloomRPC / Postman

### BloomRPC (Recommended for gRPC)

1. Download from: https://github.com/bloomrpc/bloomrpc/releases
2. Import proto files from `/proto` directory
3. Set server URL (e.g., `localhost:50051`)
4. Fill in request fields in the GUI
5. Click "Play" to send request

### Postman (v8.5+)

1. Create new gRPC request
2. Enter server URL: `localhost:50051`
3. Import proto file
4. Select service and method
5. Fill in request body
6. Click "Invoke"

## Unit Testing (Jest)

### Frontend Tests (React + Jest)

```typescript
// payment.test.ts
import { createPromiseClient } from "@connectrpc/connect";
import { createGrpcWebTransport } from "@connectrpc/connect-web";
import { PaymentService } from "./gen/payment_connect";

describe('PaymentService', () => {
  let client: ReturnType<typeof createPromiseClient<typeof PaymentService>>;

  beforeAll(() => {
    const transport = createGrpcWebTransport({
      baseUrl: "http://localhost:3000",
    });
    client = createPromiseClient(PaymentService, transport);
  });

  it('should create Stripe checkout session', async () => {
    const response = await client.createStripeCheckoutSession({
      societeId: "test-123",
      amount: 2000,
      currency: "eur",
      mode: "payment",
      successUrl: "https://example.com/success",
      cancelUrl: "https://example.com/cancel",
    });

    expect(response.id).toBeDefined();
    expect(response.url).toContain('checkout.stripe.com');
  });

  it('should handle errors gracefully', async () => {
    await expect(
      client.createStripeCheckoutSession({
        societeId: "",
        amount: -100,
        currency: "invalid",
        mode: "payment",
        successUrl: "",
        cancelUrl: "",
      })
    ).rejects.toThrow();
  });
});
```

### Backend Tests (NestJS + Jest)

```typescript
// payment.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { PaymentClientService } from './payment-client.service';
import { ClientsModule, Transport } from '@nestjs/microservices';

describe('PaymentClientService', () => {
  let service: PaymentClientService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ClientsModule.register([
          {
            name: 'PAYMENT_PACKAGE',
            transport: Transport.GRPC,
            options: {
              package: 'payment',
              protoPath: join(__dirname, '../proto/payment.proto'),
              url: 'localhost:50051',
            },
          },
        ]),
      ],
      providers: [PaymentClientService],
    }).compile();

    service = module.get<PaymentClientService>(PaymentClientService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create Stripe checkout', async () => {
    const result = await service.createStripeCheckout({
      societeId: 'test-123',
      amount: 2000,
      currency: 'eur',
      mode: 'payment',
      successUrl: 'https://example.com/success',
      cancelUrl: 'https://example.com/cancel',
    });

    expect(result).toBeDefined();
    expect(result.url).toBeDefined();
  });
});
```

## Integration Testing

### E2E Test Example

```typescript
// payment.e2e.spec.ts
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Payment API (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/payments/stripe/checkout (POST)', () => {
    return request(app.getHttpServer())
      .post('/payments/stripe/checkout')
      .send({
        societeId: 'test-123',
        amount: 2000,
        currency: 'eur',
        mode: 'payment',
        successUrl: 'https://example.com/success',
        cancelUrl: 'https://example.com/cancel',
      })
      .expect(201)
      .expect((res) => {
        expect(res.body.url).toBeDefined();
        expect(res.body.url).toContain('stripe.com');
      });
  });
});
```

## Load Testing

### Using ghz (gRPC benchmarking tool)

**Installation:**
```bash
go install github.com/bojand/ghz/cmd/ghz@latest
```

**Simple load test:**
```bash
ghz --insecure \
  --proto payment.proto \
  --call payment.PaymentService/CreateStripeCheckoutSession \
  -d '{
    "societeId": "test-123",
    "amount": 2000,
    "currency": "eur",
    "mode": "payment",
    "successUrl": "https://example.com/success",
    "cancelUrl": "https://example.com/cancel"
  }' \
  -n 1000 \
  -c 10 \
  localhost:50051
```

**Parameters:**
- `-n 1000`: Total number of requests
- `-c 10`: Number of concurrent connections
- `--insecure`: Skip TLS verification

## Mock Testing

### Creating Mock gRPC Server

```typescript
// mock-grpc-server.ts
import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';

const packageDefinition = protoLoader.loadSync('proto/payment.proto', {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const proto = grpc.loadPackageDefinition(packageDefinition);

function createMockServer() {
  const server = new grpc.Server();

  server.addService(proto.payment.PaymentService.service, {
    CreateStripeCheckoutSession: (call, callback) => {
      callback(null, {
        id: 'mock_session_123',
        url: 'https://mock-checkout-url.com',
        status: 'open',
        paymentStatus: 'unpaid',
      });
    },
  });

  server.bindAsync(
    '0.0.0.0:50051',
    grpc.ServerCredentials.createInsecure(),
    (err, port) => {
      if (err) throw err;
      console.log(`Mock server listening on port ${port}`);
      server.start();
    }
  );
}

createMockServer();
```

## CI/CD Integration

### GitHub Actions Example

```yaml
# .github/workflows/test-grpc.yml
name: gRPC Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      payment-service:
        image: your-payment-service:latest
        ports:
          - 50051:50051

    steps:
      - uses: actions/checkout@v3

      - name: Install grpcurl
        run: |
          curl -sSL "https://github.com/fullstorydev/grpcurl/releases/download/v1.8.7/grpcurl_1.8.7_linux_x86_64.tar.gz" | tar -xz
          sudo mv grpcurl /usr/local/bin/

      - name: Test Payment Service
        run: |
          grpcurl -plaintext localhost:50051 list
          grpcurl -plaintext -d '{"societeId":"test"}' localhost:50051 payment.PaymentService/CreateStripeCheckoutSession

      - name: Run Jest Tests
        run: npm test
```

## Debugging Tips

1. **Enable gRPC logging:**
   ```bash
   export GRPC_TRACE=all
   export GRPC_VERBOSITY=debug
   ```

2. **Check service health:**
   ```bash
   grpcurl -plaintext localhost:50051 grpc.health.v1.Health/Check
   ```

3. **Inspect proto reflection:**
   ```bash
   grpcurl -plaintext localhost:50051 describe
   ```

4. **Test with invalid data:**
   ```bash
   grpcurl -plaintext -d '{}' localhost:50051 payment.PaymentService/CreateStripeCheckoutSession
   ```

## Best Practices

1. **Always test error cases** - Don't just test happy paths
2. **Use meaningful test data** - Make it easy to debug failures
3. **Mock external services** - Don't call real Stripe/PayPal in tests
4. **Test timeout scenarios** - Ensure proper error handling
5. **Validate proto schemas** - Use `buf lint` before testing
6. **Test backwards compatibility** - Ensure old clients still work
7. **Load test before production** - Identify bottlenecks early

## Resources

- [grpcurl Documentation](https://github.com/fullstorydev/grpcurl)
- [BloomRPC](https://github.com/bloomrpc/bloomrpc)
- [ghz Load Testing](https://ghz.sh/)
- [NestJS Testing](https://docs.nestjs.com/fundamentals/testing)
- [Jest Documentation](https://jestjs.io/docs/getting-started)
