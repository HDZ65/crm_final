# Microservice Coherence Refactor - Learnings

## Domain Layer Migration (2026-02-05)

### Entity Migration Pattern
- Kept TypeORM decorators in domain entities (pragmatic approach)
- Updated imports to be relative within bounded contexts
- Used type imports for circular dependencies (e.g., ClientBase <-> Adresse)
- Used string-based relations for OneToMany with circular refs

### Bounded Context Structure
```
domain/
  {context}/
    entities/        # TypeORM entities
      index.ts       # barrel export
    repositories/    # IRepository interfaces
      index.ts       # barrel export
    index.ts         # context barrel
```

### Repository Interface Pattern
- Base methods: findById, findAll, save, delete
- Added domain-specific finders (e.g., findByEmail, findByCode)
- Promise-based async interface

### Entities Migrated (26 total)
- Users (7): utilisateur, role, permission, role-permission, compte, membre-compte, invitation-compte
- Organisations (7): organisation, societe, statut-partenaire, partenaire-marque-blanche, theme-marque, role-partenaire, membre-partenaire
- Clients (10): client-base, client-entreprise, client-partenaire, adresse, statut-client + 5 referentiel entities
- Documents (2): piece-jointe, boite-mail

### Key Decisions
- Renamed PieceJointe -> PieceJointeEntity and BoiteMail -> BoiteMailEntity for consistency
- Repository interfaces named I{Entity}Repository (e.g., IUtilisateurRepository)
- Kept all existing business logic (static methods, isOAuth2(), isTokenExpired())

## Application Layer (2026-02-05)

### DTOs Structure
```
application/
  {context}/
    dtos/           # class-validator decorated DTOs
      index.ts      # barrel export
    ports/          # Service interfaces
      index.ts      # barrel export
    index.ts        # context barrel
```

### DTO Pattern
- Create{Entity}Dto: Input for creation, required fields with decorators
- Update{Entity}Dto: Input for update, id required, other fields optional
- {Entity}ResponseDto: Plain class for output (no decorators)
- {Entity}FiltersDto: Optional query parameters for filtering
- PaginationDto: Reusable across all contexts

### Service Interface (Port) Pattern
- Interface name: I{Entity}Service
- Symbol export: {ENTITY}_SERVICE = Symbol('I{Entity}Service')
- Standard methods: create, update, findById, findAll, delete
- Domain-specific methods added as needed (e.g., findByEmail, search)
- Returns DTOs, not entities (clean separation)

### Files Created (47 total)
- Users: 5 DTOs + 4 ports + 2 index files
- Organisations: 5 DTOs + 4 ports + 2 index files  
- Clients: 6 DTOs + 5 ports + 2 index files
- Documents: 3 DTOs + 2 ports + 2 index files
- Main application index

### Key Learnings
- Avoid duplicate exports across DTOs (AdresseResponseDto was exported twice)
- Import shared types instead of redefining
- Use enums for bounded value types (Fournisseur, TypeConnexion)
- PaginationDto duplicated per context to avoid cross-context imports

## Infrastructure/Interfaces Migration (2026-02-05)

### Files Moved (55 total)

**Controllers (27)** → `interfaces/grpc/controllers/{context}/`
- Users (8): utilisateur, role, permission, role-permission, compte, membre-compte, invitation-compte, auth-sync
- Organisations (7): organisation, societe, partenaire-marque-blanche, theme-marque, role-partenaire, membre-partenaire, statut-partenaire
- Clients (10): client-base, client-entreprise, client-partenaire, adresse, statut-client + 5 referentiel controllers
- Documents (2): piece-jointe, boite-mail

**Services (27)** → `infrastructure/persistence/typeorm/repositories/{context}/`
- Same distribution as controllers

**Handlers (1)** → `infrastructure/messaging/nats/handlers/`
- contract-signed.handler.ts

### Import Path Patterns

