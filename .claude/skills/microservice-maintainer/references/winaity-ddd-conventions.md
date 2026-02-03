# Conventions DDD Winaity

## Structure des dossiers

```
services/<service-name>/src/<bounded-context>/
├── domain/
│   ├── entities/
│   │   └── <aggregate>.aggregate.ts        # Aggregate Root
│   ├── repositories/
│   │   └── <aggregate>.repository.ts       # Interface (contrat)
│   ├── events/
│   │   ├── <aggregate>-created.event.ts    # Domain Events
│   │   └── index.ts
│   └── value-objects/                      # Optionnel
│       └── <name>.vo.ts
├── application/
│   ├── commands/
│   │   ├── <action>-<aggregate>.command.ts
│   │   ├── handlers/
│   │   │   └── <action>-<aggregate>.handler.ts
│   │   └── index.ts
│   ├── queries/
│   │   ├── <action>-<aggregate>.query.ts
│   │   ├── handlers/
│   │   │   └── <action>-<aggregate>.handler.ts
│   │   └── index.ts
│   ├── dto/
│   │   └── <aggregate>.dto.ts
│   └── events/
│       └── <event-name>.handler.ts         # Event handlers CQRS
├── infrastructure/
│   ├── persistence/
│   │   ├── entities/
│   │   │   └── <aggregate>.orm-entity.ts   # TypeORM Entity
│   │   ├── repositories/
│   │   │   └── <aggregate>.repository.impl.ts
│   │   ├── migrations/
│   │   │   └── <timestamp>-<Action>.ts
│   │   └── index.ts
│   ├── grpc/
│   │   ├── <context>.commands.grpc-controller.ts
│   │   ├── <context>.queries.grpc-controller.ts
│   │   ├── <aggregate>.grpc-mapper.ts
│   │   └── index.ts
│   ├── nats/
│   │   └── <event>-listener.ts
│   └── index.ts
└── <bounded-context>.module.ts
```

---

## Conventions de nommage

### Fichiers

| Type | Convention | Exemple |
|------|------------|---------|
| Aggregate | `<name>.aggregate.ts` | `invoice.aggregate.ts` |
| Repository Interface | `<name>.repository.ts` | `invoice.repository.ts` |
| Repository Impl | `<name>.repository.impl.ts` | `invoice.repository.impl.ts` |
| ORM Entity | `<name>.orm-entity.ts` | `invoice.orm-entity.ts` |
| Command | `<action>-<name>.command.ts` | `create-invoice.command.ts` |
| Command Handler | `<action>-<name>.handler.ts` | `create-invoice.handler.ts` |
| Query | `<action>-<name>.query.ts` | `get-invoice.query.ts` |
| Domain Event | `<name>-<action>.event.ts` | `invoice-created.event.ts` |
| gRPC Controller | `<context>.<type>.grpc-controller.ts` | `billing.commands.grpc-controller.ts` |
| NATS Listener | `<name>-events.listener.ts` | `payment-events.listener.ts` |
| Migration | `<timestamp>-<Action><Entity>.ts` | `1234567890-CreateInvoices.ts` |

### Classes

| Type | Convention | Exemple |
|------|------------|---------|
| Aggregate Root | PascalCase | `Invoice`, `Campaign`, `User` |
| Value Object | PascalCase | `InvoiceName`, `Email`, `Money` |
| Command | `<Action><Entity>Command` | `CreateInvoiceCommand` |
| Query | `<Action><Entity>Query` | `GetInvoiceQuery`, `ListInvoicesQuery` |
| Handler | `<Action><Entity>Handler` | `CreateInvoiceHandler` |
| Domain Event | `<Entity><Action>Event` | `InvoiceCreatedEvent` |
| ORM Entity | `<Entity>OrmEntity` | `InvoiceOrmEntity` |
| Repository Impl | `<Entity>RepositoryImpl` | `InvoiceRepositoryImpl` |
| gRPC Controller | `<Context><Type>GrpcController` | `BillingCommandsGrpcController` |

### DB (snake_case)

| Type | Convention | Exemple |
|------|------------|---------|
| Table | plural, snake_case | `invoices`, `invoice_items` |
| Column | snake_case | `user_id`, `created_at` |
| Foreign Key | `<table>_id` | `invoice_id`, `user_id` |
| Index | `idx_<table>_<columns>` | `idx_invoices_user_id` |

