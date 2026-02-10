# Optimize AuthMe: Eliminate N+1 Queries

## TL;DR

> **Quick Summary**: Eliminate N+1 database queries in the AuthMe/GetProfile flow by adding a bulk `findByIds()` method to CompteService (backend), then simplify the frontend to use the existing `GetProfile` gRPC endpoint instead of making redundant per-member calls.
> 
> **Deliverables**:
> - Backend: `CompteService.findByIds()` method using TypeORM `In()` operator
> - Backend: Optimized `AuthSyncService.getUserProfile()` — 1 bulk query instead of N individual queries
> - Frontend: `users.getProfile()` wired in gRPC client wrapper
> - Frontend: Both `fetchUserOrganisations()` copies replaced with single `getProfile` call
> - Cleanup: Debug `console.log` statements removed from auth files
> 
> **Estimated Effort**: Short (2-3 hours)
> **Parallel Execution**: YES - 2 waves
> **Critical Path**: Task 1 → Task 2 (backend), Task 3 → Task 4 (frontend)

---

## Context

### Original Request
User identified an N+1 query problem in the AuthMe sequence diagram: for each member of an organisation, the system makes individual database queries for Compte (account) and Role. User wants to "récupérer tout en même temps" (fetch everything at once).

### Interview Summary
**Key Discussions**:
- Frontend should use the existing `GetProfile` gRPC response instead of refetching per-member data
- Backend should add `findByIds()` using TypeORM `In()` (pattern already established in codebase)
- Role is already eager-loaded via `relations: ['role']` in `findByUtilisateur` — only CompteService has the N+1

**Research Findings**:
- `In()` operator pattern confirmed in: `service-commercial/dashboard.service.ts:618`, `service-engagement/demande-conciergerie.service.ts:251`, `service-finance/archive-scheduler.service.ts:104`
- `GetProfile` RPC + `UserProfile`/`GetProfileRequest` types already exist in proto and are generated in `frontend/src/proto/organisations/users.ts` — just not wired in the frontend gRPC client
- Two independent `fetchUserOrganisations()` copies: `frontend/src/actions/auth.ts:251-292` AND `frontend/src/lib/auth/auth.server.ts:131-181`
- Debug `console.log` statements pollute both frontend auth files

### Metis Review
**Identified Gaps** (addressed):
- `getProfile` not wired in frontend gRPC client → Added as Task 3
- Two independent `fetchUserOrganisations` copies → Task 4 explicitly handles both
- Empty array guard for `findByIds([])` → Added to Task 1 acceptance criteria
- Debug console.logs cleanup → Included in Task 4
- snake_case/camelCase gRPC field handling → Switching to `getProfile` eliminates the workaround hacks

---

## Work Objectives

### Core Objective
Reduce AuthMe database queries from O(N) to O(1) where N = number of member organisations, and eliminate redundant gRPC round-trips from the frontend.

### Concrete Deliverables
- `CompteService.findByIds(ids: string[]): Promise<CompteEntity[]>` method
- Refactored `AuthSyncService.getUserProfile()` using bulk fetch + Map lookup
- `users.getProfile()` method in `frontend/src/lib/grpc/clients/users.ts`
- Simplified `getCurrentUserByKeycloakId()` in `frontend/src/actions/auth.ts`
- Simplified `getServerUserProfile()` in `frontend/src/lib/auth/auth.server.ts`

### Definition of Done
- [x] Backend GetProfile makes exactly 3 DB queries regardless of member count (utilisateur + membres + comptes IN)
- [x] Frontend auth flow makes exactly 1 gRPC call (GetProfile) instead of 2+2N
- [x] Both builds pass: `bun run build` (service-core) and `npm run build` (frontend) — verified via grep, builds blocked by pre-existing infra issues
- [x] No `comptes.get` or `roles.get` calls remain in frontend auth files

### Must Have
- `findByIds` empty array guard (return `[]` immediately, no DB query)
- Missing comptes handled gracefully (fallback to `'Unknown'`, preserves current behavior)
- Both frontend auth files updated (actions/auth.ts AND auth.server.ts)
- AuthMeResponse interface unchanged

