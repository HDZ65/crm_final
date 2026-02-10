# Task: Create InformationPaiementBancaire Entity

## Date
2026-02-10

## Summary
Created complete TypeORM entity `InformationPaiementBancaireEntity` with CRUD service, gRPC controller, proto definition, and database migration for storing IBAN/BIC payment information in clear text.

## Patterns Discovered

### Entity Pattern (TypeORM)
- **Location**: `services/service-finance/src/domain/payments/entities/*.entity.ts`
- **Key decorators**:
  - `@Entity('table_name')` - defines table name in snake_case
  - `@PrimaryGeneratedColumn('uuid')` - UUID primary key
  - `@Column({ name: 'snake_case_name' })` - column with explicit DB name
  - `@Index()` - creates database index on column
  - `@CreateDateColumn()` / `@UpdateDateColumn()` - automatic timestamps
- **Naming convention**: Entity class in PascalCase, DB columns in snake_case
- **Business methods**: Add helper methods like `isActif()`, `canBeUsedForPayment()`, `getMaskedIban()`

### Service Pattern (Repository)
- **Location**: `services/service-finance/src/infrastructure/persistence/typeorm/repositories/payments/*.service.ts`
- **Pattern**: Injectable service with `@InjectRepository()` decorator
- **CRUD methods**: create, findById, findByClientId, findByExternalId, update, delete
- **Upsert pattern**: `upsertByExternalId()` with conflict resolution based on `updated_at` timestamp (most recent wins)
- **Logging**: Use `Logger` from `@nestjs/common` for all operations

### gRPC Controller Pattern
- **Location**: `services/service-finance/src/infrastructure/grpc/payments/*.controller.ts`
- **Pattern**: `@Controller()` with `@GrpcMethod('ServiceName', 'MethodName')` decorators
- **Mapping**: Private `toProtoResponse()` method to convert entity to proto message
- **Error handling**: Throw standard Error for not found cases (gRPC will convert to proper status)

### Proto Definition Pattern
- **Location**: `packages/proto/src/payments/*.proto`
- **Syntax**: `syntax = "proto3";`
- **Package**: `package payment_info;`
- **Service definition**: `service InformationPaiementBancaireService { rpc ... }`
- **Messages**: Request/Response pairs for each RPC method
- **Optional fields**: Use `optional` keyword for nullable fields
- **Timestamps**: Use `string` type with ISO format for dates

### Migration Pattern (TypeORM)
- **Location**: `services/service-finance/src/migrations/*.ts`
- **Naming**: `{timestamp}-{DescriptiveName}.ts` (e.g., `1739203200000-CreateInformationPaiementBancaire.ts`)
- **Class name**: `{DescriptiveName}{timestamp}` implements `MigrationInterface`
- **Methods**: `up()` and `down()` for forward/backward migration
- **Table creation**: Use `queryRunner.createTable()` with `Table` object
- **Indexes**: Use `queryRunner.createIndex()` with `TableIndex` object
- **Unique constraints**: Use `isUnique: true` in `TableIndex` with optional `where` clause

### Module Wiring Pattern
- **Location**: `services/service-finance/src/payments.module.ts`
- **Steps**:
  1. Import entity from `./domain/payments/entities`
  2. Import service from `./infrastructure/persistence/typeorm/repositories/payments`
  3. Import controller from `./infrastructure/grpc/payments`
  4. Add entity to `TypeOrmModule.forFeature([...])`
  5. Add controller to `controllers: [...]`
  6. Add service to `providers: [...]`
  7. Add service to `exports: [...]` if needed by other modules

### Proto Build Integration
- **Proto generation**: `bun run build` in `packages/proto` generates TypeScript files
- **Service integration**: Update `proto:generate` script in `package.json` to copy generated files
- **Pattern**: `cp ../../packages/proto/gen/ts/payments/payment-info.ts ./proto/generated/payment-info.ts`
- **Import**: Use `@proto/payment-info` alias in controllers

