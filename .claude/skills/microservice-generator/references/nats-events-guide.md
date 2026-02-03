# NATS Events Guide (Winaity-clean style)

## Architecture

```
┌─────────────────┐     NATS JetStream      ┌─────────────────┐
│  Producer       │ ──────────────────────▶ │  Consumer       │
│  (service A)    │                         │  (service B)    │
│                 │   topic: billing.       │                 │
│  Publish event  │   invoice.issued        │  Handle event   │
└─────────────────┘                         └─────────────────┘
         │                                           │
         ▼                                           ▼
   ┌───────────┐                              ┌───────────┐
   │  Outbox   │  (si critique)               │  Dedup    │
   │  Pattern  │                              │  Store    │
   └───────────┘                              └───────────┘
```

---

## Convention de nommage des topics

### Format

```
<bounded-context>.<aggregate>.<event-type>
```

### Exemples

| Topic | Description |
|-------|-------------|
| `billing.invoice.issued` | Facture émise |
| `billing.invoice.paid` | Facture payée |
| `billing.invoice.cancelled` | Facture annulée |
| `contacts.contact.created` | Contact créé |
| `contacts.import.completed` | Import terminé |
| `campaigns.campaign.scheduled` | Campagne planifiée |
| `campaigns.campaign.executed` | Campagne exécutée |

### Règles

- Tout en **lowercase**
- Séparé par des **points**
- Pas de verbes au présent (use past tense: `created`, `updated`, `deleted`)
- Éviter les événements CRUD génériques → préférer des événements métier

---

## Structure d'un event

### Format standard

```typescript
interface DomainEvent<T> {
  // Metadata
  id: string;              // UUID unique de l'event
  type: string;            // billing.invoice.issued
  timestamp: string;       // ISO 8601
  correlationId: string;   // Pour le tracing
  causationId?: string;    // ID de l'event qui a causé celui-ci

  // Payload
  aggregateId: string;     // ID de l'aggregate concerné
  aggregateType: string;   // Invoice
  version: number;         // Version de l'aggregate après l'event
  data: T;                 // Données spécifiques à l'event
}
```

### Exemple concret

```json
{
  "id": "evt_01HXYZ123456",
  "type": "billing.invoice.issued",
  "timestamp": "2024-01-15T10:30:00Z",
  "correlationId": "corr_01HXYZ789",
  "aggregateId": "inv_01HXYZ456",
  "aggregateType": "Invoice",
  "version": 1,
  "data": {
    "invoiceNumber": "INV-2024-0001",
    "customerId": "cust_01HXYZ789",
    "amount": 15000,
    "currency": "EUR",
    "dueDate": "2024-02-15"
  }
}
```

---

## Publisher (NestJS)

### Event class

```typescript
// domain/events/invoice-issued.event.ts
import { DomainEvent } from '@winaity/shared-kernel';

export interface InvoiceIssuedData {
  invoiceNumber: string;
  customerId: string;
  amount: number;
  currency: string;
  dueDate: string;
}

export class InvoiceIssuedEvent extends DomainEvent<InvoiceIssuedData> {
  constructor(
    aggregateId: string,
    data: InvoiceIssuedData,
    correlationId?: string,
  ) {
    super({
      type: 'billing.invoice.issued',
      aggregateId,
      aggregateType: 'Invoice',
      data,
      correlationId,
    });
  }
}
```

### NATS Publisher Service

```typescript
// infrastructure/nats/nats-publisher.service.ts
import { Injectable, OnModuleInit } from '@nestjs/common';
import { connect, NatsConnection, StringCodec } from 'nats';
import { DomainEvent } from '@winaity/shared-kernel';

@Injectable()
export class NatsPublisherService implements OnModuleInit {
  private nc: NatsConnection;
  private sc = StringCodec();

  async onModuleInit() {
    this.nc = await connect({
      servers: process.env.NATS_URL || 'nats://localhost:4222',
    });
    console.log('Connected to NATS');
  }

  async publish<T>(event: DomainEvent<T>): Promise<void> {
    const subject = event.type;
    const payload = this.sc.encode(JSON.stringify(event.toJSON()));

    await this.nc.publish(subject, payload);
    console.log(`Published event ${event.id} to ${subject}`);
  }

  async onModuleDestroy() {
    await this.nc.drain();
  }
}
```

### Usage dans un handler

