# Learnings

## 2026-02-24 Session Start

### Proto File
- `packages/proto/src/woocommerce/woocommerce.proto`
- WooCommerceConfig message already has consumer_key (field 4) and consumer_secret (field 5) — but controller returns empty strings
- WooCommerceConfigService has: Create, Update, Get, GetByOrganisation, Delete, TestConnection — NO ListByOrganisation yet
- WooCommerceMapping message uses string entity_type (not an enum in proto)
- WooCommerceMapping has no config_id field
- Last field numbers in WooCommerceConfig: id=1..updated_at=13 → next is 14
- Last field numbers in WooCommerceMapping: id=1..updated_at=10 → next is 11
- Last field numbers in CreateWooCommerceMappingRequest: organisation_id=1..external_data=5 → next is 6

### Entity Files
- WooCommerceConfigEntity: organisationId has `unique: true` at line 15 — must remove
- WooCommerceConfigEntity: no societeId, no label fields yet
- Latest migration timestamp: 1770830000000-AddSocieteIdToGamme.ts → next should be 1770840000000+

### Architecture
- service-commercial uses DDD: domain/entities + domain/repos + infrastructure/persistence + infrastructure/grpc
- Build command: `bun run build` (not npm)
- Migrations in: services/service-commercial/src/migrations/

## Proto Build Completed (2026-02-24)

### Changes Applied
- ✅ WooCommerceConfig: Added `societe_id` (field 14, optional) and `label` (field 15)
- ✅ CreateWooCommerceConfigRequest: Added `societe_id` (field 9, optional) and `label` (field 10)
- ✅ UpdateWooCommerceConfigRequest: Added `societe_id` (field 10, optional) and `label` (field 11)
- ✅ WooCommerceConfigService: Added new RPC `ListByOrganisation(ListByOrganisationConfigRequest) returns (ListByOrganisationConfigResponse)`
- ✅ New messages: `ListByOrganisationConfigRequest` and `ListByOrganisationConfigResponse`
- ✅ WooCommerceMapping: Added `config_id` (field 11, optional)
- ✅ CreateWooCommerceMappingRequest: Added `config_id` (field 6, optional)

### Build Result
- Command: `npm run build` (which runs `npm run gen:all`)
- Exit code: 0 (success)
- Generated files: `packages/proto/gen/ts/woocommerce/woocommerce.ts`
- All new fields present in TypeScript interfaces
- RPC method properly generated with gRPC handlers

### Notes
- Build warnings about duplicate google/protobuf/timestamp.ts are pre-existing (not caused by our changes)
- Field numbering is correct (no gaps, sequential)
- All optional fields properly marked with `optional` keyword

## 2026-02-24 WooCommerce Import Refactor
- Frontend WooCommerce config gRPC client now exposes listByOrganisation with ListByOrganisation request/response types.
- Added listWooCommerceConfigsByOrganisation server action and wired mapping creation to accept optional configId.
- Added importFromWooCommerce(organisationId) in catalogue-api.ts with per-config debounce (60s), WC pagination, config-scoped mapping upsert, gamme auto-create by config label, orphan CRM product cleanup, and post-sync config update call.
- npx tsc --noEmit currently fails on unrelated pre-existing errors in src/actions/winleadplus.ts and src/app/(main)/taches/*; changed files are LSP-clean.
