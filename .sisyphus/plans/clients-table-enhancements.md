# Clients Table Enhancements: Empty Contracts Display + Bulk Actions

## TL;DR

> **Quick Summary**: Add "Aucun contrat" display when clients have no contracts, and implement a bulk actions bar (export CSV, delete, change status, assign société) when multiple rows are selected.
> 
> **Deliverables**:
> - "Aucun contrat" muted text in contracts column when empty
> - Floating bulk action bar with 4 actions on row selection
> - Confirmation dialogs for destructive/mutation actions
> 
> **Estimated Effort**: Short
> **Parallel Execution**: NO - sequential (2 tasks, Task 2 depends on understanding of Task 1 patterns)
> **Critical Path**: Task 1 → Task 2

---

## Context

### Original Request
User wants two improvements to the clients table page:
1. When a client has no contract, display "Aucun contrat" instead of blank space
2. When selecting multiple clients via checkboxes, show bulk action options: export CSV, delete, change status, assign société

### Interview Summary
**Key Discussions**:
- All 4 bulk actions confirmed: CSV export, delete, change status, assign société
- Checkboxes already exist in the table (select column defined in `columns.tsx`)
- `DataTable` component already supports `onRowSelectionChange` callback

**Research Findings**:
- `contracts: []` is currently hardcoded in `mapClientToRow` — ALL clients will show "Aucun contrat" until contract data is wired
- No batch gRPC endpoints exist — bulk actions must loop individual calls
- `deleteClient(id)` and `updateClient({id, statut?, societeId?})` exist in `actions/clients.ts`
- Statuts already available as props in `ClientsPageClient({ statuts })`
- Sociétés can be fetched via `listSocietesByOrganisation` from `actions/societes.ts`
- Existing `handleExport` in `clients-page-client.tsx` already exports full table to CSV — can be adapted for selected rows

### Metis Review
**Identified Gaps** (addressed):
- Row selection keys are TanStack indices not IDs → must map via `filteredClients[index]` to get actual ClientRow
- Clear selection when filter/data changes to prevent stale indices → reset `rowSelection` in `fetchData`
- Disable bulk buttons during execution to prevent double-click race conditions
- Partial failure handling for bulk operations → use `Promise.allSettled`, report successes and failures
- DO NOT modify `data-table-basic.tsx` — it's shared across 6+ pages

---

## Work Objectives

### Core Objective
Enhance the clients list table with empty contract indication and multi-select bulk operations.

### Concrete Deliverables
- Modified `frontend/src/app/(main)/clients/columns.tsx` — "Aucun contrat" in contracts cell
- Modified `frontend/src/app/(main)/clients/clients-page-client.tsx` — bulk action bar + selection tracking + 4 bulk actions

### Definition of Done
- [x] Empty contracts column shows "Aucun contrat" in muted text
- [x] Selecting 1+ rows shows a bulk action bar
- [x] "Exporter CSV" exports only selected rows
- [x] "Supprimer" with confirmation deletes selected clients and reports results
- [x] "Changer statut" with dropdown changes status of selected clients
- [x] "Assigner société" with dropdown assigns société to selected clients
- [x] Selection clears after bulk operations complete
- [x] No modifications to `data-table-basic.tsx`

### Must Have
- Muted "Aucun contrat" text when contracts array is empty
- Bulk action bar visible when 1+ rows selected
- Confirmation dialog before bulk delete
- Progress/loading state during bulk operations
- Success/error toast after bulk operations with counts
- Selection resets after bulk operation completes

### Must NOT Have (Guardrails)
- DO NOT modify `data-table-basic.tsx` — it is shared across 6+ pages
- DO NOT add batch gRPC endpoints — use existing individual calls
- DO NOT implement "select all across pages" — only current page selection (TanStack default)
- DO NOT add undo mechanism for bulk delete
- DO NOT over-engineer: no throttling/batching for large selections — simple `Promise.allSettled` loop is sufficient for this CRM's scale
- DO NOT add `getRowId` to DataTable — selection indices work fine when mapped through `filteredClients`

