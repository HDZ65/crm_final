# CDC Action Prévoyance : Conciergerie + Justi+ + Wincash — Plan MVP Complet

## TL;DR

> **Quick Summary**: Implémenter les 10 étapes MVP du cahier des charges pour intégrer 3 services (Conciergerie Privée, Justi+, Wincash) dans le CRM existant — incluant schéma de données multi-service, webhooks entrants avec mocks, moteur de bundle tarifaire, facturation consolidée, portail client, tickets Conciergerie avec SLA, dashboards KPI, RBAC spécifique et tests E2E.
>
> **Deliverables**:
> - Extension service-engagement : entités DemandeConciergerie, CasJuridique, OperationCashback
> - Extension service-core : champs multi-service sur Client, SouscriptionMultiService
> - Webhook handlers Wincash + Justi+ avec mode mock (pattern Maileva)
> - Moteur de bundle/remise paramétrable dans service-commercial
> - Facturation consolidée multi-service dans service-finance
> - Portail client self-care (Next.js)
> - Module tickets Conciergerie avec SLA
> - Dashboards KPI multi-service
> - Rôles métier spécifiques (Support, Avocats, Ops Wincash, Finance)
> - Suite de tests E2E
>
> **Estimated Effort**: XL (10 étapes MVP, ~50 TODOs)
> **Parallel Execution**: YES - 4 waves
> **Critical Path**: Task 1 → Tasks 2-4 → Tasks 5-7 → Tasks 8-10

---

## Context

### Original Request
Analyser le cahier des charges "Gestion des clients Action Prévoyance Conciergerie - Justi+ - Wincash" et identifier ce qui manque au CRM pour gérer les demandes, puis planifier l'implémentation complète des 10 étapes MVP.

### Interview Summary
**Key Discussions**:
- **Roadmap**: Suivre les 10 étapes MVP du CDC dans l'ordre
- **APIs Justi+/Wincash**: Pas d'accès → mode mock avec env toggle (pattern Maileva)
- **Architecture Demandes**: Ajout dans service-engagement (pas de nouveau microservice)
- **Tests**: Tests après implémentation + Agent-Executed QA pour chaque tâche
- **Périmètre**: Plan complet couvrant les 10 étapes

**Research Findings**:
- Le CRM est un monorepo NestJS microservices DDD (5 services + frontend Next.js 15)
- Aucune entité demande/ticket/cas/cashback n'existe côté backend
- Le frontend a un composant tickets.tsx 100% mock data
- Le système de paiement est très complet (6 PSPs, retry, reminders, calendar)
- Proto messages servent de DTO — CI pipeline interdit les DTO manuels
- Pattern mock Maileva (`MAILEVA_USE_MOCK=true`) existe dans service-logistics
- Auth proto a déjà AccessContext avec roles[], permissions[], breakglass
- service-engagement a déjà ~10 entités — créer un sous-domaine `domain/services/` pour les nouvelles

### Metis Review
**Identified Gaps** (addressed):
- Proto = DTO obligatoire (CI enforced) → plan utilise proto-generated types, pas de DTO manuels
- Pattern mock Maileva à suivre → utiliser `WINCASH_USE_MOCK=true` et `JUSTI_PLUS_USE_MOCK=true`
- Sous-domaine `domain/services/` dans service-engagement → séparer des entités engagement existantes
- AccessContext auth.proto existant → Step 9 moins lourd, guards à implémenter
- Webhook patterns dans clone/winaity-clean → référence pour handlers

---

## Work Objectives

### Core Objective
Intégrer la gestion complète de 3 services (Conciergerie Privée, Justi+, Wincash) dans le CRM existant : souscription multi-service, facturation consolidée, demandes/tickets avec SLA, intégrations webhooks, et reporting dédié.

### Concrete Deliverables
- 6+ nouvelles entités TypeORM réparties sur 3 services
- 6+ nouveaux proto definitions
- Webhook handlers avec mode mock
- Moteur bundle paramétrable
- Portail client multi-service (frontend)
- Module Conciergerie complet
- 5+ dashboards KPI
- Rôles métier + guards RBAC
- Suite de tests E2E

### Definition of Done
- [ ] Les 3 services (Conciergerie, Justi+, Wincash) sont gérables depuis le CRM
- [ ] Un client peut souscrire à 1-3 services avec facturation consolidée
- [ ] Les remises bundle s'appliquent/recalculent automatiquement
- [ ] Les webhooks Justi+/Wincash fonctionnent en mode mock
- [ ] Le portail client permet l'autogestion des services
- [ ] Les tickets Conciergerie ont un suivi SLA
- [ ] Les KPIs spécifiques sont affichés dans les dashboards
- [ ] Les rôles métier restreignent correctement l'accès
- [ ] Les tests E2E couvrent les scénarios solo, dual et triple service

### Must Have
- Facturation consolidée (1 prélèvement pour 1-3 services)
- Remises bundle automatiques et paramétrables
- Webhooks bidirectionnels (au moins en mock)
- Tickets Conciergerie avec SLA tracking
- Portail client self-care
- RBAC par rôle métier

### Must NOT Have (Guardrails)
- ❌ NE PAS créer de fichiers DTO manuels (`*.dto.ts`) — utiliser proto-generated types (CI enforced)
- ❌ NE PAS créer de service mock séparé — utiliser le pattern env toggle (`*_USE_MOCK=true`) comme Maileva
- ❌ NE PAS toucher aux entités existantes de service-engagement (`domain/engagement/`) — créer `domain/services/` pour les nouvelles entités
- ❌ NE PAS refactorer les services existants sauf si strictement nécessaire pour l'intégration
- ❌ NE PAS implémenter les vraies APIs Justi+/Wincash — mock seulement
- ❌ NE PAS ajouter de logique métier dans les controllers — domain layer uniquement
- ❌ NE PAS utiliser snake_case dans le code applicatif TypeScript (CI warning)
- ❌ NE PAS utiliser le type `any` sans justification (CI warning si >100)

---

## Verification Strategy (MANDATORY)

> **UNIVERSAL RULE: ZERO HUMAN INTERVENTION**
>
> ALL tasks in this plan MUST be verifiable WITHOUT any human action.

### Test Decision
- **Infrastructure exists**: YES (bun test dans chaque service)
- **Automated tests**: Tests-after (écrire les tests après implémentation)
- **Framework**: bun test (existant)

### Agent-Executed QA Scenarios (MANDATORY — ALL tasks)
Chaque tâche inclut des scénarios QA exécutés par l'agent via Bash (curl pour APIs gRPC/REST), Playwright (pour le frontend), et interactive_bash (pour les commandes CLI).

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Start Immediately):
├── Task 1: Schéma de données — Extension Client multi-service (service-core)
├── Task 2: Schéma de données — Entités services dans service-engagement
└── Task 3: Schéma de données — Proto definitions pour nouveaux services

