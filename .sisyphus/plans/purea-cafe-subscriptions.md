# Gestion Abonnements Générique — Subscriptions + WooCommerce + Fulfillment + Préférences

## TL;DR

> **Quick Summary**: Implémenter un système d'abonnements générique multi-tenant dans le CRM : (1) entités & state machine Subscription dans service-commercial, (2) webhook receiver WooCommerce avec sync unidirectionnelle et NATS messaging (première adoption NATS du projet), (3) fulfillment batching avec cut-off configurable dans service-logistics, (4) préférences dynamiques par abonnement avec schéma configurable par organisation. Le tout en extension des services existants, sans nouveau microservice.
>
> **Deliverables**:
> - Proto `subscriptions.proto` + `fulfillment.proto` avec services gRPC complets
> - Backend subscriptions : entités SubscriptionPlan, Subscription, SubscriptionCycle, SubscriptionStatusHistory + state machine + gRPC controller
> - Backend WooCommerce : webhook HTTP receiver (HMAC-SHA256), WooCommerceWebhookEvent inbox, WooCommerceMapping table, NATS event publishing + consumer workers
> - Backend fulfillment : entités FulfillmentBatch, FulfillmentBatchLine, FulfillmentCutoffConfig + cron cut-off + gRPC controller
> - Backend préférences : entités SubscriptionPreferenceSchema, SubscriptionPreference, SubscriptionPreferenceHistory + validation dynamique
> - NATS first-adoption : NatsModule configuré dans service-commercial et service-logistics
> - service-logistics converti en mode hybride (gRPC + HTTP + NATS)
> - Migrations TypeORM pour toutes les nouvelles tables
> - Tests unitaires domain pour state machine, cut-off, préférences
>
> **Estimated Effort**: XL (~30 TODOs, 4 GAPs)
> **Parallel Execution**: YES — 4 waves
> **Critical Path**: Task 1 (proto) → Task 2-3 (entities+migration GAP1) → Task 5-6 (WooCommerce+NATS) → Task 8-9 (preferences) → Task 10-13 (fulfillment)

---

## Context

### Original Request
Analyser le cahier des charges "Gestion des clients PUREA CAFE" (abonnements café avec WooCommerce) et identifier les gaps par rapport au CRM existant. Implémenter les 4 gaps MVP : abonnements lifecycle, WooCommerce sync, fulfillment batching, préférences dynamiques.

### Interview Summary
**Key Discussions**:
- **Architecture abonnements** : Nouveau bounded context `Subscription` dans service-commercial (pas de nouveau microservice). Indépendant des contrats (`contrat_id` optional).
- **State machine** : PENDING → ACTIVE → PAUSED/PAST_DUE → CANCELED/EXPIRED. Modèle charge-then-ship.
- **WooCommerce** : Sync unidirectionnelle WC→CRM via webhooks. WC + WC Subscriptions déjà en production.
- **Fulfillment** : Extension de service-logistics. Cut-off configurable par org (jour+heure+timezone). Workflow OPEN→LOCKED→DISPATCHED→COMPLETED.
- **Préférences** : Schéma dynamique par organisation. Changement avant cut-off = cycle N, après = cycle N+1.
- **Scope design** : GÉNÉRIQUE multi-tenant (pas spécifique café). Réutilisable pour tout type d'abonnement.
- **NPS/Retours** : Phase 2 (PAS dans le MVP)

**Research Findings**:
- service-commercial a 4 bounded contexts (CommercialModule, ContratsModule, ProductsModule, DashboardModule). Port gRPC 50053, HTTP 3053.
- service-logistics a 1 bounded context (LogisticsModule). Port gRPC 50060. **gRPC ONLY — pas de HTTP**. Doit être converti en mode hybride.
- PSPEventInboxEntity dans service-finance : pattern webhook inbox (RECEIVED→VERIFIED→PROCESSED→FAILED→DUPLICATE) avec idempotence par index unique.
- **NATS disponible dans shared-kernel mais ZÉRO services l'utilisent** — première adoption. NATS 2.10 + JetStream dans docker-compose.
- Pas de scheduling/cron nulle part dans le codebase — première adoption aussi.
- Entity pattern : pas de base class, UUID PK manuel, timestamps manuels, SnakeNamingStrategy.
- Proto convention : `packages/proto/src/{domain}/{domain}.proto`, registration dans SERVICE_REGISTRY.

### Metis Review
**Identified Gaps** (addressed):
- **NATS first-adoption** : Utiliser JSON codec (pas protobuf), core NATS avec queue groups (pas JetStream pour MVP), nommage `crm.{service}.{context}.{event}` → appliqué dans Tasks 5-6
- **Webhook security** : Route HTTP POST exclue de AuthInterceptor, HMAC-SHA256 WooCommerce (`X-WC-Webhook-Signature`), secret par org → appliqué dans Task 6
- **service-logistics bootstrap** : Convertir de `createMicroservice` à hybride (`NestFactory.create` + `connectMicroservice`) → Task 10
- **Schema explosion** : `synchronize: false` pour nouvelles entités, migrations uniquement → appliqué partout
- **Scope creep** : 19 MUST NOT items définis (voir guardrails)
- **Cross-DB consistency** : Subscriptions dans commercial_db, Fulfillment dans logistics_db — NATS events avec eventId pour idempotence
- **Task ordering** : GAP 1 → GAP 2 → GAP 4 → GAP 3 (fondation → NATS → préférences → fulfillment capstone)
- **Language convention** : English pour les nouveaux domaines (subscription, fulfillment, preference) — cohérent avec TrackingEvent, CarrierAccount pattern

---

## Work Objectives

### Core Objective
Doter le CRM d'un système d'abonnements générique multi-tenant avec sync WooCommerce, fulfillment batching et préférences dynamiques, en étendant les services existants sans créer de nouveaux microservices.

### Concrete Deliverables
- `packages/proto/src/subscriptions/subscriptions.proto` — Proto definitions pour subscriptions + préférences
- `packages/proto/src/fulfillment/fulfillment.proto` — Proto definitions pour fulfillment batching
- `services/service-commercial/src/domain/subscriptions/` — Entités, repos, state machine
- `services/service-commercial/src/domain/woocommerce/` — Webhook inbox, mapping, event handlers
- `services/service-commercial/src/domain/preferences/` — Schema, preference, history
- `services/service-commercial/src/infrastructure/` — gRPC controllers, HTTP webhook controller, NATS handlers
- `services/service-logistics/src/domain/fulfillment/` — Batch, batch line, cutoff config
- `services/service-logistics/src/infrastructure/` — gRPC controller, NATS handler, cron scheduler
- Migrations dans les 2 services
- Tests unitaires domain

### Definition of Done
- [ ] `grpcurl -plaintext localhost:50053 list` affiche les nouveaux services (SubscriptionService, SubscriptionPlanService, PreferenceSchemaService, SubscriptionPreferenceService, WooCommerceService)
- [ ] `grpcurl -plaintext localhost:50060 list` affiche FulfillmentBatchService
- [ ] Webhook WooCommerce reçu, vérifié HMAC, stocké dans inbox, publié sur NATS
- [ ] Subscription state machine : toutes les transitions valides/invalides testées
- [ ] Cut-off évalué correctement par cron, batch LOCKED avec snapshot
- [ ] Tests unitaires passent : `bun test` dans service-commercial et service-logistics
- [ ] Aucun test existant cassé (5 specs service-commercial)

### Must Have
- State machine subscription complète avec historique
- Webhook receiver WooCommerce avec signature HMAC-SHA256
- NATS messaging fonctionnel entre les 2 services
- Fulfillment batching avec cut-off configurable
- Préférences dynamiques avec validation contre schéma
- Idempotence sur tous les webhooks et events NATS

### Must NOT Have (Guardrails)
- ❌ Sync CRM→WooCommerce (unidirectionnelle uniquement)
- ❌ Détection automatique PAST_DUE depuis les échecs de paiement
- ❌ Grace period engine
- ❌ UI designer de schéma préférences
- ❌ Framework webhook générique (WooCommerce uniquement)
- ❌ NPS/Satisfaction/Retours (Phase 2)
- ❌ Variantes produit
- ❌ Portail client self-service
- ❌ Nouveau microservice
- ❌ Event sourcing / CQRS read models
- ❌ Saga/orchestration patterns
- ❌ JetStream consumers (core NATS + queue groups pour MVP)
- ❌ Plus d'1 cron job par service
- ❌ Intégration carrier API depuis les batches (les batches créent des Expeditions, Maileva existant fait le reste)
- ❌ Abstraction de la logique billing subscription (WooCommerce gère le billing)
- ❌ Sync produit WooCommerce
- ❌ Actions admin WooCommerce
- ❌ Templates marketplace pour préférences
- ❌ Tests e2e / load tests / contract tests

---

## Verification Strategy

> **UNIVERSAL RULE: ZERO HUMAN INTERVENTION**
>
> ALL tasks in this plan MUST be verifiable WITHOUT any human action.
> Every criterion is verified by the agent using tools (Bash, grpcurl, curl, bun test).

### Test Decision
- **Infrastructure exists**: YES (bun:test)
- **Automated tests**: YES (Tests-after — unit tests for domain services within each GAP)
- **Framework**: bun:test (existing — 5 specs in service-commercial domain)

### Agent-Executed QA Scenarios (MANDATORY — ALL tasks)

> Every task includes QA scenarios with exact commands, selectors, assertions, and evidence paths.
> Verification tool by type: gRPC → `grpcurl`, HTTP → `curl`, Unit tests → `bun test`, NATS → log inspection.

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Start Immediately):
├── Task 1: Proto definitions (subscriptions + fulfillment)
└── Task 2: SERVICE_REGISTRY updates + buf generation

Wave 2 (After Wave 1):
├── Task 3: Subscription entities + migration (GAP 1 core)
├── Task 4: Subscription gRPC controller + module wiring
└── Task 5: Subscription state machine + domain service + tests

