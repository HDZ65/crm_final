# Subscription MVP — Gestion des Abonnements Récurrents

## TL;DR

> **Quick Summary**: Ajouter la gestion des abonnements récurrents au CRM en étendant 2 services existants (service-commercial + service-logistics) et en créant un worker WooCommerce. 4 modules : Subscriptions (lifecycle), WooCommerce (sync), Fulfillment Batching, Préférences dynamiques.
> 
> **Deliverables**:
> - Module Subscription dans service-commercial (proto + entities + repositories + controllers + state machine + charge engine)
> - Module Préférences dynamiques dans service-commercial (schema configurable + historique + cut-off rules)
> - Module Fulfillment Batching dans service-logistics (batch lifecycle + cut-off + snapshot + bridge vers expéditions)
> - Worker WooCommerce (webhook receiver + NATS events + mapping + reconciliation)
> - Migrations DB pour les 4 modules
> - Proto definitions pour les 4 modules
> 
> **Estimated Effort**: XL (4-6 semaines)
> **Parallel Execution**: YES - 3 waves
> **Critical Path**: Task 1 (Proto) → Task 2 (Subscription Entities) → Task 4 (Charge Engine) → Task 6 (WooCommerce Worker) → Task 8 (Fulfillment Integration)

---

## Context

### Original Request
Analyse du cahier des charges "Gestion des clients PUREA CAFE" — un système d'abonnements café avec WooCommerce. Identification des gaps CRM et planification de l'implémentation MVP.

### Interview Summary
**Key Discussions**:
- **Scope**: Conception GÉNÉRIQUE multi-tenant (pas spécifique café)
- **Architecture abonnements**: Extension du service-commercial existant (bounded context `subscriptions`), indépendant du contrat (contrat_id optional)
- **Modèle de charge**: Charge-then-ship (prélèvement avant expédition)
- **WooCommerce**: Intégration WooCommerce uniquement (déjà en prod), sync unidirectionnelle via webhooks
- **Fulfillment**: Extension service-logistics, cut-off configurable par société
- **Préférences**: Schéma dynamique par organisation, dans service-commercial avec abonnements
- **NPS/Retours**: EXCLUS du MVP (phase ultérieure, dans service-engagement)
- **Tests**: TDD (Red-Green-Refactor)

### Research Findings
- **service-commercial** contient : contrats, products, commercial (commissions), dashboard — pattern DDD avec `domain/{module}/entities/` + `domain/{module}/repositories/` + `infrastructure/grpc/{module}/` + `infrastructure/persistence/typeorm/repositories/{module}/`
- **service-logistics** contient : expedition, colis, tracking-event, carrier-account — même pattern DDD
- Proto files dans `packages/proto/src/`
- Tests existants : `domain/commercial/services/__tests__/` avec pattern `.spec.ts`
- Payments: service-finance gère Stripe, GoCardless, PayPal, schedules, retry — à intégrer pour les charges

### Metis Review
**Identified Gaps** (addressed):
- **Service name mismatch**: Corrigé — "service-contrats" n'existe pas, c'est service-commercial. "service-activites" n'existe pas, c'est service-engagement.
- **Inter-service communication**: Le charge engine dans service-commercial devra appeler service-finance (PaymentService) via gRPC pour créer les PaymentIntents
- **Event sourcing**: Les transitions d'état Subscription doivent émettre des events NATS pour que service-logistics (fulfillment) puisse écouter SUBSCRIPTION_CHARGED
- **Migration strategy**: Service-commercial utilise TypeORM — les nouvelles tables doivent cohabiter avec contrats/products/commercial

---

## Work Objectives

### Core Objective
Permettre au CRM de gérer des abonnements récurrents de bout en bout : création → facturation automatique → préparation par lots → expédition, avec synchronisation WooCommerce entrante et préférences client dynamiques.

### Concrete Deliverables
- `packages/proto/src/subscriptions/subscriptions.proto` — Définition du service Subscription
- `packages/proto/src/subscriptions/subscription_events.proto` — Events NATS
- `packages/proto/src/fulfillment/fulfillment.proto` — Définition du service Fulfillment Batching
- `packages/proto/src/woocommerce/woocommerce.proto` — Définition du service WooCommerce
- `services/service-commercial/src/domain/subscriptions/` — Entities, repositories, domain services
- `services/service-commercial/src/infrastructure/grpc/subscriptions/` — gRPC controllers
- `services/service-commercial/src/infrastructure/persistence/typeorm/repositories/subscriptions/` — TypeORM repos
- `services/service-logistics/src/domain/fulfillment/` — Fulfillment batch entities + repos
- `services/service-logistics/src/infrastructure/grpc/fulfillment/` — gRPC controllers
- Worker/module WooCommerce (webhook HTTP endpoint + NATS consumer)

### Definition of Done
- [x] Commande `CreateSubscription` fonctionne et crée un abonnement en état PENDING
- [x] Transition PENDING → ACTIVE après paiement réussi
- [x] Pause/Resume/Cancel fonctionnent avec transitions d'état valides
- [x] Charge engine calcule `next_charge_at` et crée des PaymentIntents via service-finance
- [x] Webhook WooCommerce reçu → client + abonnement créés dans le CRM
- [x] Fulfillment batch se crée automatiquement et verrouille les lignes au cut-off
- [x] Préférences dynamiques configurables par organisation
- [x] Tous les tests unitaires passent (TDD)

