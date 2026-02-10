# Commission Page — MVP Critical Fixes

## TL;DR

> **Quick Summary**: Corriger les 3 bloquants MVP de la page commission : boutons morts / IDs hardcodés, empty states / confirmations manquants, et hooks React manquants pour relier le frontend au backend 100% complet.
>
> **Deliverables**:
> - 4 boutons/handlers corrigés (Contester, Modifier apporteur, validateurId, resoluPar)
> - Motif de désélection correctement transmis au backend
> - 7 empty states ajoutés (un par onglet)
> - 4 dialogs de confirmation ajoutés (actions destructives)
> - Typos corrigées + couleur bouton reprise corrigée
> - 5 hooks React créés (contestations, audit, récurrences, reports, lignes bordereau)
>
> **Estimated Effort**: Medium
> **Parallel Execution**: YES — 3 waves
> **Critical Path**: Task 1 → Task 2 → Task 5 → Task 7

---

## Context

### Original Request
Audit de cohérence UX de la page commission d'un CRM multi-société. Identifier les parcours utilisateurs incomplets, les oublis UI/UX et les 3 éléments critiques pour un MVP utilisable.

### Interview Summary
**Key Discussions**:
- Auth system: NextAuth avec Keycloak, user ID via `getServerUserProfile()` → `profile?.utilisateur?.id`
- Pas d'infrastructure de test frontend (pas de Jest/Vitest)
- Backend 100% complet (66/66 RPCs) — aucun travail backend nécessaire
- Plan existant (`commission-critical-gaps.md`) couvre le cahier des charges complet — ce plan couvre UNIQUEMENT les 3 critiques UX/cohérence

**Research Findings**:
- Pattern auth déjà implémenté dans `validation/page.tsx:8-22`
- Composant `Empty` existe dans `@/components/ui/empty` (utilisé dans `taches-page-client.tsx`)
- `AlertDialog` shadcn existe dans `@/components/ui/alert-dialog` (utilisé dans `validation-page-client.tsx` et `roles-permissions-page-client.tsx`)
- Toast via `sonner` (v2.0.7), import: `import { toast } from "sonner"`
- `CreerContestationDialog` existe déjà comme composant autonome
- `ResoudreContestationDialog` existe déjà

### Metis Review
**Identified Gaps** (addressed):
- `resoluPar: "adv-backoffice"` — 2ème ID hardcodé non détecté initialement → inclus dans Task 1
- Le motif de désélection est collecté mais jeté (`reason` paramètre ignoré) → inclus dans Task 2
- Typos "Creer" dans `creer-contestation-dialog.tsx` aussi (lignes 68, 95) → inclus dans Task 4
- Bouton "Créer contestation" utilise `filteredCommissions[0]?.id` (1er item de la liste au lieu du sélectionné) → flaggé mais hors scope
- Button "Déclencher reprise" a `variant="destructive"` alors que ce n'est pas destructif → inclus dans Task 4

---

## Work Objectives

### Core Objective
Rendre la page commission utilisable en production en corrigeant les dead ends critiques, en ajoutant le feedback utilisateur manquant et en créant le pont hooks entre le frontend et le backend.

### Concrete Deliverables
- `commissions/page.tsx` modifié pour passer `userId` en prop
- `commissions-page-client.tsx` corrigé (validateurId, resoluPar, handlers, confirmations)
- `commission-detail-dialog.tsx` corrigé (bouton Contester fonctionnel)
- `commission-config-dialog.tsx` corrigé (dialog d'édition apporteur)
- `creer-contestation-dialog.tsx` corrigé (typos)
- 7 onglets avec empty states
- 4 AlertDialog de confirmation
- 5 nouveaux hooks React créés

### Definition of Done
- [ ] `grep -r "current-user-id" frontend/src/` → 0 résultats
- [ ] `grep -r "adv-backoffice" frontend/src/` → 0 résultats
- [ ] Bouton "Contester" dans le detail dialog ouvre le dialog de contestation
- [ ] Bouton "Modifier" dans config dialog ouvre un formulaire d'édition
- [ ] Chaque onglet vide affiche un composant `Empty` avec message et icône
- [ ] Chaque action destructive passe par un `AlertDialog` de confirmation
- [ ] Les 5 hooks existent et exportent les bonnes fonctions

### Must Have
- Correction des 2 IDs hardcodés (validateurId, resoluPar)
- Bouton "Contester" fonctionnel
- Bouton "Modifier apporteur" fonctionnel
- Empty states sur les 7 onglets
- Confirmation dialogs sur les 4 actions destructives
- 5 hooks React créés

### Must NOT Have (Guardrails)
- NE PAS refactoriser le composant de 1698 lignes (pas de restructuration de fichier)
- NE PAS toucher aux pages non-commission (typos dans permissions, roles-permissions = hors scope)
- NE PAS créer de nouvelles server actions ni modifier les appels gRPC existants
- NE PAS restructurer les dossiers ou déplacer des fichiers
- NE PAS ajouter de loading skeletons (hors scope)
- NE PAS ajouter d'infrastructure de test frontend
- NE PAS implémenter de logique métier (calculs, workflows = plan commission-critical-gaps)

---

## Verification Strategy

> **UNIVERSAL RULE: ZERO HUMAN INTERVENTION**
>
> ALL tasks in this plan MUST be verifiable WITHOUT any human action.

### Test Decision
- **Infrastructure exists**: NO (frontend)
- **Automated tests**: None
- **Framework**: N/A
- **Agent-Executed QA**: ALWAYS (mandatory for all tasks)

### Agent-Executed QA Scenarios (MANDATORY — ALL tasks)

> Sans infrastructure de test, les QA scenarios Playwright sont la PRIMARY verification method.

**Verification Tool by Deliverable Type:**

| Type | Tool | How Agent Verifies |
|------|------|-------------------|
| **Code changes** | Bash (grep) | Verify hardcoded values removed |
| **UI components** | Playwright | Navigate, interact, assert DOM |
| **Hooks** | Bash (TypeScript compiler) | Verify no type errors |

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Start Immediately):
├── Task 1: Fix page.tsx + hardcoded IDs (validateurId, resoluPar)
├── Task 3: Add empty states to 7 tabs
└── Task 4: Fix typos + button color

