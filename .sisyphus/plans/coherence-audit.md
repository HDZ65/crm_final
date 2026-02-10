# Audit de Cohérence Inter-Services — Post-Consolidation

## TL;DR

> **Quick Summary**: Audit complet (P0+P1+P2) des 5 microservices NestJS consolidés pour corriger toutes les incohérences architecturales introduites lors de la consolidation 19→5 services. Standardisation sur les patterns de service-core/commercial comme références.
> 
> **Deliverables**:
> - 5 services avec configuration TypeORM cohérente (datasource, migrations, pool)
> - NatsModule wired dans les 5 services + handlers fonctionnels
> - GrpcExceptionFilter enregistré partout
> - Error handling standardisé (RpcException) dans tous les controllers gRPC
> - Event naming convention documentée
> - Jest, package.json, entity loading harmonisés
> - Tests unitaires pour les patterns standardisés
> 
> **Estimated Effort**: Large (~10-12h)
> **Parallel Execution**: YES - 4 waves
> **Critical Path**: Task 1 → Task 3 → Task 4 → Task 5 → Task 7 → Task 15

---

## Context

### Original Request
Planifier un audit de cohérence entre les 5 microservices consolidés du CRM.

### Interview Summary
**Key Discussions**:
- Périmètre: P0+P1+P2 complet
- DTOs: Rester proto-first (pas de class-validator DTOs)
- NATS: Fix plumbing + implémenter les handlers TODO avec business logic réelle
- Tests: Après corrections (pas TDD)
- Application layer: Laisser vide (proto-first)

**Research Findings**:
- Audit précédent (2 fév 2026) sur 19 services pré-consolidation
- shared-kernel fournit: DomainException, GrpcExceptionFilter, AuthInterceptor, NatsModule
- 113 `RpcException` throws existants dans les controllers
- service-engagement a NatsModule mal configuré (bare import dans submodule, pas de forRootAsync)
- service-finance a `migrationsRun: false` et pas de datasource.ts
- Timestamps de migration dupliqués dans service-commercial

### Metis Review
**Identified Gaps** (addressed):
- Engagement NatsModule: mal configuré (pas juste "absent") — bare import dans submodule sans forRootAsync
- DepanssurEventsHandler dans engagement: non enregistré dans providers
- Duplicate migration timestamp 1770510000000 dans commercial
- prebuild runner incohérent (bun vs npm)
- Finance pool max:20 potentiellement intentionnel (6 PSP webhooks parallèles)
- ConfigModule.forRoot envFilePath absent dans service-core

---

## Work Objectives

### Core Objective
Harmoniser les 5 services consolidés pour qu'ils suivent des patterns identiques, éliminant les bugs runtime (P0), les incohérences de maintenance (P1) et les différences cosmétiques (P2).

### Concrete Deliverables
- `services/service-finance/src/datasource.ts` créé
- `migrationsRun: true` + `migrations` path dans les 5 services
- `NatsModule.forRootAsync()` dans les 5 `app.module.ts`
- `GrpcExceptionFilter` enregistré comme `APP_FILTER` dans les 5 services
- Controllers gRPC standardisés sur `RpcException` avec status codes
- NATS handlers avec business logic décommentés et fonctionnels
- Convention de nommage NATS documentée
- Jest/package.json/entity loading harmonisés

### Definition of Done
- [ ] `bun run build` réussit pour les 5 services
- [ ] Zéro `throw new Error()` dans les controllers gRPC (hors PSP services)
- [ ] `grep -r "APP_FILTER" services/*/src/app.module.ts` retourne 5 lignes
- [ ] `grep -r "NatsModule.forRootAsync" services/*/src/app.module.ts` retourne 5 lignes
- [ ] `grep -r "migrationsRun: true" services/*/src/app.module.ts` retourne 5 lignes
- [ ] Tests existants passent toujours

### Must Have
- Datasource.ts dans service-finance
- NatsModule wired dans engagement et finance
- GrpcExceptionFilter dans les 5 services
- Error handling standardisé dans les controllers gRPC
- Build success pour les 5 services

### Must NOT Have (Guardrails)
- **NE PAS toucher le code PSP** dans service-finance (Stripe, PayPal, GoCardless, Slimpay, MultiSafepay, Emerchantpay)
- **NE PAS décommenter** les subscribeProto dans les handlers avec TODO stubs sans business logic
- **NE PAS refactorer** les 113 RpcException existants — ils passent à travers le filter
- **NE PAS changer** les messages d'erreur existants — seulement le type d'exception
- **NE PAS toucher** le WebSocket NotificationGateway de engagement
- **NE PAS ajouter** de DTOs class-validator (proto-first confirmé)
- **NE PAS créer** de nouveaux tests pendant les corrections (phase séparée)

---

## Verification Strategy (MANDATORY)

> **UNIVERSAL RULE: ZERO HUMAN INTERVENTION**
>
> ALL tasks in this plan MUST be verifiable WITHOUT any human action.

### Test Decision
- **Infrastructure exists**: YES (Jest dans tous les package.json)
- **Automated tests**: YES (tests-after)
- **Framework**: Jest + ts-jest

### Agent-Executed QA Scenarios (MANDATORY — ALL tasks)

