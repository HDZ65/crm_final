# Catalogue Page Bug Fixes — 3 Remaining Bugs

## TL;DR

> **Quick Summary**: Fix 3 bugs in the catalogue page: missing Edit Gamme dialog, products not refetching when société changes, products not refetching when gamme selection changes. All fixes are in a single file.
>
> **Deliverables**:
> - Edit Gamme dialog with société dropdown (allows changing société on existing gammes)
> - Product refetch when société changes in header
> - Product refetch when user clicks a different gamme in sidebar
>
> **Estimated Effort**: Quick (single file, ~100 lines of changes)
> **Parallel Execution**: NO — all changes in one file, one task
> **Critical Path**: Bug fixes → TypeScript verify

---

## Context

### Original Request
Complete the gamme-société association feature by fixing the 3 remaining bugs in the catalogue page UI. Backend is 100% done. Frontend data layer (actions + hooks) is 100% done. Only UI bugs remain.

### What's Already Working
- Create Gamme dialog with société dropdown ✅
- Gammes auto-filter by société when société changes ✅
- Backend `societe_id` column active in database ✅
- `updateGamme` server action exists and works ✅

---

## Work Objectives

### Core Objective
Fix 3 bugs in `catalogue-page-client.tsx` to complete the gamme-société association feature.

### Concrete Deliverables
- `frontend/src/app/(main)/catalogue/catalogue-page-client.tsx` — 3 bug fixes applied

### Must Have
- Edit Gamme dialog with société dropdown
- Products refetch when société changes
- Products refetch when gamme selection changes
- TypeScript compilation passes

### Must NOT Have (Guardrails)
- ❌ Do NOT modify any other files
- ❌ Do NOT change the Create Gamme Dialog (it works fine)
- ❌ Do NOT change the product filtering logic in `fetchProduits`
- ❌ Do NOT touch the SSR page.tsx
- ❌ Do NOT add `@ManyToOne` or FK constraints anywhere
- ❌ Do NOT modify the header-societe-selector

---

## Verification Strategy

### Test Decision
- **Automated tests**: None (no test infrastructure for this page)
- **Verification**: TypeScript compilation + visual code review

### Agent-Executed QA Scenarios

```
Scenario: TypeScript compilation passes
  Tool: Bash
  Steps:
    1. cd frontend && npx tsc --noEmit
  Expected Result: No errors
  Evidence: Terminal output
```

---

## TODOs