Wave 2 (After Wave 1):
├── Task 2: Wire dead buttons (Contester, Modifier apporteur, deselection motif)
└── Task 5: Create 5 missing hooks

Wave 3 (After Wave 2):
├── Task 6: Add AlertDialog confirmations to 4 actions
└── Task 7: Final QA verification pass
```

### Dependency Matrix

| Task | Depends On | Blocks | Can Parallelize With |
|------|------------|--------|---------------------|
| 1 | None | 2, 6 | 3, 4 |
| 2 | 1 | 7 | 5 |
| 3 | None | 7 | 1, 4 |
| 4 | None | 7 | 1, 3 |
| 5 | None | 7 | 2 |
| 6 | 1 | 7 | 5 |
| 7 | 2, 3, 4, 5, 6 | None | None (final) |

### Agent Dispatch Summary

| Wave | Tasks | Recommended Agents |
|------|-------|-------------------|
| 1 | 1, 3, 4 | 3 parallel quick tasks |
| 2 | 2, 5 | 2 parallel tasks (2=visual-engineering, 5=unspecified-high) |
| 3 | 7 | 1 QA verification task |

---

## TODOs

- [x] 1. Fix Server Page + Hardcoded User IDs

  **What to do**:
  - Modifier `frontend/src/app/(main)/commissions/page.tsx` pour :
    - Importer `getServerUserProfile` de `@/lib/auth/auth.server`
    - Appeler `getServerUserProfile()` dans le Promise.all existant
    - Passer `userId={profile?.utilisateur?.id ?? ""}` comme prop à `<CommissionsPageClient>`
  - Modifier `frontend/src/app/(main)/commissions/commissions-page-client.tsx` pour :
    - Ajouter `userId: string` à l'interface props du composant
    - Ligne 979 : Remplacer `const validateurId = "current-user-id"` par utilisation de la prop `userId`
    - Ligne 964 : Remplacer `resoluPar: "adv-backoffice"` par utilisation de la prop `userId`

  **Must NOT do**:
  - NE PAS modifier la signature des server actions
  - NE PAS changer d'autres aspects du composant

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 2 fichiers, < 20 lignes modifiées, pattern exact à copier
  - **Skills**: [`frontend-ui-ux`]
    - `frontend-ui-ux`: Nécessaire pour comprendre le pattern server/client component de Next.js

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 3, 4)
  - **Blocks**: Tasks 2, 6 (qui utilisent le userId)
  - **Blocked By**: None

  **References**:

  **Pattern References** (existing code to follow):
  - `frontend/src/app/(main)/commissions/validation/page.tsx:1-26` — EXACTEMENT le pattern à répliquer : `getServerUserProfile()` dans Promise.all + passage de `validateurId` en prop. Copier ce pattern.
  - `frontend/src/lib/auth/auth.server.ts` — Export de `getServerUserProfile()` qui retourne `{ utilisateur: { id: string, ... }, organisations: [...] }`

  **Files to modify**:
  - `frontend/src/app/(main)/commissions/page.tsx:1-45` — Server component, ajouter import + appel + prop
  - `frontend/src/app/(main)/commissions/commissions-page-client.tsx:979` — Remplacer `"current-user-id"` par prop `userId`
  - `frontend/src/app/(main)/commissions/commissions-page-client.tsx:964` — Remplacer `"adv-backoffice"` par prop `userId`

  **Acceptance Criteria**:

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: Hardcoded user IDs completely removed
    Tool: Bash (grep)
    Preconditions: None
    Steps:
      1. Run: grep -r "current-user-id" frontend/src/
      2. Assert: 0 matches
      3. Run: grep -r "adv-backoffice" frontend/src/
      4. Assert: 0 matches
    Expected Result: No hardcoded IDs remain in frontend source
    Evidence: grep output captured

  Scenario: page.tsx passes userId prop
    Tool: Bash (grep)
    Preconditions: None
    Steps:
      1. Run: grep -n "getServerUserProfile" frontend/src/app/\(main\)/commissions/page.tsx
      2. Assert: At least 1 match (import + usage)
      3. Run: grep -n "userId=" frontend/src/app/\(main\)/commissions/page.tsx
      4. Assert: At least 1 match (prop being passed)
    Expected Result: Server component fetches user profile and passes userId
    Evidence: grep output captured

  Scenario: TypeScript compilation passes
    Tool: Bash (npx tsc --noEmit)
    Preconditions: None
    Steps:
      1. Run: npx tsc --noEmit --project frontend/tsconfig.json 2>&1 | head -20
      2. Assert: No errors related to userId, validateurId, or resoluPar
    Expected Result: No type errors introduced
    Evidence: tsc output captured
  ```

  **Commit**: YES (group with Task 2)
  - Message: `fix(commissions): replace hardcoded user IDs with authenticated user from NextAuth`
  - Files: `frontend/src/app/(main)/commissions/page.tsx`, `frontend/src/app/(main)/commissions/commissions-page-client.tsx`

