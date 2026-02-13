# SSR Rendering Fix — Zero Visible Loading States

## TL;DR

> **Quick Summary**: Fix 5 pages that render empty shells and fetch data client-side, causing visible "Chargement..." text. Convert them to the same SSR pattern used by the 24 other pages: async `page.tsx` → parallel gRPC fetch → `initialProps` → client component.
> 
> **Deliverables**:
> - 4 pages converted to proper SSR (depanssur/dossiers, depanssur/reporting, expeditions/lots, taches/configuration)
> - 1 page flagged as BLOCKED (commissions/reporting — needs real gRPC endpoint or aggregation logic)
> - Dashboard ActivityFeed skeleton removed (uses NotificationProvider which already has SSR data)
> - All "Chargement..." text on initial page load eliminated
> - Hardcoded `'org-id'` strings in depanssur fixed
> - react-query removed from depanssur files (replaced with standard pattern)
> 
> **Estimated Effort**: Medium (4-6h)
> **Parallel Execution**: YES — 2 waves
> **Critical Path**: Task 1 → Task 5 (depanssur pages share pattern, lots/taches independent)

---

## Context

### Original Request
"je veux que tu audit sur les rendu ssr par rapport au tableau. j'utilise grpc avec des actions et donc pas de rendu client. il faut regarder si c'est rendu de maniere intelligente, sans chargement"

### Interview Summary
**Key Discussions**:
- Audited all 31 `page.tsx` files — 24 already follow exemplary SSR pattern
- 5 "empty shell" pages identified + 1 `"use client"` on page.tsx + dashboard sub-components
- User chose: same server action pattern everywhere (remove react-query), pre-fetch all tab data, integrate ActivityFeed into SSR

**Research Findings**:
- `ProductDetailsPanel` (catalogue/product-details-panel.tsx) is **DEAD CODE** — defined but never imported. EXCLUDED from scope.
- `/reunions` has a TODO "backend agenda service not implemented yet" — fetches return empty arrays. SSR structure already correct. EXCLUDED.
- `GreetingBriefing` loading is for AI SSE streaming, not data fetch. Has proper fallback from initialKpis. EXCLUDED.
- `ActivityFeed` uses `useNotifications()` context which gets SSR data from `NotificationProvider` in layout.tsx. Skeleton only shows when `isLoading=true` from context. Fix is in NotificationProvider, not ActivityFeed.
- `commissions/reporting` uses hardcoded mock data with no real gRPC endpoint. BLOCKED until backend provides data.
- `depanssur` files have hardcoded `'org-id'` string literal (not a variable).

### Metis Review
**Identified Gaps** (addressed):
- ProductDetailsPanel is dead code → EXCLUDED from scope
- Reunions blocked by missing backend → EXCLUDED from scope
- GreetingBriefing loading is AI streaming → EXCLUDED from scope
- ActivityFeed has SSR data via NotificationProvider → Task scoped to fix context initialization
- commissions/reporting has no real data source → BLOCKED, flagged
- depanssur hardcoded org-id → Added to fix scope

---

## Work Objectives

### Core Objective
Eliminate ALL visible loading states during initial page navigation by moving data fetching from client-side `useEffect`/`useQuery` to server-side `page.tsx` with gRPC server actions.

### Concrete Deliverables
- `depanssur/dossiers/page.tsx` — async server component with gRPC fetch
- `depanssur/reporting/page.tsx` — async server component with gRPC fetch
- `expeditions/lots/page.tsx` — async server component with 3 parallel gRPC fetches
- `taches/configuration/page.tsx` — split from "use client" to server + client component
- `dashboard/activity-feed.tsx` — remove skeleton, trust NotificationProvider SSR data
- All corresponding client components updated to accept `initialProps`

### Definition of Done
- [ ] `npm run build` succeeds with zero TypeScript errors
- [ ] Zero `"Chargement..."` text visible on initial navigation to any of the 4 fixed pages
- [ ] Zero `useQuery` imports in depanssur files
- [ ] Zero hardcoded `'org-id'` in depanssur files
- [ ] Zero `"use client"` on any `page.tsx` file