**From infrastructure repositories to domain entities:**
```typescript
// Path: infrastructure/persistence/typeorm/repositories/{context}/
// Target: domain/{context}/entities/
import { XxxEntity } from '../../../../../domain/{context}/entities';
```
Note: 5 levels up from repositories to src/, then into domain/

**From interface controllers to infrastructure services:**
```typescript
// Path: interfaces/grpc/controllers/{context}/
// Target: infrastructure/persistence/typeorm/repositories/{context}/
import { XxxService } from '../../../../infrastructure/persistence/typeorm/repositories/{context}/xxx.service';
```
Note: 4 levels up from controllers to src/

### Entity Rename Handling
- Documents context has renamed entities: `PieceJointe` → `PieceJointeEntity`, `BoiteMail` → `BoiteMailEntity`
- Used type alias in services for backward compatibility:
```typescript
import { PieceJointeEntity } from '../../../../../domain/documents/entities';
type PieceJointe = PieceJointeEntity;
```

### Cross-Context Imports
- Some controllers (e.g., compte.controller, organisation.controller) import services from multiple contexts
- Pattern: Import each service from its full infrastructure path
- Example: `organisation.controller` imports from both `users/` and `organisations/` repositories

### Barrel Exports Created
- `interfaces/grpc/controllers/{context}/index.ts` for all 4 contexts
- `infrastructure/persistence/typeorm/repositories/{context}/index.ts` for all 4 contexts
- `infrastructure/messaging/nats/handlers/index.ts`

### Pre-existing Issues (Not Migration Related)
- `@crm/grpc-utils` - package not found
- `@crm/nats-utils` - package not found
- `@crm/proto/*` - proto generation incomplete


## Task 5: DDD Finalization - 2026-02-05

### Module Wiring Strategy
- Created bounded context modules (users.module.ts, organisations.module.ts, clients.module.ts, documents.module.ts)
- Each module imports TypeOrmModule.forFeature() for its entities
- Controllers from interfaces/grpc/controllers/{context}/
- Services from infrastructure/persistence/typeorm/repositories/{context}/
- Used forwardRef() for cross-context circular dependencies (users/organisations)

### Barrel Export Pattern
- domain/index.ts: Re-exports from all bounded contexts
- application/index.ts: Namespace exports (users, organisations, clients, documents)
- infrastructure/index.ts: Exports repositories grouped by context
- interfaces/index.ts: Exports controllers grouped by context

### App Module Simplification
- Reduced from 24 feature module imports to 4 bounded context modules
- Clean separation: ConfigModule, TypeOrmModule, NatsModule + 4 DDD modules

### Verification Results
- Build: 37 errors (all pre-existing @crm/proto, @crm/grpc-utils, @crm/nats-utils)
- No DDD structure import errors
- Tests: Deleted with old modules/ (need recreation)


## Service-Commercial DDD Refactoring (2026-02-05)

### Completed
- Migrated service-commercial from modules/ to DDD layers (domain, application, infrastructure, interfaces)
- Created 3 bounded contexts: commercial (11 entities), contrats (5 entities), products (8 entities)
- Build compiles successfully with: `cd services/service-commercial && bun run build`

### Key Learnings

1. **Shared DTOs**: When multiple contexts need PaginationDto, create a shared application layer (application/shared/dtos/) to avoid export conflicts

2. **Entity Relations**: Entities within same bounded context should use relative imports (./entity.ts), not cross-context imports

3. **Module Wiring**: Use forwardRef() for circular dependencies between bounded context modules

4. **Proto Enums**: Services may need to maintain local proto enum mappings for type safety

### Patterns Applied
- Repository interfaces in domain/{context}/repositories/I{Entity}Repository.ts
- Service ports in application/{context}/ports/I{Entity}Service.ts with Symbol exports
- Services in infrastructure/persistence/typeorm/repositories/{context}/
- Controllers in interfaces/grpc/controllers/{context}/
- Bounded context modules at src/{context}.module.ts

