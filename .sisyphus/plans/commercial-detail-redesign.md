# Commercial Detail Page Redesign

## TL;DR

> **Quick Summary**: Redesign the commercial (apporteur) detail page to match the client detail page's UI/UX — adding tabbed navigation, accordion info sections, commission data, contracts table, activities/tasks, and documents from bordereau exports.
> 
> **Deliverables**:
> - CommercialHeader component (adapted from ClientHeader pattern)
> - CommercialInfoAccordion component (Coordonnées + Métadonnées sections)
> - CommercialCommissions tab (Commissions + Bordereaux + Reprises)
> - CommercialContrats tab (contracts filtered by commercial_id)
> - CommercialActivitesTaches tab (activities + tasks with new server actions)
> - CommercialDocuments tab (bordereau PDF/Excel exports)
> - Redesigned commercial-detail-client.tsx with full tab layout
> - Updated page.tsx SSR with expanded data fetching
> 
> **Estimated Effort**: Medium
> **Parallel Execution**: YES - 3 waves
> **Critical Path**: Task 1 (Header) → Task 2 (Accordion) → Task 3 (Page shell with tabs) → Tasks 4-7 (tab content, parallel) → Task 8 (SSR)

---

## Context

### Original Request
"La fiche d'un commercial doit ressembler à l'UI/UX de la fiche d'un client."

### Interview Summary
**Key Discussions**:
- User wants ALL sections: Header, Accordion, Commissions, Contrats, Activités & Tâches, Documents
- Commissions tab: reuse existing list components (bordereaux-list, reprises-list, etc.) as-is
- Contrats tab: contracts table only, filtered by commercial_id
- Overview layout: left = stats cards + recent activity, right = sticky info accordion
- Test strategy: Agent QA only (Playwright), no unit tests
- Activities & Tasks: create thin wrapper server actions (no proto changes)
- Documents: use bordereau PDF/Excel exports as document source
- Commission sub-tabs: key 3 only (Commissions + Bordereaux + Reprises)

**Research Findings**:
- Client detail: 949 lines, 4 tabs, 10+ sub-components, accordion, gradient cards, sticky sidebar
- Commercial detail: 325 lines, 3 simple cards, no tabs, no modularity
- Apporteur fields: id, nom, prenom, type_apporteur, email, telephone, societe_id, actif, timestamps
- All commission queries accept `apporteurId` filter — confirmed in server actions
- `getContratsByOrganisation` accepts `commercialId` parameter — confirmed
- No `listActivitesByPartenaire` endpoint — needs new thin wrapper actions
- No document relation on Apporteur — will use bordereau exports

### Metis Review
**Identified Gaps** (addressed):
- No backend endpoint for activities/tasks by commercial → Decision: create thin wrapper server actions
- No document source for commercials → Decision: use bordereau PDF/Excel URLs
- Commission sub-tabs scope unclear → Decision: key 3 (Commissions, Bordereaux, Reprises)
- Apporteur entity is thin (fewer fields than client) → Accordion will have 2 sections, not 3
- No inline editing → Read-only accordion for V1

---

## Work Objectives

### Core Objective
Restructure the commercial detail page from a simple 3-card layout to a professional tabbed layout matching the client detail page's UI/UX patterns, while leveraging existing commission components.

### Concrete Deliverables
- `frontend/src/components/commercial-detail/commercial-header.tsx` — Header component
- `frontend/src/components/commercial-detail/commercial-info-accordion.tsx` — Info accordion
- `frontend/src/components/commercial-detail/commercial-commissions.tsx` — Commissions tab content
- `frontend/src/components/commercial-detail/commercial-contrats.tsx` — Contrats tab content
- `frontend/src/components/commercial-detail/commercial-activites-taches.tsx` — Activities & Tasks tab
- `frontend/src/components/commercial-detail/commercial-documents.tsx` — Documents tab
- `frontend/src/app/(main)/commerciaux/[id]/commercial-detail-client.tsx` — Rewritten main page
- `frontend/src/app/(main)/commerciaux/[id]/page.tsx` — Updated SSR with expanded fetching
- `frontend/src/actions/commerciaux.ts` — New server actions for activities/tasks by commercial

### Definition of Done
- [x] `npm run build` in frontend → exit code 0, no TypeScript errors
- [x] Page loads at `/commerciaux/{id}` without crash
- [x] All 5 tabs render content or appropriate empty states
- [x] Layout matches client detail page patterns (header, tabs, accordion, grid)
- [x] Commission data loads filtered by this commercial's apporteurId
- [x] Contracts load filtered by this commercial's id
- [x] Mobile responsive — no horizontal scroll at 375px width

### Must Have
- Tab-based navigation matching client detail structure
- Header with name, type badge, status badge, action buttons
- Collapsible accordion for personal/contact info
- Commission tab with existing list components reused as-is
- Contracts table filtered by commercial_id
- Empty states for all tabs when no data
- Loading states for async data

### Must NOT Have (Guardrails)
- ❌ DO NOT create shared/abstracted components between client-detail and commercial-detail (copy + adapt, no premature abstraction)
- ❌ DO NOT modify existing components in `components/commissions/` or `components/client-detail/`
- ❌ DO NOT add inline editing to the accordion (read-only for V1)
- ❌ DO NOT add email integration to the commercial page
- ❌ DO NOT create new gRPC proto definitions or backend service changes
- ❌ DO NOT add more than the key 3 commission sub-sections (Commissions, Bordereaux, Reprises)
- ❌ DO NOT create unit tests — Playwright QA only
- ❌ DO NOT over-validate — keep validation proportional to entity complexity