Wave 2 (After Wave 1):
├── Task 4: Webhooks Wincash → CRM (handlers + mock)
├── Task 5: Webhooks Justi+ → CRM (handlers + mock)
├── Task 6: Moteur bundle/remise paramétrable (service-commercial)
└── Task 7: Extension facturation consolidée (service-finance)

Wave 3 (After Wave 2):
├── Task 8: Portail client multi-service (frontend)
├── Task 9: Module Conciergerie — Tickets + SLA (service-engagement + frontend)
└── Task 10: Dashboards KPI multi-service (frontend)

Wave 4 (After Wave 3):
├── Task 11: RBAC + Rôles métier + GDPR
└── Task 12: Tests E2E — Scénarios solo, dual, triple
```

### Dependency Matrix

| Task | Depends On | Blocks | Can Parallelize With |
|------|------------|--------|---------------------|
| 1 | None | 4, 5, 6, 7, 8, 9 | 2, 3 |
| 2 | None | 4, 5, 9 | 1, 3 |
| 3 | None | 4, 5, 6, 7, 8, 9 | 1, 2 |
| 4 | 1, 2, 3 | 8, 10, 12 | 5, 6, 7 |
| 5 | 1, 2, 3 | 8, 10, 12 | 4, 6, 7 |
| 6 | 1, 3 | 7, 8, 12 | 4, 5, 7 |
| 7 | 1, 3, 6 | 8, 12 | 4, 5 |
| 8 | 4, 5, 6, 7 | 12 | 9, 10 |
| 9 | 2, 3 | 10, 12 | 8, 10 |
| 10 | 4, 5, 9 | 12 | 8 |
| 11 | 3 | 12 | 8, 9, 10 |
| 12 | 4-11 | None | None (final) |

### Agent Dispatch Summary

| Wave | Tasks | Recommended Agents |
|------|-------|-------------------|
| 1 | 1, 2, 3 | task(category="unspecified-high", load_skills=["microservice-maintainer"]) |
| 2 | 4, 5, 6, 7 | task(category="unspecified-high", load_skills=["microservice-maintainer"]) |
| 3 | 8, 9, 10 | task(category="visual-engineering", load_skills=["frontend-ui-ux"]) |
| 4 | 11, 12 | task(category="deep", load_skills=["microservice-maintainer"]) |

---

## TODOs

---

### WAVE 1 — Schéma de Données (Foundation)

---

- [x] 1. Extension Client Multi-Service (service-core)

  **What to do**:
  - Ajouter les colonnes multi-service sur l'entité `ClientBaseEntity` :
    - `has_conciergerie: boolean` (default false)
    - `has_justi_plus: boolean` (default false)
    - `has_wincash: boolean` (default false)
    - `uuid_wincash: string | null` (identifiant externe Wincash)
    - `uuid_justi_plus: string | null` (identifiant externe Justi+)
    - `date_premiere_souscription: Date | null`
    - `canal_acquisition: string | null` (web, phone, partenaire)
  - Créer une migration TypeORM pour ajouter ces colonnes à la table `clientbases`
  - Mettre à jour le proto `clients.proto` pour exposer ces nouveaux champs dans les messages gRPC
  - Ajouter les tests unitaires pour les nouvelles propriétés

  **Must NOT do**:
  - Ne pas créer de DTO manuel — utiliser le proto-generated type
  - Ne pas modifier les champs existants de ClientBaseEntity
  - Ne pas toucher au controller existant (sera fait après les protos)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Modification d'entité existante avec migration et proto — travail structurel
  - **Skills**: [`microservice-maintainer`]
    - `microservice-maintainer`: Ajout de champs sur un service existant, pattern DDD

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 2, 3)
  - **Blocks**: Tasks 4, 5, 6, 7, 8, 9
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `services/service-core/src/domain/clients/entities/client-base.entity.ts` — Entité à étendre (colonnes existantes : id, organisationId, typeClient, nom, prenom, email, telephone, statut, etc.)
  - `services/service-core/src/domain/clients/entities/client-partenaire.entity.ts` — Pattern pour sous-type client avec colonnes supplémentaires

  **API/Type References**:
  - `packages/proto/` — Emplacement des proto definitions (chercher `clients.proto`)

  **Test References**:
  - `services/service-core/` — Chercher les tests existants pour le pattern

  **Documentation References**:
  - `services/service-core/CLAUDE.md` — Architecture DDD du service, wiring modules, migration patterns

  **Acceptance Criteria**:
  - [ ] `client-base.entity.ts` contient les 7 nouveaux champs
  - [ ] Migration TypeORM créée et exécutable : `bun run migration:run` → SUCCESS
  - [ ] Proto `clients.proto` mis à jour avec les nouveaux champs dans les messages Client
  - [ ] `bun run build` dans service-core → SUCCESS (0 errors)
  - [ ] `bun run proto:generate` → SUCCESS

  **Agent-Executed QA Scenarios**:

  ```
  Scenario: Migration adds new columns to clientbases table
    Tool: Bash
    Preconditions: PostgreSQL running, core_db exists
    Steps:
      1. cd services/service-core && bun run migration:run
      2. Connect to core_db and verify: SELECT column_name FROM information_schema.columns WHERE table_name = 'clientbases' AND column_name IN ('has_conciergerie', 'has_justi_plus', 'has_wincash', 'uuid_wincash', 'uuid_justi_plus')
      3. Assert: 5 columns found
    Expected Result: All new columns present in database
    Evidence: Query output captured

  Scenario: Build succeeds with new entity fields
    Tool: Bash
    Preconditions: None
    Steps:
      1. cd services/service-core && bun run build
      2. Assert: exit code 0, no TypeScript errors
    Expected Result: Clean build
    Evidence: Build output captured
  ```

  **Commit**: YES
  - Message: `feat(core): add multi-service fields to client entity (conciergerie, justi+, wincash)`
  - Files: `services/service-core/src/domain/clients/entities/client-base.entity.ts`, migration file, proto updates
  - Pre-commit: `bun run build`

---

- [x] 2. Entités Services dans service-engagement

  **What to do**:
  - Créer le sous-répertoire `services/service-engagement/src/domain/services/entities/` pour isoler des entités engagement existantes
  - Créer l'entité `DemandeConciergerie` :
    - id (uuid PK), organisationId, clientId, reference (auto-generated), objet, description (text)
    - categorie (enum: assistance_administrative, demarche, conseil, recherche, reservation, autre)
    - canal (enum: email, telephone, web, chat)
    - priorite (enum: basse, normale, haute, urgente)
    - statut (enum: nouveau, ouvert, en_cours, en_attente, resolu, ferme)
    - assigneA (uuid, nullable — référence utilisateur)
    - creePar (uuid)
    - dateLimite (timestamp, nullable — deadline SLA)
    - dateResolution (timestamp, nullable)
    - slaRespected (boolean, nullable)
    - satisfactionScore (integer 1-5, nullable)
    - metadata (jsonb, nullable)
    - createdAt, updatedAt
  - Créer l'entité `CommentaireDemande` :
    - id, demandeId, auteurId, contenu (text), type (enum: commentaire, note_interne, reponse_client), createdAt
  - Créer l'entité `CasJuridique` (Justi+) :
    - id, organisationId, clientId, externalId (uuid Justi+), reference, titre, description
    - categorie (enum: droit_travail, droit_famille, droit_consommation, droit_logement, autre)
    - statut (enum: ouvert, en_cours, en_attente_documents, cloture)
    - avocatAssigne (string, nullable), dateOuverture, dateCloture
    - documentsCount (integer), satisfactionScore (integer, nullable)
    - metadata (jsonb), createdAt, updatedAt
  - Créer l'entité `OperationCashback` (Wincash) :
    - id, organisationId, clientId, externalId (uuid Wincash)
    - marchand (string), montantAchat (decimal), montantCashback (decimal)
    - statut (enum: tracked, validated, paid, rejected)
    - dateAchat, dateValidation, datePaiement
    - metadata (jsonb), createdAt, updatedAt
  - Créer une migration pour les 4 tables (demande_conciergerie, commentaire_demande, cas_juridique, operation_cashback)
  - Enregistrer les entités dans engagement.module.ts via TypeOrmModule.forFeature()
  - Créer les repository interfaces dans `domain/services/repositories/`

  **Must NOT do**:
  - Ne pas modifier les entités existantes dans `domain/engagement/entities/`
  - Ne pas créer de DTO manuels — proto-generated types uniquement
  - Ne pas ajouter de logique métier dans les entités — garder les entités simples (TypeORM)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Création de 4 nouvelles entités avec migration — travail structurel important
  - **Skills**: [`microservice-maintainer`]
    - `microservice-maintainer`: Ajout de features sur service existant, pattern DDD

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 3)
  - **Blocks**: Tasks 4, 5, 9
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `services/service-engagement/src/domain/engagement/entities/tache.entity.ts` — Pattern entité avec enums (TacheType, TachePriorite, TacheStatut), metadata jsonb, liens client/contrat
  - `services/service-engagement/src/domain/engagement/entities/activite.entity.ts` — Pattern entité simple avec ManyToOne
  - `services/service-engagement/src/domain/engagement/entities/notification.entity.ts` — Pattern notification avec types

  **API/Type References**:
  - `packages/shared-kernel/src/persistence/base.orm-entity.ts` — Base entity class (si applicable)

  **Documentation References**:
  - `services/service-engagement/CLAUDE.md` — Architecture, bounded context, module wiring patterns

  **Acceptance Criteria**:
  - [ ] 4 fichiers entity créés dans `domain/services/entities/`
  - [ ] Repository interfaces créés dans `domain/services/repositories/`
  - [ ] Migration créée et exécutable
  - [ ] Entités enregistrées dans `engagement.module.ts`
  - [ ] `bun run build` dans service-engagement → SUCCESS

  **Agent-Executed QA Scenarios**:

  ```
  Scenario: Migration creates 4 new tables
    Tool: Bash
    Preconditions: PostgreSQL running, engagement_db exists
    Steps:
      1. cd services/service-engagement && bun run migration:run
      2. Connect to engagement_db
      3. SELECT table_name FROM information_schema.tables WHERE table_name IN ('demande_conciergerie', 'commentaire_demande', 'cas_juridique', 'operation_cashback')
      4. Assert: 4 tables found
    Expected Result: All tables created
    Evidence: Query output

  Scenario: Build succeeds with new entities
    Tool: Bash
    Steps:
      1. cd services/service-engagement && bun run build
      2. Assert: exit code 0
    Expected Result: Clean build
    Evidence: Build output
  ```

  **Commit**: YES
  - Message: `feat(engagement): add service entities — DemandeConciergerie, CasJuridique, OperationCashback`
  - Files: `services/service-engagement/src/domain/services/**`
  - Pre-commit: `bun run build`

---

- [x] 3. Proto Definitions pour Nouveaux Services

  **What to do**:
  - Créer `packages/proto/src/services/conciergerie.proto` :
    - Messages : DemandeConciergerie, CommentaireDemande, CreateDemandeRequest/Response, UpdateDemandeRequest, ListDemandesRequest/Response, AddCommentaireRequest
    - Service : ConciergerieSvc avec RPCs : CreateDemande, GetDemande, ListDemandes, UpdateDemande, AddCommentaire, AssignerDemande, CloturerDemande
  - Créer `packages/proto/src/services/justi-plus.proto` :
    - Messages : CasJuridique, SyncCasRequest/Response
    - Service : JustiPlusSvc avec RPCs : SyncCas, GetCas, ListCas
  - Créer `packages/proto/src/services/wincash.proto` :
    - Messages : OperationCashback, SyncCashbackRequest/Response
    - Service : WincashSvc avec RPCs : SyncCashback, GetOperation, ListOperations
  - Créer `packages/proto/src/events/services.proto` :
    - Events NATS : DemandeCreated, DemandeUpdated, DemandeClosed, CasJuridiqueSynced, CashbackSynced
  - Créer `packages/proto/src/services/bundle.proto` :
    - Messages : BundleConfiguration, CalculatePriceRequest/Response
    - Service : BundleSvc avec RPCs : GetConfiguration, UpdateConfiguration, CalculatePrice, RecalculateClient
  - Exécuter `bun run proto:generate` pour générer les types TypeScript
  - Vérifier que les types générés sont accessibles depuis les services

  **Must NOT do**:
  - Ne pas créer de DTO manuels — les proto-generated types SONT les DTOs
  - Ne pas dupliquer des messages existants (réutiliser les common messages)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Création de 5 proto files avec messages et services — fondation API
  - **Skills**: [`microservice-maintainer`]
    - `microservice-maintainer`: Connaissance des patterns proto du projet

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 2)
  - **Blocks**: Tasks 4, 5, 6, 7, 8, 9, 10, 11
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `packages/proto/src/` — Répertoire des proto existants, chercher les patterns de messages et services
  - `packages/proto/src/security/auth.proto` — Pattern AccessContext pour RBAC (roles[], permissions[])

  **Documentation References**:
  - `services/service-core/CLAUDE.md` — Section "gRPC Services" pour les conventions de nommage proto

  **Acceptance Criteria**:
  - [ ] 5 fichiers proto créés
  - [ ] `bun run proto:generate` → SUCCESS
  - [ ] Types TypeScript générés et importables

  **Agent-Executed QA Scenarios**:

  ```
  Scenario: Proto generation succeeds
    Tool: Bash
    Steps:
      1. cd packages/proto && bun run proto:generate
      2. Assert: exit code 0
      3. Verify generated types exist for ConciergerieSvc, JustiPlusSvc, WincashSvc
    Expected Result: All proto types generated
    Evidence: File listing + build output
  ```

  **Commit**: YES
  - Message: `feat(proto): add service definitions — conciergerie, justi+, wincash, bundle, events`
  - Files: `packages/proto/src/services/*.proto`, `packages/proto/src/events/services.proto`
  - Pre-commit: `bun run proto:generate`

---

### WAVE 2 — Intégrations & Moteur Bundle

---

- [x] 4. Webhooks Wincash → CRM

  **What to do**:
  - Créer le service mock Wincash dans service-engagement : `infrastructure/external/wincash/wincash.service.ts`
    - Suivre le pattern Maileva : `WINCASH_USE_MOCK=true` (env toggle)
    - Mode mock : retourne des données fictives cohérentes
    - Mode réel : placeholder pour future API (throw "Not implemented")
  - Créer les webhook/event handlers NATS dans `infrastructure/messaging/nats/handlers/` :
    - `wincash-customer-handler.ts` : gère `wincash.customer.created` et `wincash.customer.updated`
    - `wincash-subscription-handler.ts` : gère `wincash.subscription.created` et `wincash.subscription.updated`
    - `wincash-cashback-handler.ts` : gère `wincash.cashback.tracked`, `wincash.cashback.validated`, `wincash.cashback.paid`
  - Créer le controller gRPC `WincashController` dans `interfaces/grpc/controllers/services/`
  - Implémenter le repository `OperationCashbackService` dans `infrastructure/persistence/typeorm/repositories/services/`
  - Enregistrer dans le module engagement
  - Écrire les tests unitaires pour les handlers et le service mock

  **Must NOT do**:
  - Ne pas créer un service mock séparé (pas de `mock-wincash-service/`)
  - Ne pas créer de DTO manuels — utiliser proto-generated types de `wincash.proto`

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Intégration webhook + service mock + handlers NATS — travail d'infrastructure
  - **Skills**: [`microservice-maintainer`]
    - `microservice-maintainer`: Ajout feature sur service existant

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 5, 6, 7)
  - **Blocks**: Tasks 8, 10, 12
  - **Blocked By**: Tasks 1, 2, 3

  **References**:

  **Pattern References**:
  - `services/service-logistics/src/infrastructure/external/maileva/maileva.service.ts` — **Pattern mock toggle** : `MAILEVA_USE_MOCK=true`, constructor qui lit ConfigService, mode mock vs réel
  - `services/service-engagement/src/infrastructure/messaging/nats/handlers/` — Patterns handlers NATS existants (ClientCreatedHandler)
  - `clone/winaity-clean/services/` — Chercher `*-events.listener.ts` pour patterns webhook NATS

  **Documentation References**:
  - `services/service-engagement/CLAUDE.md` — Event handling NATS patterns
  - `services/service-logistics/CLAUDE.md` — Mock mode support pattern

  **Acceptance Criteria**:
  - [ ] `wincash.service.ts` créé avec mode mock toggle
  - [ ] 3 handlers NATS créés et enregistrés
  - [ ] Controller gRPC créé
  - [ ] Repository service créé
  - [ ] `WINCASH_USE_MOCK=true` dans `.env` du service
  - [ ] `bun run build` → SUCCESS
  - [ ] Tests unitaires écrits et passants : `bun test` → PASS

  **Agent-Executed QA Scenarios**:

  ```
  Scenario: Wincash mock service returns test data
    Tool: Bash
    Steps:
      1. Set WINCASH_USE_MOCK=true
      2. Start service-engagement
      3. Call WincashSvc.ListOperations via grpcurl
      4. Assert: response contains mock cashback operations
    Expected Result: Mock data returned
    Evidence: gRPC response captured

  Scenario: Wincash cashback handler processes event
    Tool: Bash
    Steps:
      1. Publish NATS event wincash.cashback.tracked with test payload
      2. Query operation_cashback table
      3. Assert: new row with statut = 'tracked'
    Expected Result: Event processed and persisted
    Evidence: DB query output
  ```

  **Commit**: YES
  - Message: `feat(engagement): add Wincash webhook handlers with mock service`
  - Files: `services/service-engagement/src/infrastructure/external/wincash/`, handlers, controller, repository
  - Pre-commit: `bun run build && bun test`

---

- [x] 5. Webhooks Justi+ → CRM

  **What to do**:
  - Créer le service mock Justi+ : `infrastructure/external/justi-plus/justi-plus.service.ts`
    - Pattern Maileva : `JUSTI_PLUS_USE_MOCK=true`
    - Interface IJustiPlusService avec : suspendSubscription, resumeSubscription, cancelSubscription, getCase
  - Créer les handlers NATS :
    - `justi-customer-handler.ts` : `justi.customer.created/updated`
    - `justi-subscription-handler.ts` : `justi.subscription.created/updated`
    - `justi-case-handler.ts` : `justi.case.created/updated/closed`
  - Créer le controller gRPC `JustiPlusController`
  - Implémenter `CasJuridiqueService` repository
  - API sortante mock : POST suspend/resume/cancel (via mock service)
  - Tests unitaires

  **Must NOT do**:
  - Ne pas créer de service mock séparé
  - Ne pas créer de DTO manuels

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: [`microservice-maintainer`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 4, 6, 7)
  - **Blocks**: Tasks 8, 10, 12
  - **Blocked By**: Tasks 1, 2, 3

  **References**:

  **Pattern References**:
  - `services/service-logistics/src/infrastructure/external/maileva/maileva.service.ts` — Pattern mock toggle
  - Task 4 handlers — Même pattern, adapt pour Justi+

  **Acceptance Criteria**:
  - [ ] Service mock Justi+ avec toggle env
  - [ ] 3 handlers NATS créés
  - [ ] Controller gRPC + repository service créés
  - [ ] API sortante mock (suspend/resume/cancel)
  - [ ] `bun run build && bun test` → SUCCESS

  **Commit**: YES
  - Message: `feat(engagement): add Justi+ webhook handlers with mock service`
  - Pre-commit: `bun run build && bun test`

---

- [x] 6. Moteur Bundle / Remise Paramétrable (service-commercial)

  **What to do**:
  - Créer l'entité `ConfigurationBundle` dans `service-commercial/src/domain/products/entities/` :
    - id, organisationId
    - remise_justi_plus_avec_conciergerie (decimal, default 4.00 = 9.90 - 5.90)
    - remise_wincash_avec_conciergerie (decimal, default 4.00)
    - remise_both_avec_conciergerie (decimal, default 8.00)
    - prix_justi_plus_standalone (decimal, default 9.90)
    - prix_wincash_standalone (decimal, default 9.90)
    - pro_rata_enabled (boolean, default true)
    - grouped_billing_enabled (boolean, default true)
    - createdAt, updatedAt
  - Créer le service `BundleEngineService` dans `infrastructure/persistence/` :
    - `calculatePrice(clientId, services[])` : calcule le prix total en tenant compte des remises
    - `recalculateOnServiceChange(clientId, serviceAdded/Removed)` : recalcule et émet un event
    - `calculateProRata(price, startDate, endDate)` : calcul pro-rata pour ajout en milieu de cycle
  - Implémenter le controller gRPC `BundleController` (utiliser proto `bundle.proto`)
  - Migration pour la table `configuration_bundle`
  - Émettre des events NATS quand les prix changent : `bundle.price.recalculated`
  - Tests unitaires pour les calculs de prix (cas : solo, duo, trio, ajout mid-cycle, suppression Conciergerie)

  **Must NOT do**:
  - Ne pas hardcoder les prix — tout doit être paramétrable via ConfigurationBundle
  - Ne pas modifier les entités PrixProduit existantes

  **Recommended Agent Profile**:
  - **Category**: `ultrabrain`
    - Reason: Logique de calcul tarifaire complexe avec pro-rata, recalcul automatique
  - **Skills**: [`microservice-maintainer`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 4, 5, 7)
  - **Blocks**: Tasks 7, 8, 12
  - **Blocked By**: Tasks 1, 3

  **References**:

  **Pattern References**:
  - `services/service-commercial/src/domain/products/entities/prix-produit.entity.ts` — Entité prix avec `remisePourcent` (l:32-33)
  - `services/service-commercial/src/domain/products/entities/grille-tarifaire.entity.ts` — Grille tarifaire pattern
  - `services/service-finance/src/domain/factures/entities/invoice-item.entity.ts` — Champ `discount` sur item facture (l:66-73)

  **Documentation References**:
  - `services/service-commercial/CLAUDE.md` — Architecture, bounded contexts products

  **Acceptance Criteria**:
  - [ ] Entité ConfigurationBundle créée avec migration
  - [ ] BundleEngineService avec calculatePrice, recalculate, proRata
  - [ ] Controller gRPC BundleController fonctionnel
  - [ ] Tests : solo Justi+ = 9.90, solo Wincash = 9.90, Conciergerie+Justi+ = prix réduit, triple = prix bundle complet
  - [ ] Test pro-rata : ajout Justi+ le 15 du mois = (5.90 × 15/30)
  - [ ] Test suppression Conciergerie : Justi+ repasse à 9.90
  - [ ] `bun run build && bun test` → SUCCESS

  **Commit**: YES
  - Message: `feat(commercial): add parameterizable bundle discount engine`
  - Pre-commit: `bun run build && bun test`

---

- [x] 7. Extension Facturation Consolidée (service-finance)

  **What to do**:
  - Étendre `FactureEntity` ou créer une logique de consolidation :
    - Un client avec 1-3 services → 1 seule facture mensuelle
    - Chaque service = 1 LigneFacture avec prix après remise bundle
    - Détail par service sur la facture PDF
  - Créer un handler NATS `BundlePriceRecalculatedHandler` qui écoute `bundle.price.recalculated` et met à jour les lignes de facture en cours
  - Étendre le processus de facturation récurrente pour :
    - Interroger le BundleEngine pour le prix de chaque service
    - Générer une facture consolidée avec toutes les lignes
    - Gérer la suspension sélective (non-paiement d'un service → suspension de ce service uniquement)
  - Ajouter la logique de dunning sélectif :
    - Non-paiement Conciergerie → perte des remises bundle (Justi+ et Wincash repassent à plein tarif)
    - Non-paiement Justi+/Wincash → suspension du service uniquement
  - Tests unitaires pour la consolidation et le dunning sélectif

  **Must NOT do**:
  - Ne pas casser la facturation existante mono-service
  - Ne pas toucher aux PSP integrations (Stripe, GoCardless, etc.)

  **Recommended Agent Profile**:
  - **Category**: `ultrabrain`
    - Reason: Logique de facturation complexe avec consolidation multi-service et dunning sélectif
  - **Skills**: [`microservice-maintainer`]

  **Parallelization**:
  - **Can Run In Parallel**: YES (partiellement — dépend de Task 6 pour le BundleEngine)
  - **Parallel Group**: Wave 2 (with Tasks 4, 5)
  - **Blocks**: Tasks 8, 12
  - **Blocked By**: Tasks 1, 3, 6

  **References**:

  **Pattern References**:
  - `services/service-finance/src/domain/factures/entities/facture.entity.ts` — Entité facture existante
  - `services/service-finance/src/domain/factures/entities/ligne-facture.entity.ts` — Ligne de facture
  - `services/service-finance/src/domain/factures/entities/invoice.entity.ts` — Facture Factur-X
  - `services/service-finance/src/domain/factures/entities/invoice-item.entity.ts` — Item avec discount (l:66-73)
  - `services/service-finance/src/domain/payments/entities/reminder.entity.ts` — Système de relance existant
  - `services/service-finance/src/domain/payments/entities/retry-policy.entity.ts` — Politique de retry

  **Documentation References**:
  - `services/service-finance/CLAUDE.md` — Bounded contexts Factures + Payments + Calendar, PSP integrations

  **Acceptance Criteria**:
  - [ ] Facture consolidée générée pour client multi-service (1 facture, N lignes)
  - [ ] Prix des lignes reflètent les remises bundle
  - [ ] Handler NATS pour `bundle.price.recalculated` fonctionnel
  - [ ] Dunning sélectif : non-paiement Conciergerie → recalcul sans remises
  - [ ] Dunning sélectif : non-paiement Justi+ → suspension Justi+ uniquement
  - [ ] `bun run build && bun test` → SUCCESS

  **Commit**: YES
  - Message: `feat(finance): add consolidated multi-service billing with selective dunning`
  - Pre-commit: `bun run build && bun test`

---

### WAVE 3 — Frontend & Module Conciergerie

---

- [ ] 8. Portail Client Self-Care (Frontend)

  **What to do**:
  - Créer les routes Next.js pour le portail client :
    - `/portal/[token]/dashboard` — Vue d'ensemble des services actifs
    - `/portal/[token]/profile` — Modification infos personnelles
    - `/portal/[token]/payment` — Gestion moyen de paiement
    - `/portal/[token]/services` — Activation/désactivation de services individuels
    - `/portal/[token]/justi-plus` — Espace Justi+ (liste des dossiers, documents)
    - `/portal/[token]/wincash` — Espace Wincash (cashback, coupons, statistiques)
    - `/portal/[token]/invoices` — Téléchargement des factures
  - Composants à créer :
    - `ServiceToggleCard` — Carte avec toggle pour activer/désactiver un service
    - `BundlePricingSummary` — Résumé des prix avec/sans remise bundle
    - `JustiPlusCasesList` — Liste des dossiers juridiques
    - `WincashDashboard` — Dashboard cashback
    - `InvoiceDownloadList` — Liste des factures téléchargeables
  - Intégrer avec les APIs gRPC existantes via le BFF/API gateway
  - Utiliser les composants Shadcn UI existants (Card, Badge, Table, Dialog, etc.)
  - Responsive design (mobile-first)

  **Must NOT do**:
  - Ne pas créer de nouveaux composants UI de base — utiliser Shadcn existant
  - Ne pas implémenter de logique métier côté frontend — appels API uniquement
  - Ne pas toucher au portail de paiement existant (`/portal/[token]`)

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: Frontend multi-pages avec composants UI riches
  - **Skills**: [`frontend-ui-ux`]
    - `frontend-ui-ux`: Création UI/UX avec Shadcn, responsive design

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Tasks 9, 10)
  - **Blocks**: Task 12
  - **Blocked By**: Tasks 4, 5, 6, 7

  **References**:

  **Pattern References**:
  - `frontend/src/app/portal/[token]/page.tsx` — Portail de paiement existant (pattern token-based access)
  - `frontend/src/app/(main)/clients/[id]/page.tsx` — Page détail client (pattern tabs, fiche client)
  - `frontend/src/components/ui/` — 50+ composants Shadcn UI disponibles

  **Documentation References**:
  - `frontend/CLAUDE.md` — Architecture frontend complète, composants, patterns, conventions

  **Acceptance Criteria**:
  - [ ] 7 routes portail créées et navigables
  - [ ] Composants ServiceToggleCard, BundlePricingSummary fonctionnels
  - [ ] Design responsive (mobile + desktop)
  - [ ] `npm run build` → SUCCESS (0 errors)

  **Agent-Executed QA Scenarios**:

  ```
  Scenario: Portal dashboard shows active services
    Tool: Playwright
    Preconditions: Dev server running on localhost:3000, valid portal token
    Steps:
      1. Navigate to: http://localhost:3000/portal/{token}/dashboard
      2. Wait for: .service-card visible (timeout: 10s)
      3. Assert: At least 1 service card displayed
      4. Assert: Each card shows service name, status badge, price
      5. Screenshot: .sisyphus/evidence/task-8-portal-dashboard.png
    Expected Result: Dashboard loads with service overview
    Evidence: .sisyphus/evidence/task-8-portal-dashboard.png

  Scenario: Service toggle activates/deactivates
    Tool: Playwright
    Steps:
      1. Navigate to portal/services page
      2. Find service toggle for Justi+
      3. Click toggle to change state
      4. Wait for confirmation dialog
      5. Confirm action
      6. Assert: Price summary updates
      7. Screenshot: .sisyphus/evidence/task-8-service-toggle.png
    Expected Result: Service toggled with price recalculation
    Evidence: .sisyphus/evidence/task-8-service-toggle.png
  ```

  **Commit**: YES
  - Message: `feat(frontend): add multi-service client self-care portal`
  - Pre-commit: `npm run build`

---

- [ ] 9. Module Conciergerie — Tickets + SLA (Backend + Frontend)

  **What to do**:
  - **Backend (service-engagement)** :
    - Implémenter `DemandeConciergierieService` (repository) avec toutes les opérations CRUD
    - Implémenter `CommentaireDemandeService`
    - Créer le controller gRPC `ConciergerieSvcController` (utiliser proto conciergerie.proto)
    - Logique SLA :
      - Calcul automatique de `dateLimite` à la création basé sur la priorité (urgente: 4h, haute: 24h, normale: 48h, basse: 72h)
      - Worker/cron qui vérifie les SLA dépassés et émet des alertes
      - Marquage `slaRespected = false` quand dateLimite dépassée sans résolution
    - Assignation automatique (round-robin ou par catégorie)
    - Notifications : nouvelles demandes, assignation, SLA warning, résolution
    - Events NATS : DemandeCreated, DemandeUpdated, DemandeClosed
  - **Frontend** :
    - Remplacer le composant `tickets.tsx` mock par un vrai composant connecté à l'API
    - Page `/demandes` — Liste complète des demandes avec filtres (statut, priorité, catégorie, assignation)
    - Page `/demandes/[id]` — Détail d'une demande avec timeline, commentaires, changement de statut
    - Composant `CreateDemandeDialog` — Formulaire de création
    - Composant `SlaIndicator` — Badge visuel SLA (vert/orange/rouge)
    - Widget dashboard `ConciergerieSummary` — Résumé tickets (ouverts, en retard, satisfaction)
  - Tests unitaires pour le service et la logique SLA

  **Must NOT do**:
  - Ne pas supprimer le composant tickets.tsx existant — le remplacer/adapter
  - Ne pas hardcoder les délais SLA — les rendre configurables

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: Backend + frontend complet pour le module conciergerie
  - **Skills**: [`frontend-ui-ux`, `microservice-maintainer`]
    - `frontend-ui-ux`: Pages frontend avec composants riches
    - `microservice-maintainer`: Service backend, handlers, logique métier

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Tasks 8, 10)
  - **Blocks**: Tasks 10, 12
  - **Blocked By**: Tasks 2, 3

  **References**:

  **Pattern References**:
  - `frontend/src/components/tickets.tsx` — Composant mock existant à remplacer (statuts, priorités, canaux)
  - `frontend/src/components/tickets-columns.tsx` — Colonnes TanStack Table pour tickets
  - `frontend/src/components/tickets-table.tsx` — Table avec filtres, pagination, sélection
  - `frontend/src/types/tickets.ts` — Types Ticket existants (TicketStatus, TicketPriority, TicketChannel)
  - `frontend/src/lib/tickets.ts` — Labels et styles pour statuts/priorités
  - `services/service-engagement/src/domain/engagement/entities/tache.entity.ts` — Pattern enum statuts/priorités
  - `services/service-engagement/src/infrastructure/grpc/notification.controller.ts` — Pattern controller gRPC engagement

  **Acceptance Criteria**:
  - [ ] Service DemandeConciergerie fonctionnel (CRUD complet)
  - [ ] Logique SLA : calcul automatique dateLimite, détection dépassement, alertes
  - [ ] Controller gRPC ConciergerieSvc exposant toutes les RPCs
  - [ ] Frontend : page /demandes avec table, filtres, tri, pagination
  - [ ] Frontend : page /demandes/[id] avec détail, timeline, commentaires
  - [ ] Création de demande via dialog
  - [ ] Indicateur SLA visuel
  - [ ] `bun run build` (backend) et `npm run build` (frontend) → SUCCESS

  **Agent-Executed QA Scenarios**:

  ```
  Scenario: Create and track a Conciergerie ticket
    Tool: Playwright
    Steps:
      1. Navigate to /demandes
      2. Click "Nouvelle demande" button
      3. Fill: objet → "Recherche artisan plombier"
      4. Fill: description → "Le client cherche un plombier disponible rapidement"
      5. Select: categorie → "recherche"
      6. Select: priorite → "haute"
      7. Click submit
      8. Wait for: success toast
      9. Assert: New ticket appears in list with status "nouveau"
      10. Assert: SLA indicator shows green (within deadline)
      11. Screenshot: .sisyphus/evidence/task-9-create-ticket.png
    Expected Result: Ticket created with SLA tracking
    Evidence: .sisyphus/evidence/task-9-create-ticket.png

  Scenario: SLA violation detection
    Tool: Bash
    Steps:
      1. Create demande via gRPC with priority "urgente" and backdated creation (4h ago)
      2. Run SLA check worker/cron
      3. Query demande: Assert slaRespected = false
      4. Assert: Notification created for SLA violation
    Expected Result: SLA violation detected and flagged
    Evidence: DB query + notification output
  ```

  **Commit**: YES (2 commits)
  - Message 1: `feat(engagement): implement Conciergerie ticket service with SLA tracking`
  - Message 2: `feat(frontend): replace mock tickets with live Conciergerie module`

---

- [ ] 10. Dashboards KPI Multi-Service (Frontend)

  **What to do**:
  - Créer la page `/statistiques/services` ou étendre la page `/statistiques` existante :
    - **KPIs Revenue** : MRR total, MRR par service, ARR, TVA, taux d'adoption bundle
    - **KPIs Souscriptions** : Actifs par service, taux de churn, adoption Justi+/Wincash
    - **KPIs Paiements** : Taux d'acceptation, DSO, impayés par service
    - **KPIs Justi+** : Dossiers traités, temps moyen résolution, satisfaction
    - **KPIs Wincash** : Cashback validé, économies, taux d'usage
    - **KPIs Conciergerie** : Tickets ouverts/résolus, SLA compliance %, satisfaction moyenne
    - **KPIs Partenaires** : Commissions, performance vendeurs
  - Composants charts :
    - `ServiceAdoptionChart` — Pie chart des services actifs
    - `MrrEvolutionChart` — Line chart MRR mensuel par service
    - `SlaComplianceChart` — Gauge SLA compliance
    - `ChurnRateChart` — Line chart taux de churn
    - `BundleUptakeChart` — Bar chart adoption des bundles
  - Filtres : période, société, service, commercial
  - Utiliser Recharts (déjà installé) pour les graphiques

  **Must NOT do**:
  - Ne pas supprimer les statistiques existantes — ajouter les nouvelles
  - Ne pas implémenter de cache côté frontend — les APIs doivent gérer la performance

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: [`frontend-ui-ux`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Tasks 8, 9)
  - **Blocks**: Task 12
  - **Blocked By**: Tasks 4, 5, 9

  **References**:

  **Pattern References**:
  - `frontend/src/app/(main)/statistiques/page.tsx` — Page statistiques existante
  - `frontend/src/components/stats/` — Composants stats existants (kpi-card, chart-ca-evolution, etc.)
  - `frontend/src/components/dashboard/` — Composants dashboard (commercial-kpis, product-distribution)

  **Acceptance Criteria**:
  - [ ] Page KPI multi-service accessible et fonctionnelle
  - [ ] 7 catégories de KPIs affichées
  - [ ] Charts Recharts interactifs
  - [ ] Filtres fonctionnels
  - [ ] `npm run build` → SUCCESS

  **Commit**: YES
  - Message: `feat(frontend): add multi-service KPI dashboards`

---

### WAVE 4 — Sécurité & Tests

---

- [ ] 11. RBAC + Rôles Métier + GDPR

  **What to do**:
  - **Seed data rôles métier** dans service-core :
    - Rôle "Support Conciergerie" : permissions clients, souscriptions, tickets conciergerie
    - Rôle "Avocat Justi+" : permissions cas juridiques, documents (read-only paiements)
    - Rôle "Ops Wincash" : permissions cashback tracking (read-only paiements)
    - Rôle "Finance" : permissions factures, exports, dunning
    - Rôle "Admin" : permissions complètes + config prix/dunning/API
  - **Guard decorator** : Créer un guard NestJS qui appelle `AuthService.BuildAccessContext` (proto existant) et vérifie les permissions requises sur chaque RPC
  - **Appliquer les guards** sur les nouveaux controllers :
    - ConciergerieSvcController : requiert permission `conciergerie:*` ou `support:*`
    - JustiPlusSvcController : requiert permission `justi_plus:*` ou `avocat:*`
    - WincashSvcController : requiert permission `wincash:*` ou `ops:*`
    - BundleController : requiert permission `admin:bundle` ou `finance:*`
  - **GDPR** :
    - Endpoint d'anonymisation de demande (anonymiser les données personnelles d'un cas/ticket clos)
    - Audit log pour toutes les opérations sensibles (accès dossier juridique, export données)

  **Must NOT do**:
  - Ne pas modifier le système RBAC existant (Role, Permission, RolePermission) — l'étendre
  - Ne pas hardcoder les permissions — utiliser les seed data + proto AccessContext

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: Sécurité RBAC cross-service avec proto AccessContext — nécessite compréhension profonde
  - **Skills**: [`microservice-maintainer`]

  **Parallelization**:
  - **Can Run In Parallel**: YES (partiellement avec Wave 3)
  - **Parallel Group**: Wave 4 (with Task 12)
  - **Blocks**: Task 12
  - **Blocked By**: Task 3

  **References**:

  **Pattern References**:
  - `packages/proto/src/security/auth.proto` — AccessContext avec roles[], permissions[], breakglass, mfa
  - `services/service-core/src/domain/users/entities/role.entity.ts` — Entité rôle
  - `services/service-core/src/domain/users/entities/permission.entity.ts` — Entité permission
  - `services/service-core/src/domain/users/entities/role-permission.entity.ts` — Association rôle-permission

  **Acceptance Criteria**:
  - [ ] 5 rôles métier seedés en base
  - [ ] Guard decorator créé et fonctionnel
  - [ ] Guards appliqués sur les 4 nouveaux controllers
  - [ ] Endpoint anonymisation GDPR fonctionnel
  - [ ] Audit log pour opérations sensibles
  - [ ] Test : utilisateur avec rôle "Avocat" ne peut PAS accéder aux tickets Conciergerie
  - [ ] Test : utilisateur avec rôle "Support" peut créer/assigner des tickets

  **Commit**: YES
  - Message: `feat(core,engagement): add RBAC roles for Conciergerie/Justi+/Wincash with GDPR compliance`

---

- [ ] 12. Tests End-to-End (Scénarios Solo, Dual, Triple)

  **What to do**:
  - Créer une suite de tests E2E couvrant les scénarios du CDC :
    - **Solo Justi+** : Souscription à 9,90€, facturation, cas juridique, paiement
    - **Solo Wincash** : Souscription à 9,90€, cashback tracké/validé/payé
    - **Conciergerie + Justi+** : Souscription avec remise, facture consolidée (2 lignes), ticket + cas
    - **Conciergerie + Wincash** : Souscription avec remise, cashback + ticket
    - **Triple (Conciergerie + Justi+ + Wincash)** : Bundle complet, facture consolidée (3 lignes), prix total correct
    - **Annulation Conciergerie** : Vérifier que Justi+/Wincash repassent à plein tarif
    - **Non-paiement sélectif** : Non-paiement Justi+ → suspension Justi+ uniquement, facturation Conciergerie+Wincash continue
    - **Fusion client** : Client créé via Wincash puis via Justi+ (même email) → fusion, préservation des 2 UUID externes
  - Chaque test doit :
    - Créer les données de test (client, souscription)
    - Exécuter le workflow complet (création → facturation → paiement)
    - Vérifier les résultats (statuts, montants, notifications)
    - Nettoyer après exécution

  **Must NOT do**:
  - Ne pas tester les vraies APIs Justi+/Wincash — utiliser les mocks
  - Ne pas tester les PSP réels — utiliser les modes test des PSP

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: Tests E2E cross-services complexes avec scénarios métier multiples
  - **Skills**: [`microservice-maintainer`]

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Sequential (final task)
  - **Blocks**: None (final)
  - **Blocked By**: Tasks 4-11 (tous)

  **References**:

  **Pattern References**:
  - Tous les services et controllers créés dans les Tasks 1-11

  **Acceptance Criteria**:
  - [ ] 8 scénarios E2E écrits et exécutables
  - [ ] Solo Justi+ : facturation 9.90€ ✓
  - [ ] Solo Wincash : facturation 9.90€ ✓
  - [ ] Conciergerie + Justi+ : facturation consolidée avec remise ✓
  - [ ] Triple : prix total correct avec remises bundle ✓
  - [ ] Annulation Conciergerie : recalcul plein tarif ✓
  - [ ] Non-paiement sélectif : suspension ciblée ✓
  - [ ] Fusion client : UUIDs préservés ✓
  - [ ] Tous les tests : `bun test:e2e` → PASS

  **Commit**: YES
  - Message: `test(e2e): add multi-service scenarios — solo, dual, triple, dunning, merge`

---

## Commit Strategy

| After Task | Message | Files | Verification |
|------------|---------|-------|--------------|
| 1 | `feat(core): add multi-service fields to client entity` | service-core entities, migration, proto | `bun run build` |
| 2 | `feat(engagement): add service entities — DemandeConciergerie, CasJuridique, OperationCashback` | service-engagement domain/services/ | `bun run build` |
| 3 | `feat(proto): add service definitions — conciergerie, justi+, wincash, bundle, events` | packages/proto/src/services/ | `bun run proto:generate` |
| 4 | `feat(engagement): add Wincash webhook handlers with mock service` | service-engagement infrastructure/ | `bun run build && bun test` |
| 5 | `feat(engagement): add Justi+ webhook handlers with mock service` | service-engagement infrastructure/ | `bun run build && bun test` |
| 6 | `feat(commercial): add parameterizable bundle discount engine` | service-commercial domain + infrastructure | `bun run build && bun test` |
| 7 | `feat(finance): add consolidated multi-service billing with selective dunning` | service-finance domain + infrastructure | `bun run build && bun test` |
| 8 | `feat(frontend): add multi-service client self-care portal` | frontend/src/app/portal/ | `npm run build` |
| 9a | `feat(engagement): implement Conciergerie ticket service with SLA tracking` | service-engagement | `bun run build && bun test` |
| 9b | `feat(frontend): replace mock tickets with live Conciergerie module` | frontend/src/app/(main)/demandes/, components/ | `npm run build` |
| 10 | `feat(frontend): add multi-service KPI dashboards` | frontend/src/app/(main)/statistiques/ | `npm run build` |
| 11 | `feat(core,engagement): add RBAC roles with GDPR compliance` | service-core + service-engagement | `bun run build && bun test` |
| 12 | `test(e2e): add multi-service scenarios` | tests/ | `bun test:e2e` |

---

## Success Criteria

### Verification Commands
```bash
# Backend builds
cd services/service-core && bun run build        # Expected: SUCCESS
cd services/service-engagement && bun run build   # Expected: SUCCESS
cd services/service-commercial && bun run build   # Expected: SUCCESS
cd services/service-finance && bun run build      # Expected: SUCCESS

# Frontend build
cd frontend && npm run build                      # Expected: SUCCESS

# Proto generation
cd packages/proto && bun run proto:generate       # Expected: SUCCESS

# Tests
cd services/service-engagement && bun test        # Expected: ALL PASS
cd services/service-commercial && bun test        # Expected: ALL PASS
cd services/service-finance && bun test           # Expected: ALL PASS

# E2E
bun test:e2e                                      # Expected: 8 scenarios PASS
```

### Final Checklist
- [ ] All "Must Have" present (multi-service, bundle, webhooks, portal, tickets, RBAC)
- [ ] All "Must NOT Have" absent (no manual DTOs, no separate mock services, no hardcoded prices)
- [ ] All backend services build successfully
- [ ] Frontend builds successfully
- [ ] Proto generation succeeds
- [ ] Unit tests pass in all modified services
- [ ] E2E tests cover all 8 scenarios
- [ ] SLA tracking functional for Conciergerie tickets
- [ ] Bundle pricing recalculates correctly on service changes
- [ ] Consolidated billing produces single invoice for multi-service clients
