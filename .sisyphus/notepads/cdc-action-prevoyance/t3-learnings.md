# Task 3 Learnings — Proto Definitions for New Services

## Proto Conventions Discovered

1. **Package per domain**: Each proto file uses its own package name (e.g., `package conciergerie;`), NOT a shared `services` package. This avoids message name collisions.

2. **Directory structure**: Proto source files go in `packages/proto/src/<domain>/`. New services placed in `src/services/` subfolder since they're all new service domains.

3. **Pagination is per-package**: Each proto file defines its own `PaginationRequest`/`PaginationResponse`. No shared common pagination message across packages.

4. **Field naming**: All fields use `snake_case` (enforced by buf). No camelCase in proto definitions.

5. **Enum naming**: Enum values must be prefixed with the enum type in SCREAMING_SNAKE_CASE (e.g., `STATUT_DEMANDE_NOUVELLE` for `StatutDemande` enum). First value is always `UNSPECIFIED = 0`.

6. **Event metadata pattern**: All events follow the same metadata structure:
   - `string event_id = 1;` (UUID for idempotency)
   - `int64 timestamp = 2;` (Unix ms)
   - `string correlation_id = 3;` (tracing)

7. **Generation**: `buf generate` in `packages/proto/` generates to both `gen/ts/` (NestJS backend) and `gen/ts-frontend/` (vanilla gRPC-js).

8. **Package.json exports**: Must be updated manually in `packages/proto/package.json` for each new proto file.

9. **Pre-existing errors**: `payments/payment.proto` has many undefined message references — these are pre-existing and don't block generation (buf exits 0 despite warnings).

10. **Duplicate timestamp.ts**: Multiple protos importing `google/protobuf/timestamp.proto` cause harmless "duplicate generated file name" warnings — safe to ignore.

## Generated Types Available At

| Import Path | File |
|---|---|
| `@crm/proto/conciergerie` | `gen/ts/services/conciergerie.ts` |
| `@crm/proto/justiplus` | `gen/ts/services/justi-plus.ts` |
| `@crm/proto/wincash` | `gen/ts/services/wincash.ts` |
| `@crm/proto/bundle` | `gen/ts/services/bundle.ts` |
| `@crm/proto/events/services` | `gen/ts/events/services.ts` |

## Service Interfaces Generated

Each service generates 3 TypeScript interfaces:
- `*SvcClient` — for gRPC client calls
- `*SvcController` — for NestJS controller implementation
- `*SvcServer` — for raw gRPC server implementation
