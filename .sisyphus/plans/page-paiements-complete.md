# Page Paiements Complète + Backend Stripe & GoCardless

## TL;DR

> **Quick Summary**: Compléter la page `/paiements` avec un onglet principal affichant les vrais paiements (table, KPIs, filtres, détail) + un onglet Échéancier, puis implémenter les API services backend Stripe et GoCardless en suivant le pattern Slimpay existant.
> 
> **Deliverables**:
> - Page `/paiements` avec 6 onglets (Paiements, Échéancier, Routage, Archives, Alertes, Exports)
> - Backend Stripe API service + webhook handler + gRPC controller
> - Backend GoCardless API service + webhook handler + gRPC controller
> - Proto: nouveaux RPCs `ListPayments` + `GetPaymentStats`
> - Server actions connectées aux nouvelles données
> 
> **Estimated Effort**: Large (3-5 jours)
> **Parallel Execution**: YES - 3 tracks après Phase 0
> **Critical Path**: Proto (Phase 0) → ListPayments backend (Track A) → Frontend wiring (Phase 2)

---

## Context

### Original Request
L'utilisateur veut restructurer sa vision CRM centrée sur clients/contrats/commerciaux + prélèvements. La priorité immédiate est d'avoir une page Paiements complète qui affiche les vrais prélèvements, statuts, historique.

### Interview Summary
**Key Discussions**:
- CRM générique d'abord, partenaires spécifiques plus tard
- Deux modes de paiement : prélèvement SEPA automatique + paiement ponctuel (carte/virement)
- PSPs prioritaires : Stripe, GoCardless, Slimpay (déjà implémenté)
- Toutes les pages existantes sont utiles, on garde tout
- Scope : page Paiements uniquement, pas de restructuration navigation

**Research Findings**:
- Les composants UI existent DÉJÀ mais ne sont PAS branchés : `payment-table.tsx`, `payment-kpi-cards.tsx`, `payment-filters.tsx`, `payment-details-dialog.tsx`
- 30+ server actions dans `actions/payments.ts` (GoCardless, Stripe, schedules, intents)
- Types bien définis dans `lib/ui/display-types/payment.ts`
- Slimpay = référence complète (API service + webhook + controller)
- SDKs déjà installés : `stripe@20.2.0`, `gocardless-nodejs@7.0.0`
- Entités Stripe/GoCardless déjà enregistrées dans `payments.module.ts`

### Metis Review
**Identified Gaps** (addressed):
- **BLOCKER**: Pas de RPC `ListPayments`/`GetPaymentStats` dans le proto → ajouté en Phase 0
- **BLOCKER**: 6 server actions sont des stubs (retournent `[]` ou `throw`) → remplacées en Track A
- "Stripe" manque dans le type `PSPProvider` → ajouté en Phase 2
- Pas de composant Échéancier → créé en Phase 2
- `GoCardlessAccountEntity` manque `hasWebhookSecret()` → ajouté en Track C

---

## Work Objectives

### Core Objective
Transformer la page `/paiements` d'une page admin (routing/archives/alertes/exports) en une page opérationnelle qui affiche les vrais paiements avec KPIs, filtres, détail + implémenter les backends Stripe et GoCardless.

### Concrete Deliverables
- Onglet "Paiements" avec `PaymentTable`, `PaymentKPICards`, `PaymentFiltersComponent`, `PaymentDetailsDialog`
- Onglet "Échéancier" avec table des schedules à venir
- `stripe-api.service.ts`, `stripe-webhook.handler.ts`, `stripe.controller.ts`
- `gocardless-api.service.ts`, `gocardless-webhook.handler.ts`, `gocardless.controller.ts`
- Proto: `ListPayments`, `GetPaymentStats` RPCs + messages
- Server actions fonctionnelles (plus de stubs)

### Definition of Done
- [x] Page `/paiements` affiche 6 onglets
- [x] Onglet Paiements affiche KPIs + filtres + table + dialog détail
- [x] Onglet Échéancier affiche les schedules
- [x] Backend Stripe compile et expose les RPCs proto
- [x] Backend GoCardless compile et expose les RPCs proto
- [x] `npx tsc --noEmit` passe sans erreur (frontend + service-finance)
- [x] `npm run build` passe (frontend)

### Must Have
- KPIs réels (total, payés, en attente, rejets, montant moyen)
- Filtres fonctionnels (recherche, société, statut, PSP, lot, méthode, risque, canal, dates)
- Table des paiements avec colonnes : Référence, Client, Société, Montant, Statut, PSP, Lot, Date, Risque
- Dialog détail paiement avec scoring widget
- Stripe API service avec gestion multi-tenant (par societeId)
- GoCardless API service avec gestion multi-tenant
- Webhook handlers avec vérification de signature
- Stockage des webhooks dans PSPEventInbox (pattern idempotence)

### Must NOT Have (Guardrails)
- NE PAS implémenter PayPal, Emerchantpay, MultiSafepay backends (hors scope)
- NE PAS créer de `BasePSPService` abstrait — services concrets comme Slimpay
- NE PAS ajouter WebSocket/temps réel pour les paiements
- NE PAS modifier les 4 onglets existants (routing, archives, alertes, exports)
- NE PAS créer de nouvelles migrations DB (tables existent déjà)
- NE PAS refactorer la structure du gRPC client frontend
- NE PAS ajouter Redis ou cache externe — in-memory comme Slimpay
- NE PAS toucher au routing engine (il est PSP-agnostic)
- NE PAS surcharger les webhook event types (max 6 pour Stripe, 4 pour GoCardless)

