# Supprimer la card "Contrats par Commercial" du dashboard

## TL;DR

> **Quick Summary**: Retirer la card "Contrats par Commercial" du dashboard et supprimer les fichiers associés (composant + action mock) devenus inutiles.
> 
> **Deliverables**:
> - Card retirée du dashboard
> - Fichiers composant et action supprimés
> 
> **Estimated Effort**: Quick
> **Parallel Execution**: NO - sequential (3 micro-steps)
> **Critical Path**: Retirer import → Supprimer fichiers

---

## Context

### Original Request
L'utilisateur a constaté que la card "Contrats par Commercial" dans le dashboard affiche des données alors qu'elle devrait être vide. Le diagnostic révèle que la server action `getContratsParCommercial` retourne des **données mockées en dur** (John Doe, Jane Smith, etc.) au lieu d'appeler le vrai backend. L'utilisateur veut simplement supprimer cette card du dashboard.

### Fichiers concernés
- `frontend/src/app/(main)/page.tsx` — Dashboard page (import + usage à retirer)
- `frontend/src/components/dashboard-contrats-par-commercial.tsx` — Composant à supprimer
- `frontend/src/actions/dashboard-contrats-commercial.ts` — Action mock à supprimer

---

## Work Objectives

### Core Objective
Supprimer complètement la card "Contrats par Commercial" du dashboard et nettoyer les fichiers orphelins.

### Concrete Deliverables
- La page dashboard ne contient plus la card "Contrats par Commercial"
- Les 2 fichiers orphelins sont supprimés

### Definition of Done
- [x] Le dashboard s'affiche sans la card "Contrats par Commercial"
- [x] Aucune erreur de build (les imports supprimés ne cassent rien)

### Must Have
- La card ne s'affiche plus sur le dashboard
- Les fichiers inutiles sont supprimés

### Must NOT Have (Guardrails)
- Ne PAS toucher aux autres cards du dashboard
- Ne PAS modifier le composant `ContratsCard` (c'est la card "Contrats par société", qui elle reste)
- Ne PAS supprimer le proto `KpisCommerciauxService` (backend séparé, peut servir plus tard)

---

## Verification Strategy

### Test Decision
- **Automated tests**: None (simple suppression)
- **Agent-Executed QA**: Build check + visual

---

## TODOs

- [x] 1. Retirer la card du dashboard et supprimer les fichiers orphelins

  **What to do**:
  1. Dans `frontend/src/app/(main)/page.tsx`:
     - Supprimer la ligne 9: `import { DashboardContratsParCommercial } from "@/components/dashboard-contrats-par-commercial"`
     - Supprimer les lignes 51-52 (le commentaire + le composant `<DashboardContratsParCommercial />`):
       ```
       {/* Contrats par commercial */}
       <DashboardContratsParCommercial />
       ```
  2. Supprimer le fichier: `frontend/src/components/dashboard-contrats-par-commercial.tsx`
  3. Supprimer le fichier: `frontend/src/actions/dashboard-contrats-commercial.ts`

  **Must NOT do**:
  - Ne pas toucher aux autres imports ou composants dans page.tsx
  - Ne pas supprimer `ContratsCard` (c'est la card "par société")

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: [] (aucun skill nécessaire, c'est du simple edit + delete)

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Sequential (unique task)
  - **Blocks**: None
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `frontend/src/app/(main)/page.tsx:9` — Ligne d'import à supprimer
  - `frontend/src/app/(main)/page.tsx:51-52` — Usage du composant à supprimer

  **Files to Delete**:
  - `frontend/src/components/dashboard-contrats-par-commercial.tsx` — Composant complet (136 lignes)
  - `frontend/src/actions/dashboard-contrats-commercial.ts` — Action server mock (42 lignes)

  **Acceptance Criteria**:

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: Build succeeds after removal
    Tool: Bash
    Preconditions: None
    Steps:
      1. Run: npm run build (workdir: frontend/)
      2. Assert: Exit code 0
      3. Assert: No "Cannot find module" errors in output
    Expected Result: Build completes without errors
    Evidence: Build output captured

  Scenario: Deleted files no longer exist
    Tool: Bash
    Preconditions: None
    Steps:
      1. Check file existence: frontend/src/components/dashboard-contrats-par-commercial.tsx
      2. Assert: File does NOT exist
      3. Check file existence: frontend/src/actions/dashboard-contrats-commercial.ts
      4. Assert: File does NOT exist
    Expected Result: Both files are gone
    Evidence: ls output captured

  Scenario: Dashboard page no longer references removed component
    Tool: Bash (grep)
    Preconditions: None
    Steps:
      1. grep "DashboardContratsParCommercial" frontend/src/app/(main)/page.tsx
      2. Assert: No matches found
      3. grep "dashboard-contrats-par-commercial" frontend/src/app/(main)/page.tsx
      4. Assert: No matches found
    Expected Result: Zero references to removed component in dashboard page
    Evidence: grep output (empty)
  ```

  **Commit**: YES
  - Message: `fix(dashboard): remove "Contrats par Commercial" card with mock data`
  - Files: `frontend/src/app/(main)/page.tsx`, `frontend/src/components/dashboard-contrats-par-commercial.tsx` (deleted), `frontend/src/actions/dashboard-contrats-commercial.ts` (deleted)
  - Pre-commit: `npm run build`

---

## Success Criteria

### Verification Commands
```bash
cd frontend && npm run build  # Expected: exit 0, no errors
```

### Final Checklist
- [x] Card "Contrats par Commercial" absente du dashboard
- [x] Fichier composant supprimé
- [x] Fichier action mock supprimé
- [x] Build OK
- [x] Autres cards du dashboard intactes
