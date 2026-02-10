# Implémentation Complète Depanssur dans Winvest CRM

## TL;DR

> **Quick Summary**: Implémenter toutes les fonctionnalités manquantes du cahier des charges Depanssur dans le CRM Winvest — abonnements avec carence/franchise/plafonds, dossiers déclaratifs miroir, webhooks de synchronisation, dunning, jobs automatisés, notifications, avoirs, et reporting (MRR/churn/NPS/DSO/sinistralité).
>
> **Deliverables**:
> - Entités Abonnement Depanssur (plan, carence, franchise, plafonds, options, compteurs)
> - Entité Dossier Déclaratif miroir avec workflow statut
> - Extensions Client (civilité, consentements RGPD, adresse de risque)
> - Webhook receiver + outgoing API Depanssur
> - Règles métier (carence, plafonds, upgrade/downgrade)
> - Avoirs (credit notes) dans service-finance
> - Séquence dunning Depanssur (J0/J+5/J+10)
> - Jobs automatisés (quotidiens + hebdomadaires)
> - Notifications email/SMS Depanssur
> - Dashboard reporting (MRR, churn, sinistralité, NPS, DSO)
> - Pages frontend (abonnement, dossier déclaratif, souscription, reporting)
> - Tests unitaires pour toute la logique métier
>
> **Estimated Effort**: XL
> **Parallel Execution**: YES - 6 waves
> **Critical Path**: Task 1 → Task 3 → Task 7 → Task 9 → Task 14 → Task 17

---

## Context

### Original Request
Analyser le cahier des charges "Gestion des clients Depanssur.docx" et implémenter tout ce qui manque au CRM pour gérer les demandes Depanssur.

### Interview Summary
**Key Discussions**:
- **Localisation Dossier Déclaratif**: Dans `service-core` (pas de nouveau service)
- **Phasage**: Tout d'un coup (pas de phases séparées)
- **API Depanssur externe**: N'existe pas encore — webhooks designés from scratch
- **Tests**: Tests-after (implémenter d'abord, tests unitaires ensuite)

**Research Findings**:
- CRM = monorepo NestJS 5 microservices (core, commercial, finance, engagement, logistics)
- Architecture DDD avec bounded contexts, TypeORM, gRPC + NATS, PostgreSQL
- Frontend Next.js 16 + React 19 + Tailwind 4 + shadcn/ui
- 127 entités existantes, 100+ endpoints gRPC
- `DemandeConciergerieEntity` et `CasJuridiqueEntity` dans service-engagement comme pattern similaire
- Test infra Jest configurée partout, tests Bun dans service-commercial
- Multi-PSP paiement déjà intégré (Stripe, PayPal, GoCardless, Slimpay, MultiSafepay, Emerchantpay)
- Commission management complet (barèmes, paliers, bordereaux, récurrentes)
- Retry/reminder policies existent dans service-finance

### Self-Review (en lieu de Metis)
**Gaps identifiés et résolus**:
- Abonnement = nouvelle entité `AbonnementDepanssurEntity` liée à `ClientBaseEntity` (pas extension de `ContratEntity` car sémantique différente — abonnement assurance ≠ contrat commercial)
- Options abonnement = entité séparée `OptionAbonnementEntity` pour queryabilité
- Compteurs plafonds = entité `CompteurPlafondEntity` pour audit trail
- Avoirs = extension de `FactureEntity` avec discriminateur `type` (FACTURE/AVOIR)
- Un seul abonnement Depanssur actif par client (CDC ne mentionne pas le multi-abonnement)
- Année glissante pour les plafonds = depuis date_effet, pas calendaire
- Webhook idempotency = déduplication par `referenceExterne` + `eventType`

---

## Work Objectives

### Core Objective
Rendre le CRM Winvest capable de gérer le cycle de vie complet des clients Depanssur : souscription, abonnement, dossiers déclaratifs, encaissements, dunning, et reporting — en mode back-office miroir synchronisé avec l'outil métier Depanssur.

### Concrete Deliverables
- 8+ nouvelles entités TypeORM dans service-core
- 2+ nouvelles entités dans service-finance
- Proto definitions gRPC pour le bounded context Depanssur
- REST controller webhook dans service-core
- 5+ NATS events pour le domaine Depanssur
- 3 jobs automatisés (cron)
- 7 templates de notification
- 6 nouvelles pages/onglets frontend
- 5 KPIs reporting (MRR, churn, sinistralité, NPS, DSO)
- Tests unitaires pour les règles métier

### Definition of Done
- [ ] Toutes les entités CDC §3 créées avec migrations
- [ ] Tous les endpoints gRPC CRUD opérationnels
- [ ] Règles métier carence/plafonds/upgrade implémentées
- [ ] Webhooks Depanssur reçus et traités correctement
- [ ] Dunning séquence J0/J+5/J+10 fonctionnelle
- [ ] Notifications envoyées aux bons moments
- [ ] Dashboard reporting MRR/churn/NPS/DSO/sinistralité affiché
- [ ] Tests unitaires passent pour toute la logique métier

### Must Have
- Abonnement Depanssur avec carence, franchise, plafonds, options
- Dossier déclaratif miroir avec workflow statut complet
- Webhook receiver avec idempotency
- Contrôle carence (blocage dossier avant date_effet + carence)
- Compteurs plafonds annuels glissants
- Séquence dunning J0/J+5/J+10
- Reporting MRR et churn minimum

### Must NOT Have (Guardrails)
- Ne PAS modifier la structure des entités existantes (seulement ajouter des colonnes, jamais supprimer/renommer)
- Ne PAS créer de nouveau microservice — tout dans les services existants
- Ne PAS implémenter l'orchestration terrain (planning artisan, géoloc, devis réparations)
- Ne PAS implémenter de frontend client-facing (portail souscription public) — back-office uniquement
- Ne PAS toucher aux flows de paiement existants — étendre avec la séquence dunning Depanssur
- Ne PAS sur-abstraire : pas de generic "subscription engine", juste les entités Depanssur
- Ne PAS ajouter de dépendances npm inutiles — utiliser les libs existantes
- Migrations TOUJOURS additives (pas de DROP, pas de RENAME destructif)
- Proto files Depanssur dans un nouveau fichier dédié, ne pas bloater les protos existants

---

## Verification Strategy (MANDATORY)

> **UNIVERSAL RULE: ZERO HUMAN INTERVENTION**
>
> ALL tasks in this plan MUST be verifiable WITHOUT any human action.

### Test Decision
- **Infrastructure exists**: YES (Jest configured in all services)
- **Automated tests**: YES (Tests-after)
- **Framework**: Bun test (suivre le pattern `service-commercial/src/domain/commercial/services/__tests__/`)

### Agent-Executed QA Scenarios (MANDATORY — ALL tasks)

**Verification Tool by Deliverable Type:**

| Type | Tool | How Agent Verifies |
|------|------|-------------------|
| **Backend entities/migrations** | Bash | `npm run typeorm migration:run`, verify table exists via SQL |
| **gRPC endpoints** | Bash (grpcurl) | Call gRPC endpoint, assert response fields |
| **Webhook receiver** | Bash (curl) | POST webhook payload, verify 200 + entity created |
| **Business rules** | Bun test | Unit tests with edge cases |
| **Frontend pages** | Playwright | Navigate, interact, assert DOM |
| **Reporting** | Playwright | Navigate to dashboard, verify charts/KPIs |

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Start Immediately):
├── Task 1: Proto definitions Depanssur
└── Task 2: Client entity extensions (civilité, RGPD, adresse risque)

Wave 2 (After Wave 1):
├── Task 3: Abonnement Depanssur entities + gRPC (depends: 1)
├── Task 4: Dossier Déclaratif entities + gRPC (depends: 1)
└── Task 5: Avoirs dans service-finance (depends: 1)

Wave 3 (After Wave 2):
├── Task 6: Frontend - Extensions client (depends: 2)
├── Task 7: Règles métier Depanssur (depends: 3, 4)
├── Task 8: Webhook receiver + handlers (depends: 3, 4)
└── Task 9: Dunning séquence Depanssur (depends: 3, 5)

Wave 4 (After Wave 3):
├── Task 10: NATS events Depanssur (depends: 7, 8)
├── Task 11: Jobs automatisés (depends: 7, 9)
├── Task 12: Frontend - Onglet Abonnement (depends: 3)
└── Task 13: Frontend - Pages Dossier Déclaratif (depends: 4)

Wave 5 (After Wave 4):
├── Task 14: Notifications templates (depends: 10)
├── Task 15: Frontend - Souscription workflow (depends: 7, 12)
└── Task 16: Frontend - Reporting Depanssur (depends: 10, 11)

Wave 6 (After Wave 5):
└── Task 17: Tests unitaires logique métier (depends: all)

