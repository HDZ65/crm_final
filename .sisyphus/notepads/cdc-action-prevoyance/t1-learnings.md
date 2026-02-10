# Task 1 Learnings - Extension Client Multi-Service

## Conventions Found

### Entity Pattern (service-core)
- Table name: `clientbases` (snake_case, no underscore between words for table name)
- Column decorator: `@Column({ name: 'snake_case', type: '...', nullable: true/false })`
- TypeScript property: camelCase (`hasConciergerie`, `uuidWincash`)
- SnakeNamingStrategy is configured globally in app.module.ts
- Nullable fields use `Type | null` pattern
- Boolean fields use `default: false` (not nullable)

### Proto Pattern
- Proto file: `packages/proto/src/clients/clients.proto`
- Generated TS: `packages/proto/gen/ts/clients/clients.ts`
- Service-core copy: `services/service-core/proto/generated/clients.ts`
- Proto uses snake_case for field names
- Optional fields in proto generate `Type | undefined` in TS
- New fields added at end of message with sequential field numbers
- `ClientBase` message ended at field 23, new fields start at 24
- `CreateClientBaseRequest` ended at field 11, new fields start at 12
- `UpdateClientBaseRequest` ended at field 11, new fields start at 12

### Proto Generation Flow
1. `buf generate` in `packages/proto/` (generates `gen/ts/`)
2. `proto:generate` script in service-core copies from `gen/ts/` to `proto/generated/`
3. `prebuild` runs `proto:clean` then `proto:generate` before `nest build`
4. **CAVEAT**: proto:generate script uses Unix commands (mkdir -p, cp) which fail on Windows cmd.exe. In bash shell it works fine.

### Migration Pattern
- Directory: `services/service-core/src/migrations/`
- No existing migrations (directory was empty)
- Migrations auto-loaded via glob: `__dirname + '/migrations/*{.ts,.js}'`
- `migrationsRun: true` in app.module.ts (auto-run on startup)
- `synchronize: true` in non-production (dev/test sync schema automatically)
- TypeORM CLI configured via `src/datasource.ts` (not found, uses app.module config)
- Migration class naming: `{MigrationName}{Timestamp}` implements `MigrationInterface`

### Build
- `nest build` (via `./node_modules/.bin/nest build`)
- `tsc --noEmit` for type checking
- Zero errors after changes