---

## Verification Strategy

> **UNIVERSAL RULE: ZERO HUMAN INTERVENTION**

### Test Decision
- **Infrastructure exists**: NON (pas de framework de test)
- **Automated tests**: NON
- **Framework**: N/A
- **Agent-Executed QA**: ALWAYS (mandatory pour tous les tasks)

### Agent-Executed QA Scenarios (Global)

**Verification Tool by Deliverable Type:**

| Type | Tool | How Agent Verifies |
|------|------|-------------------|
| Frontend page | Bash (tsc + build) | `npx tsc --noEmit`, `npm run build` |
| Backend service | Bash (tsc) | `npx tsc --noEmit` in service-finance |
| Proto generation | Bash | `bun run proto:generate` in packages/proto |
| File existence | Bash (test -f) | Verify all new files exist |
| Module wiring | Grep | Verify new services registered in module |
| gRPC coverage | Grep | Verify @GrpcMethod decorators count |

---

## Execution Strategy

### Parallel Execution Waves

```
Phase 0 (Start - PREREQUISITE, blocks Phase 2):
└── Task 1: Proto - Add ListPayments + GetPaymentStats RPCs

Wave 1 (After Phase 0 - PARALLEL):
├── Task 2 (Track A): Backend ListPayments + GetPaymentStats service + controller
├── Task 3 (Track B): Backend Stripe API service + webhook + controller  
└── Task 4 (Track C): Backend GoCardless API service + webhook + controller

Wave 2 (After Task 2):
├── Task 5: Frontend server actions + gRPC client wiring
└── Task 6: Frontend page assembly (tabs + components)

Wave 3 (After Wave 2):
└── Task 7: Integration verification + fixes

Critical Path: Task 1 → Task 2 → Task 5 → Task 6 → Task 7
Parallel Speedup: Tasks 3, 4 independent of frontend
```

### Dependency Matrix

| Task | Depends On | Blocks | Can Parallelize With |
|------|------------|--------|---------------------|
| 1 | None | 2, 5 | None (must be first) |
| 2 | 1 | 5, 6 | 3, 4 |
| 3 | None | 7 | 2, 4 |
| 4 | None | 7 | 2, 3 |
| 5 | 1, 2 | 6 | 3, 4 |
| 6 | 5 | 7 | 3, 4 |
| 7 | 2, 3, 4, 6 | None | None (final) |

### Agent Dispatch Summary

| Wave | Tasks | Recommended Agents |
|------|-------|-------------------|
| 0 | 1 | task(category="unspecified-low", load_skills=["microservice-maintainer"]) |
| 1 | 2, 3, 4 | 3x task(category="unspecified-high", load_skills=["microservice-maintainer"]) — parallel |
| 2 | 5, 6 | task(category="visual-engineering", load_skills=["frontend-ui-ux"]) — sequential |
| 3 | 7 | task(category="quick", load_skills=[]) |

---

## TODOs

- [x] 1. Proto — Ajouter RPCs ListPayments + GetPaymentStats

  **What to do**:
  - Ajouter dans `packages/proto/src/payments/payment.proto` les messages request/response pour `ListPayments` et `GetPaymentStats`
  - `ListPaymentsRequest` doit supporter : societe_id, search, status, psp_provider, payment_method, debit_lot, risk_tier, source_channel, date_from, date_to, min_amount, max_amount, page, limit
  - `ListPaymentsResponse` doit retourner un tableau avec les champs enrichis : id, payment_reference, client_id, client_name, contract_id, contract_reference, company, amount, currency, payment_method, status, payment_type, psp_provider, psp_transaction_id, planned_debit_date, actual_debit_date, debit_lot, risk_score, risk_tier, retry_count, rum, iban_masked, created_at, updated_at
  - `GetPaymentStatsRequest` : societe_id, date_from, date_to
  - `GetPaymentStatsResponse` : total_payments, total_amount, paid_count, paid_amount, pending_count, pending_amount, rejected_count, rejected_amount, reject_rate, average_amount
  - Ajouter les deux RPCs dans le `service PaymentService` du proto
  - Régénérer les types TypeScript : `bun run generate` dans `packages/proto`

  **Must NOT do**:
  - NE PAS modifier les RPCs existants
  - NE PAS changer les enums ou messages existants
  - NE PAS créer un proto séparé — tout dans `payment.proto`

  **Recommended Agent Profile**:
  - **Category**: `unspecified-low`
    - Reason: Ajout de messages/RPCs dans un proto existant, pattern bien établi
  - **Skills**: [`microservice-maintainer`]
    - `microservice-maintainer`: Connaissance du pattern proto du projet

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Phase 0 (sequential, must be first)
  - **Blocks**: Tasks 2, 5
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `packages/proto/src/payments/payment.proto` — Proto existant (1667 lignes). Voir le pattern des RPCs existants (lignes 9-46 pour les signatures, lignes ~500-600 pour les messages Request/Response)
  - `packages/proto/src/factures/factures.proto` — Référence pour le pattern `List*Request` avec pagination (page, limit, societe_id)
  
  **API/Type References**:
  - `frontend/src/lib/ui/display-types/payment.ts:32-95` — Interface `Payment` qui définit tous les champs nécessaires dans la réponse
  - `frontend/src/lib/ui/display-types/payment.ts:97-112` — Interface `PaymentFilters` qui définit les filtres pour la request
  - `frontend/src/lib/ui/display-types/payment.ts:114-125` — Interface `PaymentStats` qui définit les stats pour la réponse

  **Documentation References**:
  - `packages/proto/buf.yaml` — Configuration buf pour la génération

  **Acceptance Criteria**:

  ```
  Scenario: Proto compiles successfully
    Tool: Bash
    Steps:
      1. cd packages/proto && bun run generate
      2. Assert: exit code 0
      3. Assert: no errors in output
    Expected Result: Proto generation succeeds
    Evidence: Terminal output captured

  Scenario: New RPCs exist in proto
    Tool: Bash (grep)
    Steps:
      1. grep "ListPayments" packages/proto/src/payments/payment.proto
      2. grep "GetPaymentStats" packages/proto/src/payments/payment.proto
      3. Assert: both found
    Expected Result: RPCs defined in proto file
    Evidence: grep output

  Scenario: Generated TypeScript types exist
    Tool: Bash (grep)
    Steps:
      1. grep "ListPaymentsRequest" frontend/src/proto/payments/payment.ts
      2. grep "GetPaymentStatsResponse" frontend/src/proto/payments/payment.ts
      3. Assert: both found
    Expected Result: TypeScript types generated
    Evidence: grep output
  ```

  **Commit**: YES
  - Message: `feat(proto): add ListPayments and GetPaymentStats RPCs to payment service`
  - Files: `packages/proto/src/payments/payment.proto`, `frontend/src/proto/payments/payment.ts`
  - Pre-commit: `cd packages/proto && bun run generate`

