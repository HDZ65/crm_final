# WinLeadPlus Integration into CRM

## TL;DR

> **Quick Summary**: Import WinLeadPlus prospects as CRM clients (with contracts, subscriptions, payment info) via hourly auto-sync + manual button. Integrated into the existing Clients page with a "source" badge. Auth reuses existing Keycloak token.
> 
> **Deliverables**:
> - Proto: `source` field added to ClientBase
> - Backend: WinLeadPlus domain in `service-commercial` (sync service, mapper, scheduler, entities)
> - Backend: Client creation via NATS events to `service-core`
> - Frontend: Server actions for sync operations
> - Frontend: Source badge + working source filter on Clients page
> - Frontend: Manual "Sync WinLeadPlus" button in Clients page header
> 
> **Estimated Effort**: Large
> **Parallel Execution**: YES - 3 waves
> **Critical Path**: Task 1 (Proto) → Task 2 (Backend domain) → Task 3 (Scheduler) → Task 5 (Frontend actions) → Task 6 (UI)

---

## Context

### Original Request
Integrate WinLeadPlus external API into the CRM. Prospects from WinLeadPlus should appear as clients in the Clients page with their contracts, subscriptions, and payment information. Sync should be automatic (hourly) with a manual trigger button.

### Interview Summary
**Key Decisions**:
- **Objective**: Import (not read-only, not bidirectional) — WinLeadPlus prospects become full CRM clients
- **Auth**: Same Keycloak — Bearer token from user's session forwarded to WinLeadPlus API
- **Access**: All organization users see WinLeadPlus-sourced clients
- **Data scope**: Full import — prospect + contrats + abonnements + informationsPaiement + commercialId
- **Sync**: Auto every hour (`@Cron('0 * * * *')`) + manual refresh button
- **UI**: Integrated into existing Clients page (no dedicated WinLeadPlus page)
- **Updates**: Auto-update — CRM client updated automatically when WinLeadPlus data changes
- **API URL**: `https://winleadplus.com/api/prospects`
- **Tests**: None — QA agent verification only

**Research Findings**:
- **WooCommerce pattern exists** in `services/service-commercial/src/domain/woocommerce/` — provides template for domain structure (entities, repos, services, NATS workers)
- **Contract import pattern** exists in `services/service-commercial/src/domain/import/` — ImportOrchestratorService with dry_run, batch processing
- **Source filter partially exists** — Zustand store has `source` field, UI has text input, but data model lacks field and filter logic is dead code
- **Cross-service concern**: Clients are in `service-core` (port 50052), Contracts in `service-commercial` (port 50053). Sync orchestrator lives in `service-commercial`, creates clients via NATS event to `service-core`
- **@nestjs/schedule** already installed in `service-commercial`
- **commercialId** in WinLeadPlus data = Keycloak UUID = linkable to CRM commercial users

### Metis Review
**Identified Gaps** (addressed):
- **Auth type for WinLeadPlus API**: Resolved — Keycloak Bearer token forwarded from user session. For scheduled sync (no user session), use a service account token or stored refresh token.
- **Source tracking**: Resolved — New `source` field (field 31) on ClientBase proto. Cleaner than reusing `canal_acquisition`.
- **Source filter dead code**: Resolved — Will wire up the existing UI to the new field.
- **Cross-service orchestration**: Resolved — service-commercial orchestrates sync, publishes NATS events for service-core to create/update clients.
- **Multi-org**: Resolved — Single org via env var (matches current CRM pattern). WinLeadPlus config stored per organisation.
- **Scheduler auth**: Resolved — Scheduled sync needs a service-to-service auth mechanism (service account or API key stored in WinLeadPlus config entity) since no user session exists during @Cron execution.

---

## Work Objectives

### Core Objective
Enable automatic and manual synchronization of WinLeadPlus prospects into the CRM as clients with full contract, subscription, and payment data, visible and filterable by source in the existing Clients page.

### Concrete Deliverables
1. Proto: `source` field on `ClientBase` + `WinLeadPlusSyncService` definition
2. Backend entities: WinLeadPlusConfig, WinLeadPlusMapping, WinLeadPlusSyncLog
3. Backend services: WinLeadPlusSyncService, WinLeadPlusMapperService
4. Backend scheduler: @Cron hourly sync
5. Backend NATS: Events for client creation/update to service-core
6. Frontend: Server actions (`winleadplus.ts`)
7. Frontend: Source badge in Clients table + working source filter
8. Frontend: Manual sync button with progress indicator

### Definition of Done
- [x] Hourly @Cron job calls WinLeadPlus API and creates/updates CRM clients
- [x] Manual sync button triggers immediate sync and shows result toast
- [x] Clients page shows "WinLeadPlus" badge for imported clients
- [x] Source filter in advanced filters works for "WinLeadPlus" value
- [x] Duplicate prevention via mapping table (WinLeadPlus prospect ID ↔ CRM client ID)
- [x] Contracts imported and linked to correct client
- [x] Payment info (IBAN, mandat SEPA) stored on client
- [x] Commercial association preserved (commercialId → CRM commercial)

### Must Have
- Source tracking on all imported entities
- Mapping table to prevent duplicate imports
- Error handling with sync logs
- Auto-update existing clients when WinLeadPlus data changes
- Manual sync with user feedback (toast/progress)

### Must NOT Have (Guardrails)
- ❌ Dedicated WinLeadPlus page — everything in Clients page
- ❌ Bidirectional sync — WinLeadPlus is read-only source of truth
- ❌ Modification of Keycloak configuration
- ❌ New microservice — use existing service-commercial
- ❌ Complex conflict resolution UI — auto-update wins silently
- ❌ Unit tests or integration tests — QA agent verification only
- ❌ Migration of existing clients — only new sync going forward
- ❌ Abstraction layers beyond what the WooCommerce pattern uses