---

- [x] 2. Wire Dead Buttons (Contester, Modifier Apporteur, Deselection Motif)

  **What to do**:

  **2a — Bouton "Contester" (commission-detail-dialog.tsx:399)**:
  - Ajouter une prop `onContester` à l'interface `CommissionDetailDialogProps` :
    `onContester?: (commission: CommissionWithDetails) => void`
  - Remplacer `<Button variant="destructive">Contester</Button>` par un bouton qui appelle `onContester(commission)`
  - Dans `commissions-page-client.tsx`, passer un handler `onContester` au `CommissionDetailDialog` qui ouvre le `CreerContestationDialog` pré-rempli avec les données de la commission sélectionnée
  - OU alternative plus simple : Importer `CreerContestationDialog` directement dans `commission-detail-dialog.tsx` et l'utiliser comme wrapper du bouton "Contester" (le composant accepte déjà un `trigger` prop)

  **2b — Bouton "Modifier apporteur" (commission-config-dialog.tsx:131-133)**:
  - Le `handleEditApporteur` ne fait qu'un `toast.info()` → Créer un vrai dialog d'édition
  - Réutiliser le pattern du formulaire de création d'apporteur existant (dans la liste des apporteurs du config dialog)
  - Pré-remplir le formulaire avec les données de l'apporteur sélectionné
  - Appeler `updateApporteurAction` sur soumission
  - Afficher toast de succès et refetch

  **2c — Motif de désélection perdu (commissions-page-client.tsx:735-753)**:
  - Le `handleDeselectionConfirm` reçoit `reason: string` mais ne l'envoie PAS au backend
  - Modifier l'appel `deselectionnerCommissionAction` pour transmettre le motif
  - Vérifier si la server action `deselectionnerCommission` accepte un 3ème paramètre `motif` ou s'il faut le passer dans les metadata
  - Si la server action ne supporte pas le motif : l'ajouter comme 3ème paramètre optionnel dans `deselectionnerCommission()` de `frontend/src/actions/commissions.ts` (la server action peut le passer dans les metadata du gRPC `UpdateCommission`)

  **Must NOT do**:
  - NE PAS modifier le backend gRPC
  - NE PAS restructurer les composants existants
  - NE PAS créer de nouveaux composants hors de `frontend/src/components/commissions/`

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: Création de dialog UI, wiring d'événements React, pattern component composition
  - **Skills**: [`frontend-ui-ux`]
    - `frontend-ui-ux`: Dialog design, form pre-fill, event handling patterns

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Task 5)
  - **Parallel Group**: Wave 2
  - **Blocks**: Task 7
  - **Blocked By**: Task 1 (pour le userId prop)

  **References**:

  **Pattern References**:
  - `frontend/src/components/commissions/creer-contestation-dialog.tsx:1-102` — Le dialog de contestation COMPLET. Accepte `trigger` prop (ligne 21), `commissionId`, `bordereauId`, `apporteurId`, `onSubmit`. Utiliser ce composant tel quel dans le detail dialog.
  - `frontend/src/components/commissions/commission-detail-dialog.tsx:395-404` — Le bouton "Contester" mort à ligne 399. L'interface `CommissionDetailDialogProps` est définie lignes 35-39.
  - `frontend/src/components/commissions/commission-config-dialog.tsx:125-145` — Le handler `handleEditApporteur` qui ne fait qu'un toast.
  - `frontend/src/app/(main)/commissions/commissions-page-client.tsx:735-753` — Le handler `handleDeselectionConfirm` qui jette le `reason`.
  - `frontend/src/actions/commissions.ts` — Server actions : `deselectionnerCommission()`, `creerContestation()`, `updateApporteur()`

  **API/Type References**:
  - `frontend/src/components/commissions/creer-contestation-dialog.tsx:17-28` — Interface du dialog : `commissionId`, `bordereauId`, `apporteurId`, `trigger`, `onSubmit`
  - `frontend/src/lib/ui/display-types/commission.ts` — `CommissionWithDetails` type avec `apporteur`, `contrat`, `produit`, `statut`

  **Acceptance Criteria**:

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: Contester button opens contestation dialog
    Tool: Playwright (playwright skill)
    Preconditions: Dev server running on localhost:3000, user logged in, at least 1 commission with status "en_attente"
    Steps:
      1. Navigate to: http://localhost:3000/commissions
      2. Wait for: table rows visible (timeout: 10s)
      3. Click: first table row to open commission detail
      4. Wait for: Dialog with title containing commission reference (timeout: 5s)
      5. Assert: Button with text "Contester" is visible (only if status is "en_attente")
      6. Click: Button with text "Contester"
      7. Wait for: Dialog with title containing "contestation" (timeout: 5s)
      8. Assert: Textarea for "motif" is visible
      9. Assert: Buttons "Annuler" and "Créer la contestation" are visible
      10. Screenshot: .sisyphus/evidence/task-2-contester-dialog.png
    Expected Result: Contestation dialog opens with motif textarea
    Evidence: .sisyphus/evidence/task-2-contester-dialog.png

  Scenario: Modifier apporteur opens edit dialog (not toast)
    Tool: Playwright (playwright skill)
    Preconditions: Dev server running, user logged in
    Steps:
      1. Navigate to: http://localhost:3000/commissions
      2. Click: Button with text "Configuration" (or gear icon)
      3. Wait for: Config dialog opens (timeout: 5s)
      4. Click: Tab "Apporteurs"
      5. Assert: List of apporteurs visible
      6. Click: Edit/Modifier button on first apporteur
      7. Wait for: Edit form/dialog appears (timeout: 5s)
      8. Assert: Form fields are pre-filled with apporteur data (nom, prenom, etc.)
      9. Assert: Submit button is visible
      10. Screenshot: .sisyphus/evidence/task-2-edit-apporteur.png
    Expected Result: Edit dialog with pre-filled form, NOT a toast
    Evidence: .sisyphus/evidence/task-2-edit-apporteur.png

  Scenario: Deselection motif is not discarded
    Tool: Bash (grep)
    Preconditions: None
    Steps:
      1. Read handleDeselectionConfirm in commissions-page-client.tsx
      2. Assert: The `reason` parameter is used (not ignored)
      3. Verify: The reason/motif is passed to the server action or audit log
    Expected Result: Motif is transmitted, not silently dropped
    Evidence: Code grep output
  ```

  **Commit**: YES
  - Message: `fix(commissions): wire dead Contester/Modifier buttons and preserve deselection motif`
  - Files: `commission-detail-dialog.tsx`, `commission-config-dialog.tsx`, `commissions-page-client.tsx`

---

- [x] 3. Add Empty States to All 7 Tabs

  **What to do**:
  - Pour chaque onglet, ajouter un rendu conditionnel qui affiche le composant `Empty` quand la liste de données est vide (tableau vide ou `length === 0`)
  - Utiliser le pattern de `taches-page-client.tsx:36-50`
  - Chaque empty state doit avoir :
    - Une icône Lucide pertinente (ex: `FileText` pour commissions, `Receipt` pour bordereaux)
    - Un titre descriptif (ex: "Aucune commission")
    - Une description contextuelle (ex: "Les commissions apparaîtront ici une fois calculées.")
  - Les 7 onglets à couvrir dans `commissions-page-client.tsx` :

  | Onglet | Condition vide | Icône suggérée | Titre | Description |
  |--------|---------------|----------------|-------|-------------|
  | Commissions | `filteredCommissions.length === 0` | `DollarSign` | "Aucune commission" | "Les commissions apparaîtront ici une fois les contrats validés et les calculs effectués." |
  | Bordereaux | `bordereaux.length === 0` | `FileText` | "Aucun bordereau" | "Les bordereaux sont générés à partir des commissions sélectionnées." |
  | Reprises | `reprises.length === 0` | `RotateCcw` | "Aucune reprise" | "Les reprises sont déclenchées en cas de résiliation, impayé ou annulation." |
  | Contestations | `contestations.length === 0` | `AlertTriangle` | "Aucune contestation" | "Les contestations seront listées ici quand un apporteur conteste une commission." |
  | Audit | `auditLogs.length === 0` | `Clock` | "Aucun log d'audit" | "L'historique des actions sur les commissions apparaîtra ici." |
  | Récurrences | `recurrences.length === 0` | `RefreshCw` | "Aucune récurrence" | "Les commissions récurrentes apparaîtront ici une fois configurées." |
  | Reports négatifs | `reports.length === 0` | `TrendingDown` | "Aucun report négatif" | "Les soldes négatifs reportés entre périodes seront affichés ici." |

  **Must NOT do**:
  - NE PAS ajouter de bouton CTA dans les empty states (les actions existent déjà dans les headers de chaque tab)
  - NE PAS modifier la logique de chargement ou de filtrage
  - NE PAS ajouter de loading skeletons

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Travail mécanique et répétitif — 7× le même pattern
  - **Skills**: [`frontend-ui-ux`]
    - `frontend-ui-ux`: Composition d'empty states cohérents avec le design system

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 4)
  - **Blocks**: Task 7
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `frontend/src/components/ui/empty.tsx` — Le composant Empty avec sub-components : `Empty`, `EmptyHeader`, `EmptyMedia`, `EmptyTitle`, `EmptyDescription`, `EmptyContent`. Utilise `data-slot` attributes.
  - `frontend/src/app/(main)/taches/taches-page-client.tsx:36-50` — Exemple d'utilisation EXACT du pattern Empty avec icône + titre + description + bouton CTA conditionnel.
  - `frontend/src/app/(main)/commissions/commissions-page-client.tsx` — Fichier principal où ajouter les 7 empty states dans les `TabsContent` de chaque onglet.

  **Acceptance Criteria**:

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: Empty state visible when commissions tab has no data
    Tool: Playwright (playwright skill)
    Preconditions: Dev server running, user logged in, organisation with no commissions
    Steps:
      1. Navigate to: http://localhost:3000/commissions
      2. Wait for: page loaded (timeout: 10s)
      3. Assert: Element with data-slot="empty" is visible inside commissions tab
      4. Assert: Text "Aucune commission" is visible
      5. Screenshot: .sisyphus/evidence/task-3-empty-commissions.png
    Expected Result: Empty state with icon, title and description displayed
    Evidence: .sisyphus/evidence/task-3-empty-commissions.png

  Scenario: Each tab shows empty state when no data
    Tool: Bash (grep)
    Preconditions: None
    Steps:
      1. Run: grep -c "EmptyTitle" frontend/src/app/\(main\)/commissions/commissions-page-client.tsx
      2. Assert: Count >= 7 (one per tab)
      3. Run: grep "from.*empty" frontend/src/app/\(main\)/commissions/commissions-page-client.tsx
      4. Assert: Import of Empty components exists
    Expected Result: All 7 tabs have Empty component usage
    Evidence: grep output captured
  ```

  **Commit**: YES
  - Message: `feat(commissions): add empty states to all 7 commission tabs`
  - Files: `commissions-page-client.tsx`