Wave 3 (After Wave 2):
├── Task 6: NATS first-adoption in service-commercial
├── Task 7: WooCommerce webhook receiver (HTTP controller + inbox)
├── Task 8: WooCommerce NATS workers (mapping + sync)
├── Task 9: Preference entities + schema validation + gRPC
└── Task 10: Preference cut-off logic + tests

Wave 4 (After Wave 3):
├── Task 11: service-logistics bootstrap conversion (hybrid + NATS)
├── Task 12: Fulfillment entities + migration
├── Task 13: Fulfillment gRPC controller + cut-off cron
├── Task 14: Fulfillment NATS consumer (subscription→batch line)
└── Task 15: Integration smoke tests + regression check
```

### Dependency Matrix

| Task | Depends On | Blocks | Can Parallelize With |
|------|------------|--------|---------------------|
| 1 | None | 2, 3, 4, 12 | — |
| 2 | 1 | 3, 4, 12, 13 | — |
| 3 | 2 | 4, 5, 7, 8, 9 | — |
| 4 | 3 | 5, 7, 8, 9 | — |
| 5 | 4 | 6, 7 | — |
| 6 | 5 | 7, 8, 14 | — |
| 7 | 6 | 8 | 9 |
| 8 | 7 | 14 | 10 |
| 9 | 4 | 10, 14 | 7 |
| 10 | 9 | 14 | 8 |
| 11 | 6 | 12, 13, 14 | 7, 8, 9, 10 |
| 12 | 2, 11 | 13, 14 | — |
| 13 | 12 | 14 | — |
| 14 | 8, 10, 13 | 15 | — |
| 15 | 14 | None | — |

### Agent Dispatch Summary

| Wave | Tasks | Recommended Categories |
|------|-------|----------------------|
| 1 | 1-2 | quick (proto + config) |
| 2 | 3-5 | unspecified-high (DDD entities + state machine) |
| 3 | 6-10 | unspecified-high (NATS + webhooks + preferences — critical infra work) |
| 4 | 11-15 | unspecified-high (logistics conversion + fulfillment + integration) |

---

## TODOs

### ═══════════════════════════════════════
### GAP 1 — SUBSCRIPTION MANAGEMENT
### ═══════════════════════════════════════

- [x] 1. Proto definitions — subscriptions.proto + fulfillment.proto

  **What to do**:
  - Create `packages/proto/src/subscriptions/subscriptions.proto` with:
    - `package subscriptions;`
    - Service `SubscriptionPlanService` : Create, Update, Get, List, Delete, ListByOrganisation
    - Service `SubscriptionService` : Create, Update, Get, List, Delete, Activate, Pause, Resume, Cancel, Expire, ListByClient, ListByPlan
    - Service `SubscriptionPreferenceSchemaService` : Upsert, Get, GetByOrganisation, Delete
    - Service `SubscriptionPreferenceService` : Set, Get, GetBySubscription, GetHistory
    - Service `WooCommerceService` : GetMappings, GetWebhookEvents, GetConfig, UpdateConfig
    - Messages : SubscriptionPlan, Subscription, SubscriptionCycle, SubscriptionStatusHistory, PreferenceSchema, Preference, PreferenceHistoryEntry, WooCommerceMapping, WooCommerceWebhookEvent, WooCommerceConfig
    - Enums : SubscriptionStatus (SUBSCRIPTION_STATUS_UNSPECIFIED, _PENDING, _ACTIVE, _PAUSED, _PAST_DUE, _CANCELED, _EXPIRED), BillingInterval (BILLING_INTERVAL_UNSPECIFIED, _WEEKLY, _BIWEEKLY, _MONTHLY, _QUARTERLY, _YEARLY)
    - Common messages : Pagination, PaginationResult, GetByIdRequest, DeleteResponse (redeclare locally per proto convention)
  - Create `packages/proto/src/fulfillment/fulfillment.proto` with:
    - `package fulfillment;`
    - Service `FulfillmentBatchService` : CreateBatch, GetBatch, ListBatches, LockBatch, DispatchBatch, CompleteBatch, AddLine, RemoveLine, GetCurrentOpenBatch, ListBatchLines
    - Service `FulfillmentCutoffConfigService` : Upsert, Get, GetByOrganisation, Delete
    - Messages : FulfillmentBatch, FulfillmentBatchLine, FulfillmentCutoffConfig, BatchLineSnapshot
    - Enums : BatchStatus (BATCH_STATUS_UNSPECIFIED, _OPEN, _LOCKED, _DISPATCHED, _COMPLETED, _CANCELED)
  - Update `packages/proto/buf.yaml` if needed to include new proto paths

  **Must NOT do**:
  - Do NOT share Pagination messages across proto files (redeclare per file)
  - Do NOT add event proto files yet (NATS uses JSON codec, not proto)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Proto file creation follows well-established conventions with clear patterns
  - **Skills**: [`microservice-maintainer`]
    - `microservice-maintainer`: Proto patterns and DDD conventions are documented in this skill

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 1 (sequential with Task 2)
  - **Blocks**: Tasks 2, 3, 4, 12
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `packages/proto/src/contrats/contrats.proto` — Proto structure pattern: package declaration, service definitions, message types, enum conventions, Pagination redeclaration
  - `packages/proto/src/payments/payment.proto` — Complex proto with multiple services, enum patterns (prefixed with type name), optional fields, map<string,string> metadata
  - `packages/proto/src/logistics/logistics.proto` — Simpler proto with single service, request/response patterns

  **Documentation References**:
  - `packages/proto/buf.yaml` — Buf configuration for linting and breaking change detection

  **Acceptance Criteria**:
  - [ ] File `packages/proto/src/subscriptions/subscriptions.proto` exists with all 5 services
  - [ ] File `packages/proto/src/fulfillment/fulfillment.proto` exists with 2 services
  - [ ] `buf lint` passes with no errors
  - [ ] `buf breaking --against .git#branch=main` passes (no breaking changes — all new)

  **Agent-Executed QA Scenarios**:

  ```
  Scenario: Proto files lint successfully
    Tool: Bash
    Preconditions: packages/proto directory exists
    Steps:
      1. cd packages/proto && npx buf lint
      2. Assert: exit code 0, no lint errors
    Expected Result: Both proto files pass linting
    Evidence: Terminal output captured

  Scenario: Proto files have correct structure
    Tool: Bash
    Preconditions: Proto files created
    Steps:
      1. grep -c "service " packages/proto/src/subscriptions/subscriptions.proto
      2. Assert: output is "5" (5 services)
      3. grep -c "service " packages/proto/src/fulfillment/fulfillment.proto
      4. Assert: output is "2" (2 services)
    Expected Result: Correct number of services in each proto
    Evidence: grep counts captured
  ```

  **Commit**: YES (groups with Task 2)
  - Message: `feat(proto): add subscriptions and fulfillment proto definitions`
  - Files: `packages/proto/src/subscriptions/subscriptions.proto`, `packages/proto/src/fulfillment/fulfillment.proto`

---

- [x] 2. SERVICE_REGISTRY updates + buf generation + proto exports

  **What to do**:
  - Add entries to `SERVICE_REGISTRY` in `packages/shared-kernel/src/infrastructure/grpc/service-config.ts`:
    - `subscriptions`: { package: 'subscriptions', protoFile: 'subscriptions/subscriptions.proto', defaultPort: 50053, serviceName: 'SubscriptionService' }
    - `subscription-plans`: { package: 'subscriptions', protoFile: 'subscriptions/subscriptions.proto', defaultPort: 50053, serviceName: 'SubscriptionPlanService' }
    - `subscription-preferences`: { package: 'subscriptions', protoFile: 'subscriptions/subscriptions.proto', defaultPort: 50053, serviceName: 'SubscriptionPreferenceService' }
    - `subscription-preference-schemas`: { package: 'subscriptions', protoFile: 'subscriptions/subscriptions.proto', defaultPort: 50053, serviceName: 'SubscriptionPreferenceSchemaService' }
    - `woocommerce`: { package: 'subscriptions', protoFile: 'subscriptions/subscriptions.proto', defaultPort: 50053, serviceName: 'WooCommerceService' }
    - `fulfillment-batches`: { package: 'fulfillment', protoFile: 'fulfillment/fulfillment.proto', defaultPort: 50060, serviceName: 'FulfillmentBatchService' }
    - `fulfillment-cutoff`: { package: 'fulfillment', protoFile: 'fulfillment/fulfillment.proto', defaultPort: 50060, serviceName: 'FulfillmentCutoffConfigService' }
  - Run `buf generate` (or `npm run gen` in packages/proto) to generate TypeScript types
  - Update `packages/proto/package.json` exports to include new proto paths:
    - `"./subscriptions": "./gen/ts/subscriptions/subscriptions.ts"`
    - `"./fulfillment": "./gen/ts/fulfillment/fulfillment.ts"`

  **Must NOT do**:
  - Do NOT modify existing SERVICE_REGISTRY entries
  - Do NOT change existing proto exports

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Configuration update following existing patterns
  - **Skills**: [`microservice-maintainer`]
    - `microservice-maintainer`: Knows SERVICE_REGISTRY patterns and proto integration

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 1 (after Task 1)
  - **Blocks**: Tasks 3, 4, 12, 13
  - **Blocked By**: Task 1

  **References**:

  **Pattern References**:
  - `packages/shared-kernel/src/infrastructure/grpc/service-config.ts` — SERVICE_REGISTRY format with package, protoFile, defaultPort, serviceName fields
  - `packages/proto/package.json` — exports field with proto path mappings

  **Acceptance Criteria**:
  - [ ] SERVICE_REGISTRY has 7 new entries (5 subscription-related, 2 fulfillment-related)
  - [ ] `npm run gen` in packages/proto completes without errors
  - [ ] Generated TypeScript files exist at `packages/proto/gen/ts/subscriptions/subscriptions.ts` and `packages/proto/gen/ts/fulfillment/fulfillment.ts`
  - [ ] `packages/proto/package.json` exports include `./subscriptions` and `./fulfillment`

  **Agent-Executed QA Scenarios**:

  ```
  Scenario: Buf generation succeeds
    Tool: Bash
    Preconditions: Proto files from Task 1 exist
    Steps:
      1. cd packages/proto && npm run gen
      2. Assert: exit code 0
      3. ls gen/ts/subscriptions/subscriptions.ts
      4. Assert: file exists
      5. ls gen/ts/fulfillment/fulfillment.ts
      6. Assert: file exists
    Expected Result: TypeScript types generated for both protos
    Evidence: Terminal output + file listing

  Scenario: SERVICE_REGISTRY entries valid
    Tool: Bash
    Preconditions: service-config.ts updated
    Steps:
      1. grep -c "subscriptions" packages/shared-kernel/src/infrastructure/grpc/service-config.ts
      2. Assert: count >= 5
      3. grep -c "fulfillment" packages/shared-kernel/src/infrastructure/grpc/service-config.ts
      4. Assert: count >= 2
    Expected Result: All registry entries present
    Evidence: grep output captured
  ```

  **Commit**: YES (with Task 1)
  - Message: `feat(proto): add subscriptions and fulfillment proto definitions`
  - Files: `packages/shared-kernel/src/infrastructure/grpc/service-config.ts`, `packages/proto/gen/ts/`, `packages/proto/package.json`

