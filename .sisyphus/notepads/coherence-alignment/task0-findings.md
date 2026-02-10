## Task 0 - Validate Foundations (Proto Imports & keepCase)

- Proto generation status: `packages/proto/gen/ts` contains 36 `.ts` files.
- Required generated files verified: `packages/proto/gen/ts/clients/clients.ts` and `packages/proto/gen/ts/logistics/logistics.ts` exist.
- `packages/proto/buf.gen.yaml` backend generation uses `snakeToCamel=false` (snake_case generated fields).
- `packages/shared-kernel/src/infrastructure/grpc/service-config.ts` does not define `keepCase`; active gRPC loader settings are in shared-kernel grpc loaders.
- Shared-kernel keepCase changed from `false` to `true` in:
  - `packages/shared-kernel/src/infrastructure/grpc/proto-loader.ts`
  - `packages/shared-kernel/src/infrastructure/grpc/grpc-client.ts`
- Controller field access check: `services/service-core/src/interfaces/grpc/controllers/clients/client-base.controller.ts` currently uses camelCase (`data.organisationId`) in `searchClient`.
- Naming conclusion: generated proto TS contracts are snake_case, runtime loader is now aligned to preserve snake_case.

## Verification Notes

- `@crm/proto` resolution in `service-logistics` initially failed due empty local file-dependency installs (`node_modules/@crm/proto`, `node_modules/@crm/shared-kernel`) from `bun install` EPERM copy errors.
- Verification workaround applied locally:
  - Built `packages/shared-kernel` (`bun run build`) to generate `dist`.
  - Refreshed `services/service-logistics/node_modules/@crm/proto` and `services/service-logistics/node_modules/@crm/shared-kernel` from workspace packages.
- Build verification passed in `services/service-logistics` with `bun run build`.
- Temporary import-check file was created and removed after verification (`services/service-logistics/src/__proto_import_check__.ts`).
