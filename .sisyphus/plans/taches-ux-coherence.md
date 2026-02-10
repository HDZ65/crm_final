# Tâches Page — UX/UI Coherence Fix (Critiques + Majeurs)

## TL;DR

> **Quick Summary**: Corriger les problèmes de cohérence UX/UI critiques et majeurs sur la page Tâches du CRM, incluant les empty/error/loading states manquants, la navigation bidirectionnelle Tâches↔Clients, et les incohérences de navigation vers la configuration des relances.
> 
> **Deliverables**:
> - Empty state, error state et skeleton loading sur la page principale des tâches
> - Onglet "Tâches" dans la fiche client détail avec création contextuelle
> - Navigation vers `/taches/configuration` + breadcrumb retour
> - AlertDialog au lieu de `confirm()` natif sur la page de configuration
> - Titre du SiteHeader pour les routes `/taches`
> 
> **Estimated Effort**: Medium (7 tâches, ~3-4h de travail)
> **Parallel Execution**: YES - 2 waves
> **Critical Path**: Task 0 → Task 1 → Task 5

---

## Context

### Original Request
Analyse de cohérence UX/UI de la page Tâches d'un CRM multi-société. Identifier les parcours utilisateurs incomplets, oublis d'UI/UX, et prioriser les éléments critiques pour le MVP.

### Interview Summary
**Key Discussions**:
- L'utilisateur veut couvrir les 3 issues critiques MVP + les issues majeures
- Pas besoin de toucher au backend (les server actions existent déjà)
- Focus frontend uniquement

**Research Findings**:
- **Metis CRITIQUE #1**: `ErrorState` component n'existe PAS dans `frontend/src/components/ui/`. Il faut d'abord le copier depuis `clone/winaity-clean/frontend/src/components/ui/error-state.tsx`.
- **Metis CRITIQUE #2**: Aucune page `/contrats/[id]` n'existe. Les contrats sont affichés uniquement comme tab dans la fiche client. P2 doit viser uniquement la fiche client.
- **Metis CRITIQUE #3**: Les colonnes du tableau de tâches (`columns.tsx`) ne montrent PAS de UUID brut de clientId. Le clientId n'est simplement pas affiché du tout. P1 doit être reframé comme "ajouter un lien client au tableau".
- **Metis Finding #4**: `site-header.tsx` n'a pas de titre configuré pour `/taches` — la page affiche un header vide.
- **Metis Finding #6**: `components/activites/client-activites.tsx` est le pattern exact à suivre pour créer un composant `ClientTaches`.
- **Metis Finding #7**: `listTachesByClient()` server action existe et fonctionne (actions/taches.ts:163-194).

### Metis Review
**Identified Gaps** (addressed):
- ErrorState component manquant → Task 0 (pré-requis)
- SiteHeader sans titre → intégré dans Task 2
- Fiche contrat inexistante → scope réduit à fiche client uniquement
- Columns.tsx ne montre pas d'UUID → reframé en "ajout de lien"

---

## Work Objectives

### Core Objective
Rendre la page Tâches production-ready en ajoutant les states manquants (empty, error, loading), la navigation bidirectionnelle vers les entités liées, et la cohérence UX avec le reste de l'application.

### Concrete Deliverables
- `frontend/src/components/ui/error-state.tsx` — composant ErrorState copié et adapté
- `frontend/src/app/(main)/taches/taches-page-client.tsx` — empty state, error state, skeleton loading
- `frontend/src/app/(main)/taches/columns.tsx` — colonne lien client ajoutée
- `frontend/src/app/(main)/taches/taches-page-client.tsx` — bouton navigation config
- `frontend/src/app/(main)/taches/configuration/page.tsx` — breadcrumb retour + AlertDialog
- `frontend/src/components/client-detail/client-taches.tsx` — nouveau composant
- `frontend/src/app/(main)/clients/[id]/client-detail-client.tsx` — nouvel onglet Tâches
- `frontend/src/components/site-header.tsx` — titre pour routes tâches

### Definition of Done
- [ ] La page `/taches` affiche un empty state quand il n'y a aucune tâche
- [ ] La page `/taches` affiche un error state avec bouton "Réessayer" en cas d'erreur API
- [ ] La page `/taches` affiche un skeleton pendant le chargement initial
- [ ] Le tableau de tâches affiche un lien cliquable vers le client associé
- [ ] Un bouton "Configuration" est visible sur `/taches` et mène à `/taches/configuration`
- [ ] La page `/taches/configuration` a un breadcrumb/bouton retour vers `/taches`
- [ ] La suppression de règle sur la page de configuration utilise AlertDialog
- [ ] La fiche client `/clients/[id]` a un onglet "Tâches" fonctionnel
- [ ] Le SiteHeader affiche un titre correct sur `/taches` et `/taches/configuration`