---

- [x] 2. Backend — Implémenter ListPayments + GetPaymentStats

  **What to do**:
  - Créer un service `PaymentQueryService` (ou ajouter dans un service existant) qui :
    - `listPayments(request)` : requête TypeORM qui joint PaymentIntentEntity avec les données client/contrat pour enrichir la réponse. Supporte tous les filtres de `ListPaymentsRequest`. Pagination offset/limit.
    - `getPaymentStats(request)` : agrégation SQL (COUNT, SUM, AVG) groupée par statut. Calcule reject_rate = rejected/total * 100.
  - Créer ou étendre un controller gRPC avec `@GrpcMethod('PaymentService', 'ListPayments')` et `@GrpcMethod('PaymentService', 'GetPaymentStats')`
  - Le service doit résoudre client_name et contract_reference. Options :
    - **Option A (recommandé)** : stocker ces infos directement dans PaymentIntentEntity (dénormalisation)
    - **Option B** : appel gRPC cross-service vers service-core/service-commercial (plus propre mais plus lent)
    - **Option C** : les données existent déjà dans les colonnes de PaymentIntentEntity (vérifier la structure)
  - Enregistrer le nouveau service dans `payments.module.ts` (providers + exports)

  **Must NOT do**:
  - NE PAS modifier PaymentIntentEntity (sauf si Option A nécessite un champ client_name/contract_reference)
  - NE PAS créer de migration (sauf si absolument nécessaire pour Option A)
  - NE PAS retourner plus de 1000 résultats sans pagination

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Requête avec joins, agrégation SQL, pattern gRPC controller
  - **Skills**: [`microservice-maintainer`]
    - `microservice-maintainer`: Pattern DDD du projet, conventions NestJS

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 3, 4)
  - **Blocks**: Tasks 5, 6
  - **Blocked By**: Task 1

  **References**:

  **Pattern References**:
  - `services/service-finance/src/infrastructure/persistence/typeorm/repositories/payments/` — Repositories existants pour les entités payment
  - `services/service-finance/src/interfaces/grpc/controllers/payments/routing.controller.ts` — Pattern controller gRPC avec `@GrpcMethod`, voir lignes 26-120
  - `services/service-finance/src/domain/payments/entities/payment-intent.entity.ts` — Structure de l'entité PaymentIntent (vérifier les colonnes disponibles)

  **API/Type References**:
  - `packages/proto/src/payments/payment.proto` — Les nouveaux RPCs ListPayments/GetPaymentStats (ajoutés en Task 1)
  - `services/service-finance/src/domain/payments/entities/schedule.entity.ts` — Entity Schedule avec le lien contrat_id

  **Acceptance Criteria**:

  ```
  Scenario: Backend compiles
    Tool: Bash
    Preconditions: Task 1 completed (proto generated)
    Steps:
      1. cd services/service-finance && npx tsc --noEmit
      2. Assert: exit code 0 (no type errors)
    Expected Result: TypeScript compiles clean
    Evidence: Terminal output

  Scenario: Controllers have gRPC decorators
    Tool: Bash (grep)
    Steps:
      1. grep -c "@GrpcMethod" in the new/modified controller file
      2. Assert: at least 2 (ListPayments + GetPaymentStats)
    Expected Result: gRPC methods registered
    Evidence: grep count

  Scenario: Service registered in module
    Tool: Bash (grep)
    Steps:
      1. grep "PaymentQueryService" services/service-finance/src/payments.module.ts
      2. Assert: found in providers array
    Expected Result: Service wired in DI container
    Evidence: grep output
  ```

  **Commit**: YES
  - Message: `feat(finance): implement ListPayments and GetPaymentStats gRPC endpoints`
  - Files: new service file, controller file, `payments.module.ts`
  - Pre-commit: `cd services/service-finance && npx tsc --noEmit`

---