- [x] 1. Fix all 3 bugs in catalogue-page-client.tsx + verify TypeScript compilation

  **What to do**:

  Apply ALL THREE fixes below to `frontend/src/app/(main)/catalogue/catalogue-page-client.tsx`:

  ### Fix A: Add `updateGamme` import

  In the import block at lines 17-25, add `updateGamme as updateGammeAction`:

  ```typescript
  import {
    getGammesByOrganisation,
    createGamme as createGammeAction,
    updateGamme as updateGammeAction,   // ← ADD THIS LINE
    getProduitsByOrganisation,
    createProduit as createProduitAction,
    updateProduit as updateProduitAction,
    getSocietesByOrganisation,
    syncCatalogue,
  } from "@/actions/catalogue"
  ```

  ### Fix B: Add Edit Gamme state variables

  After line 157 (after `newGammeForm` state), add:

  ```typescript
  // Edit Gamme state
  const [isEditGammeDialogOpen, setIsEditGammeDialogOpen] = React.useState(false)
  const [gammeToEdit, setGammeToEdit] = React.useState<Gamme | null>(null)
  const [editGammeForm, setEditGammeForm] = React.useState({
    societeId: "",
    nom: "",
    description: "",
  })
  const [updateGammeLoading, setUpdateGammeLoading] = React.useState(false)
  ```

  ### Fix C: Add `handleUpdateGamme` handler

  After the `handleCreateGamme` function (after line 353), add:

  ```typescript
  const handleOpenEditGamme = (gamme: Gamme) => {
    setGammeToEdit(gamme)
    setEditGammeForm({
      societeId: gamme.societeId || "",
      nom: gamme.nom,
      description: gamme.description || "",
    })
    setIsEditGammeDialogOpen(true)
  }

  const handleUpdateGamme = async () => {
    if (!gammeToEdit || !activeOrganisation?.organisationId) return
    const { nom, description, societeId } = editGammeForm
    if (!nom.trim()) return

    setUpdateGammeLoading(true)

    const societeIdValue = societeId && societeId !== "none" ? societeId : undefined
    const result = await updateGammeAction({
      id: gammeToEdit.id,
      societeId: societeIdValue,
      nom: nom.trim(),
      description: description.trim() || undefined,
    })

    setUpdateGammeLoading(false)

    if (result.error) {
      toast.error(result.error)
    } else if (result.data) {
      toast.success("Gamme mise à jour avec succès")
      setIsEditGammeDialogOpen(false)
      setGammeToEdit(null)
      await refetchGammes()
    }
  }
  ```

  **IMPORTANT NOTE on `societeId` field**: The `Gamme` type from proto uses camelCase `societeId`. Check the actual field name on the Gamme type before using it. It might be `societe_id` or `societeId` — look at `frontend/src/proto/products/products.ts` for the Gamme interface to confirm the exact field name. If it's `societe_id`, use `gamme.societe_id` instead of `gamme.societeId`.

  ### Fix D: Add Edit button to gamme sidebar items

  In the `filteredGammes.map` block (around line 444-460), modify each gamme button to include an Edit icon. Replace:

  ```tsx
  {filteredGammes.map((gamme) => (
    <button
      key={gamme.id}
      onClick={() => setSelectedGammeId(gamme.id)}
      className={cn(
        "w-full flex items-center justify-between px-3 py-2 rounded-md text-left transition-colors text-sm",
        selectedGammeId === gamme.id
          ? "bg-muted font-medium text-foreground"
          : "hover:bg-muted/50"
      )}
    >
      <span className="truncate capitalize">{gamme.nom.toLowerCase()}</span>
      {selectedGammeId === gamme.id && (
        <ChevronRight className="h-4 w-4 shrink-0" />
      )}
    </button>
  ))}
  ```

  With:

  ```tsx
  {filteredGammes.map((gamme) => (
    <button
      key={gamme.id}
      onClick={() => setSelectedGammeId(gamme.id)}
      className={cn(
        "w-full flex items-center justify-between px-3 py-2 rounded-md text-left transition-colors text-sm group",
        selectedGammeId === gamme.id
          ? "bg-muted font-medium text-foreground"
          : "hover:bg-muted/50"
      )}
    >
      <span className="truncate capitalize">{gamme.nom.toLowerCase()}</span>
      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={(e) => {
            e.stopPropagation()
            handleOpenEditGamme(gamme)
          }}
          className="h-6 w-6 rounded-md flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-accent transition-opacity"
        >
          <Edit className="h-3 w-3" />
        </button>
        {selectedGammeId === gamme.id && (
          <ChevronRight className="h-4 w-4" />
        )}
      </div>
    </button>
  ))}
  ```

  ### Fix E: Add Edit Gamme Dialog JSX

  After the Create Gamme Dialog closing `</Dialog>` (after line 680, before `</main>`), add:

  ```tsx
  {/* Edit Gamme Dialog */}
  <Dialog open={isEditGammeDialogOpen} onOpenChange={setIsEditGammeDialogOpen}>
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Modifier la gamme</DialogTitle>
        <DialogDescription>
          Modifiez les informations de la gamme.
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-4 py-4">
        <div className="space-y-2">
          <Label htmlFor="edit-gamme-nom">Nom de la gamme *</Label>
          <Input
            id="edit-gamme-nom"
            placeholder="Ex: Santé, Obsèque, Dépendance..."
            value={editGammeForm.nom}
            onChange={(e) =>
              setEditGammeForm((prev) => ({ ...prev, nom: e.target.value }))
            }
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="edit-gamme-description">Description</Label>
          <Input
            id="edit-gamme-description"
            placeholder="Description de la gamme (optionnel)"
            value={editGammeForm.description}
            onChange={(e) =>
              setEditGammeForm((prev) => ({ ...prev, description: e.target.value }))
            }
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="edit-gamme-societe">Société</Label>
          <Select
            value={editGammeForm.societeId || "none"}
            onValueChange={(value) =>
              setEditGammeForm((prev) => ({ ...prev, societeId: value }))
            }
          >
            <SelectTrigger id="edit-gamme-societe">
              <SelectValue placeholder="Aucune société" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Aucune société</SelectItem>
              {societes.map((societe) => (
                <SelectItem key={societe.id} value={societe.id}>
                  {societe.raisonSociale}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <DialogFooter>
        <Button
          variant="outline"
          onClick={() => {
            setIsEditGammeDialogOpen(false)
            setGammeToEdit(null)
          }}
        >
          Annuler
        </Button>
        <Button
          onClick={handleUpdateGamme}
          disabled={!editGammeForm.nom.trim() || updateGammeLoading}
        >
          {updateGammeLoading ? "Enregistrement..." : "Enregistrer"}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
  ```

  ### Fix F: Add `fetchProduits()` to société change useEffect (Bug 2)

  Find the useEffect at lines 262-269:

  ```typescript
  // Reset selections and refetch when société changes
  React.useEffect(() => {
    setSelectedGammeId("all")
    setGammeSearchQuery("")
    setProductSearchQuery("")
    fetchGammes()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSocieteId])
  ```

  Replace with:

  ```typescript
  // Reset selections and refetch when société changes
  React.useEffect(() => {
    setSelectedGammeId("all")
    setGammeSearchQuery("")
    setProductSearchQuery("")
    fetchGammes()
    fetchProduits()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSocieteId])
  ```

  ### Fix G: Add gamme selection refetch useEffect (Bug 3)

  After the existing useEffect at lines 272-274:

  ```typescript
  // Reset product search when gamme changes
  React.useEffect(() => {
    setProductSearchQuery("")
  }, [selectedGammeId])
  ```

  Add this NEW useEffect right after:

  ```typescript
  // Refetch products when gamme selection changes (skip initial render)
  const isInitialGammeSelection = React.useRef(true)
  React.useEffect(() => {
    if (isInitialGammeSelection.current) {
      isInitialGammeSelection.current = false
      return
    }
    fetchProduits()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedGammeId])
  ```

  **IMPORTANT**: The `const isInitialGammeSelection = React.useRef(true)` line must be BEFORE the useEffect, but still inside the component body (not inside another hook). Place it right before the useEffect.

  ### After all edits, verify:

  Run from `frontend/` directory:
  ```bash
  npx tsc --noEmit
  ```

  If there are TypeScript errors, fix them.

  **Must NOT do**:
  - Do NOT modify `fetchProduits` function logic
  - Do NOT modify the Create Gamme Dialog
  - Do NOT modify any other files
  - Do NOT add any new dependencies

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: [`frontend-ui-ux`]

  **References**:

  **Primary file to modify:**
  - `frontend/src/app/(main)/catalogue/catalogue-page-client.tsx` — The ONLY file to change

  **Pattern references (existing code to follow):**
  - `frontend/src/app/(main)/catalogue/catalogue-page-client.tsx:327-353` — `handleCreateGamme` handler pattern (follow same structure for `handleUpdateGamme`)
  - `frontend/src/app/(main)/catalogue/catalogue-page-client.tsx:609-680` — Create Gamme Dialog JSX (mirror this for Edit Gamme Dialog)
  - `frontend/src/app/(main)/catalogue/catalogue-page-client.tsx:262-269` — Société change useEffect (add `fetchProduits()` here)

  **API reference:**
  - `frontend/src/actions/catalogue.ts:101-131` — `updateGamme` action signature: `{ id: string, societeId?: string, nom?: string, description?: string, code?: string, icone?: string, ordre?: number, actif?: boolean }`

  **Type reference:**
  - `frontend/src/proto/products/products.ts` — Gamme type definition (check exact field name: `societeId` vs `societe_id`)

  **Acceptance Criteria**:
  - [ ] `updateGamme as updateGammeAction` imported from `@/actions/catalogue`
  - [ ] Edit Gamme dialog opens when clicking pencil icon on a gamme
  - [ ] Edit Gamme dialog pre-fills with current gamme data (nom, description, société)
  - [ ] Clicking pencil icon does NOT select the gamme (stopPropagation)
  - [ ] `fetchProduits()` is called in the société change useEffect
  - [ ] New useEffect watches `selectedGammeId` and calls `fetchProduits()` (with initial render skip)
  - [ ] `npx tsc --noEmit` passes with zero errors

  **Commit**: YES
  - Message: `fix(catalogue): add edit gamme dialog + fix produit refetch on société/gamme change`
  - Files: `frontend/src/app/(main)/catalogue/catalogue-page-client.tsx`
  - Pre-commit: `cd frontend && npx tsc --noEmit`

---

## Success Criteria

### Verification Commands
```bash
cd frontend && npx tsc --noEmit  # Expected: no errors
```

### Final Checklist
- [x] Edit Gamme dialog exists with société dropdown
- [x] Products refetch when société changes in header
- [x] Products refetch when clicking a different gamme
- [x] TypeScript compilation passes
- [x] No other files modified