---

## Verification Strategy

> **UNIVERSAL RULE: ZERO HUMAN INTERVENTION**
>
> ALL tasks are verifiable WITHOUT any human action.
> ALL verification is executed by the agent using tools (Playwright, curl, tmux).

### Test Decision
- **Infrastructure exists**: YES (@nestjs/schedule, existing test patterns)
- **Automated tests**: None (user choice)
- **Framework**: N/A

### Agent-Executed QA Scenarios (MANDATORY — ALL tasks)

QA scenarios are the PRIMARY verification method. The executing agent directly verifies each deliverable by running it.

**Verification Tool by Deliverable Type:**

| Type | Tool | How Agent Verifies |
|------|------|-------------------|
| Proto compilation | Bash | `npx buf generate` or proto compiler — no errors |
| Backend service | Bash (curl/grpcurl) | Call gRPC endpoints, assert responses |
| Frontend UI | Playwright | Navigate, interact, assert DOM, screenshot |
| Scheduler | Bash (logs) | Check container logs for cron execution |
| NATS events | Bash (nats-cli) | Monitor NATS subjects for published events |

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Start Immediately):
├── Task 1: Proto updates (source field + WinLeadPlus service definition)
└── Task 2: Backend domain scaffolding (entities, repos — no proto dependency for structure)

Wave 2 (After Wave 1):
├── Task 3: Backend sync service + mapper + scheduler (depends: proto + entities)
├── Task 4: Service-core NATS handler for client creation with source (depends: proto)
└── Task 5: Frontend server actions (depends: proto)

Wave 3 (After Wave 2):
├── Task 6: Frontend UI — source badge, filter wiring, sync button (depends: actions)
└── Task 7: Docker/deployment + end-to-end verification (depends: all)

Critical Path: Task 1 → Task 3 → Task 5 → Task 6 → Task 7
Parallel Speedup: ~35% faster than sequential
```

### Dependency Matrix

| Task | Depends On | Blocks | Can Parallelize With |
|------|------------|--------|---------------------|
| 1 | None | 3, 4, 5 | 2 |
| 2 | None | 3 | 1 |
| 3 | 1, 2 | 5, 7 | 4 |
| 4 | 1 | 7 | 3, 5 |
| 5 | 1, 3 | 6 | 4 |
| 6 | 5 | 7 | None |
| 7 | All | None | None (final) |

### Agent Dispatch Summary

| Wave | Tasks | Recommended Agents |
|------|-------|-------------------|
| 1 | 1, 2 | quick (proto update), unspecified-high (domain scaffold) |
| 2 | 3, 4, 5 | ultrabrain (sync logic), quick (NATS handler), quick (actions) |
| 3 | 6, 7 | visual-engineering (UI), deep (e2e deploy) |

---

## TODOs

- [x] 1. Add `source` field to ClientBase proto + Define WinLeadPlusSyncService proto

  **What to do**:
  - Add `optional string source = 31;` to `ClientBase` message in `packages/proto/src/clients/clients.proto`
  - Add `optional string source` to `CreateClientBaseRequest` and `UpdateClientBaseRequest` messages
  - Add `optional string source` to `ListClientsBaseRequest` for server-side filtering
  - Create new proto file `packages/proto/src/winleadplus/winleadplus.proto` with:
    - `WinLeadPlusSyncService` service (SyncProspects, GetSyncStatus, GetSyncLogs, TestConnection, GetConfig, SaveConfig)
    - `WinLeadPlusConfig` message (id, organisation_id, api_endpoint, enabled, sync_interval_minutes, last_sync_at, created_at, updated_at)
    - `WinLeadPlusMapping` message (id, organisation_id, winleadplus_prospect_id, crm_client_id, crm_contrat_ids, last_synced_at)
    - `WinLeadPlusSyncLog` message (id, organisation_id, started_at, finished_at, status, total_prospects, created, updated, skipped, errors)
    - `SyncProspectsRequest` (organisation_id, dry_run)
    - `SyncProspectsResponse` (success, sync_log)
  - Regenerate TypeScript types: run proto compilation for frontend
  - Register the new proto in the buf/protoc configuration

  **Must NOT do**:
  - Do NOT rename or reorganize existing proto fields
  - Do NOT change existing field numbers
  - Do NOT modify other proto files beyond clients.proto

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Proto updates are well-scoped file edits following established patterns
  - **Skills**: [`microservice-maintainer`]
    - `microservice-maintainer`: Knows how to add fields to existing protos and create new service definitions in this DDD codebase

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Task 2)
  - **Blocks**: Tasks 3, 4, 5
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `packages/proto/src/clients/clients.proto:130-161` — ClientBase message definition. Add `source` as field 31 after `canal_acquisition` (field 30)
  - `packages/proto/src/clients/clients.proto` — Find `CreateClientBaseRequest` and `UpdateClientBaseRequest` messages, add `source` field
  - `packages/proto/src/clients/clients.proto` — Find `ListClientsBaseRequest` message, add optional `source` filter
  - `packages/proto/src/contrats/contrats.proto:1-30` — Example proto file structure (syntax, package, imports) to follow for new winleadplus.proto

  **API/Type References**:
  - `frontend/src/proto/clients/clients.ts` — Generated TypeScript (will be regenerated). Shows expected output format

  **Documentation References**:
  - WinLeadPlus sample data structure (see Context section) — defines the fields to map

  **Acceptance Criteria**:

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: Proto files compile without errors
    Tool: Bash
    Preconditions: Proto compiler (buf or protoc) available
    Steps:
      1. Run proto compilation command from packages/proto/
      2. Assert: Exit code 0, no error output
      3. Verify generated files exist in frontend/src/proto/clients/clients.ts
      4. Verify generated files exist in frontend/src/proto/winleadplus/winleadplus.ts
      5. grep for "source" in generated clients.ts → must find field
    Expected Result: All proto files compile, TypeScript generated with source field
    Evidence: Compilation output captured

  Scenario: ClientBase source field is optional and typed string
    Tool: Bash
    Preconditions: Proto compiled
    Steps:
      1. Read generated frontend/src/proto/clients/clients.ts
      2. Assert: ClientBase interface contains `source?: string`
      3. Read generated frontend/src/proto/winleadplus/winleadplus.ts
      4. Assert: WinLeadPlusSyncService methods exist
    Expected Result: TypeScript types correctly reflect proto changes
    Evidence: File contents captured
  ```

  **Commit**: YES
  - Message: `feat(proto): add source field to ClientBase and WinLeadPlusSyncService definition`
  - Files: `packages/proto/src/clients/clients.proto`, `packages/proto/src/winleadplus/winleadplus.proto`, `frontend/src/proto/**`

