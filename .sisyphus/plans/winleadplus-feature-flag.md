# WinLeadPlus Feature Flag par Organisation

## TL;DR

> **Quick Summary**: Conditionner l'affichage des éléments WinLeadPlus (bouton Sync, option filtre source) à la présence d'une config WinLeadPlus active pour l'organisation. Les orgs sans config voient un CRM standard sans aucune trace de WinLeadPlus.
> 
> **Deliverables**:
> - Backend: Nouveau RPC `HasConfig` (sans auto-création)
> - Frontend gRPC client: Méthode `hasConfig`
> - Frontend server action: `hasWinLeadPlusConfig(orgId)`
> - Frontend UI: Affichage conditionnel du bouton Sync WLP et de l'option "WinLeadPlus" dans le filtre source
> 
> **Estimated Effort**: Quick
> **Parallel Execution**: NO - séquentiel (backend → frontend)
> **Critical Path**: Task 1 (Backend RPC) → Task 2 (Frontend conditionnel)

---

## Context

### Original Request
Le CRM est multi-tenant. WinLeadPlus est une intégration spécifique à une seule entreprise. Actuellement, le bouton "Sync WLP", l'option "WinLeadPlus" dans le filtre source sont visibles pour TOUTES les organisations. L'utilisateur veut garder un CRM "propre" pour les autres tenants.

### Interview Summary
**Key Decisions**:
- **Multi-tenant**: Oui, plusieurs orgs utilisent le CRM
- **Cas spécial unique**: WinLeadPlus est le seul cas custom
- **Objectif**: CRM propre redéployable sans trace de WinLeadPlus pour les autres orgs
- **Tests**: Non — QA agent verification only

### Metis Review
**Identified Gaps** (addressed):
- **CRITICAL — Backend auto-create**: `getConfig()` dans `winleadplus-sync.service.ts` auto-crée une config `enabled: true` pour toute org. Résolu → nouveau RPC `HasConfig` utilisant `findByOrganisationId()` sans auto-création.
- **Badge WLP sur lignes existantes**: Gardé tel quel — c'est data-driven (`source === "WinLeadPlus"`), pas config-driven. Factuel.
- **Filtre source quand WLP désactivé**: Cache l'option "WinLeadPlus" mais garde le filtre avec "Tous" / "CRM".
- **Zustand state persistence**: Si `filters.source === "WinLeadPlus"` et WLP désactivé, reset silencieux du filtre.
- **gRPC error handling**: Default `hasWinLeadPlus = false` en cas d'erreur (fail closed).

---

## Work Objectives

### Core Objective
Conditionner l'affichage de l'UI WinLeadPlus (bouton Sync WLP, option filtre "WinLeadPlus") à la présence d'une config active pour l'organisation courante.

### Concrete Deliverables
1. Backend: RPC `HasConfig` dans WinLeadPlusGrpcController
2. Frontend: gRPC client `hasConfig` + server action `hasWinLeadPlusConfig`
3. Frontend: Affichage conditionnel dans clients-page-client.tsx

### Definition of Done
- [x] Org AVEC config WLP: bouton "Sync WLP" visible, option "WinLeadPlus" dans filtre source visible
- [x] Org SANS config WLP: bouton "Sync WLP" absent du DOM, option "WinLeadPlus" absente du DOM
- [x] Badge WLP sur les lignes de clients existants: toujours visible (data-driven)
- [x] Erreur gRPC → CRM standard affiché (fail closed)
- [x] Aucun auto-création de config en base

### Must Have
- Nouveau RPC `HasConfig` sans auto-création de config
- Prop `hasWinLeadPlus: boolean` passée au composant client
- Affichage conditionnel du bouton Sync et de l'option filtre

### Must NOT Have (Guardrails)
- ❌ Context/Provider/Hook pour feature flag — c'est UN boolean prop, pas un framework
- ❌ Modification de columns.tsx — le badge est déjà data-conditionnel
- ❌ Loading state/skeleton pour le check config — c'est server-side
- ❌ Fetch dynamique des options du filtre source depuis le backend
- ❌ UI admin/settings pour WinLeadPlus
- ❌ Modification du Zustand store schema
- ❌ Modification de la page détail client (`clients/[id]/page.tsx`) — aucune trace WLP

---

## Verification Strategy

> **UNIVERSAL RULE: ZERO HUMAN INTERVENTION**

### Test Decision
- **Automated tests**: None (user choice)
- **Framework**: N/A