```typescript
// application/commands/handlers/issue-invoice.handler.ts
@CommandHandler(IssueInvoiceCommand)
export class IssueInvoiceHandler implements ICommandHandler<IssueInvoiceCommand> {
  constructor(
    @Inject('INVOICE_REPOSITORY')
    private readonly repository: InvoiceRepository,
    private readonly natsPublisher: NatsPublisherService,
  ) {}

  async execute(command: IssueInvoiceCommand): Promise<string> {
    const invoice = Invoice.issue(
      command.customerId,
      command.amount,
      command.currency,
    );

    await this.repository.save(invoice);

    // Publish domain events
    for (const event of invoice.getUncommittedEvents()) {
      await this.natsPublisher.publish(event);
    }

    invoice.clearEvents();
    return invoice.getId();
  }
}
```

---

## Consumer (NestJS)

### Listener

```typescript
// infrastructure/nats/invoice-events.listener.ts
import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { connect, NatsConnection, StringCodec, Subscription } from 'nats';

@Injectable()
export class InvoiceEventsListener implements OnModuleInit {
  private readonly logger = new Logger(InvoiceEventsListener.name);
  private nc: NatsConnection;
  private sc = StringCodec();
  private subscriptions: Subscription[] = [];

  constructor(
    private readonly invoicePaidHandler: InvoicePaidHandler,
  ) {}

  async onModuleInit() {
    this.nc = await connect({
      servers: process.env.NATS_URL || 'nats://localhost:4222',
    });

    // Subscribe to events
    await this.subscribe('billing.invoice.paid', this.handleInvoicePaid.bind(this));
    await this.subscribe('billing.invoice.cancelled', this.handleInvoiceCancelled.bind(this));
  }

  private async subscribe(subject: string, handler: (data: any) => Promise<void>) {
    const sub = this.nc.subscribe(subject);
    this.subscriptions.push(sub);

    (async () => {
      for await (const msg of sub) {
        try {
          const event = JSON.parse(this.sc.decode(msg.data));
          await handler(event);
        } catch (error) {
          this.logger.error(`Error handling ${subject}:`, error);
        }
      }
    })();

    this.logger.log(`Subscribed to ${subject}`);
  }

  private async handleInvoicePaid(event: any): Promise<void> {
    await this.invoicePaidHandler.handle(event);
  }

  private async handleInvoiceCancelled(event: any): Promise<void> {
    // Handle cancellation
  }

  async onModuleDestroy() {
    for (const sub of this.subscriptions) {
      sub.unsubscribe();
    }
    await this.nc.drain();
  }
}
```

---

## Idempotency

### Pourquoi ?

Les events peuvent être délivrés plusieurs fois (at-least-once). Le consumer doit être idempotent.

### Stratégie 1: Event ID dedup

```typescript
// infrastructure/nats/dedup-store.ts
import { Injectable } from '@nestjs/common';
import { Redis } from 'ioredis';

@Injectable()
export class DedupStore {
  constructor(private readonly redis: Redis) {}

  async isProcessed(eventId: string): Promise<boolean> {
    const exists = await this.redis.exists(`event:${eventId}`);
    return exists === 1;
  }

  async markAsProcessed(eventId: string, ttlSeconds: number = 86400): Promise<void> {
    await this.redis.setex(`event:${eventId}`, ttlSeconds, '1');
  }
}

// Usage dans le handler
async handleInvoicePaid(event: InvoicePaidEvent): Promise<void> {
  // Check dedup
  if (await this.dedupStore.isProcessed(event.id)) {
    this.logger.debug(`Event ${event.id} already processed, skipping`);
    return;
  }

  // Process event
  await this.processPayment(event);

  // Mark as processed
  await this.dedupStore.markAsProcessed(event.id);
}
```

### Stratégie 2: Natural key dedup

```typescript
// Utiliser une clé métier naturelle
const idempotencyKey = `${event.aggregateId}:${event.type}:${event.version}`;

if (await this.dedupStore.isProcessed(idempotencyKey)) {
  return;
}
```

---

## Retry & Dead Letter Queue (DLQ)

### Configuration JetStream

```typescript
// infrastructure/nats/jetstream-config.ts
import { connect, JetStreamManager, RetentionPolicy, AckPolicy } from 'nats';

async function setupJetStream() {
  const nc = await connect({ servers: 'nats://localhost:4222' });
  const jsm = await nc.jetstreamManager();

  // Create stream
  await jsm.streams.add({
    name: 'BILLING_EVENTS',
    subjects: ['billing.>'],
    retention: RetentionPolicy.Limits,
    max_msgs: 1000000,
    max_age: 7 * 24 * 60 * 60 * 1000000000, // 7 days in nanoseconds
  });

  // Create consumer with retry
  await jsm.consumers.add('BILLING_EVENTS', {
    durable_name: 'billing-processor',
    ack_policy: AckPolicy.Explicit,
    max_deliver: 5,        // Max 5 retries
    ack_wait: 30000000000, // 30s timeout
  });
}
```