---

## Verification Strategy (MANDATORY)

> **UNIVERSAL RULE: ZERO HUMAN INTERVENTION**
>
> ALL tasks in this plan MUST be verifiable WITHOUT any human action.
> Every criterion MUST be verifiable by running a command or using a tool.

### Test Decision
- **Infrastructure exists**: YES (Next.js build + lint)
- **Automated tests**: None (Agent QA only)
- **Framework**: N/A

### Agent-Executed QA Scenarios (MANDATORY — ALL tasks)

> Every task includes Playwright browser verification scenarios.
> The executing agent DIRECTLY verifies the deliverable by running it.

**Verification Tool by Deliverable Type:**

| Type | Tool | How Agent Verifies |
|------|------|-------------------|
| **Frontend/UI** | Playwright (playwright skill) | Navigate, interact, assert DOM, screenshot |
| **Build** | Bash | `npm run build` → assert exit 0 |
| **Server Actions** | Bash (node/bun) | Import and call function, assert response shape |

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Start Immediately):
├── Task 1: CommercialHeader component
└── Task 2: CommercialInfoAccordion component

Wave 2 (After Wave 1):
├── Task 3: Page shell with Tabs + Overview layout (depends on 1, 2)
├── Task 4: CommercialCommissions tab (can start in parallel with 3)
├── Task 5: CommercialContrats tab (can start in parallel with 3)
├── Task 6: CommercialActivitesTaches + server actions (can start in parallel)
└── Task 7: CommercialDocuments tab (can start in parallel)

Wave 3 (After Wave 2):
└── Task 8: SSR data fetching + final integration (depends on all above)

Critical Path: Task 1 → Task 3 → Task 8
Parallel Speedup: ~50% faster than sequential
```

### Dependency Matrix

| Task | Depends On | Blocks | Can Parallelize With |
|------|------------|--------|---------------------|
| 1 | None | 3 | 2 |
| 2 | None | 3 | 1 |
| 3 | 1, 2 | 8 | 4, 5, 6, 7 |
| 4 | None* | 8 | 3, 5, 6, 7 |
| 5 | None* | 8 | 3, 4, 6, 7 |
| 6 | None* | 8 | 3, 4, 5, 7 |
| 7 | None* | 8 | 3, 4, 5, 6 |
| 8 | 3, 4, 5, 6, 7 | None | None (final) |

*Tasks 4-7 create standalone components that are imported by Task 3/8, so they can be built independently.

### Agent Dispatch Summary

| Wave | Tasks | Recommended Agents |
|------|-------|-------------------|
| 1 | 1, 2 | task(category="visual-engineering", load_skills=["frontend-ui-ux"], run_in_background=false) |
| 2 | 3, 4, 5, 6, 7 | task(category="visual-engineering", load_skills=["frontend-ui-ux"]) — 3 sequential, 4-7 parallel where possible |
| 3 | 8 | task(category="unspecified-low", load_skills=["frontend-ui-ux"], run_in_background=false) |

---

## TODOs

- [x] 1. Create CommercialHeader Component

  **What to do**:
  - Create `frontend/src/components/commercial-detail/commercial-header.tsx`
  - Adapt from `ClientHeader` pattern: back button, commercial name (nom + prénom), type badge (VRP/Manager/Directeur/Partenaire), status badge (Actif/Inactif)
  - Action buttons: Toggle actif/inactif, Edit (opens EditCommercialDialog), Delete (opens AlertDialog), More menu dropdown
  - Use sidebar background color for header area (matching client page pattern)
  - Props interface: `{ commercial: Apporteur, onUpdate: () => void, onDelete: () => void }`
  - Include the EditCommercialDialog and delete AlertDialog as children of the header

  **Must NOT do**:
  - Do NOT add email button (no email integration for commercials)
  - Do NOT add "New Contract" button
  - Do NOT create a shared HeaderBase component
  - Do NOT add history/notes sidebar integration

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: UI component creation following design patterns
  - **Skills**: [`frontend-ui-ux`]
    - `frontend-ui-ux`: Component design with shadcn/ui patterns, styling consistency

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Task 2)
  - **Blocks**: Task 3
  - **Blocked By**: None

  **References**:

  **Pattern References** (existing code to follow):
  - `frontend/src/components/client-detail/client-header.tsx:44-109` — Header layout pattern with back button, name, badges, action buttons. Copy this structure.
  - `frontend/src/app/(main)/commerciaux/[id]/commercial-detail-client.tsx:100-175` — Current header/action buttons to preserve (Toggle, Edit, Delete logic)
  - `frontend/src/components/commerciaux/edit-commercial-dialog.tsx` — Existing edit dialog to embed in header

  **API/Type References**:
  - `frontend/src/actions/commerciaux.ts` — `getApporteur`, `activerApporteur`, `desactiverApporteur`, `deleteApporteur` server actions
  - `packages/proto/src/commerciaux/commerciaux.proto` — Apporteur message definition with all fields

  **Styling References**:
  - `frontend/src/components/client-detail/client-header.tsx` — Sidebar background color, badge variants, button sizes
  - Badge variants: `actif` → green/success variant, `inactif` → gray/secondary variant
  - Type badge: `type_apporteur` values → VRP, Manager, Directeur, Partenaire

  **Acceptance Criteria**:

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: Header renders with commercial info
    Tool: Playwright (playwright skill)
    Preconditions: Dev server running on localhost:3000, at least one commercial exists
    Steps:
      1. Navigate to: http://localhost:3000/commerciaux/{known-commercial-id}
      2. Wait for: [data-testid="commercial-header"] OR first h1/h2 visible (timeout: 10s)
      3. Assert: Page contains commercial's full name (nom + prénom)
      4. Assert: Type badge visible with one of: VRP, Manager, Directeur, Partenaire
      5. Assert: Status badge visible with "Actif" or "Inactif"
      6. Assert: Back button (arrow-left icon or "Retour") is visible
      7. Screenshot: .sisyphus/evidence/task-1-header-renders.png
    Expected Result: Header shows all commercial info with proper badges
    Evidence: .sisyphus/evidence/task-1-header-renders.png

  Scenario: Edit dialog opens from header
    Tool: Playwright (playwright skill)
    Preconditions: Commercial detail page loaded
    Steps:
      1. Click: Edit button (pencil icon or "Modifier" text)
      2. Wait for: Dialog/sheet visible with form fields (timeout: 5s)
      3. Assert: Dialog contains input fields for nom, prenom, email, telephone
      4. Click: Cancel/close button
      5. Assert: Dialog closes
      6. Screenshot: .sisyphus/evidence/task-1-edit-dialog.png
    Expected Result: Edit dialog opens and closes properly
    Evidence: .sisyphus/evidence/task-1-edit-dialog.png

  Scenario: Delete confirmation dialog appears
    Tool: Playwright (playwright skill)
    Preconditions: Commercial detail page loaded
    Steps:
      1. Click: Delete button or "Supprimer" in dropdown menu
      2. Wait for: AlertDialog visible (timeout: 5s)
      3. Assert: Dialog text contains commercial's name
      4. Assert: Cancel and Confirm buttons visible
      5. Click: Cancel button
      6. Assert: Dialog closes, page still shows commercial
      7. Screenshot: .sisyphus/evidence/task-1-delete-dialog.png
    Expected Result: Delete confirmation shows and can be cancelled
    Evidence: .sisyphus/evidence/task-1-delete-dialog.png
  ```

  **Commit**: YES (group with Task 2)
  - Message: `feat(commerciaux): add CommercialHeader and CommercialInfoAccordion components`
  - Files: `frontend/src/components/commercial-detail/commercial-header.tsx`, `frontend/src/components/commercial-detail/commercial-info-accordion.tsx`
  - Pre-commit: `cd frontend && npx tsc --noEmit`