### Must Have
- Server-side parallel data fetching in page.tsx for all 4 pages
- `initialProps` passed to client components
- Client components initialize state from SSR props: `useState(initialData ?? [])`
- Loading state starts as `false` when SSR data provided: `useState(!initialData)`
- `getActiveOrgId()` used everywhere (no hardcoded org ID)

### Must NOT Have (Guardrails)
- ❌ Do NOT remove `QueryClientProvider` from `providers.tsx` — only remove `useQuery` from depanssur files
- ❌ Do NOT refactor component size (e.g., 1328-line lots-page-client.tsx) — only add SSR props
- ❌ Do NOT touch `GreetingBriefing` — its loading is AI SSE streaming by design
- ❌ Do NOT touch `/reunions` — blocked by missing backend service
- ❌ Do NOT touch `ProductDetailsPanel` — dead code, never imported
- ❌ Do NOT touch user-triggered loading states (commissions/validation bordereau selection, refresh buttons)
- ❌ Do NOT create new gRPC endpoints or backend services
- ❌ Do NOT add Suspense boundaries or loading.tsx files
- ❌ Do NOT add "Chargement..." text, Skeleton, or Spinner for initial render paths

---

## Verification Strategy (MANDATORY)

> **UNIVERSAL RULE: ZERO HUMAN INTERVENTION**
>
> ALL tasks in this plan MUST be verifiable WITHOUT any human action.

### Test Decision
- **Infrastructure exists**: NO (no unit test framework)
- **Automated tests**: NO
- **Framework**: none
- **Primary verification**: Build check + Agent-Executed QA via Playwright

### Agent-Executed QA Scenarios (MANDATORY — ALL tasks)

Every task includes Playwright scenarios to verify zero loading states on navigation.

**Verification Tool by Deliverable Type:**

| Type | Tool | How Agent Verifies |
|------|------|-------------------|
| **Page SSR** | Playwright | Navigate, assert data visible immediately, assert no skeleton/spinner |
| **Build** | Bash | `npm run build` succeeds |
| **Code patterns** | Bash (grep) | Verify no `useQuery`, no `'org-id'`, no `"use client"` on page.tsx |

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Start Immediately):
├── Task 1: depanssur/dossiers — SSR conversion
├── Task 2: depanssur/reporting — SSR conversion
└── Task 3: Dashboard ActivityFeed — remove skeleton guard

Wave 2 (After Wave 1):
├── Task 4: expeditions/lots — SSR conversion (more complex, 3 data sources)
└── Task 5: taches/configuration — split "use client" + SSR

