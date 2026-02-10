# Mondial TV — MVP Complet CRM OTT

## TL;DR

> **Quick Summary**: Rendre le CRM compatible avec le cahier des charges Mondial TV en ajoutant la gestion des abonnements OTT (Free/AVOD, Premium/SVOD, VIP), l'intégration bidirectionnelle IMS (Interface + Mock), le miroir store billing (Apple/Google), les achats TVOD/EST, le dunning spécifique (J0→J+10), les KPIs OTT, et le selfcare enrichi — en s'appuyant sur l'infrastructure existante (RetryPolicy, ReminderPolicy, BaremeCommission.canalVente, dashboard.proto MRR/churn).
> 
> **Deliverables**:
> - Bounded context `subscriptions` dans service-commercial (entities, state machine, charge engine)
> - Bounded context `mondial-tv` dans service-commercial (IMS sync, store mirror, TVOD/EST)
> - Extension dunning dans service-finance (seed data + Twilio SMS)
> - Extension dashboard.proto pour KPIs OTT
> - Selfcare portal enrichi dans le frontend Next.js
> - CRON jobs quotidiens/hebdomadaires
> - Coupons + GDPR purge
> 
> **Estimated Effort**: XL (6-8 semaines)
> **Parallel Execution**: YES - 5 waves
> **Critical Path**: Task 1 → Task 3 → Task 5 → Task 8 → Task 10 → Task 16

---

## Context

### Original Request
Analyse du cahier des charges "Gestion des clients Mondial TV" — une plateforme OTT streaming multi-canal (web, mobile, TV, box) nécessitant un CRM financier miroir du système IMS (gestion de droits). Implémentation MVP complet de toutes les fonctionnalités manquantes.

### Interview Summary
**Key Discussions**:
- **Scope**: MVP complet — toutes les fonctionnalités du cahier des charges
- **Architecture**: Extension service-commercial (pas de nouveau microservice)
- **IMS**: Interface + Mock (pas de doc IMS disponible), connexion réelle ultérieure
- **Stores**: Apple + Google (les deux)
- **SMS**: Twilio pour le dunning J+2
- **Tests**: TDD (Red-Green-Refactor)
- **Selfcare**: Route dans le frontend existant (/portal/[token]/selfcare)

### Research Findings
- **subscription-mvp.md** existe pour PUREA CAFE mais PAS encore implémenté (0 entité subscription dans service-commercial)
- **BaremeCommission.canalVente** (varchar 50) existe déjà → canal-based commissions = seed data
- **RetryPolicy + ReminderPolicy** existent avec triggerRules[].channel → dunning = configuration seed data + SMS provider
- **dashboard.proto** a déjà MRR, churn, ARR, taux_impayes → extension avec KPIs OTT spécifiques
- **JustiSubscriptionHandler** fournit le pattern exact pour l'intégration IMS (NATS event handler)
- **shared-kernel** a un idempotence service → réutiliser pour les webhooks IMS

### Metis Review
**Identified Gaps** (addressed):
- **Client fields dans service-core (cross-DB)**: Résolu → `ClientExternalMappingEntity` dans service-commercial au lieu de modifier service-core
- **Dunning = seed data, pas nouveau code**: Intégré → Task 10 crée les RetryPolicy/ReminderPolicy pour J0/J+2/J+5/J+10
- **Commission channel = seed data**: Intégré → Task 11 ajoute les valeurs canal OTT
- **Dashboard KPI overlap**: Intégré → Task 12 étend dashboard.proto, pas nouveau service
- **subscription-mvp non implémenté**: Mondial TV plan inclut les fondations subscription + spécifiques OTT
- **Pattern JustiSubscriptionHandler**: Intégré → IMS handler suit ce pattern exactement

---

## Work Objectives

### Core Objective
Transformer le CRM en source de vérité commerciale et financière pour Mondial TV, en synchronisation bidirectionnelle avec IMS (source de vérité produit/droits), avec gestion multi-canal (web CB direct, stores Apple/Google miroir), dunning automatisé, et reporting OTT.

### Concrete Deliverables
- Entités Subscription avec plans OTT (Free/AVOD, Premium/SVOD, VIP)
- ClientExternalMapping (ims_user_id, source_system, source_channel)
- IMS webhook endpoint + mock IMS outbound client
- Store billing mirror (Apple/Google)
- TVOD/EST purchase tracking
- Dunning workflow J0→J+10 (seed RetryPolicy + ReminderPolicy + Twilio SMS)
- Commission par canal OTT (seed BaremeCommission)
- Dashboard KPIs OTT (trial conversion, store vs direct, TVOD stats)
- Selfcare portal (/portal/[token]/selfcare)
- CRON jobs (06h00 daily, weekly exports)
- Coupons + GDPR purge

### Definition of Done
- [ ] Webhook IMS reçu → client + abonnement créés dans le CRM
- [ ] Abonnement web → charge CB via PSP → facture générée → dunning si échec
- [ ] Store billing → miroir dans CRM (statut paid/failed, pas de dunning)
- [ ] TVOD/EST → ligne financière créée
- [ ] Dunning J0 email → J+2 SMS Twilio → J+5 retry → J+10 suspension IMS
- [ ] KPIs OTT affichés (MRR par plan, churn, trial conversion, store vs direct)
- [ ] Selfcare: plan, factures, CB update, annulation
- [ ] Tous les tests TDD passent

### Must Have
- Idempotence des webhooks IMS (clé: event_id + source)
- HMAC validation des webhooks entrants
- Distinction stricte: CRM orchestre CB (web) vs CRM miroir (stores)
- Multi-tenant (organisation_id sur toutes les entités)
- Timezone Europe/Paris pour tous les événements IMS
- State machine subscription complète avec historique

### Must NOT Have (Guardrails)
- ❌ NE PAS modifier les entités ClientBase dans service-core (utiliser ClientExternalMapping dans service-commercial)
- ❌ NE PAS modifier les entités Contrat existantes
- ❌ NE PAS implémenter le vrai client IMS (mock uniquement — interface prête)
- ❌ NE PAS gérer le billing store directement (CRM reçoit, ne déclenche pas)
- ❌ NE PAS créer de nouveau microservice
- ❌ NE PAS dupliquer la logique de retry/reminder (réutiliser RetryPolicy/ReminderPolicy existants)
- ❌ NE PAS recréer MRR/churn dans le dashboard (étendre l'existant)
- ❌ NE PAS hard-coder les canaux de vente (données de seed configurables)
- ❌ NE PAS implémenter un système de DRM/gestion de droits (c'est le rôle d'IMS)

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

| Type | Tool | How Agent Verifies |
|------|------|-------------------|
| Proto compilation | Bash | `bun run proto:generate` → exit code 0 |
| TypeORM entities | Bash | `bun test` → PASS |
| gRPC controllers | Bash (grpcurl) | Send gRPC request, assert response |
| Webhook endpoints | Bash (curl) | POST webhook payload → assert 200 + entity created |
| Frontend pages | Playwright | Navigate, interact, assert DOM, screenshot |
| CRON jobs | Bash (bun test) | Unit tests for job execution logic |

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Start Immediately):
├── Task 1: Proto definitions (subscriptions + mondial-tv)
└── Task 2: ClientExternalMapping entity

Wave 2 (After Wave 1):
├── Task 3: Subscription entities + state machine
├── Task 4: TVOD/EST purchase entity
├── Task 5: IMS webhook receiver + mock client
└── Task 6: Store billing mirror entities

Wave 3 (After Wave 2):
├── Task 7: Subscription charge engine (CB web only)
├── Task 8: IMS event processing (NATS handlers)
├── Task 9: Store billing event processing
├── Task 10: Dunning workflow (seed data + Twilio SMS)
└── Task 11: Commission canaux OTT (seed data)

Wave 4 (After Wave 3):
├── Task 12: Dashboard KPIs OTT
├── Task 13: Selfcare portal frontend
├── Task 14: CRON jobs (daily/weekly)
└── Task 15: Coupons entity + service