- [x] 3. Backend — Implémenter Stripe API Service + Webhook + Controller

  **What to do**:
  - Créer `services/service-finance/src/infrastructure/psp/stripe/stripe-api.service.ts` :
    - `@Injectable()`, injecte `Repository<StripeAccountEntity>`, `EncryptionService`, `ProviderStatusMappingService`
    - `getAccount(societeId)` : récupère le StripeAccount de la societe, déchiffre les clés
    - `createPaymentIntent(societeId, amount, currency, metadata)` : utilise le SDK `stripe@20.2.0`
    - `createCheckoutSession(societeId, lineItems, successUrl, cancelUrl)` : session Stripe Checkout
    - `createCustomer(societeId, email, name, metadata)` : création client Stripe
    - `createSubscription(societeId, customerId, priceId)` : abonnement Stripe
    - `createRefund(societeId, paymentIntentId, amount?)` : remboursement
    - `getBillingPortalUrl(societeId, customerId, returnUrl)` : portail facturation
    - Utiliser le SDK Stripe natif (pas fetch() brut) — il gère retries + idempotency nativement
    - Cache in-memory pour les instances Stripe par societeId (évite de recréer à chaque requête)
  - Créer `services/service-finance/src/infrastructure/psp/stripe/stripe-webhook.handler.ts` :
    - `handleWebhook(rawBody, signature, webhookSecret)` : utilise `stripe.webhooks.constructEvent()`
    - Stocker l'événement brut dans `PSPEventInboxEntity` pour idempotence
    - Mapper les events Stripe vers les statuts internes :
      - `payment_intent.succeeded` → PAID
      - `payment_intent.payment_failed` → REJECT_OTHER
      - `charge.refunded` → REFUNDED
      - `charge.dispute.created` → log alert
      - `customer.subscription.deleted` → log
      - `customer.subscription.updated` → log
    - Utiliser `ProviderStatusMappingService` pour la table de mapping
  - Créer `services/service-finance/src/infrastructure/psp/stripe/index.ts` : barrel export
  - Créer `services/service-finance/src/interfaces/grpc/controllers/payments/stripe.controller.ts` :
    - Implémenter les RPCs proto : `CreateStripePaymentIntent`, `CreateStripeCheckoutSession`, `CreateStripeCustomer`, `CreateStripeSubscription`, `CreateStripeRefund`, `GetStripeBillingPortalUrl`, `ListStripePaymentIntents`, `GetStripePaymentIntent`
    - Chaque méthode : extraire societeId de la request, appeler StripeApiService, retourner la réponse proto
  - Enregistrer dans `payments.module.ts` : StripeApiService + StripeWebhookHandler dans providers et exports, StripeController dans controllers

  **Must NOT do**:
  - NE PAS créer d'abstraction `BasePSPService` — service concret
  - NE PAS utiliser fetch() brut — utiliser le SDK Stripe
  - NE PAS gérer plus de 6 types d'événements webhook
  - NE PAS créer de migration pour stripe_accounts (table existe)
  - NE PAS ajouter Redis pour le cache — in-memory Map

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Intégration PSP complète avec SDK, webhooks, multi-tenant
  - **Skills**: [`microservice-maintainer`]
    - `microservice-maintainer`: Pattern DDD, conventions NestJS, structure PSP existante

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 2, 4)
  - **Blocks**: Task 7
  - **Blocked By**: None (indépendant du proto pour la création des fichiers)

  **References**:

  **Pattern References**:
  - `services/service-finance/src/infrastructure/psp/slimpay/slimpay-api.service.ts` — **RÉFÉRENCE PRINCIPALE**. Suivre exactement ce pattern : constructor DI (95-102), authenticate/getAccount, opérations, helpers. ~518 lignes.
  - `services/service-finance/src/infrastructure/psp/slimpay/slimpay-webhook.handler.ts` — Pattern webhook : handleWebhook (79-160), verifySignature (166-189), processEvent (195-234), statusMapping (236-291)
  - `services/service-finance/src/infrastructure/psp/slimpay/index.ts` — Barrel export (2 lignes)
  - `services/service-finance/src/interfaces/grpc/controllers/payments/slimpay.controller.ts` — Pattern controller avec @GrpcMethod decorators

  **API/Type References**:
  - `services/service-finance/src/domain/payments/entities/stripe-account.entity.ts` — Entité StripeAccount (secret key, publishable key, webhook secret, test mode)
  - `services/service-finance/src/domain/payments/entities/payment-intent.entity.ts` — Entité PaymentIntent pour stocker les résultats
  - `services/service-finance/src/domain/payments/entities/psp-event-inbox.entity.ts` — Inbox pour webhook idempotence
  - `packages/proto/src/payments/payment.proto:9-25` — RPCs Stripe (CreateStripePaymentIntent, CreateStripeCheckoutSession, etc.)

  **External References**:
  - SDK stripe@20.2.0 déjà installé dans `services/service-finance/package.json`

  **Acceptance Criteria**:

  ```
  Scenario: Stripe service files exist
    Tool: Bash
    Steps:
      1. test -f services/service-finance/src/infrastructure/psp/stripe/stripe-api.service.ts
      2. test -f services/service-finance/src/infrastructure/psp/stripe/stripe-webhook.handler.ts
      3. test -f services/service-finance/src/infrastructure/psp/stripe/index.ts
      4. test -f services/service-finance/src/interfaces/grpc/controllers/payments/stripe.controller.ts
      5. Assert: all 4 exist
    Expected Result: All files created
    Evidence: test output

  Scenario: Service is Injectable
    Tool: Bash (grep)
    Steps:
      1. grep "@Injectable" services/service-finance/src/infrastructure/psp/stripe/stripe-api.service.ts
      2. Assert: found
    Expected Result: NestJS DI compatible
    Evidence: grep output

  Scenario: Webhook verifies signatures
    Tool: Bash (grep)
    Steps:
      1. grep -E "constructEvent|webhooks" services/service-finance/src/infrastructure/psp/stripe/stripe-webhook.handler.ts
      2. Assert: found
    Expected Result: Signature verification implemented
    Evidence: grep output

  Scenario: Controller has gRPC methods
    Tool: Bash (grep)
    Steps:
      1. grep -c "@GrpcMethod" services/service-finance/src/interfaces/grpc/controllers/payments/stripe.controller.ts
      2. Assert: >= 6
    Expected Result: All proto RPCs implemented
    Evidence: grep count

  Scenario: Module registers Stripe
    Tool: Bash (grep)
    Steps:
      1. grep "StripeApiService" services/service-finance/src/payments.module.ts
      2. grep "StripeWebhookHandler" services/service-finance/src/payments.module.ts
      3. grep "StripeController" services/service-finance/src/payments.module.ts
      4. Assert: all 3 found
    Expected Result: Stripe fully wired in DI
    Evidence: grep output

  Scenario: Backend compiles
    Tool: Bash
    Steps:
      1. cd services/service-finance && npx tsc --noEmit
      2. Assert: exit code 0
    Expected Result: No type errors
    Evidence: Terminal output
  ```

  **Commit**: YES
  - Message: `feat(finance): implement Stripe PSP integration (API service, webhooks, gRPC controller)`
  - Files: `infrastructure/psp/stripe/*`, `interfaces/grpc/controllers/payments/stripe.controller.ts`, `payments.module.ts`
  - Pre-commit: `cd services/service-finance && npx tsc --noEmit`

