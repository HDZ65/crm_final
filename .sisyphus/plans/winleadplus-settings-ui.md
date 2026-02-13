# WinLeadPlus Settings UI — Configuration Self-Service

## TL;DR

> **Quick Summary**: Ajouter un formulaire de configuration WinLeadPlus dans la section "Intégrations" de la modale Paramètres. Les admins/owners pourront configurer leur API WinLeadPlus (endpoint, token, intervalle de sync, test de connexion) en self-service.
> 
> **Deliverables**:
> - Proto: Ajouter `organisation_id` + `api_token` à `UpdateWinLeadPlusConfigRequest`, `has_api_token` à `WinLeadPlusConfig`
> - Backend: Fix SaveConfig controller pour supporter la création (organisationId), mapper `api_token` et `has_api_token`
> - Frontend gRPC client: Méthodes `getConfig`, `saveConfig`
> - Frontend server actions: `getWinLeadPlusConfig`, `saveWinLeadPlusConfig`
> - Frontend UI: Remplacer `IntegrationsSettings` stub par formulaire WinLeadPlus complet
> 
> **Estimated Effort**: Medium
> **Parallel Execution**: YES — 2 waves
> **Critical Path**: Task 1 (Proto) → Task 2 (Backend) → Task 3 (Frontend gRPC) → Task 4 (Server Actions) → Task 5 (UI)

---

## Context

### Original Request
L'utilisateur veut que les propriétaires/admins d'organisation puissent configurer leur intégration WinLeadPlus depuis les paramètres du CRM, au lieu d'avoir une auto-création invisible en base.

### Interview Summary
**Key Decisions**:
- **Emplacement UI**: Modale Paramètres → section "Intégrations" (déjà dans la nav)
- **Champs**: API Endpoint, Token API, Enable/Disable toggle, Intervalle de sync, Bouton "Tester la connexion"
- **Permissions**: Admins de l'org (owner + admin)
- **Pattern**: Suivre PaiementsSettings dans settings-dialog.tsx

### Metis Review
**Identified Gaps** (addressed):
- **CRITICAL — SaveConfig controller bloque la création**: Le controller exige `id` (update only), mais le service supporte `organisationId` pour la création. → Fix: accepter `id OR organisation_id`
- **Proto manque `api_token` et `organisation_id`**: `UpdateWinLeadPlusConfigRequest` n'a ni `organisation_id` ni `api_token`. → Ajouter les deux champs
- **Token sécurité**: Ne jamais exposer `api_token` au frontend. → Ajouter `has_api_token: bool` au message `WinLeadPlusConfig` response
- **Role check**: Seul `isOwner` (code 'owner') est hard-codé. Pas de preuve que 'admin' existe en base. → Utiliser `isOwner` comme PaiementsSettings (consistency)
- **Cron safe**: Le cron utilise `findAllEnabled()`, pas `getConfig()`. Pas besoin de toucher à l'auto-create.
- **Migration manquante**: `api_token` column existe dans l'entity mais pas dans les migrations. Dev OK (TypeORM sync), prod KO. → Ajouter migration.
- **TestConnection token**: Le RPC utilise le bearer token du metadata (token Keycloak user). Pour tester avant de sauvegarder, on pourrait ajouter `api_token` au proto TestConnectionRequest. → Ajouter `optional string api_token = 3`.

---

## Work Objectives

### Core Objective
Permettre aux owners d'organisation de configurer leur intégration WinLeadPlus depuis la modale Paramètres (section Intégrations).

### Concrete Deliverables
1. Migration: Colonne `api_token` dans `winleadplus_configs`
2. Proto: Champs `organisation_id`, `api_token` dans `UpdateWinLeadPlusConfigRequest` + `has_api_token` dans `WinLeadPlusConfig` + `api_token` dans `TestConnectionRequest`
3. Backend: Fix SaveConfig controller pour supporter création + mapper `api_token`/`has_api_token`
4. Frontend: gRPC client `getConfig`/`saveConfig` + server actions + UI complète dans IntegrationsSettings

### Definition of Done

**⚠️ NOTE**: Les critères ci-dessous sont des **tests fonctionnels** nécessitant l'application en cours d'exécution. Ils ne peuvent pas être vérifiés tant que Docker Desktop n'est pas démarré. Voir `.sisyphus/notepads/winleadplus-settings-ui/issues.md` pour détails.

**BLOCKER**: Docker Desktop n'est pas en cours d'exécution. Pour tester:
1. Démarrer Docker Desktop
2. Exécuter `make dev-up`
3. Accéder à http://localhost:3000
4. Vérifier manuellement les critères ci-dessous

