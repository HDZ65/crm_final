# Ajouter la date de prélèvement dans le contrat + Import de contrats externes

## TL;DR

> **Quick Summary**: Enrichir le contrat avec la date de prélèvement (jour fixe configurable + prochaine date calculée) en ajoutant un appel cross-service (service-commercial → service-finance) et afficher cette information partout dans le frontend. En parallèle, créer un connecteur d'import pour récupérer des contrats depuis un outil interne externe via API REST (pull).
>
> **Deliverables**:
> - Phase 0 : Wirer les CRUD gRPC manquants de DebitConfigurationService dans service-finance
> - Phase 1 : Date de prélèvement dans le contrat (backend enrichment + frontend)
> - Phase 2 : Import de contrats depuis un outil externe (connecteur REST + cron + UI)
>
> **Estimated Effort**: Large
> **Parallel Execution**: YES - Phase 2 peut démarrer en parallèle de Phase 0+1
> **Critical Path**: Task 1 → Task 2 → Task 3 → Task 4 → Task 5 → Task 6

---

## Context

### Original Request
L'utilisateur veut que la date de prélèvement soit visible dans le contrat d'un client, à la fois côté backend (enrichir la réponse gRPC) et côté frontend (affichage partout). Il veut aussi un système d'import de contrats depuis un outil interne externe.