---

- [x] 4. Backend — Implémenter GoCardless API Service + Webhook + Controller

  **What to do**:
  - Créer `services/service-finance/src/infrastructure/psp/gocardless/gocardless-api.service.ts` :
    - `@Injectable()`, injecte `Repository<GoCardlessAccountEntity>`, `Repository<GoCardlessMandateEntity>`, `EncryptionService`, `IbanMaskingService`
    - `getAccount(societeId)` : récupère le GoCardlessAccount, déchiffre l'access token
    - `setupMandate(societeId, clientId, email, iban, bic, accountHolderName)` : crée un mandat SEPA via SDK gocardless-nodejs@7.0.0, stocke dans GoCardlessMandateEntity
    - `getMandate(societeId, clientId)` : récupère le mandat actif
    - `cancelMandate(societeId, mandateId)` : annule le mandat
    - `createPayment(societeId, mandateId, amount, currency, description)` : crée un prélèvement SEPA
    - `createSubscription(societeId, mandateId, amount, interval, dayOfMonth)` : prélèvement récurrent
    - `cancelSubscription(societeId, subscriptionId)` : annule l'abonnement
    - Utiliser le SDK `gocardless-nodejs` natif
    - Gérer sandbox vs production via `isSandbox` flag de l'entité
  - Ajouter `hasWebhookSecret()` method à `GoCardlessAccountEntity` (vérifier que `webhookSecret` est non-null)
  - Créer `services/service-finance/src/infrastructure/psp/gocardless/gocardless-webhook.handler.ts` :
    - `handleWebhook(rawBody, signature)` : HMAC-SHA256 verification
    - Stocker dans PSPEventInbox pour idempotence
    - Mapper les events :
      - `payments.paid_out` / `payments.confirmed` → PAID
      - `payments.failed` → REJECT_OTHER ou REJECT_INSUFF_FUNDS (selon reason)
      - `payments.cancelled` → CANCELLED
      - `mandates.active` → log (mandat activé)
      - `mandates.cancelled` / `mandates.failed` → log alert
  - Créer `services/service-finance/src/infrastructure/psp/gocardless/index.ts` : barrel export
  - Créer `services/service-finance/src/interfaces/grpc/controllers/payments/gocardless.controller.ts` :
    - Implémenter les RPCs proto : `SetupGoCardlessMandate`, `GetGoCardlessMandate`, `CancelGoCardlessMandate`, `CreateGoCardlessPayment`, `CreateGoCardlessSubscription`, `CancelGoCardlessSubscription`
  - Enregistrer dans `payments.module.ts`

  **Must NOT do**:
  - NE PAS créer d'abstraction — service concret
  - NE PAS créer de migration (tables existent)
  - NE PAS gérer plus de 5 types d'événements webhook

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Intégration PSP complète avec SDK, SEPA mandats, webhooks
  - **Skills**: [`microservice-maintainer`]
    - `microservice-maintainer`: Pattern DDD, conventions NestJS

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 2, 3)
  - **Blocks**: Task 7
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `services/service-finance/src/infrastructure/psp/slimpay/slimpay-api.service.ts` — **RÉFÉRENCE PRINCIPALE** pour la structure du service
  - `services/service-finance/src/infrastructure/psp/slimpay/slimpay-webhook.handler.ts` — Pattern webhook HMAC
  - `services/service-finance/src/interfaces/grpc/controllers/payments/slimpay.controller.ts` — Pattern controller

  **API/Type References**:
  - `services/service-finance/src/domain/payments/entities/gocardless-account.entity.ts` — Entité GoCardlessAccount (access token, webhook secret, sandbox mode)
  - `services/service-finance/src/domain/payments/entities/gocardless-mandate.entity.ts` — Entité GoCardlessMandate (RUM, status, bank details masking)
  - `packages/proto/src/payments/payment.proto:27-40` — RPCs GoCardless

  **External References**:
  - SDK gocardless-nodejs@7.0.0 déjà installé dans `services/service-finance/package.json`

  **Acceptance Criteria**:

  ```
  Scenario: GoCardless service files exist
    Tool: Bash
    Steps:
      1. test -f services/service-finance/src/infrastructure/psp/gocardless/gocardless-api.service.ts
      2. test -f services/service-finance/src/infrastructure/psp/gocardless/gocardless-webhook.handler.ts
      3. test -f services/service-finance/src/infrastructure/psp/gocardless/index.ts
      4. test -f services/service-finance/src/interfaces/grpc/controllers/payments/gocardless.controller.ts
      5. Assert: all 4 exist
    Expected Result: All files created
    Evidence: test output

  Scenario: GoCardless entity has hasWebhookSecret
    Tool: Bash (grep)
    Steps:
      1. grep "hasWebhookSecret" services/service-finance/src/domain/payments/entities/gocardless-account.entity.ts
      2. Assert: found
    Expected Result: Method added to entity
    Evidence: grep output

  Scenario: Webhook uses HMAC-SHA256
    Tool: Bash (grep)
    Steps:
      1. grep -E "createHmac|sha256" services/service-finance/src/infrastructure/psp/gocardless/gocardless-webhook.handler.ts
      2. Assert: found
    Expected Result: Proper signature verification
    Evidence: grep output

  Scenario: Module registers GoCardless
    Tool: Bash (grep)
    Steps:
      1. grep "GoCardlessApiService" services/service-finance/src/payments.module.ts
      2. Assert: found in providers
    Expected Result: GoCardless wired in DI
    Evidence: grep output

  Scenario: Backend compiles
    Tool: Bash
    Steps:
      1. cd services/service-finance && npx tsc --noEmit
      2. Assert: exit code 0
    Expected Result: No type errors
    Evidence: Terminal output
  ```

  **Commit**: YES
  - Message: `feat(finance): implement GoCardless PSP integration (SEPA mandates, payments, webhooks)`
  - Files: `infrastructure/psp/gocardless/*`, `interfaces/grpc/controllers/payments/gocardless.controller.ts`, `payments.module.ts`, `gocardless-account.entity.ts`
  - Pre-commit: `cd services/service-finance && npx tsc --noEmit`