- [ ] Owner ouvre Paramètres → Intégrations → voit formulaire WinLeadPlus
- [ ] Si pas de config existante: formulaire vide, bouton "Activer WinLeadPlus"
- [ ] Si config existante: formulaire pré-rempli avec valeurs actuelles
- [ ] Token masqué ("Token: ✓ configuré" si existant, champ vide sinon)
- [ ] "Tester la connexion" fonctionne avec l'endpoint saisi
- [ ] "Enregistrer" crée ou met à jour la config en base
- [ ] Toggle enabled/disabled fonctionnel
- [ ] Non-owner voit message "Accès réservé aux administrateurs"
- [x] Build frontend + backend: 0 erreurs (vérifié par compilation TypeScript)

### Must Have
- Formulaire WinLeadPlus dans section Intégrations de la modale Paramètres
- Support création ET mise à jour de config via SaveConfig
- Bouton "Tester la connexion" avec feedback visuel
- Protection par rôle owner
- Token jamais exposé au frontend (has_api_token boolean seulement)

### Must NOT Have (Guardrails)
- ❌ UI de sync logs / historique de synchronisation
- ❌ UI de mapping prospects/clients
- ❌ Bouton "Sync Now" (existe déjà sur la page clients)
- ❌ Chiffrement du token API (tech debt future)
- ❌ Custom hook `useWinLeadPlusConfig` — state inline dans le composant
- ❌ Modification de `getConfig()` auto-create (risque cron, pas nécessaire)
- ❌ Modification de `hasConfig()` ou du feature flag (déjà fait)
- ❌ Ajout de `isAdmin` au context org (pas de preuve que le code 'admin' existe)
- ❌ Page séparée /integrations — tout reste dans la modale paramètres
- ❌ Zod schema complexe — validation basique HTML (required, type=url) suffit

---

## Verification Strategy

> **UNIVERSAL RULE: ZERO HUMAN INTERVENTION**

### Test Decision
- **Automated tests**: None (user choice, consistent with previous plan)
- **Framework**: N/A

### Agent-Executed QA Scenarios (MANDATORY)

| Type | Tool | How Agent Verifies |
|------|------|-------------------|
| TypeScript compilation (backend) | Bash | `npx tsc --noEmit` — no errors |
| TypeScript compilation (frontend) | Bash | `npx tsc --noEmit` — no errors |
| Frontend build | Bash | `npm run build` — success |
| Proto generation | Bash | `npm run build` in packages/proto — success |
| UI rendering | Code review (grep) | Verify component structure matches spec |

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Start Immediately):
├── Task 1: Proto modifications (all changes in one batch) + regenerate
└── Task 2: DB Migration (api_token column)

Wave 2 (After Wave 1):
└── Task 3: Backend controller fix (SaveConfig accepts organisationId, maps api_token/has_api_token)

