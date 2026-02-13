# Association Gamme ↔ Société (societe_id FK)

## TL;DR

> **Quick Summary**: Ajouter un champ `societe_id` (FK nullable) sur l'entité Gamme pour permettre de filtrer le catalogue par société. Full-stack : proto → migration DB → backend NestJS → frontend Next.js. Le catalogue auto-filtre par la société sélectionnée dans le header.
>
> **Deliverables**:
> - Proto: `societe_id` ajouté à `Gamme`, `CreateGammeRequest`, `UpdateGammeRequest`, `ListGammesRequest`
> - Migration: Colonne `societe_id UUID NULL` + index sur table `gamme`
> - Backend: Entity + Service + Controller mis à jour pour filtrer/créer/éditer avec `societe_id`
> - Frontend: Actions + Hook + Catalogue page auto-filtre + dropdown société dans create/edit gamme dialog
>
> **Estimated Effort**: Medium (11 fichiers modifiés/créés, full-stack vertical slice)
> **Parallel Execution**: YES — 4 waves
> **Critical Path**: Task 1 (proto) → Task 2 (proto gen) → Task 3 (migration) → Task 4 (entity) → Task 5 (service+controller) → Task 6 (frontend actions+hook) → Task 7 (catalogue page UI) → Task 8 (Docker rebuild + QA)

---

## Context

### Original Request
L'utilisateur veut associer les gammes (ranges de produits) à des sociétés pour filtrer le catalogue. "dans une société il y a une gamme d'offres qui est vendu et pas forcement pour les autres société donc on peut filtrer"

### Interview Summary
**Key Discussions**:
- **Relation 1:N** : chaque gamme appartient à une seule société (pas N:N)
- **Full-stack** : accès au backend (service-commercial NestJS + TypeORM + PostgreSQL)
- **Auto-filtre** : le catalogue filtre automatiquement par la société sélectionnée dans le header
- **Dropdown société** dans le dialog de création/édition de gamme (pré-rempli avec société active)
- **Gammes existantes** : restent sans société (null), assignation manuelle
- **Import API** : gammes importées sans société (null)
- **Filtre strict** : quand Société A sélectionnée → uniquement gammes de A (gammes null cachées)
- **Vue 'Toutes'** : quand aucune société → voir toutes les gammes (y compris null)
- **Création sans société** : possible quand 'Toutes' sélectionné (dropdown vide par défaut)
- **GetTree** : hors scope (non utilisé par la page catalogue actuellement)

### Research Findings
- **6 entités existantes** utilisent déjà le pattern `societe_id` : ContratEntity, ApporteurEntity, BaremeCommissionEntity, ModeleDistributionEntity, PublicationProduitEntity, PartenaireCommercialSocieteEntity
- **Pattern identique** : `@Column({ name: 'societe_id', type: 'uuid', nullable: true })` — pas de FK constraint, pas de `@ManyToOne`
- **Page clients** suit le même pattern de refetch sur changement de société → modèle à suivre
- **Catalogue page** a déjà un scaffolding partiel : lit `activeSocieteId`, reset sur changement, `newGammeForm` a `societeId: ""`
- **Proto field numbers** : Gamme=14, CreateGammeRequest=7, UpdateGammeRequest=8, ListGammesRequest=4

### Metis Review
**Identified Gaps** (addressed):
- **Null visibility** : filtre strict (WHERE societe_id = :id) quand société sélectionnée, pas d'OR IS NULL
- **Create sans société** : dropdown vide par défaut quand 'Toutes' actif, gamme créée avec null
- **GetTree** : hors scope — non utilisé par la page catalogue
- **Proto empty string vs null** : utiliser pattern `data.societe_id || null` pour create, `data.societe_id === '' ? null : data.societe_id` pour update
- **SSR flash** : fetch all server-side, client refetch avec filtre — comportement accepté (même pattern que clients page)
- **Gamme hierarchy** : parent societe_id ≠ child societe_id est un cas accepté (pas de contrainte parent-enfant)

---

## Work Objectives

### Core Objective
Ajouter `societe_id` sur Gamme pour filtrer le catalogue par société, avec auto-filtre dans l'UI et dropdown dans les dialogs create/edit.