---

- [x] 5. Frontend — Server Actions + gRPC Client Wiring

  **What to do**:
  - Ajouter dans `frontend/src/lib/grpc/clients/payments.ts` les wrappers pour les nouveaux RPCs :
    - `listPayments(request)` → promisified
    - `getPaymentStats(request)` → promisified
  - Remplacer les stubs dans `frontend/src/actions/payments.ts` :
    - `getPaymentIntents()` (ligne ~154, actuellement `return { data: [], error: null }`) → appeler `payments.listPayments()`
    - `getPaymentEvents()` (ligne ~255, stub) → appeler le vrai RPC
    - `getSchedules()` (ligne ~363, stub) → appeler le vrai RPC
  - Ajouter de nouvelles server actions :
    - `listPayments(request)` : appelle le nouveau RPC ListPayments
    - `getPaymentStats(request)` : appelle le nouveau RPC GetPaymentStats
  - Ajouter "Stripe" au type `PSPProvider` dans `frontend/src/lib/ui/display-types/payment.ts`
  - Ajouter `<SelectItem value="Stripe">Stripe</SelectItem>` dans `payment-filters.tsx`

  **Must NOT do**:
  - NE PAS modifier la structure du gRPC client (juste ajouter des méthodes)
  - NE PAS changer les interfaces Payment/PaymentFilters/PaymentStats (elles sont déjà bien)

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: Modifications frontend avec types TypeScript
  - **Skills**: [`frontend-ui-ux`]
    - `frontend-ui-ux`: Connaissance du pattern Next.js server actions

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 2 (sequential with Task 6)
  - **Blocks**: Task 6
  - **Blocked By**: Tasks 1, 2

  **References**:

  **Pattern References**:
  - `frontend/src/lib/grpc/clients/payments.ts` — Client gRPC existant pour les paiements. Ajouter listPayments/getPaymentStats suivant le même pattern promisify
  - `frontend/src/actions/payments.ts` — Actions existantes. Lignes ~154, ~255, ~363 sont les stubs à remplacer
  - `frontend/src/actions/clients.ts` — Référence pour le pattern ActionResult avec gRPC

  **API/Type References**:
  - `frontend/src/proto/payments/payment.ts` — Types proto générés (ListPaymentsRequest, etc. — créés en Task 1)
  - `frontend/src/lib/ui/display-types/payment.ts:16-21` — PSPProvider à modifier (ajouter "Stripe")

  **Acceptance Criteria**:

  ```
  Scenario: Stripe added to PSPProvider
    Tool: Bash (grep)
    Steps:
      1. grep "Stripe" frontend/src/lib/ui/display-types/payment.ts
      2. Assert: "Stripe" in PSPProvider union
    Expected Result: Stripe in display types
    Evidence: grep output

  Scenario: New server actions exist
    Tool: Bash (grep)
    Steps:
      1. grep "listPayments" frontend/src/actions/payments.ts
      2. grep "getPaymentStats" frontend/src/actions/payments.ts
      3. Assert: both found
    Expected Result: Actions created
    Evidence: grep output

  Scenario: Stubs removed
    Tool: Bash (grep)
    Steps:
      1. grep "data: \[\]" frontend/src/actions/payments.ts | wc -l
      2. Assert: 0 (no more hardcoded empty arrays)
    Expected Result: No more stub actions
    Evidence: grep count

  Scenario: Frontend compiles
    Tool: Bash
    Steps:
      1. cd frontend && npx tsc --noEmit
      2. Assert: exit code 0
    Expected Result: No type errors
    Evidence: Terminal output
  ```

  **Commit**: YES (groups with Task 6)
  - Message: `feat(frontend): wire payment server actions and add Stripe to PSP types`
  - Files: `actions/payments.ts`, `lib/grpc/clients/payments.ts`, `lib/ui/display-types/payment.ts`, `components/payments/payment-filters.tsx`
  - Pre-commit: `cd frontend && npx tsc --noEmit`