---

- [x] 3. Subscription entities + TypeORM migration (service-commercial)

  **What to do**:
  - Create entities in `services/service-commercial/src/domain/subscriptions/entities/`:
    - `subscription-plan.entity.ts` — SubscriptionPlanEntity:
      - id (UUID PK), organisationId, name, description, billingInterval (enum WEEKLY/BIWEEKLY/MONTHLY/QUARTERLY/YEARLY), amount (decimal 15,2), currency (varchar 10, default EUR), trialDays (int, default 0), isActive (boolean, default true), metadata (jsonb nullable), createdAt, updatedAt
    - `subscription.entity.ts` — SubscriptionEntity:
      - id (UUID PK), organisationId, clientId (uuid), planId (uuid, nullable), contratId (uuid, nullable), externalId (varchar 255, nullable — for WooCommerce mapping), status (enum SubscriptionStatus), startDate (timestamptz), endDate (timestamptz, nullable), nextChargeAt (timestamptz, nullable), pausedAt (timestamptz, nullable), canceledAt (timestamptz, nullable), cancelReason (text, nullable), currentCycleStart (timestamptz, nullable), currentCycleEnd (timestamptz, nullable), billingInterval (enum), amount (decimal 15,2), currency (varchar 10), metadata (jsonb, nullable), createdAt, updatedAt
      - Relations: ManyToOne(SubscriptionPlanEntity), OneToMany(SubscriptionStatusHistoryEntity), OneToMany(SubscriptionCycleEntity)
      - Domain methods: `canTransitionTo(newStatus): boolean`, `activate()`, `pause()`, `resume()`, `cancel(reason)`, `expire()`, `markPastDue()`
      - Unique index: `['organisationId', 'externalId']`
    - `subscription-cycle.entity.ts` — SubscriptionCycleEntity:
      - id (UUID PK), subscriptionId (uuid), cycleNumber (int), periodStart (timestamptz), periodEnd (timestamptz), chargeDate (timestamptz, nullable), chargeStatus (varchar 50, nullable — 'pending', 'charged', 'failed', 'skipped'), amount (decimal 15,2), metadata (jsonb, nullable), createdAt
    - `subscription-status-history.entity.ts` — SubscriptionStatusHistoryEntity:
      - id (UUID PK), subscriptionId (uuid), previousStatus (varchar 50, nullable), newStatus (varchar 50), reason (text, nullable), changedBy (varchar 255, nullable — 'system', 'user', 'woocommerce'), createdAt
    - `index.ts` — Re-export all entities
  - Create repository interfaces in `services/service-commercial/src/domain/subscriptions/repositories/`:
    - `ISubscriptionPlanRepository.ts`
    - `ISubscriptionRepository.ts`
    - `ISubscriptionCycleRepository.ts`
    - `ISubscriptionStatusHistoryRepository.ts`
    - `index.ts`
  - Create migration `services/service-commercial/src/migrations/{timestamp}-CreateSubscriptionTables.ts`:
    - Tables: subscription_plans, subscriptions, subscription_cycles, subscription_status_history
    - Enum types: subscription_status_enum, billing_interval_enum
    - Indexes: (organisationId), (clientId), (planId), (organisationId, externalId) unique, (status), (nextChargeAt)
    - Full `down()` with DROP TABLE + DROP TYPE

  **Must NOT do**:
  - Do NOT use `synchronize: true` — migrations only
  - Do NOT create a base entity class
  - Do NOT add NATS integration in this task (Task 6)
  - Do NOT touch existing contrats entities

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Multiple entities with complex relationships, state machine design, migration creation
  - **Skills**: [`microservice-maintainer`]
    - `microservice-maintainer`: DDD entity patterns, TypeORM conventions, migration patterns

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 2 (first in wave)
  - **Blocks**: Tasks 4, 5, 7, 8, 9
  - **Blocked By**: Task 2

  **References**:

  **Pattern References**:
  - `services/service-commercial/src/domain/contrats/entities/contrat.entity.ts` — Entity structure: UUID PK, Column naming with `{ name: 'snake_case' }`, timestamps, relations
  - `services/service-commercial/src/domain/contrats/entities/historique-statut-contrat.entity.ts` — Status history entity pattern
  - `services/service-commercial/src/domain/contrats/entities/orchestration-history.entity.ts` — JSONB column pattern, enum column pattern
  - `services/service-commercial/src/domain/contrats/repositories/IContratRepository.ts` — Repository interface pattern
  - `services/service-finance/src/domain/payments/entities/psp-event-inbox.entity.ts` — Domain methods on entity pattern (`markVerified()`, `markProcessed()`)
  - `services/service-commercial/src/migrations/1737801000000-AddContestationCommission.ts` — Migration raw SQL pattern

  **Acceptance Criteria**:
  - [ ] 4 entity files created in `domain/subscriptions/entities/`
  - [ ] 4 repository interfaces in `domain/subscriptions/repositories/`
  - [ ] Migration file created and contains CREATE TABLE for all 4 tables
  - [ ] SubscriptionEntity has `canTransitionTo()` method with valid state machine logic
  - [ ] All entities follow existing naming conventions (snake_case columns, camelCase properties)

  **Agent-Executed QA Scenarios**:

  ```
  Scenario: Entity files exist with correct structure
    Tool: Bash
    Preconditions: Task 3 completed
    Steps:
      1. ls services/service-commercial/src/domain/subscriptions/entities/
      2. Assert: 5 files (4 entities + index.ts)
      3. grep -c "@PrimaryGeneratedColumn" services/service-commercial/src/domain/subscriptions/entities/subscription.entity.ts
      4. Assert: 1
      5. grep "canTransitionTo" services/service-commercial/src/domain/subscriptions/entities/subscription.entity.ts
      6. Assert: method exists
    Expected Result: All entities created with correct patterns
    Evidence: Terminal output captured

  Scenario: Migration creates all tables
    Tool: Bash
    Preconditions: Migration file created
    Steps:
      1. grep -c "CREATE TABLE" services/service-commercial/src/migrations/*CreateSubscription*
      2. Assert: 4 (one per table)
      3. grep -c "DROP TABLE" services/service-commercial/src/migrations/*CreateSubscription*
      4. Assert: 4 (proper rollback)
    Expected Result: Migration has full up/down for all tables
    Evidence: grep output captured
  ```

  **Commit**: YES
  - Message: `feat(subscriptions): add subscription entities, repositories, and migration`
  - Files: `services/service-commercial/src/domain/subscriptions/`
  - Pre-commit: `bun test` in service-commercial (existing tests still pass)

---