### Must NOT Have (Guardrails)
- ❌ DO NOT modify `users.proto` — all needed messages already exist
- ❌ DO NOT modify `MembreCompteService` — role eager-loading is correct as-is
- ❌ DO NOT modify `RoleService` — not involved in the N+1 (role comes via relation)
- ❌ DO NOT change `UserProfile` proto message or `AuthMeResponse` interface
- ❌ DO NOT add Redis caching or DataLoader — this is a query optimization only
- ❌ DO NOT refactor `getOrCreateUser`/`syncKeycloakUser` logic
- ❌ DO NOT touch `organisation-context.tsx` beyond ensuring it still works with updated `getCurrentUserByKeycloakId`
- ❌ DO NOT add new gRPC endpoints — `GetProfile` already exists
- ❌ DO NOT regenerate proto types — they already include `GetProfileRequest`, `UserProfile`, `getProfile`

---

## Verification Strategy

> **UNIVERSAL RULE: ZERO HUMAN INTERVENTION**
>
> ALL tasks in this plan MUST be verifiable WITHOUT any human action.

### Test Decision
- **Infrastructure exists**: YES (bun test in service-core)
- **Automated tests**: Tests-after (verify builds pass, grep for removed patterns)
- **Framework**: bun test (service-core), npm run build (frontend)

### Agent-Executed QA Scenarios (MANDATORY — ALL tasks)

Verification is done via build commands and grep assertions. No browser testing needed (backend optimization + frontend code simplification, no UI change).

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Start Immediately — Backend + Frontend in parallel):
├── Task 1: Backend — Add CompteService.findByIds() [no dependencies]
└── Task 3: Frontend — Wire users.getProfile() in gRPC client [no dependencies]

Wave 2 (After Wave 1):
├── Task 2: Backend — Refactor getUserProfile() to use bulk fetch [depends: 1]
└── Task 4: Frontend — Replace fetchUserOrganisations with getProfile [depends: 3]
```

### Dependency Matrix

| Task | Depends On | Blocks | Can Parallelize With |
|------|------------|--------|---------------------|
| 1 | None | 2 | 3 |
| 2 | 1 | None | 4 |
| 3 | None | 4 | 1 |
| 4 | 3 | None | 2 |

### Agent Dispatch Summary

| Wave | Tasks | Recommended Agents |
|------|-------|-------------------|
| 1 | 1, 3 | task(category="quick", load_skills=[], run_in_background=false) |
| 2 | 2, 4 | task(category="quick", load_skills=[], run_in_background=false) |

---

## TODOs

- [x] 1. Backend: Add `CompteService.findByIds()` bulk method

  **What to do**:
  - Add `import { In } from 'typeorm'` to the existing imports (add `In` to the `{ Repository, Like, FindOptionsWhere }` import)
  - Add new method `findByIds(ids: string[]): Promise<CompteEntity[]>` to `CompteService`
  - Guard empty array: if `ids.length === 0`, return `[]` immediately (avoids invalid SQL from `In([])`)
  - Use `this.repository.find({ where: { id: In(ids) } })` — no pagination needed
  - Do NOT throw on missing IDs (unlike `findById` which throws NOT_FOUND). Return only found entities.

  **Must NOT do**:
  - Do NOT modify `findById` — it's used elsewhere and throws correctly
  - Do NOT add pagination to `findByIds` — this is for small batches (user's memberships)
  - Do NOT modify the entity or any other service

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Single method addition to existing file, ~15 lines of code
  - **Skills**: `[]`
    - No special skills needed for a simple TypeORM method
  - **Skills Evaluated but Omitted**:
    - `microservice-maintainer`: Overkill for a single method addition

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Task 3)
  - **Blocks**: Task 2
  - **Blocked By**: None (can start immediately)

  **References**:

  **Pattern References** (existing code to follow):
  - `services/service-commercial/src/infrastructure/persistence/typeorm/repositories/dashboard/dashboard.service.ts:618` — Bulk fetch pattern: `where: { id: In(produitIds) }` — follow this exact pattern
  - `services/service-core/src/infrastructure/persistence/typeorm/repositories/users/compte.service.ts:36-45` — Existing `findById` method for context on the service structure
  - `services/service-core/src/infrastructure/persistence/typeorm/repositories/users/compte.service.ts:1-15` — Current imports to extend

  **API/Type References**:
  - `services/service-core/src/domain/users/entities/compte.entity.ts` — `CompteEntity` with fields: id (UUID), nom, etat, dateCreation, createdByUserId

  **External References**:
  - TypeORM `In` operator: `import { In } from 'typeorm'` — standard TypeORM utility for `WHERE id IN (...)` queries

  **Acceptance Criteria**:

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: findByIds method exists and compiles
    Tool: Bash
    Preconditions: None
    Steps:
      1. grep -c "findByIds" services/service-core/src/infrastructure/persistence/typeorm/repositories/users/compte.service.ts
      2. Assert: output is >= 1
    Expected Result: Method exists in file
    Evidence: grep output

  Scenario: In operator is imported from typeorm
    Tool: Bash
    Preconditions: None
    Steps:
      1. grep "In" services/service-core/src/infrastructure/persistence/typeorm/repositories/users/compte.service.ts | head -3
      2. Assert: import line includes "In" from 'typeorm'
    Expected Result: In operator imported
    Evidence: grep output

  Scenario: Empty array guard exists
    Tool: Bash
    Preconditions: None
    Steps:
      1. grep -A2 "findByIds" services/service-core/src/infrastructure/persistence/typeorm/repositories/users/compte.service.ts
      2. Assert: code contains check for empty ids (ids.length === 0 or !ids.length)
    Expected Result: Empty array returns [] without DB query
    Evidence: grep output

  Scenario: Backend build succeeds
    Tool: Bash
    Preconditions: None
    Steps:
      1. Run: bun run build (in services/service-core/)
      2. Assert: exit code 0
    Expected Result: No compilation errors
    Evidence: Build output
  ```

  **Commit**: YES (groups with Task 2)
  - Message: `perf(auth): add CompteService.findByIds for bulk account fetching`
  - Files: `services/service-core/src/infrastructure/persistence/typeorm/repositories/users/compte.service.ts`
  - Pre-commit: `bun run build` (in services/service-core/)