---

- [x] 2. Create CommercialInfoAccordion Component

  **What to do**:
  - Create `frontend/src/components/commercial-detail/commercial-info-accordion.tsx`
  - Adapt from `ClientInfoAccordion` pattern with 2 accordion sections:
    - **Section 1 — Coordonnées**: email, telephone, société (display société name, handle null = "Toutes les sociétés")
    - **Section 2 — Métadonnées**: type_apporteur, date de création, date de modification, ID
  - Use same Accordion component from shadcn/ui
  - Read-only display with `InfoRow`-style label:value pairs
  - Use same gradient card styling (amber/orange tones for commercial identity)
  - Props interface: `{ commercial: Apporteur, societeName?: string }`

  **Must NOT do**:
  - Do NOT add inline editing (EditableField) — read-only for V1
  - Do NOT add a third "Banking" or "Compliance" section
  - Do NOT create more than 2 accordion sections

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: UI component with accordion pattern and styling
  - **Skills**: [`frontend-ui-ux`]
    - `frontend-ui-ux`: Accordion UI pattern, shadcn styling consistency

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Task 1)
  - **Blocks**: Task 3
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `frontend/src/components/client-detail/client-info-accordion.tsx:88-242` — Accordion structure, section layout, icon usage, open/close behavior. This is THE reference for layout.
  - `frontend/src/app/(main)/commerciaux/[id]/commercial-detail-client.tsx:178-270` — Current InfoRow-based cards with all fields displayed. Preserve all field display.

  **API/Type References**:
  - `packages/proto/src/commerciaux/commerciaux.proto` — Apporteur message with all fields
  - `frontend/src/actions/commerciaux.ts` — For société name resolution if needed

  **Styling References**:
  - `frontend/src/components/client-detail/client-info-accordion.tsx` — Gradient backgrounds (from-amber-50 to-amber-100), icon colors, spacing

  **Acceptance Criteria**:

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: Accordion renders with 2 sections
    Tool: Playwright (playwright skill)
    Preconditions: Dev server running, commercial detail page loaded
    Steps:
      1. Navigate to: http://localhost:3000/commerciaux/{known-id}
      2. Wait for: Accordion component visible (timeout: 10s)
      3. Assert: "Coordonnées" section trigger visible
      4. Assert: "Métadonnées" section trigger visible
      5. Click: "Coordonnées" trigger
      6. Wait for: Accordion content expanded (timeout: 2s)
      7. Assert: Email field visible with value
      8. Assert: Téléphone field visible
      9. Assert: Société field visible (shows name or "Toutes les sociétés")
      10. Screenshot: .sisyphus/evidence/task-2-accordion-coordonnees.png
    Expected Result: Accordion expands showing contact info
    Evidence: .sisyphus/evidence/task-2-accordion-coordonnees.png

  Scenario: Métadonnées section shows metadata
    Tool: Playwright (playwright skill)
    Preconditions: Commercial detail page loaded
    Steps:
      1. Click: "Métadonnées" trigger
      2. Wait for: Content expanded (timeout: 2s)
      3. Assert: Type field shows one of VRP/Manager/Directeur/Partenaire
      4. Assert: Date de création field visible with date value
      5. Assert: ID field visible
      6. Screenshot: .sisyphus/evidence/task-2-accordion-metadata.png
    Expected Result: Metadata section shows all fields
    Evidence: .sisyphus/evidence/task-2-accordion-metadata.png
  ```

  **Commit**: YES (grouped with Task 1)
  - Message: `feat(commerciaux): add CommercialHeader and CommercialInfoAccordion components`
  - Files: `frontend/src/components/commercial-detail/commercial-info-accordion.tsx`

---

- [x] 3. Rewrite Page Shell with Tabs + Overview Layout

  **What to do**:
  - Rewrite `frontend/src/app/(main)/commerciaux/[id]/commercial-detail-client.tsx`
  - Structure: CommercialHeader at top → Tabs component with 5 tabs
  - Tab names: "Vue d'ensemble", "Commissions", "Contrats", "Activités & Tâches", "Documents"
  - **Overview tab layout**: 12-column grid
    - Left (8/12): Stats summary cards (total commissions count, total contrats, status actif/inactif since date) + placeholder for recent activity
    - Right (4/12): Sticky CommercialInfoAccordion
  - Import CommercialHeader and CommercialInfoAccordion from Task 1 & 2
  - Tab content panels: import tab components from Tasks 4-7 (can use lazy loading or direct import)
  - State management: commercial data, loading states for each tab's data, refetch callbacks
  - Keep existing EditCommercialDialog and delete logic but move to CommercialHeader

  **Must NOT do**:
  - Do NOT implement tab content in this file — each tab has its own component file
  - Do NOT add email composer or account selector
  - Do NOT add history timeline (no data source for commercial history)
  - Do NOT over-engineer state — keep it minimal, each tab component manages its own data fetching

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: Full page restructure with complex layout
  - **Skills**: [`frontend-ui-ux`]
    - `frontend-ui-ux`: Page layout, tab navigation, responsive grid patterns

  **Parallelization**:
  - **Can Run In Parallel**: NO (depends on Task 1, 2)
  - **Parallel Group**: Wave 2 (start of wave, sequential within)
  - **Blocks**: Task 8
  - **Blocked By**: Task 1, Task 2

  **References**:

  **Pattern References**:
  - `frontend/src/app/(main)/clients/[id]/client-detail-client.tsx:798-896` — Tab structure, tab triggers, tab content panels. THIS IS THE PRIMARY REFERENCE for layout.
  - `frontend/src/app/(main)/clients/[id]/client-detail-client.tsx:810-860` — Overview tab with 12-column grid (8/4 split), sticky sidebar
  - `frontend/src/app/(main)/commerciaux/[id]/commercial-detail-client.tsx` — Current implementation to replace (preserve all business logic)

  **API/Type References**:
  - `frontend/src/actions/commerciaux.ts` — `getApporteur` for data fetching
  - `packages/proto/src/commerciaux/commerciaux.proto` — Apporteur type

  **Component References**:
  - `frontend/src/components/commercial-detail/commercial-header.tsx` (from Task 1)
  - `frontend/src/components/commercial-detail/commercial-info-accordion.tsx` (from Task 2)
  - shadcn `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent` from `@/components/ui/tabs`
  - shadcn `Card`, `CardHeader`, `CardTitle`, `CardContent` from `@/components/ui/card`

  **Acceptance Criteria**:

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: Page loads with tabs visible
    Tool: Playwright (playwright skill)
    Preconditions: Dev server running, commercial exists
    Steps:
      1. Navigate to: http://localhost:3000/commerciaux/{known-id}
      2. Wait for: Tab list visible (timeout: 10s)
      3. Assert: Tab "Vue d'ensemble" visible and active (default)
      4. Assert: Tab "Commissions" visible
      5. Assert: Tab "Contrats" visible
      6. Assert: Tab "Activités & Tâches" visible
      7. Assert: Tab "Documents" visible
      8. Assert: Header visible above tabs with commercial name
      9. Screenshot: .sisyphus/evidence/task-3-page-with-tabs.png
    Expected Result: All 5 tabs visible, Overview tab active by default
    Evidence: .sisyphus/evidence/task-3-page-with-tabs.png

  Scenario: Overview tab has 2-column layout
    Tool: Playwright (playwright skill)
    Preconditions: Commercial detail page loaded
    Steps:
      1. Assert: Overview tab is active (default)
      2. Assert: Left column contains stats cards (visible on desktop viewport 1280px)
      3. Assert: Right column contains accordion (sticky)
      4. Set viewport: 375x667
      5. Assert: Layout stacks vertically (single column)
      6. Assert: No horizontal scrollbar
      7. Screenshot: .sisyphus/evidence/task-3-overview-layout.png
      8. Screenshot (mobile): .sisyphus/evidence/task-3-overview-mobile.png
    Expected Result: Responsive 2-column layout on desktop, single column on mobile
    Evidence: .sisyphus/evidence/task-3-overview-layout.png, .sisyphus/evidence/task-3-overview-mobile.png

  Scenario: Tab switching works
    Tool: Playwright (playwright skill)
    Preconditions: Page loaded
    Steps:
      1. Click: "Commissions" tab
      2. Wait for: Commissions tab content visible (timeout: 5s)
      3. Assert: Tab "Commissions" has active/selected state
      4. Click: "Contrats" tab
      5. Wait for: Contrats tab content visible (timeout: 5s)
      6. Assert: Tab "Contrats" has active/selected state
      7. Click: "Vue d'ensemble" tab
      8. Assert: Overview content visible again
      9. Screenshot: .sisyphus/evidence/task-3-tab-switching.png
    Expected Result: Tabs switch content panels correctly
    Evidence: .sisyphus/evidence/task-3-tab-switching.png
  ```

  **Commit**: YES
  - Message: `feat(commerciaux): restructure detail page with tabbed layout`
  - Files: `frontend/src/app/(main)/commerciaux/[id]/commercial-detail-client.tsx`
  - Pre-commit: `cd frontend && npx tsc --noEmit`