---

- [x] 2. Scaffold WinLeadPlus backend domain in service-commercial

  **What to do**:
  - Create domain directory structure following WooCommerce pattern:
    ```
    services/service-commercial/src/domain/winleadplus/
    ├── entities/
    │   ├── winleadplus-config.entity.ts
    │   ├── winleadplus-mapping.entity.ts
    │   └── winleadplus-sync-log.entity.ts
    ├── repositories/
    │   ├── IWinLeadPlusConfigRepository.ts
    │   ├── IWinLeadPlusMappingRepository.ts
    │   └── IWinLeadPlusSyncLogRepository.ts
    └── winleadplus.module.ts
    ```
  - **WinLeadPlusConfig entity**: id, organisation_id, api_endpoint, enabled, sync_interval_minutes, last_sync_at, created_at, updated_at
  - **WinLeadPlusMapping entity**: id, organisation_id, winleadplus_prospect_id (int), crm_client_id (uuid), crm_contrat_ids (string[]), last_synced_at, data_hash (for change detection)
  - **WinLeadPlusSyncLog entity**: id, organisation_id, started_at, finished_at, status (running/success/failed), total_prospects, created, updated, skipped, errors (jsonb)
  - Create TypeORM repositories implementing the interfaces
  - Create and register NestJS module (`WinLeadPlusModule`)
  - Create TypeORM migration for the 3 new tables
  - Register module in `service-commercial` app module

  **Must NOT do**:
  - Do NOT implement sync logic yet (Task 3)
  - Do NOT implement gRPC controller yet (Task 3)
  - Do NOT modify existing entities or tables
  - Do NOT create frontend files

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Multiple files to scaffold following DDD pattern, needs understanding of existing domain structure
  - **Skills**: [`microservice-maintainer`]
    - `microservice-maintainer`: Expert at creating domain layers in this DDD codebase style

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Task 1)
  - **Blocks**: Task 3
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `services/service-commercial/src/domain/woocommerce/` — COMPLETE pattern to follow. Copy directory structure, entity patterns, repository interfaces
  - `services/service-commercial/src/domain/woocommerce/entities/` — Entity class patterns with TypeORM decorators (@Entity, @Column, @PrimaryGeneratedColumn)
  - `services/service-commercial/src/domain/woocommerce/repositories/` — Repository interface pattern (IRepository with standard CRUD)
  - `services/service-commercial/src/domain/import/services/import-orchestrator.service.ts` — Import orchestration patterns for reference

  **API/Type References**:
  - WinLeadPlus sample JSON (see Context) — defines the external data shape for mapping entity design

  **Documentation References**:
  - `services/service-commercial/package.json` — Dependencies available (TypeORM, @nestjs/schedule, etc.)

  **Acceptance Criteria**:

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: Domain files exist with correct structure
    Tool: Bash
    Preconditions: Files created
    Steps:
      1. ls services/service-commercial/src/domain/winleadplus/ → assert directory exists
      2. ls services/service-commercial/src/domain/winleadplus/entities/ → assert 3 entity files
      3. ls services/service-commercial/src/domain/winleadplus/repositories/ → assert 3 interface files
      4. Verify winleadplus.module.ts exists and exports module
      5. grep "WinLeadPlusModule" in service-commercial app.module.ts → must be imported
    Expected Result: Complete domain structure exists and is registered
    Evidence: Directory listing and grep output captured

  Scenario: TypeORM migration creates tables
    Tool: Bash
    Preconditions: Database running
    Steps:
      1. Run migration generate/run command
      2. Connect to commercial_db
      3. Assert tables exist: winleadplus_config, winleadplus_mapping, winleadplus_sync_log
      4. Verify columns match entity definitions
    Expected Result: 3 tables created in commercial_db
    Evidence: SQL query output captured
  ```

  **Commit**: YES
  - Message: `feat(commercial): scaffold WinLeadPlus domain entities, repositories and module`
  - Files: `services/service-commercial/src/domain/winleadplus/**`

---

- [x] 3. Implement WinLeadPlus sync service, mapper, gRPC controller and scheduler

  **What to do**:
  - **WinLeadPlusSyncService** (`services/service-commercial/src/domain/winleadplus/services/winleadplus-sync.service.ts`):
    - `syncProspects(organisationId, dryRun?)`: Main sync orchestrator
      1. Fetch all prospects from WinLeadPlus API (`GET https://winleadplus.com/api/prospects` with Bearer token)
      2. For each prospect: check mapping table → if exists, compare data hash → if changed, update; if new, create
      3. Create sync log entry (started_at, total, created, updated, skipped, errors)
      4. For new clients: publish NATS event `client.create.from-winleadplus` with mapped ClientBase data
      5. For updated clients: publish NATS event `client.update.from-winleadplus` with updated fields
      6. For contracts: create/update via local contrat repository (same service)
      7. Store/update mapping entry with data_hash
      8. Return sync log summary
    - `getConfig(organisationId)`: Get WinLeadPlus config
    - `saveConfig(config)`: Save/update config
    - `testConnection(organisationId)`: Call WinLeadPlus API healthcheck
  - **WinLeadPlusMapperService** (`services/service-commercial/src/domain/winleadplus/services/winleadplus-mapper.service.ts`):
    - `mapProspectToClient(prospect)`: Map WinLeadPlus prospect → ClientBase fields
      - nom, prenom, email, telephone → direct mapping
      - adresse (ville, codePostal) → Adresse sub-entity
      - informationsPaiement.iban → client.iban
      - informationsPaiement.mandatSepa → client.mandat_sepa
      - source = "WinLeadPlus"
      - commercialId → preserved for contract linking
    - `mapContratToContrat(contrat, clientId)`: Map WinLeadPlus contrat → CRM Contrat
      - titre, statut, montant, dateSignature → direct mapping
      - client_id = mapped CRM client ID
      - commercial_id = commercialId from prospect
      - source = "WinLeadPlus"
    - `mapAbonnementToLigneContrat(abonnement, contratId)`: Map subscription to line item
      - nom → product name
      - prix_base → prix_unitaire
      - categorie → metadata
    - `computeDataHash(prospect)`: MD5/SHA256 of prospect data for change detection
  - **WinLeadPlusGrpcController** (`services/service-commercial/src/domain/winleadplus/winleadplus.grpc-controller.ts`):
    - Implement gRPC methods from WinLeadPlusSyncService proto
    - SyncProspects, GetSyncStatus, GetSyncLogs, TestConnection, GetConfig, SaveConfig
  - **Scheduler** (inside WinLeadPlusSyncService):
    - `@Cron('0 * * * *')` — every hour at minute 0
    - Fetch all enabled WinLeadPlus configs
    - For each config: trigger syncProspects
    - Log results
  - **HTTP Client**: Use `@nestjs/axios` or native `fetch` to call WinLeadPlus API
    - Auth header: For manual sync, forward user's Keycloak token. For scheduled sync, use stored service token from config.

  **Must NOT do**:
  - Do NOT modify service-core directly (use NATS events instead)
  - Do NOT create frontend files
  - Do NOT modify existing sync patterns (WooCommerce, import)
  - Do NOT add complex retry/queue logic — simple error logging is sufficient

  **Recommended Agent Profile**:
  - **Category**: `ultrabrain`
    - Reason: Complex orchestration logic — API calls, data mapping, NATS events, scheduler, gRPC controller. Needs careful sequencing and error handling.
  - **Skills**: [`microservice-maintainer`]
    - `microservice-maintainer`: Expert at implementing services, controllers, and cross-service communication in this codebase

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 4, 5 after Wave 1)
  - **Parallel Group**: Wave 2 (with Tasks 4, 5)
  - **Blocks**: Tasks 5, 7
  - **Blocked By**: Tasks 1, 2

  **References**:

  **Pattern References**:
  - `services/service-commercial/src/domain/woocommerce/services/woocommerce-sync.service.ts` — External API sync orchestration pattern. Follow this for HTTP call structure, error handling, and logging
  - `services/service-commercial/src/domain/import/services/import-orchestrator.service.ts` — Import batch processing pattern with dry_run support
  - `services/service-commercial/src/domain/import/services/import-mapper.service.ts` — Data mapping service pattern (external → internal format)
  - `services/service-commercial/src/domain/woocommerce/services/woocommerce-nats-workers.service.ts` — NATS event publishing pattern

  **API/Type References**:
  - `packages/proto/src/winleadplus/winleadplus.proto` (from Task 1) — gRPC service definition to implement
  - `packages/proto/src/clients/clients.proto:130-161` — ClientBase fields to map TO
  - `packages/proto/src/contrats/contrats.proto` — Contrat fields to map TO

  **External References**:
  - WinLeadPlus API: `GET https://winleadplus.com/api/prospects` — Returns array of prospects with contrats, abonnements, informationsPaiement
  - Sample response structure (from interview):
    ```json
    {
      "idProspect": 397, "nom": "HAMROUNI", "prenom": "Khalil",
      "email": "hamrounikhalil2023@gmail.com",
      "commercialId": "b1597894-f117-4199-b2f3-16035ed02ab9",
      "abonnements": [{"offreId": 9, "nom": "Télécâble Sat", "categorie": "Divertissement", "prix_base": 2.2}],
      "contrats": [{"id": 583, "titre": "8177185WNC", "statut": "Validé", "dateSignature": "2026-02-06T14:31:53.576Z", "montant": 2.2, "prospectId": 397}],
      "informationsPaiement": [{"iban": "...", "mandatSepa": true}]
    }
    ```

  **Acceptance Criteria**:

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: Sync service compiles and starts
    Tool: Bash
    Preconditions: service-commercial container running, proto compiled
    Steps:
      1. Rebuild service-commercial container
      2. Check container logs for startup errors
      3. Assert: "WinLeadPlusModule" initialized in logs
      4. Assert: No TypeScript compilation errors
    Expected Result: Service starts with WinLeadPlus module loaded
    Evidence: Container logs captured

  Scenario: Manual sync via gRPC creates clients
    Tool: Bash (grpcurl or curl to HTTP gateway)
    Preconditions: WinLeadPlus API accessible, service running
    Steps:
      1. Call SyncProspects RPC with organisation_id and dry_run=true
      2. Assert: Response contains total_prospects > 0, created > 0
      3. Call SyncProspects with dry_run=false
      4. Assert: Response success=true
      5. Query commercial_db.winleadplus_mapping → assert entries created
      6. Query commercial_db.winleadplus_sync_log → assert log entry with status="success"
    Expected Result: Prospects synced, mappings stored, log created
    Evidence: gRPC response + SQL query output

  Scenario: Scheduler cron is registered
    Tool: Bash
    Preconditions: Service running
    Steps:
      1. Check service logs for cron registration message
      2. Or: grep source code for @Cron decorator with '0 * * * *' pattern
      3. Assert: Cron job registered
    Expected Result: Hourly cron job active
    Evidence: Log output or source grep
  ```

  **Commit**: YES
  - Message: `feat(commercial): implement WinLeadPlus sync service, mapper, gRPC controller and hourly scheduler`
  - Files: `services/service-commercial/src/domain/winleadplus/services/**`, `services/service-commercial/src/domain/winleadplus/winleadplus.grpc-controller.ts`

---

- [x] 4. Add NATS handler in service-core for client creation/update with source

  **What to do**:
  - **Update service-core** to handle NATS events from WinLeadPlus sync:
    - Listen on `client.create.from-winleadplus` subject
    - Listen on `client.update.from-winleadplus` subject
  - When `client.create.from-winleadplus` received:
    - Extract ClientBase data from event payload
    - Call existing client creation logic with `source = "WinLeadPlus"`
    - Return created client ID via NATS reply
  - When `client.update.from-winleadplus` received:
    - Extract client ID + updated fields from payload
    - Call existing client update logic preserving `source = "WinLeadPlus"`
    - Return updated client via NATS reply
  - **Update ClientBase entity** in service-core:
    - Add `source` column (nullable string, default null for existing clients)
    - Add TypeORM migration for the new column
  - **Update list clients query** in service-core:
    - Support filtering by `source` field when provided in request

  **Must NOT do**:
  - Do NOT modify existing client creation/update logic — add a new NATS handler that calls existing services
  - Do NOT break existing gRPC client endpoints
  - Do NOT add WinLeadPlus-specific logic to service-core (keep it generic — just "source" field)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Small additions to existing service — one NATS handler, one column, one migration
  - **Skills**: [`microservice-maintainer`]
    - `microservice-maintainer`: Knows how to add NATS handlers and entity fields in this codebase

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 3, 5)
  - **Blocks**: Task 7
  - **Blocked By**: Task 1

  **References**:

  **Pattern References**:
  - `services/service-commercial/src/domain/woocommerce/services/woocommerce-nats-workers.service.ts` — NATS event handler pattern to follow
  - `services/service-core/src/domain/clients/` — Existing client domain (entities, services, controllers) — add source field here
  - Find existing NATS handlers in service-core for the listener registration pattern

  **API/Type References**:
  - `packages/proto/src/clients/clients.proto` (updated in Task 1) — ClientBase with source field
  - NATS subjects to listen: `client.create.from-winleadplus`, `client.update.from-winleadplus`

  **Acceptance Criteria**:

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: Service-core starts with source column
    Tool: Bash
    Preconditions: Migration run, service restarted
    Steps:
      1. Run migration on core_db
      2. Restart service-core container
      3. Assert: No startup errors
      4. SQL: SELECT column_name FROM information_schema.columns WHERE table_name='client_base' AND column_name='source'
      5. Assert: Column exists
    Expected Result: source column added, service healthy
    Evidence: SQL output + container logs

  Scenario: NATS handler creates client with source
    Tool: Bash (nats-cli or grpcurl)
    Preconditions: Both services running, NATS accessible
    Steps:
      1. Publish NATS message to client.create.from-winleadplus with test client data including source="WinLeadPlus"
      2. Wait 2s for processing
      3. Query core_db: SELECT id, source FROM client_base WHERE source='WinLeadPlus' ORDER BY created_at DESC LIMIT 1
      4. Assert: Row exists with source='WinLeadPlus'
    Expected Result: Client created via NATS with source tracking
    Evidence: SQL query output

  Scenario: List clients filters by source
    Tool: Bash (grpcurl)
    Preconditions: WinLeadPlus clients exist in DB
    Steps:
      1. Call ListClientsBase gRPC with source="WinLeadPlus"
      2. Assert: All returned clients have source="WinLeadPlus"
      3. Call ListClientsBase without source filter
      4. Assert: Returns ALL clients (with and without source)
    Expected Result: Source filter works on gRPC level
    Evidence: gRPC response captured
  ```

  **Commit**: YES
  - Message: `feat(core): add source field to ClientBase and NATS handlers for WinLeadPlus client sync`
  - Files: `services/service-core/src/domain/clients/**`

---

- [x] 5. Create frontend server actions for WinLeadPlus

  **What to do**:
  - Create `frontend/src/actions/winleadplus.ts` with these server actions:
    - `syncWinLeadPlusProspects({ organisationId, dryRun? })` — Trigger sync via gRPC SyncProspects RPC
    - `getWinLeadPlusSyncLogs({ organisationId })` — Get recent sync history
    - `getWinLeadPlusSyncStatus({ organisationId })` — Get last sync status
    - `testWinLeadPlusConnection({ organisationId })` — Test API connectivity
  - Create gRPC client for WinLeadPlus service:
    - Add `winleadplus` entry in `frontend/src/lib/grpc/clients/config.ts` pointing to service-commercial port 50053
    - Create `frontend/src/lib/grpc/clients/winleadplus.ts` — gRPC client with promisified methods
    - Export from `frontend/src/lib/grpc/clients/index.ts`
  - Add `GRPC_WINLEADPLUS_URL` to environment config (same as contrats: `crm-service-commercial:50053`)
  - **Update `getClientsByOrganisation`** in `frontend/src/actions/clients.ts`:
    - Add `source` parameter to pass through to gRPC call
    - Enable server-side source filtering

  **Must NOT do**:
  - Do NOT create UI components (Task 6)
  - Do NOT modify existing server actions beyond adding source parameter
  - Do NOT hardcode API URLs

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: File creation following established patterns — gRPC client + server actions
  - **Skills**: [`microservice-maintainer`]
    - `microservice-maintainer`: Knows the gRPC client pattern and server action conventions

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 3, 4)
  - **Blocks**: Task 6
  - **Blocked By**: Tasks 1, 3

  **References**:

  **Pattern References**:
  - `frontend/src/actions/woocommerce.ts` — External service action pattern (processWebhook, testConnection, getConfig, etc.)
  - `frontend/src/actions/contrat-import.ts` — Import action pattern (importContratsFromExternal)
  - `frontend/src/lib/grpc/clients/contrats.ts` — gRPC client creation pattern (promisify, auth metadata)
  - `frontend/src/lib/grpc/clients/config.ts` — Service URL configuration pattern
  - `frontend/src/lib/grpc/clients/index.ts` — Client export pattern

  **API/Type References**:
  - `frontend/src/proto/winleadplus/winleadplus.ts` (generated in Task 1) — TypeScript types for gRPC calls
  - `frontend/src/actions/clients.ts` — getClientsByOrganisation to update with source param

  **Acceptance Criteria**:

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: Frontend compiles with new actions
    Tool: Bash
    Preconditions: Proto types generated (Task 1)
    Steps:
      1. Run: npx next build (or tsc --noEmit) from frontend/
      2. Assert: Exit code 0, no TypeScript errors in winleadplus.ts or clients.ts
      3. Verify import resolves: grep "from '@/actions/winleadplus'" in test file
    Expected Result: No compilation errors
    Evidence: Build output captured

  Scenario: gRPC client connects to service
    Tool: Bash
    Preconditions: service-commercial running with WinLeadPlus module
    Steps:
      1. From frontend container, call syncWinLeadPlusProspects via Node REPL or test script
      2. Assert: Response received (success or error — but no connection refused)
    Expected Result: gRPC channel establishes connection
    Evidence: Response or error captured
  ```

  **Commit**: YES
  - Message: `feat(frontend): add WinLeadPlus server actions and gRPC client`
  - Files: `frontend/src/actions/winleadplus.ts`, `frontend/src/lib/grpc/clients/winleadplus.ts`, `frontend/src/lib/grpc/clients/config.ts`, `frontend/src/lib/grpc/clients/index.ts`

---

- [x] 6. Frontend UI — Source badge, filter wiring, and sync button on Clients page

  **What to do**:
  - **Source badge in table** (`frontend/src/app/(main)/clients/columns.tsx`):
    - Add `source` to `ClientRow` type
    - Add a "Source" column or badge indicator next to client name
    - If source === "WinLeadPlus": show a small colored badge (e.g., blue pill "WLP")
    - If source is null/undefined: show nothing (existing CRM clients)
  - **Wire source filter** (`frontend/src/app/(main)/clients/clients-page-client.tsx`):
    - The source filter input already exists in advanced filters UI
    - Wire the `filters.source` value to the `getClientsByOrganisation` call as server-side filter
    - Update `mapClientToRow()` to include `source` from `ClientBase.source`
    - The local filtering logic at `filteredClients` should also check source field
  - **Add source as Select** instead of text input in advanced filters:
    - Replace text input with a Select dropdown: "Tous" / "CRM" / "WinLeadPlus"
    - "Tous" = no filter, "CRM" = source is null, "WinLeadPlus" = source is "WinLeadPlus"
  - **Sync button** in Clients page header area:
    - Add a "Sync WinLeadPlus" button (with refresh icon) next to "Créer un client" and "Importer" buttons
    - On click: call `syncWinLeadPlusProspects({ organisationId })` from actions
    - Show loading spinner during sync
    - Show toast with result: "Sync terminée: X créés, Y mis à jour, Z ignorés"
    - After sync: refetch clients list to show new entries
  - **Update `mapClientToRow`** to include source field from backend response

  **Must NOT do**:
  - Do NOT create a dedicated WinLeadPlus page
  - Do NOT modify the DataTable component itself
  - Do NOT add complex sync configuration UI (just the button)
  - Do NOT change existing column widths or order significantly

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: UI work — badges, filters, buttons, toasts. Needs visual polish.
  - **Skills**: [`frontend-ui-ux`]
    - `frontend-ui-ux`: Expert at crafting clean UI with proper Shadcn components, badges, and interaction patterns

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 3 (sequential after Task 5)
  - **Blocks**: Task 7
  - **Blocked By**: Task 5

  **References**:

  **Pattern References**:
  - `frontend/src/app/(main)/clients/clients-page-client.tsx:187-212` — Current `filteredClients` logic. Add source check here
  - `frontend/src/app/(main)/clients/clients-page-client.tsx:518-526` — Existing source filter UI (text input). Replace with Select dropdown
  - `frontend/src/app/(main)/clients/clients-page-client.tsx` — `isRefreshing` state + refresh button pattern. Copy for sync button
  - `frontend/src/app/(main)/clients/columns.tsx` — Column definitions. Add source badge column or modify client name column
  - `frontend/src/stores/client-search-store.ts:12` — `source: string` already in filter store

  **API/Type References**:
  - `frontend/src/lib/ui/display-types/client.ts` — ClientRow type to extend with `source?: string`
  - `frontend/src/actions/winleadplus.ts` (from Task 5) — `syncWinLeadPlusProspects` action to call

  **External References**:
  - Shadcn Badge component — for source indicator
  - Shadcn Select component — for source filter dropdown (already used in advanced filters)

  **Acceptance Criteria**:

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: Source badge visible for WinLeadPlus clients
    Tool: Playwright (playwright skill)
    Preconditions: Dev server running, WinLeadPlus clients exist in DB (from Task 3 sync)
    Steps:
      1. Navigate to: http://localhost:3000/clients (or http://alex.local:8081/clients)
      2. Wait for: table rows visible (timeout: 10s)
      3. Find a row where client was synced from WinLeadPlus
      4. Assert: Badge element visible with text "WLP" or "WinLeadPlus"
      5. Assert: Badge has distinctive color (blue or similar)
      6. Find a row where client is NOT from WinLeadPlus
      7. Assert: No source badge visible
      8. Screenshot: .sisyphus/evidence/task-6-source-badge.png
    Expected Result: WinLeadPlus clients show badge, CRM clients don't
    Evidence: .sisyphus/evidence/task-6-source-badge.png

  Scenario: Source filter works in advanced filters
    Tool: Playwright (playwright skill)
    Preconditions: Mixed clients (CRM + WinLeadPlus) in database
    Steps:
      1. Navigate to: http://localhost:3000/clients
      2. Click: Advanced filters toggle button
      3. Wait for: Advanced filters panel visible
      4. Find: Source filter dropdown (Select component)
      5. Select: "WinLeadPlus" option
      6. Wait for: Table to update (1-2s)
      7. Assert: All visible rows have WinLeadPlus badge
      8. Assert: Result count shows fewer clients than total
      9. Screenshot: .sisyphus/evidence/task-6-source-filter.png
    Expected Result: Only WinLeadPlus clients shown
    Evidence: .sisyphus/evidence/task-6-source-filter.png

  Scenario: Sync button triggers sync and shows toast
    Tool: Playwright (playwright skill)
    Preconditions: Dev server running, WinLeadPlus API accessible
    Steps:
      1. Navigate to: http://localhost:3000/clients
      2. Find: "Sync WinLeadPlus" button (near Créer/Importer buttons)
      3. Click: Sync button
      4. Assert: Button shows loading state (spinner)
      5. Wait for: Toast notification visible (timeout: 30s)
      6. Assert: Toast contains sync results (e.g., "X créés, Y mis à jour")
      7. Assert: Button returns to normal state
      8. Screenshot: .sisyphus/evidence/task-6-sync-button-toast.png
    Expected Result: Sync executes and shows results
    Evidence: .sisyphus/evidence/task-6-sync-button-toast.png

  Scenario: Sync button error handling
    Tool: Playwright (playwright skill)
    Preconditions: WinLeadPlus API NOT accessible (or misconfigured)
    Steps:
      1. Navigate to: http://localhost:3000/clients
      2. Click: Sync button
      3. Wait for: Toast notification (timeout: 15s)
      4. Assert: Toast shows error message (red/destructive variant)
      5. Assert: Button returns to normal state (not stuck loading)
      6. Screenshot: .sisyphus/evidence/task-6-sync-error.png
    Expected Result: Error shown gracefully, no crash
    Evidence: .sisyphus/evidence/task-6-sync-error.png
  ```

  **Commit**: YES
  - Message: `feat(frontend): add WinLeadPlus source badge, filter, and sync button to Clients page`
  - Files: `frontend/src/app/(main)/clients/columns.tsx`, `frontend/src/app/(main)/clients/clients-page-client.tsx`, `frontend/src/lib/ui/display-types/client.ts`, `frontend/src/stores/client-search-store.ts`

---

- [x] 7. Docker deployment + end-to-end verification

  **What to do**:
  - **Update docker-compose** (`compose/docker-compose.template.yml`):
    - Add `WINLEADPLUS_API_URL=https://winleadplus.com/api/prospects` env var to service-commercial
    - Ensure NATS connectivity between service-commercial and service-core
  - **Update frontend .env**:
    - Add `GRPC_WINLEADPLUS_URL=crm-service-commercial:50053` (if separate gRPC service name needed)
  - **Rebuild and deploy**:
    - Rebuild service-core image (for source field + NATS handler)
    - Rebuild service-commercial image (for WinLeadPlus domain)
    - Rebuild frontend image (for new actions + UI)
    - Run database migrations (commercial_db + core_db)
    - Restart all containers
  - **End-to-end verification**:
    - Trigger manual sync from UI
    - Verify clients appear in table with WinLeadPlus badge
    - Verify source filter works
    - Check scheduler is running (container logs)
    - Verify contracts imported and linked

  **Must NOT do**:
  - Do NOT modify production environment configs
  - Do NOT force push or reset any git history
  - Do NOT modify Keycloak settings

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: End-to-end deployment requires understanding entire system, debugging connection issues, verifying across multiple services
  - **Skills**: [`playwright`]
    - `playwright`: For browser-based E2E verification of the full flow

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 3 (final, after all others)
  - **Blocks**: None (final task)
  - **Blocked By**: Tasks 1, 2, 3, 4, 5, 6

  **References**:

  **Pattern References**:
  - `compose/docker-compose.template.yml` — Container definitions, env vars, network config
  - `frontend/.env.development` — Frontend environment variable pattern
  - `services/service-commercial/.env.development` — Backend env var pattern

  **Acceptance Criteria**:

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: All containers healthy after deployment
    Tool: Bash
    Preconditions: All images rebuilt, migrations run
    Steps:
      1. docker compose ps → check all services running
      2. Assert: service-core, service-commercial, alex-frontend all "healthy" or "running"
      3. Check service-commercial logs: grep "WinLeadPlusModule" → initialized
      4. Check service-core logs: no startup errors
    Expected Result: All services running, WinLeadPlus module loaded
    Evidence: docker compose ps output + relevant logs

  Scenario: Full E2E — Sync from UI and verify in table
    Tool: Playwright (playwright skill)
    Preconditions: All services running, WinLeadPlus API accessible
    Steps:
      1. Navigate to: http://alex.local:8081/clients
      2. Note: Current client count
      3. Click: "Sync WinLeadPlus" button
      4. Wait for: Toast with sync results (timeout: 60s)
      5. Assert: Toast shows "X créés" with X > 0
      6. Wait for: Table refresh
      7. Assert: New clients visible with "WLP" badge
      8. Click: Advanced filters
      9. Select: Source = "WinLeadPlus"
      10. Assert: Only WinLeadPlus clients shown
      11. Click: First WinLeadPlus client name → navigate to detail
      12. Assert: Client detail page loads with correct data (nom, prénom, email)
      13. Screenshot: .sisyphus/evidence/task-7-e2e-sync-complete.png
    Expected Result: Full sync flow works end-to-end
    Evidence: .sisyphus/evidence/task-7-e2e-sync-complete.png

  Scenario: Hourly scheduler executes
    Tool: Bash
    Preconditions: Services running for > 5 minutes (or trigger cron manually)
    Steps:
      1. Check service-commercial logs for cron execution
      2. Or: Advance system time / trigger cron manually if possible
      3. Assert: Sync log entry created in commercial_db.winleadplus_sync_log
      4. Assert: Log shows status="success" or status="failed" (not stuck)
    Expected Result: Scheduler runs and logs results
    Evidence: Log output + SQL query

  Scenario: Contracts linked to imported clients
    Tool: Bash (SQL)
    Preconditions: Sync completed
    Steps:
      1. Get a WinLeadPlus client ID from winleadplus_mapping table
      2. Query contrats table: SELECT * FROM contrat WHERE client_id = '{crm_client_id}'
      3. Assert: At least 1 contract exists
      4. Assert: Contract has source='WinLeadPlus' or reference matching WinLeadPlus titre
    Expected Result: Contracts imported and linked to correct client
    Evidence: SQL output
  ```

  **Commit**: YES
  - Message: `feat(deploy): configure WinLeadPlus env vars and deploy full integration`
  - Files: `compose/docker-compose.template.yml`, `frontend/.env.development`

---

## Commit Strategy

| After Task | Message | Files | Verification |
|------------|---------|-------|--------------|
| 1 | `feat(proto): add source field to ClientBase and WinLeadPlusSyncService definition` | Proto files + generated TS | Proto compiles |
| 2 | `feat(commercial): scaffold WinLeadPlus domain entities, repositories and module` | service-commercial domain files | Service starts |
| 3 | `feat(commercial): implement WinLeadPlus sync service, mapper, gRPC controller and hourly scheduler` | service-commercial services + controller | gRPC call succeeds |
| 4 | `feat(core): add source field to ClientBase and NATS handlers for WinLeadPlus client sync` | service-core domain files | NATS handler works |
| 5 | `feat(frontend): add WinLeadPlus server actions and gRPC client` | Frontend actions + gRPC client | TS compiles |
| 6 | `feat(frontend): add WinLeadPlus source badge, filter, and sync button to Clients page` | Frontend UI files | Playwright screenshots |
| 7 | `feat(deploy): configure WinLeadPlus env vars and deploy full integration` | Docker + env files | E2E test pass |

---

## Success Criteria

### Verification Commands
```bash
# All containers healthy
docker compose ps  # Expected: all services "running" or "healthy"

# Proto compiles
cd packages/proto && npx buf generate  # Expected: exit code 0

# Frontend compiles
cd frontend && npx next build  # Expected: exit code 0

# WinLeadPlus clients exist
psql -U postgres -d core_db -c "SELECT COUNT(*) FROM client_base WHERE source='WinLeadPlus'"  # Expected: > 0

# Contracts linked
psql -U postgres -d commercial_db -c "SELECT COUNT(*) FROM contrat WHERE source='WinLeadPlus'"  # Expected: > 0

# Sync logs
psql -U postgres -d commercial_db -c "SELECT * FROM winleadplus_sync_log ORDER BY started_at DESC LIMIT 5"  # Expected: entries with status=success

# Scheduler active
docker logs crm-service-commercial 2>&1 | grep -i "cron\|schedule\|winleadplus"  # Expected: scheduling messages
```

### Final Checklist
- [x] WinLeadPlus prospects imported as CRM clients with `source = "WinLeadPlus"`
- [x] Contracts imported and linked to correct clients
- [x] Payment info (IBAN, mandat SEPA) stored on clients
- [x] Commercial association preserved (commercialId → CRM commercial)
- [x] Source badge visible in Clients table for WinLeadPlus clients
- [x] Source filter works in advanced filters
- [x] Manual sync button works with toast feedback
- [x] Hourly @Cron scheduler active
- [x] Mapping table prevents duplicate imports
- [x] Sync logs track history (total, created, updated, skipped, errors)
- [x] No dedicated WinLeadPlus page created (all in Clients)
- [x] No bidirectional sync (read-only from WinLeadPlus)
- [x] No Keycloak modifications
- [x] All existing CRM functionality still works