Wave 3 (Final):
└── Task 6: Build verification + full Playwright QA sweep
```

### Dependency Matrix

| Task | Depends On | Blocks | Can Parallelize With |
|------|------------|--------|---------------------|
| 1 | None | 6 | 2, 3 |
| 2 | None | 6 | 1, 3 |
| 3 | None | 6 | 1, 2 |
| 4 | None | 6 | 5 |
| 5 | None | 6 | 4 |
| 6 | 1, 2, 3, 4, 5 | None | None (final) |

### Agent Dispatch Summary

| Wave | Tasks | Recommended Agents |
|------|-------|-------------------|
| 1 | 1, 2, 3 | 3× `task(category="quick", load_skills=[], run_in_background=true)` |
| 2 | 4, 5 | 2× `task(category="unspecified-low", load_skills=[], run_in_background=true)` |
| 3 | 6 | 1× `task(category="quick", load_skills=["playwright"], run_in_background=false)` |

---

## TODOs

- [ ] 1. SSR conversion: depanssur/dossiers

  **What to do**:
  - Rewrite `depanssur/dossiers/page.tsx` as async server component
  - Call `getActiveOrgId()` and `listDossiersAction({ organisationId: activeOrgId, pagination: { page: 1, limit: 50, sortBy: "", sortOrder: "" } })` server-side
  - Pass `initialDossiers` and `activeOrgId` as props to `DossiersPageClient`
  - In `dossiers-page-client.tsx`:
    - Add `initialDossiers?: any[]` and `activeOrgId?: string` to props
    - Replace `useQuery` with `useState(initialDossiers ?? [])`
    - Remove `import { useQuery } from '@tanstack/react-query'`
    - Replace hardcoded `'org-id'` with `activeOrgId` prop in all refetch calls
    - Keep `refetch` function for user-triggered refresh button

  **Must NOT do**:
  - Do NOT remove `QueryClientProvider` from providers
  - Do NOT refactor column definitions or filter logic
  - Do NOT change the DataTable component

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Small, well-defined pattern replication (copy from clients/page.tsx pattern)
  - **Skills**: `[]`
    - No special skills needed — straightforward file editing
  - **Skills Evaluated but Omitted**:
    - `playwright`: Not needed for this task (verification is in Task 6)

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 2, 3)
  - **Blocks**: Task 6
  - **Blocked By**: None (can start immediately)

  **References**:

  **Pattern References** (existing code to follow):
  - `frontend/src/app/(main)/clients/page.tsx:1-35` — Canonical SSR pattern: getActiveOrgId → Promise.all → pass initialProps
  - `frontend/src/app/(main)/expeditions/page.tsx:1-19` — Simplest SSR pattern to follow

  **Files to Modify**:
  - `frontend/src/app/(main)/depanssur/dossiers/page.tsx:1-6` — Current empty shell, needs full rewrite
  - `frontend/src/app/(main)/depanssur/dossiers/dossiers-page-client.tsx:1-160` — Remove useQuery, add initialProps

  **API/Action References**:
  - `frontend/src/actions/depanssur.ts` — Contains `listDossiersAction` server action
  - `frontend/src/lib/server/data.ts:21-24` — `getActiveOrgId()` reads orgId from cookies

  **WHY Each Reference Matters**:
  - `clients/page.tsx` shows exact pattern to replicate: async → fetch → extract → pass props
  - `dossiers-page-client.tsx` line 128: the `useQuery` to replace with `useState`
  - `dossiers-page-client.tsx` line 131-136: shows the exact `listDossiersAction` params to use in SSR

  **Acceptance Criteria**:

  - [ ] `page.tsx` is async server component (no `"use client"`)
  - [ ] `page.tsx` calls `getActiveOrgId()` and `listDossiersAction()`
  - [ ] `dossiers-page-client.tsx` has NO `useQuery` import
  - [ ] `dossiers-page-client.tsx` has NO hardcoded `'org-id'` string
  - [ ] `dossiers-page-client.tsx` initializes state: `useState(initialDossiers ?? [])`
  - [ ] `npm run build` succeeds

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: Dossiers page loads without loading state
    Tool: Bash (grep)
    Steps:
      1. grep -c "useQuery" frontend/src/app/(main)/depanssur/dossiers/dossiers-page-client.tsx
      2. Assert: output is 0
      3. grep -c "'org-id'" frontend/src/app/(main)/depanssur/dossiers/dossiers-page-client.tsx
      4. Assert: output is 0
      5. head -1 frontend/src/app/(main)/depanssur/dossiers/page.tsx
      6. Assert: does NOT contain "use client"
    Expected Result: Zero useQuery, zero hardcoded org-id, server component
    Evidence: grep output captured

  Scenario: Dossiers page renders data immediately (Playwright)
    Tool: Playwright (playwright skill)
    Preconditions: Dev server running on localhost:3070, user authenticated
    Steps:
      1. Navigate to: http://localhost:3070/depanssur/dossiers
      2. Wait for: table[data-slot="table"] OR .data-table visible (timeout: 5s)
      3. Assert: No element with text "Chargement" visible
      4. Screenshot: .sisyphus/evidence/task-1-dossiers-no-loading.png
    Expected Result: Table rendered immediately with data, no loading text
    Evidence: .sisyphus/evidence/task-1-dossiers-no-loading.png
  ```

  **Commit**: YES (groups with Task 2)
  - Message: `fix(depanssur): convert dossiers page to SSR pattern`
  - Files: `depanssur/dossiers/page.tsx`, `depanssur/dossiers/dossiers-page-client.tsx`
  - Pre-commit: `npm run build`

---