### Concrete Deliverables
- `packages/proto/src/products/products.proto` — societe_id sur 4 messages
- `services/service-commercial/src/migrations/1770830000000-AddSocieteIdToGamme.ts` — migration
- `services/service-commercial/src/domain/products/entities/gamme.entity.ts` — colonne entity
- `services/service-commercial/src/infrastructure/persistence/typeorm/repositories/products/gamme.service.ts` — filtre service
- `services/service-commercial/src/infrastructure/grpc/products/gamme.controller.ts` — mapping controller
- `frontend/src/proto/products/products.ts` — types regénérés
- `frontend/src/lib/grpc/clients/products.ts` — client gRPC mis à jour
- `frontend/src/actions/catalogue.ts` — actions serveur mises à jour
- `frontend/src/hooks/catalogue/use-gammes.ts` — hook mis à jour
- `frontend/src/app/(main)/catalogue/catalogue-page-client.tsx` — UI auto-filtre + dropdown

### Definition of Done
- [ ] Gammes filtrées par société active dans le catalogue
- [ ] Dropdown société dans le dialog create gamme (pré-rempli société active)
- [ ] Dropdown société dans le dialog edit gamme (valeur actuelle)
- [ ] Gammes null visibles uniquement en vue 'Toutes'
- [ ] Backend compile et tourne sans erreurs
- [ ] Migration exécutée avec succès
- [ ] Frontend compile sans erreurs TypeScript