---

## Verification Strategy (MANDATORY)

> **UNIVERSAL RULE: ZERO HUMAN INTERVENTION**
> ALL verification is executed by the agent using tools.

### Test Decision
- **Infrastructure exists**: YES (Next.js dev server)
- **Automated tests**: NO (no unit tests for this change)
- **Framework**: N/A

### Agent-Executed QA Scenarios (MANDATORY — ALL tasks)

**Verification Tool**: Playwright (browser)

---

## Execution Strategy

### Sequential Execution

```
Task 1: "Aucun contrat" display (no dependencies)
  ↓
Task 2: Bulk actions bar (builds on same page, benefits from Task 1 context)
```

### Dependency Matrix

| Task | Depends On | Blocks | Can Parallelize With |
|------|------------|--------|---------------------|
| 1    | None       | None   | Could parallel with 2 but same files |
| 2    | None       | None   | Could parallel with 1 but same files |

### Agent Dispatch Summary

| Wave | Tasks | Recommended Agents |
|------|-------|-------------------|
| 1    | 1, 2  | task(category="quick", load_skills=["frontend-ui-ux"], run_in_background=false) |

---

## TODOs

- [x] 1. Show "Aucun contrat" when client has no contracts

  **What to do**:
  - In `columns.tsx`, modify the `contracts` column cell renderer
  - When `row.original.contracts.length === 0`, render `<span className="text-sm text-muted-foreground">Aucun contrat</span>` instead of the empty badge list
  - Keep existing badge rendering for non-empty arrays

  **Must NOT do**:
  - Do not change the column header
  - Do not add any filtering logic

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Single-line conditional change in one file
  - **Skills**: [`frontend-ui-ux`]
    - `frontend-ui-ux`: Styling consistency with muted-foreground pattern

  **Parallelization**:
  - **Can Run In Parallel**: NO (same file context as Task 2 page)
  - **Parallel Group**: Sequential
  - **Blocks**: None
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `frontend/src/app/(main)/clients/columns.tsx:158-175` — Current contracts cell renderer with Badge mapping
  - `frontend/src/app/(main)/clients/columns.tsx:142` — Email column uses `"—"` for empty values — but user wants "Aucun contrat" text, not em dash

  **Acceptance Criteria**:

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: Clients with no contracts show "Aucun contrat"
    Tool: Playwright (playwright skill)
    Preconditions: Dev server running on localhost:3000, user logged in, at least one client exists
    Steps:
      1. Navigate to: http://localhost:3000/clients
      2. Wait for: table tbody tr visible (timeout: 10s)
      3. Look at the "Contrats actifs" column cells
      4. Assert: At least one cell contains text "Aucun contrat"
      5. Assert: "Aucun contrat" text has muted/gray styling (text-muted-foreground class)
      6. Screenshot: .sisyphus/evidence/task-1-aucun-contrat.png
    Expected Result: Clients without contracts display "Aucun contrat" in muted text
    Evidence: .sisyphus/evidence/task-1-aucun-contrat.png
  ```

  **Commit**: YES (groups with 2)
  - Message: `feat(clients): add "Aucun contrat" display and bulk actions`
  - Files: `frontend/src/app/(main)/clients/columns.tsx`

---

- [x] 2. Add bulk action bar when rows are selected

  **What to do**:

  **Step A — Track selection state in `clients-page-client.tsx`:**
  - Add state: `const [rowSelection, setRowSelection] = React.useState<Record<string, boolean>>({})`
  - Pass `onRowSelectionChange={setRowSelection}` to `<DataTable>`
  - Compute selected count: `const selectedCount = Object.keys(rowSelection).filter(k => rowSelection[k]).length`
  - Compute selected clients: Map selection indices to actual `ClientRow` objects via `filteredClients`:
    ```typescript
    const selectedClients = React.useMemo(() => {
      return Object.keys(rowSelection)
        .filter(k => rowSelection[k])
        .map(k => filteredClients[parseInt(k)])
        .filter(Boolean)
    }, [rowSelection, filteredClients])
    ```
  - Reset selection when data changes: In `fetchData`, add `setRowSelection({})` at the start

  **Step B — Build the bulk action bar:**
  - Show a bar between the filters and the table card (where the count text is) when `selectedCount > 0`
  - Bar content: `"{N} client(s) sélectionné(s)"` + action buttons
  - 4 action buttons:
    1. **Exporter CSV** (Download icon) — variant="outline"
    2. **Changer statut** (Shield icon) — variant="outline", opens a DropdownMenu with statut options from `statuts` prop
    3. **Assigner société** (Building2 icon) — variant="outline", opens a DropdownMenu with société options (fetched from `listSocietesByOrganisation`)
    4. **Supprimer** (Trash2 icon) — variant="destructive", opens AlertDialog confirmation

  **Step C — Implement bulk export CSV:**
  - Similar to existing `handleExport` but filter to only `selectedClients`
  - Include headers: Nom, Email, Téléphone, Statut, Contrats
  - Download as `clients_selection_{date}.csv`

  **Step D — Implement bulk delete:**
  - Show AlertDialog: "Supprimer {N} clients ? Cette action est irréversible."
  - Add `isBulkDeleting` state for loading
  - Use `Promise.allSettled(selectedClients.map(c => deleteClient(c.id)))`
  - Count successes and failures from settled results
  - Toast: `"{successCount} client(s) supprimé(s)"` or `"{failCount} erreur(s) sur {total}"`
  - Clear selection and refresh data after completion

  **Step E — Implement bulk status change:**
  - DropdownMenu with statuts from `statuts` prop (already available)
  - On select: `Promise.allSettled(selectedClients.map(c => updateClient({ id: c.id, statut: selectedStatutId })))`
  - Same success/failure toast pattern
  - Clear selection and refresh after completion

  **Step F — Implement bulk société assignment:**
  - Fetch sociétés list: Use `listSocietesByOrganisation` on component mount (or lazy on dropdown open)
  - DropdownMenu with société options
  - On select: `Promise.allSettled(selectedClients.map(c => updateClient({ id: c.id, societeId: selectedSocieteId })))`
  - Same success/failure toast pattern
  - Clear selection and refresh after completion

  **Must NOT do**:
  - Do not modify `data-table-basic.tsx`
  - Do not add batch gRPC endpoints
  - Do not implement cross-page selection
  - Do not add individual progress per row

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: All changes scoped to one file, well-defined patterns
  - **Skills**: [`frontend-ui-ux`]
    - `frontend-ui-ux`: Action bar layout, dropdown menus, responsive styling

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Sequential (after Task 1)
  - **Blocks**: None
  - **Blocked By**: Task 1 (same commit group)

  **References**:

  **Pattern References**:
  - `frontend/src/app/(main)/clients/clients-page-client.tsx:208-235` — Existing `handleExport` function for CSV export pattern
  - `frontend/src/app/(main)/clients/clients-page-client.tsx:390-410` — Current table area where bulk bar should be inserted
  - `frontend/src/app/(main)/clients/columns.tsx:193-288` — ActionsCell with delete confirmation pattern (AlertDialog usage)
  - `frontend/src/components/data-table-basic.tsx:31-32` — `onRowSelectionChange` prop already available
  - `frontend/src/actions/clients.ts:158-186` — `updateClient` function for status/société changes
  - `frontend/src/actions/clients.ts:191-205` — `deleteClient` function
  - `frontend/src/actions/societes.ts:36` — `listSocietesByOrganisation` for société list

  **API/Type References**:
  - `frontend/src/lib/ui/display-types/client.ts:20-29` — `ClientRow` type with `id`, `name`, `status`, `societeIds`
  - `frontend/src/constants/statuts-client.ts` — `StatutClient` type with `id`, `code`, `nom`

  **External References**:
  - Shadcn DropdownMenu: Already used in ActionsCell pattern
  - Shadcn AlertDialog: Already used for single delete confirmation
  - Sonner toast: Already used throughout the page

  **Acceptance Criteria**:

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: Bulk action bar appears when rows are selected
    Tool: Playwright (playwright skill)
    Preconditions: Dev server running on localhost:3000, user logged in, multiple clients exist
    Steps:
      1. Navigate to: http://localhost:3000/clients
      2. Wait for: table tbody tr visible (timeout: 10s)
      3. Click: First row checkbox (input[type="checkbox"] or [role="checkbox"] in first data row)
      4. Assert: Bulk action bar visible with text containing "1 client(s) sélectionné(s)"
      5. Assert: 4 action buttons visible (Exporter, Changer statut, Assigner société, Supprimer)
      6. Click: Second row checkbox
      7. Assert: Text updates to "2 client(s) sélectionné(s)"
      8. Screenshot: .sisyphus/evidence/task-2-bulk-bar.png
    Expected Result: Bulk action bar appears with correct selection count and all 4 actions
    Evidence: .sisyphus/evidence/task-2-bulk-bar.png

  Scenario: Bulk CSV export exports only selected rows
    Tool: Playwright (playwright skill)
    Preconditions: 2+ clients selected in table
    Steps:
      1. With 2 clients selected, click the "Exporter" button in bulk bar
      2. Assert: Download triggered (file with name matching clients_selection_*.csv)
      3. Assert: Toast shows "Export CSV téléchargé"
    Expected Result: CSV file downloaded containing only selected clients
    Evidence: .sisyphus/evidence/task-2-bulk-export.png

  Scenario: Bulk delete with confirmation
    Tool: Playwright (playwright skill)
    Preconditions: 1+ clients selected in table
    Steps:
      1. With 1 client selected, click "Supprimer" button in bulk bar
      2. Wait for: AlertDialog visible (timeout: 3s)
      3. Assert: Dialog text contains "1 client"
      4. Assert: "Annuler" and "Supprimer" buttons visible
      5. Click: "Annuler"
      6. Assert: Dialog closes, selection unchanged
      7. Screenshot: .sisyphus/evidence/task-2-bulk-delete-confirm.png
    Expected Result: Confirmation dialog shows before bulk delete, cancel works
    Evidence: .sisyphus/evidence/task-2-bulk-delete-confirm.png

  Scenario: Deselecting all rows hides the bulk bar
    Tool: Playwright (playwright skill)
    Preconditions: 1+ clients selected, bulk bar visible
    Steps:
      1. Uncheck the selected row checkbox
      2. Assert: Bulk action bar is no longer visible
      3. Assert: Normal count text "{N} client(s)" is visible
      4. Screenshot: .sisyphus/evidence/task-2-bar-hidden.png
    Expected Result: Bulk bar disappears when no rows selected
    Evidence: .sisyphus/evidence/task-2-bar-hidden.png
  ```

  **Commit**: YES (groups with 1)
  - Message: `feat(clients): add "Aucun contrat" display and bulk actions`
  - Files: `frontend/src/app/(main)/clients/columns.tsx`, `frontend/src/app/(main)/clients/clients-page-client.tsx`
  - Pre-commit: Dev server compiles without errors

---

## Commit Strategy

| After Task | Message | Files | Verification |
|------------|---------|-------|--------------|
| 2 (both) | `feat(clients): add "Aucun contrat" display and bulk actions bar` | columns.tsx, clients-page-client.tsx | Dev server compiles |

---

## Success Criteria

### Verification Commands
```bash
# Frontend compiles
curl -s http://localhost:3000/clients  # Expected: 200 OK
```

### Final Checklist
- [x] "Aucun contrat" shows for clients without contracts
- [x] Bulk action bar appears on row selection with count
- [x] CSV export works for selected rows only
- [x] Bulk delete shows confirmation, executes, reports results
- [x] Bulk status change works via dropdown
- [x] Bulk société assignment works via dropdown
- [x] Selection clears after each bulk operation
- [x] No changes to `data-table-basic.tsx`
- [x] Dev server compiles without errors
