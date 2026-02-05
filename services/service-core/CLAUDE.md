# Service-Core

Consolidated microservice combining identity, clients, and documents domains. Built with NestJS and gRPC.

## DDD Architecture

This service follows Domain-Driven Design (DDD) with clear layer separation:

```
src/
├── domain/              # Business entities & repository interfaces
├── application/         # DTOs & service port interfaces
├── infrastructure/      # Technical implementations (TypeORM, NATS)
├── interfaces/          # API layer (gRPC controllers)
├── migrations/          # Database migrations
├── users.module.ts      # Users bounded context module
├── organisations.module.ts
├── clients.module.ts
├── documents.module.ts
├── app.module.ts        # Root module
└── main.ts              # Bootstrap
```

## Bounded Contexts

### Users (7 entities)
- `Utilisateur` - User accounts synced with Keycloak
- `Role`, `Permission`, `RolePermission` - RBAC system
- `Compte` - Account/tenant management
- `MembreCompte` - Account membership
- `InvitationCompte` - Account invitations

### Organisations (7 entities)
- `Organisation` - Top-level organisation entity
- `Societe` - Company/legal entity
- `StatutPartenaire`, `RolePartenaire`, `MembrePartenaire` - Partner management
- `PartenaireMarqueBlanche`, `ThemeMarque` - White-label theming

### Clients (10 entities)
- `ClientBase`, `ClientEntreprise`, `ClientPartenaire` - Client types
- `Adresse` - Address management
- `StatutClient` - Client status
- `ConditionPaiement`, `EmissionFacture`, `FacturationPar`, `PeriodeFacturation` - Billing config
- `TransporteurCompte` - Transport account referential

### Documents (2 entities)
- `PieceJointe` - Attachments/files
- `BoiteMail` - Email inbox

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
export interface IUtilisateurRepository {
  findById(id: string): Promise<UtilisateurEntity>;
}

// Infrastructure implementation
@Injectable()
export class UtilisateurService implements IUtilisateurRepository {
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

- **PostgreSQL** with `core_db` database
- **TypeORM** for ORM
- **Snake Case** naming strategy
- Migrations in `src/migrations/`

## gRPC Services

Proto definitions in `packages/proto/`:
- `@crm/proto/users`
- `@crm/proto/organisations`
- `@crm/proto/clients`
- `@crm/proto/documents`
- `@crm/proto/referentiel`

## Migration Notes

### From Old Structure (modules/)

The service was refactored from a feature-module structure to DDD layers:

**Before:**
```
modules/
├── users/utilisateur/
│   ├── utilisateur.module.ts
│   ├── utilisateur.service.ts
│   ├── utilisateur.controller.ts
│   └── entities/utilisateur.entity.ts
```

**After:**
```
domain/users/entities/utilisateur.entity.ts
domain/users/repositories/IUtilisateurRepository.ts
infrastructure/persistence/typeorm/repositories/users/utilisateur.service.ts
interfaces/grpc/controllers/users/utilisateur.controller.ts
users.module.ts
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