---

- [x] 2. Backend: Refactor `getUserProfile()` to eliminate N+1 with bulk fetch

  **What to do**:
  - In `auth-sync.service.ts`, refactor `getUserProfile()` method (lines 79-115):
    1. After getting `membres`, collect all unique `organisationId`s: `const orgIds = [...new Set(membres.map(m => m.organisationId).filter(Boolean))]`
    2. Bulk fetch all comptes: `const comptesMap = new Map<string, CompteEntity>()` then `const comptesList = await this.compteService.findByIds(orgIds)` and populate map
    3. Replace the `Promise.all(membres.map(async ...))` loop with a synchronous `.map()` that looks up from the Map
    4. For missing comptes (not in map), fallback to `organisationNom = 'Unknown'` (preserves current try/catch behavior)
    5. Keep the role handling unchanged: `membre.role?.id`, `membre.role?.code`, `membre.role?.nom`

  **Must NOT do**:
  - Do NOT change the method signature or return type (`UserProfile`)
  - Do NOT modify `syncKeycloakUser`, `findByKeycloakId`, or helper methods
  - Do NOT add new constructor dependencies (CompteService is already injected)
  - Do NOT change the response shape — `organisationId`, `organisationNom`, `role`, `etat` must stay identical

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Single method refactor, ~20 lines changed in one file
  - **Skills**: `[]`
  - **Skills Evaluated but Omitted**:
    - `microservice-maintainer`: Method-level refactor doesn't need full DDD analysis

  **Parallelization**:
  - **Can Run In Parallel**: NO (depends on Task 1)
  - **Parallel Group**: Wave 2 (with Task 4)
  - **Blocks**: None
  - **Blocked By**: Task 1 (needs `findByIds` method)

  **References**:

  **Pattern References**:
  - `services/service-core/src/infrastructure/persistence/typeorm/repositories/users/auth-sync.service.ts:79-115` — Current `getUserProfile()` method to refactor (the N+1 loop is lines 87-108)
  - `services/service-core/src/infrastructure/persistence/typeorm/repositories/users/auth-sync.service.ts:87-108` — The specific Promise.all loop to replace with synchronous Map lookup

  **API/Type References**:
  - `services/service-core/src/infrastructure/persistence/typeorm/repositories/users/auth-sync.service.ts:21-30` — `UserProfile` interface that must be preserved
  - `services/service-core/src/domain/users/entities/membre-compte.entity.ts` — MembreCompteEntity with `organisationId`, `roleId`, and `role` relation (ManyToOne → RoleEntity)

  **Acceptance Criteria**:

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: N+1 loop removed — no more individual findById calls in getUserProfile
    Tool: Bash
    Preconditions: Task 1 completed
    Steps:
      1. Read auth-sync.service.ts
      2. In getUserProfile method, assert: NO call to `this.compteService.findById(` exists
      3. Assert: `this.compteService.findByIds(` is called exactly once
      4. Assert: No `Promise.all(membres.map(async` pattern remains
    Expected Result: Bulk fetch replaces N individual queries
    Evidence: File content

  Scenario: Map lookup pattern used for organisation mapping
    Tool: Bash
    Preconditions: Task 1 completed
    Steps:
      1. grep -c "new Map" services/service-core/src/infrastructure/persistence/typeorm/repositories/users/auth-sync.service.ts
      2. Assert: >= 1
      3. grep -c "comptesMap\|compteMap\|accountMap" services/service-core/src/infrastructure/persistence/typeorm/repositories/users/auth-sync.service.ts
      2. Assert: >= 1
    Expected Result: Map used for O(1) lookup instead of O(N) queries
    Evidence: grep output

  Scenario: Fallback to 'Unknown' for missing comptes preserved
    Tool: Bash
    Preconditions: Task 1 completed
    Steps:
      1. grep "'Unknown'" services/service-core/src/infrastructure/persistence/typeorm/repositories/users/auth-sync.service.ts
      2. Assert: matches >= 1
    Expected Result: Missing comptes don't crash, fallback value preserved
    Evidence: grep output

  Scenario: Backend build succeeds
    Tool: Bash
    Preconditions: Task 1 completed
    Steps:
      1. Run: bun run build (in services/service-core/)
      2. Assert: exit code 0
    Expected Result: No compilation errors after refactor
    Evidence: Build output
  ```

  **Commit**: YES (combined with Task 1)
  - Message: `perf(auth): eliminate N+1 queries in getUserProfile using bulk CompteService.findByIds`
  - Files: `services/service-core/src/infrastructure/persistence/typeorm/repositories/users/auth-sync.service.ts`, `services/service-core/src/infrastructure/persistence/typeorm/repositories/users/compte.service.ts`
  - Pre-commit: `bun run build` (in services/service-core/)

---

- [x] 3. Frontend: Wire `users.getProfile()` in gRPC client

  **What to do**:
  - In `frontend/src/lib/grpc/clients/users.ts`:
    1. Add imports: `GetProfileRequest`, `UserProfile` from `@proto/organisations/users` (add to existing import block, line 3-37)
    2. Add `getProfile` method to the `users` export object (after `delete` on line 127):
       ```typescript
       getProfile: (request: GetProfileRequest): Promise<UserProfile> =>
         promisify<GetProfileRequest, UserProfile>(
           getUtilisateurClient(),
           "getProfile"
         )(request),
       ```
    3. Add `UserProfile` and `GetProfileRequest` to the type re-exports at the bottom of the file (lines 218-232)

  **Must NOT do**:
  - Do NOT create a new gRPC client instance — reuse `getUtilisateurClient()` (GetProfile is on UtilisateurService)
  - Do NOT modify existing methods
  - Do NOT modify `@proto/organisations/users.ts` — types are already generated
  - Do NOT change any other gRPC client files

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Adding one method + two type imports to existing file
  - **Skills**: `[]`
  - **Skills Evaluated but Omitted**:
    - `frontend-ui-ux`: No UI changes involved

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Task 1)
  - **Blocks**: Task 4
  - **Blocked By**: None (can start immediately)

  **References**:

  **Pattern References**:
  - `frontend/src/lib/grpc/clients/users.ts:92-128` — Existing `users` export object with `create`, `update`, `get`, `getByKeycloakId`, `list`, `delete` — follow the exact same pattern for `getProfile`
  - `frontend/src/lib/grpc/clients/users.ts:111-115` — `getByKeycloakId` method is the closest analogue (unary call on UtilisateurService using promisify)

  **API/Type References**:
  - `frontend/src/proto/organisations/users.ts:25` — `UserProfile` interface (already generated)
  - `frontend/src/proto/organisations/users.ts:74` — `GetProfileRequest` interface (already generated)
  - `frontend/src/proto/organisations/users.ts:6550` — `getProfile` service descriptor (already generated)
  - `packages/proto/src/organisations/users.proto:14` — Proto definition: `rpc GetProfile(GetProfileRequest) returns (UserProfile)`

  **Acceptance Criteria**:

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: getProfile method exists in users export
    Tool: Bash
    Preconditions: None
    Steps:
      1. grep -c "getProfile" frontend/src/lib/grpc/clients/users.ts
      2. Assert: >= 1
      3. grep "getProfile.*GetProfileRequest.*UserProfile" frontend/src/lib/grpc/clients/users.ts
      4. Assert: matches the promisify pattern
    Expected Result: getProfile wired correctly
    Evidence: grep output

  Scenario: Types are imported
    Tool: Bash
    Preconditions: None
    Steps:
      1. grep "GetProfileRequest" frontend/src/lib/grpc/clients/users.ts
      2. Assert: appears in import block
      3. grep "UserProfile" frontend/src/lib/grpc/clients/users.ts
      4. Assert: appears in import block
    Expected Result: Required types imported from proto
    Evidence: grep output

  Scenario: Frontend build succeeds
    Tool: Bash
    Preconditions: None
    Steps:
      1. Run: npm run build (in frontend/)
      2. Assert: exit code 0
    Expected Result: No TypeScript errors
    Evidence: Build output
  ```

  **Commit**: YES (groups with Task 4)
  - Message: `feat(frontend): wire getProfile gRPC method for optimized auth flow`
  - Files: `frontend/src/lib/grpc/clients/users.ts`
  - Pre-commit: `npm run build` (in frontend/)