Critical Path: Task 1 → Task 3 → Task 7 → Task 10 → Task 14 → Task 17
Parallel Speedup: ~50% faster than sequential
```

### Dependency Matrix

| Task | Depends On | Blocks | Can Parallelize With |
|------|------------|--------|---------------------|
| 1 | None | 3, 4, 5 | 2 |
| 2 | None | 6 | 1 |
| 3 | 1 | 7, 8, 9, 12 | 4, 5 |
| 4 | 1 | 7, 8, 13 | 3, 5 |
| 5 | 1 | 9 | 3, 4 |
| 6 | 2 | None | 7, 8, 9 |
| 7 | 3, 4 | 10, 11, 15 | 8, 9, 6 |
| 8 | 3, 4 | 10 | 7, 9, 6 |
| 9 | 3, 5 | 11 | 7, 8, 6 |
| 10 | 7, 8 | 14, 16 | 11, 12, 13 |
| 11 | 7, 9 | 16 | 10, 12, 13 |
| 12 | 3 | 15 | 10, 11, 13 |
| 13 | 4 | None | 10, 11, 12 |
| 14 | 10 | None | 15, 16 |
| 15 | 7, 12 | None | 14, 16 |
| 16 | 10, 11 | None | 14, 15 |
| 17 | All | None | None (final) |

---

## TODOs

- [x] 1. Proto Definitions — Bounded Context Depanssur

  **What to do**:
  - Créer `packages/proto/src/depanssur/depanssur.proto` avec les messages et services gRPC :
    - **AbonnementDepanssur**: messages `CreateAbonnementRequest`, `UpdateAbonnementRequest`, `AbonnementResponse`, `ListAbonnementsRequest/Response`
    - **DossierDeclaratif**: messages `CreateDossierRequest`, `UpdateDossierRequest`, `DossierResponse`, `ListDossiersRequest/Response`
    - **OptionAbonnement**: messages CRUD
    - **CompteurPlafond**: messages pour lecture/MAJ compteurs
    - **ConsentementRGPD**: messages CRUD
    - **WebhookDepanssur**: messages `HandleWebhookRequest`, `HandleWebhookResponse`
  - Définir les enums :
    - `StatutAbonnement`: ACTIF, PAUSE, SUSPENDU_IMPAYE, RESILIE
    - `MotifResiliation`: VOLONTAIRE, IMPAYE, AUTRE
    - `TypeDossier`: ELECTRICITE, PLOMBERIE, ELECTROMENAGER, SERRURERIE, AUTRE
    - `StatutDossier`: ENREGISTRE, EN_ANALYSE, ACCEPTE, REFUSE, CLOTURE
    - `TypeAdresse`: FACTURATION, RISQUE
    - `TypeConsentement`: RGPD_EMAIL, RGPD_SMS, CGS_DEPANSSUR
  - Définir le service gRPC `DepanssurService` avec toutes les RPC
  - Régénérer les types TypeScript : `cd packages/proto && npm run gen:all` (utilise `buf generate`)
  - Les types générés seront dans `packages/proto/gen/ts/` (entry point auto-exporté via package.json)

  **Must NOT do**:
  - Ne PAS modifier les fichiers proto existants (clients.proto, contrats.proto, etc.)
  - Ne PAS définir de messages pour les fonctionnalités terrain (planning artisan, géoloc)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Proto definitions nécessitent une bonne compréhension du pattern existant et rigueur dans la définition des types
  - **Skills**: []
  - **Skills Evaluated but Omitted**:
    - `frontend-ui-ux`: Pas de frontend dans cette tâche

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Task 2)
  - **Blocks**: Tasks 3, 4, 5
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `packages/proto/src/contrats/contrats.proto` — Pattern de définition proto existant (messages, enums, service RPC) - suivre exactement cette structure
  - `packages/proto/src/clients/clients.proto` — Pattern CRUD proto pour les entités client (CreateRequest/Response, List avec pagination)
  - `packages/proto/src/services/conciergerie.proto` — Pattern similaire au Dossier Déclaratif (demande de service avec statut)
  - `packages/proto/src/payments/payment.proto` — Pattern avancé avec enums de statut et workflow

  **Documentation References**:
  - `docs/Gestion des clients Depanssur.docx` — CDC complet, §3 pour les champs, §4-5 pour les workflows et règles

  **WHY Each Reference Matters**:
  - `contrats.proto` : Le proto le plus proche structurellement — même pattern CRUD + orchestration à reproduire
  - `conciergerie.proto` : Concept de "demande de service avec statut" similaire au dossier déclaratif
  - CDC §3 : Source de vérité pour TOUS les champs de chaque entité

  **Acceptance Criteria**:
  - [ ] Fichier `packages/proto/src/depanssur/depanssur.proto` créé
  - [ ] Tous les enums définis : StatutAbonnement (4 valeurs), TypeDossier (5 valeurs), StatutDossier (5 valeurs), TypeAdresse (2 valeurs)
  - [ ] Service gRPC `DepanssurService` défini avec au minimum 12 RPC (CRUD abonnement + CRUD dossier + compteurs + webhook)
  - [ ] `npm run gen:all` exécuté sans erreur dans `packages/proto/`
  - [ ] Types TypeScript générés dans `packages/proto/gen/ts/`

  **Agent-Executed QA Scenarios**:

  ```
  Scenario: Proto compilation succeeds
    Tool: Bash
    Preconditions: packages/proto/ exists
    Steps:
      1. cd packages/proto && npm run gen:all
      2. Assert: exit code 0
      3. Assert: generated files exist in packages/proto/gen/ts/
      4. grep "DepanssurService" in packages/proto/gen/ts/ → found
    Expected Result: Proto compiles without errors, TypeScript types generated in gen/ts/
    Evidence: Terminal output captured

  Scenario: Proto imports resolve correctly
    Tool: Bash
    Preconditions: Proto generated
    Steps:
      1. Check that depanssur.proto is importable from other proto files
      2. Verify enum values match CDC spec (4 StatutAbonnement, 5 TypeDossier, 5 StatutDossier)
    Expected Result: All imports resolve, enum values correct
    Evidence: grep output captured
  ```

  **Commit**: YES
  - Message: `feat(proto): add Depanssur bounded context proto definitions`
  - Files: `packages/proto/src/depanssur/depanssur.proto`
  - Pre-commit: `cd packages/proto && npm run gen:all`

---

- [x] 2. Client Entity Extensions — Civilité, RGPD, Adresse de Risque

  **What to do**:
  - **Ajouter champs à `ClientBaseEntity`** (`services/service-core/src/domain/clients/entities/`):
    - `civilite: string` (nullable) — valeurs: M, Mme, Mx
  - **Ajouter type à `AdresseEntity`** :
    - `typeAdresse: string` (nullable, default 'FACTURATION') — valeurs: FACTURATION, RISQUE
  - **Créer entité `ConsentementEntity`** dans un nouveau dossier `services/service-core/src/domain/depanssur/entities/`:
    - `id: uuid PK`
    - `clientId: uuid FK → ClientBase`
    - `type: string` (RGPD_EMAIL, RGPD_SMS, CGS_DEPANSSUR)
    - `accorde: boolean`
    - `dateAccord: timestamp`
    - `dateRetrait: timestamp nullable`
    - `source: string` (web, agent, import)
    - `createdAt, updatedAt`
  - **Créer la migration TypeORM** pour les 3 changements
  - **Mettre à jour le module NestJS** de service-core pour enregistrer la nouvelle entité

  **Must NOT do**:
  - Ne PAS supprimer ou renommer de colonnes existantes dans ClientBaseEntity
  - Ne PAS modifier le comportement des queries existantes sur Client
  - Ne PAS ajouter de contrainte NOT NULL sur les nouveaux champs (backward compatible)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Ajout de colonnes + nouvelle entité simple, pattern bien établi
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Task 1)
  - **Blocks**: Task 6
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `services/service-core/src/domain/clients/entities/client-base.entity.ts` — Entité à étendre avec `civilite`, voir le pattern de colonnes existant
  - `services/service-core/src/domain/clients/entities/adresse.entity.ts` — Entité à étendre avec `typeAdresse`
  - `services/service-core/src/domain/clients/entities/statut-client.entity.ts` — Pattern de création d'entité référentiel dans service-core

  **API/Type References**:
  - `packages/proto/src/clients/clients.proto` — Proto existant qui devra être étendu pour exposer civilité et typeAdresse

  **Documentation References**:
  - CDC §3.A — Champs Client requis : civilité, consentements RGPD, adresse de risque

  **WHY Each Reference Matters**:
  - `client-base.entity.ts` : C'est le fichier exact à modifier — comprendre les décorateurs TypeORM, les relations existantes
  - `adresse.entity.ts` : Fichier exact à modifier pour ajouter typeAdresse
  - `statut-client.entity.ts` : Pattern de référentiel pour s'inspirer de la structure d'entité simple

  **Acceptance Criteria**:
  - [ ] `ClientBaseEntity` a le champ `civilite: string` nullable
  - [ ] `AdresseEntity` a le champ `typeAdresse: string` nullable avec default 'FACTURATION'
  - [ ] `ConsentementEntity` créée avec tous les champs (id, clientId, type, accorde, dateAccord, dateRetrait, source)
  - [ ] Migration TypeORM créée et exécutable sans erreur
  - [ ] Service-core démarre sans erreur : `cd services/service-core && npm run start:dev` → pas de crash

  **Agent-Executed QA Scenarios**:

  ```
  Scenario: Migration runs successfully
    Tool: Bash
    Preconditions: PostgreSQL running, service-core database exists
    Steps:
      1. cd services/service-core && npm run typeorm migration:run
      2. Assert: exit code 0
      3. Query: SELECT column_name FROM information_schema.columns WHERE table_name = 'client_base' AND column_name = 'civilite'
      4. Assert: 1 row returned
      5. Query: SELECT column_name FROM information_schema.columns WHERE table_name = 'adresse' AND column_name = 'type_adresse'
      6. Assert: 1 row returned
      7. Query: SELECT table_name FROM information_schema.tables WHERE table_name = 'consentement'
      8. Assert: 1 row returned
    Expected Result: All 3 DB changes applied
    Evidence: SQL query outputs captured

  Scenario: Service starts without errors
    Tool: Bash
    Preconditions: Migration applied
    Steps:
      1. cd services/service-core && timeout 15 npm run start:dev 2>&1
      2. Assert: output contains "Nest application successfully started" or similar
      3. Assert: no TypeORM errors in output
    Expected Result: Service boots cleanly with new entities
    Evidence: Startup log captured
  ```

  **Commit**: YES
  - Message: `feat(core): extend client with civilité, RGPD consents, and address type`
  - Files: `services/service-core/src/domain/clients/entities/client-base.entity.ts`, `services/service-core/src/domain/clients/entities/adresse.entity.ts`, `services/service-core/src/domain/depanssur/entities/consentement.entity.ts`, migration file
  - Pre-commit: `cd services/service-core && npx tsc --noEmit`

---

- [x] 3. Abonnement Depanssur — Entités + gRPC Services

  **What to do**:
  - **Créer les entités** dans `services/service-core/src/domain/depanssur/entities/`:
    - `AbonnementDepanssurEntity`:
      - `id: uuid PK`
      - `organisationId: uuid`
      - `clientId: uuid FK → ClientBase`
      - `planType: string` (ESSENTIEL, STANDARD, PREMIUM)
      - `periodicite: string` (MENSUELLE, ANNUELLE)
      - `periodeAttente: number` (jours de carence)
      - `franchise: decimal nullable` (montant fixe par dossier)
      - `plafondParIntervention: decimal nullable`
      - `plafondAnnuel: decimal nullable`
      - `nbInterventionsMax: number nullable`
      - `statut: string` (ACTIF, PAUSE, SUSPENDU_IMPAYE, RESILIE)
      - `motifResiliation: string nullable`
      - `dateSouscription: timestamp`
      - `dateEffet: timestamp`
      - `dateFin: timestamp nullable`
      - `prochaineEcheance: timestamp`
      - `prixTtc: decimal`
      - `tauxTva: decimal`
      - `montantHt: decimal`
      - `codeRemise: string nullable`
      - `montantRemise: decimal nullable`
      - `createdAt, updatedAt`
    - `OptionAbonnementEntity`:
      - `id: uuid PK`
      - `abonnementId: uuid FK → AbonnementDepanssur`
      - `type: string` (APPAREILS_ADDITIONNELS, DEPENDANCES, PRIORITE_24H)
      - `label: string`
      - `prixTtc: decimal`
      - `actif: boolean default true`
      - `createdAt, updatedAt`
    - `CompteurPlafondEntity`:
      - `id: uuid PK`
      - `abonnementId: uuid FK → AbonnementDepanssur`
      - `anneeGlissanteDebut: timestamp`
      - `anneeGlissanteFin: timestamp`
      - `nbInterventionsUtilisees: number default 0`
      - `montantCumule: decimal default 0`
      - `createdAt, updatedAt`
    - `HistoriqueStatutAbonnementEntity`:
      - `id: uuid PK`
      - `abonnementId: uuid FK`
      - `ancienStatut: string`
      - `nouveauStatut: string`
      - `motif: string nullable`
      - `createdAt`
  - **Créer les interfaces repository** dans `services/service-core/src/domain/depanssur/repositories/` (pattern DDD : `IAbonnementRepository.ts`, etc.)
  - **Créer les implémentations service** dans `services/service-core/src/infrastructure/persistence/typeorm/repositories/depanssur/` (`abonnement.service.ts`)
  - **Créer le controller gRPC** dans `services/service-core/src/infrastructure/grpc/depanssur/` (`depanssur.controller.ts`)
  - **Créer le module NestJS** `DepanssurModule` dans service-core
  - **Créer la migration TypeORM** pour les 4 entités
  - **Enregistrer le module** dans le AppModule de service-core

  **Must NOT do**:
  - Ne PAS lier l'abonnement à `ContratEntity` (domaines différents)
  - Ne PAS implémenter les règles métier complexes ici (Task 7)
  - Ne PAS implémenter le calcul de prorata ici

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Création de bounded context complet (4 entités + module + service + controller gRPC), nécessite rigueur DDD
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 4, 5)
  - **Blocks**: Tasks 7, 8, 9, 12
  - **Blocked By**: Task 1

  **References**:

  **Pattern References**:
  - `services/service-core/src/domain/clients/` — Pattern complet de bounded context dans service-core (entities/, services/, controllers/)
  - `services/service-core/src/domain/clients/entities/client-base.entity.ts` — Pattern d'entité TypeORM avec relations, décorateurs, snake_case
  - `services/service-core/src/infrastructure/persistence/typeorm/repositories/clients/client-base.service.ts` — Pattern de service CRUD avec repository injection (couche infrastructure)
  - `services/service-core/src/infrastructure/grpc/clients/client-base.controller.ts` — Pattern de controller gRPC NestJS avec @GrpcMethod (couche infrastructure)
  - `services/service-commercial/src/domain/commercial/entities/commission.entity.ts` — Pattern d'entité avec statut + historique
  - `services/service-commercial/src/domain/contracts/entities/historique-statut-contrat.entity.ts` — Pattern d'historique de statut

  **API/Type References**:
  - `packages/proto/src/depanssur/depanssur.proto` (créé en Task 1) — Contrat gRPC à implémenter

  **Documentation References**:
  - CDC §3.B — Tous les champs Abonnement (plan, carence, franchise, plafonds, options, statut, dates, prix)
  - CDC §4 — Parcours d'abonnement (souscription → activation → encaissement → vie du contrat)

  **WHY Each Reference Matters**:
  - `client-base.entity.ts` : Pattern TypeORM exact à reproduire (décorateurs @Column, @ManyToOne, @CreateDateColumn)
  - `client-base.service.ts` (dans infrastructure/persistence) : Pattern de service avec injection de Repository, find/findOne/save/remove
  - `client-base.controller.ts` (dans infrastructure/grpc) : Pattern de controller gRPC avec @GrpcMethod
  - `IClientBaseRepository.ts` (dans domain/clients/repositories) : Pattern d'interface repository DDD
  - `historique-statut-contrat.entity.ts` : Exactement le pattern à reproduire pour HistoriqueStatutAbonnementEntity

  **Acceptance Criteria**:
  - [ ] 4 entités créées dans `services/service-core/src/domain/depanssur/entities/`
  - [ ] `DepanssurModule` créé et enregistré dans AppModule
  - [ ] `IAbonnementRepository` interface créée dans `domain/depanssur/repositories/`
  - [ ] `AbonnementService` implémente CRUD dans `infrastructure/persistence/typeorm/repositories/depanssur/`
  - [ ] `DepanssurController` implémente les RPC gRPC dans `infrastructure/grpc/depanssur/`
  - [ ] Migration créée et exécutable
  - [ ] Service-core démarre sans erreur

  **Agent-Executed QA Scenarios**:

  ```
  Scenario: Create abonnement via gRPC
    Tool: Bash (grpcurl)
    Preconditions: service-core running on port 50051
    Steps:
      1. grpcurl -plaintext -d '{"clientId":"<test-uuid>","planType":"STANDARD","periodicite":"MENSUELLE","periodeAttente":30,"prixTtc":29.99,"tauxTva":20,"dateEffet":"2026-03-01T00:00:00Z"}' localhost:50051 depanssur.DepanssurService/CreateAbonnement
      2. Assert: response contains "id" field (UUID)
      3. Assert: response.statut = "ACTIF"
      4. Assert: response.planType = "STANDARD"
    Expected Result: Abonnement created with correct fields
    Evidence: gRPC response captured

  Scenario: List abonnements by client
    Tool: Bash (grpcurl)
    Preconditions: At least 1 abonnement exists
    Steps:
      1. grpcurl -plaintext -d '{"clientId":"<test-uuid>"}' localhost:50051 depanssur.DepanssurService/ListAbonnements
      2. Assert: response.abonnements array length >= 1
      3. Assert: each item has planType, statut, dateEffet
    Expected Result: List returns abonnements for client
    Evidence: gRPC response captured

  Scenario: Migration creates all tables
    Tool: Bash
    Steps:
      1. npm run typeorm migration:run
      2. Query: SELECT table_name FROM information_schema.tables WHERE table_name IN ('abonnement_depanssur', 'option_abonnement', 'compteur_plafond', 'historique_statut_abonnement')
      3. Assert: 4 rows returned
    Expected Result: All 4 tables exist
    Evidence: SQL output captured
  ```

  **Commit**: YES
  - Message: `feat(core): add Depanssur subscription bounded context with entities and gRPC`
  - Files: `services/service-core/src/domain/depanssur/**`
  - Pre-commit: `cd services/service-core && npx tsc --noEmit`

---

- [x] 4. Dossier Déclaratif — Entités + gRPC Services

  **What to do**:
  - **Créer l'entité** `DossierDeclaratifEntity` dans `services/service-core/src/domain/depanssur/entities/`:
    - `id: uuid PK`
    - `organisationId: uuid`
    - `abonnementId: uuid FK → AbonnementDepanssur`
    - `clientId: uuid FK → ClientBase`
    - `referenceExterne: string unique` (ID outil métier)
    - `dateOuverture: timestamp`
    - `type: string` (ELECTRICITE, PLOMBERIE, ELECTROMENAGER, SERRURERIE, AUTRE)
    - `statut: string` (ENREGISTRE, EN_ANALYSE, ACCEPTE, REFUSE, CLOTURE)
    - `adresseRisqueId: uuid FK → Adresse nullable`
    - `montantEstimatif: decimal nullable`
    - `priseEnCharge: boolean nullable`
    - `franchiseAppliquee: decimal nullable`
    - `resteACharge: decimal nullable`
    - `montantPrisEnCharge: decimal nullable`
    - `npsScore: number nullable` (1-10)
    - `npsCommentaire: text nullable`
    - `dateCloture: timestamp nullable`
    - `createdAt, updatedAt`
  - **Créer l'entité** `HistoriqueStatutDossierEntity`:
    - `id: uuid PK`
    - `dossierId: uuid FK`
    - `ancienStatut: string`
    - `nouveauStatut: string`
    - `motif: string nullable`
    - `createdAt`
  - **Créer le service** `DossierDeclaratifService` avec CRUD + transition statut
  - **Ajouter les RPC** au `DepanssurController` existant (créé Task 3)
  - **Créer la migration** pour les 2 entités
  - **Lier les pièces jointes** : utiliser le `PieceJointeEntity` existant avec un champ `dossierId` nullable ou une table de liaison

  **Must NOT do**:
  - Ne PAS dupliquer le système de pièces jointes — réutiliser `PieceJointeEntity` existant
  - Ne PAS implémenter la logique NPS (formulaire envoi) ici — juste le champ de stockage
  - Ne PAS valider les règles de carence ici (Task 7)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Nouvelle entité avec workflow de statut, relations complexes, pattern à suivre rigoureusement
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 3, 5)
  - **Blocks**: Tasks 7, 8, 13
  - **Blocked By**: Task 1

  **References**:

  **Pattern References**:
  - `services/service-engagement/src/domain/services/entities/demande-conciergerie.entity.ts` — Pattern le plus proche (demande de service avec statut, commentaires, client lié)
  - `services/service-commercial/src/domain/contrats/entities/historique-statut-contrat.entity.ts` — Pattern historique de statut à reproduire
  - `services/service-core/src/domain/documents/entities/piece-jointe.entity.ts` — Système de pièces jointes existant à réutiliser

  **API/Type References**:
  - `packages/proto/src/depanssur/depanssur.proto` (Task 1) — RPC DossierDeclaratif à implémenter

  **Documentation References**:
  - CDC §3.C — Champs Dossier Déclaratif (référence externe, type, statut, décision, NPS)
  - CDC §4 — "Déclaration d'un problème → miroir CRM mis à jour"

  **WHY Each Reference Matters**:
  - `demande-conciergerie.entity.ts` : Pattern sémantiquement identique — "demande de service d'un client avec workflow statut"
  - `piece-jointe.entity.ts` : Réutiliser le système existant plutôt que dupliquer

  **Acceptance Criteria**:
  - [ ] `DossierDeclaratifEntity` créée avec tous les champs CDC §3.C
  - [ ] `HistoriqueStatutDossierEntity` créée
  - [ ] `DossierDeclaratifService` implémente CRUD + transition de statut avec historique
  - [ ] RPC ajoutées au controller gRPC (CreateDossier, UpdateDossier, GetDossier, ListDossiers)
  - [ ] Migration créée et exécutable
  - [ ] Liaison pièces jointes fonctionnelle

  **Agent-Executed QA Scenarios**:

  ```
  Scenario: Create dossier déclaratif via gRPC
    Tool: Bash (grpcurl)
    Preconditions: service-core running, abonnement exists
    Steps:
      1. grpcurl -plaintext -d '{"abonnementId":"<uuid>","clientId":"<uuid>","referenceExterne":"DEP-2026-001","type":"PLOMBERIE","dateOuverture":"2026-03-15T10:00:00Z"}' localhost:50051 depanssur.DepanssurService/CreateDossier
      2. Assert: response.id is UUID
      3. Assert: response.statut = "ENREGISTRE"
      4. Assert: response.referenceExterne = "DEP-2026-001"
    Expected Result: Dossier created with initial status ENREGISTRE
    Evidence: gRPC response captured

  Scenario: Update dossier status creates history entry
    Tool: Bash (grpcurl)
    Preconditions: Dossier exists with statut ENREGISTRE
    Steps:
      1. UpdateDossier with statut = "EN_ANALYSE"
      2. Assert: response.statut = "EN_ANALYSE"
      3. Query historique_statut_dossier table
      4. Assert: row exists with ancien_statut = "ENREGISTRE", nouveau_statut = "EN_ANALYSE"
    Expected Result: Status updated and history recorded
    Evidence: gRPC response + SQL output
  ```

  **Commit**: YES
  - Message: `feat(core): add dossier déclaratif mirror entity with status workflow`
  - Files: `services/service-core/src/domain/depanssur/entities/dossier-declaratif.entity.ts`, `services/service-core/src/domain/depanssur/entities/historique-statut-dossier.entity.ts`, `services/service-core/src/domain/depanssur/services/dossier-declaratif.service.ts`, migration
  - Pre-commit: `cd services/service-core && npx tsc --noEmit`

---

- [x] 5. Avoirs (Credit Notes) — Extension Service-Finance

  **What to do**:
  - **Étendre `FactureEntity`** dans service-finance avec un champ discriminateur :
    - `typeDocument: string` (FACTURE, AVOIR) default 'FACTURE'
    - `factureOrigineId: uuid FK nullable` (pour les avoirs, lien vers la facture d'origine)
    - `motifAvoir: string nullable` (NON_PRISE_EN_CHARGE, RESILIATION, ERREUR, AUTRE)
  - **Mettre à jour le proto** `packages/proto/src/factures/factures.proto` :
    - Ajouter champs `typeDocument`, `factureOrigineId`, `motifAvoir` aux messages
    - Ajouter RPC `CreateAvoir` (crée une facture de type AVOIR avec montants négatifs)
    - Ajouter RPC `ListAvoirsByFacture` (liste les avoirs liés à une facture)
  - **Mettre à jour `FactureService`** pour gérer la création d'avoirs (montants négatifs, lien facture origine)
  - **Créer la migration** pour les nouveaux champs

  **Must NOT do**:
  - Ne PAS créer une entité séparée `AvoirEntity` — étendre `FactureEntity` avec discriminateur
  - Ne PAS modifier le calcul de totaux existant — les avoirs sont simplement des factures à montants négatifs
  - Ne PAS modifier les factures PDF existantes (le template s'adaptera au type)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Extension simple d'une entité existante + 2 RPC additionnelles
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 3, 4)
  - **Blocks**: Task 9
  - **Blocked By**: Task 1

  **References**:

  **Pattern References**:
  - `services/service-finance/src/domain/factures/entities/facture.entity.ts` — Entité exacte à étendre
  - `services/service-finance/src/infrastructure/persistence/typeorm/repositories/factures/facture.service.ts` — Service à étendre avec CreateAvoir
  - `services/service-finance/src/infrastructure/grpc/factures/facture.controller.ts` — Controller gRPC à étendre

  **API/Type References**:
  - `packages/proto/src/factures/factures.proto` — Proto à étendre avec nouveaux champs et RPC

  **Documentation References**:
  - CDC §2 — "Facturation (PDF), avoirs, exports comptables"

  **WHY Each Reference Matters**:
  - `facture.entity.ts` : Fichier exact à modifier — comprendre la structure existante avant d'ajouter le discriminateur
  - `facture.service.ts` (dans infrastructure/persistence) : Logique de création/calcul existante à comprendre pour le CreateAvoir

  **Acceptance Criteria**:
  - [ ] `FactureEntity` a les champs `typeDocument`, `factureOrigineId`, `motifAvoir`
  - [ ] RPC `CreateAvoir` crée une facture de type AVOIR avec montants négatifs
  - [ ] RPC `ListAvoirsByFacture` retourne les avoirs liés à une facture
  - [ ] Migration créée et exécutable
  - [ ] Les factures existantes ne sont pas impactées (default type = FACTURE)

  **Agent-Executed QA Scenarios**:

  ```
  Scenario: Create avoir linked to facture
    Tool: Bash (grpcurl)
    Preconditions: service-finance running, facture exists
    Steps:
      1. CreateAvoir with factureOrigineId, montantHt=-100, motifAvoir="NON_PRISE_EN_CHARGE"
      2. Assert: response.typeDocument = "AVOIR"
      3. Assert: response.montantHt < 0
      4. Assert: response.factureOrigineId = original facture ID
    Expected Result: Avoir created with negative amounts
    Evidence: gRPC response captured

  Scenario: Existing factures unchanged
    Tool: Bash
    Steps:
      1. Query: SELECT type_document FROM facture WHERE type_document IS NULL OR type_document = 'FACTURE'
      2. Assert: all existing rows have type_document = 'FACTURE' (or NULL with default)
    Expected Result: No existing data corrupted
    Evidence: SQL output captured
  ```

  **Commit**: YES
  - Message: `feat(finance): add credit note (avoir) support to invoice entity`
  - Files: `services/service-finance/src/domain/factures/entities/facture.entity.ts`, `packages/proto/src/factures/factures.proto`, migration
  - Pre-commit: `cd services/service-finance && npx tsc --noEmit`

---

- [ ] 6. Frontend — Extensions Client (civilité, RGPD, adresse risque)

  **What to do**:
  - **Modifier le formulaire de création client** pour ajouter :
    - Sélecteur civilité (M / Mme / Mx)
    - Section consentements RGPD (checkboxes : email, SMS, CGS Depanssur)
  - **Modifier le formulaire d'adresse** pour ajouter :
    - Sélecteur type d'adresse (Facturation / Adresse de risque)
  - **Modifier la fiche client** (page détail) pour afficher :
    - Civilité dans le header
    - Badge consentements RGPD
    - Distinction visuelle adresse de risque vs facturation
  - **Mettre à jour les appels gRPC** frontend pour envoyer/recevoir les nouveaux champs

  **Must NOT do**:
  - Ne PAS refaire le design de la fiche client — juste ajouter les champs
  - Ne PAS modifier le layout des onglets existants

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: Modifications UI dans formulaires et fiche client existants
  - **Skills**: [`frontend-ui-ux`]
    - `frontend-ui-ux` : Intégration de nouveaux champs dans des formulaires existants, cohérence visuelle

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Tasks 7, 8, 9)
  - **Blocks**: None
  - **Blocked By**: Task 2

  **References**:

  **Pattern References**:
  - `frontend/src/components/create-client-dialog.tsx` — Formulaire de création client à modifier
  - `frontend/src/app/(main)/clients/[id]/client-detail-client.tsx` — Composant détail client à modifier
  - `frontend/src/components/client-detail/client-header.tsx` — Header client à étendre avec civilité

  **Acceptance Criteria**:
  - [ ] Sélecteur civilité visible dans le formulaire de création client
  - [ ] Checkboxes consentements RGPD visibles dans le formulaire
  - [ ] Sélecteur type d'adresse visible dans le formulaire d'adresse
  - [ ] Fiche client affiche civilité et badges consentements

  **Agent-Executed QA Scenarios**:

  ```
  Scenario: Create client with civilité and consents
    Tool: Playwright
    Preconditions: Dev server running on localhost:3000, user logged in
    Steps:
      1. Navigate to: http://localhost:3000/clients
      2. Click: button containing "Nouveau client" or "Créer"
      3. Wait for: dialog visible (timeout: 5s)
      4. Select: civilité = "Mme"
      5. Fill: input[name="prenom"] → "Marie"
      6. Fill: input[name="nom"] → "Dupont"
      7. Fill: input[name="email"] → "marie.dupont@test.com"
      8. Check: checkbox for "RGPD Email"
      9. Check: checkbox for "CGS Depanssur"
      10. Click: submit button
      11. Wait for: success toast or redirect (timeout: 10s)
      12. Screenshot: .sisyphus/evidence/task-6-create-client-civility.png
    Expected Result: Client created with civilité and consents
    Evidence: .sisyphus/evidence/task-6-create-client-civility.png
  ```

  **Commit**: YES
  - Message: `feat(frontend): add civilité, RGPD consents and address type to client forms`
  - Files: `frontend/src/app/(main)/clients/components/**`
  - Pre-commit: `cd frontend && npx tsc --noEmit`

---

- [x] 7. Règles Métier Depanssur — Carence, Plafonds, Upgrade/Downgrade

  **What to do**:
  - **Créer `RegleDepanssurService`** dans `services/service-core/src/domain/depanssur/services/`:
    - `validerCarence(abonnement, dateDossier)` : retourne `{valide: boolean, dateFinCarence: Date}` — bloque si `dateDossier < dateEffet + periodeAttente`
    - `verifierPlafonds(abonnement, montantIntervention)` : retourne `{autorise: boolean, plafondsRestants: {...}, raison?: string}` — vérifie nb interventions, montant cumulé, plafond par intervention
    - `majCompteurs(abonnement, montantIntervention)` : incrémente les compteurs dans `CompteurPlafondEntity`, crée nouveau compteur si année glissante expirée
    - `upgraderPlan(abonnement, nouveauPlan)` : effet immédiat sur facturation, droits étendus au prochain dossier
    - `downgraderPlan(abonnement, nouveauPlan)` : effet au cycle N+1 (prochaine échéance)
    - `changerAdresseRisque(abonnement, nouvelleAdresse, dateDemande)` : si après Jcutoff → effet N+1
    - `resetCompteurAnnuel(abonnement)` : reset des compteurs à la date anniversaire
  - **Intégrer dans `DossierDeclaratifService`** : appeler `validerCarence` et `verifierPlafonds` avant d'accepter un dossier (statut ACCEPTE)
  - **Intégrer dans `AbonnementService`** : appeler upgrade/downgrade lors des changements de plan

  **Must NOT do**:
  - Ne PAS implémenter de calcul de prorata facturation (hors scope CRM miroir)
  - Ne PAS modifier le statut de l'abonnement automatiquement ici (c'est le job du dunning Task 9)
  - Ne PAS hardcoder les valeurs de carence/plafonds — toujours lire depuis l'abonnement

  **Recommended Agent Profile**:
  - **Category**: `ultrabrain`
    - Reason: Logique métier complexe avec edge cases (année glissante, cutoff, plafonds multiples), nécessite rigueur algorithmique
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Tasks 6, 8, 9)
  - **Blocks**: Tasks 10, 11, 15
  - **Blocked By**: Tasks 3, 4

  **References**:

  **Pattern References**:
  - `services/service-commercial/src/domain/commercial/services/commission-calculation.service.ts` — Pattern de service de calcul métier complexe avec tests
  - `services/service-core/src/domain/depanssur/entities/compteur-plafond.entity.ts` (Task 3) — Entité compteur à manipuler
  - `services/service-core/src/domain/depanssur/entities/abonnement-depanssur.entity.ts` (Task 3) — Entité abonnement source des paramètres

  **Documentation References**:
  - CDC §5 — Règles & validations (carence, franchise, plafonds, upgrade/downgrade, changement adresse)
  - CDC §2bis — Frontière des paramètres de garantie (Source of Truth)

  **WHY Each Reference Matters**:
  - `commission-calculation.service.ts` : Pattern de service métier complexe avec calculs, le plus proche fonctionnellement
  - CDC §5 : Source de vérité ABSOLUE pour chaque règle — les implémenter exactement comme décrit

  **Acceptance Criteria**:
  - [ ] `validerCarence` bloque correctement les dossiers avant date_effet + carence
  - [ ] `verifierPlafonds` vérifie les 3 types de plafonds (par intervention, annuel €, nb max)
  - [ ] `majCompteurs` incrémente correctement et reset à l'année glissante
  - [ ] `upgraderPlan` applique effet immédiat
  - [ ] `downgraderPlan` applique effet N+1
  - [ ] `changerAdresseRisque` respecte la règle cutoff
  - [ ] Intégration dans DossierDeclaratifService : un dossier ne peut pas passer à ACCEPTE si carence non écoulée

  **Agent-Executed QA Scenarios**:

  ```
  Scenario: Carence blocks dossier acceptance
    Tool: Bash (grpcurl)
    Preconditions: Abonnement with dateEffet=2026-03-01, periodeAttente=30
    Steps:
      1. Create dossier with dateOuverture=2026-03-15 (within carence)
      2. Try to update statut to ACCEPTE
      3. Assert: error returned mentioning carence
      4. Assert: statut remains ENREGISTRE
    Expected Result: Dossier blocked during carence period
    Evidence: gRPC error response captured

  Scenario: Plafond blocks when exceeded
    Tool: Bash (grpcurl)
    Preconditions: Abonnement with nbInterventionsMax=3, 3 dossiers already ACCEPTE
    Steps:
      1. Create 4th dossier
      2. Try to update statut to ACCEPTE
      3. Assert: error returned mentioning plafond exceeded
    Expected Result: Dossier blocked when plafond reached
    Evidence: gRPC error response captured
  ```

  **Commit**: YES
  - Message: `feat(core): implement Depanssur business rules (carence, plafonds, upgrade/downgrade)`
  - Files: `services/service-core/src/domain/depanssur/services/regle-depanssur.service.ts`
  - Pre-commit: `cd services/service-core && npx tsc --noEmit`

---

- [x] 8. Webhook Receiver — Synchronisation Outil Métier Depanssur

  **What to do**:
  - **Créer un REST controller** `DepanssurWebhookController` dans service-core (NestJS HTTP, pas gRPC) :
    - `POST /webhooks/depanssur` — endpoint unique qui dispatche selon le type d'événement
    - Validation HMAC signature (header `X-Depanssur-Signature`)
    - Déduplication par `eventId` (table `WebhookEventLogEntity`)
  - **Créer `WebhookEventLogEntity`** :
    - `id: uuid PK`
    - `eventId: string unique` (ID événement Depanssur)
    - `eventType: string` (depanssur.customer.created, etc.)
    - `payload: jsonb`
    - `status: string` (RECEIVED, PROCESSED, FAILED)
    - `errorMessage: text nullable`
    - `createdAt`
  - **Créer `DepanssurWebhookService`** avec handlers par type :
    - `handleCustomerCreated/Updated` : upsert ClientBase + flag has_depanssur=true
    - `handleSubscriptionCreated/Updated` : upsert AbonnementDepanssur
    - `handleCaseCreated` : créer DossierDeclaratif avec statut ENREGISTRE
    - `handleCaseUpdated` : MAJ statut + champs dossier
    - `handleCaseClosed` : MAJ statut CLOTURE + dateCloture
    - `handleCaseDecision` : MAJ priseEnCharge, franchiseAppliquee, resteACharge, montantPrisEnCharge + MAJ compteurs plafonds
  - **Créer les outgoing API services** (optionnel, CDC dit "optionnel") :
    - `DepanssurApiClient` : POST /customers, POST /subscriptions, POST /webhooks/test
    - Configuration via env variables (DEPANSSUR_API_URL, DEPANSSUR_API_KEY)

  **Must NOT do**:
  - Ne PAS exposer l'endpoint webhook sans validation de signature
  - Ne PAS traiter deux fois le même événement (idempotency via eventId)
  - Ne PAS bloquer sur le traitement — répondre 200 immédiatement, traiter en async si lourd

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Webhook receiver avec idempotency, signature validation, multiple handlers — complexité technique significative
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Tasks 6, 7, 9)
  - **Blocks**: Task 10
  - **Blocked By**: Tasks 3, 4

  **References**:

  **Pattern References**:
  - `services/service-finance/src/domain/payments/entities/psp-event-inbox.entity.ts` — Pattern exact d'inbox webhook avec idempotency (PSP webhook receiver)
  - `services/service-finance/src/domain/payments/services/` — Pattern de webhook handler par PSP provider

  **Documentation References**:
  - CDC §8 — Webhooks (→ CRM) : liste des 6 types d'événements + API sortante

  **WHY Each Reference Matters**:
  - `psp-event-inbox.entity.ts` : Pattern d'inbox de webhook avec déduplication — exactement le même problème résolu pour les paiements PSP

  **Acceptance Criteria**:
  - [ ] Endpoint `POST /webhooks/depanssur` répond 200 sur payload valide
  - [ ] Validation HMAC rejette les payloads avec signature invalide (401)
  - [ ] Déduplication : même eventId envoyé 2 fois → 1 seul traitement
  - [ ] `handleCaseCreated` crée un DossierDeclaratif avec statut ENREGISTRE
  - [ ] `handleCaseDecision` met à jour les champs décision + compteurs plafonds
  - [ ] `WebhookEventLogEntity` enregistre chaque événement reçu

  **Agent-Executed QA Scenarios**:

  ```
  Scenario: Webhook creates dossier on case.created
    Tool: Bash (curl)
    Preconditions: service-core running on port 3052, abonnement exists
    Steps:
      1. curl -s -w "\n%{http_code}" -X POST http://localhost:3052/webhooks/depanssur \
           -H "Content-Type: application/json" \
           -H "X-Depanssur-Signature: <computed-hmac>" \
           -d '{"eventId":"evt-001","eventType":"depanssur.case.created","data":{"referenceExterne":"DEP-001","clientId":"<uuid>","type":"PLOMBERIE"}}'
      2. Assert: HTTP status is 200
      3. Query: SELECT * FROM dossier_declaratif WHERE reference_externe = 'DEP-001'
      4. Assert: 1 row, statut = 'ENREGISTRE'
    Expected Result: Dossier created from webhook
    Evidence: curl output + SQL result

  Scenario: Duplicate webhook is idempotent
    Tool: Bash (curl)
    Steps:
      1. Send same webhook payload with eventId="evt-001" again
      2. Assert: HTTP status is 200
      3. Query: SELECT count(*) FROM dossier_declaratif WHERE reference_externe = 'DEP-001'
      4. Assert: count = 1 (not 2)
    Expected Result: No duplicate processing
    Evidence: SQL count output

  Scenario: Invalid signature rejected
    Tool: Bash (curl)
    Steps:
      1. Send webhook with X-Depanssur-Signature = "invalid"
      2. Assert: HTTP status is 401
    Expected Result: Unauthorized response
    Evidence: curl output
  ```

  **Commit**: YES
  - Message: `feat(core): add Depanssur webhook receiver with idempotency and HMAC validation`
  - Files: `services/service-core/src/domain/depanssur/controllers/depanssur-webhook.controller.ts`, `services/service-core/src/domain/depanssur/services/depanssur-webhook.service.ts`, `services/service-core/src/domain/depanssur/entities/webhook-event-log.entity.ts`
  - Pre-commit: `cd services/service-core && npx tsc --noEmit`

---

- [x] 9. Dunning Séquence Depanssur — Relances Impayés

  **What to do**:
  - **Créer `DunningDepanssurService`** dans service-finance (ou service-core, selon où la logique paiement réside) :
    - Utiliser le `RetryPolicyEntity` existant pour configurer la séquence :
      - **J0** : Échec paiement → email doux + programmer retry J+2
      - **J+2** : 2e tentative automatique
      - **J+5** : 3e tentative + SMS avec lien MAJ moyen de paiement (PortalPaymentSession)
      - **J+10** : Statut abonnement → SUSPENDU_IMPAYE, annulation commissions récurrentes du cycle
    - `suspendreAbonnement(abonnementId)` : change statut + émet événement NATS
    - `retablirAbonnement(abonnementId)` : sur encaissement, remet statut ACTIF + relance commissions
  - **Créer `DunningConfigEntity`** (ou réutiliser `RetryPolicyEntity` avec un type "DEPANSSUR") :
    - Séquence configurable (jours, actions, canaux)
  - **Intégrer avec le système de paiement existant** :
    - Écouter les événements NATS de paiement (payment.failed, payment.succeeded)
    - Sur payment.failed → déclencher la séquence dunning Depanssur
    - Sur payment.succeeded alors que suspendu → rétablir

  **Must NOT do**:
  - Ne PAS modifier le flow de paiement existant — se brancher en listener
  - Ne PAS hardcoder les délais J0/J+2/J+5/J+10 — paramétrable via config
  - Ne PAS supprimer les commissions déjà payées — seulement annuler les récurrentes du cycle en cours

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Intégration avec système de paiement existant + logique de séquence temporelle complexe
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Tasks 6, 7, 8)
  - **Blocks**: Task 11
  - **Blocked By**: Tasks 3, 5

  **References**:

  **Pattern References**:
  - `services/service-finance/src/domain/payments/entities/retry-policy.entity.ts` — Politique de retry existante à réutiliser/étendre
  - `services/service-finance/src/domain/payments/entities/retry-schedule.entity.ts` — Schedule de retry existant
  - `services/service-finance/src/domain/payments/entities/reminder-policy.entity.ts` — Politique de relance existante
  - `services/service-finance/src/domain/payments/services/` — Services de paiement existants à comprendre

  **Documentation References**:
  - CDC §6 — Dunning : séquence complète J0/J+2/J+5/J+10 avec actions spécifiques

  **WHY Each Reference Matters**:
  - `retry-policy.entity.ts` : Infrastructure de retry DÉJÀ construite — réutiliser plutôt que recréer
  - CDC §6 : Séquence exacte à implémenter, mot pour mot

  **Acceptance Criteria**:
  - [ ] Configuration dunning Depanssur créée (J0 email, J+2 retry, J+5 SMS+retry, J+10 suspension)
  - [ ] Sur payment.failed NATS event → séquence dunning démarrée
  - [ ] J+10 → statut abonnement = SUSPENDU_IMPAYE + commissions récurrentes annulées
  - [ ] Sur payment.succeeded alors que suspendu → statut revient à ACTIF

  **Agent-Executed QA Scenarios**:

  ```
  Scenario: Payment failure triggers dunning
    Tool: Bash
    Preconditions: Abonnement ACTIF exists, payment schedule configured
    Steps:
      1. Simulate payment.failed NATS event for the abonnement
      2. Assert: DunningDepanssurService processes the event
      3. Assert: Email notification queued (check notification table/log)
      4. Assert: Retry scheduled for J+2
    Expected Result: Dunning sequence initiated
    Evidence: Log output + DB state

  Scenario: J+10 suspension changes statut
    Tool: Bash
    Preconditions: Dunning sequence at J+10, all retries failed
    Steps:
      1. Trigger J+10 dunning step
      2. Query: SELECT statut FROM abonnement_depanssur WHERE id = '<uuid>'
      3. Assert: statut = 'SUSPENDU_IMPAYE'
      4. Assert: historique_statut_abonnement has entry ACTIF → SUSPENDU_IMPAYE
    Expected Result: Abonnement suspended
    Evidence: SQL outputs captured
  ```

  **Commit**: YES
  - Message: `feat(finance): implement Depanssur dunning sequence (J0/J+2/J+5/J+10)`
  - Files: `services/service-finance/src/domain/depanssur/` or extend existing payment services
  - Pre-commit: `cd services/service-finance && npx tsc --noEmit`

---

- [x] 10. NATS Events — Domaine Depanssur

  **What to do**:
  - **Définir les événements NATS** pour le domaine Depanssur :
    - Proto event contracts dans `packages/proto/src/events/depanssur_events.proto` (suivre le pattern de `client_events.proto`, `payment_events.proto`)
    - Utiliser le `NatsService` de `packages/shared-kernel/src/infrastructure/nats/nats.service.ts` pour publier/souscrire
  - Événements à définir :
    - `depanssur.abonnement.created` — émis à la création d'un abonnement
    - `depanssur.abonnement.status_changed` — émis à chaque changement de statut (avec ancien/nouveau statut)
    - `depanssur.abonnement.upgraded` / `depanssur.abonnement.downgraded`
    - `depanssur.dossier.created` — émis quand un dossier est créé (webhook ou manuel)
    - `depanssur.dossier.status_changed` — émis à chaque transition de statut
    - `depanssur.dossier.decision` — émis quand une décision est prise (accepté/refusé)
    - `depanssur.dossier.closed` — émis à la clôture
    - `depanssur.plafond.threshold_reached` — émis quand un plafond atteint 80%
    - `depanssur.plafond.exceeded` — émis quand un plafond est dépassé
  - **Publier les événements** depuis les services existants (AbonnementService, DossierDeclaratifService, RegleDepanssurService)
  - **Souscrire aux événements** dans service-engagement (pour notifications) et service-commercial (pour commissions)

  **Must NOT do**:
  - Ne PAS modifier les événements NATS existants
  - Ne PAS créer de streams JetStream séparés si le projet utilise NATS core

  **Recommended Agent Profile**:
  - **Category**: `unspecified-low`
    - Reason: Pattern NATS déjà établi, il s'agit de l'appliquer aux nouveaux événements
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4 (with Tasks 11, 12, 13)
  - **Blocks**: Tasks 14, 16
  - **Blocked By**: Tasks 7, 8

  **References**:

  **Pattern References**:
  - `packages/proto/src/events/client_events.proto` — Pattern de définition d'événement NATS en proto (EventEnvelope, typed data)
  - `packages/proto/src/events/payment_events.proto` — Pattern d'événements paiement (le plus proche fonctionnellement)
  - `packages/proto/src/events/common_events.proto` — Structure commune EventEnvelope, EventRecord, EventStatus
  - `packages/shared-kernel/src/infrastructure/nats/nats.service.ts` — NatsService pour publish/subscribe
  - `packages/shared-kernel/src/events/index.ts` — Exports d'événements partagés

  **Documentation References**:
  - CDC §8 — Types d'événements webhook (les événements NATS miroir)

  **Acceptance Criteria**:
  - [ ] 9 types d'événements NATS définis
  - [ ] AbonnementService publie les événements à chaque opération
  - [ ] DossierDeclaratifService publie les événements à chaque transition
  - [ ] service-engagement souscrit aux événements pour les notifications
  - [ ] Les événements sont reçus et traités correctement

  **Agent-Executed QA Scenarios**:

  ```
  Scenario: Abonnement creation emits NATS event
    Tool: Bash
    Preconditions: NATS running, service-core running
    Steps:
      1. Subscribe to depanssur.abonnement.created via NATS CLI
      2. Create abonnement via gRPC
      3. Assert: NATS message received with abonnement data
    Expected Result: Event emitted on creation
    Evidence: NATS message captured
  ```

  **Commit**: YES
  - Message: `feat(core): add NATS events for Depanssur domain`
  - Files: `packages/proto/src/events/depanssur_events.proto`, services publishers/subscribers
  - Pre-commit: `npx tsc --noEmit`

---

- [x] 11. Jobs Automatisés — Quotidiens + Hebdomadaires

  **What to do**:
  - **Créer `DepanssurSchedulerService`** avec `@nestjs/schedule` (cron jobs) :
    - **Job quotidien 06:00** `@Cron('0 6 * * *')` :
      - Récupérer les échéances J/J+1
      - Déclencher les tentatives de paiement via le système existant
      - MAJ statuts abonnements selon résultat
    - **Job quotidien 08:00** `@Cron('0 8 * * *')` :
      - Contrôle carence : vérifier les abonnements dont la carence expire aujourd'hui → notification
      - Contrôle plafonds : vérifier les abonnements proches des plafonds (80%) → alerte interne
      - Reset compteurs : vérifier les anniversaires de date_effet → reset CompteurPlafond
    - **Job hebdomadaire lundi 09:00** `@Cron('0 9 * * 1')` :
      - Générer l'export comptable de la semaine (appeler service-finance)
      - Générer le suivi commissions (appeler service-commercial)
      - Générer le rapport de sinistralité miroir (agrégation dossiers)
  - **Installer `@nestjs/schedule`** si pas déjà présent dans le service

  **Must NOT do**:
  - Ne PAS dupliquer la logique de paiement — appeler les services existants
  - Ne PAS exécuter les jobs en synchrone — utiliser des queues ou NATS pour les traitements lourds
  - Ne PAS hardcoder les horaires — utiliser des env variables pour les cron expressions

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Orchestration de multiples services existants via cron, intégration cross-service
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4 (with Tasks 10, 12, 13)
  - **Blocks**: Task 16
  - **Blocked By**: Tasks 7, 9

  **References**:

  **Pattern References**:
  - `services/service-finance/src/domain/payments/services/` — Services de paiement à appeler pour le job 06:00
  - `services/service-core/src/domain/depanssur/services/regle-depanssur.service.ts` (Task 7) — Service de règles à appeler pour le job 08:00

  **External References**:
  - NestJS Schedule: `https://docs.nestjs.com/techniques/task-scheduling`

  **Documentation References**:
  - CDC §7 — Automatisations (jobs) : description exacte des 3 jobs + fréquences

  **Acceptance Criteria**:
  - [ ] 3 cron jobs enregistrés et fonctionnels
  - [ ] Job 06:00 traite les échéances et tente les paiements
  - [ ] Job 08:00 vérifie carence + plafonds + reset compteurs
  - [ ] Job hebdo génère export + rapport sinistralité
  - [ ] Les horaires sont configurables via env variables

  **Agent-Executed QA Scenarios**:

  ```
  Scenario: Daily 08:00 job detects expiring carence
    Tool: Bash
    Preconditions: Abonnement with carence ending today
    Steps:
      1. Manually trigger the 08:00 job (call the method directly)
      2. Assert: Notification/alert created for the abonnement
      3. Assert: Log output contains "carence expiring" or similar
    Expected Result: Alert raised for carence expiration
    Evidence: Log + notification record

  Scenario: Weekly job generates sinistralité report
    Tool: Bash
    Steps:
      1. Manually trigger the weekly job
      2. Assert: Report data generated (check DB or output)
      3. Assert: Contains aggregated dossier counts by type and status
    Expected Result: Report generated with correct aggregation
    Evidence: Report output captured
  ```

  **Commit**: YES
  - Message: `feat(core): add Depanssur scheduled jobs (daily payments, carence control, weekly reports)`
  - Files: `services/service-core/src/domain/depanssur/services/depanssur-scheduler.service.ts`
  - Pre-commit: `cd services/service-core && npx tsc --noEmit`

---

- [ ] 12. Frontend — Onglet Abonnement Depanssur (Fiche Client)

  **What to do**:
  - **Ajouter un onglet "Abonnement Depanssur"** dans la page détail client (`/clients/[id]`):
    - Visible uniquement si `has_depanssur = true`
    - Affiche les informations de l'abonnement actif :
      - Plan (Essentiel/Standard/Premium) avec badge coloré
      - Statut avec badge (ACTIF vert, PAUSE orange, SUSPENDU_IMPAYE rouge, RESILIE gris)
      - Dates : souscription, effet, fin carence, prochaine échéance
      - Prix TTC + détail TVA
      - Remise/coupon si applicable
    - Section "Garanties & Plafonds" :
      - Franchise : montant
      - Plafonds avec barres de progression (nb interventions utilisées/max, montant cumulé/plafond annuel)
    - Section "Options" :
      - Liste des options souscrites avec badge actif/inactif
    - Section "Historique" :
      - Timeline des changements de statut
    - Actions :
      - Boutons : Pause, Reprendre, Upgrade, Downgrade, Résilier
      - Dialog de confirmation pour chaque action avec motif
  - **Créer les composants** :
    - `AbonnementDepanssurTab` — composant principal onglet
    - `AbonnementHeader` — plan + statut + dates
    - `PlafondProgressBar` — barre de progression plafond
    - `OptionBadge` — badge option abonnement
    - `AbonnementActionsMenu` — menu actions (pause, upgrade, etc.)
    - `AbonnementHistorique` — timeline historique statut

  **Must NOT do**:
  - Ne PAS modifier les onglets existants (Overview, Payments, Documents)
  - Ne PAS créer de page séparée — c'est un onglet dans la fiche client existante
  - Ne PAS permettre la modification directe des champs (read-only, actions via boutons)

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: Création d'un onglet riche avec barres de progression, badges, timeline, menus d'actions
  - **Skills**: [`frontend-ui-ux`]
    - `frontend-ui-ux` : Design cohérent avec le reste de l'application, composants shadcn/ui

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4 (with Tasks 10, 11, 13)
  - **Blocks**: Task 15
  - **Blocked By**: Task 3

  **References**:

  **Pattern References**:
  - `frontend/src/app/(main)/clients/[id]/page.tsx` — Page détail client (point d'entrée route)
  - `frontend/src/app/(main)/clients/[id]/client-detail-client.tsx` — Composant détail client avec onglets — ajouter l'onglet Abonnement ici
  - `frontend/src/components/client-detail/client-header.tsx` — Pattern de header avec badges statut

  **Acceptance Criteria**:
  - [ ] Onglet "Abonnement Depanssur" visible dans la fiche client quand has_depanssur=true
  - [ ] Affichage plan + statut avec badges corrects
  - [ ] Barres de progression plafonds fonctionnelles
  - [ ] Liste des options affichée
  - [ ] Timeline historique statut affichée
  - [ ] Boutons d'action fonctionnels (pause, upgrade, downgrade, résilier)

  **Agent-Executed QA Scenarios**:

  ```
  Scenario: Abonnement tab displays correctly
    Tool: Playwright
    Preconditions: Dev server running, client with has_depanssur=true and active abonnement
    Steps:
      1. Navigate to: http://localhost:3000/clients/<client-id>
      2. Click: tab "Abonnement Depanssur"
      3. Wait for: abonnement data loaded (timeout: 5s)
      4. Assert: plan badge visible (e.g., "STANDARD")
      5. Assert: statut badge visible (e.g., "ACTIF" with green color)
      6. Assert: plafond progress bars visible
      7. Assert: options list visible
      8. Screenshot: .sisyphus/evidence/task-12-abonnement-tab.png
    Expected Result: Abonnement tab shows all sections
    Evidence: .sisyphus/evidence/task-12-abonnement-tab.png

  Scenario: Action buttons trigger confirmation
    Tool: Playwright
    Steps:
      1. On abonnement tab, click "Pause" button
      2. Wait for: confirmation dialog (timeout: 3s)
      3. Assert: dialog contains motif input
      4. Click: cancel
      5. Assert: dialog closed, statut unchanged
      6. Screenshot: .sisyphus/evidence/task-12-action-dialog.png
    Expected Result: Confirmation dialog shown before action
    Evidence: .sisyphus/evidence/task-12-action-dialog.png
  ```

  **Commit**: YES
  - Message: `feat(frontend): add Depanssur subscription tab in client detail page`
  - Files: `frontend/src/app/(main)/clients/[id]/components/abonnement-depanssur/`
  - Pre-commit: `cd frontend && npx tsc --noEmit`

---

- [ ] 13. Frontend — Pages Dossier Déclaratif

  **What to do**:
  - **Créer la page listing** `/dossiers-depanssur` :
    - DataTable avec colonnes : référence, client, type, statut, date ouverture, montant estimatif, NPS
    - Filtres : statut, type, période
    - Recherche par référence ou nom client
    - Badge statut coloré (ENREGISTRE bleu, EN_ANALYSE jaune, ACCEPTE vert, REFUSE rouge, CLOTURE gris)
  - **Créer la page détail** `/dossiers-depanssur/[id]` :
    - Header : référence, type, statut avec badge
    - Section "Client" : lien vers fiche client
    - Section "Abonnement" : résumé plan + couverture restante
    - Section "Décision" : prise en charge oui/non, franchise, reste à charge, montant pris en charge
    - Section "Pièces jointes" : liste des photos/documents
    - Section "NPS" : score + commentaire (si clôturé)
    - Timeline : historique des changements de statut
  - **Ajouter un onglet "Dossiers"** dans la fiche client :
    - Liste des dossiers du client (même DataTable, filtré par clientId)
  - **Ajouter la route** dans le sidebar de navigation

  **Must NOT do**:
  - Ne PAS permettre la modification du statut depuis le frontend (vient des webhooks)
  - Ne PAS implémenter de formulaire de création de dossier (créés via webhook uniquement)
  - Ne PAS afficher les détails opérationnels terrain (artisan, planning, etc.)

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: Création de pages listing + détail avec DataTable, badges, timeline — riche en composants UI
  - **Skills**: [`frontend-ui-ux`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4 (with Tasks 10, 11, 12)
  - **Blocks**: None
  - **Blocked By**: Task 4

  **References**:

  **Pattern References**:
  - `frontend/src/app/(main)/clients/page.tsx` — Pattern de page listing avec DataTable
  - `frontend/src/app/(main)/commissions/commissions-page-client.tsx` — Pattern de listing avec filtres, colonnes, et badges statut
  - `frontend/src/app/(main)/commissions/columns.tsx` — Pattern de définition de colonnes DataTable
  - `frontend/src/components/data-table.tsx` — Composant DataTable réutilisable
  - `frontend/src/components/data-table-pagination.tsx` — Pagination DataTable

  **Documentation References**:
  - CDC §3.C — Champs à afficher dans la fiche dossier

  **Acceptance Criteria**:
  - [ ] Page `/dossiers-depanssur` affiche la liste avec DataTable
  - [ ] Filtres par statut et type fonctionnels
  - [ ] Page détail affiche toutes les sections (client, abonnement, décision, NPS, timeline)
  - [ ] Onglet "Dossiers" visible dans la fiche client
  - [ ] Route ajoutée dans la navigation sidebar (`frontend/src/components/nav-main.tsx`)

  **Agent-Executed QA Scenarios**:

  ```
  Scenario: Dossier listing page loads
    Tool: Playwright
    Preconditions: Dev server running, dossiers exist in DB
    Steps:
      1. Navigate to: http://localhost:3000/dossiers-depanssur
      2. Wait for: DataTable loaded (timeout: 5s)
      3. Assert: table rows visible
      4. Assert: columns include référence, client, type, statut
      5. Assert: statut badges have correct colors
      6. Screenshot: .sisyphus/evidence/task-13-dossier-listing.png
    Expected Result: Listing page shows dossiers with badges
    Evidence: .sisyphus/evidence/task-13-dossier-listing.png

  Scenario: Dossier detail page shows decision
    Tool: Playwright
    Preconditions: Dossier with decision (ACCEPTE, franchise applied)
    Steps:
      1. Navigate to: http://localhost:3000/dossiers-depanssur/<id>
      2. Wait for: page loaded (timeout: 5s)
      3. Assert: "Prise en charge" section visible
      4. Assert: franchise amount displayed
      5. Assert: reste à charge displayed
      6. Assert: timeline shows status history
      7. Screenshot: .sisyphus/evidence/task-13-dossier-detail.png
    Expected Result: Detail page shows all sections
    Evidence: .sisyphus/evidence/task-13-dossier-detail.png
  ```

  **Commit**: YES
  - Message: `feat(frontend): add dossier déclaratif listing and detail pages`
  - Files: `frontend/src/app/(main)/dossiers-depanssur/`
  - Pre-commit: `cd frontend && npx tsc --noEmit`

---

- [ ] 14. Notifications Templates Depanssur

  **What to do**:
  - **Créer les templates de notification** dans service-engagement :
    - **Confirmation souscription** : email de bienvenue avec récap plan, options, dates
    - **Rappel J-1 encaissement** : email rappelant le prélèvement du lendemain
    - **Facture payée** : email avec facture PDF en PJ
    - **Alerte impayé N1 (J0)** : email doux "votre paiement a échoué, nous réessayons"
    - **Alerte impayé N2 (J+5)** : SMS + email avec lien MAJ moyen de paiement
    - **Alerte impayé N3 (J+10)** : email informant de la suspension + comment régulariser
    - **Clôture dossier + enquête NPS** : email post-intervention avec lien formulaire NPS
  - **Souscrire aux événements NATS** (Task 10) pour déclencher les notifications :
    - `depanssur.abonnement.created` → confirmation souscription
    - `depanssur.dossier.closed` → enquête NPS
    - Events paiement → alertes impayé
  - **Utiliser le `NotificationEntity` existant** pour stocker les notifications in-app
  - **Intégrer l'envoi email** via le système OAuth email existant ou un provider SMTP

  **Must NOT do**:
  - Ne PAS créer un nouveau système de notification — étendre l'existant
  - Ne PAS envoyer de SMS réel (simuler/logger pour le moment, sauf si Twilio/SMS provider configuré)
  - Ne PAS hardcoder les textes — utiliser des templates avec variables

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: 7 templates avec logique de déclenchement, intégration NATS + email existant
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 5 (with Tasks 15, 16)
  - **Blocks**: None
  - **Blocked By**: Task 10

  **References**:

  **Pattern References**:
  - `services/service-engagement/src/domain/engagement/entities/notification.entity.ts` — Entité notification existante
  - `services/service-engagement/src/domain/engagement/services/` — Services notification existants

  **Documentation References**:
  - CDC §7 — Notifications : liste complète des 7 types

  **Acceptance Criteria**:
  - [ ] 7 templates de notification créés
  - [ ] Déclenchement automatique via NATS events
  - [ ] Notifications in-app créées dans NotificationEntity
  - [ ] Emails envoyés via le système existant
  - [ ] Templates utilisent des variables (nom client, plan, montant, etc.)

  **Commit**: YES
  - Message: `feat(engagement): add Depanssur notification templates and NATS triggers`
  - Files: `services/service-engagement/src/domain/depanssur/`
  - Pre-commit: `cd services/service-engagement && npx tsc --noEmit`

---

- [ ] 15. Frontend — Parcours de Souscription Depanssur

  **What to do**:
  - **Créer un wizard/stepper de souscription** accessible depuis la fiche client (bouton "Souscrire Depanssur") :
    - **Étape 1 — Plan** : sélection Essentiel/Standard/Premium avec comparaison features + prix
    - **Étape 2 — Options** : checkboxes appareils additionnels, dépendances, priorité 24h avec prix
    - **Étape 3 — Adresse de risque** : formulaire adresse avec validation postale, distinction facturation/risque
    - **Étape 4 — Paiement** : sélection SEPA ou CB, saisie/sélection moyen de paiement existant
    - **Étape 5 — Consentements** : checkboxes RGPD email/SMS + CGS Depanssur (obligatoire)
    - **Étape 6 — Récapitulatif** : résumé de tout + bouton "Confirmer la souscription"
  - **À la confirmation** : appeler CreateAbonnement gRPC + créer les consentements + planifier le premier paiement
  - **Utiliser les composants existants** : stepper shadcn/ui ou créer un composant Step simple

  **Must NOT do**:
  - Ne PAS créer de portail public de souscription — c'est un workflow back-office (agent CRM)
  - Ne PAS implémenter le paiement en direct ici — juste configurer le moyen de paiement pour les prélèvements récurrents
  - Ne PAS permettre la souscription sans consentement CGS Depanssur (validation obligatoire)

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: Wizard multi-étapes avec formulaires, comparaison de plans, validation
  - **Skills**: [`frontend-ui-ux`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 5 (with Tasks 14, 16)
  - **Blocks**: None
  - **Blocked By**: Tasks 7, 12

  **References**:

  **Pattern References**:
  - `frontend/src/app/(main)/clients/[id]/client-detail-client.tsx` — Composant fiche client existant (point d'intégration du bouton "Souscrire Depanssur")
  - `frontend/src/components/create-client-dialog.tsx` — Pattern de dialog formulaire multi-sections (à adapter pour le wizard)

  **Documentation References**:
  - CDC §4 — Parcours d'abonnement : "Souscription (web/agent) → capture plan, options, adresse de risque, paiement, consentements"

  **Acceptance Criteria**:
  - [ ] Wizard 6 étapes accessible depuis la fiche client
  - [ ] Sélection de plan avec comparaison visuelle
  - [ ] Options avec prix additionnels
  - [ ] Validation adresse de risque (format postal)
  - [ ] Consentement CGS Depanssur obligatoire pour confirmer
  - [ ] Soumission crée l'abonnement via gRPC

  **Agent-Executed QA Scenarios**:

  ```
  Scenario: Complete subscription wizard
    Tool: Playwright
    Preconditions: Dev server, client exists without Depanssur subscription
    Steps:
      1. Navigate to client detail page
      2. Click "Souscrire Depanssur" button
      3. Wait for wizard dialog/page
      4. Step 1: Select plan "Standard"
      5. Step 2: Check "Priorité 24h" option
      6. Step 3: Fill address with valid postal format
      7. Step 4: Select "SEPA" payment method
      8. Step 5: Check all consent checkboxes
      9. Step 6: Review summary, click "Confirmer"
      10. Wait for success message (timeout: 10s)
      11. Assert: Abonnement tab shows new subscription
      12. Screenshot: .sisyphus/evidence/task-15-subscription-complete.png
    Expected Result: Subscription created through wizard
    Evidence: .sisyphus/evidence/task-15-subscription-complete.png

  Scenario: Cannot confirm without CGS consent
    Tool: Playwright
    Steps:
      1. Complete steps 1-4
      2. On step 5: check RGPD but NOT CGS Depanssur
      3. Try to proceed to step 6
      4. Assert: validation error shown, cannot proceed
      5. Screenshot: .sisyphus/evidence/task-15-consent-required.png
    Expected Result: Blocked without CGS consent
    Evidence: .sisyphus/evidence/task-15-consent-required.png
  ```

  **Commit**: YES
  - Message: `feat(frontend): add Depanssur subscription wizard (6-step flow)`
  - Files: `frontend/src/app/(main)/clients/[id]/components/souscription-depanssur/`
  - Pre-commit: `cd frontend && npx tsc --noEmit`

---

- [ ] 16. Frontend — Dashboard Reporting Depanssur

  **What to do**:
  - **Étendre le proto dashboard** pour ajouter une RPC `GetKPIsDepanssur` :
    - MRR (Monthly Recurring Revenue) : somme des prixTtc des abonnements actifs mensualisés
    - Churn rate : nb résiliations / nb abonnés actifs sur la période
    - Sinistralité déclarée : nb dossiers / nb abonnés actifs, montant total pris en charge
    - NPS moyen : moyenne des scores NPS post-clôture
    - DSO (Days Sales Outstanding) : délai moyen de paiement des échéances
  - **Implémenter le service** dans service-core (ou le service qui sert le dashboard) :
    - Queries d'agrégation SQL sur les tables abonnement + dossier + paiement
  - **Créer la page frontend** `/statistiques/depanssur` ou ajouter une section dans `/statistiques` :
    - 5 KPI cards : MRR, Churn, Sinistralité, NPS, DSO
    - Graphique évolution MRR (area chart par mois)
    - Graphique sinistralité par type de dossier (pie chart)
    - Graphique NPS distribution (bar chart 1-10)
    - Filtre période (mois en cours, trimestre, année)

  **Must NOT do**:
  - Ne PAS modifier les KPIs existants du dashboard principal
  - Ne PAS créer de page séparée si l'architecture existante utilise des sections/onglets
  - Ne PAS faire de calculs côté frontend — tout via gRPC

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: Dashboard avec KPI cards + 3 types de graphiques, data visualization
  - **Skills**: [`frontend-ui-ux`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 5 (with Tasks 14, 15)
  - **Blocks**: None
  - **Blocked By**: Tasks 10, 11

  **References**:

  **Pattern References**:
  - `frontend/src/app/(main)/statistiques/statistiques-page-client.tsx` — Page statistiques existante à étendre
  - `frontend/src/components/chart-area-interactive.tsx` — Pattern de graphique area chart existant
  - `frontend/src/components/chart-pie-contracts.tsx` — Pattern de pie chart existant
  - `frontend/src/components/dashboard-kpis.tsx` — Pattern de KPI cards existant
  - `frontend/src/components/stats/chart-ca-evolution.tsx` — Pattern d'évolution CA (similaire à MRR evolution)
  - `packages/proto/src/dashboard/dashboard.proto` — Proto dashboard existant à étendre

  **Documentation References**:
  - CDC §2 — Reporting : "MRR, churn, sinistralité déclarée, NPS, DSO"

  **Acceptance Criteria**:
  - [ ] RPC `GetKPIsDepanssur` retourne les 5 métriques
  - [ ] 5 KPI cards affichées (MRR, Churn, Sinistralité, NPS, DSO)
  - [ ] Graphique MRR evolution fonctionnel
  - [ ] Graphique sinistralité par type fonctionnel
  - [ ] Filtre période fonctionnel

  **Agent-Executed QA Scenarios**:

  ```
  Scenario: Reporting page displays KPIs
    Tool: Playwright
    Preconditions: Dev server, abonnements and dossiers exist
    Steps:
      1. Navigate to reporting page (statistiques or dedicated section)
      2. Wait for KPI cards loaded (timeout: 10s)
      3. Assert: MRR card visible with numeric value
      4. Assert: Churn card visible with percentage
      5. Assert: NPS card visible with score (1-10 range)
      6. Assert: at least one chart rendered
      7. Screenshot: .sisyphus/evidence/task-16-reporting-dashboard.png
    Expected Result: Dashboard shows all 5 KPIs + charts
    Evidence: .sisyphus/evidence/task-16-reporting-dashboard.png
  ```

  **Commit**: YES
  - Message: `feat(frontend): add Depanssur reporting dashboard (MRR, churn, NPS, DSO, sinistralité)`
  - Files: `frontend/src/app/(main)/statistiques/depanssur/`, `packages/proto/src/dashboard/dashboard.proto`
  - Pre-commit: `cd frontend && npx tsc --noEmit`

---

- [ ] 17. Tests Unitaires — Logique Métier Depanssur

  **What to do**:
  - **Créer les tests** dans `services/service-core/src/domain/depanssur/services/__tests__/` :
    - `regle-depanssur.service.spec.ts` :
      - Test carence : dossier pendant carence → rejeté
      - Test carence : dossier après carence → accepté
      - Test plafond nb interventions : 3/3 → rejeté, 2/3 → accepté
      - Test plafond montant annuel : 800/1000€ + 300€ → rejeté
      - Test plafond par intervention : 500€ > plafond 400€ → rejeté
      - Test upgrade immédiat : nouveau plan actif immédiatement
      - Test downgrade N+1 : ancien plan actif jusqu'à prochaine échéance
      - Test changement adresse avant cutoff → immédiat
      - Test changement adresse après cutoff → N+1
      - Test reset compteur annuel à l'anniversaire
    - `abonnement.service.spec.ts` :
      - Test CRUD basique
      - Test changement statut avec historique
      - Test un seul abonnement actif par client
    - `dossier-declaratif.service.spec.ts` :
      - Test CRUD basique
      - Test transitions de statut valides (ENREGISTRE → EN_ANALYSE → ACCEPTE/REFUSE → CLOTURE)
      - Test transitions invalides rejetées (CLOTURE → ENREGISTRE)
      - Test MAJ compteurs à la décision ACCEPTE
    - `depanssur-webhook.service.spec.ts` :
      - Test idempotency (même eventId traité une seule fois)
      - Test handleCaseCreated crée un dossier
      - Test handleCaseDecision met à jour les champs décision
      - Test signature HMAC valide/invalide
  - **Suivre le pattern Bun test** de `service-commercial/src/domain/commercial/services/__tests__/`
  - **Utiliser des mocks** pour les repositories TypeORM et les services NATS

  **Must NOT do**:
  - Ne PAS écrire de tests d'intégration (hors scope — unit tests uniquement)
  - Ne PAS tester les controllers gRPC (testés via QA scenarios)
  - Ne PAS écrire de tests pour le frontend (hors scope)

  **Recommended Agent Profile**:
  - **Category**: `ultrabrain`
    - Reason: Tests de logique métier complexe avec edge cases, mocking, assertions précises
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 6 (final, sequential)
  - **Blocks**: None
  - **Blocked By**: All previous tasks

  **References**:

  **Pattern References**:
  - `services/service-commercial/src/domain/commercial/services/__tests__/canary.spec.ts` — Pattern de test Bun avec describe/it/expect et helpers
  - `services/service-commercial/src/domain/commercial/services/__tests__/commission-calculation.service.spec.ts` — Pattern de test de logique métier complexe avec mocks
  - `services/service-commercial/src/domain/commercial/services/__tests__/contestation-workflow.service.spec.ts` — Pattern de test de workflow avec transitions de statut

  **Documentation References**:
  - CDC §5 — Règles à tester (carence, plafonds, upgrade/downgrade)
  - CDC §6 — Séquence dunning à tester
  - CDC §8 — Webhooks à tester

  **WHY Each Reference Matters**:
  - `canary.spec.ts` : Pattern exact de setup (imports Bun, mock helpers, describe/it structure)
  - `commission-calculation.service.spec.ts` : Pattern de test de calcul métier avec assertions numériques précises
  - `contestation-workflow.service.spec.ts` : Pattern de test de workflow statut — exactement ce qu'on teste pour dossier déclaratif

  **Acceptance Criteria**:
  - [ ] 4 fichiers de test créés dans `__tests__/`
  - [ ] ≥ 25 test cases au total
  - [ ] `regle-depanssur.service.spec.ts` couvre les 10 cas listés
  - [ ] `dossier-declaratif.service.spec.ts` couvre transitions valides ET invalides
  - [ ] `depanssur-webhook.service.spec.ts` couvre idempotency + HMAC
  - [ ] `cd services/service-core && npm run test` → tous les tests passent (0 failures)

  **Agent-Executed QA Scenarios**:

  ```
  Scenario: All tests pass
    Tool: Bash
    Preconditions: All implementation tasks completed
    Steps:
      1. cd services/service-core && npm run test
      2. Assert: exit code 0
      3. Assert: output shows "X tests passed, 0 failed"
      4. Assert: X >= 25
    Expected Result: All unit tests pass
    Evidence: Test output captured

  Scenario: Test coverage for business rules
    Tool: Bash
    Steps:
      1. cd services/service-core && npm run test:cov
      2. Assert: regle-depanssur.service.ts coverage > 80%
      3. Assert: dossier-declaratif.service.ts coverage > 70%
    Expected Result: Good coverage on critical business logic
    Evidence: Coverage report captured
  ```

  **Commit**: YES
  - Message: `test(core): add unit tests for Depanssur business rules, workflows and webhooks`
  - Files: `services/service-core/src/domain/depanssur/services/__tests__/`
  - Pre-commit: `cd services/service-core && npm run test`

---

## Commit Strategy

| After Task | Message | Key Files | Verification |
|------------|---------|-----------|--------------|
| 1 | `feat(proto): add Depanssur bounded context proto definitions` | `packages/proto/src/depanssur/` | `npm run gen:all` |
| 2 | `feat(core): extend client with civilité, RGPD consents, address type` | `service-core/entities/` | `npx tsc --noEmit` |
| 3 | `feat(core): add Depanssur subscription bounded context` | `service-core/domain/depanssur/` | `npx tsc --noEmit` |
| 4 | `feat(core): add dossier déclaratif mirror entity` | `service-core/domain/depanssur/` | `npx tsc --noEmit` |
| 5 | `feat(finance): add credit note support` | `service-finance/factures/` | `npx tsc --noEmit` |
| 6 | `feat(frontend): add civilité, RGPD, address type to client` | `frontend/clients/` | `npx tsc --noEmit` |
| 7 | `feat(core): implement Depanssur business rules` | `service-core/domain/depanssur/` | `npx tsc --noEmit` |
| 8 | `feat(core): add Depanssur webhook receiver` | `service-core/domain/depanssur/` | `npx tsc --noEmit` |
| 9 | `feat(finance): implement Depanssur dunning sequence` | `service-finance/` | `npx tsc --noEmit` |
| 10 | `feat(core): add NATS events for Depanssur domain` | `shared-kernel/events/` | `npx tsc --noEmit` |
| 11 | `feat(core): add Depanssur scheduled jobs` | `service-core/domain/depanssur/` | `npx tsc --noEmit` |
| 12 | `feat(frontend): add Depanssur subscription tab` | `frontend/clients/` | `npx tsc --noEmit` |
| 13 | `feat(frontend): add dossier déclaratif pages` | `frontend/dossiers-depanssur/` | `npx tsc --noEmit` |
| 14 | `feat(engagement): add Depanssur notification templates` | `service-engagement/` | `npx tsc --noEmit` |
| 15 | `feat(frontend): add Depanssur subscription wizard` | `frontend/clients/` | `npx tsc --noEmit` |
| 16 | `feat(frontend): add Depanssur reporting dashboard` | `frontend/statistiques/` | `npx tsc --noEmit` |
| 17 | `test(core): add Depanssur business rules unit tests` | `service-core/__tests__/` | `npm run test` |

---

## Success Criteria

### Verification Commands
```bash
# Proto generation
cd packages/proto && npm run gen:all  # Expected: 0 errors, files generated in gen/ts/

# TypeScript compilation (all services)
cd services/service-core && npx tsc --noEmit  # Expected: 0 errors
cd services/service-finance && npx tsc --noEmit  # Expected: 0 errors
cd services/service-engagement && npx tsc --noEmit  # Expected: 0 errors
cd frontend && npx tsc --noEmit  # Expected: 0 errors

# Unit tests
cd services/service-core && npm run test  # Expected: >= 25 tests pass, 0 fail

# Services start without errors
cd services/service-core && npm run start:dev  # Expected: "Nest application successfully started"
cd services/service-finance && npm run start:dev  # Expected: "Nest application successfully started"
```

### Final Checklist
- [ ] All 4 new entities exist (AbonnementDepanssur, OptionAbonnement, CompteurPlafond, DossierDeclaratif) + support entities
- [ ] All proto definitions compile and generate TypeScript types
- [ ] Client has civilité, RGPD consents, and address type fields
- [ ] gRPC CRUD for abonnement and dossier déclaratif work
- [ ] Webhook receiver accepts, validates, and processes all 6 event types
- [ ] Business rules enforce carence, plafonds, upgrade/downgrade correctly
- [ ] Dunning sequence J0/J+5/J+10 triggers correctly on payment failure
- [ ] 3 cron jobs execute at scheduled times
- [ ] 7 notification templates trigger on correct events
- [ ] Frontend abonnement tab displays in client detail
- [ ] Frontend dossier listing and detail pages work
- [ ] Frontend subscription wizard creates abonnement
- [ ] Dashboard shows MRR, churn, sinistralité, NPS, DSO
- [ ] All "Must NOT Have" guardrails respected (no new service, no terrain features, no destructive migrations)
- [ ] ≥ 25 unit tests pass