---

- [x] 4. Fix Typos + Button Color

  **What to do**:
  - Utiliser `ast_grep_search` ou `grep` pour trouver TOUTES les occurrences non-accentuées dans les fichiers commission :
    - `"Creer"` → `"Créer"` (dans commissions-page-client.tsx ET creer-contestation-dialog.tsx)
    - `"Reessayer"` → `"Réessayer"` (dans commissions-page-client.tsx)
    - `"creation"` → `"création"` (dans creer-contestation-dialog.tsx:55 si applicable)
    - `"contestee"` → `"contestée"` (dans creer-contestation-dialog.tsx:70 si applicable)
    - `"place"` → `"placé"` (dans creer-contestation-dialog.tsx:70 si applicable)
  - Corriger le bouton "Déclencher reprise" dans `commissions-page-client.tsx:1181` :
    - Changer `variant="destructive"` → `variant="outline"` (ce n'est pas une action destructive)

  **Must NOT do**:
  - NE PAS corriger les typos dans les pages hors-commission (permissions, roles-permissions)
  - NE PAS modifier le texte des toasts (seulement les labels de boutons et titres de dialogs)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Rechercher-remplacer simple, < 10 changements
  - **Skills**: [`frontend-ui-ux`]
    - `frontend-ui-ux`: Attention aux détails typographiques

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 3)
  - **Blocks**: Task 7
  - **Blocked By**: None

  **References**:

  **Files to modify**:
  - `frontend/src/app/(main)/commissions/commissions-page-client.tsx:1181` — `variant="destructive"` → `variant="outline"` sur bouton "Déclencher reprise"
  - `frontend/src/app/(main)/commissions/commissions-page-client.tsx:1288` — "Creer contestation" → "Créer contestation"
  - `frontend/src/app/(main)/commissions/commissions-page-client.tsx:1302` — "Reessayer" → "Réessayer"
  - `frontend/src/components/commissions/creer-contestation-dialog.tsx:68` — "Creer une contestation" → "Créer une contestation"
  - `frontend/src/components/commissions/creer-contestation-dialog.tsx:95` — "Creer la contestation" → "Créer la contestation"
  - `frontend/src/components/commissions/creer-contestation-dialog.tsx:55` — "creation" → "création" (si applicable)

  **Acceptance Criteria**:

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: No unaccented "Creer" in commission files
    Tool: Bash (grep)
    Preconditions: None
    Steps:
      1. Run: grep -rn "Creer" frontend/src/app/\(main\)/commissions/
      2. Assert: 0 matches
      3. Run: grep -rn "Creer" frontend/src/components/commissions/
      4. Assert: 0 matches
    Expected Result: All "Creer" replaced with "Créer"
    Evidence: grep output showing 0 matches

  Scenario: No unaccented "Reessayer" in commission files
    Tool: Bash (grep)
    Preconditions: None
    Steps:
      1. Run: grep -rn "Reessayer" frontend/src/
      2. Assert: 0 matches
    Expected Result: All "Reessayer" replaced with "Réessayer"
    Evidence: grep output showing 0 matches

  Scenario: Déclencher reprise button is not destructive
    Tool: Bash (grep)
    Preconditions: None
    Steps:
      1. Run: grep -A2 "Déclencher reprise" frontend/src/app/\(main\)/commissions/commissions-page-client.tsx
      2. Assert: No "destructive" variant on this button
    Expected Result: Button uses outline or default variant
    Evidence: grep output captured
  ```

  **Commit**: YES
  - Message: `fix(commissions): correct French typos and reprise button color`
  - Files: `commissions-page-client.tsx`, `creer-contestation-dialog.tsx`

---

- [x] 5. Create 5 Missing React Hooks

  **What to do**:
  - Créer 5 hooks React dans `frontend/src/hooks/commissions/` en suivant le pattern existant des hooks commissions (ex: `use-reprises-commission.ts`, `use-bordereaux-commission.ts`)
  - Chaque hook doit :
    - Utiliser le pattern `useApi` existant (ou `useCallback` + state si `useApi` n'est pas adapté)
    - Appeler les server actions existantes dans `frontend/src/actions/commissions.ts`
    - Exposer : `data`, `loading`, `error`, `refetch`
    - Gérer les filtres via paramètres

  **Hooks à créer :**

  | Fichier | Server Actions utilisées | Fonctions exposées |
  |---------|--------------------------|-------------------|
  | `use-contestations-commission.ts` | `getContestationsByOrganisation`, `creerContestation`, `resoudreContestation` | `useContestations(filters)`, `useCreerContestation()`, `useResoudreContestation()` |
  | `use-audit-logs-commission.ts` | `getAuditLogs`, `getAuditLogsByCommission` | `useAuditLogs(filters)`, `useAuditLogsByCommission(commissionId)` |
  | `use-recurrences-commission.ts` | `getRecurrencesByOrganisation`, `getRecurrencesByContrat` | `useRecurrences(filters)`, `useRecurrencesByContrat(contratId)` |
  | `use-reports-negatifs-commission.ts` | `getReportsNegatifsByOrganisation` | `useReportsNegatifs(filters)` |
  | `use-lignes-bordereau.ts` | `preselectionnerLignes`, `recalculerTotaux`, `validerBordereauFinal`, `getLignesForValidation` | `useLignesBordereau(bordereauId)`, `usePreselectionnerLignes()`, `useRecalculerTotaux()` |

  **Must NOT do**:
  - NE PAS intégrer ces hooks dans le composant principal (juste les créer — l'intégration viendra dans un futur plan)
  - NE PAS dupliquer de logique qui existe déjà dans d'autres hooks
  - NE PAS créer de nouvelles server actions — utiliser celles qui existent

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: 5 fichiers à créer, pattern à suivre, beaucoup de code mais pas complexe
  - **Skills**: [`frontend-ui-ux`]
    - `frontend-ui-ux`: Compréhension des patterns React hooks et de la couche data

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Task 2)
  - **Parallel Group**: Wave 2
  - **Blocks**: Task 7
  - **Blocked By**: None (indépendant, server actions existent déjà)

  **References**:

  **Pattern References** (hooks existants à suivre):
  - `frontend/src/hooks/commissions/use-reprises-commission.ts:1-111` — Pattern EXACT à répliquer : imports, structure useCallback + useApi, gestion error/loading/refetch, filtres en paramètres
  - `frontend/src/hooks/commissions/use-bordereaux-commission.ts:1-136` — Autre exemple du même pattern avec filtres
  - `frontend/src/hooks/commissions/use-commission-mutations.ts:1-594` — Pattern pour les mutations (create, update, delete) avec useApi

  **API/Type References** (server actions à appeler):
  - `frontend/src/actions/commissions.ts` — Toutes les server actions disponibles :
    - `getContestationsByOrganisation(params)` → retourne `{ data: { contestations }, error }`
    - `creerContestation(params)` → retourne `{ data: { contestation }, error }`
    - `resoudreContestation(params)` → retourne `{ data: { contestation }, error }`
    - `getAuditLogs(params)` → retourne `{ data: { auditLogs, total }, error }`
    - `getAuditLogsByCommission(commissionId)` → retourne `{ data: { auditLogs }, error }`
    - `getRecurrencesByOrganisation(params)` → retourne `{ data: { recurrences, total }, error }`
    - `getRecurrencesByContrat(contratId)` → retourne `{ data: { recurrences }, error }`
    - `getReportsNegatifsByOrganisation(params)` → retourne `{ data: { reports, total }, error }`
    - `preselectionnerLignes(params)` → retourne `{ data: PreselectionResponse, error }`
    - `recalculerTotaux(params)` → retourne `{ data: TotauxResponse, error }`
    - `validerBordereauFinal(params)` → retourne `{ data, error }`
    - `getLignesForValidation(params)` → retourne `{ data, error }`

  **Acceptance Criteria**:

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: All 5 hook files exist with correct exports
    Tool: Bash (ls + grep)
    Preconditions: None
    Steps:
      1. Assert file exists: frontend/src/hooks/commissions/use-contestations-commission.ts
      2. Assert file exists: frontend/src/hooks/commissions/use-audit-logs-commission.ts
      3. Assert file exists: frontend/src/hooks/commissions/use-recurrences-commission.ts
      4. Assert file exists: frontend/src/hooks/commissions/use-reports-negatifs-commission.ts
      5. Assert file exists: frontend/src/hooks/commissions/use-lignes-bordereau.ts
      6. For each file: grep for "export function" to verify exports exist
    Expected Result: All 5 files exist with proper exports
    Evidence: ls + grep output captured

  Scenario: TypeScript compilation passes with new hooks
    Tool: Bash (npx tsc --noEmit)
    Preconditions: None
    Steps:
      1. Run: npx tsc --noEmit --project frontend/tsconfig.json 2>&1 | grep -i "error" | head -20
      2. Assert: No type errors from new hook files
    Expected Result: Clean compilation
    Evidence: tsc output captured

  Scenario: Hooks follow existing patterns
    Tool: Bash (grep)
    Preconditions: None
    Steps:
      1. For each hook file: grep for "useCallback" or "useApi" usage
      2. Assert: Each hook uses the established data-fetching pattern
      3. For each hook file: grep for import from "@/actions/commissions"
      4. Assert: Each hook imports from existing server actions
    Expected Result: Consistent patterns across all hooks
    Evidence: grep output captured
  ```

  **Commit**: YES
  - Message: `feat(commissions): create React hooks for contestations, audit, recurrences, reports, lignes`
  - Files: 5 new hook files in `frontend/src/hooks/commissions/`