Wave 5 (After Wave 4):
├── Task 16: GDPR purge service
└── Task 17: Integration testing + gRPC controllers wiring
```

### Dependency Matrix

| Task | Depends On | Blocks | Can Parallelize With |
|------|------------|--------|---------------------|
| 1 | None | 3, 4, 5, 6 | 2 |
| 2 | None | 5, 8 | 1 |
| 3 | 1 | 7, 8, 9, 12 | 4, 5, 6 |
| 4 | 1 | 12 | 3, 5, 6 |
| 5 | 1, 2 | 8 | 3, 4, 6 |
| 6 | 1 | 9 | 3, 4, 5 |
| 7 | 3 | 10, 14, 17 | 8, 9, 11 |
| 8 | 3, 5 | 14, 17 | 7, 9, 10, 11 |
| 9 | 3, 6 | 12, 17 | 7, 8, 10, 11 |
| 10 | 7 | 14, 17 | 8, 9, 11 |
| 11 | 3 | 12 | 7, 8, 9, 10 |
| 12 | 3, 4, 9, 11 | 17 | 13, 14, 15 |
| 13 | 3, 7 | 17 | 12, 14, 15 |
| 14 | 7, 8, 10 | 17 | 12, 13, 15 |
| 15 | 1 | 17 | 12, 13, 14 |
| 16 | None | 17 | 12, 13, 14, 15 |
| 17 | 7, 8, 9, 12, 13 | None | 16 |

---

## TODOs

- [x] 1. Proto Definitions — Subscriptions + Mondial TV

  **What to do**:
  - Créer `packages/proto/src/subscriptions/subscriptions.proto`:
    - Messages: `Subscription` (id, organisation_id, client_id, plan_type, status, frequency, trial_start, trial_end, current_period_start, current_period_end, next_charge_at, store_source, ims_subscription_id, coupon_id, cancel_at_period_end)
    - Enums: `PlanType` (FREE_AVOD, PREMIUM_SVOD, VIP), `SubscriptionStatus` (PENDING, TRIAL, ACTIVE, PAST_DUE, SUSPENDED, CANCELLED, EXPIRED), `SubscriptionFrequency` (MONTHLY, ANNUAL), `StoreSource` (NONE, WEB_DIRECT, APPLE_STORE, GOOGLE_STORE, TV_STORE, BOX)
    - Service: `SubscriptionService` (Create, Update, Get, List, Pause, Resume, Cancel, Suspend, Reactivate, GetDueForCharge)
  - Créer `packages/proto/src/subscriptions/subscription_events.proto`:
    - Events: SubscriptionCreated, SubscriptionTrialStarted, SubscriptionActivated, SubscriptionPaused, SubscriptionResumed, SubscriptionSuspended, SubscriptionReactivated, SubscriptionCancelled, SubscriptionExpired, SubscriptionCharged, SubscriptionChargeFailed, SubscriptionUpgraded, SubscriptionDowngraded
  - Créer `packages/proto/src/mondial-tv/ims-webhook.proto`:
    - Messages: `ImsWebhookEvent` (event_id, event_type, timestamp, payload, hmac_signature), `ImsWebhookResponse` (success, message)
    - Events IMS entrants: user.created, user.updated, subscription.created, subscription.updated, subscription.canceled, payment.succeeded, payment.failed, payment.refunded, tvod.purchased, est.purchased
    - Service: `ImsWebhookService` (ReceiveWebhook, GetEvent, ListEvents, RetryEvent)
  - Créer `packages/proto/src/mondial-tv/store-billing.proto`:
    - Messages: `StoreBillingRecord` (id, organisation_id, subscription_id, store_source, store_transaction_id, amount, currency, status, receipt_data, event_date)
    - Enums: `StoreBillingStatus` (PAID, FAILED, REFUNDED)
    - Service: `StoreBillingService` (Create, Get, List, GetBySubscription)
  - Créer `packages/proto/src/mondial-tv/tvod-est.proto`:
    - Messages: `TvodEstPurchase` (id, organisation_id, client_id, content_id, content_title, purchase_type, amount, currency, payment_method, store_source, ims_transaction_id, invoice_id)
    - Enums: `PurchaseType` (TVOD, EST)
    - Service: `TvodEstService` (Create, Get, List, GetByClient)
  - Créer `packages/proto/src/mondial-tv/coupon.proto`:
    - Messages: `Coupon` (id, organisation_id, code, discount_type, discount_value, applicable_plans, max_uses, current_uses, valid_from, valid_until, active)
    - Enums: `DiscountType` (PERCENTAGE, FIXED_AMOUNT, FREE_TRIAL_EXTENSION)
    - Service: `CouponService` (Create, Update, Get, List, Validate, Apply, Deactivate)
  - Run `bun run proto:generate` pour vérifier la compilation

  **Must NOT do**:
  - Ne PAS modifier les proto existants (contrats.proto, payments.proto, dashboard.proto — ceux-ci sont étendus dans d'autres tasks)
  - Ne PAS ajouter de champs spécifiques contenu/DRM (c'est IMS)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Multiple proto files avec des structures interconnectées, nécessite cohérence des enums/messages
  - **Skills**: [`microservice-maintainer`]
    - `microservice-maintainer`: Comprend les conventions proto existantes du projet

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Task 2)
  - **Blocks**: Tasks 3, 4, 5, 6, 15
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `packages/proto/src/contrats/contrats.proto` — Structure service + messages + enums + pagination commune
  - `packages/proto/src/payments/payment.proto:536-570` — PSPEventInbox pattern (webhook event storage)
  - `packages/proto/src/events/contract_events.proto` — Event message pattern pour NATS

  **Acceptance Criteria**:
  - [ ] `packages/proto/src/subscriptions/subscriptions.proto` existe et compile
  - [ ] `packages/proto/src/subscriptions/subscription_events.proto` existe et compile
  - [ ] `packages/proto/src/mondial-tv/ims-webhook.proto` existe et compile
  - [ ] `packages/proto/src/mondial-tv/store-billing.proto` existe et compile
  - [ ] `packages/proto/src/mondial-tv/tvod-est.proto` existe et compile
  - [ ] `packages/proto/src/mondial-tv/coupon.proto` existe et compile
  - [ ] `bun run proto:generate` → exit code 0, no errors
  - [ ] PlanType enum inclut: FREE_AVOD, PREMIUM_SVOD, VIP
  - [ ] SubscriptionStatus enum inclut: PENDING, TRIAL, ACTIVE, PAST_DUE, SUSPENDED, CANCELLED, EXPIRED
  - [ ] StoreSource enum inclut: NONE, WEB_DIRECT, APPLE_STORE, GOOGLE_STORE, TV_STORE, BOX
  - [ ] Tous les messages ont organisation_id

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: Proto files compile successfully
    Tool: Bash
    Preconditions: buf/protoc CLI configuré
    Steps:
      1. Run: bun run proto:generate
      2. Assert: exit code 0
      3. Assert: no error output in stderr
      4. Verify: generated TypeScript files exist for subscriptions, mondial-tv
    Expected Result: All proto files compile without errors
    Evidence: Terminal output captured
  ```

  **Commit**: YES
  - Message: `feat(proto): add subscription and mondial-tv proto definitions (IMS, store billing, TVOD/EST, coupons)`
  - Files: `packages/proto/src/subscriptions/`, `packages/proto/src/mondial-tv/`
  - Pre-commit: `bun run proto:generate`

---

- [x] 2. ClientExternalMapping Entity (service-commercial)

  **What to do**:
  - Créer `services/service-commercial/src/domain/mondial-tv/entities/client-external-mapping.entity.ts`:
    - Fields: id, organisation_id, client_id (UUID référence vers service-core), source_system (enum: IMS, WEB, MOBILE_APP, TV_APP, BOX), source_channel (varchar: web, ios, android, samsung_tv, lg_tv, box_orange, etc.), ims_user_id (varchar, nullable, unique per organisation), store_customer_id (varchar, nullable), metadata (jsonb), created_at, updated_at
  - Créer repository interface + TypeORM implementation suivant le pattern DDD existant
  - Créer migration pour la table `client_external_mappings`
  - TDD: tests pour création, recherche par ims_user_id, recherche par client_id, unicité ims_user_id

  **Must NOT do**:
  - Ne PAS modifier ClientBase dans service-core (cross-DB boundary)
  - Ne PAS stocker de données sensibles en clair

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Entité simple + repo + migration — pattern bien établi
  - **Skills**: [`microservice-maintainer`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Task 1)
  - **Blocks**: Tasks 5, 8
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `services/service-commercial/src/domain/contrats/entities/contrat.entity.ts` — Entity pattern TypeORM
  - `services/service-commercial/src/domain/contrats/repositories/IContratRepository.ts` — Repository interface pattern
  - `services/service-commercial/src/infrastructure/persistence/typeorm/repositories/contrats/contrat.service.ts` — TypeORM implementation

  **Acceptance Criteria**:
  - [ ] Migration crée table `client_external_mappings`
  - [ ] Contrainte unique sur (organisation_id, ims_user_id) WHERE ims_user_id IS NOT NULL
  - [ ] Recherche par ims_user_id retourne le mapping
  - [ ] Recherche par client_id retourne tous les mappings
  - [ ] `bun test client-external-mapping` → PASS

  **Commit**: YES
  - Message: `feat(mondial-tv): add ClientExternalMapping entity for IMS/store user linking`
  - Pre-commit: `bun test`

---

