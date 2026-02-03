# Testing & Smoke Recipes

## Philosophie
**Minimum test non négociable** : Au moins 1 test de non-régression OU 1 smoke test scripté.

---

## 1) Test unitaire ciblé (Aggregate)

### Quand l'utiliser
- Modification d'un invariant dans l'aggregate
- Ajout d'une nouvelle méthode business
- Changement de logique métier

### Pattern
```typescript
// test/domain/invoice.aggregate.spec.ts
describe('Invoice Aggregate', () => {
  describe('create', () => {
    it('should create invoice with valid data', () => {
      const invoice = Invoice.create('user_123', 'Invoice 001', 10000);

      expect(invoice.getId()).toBeDefined();
      expect(invoice.getName()).toBe('Invoice 001');
      expect(invoice.getAmount()).toBe(10000);
      expect(invoice.getStatus()).toBe(InvoiceStatus.DRAFT);
    });

    it('should throw if amount is negative', () => {
      expect(() => Invoice.create('user_123', 'Test', -100))
        .toThrow('amount cannot be negative');
    });

    it('should emit InvoiceCreatedEvent', () => {
      const invoice = Invoice.create('user_123', 'Test', 10000);
      const events = invoice.getUncommittedEvents();

      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(InvoiceCreatedEvent);
    });
  });

  describe('issue', () => {
    it('should change status from DRAFT to ISSUED', () => {
      const invoice = Invoice.create('user_123', 'Test', 10000);

      invoice.issue();

      expect(invoice.getStatus()).toBe(InvoiceStatus.ISSUED);
    });

    it('should throw if not in DRAFT status', () => {
      const invoice = Invoice.create('user_123', 'Test', 10000);
      invoice.issue();

      expect(() => invoice.issue())
        .toThrow('Can only issue draft invoices');
    });
  });
});
```

---

## 2) Test d'intégration (Handler)

### Quand l'utiliser
- Modification d'un handler
- Changement de flow applicatif
- Ajout d'un nouveau command/query

### Pattern avec TestingModule
```typescript
// test/application/create-invoice.handler.spec.ts
describe('CreateInvoiceHandler', () => {
  let handler: CreateInvoiceHandler;
  let repository: jest.Mocked<InvoiceRepository>;
  let eventBus: jest.Mocked<EventBus>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        CreateInvoiceHandler,
        {
          provide: 'INVOICE_REPOSITORY',
          useValue: {
            save: jest.fn(),
            findById: jest.fn(),
          },
        },
        {
          provide: EventBus,
          useValue: {
            publish: jest.fn(),
          },
        },
      ],
    }).compile();

    handler = module.get(CreateInvoiceHandler);
    repository = module.get('INVOICE_REPOSITORY');
    eventBus = module.get(EventBus);
  });

  it('should create invoice and return id', async () => {
    const command = new CreateInvoiceCommand('user_123', 'Test Invoice', 10000);

    const result = await handler.execute(command);

    expect(result).toBeDefined();
    expect(repository.save).toHaveBeenCalledTimes(1);
    expect(eventBus.publish).toHaveBeenCalled();
  });

  it('should throw if repository fails', async () => {
    repository.save.mockRejectedValue(new Error('DB error'));
    const command = new CreateInvoiceCommand('user_123', 'Test', 10000);

    await expect(handler.execute(command)).rejects.toThrow('DB error');
  });
});
```

---

## 3) Golden Test (Replay payloads)

### Quand l'utiliser
- Modification d'un consumer NATS
- Changement de parsing/mapping
- Refactor d'un handler

### Pattern
```typescript
// test/golden/payment-events.listener.spec.ts
import * as fixtures from './fixtures/payment-events.json';

describe('PaymentEventsListener (Golden)', () => {
  let listener: PaymentEventsListener;
  let commandBus: jest.Mocked<CommandBus>;

  beforeEach(async () => {
    // Setup...
  });

  // Rejouer des payloads réels
  fixtures.forEach((fixture, index) => {
    it(`should handle real payload #${index + 1}`, async () => {
      await listener.handlePaymentReceived(fixture.input);

      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.objectContaining(fixture.expectedCommand)
      );
    });
  });
});
```

### Fichier fixtures
```json
// test/golden/fixtures/payment-events.json
[
  {
    "description": "Standard payment",
    "input": {
      "id": "evt_123",
      "type": "payments.payment.received",
      "aggregateId": "pay_456",
      "data": {
        "invoiceId": "inv_789",
        "amount": 10000
      }
    },
    "expectedCommand": {
      "invoiceId": "inv_789"
    }
  },
  {
    "description": "Payment without invoiceId (should ignore)",
    "input": {
      "id": "evt_124",
      "type": "payments.payment.received",
      "data": {}
    },
    "expectedCommand": null
  }
]
```

---

## 4) Contract Test (Proto/Events)

### Quand l'utiliser
- Modification de proto
- Modification de structure d'event
- Ajout/suppression de champs

### Pattern Proto
```typescript
// test/contract/proto-compat.spec.ts
import { CreateInvoiceRequest } from '../proto/generated/billing_commands';