### Agent-Executed QA Scenarios (MANDATORY)

| Type | Tool | How Agent Verifies |
|------|------|-------------------|
| TypeScript compilation | Bash | `npx tsc --noEmit` — no errors |
| Frontend build | Bash | `npm run build` — success |
| UI conditionnel | Playwright | Navigate, assert DOM presence/absence |

---

## Execution Strategy

### Sequential Execution

```
Task 1: Backend — Add HasConfig RPC (no proto change needed, reuse GetConfig types)
    ↓
Task 2: Frontend — gRPC client + server action + conditionnel UI
```

### Dependency Matrix

| Task | Depends On | Blocks |
|------|------------|--------|
| 1 | None | 2 |
| 2 | 1 | None |

---

## TODOs

- [ ] 1. Backend: Add `HasConfig` RPC method to WinLeadPlus gRPC controller

  **What to do**:
  - Add new method `hasConfig` to `WinLeadPlusSyncService` in `services/service-commercial/src/domain/winleadplus/services/winleadplus-sync.service.ts`:
    ```typescript
    async hasConfig(organisationId: string): Promise<boolean> {
      const config = await this.configRepository.findByOrganisationId(organisationId);
      return config !== null && config.enabled;
    }
    ```
  - Add new gRPC method `HasConfig` in `services/service-commercial/src/domain/winleadplus/winleadplus.grpc-controller.ts`:
    ```typescript
    @GrpcMethod('WinLeadPlusSyncService', 'HasConfig')
    async hasConfig(data: GetWinLeadPlusConfigRequest) {
      if (!data.organisation_id) {
        throw new RpcException({ code: status.INVALID_ARGUMENT, message: 'organisation_id is required' });
      }
      const hasConfig = await this.syncService.hasConfig(data.organisation_id);
      return { enabled: hasConfig };
    }
    ```
  - Add `HasConfig` RPC to proto file `packages/proto/src/winleadplus/winleadplus.proto`:
    ```protobuf
    rpc HasConfig(GetWinLeadPlusConfigRequest) returns (HasWinLeadPlusConfigResponse);
    ```
    With new message:
    ```protobuf
    message HasWinLeadPlusConfigResponse {
      bool enabled = 1;
    }
    ```
  - Regenerate TypeScript types: `npm run build` in `packages/proto/`
  - Copy generated types to frontend: `frontend/src/proto/winleadplus/winleadplus.ts`

  **Must NOT do**:
  - Do NOT modify the existing `getConfig()` method (avoid breaking change)
  - Do NOT auto-create configs in `hasConfig()`
  - Do NOT modify any other proto files

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Small addition — 1 method in service, 1 method in controller, 1 RPC in proto, regenerate
  - **Skills**: [`microservice-maintainer`]
    - `microservice-maintainer`: Knows how to add gRPC methods in this DDD codebase

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Sequential (first)
  - **Blocks**: Task 2
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `services/service-commercial/src/domain/winleadplus/winleadplus.grpc-controller.ts:120-131` — Existing `GetConfig` method pattern to follow (but WITHOUT auto-create)
  - `services/service-commercial/src/domain/winleadplus/services/winleadplus-sync.service.ts:189-202` — Existing `getConfig()` that auto-creates. The new `hasConfig()` must NOT do this.
  - `services/service-commercial/src/infrastructure/persistence/typeorm/repositories/winleadplus/winleadplus-config.service.ts:20-22` — `findByOrganisationId()` returns null when no config exists. Use this directly.

  **API/Type References**:
  - `packages/proto/src/winleadplus/winleadplus.proto` — Add `HasConfig` RPC and `HasWinLeadPlusConfigResponse` message
  - `packages/proto/src/winleadplus/winleadplus.proto` — Reuse `GetWinLeadPlusConfigRequest` for the request type (already has `organisation_id`)

  **Acceptance Criteria**:

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: HasConfig returns false for org without config
    Tool: Bash
    Preconditions: service-commercial code compiles
    Steps:
      1. Run: cd services/service-commercial && npx tsc --noEmit
      2. Assert: Exit code 0
      3. Verify hasConfig method exists: grep "async hasConfig" src/domain/winleadplus/services/winleadplus-sync.service.ts
      4. Verify gRPC method exists: grep "HasConfig" src/domain/winleadplus/winleadplus.grpc-controller.ts
      5. Verify proto RPC exists: grep "HasConfig" packages/proto/src/winleadplus/winleadplus.proto
    Expected Result: Method exists, compiles, uses findByOrganisationId (no auto-create)
    Evidence: Compilation output + grep results

  Scenario: Proto regeneration succeeds
    Tool: Bash
    Preconditions: Proto file updated
    Steps:
      1. Run: cd packages/proto && npm run build
      2. Assert: Exit code 0
      3. Verify: grep "HasWinLeadPlusConfigResponse" packages/proto/gen/ts/winleadplus/winleadplus.ts
      4. Copy to frontend: cp gen/ts-frontend/winleadplus/winleadplus.ts ../../frontend/src/proto/winleadplus/winleadplus.ts
      5. Verify: grep "HasWinLeadPlusConfigResponse" frontend/src/proto/winleadplus/winleadplus.ts
    Expected Result: Types generated and copied
    Evidence: grep output
  ```

  **Commit**: YES
  - Message: `feat(commercial): add HasConfig RPC for WinLeadPlus feature flag check`
  - Files: `packages/proto/src/winleadplus/winleadplus.proto`, `services/service-commercial/src/domain/winleadplus/services/winleadplus-sync.service.ts`, `services/service-commercial/src/domain/winleadplus/winleadplus.grpc-controller.ts`, `packages/proto/gen/**`, `frontend/src/proto/winleadplus/winleadplus.ts`

---

- [ ] 2. Frontend: Conditional WinLeadPlus UI based on org config

  **What to do**:
  - **Add `hasConfig` to gRPC client** (`frontend/src/lib/grpc/clients/winleadplus.ts`):
    - Follow exact same pattern as `syncProspects` (line 34-38)
    - Import `GetWinLeadPlusConfigRequest` and `HasWinLeadPlusConfigResponse` from proto
    - Add: `hasConfig: (request) => promisify(getSyncServiceClient(), "hasConfig")(request)`
  - **Add server action** (`frontend/src/actions/winleadplus.ts`):
    ```typescript
    export async function hasWinLeadPlusConfig(params: {
      organisationId: string;
    }): Promise<boolean> {
      try {
        const data = await winleadplus.hasConfig({
          organisationId: params.organisationId,
        });
        return data.enabled ?? false;
      } catch {
        return false; // Fail closed — show clean CRM on error
      }
    }
    ```
  - **Update server page** (`frontend/src/app/(main)/clients/page.tsx`):
    - Import `hasWinLeadPlusConfig` from `@/actions/winleadplus`
    - Fetch in parallel with existing data: add to existing `Promise.all` or standalone call
    - Pass `hasWinLeadPlus={result}` prop to `<ClientsPageClient>`
  - **Update component props** (`frontend/src/app/(main)/clients/clients-page-client.tsx`):
    - Add `hasWinLeadPlus?: boolean` to `ClientsPageClientProps` interface (default false)
    - Wrap sync button (line ~451) in: `{hasWinLeadPlus && (...)}`
    - Wrap "WinLeadPlus" SelectItem (line ~554) in: `{hasWinLeadPlus && (...)}`
    - Add effect: if `!hasWinLeadPlus && filters.source === "WinLeadPlus"`, reset source filter to ""

  **Must NOT do**:
  - Do NOT create a React context, provider, or hook for this flag
  - Do NOT modify columns.tsx (badge is already data-conditional)
  - Do NOT add loading/skeleton states
  - Do NOT modify the Zustand store schema
  - Do NOT touch the client detail page (`clients/[id]/page.tsx`)
  - Do NOT add WLP admin/settings UI

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: ~30 lines of changes across 4 files, all following established patterns
  - **Skills**: [`frontend-ui-ux`]
    - `frontend-ui-ux`: Knows the Next.js server component → client component prop passing pattern

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Sequential (after Task 1)
  - **Blocks**: None
  - **Blocked By**: Task 1

  **References**:

  **Pattern References**:
  - `frontend/src/lib/grpc/clients/winleadplus.ts:34-38` — Exact pattern to follow for `hasConfig` method
  - `frontend/src/actions/winleadplus.ts:20-40` — Error handling pattern for server action (try/catch, return on error)
  - `frontend/src/app/(main)/clients/page.tsx` — Server component data fetching pattern (where to add the config check)
  - `frontend/src/app/(main)/clients/clients-page-client.tsx:58-61` — `ClientsPageClientProps` interface to extend
  - `frontend/src/app/(main)/clients/clients-page-client.tsx:451-454` — Sync WLP button to wrap conditionally
  - `frontend/src/app/(main)/clients/clients-page-client.tsx:543-558` — Source filter Select with "WinLeadPlus" option to wrap conditionally

  **API/Type References**:
  - `frontend/src/proto/winleadplus/winleadplus.ts` — `GetWinLeadPlusConfigRequest`, `HasWinLeadPlusConfigResponse` (from Task 1)
  - `frontend/src/app/(main)/clients/clients-page-client.tsx:64` — `useOrganisation()` hook providing `activeOrganisation.organisationId`

  **Acceptance Criteria**:

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: TypeScript compilation passes
    Tool: Bash
    Preconditions: Task 1 complete, proto types copied
    Steps:
      1. Run: cd frontend && npx tsc --noEmit
      2. Assert: Exit code 0, no errors
    Expected Result: All files compile cleanly
    Evidence: tsc output

  Scenario: Frontend build succeeds
    Tool: Bash
    Preconditions: TypeScript compiles
    Steps:
      1. Run: cd frontend && npm run build
      2. Assert: Exit code 0
    Expected Result: Production build succeeds
    Evidence: Build output

  Scenario: Conditional rendering verified in code
    Tool: Bash (grep)
    Preconditions: Code changes applied
    Steps:
      1. grep "hasWinLeadPlus" frontend/src/app/(main)/clients/clients-page-client.tsx
      2. Assert: Found in props interface AND in JSX conditional
      3. grep "hasWinLeadPlus" frontend/src/app/(main)/clients/page.tsx
      4. Assert: Found — prop passed to ClientsPageClient
      5. grep "hasConfig" frontend/src/lib/grpc/clients/winleadplus.ts
      6. Assert: Found — gRPC method exists
      7. grep "hasWinLeadPlusConfig" frontend/src/actions/winleadplus.ts
      8. Assert: Found — server action exists with "return false" fallback
    Expected Result: All conditional rendering plumbing in place
    Evidence: grep output

  Scenario: Sync button conditionally rendered
    Tool: Bash (grep)
    Steps:
      1. grep -A2 "hasWinLeadPlus.*Sync WLP" frontend/src/app/(main)/clients/clients-page-client.tsx
      2. Assert: Button wrapped in conditional
      3. grep -B1 "WinLeadPlus.*SelectItem\|SelectItem.*WinLeadPlus" frontend/src/app/(main)/clients/clients-page-client.tsx
      4. Assert: SelectItem wrapped in conditional
    Expected Result: Both UI elements conditionally rendered
    Evidence: grep output
  ```

  **Commit**: YES
  - Message: `feat(frontend): conditionally show WinLeadPlus UI based on org config`
  - Files: `frontend/src/lib/grpc/clients/winleadplus.ts`, `frontend/src/actions/winleadplus.ts`, `frontend/src/app/(main)/clients/page.tsx`, `frontend/src/app/(main)/clients/clients-page-client.tsx`

---

## Commit Strategy

| After Task | Message | Files | Verification |
|------------|---------|-------|--------------|
| 1 | `feat(commercial): add HasConfig RPC for WinLeadPlus feature flag check` | Proto + backend service + controller | `tsc --noEmit` passes |
| 2 | `feat(frontend): conditionally show WinLeadPlus UI based on org config` | Frontend gRPC client + action + page + component | `npm run build` passes |

---

## Success Criteria

### Verification Commands
```bash
# Backend compiles
cd services/service-commercial && npx tsc --noEmit  # Expected: exit code 0

# Proto compiles
cd packages/proto && npm run build  # Expected: exit code 0

# Frontend compiles
cd frontend && npx tsc --noEmit  # Expected: exit code 0

# Frontend builds
cd frontend && npm run build  # Expected: exit code 0
```

### Final Checklist
- [ ] HasConfig RPC exists and uses findByOrganisationId (no auto-create)
- [ ] Frontend hasConfig gRPC method works
- [ ] Server action returns false on error (fail closed)
- [ ] Sync WLP button wrapped in `{hasWinLeadPlus && ...}`
- [ ] WinLeadPlus SelectItem wrapped in `{hasWinLeadPlus && ...}`
- [ ] Badge in columns.tsx NOT touched (already data-conditional)
- [ ] No React context/provider/hook created
- [ ] No loading states added
- [ ] Client detail page NOT modified