- [x] 3. Subscription Entities + State Machine (service-commercial)

  **What to do**:
  - Créer les entités TypeORM dans `services/service-commercial/src/domain/subscriptions/`:
    - `entities/subscription.entity.ts` — id, organisation_id, client_id, plan_type (enum FREE_AVOD/PREMIUM_SVOD/VIP), status (enum), frequency (MONTHLY/ANNUAL), trial_start, trial_end, current_period_start, current_period_end, next_charge_at, amount, currency, store_source (enum NONE/WEB_DIRECT/APPLE_STORE/GOOGLE_STORE/TV_STORE/BOX), ims_subscription_id (nullable), coupon_id (nullable), cancel_at_period_end (bool), cancelled_at, suspended_at, suspension_reason, add_ons (jsonb), created_at, updated_at
    - `entities/subscription-history.entity.ts` — id, subscription_id, old_status, new_status, reason, triggered_by (USER/SYSTEM/IMS/STORE/DUNNING), metadata (jsonb), created_at
    - `entities/subscription-plan.entity.ts` — id, organisation_id, code (FREE_AVOD/PREMIUM_SVOD/VIP), name, description, price_monthly, price_annual, currency, trial_days, features (jsonb), active, created_at, updated_at
    - `entities/index.ts`
  - Créer repository interfaces + TypeORM implementations
  - Créer state machine service `services/subscription-lifecycle.service.ts`:
    - Transitions valides:
      - PENDING → TRIAL (si plan a trial_days > 0)
      - PENDING → ACTIVE (si pas de trial ou plan Free)
      - TRIAL → ACTIVE (conversion trial → paid)
      - ACTIVE → PAST_DUE (échec de paiement)
      - ACTIVE → SUSPENDED (dunning J+10 ou action admin)
      - ACTIVE → CANCELLED (demande utilisateur ou IMS)
      - PAST_DUE → ACTIVE (paiement réussi)
      - PAST_DUE → SUSPENDED (dunning J+10)
      - SUSPENDED → ACTIVE (réactivation après paiement)
      - CANCELLED → EXPIRED (fin naturelle)
    - Chaque transition: valider → update status → créer history → émettre event NATS
  - Créer scheduling service `services/subscription-scheduling.service.ts`:
    - `calculateNextChargeAt(frequency, currentPeriodEnd)` → prochaine date de charge
    - `isTrialExpired(subscription)` → vérifier si trial est terminé
    - `getDueForCharge(organisationId, beforeDate)` → abonnements à charger
    - `getDueForTrialConversion(organisationId)` → trials expirés à convertir
  - Créer migration pour les tables
  - TDD pour CHAQUE transition (valide + invalide)

  **Must NOT do**:
  - Ne PAS traiter les paiements ici (c'est Task 7 — charge engine)
  - Ne PAS créer d'entité Contrat pour les abonnements (entités séparées)
  - Ne PAS modifier les entités Contrat existantes

  **Recommended Agent Profile**:
  - **Category**: `ultrabrain`
    - Reason: State machine complexe avec nombreux edge cases, trial logic, store vs direct distinction
  - **Skills**: [`microservice-maintainer`]
    - `microservice-maintainer`: Comprend le pattern DDD et les conventions du service

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 4, 5, 6)
  - **Blocks**: Tasks 7, 8, 9, 11, 12, 13
  - **Blocked By**: Task 1

  **References**:

  **Pattern References**:
  - `services/service-commercial/src/domain/contrats/entities/contrat.entity.ts` — Entity pattern (TypeORM decorators, columns, relations)
  - `services/service-commercial/src/domain/contrats/entities/historique-statut-contrat.entity.ts` — Status history pattern
  - `services/service-commercial/src/domain/commercial/services/commission-calculation.service.ts` — Domain service pattern
  - `services/service-commercial/src/domain/commercial/services/__tests__/commission-calculation.service.spec.ts` — Test pattern avec mocks
  - `packages/proto/src/contrats/contrats.proto:269-310` — ContractOrchestrationService pattern (Activate/Suspend/Terminate)

  **Acceptance Criteria**:
  - [ ] Test file: `domain/subscriptions/services/__tests__/subscription-lifecycle.service.spec.ts`
  - [ ] Tests couvrent: PENDING→TRIAL, PENDING→ACTIVE, TRIAL→ACTIVE, ACTIVE→PAST_DUE, ACTIVE→SUSPENDED, ACTIVE→CANCELLED, PAST_DUE→ACTIVE, SUSPENDED→ACTIVE
  - [ ] Tests couvrent transitions INVALIDES: CANCELLED→ACTIVE (rejeté), EXPIRED→TRIAL (rejeté)
  - [ ] Tests couvrent: `triggered_by` correctement tracé (USER/SYSTEM/IMS/STORE/DUNNING)
  - [ ] `bun test subscription-lifecycle` → PASS (minimum 15 tests)
  - [ ] Test file: `domain/subscriptions/services/__tests__/subscription-scheduling.service.spec.ts`
  - [ ] Tests couvrent: calculateNextChargeAt pour MONTHLY et ANNUAL
  - [ ] Tests couvrent: isTrialExpired pour trial actif et expiré
  - [ ] Tests couvrent: getDueForTrialConversion retourne les trials expirés
  - [ ] Migration crée tables: subscriptions, subscription_history, subscription_plans

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: Complete subscription lifecycle
    Tool: Bash (bun test)
    Steps:
      1. bun test services/service-commercial/src/domain/subscriptions/ --watch=false
      2. Assert: all tests pass (minimum 15)
      3. Assert: coverage includes all valid transitions + invalid rejection
    Expected Result: State machine handles all Mondial TV subscription states
    Evidence: Test output captured

  Scenario: Trial to paid conversion
    Tool: Bash (bun test)
    Steps:
      1. Create subscription with plan VIP (trial_days=7)
      2. Assert status TRIAL, trial_end = now + 7 days
      3. Call isTrialExpired() before trial_end → false
      4. Call isTrialExpired() after trial_end → true
      5. Transition TRIAL → ACTIVE
      6. Assert next_charge_at calculated, history entry created with triggered_by=SYSTEM
    Expected Result: Trial converts correctly
    Evidence: Test output captured
  ```

  **Commit**: YES
  - Message: `feat(subscriptions): add OTT subscription entities with state machine and trial support`
  - Pre-commit: `bun test`

---

- [x] 4. TVOD/EST Purchase Entity (service-commercial)

  **What to do**:
  - Créer `services/service-commercial/src/domain/mondial-tv/entities/tvod-est-purchase.entity.ts`:
    - Fields: id, organisation_id, client_id, content_id (varchar — ID IMS du contenu), content_title, purchase_type (enum TVOD/EST), amount, currency, payment_method (enum CB_DIRECT/APPLE_STORE/GOOGLE_STORE), store_source (enum), store_transaction_id (nullable), ims_transaction_id, invoice_id (nullable — lien vers service-finance), status (enum PENDING/COMPLETED/REFUNDED), refunded_at, refund_amount, created_at, updated_at
  - Créer repository interface + TypeORM implementation
  - Créer migration
  - TDD: tests pour création, recherche par client, calcul agrégats (volume, revenue, panier moyen)

  **Must NOT do**:
  - Ne PAS stocker le contenu lui-même (c'est IMS)
  - Ne PAS créer de facture ici (la facture est créée par le charge engine ou l'IMS webhook handler)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Entité + repo + migration — straightforward
  - **Skills**: [`microservice-maintainer`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 3, 5, 6)
  - **Blocks**: Task 12
  - **Blocked By**: Task 1

  **References**:

  **Pattern References**:
  - `services/service-commercial/src/domain/contrats/entities/contrat.entity.ts` — Entity pattern
  - `services/service-commercial/src/domain/commercial/entities/commission.entity.ts` — Entity avec enum status

  **Acceptance Criteria**:
  - [ ] Migration crée table `tvod_est_purchases`
  - [ ] PurchaseType enum: TVOD, EST
  - [ ] PaymentMethod enum: CB_DIRECT, APPLE_STORE, GOOGLE_STORE
  - [ ] `bun test tvod-est` → PASS

  **Commit**: YES
  - Message: `feat(mondial-tv): add TVOD/EST purchase tracking entity`
  - Pre-commit: `bun test`

---

- [x] 5. IMS Webhook Receiver + Mock IMS Client (service-commercial)

  **What to do**:
  - Créer le webhook receiver HTTP dans service-commercial:
    - `infrastructure/http/mondial-tv/ims-webhook.controller.ts` — NestJS HTTP controller
    - Endpoint: `POST /webhooks/ims`
    - HMAC-SHA256 signature validation (header `X-IMS-Signature`)
    - Idempotency: vérifier event_id n'a pas déjà été traité (utiliser `shared-kernel/idempotence.service.ts`)
    - Timezone: parser tous les timestamps en Europe/Paris
    - Stocker l'événement brut dans `ImsWebhookEventEntity`, publier sur NATS pour traitement async
  - Créer `domain/mondial-tv/entities/ims-webhook-event.entity.ts`:
    - Fields: id, organisation_id, event_id (unique), event_type, payload (jsonb), hmac_valid (bool), processing_status (RECEIVED/PROCESSING/DONE/FAILED), error_message, retry_count, processed_at, created_at
  - Créer l'interface IMS client (outbound):
    - `domain/mondial-tv/ports/IImsClient.ts` — interface abstraite
    - Méthodes: `notifySuspension(imsSubscriptionId, reason)`, `notifyReactivation(imsSubscriptionId)`, `notifyCancellation(imsSubscriptionId, reason)`, `createUser(userData)`, `updateSubscription(imsSubscriptionId, changes)`
  - Créer le mock IMS client:
    - `infrastructure/external/mondial-tv/mock-ims-client.ts` — implémente IImsClient, log les appels, retourne des réponses simulées
  - Créer migration
  - TDD: webhook validation (HMAC valide/invalide), idempotency (double envoi), event storage

  **Must NOT do**:
  - Ne PAS implémenter un vrai client IMS (mock seulement)
  - Ne PAS traiter les événements de manière synchrone (stocker + NATS async)
  - Ne PAS exposer le webhook sans validation HMAC

  **Recommended Agent Profile**:
  - **Category**: `ultrabrain`
    - Reason: Webhook security (HMAC), idempotency, interface pattern pour mock/real swap, NATS publishing
  - **Skills**: [`microservice-maintainer`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 3, 4, 6)
  - **Blocks**: Task 8
  - **Blocked By**: Tasks 1, 2

  **References**:

  **Pattern References**:
  - `services/service-finance/src/domain/payments/entities/psp-event-inbox.entity.ts` — PSPEventInbox pattern (webhook event storage + processing) — EXACTEMENT le même pattern
  - `packages/shared-kernel/src/events/idempotence.service.ts` — Idempotence service à réutiliser
  - `services/service-engagement/src/infrastructure/messaging/nats/handlers/justi-subscription-handler.ts` — Event handler pattern (interface JustiSubscriptionEvent + handler methods)

  **Acceptance Criteria**:
  - [ ] `POST /webhooks/ims` avec HMAC valide → 200 + event stocké
  - [ ] `POST /webhooks/ims` avec HMAC invalide → 401
  - [ ] Double envoi même event_id → 200 (idempotent) + pas de doublon en DB
  - [ ] Event stocké avec processing_status=RECEIVED
  - [ ] NATS message publié après stockage
  - [ ] Mock IMS client implémente IImsClient et log les appels
  - [ ] `bun test ims-webhook` → PASS (minimum 8 tests)

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: Valid IMS webhook accepted
    Tool: Bash (curl)
    Preconditions: service-commercial running
    Steps:
      1. Generate HMAC-SHA256 signature for test payload with configured secret
      2. curl -X POST http://localhost:SERVICE_PORT/webhooks/ims \
           -H "Content-Type: application/json" \
           -H "X-IMS-Signature: sha256=COMPUTED_HMAC" \
           -d '{"event_id":"evt_001","event_type":"user.created","timestamp":"2026-01-15T10:00:00+01:00","payload":{"ims_user_id":"ims_123","email":"test@mondial.tv"}}'
      3. Assert: HTTP 200
      4. Query DB: SELECT * FROM ims_webhook_events WHERE event_id='evt_001'
      5. Assert: row exists with processing_status='RECEIVED'
    Expected Result: Webhook stored and queued for processing
    Evidence: Response body + DB query result

  Scenario: Invalid HMAC rejected
    Tool: Bash (curl)
    Steps:
      1. curl -X POST http://localhost:SERVICE_PORT/webhooks/ims \
           -H "X-IMS-Signature: sha256=invalid_signature" \
           -d '{"event_id":"evt_002","event_type":"user.created"}'
      2. Assert: HTTP 401
      3. Assert: no row in ims_webhook_events for evt_002
    Expected Result: Invalid signature rejected
    Evidence: Response captured

  Scenario: Idempotent duplicate handling
    Tool: Bash (curl)
    Steps:
      1. Send same valid webhook twice with event_id='evt_003'
      2. Assert: both return HTTP 200
      3. Assert: only ONE row in DB for event_id='evt_003'
    Expected Result: Duplicate safely ignored
    Evidence: DB query result
  ```

  **Commit**: YES
  - Message: `feat(mondial-tv): add IMS webhook receiver with HMAC validation, idempotency, and mock IMS client`
  - Pre-commit: `bun test`