---

## Aggregate Root

### Pattern standard
```typescript
// domain/entities/invoice.aggregate.ts
import { AggregateRoot } from '@nestjs/cqrs';

export class Invoice extends AggregateRoot {
  private readonly id: string;
  private readonly userId: string;
  private name: string;
  private status: InvoiceStatus;
  private amountCents: number;
  private readonly createdAt: Date;
  private updatedAt: Date;
  private deletedAt?: Date;
  private version: number;

  // Factory method
  static create(userId: string, name: string, amount: number): Invoice {
    // Invariants
    if (!userId) throw new DomainError('userId is required');
    if (!name || name.length < 2) throw new DomainError('name must be at least 2 chars');
    if (amount < 0) throw new DomainError('amount cannot be negative');

    const invoice = new Invoice();
    invoice.id = generateId();
    invoice.userId = userId;
    invoice.name = name;
    invoice.amountCents = amount;
    invoice.status = InvoiceStatus.DRAFT;
    invoice.createdAt = new Date();
    invoice.updatedAt = new Date();
    invoice.version = 0;

    // Domain event
    invoice.apply(InvoiceCreatedEvent.create(invoice.id, userId, name, amount));

    return invoice;
  }

  // Reconstitution (from persistence)
  static reconstitute(props: InvoiceProps): Invoice {
    const invoice = new Invoice();
    Object.assign(invoice, props);
    return invoice;
  }

  // Business methods with invariants
  issue(): void {
    if (this.status !== InvoiceStatus.DRAFT) {
      throw new BusinessRuleException('Can only issue draft invoices');
    }
    this.status = InvoiceStatus.ISSUED;
    this.updatedAt = new Date();
    this.apply(InvoiceIssuedEvent.create(this.id));
  }

  pay(): void {
    if (this.status !== InvoiceStatus.ISSUED) {
      throw new BusinessRuleException('Can only pay issued invoices');
    }
    this.status = InvoiceStatus.PAID;
    this.updatedAt = new Date();
    this.apply(InvoicePaidEvent.create(this.id, this.amountCents));
  }

  // Getters (immutables)
  getId(): string { return this.id; }
  getUserId(): string { return this.userId; }
  getName(): string { return this.name; }
  getStatus(): InvoiceStatus { return this.status; }
  getAmount(): number { return this.amountCents; }

  // For persistence
  toPrimitives(): Record<string, any> {
    return {
      id: this.id,
      user_id: this.userId,
      name: this.name,
      status: this.status.toString(),
      amount_cents: this.amountCents,
      created_at: this.createdAt,
      updated_at: this.updatedAt,
      deleted_at: this.deletedAt,
      version: this.version,
    };
  }
}
```

### Règles
- **Invariants dans l'aggregate**, pas dans les handlers
- **Factory method** `create()` pour création
- **Reconstitute** pour hydratation depuis DB
- **Getters immutables** (return copies pour arrays/objects)
- **Domain events** via `this.apply()`

---

## Command Handler

### Pattern standard
```typescript
// application/commands/handlers/create-invoice.handler.ts
import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { CreateInvoiceCommand } from '../create-invoice.command';
import { Invoice } from '../../domain/entities/invoice.aggregate';
import { InvoiceRepository } from '../../domain/repositories/invoice.repository';

@CommandHandler(CreateInvoiceCommand)
export class CreateInvoiceHandler implements ICommandHandler<CreateInvoiceCommand> {
  constructor(
    @Inject('INVOICE_REPOSITORY')
    private readonly repository: InvoiceRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: CreateInvoiceCommand): Promise<string> {
    // 1. Créer l'aggregate (avec invariants)
    const invoice = Invoice.create(
      command.userId,
      command.name,
      command.amount,
    );

    // 2. Persister
    await this.repository.save(invoice);

    // 3. Publier domain events
    invoice.getUncommittedEvents().forEach(event => {
      this.eventBus.publish(event);
    });

    invoice.commit();

    return invoice.getId();
  }
}
```

---

## Repository

### Interface (domain)
```typescript
// domain/repositories/invoice.repository.ts
export abstract class InvoiceRepository {
  abstract findById(id: string): Promise<Invoice | null>;
  abstract findByUserId(userId: string, options?: PaginationOptions): Promise<{
    items: Invoice[];
    total: number;
  }>;
  abstract save(invoice: Invoice): Promise<void>;
  abstract delete(id: string): Promise<void>;
}
```