- [x] 4. Subscription gRPC controller + repository services + module wiring

  **What to do**:
  - Create TypeORM repository implementations in `services/service-commercial/src/infrastructure/persistence/typeorm/repositories/subscriptions/`:
    - `subscription-plan.service.ts` — CRUD operations, findByOrganisation with pagination
    - `subscription.service.ts` — CRUD, findByClient, findByPlan, findByOrganisation, findByExternalId, updateStatus with state machine validation
    - `subscription-cycle.service.ts` — Create, findBySubscription, updateChargeStatus
    - `subscription-status-history.service.ts` — Create, findBySubscription
    - `index.ts`
  - Create gRPC controllers in `services/service-commercial/src/infrastructure/grpc/subscriptions/`:
    - `subscription-plan.controller.ts` — @GrpcMethod for SubscriptionPlanService RPCs
    - `subscription.controller.ts` — @GrpcMethod for SubscriptionService RPCs including Activate/Pause/Resume/Cancel/Expire with state machine validation
    - `preference.controller.ts` — placeholder (implemented in Task 9)
    - `woocommerce.controller.ts` — placeholder (implemented in Task 7)
    - `index.ts`
  - Create `services/service-commercial/src/subscriptions.module.ts`:
    - Import TypeOrmModule.forFeature([all subscription entities])
    - Import forwardRef(() => ContratsModule) if needed
    - Provide all services
    - Register controllers
    - Export services
  - Update `services/service-commercial/src/app.module.ts`: add SubscriptionsModule to imports
  - Update `services/service-commercial/src/main.ts`:
    - Add 'subscriptions', 'subscription-plans', 'subscription-preferences', 'subscription-preference-schemas', 'woocommerce' to getMultiGrpcOptions() array
    - Update console.log to list new gRPC services

  **Must NOT do**:
  - Do NOT implement preference or WooCommerce logic yet (placeholders only)
  - Do NOT add NATS integration (Task 6)
  - Do NOT modify existing modules beyond importing SubscriptionsModule

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Multiple services + controllers + module wiring following DDD patterns
  - **Skills**: [`microservice-maintainer`]
    - `microservice-maintainer`: gRPC controller patterns, module wiring, repository implementation

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 2 (after Task 3)
  - **Blocks**: Tasks 5, 7, 8, 9
  - **Blocked By**: Task 3

  **References**:

  **Pattern References**:
  - `services/service-commercial/src/infrastructure/persistence/typeorm/repositories/contrats/contrat.service.ts` — Repository implementation with InjectRepository, RpcException error handling, pagination
  - `services/service-commercial/src/infrastructure/grpc/contrats/contrat.controller.ts` — gRPC controller with @GrpcMethod, snake_case→camelCase mapping
  - `services/service-commercial/src/contrats.module.ts` — Module pattern with TypeOrmModule.forFeature, forwardRef, exports
  - `services/service-commercial/src/app.module.ts` — Module registration in imports array
  - `services/service-commercial/src/main.ts` — getMultiGrpcOptions array and console.log pattern

  **Acceptance Criteria**:
  - [ ] Repository services created with CRUD + specific queries
  - [ ] gRPC controllers created with @GrpcMethod decorators
  - [ ] SubscriptionsModule wired and exported
  - [ ] app.module.ts imports SubscriptionsModule
  - [ ] main.ts includes new proto names in getMultiGrpcOptions
  - [ ] Service starts without errors: `bun run start:dev` (or docker-compose up)
  - [ ] `grpcurl -plaintext localhost:50053 list` shows SubscriptionService, SubscriptionPlanService

  **Agent-Executed QA Scenarios**:

  ```
  Scenario: gRPC services registered and reachable
    Tool: Bash
    Preconditions: service-commercial running on localhost:50053
    Steps:
      1. grpcurl -plaintext localhost:50053 list
      2. Assert: output contains "subscriptions.SubscriptionService"
      3. Assert: output contains "subscriptions.SubscriptionPlanService"
    Expected Result: New gRPC services visible
    Evidence: grpcurl output captured

  Scenario: Create subscription plan via gRPC
    Tool: Bash
    Preconditions: service-commercial running, database migrated
    Steps:
      1. grpcurl -plaintext -d '{"organisation_id":"00000000-0000-0000-0000-000000000001","name":"Test Plan","billing_interval":"BILLING_INTERVAL_MONTHLY","amount":29.90,"currency":"EUR"}' localhost:50053 subscriptions.SubscriptionPlanService/Create
      2. Assert: response has "id" field (UUID format)
      3. Assert: response has "name" = "Test Plan"
    Expected Result: Plan created successfully
    Evidence: Response body captured
  ```

  **Commit**: YES
  - Message: `feat(subscriptions): add gRPC controllers, repository services, and module wiring`
  - Files: `services/service-commercial/src/infrastructure/`, `services/service-commercial/src/subscriptions.module.ts`, `services/service-commercial/src/app.module.ts`, `services/service-commercial/src/main.ts`
  - Pre-commit: `bun test` in service-commercial

---

- [x] 5. Subscription state machine domain service + unit tests

  **What to do**:
  - Create `services/service-commercial/src/domain/subscriptions/services/subscription-state-machine.service.ts`:
    - Define valid transitions map:
      - PENDING → [ACTIVE, CANCELED]
      - ACTIVE → [PAUSED, PAST_DUE, CANCELED, EXPIRED]
      - PAUSED → [ACTIVE, CANCELED]
      - PAST_DUE → [ACTIVE, CANCELED, EXPIRED]
      - CANCELED → [] (terminal)
      - EXPIRED → [] (terminal)
    - Method `canTransition(from, to): boolean`
    - Method `transition(subscription, newStatus, reason?, changedBy?): { subscription, historyEntry }`
    - Method `getAvailableTransitions(currentStatus): SubscriptionStatus[]`
  - Create tests in `services/service-commercial/src/domain/subscriptions/services/__tests__/`:
    - `subscription-state-machine.spec.ts`:
      - Test all valid transitions (6 origin states × valid targets)
      - Test all invalid transitions (CANCELED→ACTIVE, EXPIRED→ACTIVE, PENDING→PAUSED, etc.)
      - Test `getAvailableTransitions()` returns correct options
      - Test `transition()` creates correct history entry
      - Test `transition()` sets canceledAt/pausedAt timestamps correctly

  **Must NOT do**:
  - Do NOT add infrastructure dependencies (pure domain logic)
  - Do NOT add payment/billing logic
  - Do NOT add automatic PAST_DUE detection

  **Recommended Agent Profile**:
  - **Category**: `ultrabrain`
    - Reason: State machine logic with comprehensive edge case coverage requires careful reasoning
  - **Skills**: [`microservice-maintainer`]
    - `microservice-maintainer`: Domain service patterns and testing conventions

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 2 (after Task 4)
  - **Blocks**: Tasks 6, 7
  - **Blocked By**: Task 4

  **References**:

  **Pattern References**:
  - `services/service-commercial/src/domain/commercial/services/__tests__/` — Test structure pattern with bun:test
  - `services/service-finance/src/domain/payments/entities/psp-event-inbox.entity.ts` — Domain method pattern (state transition methods on entity)

  **Acceptance Criteria**:
  - [ ] State machine service created with transition map
  - [ ] All valid transitions return true
  - [ ] All invalid transitions return false / throw error
  - [ ] `bun test --filter "subscription-state-machine"` passes with 0 failures
  - [ ] At least 15 test cases covering all transition combinations

  **Agent-Executed QA Scenarios**:

  ```
  Scenario: State machine unit tests pass
    Tool: Bash
    Preconditions: Test file created
    Steps:
      1. cd services/service-commercial && bun test --filter "subscription-state-machine"
      2. Assert: exit code 0
      3. Assert: output shows >= 15 tests passed
      4. Assert: output shows 0 failures
    Expected Result: All state machine tests green
    Evidence: Test output captured

  Scenario: Existing tests still pass
    Tool: Bash
    Preconditions: service-commercial directory
    Steps:
      1. cd services/service-commercial && bun test
      2. Assert: exit code 0
      3. Assert: all existing 5 specs still pass
    Expected Result: No regression
    Evidence: Full test output captured
  ```

  **Commit**: YES
  - Message: `feat(subscriptions): add state machine domain service with comprehensive tests`
  - Files: `services/service-commercial/src/domain/subscriptions/services/`
  - Pre-commit: `bun test` in service-commercial

---

### ═══════════════════════════════════════
### GAP 2 — WOOCOMMERCE INTEGRATION
### ═══════════════════════════════════════

- [x] 6. NATS first-adoption in service-commercial

  **What to do**:
  - Add NATS configuration to `services/service-commercial/src/app.module.ts`:
    - Import `NatsModule` from `@crm/shared-kernel`
    - Add `NatsModule.forRootAsync({ useFactory: (config) => ({ servers: config.get('NATS_URL', 'nats://localhost:4222') }), inject: [ConfigService] })`
  - Add env vars to `.env.development` and `.env.example`:
    - `NATS_URL=nats://nats:4222`
  - Create `services/service-commercial/src/infrastructure/messaging/nats/` directory
  - Verify NATS connection at startup (check logs for "Connected to NATS")

  **Must NOT do**:
  - Do NOT use JetStream consumers (core NATS for MVP)
  - Do NOT use protobuf codec (JSON for simplicity)
  - Do NOT create event handlers yet (Task 8)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Simple configuration + module import
  - **Skills**: [`microservice-maintainer`]
    - `microservice-maintainer`: Module configuration patterns

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 3 (first)
  - **Blocks**: Tasks 7, 8, 14
  - **Blocked By**: Task 5

  **References**:

  **Pattern References**:
  - `packages/shared-kernel/src/infrastructure/nats/nats.module.ts` — NatsModule.forRoot/forRootAsync pattern
  - `packages/shared-kernel/src/infrastructure/nats/nats.service.ts` — NatsService with publish/subscribe methods
  - `services/service-commercial/src/app.module.ts` — Where to add NatsModule import

  **API/Type References**:
  - `packages/shared-kernel/src/infrastructure/nats/nats.service.ts` — publish(subject, data), subscribe(subject, callback, options)

  **External References**:
  - `compose/dev/infrastructure.yml:63-77` — NATS 2.10 container with JetStream, port 4222

  **Acceptance Criteria**:
  - [ ] NatsModule imported in app.module.ts
  - [ ] NATS_URL env var set
  - [ ] Service starts and logs "Connected to NATS" (or similar NATS connection confirmation)
  - [ ] No errors related to NATS at startup

  **Agent-Executed QA Scenarios**:

  ```
  Scenario: NATS connection established at startup
    Tool: Bash
    Preconditions: Docker NATS container running, service-commercial starting
    Steps:
      1. Start service-commercial
      2. Check logs for NATS connection message
      3. Assert: logs contain connection confirmation
    Expected Result: NATS connected on startup
    Evidence: Log output captured
  ```

  **Commit**: YES
  - Message: `feat(commercial): add NATS module configuration (first adoption)`
  - Files: `services/service-commercial/src/app.module.ts`, `.env` files

---