---

- [x] 6. Frontend — Assembler la Page Paiements

  **What to do**:
  - Modifier `frontend/src/app/(main)/paiements/page.tsx` (server component) :
    - Ajouter les appels `listPayments()` et `getPaymentStats()` dans le Promise.all existant
    - Passer `initialPayments` et `initialStats` en props à `PaiementsPageClient`
  - Modifier `frontend/src/app/(main)/paiements/paiements-page-client.tsx` :
    - Ajouter les props `initialPayments` et `initialStats`
    - Ajouter le tab "Paiements" en PREMIÈRE position (avant Routage)
    - Ajouter le tab "Échéancier" en deuxième position
    - Changer le defaultTab de "routing" à "paiements"
    - Dans TabsContent "paiements" :
      - `<PaymentKPICards stats={stats} />`
      - `<PaymentFiltersComponent filters={filters} onFiltersChange={setFilters} />`
      - `<PaymentTable payments={filteredPayments} onViewDetails={handleViewDetails} />`
      - `<PaymentDetailsDialog payment={selectedPayment} open={dialogOpen} onOpenChange={setDialogOpen} />`
    - Gérer l'état local : `filters`, `selectedPayment`, `dialogOpen`
    - Implémenter le filtrage côté client (les filtres sont déjà dans les composants)
  - Créer le contenu de l'onglet "Échéancier" :
    - Simple table des schedules à venir (utiliser les données Schedule de `getSchedules()`)
    - Colonnes : Contrat, Montant, Échéance, Statut, PSP, Tentatives
    - Pas besoin d'un composant séparé complexe — une Card avec Table inline suffit
  - Importer les composants existants depuis `@/components/payments/`

  **Must NOT do**:
  - NE PAS modifier les 4 onglets existants (routing, archives, alertes, exports)
  - NE PAS créer de nouveaux composants complexes — utiliser ceux qui existent
  - NE PAS ajouter de pagination côté serveur (les 4 onglets existants n'en ont pas)

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: Assemblage de composants frontend existants, page layout
  - **Skills**: [`frontend-ui-ux`]
    - `frontend-ui-ux`: Expertise UI React/Next.js, Shadcn patterns

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 2 (after Task 5)
  - **Blocks**: Task 7
  - **Blocked By**: Task 5

  **References**:

  **Pattern References**:
  - `frontend/src/app/(main)/paiements/paiements-page-client.tsx` — Page actuelle avec 4 tabs. Ajouter 2 tabs au début
  - `frontend/src/app/(main)/paiements/page.tsx` — Server component avec Promise.all pour fetch data. Ajouter listPayments + getPaymentStats
  - `frontend/src/app/(main)/clients/[id]/client-detail-client.tsx:494-498` — Exemple de mapping de données payment dans un composant

  **API/Type References**:
  - `frontend/src/components/payments/payment-table.tsx` — Props: `payments: Payment[]`, `onViewDetails: (payment: Payment) => void`
  - `frontend/src/components/payments/payment-kpi-cards.tsx` — Props: `stats: PaymentStats`
  - `frontend/src/components/payments/payment-filters.tsx` — Props: `filters: PaymentFilters`, `onFiltersChange: (filters: PaymentFilters) => void`
  - `frontend/src/components/payments/payment-details-dialog.tsx` — Props: `payment: Payment | null`, `open: boolean`, `onOpenChange: (open: boolean) => void`
  - `frontend/src/lib/ui/display-types/payment.ts` — Toutes les interfaces (Payment, PaymentFilters, PaymentStats)

  **Acceptance Criteria**:

  ```
  Scenario: Page has 6 tabs
    Tool: Bash (grep)
    Steps:
      1. grep -c "TabsTrigger" frontend/src/app/(main)/paiements/paiements-page-client.tsx
      2. Assert: 6 (Paiements, Echeancier, Routage, Archives, Alertes, Exports)
    Expected Result: 6 tabs
    Evidence: grep count

  Scenario: Payment components are imported and used
    Tool: Bash (grep)
    Steps:
      1. grep "PaymentTable" frontend/src/app/(main)/paiements/paiements-page-client.tsx
      2. grep "PaymentKPICards" frontend/src/app/(main)/paiements/paiements-page-client.tsx
      3. grep "PaymentFiltersComponent" frontend/src/app/(main)/paiements/paiements-page-client.tsx
      4. grep "PaymentDetailsDialog" frontend/src/app/(main)/paiements/paiements-page-client.tsx
      5. Assert: all 4 found
    Expected Result: All payment components wired
    Evidence: grep output

  Scenario: Default tab is "paiements"
    Tool: Bash (grep)
    Steps:
      1. grep 'useState.*paiements' frontend/src/app/(main)/paiements/paiements-page-client.tsx
      2. Assert: found
    Expected Result: Default tab set correctly
    Evidence: grep output

  Scenario: Frontend builds
    Tool: Bash
    Steps:
      1. cd frontend && npm run build
      2. Assert: exit code 0
    Expected Result: Production build succeeds
    Evidence: Terminal output
  ```

  **Commit**: YES
  - Message: `feat(frontend): assemble payment page with KPIs, filters, table, detail dialog and schedule tab`
  - Files: `paiements-page-client.tsx`, `page.tsx`
  - Pre-commit: `cd frontend && npm run build`

---

- [x] 7. Vérification Intégration Finale

  **What to do**:
  - Vérifier que le frontend build passe : `cd frontend && npm run build`
  - Vérifier que le backend compile : `cd services/service-finance && npx tsc --noEmit`
  - Vérifier que tous les fichiers attendus existent
  - Vérifier que les imports ne sont pas cassés
  - Fixer tout problème de compilation restant

  **Must NOT do**:
  - NE PAS ajouter de nouvelles features
  - NE PAS refactorer du code existant

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Vérification simple, fixes mineurs
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 3 (final)
  - **Blocks**: None
  - **Blocked By**: Tasks 2, 3, 4, 6

  **References**:
  - Tous les fichiers créés/modifiés dans les tâches précédentes

  **Acceptance Criteria**:

  ```
  Scenario: Full frontend build
    Tool: Bash
    Steps:
      1. cd frontend && npm run build
      2. Assert: exit code 0
    Expected Result: Clean build
    Evidence: Build output

  Scenario: Full backend compile
    Tool: Bash
    Steps:
      1. cd services/service-finance && npx tsc --noEmit
      2. Assert: exit code 0
    Expected Result: Clean compile
    Evidence: Terminal output

  Scenario: All 8 new PSP files exist
    Tool: Bash
    Steps:
      1. Check stripe (4 files) + gocardless (4 files)
      2. Assert: 8 files exist
    Expected Result: Complete PSP implementation
    Evidence: File check output

  Scenario: Proto types generated
    Tool: Bash (grep)
    Steps:
      1. grep "ListPaymentsRequest" frontend/src/proto/payments/payment.ts
      2. Assert: found
    Expected Result: Proto types available
    Evidence: grep output
  ```

  **Commit**: YES (if fixes needed)
  - Message: `fix(finance): resolve integration issues across payment page and PSP services`
  - Pre-commit: `npm run build` (frontend)

---

## Commit Strategy

| After Task | Message | Verification |
|------------|---------|--------------|
| 1 | `feat(proto): add ListPayments and GetPaymentStats RPCs` | `bun run generate` |
| 2 | `feat(finance): implement ListPayments and GetPaymentStats endpoints` | `tsc --noEmit` |
| 3 | `feat(finance): implement Stripe PSP integration` | `tsc --noEmit` |
| 4 | `feat(finance): implement GoCardless PSP integration` | `tsc --noEmit` |
| 5+6 | `feat(frontend): complete payment page with KPIs, table, filters and PSP types` | `npm run build` |
| 7 | `fix(finance): resolve integration issues` (if needed) | `npm run build` + `tsc --noEmit` |

---

## Success Criteria

### Verification Commands
```bash
# Frontend build
cd frontend && npm run build  # Expected: exit code 0

# Backend compile
cd services/service-finance && npx tsc --noEmit  # Expected: exit code 0

# Tab count
grep -c "TabsTrigger" frontend/src/app/\(main\)/paiements/paiements-page-client.tsx  # Expected: 6

# Payment components wired
grep -c "PaymentTable\|PaymentKPICards\|PaymentFiltersComponent\|PaymentDetailsDialog" frontend/src/app/\(main\)/paiements/paiements-page-client.tsx  # Expected: >= 4

# Stripe PSP files
ls services/service-finance/src/infrastructure/psp/stripe/  # Expected: 3 files
ls services/service-finance/src/interfaces/grpc/controllers/payments/stripe.controller.ts  # Expected: exists

# GoCardless PSP files
ls services/service-finance/src/infrastructure/psp/gocardless/  # Expected: 3 files
ls services/service-finance/src/interfaces/grpc/controllers/payments/gocardless.controller.ts  # Expected: exists

# No more stub actions
grep -c "data: \[\]" frontend/src/actions/payments.ts  # Expected: 0
```

### Final Checklist
- [x] Page `/paiements` a 6 onglets (Paiements par défaut)
- [x] Onglet Paiements : KPIs + Filtres + Table + Dialog détail
- [x] Onglet Échéancier : Table des schedules
- [x] Stripe backend : API service + webhook + controller
- [x] GoCardless backend : API service + webhook + controller
- [x] Proto : ListPayments + GetPaymentStats
- [x] "Stripe" dans PSPProvider type + filtre dropdown
- [x] Aucun stub server action restant
- [x] Frontend build clean
- [x] Backend compile clean