### Must Have
- Empty state avec icône + texte + CTA "Créer votre première tâche"
- Error state avec message + bouton "Réessayer"
- Skeleton loading (3-5 lignes) au lieu du texte "Chargement..."
- Lien cliquable client dans le tableau (badge tronqué, pas le UUID complet)
- Bouton gear icon vers config depuis la page principale
- Breadcrumb retour depuis config
- AlertDialog au lieu de confirm() natif
- Onglet Tâches dans la fiche client suivant le pattern ClientActivites
- Titres SiteHeader pour /taches et /taches/configuration

### Must NOT Have (Guardrails)
- PAS de modifications backend/service-engagement — tout est frontend
- PAS de résolution du nom client (nécessiterait un nouveau endpoint API) — utiliser `clientId.slice(0,8)` comme texte du lien
- PAS d'ajout de colonne contratId dans le tableau (scope creep)
- PAS de modification des hooks `use-taches.ts` / `use-regles-relance.ts` (pas impactés)
- PAS de fix du filtre "Mes tâches" côté backend (bug D2 hors scope)
- PAS de tri des colonnes (U5 hors scope)
- PAS de filtre par type (U6 hors scope)

---

## Verification Strategy

> **UNIVERSAL RULE: ZERO HUMAN INTERVENTION**
>
> ALL tasks in this plan MUST be verifiable WITHOUT any human action.

### Test Decision
- **Infrastructure exists**: Non pertinent (modifications UI, pas de logic testable)
- **Automated tests**: None (corrections UI/UX pures)
- **Agent-Executed QA**: ALWAYS (Playwright pour toutes les vérifications)

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Start Immediately):
├── Task 0: Copier ErrorState component (pré-requis)
├── Task 3: Navigation config (bouton + breadcrumb retour)
├── Task 4: AlertDialog sur page configuration
└── Task 6: SiteHeader titres