- [x] 7. WooCommerce webhook HTTP receiver + inbox entity

  **What to do**:
  - Create WooCommerce entities in `services/service-commercial/src/domain/woocommerce/entities/`:
    - `woocommerce-webhook-event.entity.ts` — WooCommerceWebhookEventEntity:
      - id (UUID PK), organisationId, source ('woocommerce'), topic (varchar 100 — e.g., 'subscription.created', 'order.completed'), externalEventId (varchar 255 — WC webhook delivery ID), payload (jsonb — raw WC payload), status (enum: RECEIVED, VERIFIED, PROCESSED, FAILED, DUPLICATE), signature (text), errorMessage (text, nullable), receivedAt (timestamptz), verifiedAt (timestamptz, nullable), processedAt (timestamptz, nullable), createdAt
      - Domain methods: markVerified(), markProcessed(), markFailed(msg), markDuplicate()
      - Unique index: ['source', 'externalEventId']
    - `woocommerce-mapping.entity.ts` — WooCommerceMappingEntity:
      - id (UUID PK), organisationId, woocommerceId (varchar 255), entityType (varchar 50 — 'subscription', 'order', 'customer', 'product'), entityId (uuid — CRM entity ID), lastSyncAt (timestamptz), metadata (jsonb, nullable), createdAt, updatedAt
      - Unique index: ['organisationId', 'woocommerceId', 'entityType']
    - `woocommerce-config.entity.ts` — WooCommerceConfigEntity:
      - id (UUID PK), organisationId (unique), storeUrl (varchar 500), webhookSecret (text — for HMAC verification), consumerKey (text, nullable), consumerSecret (text, nullable), isActive (boolean, default true), lastWebhookAt (timestamptz, nullable), createdAt, updatedAt
    - `index.ts`
  - Create repository interfaces in `services/service-commercial/src/domain/woocommerce/repositories/`
  - Create HTTP webhook controller in `services/service-commercial/src/infrastructure/http/woocommerce/`:
    - `webhook.controller.ts`:
      - `@Controller('webhooks')` (NestJS HTTP controller)
      - `@Post('woocommerce')` endpoint
      - Extract raw body for HMAC verification
      - Read `X-WC-Webhook-Signature`, `X-WC-Webhook-Topic`, `X-WC-Webhook-Delivery` headers
      - Verify HMAC-SHA256 signature against per-org webhook secret
      - Store event in WooCommerceWebhookEventEntity with RECEIVED status
      - Mark VERIFIED after HMAC check
      - Publish to NATS subject `crm.commercial.woocommerce.webhook.received`
      - Return HTTP 200 immediately
      - Handle duplicate detection (existing externalEventId → mark DUPLICATE, return 200)
    - `webhook.guard.ts` — WooCommerceSignatureGuard (or inline in controller)
  - Exclude webhook route from AuthInterceptor (modify APP_INTERCEPTORS config or use @Public() decorator if available)
  - Create migration for WooCommerce tables
  - Create TypeORM repositories in infrastructure/persistence/

  **Must NOT do**:
  - Do NOT process webhook payload synchronously in controller (write to inbox, publish NATS, return 200)
  - Do NOT build CRM→WooCommerce sync
  - Do NOT create generic webhook framework

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: HTTP controller + HMAC security + webhook inbox + NATS publishing — critical infrastructure
  - **Skills**: [`microservice-maintainer`]
    - `microservice-maintainer`: Entity patterns, gRPC controllers, infrastructure patterns

  **Parallelization**:
  - **Can Run In Parallel**: YES — can run with Task 9
  - **Parallel Group**: Wave 3 (with Task 9)
  - **Blocks**: Task 8
  - **Blocked By**: Task 6

  **References**:

  **Pattern References**:
  - `services/service-finance/src/domain/payments/entities/psp-event-inbox.entity.ts` — Webhook inbox pattern: WebhookEventStatus enum, domain methods (markVerified/Processed/Failed/Duplicate), unique index on [provider, eventId]
  - `services/service-engagement/src/domain/engagement/entities/calendar-event.entity.ts` — External ID mapping pattern (provider + externalId unique index)
  - `services/service-commercial/src/main.ts` — HTTP already running on port 3053

  **External References**:
  - WooCommerce Webhooks docs: `X-WC-Webhook-Signature` = base64(HMAC-SHA256(body, secret))
  - WooCommerce Subscription webhook topics: `subscription.created`, `subscription.updated`, `subscription.deleted`, `subscription.status_changed`

  **Acceptance Criteria**:
  - [ ] 3 WooCommerce entities created + migration
  - [ ] HTTP POST /webhooks/woocommerce endpoint responds
  - [ ] Valid signature → HTTP 200, event stored with status VERIFIED
  - [ ] Invalid signature → HTTP 401
  - [ ] Duplicate event → HTTP 200, status DUPLICATE (idempotent)
  - [ ] NATS event published on valid webhook

  **Agent-Executed QA Scenarios**:

  ```
  Scenario: Valid webhook accepted and stored
    Tool: Bash (curl)
    Preconditions: service-commercial running, WooCommerceConfig exists for test org
    Steps:
      1. Compute HMAC: echo -n '{"id":123,"status":"active"}' | openssl dgst -sha256 -hmac "test-secret" -binary | base64
      2. curl -s -w "\n%{http_code}" -X POST http://localhost:3053/webhooks/woocommerce \
           -H "Content-Type: application/json" \
           -H "X-WC-Webhook-Signature: <computed-hmac>" \
           -H "X-WC-Webhook-Topic: subscription.created" \
           -H "X-WC-Webhook-Delivery: delivery-001" \
           -d '{"id":123,"status":"active"}'
      3. Assert: HTTP status is 200
    Expected Result: Webhook accepted and stored
    Evidence: Response captured

  Scenario: Invalid signature rejected
    Tool: Bash (curl)
    Preconditions: service-commercial running
    Steps:
      1. curl -s -w "\n%{http_code}" -X POST http://localhost:3053/webhooks/woocommerce \
           -H "Content-Type: application/json" \
           -H "X-WC-Webhook-Signature: invalid-signature" \
           -H "X-WC-Webhook-Topic: subscription.created" \
           -d '{"id":123}'
      2. Assert: HTTP status is 401
    Expected Result: Unauthorized - invalid signature
    Evidence: Response captured

  Scenario: Duplicate webhook handled idempotently
    Tool: Bash (curl)
    Preconditions: Webhook with delivery-001 already processed
    Steps:
      1. Send same webhook with same X-WC-Webhook-Delivery
      2. Assert: HTTP status is 200 (not 409)
      3. Assert: no duplicate subscription created
    Expected Result: Idempotent - returns 200 without re-processing
    Evidence: Response + DB check captured
  ```

  **Commit**: YES
  - Message: `feat(woocommerce): add webhook receiver with HMAC verification and inbox pattern`
  - Files: `services/service-commercial/src/domain/woocommerce/`, `services/service-commercial/src/infrastructure/http/`, migration
  - Pre-commit: `bun test` in service-commercial

---

- [x] 8. WooCommerce NATS consumer workers + subscription sync

  **What to do**:
  - Create NATS event handlers in `services/service-commercial/src/infrastructure/messaging/nats/handlers/`:
    - `woocommerce-webhook.handler.ts`:
      - Subscribes to `crm.commercial.woocommerce.webhook.received` with queue group `commercial-wc-processor`
      - Routes by topic: `subscription.created` → createSubscription, `subscription.updated` → updateSubscription, `subscription.deleted` → deactivateSubscription, `order.completed` → updateSubscriptionCycle
      - Each handler:
        1. Parse payload (WooCommerce webhook format)
        2. Check idempotency (via eventId)
        3. Upsert WooCommerceMapping (woocommerceId ↔ CRM entityId)
        4. Create/update subscription entity via repository service
        5. Update webhook event status to PROCESSED
        6. Publish domain event: `crm.commercial.subscription.created` / `.activated` / `.canceled`
      - Error handling: catch errors, mark webhook event as FAILED with error message
  - Create WooCommerce sync service in `services/service-commercial/src/domain/woocommerce/services/`:
    - `woocommerce-sync.service.ts`:
      - Map WooCommerce subscription status to CRM SubscriptionStatus:
        - 'active' → ACTIVE, 'on-hold' → PAUSED, 'cancelled' → CANCELED, 'expired' → EXPIRED, 'pending' → PENDING, 'pending-cancel' → CANCELED
      - Map WooCommerce billing period to BillingInterval:
        - 'week' → WEEKLY, 'month' → MONTHLY, 'year' → YEARLY
      - Extract client matching logic (by email or WooCommerce customer ID)

  **Must NOT do**:
  - Do NOT build CRM→WooCommerce sync
  - Do NOT sync WooCommerce products
  - Do NOT handle WooCommerce admin actions

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: NATS consumer patterns (first adoption), event routing, data mapping between WC and CRM
  - **Skills**: [`microservice-maintainer`]
    - `microservice-maintainer`: NATS handler patterns, domain service patterns

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 3 (after Task 7)
  - **Blocks**: Task 14
  - **Blocked By**: Task 7

  **References**:

  **Pattern References**:
  - `packages/shared-kernel/src/infrastructure/nats/nats.service.ts` — subscribe(subject, callback, options) with queue group
  - `packages/shared-kernel/src/infrastructure/idempotence/idempotence.service.ts` — IdempotenceService for consumer deduplication

  **Acceptance Criteria**:
  - [ ] NATS handler subscribes to `crm.commercial.woocommerce.webhook.received`
  - [ ] WooCommerce `subscription.created` webhook → creates CRM Subscription entity
  - [ ] WooCommerce `subscription.updated` with status change → updates CRM subscription status
  - [ ] WooCommerceMapping entry created linking WC ID to CRM entity ID
  - [ ] Webhook event marked PROCESSED after successful handling
  - [ ] Domain event published on `crm.commercial.subscription.{event}`

  **Agent-Executed QA Scenarios**:

  ```
  Scenario: WooCommerce subscription.created → CRM subscription created
    Tool: Bash
    Preconditions: service-commercial running with NATS, webhook event stored
    Steps:
      1. Publish NATS message simulating webhook event
      2. Wait 2s for processing
      3. grpcurl -plaintext -d '{"organisation_id":"org-uuid"}' localhost:50053 subscriptions.SubscriptionService/List
      4. Assert: list contains subscription with externalId matching WC subscription ID
    Expected Result: CRM subscription created from WC webhook
    Evidence: gRPC response captured

  Scenario: Mapping table populated
    Tool: Bash
    Preconditions: WooCommerce subscription processed
    Steps:
      1. grpcurl -plaintext -d '{"organisation_id":"org-uuid"}' localhost:50053 subscriptions.WooCommerceService/GetMappings
      2. Assert: response contains mapping with entityType="subscription"
    Expected Result: WC→CRM mapping exists
    Evidence: gRPC response captured
  ```

  **Commit**: YES
  - Message: `feat(woocommerce): add NATS consumer workers and subscription sync logic`
  - Files: `services/service-commercial/src/infrastructure/messaging/nats/`, `services/service-commercial/src/domain/woocommerce/services/`
  - Pre-commit: `bun test` in service-commercial