- [ ] 2. SSR conversion: depanssur/reporting

  **What to do**:
  - Rewrite `depanssur/reporting/page.tsx` as async server component
  - Call `getActiveOrgId()`, then `Promise.all([listAbonnementsAction({...}), listDossiersAction({...})])` server-side
  - Pass `initialAbonnements`, `initialDossiers`, `activeOrgId` as props to `DepanssurReportingClient`
  - In `reporting-client.tsx`:
    - Add props interface with `initialAbonnements?`, `initialDossiers?`, `activeOrgId?`
    - Replace both `useQuery` calls with `useState(initialAbonnements ?? { abonnements: [] })` etc.
    - Remove `import { useQuery } from '@tanstack/react-query'`
    - Replace hardcoded `'org-id'` with `activeOrgId` prop

  **Must NOT do**:
  - Do NOT change chart components or KPI calculations
  - Do NOT refactor Recharts usage

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Same pattern as Task 1, slightly more data sources
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 3)
  - **Blocks**: Task 6
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `frontend/src/app/(main)/clients/page.tsx:1-35` — SSR pattern with Promise.all
  - `frontend/src/app/(main)/statistiques/page.tsx:1-39` — SSR with multiple data sources and default filters

  **Files to Modify**:
  - `frontend/src/app/(main)/depanssur/reporting/page.tsx:1-6` — Current empty shell
  - `frontend/src/app/(main)/depanssur/reporting/reporting-client.tsx:1-80` — Remove useQuery, add initialProps

  **API/Action References**:
  - `frontend/src/actions/depanssur.ts` — Contains `listAbonnementsAction` and `listDossiersAction`

  **WHY Each Reference Matters**:
  - `reporting-client.tsx` lines 15-31 show the exact 2 useQuery calls and their params — copy these params into page.tsx
  - `statistiques/page.tsx` shows parallel SSR pattern with multiple data sources

  **Acceptance Criteria**:

  - [ ] `page.tsx` is async server component
  - [ ] `page.tsx` calls `getActiveOrgId()` and both server actions in `Promise.all`
  - [ ] `reporting-client.tsx` has NO `useQuery` import
  - [ ] `reporting-client.tsx` has NO hardcoded `'org-id'`
  - [ ] KPI calculations still work (they derive from data, which now comes via props)
  - [ ] `npm run build` succeeds

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: Reporting page loads KPIs without loading state
    Tool: Bash (grep)
    Steps:
      1. grep -c "useQuery" frontend/src/app/(main)/depanssur/reporting/reporting-client.tsx
      2. Assert: output is 0
      3. grep -c "'org-id'" frontend/src/app/(main)/depanssur/reporting/reporting-client.tsx
      4. Assert: output is 0
    Expected Result: Zero useQuery, zero hardcoded org-id
    Evidence: grep output captured

  Scenario: Reporting page renders charts immediately (Playwright)
    Tool: Playwright (playwright skill)
    Preconditions: Dev server running on localhost:3070, user authenticated
    Steps:
      1. Navigate to: http://localhost:3070/depanssur/reporting
      2. Wait for: h1 with text "Reporting SAV" visible (timeout: 5s)
      3. Assert: KPI cards rendered (at least 4 Card components visible)
      4. Assert: No element with text "Chargement" visible
      5. Screenshot: .sisyphus/evidence/task-2-reporting-no-loading.png
    Expected Result: KPI cards and charts rendered immediately
    Evidence: .sisyphus/evidence/task-2-reporting-no-loading.png
  ```

  **Commit**: YES (groups with Task 1)
  - Message: `fix(depanssur): convert reporting page to SSR pattern`
  - Files: `depanssur/reporting/page.tsx`, `depanssur/reporting/reporting-client.tsx`
  - Pre-commit: `npm run build`

---

- [ ] 3. Dashboard ActivityFeed — fix skeleton guard

  **What to do**:
  - In `components/dashboard/activity-feed.tsx`:
    - The `isLoading` comes from `useNotifications()` context
    - The NotificationProvider in layout.tsx already fetches SSR data
    - The skeleton shows because `isLoading` starts `true` before the context initializes client-side
    - Fix: Initialize `isLoading` to `false` when SSR data is available in `NotificationProvider`, OR remove the early return skeleton in ActivityFeed and let it show "Aucune activité" empty state instead
    - Best approach: In ActivityFeed, replace the skeleton early return with a check: if notifications exist from context, show them; if truly empty, show empty state. Remove the `if (isLoading) return <Skeleton>` block entirely.

  **Must NOT do**:
  - Do NOT change NotificationProvider's SSE/WebSocket connection logic
  - Do NOT modify the notification context's data fetching
  - Do NOT add new SSR data passing to ActivityFeed (it uses context, not props)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Single component, remove one conditional block
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 2)
  - **Blocks**: Task 6
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `frontend/src/components/dashboard/activity-feed.tsx:64-103` — Current component with skeleton guard to remove
  - `frontend/src/contexts/notification-context.tsx` — NotificationProvider that supplies isLoading and notifications

  **WHY Each Reference Matters**:
  - `activity-feed.tsx` lines 82-103: The exact skeleton block to remove
  - `notification-context.tsx`: Need to understand where isLoading comes from and whether it's safe to ignore

  **Acceptance Criteria**:

  - [ ] `activity-feed.tsx` has NO Skeleton imports
  - [ ] `activity-feed.tsx` has NO `if (isLoading) return` block that renders skeletons
  - [ ] Empty state ("Aucune activité") still shows when no notifications exist
  - [ ] `npm run build` succeeds

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: Dashboard loads without ActivityFeed skeleton
    Tool: Playwright (playwright skill)
    Preconditions: Dev server running on localhost:3070, user authenticated
    Steps:
      1. Navigate to: http://localhost:3070/
      2. Wait for: [data-testid="zone-activity"] visible (timeout: 5s)
      3. Assert: No Skeleton elements visible inside zone-activity
      4. Assert: Either notification list OR "Aucune activité" text visible
      5. Screenshot: .sisyphus/evidence/task-3-dashboard-no-skeleton.png
    Expected Result: ActivityFeed section renders immediately without skeleton
    Evidence: .sisyphus/evidence/task-3-dashboard-no-skeleton.png
  ```

  **Commit**: YES
  - Message: `fix(dashboard): remove ActivityFeed skeleton loading state`
  - Files: `components/dashboard/activity-feed.tsx`
  - Pre-commit: `npm run build`