Wave 2 (After Wave 1 - Task 0 complété):
├── Task 1: Empty/Error/Loading states page principale
├── Task 2: Colonne lien client dans le tableau
└── Task 5: Onglet Tâches dans fiche client
```

### Dependency Matrix

| Task | Depends On | Blocks | Can Parallelize With |
|------|------------|--------|---------------------|
| 0 | None | 1 | 3, 4, 6 |
| 1 | 0 | None | 2, 5 |
| 2 | 0 (minor) | None | 1, 5 |
| 3 | None | None | 0, 4, 6 |
| 4 | None | None | 0, 3, 6 |
| 5 | 0 (pour le loading pattern) | None | 1, 2 |
| 6 | None | None | 0, 3, 4 |

### Agent Dispatch Summary

| Wave | Tasks | Recommended Agents |
|------|-------|-------------------|
| 1 | 0, 3, 4, 6 | 4 agents `category="quick"` en parallèle |
| 2 | 1, 2, 5 | 3 agents `category="visual-engineering"` en parallèle |

---

## TODOs

- [ ] 0. Copier le composant ErrorState depuis clone/winaity-clean

  **What to do**:
  - Copier `clone/winaity-clean/frontend/src/components/ui/error-state.tsx` vers `frontend/src/components/ui/error-state.tsx`
  - Vérifier que les imports sont compatibles (il utilise `Empty`, `EmptyHeader`, etc. de `@/components/ui/empty` qui existe déjà)
  - Adapter les imports si nécessaire (paths, noms)

  **Must NOT do**:
  - Ne PAS modifier le composant `empty.tsx` existant
  - Ne PAS ajouter de dépendances npm supplémentaires

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Simple copie de fichier avec vérification d'imports
  - **Skills**: []
    - Aucun skill spécifique nécessaire

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 3, 4, 6)
  - **Blocks**: Tasks 1, 2, 5
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `clone/winaity-clean/frontend/src/components/ui/error-state.tsx` — Le composant source à copier. Utilise `Empty`, `EmptyHeader`, `EmptyMedia`, `EmptyTitle`, `EmptyDescription`, `EmptyContent` de `@/components/ui/empty`. 9 types d'erreurs supportés: network, unauthorized, forbidden, not-found, validation, conflict, timeout, internal, generic.
  
  **API/Type References**:
  - `frontend/src/components/ui/empty.tsx` — Le composant Empty EXISTE DÉJÀ dans le projet cible. L'ErrorState dépend de ce composant.

  **Acceptance Criteria**:
  - [ ] Le fichier `frontend/src/components/ui/error-state.tsx` existe
  - [ ] Le composant compile sans erreur TypeScript : `npx tsc --noEmit frontend/src/components/ui/error-state.tsx` → 0 erreurs
  - [ ] L'import `import { ErrorState } from "@/components/ui/error-state"` est valide

  **Agent-Executed QA Scenarios**:

  ```
  Scenario: ErrorState component compiles and exports correctly
    Tool: Bash
    Preconditions: Frontend project installed
    Steps:
      1. Verify file exists: ls frontend/src/components/ui/error-state.tsx
      2. Run TypeScript check on affected files: cd frontend && npx tsc --noEmit 2>&1 | grep -i error-state
      3. Assert: No TypeScript errors related to error-state
    Expected Result: File exists and compiles cleanly
    Evidence: Terminal output captured
  ```

  **Commit**: YES (groups with 1)
  - Message: `feat(taches): add ErrorState component for API error display`
  - Files: `frontend/src/components/ui/error-state.tsx`

---

- [ ] 1. Ajouter Empty State, Error State et Skeleton Loading sur la page principale des tâches

  **What to do**:
  - Ajouter une variable `error` au state de `TachesPageClient` (string | null)
  - Capturer `result.error` dans `fetchTaches()` et `fetchStats()` quand les appels échouent
  - Remplacer le texte "Chargement..." (ligne 379) par des composants `Skeleton` (3-5 lignes de tableau skeleton)
  - Ajouter un rendu conditionnel : si `error` → `ErrorState` avec `onRetry={() => { fetchTaches(); fetchStats(); }}`
  - Ajouter un rendu conditionnel : si `!loading && taches.length === 0` → composant `Empty` avec icône `ListTodo`, titre "Aucune tâche", description contextuelle selon le filtre actif, et bouton CTA "Créer votre première tâche" qui ouvre `setCreateDialogOpen(true)`
  - La description de l'empty state doit s'adapter au filtre actif : "Aucune tâche à faire" / "Aucune tâche en cours" / "Aucune tâche terminée" / "Aucune tâche en retard" / "Aucune tâche trouvée" (quand recherche)

  **Must NOT do**:
  - Ne PAS changer la logique de fetch (juste capturer l'erreur)
  - Ne PAS modifier le composant DataTable
  - Ne PAS ajouter d'animations complexes

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: Nécessite une bonne compréhension des composants UI et de leur disposition visuelle
  - **Skills**: [`frontend-ui-ux`]
    - `frontend-ui-ux`: Pour assurer un rendu visuellement cohérent avec le reste de l'app

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 2, 5)
  - **Blocks**: None
  - **Blocked By**: Task 0 (ErrorState component)

  **References**:

  **Pattern References**:
  - `frontend/src/components/taches-widget.tsx:165-170` — Empty state pattern déjà utilisé dans le widget tâches : CheckCircle icon + "Aucune tâche en attente" + "Vous êtes à jour !". Suivre ce pattern mais avec le composant `Empty` de Shadcn.
  - `frontend/src/components/activites/client-activites.tsx:10,54-73` — Pattern Skeleton loading : import Skeleton, puis render Card+Skeleton dans un if(loading). C'EST LE PATTERN À SUIVRE.
  - `clone/winaity-clean/frontend/src/components/ui/error-state.tsx` — ErrorState component avec prop `onRetry` pour le bouton "Réessayer". Types: "network" pour erreur API générique.
  
  **API/Type References**:
  - `frontend/src/app/(main)/taches/taches-page-client.tsx:91-96` — Variables state actuelles. Il faut ajouter `const [error, setError] = React.useState<string | null>(null)` ici.
  - `frontend/src/app/(main)/taches/taches-page-client.tsx:140-160` — `fetchTaches()` : ajouter `else { setError(result.error || "Erreur de chargement") }` dans le else du `if (result.data)`.
  - `frontend/src/app/(main)/taches/taches-page-client.tsx:377-389` — Zone de rendu à modifier : remplacer le loading texte et ajouter les conditions empty/error.

  **Acceptance Criteria**:
  - [ ] Le fichier `taches-page-client.tsx` importe `Skeleton` de `@/components/ui/skeleton` et `ErrorState` de `@/components/ui/error-state`
  - [ ] Une variable `error` est dans le state
  - [ ] L'erreur API est capturée et affichée avec un bouton "Réessayer"
  - [ ] Le loading affiche des skeletons au lieu de texte brut
  - [ ] L'empty state affiche un message contextuel avec CTA

  **Agent-Executed QA Scenarios**:

  ```
  Scenario: Empty state renders when no tasks exist
    Tool: Playwright (playwright skill)
    Preconditions: Dev server running on localhost:3000, user logged in, organisation with 0 tasks
    Steps:
      1. Navigate to: http://localhost:3000/taches
      2. Wait for: page to load (timeout: 10s)
      3. Assert: Element containing "Aucune tâche" is visible
      4. Assert: A button with text "Créer" or "Nouvelle tâche" is visible within empty state
      5. Screenshot: .sisyphus/evidence/task-1-empty-state.png
    Expected Result: Empty state with message and CTA button is visible
    Evidence: .sisyphus/evidence/task-1-empty-state.png

  Scenario: Loading shows skeleton instead of text
    Tool: Playwright (playwright skill)
    Preconditions: Dev server running, user logged in
    Steps:
      1. Navigate to: http://localhost:3000/taches
      2. Immediately look for: [data-slot="skeleton"] or element with class "animate-pulse"
      3. Assert: At least one skeleton element exists during loading
      4. Assert: No text "Chargement..." visible
      5. Screenshot: .sisyphus/evidence/task-1-skeleton-loading.png
    Expected Result: Skeleton loaders shown during initial load
    Evidence: .sisyphus/evidence/task-1-skeleton-loading.png
  ```

  **Commit**: YES
  - Message: `feat(taches): add empty state, error state and skeleton loading`
  - Files: `frontend/src/app/(main)/taches/taches-page-client.tsx`
  - Pre-commit: `cd frontend && npx tsc --noEmit`

---

- [ ] 2. Ajouter un lien client cliquable dans le tableau de tâches

  **What to do**:
  - Dans `columns.tsx`, ajouter une nouvelle colonne entre "assigneA" et "dateEcheance" (ou remplacer une existante)
  - La colonne "Client" affiche :
    - Si `tache.clientId` est vide/falsy → `<span className="text-muted-foreground">—</span>`
    - Si `tache.clientId` existe → un `<Link href={/clients/${tache.clientId}}>` avec le texte tronqué `clientId.slice(0,8)...` dans un `<Badge variant="outline">` avec une icône ExternalLink
  - Importer `Link` de `next/link` et `ExternalLink` de `lucide-react`

  **Must NOT do**:
  - Ne PAS résoudre le nom du client (nécessiterait un appel API supplémentaire — hors scope)
  - Ne PAS ajouter de colonne contratId (scope creep)
  - Ne PAS modifier les autres colonnes existantes

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Ajout simple d'une colonne dans un fichier existant
  - **Skills**: []
    - Aucun skill spécifique nécessaire

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 1, 5)
  - **Blocks**: None
  - **Blocked By**: None (task 0 est un soft dependency — pas strictement nécessaire)

  **References**:

  **Pattern References**:
  - `frontend/src/app/(main)/taches/columns.tsx:181-194` — Colonne "Assigné à" : pattern avec avatar + texte tronqué. Suivre un pattern similaire pour le lien client.
  - `frontend/src/app/(main)/taches/columns.tsx:99-131` — Colonne "Description" avec tooltip pour texte tronqué. Pattern réutilisable.

  **API/Type References**:
  - `frontend/src/app/(main)/taches/columns.tsx:32` — Import de `Tache` qui contient `clientId: string`
  
  **Acceptance Criteria**:
  - [ ] Une colonne "Client" apparaît dans le tableau
  - [ ] Si `clientId` est vide, un tiret "—" est affiché
  - [ ] Si `clientId` existe, un badge cliquable est affiché
  - [ ] Le clic sur le badge navigue vers `/clients/{clientId}`
  - [ ] Le composant compile sans erreur TypeScript

  **Agent-Executed QA Scenarios**:

  ```
  Scenario: Client column shows link when clientId exists
    Tool: Playwright (playwright skill)
    Preconditions: Dev server running, at least one task with a clientId
    Steps:
      1. Navigate to: http://localhost:3000/taches
      2. Wait for: table to render (timeout: 10s)
      3. Assert: A column header "Client" exists in the table
      4. Assert: At least one cell contains a link (a[href^="/clients/"])
      5. Click: First client link in table
      6. Wait for: navigation to /clients/* URL
      7. Assert: URL starts with "/clients/"
      8. Screenshot: .sisyphus/evidence/task-2-client-link.png
    Expected Result: Client column shows clickable link that navigates to client detail
    Evidence: .sisyphus/evidence/task-2-client-link.png

  Scenario: Client column shows dash when no clientId
    Tool: Playwright (playwright skill)
    Preconditions: Dev server running, at least one task WITHOUT clientId
    Steps:
      1. Navigate to: http://localhost:3000/taches
      2. Wait for: table to render
      3. Assert: At least one cell in Client column shows "—"
    Expected Result: Dash displayed for tasks without client
    Evidence: Terminal assertion output
  ```

  **Commit**: YES
  - Message: `feat(taches): add clickable client link column to task table`
  - Files: `frontend/src/app/(main)/taches/columns.tsx`

---

- [ ] 3. Ajouter la navigation vers la page de configuration des relances

  **What to do**:
  - Dans `taches-page-client.tsx`, ajouter un bouton icône `Settings2` (de lucide-react) à côté du bouton "Nouvelle tâche" dans la barre d'actions (ligne ~369)
  - Le bouton utilise `<Button variant="outline" size="icon" asChild><Link href="/taches/configuration"><Settings2 className="h-4 w-4" /></Link></Button>`
  - Ajouter un `Tooltip` sur le bouton avec le texte "Configuration des relances"
  - Dans `configuration/page.tsx`, ajouter un breadcrumb en haut de la page avec :
    - `<Link href="/taches">← Tâches</Link>` comme premier élément
    - OU un `<Button variant="ghost" size="sm" asChild><Link href="/taches"><ChevronLeft className="mr-1 h-4 w-4"/>Retour aux tâches</Link></Button>` au-dessus du titre H1

  **Must NOT do**:
  - Ne PAS modifier le layout global de la page
  - Ne PAS ajouter de sous-menu dans la sidebar

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 2 petites modifications dans 2 fichiers existants
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 0, 4, 6)
  - **Blocks**: None
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `frontend/src/app/(main)/taches/taches-page-client.tsx:369-372` — Bouton "Nouvelle tâche" existant. Le bouton config doit être AVANT ce bouton.
  - `frontend/src/app/(main)/taches/taches-page-client.tsx:14-15` — Imports Shadcn existants (Switch, Label). Ajouter Link de next/link et Settings2 de lucide-react.
  - `frontend/src/app/(main)/taches/configuration/page.tsx:326-347` — Zone header de la page config. Ajouter le bouton retour AU-DESSUS de cette div.

  **Acceptance Criteria**:
  - [ ] Un bouton engrenage (Settings2) visible sur `/taches` dans la barre d'actions
  - [ ] Le clic sur ce bouton navigue vers `/taches/configuration`
  - [ ] Sur `/taches/configuration`, un bouton "Retour aux tâches" est visible en haut
  - [ ] Le clic sur "Retour aux tâches" navigue vers `/taches`

  **Agent-Executed QA Scenarios**:

  ```
  Scenario: Settings button navigates to configuration
    Tool: Playwright (playwright skill)
    Preconditions: Dev server running on localhost:3000, user logged in
    Steps:
      1. Navigate to: http://localhost:3000/taches
      2. Wait for: page loaded (timeout: 10s)
      3. Find: Button with Settings2 icon (svg with lucide class or near "Nouvelle tâche")
      4. Click: Settings button
      5. Wait for: URL to be /taches/configuration
      6. Assert: URL is http://localhost:3000/taches/configuration
      7. Screenshot: .sisyphus/evidence/task-3-config-nav.png
    Expected Result: Navigation to configuration page works
    Evidence: .sisyphus/evidence/task-3-config-nav.png

  Scenario: Back button navigates from configuration to taches
    Tool: Playwright (playwright skill)
    Preconditions: Dev server running
    Steps:
      1. Navigate to: http://localhost:3000/taches/configuration
      2. Wait for: page loaded
      3. Find: Button or link containing "Retour" or "Tâches"
      4. Click: Back button
      5. Wait for: URL to be /taches
      6. Assert: URL is http://localhost:3000/taches
      7. Screenshot: .sisyphus/evidence/task-3-back-nav.png
    Expected Result: Navigation back to taches page works
    Evidence: .sisyphus/evidence/task-3-back-nav.png
  ```

  **Commit**: YES
  - Message: `feat(taches): add navigation between tasks page and configuration`
  - Files: `frontend/src/app/(main)/taches/taches-page-client.tsx`, `frontend/src/app/(main)/taches/configuration/page.tsx`

---

- [ ] 4. Remplacer `confirm()` natif par AlertDialog sur la page de configuration

  **What to do**:
  - Dans `configuration/page.tsx`, ajouter un state `deleteRegleDialogOpen` et `regleToDelete` (type `RegleRelance | null`)
  - Remplacer le `if (!confirm(...)) return;` dans `handleDelete` (ligne 298) par :
    - `setRegleToDelete(regle); setDeleteRegleDialogOpen(true); return;`
  - Créer une nouvelle fonction `handleDeleteRegleConfirm` qui exécute la suppression réelle
  - Ajouter un `AlertDialog` identique à celui de `taches-page-client.tsx:436-455` :
    - Titre: "Supprimer la règle ?"
    - Description: `Cette action est irréversible. La règle "${regleToDelete?.nom}" sera définitivement supprimée.`
    - Bouton Annuler + Bouton Supprimer (destructive)

  **Must NOT do**:
  - Ne PAS changer le fonctionnement de la suppression (juste l'UI de confirmation)
  - Ne PAS ajouter d'AlertDialog pour les autres actions (activer/désactiver)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Remplacement mécanique d'un pattern par un autre, pattern déjà existant dans le même projet
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 0, 3, 6)
  - **Blocks**: None
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `frontend/src/app/(main)/taches/taches-page-client.tsx:82-83,229-247,436-455` — Pattern EXACT à reproduire : state `deleteDialogOpen` + `selectedTache`, handler `handleDeleteClick` qui set le state, handler `handleDeleteConfirm` qui exécute, et le JSX `AlertDialog`. Copier ce pattern.
  - `frontend/src/app/(main)/taches/configuration/page.tsx:297-307` — Code actuel avec `confirm()` natif à remplacer.

  **API/Type References**:
  - `frontend/src/app/(main)/taches/configuration/page.tsx:29-38` — Imports AlertDialog déjà présents ? NON — il faut les ajouter depuis `@/components/ui/alert-dialog`.

  **Acceptance Criteria**:
  - [ ] Plus aucun appel `confirm()` dans `configuration/page.tsx`
  - [ ] Un AlertDialog Shadcn s'affiche lors de la suppression d'une règle
  - [ ] Le dialog montre le nom de la règle à supprimer
  - [ ] Le bouton "Annuler" ferme le dialog sans supprimer
  - [ ] Le bouton "Supprimer" exécute la suppression et ferme le dialog

  **Agent-Executed QA Scenarios**:

  ```
  Scenario: Delete rule shows AlertDialog instead of native confirm
    Tool: Playwright (playwright skill)
    Preconditions: Dev server running, user on /taches/configuration, at least 1 rule exists
    Steps:
      1. Navigate to: http://localhost:3000/taches/configuration
      2. Wait for: Table with rules visible (timeout: 10s)
      3. Click: Delete button (Trash2 icon) on first rule row
      4. Wait for: AlertDialog visible (role="alertdialog")
      5. Assert: Dialog contains text "Supprimer la règle"
      6. Assert: Dialog contains text of the rule name
      7. Assert: "Annuler" button visible
      8. Assert: "Supprimer" button visible with destructive styling
      9. Click: "Annuler" button
      10. Assert: Dialog is closed
      11. Assert: Rule still exists in table
      12. Screenshot: .sisyphus/evidence/task-4-alertdialog.png
    Expected Result: AlertDialog shown with rule name, cancel works
    Evidence: .sisyphus/evidence/task-4-alertdialog.png
  ```

  **Commit**: YES
  - Message: `fix(taches): replace native confirm() with AlertDialog on config page`
  - Files: `frontend/src/app/(main)/taches/configuration/page.tsx`

---

- [ ] 5. Ajouter un onglet "Tâches" dans la fiche client détail

  **What to do**:
  - Créer un nouveau composant `frontend/src/components/client-detail/client-taches.tsx` en suivant EXACTEMENT le pattern de `components/activites/client-activites.tsx`:
    - Props: `{ clientId: string }`
    - State: `taches`, `loading`, `dialogOpen`, `selectedTache`
    - Fetch: `listTachesByClient(clientId)` (server action existante)
    - Loading: Skeleton pattern (Card + Skeleton enfants)
    - Empty: Message "Aucune tâche" 
    - List: Réutiliser le pattern de `taches-widget.tsx` (TacheItem avec icône type, titre, date, priorité badge, bouton compléter)
    - Bouton "Nouvelle tâche" qui ouvre `CreateTacheDialog` avec `clientId={clientId}` passé en prop
    - Bouton "Compléter" utilisant `marquerTacheTerminee` (server action existante)
  - Dans `client-detail-client.tsx`, ajouter le 6ème onglet :
    - Import: `import { ClientTaches } from "@/components/client-detail/client-taches"`
    - TabsTrigger: `<TabsTrigger value="taches">Tâches</TabsTrigger>` (après "Activités", ligne 408)
    - TabsContent: `<TabsContent value="taches" className="flex-1"><ClientTaches clientId={clientId} /></TabsContent>` (après le TabsContent "activites", ligne 439)

  **Must NOT do**:
  - Ne PAS dupliquer le DataTable complet de la page principale (trop lourd pour un onglet)
  - Ne PAS ajouter de pagination (la liste client a rarement > 20 tâches)
  - Ne PAS modifier les autres onglets existants

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: Création d'un composant UI complexe suivant un pattern existant, intégration dans un layout à onglets
  - **Skills**: [`frontend-ui-ux`]
    - `frontend-ui-ux`: Pour un rendu cohérent avec le widget tâches et les autres tabs client

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 1, 2)
  - **Blocks**: None
  - **Blocked By**: Task 0 (pour le loading pattern si ErrorState utilisé)

  **References**:

  **Pattern References**:
  - `frontend/src/components/activites/client-activites.tsx` — PATTERN EXACT à suivre pour la structure du composant: props `{ clientId }`, state (loading, data, dialogOpen), useCallback+useEffect pour fetch, Skeleton loading, rendu conditionnel. Lignes 1-30 pour la structure, 54-73 pour le skeleton.
  - `frontend/src/components/taches-widget.tsx:47-91` — Pattern TacheItem pour afficher une tâche dans une liste : icône type + titre + date + priorité badge + bouton compléter. Réutiliser ce composant ou ce pattern.
  - `frontend/src/app/(main)/clients/[id]/client-detail-client.tsx:405-462` — Structure des onglets existants. Le nouvel onglet doit s'insérer après "activites" (ligne 408 pour trigger, ligne 439 pour content).
  
  **API/Type References**:
  - `frontend/src/actions/taches.ts:163-194` — `listTachesByClient(clientId)` server action PRÊTE. Retourne `PaginatedTachesDto`.
  - `frontend/src/actions/taches.ts:327-354` — `createTache(dto)` pour la création contextuelle avec `clientId`.
  - `frontend/src/actions/taches.ts:409-422` — `marquerTacheTerminee(id)` pour le bouton compléter.
  - `frontend/src/app/(main)/taches/create-tache-dialog.tsx:58-64` — `CreateTacheDialog` accepte déjà `clientId?: string` en props.

  **Acceptance Criteria**:
  - [ ] Le fichier `frontend/src/components/client-detail/client-taches.tsx` existe
  - [ ] Un onglet "Tâches" apparaît dans la fiche client après "Activités"
  - [ ] Le clic sur l'onglet affiche les tâches liées au client
  - [ ] Un bouton "Nouvelle tâche" existe et ouvre le dialog de création
  - [ ] Le dialog de création pré-remplit le `clientId`
  - [ ] Le composant compile sans erreur TypeScript

  **Agent-Executed QA Scenarios**:

  ```
  Scenario: Tasks tab appears on client detail page
    Tool: Playwright (playwright skill)
    Preconditions: Dev server running, at least one client exists
    Steps:
      1. Navigate to: http://localhost:3000/clients
      2. Wait for: client list to load
      3. Click: First client row to navigate to detail
      4. Wait for: client detail page loaded (timeout: 10s)
      5. Assert: Tab "Tâches" is visible in the tabs list
      6. Click: Tab "Tâches"
      7. Wait for: Tab content to render
      8. Assert: Content area shows either tasks list or empty state
      9. Screenshot: .sisyphus/evidence/task-5-client-taches-tab.png
    Expected Result: Tasks tab is present and functional on client detail
    Evidence: .sisyphus/evidence/task-5-client-taches-tab.png

  Scenario: Create task from client detail pre-fills clientId
    Tool: Playwright (playwright skill)
    Preconditions: Dev server running, on client detail page, Tasks tab active
    Steps:
      1. On client detail /clients/[id], click "Tâches" tab
      2. Click: "Nouvelle tâche" button within tab content
      3. Wait for: CreateTacheDialog visible (role="dialog")
      4. Assert: Dialog title contains "Nouvelle tâche"
      5. Fill: input[name="titre"] with "Test depuis client"
      6. Screenshot: .sisyphus/evidence/task-5-create-from-client.png
    Expected Result: Create dialog opens, clientId silently passed
    Evidence: .sisyphus/evidence/task-5-create-from-client.png
  ```

  **Commit**: YES
  - Message: `feat(clients): add Tasks tab to client detail page`
  - Files: `frontend/src/components/client-detail/client-taches.tsx`, `frontend/src/app/(main)/clients/[id]/client-detail-client.tsx`
  - Pre-commit: `cd frontend && npx tsc --noEmit`

---

- [ ] 6. Ajouter les titres SiteHeader pour les routes /taches

  **What to do**:
  - Dans `frontend/src/components/site-header.tsx`, trouver la logique de mapping pathname → titre
  - Ajouter :
    - `/taches` → "Gestion des Tâches"
    - `/taches/configuration` → "Configuration des Relances"
  - Suivre le pattern exact des autres routes déjà configurées dans ce fichier

  **Must NOT do**:
  - Ne PAS modifier les titres des autres pages
  - Ne PAS ajouter de breadcrumbs (hors scope de cette tâche)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Ajout de 2 lignes dans un mapping existant
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 0, 3, 4)
  - **Blocks**: None
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `frontend/src/components/site-header.tsx` — Fichier contenant le mapping pathname → titre. Chercher `pathname` et les conditions existantes (if/switch/map) pour ajouter les 2 nouvelles routes.

  **Acceptance Criteria**:
  - [ ] La page `/taches` affiche "Gestion des Tâches" dans le SiteHeader
  - [ ] La page `/taches/configuration` affiche "Configuration des Relances" dans le SiteHeader

  **Agent-Executed QA Scenarios**:

  ```
  Scenario: SiteHeader shows correct title on taches pages
    Tool: Playwright (playwright skill)
    Preconditions: Dev server running
    Steps:
      1. Navigate to: http://localhost:3000/taches
      2. Wait for: page loaded
      3. Assert: Header area contains text "Gestion des Tâches"
      4. Navigate to: http://localhost:3000/taches/configuration
      5. Wait for: page loaded
      6. Assert: Header area contains text "Configuration des Relances"
      7. Screenshot: .sisyphus/evidence/task-6-header-titles.png
    Expected Result: Correct titles shown in header for both routes
    Evidence: .sisyphus/evidence/task-6-header-titles.png
  ```

  **Commit**: YES
  - Message: `fix(taches): add SiteHeader titles for taches routes`
  - Files: `frontend/src/components/site-header.tsx`

---

## Commit Strategy

| After Task | Message | Files | Verification |
|------------|---------|-------|--------------|
| 0 | `feat(taches): add ErrorState component for API error display` | `frontend/src/components/ui/error-state.tsx` | `tsc --noEmit` |
| 1 | `feat(taches): add empty state, error state and skeleton loading` | `frontend/src/app/(main)/taches/taches-page-client.tsx` | `tsc --noEmit` |
| 2 | `feat(taches): add clickable client link column to task table` | `frontend/src/app/(main)/taches/columns.tsx` | `tsc --noEmit` |
| 3 | `feat(taches): add navigation between tasks page and configuration` | `taches-page-client.tsx`, `configuration/page.tsx` | `tsc --noEmit` |
| 4 | `fix(taches): replace native confirm() with AlertDialog on config page` | `configuration/page.tsx` | `tsc --noEmit` |
| 5 | `feat(clients): add Tasks tab to client detail page` | `client-taches.tsx` (new), `client-detail-client.tsx` | `tsc --noEmit` |
| 6 | `fix(taches): add SiteHeader titles for taches routes` | `site-header.tsx` | `tsc --noEmit` |

---

## Success Criteria

### Verification Commands
```bash
cd frontend && npx tsc --noEmit  # Expected: 0 errors
```

### Final Checklist
- [ ] Empty state visible quand 0 tâches
- [ ] Error state visible en cas d'erreur API
- [ ] Skeleton loading au lieu de "Chargement..."
- [ ] Lien client cliquable dans le tableau
- [ ] Navigation bidirectionnelle /taches ↔ /taches/configuration
- [ ] AlertDialog pour suppression de règle (pas de confirm() natif)
- [ ] Onglet Tâches dans la fiche client
- [ ] SiteHeader avec titre correct sur /taches et /taches/configuration
- [ ] Aucun `confirm()` restant dans le code des tâches
- [ ] Aucune erreur TypeScript
