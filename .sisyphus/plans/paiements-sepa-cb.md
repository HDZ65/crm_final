# Module Gestion des Paiements (SEPA & CB) — Plan de travail

## TL;DR

> **Quick Summary**: Combler les ~60% de fonctionnalités manquantes du CDC Paiements (SEPA & CB) dans le service-finance existant. Le CRM a un socle solide (Calendar, Retry, Portal, GoCardless) mais il manque le routage fournisseurs, 3 connecteurs PSP, le rapprochement bancaire, les exports comptables, le système d'alertes, le scoring IA, et de nombreuses fonctionnalités de support.
>
> **Deliverables**:
> - Tables & entités manquantes (routing_rules, risk_scores, alerts, export_jobs, etc.)
> - Connecteurs PSP Slimpay/MultiSafepay/Emerchantpay (API REST)
> - Moteur de routage dynamique fournisseurs
> - Rapprochement bancaire CAMT.053
> - Exports comptables (CSV/XLSX/JSON)
> - Système d'alertes multi-canal
> - Scoring prédictif IA complet
> - 4 nouveaux écrans frontend (Calendrier, Archivés, Routage Finance, Scoring)
> - Mapping statuts PSP, référentiel rejets, archivage auto, sécurité AES-256
> - Tests fonctionnels et d'intégration
>
> **Estimated Effort**: XL (50+ tâches)
> **Parallel Execution**: YES — 8 waves
> **Critical Path**: Tables fondation → PSP connectors → Routing engine → Reconciliation → Exports → Scoring → UX → Tests

---

## Context

### Original Request
Analyse du CDC "Module Gestion des Paiements (SEPA & CB)" (2213 lignes, 10 sections + 17 annexes A→U) et identification des écarts avec le CRM existant. Puis implémentation de TOUS les manques.