---

- [x] 4. Create CommercialCommissions Tab Component

  **What to do**:
  - Create `frontend/src/components/commercial-detail/commercial-commissions.tsx`
  - Implement 3 sub-sections via internal tabs or accordion: **Commissions**, **Bordereaux**, **Reprises**
  - Fetch data using existing server actions with `apporteurId` filter:
    - `getCommissionsByOrganisation({ organisationId, apporteurId })`
    - `getBordereauxByOrganisation({ organisationId, apporteurId })`
    - `getReprisesByOrganisation({ organisationId, apporteurId })`
  - Reuse existing display components AS-IS:
    - Import and render `BordereauxList` with fetched bordereaux data
    - Import and render `ReprisesList` with fetched reprises data
    - For commissions list: create a simple DataTable or reuse the commission table pattern from commissions-page-client.tsx
  - Add loading states (Skeleton) for each section
  - Add empty states for each section ("Aucune commission", "Aucun bordereau", "Aucune reprise")
  - Props: `{ commercialId: string, organisationId: string }`
  - Data mapping: match the prop shapes expected by BordereauxList and ReprisesList (check their interfaces carefully)

  **Must NOT do**:
  - Do NOT include Contestations, Audit, Récurrences, or Reports négatifs sub-tabs
  - Do NOT modify existing `BordereauxList`, `ReprisesList` components
  - Do NOT replicate the full 1265-line commission page logic — keep it focused
  - Do NOT add commission calculation or generation actions

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: Component assembly with data fetching and existing component reuse
  - **Skills**: [`frontend-ui-ux`]
    - `frontend-ui-ux`: Data table patterns, loading states, component composition

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 5, 6, 7)
  - **Blocks**: Task 8
  - **Blocked By**: None (standalone component)

  **References**:

  **Pattern References**:
  - `frontend/src/app/(main)/commissions/commissions-page-client.tsx:1-100` — Data fetching pattern for commissions with apporteurId filter. Shows how to call the actions and map responses.
  - `frontend/src/app/(main)/commissions/commissions-page-client.tsx:200-350` — Tab structure for commission sub-sections (how bordereaux, reprises tabs are laid out)

  **Component References** (reuse as-is):
  - `frontend/src/components/commissions/bordereaux-list.tsx` — Takes `bordereaux: BordereauWithDetails[]` + handler props
  - `frontend/src/components/commissions/reprises-list.tsx` — Takes `reprises: RepriseWithDetails[]` + handler props

  **API/Type References**:
  - `frontend/src/actions/commissions.ts` — `getCommissionsByOrganisation`, `getBordereauxByOrganisation`, `getReprisesByOrganisation`
  - Check exact prop types by reading the component files

  **Acceptance Criteria**:

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: Commissions tab loads with sub-sections
    Tool: Playwright (playwright skill)
    Preconditions: Dev server running, commercial with commissions exists
    Steps:
      1. Navigate to: http://localhost:3000/commerciaux/{known-id}
      2. Click: "Commissions" tab
      3. Wait for: Commission content visible (timeout: 10s)
      4. Assert: Sub-tab or section "Commissions" visible
      5. Assert: Sub-tab or section "Bordereaux" visible
      6. Assert: Sub-tab or section "Reprises" visible
      7. Screenshot: .sisyphus/evidence/task-4-commissions-tab.png
    Expected Result: 3 sub-sections render within Commissions tab
    Evidence: .sisyphus/evidence/task-4-commissions-tab.png

  Scenario: Commissions tab handles empty data
    Tool: Playwright (playwright skill)
    Preconditions: Commercial with NO commissions
    Steps:
      1. Navigate to: http://localhost:3000/commerciaux/{commercial-with-no-commissions}
      2. Click: "Commissions" tab
      3. Wait for: Content loaded (no spinner, timeout: 10s)
      4. Assert: Empty state message visible (e.g., "Aucune commission")
      5. Assert: No error message or crash
      6. Screenshot: .sisyphus/evidence/task-4-commissions-empty.png
    Expected Result: Clean empty state, no crash
    Evidence: .sisyphus/evidence/task-4-commissions-empty.png
  ```

  **Commit**: YES (group with Task 5)
  - Message: `feat(commerciaux): add Commissions and Contrats tab components`
  - Files: `frontend/src/components/commercial-detail/commercial-commissions.tsx`, `frontend/src/components/commercial-detail/commercial-contrats.tsx`
  - Pre-commit: `cd frontend && npx tsc --noEmit`

---

- [x] 5. Create CommercialContrats Tab Component

  **What to do**:
  - Create `frontend/src/components/commercial-detail/commercial-contrats.tsx`
  - Fetch contracts using `getContratsByOrganisation({ organisationId, commercialId })`
  - Display as a DataTable with columns: Référence, Client (nom), Statut, Montant, Date début, Date fin
  - Add loading state (Skeleton) while fetching
  - Add empty state: "Aucun contrat associé à ce commercial"
  - Make rows clickable → navigate to `/contrats/{id}` (if contrat detail page exists) or show details inline
  - Props: `{ commercialId: string, organisationId: string }`
  - Use gradient card styling matching client page's contract section

  **Must NOT do**:
  - Do NOT add contract creation/edit from this view
  - Do NOT add client list alongside contracts (user chose contracts only)
  - Do NOT add complex filtering — basic search at most

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: Data table component with gRPC data fetching
  - **Skills**: [`frontend-ui-ux`]
    - `frontend-ui-ux`: Table patterns, empty states, gradient card styling

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 4, 6, 7)
  - **Blocks**: Task 8
  - **Blocked By**: None (standalone component)

  **References**:

  **Pattern References**:
  - `frontend/src/components/client-detail/client-contracts.tsx` — Contract table pattern in client detail. Shows column definitions, row actions, status badges.
  - `frontend/src/app/(main)/clients/[id]/client-detail-client.tsx:830-845` — How contracts section is rendered in overview tab

  **API/Type References**:
  - `frontend/src/actions/contrats.ts` — `getContratsByOrganisation` with `commercialId` parameter
  - `packages/proto/src/contrats/contrats.proto` — Contrat message definition

  **Acceptance Criteria**:

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: Contrats tab shows contracts for this commercial
    Tool: Playwright (playwright skill)
    Preconditions: Dev server running, commercial with contracts exists
    Steps:
      1. Navigate to: http://localhost:3000/commerciaux/{known-id-with-contracts}
      2. Click: "Contrats" tab
      3. Wait for: Table visible (timeout: 10s)
      4. Assert: Table has columns (Référence or similar, Client, Statut)
      5. Assert: At least 1 row visible
      6. Screenshot: .sisyphus/evidence/task-5-contrats-tab.png
    Expected Result: Contracts table displays with data
    Evidence: .sisyphus/evidence/task-5-contrats-tab.png

  Scenario: Contrats tab handles no contracts
    Tool: Playwright (playwright skill)
    Preconditions: Commercial with no contracts
    Steps:
      1. Navigate to: http://localhost:3000/commerciaux/{commercial-with-no-contracts}
      2. Click: "Contrats" tab
      3. Wait for: Content loaded (timeout: 10s)
      4. Assert: Empty state message visible ("Aucun contrat" or similar)
      5. Assert: No crash or error
      6. Screenshot: .sisyphus/evidence/task-5-contrats-empty.png
    Expected Result: Clean empty state
    Evidence: .sisyphus/evidence/task-5-contrats-empty.png
  ```

  **Commit**: YES (grouped with Task 4)
  - Message: `feat(commerciaux): add Commissions and Contrats tab components`
  - Files: `frontend/src/components/commercial-detail/commercial-contrats.tsx`