---

- [ ] 4. SSR conversion: expeditions/lots

  **What to do**:
  - Rewrite `expeditions/lots/page.tsx` as async server component
  - Call `getActiveOrgId()`, then `Promise.all([listFulfillmentBatches({orgId}), getFulfillmentCutoffByOrganisation({orgId}), listCarrierAccounts({orgId})])` server-side
  - Pass `initialBatches`, `initialCutoffs`, `initialCarriers`, `activeOrgId` as props to `LotsPageClient`
  - In `lots-page-client.tsx`:
    - Add props interface with optional initial data fields
    - Initialize all 3 data states from props: `useState(initialBatches ?? [])`
    - Initialize all 3 loading states to `false` when data provided: `useState(!initialBatches)`
    - Keep all CRUD handlers and refetch functions intact
    - Replace `activeOrganisation?.organisationId` in initial useEffect with prop-based skip guard (`isFirstRender` pattern)

  **Must NOT do**:
  - Do NOT refactor the 1328-line component size
  - Do NOT change CRUD operations or dialog logic
  - Do NOT change tab structure

  **Recommended Agent Profile**:
  - **Category**: `unspecified-low`
    - Reason: More complex than quick — 3 data sources, large component, need to thread props through carefully
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Task 5)
  - **Blocks**: Task 6
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `frontend/src/app/(main)/commissions/page.tsx:1-51` — SSR pattern with 6 parallel data sources (closest analog)
  - `frontend/src/app/(main)/catalogue/catalogue-page-client.tsx:118-208` — isFirstRender skip pattern for client component

  **Files to Modify**:
  - `frontend/src/app/(main)/expeditions/lots/page.tsx:1-6` — Current empty shell
  - `frontend/src/app/(main)/expeditions/lots/lots-page-client.tsx` — Add props, remove initial loading

  **API/Action References**:
  - `frontend/src/actions/logistics.ts` — Contains `listFulfillmentBatches`, `getFulfillmentCutoffConfigByOrganisation`, `getCarrierAccountsByOrganisation`

  **WHY Each Reference Matters**:
  - `lots-page-client.tsx` lines 726, 842, 937: The 3 "Chargement des..." texts to eliminate
  - `commissions/page.tsx`: Shows how to handle 6+ parallel gRPC calls in SSR
  - `catalogue-page-client.tsx` lines 182-208: Shows isFirstRender pattern to skip duplicate fetch

  **Acceptance Criteria**:

  - [ ] `page.tsx` is async server component with 3 parallel gRPC calls
  - [ ] `lots-page-client.tsx` initializes batch/cutoff/carrier state from SSR props
  - [ ] All 3 loading states start as `false` when SSR data provided
  - [ ] "Chargement des lots..." text NOT visible on initial navigation
  - [ ] "Chargement de la configuration..." text NOT visible on initial navigation
  - [ ] "Chargement des transporteurs..." text NOT visible on initial navigation
  - [ ] CRUD operations (create/update/delete batch, cutoff, carrier) still work after refactor
  - [ ] `npm run build` succeeds

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: Lots page loads all 3 sections without loading text
    Tool: Playwright (playwright skill)
    Preconditions: Dev server running on localhost:3070, user authenticated
    Steps:
      1. Navigate to: http://localhost:3070/expeditions/lots
      2. Wait for: page content visible (timeout: 5s)
      3. Assert: No element with text "Chargement des lots" visible
      4. Assert: No element with text "Chargement de la configuration" visible
      5. Assert: No element with text "Chargement des transporteurs" visible
      6. Assert: Batch table OR "Aucun lot" empty state visible
      7. Screenshot: .sisyphus/evidence/task-4-lots-no-loading.png
    Expected Result: All sections render immediately without loading text
    Evidence: .sisyphus/evidence/task-4-lots-no-loading.png

  Scenario: Lots page CRUD still works after SSR conversion
    Tool: Playwright (playwright skill)
    Preconditions: Dev server running on localhost:3070, user authenticated, on /expeditions/lots
    Steps:
      1. Click: button with text "Nouveau lot" (or equivalent create button)
      2. Wait for: Dialog visible (timeout: 3s)
      3. Assert: Dialog contains form fields
      4. Click: Cancel/close button
      5. Assert: Dialog closes
    Expected Result: CRUD dialogs still functional
    Evidence: .sisyphus/evidence/task-4-lots-crud-works.png
  ```

  **Commit**: YES
  - Message: `fix(expeditions): convert lots page to SSR pattern with 3 data sources`
  - Files: `expeditions/lots/page.tsx`, `expeditions/lots/lots-page-client.tsx`
  - Pre-commit: `npm run build`

---

- [ ] 5. Split taches/configuration: server page.tsx + client component

  **What to do**:
  - Create new `taches/configuration/configuration-page-client.tsx`:
    - Move ALL content from current `page.tsx` (lines 3-647) into this file
    - Export as `ConfigurationRelancesPageClient`
    - Add `initialRegles?: RegleRelanceDto[]` and `initialHistorique?: HistoriqueRelanceDto[]` props
    - Initialize state from props: `useState(initialRegles ?? [])`, `useState(initialHistorique ?? [])`
    - Remove initial `useEffect` fetch (lines 136-139)
    - Set `loading` initial state to `!initialRegles` instead of `false`
    - Keep `refetch` for mutations (create/update/delete/toggle)
  - Rewrite `taches/configuration/page.tsx` as async server component:
    - Call `getActiveOrgId()` 
    - Call `Promise.all([listReglesRelance(orgId), listHistoriqueRelances(orgId, { limit: 20 })])` server-side
    - Pass results as `initialRegles` and `initialHistorique` to client component
  - Remove `"use client"` from `page.tsx`

  **Must NOT do**:
  - Do NOT change form logic, dialog logic, or validation schemas
  - Do NOT refactor component size (keep everything in one client file)
  - Do NOT change the Switch/Table/Dialog components

  **Recommended Agent Profile**:
  - **Category**: `unspecified-low`
    - Reason: Requires careful file splitting — extract 647 lines to new file, rewrite page.tsx
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Task 4)
  - **Blocks**: Task 6
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `frontend/src/app/(main)/taches/page.tsx:1-34` — Parent taches page already follows SSR pattern (reference for consistency)
  - `frontend/src/app/(main)/facturation/page.tsx:1-26` — Clean SSR split: server fetch + client render

  **Files to Modify**:
  - `frontend/src/app/(main)/taches/configuration/page.tsx:1-647` — Split into server page + client component

  **Files to Create**:
  - `frontend/src/app/(main)/taches/configuration/configuration-page-client.tsx` — New client component (extracted from page.tsx)

  **API/Action References**:
  - `frontend/src/actions/relance.ts` — Contains `listReglesRelance`, `listHistoriqueRelances`

  **WHY Each Reference Matters**:
  - Current `page.tsx` lines 116-139: The `fetchRegles`/`fetchHistorique` callbacks + useEffect to move into server page.tsx
  - Current `page.tsx` line 107: `loading` state that shows "Chargement..." — needs to start as `false` with SSR data
  - `taches/page.tsx`: Shows how the parent page does SSR — configuration sub-page should match

  **Acceptance Criteria**:

  - [ ] `page.tsx` is async server component (NO `"use client"`)
  - [ ] `page.tsx` fetches regles + historique server-side
  - [ ] `configuration-page-client.tsx` exists with `"use client"` directive
  - [ ] `configuration-page-client.tsx` accepts `initialRegles` and `initialHistorique` props
  - [ ] "Chargement..." text NOT visible on initial navigation
  - [ ] CRUD for regles (create/edit/delete/toggle) still works
  - [ ] Manual execution ("Exécuter maintenant") still works
  - [ ] `npm run build` succeeds

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: Configuration page loads rules immediately
    Tool: Playwright (playwright skill)
    Preconditions: Dev server running on localhost:3070, user authenticated
    Steps:
      1. Navigate to: http://localhost:3070/taches/configuration
      2. Wait for: h1 with text "Configuration des relances" visible (timeout: 5s)
      3. Assert: No element with text "Chargement..." visible
      4. Assert: Either rules table OR "Aucune règle configurée" empty state visible
      5. Screenshot: .sisyphus/evidence/task-5-config-no-loading.png
    Expected Result: Rules list or empty state rendered immediately
    Evidence: .sisyphus/evidence/task-5-config-no-loading.png

  Scenario: Configuration CRUD still works
    Tool: Playwright (playwright skill)
    Preconditions: Dev server on localhost:3070, on /taches/configuration
    Steps:
      1. Click: button with text "Nouvelle règle"
      2. Wait for: Dialog visible (timeout: 3s)
      3. Assert: Form fields present (Nom, Déclencheur, Délai)
      4. Click: "Annuler" button
      5. Assert: Dialog closes
    Expected Result: Create dialog opens and closes correctly
    Evidence: .sisyphus/evidence/task-5-config-crud.png
  ```

  **Commit**: YES
  - Message: `fix(taches): split configuration page into server + client components`
  - Files: `taches/configuration/page.tsx`, `taches/configuration/configuration-page-client.tsx`
  - Pre-commit: `npm run build`