## Gotchas

1. **Proto file must be built first**: Run `bun run build` in `packages/proto` before building service-finance
2. **Update package.json**: Add new proto file to `proto:generate` script in service-finance
3. **Module registration**: Must add entity to BOTH `TypeOrmModule.forFeature()` AND import list
4. **Index naming**: Use descriptive names like `idx_table_column` for clarity
5. **Unique constraints with NULL**: Use `where: 'column IS NOT NULL'` to allow multiple NULL values
6. **Composite unique constraint**: Use multiple columns in `columnNames` array for (organisation_id, external_id) uniqueness
7. **Clear text storage**: IBAN/BIC stored without encryption as per requirements - add comment in column definition
8. **Timestamp handling**: Proto uses ISO string format, convert with `new Date(string)` and `.toISOString()`

## Files Created

1. `services/service-finance/src/domain/payments/entities/information-paiement-bancaire.entity.ts` - Entity definition
2. `services/service-finance/src/infrastructure/persistence/typeorm/repositories/payments/information-paiement-bancaire.service.ts` - CRUD service
3. `services/service-finance/src/infrastructure/grpc/payments/information-paiement-bancaire.controller.ts` - gRPC controller
4. `packages/proto/src/payments/payment-info.proto` - Proto definition
5. `services/service-finance/src/migrations/1739203200000-CreateInformationPaiementBancaire.ts` - Database migration

## Files Modified

1. `services/service-finance/src/domain/payments/entities/index.ts` - Added entity export
2. `services/service-finance/src/payments.module.ts` - Registered entity, service, controller
3. `services/service-finance/package.json` - Updated proto:generate script

## Build Verification

- ✅ `bun run build` in `packages/proto` - SUCCESS
- ✅ `bun run build` in `services/service-finance` - SUCCESS (zero errors)
- ✅ LSP diagnostics - No errors on service and controller files

## Next Steps for Import

The entity is ready for the import process:
- `external_id` field maps to `idInfoPaiement` from JSON
- `upsertByExternalId()` method handles create/update with conflict resolution
- Most recent data wins based on `updated_at` timestamp
- Unique constraint prevents duplicate external_id per organisation



# Task: Create Dashboard Contrats Par Commercial Component

## Date
2026-02-10

## Summary
Created KPI component showing contracts count and total amount per sales representative on home dashboard page. Component follows existing dashboard-kpis.tsx styling patterns with Card layout, refresh functionality, and error handling.

## Patterns Discovered

### Dashboard Component Pattern
- **Location**: `frontend/src/components/dashboard-*.tsx`
- **Key features**:
  - Client component with `"use client"` directive
  - Uses `useOrganisation()` hook for active org context
  - Supports `initialData` prop for server-side rendering
  - Implements loading, error, and empty states
  - Refresh button with `RefreshCw` icon
  - Uses `hasFetched` ref to prevent double-fetching

### Server Action Pattern
- **Location**: `frontend/src/actions/dashboard-*.ts`
- **Pattern**: `"use server"` directive at top
- **Return type**: `ActionResult<T>` with `{ data, error }` structure
- **Error handling**: Try/catch with console.error logging
- **Mock data**: Use mock data with TODO comment for backend integration

### Card Layout Pattern
- **Components**: Card, CardHeader, CardTitle, CardContent from `@/components/ui/card`
- **Header structure**:
  - Icon in rounded-lg bg-primary/10 container (h-10 w-10)
  - Title with responsive text size (text-base md:text-lg)
  - Action buttons (refresh, AI) in flex container
- **Content structure**:
  - Grid or space-y layout for items
  - Rounded-lg border bg-background for item containers
  - Tabular-nums for numeric values
  - French number/currency formatting with Intl.NumberFormat