> Every task includes build verification for ALL 5 services.
> Tool: Bash (bun run build)

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Start Immediately) — P0 Prerequisites:
├── Task 1: Fix duplicate migration timestamp in commercial
├── Task 2: Add datasource.ts to service-finance
└── Task 10: Standardize package.json descriptions (P2, no deps)

Wave 2 (After Wave 1) — P0 Runtime Fixes:
├── Task 3: Fix migrationsRun + migrations path (depends: 1, 2)
├── Task 4: Wire NatsModule in engagement + finance (depends: none, but logically after 3)
├── Task 5: Register DepanssurEventsHandler in engagement (depends: 4)
└── Task 6: Register GrpcExceptionFilter in all 5 services (depends: none)

Wave 3 (After Wave 2) — P1 Consistency:
├── Task 7: Standardize error handling in controllers (depends: 6)
├── Task 8: NATS handler plumbing — uncomment real handlers (depends: 4, 5)
├── Task 9: Standardize NATS event naming (depends: 8)
├── Task 11: Normalize entity loading pattern (P2, depends: 3)
└── Task 12: Standardize Jest config (P2, no deps)

Wave 4 (After Wave 3) — Verification + Tests:
├── Task 13: Fix prebuild runner inconsistency (P2)
├── Task 14: Full build + lint verification across 5 services
└── Task 15: Add tests for standardized patterns