### Must Have
- State machine complète (PENDING → ACTIVE → PAUSED/PAST_DUE → CANCELED/EXPIRED)
- Idempotence des charges (clé: subscription_id + next_charge_at)
- Prévention double-charge
- Webhook signature validation (WooCommerce)
- Snapshot adresse + préférences au LOCK du batch
- Cut-off configurable par société
- Multi-tenant (organisation_id sur toutes les entités)

### Must NOT Have (Guardrails)
- ❌ NE PAS implémenter NPS/Satisfaction (post-MVP)
- ❌ NE PAS implémenter Retours/SAV (post-MVP)
- ❌ NE PAS implémenter le portail client self-service
- ❌ NE PAS enrichir le modèle Produit avec des variantes spécifiques café
- ❌ NE PAS créer de nouveau microservice — extensions uniquement
- ❌ NE PAS synchroniser du CRM vers WooCommerce (unidirectionnel uniquement)
- ❌ NE PAS gérer les paiements directement — toujours via service-finance (PaymentService gRPC)
- ❌ NE PAS hard-coder des préférences (origine, mouture...) — schéma dynamique uniquement
- ❌ NE PAS modifier les entités Contrat existantes

---

## Verification Strategy (MANDATORY)

> **UNIVERSAL RULE: ZERO HUMAN INTERVENTION**
>
> ALL tasks in this plan MUST be verifiable WITHOUT any human action.

### Test Decision
- **Infrastructure exists**: OUI — Tests existants dans `services/service-commercial/src/domain/commercial/services/__tests__/`
- **Automated tests**: TDD (Red-Green-Refactor)
- **Framework**: bun test (pattern existant : `.spec.ts`)

### Agent-Executed QA Scenarios (MANDATORY — ALL tasks)

**Verification Tool by Deliverable Type:**

| Type | Tool | How Agent Verifies |
|------|------|-------------------|
| Proto compilation | Bash | `npx buf generate` → exit code 0 |
| TypeORM entities | Bash | `bun test` → PASS |
| gRPC controllers | Bash (curl/grpcurl) | Send gRPC request, assert response |
| State machine | Bash (bun test) | Unit tests for each transition |
| WooCommerce webhook | Bash (curl) | POST webhook payload → assert 200 + entity created |
| Fulfillment batch | Bash (bun test) | Unit tests for batch lifecycle |

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Start Immediately):
├── Task 1: Proto definitions (subscriptions + fulfillment + woocommerce)
└── Task 9: Fulfillment cut-off configuration (DB + config entity)

Wave 2 (After Wave 1):
├── Task 2: Subscription entities + repositories + migrations
├── Task 3: Subscription state machine + domain service
├── Task 5: Preference schema + entities + repositories
├── Task 7: WooCommerce webhook receiver + mapping entities
└── Task 10: Fulfillment batch entities + repositories

Wave 3 (After Wave 2):
├── Task 4: Subscription charge engine (intégration service-finance)
├── Task 6: WooCommerce sync workers (NATS consumers)
├── Task 8: Fulfillment batch lifecycle engine (cut-off → lock → dispatch)
└── Task 11: Integration testing + gRPC controllers wiring
```

### Dependency Matrix

| Task | Depends On | Blocks | Can Parallelize With |
|------|------------|--------|---------------------|
| 1 | None | 2, 3, 5, 7, 10 | 9 |
| 2 | 1 | 3, 4, 6 | 5, 7, 9, 10 |
| 3 | 1, 2 | 4 | 5, 7, 10 |
| 4 | 3 | 8, 11 | 5, 6, 10 |
| 5 | 1 | 8 | 2, 3, 7, 10 |
| 6 | 2, 7 | 11 | 4, 5, 8, 10 |
| 7 | 1 | 6 | 2, 3, 5, 10 |
| 8 | 4, 5, 10 | 11 | 6 |
| 9 | None | 8 | 1 |
| 10 | 1 | 8 | 2, 3, 5, 7 |
| 11 | 4, 6, 8 | None | None (final) |

---

## TODOs

- [x] 1. Proto Definitions — Subscriptions, Fulfillment, WooCommerce

  **What to do**:
  - Create `packages/proto/src/subscriptions/subscriptions.proto`:
    - Messages: Subscription, SubscriptionLine, SubscriptionFrequency (enum), SubscriptionStatus (enum), SubscriptionPreferenceSchema, SubscriptionPreference, SubscriptionPreferenceHistory
    - Services: SubscriptionService (Create, Update, Get, List, Delete, Pause, Resume, Cancel, GetDueForCharge), SubscriptionPreferenceSchemaService (Create, Update, Get, List, Delete), SubscriptionPreferenceService (Create, Update, Get, ListBySubscription, GetHistory)
  - Create `packages/proto/src/subscriptions/subscription_events.proto`:
    - Events: SubscriptionCreated, SubscriptionActivated, SubscriptionPaused, SubscriptionResumed, SubscriptionCanceled, SubscriptionCharged, SubscriptionChargeFailed
  - Create `packages/proto/src/fulfillment/fulfillment.proto`:
    - Messages: FulfillmentBatch, FulfillmentBatchLine, FulfillmentCutoffConfig, AddressSnapshot, PreferenceSnapshot
    - Services: FulfillmentBatchService (Create, Get, List, Lock, Dispatch, Complete), FulfillmentCutoffConfigService (Create, Update, Get, GetBySociete, List, Delete)
  - Create `packages/proto/src/woocommerce/woocommerce.proto`:
    - Messages: WooCommerceWebhookEvent, WooCommerceMapping, WooCommerceConfig
    - Services: WooCommerceWebhookService (ReceiveWebhook, GetEvent, ListEvents, RetryEvent), WooCommerceMappingService (Create, Get, GetByWooId, GetByCrmId, List, Delete), WooCommerceConfigService (Create, Update, Get, GetByOrganisation, Delete)
  - Run `npx buf generate` to verify compilation

  **Must NOT do**:
  - Do NOT modify existing proto files (contrats.proto, logistics.proto, etc.)
  - Do NOT add café-specific fields (origin, intensity, grind_type)
  - Do NOT create events for NPS/satisfaction

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Proto files are mostly declarative — well-defined messages and services
  - **Skills**: [`microservice-maintainer`]
    - `microservice-maintainer`: Understands the existing proto patterns and conventions

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Task 9)
  - **Blocks**: Tasks 2, 3, 5, 7, 10
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `packages/proto/src/contrats/contrats.proto` — Follow same structure (service + messages + enums + common pagination)
  - `packages/proto/src/relance/relance.proto:24-54` — Enum patterns (RelanceDeclencheur, RelanceActionType, Priorite)
  - `packages/proto/src/events/contract_events.proto` — Event message pattern for NATS

  **Acceptance Criteria**:

  - [ ] `packages/proto/src/subscriptions/subscriptions.proto` exists and compiles
  - [ ] `packages/proto/src/subscriptions/subscription_events.proto` exists and compiles
  - [ ] `packages/proto/src/fulfillment/fulfillment.proto` exists and compiles
  - [ ] `packages/proto/src/woocommerce/woocommerce.proto` exists and compiles
  - [ ] `npx buf generate` → exit code 0, no errors
  - [ ] SubscriptionStatus enum includes: PENDING, ACTIVE, PAUSED, PAST_DUE, CANCELED, EXPIRED
  - [ ] SubscriptionFrequency enum includes: WEEKLY, BIWEEKLY, MONTHLY, BIMONTHLY, QUARTERLY, ANNUAL
  - [ ] FulfillmentBatchStatus enum includes: OPEN, LOCKED, DISPATCHED, COMPLETED
  - [ ] All messages have organisation_id for multi-tenancy

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: Proto files compile successfully
    Tool: Bash
    Preconditions: buf CLI installed
    Steps:
      1. Run: npx buf generate
      2. Assert: exit code 0
      3. Assert: no error output in stderr
      4. Verify generated TypeScript files exist in packages/proto/generated/
    Expected Result: All proto files compile without errors
    Evidence: Terminal output captured
  ```

  **Commit**: YES
  - Message: `feat(proto): add subscription, fulfillment, and woocommerce proto definitions`
  - Files: `packages/proto/src/subscriptions/`, `packages/proto/src/fulfillment/`, `packages/proto/src/woocommerce/`
  - Pre-commit: `npx buf generate`