---

- [x] 6. Store Billing Mirror Entities (service-commercial)

  **What to do**:
  - Créer `domain/mondial-tv/entities/store-billing-record.entity.ts`:
    - Fields: id, organisation_id, subscription_id, client_id, store_source (APPLE_STORE/GOOGLE_STORE/TV_STORE), store_transaction_id (unique per store), store_product_id, amount, currency, status (PAID/FAILED/REFUNDED/PENDING), receipt_data (jsonb — données du store), event_type (INITIAL_PURCHASE/RENEWAL/CANCELLATION/REFUND), original_transaction_id (pour les renewals), event_date, created_at, updated_at
  - Créer `domain/mondial-tv/entities/store-config.entity.ts`:
    - Fields: id, organisation_id, store_type (APPLE/GOOGLE), bundle_id, shared_secret_hash, webhook_url, active, created_at, updated_at
  - Créer repository interfaces + TypeORM implementations
  - Créer migration
  - TDD pour entity creation, recherche par subscription, agrégation revenue par store

  **Must NOT do**:
  - Ne PAS valider les receipts auprès d'Apple/Google (CRM reçoit des events IMS, pas des receipts directs)
  - Ne PAS déclencher de dunning pour les stores (store gère son propre billing)
  - Ne PAS stocker shared_secret en clair (hash)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Entities + repos + migration — standard DDD pattern
  - **Skills**: [`microservice-maintainer`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 3, 4, 5)
  - **Blocks**: Task 9
  - **Blocked By**: Task 1

  **References**:

  **Pattern References**:
  - `services/service-finance/src/domain/payments/entities/psp-event-inbox.entity.ts` — Webhook event storage pattern
  - `services/service-finance/src/domain/payments/entities/stripe-account.entity.ts` — PSP account config pattern

  **Acceptance Criteria**:
  - [ ] Migration crée tables: store_billing_records, store_configs
  - [ ] StoreSource enum: APPLE_STORE, GOOGLE_STORE, TV_STORE
  - [ ] StoreBillingStatus: PAID, FAILED, REFUNDED, PENDING
  - [ ] EventType: INITIAL_PURCHASE, RENEWAL, CANCELLATION, REFUND
  - [ ] `bun test store-billing` → PASS

  **Commit**: YES
  - Message: `feat(mondial-tv): add store billing mirror entities (Apple/Google)`
  - Pre-commit: `bun test`

---

- [x] 7. Subscription Charge Engine — CB Web Only (service-commercial)

  **What to do**:
  - Créer `domain/subscriptions/services/subscription-charge.service.ts`:
    - `processCharges(organisationId)` — point d'entrée (appelé par CRON job)
    - Filtre: SEULEMENT les abonnements avec store_source=WEB_DIRECT ou NONE (CB directe)
    - Pour chaque abonnement dû: créer clé d'idempotence (subscription_id + next_charge_at)
    - Appeler service-finance `PaymentService.CreatePaymentIntent` via gRPC
    - Succès: avancer next_charge_at, créer Facture via service-finance, émettre SUBSCRIPTION_CHARGED
    - Échec: incrémenter retry_count, si max retries → transition PAST_DUE, émettre SUBSCRIPTION_CHARGE_FAILED, déclencher dunning workflow
  - Créer `domain/subscriptions/services/subscription-trial.service.ts`:
    - `processTrialConversions(organisationId)` — convertit les trials expirés
    - Si plan Free → transition TRIAL → ACTIVE (pas de charge)
    - Si plan payant → charge CB, si succès → ACTIVE, si échec → PAST_DUE
  - Créer gRPC client pour PaymentService dans service-commercial
  - TDD: test charge flow avec PaymentService mocké

  **Must NOT do**:
  - Ne PAS charger les abonnements store (Apple/Google) — ils sont en mode miroir
  - Ne PAS appeler Stripe/GoCardless directement — toujours via service-finance
  - Ne PAS skip la vérification d'idempotence
  - Ne PAS gérer les paiements Free/AVOD (pas de charge)

  **Recommended Agent Profile**:
  - **Category**: `ultrabrain`
    - Reason: Logique d'intégration complexe avec idempotence, retry, cross-service calls, distinction store vs direct
  - **Skills**: [`microservice-maintainer`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Tasks 8, 9, 10, 11)
  - **Blocks**: Tasks 10, 13, 14, 17
  - **Blocked By**: Task 3

  **References**:

  **Pattern References**:
  - `services/service-commercial/src/domain/commercial/services/commission-calculation.service.ts` — Complex domain service pattern
  - `packages/shared-kernel/src/events/idempotence.service.ts` — Idempotence service

  **API/Type References**:
  - `packages/proto/src/payments/payment.proto` — CreatePaymentIntentRequest (psp_name, amount, currency, idempotency_key)
  - `packages/proto/src/factures/factures.proto` — CreateFactureRequest

  **Acceptance Criteria**:
  - [ ] Tests: charge réussie → next_charge_at avancé d'1 mois (MONTHLY) ou 1 an (ANNUAL)
  - [ ] Tests: charge échouée → retry_count incrémenté
  - [ ] Tests: max retries dépassé → status PAST_DUE
  - [ ] Tests: clé d'idempotence empêche double charge
  - [ ] Tests: abonnements store_source=APPLE_STORE/GOOGLE_STORE EXCLUS du processCharges
  - [ ] Tests: abonnements FREE_AVOD EXCLUS du processCharges
  - [ ] Tests: trial conversion payant → charge + transition ACTIVE
  - [ ] Tests: trial conversion gratuit → transition ACTIVE sans charge
  - [ ] `bun test subscription-charge` → PASS (minimum 10 tests)

  **Commit**: YES
  - Message: `feat(subscriptions): add charge engine for CB web-direct with trial conversion`
  - Pre-commit: `bun test`

---

