# Service-Commercial

Consolidated microservice combining commercial (commissions), contrats, and products domains. Built with NestJS and gRPC.

## DDD Architecture

This service follows Domain-Driven Design (DDD) with clear layer separation:

```
src/
├── domain/              # Business entities & repository interfaces
├── application/         # DTOs & service port interfaces
├── infrastructure/      # Technical implementations (TypeORM, NATS)
├── interfaces/          # API layer (gRPC controllers)
├── migrations/          # Database migrations
├── commercial.module.ts # Commercial bounded context module
├── contrats.module.ts   # Contrats bounded context module
├── products.module.ts   # Products bounded context module
├── app.module.ts        # Root module
└── main.ts              # Bootstrap
```

## Bounded Contexts

### Commercial (11 entities)
- `ApporteurEntity` - Sales agents/brokers
- `StatutCommissionEntity` - Commission status referential
- `BaremeCommissionEntity` - Commission rate tables
- `PalierCommissionEntity` - Commission tiers/thresholds
- `BordereauCommissionEntity` - Commission statements
- `LigneBordereauEntity` - Statement line items
- `CommissionEntity` - Individual commissions
- `CommissionRecurrenteEntity` - Recurring commissions
- `ReportNegatifEntity` - Negative balance reports
- `RepriseCommissionEntity` - Commission clawbacks
- `CommissionAuditLogEntity` - Audit trail

### Contrats (5 entities)
- `ContratEntity` - Contracts
- `LigneContratEntity` - Contract line items
- `HistoriqueStatutContratEntity` - Contract status history
- `StatutContratEntity` - Contract status referential
- `OrchestrationHistoryEntity` - Contract lifecycle operations

### Products (8 entities)
- `ProduitEntity` - Products
- `GammeEntity` - Product ranges/families
- `GrilleTarifaireEntity` - Pricing grids
- `PrixProduitEntity` - Product prices
- `VersionProduitEntity` - Product versions
- `PublicationProduitEntity` - Product publications
- `DocumentProduitEntity` - Product documents
- `ModeleDistributionEntity` - Distribution models

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
- Transport-specific adapters

## Module Wiring

Each bounded context has a NestJS module that wires:
- TypeOrmModule.forFeature() for entities
- Controllers from interfaces/
- Services from infrastructure/
- Exports services for cross-context usage

Cross-context dependencies use `forwardRef()` to handle circular imports.

## Key Patterns

### Repository Pattern
```typescript
// Domain interface
export interface IContratRepository {
  findById(id: string): Promise<ContratEntity | null>;
}

// Infrastructure implementation
@Injectable()
export class ContratService implements IContratRepository {
  // ...
}
```

### Event Handling (NATS)
```typescript
// infrastructure/messaging/nats/handlers/
@Injectable()
export class PaymentReceivedHandler implements OnModuleInit {
  async onModuleInit() {
    await this.natsService.subscribeProto(...);
  }
}
```

## Database

- **PostgreSQL** with `commercial_db` database
- **TypeORM** for ORM
- **Snake Case** naming strategy
- Migrations in `src/migrations/`

## gRPC Services

Proto definitions in `packages/proto/`:
- `@crm/proto/commerciaux` - Apporteur service
- `@crm/proto/contrats` - Contract service
- `@crm/proto/products` - Product service
- `@crm/proto/events/contract` - Contract events
- `@crm/proto/events/payment` - Payment events

## Migration Notes

### From Old Structure (modules/)

The service was refactored from a feature-module structure to DDD layers:

**Before:**
```
modules/
├── apporteur/
│   ├── apporteur.module.ts
│   ├── apporteur.service.ts
│   ├── apporteur.controller.ts
│   └── entities/apporteur.entity.ts
├── contrat/
├── produit/
└── ...
```

**After:**
```
domain/commercial/entities/apporteur.entity.ts
domain/commercial/repositories/IApporteurRepository.ts
infrastructure/persistence/typeorm/repositories/commercial/apporteur.service.ts
interfaces/grpc/controllers/commercial/apporteur.controller.ts
commercial.module.ts
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
