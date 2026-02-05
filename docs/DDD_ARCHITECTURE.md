# DDD Architecture Guide

## Overview

All 5 backend microservices have been refactored to follow **Domain-Driven Design (DDD)** principles with strict layer separation. This architecture provides clear boundaries between business logic, application orchestration, technical infrastructure, and API interfaces.

## Architecture Layers

### 1. Domain Layer (`src/domain/`)

**Purpose**: Pure business logic and domain models

**Contains**:
- **Entities**: TypeORM entities with business rules and domain logic
- **Repository Interfaces**: Abstract contracts defining data access operations (I*Repository.ts)
- **Value Objects**: Immutable domain concepts (when applicable)
- **Domain Events**: Business events (when applicable)

**Rules**:
- No framework dependencies (except TypeORM decorators for pragmatic reasons)
- No infrastructure concerns (no HTTP, no database queries)
- Contains only business logic

**Example**:
```typescript
// domain/users/entities/utilisateur.entity.ts
@Entity('utilisateurs')
export class UtilisateurEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  
  // Business logic methods
  isOAuth2(): boolean {
    return this.typeConnexion === TypeConnexion.OAUTH2;
  }
}

// domain/users/repositories/IUtilisateurRepository.ts
export interface IUtilisateurRepository {
  findById(id: string): Promise<UtilisateurEntity>;
  findByEmail(email: string): Promise<UtilisateurEntity | null>;
  save(utilisateur: UtilisateurEntity): Promise<UtilisateurEntity>;
  delete(id: string): Promise<void>;
}
```

### 2. Application Layer (`src/application/`)

**Purpose**: Application orchestration and use case coordination

**Contains**:
- **DTOs**: Data Transfer Objects with class-validator decorators
  - `Create{Entity}Dto`: Input for creation
  - `Update{Entity}Dto`: Input for updates
  - `{Entity}ResponseDto`: Output format
  - `{Entity}FiltersDto`: Query parameters
- **Service Interfaces (Ports)**: Abstract service contracts (I*Service.ts)
- **Command/Query Handlers**: CQRS handlers (when applicable)

**Rules**:
- No direct database access
- No HTTP/gRPC concerns
- Coordinates domain entities and infrastructure services
- Returns DTOs, not entities

**Example**:
```typescript
// application/users/dtos/utilisateur.dto.ts
export class CreateUtilisateurDto {
  @IsEmail()
  email: string;
  
  @IsString()
  nom: string;
}

export class UtilisateurResponseDto {
  id: string;
  email: string;
  nom: string;
}

// application/users/ports/IUtilisateurService.ts
export const UTILISATEUR_SERVICE = Symbol('IUtilisateurService');

export interface IUtilisateurService {
  create(dto: CreateUtilisateurDto): Promise<UtilisateurResponseDto>;
  findById(id: string): Promise<UtilisateurResponseDto>;
  findByEmail(email: string): Promise<UtilisateurResponseDto | null>;
}
```

### 3. Infrastructure Layer (`src/infrastructure/`)

**Purpose**: Technical implementations and external integrations

**Contains**:
- **Persistence**: TypeORM repository implementations
  - `repositories/{context}/*.service.ts`: Concrete repository implementations
- **Messaging**: NATS event handlers and publishers
  - `messaging/nats/handlers/`: Event subscribers
  - `messaging/nats/publishers/`: Event publishers
- **External Services**: Third-party API integrations
- **Mappers**: Entity ↔ DTO conversions

**Rules**:
- Implements domain repository interfaces
- Handles all technical concerns (database, messaging, APIs)
- No business logic (only technical operations)

**Example**:
```typescript
// infrastructure/persistence/typeorm/repositories/users/utilisateur.service.ts
@Injectable()
export class UtilisateurService implements IUtilisateurRepository {
  constructor(
    @InjectRepository(UtilisateurEntity)
    private readonly repository: Repository<UtilisateurEntity>,
  ) {}
  
  async findById(id: string): Promise<UtilisateurEntity> {
    return this.repository.findOneOrFail({ where: { id } });
  }
  
  async findByEmail(email: string): Promise<UtilisateurEntity | null> {
    return this.repository.findOne({ where: { email } });
  }
}
```

### 4. Interfaces Layer (`src/interfaces/`)