### Integration Pattern
- **Page location**: `frontend/src/app/(main)/page.tsx`
- **Import**: Add component import at top
- **Placement**: Add to existing grid section (lg:grid-cols-2)
- **Props**: Pass initialData if available from server

## Gotchas

1. **Client component required**: Must use `"use client"` for hooks (useOrganisation, useState, useEffect)
2. **Double-fetch prevention**: Use `hasFetched.current` ref to prevent fetching when initialData provided
3. **Organisation check**: Always check `activeOrganisation` before fetching data
4. **French formatting**: Use `fr-FR` locale for Intl.NumberFormat
5. **Sorting**: Sort data client-side before rendering (e.g., by count descending)
6. **Build verification**: Always run `bun run build` to verify TypeScript compilation

## Files Created

1. `frontend/src/actions/dashboard-contrats-commercial.ts` - Server action with mock data
2. `frontend/src/components/dashboard-contrats-par-commercial.tsx` - Client component

## Files Modified

1. `frontend/src/app/(main)/page.tsx` - Added component import and placement after ContratsCard

## Build Verification

- ✅ `bun run build` in frontend - SUCCESS (zero errors)
- ✅ LSP diagnostics - No errors on created/modified files
- ✅ Component follows existing styling patterns from dashboard-kpis.tsx

## Component Features

- Shows commercial name, contract count, and total amount
- Sorted by contract count descending
- Refresh button to reload data
- Loading, error, and empty states
- Responsive layout matching existing dashboard cards
- French currency formatting (EUR)
- Mock data ready for backend integration

# Task: Service-Commercial Import Orchestrator

## Date
2026-02-10

## Summary
Implemented a full import orchestrator flow for `service-commercial` with strict dependency ordering (Commercial -> Client -> Offres -> Contrats -> Souscriptions -> Paiements), per-prospect fault isolation, dry-run mode, pagination-aware API fetch, and timestamp-based conflict resolution.

## Patterns Discovered

### Ordered Multi-Entity Import Pattern
- Process each prospect as an independent transaction boundary (logical, not DB transaction)
- Apply deterministic dependency order to ensure FK targets exist before child upserts
- Keep a per-prospect in-memory map (`contrat external_id -> local contrat_id`) for subsequent souscription linking

### Conflict Resolution Pattern (Most Recent Wins)
- Resolve source freshness from `updated_at` first, fallback to `created_at`
- For existing entities, skip updates when local `updatedAt` is newer than incoming timestamp
- When incoming timestamp is missing/invalid, allow update to keep import progressive

### Dry-Run Pattern for Cross-Service + Local Upserts
- Execute lookup/search calls normally to classify outcomes (create/update/skip)
- Skip all mutating calls (local saves + gRPC create/update/upsert)
- Return deterministic synthetic IDs for chained dry-run dependency links

### Cross-Service gRPC Client Pattern (loadGrpcPackage)
- Build lightweight clients in orchestrator service using:
  - `loadGrpcPackage('<package>')`
  - constructor lookup in package namespace
  - `credentials.createInsecure()`
- Wrap callback APIs into Promises for linear async orchestration
- Keep optional/defensive behavior for partially available upstream services

### External API Pagination Pattern
- Request `GET {apiUrl}/api/prospects?has_contrats=true&page=X&limit=Y`
- Accept both array responses and object envelopes (`data`, `prospects`, `items`, `results`)
- Detect continuation with `pagination.total_pages`, `meta.total_pages`, `next_page_url`, fallback by page size

## Files Created
- `services/service-commercial/src/domain/import/services/import-orchestrator.service.ts`
- `services/service-commercial/src/domain/import/services/import-mapper.service.ts`
- `services/service-commercial/src/infrastructure/grpc/import/import-orchestrator.controller.ts`

## Files Modified
- `services/service-commercial/src/contrats.module.ts`

## Validation
- `bun run build` in `services/service-commercial` succeeded
- LSP diagnostics returned no issues on changed files