---

- [ ] 6. Add AlertDialog Confirmations to 4 Destructive Actions

  **What to do**:
  - Ajouter un `AlertDialog` de confirmation AVANT l'exécution de 4 actions destructives/irréversibles :

  | Action | Location | Titre du dialog | Description |
  |--------|----------|-----------------|-------------|
  | Générer bordereau | `commissions-page-client.tsx` (~ligne 874) | "Générer le bordereau ?" | "Vous allez générer un bordereau pour {N} commission(s) sélectionnée(s). Cette action créera un nouveau bordereau." |
  | Annuler reprise | `commissions-page-client.tsx` (~ligne 920) | "Annuler cette reprise ?" | "Cette action est irréversible. La reprise sera définitivement annulée." |
  | Valider bordereau | `commissions-page-client.tsx` (~ligne 978) | "Valider ce bordereau ?" | "La validation verrouille le bordereau. Aucune modification ne sera possible après validation." |
  | Résoudre contestation | `commissions-page-client.tsx` (~ligne 955) | "Confirmer la résolution ?" | "La contestation sera {acceptée/rejetée}. Cette action est définitive." |

  - Pour chaque action, suivre le pattern exact de `validation-page-client.tsx:306-324` :
    - State `open` contrôlé via `useState`
    - `AlertDialogContent` avec `AlertDialogHeader` (Title + Description)
    - `AlertDialogFooter` avec Cancel + Action
    - Bouton Action avec `disabled={loading}` et texte dynamique ("Validation..." pendant le chargement)
    - Pour les actions destructives (Annuler reprise) : utiliser `className="bg-destructive text-destructive-foreground hover:bg-destructive/90"` sur le bouton Action

  **Must NOT do**:
  - NE PAS ajouter de dialog de confirmation pour les actions non-destructives (export Excel, simulation calcul, etc.)
  - NE PAS modifier la logique des handlers eux-mêmes — juste envelopper l'appel existant dans une confirmation

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: 4 dialogs UI à créer avec le bon pattern, placement correct dans l'arbre de composants
  - **Skills**: [`frontend-ui-ux`]
    - `frontend-ui-ux`: Pattern AlertDialog, design cohérent, UX de confirmation

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Task 5)
  - **Parallel Group**: Wave 2
  - **Blocks**: Task 7
  - **Blocked By**: Task 1 (car validateurId est utilisé dans handleValidateBordereau)

  **References**:

  **Pattern References**:
  - `frontend/src/app/(main)/commissions/validation/validation-page-client.tsx:306-324` — Pattern AlertDialog EXACT pour confirmation de validation de bordereau. Copier ce pattern.
  - `frontend/src/app/(main)/parametres/roles-permissions/roles-permissions-page-client.tsx:277-295` — Pattern AlertDialog pour suppression avec loading state et styling destructif.
  - `frontend/src/components/ui/alert-dialog.tsx` — Le composant shadcn AlertDialog avec tous les sub-components.

  **Files to modify**:
  - `frontend/src/app/(main)/commissions/commissions-page-client.tsx` — Ajouter 4 AlertDialogs dans le JSX, gérer 4 states `open` + `pendingAction`

  **Acceptance Criteria**:

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: Générer bordereau requires confirmation
    Tool: Playwright (playwright skill)
    Preconditions: Dev server running, commissions selected
    Steps:
      1. Navigate to: http://localhost:3000/commissions
      2. Select at least 1 commission (click checkbox)
      3. Click: Button "Générer bordereau"
      4. Assert: AlertDialog appears with title containing "bordereau"
      5. Assert: Cancel button "Annuler" is visible
      6. Assert: Confirm button is visible
      7. Click: "Annuler"
      8. Assert: AlertDialog closes, NO bordereau generated
      9. Screenshot: .sisyphus/evidence/task-6-confirm-bordereau.png
    Expected Result: Confirmation dialog prevents accidental generation
    Evidence: .sisyphus/evidence/task-6-confirm-bordereau.png

  Scenario: AlertDialog imports present in file
    Tool: Bash (grep)
    Preconditions: None
    Steps:
      1. Run: grep "AlertDialog" frontend/src/app/\(main\)/commissions/commissions-page-client.tsx
      2. Assert: At least 4 AlertDialog usages found
      3. Run: grep "AlertDialogAction" frontend/src/app/\(main\)/commissions/commissions-page-client.tsx
      4. Assert: At least 4 action buttons
    Expected Result: All 4 confirmation dialogs are present
    Evidence: grep output captured
  ```

  **Commit**: YES
  - Message: `feat(commissions): add confirmation dialogs for destructive actions`
  - Files: `commissions-page-client.tsx`

---

- [ ] 7. Final QA Verification Pass

  **What to do**:
  - Exécuter une vérification complète de toutes les corrections :
    1. Vérifier que le build passe sans erreur
    2. Vérifier via grep que tous les hardcoded IDs sont supprimés
    3. Vérifier via grep que tous les typos sont corrigés
    4. Vérifier via grep que les empty states sont présents
    5. Vérifier via grep que les AlertDialogs sont présents
    6. Vérifier que les 5 hooks existent
    7. Ouvrir l'app dans Playwright et naviguer les parcours principaux

  **Must NOT do**:
  - NE PAS corriger des bugs supplémentaires trouvés pendant le QA (les reporter seulement)
  - NE PAS modifier de code — uniquement vérifier

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Vérification uniquement, pas de code à écrire
  - **Skills**: [`playwright`, `frontend-ui-ux`]
    - `playwright`: Automation de navigateur pour les tests visuels
    - `frontend-ui-ux`: Vérification de cohérence UI

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Sequential (Wave 3)
  - **Blocks**: None (final)
  - **Blocked By**: Tasks 2, 3, 4, 5, 6

  **References**:
  - Tous les fichiers modifiés dans les tâches précédentes

  **Acceptance Criteria**:

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: Full build passes
    Tool: Bash
    Preconditions: All tasks 1-6 completed
    Steps:
      1. Run: cd frontend && npx next build 2>&1 | tail -20
      2. Assert: Build completes without errors
    Expected Result: Successful build
    Evidence: Build output captured

  Scenario: All hardcoded values removed
    Tool: Bash (grep)
    Steps:
      1. grep -r "current-user-id" frontend/src/ → 0 matches
      2. grep -r "adv-backoffice" frontend/src/ → 0 matches
      3. grep -rn "Creer" frontend/src/components/commissions/ → 0 matches
      4. grep -rn "Creer" frontend/src/app/\(main\)/commissions/ → 0 matches
      5. grep -rn "Reessayer" frontend/src/ → 0 matches
    Expected Result: All problematic strings eliminated
    Evidence: grep outputs showing 0 matches

  Scenario: All 5 hook files exist
    Tool: Bash (ls)
    Steps:
      1. ls frontend/src/hooks/commissions/use-contestations-commission.ts
      2. ls frontend/src/hooks/commissions/use-audit-logs-commission.ts
      3. ls frontend/src/hooks/commissions/use-recurrences-commission.ts
      4. ls frontend/src/hooks/commissions/use-reports-negatifs-commission.ts
      5. ls frontend/src/hooks/commissions/use-lignes-bordereau.ts
    Expected Result: All 5 files exist
    Evidence: ls output

  Scenario: Navigation smoke test
    Tool: Playwright (playwright skill)
    Preconditions: Dev server running on localhost:3000
    Steps:
      1. Navigate to: http://localhost:3000/commissions
      2. Wait for: Page loads (timeout: 15s)
      3. Assert: No console errors
      4. Click through all 7 tabs: Commissions, Bordereaux, Reprises, Contestations, Audit, Récurrences, Reports négatifs
      5. For each tab: Assert no crash, content or empty state visible
      6. Screenshot: .sisyphus/evidence/task-7-smoke-test.png
    Expected Result: All tabs load without errors
    Evidence: .sisyphus/evidence/task-7-smoke-test.png
  ```

  **Commit**: NO (verification only)