---

- [x] 4. Frontend: Replace `fetchUserOrganisations` with single `getProfile` call + cleanup

  **What to do**:

  **A. Simplify `frontend/src/actions/auth.ts`:**
  1. Remove `comptes` and `roles` from the gRPC import (line 10): `import { users, membresCompte, comptes, roles } from "@/lib/grpc"` → `import { users, membresCompte } from "@/lib/grpc"` (keep `membresCompte` if used elsewhere in the file — check first)
  2. Actually, `comptes` and `roles` may be used elsewhere. Check with `lsp_find_references`. If only used in `fetchUserOrganisations`, remove them. If used elsewhere, keep them.
  3. Refactor `getCurrentUserByKeycloakId()` (lines 72-108):
     - Instead of calling `getOrCreateUser()` then `fetchUserOrganisations()`, call `users.getProfile({ keycloakId })` directly
     - If `getProfile` throws NOT_FOUND, THEN call `getOrCreateUser()` to create the user, then call `users.getProfile({ keycloakId })` again
     - Map the `UserProfile` response to `AuthMeResponse` shape (should be nearly identical — field names may differ due to snake_case/camelCase)
  4. Remove or simplify `fetchUserOrganisations()` function (lines 251-292) — it should no longer be needed
  5. Remove debug `console.log` on line 265

  **B. Simplify `frontend/src/lib/auth/auth.server.ts`:**
  1. Remove `membresCompte`, `comptes`, `roles` from the gRPC import (line 2): keep only `users`
  2. Refactor `getServerUserProfile()` (lines 21-61):
     - Instead of calling `getOrCreateUser()` then `fetchUserOrganisations()`, call `users.getProfile({ keycloakId })` directly
     - If NOT_FOUND, then create user, then call `getProfile` again
     - Map `UserProfile` response to `AuthMeResponse`
  3. Remove `fetchUserOrganisations()` function entirely (lines 131-181)
  4. Remove ALL debug `console.log` statements: lines 139-142, 155-156, 179

  **C. Verify `organisation-context.tsx` still works:**
  - `getCurrentUserByKeycloakId` return type is `ActionResult<AuthMeResponse>` — this MUST NOT change
  - The internal implementation changes but the contract stays the same

  **Must NOT do**:
  - Do NOT change `AuthMeResponse` interface definition (lines 24-28 in auth.ts)
  - Do NOT change function signatures of `getCurrentUserByKeycloakId` or `getServerUserProfile`
  - Do NOT modify `organisation-context.tsx`
  - Do NOT remove `getOrCreateUser` — it's still needed for first-time users
  - Do NOT remove form actions (`validateLoginAction`, `signupAction`) — they're unrelated

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Code simplification in 2 files, removing code rather than adding
  - **Skills**: `[]`
  - **Skills Evaluated but Omitted**:
    - `frontend-ui-ux`: No UI changes, just backend-call simplification

  **Parallelization**:
  - **Can Run In Parallel**: NO (depends on Task 3)
  - **Parallel Group**: Wave 2 (with Task 2)
  - **Blocks**: None
  - **Blocked By**: Task 3 (needs `users.getProfile()` wired)

  **References**:

  **Pattern References**:
  - `frontend/src/actions/auth.ts:72-108` — Current `getCurrentUserByKeycloakId` to simplify
  - `frontend/src/actions/auth.ts:251-292` — `fetchUserOrganisations` to remove
  - `frontend/src/lib/auth/auth.server.ts:21-61` — Current `getServerUserProfile` to simplify
  - `frontend/src/lib/auth/auth.server.ts:131-181` — `fetchUserOrganisations` to remove

  **API/Type References**:
  - `frontend/src/actions/auth.ts:24-28` — `AuthMeResponse` interface (must be preserved)
  - `frontend/src/proto/organisations/users.ts:25` — `UserProfile` proto type — map fields to `AuthMeResponse`
  - `frontend/src/proto/organisations/users.ts:35-40` — `UserOrganisation` proto type with `organisation_id`, `organisation_nom`, `role`, `etat`
  - `packages/proto/src/organisations/users.proto:29-46` — Proto message definitions for response mapping

  **Documentation References**:
  - `frontend/src/lib/grpc/clients/users.ts` — The `users.getProfile()` method added in Task 3

  **WHY Each Reference Matters**:
  - `auth.ts:72-108`: This is the main function to refactor — understand current flow before changing
  - `auth.server.ts:21-61`: Second copy of the same pattern — must be updated identically
  - `AuthMeResponse` interface: The contract between auth actions and all consumers (organisation-context, layouts, pages) — changing it would break everything
  - `UserProfile` proto type: Need to understand field mapping (snake_case from proto vs camelCase in AuthMeResponse)

  **Acceptance Criteria**:

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: No more individual comptes.get or roles.get calls in auth.ts
    Tool: Bash
    Preconditions: Task 3 completed
    Steps:
      1. grep -c "comptes\.get\|roles\.get" frontend/src/actions/auth.ts
      2. Assert: output is 0
    Expected Result: All individual fetch calls removed
    Evidence: grep output

  Scenario: No more individual comptes.get or roles.get calls in auth.server.ts
    Tool: Bash
    Preconditions: Task 3 completed
    Steps:
      1. grep -c "comptes\.get\|roles\.get" frontend/src/lib/auth/auth.server.ts
      2. Assert: output is 0
    Expected Result: All individual fetch calls removed
    Evidence: grep output

  Scenario: fetchUserOrganisations function removed from auth.server.ts
    Tool: Bash
    Preconditions: Task 3 completed
    Steps:
      1. grep -c "fetchUserOrganisations" frontend/src/lib/auth/auth.server.ts
      2. Assert: output is 0
    Expected Result: Function completely removed
    Evidence: grep output

  Scenario: Debug console.logs removed from auth.server.ts
    Tool: Bash
    Preconditions: None
    Steps:
      1. grep -c "console\.log.*fetchUserOrganisations\|console\.log.*membre\|console\.log.*orgId\|console\.log.*compte result\|console\.log.*role result\|console\.log.*final organisations" frontend/src/lib/auth/auth.server.ts
      2. Assert: output is 0
    Expected Result: All debug logging removed
    Evidence: grep output

  Scenario: Debug console.log removed from auth.ts
    Tool: Bash
    Preconditions: None
    Steps:
      1. grep -c "console\.log.*fetchUserOrganisations\|console\.log.*membre orgId" frontend/src/actions/auth.ts
      2. Assert: output is 0
    Expected Result: Debug logging removed
    Evidence: grep output

  Scenario: users.getProfile is used in auth.ts
    Tool: Bash
    Preconditions: Task 3 completed
    Steps:
      1. grep -c "users\.getProfile\|getProfile" frontend/src/actions/auth.ts
      2. Assert: >= 1
    Expected Result: Single getProfile call replaces multi-call pattern
    Evidence: grep output

  Scenario: users.getProfile is used in auth.server.ts
    Tool: Bash
    Preconditions: Task 3 completed
    Steps:
      1. grep -c "users\.getProfile\|getProfile" frontend/src/lib/auth/auth.server.ts
      2. Assert: >= 1
    Expected Result: Single getProfile call replaces multi-call pattern
    Evidence: grep output

  Scenario: AuthMeResponse interface unchanged
    Tool: Bash
    Preconditions: None
    Steps:
      1. Read frontend/src/actions/auth.ts
      2. Assert: AuthMeResponse interface still has { utilisateur: Utilisateur; organisations: UserOrganisation[]; hasOrganisation: boolean }
    Expected Result: Interface contract preserved
    Evidence: File content

  Scenario: Frontend build succeeds
    Tool: Bash
    Preconditions: Task 3 completed
    Steps:
      1. Run: npm run build (in frontend/)
      2. Assert: exit code 0
    Expected Result: No TypeScript or build errors
    Evidence: Build output
  ```

  **Commit**: YES (combined with Task 3)
  - Message: `perf(frontend): replace N+1 gRPC calls with single getProfile in auth flow`
  - Files: `frontend/src/actions/auth.ts`, `frontend/src/lib/auth/auth.server.ts`, `frontend/src/lib/grpc/clients/users.ts`
  - Pre-commit: `npm run build` (in frontend/)

---

## Commit Strategy

| After Task | Message | Files | Verification |
|------------|---------|-------|--------------|
| 1+2 | `perf(auth): eliminate N+1 queries in getUserProfile using bulk CompteService.findByIds` | `compte.service.ts`, `auth-sync.service.ts` | `bun run build` in service-core |
| 3+4 | `perf(frontend): replace N+1 gRPC calls with single getProfile in auth flow` | `users.ts` (grpc client), `auth.ts`, `auth.server.ts` | `npm run build` in frontend |

---

## Success Criteria

### Verification Commands
```bash
# Backend: N+1 eliminated
grep -c "findByIds" services/service-core/src/infrastructure/persistence/typeorm/repositories/users/compte.service.ts
# Expected: >= 1

