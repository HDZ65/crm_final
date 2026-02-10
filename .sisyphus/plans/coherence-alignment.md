# Alignement Technique CRM Monorepo ↔ winaity-clean

## TL;DR

> **Quick Summary**: Aligner les 5 services CRM avec le repo de référence clone/winaity-clean en éliminant toute sur-ingénierie (DTOs, wrappers, interfaces redondantes), en utilisant directement les types proto generated, et en rendant le code prêt pour la production. Rien n'est en production — on casse pour reconstruire proprement.
>
> **Deliverables**:
> - 5 services NestJS nettoyés avec types proto directs (zéro `data: any`)
> - ~170+ fichiers redondants supprimés (DTOs, port interfaces, repository interfaces)
> - Proto package.json exports corrigés
> - Shared-kernel simplifié
> - Docker compose aligné
> - TypeScript path aliases configurés
>
> **Estimated Effort**: Large
> **Parallel Execution**: YES - 3 waves
> **Critical Path**: Task 0 → Task 1 → Task 2 → Tasks 3-7 (parallel per service) → Task 8 → Task 9 → Task 10

---

## Context

### Original Request
L'utilisateur veut aligner son CRM monorepo (5 services NestJS consolidés) avec le repo de référence cloné à la racine (clone/winaity-clean). Principes directeurs :
- Utiliser les proto generated directement, ne pas réécrire les interfaces
- Zéro sur-ingénierie, zéro dette technique, zéro band-aids
- Champs optionnels dans le proto (sauf exception légitime)
- Code prêt pour la production
- Vérifier le flux E2E avant tout changement
- On peut casser pour mieux reconstruire

### Interview Summary
**Key Discussions**:
- Pas de tests — l'utilisateur ne veut explicitement aucun test
- Les `interfaces/` directories à la racine de chaque service viennent d'une ancienne fusion et contiennent principalement les controllers gRPC
- Le reference repo (winaity-clean) n'a ZERO DTOs, ZERO port interfaces, et utilise les proto types directement
- Le user est OK pour tout casser car rien n'est en production