---

## Commit Strategy

| After Task(s) | Message | Files | Verification |
|------------|---------|-------|--------------|
| 1 | `fix(commissions): replace hardcoded user IDs with authenticated user` | page.tsx, commissions-page-client.tsx | grep for removed strings |
| 2 | `fix(commissions): wire Contester/Modifier buttons and preserve deselection motif` | commission-detail-dialog.tsx, commission-config-dialog.tsx, commissions-page-client.tsx | Playwright click tests |
| 3 | `feat(commissions): add empty states to all 7 commission tabs` | commissions-page-client.tsx | grep EmptyTitle count |
| 4 | `fix(commissions): correct French typos and reprise button color` | commissions-page-client.tsx, creer-contestation-dialog.tsx | grep for removed typos |
| 5 | `feat(commissions): create React hooks for contestations, audit, recurrences, reports, lignes` | 5 new hook files | tsc --noEmit |
| 6 | `feat(commissions): add confirmation dialogs for destructive actions` | commissions-page-client.tsx | grep AlertDialog count |

---

## Success Criteria

### Verification Commands
```bash
# Hardcoded IDs removed
grep -r "current-user-id" frontend/src/   # Expected: 0 matches
grep -r "adv-backoffice" frontend/src/     # Expected: 0 matches

# Typos fixed
grep -rn "Creer" frontend/src/app/\(main\)/commissions/    # Expected: 0 matches
grep -rn "Creer" frontend/src/components/commissions/       # Expected: 0 matches
grep -rn "Reessayer" frontend/src/                           # Expected: 0 matches

# Empty states present
grep -c "EmptyTitle" frontend/src/app/\(main\)/commissions/commissions-page-client.tsx  # Expected: >= 7

# AlertDialogs present
grep -c "AlertDialogAction" frontend/src/app/\(main\)/commissions/commissions-page-client.tsx  # Expected: >= 4

# Hooks exist
ls frontend/src/hooks/commissions/use-contestations-commission.ts   # Expected: exists
ls frontend/src/hooks/commissions/use-audit-logs-commission.ts      # Expected: exists
ls frontend/src/hooks/commissions/use-recurrences-commission.ts     # Expected: exists
ls frontend/src/hooks/commissions/use-reports-negatifs-commission.ts # Expected: exists
ls frontend/src/hooks/commissions/use-lignes-bordereau.ts           # Expected: exists

# Build passes
cd frontend && npx next build  # Expected: success
```

### Final Checklist
- [ ] All "Must Have" present (6 items)
- [ ] All "Must NOT Have" absent (7 guardrails respected)
- [ ] All 7 tabs have empty states
- [ ] All 4 destructive actions have confirmation dialogs
- [ ] All 5 hooks created and compiling
- [ ] Build passes without errors