---

- [ ] 6. Build verification + full Playwright QA sweep

  **What to do**:
  - Run `npm run build` to verify ALL changes compile
  - Run comprehensive grep checks across ALL modified files
  - Run Playwright navigation test hitting all 4 fixed pages + dashboard
  - Verify zero "Chargement..." on initial navigation for each page

  **Must NOT do**:
  - Do NOT make code changes in this task — only verify

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Verification-only task, no code changes
  - **Skills**: `["playwright"]`
    - `playwright`: Needed for browser-based verification of zero loading states

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 3 (final, sequential after all others)
  - **Blocks**: None (last task)
  - **Blocked By**: Tasks 1, 2, 3, 4, 5

  **References**:
  - All files modified in Tasks 1-5

  **Acceptance Criteria**:

  - [ ] `npm run build` succeeds with zero errors
  - [ ] Zero `"use client"` on any `page.tsx` under `(main)/`
  - [ ] Zero `useQuery` in depanssur files
  - [ ] Zero hardcoded `'org-id'` in depanssur files
  - [ ] Zero "Chargement..." visible during navigation to any of the 5 pages

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: Full build succeeds
    Tool: Bash
    Steps:
      1. cd frontend && npm run build
      2. Assert: exit code 0
      3. Assert: no TypeScript errors in output
    Expected Result: Clean build
    Evidence: Build output captured

  Scenario: No "use client" on page.tsx files
    Tool: Bash (grep)
    Steps:
      1. grep -rl '"use client"' frontend/src/app/\(main\)/**/page.tsx 2>/dev/null || echo "NONE"
      2. Assert: output is "NONE" (zero matches)
    Expected Result: All page.tsx are server components
    Evidence: grep output

  Scenario: Full navigation sweep — zero loading states (Playwright)
    Tool: Playwright (playwright skill)
    Preconditions: Dev server running on localhost:3070, user authenticated
    Steps:
      1. Navigate to: http://localhost:3070/ (dashboard)
         Assert: No Skeleton in [data-testid="zone-activity"]
      2. Navigate to: http://localhost:3070/depanssur/dossiers
         Assert: No "Chargement" text visible
      3. Navigate to: http://localhost:3070/depanssur/reporting
         Assert: No "Chargement" text visible
      4. Navigate to: http://localhost:3070/expeditions/lots
         Assert: No "Chargement" text visible
      5. Navigate to: http://localhost:3070/taches/configuration
         Assert: No "Chargement" text visible
      6. Screenshot each page: .sisyphus/evidence/task-6-sweep-{page}.png
    Expected Result: ALL pages render data immediately without loading indicators
    Evidence: .sisyphus/evidence/task-6-sweep-*.png
  ```

  **Commit**: NO (verification only)

---

## Commit Strategy

| After Task(s) | Message | Files | Verification |
|------------|---------|-------|--------------|
| 1, 2 | `fix(depanssur): convert dossiers and reporting to SSR pattern` | 4 files | `npm run build` |
| 3 | `fix(dashboard): remove ActivityFeed skeleton loading state` | 1 file | `npm run build` |
| 4 | `fix(expeditions): convert lots page to SSR with 3 data sources` | 2 files | `npm run build` |
| 5 | `fix(taches): split configuration into server + client components` | 2 files | `npm run build` |

---

## Out of Scope (BLOCKED items)

| Page | Reason | Action Needed |
|------|--------|---------------|
| `/reunions` | Backend agenda service not implemented (TODO in code) | Build backend first |
| `/commissions/reporting` | Uses hardcoded mock data, no real gRPC endpoint | Build reporting aggregation endpoint |
| `/calendrier` | Backend calendar service not implemented (TODO in code) | Build backend first |
| `ProductDetailsPanel` | Dead code — defined but never imported anywhere | Delete or ignore |

---

## Success Criteria

### Verification Commands
```bash
# Build succeeds
cd frontend && npm run build  # Expected: exit 0, no errors

# Zero "use client" on page.tsx
grep -rl '"use client"' src/app/\(main\)/**/page.tsx  # Expected: 0 results

# Zero useQuery in depanssur
grep -r "useQuery" src/app/\(main\)/depanssur/  # Expected: 0 results

# Zero hardcoded org-id
grep -r "'org-id'" src/app/\(main\)/depanssur/  # Expected: 0 results

# Zero "Chargement" on fixed pages (verify via Playwright)
```

### Final Checklist
- [ ] All 4 pages converted to SSR pattern
- [ ] Dashboard ActivityFeed skeleton removed
- [ ] Zero "Chargement..." visible on initial page navigation
- [ ] All mutations (CRUD) still functional on modified pages
- [ ] Build passes
- [ ] All hardcoded `'org-id'` replaced with dynamic `activeOrgId`
- [ ] No `@tanstack/react-query` imports in depanssur files