Wave 3 (After Wave 2):
├── Task 4: Frontend gRPC client (getConfig, saveConfig)
└── (Task 4 includes server actions since they're tightly coupled)

Wave 4 (After Wave 3):
└── Task 5: UI Component (IntegrationsSettings → WinLeadPlus config form)
```

### Dependency Matrix

| Task | Depends On | Blocks | Can Parallelize With |
|------|------------|--------|---------------------|
| 1 | None | 3, 4 | 2 |
| 2 | None | 3 | 1 |
| 3 | 1, 2 | 4 | None |
| 4 | 1, 3 | 5 | None |
| 5 | 4 | None | None (final) |

---

## TODOs

- [x] 1. Proto: Ajouter champs manquants et régénérer les types

  **What to do**:
  - Modifier `packages/proto/src/winleadplus/winleadplus.proto`:
    1. Ajouter à `UpdateWinLeadPlusConfigRequest`:
       ```protobuf
       message UpdateWinLeadPlusConfigRequest {
         string id = 1;
         optional string api_endpoint = 2;
         optional bool enabled = 3;
         optional int32 sync_interval_minutes = 4;
         optional string organisation_id = 5;
         optional string api_token = 6;
       }
       ```
    2. Ajouter à `WinLeadPlusConfig` (response):
       ```protobuf
       message WinLeadPlusConfig {
         string id = 1;
         string organisation_id = 2;
         string api_endpoint = 3;
         bool enabled = 4;
         int32 sync_interval_minutes = 5;
         optional string last_sync_at = 6;
         string created_at = 7;
         string updated_at = 8;
         bool has_api_token = 9;
       }
       ```
    3. Ajouter à `TestConnectionRequest`:
       ```protobuf
       message TestConnectionRequest {
         string organisation_id = 1;
         string api_endpoint = 2;
         optional string api_token = 3;
       }
       ```
  - Régénérer les types: `npm run build` dans `packages/proto/`
  - Copier les types frontend: `cp packages/proto/gen/ts-frontend/winleadplus/winleadplus/winleadplus.ts frontend/src/proto/winleadplus/winleadplus.ts`

  **Must NOT do**:
  - Ne PAS modifier les messages de sync/mapping
  - Ne PAS ajouter de nouveaux RPCs (SaveConfig existant suffit)
  - Ne PAS exposer `api_token` dans le message `WinLeadPlusConfig` (utiliser `has_api_token` boolean)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Modifications ciblées dans un seul fichier proto + régénération
  - **Skills**: [`microservice-maintainer`]
    - `microservice-maintainer`: Connaît le workflow proto de ce monorepo

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (avec Task 2)
  - **Blocks**: Tasks 3, 4
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `packages/proto/src/winleadplus/winleadplus.proto:25-30` — `UpdateWinLeadPlusConfigRequest` actuel à étendre
  - `packages/proto/src/winleadplus/winleadplus.proto:7-16` — `WinLeadPlusConfig` response à étendre
  - `packages/proto/src/winleadplus/winleadplus.proto:128-131` — `TestConnectionRequest` à étendre

  **Acceptance Criteria**:

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: Proto builds successfully
    Tool: Bash
    Steps:
      1. Run: cd packages/proto && npm run build
      2. Assert: Exit code 0
      3. grep "organisationId" packages/proto/gen/ts/winleadplus/winleadplus.ts | grep "UpdateWinLeadPlusConfigRequest" context
      4. grep "hasApiToken" packages/proto/gen/ts/winleadplus/winleadplus.ts
      5. grep "apiToken" packages/proto/gen/ts/winleadplus/winleadplus.ts | grep "TestConnectionRequest" context
    Expected Result: All new fields present in generated types
    Evidence: grep output

  Scenario: Frontend types copied and valid
    Tool: Bash
    Steps:
      1. cp packages/proto/gen/ts-frontend/winleadplus/winleadplus/winleadplus.ts frontend/src/proto/winleadplus/winleadplus.ts
      2. grep "hasApiToken" frontend/src/proto/winleadplus/winleadplus.ts
      3. grep "organisationId.*UpdateWinLeadPlusConfigRequest" frontend/src/proto/winleadplus/winleadplus.ts
    Expected Result: Frontend types include all new fields
    Evidence: grep output
  ```

  **Commit**: YES
  - Message: `feat(proto): add organisation_id, api_token, has_api_token fields to WinLeadPlus proto`
  - Files: `packages/proto/src/winleadplus/winleadplus.proto`, `packages/proto/gen/**`, `frontend/src/proto/winleadplus/winleadplus.ts`

---

- [x] 2. Migration: Ajouter colonne api_token à winleadplus_configs

  **What to do**:
  - Créer un nouveau fichier migration dans `services/service-commercial/src/migrations/`
  - Nom: `{timestamp}-AddApiTokenToWinLeadPlusConfigs.ts`
  - Contenu:
    ```typescript
    import { MigrationInterface, QueryRunner } from 'typeorm';
    
    export class AddApiTokenToWinLeadPlusConfigs{timestamp} implements MigrationInterface {
      public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
          ALTER TABLE winleadplus_configs
          ADD COLUMN IF NOT EXISTS api_token TEXT
        `);
      }
    
      public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
          ALTER TABLE winleadplus_configs
          DROP COLUMN IF EXISTS api_token
        `);
      }
    }
    ```
  - Vérifier le pattern des migrations existantes pour le naming et l'export

  **Must NOT do**:
  - Ne PAS modifier les migrations existantes
  - Ne PAS modifier l'entity `WinLeadPlusConfigEntity` (le champ `apiToken` existe déjà)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Un seul fichier à créer, pattern simple
  - **Skills**: [`microservice-maintainer`]
    - `microservice-maintainer`: Connaît le pattern de migration de ce service

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (avec Task 1)
  - **Blocks**: Task 3
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `services/service-commercial/src/migrations/` — Dossier migrations existant, suivre le même pattern de nommage
  - `services/service-commercial/src/domain/winleadplus/entities/winleadplus-config.entity.ts:22-23` — Champ `apiToken` déjà dans l'entity

  **Acceptance Criteria**:

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: Migration file exists with correct SQL
    Tool: Bash
    Steps:
      1. ls services/service-commercial/src/migrations/*ApiToken*
      2. Assert: Exactly one file found
      3. grep "api_token" services/service-commercial/src/migrations/*ApiToken*
      4. Assert: Contains ALTER TABLE and ADD COLUMN
      5. cd services/service-commercial && npx tsc --noEmit
      6. Assert: Exit code 0
    Expected Result: Migration file compiles and has correct SQL
    Evidence: File content + tsc output
  ```

  **Commit**: YES (group with Task 1 or separate)
  - Message: `feat(commercial): add api_token column migration for WinLeadPlus configs`
  - Files: `services/service-commercial/src/migrations/*ApiToken*.ts`

---

- [x] 3. Backend: Fix SaveConfig pour supporter création + mapper has_api_token

  **What to do**:
  - Modifier `services/service-commercial/src/domain/winleadplus/winleadplus.grpc-controller.ts`:
    1. Mettre à jour l'interface `UpdateWinLeadPlusConfigRequest` locale (L33-38) pour ajouter:
       ```typescript
       interface UpdateWinLeadPlusConfigRequest {
         id?: string;              // Était required, maintenant optional
         organisation_id?: string; // NOUVEAU — pour création
         api_endpoint?: string;
         enabled?: boolean;
         sync_interval_minutes?: number;
         api_token?: string;       // NOUVEAU
       }
       ```
    2. Modifier la méthode `saveConfig()` (L146-164):
       ```typescript
       @GrpcMethod('WinLeadPlusSyncService', 'SaveConfig')
       async saveConfig(data: UpdateWinLeadPlusConfigRequest) {
         if (!data.id && !data.organisation_id) {
           throw new RpcException({
             code: status.INVALID_ARGUMENT,
             message: 'id or organisation_id is required',
           });
         }
    
         const input: SaveWinLeadPlusConfigInput = {
           id: data.id,
           organisationId: data.organisation_id,
           apiEndpoint: data.api_endpoint,
           enabled: data.enabled,
           syncIntervalMinutes: data.sync_interval_minutes,
           apiToken: data.api_token,
         };
    
         const config = await this.syncService.saveConfig(input);
         return this.mapConfig(config);
       }
       ```
    3. Modifier `mapConfig()` (L194-214) pour ajouter `has_api_token`:
       ```typescript
       private mapConfig(config: {
         id: string;
         organisationId: string;
         apiEndpoint: string;
         enabled: boolean;
         syncIntervalMinutes: number;
         lastSyncAt: Date | null;
         createdAt: Date;
         updatedAt: Date;
         apiToken?: string | null;  // AJOUT
       }) {
         return {
           id: config.id,
           organisation_id: config.organisationId,
           api_endpoint: config.apiEndpoint,
           enabled: config.enabled,
           sync_interval_minutes: config.syncIntervalMinutes,
           last_sync_at: config.lastSyncAt ? config.lastSyncAt.toISOString() : undefined,
           created_at: config.createdAt.toISOString(),
           updated_at: config.updatedAt.toISOString(),
           has_api_token: !!(config.apiToken),  // AJOUT — boolean, jamais la valeur
         };
       }
       ```
    4. Optionnel — Modifier `TestConnection` (L104-118) pour supporter le token depuis la requête:
       ```typescript
       @GrpcMethod('WinLeadPlusSyncService', 'TestConnection')
       async testConnection(data: TestConnectionRequest, metadata?: RpcMetadata) {
         if (!data.organisation_id) {
           throw new RpcException({ ... });
         }
         const token = data.api_token || this.extractBearerToken(metadata);
         return this.syncService.testConnection(data.organisation_id, {
           token,
           apiEndpoint: data.api_endpoint,
         });
       }
       ```
       Et mettre à jour l'interface locale `TestConnectionRequest` pour ajouter `api_token?: string`.

  **Must NOT do**:
  - Ne PAS modifier `saveConfig()` dans le service (fonctionne déjà correctement)
  - Ne PAS modifier `getConfig()` auto-create behavior
  - Ne PAS modifier `hasConfig()` 
  - Ne PAS toucher à la logique de sync/cron

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Modifications ciblées dans un seul fichier controller
  - **Skills**: [`microservice-maintainer`]
    - `microservice-maintainer`: Connaît les patterns gRPC controller de ce service

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 2 (séquentiel après Wave 1)
  - **Blocks**: Task 4
  - **Blocked By**: Tasks 1, 2

  **References**:

  **Pattern References**:
  - `services/service-commercial/src/domain/winleadplus/winleadplus.grpc-controller.ts:146-164` — SaveConfig actuel à modifier
  - `services/service-commercial/src/domain/winleadplus/winleadplus.grpc-controller.ts:194-214` — mapConfig à étendre avec has_api_token
  - `services/service-commercial/src/domain/winleadplus/winleadplus.grpc-controller.ts:104-118` — TestConnection à modifier pour token
  - `services/service-commercial/src/domain/winleadplus/services/winleadplus-sync.service.ts:210-260` — saveConfig service (ne PAS modifier, juste comprendre le flow)
  - `services/service-commercial/src/domain/winleadplus/services/winleadplus-sync.service.ts:43-50` — SaveWinLeadPlusConfigInput interface (déjà correct)

  **Acceptance Criteria**:

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: Backend compiles with modified controller
    Tool: Bash
    Steps:
      1. cd services/service-commercial && npx tsc --noEmit
      2. Assert: Exit code 0
    Expected Result: No TypeScript errors
    Evidence: tsc output

  Scenario: SaveConfig no longer requires id as mandatory
    Tool: Bash (grep)
    Steps:
      1. grep "id is required" services/service-commercial/src/domain/winleadplus/winleadplus.grpc-controller.ts
      2. Assert: No match (old hard block removed)
      3. grep "id or organisation_id is required" services/service-commercial/src/domain/winleadplus/winleadplus.grpc-controller.ts
      4. Assert: Match found (new validation)
    Expected Result: Controller accepts both id and organisation_id
    Evidence: grep output

  Scenario: mapConfig includes has_api_token
    Tool: Bash (grep)
    Steps:
      1. grep "has_api_token" services/service-commercial/src/domain/winleadplus/winleadplus.grpc-controller.ts
      2. Assert: Match found in mapConfig
    Expected Result: Response includes has_api_token boolean
    Evidence: grep output

  Scenario: api_token mapped in saveConfig input
    Tool: Bash (grep)
    Steps:
      1. grep "apiToken.*data.api_token\|api_token.*apiToken" services/service-commercial/src/domain/winleadplus/winleadplus.grpc-controller.ts
      2. Assert: Match found in saveConfig method
    Expected Result: api_token is passed from request to service
    Evidence: grep output
  ```

  **Commit**: YES
  - Message: `feat(commercial): fix SaveConfig to support creation and map api_token/has_api_token`
  - Files: `services/service-commercial/src/domain/winleadplus/winleadplus.grpc-controller.ts`

---

- [x] 4. Frontend: gRPC client + server actions pour getConfig/saveConfig

  **What to do**:
  - **Ajouter au gRPC client** (`frontend/src/lib/grpc/clients/winleadplus.ts`):
    1. Importer les types nécessaires: `WinLeadPlusConfig`, `UpdateWinLeadPlusConfigRequest`
    2. Ajouter méthode `getConfig`:
       ```typescript
       getConfig: (request: GetWinLeadPlusConfigRequest): Promise<WinLeadPlusConfig> =>
         promisify<GetWinLeadPlusConfigRequest, WinLeadPlusConfig>(
           getSyncServiceClient(),
           "getConfig"
         )(request),
       ```
    3. Ajouter méthode `saveConfig`:
       ```typescript
       saveConfig: (request: UpdateWinLeadPlusConfigRequest): Promise<WinLeadPlusConfig> =>
         promisify<UpdateWinLeadPlusConfigRequest, WinLeadPlusConfig>(
           getSyncServiceClient(),
           "saveConfig"
         )(request),
       ```
    4. Re-exporter les types `WinLeadPlusConfig`, `UpdateWinLeadPlusConfigRequest`

  - **Ajouter server actions** (`frontend/src/actions/winleadplus.ts`):
    1. Importer `WinLeadPlusConfig`, `UpdateWinLeadPlusConfigRequest` depuis le gRPC client
    2. Ajouter `getWinLeadPlusConfig`:
       ```typescript
       export async function getWinLeadPlusConfig(params: {
         organisationId: string;
       }): Promise<ActionResult<WinLeadPlusConfig>> {
         try {
           const data = await winleadplus.getConfig({
             organisationId: params.organisationId,
           });
           return { data, error: null };
         } catch (err) {
           console.error("[getWinLeadPlusConfig] gRPC error:", err);
           return { data: null, error: err instanceof Error ? err.message : "Erreur lors de la récupération de la config WinLeadPlus" };
         }
       }
       ```
    3. Ajouter `saveWinLeadPlusConfig`:
       ```typescript
       export async function saveWinLeadPlusConfig(params: {
         id?: string;
         organisationId?: string;
         apiEndpoint?: string;
         enabled?: boolean;
         syncIntervalMinutes?: number;
         apiToken?: string;
       }): Promise<ActionResult<WinLeadPlusConfig>> {
         try {
           const data = await winleadplus.saveConfig({
             id: params.id || "",
             apiEndpoint: params.apiEndpoint,
             enabled: params.enabled,
             syncIntervalMinutes: params.syncIntervalMinutes,
             organisationId: params.organisationId,
             apiToken: params.apiToken,
           });
           return { data, error: null };
         } catch (err) {
           console.error("[saveWinLeadPlusConfig] gRPC error:", err);
           return { data: null, error: err instanceof Error ? err.message : "Erreur lors de la sauvegarde de la config WinLeadPlus" };
         }
       }
       ```

  **Must NOT do**:
  - Ne PAS créer de custom hook
  - Ne PAS modifier les actions/méthodes existantes
  - Ne PAS ajouter de revalidation de cache ici (pas de page à revalider pour les settings)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Ajout de méthodes suivant un pattern 100% établi
  - **Skills**: [`microservice-maintainer`]
    - `microservice-maintainer`: Connaît le pattern gRPC client + actions de ce frontend

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 3 (séquentiel après Wave 2)
  - **Blocks**: Task 5
  - **Blocked By**: Tasks 1, 3

  **References**:

  **Pattern References**:
  - `frontend/src/lib/grpc/clients/winleadplus.ts:35-65` — Pattern exact pour les méthodes gRPC (promisify)
  - `frontend/src/actions/winleadplus.ts:20-40` — Pattern exact pour les server actions (try/catch, ActionResult)
  - `frontend/src/actions/winleadplus.ts:87-104` — Autre exemple: testWinLeadPlusConnection

  **API/Type References**:
  - `frontend/src/proto/winleadplus/winleadplus.ts` — Types générés: `WinLeadPlusConfig`, `UpdateWinLeadPlusConfigRequest`, `GetWinLeadPlusConfigRequest`
  - `frontend/src/lib/types/common.ts` — Type `ActionResult<T>` pour le retour des actions

  **Acceptance Criteria**:

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: gRPC client has getConfig and saveConfig
    Tool: Bash (grep)
    Steps:
      1. grep "getConfig:" frontend/src/lib/grpc/clients/winleadplus.ts
      2. Assert: Match found
      3. grep "saveConfig:" frontend/src/lib/grpc/clients/winleadplus.ts
      4. Assert: Match found
    Expected Result: Both methods exist in gRPC client
    Evidence: grep output

  Scenario: Server actions exist
    Tool: Bash (grep)
    Steps:
      1. grep "export async function getWinLeadPlusConfig" frontend/src/actions/winleadplus.ts
      2. Assert: Match found
      3. grep "export async function saveWinLeadPlusConfig" frontend/src/actions/winleadplus.ts
      4. Assert: Match found
    Expected Result: Both server actions exported
    Evidence: grep output

  Scenario: TypeScript compiles
    Tool: Bash
    Steps:
      1. cd frontend && npx tsc --noEmit
      2. Assert: Exit code 0
    Expected Result: No TypeScript errors
    Evidence: tsc output
  ```

  **Commit**: YES
  - Message: `feat(frontend): add getConfig and saveConfig gRPC client methods and server actions`
  - Files: `frontend/src/lib/grpc/clients/winleadplus.ts`, `frontend/src/actions/winleadplus.ts`

---

- [x] 5. UI: Remplacer IntegrationsSettings par formulaire WinLeadPlus config

  **What to do**:
  - Remplacer le composant `IntegrationsSettings` dans `frontend/src/components/settings-dialog.tsx` (L653-662) :
    1. Supprimer le `AdminSectionLink` actuel
    2. Créer un vrai composant avec le pattern de `PaiementsSettings` (L383-545):

  **Structure du composant**:
  ```
  IntegrationsSettings
  ├── Guard: !activeOrganisation → message "Sélectionnez une organisation"
  ├── Guard: !isOwner → message "Accès réservé aux administrateurs"
  ├── Loading: isLoading → spinner/skeleton simple
  ├── Pas de config (hasConfig=false):
  │   ├── Description "Configurez votre intégration WinLeadPlus"
  │   ├── Formulaire vide: endpoint, token, intervalle
  │   └── Bouton "Activer WinLeadPlus"
  └── Config existante:
      ├── Card status: "WinLeadPlus ✓ Connecté" ou "WinLeadPlus — Désactivé"
      ├── Toggle enabled/disabled
      ├── Formulaire pré-rempli: endpoint, token masqué ("✓ Token configuré" ou champ vide)
      ├── Champ intervalle de sync (minutes)
      ├── Bouton "Tester la connexion" avec feedback (success ✓ / error ✗)
      └── Bouton "Enregistrer"
  ```

  **Détails d'implémentation**:
  - Utiliser `useOrganisation()` pour `activeOrganisation`, `isOwner`
  - State local: `config` (WinLeadPlusConfig | null), `isLoading`, `isSaving`, `isTesting`, `testResult`
  - `useEffect` pour charger la config au mount via `getWinLeadPlusConfig(orgId)`
  - Formulaire avec champs controlés (useState pour endpoint, token, interval, enabled)
  - Bouton "Tester": appelle `testWinLeadPlusConnection({ organisationId, apiEndpoint })`
  - Bouton "Enregistrer": appelle `saveWinLeadPlusConfig({ id?, organisationId?, ... })`
  - Toast Sonner pour feedback (succès/erreur) sur save et test
  - Token UX:
    - Si `config.hasApiToken === true`: afficher "✓ Token configuré" + bouton "Modifier"
    - Si modifié: afficher un champ password
    - Si pas de token: afficher un champ password vide
  - Ajouter l'import `Zap` icon (déjà importé dans la nav)

  **Must NOT do**:
  - Ne PAS créer de custom hook (state inline comme PaiementsSettings)
  - Ne PAS ajouter de Zod schema (validation HTML basique: required, type=url)
  - Ne PAS ajouter de sync logs ou sync button
  - Ne PAS toucher à la nav items (déjà configurée avec "Intégrations" + Zap icon)
  - Ne PAS modifier le switch case dans renderContent (déjà mappe "integrations" → IntegrationsSettings)

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: Composant UI complexe avec formulaire, états de loading, feedback visuel, guards de permission
  - **Skills**: [`frontend-ui-ux`]
    - `frontend-ui-ux`: Connaît les patterns Next.js, Shadcn UI, design de formulaires

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 4 (final)
  - **Blocks**: None
  - **Blocked By**: Task 4

  **References**:

  **Pattern References**:
  - `frontend/src/components/settings-dialog.tsx:383-545` — **PaiementsSettings** — Pattern EXACT à suivre: guards permission → sélecteur → cards → formulaire inline
  - `frontend/src/components/settings-dialog.tsx:234-288` — **PspAccountCard** — Pattern card avec statut connecté/déconnecté
  - `frontend/src/components/settings-dialog.tsx:290-381` — **PspConnectForm** — Pattern formulaire inline avec champs password, show/hide toggle
  - `frontend/src/components/settings-dialog.tsx:653-662` — **IntegrationsSettings actuel** — À remplacer complètement
  - `frontend/src/components/settings-dialog.tsx:443-459` — Guard isOwner avec message Lock — Pattern exact à réutiliser

  **API/Type References**:
  - `frontend/src/proto/winleadplus/winleadplus.ts:13-22` — `WinLeadPlusConfig` interface (avec `hasApiToken`)
  - `frontend/src/proto/winleadplus/winleadplus.ts:31-36` — `UpdateWinLeadPlusConfigRequest` interface
  - `frontend/src/contexts/organisation-context.tsx:114` — `isOwner` = `role?.code === 'owner'`
  - `frontend/src/actions/winleadplus.ts` — Server actions `getWinLeadPlusConfig`, `saveWinLeadPlusConfig`, `testWinLeadPlusConnection`

  **Component References**:
  - `frontend/src/components/ui/input.tsx` — Input component
  - `frontend/src/components/ui/button.tsx` — Button component
  - `frontend/src/components/ui/switch.tsx` — Switch (toggle) component
  - `frontend/src/components/ui/label.tsx` — Label component
  - `frontend/src/components/ui/select.tsx` — Select component (pour intervalle)
  - Sonner: `import { toast } from "sonner"` — Pour feedback save/test

  **Acceptance Criteria**:

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: IntegrationsSettings is no longer a stub
    Tool: Bash (grep)
    Steps:
      1. grep "AdminSectionLink" frontend/src/components/settings-dialog.tsx | grep -i "integr"
      2. Assert: No match (stub removed)
      3. grep "function IntegrationsSettings" frontend/src/components/settings-dialog.tsx
      4. Assert: Match found (component still exists)
      5. grep "isOwner" frontend/src/components/settings-dialog.tsx | grep -c ""
      6. Assert: Count increased (new isOwner guard)
    Expected Result: Component is a real form, not a redirect stub
    Evidence: grep output

  Scenario: WinLeadPlus config form elements exist
    Tool: Bash (grep)
    Steps:
      1. grep "api_endpoint\|apiEndpoint\|WinLeadPlus" frontend/src/components/settings-dialog.tsx | grep -c ""
      2. Assert: Multiple matches (endpoint input, labels, etc.)
      3. grep "Tester la connexion\|testWinLeadPlusConnection\|testConnection" frontend/src/components/settings-dialog.tsx
      4. Assert: Match found (test button)
      5. grep "saveWinLeadPlusConfig\|Enregistrer" frontend/src/components/settings-dialog.tsx
      6. Assert: Match found (save functionality)
      7. grep "hasApiToken\|Token configuré\|token" frontend/src/components/settings-dialog.tsx
      8. Assert: Match found (token handling)
    Expected Result: All form elements present
    Evidence: grep output

  Scenario: Permission guard exists
    Tool: Bash (grep)
    Steps:
      1. grep -A20 "function IntegrationsSettings" frontend/src/components/settings-dialog.tsx | grep "isOwner"
      2. Assert: Match found — permission guard in component
    Expected Result: isOwner check present in IntegrationsSettings
    Evidence: grep output

  Scenario: Frontend build succeeds
    Tool: Bash
    Steps:
      1. cd frontend && npm run build
      2. Assert: Exit code 0
    Expected Result: Production build passes
    Evidence: Build output

  Scenario: TypeScript compiles
    Tool: Bash
    Steps:
      1. cd frontend && npx tsc --noEmit
      2. Assert: Exit code 0
    Expected Result: No TypeScript errors
    Evidence: tsc output
  ```

  **Commit**: YES
  - Message: `feat(frontend): add WinLeadPlus config form in settings integrations section`
  - Files: `frontend/src/components/settings-dialog.tsx`

---

## Commit Strategy

| After Task | Message | Files | Verification |
|------------|---------|-------|--------------|
| 1 | `feat(proto): add organisation_id, api_token, has_api_token fields to WinLeadPlus proto` | Proto source + gen + frontend types | `npm run build` in packages/proto |
| 2 | `feat(commercial): add api_token column migration for WinLeadPlus configs` | Migration file | `tsc --noEmit` |
| 3 | `feat(commercial): fix SaveConfig to support creation and map api_token/has_api_token` | Controller | `tsc --noEmit` |
| 4 | `feat(frontend): add getConfig and saveConfig gRPC client methods and server actions` | gRPC client + actions | `tsc --noEmit` |
| 5 | `feat(frontend): add WinLeadPlus config form in settings integrations section` | settings-dialog.tsx | `npm run build` |

---

## Success Criteria

### Verification Commands
```bash
# Proto compiles
cd packages/proto && npm run build  # Expected: exit code 0

# Backend compiles
cd services/service-commercial && npx tsc --noEmit  # Expected: exit code 0

# Frontend compiles
cd frontend && npx tsc --noEmit  # Expected: exit code 0

# Frontend builds
cd frontend && npm run build  # Expected: exit code 0
```

### Final Checklist
- [x] Proto: `organisation_id`, `api_token` dans UpdateWinLeadPlusConfigRequest
- [x] Proto: `has_api_token` dans WinLeadPlusConfig response
- [x] Proto: `api_token` dans TestConnectionRequest
- [x] Migration: Fichier créé pour colonne api_token
- [x] Backend: SaveConfig accepte `organisation_id` (pas seulement `id`)
- [x] Backend: mapConfig retourne `has_api_token`
- [x] Backend: api_token mappé dans saveConfig input
- [x] Frontend: getConfig dans gRPC client
- [x] Frontend: saveConfig dans gRPC client
- [x] Frontend: getWinLeadPlusConfig server action
- [x] Frontend: saveWinLeadPlusConfig server action
- [x] UI: IntegrationsSettings n'est plus un stub
- [x] UI: Formulaire WinLeadPlus avec tous les champs
- [x] UI: Guard isOwner
- [x] UI: Bouton "Tester la connexion"
- [x] UI: Token masqué (has_api_token boolean, jamais la valeur)
- [x] Build: 0 erreurs frontend + backend
