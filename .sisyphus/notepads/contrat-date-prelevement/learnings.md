# Learnings — contrat-date-prelevement

## Conventions & Patterns

(Will be populated as tasks execute)

## Architecture Decisions

(Will be populated as tasks execute)

## Task 2 — Contract Import Service (Phase 2)

### Proto Registration
- `getMultiGrpcOptions(['contrats'])` maps to `contrats/contrats.proto` with package `contrats`
- New services in the same proto file + same package are automatically available — no `main.ts` changes needed
- Proto service name in `@GrpcMethod` decorator must match exactly the proto service name (e.g., `'ContratImportService'`)

### HTTP Calls Pattern
- No `@nestjs/axios` or `HttpModule` in service-commercial — use native `fetch` (Node.js 18+ / Bun built-in)
- For UUID generation, use `crypto.randomUUID()` (built-in) instead of `uuid` package (not in deps)

### Upsert Pattern
- `ContratService.findByReference()` throws `RpcException` on not found — NOT suitable for upsert logic
- For upsert, inject `Repository<ContratEntity>` directly and use `repository.findOne()` which returns `null` on not found
- Unique index on `(organisationId, reference)` enforces uniqueness in DB

### Module Registration
- Add domain service to `providers` array in `contrats.module.ts`
- Add gRPC controller to `controllers` array
- Export new controller from `infrastructure/grpc/contrats/index.ts`

### Error Handling
- External API errors: retry once on 5xx, fail immediately on 401/403/404
- Row-level errors: skip row, add to errors array, continue processing remaining rows
- Invalid `jour_prelevement`: log warning, ignore field, continue (don't skip whole row)

## Task — Wire Contract Debit Configuration gRPC Methods (Phase 0)

### gRPC Service Name Mismatch
- Proto defines `DebitConfigurationService` for all config CRUD (system, company, client, contract, resolve)
- Existing controller used `CalendarConfigurationService` for GetSystemConfig and UpdateSystemConfig — this is a legacy mismatch
- New contract-level methods correctly use `DebitConfigurationService` to match the proto
- Both names coexist in the same controller — NestJS registers handlers for each service name independently

### Proto Type Resolution
- `@proto/calendar` resolves to `services/service-finance/proto/generated/calendar.ts`
- Proto TS is generated via `bun run build` which runs `proto:clean && proto:generate` (copies from `packages/proto/gen/ts/calendar/calendar.ts`)
- All request/response interfaces are available: `CreateContractConfigRequest`, `UpdateContractConfigRequest`, etc.
- `ConfigurationLevel` enum exists for ResolveConfiguration response

### Controller → Service Wiring Pattern
- Controller maps snake_case proto fields to camelCase domain fields
- Domain enums (DebitDateMode, DebitBatch, DateShiftStrategy) differ from Proto enums — bidirectional mapping needed
- `toProto*` helpers convert domain→proto, `toDomain*` helpers convert proto→domain
- `toProtoContractConfig` helper maps full entity to proto response

### ConfigurationService Gaps
- Service initially only had `getContractConfig(contratId)` — no CRUD methods for contract config
- Added: `createContractConfig`, `updateContractConfig`, `deleteContractConfig`, `listContractConfigs`, `getContractConfigById`
- `getContractConfig(contratId)` filters by `isActive: true`, `getContractConfigById(id)` does not filter

### ResolveConfiguration v1
- Simple implementation: return contract config if contrat_id provided and config exists
- Returns `CONFIGURATION_LEVEL_UNSPECIFIED` with empty values if no config found
- Future: implement full hierarchy (Contract → Client → Company → System)

### Build Path
- `bun run build` → `nest build` → output in `dist/src/` (not `dist/`)
- Entry point: `dist/src/main.js`