### Handler avec retry

```typescript
async handleWithRetry(event: any, msg: JsMsg): Promise<void> {
  try {
    await this.processEvent(event);
    msg.ack();
  } catch (error) {
    const deliveryCount = msg.info.redeliveryCount;

    if (deliveryCount >= 4) {
      // Max retries reached → send to DLQ
      await this.sendToDlq(event, error);
      msg.term(); // Terminate (don't redeliver)
    } else {
      // Retry with backoff
      const backoffMs = Math.pow(2, deliveryCount) * 1000;
      msg.nak(backoffMs);
    }
  }
}

private async sendToDlq(event: any, error: Error): Promise<void> {
  const dlqEvent = {
    originalEvent: event,
    error: error.message,
    failedAt: new Date().toISOString(),
  };

  await this.natsPublisher.publish('dlq.billing', dlqEvent);
  this.logger.error(`Event ${event.id} sent to DLQ after max retries`);
}
```

---

## Outbox Pattern (pour events critiques)

### Problème

```
1. Save to DB ✓
2. Publish to NATS ✗  ← Failure here = event lost
```

### Solution: Outbox table

```typescript
// infrastructure/persistence/entities/outbox.orm-entity.ts
@Entity('outbox')
export class OutboxOrmEntity {
  @PrimaryColumn({ type: 'uuid' })
  id: string;

  @Column({ name: 'aggregate_type' })
  aggregateType: string;

  @Column({ name: 'aggregate_id' })
  aggregateId: string;

  @Column({ type: 'varchar' })
  type: string;

  @Column({ type: 'jsonb' })
  payload: Record<string, any>;

  @Column({ default: false })
  published: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({ name: 'published_at', nullable: true })
  publishedAt: Date | null;
}
```

### Migration

```typescript
export class CreateOutboxTable implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'outbox',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true },
          { name: 'aggregate_type', type: 'varchar' },
          { name: 'aggregate_id', type: 'varchar' },
          { name: 'type', type: 'varchar' },
          { name: 'payload', type: 'jsonb' },
          { name: 'published', type: 'boolean', default: false },
          { name: 'created_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
          { name: 'published_at', type: 'timestamp', isNullable: true },
        ],
      }),
    );

    await queryRunner.createIndex(
      'outbox',
      new TableIndex({
        name: 'IDX_outbox_published',
        columnNames: ['published'],
        where: 'published = false',
      }),
    );
  }
}
```

### Transactional save

```typescript
// Dans le handler
async execute(command: IssueInvoiceCommand): Promise<string> {
  const invoice = Invoice.issue(...);

  await this.dataSource.transaction(async (manager) => {
    // 1. Save aggregate
    await manager.save(InvoiceOrmEntity.fromDomain(invoice));

    // 2. Save events to outbox (same transaction)
    for (const event of invoice.getUncommittedEvents()) {
      await manager.save(OutboxOrmEntity.fromEvent(event));
    }
  });

  return invoice.getId();
}
```

### Outbox poller (cron job)

```typescript
// infrastructure/tasks/outbox-poller.task.ts
@Injectable()
export class OutboxPollerTask {
  private readonly logger = new Logger(OutboxPollerTask.name);

  constructor(
    @InjectRepository(OutboxOrmEntity)
    private readonly outboxRepo: Repository<OutboxOrmEntity>,
    private readonly natsPublisher: NatsPublisherService,
  ) {}

  @Cron('*/5 * * * * *') // Every 5 seconds
  async pollOutbox(): Promise<void> {
    const unpublished = await this.outboxRepo.find({
      where: { published: false },
      order: { createdAt: 'ASC' },
      take: 100,
    });

    for (const entry of unpublished) {
      try {
        await this.natsPublisher.publish(entry.type, entry.payload);

        entry.published = true;
        entry.publishedAt = new Date();
        await this.outboxRepo.save(entry);

        this.logger.debug(`Published outbox entry ${entry.id}`);
      } catch (error) {
        this.logger.error(`Failed to publish ${entry.id}:`, error);
      }
    }
  }
}
```

---

## Events métier vs CRUD

### À éviter (trop générique)

```
contact.created
contact.updated
contact.deleted
```

### Préférer (métier)

```
contacts.contact.registered
contacts.contact.verified
contacts.contact.merged
contacts.contact.unsubscribed
contacts.import.started
contacts.import.completed
contacts.import.failed
contacts.duplicates.detected
```

### Règle

Un event doit répondre à : **"Qu'est-ce qui s'est passé dans le domaine métier ?"**