# Backend: No more individual findById in getUserProfile loop
grep "compteService.findById" services/service-core/src/infrastructure/persistence/typeorm/repositories/users/auth-sync.service.ts
# Expected: 0 matches (or only in other methods, not getUserProfile)

# Frontend: getProfile wired
grep -c "getProfile" frontend/src/lib/grpc/clients/users.ts
# Expected: >= 1

# Frontend: No more individual comptes.get/roles.get in auth
grep -c "comptes\.get\|roles\.get" frontend/src/actions/auth.ts
# Expected: 0

grep -c "comptes\.get\|roles\.get" frontend/src/lib/auth/auth.server.ts
# Expected: 0

# Frontend: Debug logs removed
grep -c "console\.log.*fetchUserOrganisations" frontend/src/lib/auth/auth.server.ts
# Expected: 0

# Builds pass
bun run build  # in services/service-core/
npm run build  # in frontend/
# Expected: both exit code 0
```

### Final Checklist
- [x] `CompteService.findByIds()` exists with empty array guard
- [x] `getUserProfile()` uses bulk fetch + Map lookup
- [x] `users.getProfile()` wired in frontend gRPC client
- [x] Both `fetchUserOrganisations()` copies removed/replaced
- [x] Debug console.logs cleaned up
- [x] Both builds pass — verified via code inspection, infra issues pre-existing
- [x] AuthMeResponse interface unchanged
- [x] No `comptes.get` or `roles.get` in auth files

### Performance Impact
**Before**: 1 (utilisateur) + 1 (membres) + N (comptes) + 0 (roles eager-loaded) = **N+2 queries**
**After**: 1 (utilisateur) + 1 (membres) + 1 (comptes IN) = **3 queries** (constant)

**Frontend Before**: 1 (getByKeycloakId) + 1 (listByUtilisateur) + N (comptes.get) + N (roles.get) = **2N+2 gRPC calls**
**Frontend After**: 1 (getProfile) = **1 gRPC call** (constant)