**Research Findings**:
- 90+ DTOs hand-written dupliquent les messages proto (dans application/*/dtos/)
- 50+ repository interfaces sont des wrappers 1:1 sur TypeORM sans logique domain
- 50+ service port interfaces dupliquent les contracts repository
- 5 controllers ont des mapToProto() + 1 a mapToResponse() avec de la logique de conversion (dates, enums)
- gRPC couverture: finance 0%, commercial 31%, core 57%, engagement 83%, logistics 100%
- NATS: infrastructure existe dans shared-kernel mais 0 service l'utilise
- Proto export paths dans package.json ont des erreurs
- keepCase=false dans proto-loader → les champs arrivent en camelCase mais les types proto sont en snake_case
- forwardRef() circular dependencies entre modules (Users↔Organisations, Commercial↔Contrats↔Products)

### Metis Review
**Identified Gaps** (addressed):
- **keepCase mismatch** (CRITIQUE): Proto types en snake_case mais runtime en camelCase → Résolu : on vérifie et aligne en Phase 0
- **mapToProto() contient de la logique** (dates .toISOString(), enums): Résolu → logique de conversion inline dans les controllers, pas supprimée
- **forwardRef() circulaires**: Résolu → gardés tels quels dans cette phase, pas de restructuration des modules
- **CQRS hors scope**: Le reference repo utilise CommandBus/QueryBus, mais c'est un upgrade architectural séparé
- **Domain aggregates hors scope**: Le reference repo sépare aggregates et entities, on garde entity-as-model
- **Frontend hors scope**: Pas de changements frontend
- **Database strategy mismatch** (dev=6 DBs, staging=1): Documenté, pas corrigé dans cette phase

---

## Work Objectives

### Core Objective
Éliminer toute sur-ingénierie en supprimant les couches d'abstraction inutiles et en utilisant directement les types proto generated dans les 5 services NestJS, alignés sur les patterns du repo de référence clone/winaity-clean.

### Concrete Deliverables
- 5 services avec controllers gRPC typés (proto types, zéro `any`)
- Suppression complète des dossiers application/*/dtos/, application/*/ports/, domain/*/repositories/I*.ts
- Proto package.json avec exports corrects
- Shared-kernel sans gRPC factory over-engineered
- Docker compose avec nommage cohérent
- tsconfig avec path aliases @crm/*

### Definition of Done
- [x] `bun run build` passe (exit 0) dans chacun des 5 services
- [x] 0 occurrences de `data: any` dans les controllers gRPC
- [x] 0 fichiers *.dto.ts dans application/*/dtos/
- [x] 0 fichiers I*Service.ts dans application/*/ports/
- [x] 0 fichiers I*Repository.ts dans domain/*/repositories/ (sauf si logique domain-specific)
- [x] 0 méthodes mapToProto() ou mapToResponse()
- [x] Tous les imports controllers pointent vers @crm/proto/*

### Must Have
- Types proto generated utilisés directement dans les controllers
- Compilation réussie de chaque service après changements
- Exports proto package.json corrigés
- Logique de conversion (dates, enums) préservée inline dans les controllers

### Must NOT Have (Guardrails)
- ❌ Pas de CQRS (CommandBus, QueryBus) — hors scope
- ❌ Pas de nouveaux DTOs, pas de class-validator decorators
- ❌ Pas de nouvelles couches d'abstraction (base classes, nouvelles interfaces)
- ❌ Pas de modifications aux entities TypeORM (colonnes, décorateurs)
- ❌ Pas de modifications aux fichiers .proto source (seulement package.json exports)
- ❌ Pas de changements frontend
- ❌ Pas de modifications database/migrations/schema
- ❌ Pas de tests (le user ne veut pas de tests)
- ❌ Pas de restructuration des modules NestJS (garder forwardRef tel quel)
- ❌ Pas d'introduction de Consul/service discovery
- ❌ Pas de Value Objects adoption depuis shared-kernel
- ❌ Pas de NATS wiring dans cette phase (infrastructure existe mais le design event-driven nécessite un plan séparé basé sur le flux E2E complet)

---

## Verification Strategy (MANDATORY)

> **UNIVERSAL RULE: ZERO HUMAN INTERVENTION**
>
> ALL tasks in this plan MUST be verifiable WITHOUT any human action.

### Test Decision
- **Infrastructure exists**: OUI (Jest configuré)
- **Automated tests**: NON — L'utilisateur ne veut pas de tests
- **Framework**: N/A

### Agent-Executed QA Scenarios (MANDATORY — ALL tasks)

**Verification Tool by Deliverable Type:**

| Type | Tool | How Agent Verifies |
|------|------|-------------------|
| **Code cleanup** | Bash (grep, find) | Count remaining anti-patterns, assert 0 |
| **Build verification** | Bash (bun run build) | Assert exit code 0, no TypeScript errors |
| **Import verification** | Bash (grep) | Assert proto imports present, no `any` typing |
| **Config verification** | Bash (cat, diff) | Compare config values with expected |

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Start Immediately):
├── Task 0: Validate foundations (proto imports, keepCase)
└── [SEQUENTIAL: Must complete before Wave 2]

Wave 2 (After Task 0 + Task 1):
├── Task 1: Fix proto package.json exports
├── Task 2: Delete dead code across ALL services (DTOs, ports, repo interfaces)
└── [Task 1 and Task 2 can run in parallel]

Wave 3 (After Wave 2):
├── Task 3: Type service-logistics controllers (proof of concept — simplest)
├── Task 4: Type service-engagement controllers
├── Task 5: Type service-core controllers
├── Task 6: Type service-commercial controllers
├── Task 7: Type service-finance controllers
└── [All 5 can run in parallel, but recommended sequential for learning]

Wave 4 (After Wave 3):
├── Task 8: Simplify shared-kernel
├── Task 9: Fix Docker compose + tsconfig
└── Task 10: Final cross-service build validation
```

### Dependency Matrix

| Task | Depends On | Blocks | Can Parallelize With |
|------|------------|--------|---------------------|
| 0 | None | 1, 2, 3-7 | None (foundation) |
| 1 | 0 | 3-7 | 2 |
| 2 | 0 | 3-7 | 1 |
| 3 | 1, 2 | 10 | 4, 5, 6, 7 |
| 4 | 1, 2 | 10 | 3, 5, 6, 7 |
| 5 | 1, 2 | 10 | 3, 4, 6, 7 |
| 6 | 1, 2 | 10 | 3, 4, 5, 7 |
| 7 | 1, 2 | 10 | 3, 4, 5, 6 |
| 8 | 3-7 | 10 | 9 |
| 9 | None | 10 | 8 |
| 10 | 3-7, 8, 9 | None | None (final) |

### Agent Dispatch Summary

| Wave | Tasks | Recommended Agents |
|------|-------|-------------------|
| 1 | 0 | delegate_task(category="deep", load_skills=["microservice-coherence"]) |
| 2 | 1, 2 | delegate_task(category="quick", ...) each |
| 3 | 3-7 | delegate_task(category="unspecified-high", load_skills=["microservice-maintainer"]) each |
| 4 | 8, 9, 10 | delegate_task(category="quick", ...) each |

---

## TODOs

- [x] 0. Validate Foundations — Proto Imports & keepCase Convention

  **What to do**:
  - **Étape 0a — Génération proto**: Vérifier que `packages/proto/gen/ts/` contient les fichiers generated (~36 fichiers .ts). Si absent ou vide, exécuter `cd packages/proto && npm run gen:all`. Confirmer que les fichiers existent (ex: `ls packages/proto/gen/ts/clients/clients.ts`)
  - Vérifier que `import { CreateClientBaseRequest } from '@crm/proto/clients'` compile depuis service-core
  - Vérifier que `import { CreateExpeditionRequest } from '@crm/proto/logistics'` compile depuis service-logistics
  - Inspecter `packages/shared-kernel/src/infrastructure/grpc/service-config.ts` pour le setting `keepCase`
  - Inspecter les types proto generated dans `packages/proto/gen/ts/clients/clients.ts` : les champs sont-ils `organisation_id` ou `organisationId`?
  - Comparer avec comment les controllers accèdent aux champs actuellement (ex: `data.organisationId` vs `data.organisation_id`)
  - Si mismatch: documenter la convention à suivre. L'option `snakeToCamel=false` dans buf.gen.yaml signifie que les types TS gardent le snake_case du proto. Si `keepCase=false` dans grpc-loader, les valeurs runtime arrivent en camelCase. C'est un mismatch fondamental.
  - **DÉCISION**: Si mismatch confirmé, changer `keepCase: true` dans shared-kernel/grpc config pour que le runtime match les types proto generated (snake_case partout)
  - Vérifier que chaque service peut résoudre `@crm/proto` et `@crm/shared-kernel` via workspace/node_modules

  **Must NOT do**:
  - Ne pas modifier les fichiers .proto source
  - Ne pas modifier les entities TypeORM
  - Ne pas changer les options de buf.gen.yaml

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: Investigation nécessitant une compréhension profonde des interactions entre proto-loader, ts-proto generated types, et runtime gRPC
  - **Skills**: [`microservice-coherence`]
    - `microservice-coherence`: Pour vérifier la cohérence cross-service de la config proto

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 1 (alone)
  - **Blocks**: Tasks 1-10
  - **Blocked By**: None

  **PRÉREQUIS**: Avant de commencer, vérifier que `packages/proto/gen/ts/` est peuplé. Si vide ou absent, exécuter `cd packages/proto && npm run gen:all` pour générer les types TypeScript depuis les fichiers .proto. Le dossier gen/ts/ doit contenir ~36 fichiers .ts après génération.

  **References**:

  **Pattern References**:
  - `packages/shared-kernel/src/infrastructure/grpc/service-config.ts` - Configuration gRPC avec keepCase setting, service registry, proto paths
  - `clone/winaity-clean/packages/shared-kernel/src/infrastructure/filters/grpc-exception.filter.ts` - Pattern gRPC exception handling dans le reference repo
  - `clone/winaity-clean/packages/shared-kernel/src/infrastructure/health/grpc-health.service.ts` - Pattern gRPC health check dans le reference repo
  - `clone/winaity-clean/services/campaign-service/src/campaigns/infrastructure/grpc/campaigns.commands.grpc-controller.ts` - Pattern controller gRPC typed dans le reference repo
  
  **API/Type References**:
  - `packages/proto/gen/ts/clients/clients.ts` - Types generated pour vérifier snake_case vs camelCase (DOIT EXISTER après gen:all)
  - `packages/proto/gen/ts/logistics/logistics.ts` - Types generated pour service le plus simple (DOIT EXISTER après gen:all)
  - `packages/proto/buf.gen.yaml` - Options de génération (snakeToCamel=false)
  
  **Documentation References**:
  - `packages/proto/package.json` - Exports map actuels
  - `services/service-core/package.json` - Dépendances incluant @crm/proto
  - `services/service-core/tsconfig.json` - Configuration TypeScript, path resolution
  - `services/service-logistics/tsconfig.json` - Idem pour le service le plus simple

  **Acceptance Criteria**:

  ```
  Scenario: Proto imports compile depuis chaque service
    Tool: Bash
    Preconditions: Services installés (node_modules existe)
    Steps:
      1. Depuis services/service-logistics, créer un fichier temporaire qui importe depuis @crm/proto/logistics
      2. Exécuter bun run build ou tsc --noEmit
      3. Vérifier que l'import resolve sans erreur
      4. Supprimer le fichier temporaire
    Expected Result: Import résolu, compilation réussie
    Evidence: Output de la commande build

  Scenario: Identifier la convention keepCase
    Tool: Bash (grep)
    Preconditions: None
    Steps:
      1. grep -r "keepCase" packages/shared-kernel/src/ — trouver le setting actuel
      2. Lire les types dans packages/proto/gen/ts/clients/clients.ts — vérifier si les champs sont snake_case ou camelCase
      3. Lire un controller existant (ex: service-core/src/interfaces/grpc/controllers/clients/client-base.controller.ts) — vérifier comment les champs sont accédés
      4. Documenter le mismatch si trouvé
    Expected Result: Convention keepCase clairement identifiée et documentée
    Evidence: Output des grep montrant le setting et les patterns d'accès
  ```

  **Commit**: YES
  - Message: `fix(proto): align keepCase convention between proto types and grpc loader`
  - Files: `packages/shared-kernel/src/infrastructure/grpc/service-config.ts` (si changement nécessaire)
  - Pre-commit: `bun run build` dans service-logistics

---

- [x] 1. Fix Proto Package.json Exports

  **What to do**:
  - Lire `packages/proto/package.json` section "exports"
  - Vérifier chaque export path pointe vers un fichier qui EXISTE réellement dans `packages/proto/gen/ts/`
  - Corriger les paths erronés (ex: `./users` pointe vers `./gen/ts/organisations/users.ts` — vérifier si c'est correct ou si un fichier users/users.ts existe)
  - S'assurer que tous les domaines proto générés ont un export correspondant
  - Comparer avec les imports utilisés dans les services (grep pour `from '@crm/proto/`)

  **Must NOT do**:
  - Ne pas modifier les fichiers .proto source
  - Ne pas modifier la structure des dossiers gen/
  - Ne pas ajouter de nouveaux exports qui ne correspondent pas à des fichiers generated

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Changement simple et ciblé — vérification de paths et correction dans un seul fichier
  - **Skills**: [`microservice-maintainer`]
    - `microservice-maintainer`: Pour comprendre les conventions d'export du proto package

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Task 2)
  - **Blocks**: Tasks 3-7
  - **Blocked By**: Task 0

  **References**:

  **Pattern References**:
  - `packages/proto/package.json` - Fichier à modifier, section exports avec les 25+ paths
  - `clone/winaity-clean/packages/proto/package.json` - Reference : comment l'export est structuré dans le repo de référence

  **API/Type References**:
  - `packages/proto/gen/ts/` - Arborescence des fichiers générés, vérifier l'existence de chaque path exporté
  - `packages/proto/gen/ts/organisations/users.ts` - Vérifier si users.ts est bien ici ou ailleurs

  **Acceptance Criteria**:

  ```
  Scenario: Tous les exports proto résolvent vers des fichiers existants
    Tool: Bash
    Steps:
      1. Lire les exports de packages/proto/package.json
      2. Pour chaque export, vérifier que le fichier cible existe (ls packages/proto/gen/ts/...)
      3. Lister les exports qui pointent vers des fichiers inexistants
    Expected Result: 0 exports cassés
    Evidence: Liste des exports vérifiés avec statut OK/BROKEN
  ```

  **Commit**: YES
  - Message: `fix(proto): correct package.json export paths to match generated file locations`
  - Files: `packages/proto/package.json`
  - Pre-commit: Vérification que chaque export path existe

---

- [x] 2. Delete Dead Code — DTOs, Port Interfaces, Repository Interfaces

  **What to do**:
  - **Phase 2a — Inventaire**: Lister TOUS les fichiers à supprimer:
    - `services/*/src/application/*/dtos/*.dto.ts` — tous les DTOs hand-written
    - `services/*/src/application/*/ports/I*.ts` — toutes les interfaces de ports
    - `services/*/src/domain/*/repositories/I*Repository.ts` — les interfaces repository qui sont des 1:1 TypeORM (ATTENTION: vérifier avant suppression que l'interface n'a PAS de logique domain-specific)
  - **Phase 2b — Vérifier les imports**: Avant de supprimer, grep pour les imports de ces fichiers dans le code restant (controllers, services). Si un controller importe un DTO, noter qu'il faudra le remplacer par le type proto dans la Task 3-7
  - **Phase 2c — Supprimer**: Supprimer les fichiers identifiés
  - **Phase 2d — Nettoyer les barrel exports**: Vérifier les fichiers index.ts qui ré-exportent les fichiers supprimés, les nettoyer
  - **Phase 2e — Vérifier la compilation**: `bun run build` dans chaque service — des erreurs TypeScript sont ATTENDUES (imports cassés dans les controllers qui utilisaient les DTOs/interfaces). C'est normal, ces erreurs seront corrigées dans les Tasks 3-7

  **Must NOT do**:
  - Ne PAS supprimer les repository interfaces qui contiennent de la logique domain-specific (méthodes d'agrégation, queries complexes)
  - Ne PAS supprimer les fichiers entity (domain/*/entities/)
  - Ne PAS supprimer les controllers (interfaces/grpc/controllers/)
  - Ne PAS supprimer les infrastructure services (persistence/typeorm/repositories/)
  - Ne PAS modifier le code des controllers — seulement supprimer les fichiers morts

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Suppression massive mais structurée de 170+ fichiers nécessitant vérification avant chaque suppression
  - **Skills**: [`microservice-maintainer`]
    - `microservice-maintainer`: Pour comprendre la structure DDD et identifier les fichiers réellement morts vs ceux qui ont de la logique

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Task 1)
  - **Blocks**: Tasks 3-7
  - **Blocked By**: Task 0

  **References**:

  **Pattern References**:
  - `clone/winaity-clean/services/contact-api-service/src/` - Structure de référence SANS DTOs ni port interfaces — c'est le pattern cible
  - `services/service-core/src/application/clients/dtos/client-base.dto.ts` - Exemple typique de DTO redondant à supprimer (122 lignes dupliquant proto)
  - `services/service-core/src/application/clients/ports/IClientBaseService.ts` - Exemple typique de port interface redondant (30 lignes)
  - `services/service-core/src/domain/clients/repositories/IClientBaseRepository.ts` - Exemple typique de repo interface 1:1 TypeORM (10 lignes)

  **API/Type References**:
  - `packages/proto/gen/ts/clients/clients.ts` - Proto generated qui remplace les DTOs

  **Acceptance Criteria**:

  ```
  Scenario: Zéro DTOs restants
    Tool: Bash (find)
    Steps:
      1. find services -path "*/application/*/dtos/*.dto.ts" -not -path "*/node_modules/*" -not -path "*/dist/*" | wc -l
    Expected Result: Output est 0
    Evidence: Output de la commande

  Scenario: Zéro port interfaces restants
    Tool: Bash (find)
    Steps:
      1. find services -path "*/application/*/ports/I*.ts" -not -path "*/node_modules/*" -not -path "*/dist/*" | wc -l
    Expected Result: Output est 0
    Evidence: Output de la commande

  Scenario: Repository interfaces restants sont légitimes
    Tool: Bash (find + grep)
    Steps:
      1. find services -path "*/domain/*/repositories/I*.ts" -not -path "*/node_modules/*" -not -path "*/dist/*"
      2. Pour chaque fichier trouvé, vérifier qu'il contient de la logique domain-specific (pas juste findById/save/delete)
    Expected Result: Seuls les fichiers avec logique domain-specific survivent (ou 0 fichiers)
    Evidence: Liste des fichiers restants avec justification
  ```

  **Commit**: YES
  - Message: `refactor(services): remove redundant DTOs, port interfaces and 1:1 repository interfaces`
  - Files: Tous les fichiers supprimés (170+)
  - Pre-commit: `find` commands ci-dessus

