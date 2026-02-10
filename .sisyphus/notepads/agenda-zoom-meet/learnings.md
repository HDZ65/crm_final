# Agenda Module Learnings

## Task 2: Data Foundation

### Proto Patterns
- Package name = directory name in `packages/proto/src/`
- Enum values must be prefixed (e.g., `OAUTH_PROVIDER_ZOOM` not just `ZOOM`) and have `UNSPECIFIED=0`
- Each proto file has its own `Pagination`, `PaginationResult`, `DeleteResponse` messages (not shared)
- `buf generate` outputs to `gen/ts/` (backend NestJS) and `gen/ts-frontend/` (frontend)
- Frontend proto copies live in `frontend/src/proto/<package>/` — must be manually copied from gen/ts-frontend

### Service Registration
- `packages/shared-kernel/src/infrastructure/grpc/service-config.ts` is the service registry
- Service names used in `getMultiGrpcOptions` must match keys in `SERVICE_REGISTRY`
- Multiple proto services share port 50051 via `getMultiGrpcOptions(['activites', 'notifications', 'email', 'agenda'])`

### Entity Patterns
- Entities live in `services/service-engagement/src/domain/engagement/entities/`
- Single barrel file `index.ts` re-exports all
- Entities must be registered in BOTH `engagement.module.ts` (TypeOrmModule.forFeature) AND `app.module.ts` (entities array)
- SnakeNamingStrategy is global but explicit `name: 'snake_case'` in @Column is still used for clarity
- Encrypted fields use `EncryptionService` (AES-256-GCM), stored as text columns with `_encrypted` suffix

### gRPC Controller Patterns
- Controllers use `@GrpcMethod('ServiceName', 'MethodName')` decorator
- No `@GrpcService()` decorator - just `@Controller()` with `@GrpcMethod` on each method
- Controllers are in `infrastructure/grpc/` with barrel file `index.ts`
- Agenda controllers placed in `infrastructure/grpc/agenda/` subfolder

### Service Stubs
- Named `*AgendaService` to avoid collision with existing `*Service` classes (e.g., `ActiviteService`)
- Live in `infrastructure/persistence/typeorm/repositories/engagement/`
- Inject `Repository<Entity>` via `@InjectRepository`

### Migration
- Use `migration:generate` (not `migration:create`) for auto-detection
- Manual migration created when DB connection unavailable
- Pattern: CREATE TYPE -> CREATE TABLE -> CREATE INDEX
- Down: DROP INDEX -> DROP TABLE -> DROP TYPE (reverse order)

### Build
- `bun run build` in service runs: proto:clean -> proto:generate -> nest build
- Proto generate copies specific files from packages/proto/gen/ts/ — need to add agenda copy step
- `bun run gen` in packages/proto runs `buf generate`

### Key Files Modified
- `packages/proto/src/agenda/agenda.proto` (NEW)
- `packages/proto/package.json` (added agenda export)
- `packages/shared-kernel/src/infrastructure/grpc/service-config.ts` (added agenda entry)
- `services/service-engagement/src/domain/engagement/entities/` (4 new entities + index)
- `services/service-engagement/src/infrastructure/grpc/agenda/` (4 new controllers + index)
- `services/service-engagement/src/infrastructure/persistence/typeorm/repositories/engagement/` (4 new services + index)
- `services/service-engagement/src/engagement.module.ts` (registered all new)
- `services/service-engagement/src/app.module.ts` (registered entities)
- `services/service-engagement/src/main.ts` (added 'agenda' to gRPC options)
- `services/service-engagement/src/migrations/` (new migration)
- `frontend/src/proto/agenda/agenda.ts` (copied from gen)

## Task 3: OAuth provider flows

- OAuth provider enum from gRPC arrives as numeric values (1 zoom, 2 google, 3 microsoft), so service-layer input should normalize both numeric and string forms.
- Callback `state` is a good place to carry `userId`, `organisationId`, provider, and requested scopes; base64url JSON keeps it transport-safe.
- Zoom token exchange differs from Google/Microsoft: prefers Basic auth (`client_id:client_secret`) at `/oauth/token`.
- Persisted OAuth tokens must be encrypted before save using `EncryptionService.encrypt(...)`; no plaintext token should enter entity fields.
- `bun run build` validates agenda OAuth wiring end-to-end because it regenerates proto artifacts before Nest build.