Critical Path: Task 1 → Task 3 → Task 4 → Task 5 → Task 8 → Task 14
Parallel Speedup: ~40% faster than sequential
```

### Dependency Matrix

| Task | Depends On | Blocks | Can Parallelize With |
|------|-----------|--------|---------------------|
| 1 | None | 3 | 2, 10 |
| 2 | None | 3 | 1, 10 |
| 3 | 1, 2 | 4, 11 | 6 |
| 4 | 3 | 5, 8 | 6 |
| 5 | 4 | 8 | 6, 7 |
| 6 | None | 7 | 3, 4, 5 |
| 7 | 6 | 14 | 8, 9, 11, 12 |
| 8 | 4, 5 | 9 | 7, 11, 12 |
| 9 | 8 | 14 | 7, 11, 12 |
| 10 | None | None | 1, 2 |
| 11 | 3 | 14 | 7, 8, 9, 12 |
| 12 | None | 14 | 7, 8, 9, 11 |
| 13 | None | 14 | 7, 8, 9, 11, 12 |
| 14 | 7, 9, 11, 12, 13 | 15 | None |
| 15 | 14 | None | None |

### Agent Dispatch Summary

| Wave | Tasks | Recommended Agents |
|------|-------|-------------------|
| 1 | 1, 2, 10 | 3x task(category="quick") parallel |
| 2 | 3, 4, 5, 6 | 4x task(category="quick") semi-parallel |
| 3 | 7, 8, 9, 11, 12 | task(category="unspecified-high") for 7/8, quick for rest |
| 4 | 13, 14, 15 | quick for 13, unspecified-high for 14/15 |

---

## TODOs

- [x] 1. Fix duplicate migration timestamp in service-commercial

  **What to do**:
  - Identifier les deux fichiers de migration avec timestamp `1770510000000` dans `services/service-commercial/src/migrations/`
  - Renommer UN des deux pour avoir un timestamp unique (incrémenter de 1 : `1770510000001`)
  - S'assurer que l'ordre d'exécution est correct (vérifier les dépendances entre les deux migrations)

  **Must NOT do**:
  - NE PAS modifier le contenu des migrations (SQL)
  - NE PAS toucher aux autres migrations

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Single file rename, trivial change
  - **Skills**: []
    - No special skills needed

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 2, 10)
  - **Blocks**: Task 3
  - **Blocked By**: None

  **References**:
  - `services/service-commercial/src/migrations/` — Lister les fichiers, trouver les doublons timestamp `1770510000000`
  - Pattern de nommage: `{timestamp}-{ClassName}.ts`

  **Acceptance Criteria**:
  - [ ] `ls services/service-commercial/src/migrations/ | sed 's/-.*//' | sort | uniq -d` → vide (pas de doublons)
  - [ ] `bun run build` dans service-commercial → SUCCESS

  **Agent-Executed QA Scenarios**:
  ```
  Scenario: No duplicate migration timestamps
    Tool: Bash
    Preconditions: None
    Steps:
      1. ls services/service-commercial/src/migrations/
      2. Extract timestamps (prefix before first dash)
      3. Assert: no duplicate timestamps
    Expected Result: All timestamps unique
    Evidence: Terminal output captured
  
  Scenario: Service builds successfully
    Tool: Bash
    Preconditions: None
    Steps:
      1. cd services/service-commercial && bun run build
      2. Assert: exit code 0
    Expected Result: Build succeeds
    Evidence: Build output captured
  ```

  **Commit**: YES
  - Message: `fix(commercial): resolve duplicate migration timestamp 1770510000000`
  - Files: `services/service-commercial/src/migrations/{renamed-file}.ts`
  - Pre-commit: `cd services/service-commercial && bun run build`

---

- [x] 2. Add datasource.ts to service-finance

  **What to do**:
  - Copier le pattern de `services/service-core/src/datasource.ts`
  - Adapter pour finance: database name `finance_db`, entities/migrations paths
  - S'assurer que les imports d'entités correspondent aux entités réelles de service-finance
  - Vérifier que le script `migration:*` dans package.json pointe vers ce datasource

  **Must NOT do**:
  - NE PAS modifier la configuration TypeORM dans app.module.ts (sera fait dans Task 3)
  - NE PAS changer les scripts de migration dans package.json (ils pointent déjà vers `src/datasource.ts`)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Copy + adapt a single file from known template
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 10)
  - **Blocks**: Task 3
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `services/service-core/src/datasource.ts` — Template à copier et adapter
  - `services/service-commercial/src/datasource.ts` — Autre exemple de référence

  **API/Type References**:
  - `services/service-finance/src/domain/` — Lister TOUTES les entités à inclure
  - `services/service-finance/src/migrations/` — Chemin des migrations

  **Documentation References**:
  - `services/service-finance/CLAUDE.md` — Database: `finance_db`, Snake Case naming

  **Acceptance Criteria**:
  - [ ] Fichier `services/service-finance/src/datasource.ts` existe
  - [ ] Contient `new DataSource({...})` avec `database: 'finance_db'`
  - [ ] Contient `SnakeNamingStrategy`
  - [ ] `bun run build` dans service-finance → SUCCESS

  **Agent-Executed QA Scenarios**:
  ```
  Scenario: datasource.ts exists and is valid
    Tool: Bash
    Preconditions: None
    Steps:
      1. cat services/service-finance/src/datasource.ts
      2. Assert: contains "new DataSource"
      3. Assert: contains "finance_db"
      4. Assert: contains "SnakeNamingStrategy"
    Expected Result: File exists with correct configuration
    Evidence: File content captured

  Scenario: Migration CLI works
    Tool: Bash
    Preconditions: datasource.ts created
    Steps:
      1. cd services/service-finance
      2. npx ts-node -r tsconfig-paths/register ./node_modules/typeorm/cli.js -d src/datasource.ts migration:show 2>&1
      3. Assert: no "Cannot find module" errors
    Expected Result: CLI can load datasource
    Evidence: Terminal output captured
  ```

  **Commit**: YES
  - Message: `fix(finance): add missing datasource.ts for TypeORM CLI support`
  - Files: `services/service-finance/src/datasource.ts`
  - Pre-commit: `cd services/service-finance && bun run build`

---

- [x] 3. Standardize migrationsRun and migrations path across all services

  **What to do**:
  - Vérifier que les 5 `app.module.ts` ont `migrationsRun: true` dans la config TypeORM
  - Vérifier que les 5 ont `migrations: [__dirname + '/migrations/*{.ts,.js}']`
  - Corriger service-finance: `migrationsRun: false` → `true`
  - Corriger service-engagement: ajouter `migrationsRun: true` + `migrations` path (actuellement absent)
  - Vérifier service-core, service-commercial, service-logistics (devraient être OK)

  **Must NOT do**:
  - NE PAS modifier les migrations existantes
  - NE PAS changer `synchronize` (doit rester `false` en production)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Small config edits across 2-3 files
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 2 (sequential after Wave 1)
  - **Blocks**: Tasks 4, 11
  - **Blocked By**: Tasks 1, 2

  **References**:
  - `services/service-core/src/app.module.ts:24-40` — TypeORM config de référence avec migrationsRun: true
  - `services/service-finance/src/app.module.ts` — À corriger (migrationsRun: false)
  - `services/service-engagement/src/app.module.ts` — À corriger (migrationsRun absent)

  **Acceptance Criteria**:
  - [ ] `grep -r "migrationsRun: true" services/*/src/app.module.ts` → 5 résultats
  - [ ] `grep -r "migrations:" services/*/src/app.module.ts` → 5 résultats avec path vers migrations/
  - [ ] `bun run build` pour les 5 services → SUCCESS

  **Agent-Executed QA Scenarios**:
  ```
  Scenario: All services have migrationsRun: true
    Tool: Bash
    Preconditions: None
    Steps:
      1. grep -n "migrationsRun" services/service-core/src/app.module.ts → contains "true"
      2. grep -n "migrationsRun" services/service-commercial/src/app.module.ts → contains "true"
      3. grep -n "migrationsRun" services/service-finance/src/app.module.ts → contains "true"
      4. grep -n "migrationsRun" services/service-engagement/src/app.module.ts → contains "true"
      5. grep -n "migrationsRun" services/service-logistics/src/app.module.ts → contains "true"
    Expected Result: All 5 show migrationsRun: true
    Evidence: grep output captured
  ```

  **Commit**: YES
  - Message: `fix(services): standardize migrationsRun: true across all services`
  - Files: `services/service-finance/src/app.module.ts`, `services/service-engagement/src/app.module.ts`
  - Pre-commit: `bun run build` in each modified service

---

- [x] 4. Wire NatsModule.forRootAsync() in service-engagement and service-finance

  **What to do**:
  - **service-engagement**: 
    - Ajouter `NatsModule.forRootAsync()` dans `app.module.ts` imports (copier pattern de service-core)
    - Retirer le bare `NatsModule` import de `engagement.module.ts:97` (devenu redondant car @Global)
  - **service-finance**: 
    - Ajouter `NatsModule.forRootAsync()` dans `app.module.ts` imports
  - Vérifier que `@crm/shared-kernel` exporte NatsModule correctement
  - S'assurer que les variables d'env NATS_URL sont documentées

  **Must NOT do**:
  - NE PAS décommenter les subscribeProto des handlers TODO stubs
  - NE PAS modifier les handlers existants
  - NE PAS toucher le WebSocket NotificationGateway de engagement

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Import and config addition in 2-3 files
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO (logically after Task 3)
  - **Parallel Group**: Wave 2 (with Task 6)
  - **Blocks**: Tasks 5, 8
  - **Blocked By**: Task 3

  **References**:

  **Pattern References**:
  - `services/service-core/src/app.module.ts:24-31` — NatsModule.forRootAsync() wiring de référence
  - `services/service-commercial/src/app.module.ts` — Autre exemple de NatsModule wiring
  - `packages/shared-kernel/src/infrastructure/nats/nats.module.ts` — NatsModule source (@Global decorator)

  **API/Type References**:
  - `services/service-engagement/src/engagement.module.ts:97` — bare NatsModule import à retirer
  - `services/service-engagement/src/app.module.ts` — Ajouter NatsModule.forRootAsync()
  - `services/service-finance/src/app.module.ts` — Ajouter NatsModule.forRootAsync()

  **WHY Each Reference Matters**:
  - service-core app.module: c'est le pattern exact à reproduire (forRootAsync avec ConfigService)
  - engagement.module.ts:97: le bare NatsModule import DOIT être retiré sinon double registration

  **Acceptance Criteria**:
  - [ ] `grep "NatsModule.forRootAsync" services/service-engagement/src/app.module.ts` → trouvé
  - [ ] `grep "NatsModule.forRootAsync" services/service-finance/src/app.module.ts` → trouvé
  - [ ] `grep "NatsModule" services/service-engagement/src/engagement.module.ts` → PAS trouvé (bare import retiré)
  - [ ] `bun run build` service-engagement → SUCCESS
  - [ ] `bun run build` service-finance → SUCCESS

  **Agent-Executed QA Scenarios**:
  ```
  Scenario: NatsModule correctly wired in engagement
    Tool: Bash
    Preconditions: None
    Steps:
      1. grep -c "NatsModule.forRootAsync" services/service-engagement/src/app.module.ts → 1
      2. grep -c "NatsModule" services/service-engagement/src/engagement.module.ts → 0 (removed)
      3. cd services/service-engagement && bun run build → exit code 0
    Expected Result: NatsModule wired at root, removed from submodule
    Evidence: grep + build output

  Scenario: NatsModule correctly wired in finance
    Tool: Bash
    Preconditions: None
    Steps:
      1. grep -c "NatsModule.forRootAsync" services/service-finance/src/app.module.ts → 1
      2. cd services/service-finance && bun run build → exit code 0
    Expected Result: NatsModule wired at root
    Evidence: grep + build output
  ```

  **Commit**: YES
  - Message: `fix(engagement,finance): wire NatsModule.forRootAsync for event support`
  - Files: `services/service-engagement/src/app.module.ts`, `services/service-engagement/src/engagement.module.ts`, `services/service-finance/src/app.module.ts`
  - Pre-commit: `bun run build` in both services

---

- [x] 5. Register DepanssurEventsHandler in service-engagement module providers

  **What to do**:
  - Ajouter `DepanssurEventsHandler` aux providers de `engagement.module.ts`
  - Vérifier que le handler importe correctement NatsService (maintenant disponible grâce à Task 4)
  - Vérifier que les subscribe() calls dans le handler pointent vers des topics NATS valides

  **Must NOT do**:
  - NE PAS modifier le code du handler
  - NE PAS ajouter d'autres handlers non-enregistrés

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Add one provider to a module
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 2 (after Task 4)
  - **Blocks**: Task 8
  - **Blocked By**: Task 4

  **References**:
  - `services/service-engagement/src/engagement.module.ts` — Module providers array
  - `services/service-engagement/src/infrastructure/messaging/nats/handlers/depanssur-events.handler.ts` — Handler à enregistrer
  - `services/service-commercial/src/commercial.module.ts` — Exemple de handler enregistré dans providers

  **Acceptance Criteria**:
  - [ ] `grep "DepanssurEventsHandler" services/service-engagement/src/engagement.module.ts` → trouvé dans providers
  - [ ] `bun run build` service-engagement → SUCCESS

  **Agent-Executed QA Scenarios**:
  ```
  Scenario: Handler registered and service builds
    Tool: Bash
    Steps:
      1. grep -A2 "DepanssurEventsHandler" services/service-engagement/src/engagement.module.ts
      2. Assert: found in providers array
      3. cd services/service-engagement && bun run build → exit code 0
    Expected Result: Handler registered, build passes
    Evidence: grep + build output
  ```

  **Commit**: YES (groups with Task 4)
  - Message: `fix(engagement): register DepanssurEventsHandler in module providers`
  - Files: `services/service-engagement/src/engagement.module.ts`
  - Pre-commit: `cd services/service-engagement && bun run build`

---

- [x] 6. Register GrpcExceptionFilter as APP_FILTER in all 5 services

  **What to do**:
  - Dans chaque `app.module.ts`, ajouter dans providers:
    ```typescript
    { provide: APP_FILTER, useClass: GrpcExceptionFilter }
    ```
  - Importer `APP_FILTER` de `@nestjs/core` et `GrpcExceptionFilter` de `@crm/shared-kernel`
  - Vérifier que les 5 services importent déjà `@crm/shared-kernel` (oui, confirmé)

  **Must NOT do**:
  - NE PAS refactorer les 113 RpcException throws existants
  - NE PAS modifier GrpcExceptionFilter lui-même
  - NE PAS changer le comportement existant des controllers

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Same small edit in 5 files
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 3, 4, 5)
  - **Parallel Group**: Wave 2
  - **Blocks**: Task 7
  - **Blocked By**: None

  **References**:
  - `packages/shared-kernel/src/infrastructure/filters/grpc-exception.filter.ts` — Le filter à enregistrer
  - `packages/shared-kernel/src/exceptions/domain.exception.ts` — Hiérarchie d'exceptions mappées
  - `services/service-core/src/app.module.ts` — APP_INTERCEPTOR déjà enregistré (même pattern pour APP_FILTER)

  **Acceptance Criteria**:
  - [ ] `grep "APP_FILTER" services/service-core/src/app.module.ts` → trouvé
  - [ ] `grep "APP_FILTER" services/service-commercial/src/app.module.ts` → trouvé
  - [ ] `grep "APP_FILTER" services/service-finance/src/app.module.ts` → trouvé
  - [ ] `grep "APP_FILTER" services/service-engagement/src/app.module.ts` → trouvé
  - [ ] `grep "APP_FILTER" services/service-logistics/src/app.module.ts` → trouvé
  - [ ] `bun run build` pour les 5 services → SUCCESS

  **Agent-Executed QA Scenarios**:
  ```
  Scenario: GrpcExceptionFilter registered in all services
    Tool: Bash
    Steps:
      1. for svc in service-core service-commercial service-finance service-engagement service-logistics; do
           grep -l "APP_FILTER" services/$svc/src/app.module.ts && echo "$svc: OK"
         done
      2. Assert: 5 "OK" lines
      3. Build all 5 services
    Expected Result: All 5 have APP_FILTER, all build
    Evidence: grep + build output
  ```

  **Commit**: YES
  - Message: `fix(services): register GrpcExceptionFilter as APP_FILTER in all services`
  - Files: `services/*/src/app.module.ts` (5 files)
  - Pre-commit: `bun run build` in each service

---

- [x] 7. Standardize error handling in gRPC controllers

  **What to do**:
  - Scanner TOUS les controllers gRPC dans les 5 services pour `throw new Error()`
  - Remplacer par `throw new RpcException({ code: status.NOT_FOUND, message: '...' })` (ou code approprié)
  - Utiliser `ast_grep_search` pour trouver tous les patterns `throw new Error(` dans les dossiers controllers
  - NE corriger QUE dans les fichiers `*controller.ts` des dossiers `infrastructure/grpc/`
  - Ajouter `import { RpcException } from '@nestjs/microservices'` et `import { status } from '@grpc/grpc-js'` où manquant

  **Must NOT do**:
  - NE PAS toucher les service/repository files (seulement les controllers)
  - NE PAS toucher les PSP services de finance (Stripe, PayPal, etc.)
  - NE PAS changer les messages d'erreur existants (seulement le type d'exception)
  - NE PAS refactorer les RpcException existants

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Multi-file search and replace across many controllers, needs careful pattern matching
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 8, 9, 11, 12)
  - **Parallel Group**: Wave 3
  - **Blocks**: Task 14
  - **Blocked By**: Task 6

  **References**:
  - `services/service-core/src/infrastructure/grpc/users/utilisateur.controller.ts` — Pattern de référence (RpcException + status codes)
  - `services/service-engagement/src/infrastructure/grpc/activite.controller.ts` — Exemple à corriger (throw Error)
  - `services/service-logistics/src/infrastructure/grpc/colis.controller.ts` — Exemple à corriger (throw Error)
  - `services/service-finance/src/infrastructure/grpc/` — Controllers à corriger (certains throw Error, certains retournent null)

  **Acceptance Criteria**:
  - [ ] `ast_grep_search "throw new Error($MSG)" --lang typescript --paths services/*/src/infrastructure/grpc/` → 0 résultats dans controllers
  - [ ] Tous les controllers utilisent `RpcException` avec `status` codes
  - [ ] `bun run build` pour les 5 services → SUCCESS

  **Agent-Executed QA Scenarios**:
  ```
  Scenario: No generic Error throws in gRPC controllers
    Tool: Bash
    Steps:
      1. Use ast_grep_search for "throw new Error($MSG)" in controller files
      2. Assert: 0 matches
      3. Build all 5 services
    Expected Result: All controllers use RpcException
    Evidence: Search results + build output

  Scenario: Existing RpcException still work
    Tool: Bash
    Steps:
      1. grep -r "RpcException" services/*/src/infrastructure/grpc/ | wc -l
      2. Assert: count >= 113 (existing + new)
    Expected Result: RpcException usage increased or maintained
    Evidence: grep count
  ```

  **Commit**: YES
  - Message: `fix(services): standardize gRPC controller error handling to RpcException`
  - Files: All modified controller files
  - Pre-commit: `bun run build` in each modified service

---

- [ ] 8. Uncomment NATS handlers with real business logic in finance

  **What to do**:
  - Identifier les handlers NATS dans service-finance qui ont du code métier RÉEL (pas des TODO stubs)
  - Décommenter les `subscribeProto` calls UNIQUEMENT pour les handlers avec logique implémentée:
    - `BundlePriceRecalculatedHandler` (appelle consolidatedBillingService)
    - `DepanssurPaymentSucceededHandler` (logique complète)
    - `DepanssurPaymentFailedHandler` (logique complète)
    - `DunningMaxRetriesExceededHandler` (logique complète)
  - Vérifier que les handlers sont enregistrés dans le module providers
  - NE PAS décommenter les handlers avec TODO stubs

  **Must NOT do**:
  - NE PAS décommenter les handlers sans logique métier
  - NE PAS modifier le code métier existant dans les handlers
  - NE PAS changer les topics NATS

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Careful analysis of which handlers have real logic vs stubs
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 7, 9, 11, 12)
  - **Parallel Group**: Wave 3
  - **Blocks**: Task 9
  - **Blocked By**: Tasks 4, 5

  **References**:
  - `services/service-finance/src/infrastructure/messaging/nats/handlers/` — Tous les handlers NATS
  - `services/service-commercial/src/infrastructure/messaging/nats/handlers/` — Référence de handlers correctement wired
  - `services/service-finance/src/payments.module.ts` — Module providers à vérifier

  **Acceptance Criteria**:
  - [ ] Les 4 handlers identifiés ont `subscribeProto` décommenté
  - [ ] Les handlers sont dans les providers du module approprié
  - [ ] `bun run build` service-finance → SUCCESS

  **Agent-Executed QA Scenarios**:
  ```
  Scenario: Finance handlers with real logic are active
    Tool: Bash
    Steps:
      1. Verify BundlePriceRecalculatedHandler has uncommented subscribeProto
      2. Verify DepanssurPaymentSucceededHandler has uncommented subscribeProto
      3. cd services/service-finance && bun run build → exit code 0
    Expected Result: Handlers active, build passes
    Evidence: File content + build output
  ```

  **Commit**: YES
  - Message: `feat(finance): activate NATS event handlers with implemented business logic`
  - Files: Handler files in service-finance
  - Pre-commit: `cd services/service-finance && bun run build`

---

- [ ] 9. Document NATS event naming convention

  **What to do**:
  - Analyser tous les topics NATS existants dans les 5 services
  - Créer une convention de nommage standard (recommandé: `<domain>.<entity>.<action>`)
  - Documenter dans un fichier `docs/conventions/nats-events.md` ou dans le shared-kernel README
  - Lister tous les événements existants avec leur topic actuel
  - NE PAS renommer les topics existants (breaking change)

  **Must NOT do**:
  - NE PAS renommer les topics existants
  - NE PAS créer de nouveaux events

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Documentation task, grep + write markdown
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 7, 11, 12)
  - **Parallel Group**: Wave 3
  - **Blocks**: Task 14
  - **Blocked By**: Task 8

  **References**:
  - `services/*/src/infrastructure/messaging/nats/handlers/` — Tous les handlers avec leurs topics
  - `packages/proto/src/events/` — Proto definitions des events

  **Acceptance Criteria**:
  - [ ] Document de convention créé avec: format standard, liste des events existants, guide pour nouveaux events
  - [ ] Build non impacté (pas de code change)

  **Commit**: YES
  - Message: `docs(conventions): document NATS event naming convention`
  - Files: `docs/conventions/nats-events.md`

---

- [x] 10. Standardize package.json descriptions to English

  **What to do**:
  - Changer les descriptions en français → anglais dans:
    - service-finance: `"Microservice gRPC consolidé pour la gestion des finances (factures, payments, calendar)"` → `"Consolidated Finance gRPC microservice (invoices, payments, calendar)"`
    - service-engagement: `"Microservice gRPC pour l'engagement..."` → `"Consolidated Engagement gRPC microservice (notifications, activities, tasks, email)"`
    - service-logistics: `"Microservice gRPC pour la logistique..."` → `"Consolidated Logistics gRPC microservice (shipments, tracking, carriers)"`

  **Must NOT do**:
  - NE PAS changer les dépendances
  - NE PAS modifier les scripts

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 3 string changes in 3 files
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 2)
  - **Blocks**: None
  - **Blocked By**: None

  **References**:
  - `services/service-core/package.json:4` — Référence anglaise: `"Consolidated Core gRPC microservice..."`
  - `services/service-commercial/package.json:4` — Référence anglaise

  **Acceptance Criteria**:
  - [ ] Aucune description en français dans les 5 package.json
  - [ ] Toutes les descriptions suivent le pattern `"Consolidated {Domain} gRPC microservice ({bounded contexts})"`

  **Commit**: YES
  - Message: `chore(services): standardize package.json descriptions to English`
  - Files: 3 package.json files
  - Pre-commit: none needed

---

- [ ] 11. Standardize entity loading to autoLoadEntities: true

  **What to do**:
  - Dans service-engagement et service-logistics, remplacer les listes explicites d'entités par `autoLoadEntities: true`
  - Vérifier que TOUTES les entités sont déjà enregistrées via `TypeOrmModule.forFeature()` dans les modules (pré-condition pour autoLoadEntities)
  - Retirer les arrays `entities: [...]` des configs TypeORM

  **Must NOT do**:
  - NE PAS modifier les modules (forFeature doit déjà lister les entités)
  - NE PAS toucher les migrations

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Small config change in 2 files
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 7, 8, 9, 12)
  - **Parallel Group**: Wave 3
  - **Blocks**: Task 14
  - **Blocked By**: Task 3

  **References**:
  - `services/service-core/src/app.module.ts` — Utilise déjà autoLoadEntities: true
  - `services/service-engagement/src/app.module.ts` — Liste explicite à remplacer
  - `services/service-logistics/src/app.module.ts` — Liste explicite à remplacer

  **Acceptance Criteria**:
  - [ ] `grep "autoLoadEntities: true" services/service-engagement/src/app.module.ts` → trouvé
  - [ ] `grep "autoLoadEntities: true" services/service-logistics/src/app.module.ts` → trouvé
  - [ ] Pas de tableau `entities: [...]` dans ces fichiers
  - [ ] `bun run build` pour les 2 services → SUCCESS

  **Commit**: YES
  - Message: `refactor(engagement,logistics): use autoLoadEntities instead of explicit entity arrays`
  - Files: 2 app.module.ts files

---

- [ ] 12. Standardize Jest configuration across services

  **What to do**:
  - Aligner tous les services sur le même format Jest (dans package.json, inline)
  - service-commercial: ajouter la config Jest (actuellement manquante)
  - service-logistics: migrer de `jest.config.js` → inline dans package.json
  - Standardiser les `moduleNameMapper` (garder les mappers spécifiques si nécessaires)
  - Supprimer `jest.config.js` standalone de logistics

  **Must NOT do**:
  - NE PAS écrire de tests (phase séparée)
  - NE PAS changer les tests existants

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Config alignment in 2-3 files
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 7, 8, 9, 11)
  - **Parallel Group**: Wave 3
  - **Blocks**: Task 14
  - **Blocked By**: None

  **References**:
  - `services/service-core/package.json` — Jest config inline de référence
  - `services/service-logistics/jest.config.js` — À migrer vers package.json

  **Acceptance Criteria**:
  - [ ] Les 5 package.json ont une section `"jest"` inline
  - [ ] Pas de `jest.config.js` standalone
  - [ ] `bun test --passWithNoTests` dans chaque service → SUCCESS

  **Commit**: YES
  - Message: `chore(services): standardize Jest configuration to inline package.json`
  - Files: 2-3 package.json + delete jest.config.js

---

- [ ] 13. Fix prebuild runner inconsistency

  **What to do**:
  - service-commercial utilise `bun run` dans le script `prebuild`, les autres utilisent `npm run`
  - Standardiser sur `npm run` (fonctionne avec npm ET bun)
  - Changer `"prebuild": "bun run proto:clean && bun run proto:generate"` → `"prebuild": "npm run proto:clean && npm run proto:generate"` dans service-commercial

  **Must NOT do**:
  - NE PAS modifier la logique de proto generation
  - NE PAS changer les autres scripts

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Single line change
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4 (or Wave 3)
  - **Blocks**: Task 14
  - **Blocked By**: None

  **References**:
  - `services/service-commercial/package.json:12` — `"prebuild": "bun run proto:clean && bun run proto:generate"`
  - `services/service-core/package.json:13` — `"prebuild": "npm run proto:clean && npm run proto:generate"`

  **Acceptance Criteria**:
  - [ ] `grep "bun run" services/service-commercial/package.json` → 0 résultats
  - [ ] `bun run build` service-commercial → SUCCESS

  **Commit**: YES
  - Message: `chore(commercial): standardize prebuild to npm run for cross-runtime compatibility`
  - Files: `services/service-commercial/package.json`

---

- [ ] 14. Full build and lint verification across all 5 services

  **What to do**:
  - Exécuter `bun run build` dans les 5 services
  - Exécuter `bun run lint` dans les services qui ont un script lint
  - Vérifier qu'aucune régression n'a été introduite
  - Lister tout fichier modifié qui casse le build

  **Must NOT do**:
  - NE PAS fixer de nouveaux bugs découverts (documenter seulement)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Run commands and check output
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO (final gate)
  - **Parallel Group**: Wave 4 (sequential)
  - **Blocks**: Task 15
  - **Blocked By**: Tasks 7, 9, 11, 12, 13

  **References**:
  - Tous les fichiers modifiés dans les tasks précédentes

  **Acceptance Criteria**:
  - [ ] `bun run build` → SUCCESS pour les 5 services
  - [ ] `bun run lint` → SUCCESS pour les services avec lint
  - [ ] Zéro régression

  **Agent-Executed QA Scenarios**:
  ```
  Scenario: All 5 services build successfully
    Tool: Bash
    Steps:
      1. cd services/service-core && bun run build → exit code 0
      2. cd services/service-commercial && bun run build → exit code 0
      3. cd services/service-finance && bun run build → exit code 0
      4. cd services/service-engagement && bun run build → exit code 0
      5. cd services/service-logistics && bun run build → exit code 0
    Expected Result: All 5 build successfully
    Evidence: Build outputs captured in .sisyphus/evidence/task-14-builds.txt
  ```

  **Commit**: NO (verification only)

---

- [ ] 15. Add tests for standardized patterns

  **What to do**:
  - Ajouter des tests unitaires pour les patterns standardisés:
    - Test: GrpcExceptionFilter mappe correctement DomainException → gRPC status codes
    - Test: Un controller avec RpcException retourne le bon code gRPC
    - Test: NatsModule est correctement chargé dans un service (module test)
  - Placer les tests dans le service de référence (service-core ou shared-kernel)
  - Utiliser Jest + ts-jest (déjà configuré)

  **Must NOT do**:
  - NE PAS écrire de tests d'intégration (scope: unit tests seulement)
  - NE PAS tester la logique métier (seulement les patterns d'infrastructure)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Multiple test files with mocking patterns
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO (after all fixes)
  - **Parallel Group**: Wave 4 (after Task 14)
  - **Blocks**: None
  - **Blocked By**: Task 14

  **References**:
  - `packages/shared-kernel/src/infrastructure/filters/grpc-exception.filter.ts` — Code à tester
  - `packages/shared-kernel/src/exceptions/domain.exception.ts` — Exceptions à tester
  - `services/service-core/src/infrastructure/grpc/users/utilisateur.controller.ts` — Controller pattern à tester

  **Acceptance Criteria**:
  - [ ] Au moins 3 test files créés
  - [ ] `bun test` → tous les tests passent
  - [ ] Tests couvrent: exception filter mapping, RpcException pattern, NatsModule loading

  **Commit**: YES
  - Message: `test(services): add unit tests for standardized infrastructure patterns`
  - Files: Test files created
  - Pre-commit: `bun test`

---

## Commit Strategy

| After Task | Message | Files | Verification |
|------------|---------|-------|-------------|
| 1 | `fix(commercial): resolve duplicate migration timestamp` | 1 migration file | `bun run build` |
| 2 | `fix(finance): add missing datasource.ts` | 1 file | `bun run build` |
| 3 | `fix(services): standardize migrationsRun: true` | 2 app.module.ts | `bun run build` x5 |
| 4 | `fix(engagement,finance): wire NatsModule.forRootAsync` | 3 files | `bun run build` x2 |
| 5 | `fix(engagement): register DepanssurEventsHandler` | 1 module file | `bun run build` |
| 6 | `fix(services): register GrpcExceptionFilter as APP_FILTER` | 5 app.module.ts | `bun run build` x5 |
| 7 | `fix(services): standardize gRPC error handling to RpcException` | Multiple controllers | `bun run build` x5 |
| 8 | `feat(finance): activate NATS handlers with business logic` | Handler files | `bun run build` |
| 9 | `docs(conventions): document NATS event naming convention` | 1 md file | None |
| 10 | `chore(services): standardize package.json descriptions` | 3 package.json | None |
| 11 | `refactor(engagement,logistics): use autoLoadEntities` | 2 app.module.ts | `bun run build` x2 |
| 12 | `chore(services): standardize Jest configuration` | 2-3 files | `bun test --passWithNoTests` |
| 13 | `chore(commercial): standardize prebuild to npm run` | 1 package.json | `bun run build` |
| 14 | (no commit — verification only) | — | `bun run build` x5 |
| 15 | `test(services): add unit tests for infrastructure patterns` | 3+ test files | `bun test` |

---

## Success Criteria

### Verification Commands
```bash
# P0: All TypeORM configs aligned
grep -r "migrationsRun: true" services/*/src/app.module.ts  # Expected: 5 results

# P0: All NatsModules wired
grep -r "NatsModule.forRootAsync" services/*/src/app.module.ts  # Expected: 5 results

# P0: All GrpcExceptionFilters registered
grep -r "APP_FILTER" services/*/src/app.module.ts  # Expected: 5 results

# P0: datasource.ts exists
ls services/service-finance/src/datasource.ts  # Expected: exists

# P1: No generic Error in gRPC controllers
# Expected: 0 results in controller files

# P2: All package.json descriptions in English
grep -r '"description"' services/*/package.json  # Expected: all English

# All builds pass
for svc in service-core service-commercial service-finance service-engagement service-logistics; do
  (cd services/$svc && bun run build 2>&1 | tail -1) && echo "$svc: OK"
done
# Expected: 5x "OK"

# Tests pass
bun test  # Expected: all pass
```

### Final Checklist
- [ ] All "Must Have" present
- [ ] All "Must NOT Have" absent
- [ ] All 5 services build successfully
- [ ] Existing tests still pass
- [ ] No PSP code touched in service-finance
- [ ] No WebSocket code touched in service-engagement
- [ ] No existing RpcException throws refactored
- [ ] NATS convention documented
