# Issues & Gotchas — contrat-date-prelevement

## Problems Encountered

(Will be populated as tasks execute)

### Task 2 — Contract Import Service

- **No `uuid` in dependencies**: `@types/uuid` in devDeps but `uuid` package not in deps. Used `crypto.randomUUID()` instead.
- **`ContratService.findByReference()` throws on not found**: Cannot use for upsert — had to inject `Repository<ContratEntity>` directly and use `findOne()` which returns null.
- **`jour_prelevement` not persisted on ContratEntity**: The field is captured from external API but currently only logged. Will need integration with service-finance (Task 3) to actually set up debit configuration via event.
- **In-memory import status**: `importStatuses` Map is ephemeral — lost on service restart. Acceptable for v1 but should be persisted to DB for production use.

### Task — Wire Contract Debit Configuration gRPC Methods

- **DB not available locally**: Cannot run full QA grpcurl scenarios — service starts but DB connection (PostgreSQL) fails with ECONNREFUSED. Proto methods verified listed correctly via Node.js grpc-js client.
- **grpcurl not installed on Windows**: Had to use Node.js `@grpc/grpc-js` + `@grpc/proto-loader` for ad-hoc testing instead.
- **CalendarConfigurationService vs DebitConfigurationService**: Existing system config methods use wrong service name (`CalendarConfigurationService`). Not fixing per task scope — only adding new contract methods on `DebitConfigurationService`.
- **GetContractConfig proto uses `id` not `contrat_id`**: Proto `GetContractConfigRequest` has `string id = 1` (config ID), not contrat_id. The success criteria in the task description uses `contrat_id` but the actual proto definition expects `id`. Implementation follows proto.