### Interview Summary
**Key Discussions**:
- **Nature du champ** : Prochaine date calculée (pas un champ statique), basée sur un jour fixe (1-28)
- **Configuration** : À la création du contrat ET modifiable après
- **Cross-service** : Enrichissement côté backend (service-commercial → service-finance via gRPC)
- **Affichage** : Partout — liste contrats (colonne) + détail contrat + formulaire création/édition
- **Import** : Un seul outil interne (pas contrôlé par l'utilisateur), API REST, pull, manuel + cron
- **Déduplication** : Mise à jour si même référence existe
- **Jour prélèvement dans import** : Parfois présent, parfois absent
- **Tests** : Pas de tests automatisés demandés

**Research Findings**:
- `ContratEntity` dans `service-commercial` — 21 champs, aucun lié au prélèvement
- `ContractDebitConfigurationEntity` dans `service-finance` — lié via `contratId` (unique, 1:1)
- `PlannedDebitEntity` dans `service-finance` — lié via `contratId` (1:N)
- **BLOCKER** : CalendarEngine n'est PAS implémenté (proto-only) → Approche simple choisie
- **BLOCKER** : CRUD gRPC pour ContractDebitConfig non wirés (2/13 méthodes) → Phase 0
- Pattern cross-service existant : `subscription-charge.service.ts` utilise `loadGrpcPackage()`
- Pattern cron existant : `depanssur-scheduler.service.ts` utilise `@Cron`
- Page détail contrat `/contrats/[id]` n'existe PAS → à créer
- Frontend actions `calendar-config.ts` existent déjà pour CRUD des configs

### Metis Review
**Identified Gaps** (addressed):
- CalendarEngine non implémenté → Résolu : approche simple (calcul trivial côté service-commercial)
- CRUD gRPC non wirés → Résolu : Phase 0 prérequis
- Page détail contrat manquante → Résolu : inclus dans le plan (Task 5)
- Inconsistance `Contract` (UI) vs `Contrat` (proto) → Résolu : standardiser lors des modifications
- Import API-to-API = pattern inédit → Résolu : utiliser `HttpModule` NestJS + `@Cron`

---

## Work Objectives

### Core Objective
Permettre aux utilisateurs de voir et configurer la date de prélèvement directement dans le contrat, et d'importer des contrats depuis un outil externe avec leur configuration de prélèvement.

### Concrete Deliverables
- Service-finance : 6 méthodes gRPC wirées pour ContractDebitConfig CRUD
- Proto : Message Contrat enrichi avec `jour_prelevement` et `prochaine_date_prelevement`
- Service-commercial : Client gRPC vers service-finance + enrichissement des réponses contrat
- Frontend : Colonne "Prélèvement" dans les tables contrats
- Frontend : Page détail contrat `/contrats/[id]` avec section prélèvement
- Frontend : Champ "Jour de prélèvement" dans le formulaire création/édition
- Service-commercial : Service d'import REST avec cron + UI

### Definition of Done
- [ ] Un contrat créé avec `jour_prelevement=15` a une ContractDebitConfiguration créée automatiquement dans service-finance
- [ ] Les listes de contrats (client + commercial) affichent la colonne "Prélèvement" avec le jour ou la prochaine date
- [ ] La page `/contrats/[id]` affiche la section prélèvement
- [ ] Le formulaire permet de saisir/modifier le jour de prélèvement
- [ ] L'import depuis l'outil externe crée les contrats avec optionnellement leur config de prélèvement
- [ ] L'import fonctionne en mode manuel (bouton) et automatique (cron)

### Must Have
- Jour fixe (1-28) comme seul mode de configuration
- Calcul simple de la prochaine date (si jour passé → mois prochain)
- Enrichissement de la réponse gRPC `Contrat` avec les infos prélèvement
- Import en mode pull (CRM appelle l'outil externe)
- Gestion du cas "jour prélèvement absent" dans les données importées
- Upsert sur import (mise à jour si référence existe)

### Must NOT Have (Guardrails)
- ❌ CalendarEngine complet (jours fériés, business days, shift strategy)
- ❌ Framework ETL/adapter/factory pattern générique pour l'import
- ❌ Nouveau microservice pour l'import (reste dans service-commercial)
- ❌ REST endpoints (tout en gRPC, convention du codebase)
- ❌ Synchronisation bidirectionnelle
- ❌ WebSocket/real-time pour la progression de l'import
- ❌ Modification de CalendarAdminController ou CalendarAdminService
- ❌ Colonne `jourPrelevement` dans la table `contrat` (vit dans service-finance)
- ❌ JSDoc/commentaires sur le code existant non modifié
- ❌ Refactoring des imports dialogs existants

---

## Verification Strategy (MANDATORY)

> **UNIVERSAL RULE: ZERO HUMAN INTERVENTION**
>
> ALL tasks in this plan MUST be verifiable WITHOUT any human action.

### Test Decision
- **Infrastructure exists**: Non vérifié
- **Automated tests**: None
- **Framework**: None

### Agent-Executed QA Scenarios (MANDATORY — ALL tasks)

> Sans tests unitaires, les QA Scenarios sont la **PRIMARY** méthode de vérification.
> Chaque tâche inclut des scénarios Playwright + grpcurl pour vérifier le livrable.

**Verification Tool by Deliverable Type:**

| Type | Tool | How Agent Verifies |
|------|------|-------------------|
| gRPC Backend | Bash (grpcurl) | Send requests, parse responses, assert fields |
| Frontend UI | Playwright (playwright skill) | Navigate, interact, assert DOM, screenshot |
| Cron/Scheduler | Bash (logs) | Check scheduler registration, verify execution logs |

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Start Immediately):
├── Task 1: Wire CRUD gRPC DebitConfigurationService (service-finance)
└── Task 7: Import - Proto + Backend service (service-commercial) [independent]

Wave 2 (After Wave 1):
├── Task 2: Proto contrats enrichment (depends: 1)
├── Task 8: Import - Cron scheduler (depends: 7)
└── Task 9: Import - Frontend dialog (depends: 7)

Wave 3 (After Wave 2):
├── Task 3: Client gRPC service-commercial → service-finance (depends: 1, 2)
└── Task 10: Import - QA validation (depends: 8, 9)

Wave 4 (After Wave 3):
├── Task 4: Frontend - Formulaire + Tables (depends: 3)

Wave 5 (After Wave 4):
├── Task 5: Frontend - Page détail contrat (depends: 4)

Wave 6 (After Wave 5):
└── Task 6: QA Validation Phase 1 (depends: 5)

Critical Path: Task 1 → Task 2 → Task 3 → Task 4 → Task 5 → Task 6
Parallel Track: Task 7 → Task 8/9 → Task 10
```

### Dependency Matrix

| Task | Depends On | Blocks | Can Parallelize With |
|------|------------|--------|---------------------|
| 1 | None | 2, 3 | 7 |
| 2 | 1 | 3 | 7, 8, 9 |
| 3 | 1, 2 | 4 | 8, 9, 10 |
| 4 | 3 | 5 | 10 |
| 5 | 4 | 6 | 10 |
| 6 | 5 | None | None |
| 7 | None | 8, 9 | 1 |
| 8 | 7 | 10 | 2, 3, 4 |
| 9 | 7 | 10 | 2, 3, 4 |
| 10 | 8, 9 | None | 4, 5, 6 |

### Agent Dispatch Summary

| Wave | Tasks | Recommended Agents |
|------|-------|-------------------|
| 1 | 1, 7 | task(category="unspecified-high") — parallel |
| 2 | 2, 8, 9 | task(category="unspecified-high") + task(category="visual-engineering") |
| 3 | 3, 10 | task(category="unspecified-high") |
| 4 | 4 | task(category="visual-engineering") |
| 5 | 5 | task(category="visual-engineering") |
| 6 | 6 | task(category="quick") |

---

## TODOs

### PHASE 0 — Prérequis : Wire les CRUD gRPC manquants

- [x] 1. Wire les méthodes gRPC ContractDebitConfiguration dans service-finance

  **What to do**:
  - Ouvrir `services/service-finance/src/infrastructure/grpc/calendar/configuration.controller.ts`
  - Ajouter les `@GrpcMethod` pour les méthodes contract-level :
    - `CreateContractConfig` — crée une ContractDebitConfigurationEntity avec mode=FIXED_DAY et fixedDay
    - `UpdateContractConfig` — met à jour fixedDay, isActive
    - `GetContractConfig` — retourne la config par contratId
    - `DeleteContractConfig` — supprime la config
    - `ListContractConfigs` — liste les configs par organisationId avec pagination
    - `ResolveConfiguration` — résout la config effective pour un contrat (pour l'instant retourne juste la config contract-level si elle existe, sinon null)
  - Le `ConfigurationService` TypeORM a déjà les méthodes repository (`getContractConfig`, etc.) — les wirer vers les méthodes gRPC
  - S'assurer que le proto `calendar.proto` définit bien ces méthodes (elles existent déjà lignes 577-605)

  **Must NOT do**:
  - Ne PAS implémenter la résolution hiérarchique complète (System → Company → Client → Contract)
  - Ne PAS toucher aux méthodes System/Company/Client config
  - Ne PAS modifier le proto (les méthodes sont déjà définies)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Wiring gRPC backend, pas de UI, nécessite compréhension NestJS + gRPC
  - **Skills**: [`microservice-maintainer`]
    - `microservice-maintainer`: Modifications sur un service existant, ajout de méthodes gRPC

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Task 7)
  - **Blocks**: Tasks 2, 3
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `services/service-finance/src/infrastructure/grpc/calendar/configuration.controller.ts` — Controller existant avec 2 méthodes wirées (GetSystemConfig, UpdateSystemConfig). Ajouter les méthodes contract-level ici en suivant le même pattern.
  - `services/service-finance/src/infrastructure/persistence/typeorm/repositories/calendar/configuration.service.ts` — Service TypeORM avec les méthodes repository déjà implémentées (getContractConfig, createContractConfig, etc.). C'est le service à injecter dans le controller.

  **API/Type References**:
  - `packages/proto/src/calendar/calendar.proto:577-605` — Définition proto des 13 méthodes de DebitConfigurationService. Les méthodes contract-level sont : CreateContractConfig, UpdateContractConfig, GetContractConfig, DeleteContractConfig, ListContractConfigs, ResolveConfiguration.
  - `services/service-finance/src/domain/calendar/entities/contract-debit-configuration.entity.ts` — Entity TypeORM avec tous les champs (contratId, mode, batch, fixedDay, shiftStrategy, holidayZoneId, isActive)
  - `services/service-finance/src/domain/calendar/entities/system-debit-configuration.entity.ts:9-25` — Enums DebitDateMode, DebitBatch, DateShiftStrategy utilisés par l'entity

  **Documentation References**:
  - `services/service-finance/src/domain/calendar/repositories/IConfigurationRepository.ts` — Interface repository définissant les méthodes attendues

  **Acceptance Criteria**:

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: Create contract debit config via gRPC
    Tool: Bash (grpcurl)
    Preconditions: service-finance running on localhost:50059
    Steps:
      1. grpcurl -plaintext -d '{"organisation_id":"org-test-001","contrat_id":"contrat-test-001","mode":"DEBIT_DATE_MODE_FIXED_DAY","fixed_day":15,"shift_strategy":"DATE_SHIFT_STRATEGY_NEXT_BUSINESS_DAY","is_active":true}' localhost:50059 calendar.DebitConfigurationService/CreateContractConfig
      2. Assert: response contains "id" (UUID)
      3. Assert: response.fixed_day == 15
      4. Assert: response.mode == "DEBIT_DATE_MODE_FIXED_DAY"
    Expected Result: Config created with correct fields
    Evidence: Response body captured

  Scenario: Get contract debit config by contratId
    Tool: Bash (grpcurl)
    Preconditions: Config created in previous scenario
    Steps:
      1. grpcurl -plaintext -d '{"organisation_id":"org-test-001","contrat_id":"contrat-test-001"}' localhost:50059 calendar.DebitConfigurationService/GetContractConfig
      2. Assert: response.fixed_day == 15
      3. Assert: response.contrat_id == "contrat-test-001"
    Expected Result: Config retrieved correctly
    Evidence: Response body captured

  Scenario: Update contract debit config
    Tool: Bash (grpcurl)
    Preconditions: Config exists
    Steps:
      1. grpcurl -plaintext -d '{"id":"<config-id>","fixed_day":22}' localhost:50059 calendar.DebitConfigurationService/UpdateContractConfig
      2. Assert: response.fixed_day == 22
    Expected Result: Config updated
    Evidence: Response body captured

  Scenario: Delete contract debit config
    Tool: Bash (grpcurl)
    Steps:
      1. grpcurl -plaintext -d '{"id":"<config-id>"}' localhost:50059 calendar.DebitConfigurationService/DeleteContractConfig
      2. Assert: success response
      3. Get same config → Assert: not found error
    Expected Result: Config deleted
    Evidence: Response body captured
  ```

  **Commit**: YES
  - Message: `feat(finance): wire contract debit configuration gRPC CRUD methods`
  - Files: `services/service-finance/src/infrastructure/grpc/calendar/configuration.controller.ts`
  - Pre-commit: `grpcurl -plaintext localhost:50059 list calendar.DebitConfigurationService`

---

### PHASE 1 — Date de prélèvement dans le contrat

- [ ] 2. Enrichir le proto Contrat avec les champs prélèvement

  **What to do**:
  - Ouvrir `packages/proto/src/contrats/contrats.proto`
  - Ajouter au message `Contrat` :
    - `optional int32 jour_prelevement = 22;` — Jour fixe configuré (1-28)
    - `optional string prochaine_date_prelevement = 23;` — Prochaine date calculée (ISO string)
  - Ajouter au message `CreateContratRequest` :
    - `optional int32 jour_prelevement = N;` (trouver le bon numéro de champ)
  - Ajouter au message `UpdateContratRequest` :
    - `optional int32 jour_prelevement = N;`
  - Régénérer les types TypeScript : `bun run proto:gen` ou commande équivalente dans packages/proto

  **Must NOT do**:
  - Ne PAS ajouter de champ `jour_prelevement` à ContratEntity (reste dans service-finance)
  - Ne PAS modifier le proto calendar.proto
  - Ne PAS ajouter d'autres champs (batch, shiftStrategy, etc.)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Modification proto + régénération de types, compréhension protobuf
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 2 (after Task 1)
  - **Blocks**: Task 3
  - **Blocked By**: Task 1

  **References**:

  **Pattern References**:
  - `packages/proto/src/contrats/contrats.proto` — Proto actuel avec le message Contrat (21 champs), CreateContratRequest, UpdateContratRequest. Ajouter les nouveaux champs en suivant la convention de nommage snake_case existante.

  **API/Type References**:
  - `packages/proto/src/contrats/contrats.proto:Contrat` — Message Contrat existant, dernier champ = 21
  - `packages/proto/src/contrats/contrats.proto:CreateContratRequest` — Request de création existante
  - `packages/proto/src/contrats/contrats.proto:UpdateContratRequest` — Request de mise à jour existante

  **External References**:
  - Vérifier comment le proto est généré : chercher un script `proto:gen` ou `protoc` dans `packages/proto/package.json`

  **Acceptance Criteria**:

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: Proto compilation succeeds
    Tool: Bash
    Preconditions: packages/proto directory exists
    Steps:
      1. Run proto generation command in packages/proto
      2. Assert: exit code 0, no errors
      3. Grep generated TS file for "jour_prelevement" and "prochaine_date_prelevement"
      4. Assert: both fields present in generated types
    Expected Result: Proto compiles and generates TS types with new fields
    Evidence: Terminal output captured

  Scenario: New fields are optional (backward compatible)
    Tool: Bash (grpcurl)
    Preconditions: service-commercial running
    Steps:
      1. grpcurl -plaintext -d '{"organisation_id":"org-001","reference":"TEST-PROTO","statut":"actif","date_debut":"2026-03-01","client_id":"client-001","commercial_id":"com-001"}' localhost:50053 contrats.ContratService/Create
      2. Assert: creation succeeds WITHOUT jour_prelevement (optional field)
      3. Assert: response does not contain jour_prelevement or it's 0/null
    Expected Result: Backward compatible — old requests still work
    Evidence: Response body captured
  ```

  **Commit**: YES
  - Message: `feat(proto): add jour_prelevement and prochaine_date_prelevement to Contrat message`
  - Files: `packages/proto/src/contrats/contrats.proto`, `packages/proto/gen/` (generated)
  - Pre-commit: proto generation command succeeds

---

- [ ] 3. Créer le client gRPC cross-service dans service-commercial + enrichir les réponses contrat

  **What to do**:
  - **Créer le client gRPC vers service-finance** :
    - Créer `services/service-commercial/src/infrastructure/grpc/calendar/calendar-grpc-client.ts`
    - Suivre le pattern de `subscription-charge.service.ts:171-221` avec `loadGrpcPackage('calendar')`
    - Implémenter 3 méthodes : `getContractConfig(contratId)`, `createContractConfig(input)`, `updateContractConfig(input)`
  - **Enrichir le ContratService** (`services/service-commercial/src/infrastructure/persistence/typeorm/repositories/contrats/contrat.service.ts`) :
    - Dans `create()` : si `jourPrelevement` est fourni, appeler le client gRPC pour créer la ContractDebitConfiguration dans service-finance (mode=FIXED_DAY, fixedDay=jourPrelevement)
    - Dans `update()` : si `jourPrelevement` est modifié, appeler le client gRPC pour update/create la config
    - Dans `findById()`, `findByIdWithDetails()`, `findAll()` : enrichir la réponse en appelant le client gRPC pour récupérer la config et calculer la prochaine date
  - **Calcul simple de la prochaine date** (dans le client ou dans un utilitaire) :
    - Input: `fixedDay` (1-28) + date du jour
    - Output: prochaine date (ISO string)
    - Logique : si le jour est passé ce mois → 1er du mois prochain avec le bon jour. Sinon → ce mois avec le bon jour.
  - **Enrichir le controller** (`contrat.controller.ts`) pour passer les nouveaux champs dans les réponses proto

  **Must NOT do**:
  - Ne PAS stocker `jourPrelevement` dans la table `contrat` (il vit dans service-finance)
  - Ne PAS implémenter de logique complexe (jours fériés, business days)
  - Ne PAS créer de REST endpoints
  - Ne PAS modifier CalendarAdminController

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Cross-service gRPC, logique métier, enrichissement de réponses
  - **Skills**: [`microservice-maintainer`]
    - `microservice-maintainer`: Modification d'un service existant, ajout de fonctionnalités

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 3
  - **Blocks**: Task 4
  - **Blocked By**: Tasks 1, 2

  **References**:

  **Pattern References**:
  - `services/service-commercial/src/domain/subscriptions/services/subscription-charge.service.ts:171-221` — **PATTERN PRINCIPAL** : Comment faire un appel gRPC cross-service avec `loadGrpcPackage()`. Suivre exactement ce pattern pour créer le client calendar.
  - `services/service-commercial/src/infrastructure/persistence/typeorm/repositories/contrats/contrat.service.ts` — Service contrat actuel. Les méthodes `create()`, `update()`, `findById()`, `findAll()` sont à enrichir.
  - `services/service-commercial/src/infrastructure/grpc/contrats/contrat.controller.ts` — Controller gRPC. Mapper les nouveaux champs `jour_prelevement` et `prochaine_date_prelevement` dans les réponses.

  **API/Type References**:
  - `packages/proto/src/calendar/calendar.proto:577-605` — Méthodes DebitConfigurationService à appeler (CreateContractConfig, GetContractConfig, UpdateContractConfig)
  - `services/service-finance/src/domain/calendar/entities/contract-debit-configuration.entity.ts` — Structure de la config (pour comprendre les champs attendus)

  **Acceptance Criteria**:

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: Create contract with jour_prelevement creates debit config
    Tool: Bash (grpcurl)
    Preconditions: service-commercial running on localhost:50053, service-finance on localhost:50059
    Steps:
      1. grpcurl -plaintext -d '{"organisation_id":"org-001","reference":"TEST-DEBIT-001","statut":"actif","date_debut":"2026-03-01","client_id":"client-001","commercial_id":"com-001","jour_prelevement":15}' localhost:50053 contrats.ContratService/Create
      2. Assert: response.jour_prelevement == 15
      3. Assert: response.prochaine_date_prelevement is a valid ISO date string
      4. Verify config in service-finance: grpcurl -plaintext -d '{"organisation_id":"org-001","contrat_id":"<created-id>"}' localhost:50059 calendar.DebitConfigurationService/GetContractConfig
      5. Assert: finance response.fixed_day == 15
    Expected Result: Contract created AND debit config created in service-finance
    Evidence: Both response bodies captured

  Scenario: Get contract returns enriched prelevement info
    Tool: Bash (grpcurl)
    Preconditions: Contract with debit config exists
    Steps:
      1. grpcurl -plaintext -d '{"id":"<contract-id>","organisation_id":"org-001"}' localhost:50053 contrats.ContratService/Get
      2. Assert: response.jour_prelevement == 15
      3. Assert: response.prochaine_date_prelevement matches expected date (if today < 15th → this month's 15th, else next month's 15th)
    Expected Result: Contract response includes prelevement info
    Evidence: Response body captured

  Scenario: Create contract without jour_prelevement works (backward compat)
    Tool: Bash (grpcurl)
    Steps:
      1. grpcurl -plaintext -d '{"organisation_id":"org-001","reference":"TEST-NODEBIT-001","statut":"actif","date_debut":"2026-03-01","client_id":"client-001","commercial_id":"com-001"}' localhost:50053 contrats.ContratService/Create
      2. Assert: creation succeeds
      3. Assert: response does NOT contain jour_prelevement or it's 0
    Expected Result: Contract created without debit config
    Evidence: Response body captured

  Scenario: List contracts includes prelevement info for all contracts
    Tool: Bash (grpcurl)
    Preconditions: Multiple contracts exist, some with debit config, some without
    Steps:
      1. grpcurl -plaintext -d '{"organisation_id":"org-001"}' localhost:50053 contrats.ContratService/List
      2. Assert: contracts with config have jour_prelevement and prochaine_date_prelevement
      3. Assert: contracts without config have jour_prelevement == 0 or absent
    Expected Result: Mixed list renders correctly
    Evidence: Response body captured
  ```

  **Commit**: YES
  - Message: `feat(commercial): add cross-service gRPC client to finance for contract debit date enrichment`
  - Files: `services/service-commercial/src/infrastructure/grpc/calendar/calendar-grpc-client.ts`, `services/service-commercial/src/infrastructure/persistence/typeorm/repositories/contrats/contrat.service.ts`, `services/service-commercial/src/infrastructure/grpc/contrats/contrat.controller.ts`
  - Pre-commit: grpcurl create + get contract with jour_prelevement

---

- [ ] 4. Frontend — Formulaire création/édition + colonnes tables

  **What to do**:
  - **Formulaire de création** (`frontend/src/components/create-contrat-dialog.tsx`) :
    - Ajouter un champ optionnel "Jour de prélèvement" (input number 1-28) dans la section `Collapsible` existante (lignes 447-613)
    - Ajouter au schema Zod : `jourPrelevement: z.number().min(1).max(28).optional()`
    - Passer la valeur à l'action de création gRPC
  - **Table contrats client** (`frontend/src/components/client-detail/client-contracts.tsx`) :
    - Ajouter une colonne "Prélèvement" après la colonne "Paiement" (ligne 44-52)
    - Afficher : jour fixe (ex: "Le 15") ou "—" si pas configuré
    - Mettre à jour l'action de fetch pour récupérer les nouveaux champs enrichis
  - **Table contrats commercial** (`frontend/src/components/commercial-detail/commercial-contrats.tsx`) :
    - Ajouter une colonne "Prélèvement" (ligne 146-154)
    - Même logique d'affichage
  - **Server action contrats** : S'assurer que les actions frontend passent et reçoivent `jour_prelevement` et `prochaine_date_prelevement`

  **Must NOT do**:
  - Ne PAS créer de nouveau composant réutilisable complexe pour le champ jour
  - Ne PAS refactorer les tables existantes
  - Ne PAS ajouter de validation côté frontend au-delà de min/max (1-28)
  - Ne PAS toucher au module Paiements

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: Modifications UI React, formulaires, tables
  - **Skills**: [`frontend-ui-ux`]
    - `frontend-ui-ux`: UI/UX design, intégration formulaires React

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 4
  - **Blocks**: Task 5
  - **Blocked By**: Task 3

  **References**:

  **Pattern References**:
  - `frontend/src/components/create-contrat-dialog.tsx:447-613` — Section Collapsible du formulaire de création. Ajouter le champ "Jour de prélèvement" ici, en suivant le pattern des autres champs optionnels (même structure FormField + FormItem + FormControl).
  - `frontend/src/components/create-contrat-dialog.tsx:57-75` — Schema Zod du formulaire. Ajouter `jourPrelevement` ici.
  - `frontend/src/components/client-detail/client-contracts.tsx:44-52` — Headers de la table contrats côté client. Ajouter "Prélèvement" ici.
  - `frontend/src/components/commercial-detail/commercial-contrats.tsx:146-154` — Headers de la table contrats côté commercial. Ajouter "Prélèvement" ici.

  **API/Type References**:
  - `frontend/src/lib/ui/display-types/contract.ts:18-26` — Interface Contract (UI type). Ajouter `jourPrelevement` et `prochaineDatePrelevement`.
  - `frontend/src/proto/contrats/contrats.ts` — Types proto générés. Après Task 2, contiendra les nouveaux champs.

  **Acceptance Criteria**:

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: Formulaire création — champ jour prélèvement visible
    Tool: Playwright (playwright skill)
    Preconditions: Dev server running on localhost:3000, user logged in
    Steps:
      1. Navigate to page with contract creation button (ex: /clients/<id>)
      2. Click button that opens create-contrat-dialog
      3. Wait for dialog visible (timeout: 5s)
      4. Look for Collapsible section / "Options" or similar, expand it
      5. Assert: input for "Jour de prélèvement" visible (type=number)
      6. Fill: jour de prélèvement input → 15
      7. Fill required fields (reference, statut, date début, client, commercial)
      8. Click submit button
      9. Wait for dialog to close (timeout: 10s)
      10. Assert: no error toast/message
      11. Screenshot: .sisyphus/evidence/task-4-create-form.png
    Expected Result: Contract created with jour prélèvement = 15
    Evidence: .sisyphus/evidence/task-4-create-form.png

  Scenario: Formulaire création — jour prélèvement optionnel
    Tool: Playwright (playwright skill)
    Steps:
      1. Open create dialog
      2. Fill required fields WITHOUT jour prélèvement
      3. Submit
      4. Assert: creation succeeds (no error)
    Expected Result: Contract created without debit config
    Evidence: .sisyphus/evidence/task-4-create-no-debit.png

  Scenario: Table contrats client — colonne Prélèvement visible
    Tool: Playwright (playwright skill)
    Preconditions: Contracts exist for a client, some with debit config
    Steps:
      1. Navigate to /clients/<id>
      2. Wait for contracts table visible (timeout: 10s)
      3. Assert: table header "Prélèvement" exists
      4. Assert: at least one row shows "Le 15" or similar date format
      5. Assert: rows without config show "—" or empty
      6. Screenshot: .sisyphus/evidence/task-4-client-table.png
    Expected Result: Prélèvement column visible with correct data
    Evidence: .sisyphus/evidence/task-4-client-table.png

  Scenario: Table contrats commercial — colonne Prélèvement visible
    Tool: Playwright (playwright skill)
    Steps:
      1. Navigate to commercial detail page
      2. Wait for contracts table visible
      3. Assert: table header "Prélèvement" exists
      4. Screenshot: .sisyphus/evidence/task-4-commercial-table.png
    Expected Result: Same column visible in commercial view
    Evidence: .sisyphus/evidence/task-4-commercial-table.png
  ```

  **Commit**: YES
  - Message: `feat(frontend): add jour prelevement field to contract form and prelevement column to contract tables`
  - Files: `frontend/src/components/create-contrat-dialog.tsx`, `frontend/src/components/client-detail/client-contracts.tsx`, `frontend/src/components/commercial-detail/commercial-contrats.tsx`, `frontend/src/lib/ui/display-types/contract.ts`

---

- [ ] 5. Frontend — Page détail contrat `/contrats/[id]` avec section prélèvement

  **What to do**:
  - **Créer la page** `frontend/src/app/(dashboard)/contrats/[id]/page.tsx` (ou le path correct selon la structure du router)
  - Afficher :
    - Informations générales du contrat (référence, statut, dates, montant, client, commercial)
    - Lignes de contrat (produits)
    - Historique des statuts
    - **Section "Prélèvement"** :
      - Jour de prélèvement configuré (ex: "Le 15 de chaque mois")
      - Prochaine date de prélèvement calculée
      - Bouton "Modifier" pour changer le jour
      - Si pas configuré : afficher "Non configuré" avec un bouton "Configurer"
  - Le bouton "Modifier"/"Configurer" ouvre un petit dialog/popover avec un input number (1-28) et un bouton Save
  - Utiliser les données de `GetWithDetails` + les champs enrichis (jour_prelevement, prochaine_date_prelevement)

  **Must NOT do**:
  - Ne PAS créer une page complexe avec onglets/tabs (simple page scrollable)
  - Ne PAS dupliquer le composant table de contrats
  - Ne PAS ajouter de graphiques ou visualisations complexes

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: Création de page frontend React, UX/UI
  - **Skills**: [`frontend-ui-ux`]
    - `frontend-ui-ux`: Design de page, composants React

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 5
  - **Blocks**: Task 6
  - **Blocked By**: Task 4

  **References**:

  **Pattern References**:
  - `frontend/src/components/client-detail/` — Pattern de page détail existant. Suivre la même structure (layout, sections, cards) pour la page contrat.
  - `frontend/src/components/commercial-detail/` — Autre pattern de page détail.
  - `frontend/src/components/commercial-detail/commercial-contrats.tsx:81` — Le lien `/contrats/${id}` est déjà utilisé pour naviguer vers le détail contrat (la page n'existe juste pas encore).
  - `frontend/src/components/create-contrat-dialog.tsx` — Réutiliser des composants similaires pour le dialog de modification du jour.

  **API/Type References**:
  - `packages/proto/src/contrats/contrats.proto:ContratWithDetails` — Message contenant contrat + lignes + historique. Utiliser cette méthode pour charger la page.
  - `frontend/src/proto/contrats/contrats.ts` — Types proto générés avec les nouveaux champs enrichis.

  **Acceptance Criteria**:

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: Page détail contrat accessible et affiche les infos
    Tool: Playwright (playwright skill)
    Preconditions: Dev server running, contract "TEST-DEBIT-001" exists with jour_prelevement=15
    Steps:
      1. Navigate to /contrats/<contract-id>
      2. Wait for page loaded (timeout: 10s)
      3. Assert: contract reference "TEST-DEBIT-001" visible
      4. Assert: section "Prélèvement" visible
      5. Assert: text "Le 15" or "15" visible in prélèvement section
      6. Assert: prochaine date visible (date format)
      7. Screenshot: .sisyphus/evidence/task-5-detail-page.png
    Expected Result: Detail page loads with all contract info + prélèvement section
    Evidence: .sisyphus/evidence/task-5-detail-page.png

  Scenario: Modifier le jour de prélèvement depuis la page détail
    Tool: Playwright (playwright skill)
    Steps:
      1. On contract detail page
      2. Click "Modifier" button in prélèvement section
      3. Wait for dialog/popover (timeout: 5s)
      4. Clear input and type "22"
      5. Click save button
      6. Wait for dialog close and page refresh (timeout: 10s)
      7. Assert: "22" now visible in prélèvement section
      8. Screenshot: .sisyphus/evidence/task-5-modify-jour.png
    Expected Result: Jour updated to 22
    Evidence: .sisyphus/evidence/task-5-modify-jour.png

  Scenario: Contrat sans prélèvement — bouton Configurer visible
    Tool: Playwright (playwright skill)
    Preconditions: Contract exists WITHOUT debit config
    Steps:
      1. Navigate to /contrats/<contract-without-debit-id>
      2. Assert: prélèvement section shows "Non configuré" or similar
      3. Assert: "Configurer" button visible
      4. Click "Configurer"
      5. Enter "10" in input
      6. Save
      7. Assert: "10" now visible
      8. Screenshot: .sisyphus/evidence/task-5-configure-new.png
    Expected Result: Can configure prélèvement on contract that didn't have one
    Evidence: .sisyphus/evidence/task-5-configure-new.png
  ```

  **Commit**: YES
  - Message: `feat(frontend): create contract detail page with prelevement section`
  - Files: `frontend/src/app/(dashboard)/contrats/[id]/page.tsx`

---

- [ ] 6. QA Validation Phase 1 — Parcours complet end-to-end

  **What to do**:
  - Exécuter un parcours E2E complet validant l'ensemble de la Phase 1
  - Vérifier la cohérence des données entre service-commercial et service-finance
  - Capturer des screenshots de chaque étape

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Validation uniquement, pas de code
  - **Skills**: [`playwright`]
    - `playwright`: Automatisation browser pour vérification visuelle

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 6
  - **Blocks**: None
  - **Blocked By**: Task 5

  **References**: Toutes les tâches précédentes (1-5)

  **Acceptance Criteria**:

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: E2E — Créer un contrat avec jour prélèvement et vérifier partout
    Tool: Playwright (playwright skill) + Bash (grpcurl)
    Steps:
      1. [Playwright] Navigate to client page
      2. [Playwright] Open create contrat dialog
      3. [Playwright] Fill: reference="E2E-TEST-001", statut=actif, date début=2026-04-01, jour prélèvement=20
      4. [Playwright] Submit
      5. [Playwright] Assert: contract appears in client table with "Le 20" in Prélèvement column
      6. [Playwright] Click on the contract to navigate to detail page
      7. [Playwright] Assert: detail page shows "20" in prélèvement section
      8. [Playwright] Assert: prochaine date is calculated and displayed
      9. [grpcurl] Verify service-finance has the config: GetContractConfig
      10. [grpcurl] Assert: fixed_day == 20
      11. [Playwright] Modify jour to 5 from detail page
      12. [Playwright] Assert: detail page now shows "5"
      13. [Playwright] Go back to client contracts list
      14. [Playwright] Assert: table shows "Le 5"
    Expected Result: Full round-trip works
    Evidence: .sisyphus/evidence/task-6-e2e-complete.png

  Scenario: E2E — Contrat sans prélèvement reste fonctionnel
    Tool: Playwright (playwright skill)
    Steps:
      1. Create contract WITHOUT jour prélèvement
      2. Assert: table shows "—" for this contract
      3. Navigate to detail page
      4. Assert: "Non configuré" visible
      5. Configure prélèvement to "12"
      6. Go back to table
      7. Assert: now shows "Le 12"
    Expected Result: Graceful handling of no-config scenario
    Evidence: .sisyphus/evidence/task-6-e2e-no-config.png
  ```

  **Commit**: NO (validation only)

---

### PHASE 2 — Import de contrats depuis un outil externe (PARALLÈLE)

- [x] 7. Backend — Proto + Service d'import dans service-commercial

  **What to do**:
  - **Proto** : Ajouter dans `contrats.proto` :
    - Un nouveau service `ContratImportService` avec les méthodes :
      - `ImportFromExternal(ImportFromExternalRequest) returns (ImportFromExternalResponse)` — Lance l'import
      - `GetImportStatus(GetImportStatusRequest) returns (GetImportStatusResponse)` — Vérifie le statut
    - Messages : `ImportFromExternalRequest { organisation_id, source_url, api_key, dry_run }`, `ImportFromExternalResponse { total_rows, created_count, updated_count, skipped_count, errors[] }`
  - **Service d'import** : Créer `services/service-commercial/src/domain/contrats/services/contrat-import.service.ts`
    - Méthode `importFromExternal(config)` :
      - Appeler l'API externe via HTTP (`@nestjs/axios` ou `fetch`)
      - Mapper les données vers CreateContratRequest
      - Upsert : si référence existe → update, sinon → create
      - Si `jour_prelevement` présent dans les données importées → le passer à la création
      - Si absent → créer le contrat sans config prélèvement
      - Retourner un rapport (created, updated, skipped, errors)
    - Méthode `getImportStatus(importId)` — retourne le statut d'un import en cours
  - **Controller gRPC** : Créer `services/service-commercial/src/infrastructure/grpc/contrats/contrat-import.controller.ts`
  - **Enregistrer** dans `contrats.module.ts` et `main.ts` (ajouter 'contrat-import' aux gRPC options)
  - **Spec d'API source** : Créer `.sisyphus/drafts/api-source-spec.md` documentant le format attendu de l'API externe (endpoints, format JSON, champs obligatoires/optionnels)

  **Must NOT do**:
  - Ne PAS créer de framework ETL/adapter/factory pattern
  - Ne PAS créer un microservice séparé
  - Ne PAS implémenter de pagination côté source (v1 simple)
  - Ne PAS ajouter de WebSocket pour la progression
  - Ne PAS stocker les credentials en dur (utiliser des variables d'env)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Backend service NestJS, appels HTTP, logique métier d'import
  - **Skills**: [`microservice-maintainer`]
    - `microservice-maintainer`: Ajout de feature à un service existant

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Task 1)
  - **Blocks**: Tasks 8, 9
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `services/service-commercial/src/infrastructure/messaging/nats/handlers/mondial-tv/ims-event-handler.ts:142-200` — Pattern d'appel HTTP externe depuis service-commercial avec `loadGrpcPackage`. Montre comment faire des appels cross-service.
  - `services/service-commercial/src/infrastructure/persistence/typeorm/repositories/contrats/contrat.service.ts` — Service contrat existant. Réutiliser `create()` et `update()` pour l'upsert.
  - `services/service-commercial/src/contrats.module.ts` — Module NestJS pour enregistrer le nouveau controller et service.
  - `services/service-commercial/src/main.ts:13` — Liste des packages gRPC à charger. Y ajouter le nouveau service si nécessaire.

  **API/Type References**:
  - `packages/proto/src/contrats/contrats.proto` — Ajouter le nouveau service ContratImportService ici.
  - `services/service-commercial/src/infrastructure/persistence/typeorm/repositories/contrats/contrat.service.ts` — Méthodes `create()` et `findByReference()` pour l'upsert.

  **Acceptance Criteria**:

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: Import dry-run returns preview without creating data
    Tool: Bash (grpcurl)
    Preconditions: service-commercial running, mock/test API source accessible
    Steps:
      1. grpcurl -plaintext -d '{"organisation_id":"org-001","source_url":"http://test-source/api/contracts","api_key":"test-key","dry_run":true}' localhost:50053 contrats.ContratImportService/ImportFromExternal
      2. Assert: response.total_rows > 0
      3. Assert: response.created_count == 0 (dry run)
      4. Verify no contracts were created: List contracts and compare count
    Expected Result: Preview only, no data changes
    Evidence: Response body captured

  Scenario: Import creates and updates contracts
    Tool: Bash (grpcurl)
    Steps:
      1. Run import with dry_run=false
      2. Assert: response.created_count > 0
      3. List contracts → Assert new contracts exist
      4. Run import again (same data)
      5. Assert: response.updated_count > 0, response.created_count == 0 (upsert)
    Expected Result: First run creates, second run updates
    Evidence: Response bodies captured

  Scenario: Import handles missing jour_prelevement gracefully
    Tool: Bash (grpcurl)
    Preconditions: Source API returns mix of contracts with/without jour_prelevement
    Steps:
      1. Run import
      2. Assert: contracts with jour_prelevement have debit config
      3. Assert: contracts without jour_prelevement have no debit config
    Expected Result: Partial jour_prelevement handled correctly
    Evidence: Response body + verification queries
  ```

  **Commit**: YES
  - Message: `feat(commercial): add contract import service from external API`
  - Files: `packages/proto/src/contrats/contrats.proto`, `services/service-commercial/src/domain/contrats/services/contrat-import.service.ts`, `services/service-commercial/src/infrastructure/grpc/contrats/contrat-import.controller.ts`, `services/service-commercial/src/contrats.module.ts`

---

- [ ] 8. Backend — Cron scheduler pour import automatique

  **What to do**:
  - Créer `services/service-commercial/src/infrastructure/scheduling/contrat-import-scheduler.service.ts`
  - Utiliser `@nestjs/schedule` avec `@Cron()` (pattern existant dans le codebase)
  - Fréquence : configurable via variable d'env `IMPORT_CRON_SCHEDULE` (default: tous les jours à 2h du matin)
  - Le cron appelle `contrat-import.service.ts.importFromExternal()` avec la config stockée (source_url, api_key depuis env vars)
  - Logging : loguer le début, fin, et résumé de chaque import (created, updated, errors)
  - Guard : ne pas lancer si un import est déjà en cours (flag simple)
  - Enregistrer le scheduler dans `contrats.module.ts`

  **Must NOT do**:
  - Ne PAS créer un système de queue/job complexe
  - Ne PAS stocker la config d'import en base (env vars suffisent pour v1)
  - Ne PAS ajouter de notifications (email, slack) sur les résultats

  **Recommended Agent Profile**:
  - **Category**: `unspecified-low`
    - Reason: Simple cron NestJS, pattern existant à suivre
  - **Skills**: [`microservice-maintainer`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 2, 9)
  - **Blocks**: Task 10
  - **Blocked By**: Task 7

  **References**:

  **Pattern References**:
  - `services/service-core/src/infrastructure/scheduling/depanssur-scheduler.service.ts:80-133` — **PATTERN EXACT** : Scheduler @Cron existant. Suivre cette structure pour le cron d'import.
  - `services/service-finance/src/infrastructure/scheduling/archive-scheduler.service.ts` — Autre exemple de scheduler existant.

  **API/Type References**:
  - `services/service-commercial/src/domain/contrats/services/contrat-import.service.ts` — Service d'import créé en Task 7. Le cron appelle sa méthode `importFromExternal()`.

  **Acceptance Criteria**:

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: Cron scheduler is registered
    Tool: Bash
    Preconditions: service-commercial running
    Steps:
      1. Check logs for "Cron" or "scheduled" registration messages
      2. Assert: import scheduler is mentioned in startup logs
    Expected Result: Scheduler registered at startup
    Evidence: Log output captured

  Scenario: Cron does not double-run
    Tool: Bash
    Steps:
      1. Trigger two imports simultaneously
      2. Assert: second import is skipped with "already running" log message
    Expected Result: Concurrent protection works
    Evidence: Log output captured
  ```

  **Commit**: YES (groups with Task 7)
  - Message: `feat(commercial): add cron scheduler for automatic contract import`
  - Files: `services/service-commercial/src/infrastructure/scheduling/contrat-import-scheduler.service.ts`, `services/service-commercial/src/contrats.module.ts`

---

- [ ] 9. Frontend — Dialog d'import de contrats

  **What to do**:
  - Créer `frontend/src/components/import-contrats-dialog.tsx`
  - UI :
    - Bouton "Importer des contrats" accessible depuis la liste des contrats
    - Dialog avec :
      - Champ "URL de l'API source" (pré-rempli si configuré en env)
      - Champ "Clé API" (password input)
      - Checkbox "Dry run (prévisualisation)"
      - Bouton "Lancer l'import"
    - Résultats :
      - Tableau récapitulatif : total, créés, mis à jour, ignorés, erreurs
      - Liste des erreurs si présentes
  - **Server action** : Créer `frontend/src/actions/contrat-import.ts` qui appelle le gRPC `ContratImportService/ImportFromExternal`
  - Intégrer le bouton "Importer" dans la vue contrats (par ex. dans `contrats-card.tsx` ou là où la liste de contrats est affichée)

  **Must NOT do**:
  - Ne PAS créer de page séparée pour l'import
  - Ne PAS ajouter de progress bar/real-time updates
  - Ne PAS stocker les credentials côté frontend

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: UI React, dialog, formulaire
  - **Skills**: [`frontend-ui-ux`]
    - `frontend-ui-ux`: Design de dialog, UX d'import

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 2, 8)
  - **Blocks**: Task 10
  - **Blocked By**: Task 7

  **References**:

  **Pattern References**:
  - `frontend/src/components/create-contrat-dialog.tsx` — Pattern de dialog existant avec formulaire, schema Zod, server actions. Suivre exactement la même structure.
  - `frontend/src/components/contrats-card.tsx` — Card/page qui affiche les contrats. Y intégrer le bouton "Importer".

  **API/Type References**:
  - Proto `ContratImportService/ImportFromExternal` — Service gRPC créé en Task 7.
  - `frontend/src/actions/calendar-config.ts` — Pattern de server action existant qui appelle gRPC. Suivre ce pattern pour la nouvelle action.

  **Acceptance Criteria**:

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: Dialog d'import accessible et fonctionnel
    Tool: Playwright (playwright skill)
    Preconditions: Dev server running, user logged in
    Steps:
      1. Navigate to contracts view
      2. Click "Importer des contrats" button
      3. Wait for dialog (timeout: 5s)
      4. Assert: URL field visible
      5. Assert: API key field visible (type=password)
      6. Assert: Dry run checkbox visible
      7. Screenshot: .sisyphus/evidence/task-9-import-dialog.png
    Expected Result: Import dialog opens with all fields
    Evidence: .sisyphus/evidence/task-9-import-dialog.png

  Scenario: Dry run shows preview
    Tool: Playwright (playwright skill)
    Steps:
      1. Fill URL and API key
      2. Check "Dry run" checkbox
      3. Click "Lancer l'import"
      4. Wait for results (timeout: 30s)
      5. Assert: summary table visible (total, créés, mis à jour, erreurs)
      6. Assert: created_count shows 0 (dry run)
      7. Screenshot: .sisyphus/evidence/task-9-dry-run.png
    Expected Result: Preview results shown without creating data
    Evidence: .sisyphus/evidence/task-9-dry-run.png

  Scenario: Real import shows results
    Tool: Playwright (playwright skill)
    Steps:
      1. Fill URL and API key
      2. Uncheck "Dry run"
      3. Click "Lancer l'import"
      4. Wait for results (timeout: 60s)
      5. Assert: summary shows created_count > 0
      6. Close dialog
      7. Assert: new contracts visible in contracts table
      8. Screenshot: .sisyphus/evidence/task-9-import-results.png
    Expected Result: Contracts imported and visible
    Evidence: .sisyphus/evidence/task-9-import-results.png
  ```

  **Commit**: YES
  - Message: `feat(frontend): add contract import dialog with dry-run support`
  - Files: `frontend/src/components/import-contrats-dialog.tsx`, `frontend/src/actions/contrat-import.ts`, `frontend/src/components/contrats-card.tsx`

---

- [ ] 10. QA Validation Phase 2 — Import end-to-end

  **What to do**:
  - Exécuter un parcours E2E complet validant l'import
  - Vérifier que les contrats importés avec jour_prelevement ont bien leur config dans service-finance
  - Vérifier que le cron est correctement enregistré

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Validation uniquement
  - **Skills**: [`playwright`]

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Sequential (after 8, 9)
  - **Blocks**: None
  - **Blocked By**: Tasks 8, 9

  **References**: Tasks 7, 8, 9

  **Acceptance Criteria**:

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: E2E Import — Contrats importés visibles avec prélèvement
    Tool: Playwright + Bash
    Steps:
      1. [Playwright] Open import dialog
      2. [Playwright] Fill URL + API key, uncheck dry run
      3. [Playwright] Click import
      4. [Playwright] Assert: success with created_count > 0
      5. [Playwright] Close dialog
      6. [Playwright] Assert: imported contracts visible in table
      7. [Playwright] Assert: contracts with jour_prelevement show the day in "Prélèvement" column
      8. [Playwright] Click on imported contract → navigate to detail page
      9. [Playwright] Assert: prélèvement section shows configured jour
      10. [grpcurl] Verify service-finance has the config
      11. Screenshot: .sisyphus/evidence/task-10-e2e-import.png
    Expected Result: Full import → display → verification pipeline works
    Evidence: .sisyphus/evidence/task-10-e2e-import.png
  ```

  **Commit**: NO (validation only)

---

## Commit Strategy

| After Task | Message | Key Files | Verification |
|------------|---------|-----------|--------------|
| 1 | `feat(finance): wire contract debit configuration gRPC CRUD methods` | configuration.controller.ts | grpcurl CRUD calls |
| 2 | `feat(proto): add jour_prelevement and prochaine_date_prelevement to Contrat message` | contrats.proto | proto compilation |
| 3 | `feat(commercial): add cross-service gRPC client to finance for contract debit date enrichment` | calendar-grpc-client.ts, contrat.service.ts, contrat.controller.ts | grpcurl create+get with debit |
| 4 | `feat(frontend): add jour prelevement field to contract form and prelevement column to tables` | create-contrat-dialog.tsx, client-contracts.tsx, commercial-contrats.tsx | Playwright |
| 5 | `feat(frontend): create contract detail page with prelevement section` | contrats/[id]/page.tsx | Playwright |
| 7 | `feat(commercial): add contract import service from external API` | contrat-import.service.ts, contrat-import.controller.ts | grpcurl import |
| 8 | `feat(commercial): add cron scheduler for automatic contract import` | contrat-import-scheduler.service.ts | logs verification |
| 9 | `feat(frontend): add contract import dialog with dry-run support` | import-contrats-dialog.tsx, contrat-import.ts | Playwright |

---

## Success Criteria

### Verification Commands
```bash
# Phase 1 — Date prélèvement
grpcurl -plaintext -d '{"organisation_id":"org","reference":"TEST","statut":"actif","date_debut":"2026-03-01","client_id":"c","commercial_id":"m","jour_prelevement":15}' localhost:50053 contrats.ContratService/Create
# Expected: response with jour_prelevement=15 and prochaine_date_prelevement

grpcurl -plaintext -d '{"id":"<id>","organisation_id":"org"}' localhost:50053 contrats.ContratService/Get
# Expected: response includes jour_prelevement and prochaine_date_prelevement

# Phase 2 — Import
grpcurl -plaintext -d '{"organisation_id":"org","source_url":"http://source/api","api_key":"key","dry_run":true}' localhost:50053 contrats.ContratImportService/ImportFromExternal
# Expected: response with total_rows, preview counts
```

### Final Checklist
- [ ] Contrat créé avec jour_prelevement → ContractDebitConfig créée dans service-finance
- [ ] Contrat listé → colonne Prélèvement affiche le jour ou "—"
- [ ] Page détail contrat → section Prélèvement avec jour + prochaine date
- [ ] Formulaire → champ jour prélèvement optionnel et fonctionnel
- [ ] Import dry-run → prévisualisation sans création
- [ ] Import réel → contrats créés/mis à jour avec debit config optionnelle
- [ ] Cron → enregistré et fonctionnel
- [ ] Aucun champ jourPrelevement sur la table contrat (vit dans service-finance)
- [ ] Aucun CalendarEngine complet implémenté (calcul simple uniquement)
- [ ] Aucun REST endpoint créé (tout gRPC)
