# Service-Finance

Consolidated microservice combining factures (invoicing), payments, and calendar (debit scheduling) domains. Built with NestJS and gRPC.

## DDD Architecture

This service follows Domain-Driven Design (DDD) with clear layer separation:

```
src/
├── domain/              # Business entities & repository interfaces
├── application/         # DTOs & service port interfaces
├── infrastructure/      # Technical implementations (TypeORM, NATS)
├── interfaces/          # API layer (gRPC controllers)
├── migrations/          # Database migrations
├── factures.module.ts   # Factures bounded context module
├── payments.module.ts   # Payments bounded context module
├── calendar.module.ts   # Calendar bounded context module
├── app.module.ts        # Root module
└── main.ts              # Bootstrap
```

## Bounded Contexts

### Factures (10 entities)
- `FactureEntity` - Invoices
- `LigneFactureEntity` - Invoice line items
- `StatutFactureEntity` - Invoice status referential
- `EmissionFactureEntity` - Invoice emission types
- `FactureSettingsEntity` - Invoice settings per company
- `InvoiceEntity` - Factur-X compliant invoices
- `InvoiceItemEntity` - Factur-X invoice line items
- `RegleRelanceEntity` - Collection reminder rules
- `HistoriqueRelanceEntity` - Collection reminder history

### Payments (21 entities)
- `ScheduleEntity` - Payment schedules
- `PaymentIntentEntity` - Payment intents
- `PaymentEventEntity` - Payment events log
- `PortalPaymentSessionEntity` - Payment portal sessions
- `PortalSessionAuditEntity` - Portal audit log
- `PSPEventInboxEntity` - Webhook inbox
- `StripeAccountEntity` - Stripe PSP accounts
- `PaypalAccountEntity` - PayPal PSP accounts
- `GoCardlessAccountEntity` - GoCardless PSP accounts
- `GoCardlessMandateEntity` - SEPA mandates
- `SlimpayAccountEntity` - Slimpay PSP accounts
- `MultiSafepayAccountEntity` - MultiSafepay PSP accounts
- `EmerchantpayAccountEntity` - Emerchantpay PSP accounts
- `RetryPolicyEntity` - Retry policies
- `RetryScheduleEntity` - Retry schedules
- `RetryJobEntity` - Retry batch jobs
- `RetryAttemptEntity` - Retry attempts
- `ReminderPolicyEntity` - Reminder policies
- `ReminderEntity` - Payment reminders
- `RetryAuditLogEntity` - Retry audit log
- `PaymentAuditLogEntity` - Payment audit log

### Calendar (11 entities)
- `SystemDebitConfigurationEntity` - System-level debit config
- `CutoffConfigurationEntity` - Cutoff time configuration
- `CompanyDebitConfigurationEntity` - Company-level debit config
- `ClientDebitConfigurationEntity` - Client-level debit config
- `ContractDebitConfigurationEntity` - Contract-level debit config
- `HolidayZoneEntity` - Holiday zones
- `HolidayEntity` - Holidays
- `PlannedDebitEntity` - Planned debits
- `VolumeForecastEntity` - Volume forecasts
- `VolumeThresholdEntity` - Volume thresholds
- `CalendarAuditLogEntity` - Calendar audit log

## Layer Responsibilities

### Domain Layer (`src/domain/`)
- **Entities**: TypeORM entities with business rules
- **Repository Interfaces**: Abstract contracts (I*Repository.ts)
- Pure business logic, no framework dependencies

### Application Layer (`src/application/`)
- **DTOs**: class-validator decorated transfer objects
- **Service Ports**: Interface definitions (I*Service.ts)
- Orchestration and business use cases

### Infrastructure Layer (`src/infrastructure/`)
- **Persistence**: TypeORM repository implementations
- **Messaging**: NATS event handlers
- Technical adapters implementing application ports

### Interfaces Layer (`src/interfaces/`)
- **gRPC Controllers**: Protocol buffer API handlers
- **HTTP Controllers**: REST endpoints (portal)
- Transport-specific adapters

## Module Wiring

Each bounded context has a NestJS module that wires:
- TypeOrmModule.forFeature() for entities
- Controllers from interfaces/
- Services from infrastructure/
- Exports services for cross-context usage

## Key Patterns

### Repository Pattern
```typescript
// Domain interface
export interface IFactureRepository {
  findById(id: string): Promise<FactureEntity | null>;
}

// Infrastructure implementation
@Injectable()
export class FactureService implements IFactureRepository {
  // ...
}
```

### Event Handling (NATS)
```typescript
// infrastructure/messaging/nats/handlers/
@Injectable()
export class ContractSignedHandler implements OnModuleInit {
  async onModuleInit() {
    await this.natsService.subscribeProto(...);
  }
}
```

## Database

- **PostgreSQL** with `finance_db` database
- **TypeORM** for ORM
- **Snake Case** naming strategy
- Migrations in `src/migrations/`

## gRPC Services

Proto definitions in `packages/proto/`:
- `@crm/proto/factures` - Invoice service
- `@crm/proto/payments` - Payment service
- `@crm/proto/calendar` - Calendar service
- `@crm/proto/events/contract` - Contract events
- `@crm/proto/events/payment` - Payment events

## PSP Integrations

Supported Payment Service Providers:
- **Stripe** - Card payments
- **PayPal** - PayPal payments
- **GoCardless** - SEPA Direct Debit
- **Slimpay** - SEPA Direct Debit
- **MultiSafepay** - Multi-method
- **Emerchantpay** - Card payments

## Debit Configuration Hierarchy

Configuration resolution (highest priority first):
1. Contract-level configuration
2. Client-level configuration
3. Company-level configuration
4. System-level configuration (default)

## Migration Notes

### From Old Structure (modules/)

The service was refactored from a feature-module structure to DDD layers:

**Before:**
```
modules/
├── facture/
│   ├── facture.module.ts
│   ├── facture.service.ts
│   ├── facture.controller.ts
│   └── entities/facture.entity.ts
├── schedules/
├── configuration/
└── ...
```

**After:**
```
domain/factures/entities/facture.entity.ts
domain/factures/repositories/IFactureRepository.ts
infrastructure/persistence/typeorm/repositories/factures/facture.service.ts
interfaces/grpc/controllers/factures/facture.controller.ts
factures.module.ts
```

## Commands

```bash
# Development
bun run start:dev

# Build
bun run build

# Tests
bun test

# Proto generation
bun run proto:generate
```

## Dependencies

- `@crm/grpc-utils` - gRPC utilities
- `@crm/nats-utils` - NATS messaging utilities
- `@crm/proto` - Protocol buffer definitions
- TypeORM, NestJS, class-validator