---

- [x] 6. Create CommercialActivitesTaches Tab + Server Actions

  **What to do**:
  - **Part A — Server Actions**: Add to `frontend/src/actions/commerciaux.ts`:
    - `listActivitesByPartenaire(organisationId: string, partenaireId: string)` — wraps existing activité listing with partenaire filter (check if the gRPC ListActivites accepts `clientPartenaireId` filter, or if a broader `listActivites` with filter is available)
    - `listTachesByPartenaire(organisationId: string, partenaireId: string)` — wraps existing tâche listing with partenaire filter (similar approach)
    - If the gRPC service doesn't support filtering by partenaireId directly, use the broadest list method available and filter client-side
  - **Part B — Component**: Create `frontend/src/components/commercial-detail/commercial-activites-taches.tsx`
    - Two sections: Activités (timeline) + Tâches (list)
    - Adapt display patterns from `ClientActivites` and `ClientTaches`
    - Show activity timeline with type, date, description
    - Show task list with title, status, priority, due date
    - Add loading states and empty states for both sections
    - Props: `{ commercialId: string, organisationId: string }`

  **Must NOT do**:
  - Do NOT modify the gRPC proto files
  - Do NOT modify existing `ClientActivites` or `ClientTaches` components
  - Do NOT add activity/task creation from this view (read-only for V1 — can add in future iteration)

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: Server actions + UI component with timeline pattern
  - **Skills**: [`frontend-ui-ux`]
    - `frontend-ui-ux`: Timeline display, list patterns, empty states

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 4, 5, 7)
  - **Blocks**: Task 8
  - **Blocked By**: None (standalone)

  **References**:

  **Pattern References**:
  - `frontend/src/components/activites/client-activites.tsx` — Activity timeline pattern: card-based display, chronological ordering, type icons, date formatting
  - `frontend/src/components/client-detail/client-taches.tsx` — Task list pattern: status badges, priority indicators, due dates, completion tracking

  **API/Type References**:
  - `frontend/src/actions/activites.ts` — Existing `listActivitesByClient` as reference for creating `listActivitesByPartenaire`
  - `frontend/src/actions/taches.ts` — Existing `listTachesByClient` as reference
  - `packages/proto/src/activites/activites.proto` — Check if ListActivites accepts partenaireId filter
  - `packages/proto/src/taches/taches.proto` — Check if ListTaches accepts partenaireId filter

  **Acceptance Criteria**:

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: Activités & Tâches tab renders
    Tool: Playwright (playwright skill)
    Preconditions: Dev server running, commercial exists
    Steps:
      1. Navigate to: http://localhost:3000/commerciaux/{known-id}
      2. Click: "Activités & Tâches" tab
      3. Wait for: Content visible (timeout: 10s)
      4. Assert: "Activités" section heading or content visible
      5. Assert: "Tâches" section heading or content visible
      6. Assert: No error messages or crash
      7. Screenshot: .sisyphus/evidence/task-6-activites-taches.png
    Expected Result: Both sections render (with data or empty states)
    Evidence: .sisyphus/evidence/task-6-activites-taches.png

  Scenario: Empty states show correctly
    Tool: Playwright (playwright skill)
    Preconditions: Commercial with no activities or tasks
    Steps:
      1. Navigate to: http://localhost:3000/commerciaux/{commercial-with-no-activity}
      2. Click: "Activités & Tâches" tab
      3. Wait for: Content loaded (timeout: 10s)
      4. Assert: Empty state for activités ("Aucune activité" or similar)
      5. Assert: Empty state for tâches ("Aucune tâche" or similar)
      6. Screenshot: .sisyphus/evidence/task-6-empty-states.png
    Expected Result: Clean empty states, no errors
    Evidence: .sisyphus/evidence/task-6-empty-states.png
  ```

  **Commit**: YES
  - Message: `feat(commerciaux): add Activités & Tâches tab with server actions`
  - Files: `frontend/src/components/commercial-detail/commercial-activites-taches.tsx`, `frontend/src/actions/commerciaux.ts`
  - Pre-commit: `cd frontend && npx tsc --noEmit`

---

- [x] 7. Create CommercialDocuments Tab Component

  **What to do**:
  - Create `frontend/src/components/commercial-detail/commercial-documents.tsx`
  - Data source: fetch bordereaux for this commercial and extract `fichier_pdf_url` and `fichier_excel_url` fields
  - Display as a document list with: document name (bordereau reference + period), type (PDF/Excel), date, download link
  - Use `getBordereauxByOrganisation({ organisationId, apporteurId })` to fetch data
  - Format each bordereau's exports as document entries
  - Add loading state and empty state ("Aucun document disponible")
  - Props: `{ commercialId: string, organisationId: string }`
  - Style as card-based list matching ClientDocuments visual pattern

  **Must NOT do**:
  - Do NOT add file upload functionality (no document storage for commercials)
  - Do NOT create a full document management system
  - Do NOT modify the bordereaux service or proto

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: UI component displaying document list from bordereau data
  - **Skills**: [`frontend-ui-ux`]
    - `frontend-ui-ux`: Document list UI, download links, card patterns

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 4, 5, 6)
  - **Blocks**: Task 8
  - **Blocked By**: None (standalone)

  **References**:

  **Pattern References**:
  - `frontend/src/components/client-detail/client-documents.tsx` — Document list pattern: file type icons, name, date, download action
  - `frontend/src/components/commissions/bordereaux-list.tsx` — How bordereaux display export links (PDF/Excel URLs)

  **API/Type References**:
  - `frontend/src/actions/commissions.ts` — `getBordereauxByOrganisation` with apporteurId filter
  - `packages/proto/src/commission/commission.proto` — Bordereau message with `fichier_pdf_url`, `fichier_excel_url` fields

  **Acceptance Criteria**:

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: Documents tab shows bordereau exports
    Tool: Playwright (playwright skill)
    Preconditions: Dev server running, commercial with exported bordereaux exists
    Steps:
      1. Navigate to: http://localhost:3000/commerciaux/{known-id}
      2. Click: "Documents" tab
      3. Wait for: Content visible (timeout: 10s)
      4. Assert: At least one document entry visible (if commercial has bordereaux)
      5. Assert: Document entries show file type (PDF/Excel icon or label)
      6. Assert: Download link or button visible
      7. Screenshot: .sisyphus/evidence/task-7-documents-tab.png
    Expected Result: Document list populated from bordereau exports
    Evidence: .sisyphus/evidence/task-7-documents-tab.png

  Scenario: Documents tab handles no documents
    Tool: Playwright (playwright skill)
    Preconditions: Commercial with no bordereaux exports
    Steps:
      1. Navigate to: http://localhost:3000/commerciaux/{commercial-no-bordereaux}
      2. Click: "Documents" tab
      3. Wait for: Content loaded (timeout: 10s)
      4. Assert: Empty state visible ("Aucun document" or similar)
      5. Screenshot: .sisyphus/evidence/task-7-documents-empty.png
    Expected Result: Clean empty state
    Evidence: .sisyphus/evidence/task-7-documents-empty.png
  ```

  **Commit**: YES (group with Tasks 4, 5 if not already committed)
  - Message: `feat(commerciaux): add Documents tab component`
  - Files: `frontend/src/components/commercial-detail/commercial-documents.tsx`
  - Pre-commit: `cd frontend && npx tsc --noEmit`