---

- [x] 2. Subscription Entities + Repositories + Migrations (service-commercial)

  **What to do**:
  - Create TypeORM entities following existing DDD pattern:
    - `services/service-commercial/src/domain/subscriptions/entities/subscription.entity.ts`
    - `services/service-commercial/src/domain/subscriptions/entities/subscription-line.entity.ts`
    - `services/service-commercial/src/domain/subscriptions/entities/subscription-history.entity.ts` (status change log)
    - `services/service-commercial/src/domain/subscriptions/entities/index.ts`
  - Create repository interfaces:
    - `services/service-commercial/src/domain/subscriptions/repositories/ISubscriptionRepository.ts`
    - `services/service-commercial/src/domain/subscriptions/repositories/ISubscriptionLineRepository.ts`
    - `services/service-commercial/src/domain/subscriptions/repositories/ISubscriptionHistoryRepository.ts`
    - `services/service-commercial/src/domain/subscriptions/repositories/index.ts`
  - Create TypeORM repository implementations:
    - `services/service-commercial/src/infrastructure/persistence/typeorm/repositories/subscriptions/subscription.service.ts`
    - `services/service-commercial/src/infrastructure/persistence/typeorm/repositories/subscriptions/index.ts`
  - Create `subscriptions.module.ts` following `contrats.module.ts` pattern
  - Create TypeORM migration for subscription tables
  - Write TDD tests: RED (test entity creation) → GREEN (implement) → REFACTOR

  **Must NOT do**:
  - Do NOT modify existing contrat entities or tables
  - Do NOT add foreign key constraints to contrat table (contrat_id is soft reference)
  - Do NOT create entities for NPS/satisfaction

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Multiple files across DDD layers, requires understanding of existing patterns
  - **Skills**: [`microservice-maintainer`]
    - `microservice-maintainer`: Follows existing service patterns (entities, repos, module registration)

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 5, 7, 10)
  - **Blocks**: Tasks 3, 4, 6
  - **Blocked By**: Task 1

  **References**:

  **Pattern References**:
  - `services/service-commercial/src/domain/contrats/entities/contrat.entity.ts` — Entity pattern (TypeORM decorators, columns, relations)
  - `services/service-commercial/src/domain/contrats/repositories/IContratRepository.ts` — Repository interface pattern
  - `services/service-commercial/src/infrastructure/persistence/typeorm/repositories/contrats/contrat.service.ts` — TypeORM implementation pattern
  - `services/service-commercial/src/contrats.module.ts` — Module registration pattern (imports, providers, exports)
  - `services/service-commercial/src/domain/contrats/entities/index.ts` — Entity barrel export pattern

  **Acceptance Criteria**:

  - [ ] Test file created: `domain/subscriptions/entities/__tests__/subscription.entity.spec.ts`
  - [ ] `bun test subscription.entity` → PASS
  - [ ] Subscription entity has all required fields (id, organisation_id, client_id, status, frequency, next_charge_at, etc.)
  - [ ] SubscriptionLine entity references subscription_id and produit_id
  - [ ] SubscriptionHistory tracks old_status → new_status with timestamp
  - [ ] Migration creates tables: subscriptions, subscription_lines, subscription_history
  - [ ] Module registered in app.module.ts

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: Subscription entity validates required fields
    Tool: Bash (bun test)
    Preconditions: Proto generated, TypeORM configured
    Steps:
      1. bun test services/service-commercial/src/domain/subscriptions/ --watch=false
      2. Assert: all tests pass
      3. Assert: test covers entity creation, field validation, relation setup
    Expected Result: All unit tests pass for subscription entities
    Evidence: Test output captured

  Scenario: Migration runs successfully
    Tool: Bash
    Steps:
      1. Run TypeORM migration:generate
      2. Run TypeORM migration:run (against test DB)
      3. Assert: tables created (subscriptions, subscription_lines, subscription_history)
    Expected Result: Database tables created without errors
    Evidence: Migration output captured
  ```

  **Commit**: YES
  - Message: `feat(subscriptions): add subscription entities, repositories, and migrations`
  - Files: `services/service-commercial/src/domain/subscriptions/`, `services/service-commercial/src/infrastructure/persistence/typeorm/repositories/subscriptions/`
  - Pre-commit: `bun test`

---

- [x] 3. Subscription State Machine + Domain Service

  **What to do**:
  - Create `services/service-commercial/src/domain/subscriptions/services/subscription-lifecycle.service.ts`:
    - State transition validation (only valid transitions allowed)
    - `activate(subscriptionId)` — PENDING → ACTIVE
    - `pause(subscriptionId, reason?)` — ACTIVE → PAUSED
    - `resume(subscriptionId)` — PAUSED → ACTIVE (recalculate next_charge_at)
    - `markPastDue(subscriptionId)` — ACTIVE → PAST_DUE
    - `cancel(subscriptionId, reason, cancelAtPeriodEnd: bool)` — any → CANCELED
    - `expire(subscriptionId)` — ACTIVE → EXPIRED (natural end)
    - Each transition: validate → update status → create history entry → emit NATS event
  - Create `services/service-commercial/src/domain/subscriptions/services/subscription-scheduling.service.ts`:
    - `calculateNextChargeAt(frequency, currentPeriodEnd)` — calculates next charge date
    - `isChargeEligible(subscription)` — checks if due for charge
    - `getDueSubscriptions(organisationId, beforeDate)` — lists subscriptions due for charge
  - TDD: Write tests for EVERY state transition (valid + invalid)

  **Must NOT do**:
  - Do NOT process payments here (that's Task 4 — charge engine)
  - Do NOT call external services directly (emit events via NATS)

  **Recommended Agent Profile**:
  - **Category**: `ultrabrain`
    - Reason: State machine logic is complex with many edge cases — needs rigorous testing
  - **Skills**: [`microservice-maintainer`]
    - `microservice-maintainer`: Understands domain service patterns in this codebase

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 5, 7, 10)
  - **Blocks**: Task 4
  - **Blocked By**: Tasks 1, 2

  **References**:

  **Pattern References**:
  - `services/service-commercial/src/domain/commercial/services/commission-calculation.service.ts` — Domain service pattern
  - `services/service-commercial/src/domain/commercial/services/__tests__/commission-calculation.service.spec.ts` — Test pattern with mocks
  - `packages/proto/src/contrats/contrats.proto:269-310` — ContractOrchestrationService pattern (Activate/Suspend/Terminate)
  - `services/service-commercial/src/domain/contrats/entities/historique-statut-contrat.entity.ts` — Status history pattern

  **Acceptance Criteria**:

  - [ ] Test file: `domain/subscriptions/services/__tests__/subscription-lifecycle.service.spec.ts`
  - [ ] Tests cover: PENDING→ACTIVE, ACTIVE→PAUSED, PAUSED→ACTIVE, ACTIVE→PAST_DUE, *→CANCELED, ACTIVE→EXPIRED
  - [ ] Tests cover INVALID transitions: CANCELED→ACTIVE (rejected), EXPIRED→PAUSED (rejected)
  - [ ] `bun test subscription-lifecycle` → PASS (minimum 10 tests)
  - [ ] Test file: `domain/subscriptions/services/__tests__/subscription-scheduling.service.spec.ts`
  - [ ] Tests cover: calculateNextChargeAt for WEEKLY, MONTHLY, QUARTERLY frequencies
  - [ ] `bun test subscription-scheduling` → PASS

  **Commit**: YES
  - Message: `feat(subscriptions): add state machine and scheduling domain services with TDD`
  - Files: `services/service-commercial/src/domain/subscriptions/services/`
  - Pre-commit: `bun test`

---

- [x] 4. Subscription Charge Engine (Integration service-finance)

  **What to do**:
  - Create `services/service-commercial/src/domain/subscriptions/services/subscription-charge.service.ts`:
    - `processCharges(organisationId)` — main entry point (called by scheduled job)
    - For each due subscription: create idempotency key (subscription_id + next_charge_at)
    - Call service-finance PaymentService.CreatePaymentIntent via gRPC
    - On success: advance next_charge_at, create Facture via service-finance, emit SUBSCRIPTION_CHARGED
    - On failure: increment retry_count, if max retries → transition to PAST_DUE, emit SUBSCRIPTION_CHARGE_FAILED
  - Create gRPC client for PaymentService in service-commercial
  - Create NATS event publisher for subscription events
  - TDD: Test charge flow with mocked PaymentService

  **Must NOT do**:
  - Do NOT implement payment logic (delegate to service-finance)
  - Do NOT call Stripe/GoCardless directly
  - Do NOT skip idempotency checks

  **Recommended Agent Profile**:
  - **Category**: `ultrabrain`
    - Reason: Complex integration logic with idempotency, retry, and cross-service calls
  - **Skills**: [`microservice-maintainer`]
    - `microservice-maintainer`: Understands gRPC client patterns and NATS event publishing

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Tasks 6, 8)
  - **Blocks**: Tasks 8, 11
  - **Blocked By**: Task 3

  **References**:

  **Pattern References**:
  - `packages/proto/src/payments/payment.proto:58-61` — CreatePaymentIntent RPC
  - `packages/proto/src/events/payment_events.proto` — Payment event patterns
  - `services/service-commercial/src/domain/commercial/services/commission-calculation.service.ts` — Complex domain service pattern

  **API/Type References**:
  - `packages/proto/src/payments/payment.proto:498-508` — CreatePaymentIntentRequest (psp_name, amount, currency, idempotency_key)
  - `packages/proto/src/factures/factures.proto:209-219` — CreateFactureRequest

  **Acceptance Criteria**:

  - [ ] Test file: `domain/subscriptions/services/__tests__/subscription-charge.service.spec.ts`
  - [ ] Tests cover: successful charge → next_charge_at advanced
  - [ ] Tests cover: failed charge → retry_count incremented
  - [ ] Tests cover: max retries exceeded → status PAST_DUE
  - [ ] Tests cover: idempotency key prevents double-charge
  - [ ] Tests cover: already charged subscription is skipped
  - [ ] `bun test subscription-charge` → PASS (minimum 8 tests)

  **Commit**: YES
  - Message: `feat(subscriptions): add charge engine with payment integration and idempotency`
  - Files: `services/service-commercial/src/domain/subscriptions/services/subscription-charge.service.ts`
  - Pre-commit: `bun test`

---

- [x] 5. Subscription Preferences — Schema + Entities + Repositories

  **What to do**:
  - Create entities:
    - `domain/subscriptions/entities/subscription-preference-schema.entity.ts` — Defines available preference fields per organisation (code, label, value_type, allowed_values, is_required, default_value)
    - `domain/subscriptions/entities/subscription-preference.entity.ts` — Actual preference values per subscription (schema_id, value, effective_from)
    - `domain/subscriptions/entities/subscription-preference-history.entity.ts` — Change log (old_value, new_value, changed_at, applied_cycle)
  - Create repository interfaces + TypeORM implementations
  - Create domain service `subscription-preference.service.ts`:
    - `setPreference(subscriptionId, schemaId, value)` — validates against schema, checks cut-off rules
    - `getEffectivePreferences(subscriptionId, forDate?)` — returns current effective preferences
    - `snapshotPreferences(subscriptionId)` — returns frozen snapshot for fulfillment batch
  - Cut-off rule: if current time > société cut-off → applied_cycle = N+1, else N
  - TDD for all operations

  **Must NOT do**:
  - Do NOT hard-code any preference types (origin, mouture, intensity)
  - Do NOT add preference fields to Subscription entity (separate entities)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Dynamic schema system with validation and cut-off logic
  - **Skills**: [`microservice-maintainer`]
    - `microservice-maintainer`: Follows existing DDD patterns

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 2, 3, 7, 10)
  - **Blocks**: Task 8
  - **Blocked By**: Task 1

  **References**:

  **Pattern References**:
  - `services/service-commercial/src/domain/contrats/entities/contrat.entity.ts` — Entity column patterns
  - `services/service-commercial/src/domain/products/entities/produit.entity.ts` — Entity with metadata JSON field
  - `packages/proto/src/calendar/calendar.proto:137-149` — SystemDebitConfiguration pattern (hierarchical config)

  **Acceptance Criteria**:

  - [ ] Schema entity supports value_type: STRING, NUMBER, ENUM, BOOLEAN
  - [ ] Schema entity stores allowed_values as JSON array
  - [ ] Preference validates value against schema (rejects invalid enum values)
  - [ ] History records old_value, new_value, applied_cycle (N or N+1)
  - [ ] Cut-off rule: preference change after cut-off → applied_cycle = N+1
  - [ ] `snapshotPreferences()` returns frozen copy (not live reference)
  - [ ] `bun test subscription-preference` → PASS (minimum 8 tests)

  **Commit**: YES
  - Message: `feat(subscriptions): add dynamic preference schema with cut-off rules`
  - Files: `services/service-commercial/src/domain/subscriptions/entities/subscription-preference-*.ts`, `services/service-commercial/src/domain/subscriptions/services/subscription-preference.service.ts`
  - Pre-commit: `bun test`

---

- [x] 6. WooCommerce Sync Workers (NATS Consumers)

  **What to do**:
  - Create WooCommerce module in service-commercial or as standalone worker:
    - HTTP endpoint: `POST /webhooks/woocommerce` — receives webhook, validates signature, stores event, publishes to NATS
    - NATS consumer: `woocommerce.customer.created` → Create/Update ClientBase via service-core gRPC
    - NATS consumer: `woocommerce.subscription.created` → Create Subscription
    - NATS consumer: `woocommerce.subscription.updated` → Update Subscription (status change, frequency change)
    - NATS consumer: `woocommerce.order.completed` → Link to existing subscription cycle
    - NATS consumer: `woocommerce.payment_intent.succeeded` → Mark charge as paid
  - Create mapping entities:
    - `WooCommerceMappingEntity` — (entity_type, woo_id, crm_entity_id, last_synced_at)
    - `WooCommerceWebhookEventEntity` — (event_type, woo_resource_id, raw_payload, status, error_message, retry_count)
  - Reconciliation: before creating client, search by email/phone to detect existing → update mapping
  - WooCommerce config entity: (organisation_id, woo_url, consumer_key_hash, consumer_secret_hash, webhook_secret, active)
  - TDD for webhook parsing, mapping logic, reconciliation

  **Must NOT do**:
  - Do NOT push data back to WooCommerce (unidirectional only)
  - Do NOT store WooCommerce credentials in plaintext (hash/encrypt)
  - Do NOT process webhooks synchronously (store + NATS async)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Integration work with webhook parsing, NATS events, cross-service gRPC calls, reconciliation logic
  - **Skills**: [`microservice-maintainer`]
    - `microservice-maintainer`: Handles integration patterns within existing services

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Tasks 4, 8)
  - **Blocks**: Task 11
  - **Blocked By**: Tasks 2, 7

  **References**:

  **Pattern References**:
  - `packages/proto/src/payments/payment.proto:536-570` — PaymentEvent pattern (webhook event storage + processing)
  - `packages/proto/src/clients/clients.proto:205-214` — SearchClientRequest (for reconciliation by phone/nom)

  **External References**:
  - WooCommerce Webhooks API: `https://woocommerce.github.io/woocommerce-rest-api-docs/#webhooks`
  - WooCommerce Subscriptions: `https://woocommerce.com/document/subscriptions/develop/`

  **Acceptance Criteria**:

  - [ ] Webhook endpoint returns 200 for valid WooCommerce signature
  - [ ] Webhook endpoint returns 401 for invalid signature
  - [ ] Customer webhook → ClientBase created/updated in CRM
  - [ ] Subscription webhook → Subscription created with correct frequency and status
  - [ ] Duplicate customer detected by email → mapping updated (not duplicate created)
  - [ ] WooCommerce event log records all received webhooks with status
  - [ ] Failed events can be retried
  - [ ] `bun test woocommerce` → PASS (minimum 10 tests)

  **Commit**: YES
  - Message: `feat(woocommerce): add webhook receiver, NATS workers, and entity mapping`
  - Pre-commit: `bun test`

