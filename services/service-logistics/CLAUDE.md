# Service-Logistics

Microservice handling shipping, package tracking, carrier accounts, and Maileva postal integration. Built with NestJS and gRPC.

## DDD Architecture

This service follows Domain-Driven Design (DDD) with clear layer separation:

```
src/
├── domain/              # Business entities & repository interfaces
├── application/         # DTOs & service port interfaces
├── infrastructure/      # Technical implementations (TypeORM, External APIs)
├── interfaces/          # API layer (gRPC controllers)
├── migrations/          # Database migrations
├── logistics.module.ts  # Logistics bounded context module
├── app.module.ts        # Root module
└── main.ts              # Bootstrap
```

## Bounded Context

### Logistics (4 entities)
- `ExpeditionEntity` - Shipment records with tracking, status, and delivery info
- `ColisEntity` - Package details (weight, dimensions, value, contents)
- `TrackingEventEntity` - Tracking events for shipments
- `CarrierAccountEntity` - Carrier accounts per organisation (Maileva credentials)

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
- **External**: Maileva API integration service
- Technical adapters implementing application ports

### Interfaces Layer (`src/interfaces/`)
- **gRPC Controllers**: Protocol buffer API handlers
- Transport-specific adapters

## Module Wiring

The logistics bounded context module wires:
- TypeOrmModule.forFeature() for all 4 entities
- Controllers from interfaces/grpc/controllers/logistics/
- Services from infrastructure/persistence/typeorm/repositories/logistics/
- MailevaService for external API integration
- Exports services for cross-context usage

## Key Patterns

### Repository Pattern
```typescript
// Domain interface
export interface IExpeditionRepository {
  findById(id: string): Promise<ExpeditionEntity | null>;
  findByTrackingNumber(trackingNumber: string): Promise<ExpeditionEntity | null>;
  findByClientId(clientId: string, limit?: number, offset?: number): Promise<{...}>;
}

// Infrastructure implementation
@Injectable()
export class ExpeditionService implements IExpeditionRepository {
  // ...
}
```

### External Service Integration (Maileva)
```typescript
// infrastructure/external/maileva/
@Injectable()
export class MailevaService implements IMailevaService {
  async generateLabel(args: LabelRequest): Promise<LabelResponse>;
  async trackShipment(trackingNumber: string): Promise<TrackingResponse>;
  validateAddress(address: LogisticsAddress): AddressValidationResponse;
  simulatePricing(args: {...}): PricingResponse;
}
```

### Mock Mode Support
```typescript
// Maileva service supports mock mode for development
constructor(private readonly configService: ConfigService) {
  this.useMock = this.configService.get<string>('MAILEVA_USE_MOCK', 'true') === 'true';
}
```

## Database

- **PostgreSQL** with `logistics_db` database
- **TypeORM** for ORM
- **Snake Case** naming strategy
- Migrations in `src/migrations/`

## gRPC Services

Proto definitions in `packages/proto/`:
- `@crm/proto/logistics` - Logistics service (expeditions, colis, tracking, maileva)

## Special Features

### Maileva Integration
- Postal mail sending via Maileva API
- Label generation with tracking numbers
- Shipment tracking via API or mock data
- Address validation
- Pricing simulation

### Expedition Management
- Full shipment lifecycle (created → in_transit → delivered)
- Organisation and client linking
- Tracking number assignment
- Label URL storage

### Package Tracking
- Event-based tracking history
- Multiple events per expedition
- Code/label/date/location for each event

### Carrier Accounts
- Per-organisation carrier configurations
- Support for multiple carrier types
- Maileva-specific account lookup

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `MAILEVA_LOGIN` | Maileva API username | - |
| `MAILEVA_PASSWORD` | Maileva API password | - |
| `MAILEVA_CLIENT_ID` | Maileva OAuth client ID | - |
| `MAILEVA_CLIENT_SECRET` | Maileva OAuth client secret | - |
| `MAILEVA_SANDBOX` | Use sandbox API | `true` |
| `MAILEVA_USE_MOCK` | Use mock data (no API calls) | `true` |

## Migration Notes

### From Old Structure (modules/)

The service was refactored from a feature-module structure to DDD layers:

**Before:**
```
modules/
├── carrier/
│   ├── carrier.module.ts
│   ├── carrier.service.ts
│   ├── carrier.controller.ts
│   └── entities/carrier-account.entity.ts
├── colis/
├── expedition/
├── tracking/
└── maileva/
```

**After:**
```
domain/logistics/entities/carrier-account.entity.ts
domain/logistics/repositories/ICarrierAccountRepository.ts
infrastructure/persistence/typeorm/repositories/logistics/carrier.service.ts
infrastructure/external/maileva/maileva.service.ts
interfaces/grpc/controllers/logistics/carrier.controller.ts
logistics.module.ts
```

### Consolidated Structure
- 5 modules → 1 bounded context (logistics)
- External API integration in infrastructure/external/
- All entities in domain layer with repository interfaces

## Commands

```bash
# Development
bun run start:dev

# Build
bun run build

# Tests
bun test

# Database scripts
bun run db:create
bun run migration:run
```

## Dependencies

- `@crm/grpc-utils` - gRPC utilities
- `@crm/proto` - Protocol buffer definitions
- `axios` - HTTP client for Maileva API
- TypeORM, NestJS, class-validator