---

- [x] 3. Type Service-Logistics Controllers (Proof of Concept)

  **PRÉREQUIS**: Le dossier `packages/proto/gen/ts/` doit être peuplé (Task 0 l'aura vérifié/généré). Si absent, exécuter `cd packages/proto && npm run gen:all` d'abord.

  **What to do**:
  - C'est le service le plus simple (4 entités, 1 bounded context). Il sert de proof of concept.
  - Pour CHAQUE controller dans `services/service-logistics/src/interfaces/grpc/controllers/`:
    1. Identifier le proto service correspondant dans `packages/proto/gen/ts/logistics/logistics.ts`
    2. Importer les types Request/Response du proto generated
    3. Remplacer `data: any` par le type proto Request correspondant (ex: `data: CreateExpeditionRequest`)
    4. Typer le retour de la méthode avec le type proto Response correspondant
    5. Si un `mapToResponse()` existe : vérifier sa logique. Si elle contient des conversions (dates .toISOString(), enums), déplacer cette logique inline dans la méthode du controller. Puis supprimer la méthode mapToResponse()
    6. Si le controller est un pass-through simple (`return this.service.methodName(data)`), vérifier que le service retourne un objet compatible avec le type proto Response
  - Après tous les controllers : `bun run build` dans service-logistics

  **Must NOT do**:
  - Ne pas créer de nouveaux DTOs ou interfaces
  - Ne pas modifier les entities TypeORM
  - Ne pas introduire de CommandBus/QueryBus
  - Ne pas modifier les fichiers proto source
  - Ne pas créer de nouvelles classes mappers — la logique de conversion va INLINE dans le controller

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Refactoring de controllers avec compréhension des types proto generated et patterns NestJS gRPC
  - **Skills**: [`microservice-maintainer`]
    - `microservice-maintainer`: Service existant à modifier, comprend les conventions NestJS + proto

  **Parallelization**:
  - **Can Run In Parallel**: YES (mais recommandé en premier comme proof of concept)
  - **Parallel Group**: Wave 3 (with Tasks 4-7)
  - **Blocks**: Task 10
  - **Blocked By**: Tasks 0, 1, 2

  **References**:

  **Pattern References**:
  - `clone/winaity-clean/services/delivery-service/src/queries/grpc/delivery.grpc-controller.ts` - Pattern de référence : typed params, typed returns, pas de mappers inutiles
  - `services/service-logistics/src/interfaces/grpc/controllers/logistics/carrier.controller.ts` - Controller actuel avec mapToResponse() à refactorer
  - `services/service-logistics/src/interfaces/grpc/controllers/logistics/expedition.controller.ts` - Controller actuel

  **API/Type References**:
  - `packages/proto/gen/ts/logistics/logistics.ts` - Types generated (Request/Response) pour le service logistics
  - `packages/proto/src/logistics/logistics.proto` - Proto source pour comprendre les messages

  **Documentation References**:
  - `services/service-logistics/src/logistics.module.ts` - Module NestJS pour comprendre le wiring controllers/services

  **Acceptance Criteria**:

  ```
  Scenario: Build service-logistics réussit
    Tool: Bash
    Preconditions: Tasks 0, 1, 2 complétés
    Steps:
      1. cd services/service-logistics && bun run build
    Expected Result: Exit code 0, aucune erreur TypeScript
    Evidence: Output du build

  Scenario: Zéro data: any dans les controllers logistics
    Tool: Bash (grep)
    Steps:
      1. grep -rn "data: any" services/service-logistics/src/interfaces/grpc/controllers/ | wc -l
    Expected Result: Output est 0
    Evidence: Output du grep

  Scenario: Zéro mapToResponse/mapToProto dans logistics
    Tool: Bash (grep)
    Steps:
      1. grep -rn "mapToResponse\|mapToProto" services/service-logistics/src/ | wc -l
    Expected Result: Output est 0
    Evidence: Output du grep

  Scenario: Imports proto présents
    Tool: Bash (grep)
    Steps:
      1. grep -rn "from '@crm/proto" services/service-logistics/src/interfaces/grpc/controllers/ | wc -l
    Expected Result: Output > 0 (au moins 1 import proto par controller)
    Evidence: Output du grep
  ```

  **Commit**: YES
  - Message: `refactor(logistics): use proto generated types directly in gRPC controllers`
  - Files: `services/service-logistics/src/interfaces/grpc/controllers/**/*.ts`
  - Pre-commit: `bun run build` dans service-logistics

---

- [x] 4. Type Service-Engagement Controllers

  **PRÉREQUIS**: `packages/proto/gen/ts/` peuplé (vérifié en Task 0).

  **What to do**:
  - Même pattern que Task 3 mais pour service-engagement (6 entités, 83% gRPC couverture)
  - Pour CHAQUE controller dans `services/service-engagement/src/interfaces/grpc/controllers/engagement/`:
    1. Identifier le proto service correspondant dans `packages/proto/gen/ts/activites/activites.ts`, `packages/proto/gen/ts/notifications/notifications.ts`, `packages/proto/gen/ts/email/email.ts`
    2. Importer les types Request/Response
    3. Remplacer `data: any` par le type proto Request
    4. Typer les retours
    5. **ATTENTION SPÉCIALE**: activite.controller.ts, evenement-suivi.controller.ts, tache.controller.ts ont des mapToProto() avec logique de conversion (dates, enums de notification type, connection type). Déplacer cette logique inline.
    6. notification.controller.ts est massif (560+ lignes, 24+ méthodes) avec des conversions enum (`fromGrpcNotificationType`, `fromGrpcConnectionType`). Préserver ces conversions inline.
  - Après : `bun run build` dans service-engagement

  **Must NOT do**:
  - Même guardrails que Task 3
  - Ne PAS supprimer les fonctions de conversion enum (fromGrpcNotificationType, etc.) — les garder inline ou comme helpers privés dans le controller

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Service avec mappers complexes et controller massif (notification 560+ lignes)
  - **Skills**: [`microservice-maintainer`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Tasks 3, 5-7)
  - **Blocks**: Task 10
  - **Blocked By**: Tasks 0, 1, 2

  **References**:

  **Pattern References**:
  - `services/service-engagement/src/interfaces/grpc/controllers/engagement/activite.controller.ts` - Controller avec mapToProto() à refactorer
  - `services/service-engagement/src/interfaces/grpc/controllers/engagement/notification.controller.ts` - Controller massif avec conversions enum complexes
  - `services/service-engagement/src/interfaces/grpc/controllers/engagement/tache.controller.ts` - Controller avec mapToProto()
  - `services/service-engagement/src/interfaces/grpc/controllers/engagement/evenement-suivi.controller.ts` - Controller avec mapToProto()

  **API/Type References**:
  - `packages/proto/gen/ts/activites/activites.ts` - Types proto pour activités, tâches, événements
  - `packages/proto/gen/ts/notifications/notifications.ts` - Types proto pour notifications
  - `packages/proto/gen/ts/email/email.ts` - Types proto pour email

  **Acceptance Criteria**:

  ```
  Scenario: Build service-engagement réussit
    Tool: Bash
    Steps:
      1. cd services/service-engagement && bun run build
    Expected Result: Exit code 0
    Evidence: Output du build

  Scenario: Zéro data: any dans les controllers engagement
    Tool: Bash (grep)
    Steps:
      1. grep -rn "data: any" services/service-engagement/src/interfaces/grpc/controllers/ | wc -l
    Expected Result: Output est 0

  Scenario: Zéro mapToProto dans engagement
    Tool: Bash (grep)
    Steps:
      1. grep -rn "mapToProto" services/service-engagement/src/ | wc -l
    Expected Result: Output est 0

  Scenario: Imports proto présents
    Tool: Bash (grep)
    Steps:
      1. grep -rn "from '@crm/proto" services/service-engagement/src/interfaces/grpc/controllers/ | wc -l
    Expected Result: Output > 0
  ```

  **Commit**: YES
  - Message: `refactor(engagement): use proto generated types directly in gRPC controllers`
  - Files: `services/service-engagement/src/interfaces/grpc/controllers/**/*.ts`
  - Pre-commit: `bun run build` dans service-engagement

---

- [x] 5. Type Service-Core Controllers

  **PRÉREQUIS**: `packages/proto/gen/ts/` peuplé (vérifié en Task 0).

  **What to do**:
  - Service le plus complexe (26 entités, 4 bounded contexts, 57% couverture gRPC)
  - Pour CHAQUE controller dans `services/service-core/src/interfaces/grpc/controllers/`:
    - `clients/` - 11 controllers → types depuis `@crm/proto/clients`
    - `documents/` - 2 controllers (boite-mail, piece-jointe) avec mapToProto() → types depuis `@crm/proto/documents`
    - `organisations/` - 6 controllers → types depuis `@crm/proto/organisations`
    - `users/` - 8 controllers → types depuis `@crm/proto/users`
  - Remplacer chaque `data: any` par le type proto Request correspondant
  - boite-mail.controller.ts et piece-jointe.controller.ts ont des mapToProto() avec conversions de dates et champs optionnels — préserver la logique inline
  - **ATTENTION**: OrganisationController importe AuthSyncService, RoleService, MembreCompteService cross-module. Ne PAS toucher à cette logique cross-module, seulement typer les params/retours.
  - Après : `bun run build` dans service-core

  **Must NOT do**:
  - Ne pas restructurer les modules ou résoudre les forwardRef()
  - Ne pas toucher à la logique cross-module dans OrganisationController
  - Ne pas ajouter de nouveaux services gRPC manquants — seulement typer les existants

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Service le plus complexe avec 27 controllers, cross-module dependencies, et 4 bounded contexts
  - **Skills**: [`microservice-maintainer`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Tasks 3, 4, 6, 7)
  - **Blocks**: Task 10
  - **Blocked By**: Tasks 0, 1, 2

  **References**:

  **Pattern References**:
  - `services/service-core/src/interfaces/grpc/controllers/clients/client-base.controller.ts` - Controller principal clients avec `data: any`
  - `services/service-core/src/interfaces/grpc/controllers/documents/boite-mail.controller.ts` - Controller avec mapToProto() et conversions dates
  - `services/service-core/src/interfaces/grpc/controllers/documents/piece-jointe.controller.ts` - Controller avec mapToProto()
  - `services/service-core/src/interfaces/grpc/controllers/organisations/` - 6 controllers avec cross-module imports

  **API/Type References**:
  - `packages/proto/gen/ts/clients/clients.ts` - Types proto clients (114KB, le plus gros fichier generated)
  - `packages/proto/gen/ts/documents/documents.ts` - Types proto documents
  - `packages/proto/gen/ts/organisations/organisations.ts` - Types proto organisations
  - `packages/proto/gen/ts/organisations/users.ts` - Types proto users

  **Acceptance Criteria**:

  ```
  Scenario: Build service-core réussit
    Tool: Bash
    Steps:
      1. cd services/service-core && bun run build
    Expected Result: Exit code 0

  Scenario: Zéro data: any dans les controllers core
    Tool: Bash (grep)
    Steps:
      1. grep -rn "data: any" services/service-core/src/interfaces/grpc/controllers/ | wc -l
    Expected Result: Output est 0

  Scenario: Zéro mapToProto dans core
    Tool: Bash (grep)
    Steps:
      1. grep -rn "mapToProto" services/service-core/src/ | wc -l
    Expected Result: Output est 0
  ```

  **Commit**: YES
  - Message: `refactor(core): use proto generated types directly in gRPC controllers`
  - Files: `services/service-core/src/interfaces/grpc/controllers/**/*.ts`
  - Pre-commit: `bun run build` dans service-core

---

- [x] 6. Type Service-Commercial Controllers

  **PRÉREQUIS**: `packages/proto/gen/ts/` peuplé (vérifié en Task 0).

  **What to do**:
  - 24 entités, 3 bounded contexts, 31% couverture gRPC
  - Pour CHAQUE controller dans `services/service-commercial/src/interfaces/grpc/controllers/`:
    - `commercial/` - apporteur, commission controllers → types depuis `@crm/proto/commerciaux`, `@crm/proto/commission`
    - `contrats/` - contrat controller → types depuis `@crm/proto/contrats`
    - `products/` - produit controller → types depuis `@crm/proto/products`
  - Ces controllers utilisent `data: any` sans mapToProto — c'est du pass-through simple
  - Typer les params et retours avec proto types

  **Must NOT do**:
  - Ne pas implémenter les 9 services gRPC manquants (BaremeCommission, PalierCommission, etc.) — ce sera un plan séparé
  - Ne pas restructurer les modules

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Refactoring avec 3 bounded contexts et types proto multiples (commerciaux, commission, contrats, products)
  - **Skills**: [`microservice-maintainer`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Tasks 3-5, 7)
  - **Blocks**: Task 10
  - **Blocked By**: Tasks 0, 1, 2

  **References**:

  **Pattern References**:
  - `services/service-commercial/src/interfaces/grpc/controllers/commercial/apporteur.controller.ts` - Controller pass-through avec `data: any`
  - `services/service-commercial/src/interfaces/grpc/controllers/contrats/contrat.controller.ts` - Controller contrats
  - `services/service-commercial/src/interfaces/grpc/controllers/products/produit.controller.ts` - Controller produits

  **API/Type References**:
  - `packages/proto/gen/ts/commerciaux/commerciaux.ts` - Types proto commerciaux/apporteurs
  - `packages/proto/gen/ts/commission/commission.ts` - Types proto commissions
  - `packages/proto/gen/ts/contrats/contrats.ts` - Types proto contrats
  - `packages/proto/gen/ts/products/products.ts` - Types proto produits

  **Acceptance Criteria**:

  ```
  Scenario: Build service-commercial réussit
    Tool: Bash
    Steps:
      1. cd services/service-commercial && bun run build
    Expected Result: Exit code 0

  Scenario: Zéro data: any dans les controllers commercial
    Tool: Bash (grep)
    Steps:
      1. grep -rn "data: any" services/service-commercial/src/interfaces/grpc/controllers/ | wc -l
    Expected Result: Output est 0
  ```

  **Commit**: YES
  - Message: `refactor(commercial): use proto generated types directly in gRPC controllers`
  - Files: `services/service-commercial/src/interfaces/grpc/controllers/**/*.ts`
  - Pre-commit: `bun run build` dans service-commercial

---

- [x] 7. Type Service-Finance Controllers

  **PRÉREQUIS**: `packages/proto/gen/ts/` peuplé (vérifié en Task 0).

  **What to do**:
  - 42 entités, 3 bounded contexts, 0% couverture gRPC — MAIS des controllers partiels existent (3 controllers dans 3 domaines)
  - Pour CHAQUE controller existant dans `services/service-finance/src/interfaces/grpc/controllers/`:
    - `factures/` - facture.controller.ts → types depuis `@crm/proto/factures`
    - `payments/` - schedules.controller.ts, configuration.controller.ts → types depuis `@crm/proto/payments`
    - `calendar/` - (s'il existe) → types depuis `@crm/proto/calendar`
  - Même pattern : remplacer `data: any` par proto types
  - **ATTENTION**: service-finance a une structure interfaces/http/ en plus de interfaces/grpc/ — ne toucher QUE les controllers gRPC
  - **ATTENTION**: service-finance a aussi src/common/interfaces/ — vérifier ce que c'est et si c'est du dead code

  **Must NOT do**:
  - Ne pas implémenter les 11 services gRPC manquants — plan séparé
  - Ne pas toucher aux controllers HTTP
  - Ne pas modifier les PSP integrations (Stripe, PayPal, etc.)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Service avec la plus grande complexité (42 entités, PSP integrations) mais le moins de controllers gRPC à typer
  - **Skills**: [`microservice-maintainer`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Tasks 3-6)
  - **Blocks**: Task 10
  - **Blocked By**: Tasks 0, 1, 2

  **References**:

  **Pattern References**:
  - `services/service-finance/src/interfaces/grpc/controllers/factures/facture.controller.ts` - Controller factures existant
  - `services/service-finance/src/interfaces/grpc/controllers/payments/schedules.controller.ts` - Controller schedules
  - `services/service-finance/src/interfaces/grpc/controllers/calendar/configuration.controller.ts` - Controller configuration calendar (NOTE: dans calendar/, PAS dans payments/)
  - `services/service-finance/src/interfaces/` - Structure complète (grpc/ + http/) à comprendre — 3 sous-dossiers gRPC: calendar/, factures/, payments/
  - `services/service-finance/src/common/interfaces/` - Interfaces communes à vérifier (potentiel dead code)

  **API/Type References**:
  - `packages/proto/gen/ts/factures/factures.ts` - Types proto factures
  - `packages/proto/gen/ts/payments/payment.ts` - Types proto payments
  - `packages/proto/gen/ts/calendar/calendar.ts` - Types proto calendar

  **Acceptance Criteria**:

  ```
  Scenario: Build service-finance réussit
    Tool: Bash
    Steps:
      1. cd services/service-finance && bun run build
    Expected Result: Exit code 0

  Scenario: Zéro data: any dans les controllers finance gRPC
    Tool: Bash (grep)
    Steps:
      1. grep -rn "data: any" services/service-finance/src/interfaces/grpc/controllers/ | wc -l
    Expected Result: Output est 0

  Scenario: common/interfaces/ nettoyé si dead code
    Tool: Bash (find)
    Steps:
      1. Si des interfaces hand-written existent dans common/interfaces/, vérifier si elles sont importées quelque part
      2. Si non importées, les supprimer
    Expected Result: Aucun fichier interface orphelin
  ```

  **Commit**: YES
  - Message: `refactor(finance): use proto generated types directly in gRPC controllers`
  - Files: `services/service-finance/src/interfaces/grpc/controllers/**/*.ts`
  - Pre-commit: `bun run build` dans service-finance

---

- [x] 8. Simplify Shared-Kernel

  **What to do**:
  - Lire `packages/shared-kernel/src/infrastructure/grpc/grpc-client.ts` (152 lignes)
  - Identifier les fonctions effectivement importées par les services (grep pour les imports)
  - **GARDER**: `getMultiGrpcOptions()`, `getGrpcOptions()`, `serviceConfig` — utilisés par tous les main.ts
  - **ÉVALUER**: `createGrpcClient()`, `createPromisifiedGrpcClient()`, `getGrpcClientConfig()` — si non utilisés par aucun service, les supprimer
  - **ÉVALUER**: Les 27 Value Objects (ClientId, FactureId, etc.) — si non importés par les services, ne PAS les supprimer mais noter pour un plan futur
  - Après : `bun run build` dans shared-kernel puis dans au moins 1 service

  **Must NOT do**:
  - Ne pas supprimer les fonctions effectivement utilisées par les services
  - Ne pas restructurer le package
  - Ne pas toucher à l'infrastructure NATS (sera utilisée dans un plan futur)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Vérification d'imports et suppression ciblée dans un seul package
  - **Skills**: [`microservice-maintainer`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4 (with Task 9)
  - **Blocks**: Task 10
  - **Blocked By**: Tasks 3-7

  **References**:

  **Pattern References**:
  - `packages/shared-kernel/src/infrastructure/grpc/grpc-client.ts` - Fichier cible avec factory over-engineered (152 lignes)
  - `packages/shared-kernel/src/infrastructure/grpc/service-config.ts` - Service registry à GARDER
  - `services/service-core/src/main.ts` - Exemple d'import de getMultiGrpcOptions()
  - `services/service-logistics/src/main.ts` - Exemple d'import de getGrpcOptions()
  - `clone/winaity-clean/packages/shared-kernel/src/` - Référence pour ce que le shared-kernel devrait contenir

  **Acceptance Criteria**:

  ```
  Scenario: Shared-kernel compile
    Tool: Bash
    Steps:
      1. cd packages/shared-kernel && bun run build (ou tsc)
    Expected Result: Exit code 0

  Scenario: Services compilent toujours après simplification
    Tool: Bash
    Steps:
      1. cd services/service-logistics && bun run build
    Expected Result: Exit code 0
  ```

  **Commit**: YES
  - Message: `refactor(shared-kernel): remove unused gRPC client factory abstractions`
  - Files: `packages/shared-kernel/src/infrastructure/grpc/grpc-client.ts`
  - Pre-commit: `bun run build` dans shared-kernel et service-logistics

---

- [x] 9. Fix Docker Compose Naming + TypeScript Path Aliases

  **What to do**:
  - **Docker**: Lire `compose/dev/*.yml` et corriger le nommage incohérent:
    - `dev-crm-engagement` → `dev-crm-service-engagement` (aligner avec les autres)
    - Vérifier que TOUS les container names suivent le pattern `dev-crm-service-{name}`
    - Vérifier que les service names dans docker-compose matchent les noms de services actuels (pas les anciens pre-consolidation)
  - **TypeScript**: Ajouter les path aliases dans `tsconfig.base.json`:
    ```json
    "paths": {
      "@crm/shared-kernel": ["packages/shared-kernel/src"],
      "@crm/shared-kernel/*": ["packages/shared-kernel/src/*"],
      "@crm/proto": ["packages/proto/gen/ts"],
      "@crm/proto/*": ["packages/proto/gen/ts/*"]
    }
    ```
  - Vérifier que chaque service tsconfig extends le base config correctement

  **Must NOT do**:
  - Ne pas changer la stratégie database (dev=6 DBs vs staging=1 DB) — hors scope
  - Ne pas ajouter de nouveaux services dans docker compose
  - Ne pas modifier les ports

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Changements config simples dans quelques fichiers
  - **Skills**: [`microservice-coherence`]
    - `microservice-coherence`: Pour assurer la cohérence du nommage Docker et des configs TS

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4 (with Task 8)
  - **Blocks**: Task 10
  - **Blocked By**: None (peut commencer dès Wave 2, mais groupé en Wave 4 pour simplifier)

  **References**:

  **Pattern References**:
  - `compose/dev/service-core.yml` - Pattern correct de nommage Docker
  - `compose/dev/infrastructure.yml` - Config infrastructure (DBs, NATS, Consul)
  - `clone/winaity-clean/compose/` - Référence Docker compose
  - `tsconfig.base.json` - Config TS base à modifier
  - `services/service-core/tsconfig.json` - Config TS service à vérifier

  **Acceptance Criteria**:

  ```
  Scenario: Docker naming cohérent
    Tool: Bash (grep)
    Steps:
      1. grep -r "container_name" compose/dev/*.yml
    Expected Result: Tous suivent le pattern dev-crm-service-*

  Scenario: TypeScript path aliases fonctionnent
    Tool: Bash
    Steps:
      1. Vérifier que tsconfig.base.json contient les paths @crm/*
      2. Vérifier que chaque service tsconfig extends la base
      3. cd services/service-logistics && bun run build
    Expected Result: Build réussit avec path aliases
  ```

  **Commit**: YES
  - Message: `fix(config): standardize docker naming and add typescript path aliases`
  - Files: `compose/dev/*.yml`, `tsconfig.base.json`, `services/*/tsconfig.json`
  - Pre-commit: `bun run build` dans service-logistics

---

- [x] 10. Final Cross-Service Build Validation

  **What to do**:
  - Build chacun des 5 services et vérifier exit code 0
  - Vérification finale de toutes les métriques de qualité :
    - 0 fichiers `*.dto.ts` dans application/*/dtos/
    - 0 fichiers `I*Service.ts` dans application/*/ports/
    - 0 `data: any` dans les controllers gRPC
    - 0 `mapToProto` / `mapToResponse` dans les services
    - Tous les controllers importent depuis `@crm/proto/*`
  - Nettoyer les dossiers dist/ de chaque service (rm -rf dist && bun run build)
  - Vérifier qu'aucun import cassé ne reste (pas d'import de fichier supprimé)

  **Must NOT do**:
  - Ne pas modifier de code — validation uniquement
  - Ne pas commit si des erreurs persistent — reporter au task concerné

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Validation pure, pas de modification de code
  - **Skills**: [`microservice-coherence`]
    - `microservice-coherence`: Vérification cross-service de la cohérence finale

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 5 (final, alone)
  - **Blocks**: None (terminal)
  - **Blocked By**: Tasks 3-9

  **References**:

  **Pattern References**:
  - Tous les fichiers modifiés dans les tasks précédentes

  **Acceptance Criteria**:

  ```
  Scenario: Tous les services compilent
    Tool: Bash
    Steps:
      1. cd services/service-core && rm -rf dist && bun run build
      2. cd services/service-commercial && rm -rf dist && bun run build
      3. cd services/service-engagement && rm -rf dist && bun run build
      4. cd services/service-finance && rm -rf dist && bun run build
      5. cd services/service-logistics && rm -rf dist && bun run build
    Expected Result: 5x exit code 0
    Evidence: Output de chaque build

  Scenario: Métriques de qualité atteintes
    Tool: Bash
    Steps:
      1. find services -path "*/application/*/dtos/*.dto.ts" -not -path "*/node_modules/*" -not -path "*/dist/*" | wc -l → 0
      2. find services -path "*/application/*/ports/I*.ts" -not -path "*/node_modules/*" -not -path "*/dist/*" | wc -l → 0
      3. grep -rn "data: any" services/*/src/interfaces/grpc/controllers/ | wc -l → 0
      4. grep -rn "mapToProto\|mapToResponse" services/*/src/ --include="*.ts" | grep -v node_modules | grep -v dist | wc -l → 0
      5. grep -rn "from '@crm/proto" services/*/src/interfaces/grpc/controllers/ | wc -l → >0 dans chaque service
    Expected Result: Toutes les métriques à zéro sauf les imports proto > 0
    Evidence: Output de chaque commande
  ```

  **Commit**: YES
  - Message: `chore(all): final validation - all services aligned with proto-first architecture`
  - Files: Aucun changement de code (seulement dist/ rebuild)
  - Pre-commit: Toutes les vérifications ci-dessus

---

## Commit Strategy

| After Task | Message | Files | Verification |
|------------|---------|-------|--------------|
| 0 | `fix(proto): align keepCase convention between proto types and grpc loader` | shared-kernel/grpc config | `bun run build` service-logistics |
| 1 | `fix(proto): correct package.json export paths to match generated file locations` | packages/proto/package.json | Vérification existence des paths |
| 2 | `refactor(services): remove redundant DTOs, port interfaces and 1:1 repository interfaces` | 170+ fichiers supprimés | find commands |
| 3 | `refactor(logistics): use proto generated types directly in gRPC controllers` | controllers logistics | `bun run build` service-logistics |
| 4 | `refactor(engagement): use proto generated types directly in gRPC controllers` | controllers engagement | `bun run build` service-engagement |
| 5 | `refactor(core): use proto generated types directly in gRPC controllers` | controllers core | `bun run build` service-core |
| 6 | `refactor(commercial): use proto generated types directly in gRPC controllers` | controllers commercial | `bun run build` service-commercial |
| 7 | `refactor(finance): use proto generated types directly in gRPC controllers` | controllers finance | `bun run build` service-finance |
| 8 | `refactor(shared-kernel): remove unused gRPC client factory abstractions` | grpc-client.ts | `bun run build` shared-kernel |
| 9 | `fix(config): standardize docker naming and add typescript path aliases` | compose/*.yml, tsconfig*.json | `bun run build` service-logistics |
| 10 | `chore(all): final validation - all services aligned with proto-first architecture` | dist/ rebuilds | Full cross-service validation |

---

## Success Criteria

### Verification Commands
```bash
# Build all services
for svc in service-core service-commercial service-engagement service-finance service-logistics; do
  echo "=== Building $svc ===" && cd services/$svc && bun run build && cd ../..
done
# Expected: All exit 0

# Zero data: any
grep -rn "data: any" services/*/src/interfaces/grpc/controllers/ | wc -l
# Expected: 0

# Zero dead DTOs
find services -path "*/application/*/dtos/*.dto.ts" -not -path "*/node_modules/*" -not -path "*/dist/*" | wc -l
# Expected: 0

# Zero dead port interfaces
find services -path "*/application/*/ports/I*.ts" -not -path "*/node_modules/*" -not -path "*/dist/*" | wc -l
# Expected: 0

# Zero mapToProto/mapToResponse
grep -rn "mapToProto\|mapToResponse" services/*/src/ --include="*.ts" | grep -v node_modules | grep -v dist | wc -l
# Expected: 0

# Proto imports present in all services
for svc in service-core service-commercial service-engagement service-finance service-logistics; do
  count=$(grep -rn "from '@crm/proto" services/$svc/src/interfaces/grpc/controllers/ 2>/dev/null | wc -l)
  echo "$svc: $count proto imports"
done
# Expected: All > 0
```

### Final Checklist
- [x] All "Must Have" present (proto types, compilation, exports)
- [x] All "Must NOT Have" absent (no CQRS, no new DTOs, no new abstractions)
- [x] All 5 services build successfully
- [x] Proto package exports all resolve to existing files
- [x] Docker compose naming is consistent
- [x] TypeScript path aliases work