---

### ═══════════════════════════════════════
### GAP 4 — DYNAMIC PREFERENCES
### ═══════════════════════════════════════

- [x] 9. Preference entities + schema validation + gRPC controller

  **What to do**:
  - Create entities in `services/service-commercial/src/domain/preferences/entities/`:
    - `subscription-preference-schema.entity.ts` — SubscriptionPreferenceSchemaEntity:
      - id (UUID PK), organisationId (unique), schemaDefinition (jsonb — JSON Schema format with properties, types, enums, required), version (int, default 1), isActive (boolean, default true), createdAt, updatedAt
    - `subscription-preference.entity.ts` — SubscriptionPreferenceEntity:
      - id (UUID PK), subscriptionId (uuid, unique — one preference set per subscription), values (jsonb — actual preference values), schemaVersion (int — which schema version was used), validatedAt (timestamptz), createdAt, updatedAt
    - `subscription-preference-history.entity.ts` — SubscriptionPreferenceHistoryEntity:
      - id (UUID PK), subscriptionId (uuid), previousValues (jsonb, nullable), newValues (jsonb), changedBy (varchar 255), changeReason (text, nullable), appliesFromCycle (int, nullable — which cycle this applies from), createdAt
    - `index.ts`
  - Create repository interfaces + TypeORM implementations
  - Create domain service `services/service-commercial/src/domain/preferences/services/`:
    - `preference-validation.service.ts`:
      - `validateAgainstSchema(values, schema): { valid: boolean, errors: string[] }` — validates preference values against JSON Schema definition
      - Uses simple JSON Schema validation (check types, enums, required fields)
  - Create gRPC controller for SubscriptionPreferenceSchemaService and SubscriptionPreferenceService:
    - Upsert schema (per org)
    - Set preferences (validate against schema, create history entry)
    - Get preferences, Get history
  - Wire into SubscriptionsModule (add entities, services, controllers)
  - Create migration for preference tables

  **Must NOT do**:
  - Do NOT build UI schema designer
  - Do NOT build preference templates marketplace
  - Do NOT add complex versioning beyond simple version counter
  - Do NOT add cut-off logic yet (Task 10)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: JSONB schema validation, dynamic typing, history tracking
  - **Skills**: [`microservice-maintainer`]
    - `microservice-maintainer`: Entity patterns, JSONB conventions

  **Parallelization**:
  - **Can Run In Parallel**: YES — can run with Task 7
  - **Parallel Group**: Wave 3 (with Task 7)
  - **Blocks**: Task 10, 14
  - **Blocked By**: Task 4

  **References**:

  **Pattern References**:
  - `services/service-commercial/src/domain/contrats/entities/contrat.entity.ts` — Entity pattern
  - `services/service-commercial/src/domain/products/entities/produit.entity.ts:111-112` — JSONB metadata column pattern

  **Acceptance Criteria**:
  - [ ] 3 preference entities created + migration
  - [ ] Schema validation service rejects invalid preferences
  - [ ] gRPC Set preference with valid values → success + history entry created
  - [ ] gRPC Set preference with invalid values → INVALID_ARGUMENT error
  - [ ] `grpcurl -plaintext localhost:50053 list` shows PreferenceSchemaService, SubscriptionPreferenceService

  **Agent-Executed QA Scenarios**:

  ```
  Scenario: Set valid preference
    Tool: Bash
    Preconditions: Schema with {grind: enum[whole_bean,fine], intensity: enum[light,dark]} exists
    Steps:
      1. grpcurl -plaintext -d '{"subscription_id":"sub-uuid","preferences":{"grind":"whole_bean","intensity":"dark"}}' localhost:50053 subscriptions.SubscriptionPreferenceService/Set
      2. Assert: response has "values" with correct data
      3. grpcurl -plaintext -d '{"subscription_id":"sub-uuid"}' localhost:50053 subscriptions.SubscriptionPreferenceService/GetHistory
      4. Assert: history has 1 entry
    Expected Result: Preference saved with history
    Evidence: gRPC responses captured

  Scenario: Reject invalid preference
    Tool: Bash
    Preconditions: Schema exists with enum constraints
    Steps:
      1. grpcurl -plaintext -d '{"subscription_id":"sub-uuid","preferences":{"grind":"invalid_value"}}' localhost:50053 subscriptions.SubscriptionPreferenceService/Set
      2. Assert: error with INVALID_ARGUMENT status
    Expected Result: Validation error returned
    Evidence: Error response captured
  ```

  **Commit**: YES
  - Message: `feat(preferences): add dynamic preference entities, schema validation, and gRPC`
  - Files: `services/service-commercial/src/domain/preferences/`, migration
  - Pre-commit: `bun test` in service-commercial

---

