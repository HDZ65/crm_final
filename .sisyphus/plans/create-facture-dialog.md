# Create Facture Dialog - Plan

## TL;DR

> **Quick Summary**: Créer un dialog de création de facture avec lignes dynamiques et l'intégrer dans la page facturation, remplaçant le placeholder `toast.info("Création de facture à venir")`.
> 
> **Deliverables**:
> - `frontend/src/components/create-facture-dialog.tsx` - Dialog complet avec formulaire
> - `frontend/src/app/(main)/facturation/facturation-page-client.tsx` - Intégration du dialog
> 
> **Estimated Effort**: Short (1 fichier nouveau + 1 modification)
> **Parallel Execution**: NO - sequential (create then integrate)
> **Critical Path**: Task 1 → Task 2

---

## Context

### Original Request
L'utilisateur veut pouvoir créer des factures depuis la page facturation. Le bouton "Nouvelle facture" affiche actuellement `toast.info("Création de facture à venir")`. Tous les éléments backend (server actions, gRPC client, proto) existent déjà.

### Existing Code Analysis

**Server action ready** (`frontend/src/actions/factures.ts:67-99`):
```typescript
export async function createFacture(input: {
  organisationId: string;
  dateEmission: string;
  statutId: string;
  emissionFactureId: string;
  clientBaseId: string;
  contratId: string;
  clientPartenaireId?: string;
  adresseFacturationId?: string;
  lignes: Array<{
    produitId: string;
    quantite: number;
    prixUnitaire: number;
    description: string;
    tauxTva: number;
  }>;
}): Promise<ActionResult<Facture>>
```

**gRPC client ready** (`frontend/src/lib/grpc/clients/factures.ts:42-46`):
```typescript
factures.create(request: CreateFactureRequest): Promise<Facture>
```

**Proto types** (`frontend/src/proto/factures/factures.ts`):
- `CreateFactureRequest` (lines 211-221)
- `CreateLigneFactureItem` (lines 223-229) — produitId, quantite, prixUnitaire, description, tauxTva
- `StatutFacture` (lines 30-38) — id, code, nom, description
- `Facture` (lines 187-209) — includes lignes[], client, statut relations

**Parent page** (`frontend/src/app/(main)/facturation/facturation-page-client.tsx`):
- Has `activeOrganisation` from `useOrganisation()` context
- Has `statuts` prop (array of `StatutFacture[]`)
- Has `refetch` callback (`fetchData`) to reload factures list
- **Line 317**: `onClick={() => toast.info("Création de facture à venir")}` — "Nouvelle facture" button
- **Line 431**: `onClick={() => toast.info("Création de facture à venir")}` — "Créer ma première facture" button

**Pattern reference**: `frontend/src/components/create-contrat-dialog.tsx` uses:
- react-hook-form + zod validation
- Dialog/DialogContent/DialogHeader/DialogTitle from Shadcn
- Form/FormField/FormItem/FormLabel/FormControl/FormMessage
- `useOrganisation()` for organisationId
- Loading state with Loader2 spinner
- toast notifications + close dialog + trigger refetch on success

---

## Work Objectives

### Core Objective
Create a fully functional invoice creation dialog with dynamic line items that connects to the existing `createFacture` server action.

### Concrete Deliverables
- New file: `frontend/src/components/create-facture-dialog.tsx`
- Modified file: `frontend/src/app/(main)/facturation/facturation-page-client.tsx`

### Definition of Done
- [ ] Dialog opens when clicking "Nouvelle facture" button
- [ ] Dialog opens when clicking "Créer ma première facture" button
- [ ] Form validates required fields (client, date, statut, emission type, at least 1 line)
- [ ] Dynamic line items: add/remove lines, auto-calculate totals
- [ ] Calls `createFacture()` server action on submit
- [ ] Shows success toast and refreshes list on success
- [ ] Shows error toast on failure
- [ ] `npm run build` passes with zero TypeScript errors