### Interview Summary
**Key Discussions**:
- Périmètre : TOUS les 6 bloquants + 12 importants + scoring IA complet
- Priorité PSP : Slimpay d'abord → MultiSafepay → Emerchantpay
- Scoring : Version complète avec ML/IA (pas juste des règles)
- Tests : Tests-after (implémentation d'abord, tests ajoutés par bloc)

**Research Findings**:
- service-finance a 3 bounded contexts (Payments, Factures, Calendar) — ~40 entités existantes
- Proto payment.proto : 897 lignes, ~70 RPCs (Stripe, PayPal, GoCardless, Schedule, Portal)
- Calendar Engine complet (11 entités, config 4 niveaux, jours fériés)
- Retry Engine complet (6 entités, codes erreur SEPA, backoff, stop conditions)
- Reminder Engine complet (multi-canal EMAIL/SMS/PHONE/PUSH/POSTAL)
- Portal Engine complet (sessions, tokens, audit)
- Frontend : Next.js 15, shadcn UI, gRPC clients, hooks customs

### Self-Review (en lieu de Metis)
**Guardrails identifiés** :
- Ne PAS modifier les entités/tables existantes de manière destructive (ajout de colonnes OK)
- Suivre strictement l'architecture DDD existante (domain/application/infrastructure/interfaces)
- Réutiliser les patterns existants (TypeORM entities, gRPC controllers, NATS handlers)
- Les connecteurs PSP doivent être isolés (un service par PSP, même interface)
- Le scoring IA est optionnel dans le CDC → encapsuler pour désactivation facile
- Pas de credentials hardcodés — tout via env vars / Vault

---

## Work Objectives

### Core Objective
Implémenter l'intégralité des fonctionnalités décrites dans le CDC Paiements (SEPA & CB) qui manquent dans le CRM actuel, en respectant l'architecture DDD existante et les patterns de code en place.

### Concrete Deliverables
- 12+ nouvelles entités TypeORM dans service-finance
- 3 connecteurs PSP complets (Slimpay, MultiSafepay, Emerchantpay)
- Moteur de routage dynamique avec UI Direction Financière
- Module de rapprochement bancaire CAMT.053
- Système d'exports comptables asynchrones
- Système d'alertes multi-canal
- Scoring prédictif IA complet
- 4 nouveaux écrans frontend + améliorations des existants
- Extensions proto gRPC (nouvelles RPCs)
- Tests fonctionnels et d'intégration

### Definition of Done
- [ ] Tous les statuts CDC couverts (PENDING→PAID→REJECT_*→REFUNDED→CANCELLED)
- [ ] Les 4 PSP du CDC fonctionnels (GoCardless ✅ + Slimpay + MSP + EMP)
- [ ] Routage fournisseur opérationnel avec rules, overrides et reassignment
- [ ] Rapprochement bancaire CAMT.053 fonctionnel
- [ ] Exports comptables CSV/XLSX/JSON opérationnels
- [ ] Scoring IA génère des scores 0-100 avec risk_tier
- [ ] 6 écrans frontend complets et fonctionnels
- [ ] Alertes configurées et notifications opérationnelles
- [ ] Tests passants pour chaque bloc fonctionnel

### Must Have
- Connecteurs PSP Slimpay/MSP/EMP avec mapping statuts
- Moteur de routage avec fallback
- Rapprochement CAMT.053 avec appariement auto
- Exports comptables planifiables
- Alertes critiques (REJECT_SPIKES, BATCH_DAY_EMPTY, API_CREDENTIALS_INVALID)
- Scoring IA fonctionnel
- Tables référentiels (payment_statuses, rejection_reasons, provider_status_mapping)

### Must NOT Have (Guardrails)
- Ne PAS casser les intégrations Stripe/PayPal/GoCardless existantes
- Ne PAS stocker de PAN/CVV (PCI-DSS : tokens PSP uniquement)
- Ne PAS modifier la structure des entités Calendar existantes (étendre seulement)
- Ne PAS créer de dépendances circulaires entre bounded contexts
- Ne PAS implémenter de SEPA XML direct-to-bank (le CDC passe par les PSP)
- Ne PAS ajouter de frameworks IA lourds côté backend (utiliser un micro-service Python séparé pour le scoring ML)
- Ne PAS hardcoder les credentials PSP

---

## Verification Strategy (MANDATORY)

> **UNIVERSAL RULE: ZERO HUMAN INTERVENTION**
>
> ALL tasks in this plan MUST be verifiable WITHOUT any human action.

### Test Decision
- **Infrastructure exists**: YES (bun test disponible)
- **Automated tests**: Tests-after (implementation d'abord, tests ajoutés par bloc)
- **Framework**: bun test / jest (existant dans le projet)

### Agent-Executed QA Scenarios (MANDATORY — ALL tasks)

**Verification Tool by Deliverable Type:**

| Type | Tool | How Agent Verifies |
|------|------|-------------------|
| **Entities/Migrations** | Bash (bun run build) | Build succeeds, migration runs |
| **gRPC Services** | Bash (grpcurl) | Call RPC, verify response |
| **PSP Connectors** | Bash (curl sandbox) | Hit sandbox API, verify mapping |
| **Frontend UI** | Playwright | Navigate, interact, assert DOM |
| **Exports** | Bash (curl + file check) | Generate export, verify format |
| **Scoring IA** | Bash (python script) | Run inference, check output |

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Foundation — Start Immediately):
├── Task 1: Tables référentiels & entités fondation
├── Task 2: Proto extensions (nouvelles RPCs)
└── Task 3: Sécurité AES-256 & masquage IBAN

Wave 2 (PSP Connectors — After Wave 1):
├── Task 4: Connecteur Slimpay (SEPA)
├── Task 5: Connecteur MultiSafepay (CB)
└── Task 6: Connecteur Emerchantpay (SEPA+CB)

Wave 3 (Moteurs — After Wave 1):
├── Task 7: Moteur de routage dynamique
├── Task 8: Mapping statuts PSP (provider_status_mapping)
├── Task 9: RUM Generator Service
└── Task 10: Archivage automatique

Wave 4 (Finance — After Wave 2+3):
├── Task 11: Rapprochement bancaire CAMT.053
├── Task 12: Exports comptables asynchrones
└── Task 13: Système d'alertes

Wave 5 (Scoring IA — After Wave 1):
├── Task 14: Scoring Engine backend (Python micro-service)
├── Task 15: Intégration scoring → routage & retry
└── Task 16: Customer interactions table

Wave 6 (Frontend — After Wave 3+4):
├── Task 17: Écran Calendrier/Émission planifiée (heatmap)
├── Task 18: Écran Routage Finance (Direction Financière)
├── Task 19: Écran Paiements archivés
├── Task 20: Écran Scoring & Relances
└── Task 21: WebSocket statuts temps réel

Wave 7 (Monitoring — After Wave 4):
├── Task 22: Prometheus métriques
└── Task 23: Grafana dashboards (IT/Finance/Direction)

Wave 8 (Tests & Polish — After All):
├── Task 24: Tests fonctionnels par bloc
├── Task 25: Tests de charge (10k paiements)
└── Task 26: Tests sécurité (HMAC, RBAC, AES)
```

### Dependency Matrix

| Task | Depends On | Blocks | Can Parallelize With |
|------|------------|--------|---------------------|
| 1 | None | 4,5,6,7,8,9,10,11,12,13,14 | 2, 3 |
| 2 | None | 4,5,6,7,11,12,13 | 1, 3 |
| 3 | None | 4,5,6 | 1, 2 |
| 4 | 1,2,3 | 11,12 | 5, 6 |
| 5 | 1,2,3 | 11,12 | 4, 6 |
| 6 | 1,2,3 | 11,12 | 4, 5 |
| 7 | 1,2 | 15,18 | 8, 9, 10 |
| 8 | 1 | 4,5,6 | 7, 9, 10 |
| 9 | 1 | None | 7, 8, 10 |
| 10 | 1 | 19 | 7, 8, 9 |
| 11 | 4,5,6 | 17 | 12, 13 |
| 12 | 1,2 | 17 | 11, 13 |
| 13 | 1,2 | 22 | 11, 12 |
| 14 | 1 | 15,20 | 7,8,9,10 |
| 15 | 7,14 | 20 | 16 |
| 16 | 1 | 20 | 14,15 |
| 17 | 11,12 | None | 18,19,20 |
| 18 | 7 | None | 17,19,20 |
| 19 | 10 | None | 17,18,20 |
| 20 | 15,16 | None | 17,18,19 |
| 21 | 1 | None | 17-20 |
| 22 | 13 | 23 | None |
| 23 | 22 | None | None |
| 24 | All above | None | 25,26 |
| 25 | 24 | None | 26 |
| 26 | 24 | None | 25 |

---

## TODOs

### Wave 1 — Foundation

- [ ] 1. Tables référentiels & entités fondation

  **What to do**:
  - Créer l'entité `PaymentStatusEntity` (table `payment_statuses`) : status_code (PK), label, is_final, can_retry, ui_badge_color
    - Seed : PENDING, SUBMITTED, PAID, REJECT_INSUFF_FUNDS, REJECT_OTHER, CANCELLED, REFUNDED, API_ERROR
  - Créer l'entité `RejectionReasonEntity` (table `rejection_reasons`) : reason_id, provider_name, provider_code, label_fr, category (INSUFFISANCE/TECHNIQUE/CONTESTATION/AUTRE), is_retryable, comment
    - Seed données de l'Annexe P du CDC (AM04, AC04, MD01, AG01, MS03)
  - Créer l'entité `ProviderStatusMappingEntity` (table `provider_status_mapping`) : mapping_id, provider_id, provider_raw_status, provider_raw_reason, status_code (FK), retry_advice (AUTO/MANUAL/NEVER)
    - Unique constraint: (provider_id, provider_raw_status, coalesce(provider_raw_reason,''))
    - Seed mappings Annexe K : Slimpay (8 mappings), MSP (9), EMP (8), GoCardless (8)
  - Créer l'entité `ProviderRoutingRuleEntity` (table `provider_routing_rules`) : rule_id, company_id, name, priority, conditions (JSONB), provider_account_id, fallback, is_enabled
  - Créer l'entité `ProviderOverrideEntity` (table `provider_overrides`) : override_id, scope (CLIENT/CONTRAT), scope_id, provider_account_id, reason, created_by
  - Créer l'entité `ProviderReassignmentJobEntity` (table `provider_reassignment_jobs`) : job_id, company_id, from/to_provider_account_id, selection_query (JSONB), status, dry_run, report_file_id
  - Créer l'entité `AlertEntity` (table `alerts`) : alert_id, scope (PAYMENT/PROVIDER/SYSTEM), scope_ref, severity (INFO/WARNING/CRITICAL), code, message, notified_channels (JSONB), acknowledged_by, acknowledged_at
  - Créer l'entité `ExportJobEntity` (table `export_jobs`) : export_job_id, company_id, period_from, period_to, format (CSV/XLSX/JSON), status (PENDING/RUNNING/DONE/FAILED), file_id, created_by, duration_ms
  - Créer l'entité `RiskScoreEntity` (table `risk_scores`) : risk_score_id, payment_id (unique), contract_id, score (0-100), risk_tier (LOW/MEDIUM/HIGH), factors (JSONB), evaluated_at
  - Créer l'entité `CustomerInteractionEntity` (table `customer_interactions`) : interaction_id, company_id, customer_id, payment_id, channel (EMAIL/SMS/CALL), message_type, payload (JSONB), status (SENT/FAILED/QUEUED), sent_at, error_message
  - Créer les migrations TypeORM pour toutes ces tables
  - Ajouter les index composites recommandés par le CDC (Annexe A)

  **Must NOT do**:
  - Ne PAS modifier les entités existantes dans cette tâche
  - Ne PAS ajouter de logique métier — uniquement les entités et migrations

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: [`microservice-maintainer`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 2, 3)
  - **Blocks**: Tasks 4-16
  - **Blocked By**: None

  **References**:
  - `services/service-finance/src/domain/payments/entities/payment-intent.entity.ts` — Pattern entité TypeORM avec enums, indexes, business methods
  - `services/service-finance/src/domain/payments/entities/retry-policy.entity.ts` — Pattern JSONB columns, multi-index composite
  - `services/service-finance/src/domain/calendar/entities/planned-debit.entity.ts` — Pattern entité avec enum status
  - `docs/EXTRACTED_PAIEMENTS.txt:666-771` — Annexe A schéma de données complet
  - `docs/EXTRACTED_PAIEMENTS.txt:1429-1484` — Annexe K mapping statuts
  - `docs/EXTRACTED_PAIEMENTS.txt:1795-1856` — Annexe P référentiel rejets
  - `services/service-finance/CLAUDE.md` — Architecture DDD et conventions du service

  **Acceptance Criteria**:
  - [ ] `bun run build` passe sans erreur dans service-finance
  - [ ] Migration TypeORM s'exécute sans erreur sur base vide
  - [ ] 11 nouvelles entités créées dans `src/domain/payments/entities/`
  - [ ] Seed data injecté pour payment_statuses (8 statuts), rejection_reasons (5+ motifs), provider_status_mapping (33+ mappings)
  - [ ] Index composites créés selon Annexe A

  **Agent-Executed QA Scenarios**:
  ```
  Scenario: Build succeeds with new entities
    Tool: Bash
    Steps:
      1. cd services/service-finance && bun run build
      2. Assert: exit code 0, no TypeScript errors
    Evidence: Build output captured

  Scenario: Migration creates all tables
    Tool: Bash
    Steps:
      1. Run TypeORM migration:run against test database
      2. Query: SELECT table_name FROM information_schema.tables WHERE table_schema='public'
      3. Assert: payment_statuses, rejection_reasons, provider_status_mapping, provider_routing_rules, provider_overrides, provider_reassignment_jobs, alerts, export_jobs, risk_scores, customer_interactions all present
    Evidence: Query output captured
  ```

  **Commit**: YES
  - Message: `feat(finance): add foundation entities for payment module CDC compliance`
  - Files: `services/service-finance/src/domain/payments/entities/*.ts`, `services/service-finance/src/migrations/*.ts`

---

- [ ] 2. Proto extensions — nouvelles RPCs payment.proto

  **What to do**:
  - Ajouter les RPCs Slimpay dans le service PaymentService :
    - `CreateSlimpayPayment`, `GetSlimpayPayment`, `CreateSlimpayMandate`, `GetSlimpayMandate`, `CancelSlimpayMandate`
  - Ajouter les RPCs MultiSafepay :
    - `CreateMultiSafepayTransaction`, `GetMultiSafepayTransaction`, `RefundMultiSafepayTransaction`
  - Ajouter les RPCs Emerchantpay :
    - `CreateEmerchantpayPayment`, `GetEmerchantpayPayment`, `CreateEmerchantpaySepaPayment`
  - Ajouter les RPCs Routage :
    - `CreateRoutingRule`, `UpdateRoutingRule`, `DeleteRoutingRule`, `ListRoutingRules`, `TestRoutingRule`, `CreateProviderOverride`, `DeleteProviderOverride`, `CreateReassignmentJob`, `GetReassignmentJob`
  - Ajouter les RPCs Alertes :
    - `ListAlerts`, `AcknowledgeAlert`, `GetAlertStats`
  - Ajouter les RPCs Exports :
    - `CreateExportJob`, `GetExportJob`, `ListExportJobs`, `DownloadExport`
  - Ajouter les RPCs Scoring :
    - `GetRiskScore`, `EvaluateRiskScore`, `ListRiskScores`, `GetScoringStats`
  - Ajouter les RPCs Reconciliation :
    - `ImportBankStatement`, `GetReconciliationStatus`, `ForceReconciliation`, `ListUnmatchedPayments`
  - Ajouter les RPCs Mapping :
    - `ListProviderStatusMappings`, `UpdateProviderStatusMapping`
  - Ajouter les RPCs RejectionReasons :
    - `ListRejectionReasons`, `CreateRejectionReason`, `UpdateRejectionReason`
  - Générer les types TypeScript (`bun run proto:generate`)

  **Must NOT do**:
  - Ne PAS modifier les RPCs existantes (Stripe, PayPal, GoCardless, Schedule, Portal)
  - Ne PAS changer les messages existants

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: [`microservice-maintainer`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 3)
  - **Blocks**: Tasks 4-13
  - **Blocked By**: None

  **References**:
  - `packages/proto/src/payments/payment.proto` — Proto existant (897 lignes), pattern RPCs Stripe/GoCardless/PayPal
  - `packages/proto/src/events/payment_events.proto` — Pattern events proto
  - `frontend/src/proto/payments/payment.ts` — Types TS générés
  - `docs/EXTRACTED_PAIEMENTS.txt:840-918` — Annexe C routage
  - `docs/EXTRACTED_PAIEMENTS.txt:919-1019` — Annexe D webhooks

  **Acceptance Criteria**:
  - [ ] `bun run proto:generate` passe sans erreur
  - [ ] Types TS générés dans `frontend/src/proto/payments/payment.ts`
  - [ ] ~40 nouvelles RPCs ajoutées
  - [ ] Aucun RPC existant modifié

  **Agent-Executed QA Scenarios**:
  ```
  Scenario: Proto compiles successfully
    Tool: Bash
    Steps:
      1. cd packages/proto && bun run proto:generate
      2. Assert: exit code 0
      3. Grep: "Slimpay" in frontend/src/proto/payments/payment.ts
      4. Assert: found
    Evidence: Build output captured
  ```

  **Commit**: YES
  - Message: `feat(proto): add RPCs for Slimpay, MSP, EMP, routing, alerts, exports, scoring, reconciliation`
  - Files: `packages/proto/src/payments/payment.proto`, `frontend/src/proto/payments/payment.ts`

---

- [ ] 3. Sécurité AES-256 & masquage IBAN

  **What to do**:
  - Créer un service `EncryptionService` dans service-finance (AES-256-GCM) :
    - `encrypt(plaintext: string): string` (retourne IV:ciphertext:tag en base64)
    - `decrypt(encrypted: string): string`
    - Clé via env var `ENCRYPTION_KEY` (256 bits)
  - Créer un service `IbanMaskingService` :
    - `mask(iban: string): string` → `FR76 **** **** 1234` (conserve pays + 4 derniers)
    - `maskBic(bic: string): string` → `BNP*****`
  - Créer un TypeORM column transformer pour chiffrement auto IBAN/BIC :
    - Transformer `to` : encrypt, Transformer `from` : decrypt
  - Ajouter le masquage dans les logs (intercepteur gRPC)
  - Créer un middleware d'audit pour journaliser les accès aux données sensibles

  **Must NOT do**:
  - Ne PAS stocker la clé en clair dans le code
  - Ne PAS logger les IBAN en clair

  **Recommended Agent Profile**:
  - **Category**: `ultrabrain`
  - **Skills**: [`microservice-maintainer`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 2)
  - **Blocks**: Tasks 4, 5, 6
  - **Blocked By**: None

  **References**:
  - `services/service-finance/src/domain/payments/entities/gocardless-mandate.entity.ts` — Entité mandate avec accountHolderName, accountNumberEnding (non chiffré actuellement)
  - `docs/EXTRACTED_PAIEMENTS.txt:344-349` — CDC chiffrement AES-256, masquage IBAN
  - `docs/EXTRACTED_PAIEMENTS.txt:1150-1154` — Annexe G sécurité données sensibles

  **Acceptance Criteria**:
  - [ ] EncryptionService encrypt/decrypt fonctionne (round-trip)
  - [ ] IbanMaskingService masque correctement (FR76 **** **** 1234)
  - [ ] Aucun IBAN en clair dans les logs gRPC
  - [ ] Clé de chiffrement via env var uniquement

  **Agent-Executed QA Scenarios**:
  ```
  Scenario: Encryption round-trip
    Tool: Bash
    Steps:
      1. Run unit test: encrypt("FR7630006000011234567890189") then decrypt result
      2. Assert: decrypted === original
      3. Assert: encrypted !== original (is ciphertext)
    Evidence: Test output

  Scenario: IBAN masking
    Tool: Bash
    Steps:
      1. Call mask("FR7630006000011234567890189")
      2. Assert: result === "FR76 **** **** 0189"
    Evidence: Test output
  ```

  **Commit**: YES
  - Message: `feat(finance): add AES-256 encryption service and IBAN masking`
  - Files: `services/service-finance/src/infrastructure/security/*.ts`

---

### Wave 2 — PSP Connectors

- [ ] 4. Connecteur Slimpay (SEPA Direct Debit)

  **What to do**:
  - Créer `SlimpayApiService` dans `src/infrastructure/psp/slimpay/` :
    - OAuth2 authentication (client_credentials flow)
    - Token caching avec expiration
    - Méthodes : createPayment, getPayment, createMandate, getMandate, cancelMandate
    - Mapping statuts via `ProviderStatusMappingEntity` (Annexe K.2)
  - Créer le controller gRPC Slimpay implémentant les RPCs du Task 2
  - Créer le webhook handler `/api/payments/webhooks/slimpay/{company_id}` :
    - Vérification HMAC SHA-256
    - Anti-replay 5 min
    - Idempotence via PSPEventInbox
    - Mapping événements : created→PENDING, accepted→SUBMITTED, executed→PAID, rejected+AM04→REJECT_INSUFF_FUNDS, rejected+autre→REJECT_OTHER
  - Intégrer avec PaymentEventEntity pour logging

  **Must NOT do**:
  - Ne PAS stocker d'IBAN en clair (utiliser EncryptionService du Task 3)
  - Ne PAS hardcoder les credentials (env vars / SlimpayAccountEntity)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: [`microservice-maintainer`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 5, 6)
  - **Blocks**: Tasks 11, 12
  - **Blocked By**: Tasks 1, 2, 3

  **References**:
  - `services/service-finance/src/domain/payments/entities/slimpay-account.entity.ts` — Entité existante
  - `services/service-finance/src/domain/payments/entities/psp-event-inbox.entity.ts` — Pattern webhook inbox
  - `services/service-finance/src/domain/payments/entities/payment-event.entity.ts` — Pattern event logging
  - Slimpay API docs : https://dev.slimpay.com
  - `docs/EXTRACTED_PAIEMENTS.txt:2073-2086` — Annexe T.3.1 checklist Slimpay
  - `docs/EXTRACTED_PAIEMENTS.txt:1445-1454` — Annexe K.2 mapping Slimpay

  **Acceptance Criteria**:
  - [ ] OAuth2 token obtenu depuis sandbox Slimpay
  - [ ] createPayment retourne un payment_id
  - [ ] Webhook HMAC vérifié correctement
  - [ ] Mapping statuts : executed→PAID, rejected+AM04→REJECT_INSUFF_FUNDS
  - [ ] PaymentEvent créé pour chaque changement de statut

  **Commit**: YES
  - Message: `feat(finance): add Slimpay PSP connector with OAuth2, webhooks and status mapping`

---

- [ ] 5. Connecteur MultiSafepay (Cartes bancaires)

  **What to do**:
  - Créer `MultiSafepayApiService` dans `src/infrastructure/psp/multisafepay/` :
    - Auth par API key
    - Méthodes : createTransaction, getTransaction, refundTransaction
    - Mapping statuts Annexe K.3 (completed→PAID, declined→REJECT_OTHER, chargeback→REJECT_INSUFF_FUNDS)
  - Controller gRPC + webhook handler avec HMAC
  - Zéro stockage PAN/CVV — tokens PSP uniquement

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: [`microservice-maintainer`]

  **Parallelization**: Wave 2 (with 4, 6) | Blocks: 11, 12 | Blocked By: 1, 2, 3

  **References**:
  - `docs/EXTRACTED_PAIEMENTS.txt:1456-1466` — Annexe K.3 mapping MSP
  - `docs/EXTRACTED_PAIEMENTS.txt:2100-2112` — Annexe T.3.3 checklist MSP
  - MSP docs : https://docs.multisafepay.com/api/

  **Acceptance Criteria**:
  - [ ] Transaction créée en sandbox MSP
  - [ ] Mapping : completed→PAID, declined→REJECT_OTHER, chargeback→REJECT_INSUFF_FUNDS
  - [ ] Aucun PAN/CVV en base

  **Commit**: YES
  - Message: `feat(finance): add MultiSafepay PSP connector for card payments`

---

- [ ] 6. Connecteur Emerchantpay (SEPA + Cartes)

  **What to do**:
  - Créer `EmerchantpayApiService` dans `src/infrastructure/psp/emerchantpay/`
  - Support double mode : SEPA Direct Debit + Card payments
  - Mapping Annexe K.4 (settled→PAID, returned+AM04→REJECT_INSUFF_FUNDS)
  - Controller gRPC + webhook handler

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: [`microservice-maintainer`]

  **Parallelization**: Wave 2 (with 4, 5) | Blocks: 11, 12 | Blocked By: 1, 2, 3

  **References**:
  - `docs/EXTRACTED_PAIEMENTS.txt:1468-1478` — Annexe K.4 mapping EMP
  - `docs/EXTRACTED_PAIEMENTS.txt:2113-2125` — Annexe T.3.4 checklist EMP
  - EMP docs : https://docs.emerchantpay.com/

  **Acceptance Criteria**:
  - [ ] Paiement SEPA et CB créés en sandbox EMP
  - [ ] Mapping : settled→PAID, returned+AM04→REJECT_INSUFF_FUNDS, declined→REJECT_OTHER

  **Commit**: YES
  - Message: `feat(finance): add Emerchantpay PSP connector for SEPA and card payments`

---

### Wave 3 — Moteurs & Services

- [ ] 7. Moteur de routage dynamique fournisseurs

  **What to do**:
  - Créer `RoutingEngineService` dans `src/infrastructure/persistence/typeorm/repositories/payments/` :
    - `evaluateRouting(payment, company): ProviderRoutingRuleEntity` — évalue les rules par priorité
    - Support conditions JSONB : source_channel, contract_age_months_gte, product_code, debit_lot_code_in, preferred_debit_day_in, risk_tier
    - Fallback rule si aucune correspondance
    - Logging : PaymentEvent(ROUTING_DECISION) avec payload_in/payload_out
  - Créer `ProviderOverrideService` — overrides client/contrat
  - Créer `ReassignmentJobService` — migrations en lot :
    - Dry-run (simulation sans exécution)
    - Exécution planifiée
    - Rapport CSV
    - Rollback
  - Controller gRPC pour toutes les RPCs routage du Task 2
  - Alerte PROVIDER_ROUTING_NOT_FOUND si aucune règle valide

  **Must NOT do**:
  - Ne PAS modifier le code d'émission existant — le routage est appelé AVANT l'émission
  - Ne PAS évaluer le scoring dans ce service (le scoring est un input, pas un calcul ici)

  **Recommended Agent Profile**:
  - **Category**: `ultrabrain`
  - **Skills**: [`microservice-maintainer`]

  **Parallelization**: Wave 3 (with 8, 9, 10) | Blocks: 15, 18 | Blocked By: 1, 2

  **References**:
  - `docs/EXTRACTED_PAIEMENTS.txt:173-253` — CDC Section 4 routage complet
  - `docs/EXTRACTED_PAIEMENTS.txt:840-918` — Annexe C routage détaillé
  - `services/service-finance/src/domain/payments/entities/retry-policy.entity.ts:38-39` — Pattern JSONB conditions

  **Acceptance Criteria**:
  - [ ] Routage évalue les rules par priorité
  - [ ] Fallback rule utilisée si aucune correspondance
  - [ ] Override client/contrat prend la priorité sur les rules
  - [ ] Dry-run reassignment retourne la liste sans exécuter
  - [ ] Log ROUTING_DECISION créé à chaque évaluation

  **Commit**: YES
  - Message: `feat(finance): add dynamic provider routing engine with rules, overrides and reassignment`

---

- [ ] 8. Service mapping statuts PSP

  **What to do**:
  - Créer `ProviderStatusMappingService` :
    - `mapStatus(provider, rawStatus, rawReason?): { statusCode, retryAdvice }` — lookup dans provider_status_mapping
    - Cache en mémoire (chargé au démarrage, invalidé sur update)
    - Alerte si statut inconnu (non mappé)
  - Intégrer dans les webhook handlers des Tasks 4/5/6
  - Controller gRPC pour CRUD des mappings

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: [`microservice-maintainer`]

  **Parallelization**: Wave 3 (with 7, 9, 10) | Blocks: 4, 5, 6 (intégration) | Blocked By: 1

  **References**:
  - `docs/EXTRACTED_PAIEMENTS.txt:1429-1495` — Annexe K complète

  **Acceptance Criteria**:
  - [ ] mapStatus("slimpay", "executed", null) → { statusCode: "PAID", retryAdvice: "NONE" }
  - [ ] mapStatus("slimpay", "rejected", "AM04") → { statusCode: "REJECT_INSUFF_FUNDS", retryAdvice: "AUTO" }
  - [ ] Statut inconnu → alerte générée

  **Commit**: YES
  - Message: `feat(finance): add provider status mapping service with cache and unknown status alerts`

---

- [ ] 9. RUM Generator Service

  **What to do**:
  - Créer `RumGeneratorService` :
    - Format : `{ICS}-{ContractID}-{YYYY}` (Annexe L)
    - Validation unicité (company_id, mandate_reference)
    - Hash SHA-256 stocké pour vérification intégrité
    - Support multi-contrats / RUM partagé (dossier souscription)
  - Intégrer avec GoCardlessMandateEntity.rum

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: [`microservice-maintainer`]

  **Parallelization**: Wave 3 (with 7, 8, 10) | Blocked By: 1

  **References**:
  - `docs/EXTRACTED_PAIEMENTS.txt:1496-1554` — Annexe L politique RUM
  - `services/service-finance/src/domain/payments/entities/gocardless-mandate.entity.ts:39-41` — rum: unique, 35 chars

  **Acceptance Criteria**:
  - [ ] Génère RUM format `FT123456789-CTR-2025-00045-2025`
  - [ ] Unicité vérifiée (erreur si doublon)
  - [ ] Hash SHA-256 stocké

  **Commit**: YES
  - Message: `feat(finance): add SEPA RUM generator service per CDC Annex L`

---

- [ ] 10. Archivage automatique

  **What to do**:
  - Créer table `payments_archive` (même structure que payments, read-only)
  - Créer `ArchiveSchedulerService` :
    - Job quotidien 03:00
    - Déplace paiements soldés (PAID, REFUNDED, CANCELLED, REJECT_OTHER) après J+30
    - Paramétrable par société (archive_policy)
    - Archive les customer_interactions liées à J+90
    - Archive les payment_portal_sessions expirées à J+7
  - Les paiements archivés : lecture seule, exclus des jobs (retry, routing, scoring)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: [`microservice-maintainer`]

  **Parallelization**: Wave 3 (with 7, 8, 9) | Blocks: 19 | Blocked By: 1

  **References**:
  - `docs/EXTRACTED_PAIEMENTS.txt:146-151` — CDC Section 3.4 archivage
  - `docs/EXTRACTED_PAIEMENTS.txt:1073-1138` — Annexe F archivage détaillé

  **Acceptance Criteria**:
  - [ ] Job archive exécutable manuellement
  - [ ] Paiement PAID créé il y a 31 jours → déplacé dans archive
  - [ ] Paiement archivé inaccessible aux jobs retry/routing
  - [ ] Customer interactions archivées à J+90

  **Commit**: YES
  - Message: `feat(finance): add automatic payment archival scheduler with configurable retention`

---

### Wave 4 — Finance

- [ ] 11. Rapprochement bancaire CAMT.053

  **What to do**:
  - Créer `ReconciliationService` :
    - Import CAMT.053 XML (parser ISO 20022)
    - Import CSV banque
    - Appariement automatique :
      - Priorité 1 : (provider_ref ou rum) exact match
      - Priorité 2 : (montant + date ±2 jours) si RUM manquant
      - Priorité 3 : (customer_ref + montant) si doublon
    - Statuts réconciliation : AUTO_MATCHED, MANUAL_MATCHED, TO_VERIFY, UNMATCHED
    - Intégration paiements portail (portal.payment_approved pré-rapprochés)
  - Créer l'entité `ReconciliationEntity` (table reconciliations) : id, payment_id, bank_ref, match_type, status, reconciled_at
  - Créer les alertes : RECONCILIATION_MISMATCH, RECONCILIATION_UNMATCHED, PORTAL_MATCH_FAILED
  - Controller gRPC pour les RPCs reconciliation

  **Recommended Agent Profile**:
  - **Category**: `ultrabrain`
  - **Skills**: [`microservice-maintainer`]

  **Parallelization**: Wave 4 (with 12, 13) | Blocks: 17 | Blocked By: 4, 5, 6

  **References**:
  - `docs/EXTRACTED_PAIEMENTS.txt:1628-1701` — Annexe N rapprochement complet
  - ISO 20022 CAMT.053 : format XML standard

  **Acceptance Criteria**:
  - [ ] Parse fichier CAMT.053 XML sans erreur
  - [ ] Appariement exact match (provider_ref) fonctionne
  - [ ] Appariement fuzzy (montant + date ±2j) fonctionne
  - [ ] Paiements portail pré-rapprochés (AUTO_MATCHED)
  - [ ] Alerte UNMATCHED si non trouvé après 48h

  **Commit**: YES
  - Message: `feat(finance): add CAMT.053 bank reconciliation with auto-matching and portal integration`

---

- [ ] 12. Exports comptables asynchrones

  **What to do**:
  - Créer `ExportService` :
    - Génération CSV (séparateur ;, UTF-8)
    - Génération XLSX (bibliothèque exceljs ou xlsx)
    - Génération JSON
    - Colonnes enrichies (Annexe J) : entry_id, company_id, journal_code, entry_date, document_ref, account_debit/credit, amounts, customer_ref, contract_ref, provider_name/ref, status_code, preferred_debit_day, debit_lot_code, planned_debit_date, risk_score, risk_tier, reminder_count
    - Exécution en tâche de fond (job queue)
    - Lien signé 24h (JWT/signed URL)
    - Mapping statuts comptables (Annexe J.6) : PAID→BAN/CLIENT, REJECT_INSUFF→contre-passation, REFUNDED→sortie trésorerie
  - Planification auto : quotidien 06:00, hebdo lundi 06:30, mensuel 1er 07:00
  - Envoi SFTP cabinet (optionnel, configurable)
  - Compression ZIP + hash SHA-256

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: [`microservice-maintainer`]

  **Parallelization**: Wave 4 (with 11, 13) | Blocks: 17 | Blocked By: 1, 2

  **References**:
  - `docs/EXTRACTED_PAIEMENTS.txt:1336-1428` — Annexe J exports complet
  - `services/service-finance/src/domain/factures/entities/facture-settings.entity.ts` — Pattern settings par société

  **Acceptance Criteria**:
  - [ ] Export CSV généré avec toutes les colonnes Annexe J
  - [ ] Export XLSX avec onglets formatés
  - [ ] Lien signé fonctionnel (expire après 24h)
  - [ ] Mapping comptable correct (PAID → écriture BAN/CLIENT)
  - [ ] Fichier hashé SHA-256

  **Commit**: YES
  - Message: `feat(finance): add async accounting export service with CSV/XLSX/JSON and signed URLs`

---

- [ ] 13. Système d'alertes multi-canal

  **What to do**:
  - Créer `AlertService` :
    - Création/résolution d'alertes
    - Notification multi-canal : Email (nodemailer/sendgrid), Slack (webhook), UI (NATS event)
    - Acquittement par utilisateur autorisé
    - Historisation 24 mois
  - Implémenter les 9 codes d'alerte du CDC :
    - PROVIDER_ROUTING_NOT_FOUND (critique)
    - API_CREDENTIALS_INVALID (critique)
    - PAYMENT_NOT_SUBMITTED (majeure)
    - REJECT_SPIKES >20% (majeure)
    - BATCH_DAY_EMPTY (majeure)
    - CUTOFF_MISSED (majeure)
    - HIGH_RISK_MISROUTED (critique)
    - HIGH_RISK_SCORE (majeure)
    - FAILED_REMINDER (mineure)
  - Intégrer avec les services existants (retry, calendar, routing) pour déclencher les alertes

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: [`microservice-maintainer`]

  **Parallelization**: Wave 4 (with 11, 12) | Blocks: 22 | Blocked By: 1, 2

  **References**:
  - `docs/EXTRACTED_PAIEMENTS.txt:254-311` — CDC Section 5 alertes
  - `docs/EXTRACTED_PAIEMENTS.txt:1021-1072` — Annexe E monitoring et alertes
  - `services/service-finance/src/domain/calendar/entities/volume-threshold.entity.ts:32-35` — Pattern alertOnExceed existant

  **Acceptance Criteria**:
  - [ ] Alerte REJECT_SPIKES déclenchée si taux rejet > 20%
  - [ ] Notification email envoyée
  - [ ] Alerte acquittable via gRPC
  - [ ] Historique conservé 24 mois

  **Commit**: YES
  - Message: `feat(finance): add multi-channel alert system with 9 CDC alert codes`

---

### Wave 5 — Scoring IA

- [ ] 14. Scoring Engine backend (micro-service Python)

  **What to do**:
  - Créer un micro-service Python (FastAPI) : `services/service-scoring/`
    - Endpoint : `POST /predict` → score 0-100 + risk_tier + factors
    - Modèle ML : Random Forest ou XGBoost sur historique impayés
    - Variables : prev_rejects, channel, contract_age, payment_history, lot, provider
    - Entraînement : script `train.py` avec données historiques
    - Recalibrage mensuel automatique
    - Pseudonymisation : pas de PII dans les variables d'entraînement
  - Créer un adapter NestJS dans service-finance : `ScoringClientService`
    - Appel HTTP vers service-scoring
    - Stockage résultat dans `RiskScoreEntity`
    - Fallback si service indisponible (score par défaut = MEDIUM)
  - Dockerfile + docker-compose pour le service scoring

  **Recommended Agent Profile**:
  - **Category**: `ultrabrain`
  - **Skills**: [`microservice-maintainer`]

  **Parallelization**: Wave 5 (with 15, 16) | Blocks: 15, 20 | Blocked By: 1

  **References**:
  - `docs/EXTRACTED_PAIEMENTS.txt:557-563` — CDC tests scoring
  - `docs/EXTRACTED_PAIEMENTS.txt:1142-1207` — Annexe G scoring gouvernance
  - `compose/staging/service-payments.yml` — Pattern docker-compose existant

  **Acceptance Criteria**:
  - [ ] Service Python démarre et répond à /predict
  - [ ] Score 0-100 retourné avec risk_tier (LOW/MEDIUM/HIGH)
  - [ ] Facteurs expliqués dans la réponse (factors JSONB)
  - [ ] Fallback MEDIUM si service indisponible
  - [ ] Pseudonymisation : aucun customer_id dans les variables d'entraînement

  **Commit**: YES
  - Message: `feat(scoring): add ML-based risk scoring microservice with training pipeline`

---

- [ ] 15. Intégration scoring → routage & retry

  **What to do**:
  - Modifier `RoutingEngineService` (Task 7) pour supporter la condition `risk_tier` dans les rules
  - Si risk_tier = HIGH :
    - Option A : forcer PSP plus fiable (Slimpay/GoCardless)
    - Option B : forcer lot plus précoce (L1/L2)
  - Intégrer dans le retry scheduler : si HIGH → possibilité de suspendre auto-retry
  - Log ROUTING_OVERRIDE(reason=HIGH_RISK) dans payment_logs

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: [`microservice-maintainer`]

  **Parallelization**: Wave 5 (with 16) | Blocks: 20 | Blocked By: 7, 14

  **References**:
  - `docs/EXTRACTED_PAIEMENTS.txt:795-808` — Annexe B.4 scoring & retry
  - `docs/EXTRACTED_PAIEMENTS.txt:221-225` — Scoring interaction routage

  **Acceptance Criteria**:
  - [ ] Paiement HIGH risk → routé vers PSP fiable selon rule
  - [ ] Log ROUTING_OVERRIDE créé avec reason=HIGH_RISK
  - [ ] Retry suspendable pour HIGH risk

  **Commit**: YES
  - Message: `feat(finance): integrate risk scoring with routing engine and retry scheduler`

---

- [ ] 16. Customer interactions table

  **What to do**:
  - Intégrer `CustomerInteractionEntity` (créée Task 1) avec le ReminderEntity existant
  - Créer `CustomerInteractionService` :
    - Enregistrement de chaque relance (email/SMS/call) dans customer_interactions
    - Lien avec payment_id et customer_id
    - Statuts : SENT, FAILED, QUEUED
    - Export historique
  - Bridge entre Reminder (existant) et CustomerInteraction (nouveau)

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: [`microservice-maintainer`]

  **Parallelization**: Wave 5 (with 14, 15) | Blocks: 20 | Blocked By: 1

  **References**:
  - `services/service-finance/src/domain/payments/entities/reminder.entity.ts` — Reminder existant
  - `docs/EXTRACTED_PAIEMENTS.txt:716-720` — Table customer_interactions CDC

  **Acceptance Criteria**:
  - [ ] Reminder envoyé → CustomerInteraction créée
  - [ ] Historique exportable par customer_id

  **Commit**: YES
  - Message: `feat(finance): add customer interactions tracking bridged with existing reminders`

---

### Wave 6 — Frontend

- [ ] 17. Écran Calendrier / Émission planifiée (heatmap)

  **What to do**:
  - Créer page `/paiements/calendrier` avec :
    - Vue calendrier mensuel (jours 1-28) affichant les paiements planifiés
    - Heatmap volumes par jour (vert→faible, rouge→élevé)
    - Filtres : société, lot (L1-L4), PSP, scoring, statut
    - Résumé volumes par jour + total semaine
    - Actions rapides : émettre maintenant, ajuster lot, voir logs
    - Widget "Aujourd'hui : N paiements — Σ montant"
  - gRPC client pour les données calendar/planned_debit

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: [`frontend-ui-ux`]

  **Parallelization**: Wave 6 (with 18, 19, 20, 21) | Blocked By: 11, 12

  **References**:
  - `frontend/src/components/payments/payment-table.tsx` — Pattern table existant
  - `frontend/src/components/payments/payment-filters.tsx` — Pattern filtres
  - `docs/EXTRACTED_PAIEMENTS.txt:386-413` — CDC UX écrans

  **Acceptance Criteria**:
  - [ ] Heatmap affiche les volumes par jour
  - [ ] Filtres par lot L1-L4 fonctionnels
  - [ ] Actions rapides cliquables
  - [ ] Données chargées via gRPC

  **Agent-Executed QA Scenarios**:
  ```
  Scenario: Calendar page loads with heatmap
    Tool: Playwright
    Steps:
      1. Navigate to /paiements/calendrier
      2. Wait for heatmap grid visible (timeout: 10s)
      3. Assert: 28 day cells visible
      4. Assert: volume numbers displayed per day
      5. Screenshot: .sisyphus/evidence/task-17-calendar.png
    Evidence: .sisyphus/evidence/task-17-calendar.png
  ```

  **Commit**: YES
  - Message: `feat(frontend): add payment calendar page with volume heatmap and lot filters`

---

- [ ] 18. Écran Routage Finance (Direction Financière)

  **What to do**:
  - Créer page `/paiements/routage` avec :
    - Liste des routing rules avec priorité, conditions, PSP cible
    - CRUD rules (créer, éditer, supprimer, réordonner)
    - Testeur de règle : saisir un contrat/paiement → simulation du PSP attribué
    - Vue analytique : répartition volumes PSP/jour/lot/scoring
    - Gestion des overrides (client/contrat)
    - Lancement migration par lot (dry-run + exécution)

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: [`frontend-ui-ux`]

  **Parallelization**: Wave 6 (with 17, 19, 20, 21) | Blocked By: 7

  **References**:
  - `docs/EXTRACTED_PAIEMENTS.txt:236-253` — CDC UX routage
  - `frontend/src/components/commissions/commission-config-dialog.tsx` — Pattern config dialog existant

  **Acceptance Criteria**:
  - [ ] Liste des rules affichée avec drag-and-drop pour priorité
  - [ ] Création/édition rule avec conditions JSONB
  - [ ] Testeur simule le PSP attribué

  **Commit**: YES
  - Message: `feat(frontend): add provider routing management page for Finance direction`

---

- [ ] 19. Écran Paiements archivés

  **What to do**:
  - Créer page `/paiements/archives` avec :
    - Vue séparée lecture seule des paiements archivés
    - Filtres : société, jour, lot, statut, PSP, commercial, période
    - Export asynchrone CSV/XLSX (lien signé 24h)
  - gRPC client vers payments_archive

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: [`frontend-ui-ux`]

  **Parallelization**: Wave 6 (with 17, 18, 20, 21) | Blocked By: 10

  **References**:
  - `docs/EXTRACTED_PAIEMENTS.txt:400-403` — CDC écran archivés
  - `frontend/src/components/payments/payment-table.tsx` — Réutiliser le pattern

  **Acceptance Criteria**:
  - [ ] Données en lecture seule (pas de bouton éditer/supprimer)
  - [ ] Export CSV fonctionnel avec lien signé

  **Commit**: YES
  - Message: `feat(frontend): add archived payments page with export functionality`

---

- [ ] 20. Écran Scoring & Relances

  **What to do**:
  - Créer page `/paiements/scoring` avec :
    - Tableau des paiements triés par risque (LOW/MEDIUM/HIGH)
    - Indicateur score circulaire (vert <40, orange 40-70, rouge >70)
    - Actions : réassigner PSP, changer lot, déclencher relance
    - Historique relances (customer_interactions)
    - KPI scoring : précision, TPR/FPR, distribution

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: [`frontend-ui-ux`]

  **Parallelization**: Wave 6 (with 17, 18, 19, 21) | Blocked By: 15, 16

  **References**:
  - `docs/EXTRACTED_PAIEMENTS.txt:409-413` — CDC écran scoring

  **Acceptance Criteria**:
  - [ ] Indicateurs visuels score (vert/orange/rouge)
  - [ ] Actions rapides fonctionnelles
  - [ ] Historique relances affiché

  **Commit**: YES
  - Message: `feat(frontend): add scoring and reminders dashboard page`

---

- [ ] 21. WebSocket statuts temps réel

  **What to do**:
  - Ajouter un gateway WebSocket (NestJS @WebSocketGateway) dans service-finance
  - Émettre événement à chaque changement de statut paiement (webhook reçu)
  - Frontend : hook `usePaymentStatusStream` qui écoute les updates
  - Mise à jour instantanée des badges dans les tables de paiements

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: [`microservice-maintainer`]

  **Parallelization**: Wave 6 (with 17-20) | Blocked By: 1

  **References**:
  - `docs/EXTRACTED_PAIEMENTS.txt:394` — CDC WebSocket statuts

  **Acceptance Criteria**:
  - [ ] Changement statut via webhook → UI mise à jour en <5s
  - [ ] Pas de polling — WebSocket pur

  **Commit**: YES
  - Message: `feat(finance): add WebSocket gateway for real-time payment status updates`

---

### Wave 7 — Monitoring

- [ ] 22. Prometheus métriques

  **What to do**:
  - Ajouter `@willsoto/nestjs-prometheus` ou prom-client dans service-finance
  - Exposer les métriques :
    - `payment_api_latency_seconds` (histogram par PSP)
    - `payment_api_errors_total` (counter par PSP, status_code)
    - `payment_emissions_total` (counter par lot, PSP)
    - `payment_rejections_total` (counter par motif)
    - `webhook_processing_duration_seconds` (histogram)
    - `retry_queue_length` (gauge)
    - `alert_active_count` (gauge par severity)
    - `scoring_inference_duration_seconds` (histogram)
  - Endpoint `/metrics` (Prometheus scrape)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: [`microservice-maintainer`]

  **Parallelization**: Sequential | Blocks: 23 | Blocked By: 13

  **References**:
  - `docs/EXTRACTED_PAIEMENTS.txt:1030-1038` — Annexe E métriques

  **Acceptance Criteria**:
  - [ ] GET /metrics retourne des métriques Prometheus valides
  - [ ] payment_api_latency_seconds enregistré pour chaque appel PSP

  **Commit**: YES
  - Message: `feat(finance): add Prometheus metrics for payment operations monitoring`

---

- [ ] 23. Grafana dashboards

  **What to do**:
  - Créer les JSON de dashboard Grafana :
    - Vue IT : latence API par PSP, erreurs 4xx/5xx, files webhooks/retries, charge DB
    - Vue Finance : volumes émis, taux de rejet par PSP/lot, scoring moyen, alertes actives
    - Vue Direction : SLA consolidés, disponibilité, incidents majeurs
  - Provisioning automatique via docker-compose

  **Recommended Agent Profile**:
  - **Category**: `unspecified-low`
  - **Skills**: [`microservice-maintainer`]

  **Parallelization**: Sequential | Blocked By: 22

  **References**:
  - `docs/EXTRACTED_PAIEMENTS.txt:1057-1060` — Annexe E dashboards

  **Acceptance Criteria**:
  - [ ] 3 dashboards JSON créés
  - [ ] Import Grafana sans erreur

  **Commit**: YES
  - Message: `feat(infra): add Grafana dashboard definitions for payment monitoring (IT/Finance/Direction)`

---

### Wave 8 — Tests

- [ ] 24. Tests fonctionnels par bloc

  **What to do**:
  - Tests unitaires : EncryptionService, IbanMaskingService, RumGeneratorService, RoutingEngine, StatusMapping, ReconciliationService
  - Tests d'intégration : webhook handler (HMAC, idempotence), export generation, alert triggering
  - Scénarios CDC Section 9 :
    - Planification jour fixe → planned_debit_date correct
    - Émission automatique → seuls planned_debit_date=today envoyés
    - Routage par lot → L1/L2→MSP, L3/L4→EMP
    - Réémission AM04 → J+5/J+10/J+20
    - Archivage J+30
    - Portail paiement → status=PAID

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: [`microservice-maintainer`]

  **Parallelization**: Wave 8 (with 25, 26) | Blocked By: All above

  **References**:
  - `docs/EXTRACTED_PAIEMENTS.txt:516-590` — CDC Section 9 tests

  **Acceptance Criteria**:
  - [ ] `bun test` dans service-finance → 100% pass
  - [ ] Couverture des scénarios CDC Section 9.2

  **Commit**: YES
  - Message: `test(finance): add functional and integration tests for payment module CDC compliance`

---

- [ ] 25. Tests de charge

  **What to do**:
  - Script JMeter/k6 pour :
    - 10 000 paiements émis simultanément
    - 100 webhooks/s pendant 5 min
    - Export 100k lignes < 2 min
  - Vérifier : latence <3s, 0 perte webhook, exports <2 min

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: [`microservice-maintainer`]

  **Parallelization**: Wave 8 (with 24, 26) | Blocked By: 24

  **References**:
  - `docs/EXTRACTED_PAIEMENTS.txt:539-548` — CDC tests charge

  **Acceptance Criteria**:
  - [ ] 10k émissions : latence moyenne <3s
  - [ ] 100 webhooks/s : 0 perte, traitement <5 min

  **Commit**: YES
  - Message: `test(finance): add load tests (10k payments, 100 webhooks/s) per CDC Section 9.3`

---

- [ ] 26. Tests sécurité

  **What to do**:
  - Vérifier HMAC webhooks (signature invalide → 401)
  - Vérifier anti-replay (5 min)
  - Vérifier AES-256 (IBAN chiffré en base, déchiffré à l'usage)
  - Vérifier masquage IBAN dans les logs
  - Vérifier RBAC (rôles non autorisés → 403)
  - Vérifier 0 PAN/CVV en base

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: [`microservice-maintainer`]

  **Parallelization**: Wave 8 (with 24, 25) | Blocked By: 24

  **References**:
  - `docs/EXTRACTED_PAIEMENTS.txt:550-555` — CDC tests sécurité

  **Acceptance Criteria**:
  - [ ] Webhook sans HMAC → 401
  - [ ] Webhook replay >5 min → 401
  - [ ] IBAN en base = ciphertext AES-256
  - [ ] Grep logs : 0 occurrence IBAN en clair

  **Commit**: YES
  - Message: `test(finance): add security tests (HMAC, AES-256, IBAN masking, RBAC) per CDC Section 9.4`

---

## Commit Strategy

| Wave | After Task(s) | Message | Verification |
|------|--------------|---------|--------------|
| 1 | 1 | `feat(finance): add foundation entities` | bun run build |
| 1 | 2 | `feat(proto): add new RPCs` | bun run proto:generate |
| 1 | 3 | `feat(finance): add AES-256 encryption` | unit tests |
| 2 | 4 | `feat(finance): add Slimpay connector` | sandbox test |
| 2 | 5 | `feat(finance): add MultiSafepay connector` | sandbox test |
| 2 | 6 | `feat(finance): add Emerchantpay connector` | sandbox test |
| 3 | 7 | `feat(finance): add routing engine` | integration test |
| 3 | 8 | `feat(finance): add status mapping` | unit test |
| 3 | 9 | `feat(finance): add RUM generator` | unit test |
| 3 | 10 | `feat(finance): add archival scheduler` | integration test |
| 4 | 11 | `feat(finance): add CAMT.053 reconciliation` | XML parse test |
| 4 | 12 | `feat(finance): add accounting exports` | export test |
| 4 | 13 | `feat(finance): add alert system` | alert trigger test |
| 5 | 14 | `feat(scoring): add ML scoring service` | predict test |
| 5 | 15 | `feat(finance): integrate scoring→routing` | integration test |
| 5 | 16 | `feat(finance): add customer interactions` | unit test |
| 6 | 17-21 | `feat(frontend): add payment module pages` | Playwright |
| 7 | 22-23 | `feat(infra): add monitoring` | /metrics test |
| 8 | 24-26 | `test(finance): add all tests` | bun test |

---

## Success Criteria

### Verification Commands
```bash
cd services/service-finance && bun run build           # Expected: success
cd services/service-finance && bun test                 # Expected: all pass
cd packages/proto && bun run proto:generate             # Expected: success
curl http://localhost:3002/metrics                      # Expected: Prometheus metrics
```

### Final Checklist
- [ ] 4 PSP fonctionnels (GoCardless + Slimpay + MSP + EMP)
- [ ] Routage dynamique avec rules, overrides, reassignment
- [ ] Rapprochement CAMT.053 opérationnel
- [ ] Exports CSV/XLSX/JSON fonctionnels
- [ ] 9 alertes CDC implémentées
- [ ] Scoring IA score 0-100 + risk_tier
- [ ] 6 écrans frontend complets
- [ ] WebSocket statuts temps réel
- [ ] AES-256 IBAN + masquage
- [ ] RUM Generator format CDC
- [ ] Archivage auto J+30
- [ ] Prometheus + Grafana
- [ ] Tests fonctionnels + charge + sécurité passants
- [ ] Aucun PAN/CVV en base (PCI-DSS)
- [ ] Aucune credential hardcodée