### Must Have
- `societe_id UUID NULL` sur la table gamme avec index
- Filtre strict : `WHERE societe_id = :id` (pas d'OR IS NULL)
- Vue 'Toutes' : `WHERE organisation_id = :orgId` (pas de filtre société)
- Dropdown société dans create gamme dialog (optionnel, pré-rempli)
- Dropdown société dans edit gamme (permet de changer/vider)
- Auto-refetch quand société change dans le header

### Must NOT Have (Guardrails)
- ❌ Pas de relation `@ManyToOne` ou FK constraint — raw UUID comme les 6 autres entités
- ❌ Pas de modification sur les produits (produits filtrés par gamme, pas par société)
- ❌ Pas de filtre sur `GetTree` / `buildTree()` (hors scope)
- ❌ Pas de fix du tech debt proto (parent_id, type_gamme, niveau manquants dans CreateGammeRequest)
- ❌ Pas de modification du SSR `page.tsx` (fetch all server-side, client refetch)
- ❌ Pas de table de liaison N:N (c'est une FK simple)
- ❌ Pas de mutation des hooks useCreateGamme/useUpdateGamme (non utilisés par catalogue page)
- ❌ Pas de modification du header-societe-selector
- ❌ Pas de migration de données existantes (gammes restent null)

---

## Verification Strategy

> **UNIVERSAL RULE: ZERO HUMAN INTERVENTION**

### Test Decision
- **Infrastructure exists**: NO
- **Automated tests**: NO
- **Framework**: none

### Agent-Executed QA Scenarios (MANDATORY — ALL tasks)

Chaque tâche inclut des scénarios Bash / Playwright pour vérification automatisée.

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Start Immediately):
└── Task 1: Proto definition update (no dependencies)

Wave 2 (After Wave 1):
└── Task 2: Proto generation + verification

Wave 3 (After Wave 2):
├── Task 3: DB migration (independent of frontend)
├── Task 4: Entity update (depends: migration pattern, but can start in parallel)
└── Task 5: Service + Controller update (depends: entity pattern)

Wave 4 (After Wave 3):
├── Task 6: Frontend actions + hook + gRPC client
└── Task 7: Catalogue page UI (auto-filter + société dropdown)

Wave 5 (After Wave 4):
└── Task 8: Docker rebuild + Playwright QA

Critical Path: Task 1 → Task 2 → Task 5 → Task 6 → Task 7 → Task 8
```

### Dependency Matrix

| Task | Depends On | Blocks | Can Parallelize With |
|------|------------|--------|---------------------|
| 1 | None | 2 | None |
| 2 | 1 | 3, 4, 5, 6 | None |
| 3 | 2 | 8 | 4, 5 |
| 4 | 2 | 5 | 3 |
| 5 | 4 | 6, 7 | 3 |
| 6 | 2, 5 | 7 | None |
| 7 | 6 | 8 | None |
| 8 | 7 | None | None |

---

## TODOs

- [x] 1. Mettre à jour les messages Proto avec `societe_id`

  **What to do**:
  - Ajouter `optional string societe_id = 14;` au message `Gamme`
  - Ajouter `optional string societe_id = 7;` au message `CreateGammeRequest`
  - Ajouter `optional string societe_id = 8;` au message `UpdateGammeRequest`
  - Ajouter `optional string societe_id = 4;` au message `ListGammesRequest` (décaler pagination à 5 si besoin)
  - Vérifier que les numéros de champ ne sont pas déjà utilisés

  **Must NOT do**:
  - Ne PAS modifier GetGammeTreeRequest ou GetGammeTreeResponse
  - Ne PAS ajouter de service RPC supplémentaire (pas de ActiverPourSociete etc.)
  - Ne PAS modifier les messages Produit
  - Ne PAS modifier les numéros de champs existants

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: NO (first task)
  - **Parallel Group**: Wave 1 (solo)
  - **Blocks**: Task 2
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `packages/proto/src/products/products.proto:32-46` — Message Gamme actuel, dernier champ = 13 (updated_at) → ajouter field 14
  - `packages/proto/src/products/products.proto:48-55` — CreateGammeRequest actuel, dernier champ = 6 (ordre) → ajouter field 7
  - `packages/proto/src/products/products.proto:57-65` — UpdateGammeRequest actuel, dernier champ = 7 (actif) → ajouter field 8
  - `packages/proto/src/products/products.proto:67-72` — ListGammesRequest actuel, vérifier field numbers disponibles
  - `packages/proto/src/partenaires/partenaires.proto` — Pattern `optional string societe_id` utilisé dans d'autres messages pour référence

  **Acceptance Criteria**:

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: Proto fields added correctly
    Tool: Bash
    Steps:
      1. grep "societe_id" packages/proto/src/products/products.proto
      2. Assert: at least 4 occurrences (Gamme, Create, Update, List)
      3. grep "= 14" packages/proto/src/products/products.proto | grep societe
      4. Assert: one match in Gamme message
    Expected Result: societe_id field present in all 4 messages with correct field numbers
  ```

  **Commit**: YES (groups with Task 2)
  - Message: `feat(products): add societe_id field to Gamme proto messages`
  - Files: `packages/proto/src/products/products.proto`

---

- [x] 2. Regénérer les types TypeScript depuis les proto

  **What to do**:
  - Exécuter la commande de génération proto dans `packages/proto`
  - Vérifier que les types TypeScript générés contiennent `societeId` dans Gamme, CreateGammeRequest, UpdateGammeRequest, ListGammesRequest
  - Copier/synchroniser les types générés vers `frontend/src/proto/products/products.ts` si nécessaire (selon le workflow de génération du projet)

  **Must NOT do**:
  - Ne PAS modifier manuellement les fichiers générés
  - Ne PAS modifier d'autres packages proto

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 2 (solo)
  - **Blocks**: Tasks 3, 4, 5, 6
  - **Blocked By**: Task 1

  **References**:

  **Pattern References**:
  - `packages/proto/package.json` — Scripts de génération proto (chercher `proto:generate`, `generate`, ou `build`)
  - `frontend/src/proto/products/products.ts` — Fichier TypeScript cible qui doit contenir `societeId`
  - `packages/proto/buf.gen.yaml` ou `packages/proto/tsconfig.json` — Configuration de génération

  **Acceptance Criteria**:

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: Generated types contain societeId
    Tool: Bash
    Steps:
      1. grep -c "societeId" frontend/src/proto/products/products.ts
      2. Assert: at least 4 matches (interfaces + encode/decode functions)
      3. grep "societeId" frontend/src/proto/products/products.ts | head -10
      4. Assert: field present in Gamme, CreateGammeRequest, UpdateGammeRequest, ListGammesRequest interfaces
    Expected Result: TypeScript types include societeId in all relevant interfaces
  ```

  **Commit**: YES (groups with Task 1)
  - Message: `feat(products): add societe_id field to Gamme proto messages`
  - Files: `packages/proto/src/products/products.proto`, `frontend/src/proto/products/products.ts`

---

- [x] 3. Migration DB : ajouter colonne `societe_id` sur table `gamme`

  **What to do**:
  - Créer le fichier migration `services/service-commercial/src/migrations/1770830000000-AddSocieteIdToGamme.ts`
  - Implémenter `up()` : ALTER TABLE gamme ADD COLUMN societe_id UUID NULL + CREATE INDEX
  - Implémenter `down()` : DROP INDEX + DROP COLUMN
  - Exécuter la migration (si accès à la DB)

  **Must NOT do**:
  - Ne PAS ajouter de FK constraint (pattern du projet = raw UUID)
  - Ne PAS migrer les données existantes (gammes restent null)
  - Ne PAS modifier d'autres tables

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Tasks 4, 5)
  - **Blocks**: Task 8
  - **Blocked By**: Task 2

  **References**:

  **Pattern References**:
  - `services/service-commercial/src/migrations/1770797639000-AddCataloguePartnerColumns.ts` — Pattern migration ADD COLUMN avec ALTER TABLE
  - `services/service-commercial/src/migrations/1739050000000-EnrichModeleDistribution.ts` — Pattern addColumn + createIndex (si disponible)
  - `services/service-commercial/src/migrations/1739010000000-AddHierarchyToGamme.ts` — Exemple de migration sur table gamme

  **Acceptance Criteria**:

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: Migration file exists with correct structure
    Tool: Bash
    Steps:
      1. ls services/service-commercial/src/migrations/*AddSocieteIdToGamme*
      2. Assert: file exists
      3. grep "societe_id" services/service-commercial/src/migrations/*AddSocieteIdToGamme*
      4. Assert: ADD COLUMN and DROP COLUMN present
      5. grep "IDX" services/service-commercial/src/migrations/*AddSocieteIdToGamme*
      6. Assert: CREATE INDEX present
    Expected Result: Migration file creates nullable UUID column with index
  ```

  **Commit**: YES
  - Message: `feat(products): add societe_id column to gamme table`
  - Files: `services/service-commercial/src/migrations/1770830000000-AddSocieteIdToGamme.ts`

---

- [x] 4. Mettre à jour l'entité TypeORM `GammeEntity` avec `societeId`

  **What to do**:
  - Ajouter la colonne `societeId` à `GammeEntity` :
    ```typescript
    @Column({ name: 'societe_id', type: 'uuid', nullable: true })
    @Index()
    societeId: string | null;
    ```
  - Placer le champ après `organisationId` pour cohérence

  **Must NOT do**:
  - Ne PAS ajouter de `@ManyToOne` relation (pattern = raw UUID)
  - Ne PAS ajouter de FK constraint
  - Ne PAS modifier les relations existantes (parent, children, produits)

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Task 3)
  - **Blocks**: Task 5
  - **Blocked By**: Task 2

  **References**:

  **Pattern References**:
  - `services/service-commercial/src/domain/products/entities/gamme.entity.ts` — Entité Gamme actuelle, ajouter après organisationId
  - `services/service-commercial/src/domain/contrats/entities/contrat.entity.ts:67` — Pattern societe_id sur ContratEntity : `@Column({ name: 'societe_id', type: 'uuid', nullable: true })`
  - `services/service-commercial/src/domain/commerciaux/entities/apporteur.entity.ts:35` — Pattern societe_id sur ApporteurEntity

  **Acceptance Criteria**:

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: Entity has societeId column
    Tool: Bash
    Steps:
      1. grep "societeId" services/service-commercial/src/domain/products/entities/gamme.entity.ts
      2. Assert: property declaration present
      3. grep "societe_id" services/service-commercial/src/domain/products/entities/gamme.entity.ts
      4. Assert: @Column with name 'societe_id' present
      5. grep -A1 "societe_id" services/service-commercial/src/domain/products/entities/gamme.entity.ts | grep "nullable"
      6. Assert: nullable: true present
    Expected Result: societeId column declared as nullable UUID
  ```

  **Commit**: YES (groups with Task 5)
  - Message: `feat(products): add societe_id to GammeEntity and service filtering`
  - Files: `services/service-commercial/src/domain/products/entities/gamme.entity.ts`

---

- [x] 5. Mettre à jour le Service + Controller backend pour gérer `societe_id`

  **What to do**:
  
  **gamme.service.ts** — Ajouter filtre `societeId` à `findByOrganisation()` :
  ```typescript
  async findByOrganisation(organisationId: string, societeId?: string): Promise<GammeEntity[]> {
    const where: any = { organisationId };
    if (societeId) {
      where.societeId = societeId;
    }
    return this.gammeRepository.find({
      where,
      relations: ['parent', 'children'],
      order: { ordre: 'ASC' },
    });
  }
  ```

  **gamme.controller.ts** — Mettre à jour 4 méthodes :
  - **List** : passer `data.societe_id` au service
  - **Create** : mapper `societeId: data.societe_id || null`
  - **Update** : mapper `societeId: data.societe_id === '' ? null : data.societe_id` (permet de vider)
  - **mapToProto** : ajouter `societe_id: gamme.societeId || ''`

  **Must NOT do**:
  - Ne PAS modifier `GetTree` / `buildTree()` (hors scope)
  - Ne PAS modifier `Delete`, `Get` (pas besoin de societe_id)
  - Ne PAS ajouter de nouvelles méthodes RPC

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: NO (depends on Task 4)
  - **Parallel Group**: Wave 3 (after Task 4)
  - **Blocks**: Tasks 6, 7
  - **Blocked By**: Task 4

  **References**:

  **Pattern References**:
  - `services/service-commercial/src/infrastructure/persistence/typeorm/repositories/products/gamme.service.ts:38-44` — `findByOrganisation()` actuel — ajouter paramètre societeId
  - `services/service-commercial/src/infrastructure/grpc/products/gamme.controller.ts:106-125` — Méthode `list()` actuelle — passer societe_id au service
  - `services/service-commercial/src/infrastructure/grpc/products/gamme.controller.ts:20-60` — Méthode `create()` — mapper societeId
  - `services/service-commercial/src/infrastructure/grpc/products/gamme.controller.ts:62-104` — Méthode `update()` — mapper societeId
  - `services/service-commercial/src/infrastructure/grpc/products/gamme.controller.ts:130-155` — `mapToProto()` — ajouter societe_id
  - `services/service-commercial/src/infrastructure/grpc/commerciaux/apporteur.controller.ts:29,41` — Pattern empty string → null : `data.societe_id || null` pour create, `data.societe_id === '' ? null : data.societe_id` pour update
  - `services/service-commercial/src/infrastructure/persistence/typeorm/repositories/contrats/contrat.service.ts:261-298` — Pattern filtering avec `if (filters?.societeId) where.societeId = filters.societeId`

  **Acceptance Criteria**:

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: Service accepts societeId filter
    Tool: Bash
    Steps:
      1. grep "societeId" services/service-commercial/src/infrastructure/persistence/typeorm/repositories/products/gamme.service.ts
      2. Assert: parameter and filter present in findByOrganisation
    Expected Result: Service method filters by societeId when provided

  Scenario: Controller maps societe_id in Create/Update/List/mapToProto
    Tool: Bash
    Steps:
      1. grep -c "societe_id\|societeId" services/service-commercial/src/infrastructure/grpc/products/gamme.controller.ts
      2. Assert: at least 5 occurrences (create, update, list, mapToProto, import)
    Expected Result: All relevant controller methods handle societe_id

  Scenario: Backend compiles
    Tool: Bash
    Steps:
      1. cd services/service-commercial && npx tsc --noEmit
      2. Assert: Exit code 0
    Expected Result: No TypeScript compilation errors
  ```

  **Commit**: YES (groups with Task 4)
  - Message: `feat(products): add societe_id to GammeEntity and service filtering`
  - Files: `gamme.entity.ts`, `gamme.service.ts`, `gamme.controller.ts`