**Purpose**: API endpoints and external communication

**Contains**:
- **gRPC Controllers**: Protocol buffer API handlers
  - `grpc/controllers/{context}/*.controller.ts`
- **REST Controllers**: HTTP API handlers (if applicable)
- **WebSocket Gateways**: Real-time communication (if applicable)

**Rules**:
- Thin layer - only request/response handling
- Delegates to application services
- Handles protocol-specific concerns (gRPC, HTTP, WebSocket)

**Example**:
```typescript
// interfaces/grpc/controllers/users/utilisateur.controller.ts
@Controller()
export class UtilisateurController {
  constructor(
    @Inject(UTILISATEUR_SERVICE)
    private readonly utilisateurService: IUtilisateurService,
  ) {}
  
  @GrpcMethod('UtilisateurService', 'CreateUtilisateur')
  async createUtilisateur(dto: CreateUtilisateurRequest): Promise<UtilisateurResponse> {
    return this.utilisateurService.create(dto);
  }
}
```

## Bounded Contexts

Each service is organized into **bounded contexts** - cohesive business domains with clear boundaries.

### service-core (26 entities, 4 contexts)

| Context | Entities | Responsibility |
|---------|----------|----------------|
| **users** | 7 | User accounts, roles, permissions, RBAC |
| **organisations** | 7 | Organizations, companies, partners, white-label |
| **clients** | 10 | Client management, addresses, billing config |
| **documents** | 2 | Attachments, email inboxes |

### service-commercial (24 entities, 3 contexts)

| Context | Entities | Responsibility |
|---------|----------|----------------|
| **commercial** | 11 | Commissions, baremes, bordereau, apporteur |
| **contrats** | 5 | Contracts, contract lines, orchestration |
| **products** | 8 | Products, pricing, publication, distribution |

### service-finance (41 entities, 3 contexts)

| Context | Entities | Responsibility |
|---------|----------|----------------|
| **factures** | 10 | Invoices, invoice lines, relance, settings |
| **payments** | 20 | Payment intents, schedules, PSP accounts, retry |
| **calendar** | 11 | Debit calendar, holidays, volume forecasts |

### service-engagement (6 entities, 1 context)

| Context | Entities | Responsibility |
|---------|----------|----------------|
| **engagement** | 6 | Email, notifications, activities, tasks |

### service-logistics (4 entities, 1 context)

| Context | Entities | Responsibility |
|---------|----------|----------------|
| **logistics** | 4 | Shipments, tracking, carriers, Maileva |

## File Structure

### Standard Service Structure

```
services/service-{name}/
├── src/
│   ├── domain/
│   │   ├── {context}/
│   │   │   ├── entities/
│   │   │   │   ├── {entity}.entity.ts
│   │   │   │   └── index.ts
│   │   │   ├── repositories/
│   │   │   │   ├── I{Entity}Repository.ts
│   │   │   │   └── index.ts
│   │   │   └── index.ts
│   │   └── index.ts
│   ├── application/
│   │   ├── {context}/
│   │   │   ├── dtos/
│   │   │   │   ├── {entity}.dto.ts
│   │   │   │   └── index.ts
│   │   │   ├── ports/
│   │   │   │   ├── I{Entity}Service.ts
│   │   │   │   └── index.ts
│   │   │   └── index.ts
│   │   ├── shared/
│   │   │   └── dtos/
│   │   │       └── pagination.dto.ts
│   │   └── index.ts
│   ├── infrastructure/
│   │   ├── persistence/
│   │   │   └── typeorm/
│   │   │       └── repositories/
│   │   │           └── {context}/
│   │   │               ├── {entity}.service.ts
│   │   │               └── index.ts
│   │   └── messaging/
│   │       └── nats/
│   │           ├── handlers/
│   │           │   ├── {event}.handler.ts
│   │           │   └── index.ts
│   │           └── publishers/
│   ├── interfaces/
│   │   └── grpc/
│   │       └── controllers/
│   │           └── {context}/
│   │               ├── {entity}.controller.ts
│   │               └── index.ts
│   ├── {context}.module.ts
│   ├── app.module.ts
│   └── main.ts
├── CLAUDE.md
└── package.json
```

## Module Wiring

Each bounded context has a NestJS module that wires together all layers:

