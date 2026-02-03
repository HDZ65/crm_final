# Consolidation des Services par Thème

## TL;DR

> **Quick Summary**: Réduire de 19 à 12 microservices en regroupant par domaine métier. Fusion des DBs, cutover unique proto, golden tests avant consolidation critique.
> 
> **Deliverables**:
> - 5 services consolidés (engagement, clients, identity, commercial, payments étendu)
> - 7 services inchangés (activites, calendar, contrats, documents, factures, logistics, products)
> - Naming conventions corrigées (camelCase → snake_case)
> - Tests migrés et golden tests ajoutés
> 
> **Estimated Effort**: XL (5+ jours de travail)
> **Parallel Execution**: OUI - certaines phases parallélisables
> **Critical Path**: Phase 0 → Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5

---

## Context

### Original Request
L'utilisateur a trop de services (19) et veut les consolider par thème pour réduire la complexité opérationnelle, améliorer la cohérence du code, et faciliter le développement.

### Interview Summary
**Key Discussions**:
- Cible: 8-12 services (consolidation modérée)
- Ordre: Quick wins d'abord (engagement → clients → identity → commercial → payments)
- DBs: Fusionner lors de chaque consolidation
- Proto: Breaking changes autorisés (cutover unique)
- Tests: Golden tests avant consolidation critique

**Research Findings**:
- Architecture: NestJS + gRPC + NATS + PostgreSQL
- Duplication: StatutClientService existe dans clients ET referentiel
- Erreurs naming: camelCase vs snake_case dans plusieurs services
- Couplage fort: users → organisations (gRPC call), payments → calendar → retry

### Metis Review
**Identified Gaps** (addressed):
- Stratégie DB → Fusion des DBs validée
- Breaking changes proto → Cutover unique validé
- Couverture tests faible → Golden tests avant consolidation critique

---

## Work Objectives

### Core Objective
Consolider 19 microservices en 12 services thématiques tout en maintenant la stabilité du système.

### Concrete Deliverables
- `services/service-engagement/` (nouveau, fusion de email + notifications + dashboard)
- `services/service-clients/` (enrichi avec referentiel)
- `services/service-identity/` (nouveau, fusion de users + organisations)
- `services/service-commercial/` (nouveau, fusion de commerciaux + commission)
- `services/service-payments/` (enrichi avec relance + retry)
- `packages/proto/` mis à jour avec nouveaux services
- `compose/dev/` mis à jour avec 12 services
- Naming conventions corrigées dans tous les services

### Definition of Done
- [x] 12 services (pas 19) dans `services/`
- [x] `bun run build` réussit pour tous les services
- [x] `bun test` passe pour tous les services
- [x] Tous les événements NATS fonctionnent (vérification manuelle ou script)
- [x] Docker compose démarre les 12 services sans erreur

### Must Have
- Migration complète des modules existants
- Tous les tests existants migrés et passants
- Protos mis à jour pour refléter la nouvelle structure
- Documentation mise à jour (README de chaque service)

### Must NOT Have (Guardrails)
- NE PAS modifier la logique métier (pure restructuration)
- NE PAS ajouter de nouvelles fonctionnalités
- NE PAS changer les contrats proto existants (seulement les réorganiser)
- NE PAS supprimer de données (migrations DB additives uniquement)
- NE PAS toucher aux services non concernés (activites, calendar, contrats, documents, factures, logistics, products)

---

## Verification Strategy (MANDATORY)

> **UNIVERSAL RULE: ZERO HUMAN INTERVENTION**
>
> ALL tasks in this plan MUST be verifiable WITHOUT any human action.

### Test Decision
- **Infrastructure exists**: YES (Jest)
- **Automated tests**: Tests-after (migrer existants + golden tests critiques)
- **Framework**: Jest (existant)

### Agent-Executed QA Scenarios
Chaque phase inclut des scénarios de vérification automatisés via:
- **Bash**: `bun run build`, `bun test`, `docker compose up`
- **Curl**: Health checks des services
- **Logs**: Vérification des événements NATS

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 0 (Préparation):
└── Task 1: Golden tests + setup

Wave 1 (Quick Wins - Parallélisable):
├── Task 2: service-engagement (email + notifications + dashboard)
├── Task 3: service-clients (clients + referentiel)
└── Task 4: Naming convention fixes (peut être en parallèle)

Wave 2 (Core Domains):
├── Task 5: service-identity (users + organisations)
└── Task 6: service-commercial (commerciaux + commission)