---

- [x] 7. WooCommerce Webhook Receiver + Mapping Entities (DB layer)

  **What to do**:
  - Create TypeORM entities for WooCommerce:
    - `WooCommerceConfigEntity` — (organisation_id, woo_url, webhook_secret_hash, active)
    - `WooCommerceMappingEntity` — (organisation_id, entity_type, woo_id, crm_entity_id, last_synced_at)
    - `WooCommerceWebhookEventEntity` — (organisation_id, event_type, woo_resource_id, raw_payload, status, processed_at, error_message, retry_count)
  - Create repository interfaces + TypeORM implementations
  - Create migration for woocommerce tables
  - Create woocommerce.module.ts
  - TDD for entity creation and mapping operations

  **Must NOT do**:
  - Do NOT implement webhook parsing logic (that's Task 6)
  - Do NOT store secrets in plaintext

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Standard entity + repository creation following existing patterns
  - **Skills**: [`microservice-maintainer`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 2, 3, 5, 10)
  - **Blocks**: Task 6
  - **Blocked By**: Task 1

  **References**:

  **Pattern References**:
  - `services/service-commercial/src/domain/contrats/entities/contrat.entity.ts` — Entity pattern
  - `services/service-commercial/src/domain/contrats/repositories/IContratRepository.ts` — Repo interface pattern

  **Acceptance Criteria**:

  - [ ] Migration creates tables: woocommerce_config, woocommerce_mappings, woocommerce_webhook_events
  - [ ] WooCommerceMappingEntity supports entity_type enum: CLIENT, SUBSCRIPTION, ORDER, PAYMENT
  - [ ] WooCommerceWebhookEventEntity supports status: RECEIVED, PROCESSING, DONE, FAILED
  - [ ] `bun test woocommerce` → PASS

  **Commit**: YES (groups with Task 6)
  - Message: `feat(woocommerce): add WooCommerce entities, mappings, and migrations`
  - Pre-commit: `bun test`

---

- [x] 8. Fulfillment Batch Lifecycle Engine (service-logistics)

  **What to do**:
  - Create domain service `services/service-logistics/src/domain/fulfillment/services/fulfillment-batch.service.ts`:
    - `createBatch(organisationId, societeId)` — creates OPEN batch
    - `lockBatch(batchId)` — OPEN → LOCKED, generates batch lines from due charged subscriptions, snapshots addresses + preferences
    - `dispatchBatch(batchId)` — LOCKED → DISPATCHED, creates Expeditions via existing logistics service
    - `completeBatch(batchId)` — DISPATCHED → COMPLETED
    - `getOpenBatch(societeId)` — returns current OPEN batch (or creates one)
  - Create NATS listener for `SUBSCRIPTION_CHARGED` event → adds line to current OPEN batch
  - Create cut-off job service: checks if current time > société cut-off → auto-lock batch
  - Snapshot logic: at lock time, copy client address + preferences into batch line (immutable)
  - Bridge to logistics: generate CreateExpeditionRequest from batch lines

  **Must NOT do**:
  - Do NOT modify existing expedition/colis entities
  - Do NOT process payments (receive SUBSCRIPTION_CHARGED event only)

  **Recommended Agent Profile**:
  - **Category**: `ultrabrain`
    - Reason: Complex orchestration between subscriptions (NATS events), preferences (snapshots), and logistics (expedition creation)
  - **Skills**: [`microservice-maintainer`]
    - `microservice-maintainer`: Understands existing logistics service patterns

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 3 (sequential after Tasks 4, 5, 10)
  - **Blocks**: Task 11
  - **Blocked By**: Tasks 4, 5, 10

  **References**:

  **Pattern References**:
  - `services/service-logistics/src/domain/logistics/entities/expedition.entity.ts` — Expedition entity to create from batch lines
  - `services/service-logistics/src/infrastructure/persistence/typeorm/repositories/` — Repository patterns in logistics
  - `packages/proto/src/logistics/logistics.proto:76-88` — CreateExpeditionRequest structure
  - `packages/proto/src/calendar/calendar.proto:120-130` — CutoffConfiguration pattern

  **Acceptance Criteria**:

  - [ ] Batch created in OPEN status
  - [ ] Lock generates batch lines with address snapshots
  - [ ] Lock generates batch lines with preference snapshots
  - [ ] Dispatch creates Expedition entities via logistics service
  - [ ] SUBSCRIPTION_CHARGED event → new line added to OPEN batch
  - [ ] Cut-off auto-lock works based on société configuration
  - [ ] Invalid transitions rejected (DISPATCHED → OPEN)
  - [ ] `bun test fulfillment` → PASS (minimum 10 tests)

  **Commit**: YES
  - Message: `feat(fulfillment): add batch lifecycle engine with cut-off and snapshots`
  - Pre-commit: `bun test`

---

- [x] 9. Fulfillment Cut-off Configuration (DB + Config Entity)

  **What to do**:
  - Create `services/service-logistics/src/domain/fulfillment/entities/fulfillment-cutoff-config.entity.ts`:
    - Fields: id, organisation_id, societe_id, cutoff_day_of_week (0=Monday..6=Sunday), cutoff_time (HH:mm), timezone, active
  - Create repository interface + TypeORM implementation
  - Create migration
  - TDD for entity

  **Must NOT do**:
  - Do NOT implement the cut-off checking logic (that's Task 8)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Single entity + repo + migration — straightforward
  - **Skills**: [`microservice-maintainer`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Task 1)
  - **Blocks**: Task 8
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `services/service-logistics/src/domain/logistics/entities/carrier-account.entity.ts` — Entity pattern in logistics service
  - `packages/proto/src/calendar/calendar.proto:120-130` — CutoffConfiguration concept

  **Acceptance Criteria**:

  - [ ] Entity supports cutoff_day_of_week (0-6), cutoff_time (HH:mm), timezone
  - [ ] Migration creates fulfillment_cutoff_configs table
  - [ ] Default values: Monday, 12:00, Europe/Paris
  - [ ] `bun test fulfillment-cutoff` → PASS

  **Commit**: YES (groups with Task 10)
  - Message: `feat(fulfillment): add cutoff configuration and batch entities`
  - Pre-commit: `bun test`

---

- [x] 10. Fulfillment Batch Entities + Repositories (service-logistics)

  **What to do**:
  - Create entities:
    - `domain/fulfillment/entities/fulfillment-batch.entity.ts` — (organisation_id, societe_id, status, cutoff_at, locked_at, dispatched_at, completed_at)
    - `domain/fulfillment/entities/fulfillment-batch-line.entity.ts` — (batch_id, subscription_id, client_id, product_id, quantity, address_snapshot JSON, preference_snapshot JSON, status: TO_PREPARE/PREPARED/SHIPPED, expedition_id)
    - `domain/fulfillment/entities/index.ts`
  - Create repository interfaces + TypeORM implementations
  - Create migration
  - Register in logistics.module.ts or new fulfillment.module.ts
  - TDD for entities

  **Must NOT do**:
  - Do NOT implement batch lifecycle logic (that's Task 8)
  - Do NOT modify existing logistics entities

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Standard entity + repository creation
  - **Skills**: [`microservice-maintainer`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 2, 3, 5, 7)
  - **Blocks**: Task 8
  - **Blocked By**: Task 1

  **References**:

  **Pattern References**:
  - `services/service-logistics/src/domain/logistics/entities/expedition.entity.ts` — Entity pattern in logistics
  - `services/service-logistics/src/domain/logistics/repositories/IExpeditionRepository.ts` — Repo interface pattern

  **Acceptance Criteria**:

  - [ ] FulfillmentBatch entity has status enum: OPEN, LOCKED, DISPATCHED, COMPLETED
  - [ ] FulfillmentBatchLine stores address_snapshot and preference_snapshot as JSON columns
  - [ ] FulfillmentBatchLine has line status: TO_PREPARE, PREPARED, SHIPPED
  - [ ] Migration creates: fulfillment_batches, fulfillment_batch_lines
  - [ ] `bun test fulfillment` → PASS

  **Commit**: YES (groups with Task 9)
  - Message: `feat(fulfillment): add cutoff configuration and batch entities`
  - Pre-commit: `bun test`

---

- [x] 11. Integration Testing + gRPC Controllers Wiring

  **What to do**:
  - Create gRPC controllers:
    - `services/service-commercial/src/infrastructure/grpc/subscriptions/subscription.controller.ts` — wires SubscriptionService RPCs to domain services
    - `services/service-logistics/src/infrastructure/grpc/fulfillment/fulfillment.controller.ts` — wires FulfillmentBatchService RPCs
  - Wire all modules in app.module.ts for both services
  - Integration tests:
    - Create subscription → verify state PENDING
    - Simulate payment success → verify state ACTIVE + next_charge_at calculated
    - Pause → verify state PAUSED
    - Resume → verify state ACTIVE + next_charge_at recalculated
    - Create preference schema → set preference → verify value stored
    - Simulate charge → verify batch line created
    - Lock batch → verify address snapshot frozen
    - WooCommerce webhook → verify client + subscription created
  - Verify all gRPC endpoints respond correctly

  **Must NOT do**:
  - Do NOT create end-to-end tests requiring live WooCommerce/Stripe connections
  - Do NOT test NPS/satisfaction flows

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Integration across multiple modules and services, requires careful wiring
  - **Skills**: [`microservice-maintainer`]
    - `microservice-maintainer`: Understands module wiring and gRPC controller patterns

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 3 (final — after Tasks 4, 6, 8)
  - **Blocks**: None (final task)
  - **Blocked By**: Tasks 4, 6, 8

  **References**:

  **Pattern References**:
  - `services/service-commercial/src/infrastructure/grpc/contrats/contrat.controller.ts` — gRPC controller pattern
  - `services/service-commercial/src/infrastructure/grpc/products/produit.controller.ts` — Product gRPC controller
  - `services/service-logistics/src/logistics.module.ts` — Module registration in logistics

  **Acceptance Criteria**:

  - [ ] All gRPC endpoints respond (grpcurl or test client)
  - [ ] Full lifecycle test passes: Create → Activate → Charge → Batch → Lock → Dispatch
  - [ ] WooCommerce webhook test passes: POST → client created → subscription created
  - [ ] Preference flow test passes: Create schema → Set preference → Snapshot in batch
  - [ ] `bun test --all` → PASS (all services)
  - [ ] No circular dependencies between modules

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: Full subscription lifecycle via gRPC
    Tool: Bash (grpcurl or bun test)
    Preconditions: service-commercial running, service-finance mocked
    Steps:
      1. CreateSubscription → assert status PENDING
      2. Simulate PaymentIntent success → assert status ACTIVE
      3. Assert next_charge_at is calculated (1 month from now for MONTHLY)
      4. PauseSubscription → assert status PAUSED
      5. ResumeSubscription → assert status ACTIVE, next_charge_at recalculated
      6. CancelSubscription → assert status CANCELED
    Expected Result: All state transitions work correctly
    Evidence: gRPC responses captured

  Scenario: WooCommerce webhook creates entities
    Tool: Bash (curl)
    Preconditions: service-commercial running with webhook endpoint
    Steps:
      1. POST /webhooks/woocommerce with customer.created payload + valid signature
      2. Assert: HTTP 200
      3. Query ClientBase by email → assert client exists
      4. POST /webhooks/woocommerce with subscription.created payload
      5. Query Subscription by woo mapping → assert subscription exists with correct frequency
    Expected Result: WooCommerce entities synced to CRM
    Evidence: Response bodies captured

  Scenario: Fulfillment batch lock creates snapshots
    Tool: Bash (bun test or grpcurl)
    Preconditions: Subscription charged, batch line exists in OPEN batch
    Steps:
      1. Set preference "origin" = "Brazil" for subscription
      2. Lock batch
      3. Assert batch line has address_snapshot with client's current address
      4. Assert batch line has preference_snapshot with "origin" = "Brazil"
      5. Change preference to "Ethiopia"
      6. Assert batch line STILL has "Brazil" (snapshot is immutable)
    Expected Result: Snapshots are frozen at lock time
    Evidence: Test output captured
  ```

  **Commit**: YES
  - Message: `feat(subscriptions): wire gRPC controllers and add integration tests`
  - Pre-commit: `bun test`

---

## Commit Strategy

| After Task | Message | Files | Verification |
|------------|---------|-------|--------------|
| 1 | `feat(proto): add subscription, fulfillment, and woocommerce proto definitions` | packages/proto/src/ | `npx buf generate` |
| 2 | `feat(subscriptions): add subscription entities, repositories, and migrations` | services/service-commercial/ | `bun test` |
| 3 | `feat(subscriptions): add state machine and scheduling domain services with TDD` | services/service-commercial/ | `bun test` |
| 4 | `feat(subscriptions): add charge engine with payment integration and idempotency` | services/service-commercial/ | `bun test` |
| 5 | `feat(subscriptions): add dynamic preference schema with cut-off rules` | services/service-commercial/ | `bun test` |
| 6+7 | `feat(woocommerce): add webhook receiver, NATS workers, and entity mapping` | services/service-commercial/ | `bun test` |
| 8+9+10 | `feat(fulfillment): add batch lifecycle engine with cut-off and snapshots` | services/service-logistics/ | `bun test` |
| 11 | `feat(subscriptions): wire gRPC controllers and add integration tests` | services/ | `bun test` |

---

## Success Criteria

### Verification Commands
```bash
# All protos compile
npx buf generate  # Expected: exit 0

# All tests pass
bun test  # Expected: PASS (all services)
```

### Final Checklist
- [x] Subscription lifecycle works end-to-end (PENDING → ACTIVE → PAUSED → ACTIVE → CANCELED)
- [x] Charge engine creates payments via service-finance with idempotency
- [x] WooCommerce webhooks sync customers and subscriptions
- [x] Fulfillment batches lock at cut-off with frozen snapshots
- [x] Preferences are dynamic (configurable schema per organisation)
- [x] Cut-off rules apply (change after cut-off → cycle N+1)
- [x] All entities have organisation_id (multi-tenant)
- [x] No new microservices created (extensions only)
- [x] No café-specific code (generic multi-tenant)
- [x] TDD: all domain services have >80% test coverage
- [x] No modifications to existing entities (contrats, expeditions, etc.)