- [ ] 8. IMS Event Processing — NATS Handlers (service-commercial)

  **What to do**:
  - Créer `infrastructure/messaging/nats/handlers/mondial-tv/ims-event-handler.ts`:
    - Suivre EXACTEMENT le pattern de `JustiSubscriptionHandler`
    - Handlers par event_type IMS:
      - `user.created` → Créer ClientBase via service-core gRPC + créer ClientExternalMapping
      - `user.updated` → Mettre à jour ClientBase via service-core gRPC
      - `subscription.created` → Créer Subscription (avec plan_type, store_source, ims_subscription_id)
      - `subscription.updated` → Mettre à jour Subscription (upgrade/downgrade, add-ons)
      - `subscription.canceled` → Transition status vers CANCELLED via state machine
      - `payment.succeeded` → Si store → créer StoreBillingRecord (PAID) ; Si direct → marquer PaymentIntent succeeded
      - `payment.failed` → Si store → créer StoreBillingRecord (FAILED) ; Si direct → déclencher retry
      - `payment.refunded` → Créer StoreBillingRecord (REFUNDED) ou annuler PaymentIntent
      - `tvod.purchased` → Créer TvodEstPurchase (TVOD)
      - `est.purchased` → Créer TvodEstPurchase (EST)
  - Mettre à jour ImsWebhookEvent processing_status: RECEIVED → PROCESSING → DONE/FAILED
  - Émettre des events NATS internes (subscription.created, etc.) pour que d'autres services puissent réagir
  - TDD pour chaque handler

  **Must NOT do**:
  - Ne PAS traiter les events de manière synchrone dans le webhook controller (c'est fait ici via NATS)
  - Ne PAS modifier JustiSubscriptionHandler
  - Ne PAS appeler IMS en retour depuis ces handlers (les appels outbound sont gérés par le charge engine et le dunning)

  **Recommended Agent Profile**:
  - **Category**: `ultrabrain`
    - Reason: 10 handlers distincts, chacun avec sa logique métier, cross-service gRPC calls, distinction store vs direct
  - **Skills**: [`microservice-maintainer`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Tasks 7, 9, 10, 11)
  - **Blocks**: Tasks 14, 17
  - **Blocked By**: Tasks 3, 5

  **References**:

  **Pattern References**:
  - `services/service-engagement/src/infrastructure/messaging/nats/handlers/justi-subscription-handler.ts` — **PATTERN EXACT** à suivre : interface event + handler class + onModuleInit + méthodes par event_type
  - `services/service-finance/src/domain/payments/entities/psp-event-inbox.entity.ts` — Event processing status pattern

  **API/Type References**:
  - `packages/proto/src/clients/clients.proto` — CreateClientRequest, UpdateClientRequest pour appels vers service-core
  - Proto subscriptions créé en Task 1 — Subscription messages

  **Acceptance Criteria**:
  - [ ] Handler `user.created` → ClientBase créé + ClientExternalMapping créé avec ims_user_id
  - [ ] Handler `subscription.created` → Subscription créée avec bon plan_type et store_source
  - [ ] Handler `subscription.canceled` → Status transitionné vers CANCELLED
  - [ ] Handler `payment.succeeded` store → StoreBillingRecord créé (PAID)
  - [ ] Handler `payment.succeeded` direct → PaymentIntent mis à jour
  - [ ] Handler `tvod.purchased` → TvodEstPurchase créé
  - [ ] ImsWebhookEvent.processing_status mis à jour après traitement
  - [ ] Event NATS interne émis après chaque traitement
  - [ ] `bun test ims-event-handler` → PASS (minimum 12 tests)

  **Commit**: YES
  - Message: `feat(mondial-tv): add IMS event processing handlers for all webhook event types`
  - Pre-commit: `bun test`

---

- [x] 9. Store Billing Event Processing (service-commercial)

  **What to do**:
  - Créer `domain/mondial-tv/services/store-billing.service.ts`:
    - `recordStorePayment(subscription, storeEvent)` → crée StoreBillingRecord
    - `getRevenueByStore(organisationId, period)` → agrégat revenue par store (Apple vs Google)
    - `getSubscriptionStoreHistory(subscriptionId)` → historique billing store
  - Intégrer avec les IMS event handlers (Task 8):
    - Quand IMS envoie `payment.succeeded` avec store_source != WEB_DIRECT → appeler `recordStorePayment`
    - Quand IMS envoie `payment.failed` avec store → créer record FAILED (pas de dunning)
    - Quand IMS envoie `payment.refunded` avec store → créer record REFUNDED + déclencher commission clawback
  - TDD pour recording, agrégation, et refund flow

  **Must NOT do**:
  - Ne PAS déclencher de dunning pour les paiements store (le store gère)
  - Ne PAS contacter les stores directement
  - Ne PAS créer de facture CRM pour les paiements store (le store facture)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-low`
    - Reason: Service domain simple avec agrégation — la logique complexe est dans Task 8
  - **Skills**: [`microservice-maintainer`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Tasks 7, 8, 10, 11)
  - **Blocks**: Tasks 12, 17
  - **Blocked By**: Tasks 3, 6

  **References**:

  **Pattern References**:
  - `services/service-commercial/src/domain/commercial/services/commission-calculation.service.ts` — Domain service pattern
  - Store billing entities créées en Task 6

  **Acceptance Criteria**:
  - [ ] `recordStorePayment` crée StoreBillingRecord avec bon status
  - [ ] `getRevenueByStore` retourne agrégats corrects (Apple vs Google)
  - [ ] Refund store → StoreBillingRecord REFUNDED créé
  - [ ] PAS de dunning déclenché pour store billing
  - [ ] `bun test store-billing-service` → PASS (minimum 6 tests)

  **Commit**: YES (groups with Task 8)
  - Message: `feat(mondial-tv): add store billing processing service`
  - Pre-commit: `bun test`

---

- [x] 10. Dunning Workflow — Seed Data + Twilio SMS (service-finance)

  **What to do**:
  - **Étape 1 — Twilio SMS integration**:
    - Créer `infrastructure/external/sms/twilio-sms.service.ts` dans service-finance (ou service-engagement):
      - `sendSms(to, body)` — envoie un SMS via Twilio API
      - Config: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER dans .env
    - Créer interface `ISmsService` pour abstraction
    - Créer mock SMS service pour tests/dev
  - **Étape 2 — Seed data RetryPolicy pour Mondial TV**:
    - Créer un seed/migration qui insère une RetryPolicy:
      - `name`: "Mondial TV - CB Dunning"
      - `retryDelaysDays`: [2, 5, 10] (J+2, J+5, J+10)
      - `maxAttempts`: 3
      - `maxTotalDays`: 10
      - `backoffStrategy`: 'FIXED'
  - **Étape 3 — Seed data ReminderPolicy pour Mondial TV**:
    - Créer une ReminderPolicy avec triggerRules:
      - Rule J0: `{trigger: 'PAYMENT_FAILED', channel: 'email', templateId: 'mondial-tv-soft-reminder', delayHours: 0, order: 1}`
      - Rule J+2: `{trigger: 'RETRY_SCHEDULED', channel: 'sms', templateId: 'mondial-tv-cb-update-sms', delayHours: 48, order: 2}`
      - Rule J+5: `{trigger: 'RETRY_FAILED', channel: 'email', templateId: 'mondial-tv-final-warning', delayHours: 120, order: 3}`
      - Rule J+10: `{trigger: 'MAX_RETRIES_EXCEEDED', channel: 'system', templateId: 'mondial-tv-suspension', delayHours: 240, order: 4}`
  - **Étape 4 — Suspension handler**:
    - Créer un handler NATS qui écoute `dunning.max_retries_exceeded`
    - Quand déclenché: appeler IMS mock client `notifySuspension(ims_subscription_id, reason)` + transition subscription → SUSPENDED
  - **Étape 5 — CB update link generation**:
    - Créer endpoint `POST /portal/cb-update-session` dans service-finance
    - Génère un token temporaire (24h) pour que le client mette à jour sa CB
    - Le lien est inclus dans le SMS J+2
  - TDD pour SMS service (mock), seed data validation, suspension handler

  **Must NOT do**:
  - Ne PAS recréer les entités RetryPolicy/ReminderPolicy (elles existent)
  - Ne PAS modifier la logique de retry existante (seed data seulement)
  - Ne PAS envoyer de SMS aux abonnés store (pas de dunning store)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Multiple étapes cross-service (finance + commercial), Twilio integration, seed data, suspension handler
  - **Skills**: [`microservice-maintainer`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Tasks 7, 8, 9, 11)
  - **Blocks**: Tasks 14, 17
  - **Blocked By**: Task 7

  **References**:

  **Pattern References**:
  - `services/service-finance/src/domain/payments/entities/retry-policy.entity.ts` — RetryPolicy existante (retryDelaysDays, maxAttempts, backoffStrategy)
  - `services/service-finance/src/domain/payments/entities/reminder-policy.entity.ts` — ReminderPolicy existante (triggerRules avec channel et templateId)
  - `services/service-finance/src/domain/payments/entities/reminder.entity.ts` — Reminder entity pour historique envois
  - `services/service-engagement/src/infrastructure/messaging/nats/handlers/justi-subscription-handler.ts` — NATS handler pattern

  **External References**:
  - Twilio Node SDK: `https://www.twilio.com/docs/sms/quickstart/node`

  **Acceptance Criteria**:
  - [ ] TwilioSmsService envoie un SMS (mock en test)
  - [ ] Seed RetryPolicy créée avec retryDelaysDays=[2,5,10]
  - [ ] Seed ReminderPolicy créée avec 4 triggerRules (J0 email, J+2 SMS, J+5 email, J+10 system)
  - [ ] Handler dunning.max_retries_exceeded → appelle mockImsClient.notifySuspension() + transition SUSPENDED
  - [ ] CB update session génère un token valide 24h
  - [ ] `bun test dunning` → PASS (minimum 8 tests)

  **Commit**: YES
  - Message: `feat(mondial-tv): add dunning workflow with Twilio SMS, seed policies, and IMS suspension`
  - Pre-commit: `bun test`

---

- [x] 11. Commission Canaux OTT — Seed Data (service-commercial)

  **What to do**:
  - Créer un seed/migration qui :
    - Définit les valeurs canal_vente OTT pour BaremeCommission:
      - `web_direct` — Ventes directes web CB
      - `apple_store` — Ventes via Apple App Store
      - `google_store` — Ventes via Google Play Store
      - `tv_store` — Ventes via TV stores (Samsung, LG, etc.)
      - `operator` — Ventes via opérateurs télécom
      - `affiliate` — Ventes via affiliés/partenaires
    - Crée des barèmes exemples par plan_type et canal:
      - Premium/SVOD + web_direct → commission X%
      - Premium/SVOD + apple_store → commission Y% (plus bas car Apple prend 30%)
      - VIP + web_direct → commission Z%
      - Free/AVOD → pas de commission (exclu)
  - Créer `domain/mondial-tv/services/commission-channel.service.ts`:
    - `getApplicableBareme(planType, canalVente, organisationId)` → retrouve le barème applicable
    - `calculateCommission(subscription, apporteurId)` → calcule la commission en fonction du plan et du canal
    - Intégrer avec le moteur de commission existant (CommissionCalculationService)
  - TDD: test que Free exclut les commissions, test canal matching, test calcul correct

  **Must NOT do**:
  - Ne PAS modifier l'entité BaremeCommission (canal_vente existe déjà)
  - Ne PAS hard-coder les taux (seed data configurable)
  - Ne PAS supprimer les barèmes existants

  **Recommended Agent Profile**:
  - **Category**: `unspecified-low`
    - Reason: Seed data + service de lookup — logique simple s'appuyant sur l'existant
  - **Skills**: [`microservice-maintainer`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Tasks 7, 8, 9, 10)
  - **Blocks**: Task 12
  - **Blocked By**: Task 3

  **References**:

  **Pattern References**:
  - `services/service-commercial/src/domain/commercial/entities/bareme-commission.entity.ts:81-82` — champ canalVente existant
  - `services/service-commercial/src/domain/commercial/services/commission-calculation.service.ts` — Moteur de calcul existant

  **Acceptance Criteria**:
  - [ ] Seed data crée barèmes avec canal_vente pour web_direct, apple_store, google_store, tv_store, operator, affiliate
  - [ ] Free/AVOD exclu des commissions (pas de barème)
  - [ ] `getApplicableBareme(PREMIUM_SVOD, 'web_direct', orgId)` retourne le bon barème
  - [ ] `getApplicableBareme(FREE_AVOD, 'web_direct', orgId)` retourne null
  - [ ] `bun test commission-channel` → PASS (minimum 6 tests)

  **Commit**: YES
  - Message: `feat(mondial-tv): add OTT channel commission seed data and channel-aware calculation`
  - Pre-commit: `bun test`

---

- [ ] 12. Dashboard KPIs OTT — Extension Proto + Service

  **What to do**:
  - Étendre `packages/proto/src/dashboard/dashboard.proto`:
    - Ajouter à `KpisResponse`: `taux_conversion_trial` (double), `variation_conversion_trial` (Variation), `nombre_abonnements_actifs` (int32), `variation_abonnements` (Variation)
    - Ajouter nouveau message `KpisOttResponse`:
      - `mrr_par_plan` (repeated MrrParPlan: plan_type, mrr, pourcentage)
      - `arr_total` (double)
      - `churn_par_plan` (repeated ChurnParPlan: plan_type, taux_churn, nombre_churns)
      - `store_vs_direct_split` (StoreDirectSplit: revenue_direct, revenue_apple, revenue_google, pourcentage_direct, pourcentage_store)
      - `tvod_est_stats` (TvodEstStats: volume_tvod, revenue_tvod, volume_est, revenue_est, panier_moyen)
      - `trial_conversion` (TrialConversion: total_trials, converted, taux_conversion, duree_moyenne_conversion_jours)
      - `upgrades_downgrades` (UpgradeDowngrade: total_upgrades, total_downgrades, revenue_impact)
      - `dso` (double — Days Sales Outstanding CB)
    - Nouveau service: `DashboardOttService` (GetKpisOtt)
  - Créer le service backend qui calcule ces KPIs:
    - `infrastructure/grpc/mondial-tv/dashboard-ott.controller.ts` dans service-commercial
    - Queries SQL agrégées sur les tables subscriptions, store_billing_records, tvod_est_purchases
  - TDD pour chaque calcul KPI

  **Must NOT do**:
  - Ne PAS dupliquer MRR/churn de KpisResponse (les étendre)
  - Ne PAS modifier les services dashboard existants (nouveau service OTT séparé)
  - Ne PAS hard-coder les périodes (filtres dynamiques via DashboardFilters)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Proto extension + SQL agrégé complexe + multiple KPIs
  - **Skills**: [`microservice-maintainer`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4 (with Tasks 13, 14, 15)
  - **Blocks**: Task 17
  - **Blocked By**: Tasks 3, 4, 9, 11

  **References**:

  **Pattern References**:
  - `packages/proto/src/dashboard/dashboard.proto:30-39` — KpisResponse existant avec mrr, taux_churn, contrats_actifs
  - `packages/proto/src/dashboard/dashboard.proto:84-99` — StatsSociete avec mrr, arr, taux_churn
  - `packages/proto/src/dashboard/dashboard.proto:156-158` — DashboardKpisService pattern

  **Acceptance Criteria**:
  - [ ] Proto compile avec les nouveaux messages OTT
  - [ ] MRR par plan calculé correctement (somme montants par plan_type)
  - [ ] Store vs Direct split reflète les revenus réels
  - [ ] Trial conversion rate = trials convertis / total trials
  - [ ] TVOD stats: volume, revenue, panier moyen calculés
  - [ ] `bun test dashboard-ott` → PASS (minimum 8 tests)

  **Commit**: YES
  - Message: `feat(mondial-tv): add OTT KPI dashboard (MRR by plan, trial conversion, store split, TVOD stats)`
  - Pre-commit: `bun test`

---

- [ ] 13. Selfcare Portal — Frontend (Next.js)

  **What to do**:
  - Créer les pages selfcare dans le frontend existant:
    - `frontend/src/app/portal/[token]/selfcare/page.tsx` — Page principale selfcare
    - `frontend/src/app/portal/[token]/selfcare/layout.tsx` — Layout minimal (pas de sidebar CRM)
    - Components:
      - `SubscriptionCard` — Affiche plan actif, status, prochaine échéance, prix
      - `InvoiceList` — Liste des factures avec téléchargement PDF
      - `PaymentMethodCard` — Moyen de paiement masqué (**** 1234) + bouton "Modifier"
      - `CancelSubscriptionDialog` — Dialog de demande d'annulation/pause (relayé vers IMS via mock)
  - Créer le backend (gRPC/API):
    - Endpoint `GET /portal/[token]/selfcare/data` — retourne plan, factures, CB masquée, prochaine échéance
    - Validation du token portal (réutiliser PortalPaymentSession de service-finance)
    - Endpoint `POST /portal/[token]/selfcare/cancel` — crée une demande d'annulation → appelle mockImsClient.notifyCancellation
    - Endpoint `POST /portal/[token]/selfcare/pause` — crée une demande de pause → appelle mockImsClient
    - Endpoint `POST /portal/[token]/selfcare/update-cb` — redirige vers le PSP pour mise à jour CB
  - TDD backend + Playwright tests frontend

  **Must NOT do**:
  - Ne PAS afficher les données admin (commissions, KPIs)
  - Ne PAS permettre au client de modifier son plan directement (relayer à IMS)
  - Ne PAS afficher le numéro CB complet
  - Ne PAS réutiliser le layout principal du CRM (layout minimal dédié)

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: Frontend UI avec composants Shadcn, layout responsive, UX client
  - **Skills**: [`frontend-ui-ux`, `playwright`]
    - `frontend-ui-ux`: Design et composants UI
    - `playwright`: Tests E2E du portail

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4 (with Tasks 12, 14, 15)
  - **Blocks**: Task 17
  - **Blocked By**: Tasks 3, 7

  **References**:

  **Pattern References**:
  - `frontend/src/app/portal/[token]/page.tsx` — Portal payment page existante (pattern token-based access)
  - `frontend/src/components/ui/` — Composants Shadcn UI existants
  - `frontend/src/app/(main)/clients/[id]/page.tsx` — Page détail client (pattern data fetching)
  - `services/service-finance/src/domain/payments/entities/portal-session.entity.ts` — PortalSession pour token validation

  **Acceptance Criteria**:

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: Selfcare displays subscription info
    Tool: Playwright (playwright skill)
    Preconditions: Dev server running, test portal token valid, test subscription exists
    Steps:
      1. Navigate to: http://localhost:3000/portal/TEST_TOKEN/selfcare
      2. Wait for: [data-testid="subscription-card"] visible (timeout: 10s)
      3. Assert: plan name displayed (e.g. "Premium SVOD")
      4. Assert: status displayed (e.g. "Actif")
      5. Assert: next billing date displayed
      6. Assert: price displayed (e.g. "9.99€/mois")
      7. Screenshot: .sisyphus/evidence/task-13-selfcare-subscription.png
    Expected Result: Subscription details visible
    Evidence: .sisyphus/evidence/task-13-selfcare-subscription.png

  Scenario: Selfcare displays masked payment method
    Tool: Playwright (playwright skill)
    Steps:
      1. Navigate to selfcare page
      2. Wait for: [data-testid="payment-method-card"] visible
      3. Assert: text matches pattern "**** **** **** \d{4}"
      4. Assert: "Modifier" button exists
      5. Screenshot: .sisyphus/evidence/task-13-selfcare-payment.png
    Expected Result: Payment method shown masked
    Evidence: .sisyphus/evidence/task-13-selfcare-payment.png

  Scenario: Cancel subscription request
    Tool: Playwright (playwright skill)
    Steps:
      1. Navigate to selfcare page
      2. Click: [data-testid="cancel-subscription-button"]
      3. Wait for: dialog visible
      4. Assert: dialog contains warning text
      5. Click: confirm button
      6. Wait for: success message (timeout: 5s)
      7. Assert: success message contains "demande enregistrée"
      8. Screenshot: .sisyphus/evidence/task-13-selfcare-cancel.png
    Expected Result: Cancellation request submitted
    Evidence: .sisyphus/evidence/task-13-selfcare-cancel.png
  ```

  **Commit**: YES
  - Message: `feat(mondial-tv): add selfcare portal (subscription, invoices, CB update, cancellation)`
  - Pre-commit: `bun test && bun run type-check`

---

- [ ] 14. CRON Jobs — Daily + Weekly Automation

  **What to do**:
  - Installer `@nestjs/schedule` dans service-commercial et service-finance (si pas déjà installé)
  - Créer CRON jobs dans service-commercial:
    - `cron/subscription-charge.cron.ts` — Tous les jours à 06:00 Europe/Paris:
      - Appeler `subscriptionChargeService.processCharges()`
      - Appeler `subscriptionTrialService.processTrialConversions()`
    - `cron/ims-webhook-retry.cron.ts` — Toutes les heures:
      - Réessayer les ImsWebhookEvent en status FAILED avec retry_count < 3
  - Créer CRON jobs dans service-finance:
    - `cron/dunning-step.cron.ts` — Tous les jours à 06:30:
      - Appeler le dunning engine pour les abonnements en PAST_DUE
      - Évaluer les triggerRules de la ReminderPolicy Mondial TV
  - Créer CRON job reporting (service-commercial):
    - `cron/weekly-export.cron.ts` — Tous les lundis à 08:00:
      - Générer export comptable (factures de la semaine)
      - Calculer KPIs par canal
      - Calculer store vs direct mix
      - Calculer churn et trial conversions de la semaine
  - TDD pour la logique de chaque job (mock les services appelés)

  **Must NOT do**:
  - Ne PAS exécuter les jobs en parallel (séquentiel pour éviter les conflits)
  - Ne PAS hard-coder les heures (configurable via env)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-low`
    - Reason: CRON wiring standard, logique déléguée aux services existants
  - **Skills**: [`microservice-maintainer`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4 (with Tasks 12, 13, 15)
  - **Blocks**: Task 17
  - **Blocked By**: Tasks 7, 8, 10

  **References**:

  **External References**:
  - NestJS Schedule: `https://docs.nestjs.com/techniques/task-scheduling`

  **Acceptance Criteria**:
  - [ ] CRON subscription-charge exécuté à 06:00 → appelle processCharges
  - [ ] CRON dunning exécuté à 06:30 → évalue les steps de relance
  - [ ] CRON weekly-export exécuté le lundi à 08:00
  - [ ] Retry des webhooks FAILED toutes les heures
  - [ ] `bun test cron` → PASS (minimum 4 tests)

  **Commit**: YES
  - Message: `feat(mondial-tv): add scheduled CRON jobs for daily charges, dunning, and weekly exports`
  - Pre-commit: `bun test`

---

- [ ] 15. Coupons Entity + Service (service-commercial)

  **What to do**:
  - Créer `domain/mondial-tv/entities/coupon.entity.ts`:
    - Fields: id, organisation_id, code (unique per org), discount_type (PERCENTAGE/FIXED_AMOUNT/FREE_TRIAL_EXTENSION), discount_value, applicable_plans (jsonb array: ['PREMIUM_SVOD', 'VIP']), max_uses, current_uses, valid_from, valid_until, active, created_at, updated_at
  - Créer `domain/mondial-tv/entities/coupon-usage.entity.ts`:
    - Fields: id, coupon_id, subscription_id, client_id, applied_at, discount_applied
  - Créer `domain/mondial-tv/services/coupon.service.ts`:
    - `validate(code, planType, organisationId)` → vérifie validité (dates, uses, plan applicable)
    - `apply(code, subscriptionId)` → applique le coupon, incrémente current_uses
    - `calculateDiscount(coupon, amount)` → calcule le montant réduit
  - Créer repository interfaces + TypeORM implementations
  - Créer migration
  - TDD pour validation, application, calcul discount, expiration

  **Must NOT do**:
  - Ne PAS permettre d'appliquer un coupon PERCENTAGE > 100%
  - Ne PAS permettre d'appliquer un coupon après max_uses atteint
  - Ne PAS permettre d'appliquer un coupon sur un plan non applicable

  **Recommended Agent Profile**:
  - **Category**: `unspecified-low`
    - Reason: Entités + service de validation — logique métier classique
  - **Skills**: [`microservice-maintainer`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4 (with Tasks 12, 13, 14)
  - **Blocks**: Task 17
  - **Blocked By**: Task 1

  **References**:

  **Pattern References**:
  - `services/service-commercial/src/domain/products/entities/produit.entity.ts` — Entity avec champs JSON
  - Proto coupon créé en Task 1

  **Acceptance Criteria**:
  - [ ] Coupon valide retourne success avec discount calculé
  - [ ] Coupon expiré retourne erreur
  - [ ] Coupon max_uses atteint retourne erreur
  - [ ] Coupon non applicable au plan retourne erreur
  - [ ] FREE_TRIAL_EXTENSION étend la période d'essai
  - [ ] `bun test coupon` → PASS (minimum 8 tests)

  **Commit**: YES
  - Message: `feat(mondial-tv): add coupon management with validation and discount calculation`
  - Pre-commit: `bun test`

---

- [ ] 16. GDPR Purge Service (service-core)

  **What to do**:
  - Créer `domain/identity/services/gdpr-purge.service.ts` dans service-core:
    - `requestPurge(clientId, requestedBy)` → crée une demande de purge avec délai légal (30 jours)
    - `executePurge(purgeRequestId)` → anonymise les données client:
      - Remplacer nom/prénom par "ANONYMIZED"
      - Remplacer email par hash@anonymized.local
      - Remplacer téléphone par "0000000000"
      - Supprimer adresses
      - Révoquer consentements GDPR
      - Émettre event NATS `client.purged` pour que les autres services nettoient leurs données
    - `getPurgeRequests(organisationId)` → liste les demandes en attente
  - Créer `domain/identity/entities/gdpr-purge-request.entity.ts`:
    - Fields: id, organisation_id, client_id, requested_by, requested_at, scheduled_at (now + 30 jours), executed_at, status (PENDING/SCHEDULED/EXECUTED/CANCELLED)
  - Créer NATS handlers dans les autres services pour `client.purged`:
    - service-commercial: anonymiser ClientExternalMapping, Subscription history
    - service-finance: conserver les factures (obligation légale) mais anonymiser les données client
    - service-engagement: supprimer notifications, activités
  - Créer migration
  - TDD pour le flow complet

  **Must NOT do**:
  - Ne PAS supprimer les factures (obligation légale de conservation)
  - Ne PAS supprimer les données de commission (obligation comptable)
  - Ne PAS exécuter la purge immédiatement (délai 30 jours pour rétractation)

  **Recommended Agent Profile**:
  - **Category**: `ultrabrain`
    - Reason: Cross-service orchestration, obligations légales GDPR, anonymisation correcte
  - **Skills**: [`microservice-maintainer`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4 (with Tasks 12, 13, 14, 15)
  - **Blocks**: Task 17
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `services/service-core/src/domain/clients/entities/client-base.entity.ts` — ClientBase entity à anonymiser
  - `services/service-engagement/src/infrastructure/messaging/nats/handlers/justi-subscription-handler.ts` — NATS handler pattern
  - GDPR Article 17 — Droit à l'effacement

  **Acceptance Criteria**:
  - [ ] Demande de purge crée un PurgeRequest avec scheduled_at = now + 30 jours
  - [ ] Exécution anonymise: nom→"ANONYMIZED", email→hash, tel→"0000000000"
  - [ ] Adresses supprimées
  - [ ] Event NATS `client.purged` émis
  - [ ] Factures NON supprimées (obligation légale)
  - [ ] Commissions NON supprimées (obligation comptable)
  - [ ] Demande annulable avant exécution
  - [ ] `bun test gdpr-purge` → PASS (minimum 8 tests)

  **Commit**: YES
  - Message: `feat(gdpr): add GDPR purge service with 30-day delay, anonymization, and cross-service cleanup`
  - Pre-commit: `bun test`

---

- [ ] 17. Integration Testing + gRPC Controllers Wiring

  **What to do**:
  - Créer gRPC controllers pour tous les nouveaux services:
    - `service-commercial/infrastructure/grpc/subscriptions/subscription.controller.ts`
    - `service-commercial/infrastructure/grpc/mondial-tv/ims-webhook.controller.ts` (wrapper gRPC du HTTP controller)
    - `service-commercial/infrastructure/grpc/mondial-tv/store-billing.controller.ts`
    - `service-commercial/infrastructure/grpc/mondial-tv/tvod-est.controller.ts`
    - `service-commercial/infrastructure/grpc/mondial-tv/coupon.controller.ts`
    - `service-commercial/infrastructure/grpc/mondial-tv/dashboard-ott.controller.ts`
  - Wirer tous les modules dans app.module.ts:
    - Créer `subscriptions.module.ts` dans service-commercial
    - Créer `mondial-tv.module.ts` dans service-commercial
  - Integration tests end-to-end:
    - **Flow 1 — Web Direct**: IMS user.created webhook → Client créé → IMS subscription.created (PREMIUM_SVOD, web_direct) → Subscription créée → Charge engine → Payment → Invoice → KPI MRR updated
    - **Flow 2 — Store Mirror**: IMS subscription.created (PREMIUM_SVOD, apple_store) → Subscription créée → IMS payment.succeeded (store) → StoreBillingRecord (PAID) → KPI store split updated
    - **Flow 3 — Dunning**: Charge failed → PAST_DUE → J0 email → J+2 SMS → J+5 retry → J+10 suspension IMS
    - **Flow 4 — TVOD**: IMS tvod.purchased → TvodEstPurchase créé → Invoice line → KPI TVOD stats
    - **Flow 5 — Trial Conversion**: Subscription TRIAL → expiry → charge → ACTIVE
    - **Flow 6 — Upgrade**: IMS subscription.updated (PREMIUM→VIP) → Subscription updated → Commission recalculated
  - Vérifier tous les gRPC endpoints répondent
  - Vérifier pas de dépendances circulaires

  **Must NOT do**:
  - Ne PAS créer de tests end-to-end nécessitant un vrai IMS
  - Ne PAS tester avec un vrai Twilio (mock SMS)

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: Integration cross-module, 6 flows end-to-end, debugging potentiel
  - **Skills**: [`microservice-maintainer`]

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 5 (final)
  - **Blocks**: None (final task)
  - **Blocked By**: Tasks 7, 8, 9, 12, 13, 14, 15, 16

  **References**:

  **Pattern References**:
  - `services/service-commercial/src/infrastructure/grpc/contrats/contrat.controller.ts` — gRPC controller pattern
  - `services/service-commercial/src/contrats.module.ts` — Module registration pattern
  - `services/service-commercial/src/app.module.ts` — Root module imports

  **Acceptance Criteria**:

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: Flow 1 — Web Direct subscription lifecycle
    Tool: Bash (curl + grpcurl)
    Preconditions: service-commercial + service-finance running
    Steps:
      1. POST /webhooks/ims with user.created event → Assert 200
      2. Verify client created via gRPC GetClient
      3. POST /webhooks/ims with subscription.created (PREMIUM_SVOD, web_direct) → Assert 200
      4. Verify subscription created with status PENDING or TRIAL
      5. Trigger charge engine manually
      6. Verify subscription status ACTIVE
      7. Verify invoice created in service-finance
    Expected Result: Full web direct lifecycle works
    Evidence: All responses captured

  Scenario: Flow 2 — Store billing mirror
    Tool: Bash (curl)
    Steps:
      1. POST /webhooks/ims with subscription.created (apple_store) → Assert 200
      2. POST /webhooks/ims with payment.succeeded (apple_store) → Assert 200
      3. Verify StoreBillingRecord created with status PAID
      4. Verify NO charge engine triggered for this subscription
    Expected Result: Store billing mirrored without CRM payment processing
    Evidence: DB queries captured

  Scenario: Flow 3 — Dunning J0 to J+10
    Tool: Bash (curl + bun test)
    Steps:
      1. Trigger charge failure for web_direct subscription
      2. Assert status → PAST_DUE
      3. Assert J0 email reminder created
      4. Advance time to J+2 → Assert SMS reminder (mock Twilio) sent
      5. Advance to J+5 → Assert retry attempt made
      6. Advance to J+10 → Assert subscription SUSPENDED + IMS notified
    Expected Result: Complete dunning workflow executes correctly
    Evidence: Test output + mock logs

  Scenario: Flow 4 — TVOD purchase
    Tool: Bash (curl)
    Steps:
      1. POST /webhooks/ims with tvod.purchased event
      2. Verify TvodEstPurchase created with type TVOD
      3. Verify financial line linked
    Expected Result: TVOD purchase tracked
    Evidence: DB query result
  ```

  - [ ] Tous les gRPC endpoints répondent
  - [ ] 6 flows integration passent
  - [ ] `bun test --all` → PASS (tous les services)
  - [ ] Pas de dépendances circulaires entre modules
  - [ ] App démarre sans erreur

  **Commit**: YES
  - Message: `feat(mondial-tv): wire gRPC controllers, modules, and add integration tests for all flows`
  - Pre-commit: `bun test`

---

## Commit Strategy

| After Task | Message | Files | Verification |
|------------|---------|-------|--------------|
| 1 | `feat(proto): add subscription and mondial-tv proto definitions` | packages/proto/src/ | `bun run proto:generate` |
| 2 | `feat(mondial-tv): add ClientExternalMapping entity` | services/service-commercial/ | `bun test` |
| 3 | `feat(subscriptions): add OTT subscription entities with state machine` | services/service-commercial/ | `bun test` |
| 4 | `feat(mondial-tv): add TVOD/EST purchase entity` | services/service-commercial/ | `bun test` |
| 5 | `feat(mondial-tv): add IMS webhook receiver + mock IMS client` | services/service-commercial/ | `bun test` |
| 6 | `feat(mondial-tv): add store billing mirror entities` | services/service-commercial/ | `bun test` |
| 7 | `feat(subscriptions): add charge engine for CB web-direct` | services/service-commercial/ | `bun test` |
| 8 | `feat(mondial-tv): add IMS event processing handlers` | services/service-commercial/ | `bun test` |
| 9 | `feat(mondial-tv): add store billing processing service` | services/service-commercial/ | `bun test` |
| 10 | `feat(mondial-tv): add dunning workflow + Twilio SMS` | services/service-finance/ | `bun test` |
| 11 | `feat(mondial-tv): add OTT channel commission seed data` | services/service-commercial/ | `bun test` |
| 12 | `feat(mondial-tv): add OTT KPI dashboard` | packages/proto/ + services/ | `bun test` |
| 13 | `feat(mondial-tv): add selfcare portal` | frontend/ + services/ | `bun test` |
| 14 | `feat(mondial-tv): add CRON jobs` | services/ | `bun test` |
| 15 | `feat(mondial-tv): add coupon management` | services/service-commercial/ | `bun test` |
| 16 | `feat(gdpr): add GDPR purge service` | services/service-core/ | `bun test` |
| 17 | `feat(mondial-tv): wire controllers + integration tests` | services/ | `bun test` |

---

## Success Criteria

### Verification Commands
```bash
# All protos compile
bun run proto:generate  # Expected: exit 0

# All tests pass per service
cd services/service-commercial && bun test  # Expected: PASS
cd services/service-finance && bun test     # Expected: PASS
cd services/service-core && bun test        # Expected: PASS
cd services/service-engagement && bun test  # Expected: PASS

# Frontend builds
cd frontend && bun run build  # Expected: exit 0
```

### Final Checklist
- [ ] IMS webhook reçu → client + abonnement synchronisés (user.created + subscription.created)
- [ ] Abonnement web → CB chargée → facture créée → KPI MRR mis à jour
- [ ] Abonnement store → miroir billing (PAID/FAILED, pas de dunning)
- [ ] TVOD/EST → ligne financière tracée
- [ ] Dunning J0 email → J+2 SMS Twilio → J+5 retry → J+10 suspension IMS
- [ ] Trial → conversion automatique (charge ou free)
- [ ] Commission calculée par canal (web vs store vs operator vs affiliate)
- [ ] KPIs OTT: MRR par plan, churn, trial conversion, store vs direct split, TVOD stats
- [ ] Selfcare: plan affiché, factures téléchargeables, CB masquée + modifiable, annulation
- [ ] CRON 06h00 daily (charges + dunning), weekly export
- [ ] Coupons: validation, application, discount
- [ ] GDPR purge: anonymisation avec délai 30j, préservation factures/commissions
- [ ] Multi-tenant (organisation_id sur TOUTES les nouvelles entités)
- [ ] TDD: tous les services domain ont des tests unitaires
- [ ] Pas de modification des entités existantes (ClientBase, Contrat, etc.)
- [ ] Mock IMS client injectable (interface IImsClient)