Wave 3 (Complex - Sequential):
└── Task 7: service-payments extension (+ relance + retry)

Wave 4 (Finalization):
├── Task 8: Proto consolidation finale
├── Task 9: Docker compose update
└── Task 10: Documentation et cleanup
```

### Dependency Matrix

| Task | Depends On | Blocks | Can Parallelize With |
|------|------------|--------|---------------------|
| 1 | None | 2-7 | None |
| 2 | 1 | 8, 9 | 3, 4 |
| 3 | 1 | 8, 9 | 2, 4 |
| 4 | 1 | 8 | 2, 3 |
| 5 | 1 | 8, 9 | 6 |
| 6 | 1 | 8, 9 | 5 |
| 7 | 1 | 8, 9 | None (complex) |
| 8 | 2-7 | 10 | 9 |
| 9 | 2-7 | 10 | 8 |
| 10 | 8, 9 | None | None |

---

## TODOs

### Phase 0: Préparation

- [x] 1. Setup Golden Tests et Health Checks

  **What to do**:
  - Créer des tests de régression "golden" pour service-payments et service-factures
  - Ces tests capturent le comportement actuel AVANT toute modification
  - Ajouter des health check scripts pour chaque service

  **Must NOT do**:
  - Ne pas modifier la logique existante
  - Ne pas ajouter de nouvelles fonctionnalités

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Tâche technique claire, ajout de tests sans complexité métier
  - **Skills**: [`git-master`]
    - `git-master`: Pour commits atomiques des tests

  **Parallelization**:
  - **Can Run In Parallel**: NO (fondation pour tout le reste)
  - **Parallel Group**: Wave 0 (solo)
  - **Blocks**: Tasks 2-7
  - **Blocked By**: None

  **References**:
  - `services/service-payments/src/modules/portal/__tests__/*.spec.ts` - Pattern de tests existants
  - `services/service-factures/src/modules/facture/facture.service.spec.ts` - Pattern Jest NestJS
  - `packages/proto/src/payments/` - Contrats à tester

  **Acceptance Criteria**:
  - [ ] `services/service-payments/src/__tests__/golden/` créé avec ≥3 tests
  - [ ] `services/service-factures/src/__tests__/golden/` créé avec ≥3 tests
  - [ ] `bun test` dans service-payments → PASS
  - [ ] `bun test` dans service-factures → PASS

  **Agent-Executed QA Scenarios**:

  ```
  Scenario: Golden tests passent pour payments
    Tool: Bash
    Preconditions: service-payments existe
    Steps:
      1. cd services/service-payments
      2. bun test --testPathPattern=golden
      3. Assert: Exit code 0
      4. Assert: stdout contains "Tests:.*passed"
    Expected Result: Tous les golden tests passent
    Evidence: Terminal output captured

  Scenario: Golden tests passent pour factures
    Tool: Bash
    Preconditions: service-factures existe
    Steps:
      1. cd services/service-factures
      2. bun test --testPathPattern=golden
      3. Assert: Exit code 0
    Expected Result: Tous les golden tests passent
    Evidence: Terminal output captured
  ```

  **Commit**: YES
  - Message: `test(payments,factures): add golden regression tests before consolidation`
  - Files: `services/service-payments/src/__tests__/golden/*.spec.ts`, `services/service-factures/src/__tests__/golden/*.spec.ts`
  - Pre-commit: `bun test`

---

### Phase 1: Quick Wins (Consolidations Simples)

- [x] 2. Créer service-engagement (fusion email + notifications + dashboard)

  **What to do**:
  - Créer `services/service-engagement/`
  - Migrer tous les modules de service-email, service-notifications, service-dashboard
  - Créer engagement_db (fusion des 3 DBs)
  - Mettre à jour les imports proto
  - Migrer et adapter les tests existants
  - Supprimer les 3 anciens services

  **Must NOT do**:
  - Ne pas modifier la logique métier des handlers d'événements
  - Ne pas ajouter de nouvelles notifications

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Consolidation complexe de 3 services, migrations DB
  - **Skills**: [`git-master`]
    - `git-master`: Commits atomiques par étape

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 3, 4)
  - **Blocks**: Tasks 8, 9
  - **Blocked By**: Task 1

  **References**:
  - `services/service-email/src/` - Modules email à migrer
  - `services/service-notifications/src/` - Modules notifications à migrer
  - `services/service-dashboard/src/` - Modules dashboard à migrer
  - `packages/proto/src/events/` - Event handlers à consolider
  - `services/service-notifications/src/modules/events/invoice-created.handler.ts` - Pattern event handler

  **Acceptance Criteria**:
  - [ ] `services/service-engagement/` existe avec tous les modules
  - [ ] `services/service-email/`, `service-notifications/`, `service-dashboard/` supprimés
  - [ ] `bun run build` dans service-engagement → SUCCESS
  - [ ] `bun test` dans service-engagement → PASS
  - [ ] engagement_db créée avec toutes les tables

  **Agent-Executed QA Scenarios**:

  ```
  Scenario: service-engagement build réussit
    Tool: Bash
    Preconditions: Modules migrés
    Steps:
      1. cd services/service-engagement
      2. bun install
      3. bun run build
      4. Assert: Exit code 0
      5. Assert: dist/ directory exists
    Expected Result: Build sans erreurs
    Evidence: Terminal output captured

  Scenario: Anciens services supprimés
    Tool: Bash
    Steps:
      1. ls services/ | grep -E "(email|notifications|dashboard)"
      2. Assert: No output (services n'existent plus)
    Expected Result: 3 anciens services supprimés
    Evidence: ls output

  Scenario: Tests migrés passent
    Tool: Bash
    Steps:
      1. cd services/service-engagement
      2. bun test
      3. Assert: Exit code 0
    Expected Result: Tests passent
    Evidence: Test output
  ```

  **Commit**: YES
  - Message: `refactor: consolidate email + notifications + dashboard into service-engagement`
  - Files: `services/service-engagement/**`, removed `services/service-email/`, `services/service-notifications/`, `services/service-dashboard/`
  - Pre-commit: `bun run build && bun test`

---

- [x] 3. Consolider service-clients (fusion avec referentiel)

  **What to do**:
  - Migrer tous les modules de service-referentiel vers service-clients
  - Éliminer la duplication StatutClientService
  - Fusionner clients_db avec referentiel_db
  - Mettre à jour les imports proto
  - Supprimer service-referentiel

  **Must NOT do**:
  - Ne pas changer l'API des services (mêmes méthodes gRPC)
  - Ne pas modifier la logique de StatutClient

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Fusion de services avec duplication à résoudre
  - **Skills**: [`git-master`]
    - `git-master`: Commits atomiques

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 2, 4)
  - **Blocks**: Tasks 8, 9
  - **Blocked By**: Task 1

  **References**:
  - `services/service-clients/src/` - Service principal à enrichir
  - `services/service-referentiel/src/` - Modules à migrer
  - `services/service-clients/src/modules/client-base/client-base.service.spec.ts` - Tests existants
  - `packages/proto/src/clients/` - Proto definitions

  **Acceptance Criteria**:
  - [ ] `services/service-referentiel/` supprimé
  - [ ] Modules referentiel dans `services/service-clients/src/modules/referentiel/`
  - [ ] Un seul StatutClientService (pas de duplication)
  - [ ] `bun run build` dans service-clients → SUCCESS
  - [ ] `bun test` dans service-clients → PASS

  **Agent-Executed QA Scenarios**:

  ```
  Scenario: service-clients build avec modules referentiel
    Tool: Bash
    Steps:
      1. cd services/service-clients
      2. bun run build
      3. Assert: Exit code 0
    Expected Result: Build réussit
    Evidence: Terminal output

  Scenario: Pas de duplication StatutClientService
    Tool: Bash
    Steps:
      1. grep -r "StatutClientService" services/service-clients/src --include="*.ts" | wc -l
      2. Assert: Count ≤ 2 (definition + export)
    Expected Result: Un seul StatutClientService
    Evidence: grep output

  Scenario: service-referentiel supprimé
    Tool: Bash
    Steps:
      1. test -d services/service-referentiel && echo "EXISTS" || echo "DELETED"
      2. Assert: output is "DELETED"
    Expected Result: Service supprimé
    Evidence: test output
  ```

  **Commit**: YES
  - Message: `refactor: consolidate referentiel into service-clients, eliminate duplicate StatutClientService`
  - Files: `services/service-clients/**`, removed `services/service-referentiel/`
  - Pre-commit: `bun run build && bun test`

---

- [x] 4. Corriger les erreurs de naming convention

  **What to do**:
  - Corriger toutes les erreurs camelCase → snake_case détectées
  - Fichiers concernés identifiés par LSP:
    - `service-contrats/src/modules/orchestration/payment-client.service.ts`
    - `service-notifications/src/modules/events/invoice-created.handler.ts`
    - `service-relance/src/modules/events/invoice-created.handler.ts`
  - Utiliser les noms corrects des propriétés proto (snake_case)

  **Must NOT do**:
  - Ne pas modifier les fichiers proto (source de vérité)
  - Ne pas changer la logique, seulement les noms de propriétés

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Corrections mécaniques, pattern clair
  - **Skills**: [`git-master`]
    - `git-master`: Commit atomique des fixes

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 2, 3)
  - **Blocks**: Task 8
  - **Blocked By**: Task 1

  **References**:
  - `services/service-contrats/src/modules/orchestration/payment-client.service.ts:57-136` - mandateId → mandate_id, redirectUrl → redirect_url, societeId → societe_id
  - `services/service-notifications/src/modules/events/invoice-created.handler.ts:31-55` - eventId → event_id, invoiceId → invoice_id, clientId → client_id
  - `services/service-relance/src/modules/events/invoice-created.handler.ts:27-54` - eventId → event_id, dateEcheance → date_echeance, invoiceId → invoice_id
  - `docs/CONTRACT_DRIVEN_ARCHITECTURE.md` - Règles de naming

  **Acceptance Criteria**:
  - [ ] `tsc --noEmit` dans service-contrats → 0 errors
  - [ ] `tsc --noEmit` dans service-notifications → 0 errors
  - [ ] `tsc --noEmit` dans service-relance → 0 errors
  - [ ] Tous les services buildent sans erreur TypeScript

  **Agent-Executed QA Scenarios**:

  ```
  Scenario: service-contrats sans erreurs TS
    Tool: Bash
    Steps:
      1. cd services/service-contrats
      2. npx tsc --noEmit
      3. Assert: Exit code 0
    Expected Result: Pas d'erreurs TypeScript
    Evidence: tsc output

  Scenario: service-notifications sans erreurs TS
    Tool: Bash
    Steps:
      1. cd services/service-notifications
      2. npx tsc --noEmit
      3. Assert: Exit code 0
    Expected Result: Pas d'erreurs TypeScript
    Evidence: tsc output

  Scenario: service-relance sans erreurs TS
    Tool: Bash
    Steps:
      1. cd services/service-relance
      2. npx tsc --noEmit
      3. Assert: Exit code 0
    Expected Result: Pas d'erreurs TypeScript
    Evidence: tsc output
  ```

  **Commit**: YES
  - Message: `fix: correct camelCase to snake_case naming in proto property access`
  - Files: `services/service-contrats/**`, `services/service-notifications/**`, `services/service-relance/**`
  - Pre-commit: `tsc --noEmit`

---

### Phase 2: Core Domains

- [x] 5. Créer service-identity (fusion users + organisations)

  **What to do**:
  - Créer `services/service-identity/`
  - Migrer tous les modules de service-users et service-organisations
  - Fusionner users_db et organisations_db → identity_db
  - Éliminer le gRPC call interne (users → organisations devient appel local)
  - Mettre à jour les imports proto
  - Supprimer les 2 anciens services

  **Must NOT do**:
  - Ne pas modifier les permissions/rôles existants
  - Ne pas changer la logique d'authentification

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Consolidation de 2 services avec dépendance gRPC à éliminer
  - **Skills**: [`git-master`]
    - `git-master`: Commits atomiques

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Task 6)
  - **Blocks**: Tasks 8, 9
  - **Blocked By**: Task 1

  **References**:
  - `services/service-users/src/` - Modules users à migrer
  - `services/service-organisations/src/` - Modules organisations à migrer
  - `services/service-users/src/modules/organisations-client/organisations-client.service.ts` - gRPC call à éliminer
  - `services/service-users/src/modules/utilisateur/utilisateur.service.spec.ts` - Tests existants
  - `services/service-organisations/src/modules/organisation/organisation.service.spec.ts` - Tests existants

  **Acceptance Criteria**:
  - [ ] `services/service-identity/` existe avec tous les modules
  - [ ] `services/service-users/`, `service-organisations/` supprimés
  - [ ] Pas de gRPC call OrganisationsClientService (appel local)
  - [ ] `bun run build` dans service-identity → SUCCESS
  - [ ] `bun test` dans service-identity → PASS
  - [ ] identity_db créée avec toutes les tables

  **Agent-Executed QA Scenarios**:

  ```
  Scenario: service-identity build réussit
    Tool: Bash
    Steps:
      1. cd services/service-identity
      2. bun install && bun run build
      3. Assert: Exit code 0
    Expected Result: Build sans erreurs
    Evidence: Terminal output

  Scenario: Pas de gRPC call interne
    Tool: Bash
    Steps:
      1. grep -r "OrganisationsClientService" services/service-identity/src --include="*.ts"
      2. Assert: No matches OR only local import
    Expected Result: Appel local, pas de gRPC client
    Evidence: grep output

  Scenario: Anciens services supprimés
    Tool: Bash
    Steps:
      1. ls services/ | grep -E "(service-users|service-organisations)"
      2. Assert: No output
    Expected Result: 2 anciens services supprimés
    Evidence: ls output
  ```

  **Commit**: YES
  - Message: `refactor: consolidate users + organisations into service-identity`
  - Files: `services/service-identity/**`, removed `services/service-users/`, `services/service-organisations/`
  - Pre-commit: `bun run build && bun test`

---

- [x] 6. Créer service-commercial (fusion commerciaux + commission)

  **What to do**:
  - Créer `services/service-commercial/`
  - Migrer tous les modules de service-commerciaux et service-commission
  - Fusionner commerciaux_db et commission_db → commercial_db
  - Mettre à jour les imports proto
  - Supprimer les 2 anciens services

  **Must NOT do**:
  - Ne pas modifier les calculs de commission existants
  - Ne pas changer les taux/barèmes

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Consolidation domaine métier ventes
  - **Skills**: [`git-master`]
    - `git-master`: Commits atomiques

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Task 5)
  - **Blocks**: Tasks 8, 9
  - **Blocked By**: Task 1

  **References**:
  - `services/service-commerciaux/src/` - Modules commerciaux à migrer
  - `services/service-commission/src/` - Modules commission à migrer
  - `packages/proto/src/commerciaux/` - Proto definitions

  **Acceptance Criteria**:
  - [ ] `services/service-commercial/` existe avec tous les modules
  - [ ] `services/service-commerciaux/`, `service-commission/` supprimés
  - [ ] `bun run build` dans service-commercial → SUCCESS
  - [ ] `bun test` dans service-commercial → PASS
  - [ ] commercial_db créée avec toutes les tables

  **Agent-Executed QA Scenarios**:

  ```
  Scenario: service-commercial build réussit
    Tool: Bash
    Steps:
      1. cd services/service-commercial
      2. bun install && bun run build
      3. Assert: Exit code 0
    Expected Result: Build sans erreurs
    Evidence: Terminal output

  Scenario: Anciens services supprimés
    Tool: Bash
    Steps:
      1. ls services/ | grep -E "(service-commerciaux|service-commission)"
      2. Assert: No output
    Expected Result: 2 anciens services supprimés
    Evidence: ls output
  ```

  **Commit**: YES
  - Message: `refactor: consolidate commerciaux + commission into service-commercial`
  - Files: `services/service-commercial/**`, removed `services/service-commerciaux/`, `services/service-commission/`
  - Pre-commit: `bun run build && bun test`

---

### Phase 3: Consolidation Complexe

- [x] 7. Étendre service-payments (fusion avec relance + retry)

  **What to do**:
  - Migrer tous les modules de service-relance et service-retry vers service-payments
  - Fusionner relance_db et retry_db dans payments_db
  - Éliminer le gRPC call interne (payments → retry devient appel local)
  - Conserver la séparation des modules pour clarté
  - Mettre à jour les imports proto
  - Supprimer les 2 anciens services

  **Must NOT do**:
  - Ne pas modifier la logique de retry AM04
  - Ne pas changer les règles de relance
  - Ne pas toucher à l'intégration Stripe/PayPal/GoCardless

  **Recommended Agent Profile**:
  - **Category**: `ultrabrain`
    - Reason: Service critique (paiements), consolidation complexe avec dépendances
  - **Skills**: [`git-master`]
    - `git-master`: Commits atomiques, rollback facile

  **Parallelization**:
  - **Can Run In Parallel**: NO (service critique, exécuter seul)
  - **Parallel Group**: Wave 3 (solo)
  - **Blocks**: Tasks 8, 9
  - **Blocked By**: Task 1

  **References**:
  - `services/service-payments/src/` - Service principal à étendre
  - `services/service-relance/src/` - Modules relance à migrer
  - `services/service-retry/src/` - Modules retry à migrer
  - `services/service-payments/src/modules/portal/__tests__/*.spec.ts` - Pattern tests existants
  - `services/service-payments/src/__tests__/golden/` - Golden tests (créés en Task 1)

  **Acceptance Criteria**:
  - [ ] `services/service-relance/`, `service-retry/` supprimés
  - [ ] Modules relance dans `services/service-payments/src/modules/relance/`
  - [ ] Modules retry dans `services/service-payments/src/modules/retry/`
  - [ ] Pas de gRPC call RetryClientService (appel local)
  - [ ] `bun run build` dans service-payments → SUCCESS
  - [ ] Golden tests passent toujours (`bun test --testPathPattern=golden`)
  - [ ] Tous les tests passent (`bun test`)

  **Agent-Executed QA Scenarios**:

  ```
  Scenario: Golden tests passent après consolidation
    Tool: Bash
    Preconditions: Golden tests créés en Task 1
    Steps:
      1. cd services/service-payments
      2. bun test --testPathPattern=golden
      3. Assert: Exit code 0
      4. Assert: stdout contains "passed"
    Expected Result: Pas de régression
    Evidence: Test output

  Scenario: service-payments build avec modules relance/retry
    Tool: Bash
    Steps:
      1. cd services/service-payments
      2. bun run build
      3. Assert: Exit code 0
      4. Assert: dist/modules/relance/ exists
      5. Assert: dist/modules/retry/ exists
    Expected Result: Build avec nouveaux modules
    Evidence: Terminal output + ls dist

  Scenario: Pas de gRPC call interne
    Tool: Bash
    Steps:
      1. grep -r "RetryClientService" services/service-payments/src --include="*.ts"
      2. Assert: No matches OR only internal module import
    Expected Result: Appel local
    Evidence: grep output

  Scenario: Anciens services supprimés
    Tool: Bash
    Steps:
      1. ls services/ | grep -E "(service-relance|service-retry)"
      2. Assert: No output
    Expected Result: Services supprimés
    Evidence: ls output
  ```

  **Commit**: YES
  - Message: `refactor: extend service-payments with relance and retry modules`
  - Files: `services/service-payments/**`, removed `services/service-relance/`, `services/service-retry/`
  - Pre-commit: `bun test --testPathPattern=golden && bun run build`

---

### Phase 4: Finalisation

- [x] 8. Consolider les définitions Proto

  **What to do**:
  - Réorganiser les fichiers `.proto` dans `packages/proto/` pour refléter les 12 services
  - Les protos sont gérés via Buf (`buf.yaml`, `buf.gen.yaml`)
  - Créer les nouveaux fichiers proto (engagement.proto, identity.proto, commercial.proto)
  - Régénérer les types TypeScript via `bun run build` (génère dans `gen/ts/`)
  - Supprimer/réorganiser les anciens fichiers proto des services supprimés

  **Must NOT do**:
  - Ne pas modifier les messages proto existants
  - Ne pas changer les signatures RPC

  **Recommended Agent Profile**:
  - **Category**: `unspecified-low`
    - Reason: Réorganisation de fichiers, pas de logique complexe
  - **Skills**: [`git-master`]
    - `git-master`: Commit atomique

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4 (with Task 9)
  - **Blocks**: Task 10
  - **Blocked By**: Tasks 2-7

  **References**:
  - `packages/proto/buf.yaml` - Configuration Buf pour les protos
  - `packages/proto/buf.gen.yaml` - Configuration génération TypeScript
  - `packages/proto/gen/ts/` - Fichiers TypeScript générés (NE PAS ÉDITER)
  - `packages/proto/package.json` - Scripts de génération (champ `exports`)
  - `docs/CONTRACT_DRIVEN_ARCHITECTURE.md` - Règles de structure proto

  **Acceptance Criteria**:
  - [ ] Nouveaux fichiers proto créés pour engagement, identity, commercial
  - [ ] Anciens fichiers proto réorganisés (email, notifications, dashboard, users, organisations, etc.)
  - [ ] `bun run build` dans packages/proto → SUCCESS (régénère `gen/ts/`)
  - [ ] Tous les services buildent avec les nouveaux protos

  **Agent-Executed QA Scenarios**:

  ```
  Scenario: Proto package build
    Tool: Bash
    Steps:
      1. cd packages/proto
      2. bun run build
      3. Assert: Exit code 0
    Expected Result: Proto génération réussie
    Evidence: Terminal output

  Scenario: Tous les services buildent
    Tool: Bash
    Steps:
      1. for dir in services/service-*/; do (cd "$dir" && bun run build) || exit 1; done
      2. Assert: Exit code 0
    Expected Result: Tous les builds réussissent
    Evidence: Terminal output
  ```

  **Commit**: YES
  - Message: `refactor(proto): reorganize proto definitions for 12-service architecture`
  - Files: `packages/proto/**`
  - Pre-commit: `bun run build`

---

- [x] 9. Mettre à jour Docker Compose (fichiers per-service)

  **What to do**:
  - La stack utilise des fichiers séparés par service: `compose/dev/service-*.yml`
  - Supprimer les fichiers des services supprimés:
    - `compose/dev/service-email.yml`
    - `compose/dev/service-notifications.yml`
    - `compose/dev/service-dashboard.yml`
    - `compose/dev/service-users.yml`
    - `compose/dev/service-organisations.yml`
    - `compose/dev/service-referentiel.yml`
    - `compose/dev/service-commerciaux.yml`
    - `compose/dev/service-commission.yml`
    - `compose/dev/service-relance.yml`
    - `compose/dev/service-retry.yml`
  - Créer les nouveaux fichiers:
    - `compose/dev/service-engagement.yml`
    - `compose/dev/service-identity.yml`
    - `compose/dev/service-commercial.yml`
  - Mettre à jour `compose/dev/infrastructure.yml` pour les nouvelles DBs
  - Mettre à jour `make/dev.mk` si nécessaire pour l'orchestration

  **Must NOT do**:
  - Ne pas modifier les configs des services inchangés
  - Ne pas changer les ports existants (si possible)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Modification de config, pas de code
  - **Skills**: [`git-master`]
    - `git-master`: Commit atomique

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4 (with Task 8)
  - **Blocks**: Task 10
  - **Blocked By**: Tasks 2-7

  **References**:
  - `compose/dev/infrastructure.yml` - Infrastructure (DBs, NATS, etc.)
  - `compose/dev/service-payments.yml` - Exemple de config service
  - `compose/dev/service-clients.yml` - Exemple de config service
  - `make/dev.mk` - Makefile pour orchestration dev

  **Acceptance Criteria**:
  - [ ] 12 fichiers `service-*.yml` dans `compose/dev/` (pas 19)
  - [ ] Nouvelles DBs configurées dans `infrastructure.yml` (engagement_db, identity_db, commercial_db)
  - [ ] Fichiers des anciens services supprimés
  - [ ] Stack démarre sans erreur

  **Agent-Executed QA Scenarios**:

  ```
  Scenario: Nombre correct de fichiers service
    Tool: Bash
    Steps:
      1. ls compose/dev/service-*.yml | wc -l
      2. Assert: Count = 12
    Expected Result: 12 fichiers service
    Evidence: ls output

  Scenario: Anciens fichiers supprimés
    Tool: Bash
    Steps:
      1. ls compose/dev/ | grep -E "(service-email|service-notifications|service-dashboard|service-users|service-organisations|service-referentiel|service-commerciaux|service-commission|service-relance|service-retry).yml" || echo "CLEAN"
      2. Assert: output is "CLEAN"
    Expected Result: Anciens fichiers absents
    Evidence: ls output

  Scenario: Nouveaux fichiers créés
    Tool: Bash
    Steps:
      1. test -f compose/dev/service-engagement.yml && echo "OK"
      2. test -f compose/dev/service-identity.yml && echo "OK"
      3. test -f compose/dev/service-commercial.yml && echo "OK"
      4. Assert: 3x "OK"
    Expected Result: Nouveaux fichiers présents
    Evidence: test output
  ```

  **Commit**: YES
  - Message: `chore(docker): update compose files for 12-service architecture`
  - Files: `compose/dev/**`, `make/dev.mk`
  - Pre-commit: `ls compose/dev/service-*.yml | wc -l` (should be 12)

---

- [x] 10. Documentation et Cleanup Final

  **What to do**:
  - Créer `README.md` à la racine avec la nouvelle architecture (n'existe pas actuellement)
  - Créer README.md pour chaque nouveau service (engagement, identity, commercial)
  - Mettre à jour `docs/CONTRACT_DRIVEN_ARCHITECTURE.md` avec les nouveaux services
  - Mettre à jour `docs/MIGRATION_GUIDE.md` si existant
  - Supprimer les fichiers orphelins
  - Vérifier qu'aucune référence aux anciens services ne reste

  **Must NOT do**:
  - Ne pas sur-documenter (garder concis)

  **Recommended Agent Profile**:
  - **Category**: `writing`
    - Reason: Documentation technique
  - **Skills**: [`git-master`]
    - `git-master`: Commit final

  **Parallelization**:
  - **Can Run In Parallel**: NO (final)
  - **Parallel Group**: Wave 4 (final, after 8-9)
  - **Blocks**: None (final task)
  - **Blocked By**: Tasks 8, 9

  **References**:
  - `docs/CONTRACT_DRIVEN_ARCHITECTURE.md` - Architecture doc (existe)
  - `docs/MIGRATION_GUIDE.md` - Guide migration (existe)
  - `docs/IMPROVEMENTS_SUMMARY.md` - Résumé améliorations (existe)
  - `services/service-factures/README.md` - Exemple de README service (100+ lignes)

  **Acceptance Criteria**:
  - [ ] `README.md` créé à la racine avec liste des 12 services
  - [ ] Chaque nouveau service a un README.md (engagement, identity, commercial)
  - [ ] `docs/CONTRACT_DRIVEN_ARCHITECTURE.md` mis à jour
  - [ ] Pas de référence aux anciens services dans la doc
  - [ ] `grep -r "service-email\|service-notifications\|service-dashboard\|service-users\|service-organisations\|service-referentiel\|service-commerciaux\|service-commission\|service-relance\|service-retry" docs/` → aucun résultat

  **Agent-Executed QA Scenarios**:

  ```
  Scenario: Pas de référence aux anciens services
    Tool: Bash
    Steps:
      1. grep -r "service-email\|service-notifications\|service-dashboard" docs/ README.md || echo "CLEAN"
      2. Assert: output is "CLEAN"
    Expected Result: Aucune référence obsolète
    Evidence: grep output

  Scenario: Nouveaux READMEs existent
    Tool: Bash
    Steps:
      1. test -f services/service-engagement/README.md && echo "OK"
      2. test -f services/service-identity/README.md && echo "OK"
      3. test -f services/service-commercial/README.md && echo "OK"
      4. Assert: 3x "OK"
    Expected Result: READMEs présents
    Evidence: test output
  ```

  **Commit**: YES
  - Message: `docs: update documentation for 12-service architecture`
  - Files: `README.md`, `docs/**`, `services/*/README.md`
  - Pre-commit: None

---

## Commit Strategy

| After Task | Message | Files | Verification |
|------------|---------|-------|--------------|
| 1 | `test(payments,factures): add golden regression tests` | `services/service-*/src/__tests__/golden/` | `bun test` |
| 2 | `refactor: consolidate into service-engagement` | `services/service-engagement/`, removed 3 | `bun run build && bun test` |
| 3 | `refactor: consolidate referentiel into service-clients` | `services/service-clients/`, removed 1 | `bun run build && bun test` |
| 4 | `fix: correct naming conventions (camelCase → snake_case)` | 3 service files | `tsc --noEmit` |
| 5 | `refactor: consolidate into service-identity` | `services/service-identity/`, removed 2 | `bun run build && bun test` |
| 6 | `refactor: consolidate into service-commercial` | `services/service-commercial/`, removed 2 | `bun run build && bun test` |
| 7 | `refactor: extend service-payments with relance/retry` | `services/service-payments/`, removed 2 | `bun test --testPathPattern=golden` |
| 8 | `refactor(proto): reorganize for 12-service architecture` | `packages/proto/` | `bun run build` |
| 9 | `chore(docker): update compose for 12 services` | `compose/dev/` | `docker compose config` |
| 10 | `docs: update for 12-service architecture` | `docs/`, `README.md` | None |

---

## Success Criteria

### Verification Commands
```bash
# Compter les services (doit être 12)
ls -d services/service-*/ | wc -l  # Expected: 12

# Compter les fichiers compose (doit être 12)
ls compose/dev/service-*.yml | wc -l  # Expected: 12

# Tous les builds passent
for dir in services/service-*/; do (cd "$dir" && bun run build) || exit 1; done

# Tous les tests passent
for dir in services/service-*/; do (cd "$dir" && bun test) || exit 1; done

# Pas de référence aux anciens services
grep -r "service-email\|service-notifications\|service-dashboard\|service-users\|service-organisations\|service-referentiel\|service-commerciaux\|service-commission\|service-relance\|service-retry" services/ --include="*.ts" | grep -v node_modules | wc -l  # Expected: 0
```

### Final Checklist
- [x] 12 services dans `services/` (pas 19)
- [x] 12 fichiers `service-*.yml` dans `compose/dev/`
- [x] Tous les builds passent
- [x] Tous les tests passent (y compris golden tests)
- [x] Aucune erreur TypeScript (naming conventions fixées)
- [x] Documentation à jour (README.md créé, docs/ mis à jour)
- [x] Pas de référence aux anciens services