```typescript
// users.module.ts
@Module({
  imports: [
    TypeOrmModule.forFeature([
      UtilisateurEntity,
      RoleEntity,
      PermissionEntity,
      // ... all entities in this context
    ]),
  ],
  controllers: [
    UtilisateurController,
    RoleController,
    PermissionController,
    // ... all controllers in this context
  ],
  providers: [
    UtilisateurService,
    RoleService,
    PermissionService,
    // ... all services in this context
  ],
  exports: [
    UtilisateurService,
    RoleService,
    // ... services used by other contexts
  ],
})
export class UsersModule {}
```

Then the root module imports all bounded context modules:

```typescript
// app.module.ts
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({ /* ... */ }),
    NatsModule.forRoot({ /* ... */ }),
    
    // Bounded context modules
    UsersModule,
    OrganisationsModule,
    ClientsModule,
    DocumentsModule,
  ],
})
export class AppModule {}
```

## Migration from Old Structure

### Before (Feature-based modules)

```
src/
├── modules/
│   ├── utilisateur/
│   │   ├── utilisateur.module.ts
│   │   ├── utilisateur.service.ts
│   │   ├── utilisateur.controller.ts
│   │   └── entities/
│   │       └── utilisateur.entity.ts
│   ├── role/
│   │   ├── role.module.ts
│   │   ├── role.service.ts
│   │   ├── role.controller.ts
│   │   └── entities/
│   │       └── role.entity.ts
```

### After (DDD layers)

```
src/
├── domain/
│   └── users/
│       ├── entities/
│       │   ├── utilisateur.entity.ts
│       │   └── role.entity.ts
│       └── repositories/
│           ├── IUtilisateurRepository.ts
│           └── IRoleRepository.ts
├── application/
│   └── users/
│       ├── dtos/
│       │   ├── utilisateur.dto.ts
│       │   └── role.dto.ts
│       └── ports/
│           ├── IUtilisateurService.ts
│           └── IRoleService.ts
├── infrastructure/
│   └── persistence/typeorm/repositories/users/
│       ├── utilisateur.service.ts
│       └── role.service.ts
├── interfaces/
│   └── grpc/controllers/users/
│       ├── utilisateur.controller.ts
│       └── role.controller.ts
└── users.module.ts
```

## Best Practices

### 1. Dependency Direction

Dependencies flow **inward**:
- Interfaces → Application → Domain
- Infrastructure → Application → Domain
- Domain has **zero** dependencies on outer layers

### 2. Repository Pattern

- Domain defines **interfaces** (contracts)
- Infrastructure provides **implementations**
- Application uses **interfaces** (dependency inversion)

### 3. DTO Usage

- Controllers receive/return DTOs (not entities)
- Services work with DTOs (not entities directly)
- Mappers convert between entities and DTOs

### 4. Bounded Context Isolation

- Each context is self-contained
- Cross-context communication via:
  - Service interfaces (synchronous)
  - Domain events (asynchronous)
- Avoid direct entity references across contexts

### 5. Testing Strategy

- **Domain**: Unit tests for business logic
- **Application**: Integration tests for use cases
- **Infrastructure**: Integration tests with real dependencies
- **Interfaces**: E2E tests for API contracts

## Benefits

### 1. Maintainability
- Clear separation of concerns
- Easy to locate code by responsibility
- Reduced coupling between layers

### 2. Testability
- Domain logic testable without infrastructure
- Easy to mock dependencies
- Clear test boundaries

### 3. Scalability
- Bounded contexts can evolve independently
- Easy to extract contexts into separate services
- Clear API boundaries

### 4. Team Collaboration
- Teams can work on different contexts independently
- Clear ownership boundaries
- Reduced merge conflicts

## References

- Each service has a `CLAUDE.md` file with service-specific DDD documentation
- [Domain-Driven Design by Eric Evans](https://www.domainlanguage.com/ddd/)
- [Implementing Domain-Driven Design by Vaughn Vernon](https://vaughnvernon.com/)
- [Clean Architecture by Robert C. Martin](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)

## Summary

**Total Migration**:
- **5 services** refactored
- **101 entities** migrated
- **12 bounded contexts** defined
- **4 architectural layers** implemented

All services now follow consistent DDD architecture with clear layer separation, bounded contexts, and dependency inversion principles.