---

- [x] 6. Mettre à jour les actions serveur + hook frontend

  **What to do**:

  **frontend/src/actions/catalogue.ts** :
  - `getGammesByOrganisation()` : ajouter `societeId?: string` aux params, passer au gRPC client
  - `createGamme()` : ajouter `societeId?: string` aux params, passer au gRPC client
  - `updateGamme()` : ajouter `societeId?: string` aux params, passer au gRPC client

  **frontend/src/lib/grpc/clients/products.ts** :
  - Vérifier que `gammes.list()`, `gammes.create()`, `gammes.update()` passent les bons champs (les types sont regénérés, donc normalement auto)

  **frontend/src/hooks/catalogue/use-gammes.ts** :
  - Ajouter `societeId?: string` à `UseGammeFilters` (ou l'interface de filtres existante)
  - Passer `societeId` à `getGammesByOrganisation()` dans le hook

  **Must NOT do**:
  - Ne PAS modifier useCreateGamme/useUpdateGamme/useDeleteGamme (non utilisés par catalogue page)
  - Ne PAS modifier getProduitsByOrganisation (produits filtrés par gamme, pas société)
  - Ne PAS modifier d'autres actions

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 4 (solo)
  - **Blocks**: Task 7
  - **Blocked By**: Tasks 2, 5

  **References**:

  **Pattern References**:
  - `frontend/src/actions/catalogue.ts:33-51` — `getGammesByOrganisation()` actuel — ajouter `societeId?: string`
  - `frontend/src/actions/catalogue.ts:53-100` — `createGamme()` actuel — ajouter `societeId?: string`
  - `frontend/src/actions/catalogue.ts:102-140` — `updateGamme()` actuel — ajouter `societeId?: string`
  - `frontend/src/hooks/catalogue/use-gammes.ts` — Hook useGammes avec interface de filtres
  - `frontend/src/lib/grpc/clients/products.ts` — Client gRPC gammes, vérifier que les types sont à jour

  **Acceptance Criteria**:

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: Server actions accept societeId
    Tool: Bash
    Steps:
      1. grep "societeId" frontend/src/actions/catalogue.ts | grep -v "import\|//"
      2. Assert: at least 3 occurrences (getGammes, createGamme, updateGamme)
    Expected Result: All relevant actions accept societeId parameter

  Scenario: Hook supports societeId filter
    Tool: Bash
    Steps:
      1. grep "societeId" frontend/src/hooks/catalogue/use-gammes.ts
      2. Assert: at least 1 occurrence in filter interface
    Expected Result: useGammes hook passes societeId to server action
  ```

  **Commit**: YES
  - Message: `feat(products): add societe_id filtering to frontend actions and hook`
  - Files: `frontend/src/actions/catalogue.ts`, `frontend/src/hooks/catalogue/use-gammes.ts`, `frontend/src/lib/grpc/clients/products.ts`

---

- [x] 7. Mettre à jour la page Catalogue : auto-filtre + dropdown société dans create/edit gamme

  **What to do**:

  **A) Auto-filtre par société** dans `catalogue-page-client.tsx` :
  - Modifier `fetchGammes()` pour passer `activeSocieteId || undefined` à `getGammesByOrganisation()`
  - Ajouter `activeSocieteId` aux dépendances du `useCallback` de `fetchGammes()`
  - Le `useEffect` existant (lignes 254-259) qui reset sur changement de société doit aussi déclencher un refetch
  - Quand `activeSocieteId` est null → ne pas passer de filtre (toutes les gammes)
  - Quand `activeSocieteId` est défini → passer le filtre (gammes de cette société uniquement)

  **B) Dropdown société dans le dialog create gamme** :
  - Ajouter un `<Select>` / `<Combobox>` dans le formulaire de création de gamme
  - Charger la liste des sociétés via `listSocietesByOrganisation()` (déjà disponible dans le composant via props `initialSocietes`)
  - Pré-remplir avec `activeSocieteId` si défini, sinon vide
  - Label : "Société" avec option "Aucune société" (valeur vide)
  - Passer `societeId` à `createGamme()` action

  **C) Dropdown société dans le dialog edit gamme** :
  - Si un dialog edit gamme existe, ajouter le même dropdown
  - Pré-remplir avec la valeur actuelle de `gamme.societeId`
  - Permettre de vider (remettre à null)
  - Passer `societeId` à `updateGamme()` action

  **Must NOT do**:
  - Ne PAS modifier le `page.tsx` SSR (continue à fetch all gammes server-side)
  - Ne PAS modifier le HeaderSocieteSelector
  - Ne PAS modifier le CreateProductDialog / EditProductDialog
  - Ne PAS ajouter de nouveau composant page

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: [`frontend-ui-ux`]
    - `frontend-ui-ux`: Pour le dropdown société et l'intégration UI/UX

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 4 (after Task 6)
  - **Blocks**: Task 8
  - **Blocked By**: Task 6

  **References**:

  **Pattern References**:
  - `frontend/src/app/(main)/catalogue/catalogue-page-client.tsx:113` — `activeSocieteId` déjà lu depuis useSocieteStore
  - `frontend/src/app/(main)/catalogue/catalogue-page-client.tsx:147` — `newGammeForm` a déjà `societeId: ""`
  - `frontend/src/app/(main)/catalogue/catalogue-page-client.tsx:162-172` — `fetchGammes()` à modifier pour passer societeId
  - `frontend/src/app/(main)/catalogue/catalogue-page-client.tsx:254-259` — useEffect reset sur changement société (ajouter refetch)
  - `frontend/src/app/(main)/catalogue/catalogue-page-client.tsx:577-581` — CreateProductDialog reçoit déjà `defaultSocieteId`
  - `frontend/src/app/(main)/clients/clients-page-client.tsx:106-159` — Pattern de refetch sur changement société (clients page) — SUIVRE CE PATTERN
  - `frontend/src/stores/societe-store.ts` — Zustand store avec `activeSocieteId`
  - `frontend/src/components/ui/select.tsx` — Composant Select shadcn pour le dropdown

  **API/Type References**:
  - `frontend/src/proto/products/products.ts` — Type `Gamme` avec `societeId` (après génération Task 2)
  - `frontend/src/proto/organisations/organisations.ts` — Type `Societe` avec `id`, `raisonSociale`

  **Acceptance Criteria**:

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: fetchGammes passes activeSocieteId
    Tool: Bash
    Steps:
      1. grep -A10 "fetchGammes" frontend/src/app/(main)/catalogue/catalogue-page-client.tsx | grep "societeId\|activeSocieteId"
      2. Assert: activeSocieteId or societeId passed to getGammesByOrganisation
    Expected Result: Fetch function includes société filter

  Scenario: Create gamme dialog has société dropdown
    Tool: Bash
    Steps:
      1. grep -i "société\|societe" frontend/src/app/(main)/catalogue/catalogue-page-client.tsx | grep -i "select\|label\|dropdown"
      2. Assert: société selector present in create form
    Expected Result: Dropdown for société selection in create gamme dialog

  Scenario: Frontend compiles
    Tool: Bash
    Steps:
      1. cd frontend && npx next build
      2. Assert: Exit code 0
    Expected Result: No TypeScript or build errors
  ```

  **Commit**: YES
  - Message: `feat(catalogue): auto-filter gammes by société and add société dropdown to create/edit gamme`
  - Files: `frontend/src/app/(main)/catalogue/catalogue-page-client.tsx`

---

- [x] 8. Rebuild Docker frontend + vérification Playwright

  **What to do**:
  - Rebuild Docker image et container `alex-frontend`
  - Vérification Playwright :
    1. Catalogue page avec société sélectionnée → gammes filtrées
    2. Catalogue page 'Toutes' → toutes les gammes visibles
    3. Dialog create gamme → dropdown société visible et pré-rempli
  - Capturer screenshots comme evidence

  **Must NOT do**:
  - Ne PAS utiliser `docker compose`
  - Ne PAS modifier du code

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: [`playwright`]

  **Parallelization**:
  - **Can Run In Parallel**: NO (final task)
  - **Parallel Group**: Wave 5 (solo, final)
  - **Blocks**: None
  - **Blocked By**: Task 7

  **References**:

  **Pattern References**:
  - Commandes Docker utilisées dans les tasks précédentes :
    - `docker stop alex-frontend && docker rm alex-frontend`
    - `docker build -t crmdev-crm-frontend --target development -f frontend/Dockerfile .`
    - `docker run -d --name alex-frontend --network shared_dev_net -p 3070:3000 --restart unless-stopped ...`
  - Access URL: http://alex.local:8081/

  **Acceptance Criteria**:

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: Container running and healthy
    Tool: Bash
    Steps:
      1. docker ps --filter "name=alex-frontend" --format "{{.Names}} {{.Status}}"
      2. Assert: "Up" present
      3. docker logs alex-frontend --tail 5
      4. Assert: No crash errors
    Expected Result: Container running latest code

  Scenario: Catalogue page shows gammes filtered by société
    Tool: Playwright (playwright skill)
    Preconditions: alex-frontend running, user logged in, at least one société exists
    Steps:
      1. Navigate to http://alex.local:8081/catalogue
      2. Verify gammes sidebar is visible
      3. Select a société in the header if not already selected
      4. Wait for gammes to reload
      5. Screenshot: .sisyphus/evidence/task-8-catalogue-filtered.png
    Expected Result: Catalogue shows gammes filtered by active société
    Evidence: .sisyphus/evidence/task-8-catalogue-filtered.png

  Scenario: Create gamme dialog has société dropdown
    Tool: Playwright (playwright skill)
    Preconditions: User on catalogue page
    Steps:
      1. Click "Ajouter" or create gamme button
      2. Wait for dialog to open
      3. Verify société dropdown/select is visible
      4. Verify it is pre-filled with active société
      5. Screenshot: .sisyphus/evidence/task-8-create-gamme-societe.png
    Expected Result: Create gamme dialog shows société dropdown
    Evidence: .sisyphus/evidence/task-8-create-gamme-societe.png
  ```

  **Commit**: NO (rebuild only, no code changes)

---

## Commit Strategy

| After Task | Message | Files |
|------------|---------|-------|
| 1+2 | `feat(products): add societe_id field to Gamme proto messages` | `products.proto`, `products.ts` |
| 3 | `feat(products): add societe_id column to gamme table` | migration file |
| 4+5 | `feat(products): add societe_id to GammeEntity and service filtering` | `gamme.entity.ts`, `gamme.service.ts`, `gamme.controller.ts` |
| 6 | `feat(products): add societe_id filtering to frontend actions and hook` | `catalogue.ts`, `use-gammes.ts`, `products.ts` (gRPC client) |
| 7 | `feat(catalogue): auto-filter gammes by société and add société dropdown` | `catalogue-page-client.tsx` |

---

## Success Criteria

### Verification Commands
```bash
# Proto
grep -c "societe_id" packages/proto/src/products/products.proto  # Expected: ≥4

# Generated types
grep -c "societeId" frontend/src/proto/products/products.ts  # Expected: ≥4

# Migration
ls services/service-commercial/src/migrations/*SocieteIdToGamme*  # Expected: 1 file

# Entity
grep "societeId" services/service-commercial/src/domain/products/entities/gamme.entity.ts  # Expected: present

# Service
grep "societeId" services/service-commercial/src/infrastructure/persistence/typeorm/repositories/products/gamme.service.ts  # Expected: present

# Controller
grep "societe_id" services/service-commercial/src/infrastructure/grpc/products/gamme.controller.ts  # Expected: ≥4

# Actions
grep "societeId" frontend/src/actions/catalogue.ts | grep -v import  # Expected: ≥3

# Hook
grep "societeId" frontend/src/hooks/catalogue/use-gammes.ts  # Expected: ≥1

# Catalogue page
grep "societeId\|activeSocieteId" frontend/src/app/(main)/catalogue/catalogue-page-client.tsx | wc -l  # Expected: ≥5

# Docker
docker ps --filter "name=alex-frontend" --format "{{.Status}}"  # Expected: Up
```

### Final Checklist
- [ ] `societe_id` field in Gamme proto message (field 14)
- [ ] TypeScript types regenerated with `societeId`
- [ ] DB migration adds nullable UUID column + index
- [ ] GammeEntity has `societeId: string | null`
- [ ] Service filters by `societeId` when provided
- [ ] Controller maps `societe_id` in Create/Update/List/mapToProto
- [ ] Empty string → null conversion in controller (Create: `|| null`, Update: `=== '' ? null :`)
- [ ] `getGammesByOrganisation()` action accepts `societeId`
- [ ] `createGamme()` action accepts `societeId`
- [ ] `updateGamme()` action accepts `societeId`
- [ ] `useGammes` hook supports `societeId` filter
- [ ] Catalogue page auto-filters by `activeSocieteId`
- [ ] Catalogue page refetches when société changes
- [ ] Create gamme dialog has société dropdown (pre-filled with active)
- [ ] Gammes without société visible only in 'Toutes' view
- [ ] No products modified
- [ ] No GetTree modified
- [ ] Container rebuilt and healthy