- [x] 10. Preference cut-off logic + unit tests

  **What to do**:
  - Create domain service `services/service-commercial/src/domain/preferences/services/`:
    - `preference-cutoff.service.ts`:
      - `determineCycleForChange(changeTimestamp, cutoffConfig, currentCycleStart, currentCycleEnd): { appliesFromCycle: 'current' | 'next' }`:
        - If change is BEFORE cut-off for current cycle → applies to current cycle (cycle N)
        - If change is AFTER cut-off → applies to next cycle (cycle N+1)
      - `getCutoffTimestamp(cutoffConfig, cycleStart): Date` — calculates exact cut-off moment from config (day of week + hour + timezone)
  - Update preference Set gRPC endpoint to include cut-off logic:
    - When setting preference, fetch org's FulfillmentCutoffConfig (cross-service via gRPC or shared config)
    - Record `appliesFromCycle` in history entry
  - Create unit tests:
    - `preference-cutoff.spec.ts`:
      - Test: change before cut-off → current cycle
      - Test: change after cut-off → next cycle
      - Test: change exactly at cut-off → next cycle (boundary)
      - Test: different timezones
      - Test: no cut-off config → always current cycle

  **Must NOT do**:
  - Do NOT implement UI for cut-off configuration
  - Do NOT add scheduling here (that's in service-logistics, Task 13)

  **Recommended Agent Profile**:
  - **Category**: `ultrabrain`
    - Reason: Date/timezone logic with boundary conditions requires careful reasoning
  - **Skills**: [`microservice-maintainer`]
    - `microservice-maintainer`: Domain service patterns

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 3 (after Task 9)
  - **Blocks**: Task 14
  - **Blocked By**: Task 9

  **References**:

  **Pattern References**:
  - `services/service-commercial/src/domain/subscriptions/services/__tests__/` — Test patterns with bun:test

  **Acceptance Criteria**:
  - [ ] Cut-off service correctly determines cycle for changes before/after cut-off
  - [ ] Timezone handling works (Europe/Paris, UTC, America/New_York)
  - [ ] `bun test --filter "preference-cutoff"` passes with 0 failures
  - [ ] At least 8 test cases covering boundary conditions

  **Agent-Executed QA Scenarios**:

  ```
  Scenario: Cut-off unit tests pass
    Tool: Bash
    Preconditions: Test file created
    Steps:
      1. cd services/service-commercial && bun test --filter "preference-cutoff"
      2. Assert: exit code 0
      3. Assert: >= 8 tests passed
    Expected Result: All cut-off tests green
    Evidence: Test output captured
  ```

  **Commit**: YES
  - Message: `feat(preferences): add cut-off cycle determination logic with timezone tests`
  - Files: `services/service-commercial/src/domain/preferences/services/`
  - Pre-commit: `bun test` in service-commercial

---

### ═══════════════════════════════════════
### GAP 3 — FULFILLMENT BATCHING
### ═══════════════════════════════════════

- [ ] 11. service-logistics bootstrap conversion (hybrid mode + NATS)

  **What to do**:
  - Convert `services/service-logistics/src/main.ts`:
    - Change from `NestFactory.createMicroservice()` to `NestFactory.create()` + `app.connectMicroservice(grpcOptions)` + `await app.startAllMicroservices()` + `await app.listen(HTTP_PORT)`
    - Change from `getGrpcOptions('logistics')` to `getMultiGrpcOptions(['logistics', 'fulfillment-batches', 'fulfillment-cutoff'])`
    - Add HTTP_PORT env var (default 3060)
    - Update console.log listing gRPC services
  - Add NatsModule to `services/service-logistics/src/app.module.ts`:
    - `NatsModule.forRootAsync({ useFactory: (config) => ({ servers: config.get('NATS_URL', 'nats://localhost:4222') }), inject: [ConfigService] })`
  - Add `@nestjs/schedule` dependency:
    - `ScheduleModule.forRoot()` in app.module.ts
  - Update `.env.development` and `.env.example`:
    - `HTTP_PORT=3060`
    - `NATS_URL=nats://nats:4222`
  - Update docker-compose service definition if needed (expose HTTP port)
  - Verify existing gRPC endpoints still work after conversion

  **Must NOT do**:
  - Do NOT break existing logistics gRPC endpoints
  - Do NOT add HTTP controllers yet (fulfillment controller is gRPC in Task 13)
  - Do NOT add scheduling jobs yet (Task 13)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Bootstrap conversion is delicate — must not break existing functionality
  - **Skills**: [`microservice-maintainer`]
    - `microservice-maintainer`: Service bootstrap patterns, module configuration

  **Parallelization**:
  - **Can Run In Parallel**: YES — can run with Tasks 7-10
  - **Parallel Group**: Wave 3/4 boundary (independent of commercial tasks)
  - **Blocks**: Tasks 12, 13, 14
  - **Blocked By**: Task 6 (needs to see NATS pattern established)

  **References**:

  **Pattern References**:
  - `services/service-commercial/src/main.ts` — Hybrid bootstrap pattern: NestFactory.create + connectMicroservice + listen
  - `services/service-logistics/src/main.ts` — Current createMicroservice pattern (to be replaced)
  - `services/service-commercial/src/app.module.ts` — NatsModule import pattern (once Task 6 establishes it)

  **Acceptance Criteria**:
  - [ ] main.ts uses hybrid mode (NestFactory.create + connectMicroservice)
  - [ ] NatsModule imported in app.module.ts
  - [ ] ScheduleModule imported in app.module.ts
  - [ ] HTTP port 3060 listening
  - [ ] Existing gRPC endpoints still work: `grpcurl -plaintext localhost:50060 list` shows logistics services
  - [ ] NATS connected at startup

  **Agent-Executed QA Scenarios**:

  ```
  Scenario: Existing gRPC services still work after bootstrap change
    Tool: Bash
    Preconditions: service-logistics restarted after changes
    Steps:
      1. grpcurl -plaintext localhost:50060 list
      2. Assert: output contains "logistics.LogisticsService" (or equivalent existing service)
      3. grpcurl -plaintext -d '{"id":"test"}' localhost:50060 logistics.LogisticsService/GetExpedition
      4. Assert: returns NOT_FOUND (not connection error)
    Expected Result: Existing services still respond
    Evidence: grpcurl output captured

  Scenario: HTTP port accessible
    Tool: Bash
    Preconditions: service-logistics running
    Steps:
      1. curl -s -o /dev/null -w "%{http_code}" http://localhost:3060
      2. Assert: HTTP response (404 is fine — just proves HTTP is listening)
    Expected Result: HTTP server running on port 3060
    Evidence: curl output captured
  ```

  **Commit**: YES
  - Message: `refactor(logistics): convert to hybrid mode with NATS and scheduler support`
  - Files: `services/service-logistics/src/main.ts`, `services/service-logistics/src/app.module.ts`, env files
  - Pre-commit: `grpcurl -plaintext localhost:50060 list` (verify no regression)

---

- [ ] 12. Fulfillment entities + migration (service-logistics)

  **What to do**:
  - Create entities in `services/service-logistics/src/domain/fulfillment/entities/`:
    - `fulfillment-cutoff-config.entity.ts` — FulfillmentCutoffConfigEntity:
      - id (UUID PK), organisationId (unique), cutoffDayOfWeek (int 0-6 — 0=Sunday), cutoffHour (int 0-23), cutoffMinute (int 0-59, default 0), timezone (varchar 100, default 'Europe/Paris'), isActive (boolean, default true), createdAt, updatedAt
    - `fulfillment-batch.entity.ts` — FulfillmentBatchEntity:
      - id (UUID PK), organisationId, batchNumber (varchar 50 — auto-generated), status (enum OPEN/LOCKED/DISPATCHED/COMPLETED/CANCELED), cycleStart (timestamptz), cycleEnd (timestamptz), lockedAt (timestamptz, nullable), dispatchedAt (timestamptz, nullable), completedAt (timestamptz, nullable), totalItems (int, default 0), metadata (jsonb, nullable), createdAt, updatedAt
      - Domain methods: lock(), dispatch(), complete(), cancel()
      - Unique index: ['organisationId', 'batchNumber']
    - `fulfillment-batch-line.entity.ts` — FulfillmentBatchLineEntity:
      - id (UUID PK), batchId (uuid), subscriptionId (uuid), expeditionId (uuid, nullable — set when expedition created), clientId (uuid), addressSnapshot (jsonb — frozen address at LOCK), preferenceSnapshot (jsonb — frozen preferences at LOCK), status (varchar 50 — 'pending', 'prepared', 'dispatched'), createdAt, updatedAt
      - Relation: ManyToOne(FulfillmentBatchEntity)
    - `index.ts`
  - Create repository interfaces in `services/service-logistics/src/domain/fulfillment/repositories/`
  - Create migration `services/service-logistics/src/migrations/{timestamp}-CreateFulfillmentTables.ts`

  **Must NOT do**:
  - Do NOT add carrier/shipping API integration from batches
  - Do NOT create pick/pack workflow

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Multiple entities with snapshot JSONB, enum, domain methods
  - **Skills**: [`microservice-maintainer`]
    - `microservice-maintainer`: Entity patterns, migration conventions

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 4 (after Task 11)
  - **Blocks**: Tasks 13, 14
  - **Blocked By**: Tasks 2, 11

  **References**:

  **Pattern References**:
  - `services/service-logistics/src/domain/logistics/entities/expedition.entity.ts` — Entity pattern in service-logistics
  - `services/service-logistics/src/domain/logistics/entities/tracking-event.entity.ts` — Related entity pattern
  - `services/service-logistics/src/migrations/` — Migration convention for service-logistics

  **Acceptance Criteria**:
  - [ ] 3 fulfillment entities created in domain/fulfillment/entities/
  - [ ] Repository interfaces created
  - [ ] Migration creates 3 tables with proper indexes
  - [ ] FulfillmentBatchEntity has domain methods (lock/dispatch/complete/cancel)
  - [ ] Snapshot columns are JSONB type

  **Agent-Executed QA Scenarios**:

  ```
  Scenario: Entities follow logistics conventions
    Tool: Bash
    Preconditions: Entity files created
    Steps:
      1. grep "@PrimaryGeneratedColumn" services/service-logistics/src/domain/fulfillment/entities/fulfillment-batch.entity.ts
      2. Assert: UUID PK pattern found
      3. grep "lock()" services/service-logistics/src/domain/fulfillment/entities/fulfillment-batch.entity.ts
      4. Assert: domain method exists
    Expected Result: Entities match existing patterns
    Evidence: grep output captured
  ```

  **Commit**: YES
  - Message: `feat(fulfillment): add fulfillment batch entities, repositories, and migration`
  - Files: `services/service-logistics/src/domain/fulfillment/`

---

- [ ] 13. Fulfillment gRPC controller + cut-off cron + module wiring

  **What to do**:
  - Create TypeORM repository implementations in `services/service-logistics/src/infrastructure/persistence/typeorm/repositories/fulfillment/`
  - Create gRPC controllers in `services/service-logistics/src/infrastructure/grpc/fulfillment/`:
    - `fulfillment-batch.controller.ts` — @GrpcMethod for FulfillmentBatchService RPCs
    - `fulfillment-cutoff.controller.ts` — @GrpcMethod for FulfillmentCutoffConfigService RPCs
  - Create cron service in `services/service-logistics/src/infrastructure/scheduling/`:
    - `fulfillment-cutoff.cron.ts`:
      - `@Cron('0 * * * *')` — runs every hour
      - Checks all active cutoff configs across organisations
      - For each org past cut-off time with OPEN batch → auto-lock the batch
      - Locking triggers snapshot creation (address + preferences fetched from service-commercial via gRPC)
  - Create `services/service-logistics/src/fulfillment.module.ts`:
    - TypeOrmModule.forFeature([fulfillment entities])
    - Provide repositories, controllers, cron service
    - Export services
  - Update `services/service-logistics/src/app.module.ts`: add FulfillmentModule to imports
  - Update `services/service-logistics/src/logistics.module.ts` if cross-context refs needed

  **Must NOT do**:
  - Do NOT add more than 1 cron job
  - Do NOT add label generation from batches (existing Maileva handles that via Expedition)
  - Do NOT build pick/pack workflow

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: gRPC controller + cron scheduler + cross-service gRPC call + module wiring
  - **Skills**: [`microservice-maintainer`]
    - `microservice-maintainer`: Controller patterns, module wiring, scheduling

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 4 (after Task 12)
  - **Blocks**: Task 14
  - **Blocked By**: Task 12

  **References**:

  **Pattern References**:
  - `services/service-logistics/src/infrastructure/grpc/expedition.controller.ts` — gRPC controller pattern in service-logistics
  - `services/service-logistics/src/logistics.module.ts` — Module wiring pattern in service-logistics
  - `services/service-commercial/src/infrastructure/grpc/contrats/contrat.controller.ts` — Multi-method gRPC controller pattern

  **Acceptance Criteria**:
  - [ ] FulfillmentBatchService and FulfillmentCutoffConfigService gRPC endpoints respond
  - [ ] `grpcurl -plaintext localhost:50060 list` shows fulfillment services
  - [ ] Cron job registered (visible in startup logs)
  - [ ] CreateBatch → returns batch with status OPEN
  - [ ] LockBatch → returns batch with status LOCKED + lockedAt timestamp

  **Agent-Executed QA Scenarios**:

  ```
  Scenario: gRPC fulfillment services registered
    Tool: Bash
    Preconditions: service-logistics running after changes
    Steps:
      1. grpcurl -plaintext localhost:50060 list
      2. Assert: output contains "fulfillment.FulfillmentBatchService"
      3. Assert: output contains "fulfillment.FulfillmentCutoffConfigService"
    Expected Result: Fulfillment gRPC services visible
    Evidence: grpcurl output captured

  Scenario: Create and lock batch
    Tool: Bash
    Preconditions: service-logistics running, database migrated
    Steps:
      1. grpcurl -plaintext -d '{"organisation_id":"org-uuid"}' localhost:50060 fulfillment.FulfillmentBatchService/CreateBatch
      2. Assert: response has status "OPEN"
      3. Extract batch_id from response
      4. grpcurl -plaintext -d '{"batch_id":"<extracted-id>"}' localhost:50060 fulfillment.FulfillmentBatchService/LockBatch
      5. Assert: response has status "LOCKED"
      6. Assert: response has "locked_at" timestamp
    Expected Result: Batch created and locked successfully
    Evidence: gRPC responses captured
  ```

  **Commit**: YES
  - Message: `feat(fulfillment): add gRPC controllers, cut-off cron, and module wiring`
  - Files: `services/service-logistics/src/infrastructure/`, `services/service-logistics/src/fulfillment.module.ts`, `services/service-logistics/src/app.module.ts`

---

- [ ] 14. Fulfillment NATS consumer — subscription events → batch lines

  **What to do**:
  - Create NATS handler in `services/service-logistics/src/infrastructure/messaging/nats/handlers/`:
    - `subscription-event.handler.ts`:
      - Subscribes to `crm.commercial.subscription.activated` with queue group `logistics-fulfillment`
      - On subscription activated:
        1. Find or create OPEN batch for the subscription's org
        2. Add FulfillmentBatchLine (subscriptionId, clientId, status 'pending')
        3. Increment batch totalItems
      - Subscribes to `crm.commercial.subscription.canceled` 
      - On subscription canceled:
        1. Remove pending batch lines for this subscription (if batch still OPEN)
  - Create snapshot service in `services/service-logistics/src/domain/fulfillment/services/`:
    - `batch-snapshot.service.ts`:
      - `createSnapshotsForBatch(batchId)`: For each batch line, fetch current address (from service-core via gRPC) and preferences (from service-commercial via gRPC), store as JSONB snapshots
      - Called during batch LOCK operation

  **Must NOT do**:
  - Do NOT build saga/orchestration patterns
  - Do NOT use JetStream (core NATS + queue groups)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Cross-service NATS eventing + gRPC calls to other services for snapshot data
  - **Skills**: [`microservice-maintainer`]
    - `microservice-maintainer`: NATS handler patterns, cross-service communication

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 4 (after Tasks 8, 10, 13)
  - **Blocks**: Task 15
  - **Blocked By**: Tasks 8, 10, 13

  **References**:

  **Pattern References**:
  - `services/service-commercial/src/infrastructure/messaging/nats/handlers/woocommerce-webhook.handler.ts` — NATS handler pattern (once Task 8 creates it)
  - `packages/shared-kernel/src/infrastructure/nats/nats.service.ts` — subscribe with queue group

  **Acceptance Criteria**:
  - [ ] NATS handler subscribes to subscription events
  - [ ] New active subscription → batch line added to OPEN batch
  - [ ] Canceled subscription → pending batch line removed
  - [ ] Batch LOCK → snapshots created for all lines
  - [ ] Snapshots contain address and preference data

  **Agent-Executed QA Scenarios**:

  ```
  Scenario: Subscription activation creates batch line
    Tool: Bash
    Preconditions: service-logistics running with NATS, OPEN batch exists
    Steps:
      1. Publish NATS event crm.commercial.subscription.activated with subscription data
      2. Wait 2s
      3. grpcurl -plaintext -d '{"batch_id":"batch-uuid"}' localhost:50060 fulfillment.FulfillmentBatchService/ListBatchLines
      4. Assert: response contains batch line with subscriptionId matching
    Expected Result: Batch line auto-created from NATS event
    Evidence: gRPC response captured
  ```

  **Commit**: YES
  - Message: `feat(fulfillment): add NATS consumer for subscription events and snapshot service`
  - Files: `services/service-logistics/src/infrastructure/messaging/nats/`, `services/service-logistics/src/domain/fulfillment/services/`

---

### ═══════════════════════════════════════
### INTEGRATION & VALIDATION
### ═══════════════════════════════════════

- [ ] 15. Integration smoke tests + regression check

  **What to do**:
  - Run all existing tests in service-commercial: `bun test` — assert 0 failures
  - Run all existing tests in service-logistics: `bun test` — assert 0 failures (if any exist)
  - Verify full gRPC service listing on both services
  - Verify NATS connectivity on both services
  - Run end-to-end smoke: simulate WooCommerce webhook → verify subscription created → verify batch line added
  - Document any manual setup steps needed (WooCommerce config, cutoff config)

  **Must NOT do**:
  - Do NOT write e2e test framework
  - Do NOT write load tests

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Verification commands, no new code
  - **Skills**: [`microservice-maintainer`]
    - `microservice-maintainer`: Testing and verification patterns

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 4 (final)
  - **Blocks**: None
  - **Blocked By**: Task 14

  **References**:

  **Pattern References**:
  - All previous tasks' QA scenarios

  **Acceptance Criteria**:
  - [ ] `bun test` in service-commercial: all tests pass (existing + new)
  - [ ] `bun test` in service-logistics: all tests pass
  - [ ] `grpcurl -plaintext localhost:50053 list` shows all subscription services
  - [ ] `grpcurl -plaintext localhost:50060 list` shows all fulfillment services
  - [ ] Both services log NATS connection at startup
  - [ ] E2E smoke: webhook → subscription → batch line works

  **Agent-Executed QA Scenarios**:

  ```
  Scenario: Full regression check
    Tool: Bash
    Preconditions: Both services running
    Steps:
      1. cd services/service-commercial && bun test
      2. Assert: 0 failures
      3. cd services/service-logistics && bun test
      4. Assert: 0 failures
      5. grpcurl -plaintext localhost:50053 list
      6. Assert: >= 10 services listed (existing + new)
      7. grpcurl -plaintext localhost:50060 list
      8. Assert: >= 3 services listed (logistics + fulfillment)
    Expected Result: Full regression passes
    Evidence: All output captured in .sisyphus/evidence/task-15-regression.txt

  Scenario: E2E smoke test — webhook to batch line
    Tool: Bash (curl + grpcurl)
    Preconditions: Both services running, NATS connected, WooCommerce config exists
    Steps:
      1. POST webhook to /webhooks/woocommerce with valid subscription.created payload
      2. Wait 3s for NATS processing
      3. grpcurl List subscriptions → verify subscription exists
      4. grpcurl GetCurrentOpenBatch → verify batch exists
      5. grpcurl ListBatchLines → verify batch line with subscriptionId
    Expected Result: Full flow from webhook to fulfillment batch line
    Evidence: All responses captured in .sisyphus/evidence/task-15-e2e-smoke.txt
  ```

  **Commit**: YES
  - Message: `test(integration): verify full subscription→fulfillment flow and regression`
  - Files: Evidence files only

---

## Commit Strategy

| After Task(s) | Message | Key Files | Verification |
|---------------|---------|-----------|--------------|
| 1-2 | `feat(proto): add subscriptions and fulfillment proto definitions` | proto files, SERVICE_REGISTRY | buf lint |
| 3 | `feat(subscriptions): add subscription entities, repositories, and migration` | domain/subscriptions/ | bun test |
| 4 | `feat(subscriptions): add gRPC controllers, repository services, and module wiring` | infrastructure/, module, main.ts | grpcurl list |
| 5 | `feat(subscriptions): add state machine domain service with comprehensive tests` | domain/subscriptions/services/ | bun test |
| 6 | `feat(commercial): add NATS module configuration (first adoption)` | app.module.ts, .env | startup logs |
| 7 | `feat(woocommerce): add webhook receiver with HMAC verification and inbox pattern` | domain/woocommerce/, infrastructure/http/ | curl POST |
| 8 | `feat(woocommerce): add NATS consumer workers and subscription sync logic` | infrastructure/messaging/nats/ | NATS + grpcurl |
| 9 | `feat(preferences): add dynamic preference entities, schema validation, and gRPC` | domain/preferences/ | grpcurl |
| 10 | `feat(preferences): add cut-off cycle determination logic with timezone tests` | domain/preferences/services/ | bun test |
| 11 | `refactor(logistics): convert to hybrid mode with NATS and scheduler support` | main.ts, app.module.ts | grpcurl + curl |
| 12 | `feat(fulfillment): add fulfillment batch entities, repositories, and migration` | domain/fulfillment/ | entity check |
| 13 | `feat(fulfillment): add gRPC controllers, cut-off cron, and module wiring` | infrastructure/, module | grpcurl |
| 14 | `feat(fulfillment): add NATS consumer for subscription events and snapshot service` | messaging/nats/, services/ | NATS events |
| 15 | `test(integration): verify full subscription→fulfillment flow and regression` | evidence/ | bun test |

---

## Success Criteria

### Verification Commands
```bash
# 1. Proto generation
cd packages/proto && npm run gen  # Expected: 0 errors, TS files generated

# 2. Service-commercial tests
cd services/service-commercial && bun test  # Expected: all pass (existing + new)

# 3. Service-logistics tests
cd services/service-logistics && bun test  # Expected: all pass

# 4. gRPC service listing (commercial)
grpcurl -plaintext localhost:50053 list
# Expected: SubscriptionService, SubscriptionPlanService, PreferenceSchemaService, 
#           SubscriptionPreferenceService, WooCommerceService + existing services

# 5. gRPC service listing (logistics)
grpcurl -plaintext localhost:50060 list
# Expected: FulfillmentBatchService, FulfillmentCutoffConfigService + existing services

# 6. Webhook endpoint
curl -X POST http://localhost:3053/webhooks/woocommerce -H "Content-Type: application/json" -d '{}'
# Expected: 401 (no signature — proves endpoint exists)

# 7. NATS connectivity
# Check both service logs for NATS connection message
```

### Final Checklist
- [ ] All "Must Have" present (state machine, webhook, NATS, fulfillment, preferences)
- [ ] All "Must NOT Have" absent (no CRM→WC sync, no NPS, no event sourcing, etc.)
- [ ] All existing tests pass (5 specs in service-commercial)
- [ ] Proto files lint clean
- [ ] Both services start without errors
- [ ] NATS connected on both services
- [ ] gRPC services registered on both services
- [ ] Webhook receiver accepts valid WC webhooks
- [ ] State machine transitions validated
- [ ] Preferences validated against schema
- [ ] Cut-off logic handles timezone correctly
- [ ] Fulfillment batch LOCK creates snapshots