### Must Have
- react-hook-form with `useFieldArray` for dynamic line items
- Zod validation schema
- Auto-calculated totals (HT, TVA, TTC)
- Loading state during submission
- Scrollable dialog for overflow content
- French labels

### Must NOT Have (Guardrails)
- Do NOT modify proto files or server actions
- Do NOT add new npm dependencies
- Do NOT create a separate page (dialog only)
- Do NOT use inline styles
- Do NOT expose raw UUIDs in the totals display

---

## Verification Strategy

### Test Decision
- **Infrastructure exists**: NO
- **Automated tests**: NO
- **Agent-Executed QA**: YES (build verification)

---

## TODOs

- [ ] 1. Create CreateFactureDialog component

  **What to do**:
  - Create file `frontend/src/components/create-facture-dialog.tsx`
  - Implement dialog with form using react-hook-form + zod
  - Props: `open`, `onOpenChange`, `statuts: StatutFacture[]`, `onSuccess?: () => void`
  - Form fields (grid 2 cols):
    - `clientBaseId` (required) — Input text, placeholder "ID du client"
    - `contratId` (optional) — Input text, placeholder "ID du contrat"
    - `dateEmission` (required) — Input type="date", default to today
    - `statutId` (required) — Select dropdown from `statuts` prop
    - `emissionFactureId` (required) — Input text, placeholder "ID du type d'émission"
  - Dynamic line items section using `useFieldArray`:
    - Header row: Description | Qté | Prix unit. | TVA % | Montant HT | Actions
    - Each line: description (text), quantite (number min 1), prixUnitaire (number min 0), tauxTva (number 0-100 default 20)
    - montantHT auto-calculated: quantite × prixUnitaire (display only)
    - "+ Ajouter une ligne" button
    - Trash icon to remove (disabled if only 1 line)
    - Minimum 1 line required via zod validation
  - Totals section at bottom:
    - Total HT = sum of all line montantHT
    - Total TVA = sum of all line (montantHT × tauxTva/100)
    - Total TTC = Total HT + Total TVA
  - Submit: call `createFacture()` with organisationId from `useOrganisation()`
  - On success: `toast.success`, `form.reset()`, `onOpenChange(false)`, `onSuccess?.()`
  - On error: `toast.error(result.error)`
  - Dialog width: `sm:max-w-[750px]`, scrollable: `max-h-[90vh] overflow-y-auto`

  **Must NOT do**:
  - Do NOT modify server actions or proto files
  - Do NOT add new dependencies

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: [`frontend-ui-ux`]

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Blocks**: [Task 2]
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `frontend/src/components/create-contrat-dialog.tsx:1-80` — Form structure with react-hook-form + zod, Dialog pattern, useOrganisation(), loading state, toast notifications
  - `frontend/src/components/create-client-dialog.tsx` — Simpler dialog pattern for reference

  **API/Type References**:
  - `frontend/src/proto/factures/factures.ts:211-229` — `CreateFactureRequest` and `CreateLigneFactureItem` types
  - `frontend/src/proto/factures/factures.ts:30-38` — `StatutFacture` type for select dropdown
  - `frontend/src/actions/factures.ts:67-99` — `createFacture()` server action signature and usage

  **Acceptance Criteria**:
  - [ ] File exists at `frontend/src/components/create-facture-dialog.tsx`
  - [ ] Component exports `CreateFactureDialog`
  - [ ] Uses react-hook-form with `useFieldArray` for dynamic line items
  - [ ] Zod schema validates: clientBaseId, dateEmission, statutId, emissionFactureId required; lignes min 1
  - [ ] Each line has: description, quantite, prixUnitaire, tauxTva fields
  - [ ] Totals (HT, TVA, TTC) auto-calculate from watched line values
  - [ ] Calls `createFacture()` from `@/actions/factures` on submit
  - [ ] Shows Loader2 spinner during submission
  - [ ] Dialog is scrollable for long forms

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: TypeScript compilation passes
    Tool: Bash
    Steps:
      1. Run: cd frontend && npx tsc --noEmit
      2. Assert: exit code 0
      3. Assert: no errors mentioning create-facture-dialog
    Expected Result: Zero TypeScript errors
    Evidence: Terminal output captured
  ```

  **Commit**: NO (groups with Task 2)

---

- [ ] 2. Integrate CreateFactureDialog into facturation page

  **What to do**:
  - Edit `frontend/src/app/(main)/facturation/facturation-page-client.tsx`
  - Add import: `import { CreateFactureDialog } from "@/components/create-facture-dialog"`
  - Add state: `const [createDialogOpen, setCreateDialogOpen] = React.useState(false)`
  - Replace line 317 `onClick={() => toast.info("Création de facture à venir")}` with `onClick={() => setCreateDialogOpen(true)}`
  - Replace line 431 `onClick={() => toast.info("Création de facture à venir")}` with `onClick={() => setCreateDialogOpen(true)}`
  - Add dialog component before closing `</main>` tag:
    ```tsx
    <CreateFactureDialog
      open={createDialogOpen}
      onOpenChange={setCreateDialogOpen}
      statuts={mappedStatuts}
      onSuccess={refetch}
    />
    ```

  **Must NOT do**:
  - Do NOT change existing filters, table, or export logic
  - Do NOT remove any existing functionality

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: [`frontend-ui-ux`]

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Blocked By**: [Task 1]

  **References**:

  **Pattern References**:
  - `frontend/src/app/(main)/facturation/facturation-page-client.tsx:317` — First toast.info to replace
  - `frontend/src/app/(main)/facturation/facturation-page-client.tsx:431` — Second toast.info to replace
  - `frontend/src/app/(main)/facturation/facturation-page-client.tsx:58-70` — Existing state declarations pattern
  - `frontend/src/app/(main)/facturation/facturation-page-client.tsx:74-85` — `mappedStatuts` memo to pass as prop
  - `frontend/src/app/(main)/facturation/facturation-page-client.tsx:98-115` — `fetchData` function to use as `onSuccess`

  **Acceptance Criteria**:
  - [ ] Import added for CreateFactureDialog
  - [ ] State `createDialogOpen` added
  - [ ] Both toast.info calls replaced with `setCreateDialogOpen(true)`
  - [ ] Dialog rendered with correct props: open, onOpenChange, statuts, onSuccess
  - [ ] `npm run build` passes with zero TypeScript errors

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: Build passes after integration
    Tool: Bash
    Steps:
      1. Run: cd frontend && npm run build
      2. Assert: exit code 0
      3. Assert: route /facturation still present in output
    Expected Result: Successful build with facturation route
    Evidence: Build output captured
  ```

  **Commit**: YES
  - Message: `feat(facturation): add invoice creation dialog with dynamic line items`
  - Files: `frontend/src/components/create-facture-dialog.tsx`, `frontend/src/app/(main)/facturation/facturation-page-client.tsx`
  - Pre-commit: `cd frontend && npm run build`

---

## Commit Strategy

| After Task | Message | Files | Verification |
|------------|---------|-------|--------------|
| 2 | `feat(facturation): add invoice creation dialog with dynamic line items` | `create-facture-dialog.tsx`, `facturation-page-client.tsx` | `npm run build` |

---

## Success Criteria

### Verification Commands
```bash
cd frontend && npm run build  # Expected: exit 0, no TS errors
```

### Final Checklist
- [ ] CreateFactureDialog component created with full form + dynamic lines
- [ ] Both "Nouvelle facture" buttons open the dialog (no more toast placeholder)
- [ ] Form validates required fields
- [ ] Dynamic line items work (add/remove/auto-calculate)
- [ ] Server action called correctly on submit
- [ ] Build passes with zero errors