describe('Proto Compatibility', () => {
  it('should serialize/deserialize with new fields', () => {
    const request: CreateInvoiceRequest = {
      userId: 'user_123',
      name: 'Test',
      amountCents: 10000,  // Nouveau champ
    };

    // Encode
    const buffer = CreateInvoiceRequest.encode(request).finish();

    // Decode
    const decoded = CreateInvoiceRequest.decode(buffer);

    expect(decoded.userId).toBe('user_123');
    expect(decoded.name).toBe('Test');
    expect(decoded.amountCents).toBe(10000);
  });

  it('should handle missing optional fields (backward compat)', () => {
    // Ancien format sans amountCents
    const oldRequest = {
      userId: 'user_123',
      name: 'Test',
    };

    const buffer = CreateInvoiceRequest.encode(oldRequest as any).finish();
    const decoded = CreateInvoiceRequest.decode(buffer);

    expect(decoded.userId).toBe('user_123');
    expect(decoded.amountCents).toBe(0);  // Valeur par défaut
  });
});
```

### Pattern Event
```typescript
// test/contract/event-compat.spec.ts
describe('Event Compatibility', () => {
  it('should parse old event format', () => {
    const oldEvent = {
      id: 'evt_123',
      type: 'billing.invoice.created',
      aggregateId: 'inv_456',
      data: {
        invoiceNumber: 'INV-001',
        customerId: 'cust_789',
        // PAS de amountCents (ancien format)
      },
    };

    const result = parseInvoiceCreatedEvent(oldEvent);

    expect(result.invoiceNumber).toBe('INV-001');
    expect(result.amountCents).toBe(0);  // Fallback
  });

  it('should parse new event format', () => {
    const newEvent = {
      id: 'evt_123',
      type: 'billing.invoice.created',
      aggregateId: 'inv_456',
      data: {
        invoiceNumber: 'INV-001',
        customerId: 'cust_789',
        amountCents: 10000,  // Nouveau champ
      },
    };

    const result = parseInvoiceCreatedEvent(newEvent);

    expect(result.amountCents).toBe(10000);
  });
});
```

---

## 5) Golden Master (Refactor)

### Quand l'utiliser
- Refactor local sans changement de comportement
- Réorganisation de code
- Optimisation

### Pattern
```typescript
// test/golden-master/invoice-service.spec.ts
describe('Invoice Service (Golden Master)', () => {
  const testCases = [
    { input: { userId: 'u1', name: 'Test', amount: 100 }, snapshot: 'create-1' },
    { input: { userId: 'u2', name: 'Invoice 2', amount: 0 }, snapshot: 'create-2' },
    // ...
  ];

  testCases.forEach(({ input, snapshot }) => {
    it(`should match snapshot: ${snapshot}`, async () => {
      const result = await invoiceService.create(input);

      // Avant refactor : générer les snapshots
      // Après refactor : vérifier les snapshots
      expect(result).toMatchSnapshot(snapshot);
    });
  });
});
```

### Workflow
1. **Avant refactor** : Générer les snapshots
   ```bash
   npm run test -- --updateSnapshot
   ```

2. **Refactor** : Modifier le code

3. **Après refactor** : Vérifier que les outputs sont identiques
   ```bash
   npm run test
   ```

---

## 6) Smoke Test Docker

### Quand l'utiliser
- Modification d'infrastructure
- Changement de config
- Après toute modification significative

### Script minimal
```bash
#!/bin/bash
# scripts/smoke-test.sh

set -e

SERVICE_NAME=$1
GRPC_PORT=${2:-50054}

echo "=== Smoke Test: $SERVICE_NAME ==="

# 1. Build
echo "Building..."
docker compose build $SERVICE_NAME

# 2. Start
echo "Starting..."
docker compose up -d $SERVICE_NAME

# 3. Wait for healthy
echo "Waiting for health..."
sleep 5

# 4. Health check gRPC
echo "Checking gRPC..."
grpcurl -plaintext localhost:$GRPC_PORT grpc.health.v1.Health/Check

# 5. List services
echo "Listing services..."
grpcurl -plaintext localhost:$GRPC_PORT list

# 6. Test simple call (optional)
echo "Test call..."
grpcurl -plaintext -d '{"page": 1, "pageSize": 10}' \
  localhost:$GRPC_PORT winaity.billing.queries.BillingQueriesService/ListInvoices || true

echo "=== Smoke Test PASSED ==="
```

### Usage
```bash
./scripts/smoke-test.sh billing-service 50054
```

---

## 7) Checklist non-régression

### Avant modification
```bash
# 1. Tests existants passent
npm run test

# 2. Build OK
npm run build

# 3. Lint OK
npm run lint
```

### Après modification
```bash
# 1. Mêmes commandes qu'avant
npm run test
npm run build
npm run lint

# 2. Proto OK (si touché)
grpcurl -plaintext localhost:50054 list

# 3. Docker démarre (si infra touché)
docker compose up -d <service>
docker compose logs <service> | tail -20

# 4. Contract test (si proto/events touché)
npm run test:contract
```

---

## 8) Commandes utiles

### Jest (NestJS)
```bash
# Tous les tests
npm run test

# Tests spécifiques
npm run test -- --testPathPattern=invoice

# Avec coverage
npm run test -- --coverage

# Watch mode
npm run test -- --watch

# Mise à jour des snapshots
npm run test -- --updateSnapshot
```

### Vérification rapide
```bash
# 1 commande pour tout vérifier
npm run test && npm run build && npm run lint
```

### Docker smoke
```bash
# Build + start + logs
docker compose up -d --build <service> && \
  sleep 5 && \
  docker compose logs <service> | tail -30
```

---

## Minimum par type de changement

| Type | Minimum test |
|------|--------------|
| Bugfix | 1 test unitaire qui reproduit + fix le bug |
| Feature | 1 test handler + 1 test aggregate (si nouveau) |
| Refactor | Golden master OU tests existants passent |
| Perf | Benchmark avant/après + tests existants passent |
| Proto | Contract test (serialize/deserialize) |
| Events | Golden test (replay payloads) |
| DB | Migration down() testée en local |