### Implementation (infrastructure)
```typescript
// infrastructure/persistence/repositories/invoice.repository.impl.ts
@Injectable()
export class InvoiceRepositoryImpl extends InvoiceRepository {
  constructor(
    @InjectRepository(InvoiceOrmEntity)
    private readonly repo: Repository<InvoiceOrmEntity>,
  ) {
    super();
  }

  async findById(id: string): Promise<Invoice | null> {
    const entity = await this.repo.findOne({
      where: { id, deleted_at: IsNull() },
    });
    return entity ? this.toDomain(entity) : null;
  }

  async save(invoice: Invoice): Promise<void> {
    const entity = this.toEntity(invoice);
    await this.repo.save(entity);
  }

  private toDomain(entity: InvoiceOrmEntity): Invoice {
    return Invoice.reconstitute({
      id: entity.id,
      userId: entity.user_id,
      name: entity.name,
      status: InvoiceStatus.fromString(entity.status),
      amountCents: entity.amount_cents,
      createdAt: entity.created_at,
      updatedAt: entity.updated_at,
      deletedAt: entity.deleted_at,
      version: entity.version,
    });
  }

  private toEntity(invoice: Invoice): InvoiceOrmEntity {
    const primitives = invoice.toPrimitives();
    const entity = new InvoiceOrmEntity();
    Object.assign(entity, primitives);
    return entity;
  }
}
```

---

## gRPC Controller

### Pattern standard
```typescript
// infrastructure/grpc/billing.commands.grpc-controller.ts
@Controller()
@UseFilters(GrpcExceptionFilter)
@BillingCommandServiceControllerMethods()
export class BillingCommandsGrpcController {
  constructor(private readonly commandBus: CommandBus) {}

  async createInvoice(request: CreateInvoiceRequest): Promise<CreateInvoiceResponse> {
    const command = new CreateInvoiceCommand(
      request.userId,
      request.name,
      request.amountCents ?? 0,
    );

    const invoiceId = await this.commandBus.execute<CreateInvoiceCommand, string>(command);

    return {
      success: true,
      id: invoiceId,
    };
  }
}
```

---

## NATS Listener

### Pattern standard
```typescript
// infrastructure/nats/payment-events.listener.ts
@Controller()
export class PaymentEventsListener {
  constructor(private readonly commandBus: CommandBus) {}

  @EventPattern('payments.payment.received')
  async handlePaymentReceived(@Payload() event: PaymentReceivedEvent): Promise<void> {
    const invoiceId = event.data?.invoiceId;
    if (!invoiceId) return;

    await this.commandBus.execute(new MarkInvoicePaidCommand(invoiceId));
  }
}
```

---

## Module Assembly

### Pattern standard
```typescript
// billing.module.ts
@Module({
  imports: [
    CqrsModule,
    TypeOrmModule.forFeature([
      InvoiceOrmEntity,
      InvoiceItemOrmEntity,
    ]),
    NatsModule.forRoot({ queue: 'billing-service' }),
  ],
  controllers: [
    BillingCommandsGrpcController,
    BillingQueriesGrpcController,
    PaymentEventsListener,
  ],
  providers: [
    // Handlers
    CreateInvoiceHandler,
    UpdateInvoiceHandler,
    GetInvoiceHandler,
    ListInvoicesHandler,
    // Repositories
    {
      provide: 'INVOICE_REPOSITORY',
      useClass: InvoiceRepositoryImpl,
    },
  ],
  exports: ['INVOICE_REPOSITORY'],
})
export class BillingModule {}
```

---

## Règles de modification

### Quand modifier le Domain
- Changement d'invariant métier
- Nouvelle méthode business
- Nouveau domain event

### Quand modifier l'Application
- Nouvelle command/query
- Changement dans le flow d'un handler
- Ajout de validation applicative

### Quand modifier l'Infrastructure
- Changement de schéma DB (migration)
- Changement de proto/gRPC
- Changement d'event NATS
- Changement de mapping

### Règle générale
**Modifier du Domain vers l'extérieur**, jamais l'inverse :
```
Domain → Application → Infrastructure
```
Les couches internes ne dépendent jamais des couches externes.