---

- [x] 8. Update SSR Page + Final Integration

  **What to do**:
  - Update `frontend/src/app/(main)/commerciaux/[id]/page.tsx` to expand SSR data fetching:
    - Fetch commercial data (already done)
    - Fetch initial commissions for this commercial
    - Fetch initial bordereaux for this commercial
    - Fetch initial contracts for this commercial
    - Pass all data as props to `CommercialDetailClient`
  - Update `CommercialDetailClient` props interface to accept expanded data
  - Wire all tab components into the main page with proper data passing
  - Ensure all tab components receive their initial data from SSR props
  - Add error boundaries or error states for failed fetches
  - Final build verification: `npm run build` must pass

  **Must NOT do**:
  - Do NOT add unnecessary SSR fetches (activities/tasks can be client-fetched)
  - Do NOT modify the backend services
  - Do NOT add caching or revalidation logic beyond what's standard in the app

  **Recommended Agent Profile**:
  - **Category**: `unspecified-low`
    - Reason: Integration task wiring existing components together
  - **Skills**: [`frontend-ui-ux`]
    - `frontend-ui-ux`: Next.js SSR patterns, component integration

  **Parallelization**:
  - **Can Run In Parallel**: NO (final integration)
  - **Parallel Group**: Wave 3 (sequential, after all others)
  - **Blocks**: None (final task)
  - **Blocked By**: Tasks 3, 4, 5, 6, 7

  **References**:

  **Pattern References**:
  - `frontend/src/app/(main)/clients/[id]/page.tsx` — SSR data fetching pattern for client detail. Shows how to fetch multiple data sources and pass as props.
  - `frontend/src/app/(main)/commerciaux/[id]/page.tsx` — Current SSR (only fetches getApporteur)

  **API/Type References**:
  - `frontend/src/actions/commerciaux.ts` — getApporteur
  - `frontend/src/actions/commissions.ts` — getCommissionsByOrganisation, getBordereauxByOrganisation
  - `frontend/src/actions/contrats.ts` — getContratsByOrganisation

  **Acceptance Criteria**:

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: Full page renders with all tabs functional
    Tool: Playwright (playwright skill)
    Preconditions: Dev server running, commercial with data exists
    Steps:
      1. Navigate to: http://localhost:3000/commerciaux/{known-id}
      2. Wait for: Page fully loaded (timeout: 15s)
      3. Assert: Header visible with name and badges
      4. Assert: 5 tabs visible
      5. Assert: Overview tab active with stats and accordion
      6. Click: "Commissions" tab → Assert content loads
      7. Click: "Contrats" tab → Assert content loads
      8. Click: "Activités & Tâches" tab → Assert content loads
      9. Click: "Documents" tab → Assert content loads
      10. Screenshot: .sisyphus/evidence/task-8-full-page.png
    Expected Result: All tabs load without errors
    Evidence: .sisyphus/evidence/task-8-full-page.png

  Scenario: Build passes with all changes
    Tool: Bash
    Preconditions: All previous tasks committed
    Steps:
      1. Run: cd frontend && npm run build
      2. Assert: Exit code 0
      3. Assert: No TypeScript errors in output
    Expected Result: Clean build
    Evidence: Build output captured

  Scenario: Mobile responsive layout
    Tool: Playwright (playwright skill)
    Preconditions: Dev server running
    Steps:
      1. Set viewport: 375x667
      2. Navigate to: http://localhost:3000/commerciaux/{known-id}
      3. Wait for: Page loaded (timeout: 15s)
      4. Assert: No horizontal scrollbar
      5. Assert: Tabs stack or scroll horizontally
      6. Assert: Content readable
      7. Screenshot: .sisyphus/evidence/task-8-mobile.png
    Expected Result: Fully responsive on mobile
    Evidence: .sisyphus/evidence/task-8-mobile.png

  Scenario: Page handles non-existent commercial
    Tool: Playwright (playwright skill)
    Preconditions: Dev server running
    Steps:
      1. Navigate to: http://localhost:3000/commerciaux/non-existent-uuid
      2. Wait for: Response (timeout: 10s)
      3. Assert: Error page or redirect shown (not blank page or crash)
      4. Screenshot: .sisyphus/evidence/task-8-not-found.png
    Expected Result: Graceful error handling for invalid ID
    Evidence: .sisyphus/evidence/task-8-not-found.png
  ```

  **Commit**: YES
  - Message: `feat(commerciaux): integrate SSR data fetching and finalize tabbed detail page`
  - Files: `frontend/src/app/(main)/commerciaux/[id]/page.tsx`, `frontend/src/app/(main)/commerciaux/[id]/commercial-detail-client.tsx`
  - Pre-commit: `cd frontend && npm run build`

---

## Commit Strategy

| After Task | Message | Files | Verification |
|------------|---------|-------|--------------|
| 1 + 2 | `feat(commerciaux): add CommercialHeader and CommercialInfoAccordion components` | commercial-header.tsx, commercial-info-accordion.tsx | `npx tsc --noEmit` |
| 3 | `feat(commerciaux): restructure detail page with tabbed layout` | commercial-detail-client.tsx | `npx tsc --noEmit` |
| 4 + 5 | `feat(commerciaux): add Commissions and Contrats tab components` | commercial-commissions.tsx, commercial-contrats.tsx | `npx tsc --noEmit` |
| 6 | `feat(commerciaux): add Activités & Tâches tab with server actions` | commercial-activites-taches.tsx, commerciaux.ts (actions) | `npx tsc --noEmit` |
| 7 | `feat(commerciaux): add Documents tab component` | commercial-documents.tsx | `npx tsc --noEmit` |
| 8 | `feat(commerciaux): integrate SSR data fetching and finalize tabbed detail page` | page.tsx, commercial-detail-client.tsx | `npm run build` |

---

## Success Criteria

### Verification Commands
```bash
cd frontend && npm run build    # Expected: exit code 0, no errors
cd frontend && npx tsc --noEmit # Expected: exit code 0
```

### Final Checklist
- [x] All 5 tabs render (Vue d'ensemble, Commissions, Contrats, Activités & Tâches, Documents)
- [x] Header shows name, type badge, status badge, action buttons
- [x] Accordion has 2 sections (Coordonnées, Métadonnées)
- [x] Commissions tab shows 3 sub-sections (Commissions, Bordereaux, Reprises)
- [x] Contrats tab shows contracts filtered by commercial_id
- [x] Activities & Tasks tab renders (with data or empty states)
- [x] Documents tab shows bordereau exports (or empty state)
- [x] Empty states for all tabs when no data (no crashes)
- [x] Mobile responsive at 375px viewport
- [x] Build passes: `npm run build` → exit 0
- [x] No modifications to existing client-detail or commission components
- [x] No new gRPC proto files or backend changes (except server action wrappers)
