# Sidebar Restructure — CRM Générique

## TL;DR

> **Quick Summary**: Restructurer la sidebar du CRM pour passer de ~22 items (6 groupes) à ~13 items (3 groupes). Supprimer le groupe Administration (déplacé dans la modale Paramètres existante), fusionner Paiements dans Finance, généraliser DepanSur → "Dossiers SAV", déplacer Calendrier admin dans Paramètres.
> 
> **Deliverables**:
> - `nav-config.ts` restructuré (3 groupes au lieu de 5)
> - `settings-dialog.tsx` enrichi (9 sections groupées)
> - Page index `/paiements` avec navigation par onglets
> - `command-menu.tsx` auto-mis à jour (consomme NAV_GROUPS)
> - Toutes les pages existantes continuent de fonctionner sans changement d'URL
> 
> **Estimated Effort**: Medium
> **Parallel Execution**: YES — 2 waves
> **Critical Path**: Task 1 → Task 2 → Task 3 → Task 5

---

## Context

### Original Request
L'utilisateur trouve la sidebar trop chargée pour un CRM de gestion générique multi-sociétés. DepanSur est une marque spécifique Winvest Capital qui n'a pas de sens pour d'autres clients. Le groupe Paiements est trop technique. Le groupe Administration surcharge la navigation.

### Interview Summary
**Key Discussions**:
- DepanSur → Généralisé en "Dossiers SAV" (renommage cosmétique uniquement)
- Paiements (4 sous-pages) → Fusionné dans Finance comme un seul item
- Agenda reste dans CRM, Calendrier (jours fériés/zones) → déplacé dans Paramètres
- Administration → Entièrement supprimé de la sidebar → absorbé dans la modale Paramètres existante
- Abonnements et Expéditions → conservés
- L'utilisateur a déjà un bouton Paramètres dans le user menu (nav-user.tsx) qui ouvre une modale (settings-dialog.tsx)

**Research Findings**:
- `nav-config.ts` est la **source de vérité unique** pour la navigation — consommé par `app-sidebar.tsx` ET `command-menu.tsx`
- `command-menu.tsx` itère `NAV_GROUPS` directement → se met à jour automatiquement
- `settings-dialog.tsx` utilise un pattern sidebar-in-modal avec `navItems` array (L56-61)
- Il n'existe **aucun** `/paiements/page.tsx` ni `/paiements/layout.tsx` — les 4 sous-pages sont indépendantes
- Le Calendrier admin (`/calendrier`) est un server component léger qui délègue à un client component
- `NAV_ROUTE_LABELS` est exporté mais jamais utilisé (prévu pour breadcrumbs futurs) — doit être maintenu à jour

### Metis Review
**Identified Gaps** (addressed):
- **command-menu.tsx** est un consommateur caché de `NAV_GROUPS` → Auto-résolu car il itère la même source
- **Pas de `/paiements/page.tsx`** → Task 2 crée une page index avec onglets
- **Settings modal à 9 items** → Groupés en 2 catégories (Compte, Organisation)
- **Collision nom "Paiements"** dans settings (PSP config) vs sidebar (opérations) → Renommé en "PSP / Prestataires" dans settings
- **DepanSur: URL vs display** → URLs restent `/depanssur/*`, seul le label change
- **`requiredRole` non câblé** → Explicitement hors scope

---

## Work Objectives

### Core Objective
Réduire la sidebar de 6 groupes / ~22 items à 3 groupes / ~13 items, en déplaçant tout le paramétrage dans la modale Paramètres existante, rendant le CRM adapté à un usage multi-sociétés générique.

### Concrete Deliverables
- `frontend/src/lib/nav-config.ts` — 3 groupes (CRM, Finance, Catalogue & Opérations)
- `frontend/src/components/settings-dialog.tsx` — 9 sections groupées (Compte + Organisation)
- `frontend/src/app/(main)/paiements/page.tsx` — Page index avec onglets de navigation
- Breadcrumb labels mis à jour dans `NAV_ROUTE_LABELS`

### Definition of Done
- [x] Sidebar affiche exactement 3 groupes + Dashboard
- [x] Aucun groupe "Administration" ou "Paiements" dans la sidebar
- [x] "Dossiers SAV" apparaît au lieu de "DepanSur"
- [x] "Paiements" apparaît dans le groupe Finance
- [x] La modale Paramètres contient toutes les sections admin
- [x] Cmd+K reflète la nouvelle structure
- [x] Toutes les pages existantes chargent normalement (aucun 404)
- [x] `npm run build` passe sans erreur

### Must Have
- 3 groupes de navigation : CRM, Finance, Catalogue & Opérations
- "Dossiers SAV" en remplacement de "DepanSur" (label uniquement)
- "Paiements" comme item unique dans Finance → page avec onglets
- Toutes les sections admin dans la modale Paramètres
- Build qui compile

### Must NOT Have (Guardrails)
- ❌ **NE PAS renommer les URLs ni les segments de route** — uniquement les labels d'affichage
- ❌ **NE PAS refactorer les pages admin en client components** — utiliser des liens vers les pages existantes depuis la modale
- ❌ **NE PAS construire de vrais panneaux fonctionnels** pour les nouvelles sections admin — liens vers les pages existantes (navigation router)
- ❌ **NE PAS câbler `requiredRole`** ni ajouter de filtrage par rôle — ticket séparé
- ❌ **NE PAS renommer les fichiers, gRPC clients, proto packages, actions, ou composants liés à DepanSur** — renommage cosmétique uniquement
- ❌ **NE PAS restructurer l'interne des pages Paiements** — uniquement la navigation vers elles
- ❌ **NE PAS supprimer `NAV_ROUTE_LABELS`** — le mettre à jour pour correspondre à la nouvelle structure
- ❌ **NE PAS ajouter de comportement mobile spécifique** — le modal gère déjà le responsive

---

## Verification Strategy

> **UNIVERSAL RULE: ZERO HUMAN INTERVENTION**
> ALL tasks are verified by agent tools (Playwright, Bash). No human action permitted.

### Test Decision
- **Infrastructure exists**: YES (frontend build + lint)
- **Automated tests**: NO (nav restructure is config/UI-only, no unit test infrastructure for this)
- **Agent-Executed QA**: ALWAYS (Playwright for all UI verifications)

### Agent-Executed QA Scenarios (MANDATORY — ALL tasks)

**Verification Tool by Deliverable Type:**

| Type | Tool | How Agent Verifies |
|------|------|-------------------|
| **Sidebar UI** | Playwright | Navigate, check groups count, verify item labels |
| **Settings Modal** | Playwright | Open modal, check nav items, click sections |
| **Command Palette** | Playwright | Open Cmd+K, search items, verify absence of removed items |
| **Page Navigation** | Playwright | Navigate all existing URLs, verify no 404 |
| **Build** | Bash | `npm run build` in frontend/ |

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Start Immediately):
├── Task 1: Restructure nav-config.ts [no dependencies]
└── Task 4: Update settings-dialog.tsx [no dependencies — can start in parallel]

Wave 2 (After Wave 1):
├── Task 2: Create /paiements index page [depends: 1 — needs Paiements in Finance group confirmed]
├── Task 3: Update page headings for DepanSur [depends: 1 — needs label change confirmed]
└── Task 5: Final verification & build [depends: 1, 2, 3, 4]

Critical Path: Task 1 → Task 2 → Task 5
Parallel Speedup: ~35% faster than sequential
```

### Dependency Matrix

| Task | Depends On | Blocks | Can Parallelize With |
|------|------------|--------|---------------------|
| 1 | None | 2, 3, 5 | 4 |
| 2 | 1 | 5 | 3, 4 |
| 3 | 1 | 5 | 2, 4 |
| 4 | None | 5 | 1, 2, 3 |
| 5 | 1, 2, 3, 4 | None | None (final) |

### Agent Dispatch Summary

| Wave | Tasks | Recommended Agents |
|------|-------|-------------------|
| 1 | 1, 4 | task(category="quick", ...) — config changes |
| 2 | 2, 3 | task(category="quick", ...) — small page/component changes |
| Final | 5 | task(category="quick", load_skills=["playwright"], ...) — verification |

---

## TODOs

- [x] 1. Restructure `nav-config.ts` — Source de vérité navigation

  **What to do**:
  - Supprimer `NAV_PAIEMENTS_GROUP` entièrement
  - Supprimer `NAV_ADMINISTRATION_GROUP` entièrement
  - Ajouter un item "Paiements" dans `NAV_FINANCE_VENTES_GROUP` (url: `/paiements`, icon: CreditCard) — entre "Abonnements" et "Statistiques"
  - Renommer "DepanSur" → "Dossiers SAV" dans `NAV_CATALOGUE_OPERATIONS_GROUP` (garder url `/depanssur/dossiers`, garder les children)
  - Renommer les enfants : "Dossiers" → "Dossiers", "Reporting" → "Reporting" (pas de changement nécessaire — les labels enfants sont déjà génériques)
  - Retirer "Calendrier" du `NAV_CRM_GROUP`
  - Mettre à jour `NAV_GROUPS` array pour n'exporter que 3 groupes : `[NAV_CRM_GROUP, NAV_FINANCE_VENTES_GROUP, NAV_CATALOGUE_OPERATIONS_GROUP]`
  - Mettre à jour `NAV_ROUTE_LABELS` : 
    - Retirer les entrées admin : `parametres/*`, `integrations/*`
    - Ajouter `"paiements": "Paiements"` (pour la future page index)
    - Renommer `"depanssur": "Dossiers SAV"`, `"depanssur/dossiers": "Dossiers"`, `"depanssur/reporting": "Reporting"`
    - Retirer `"calendrier": "Calendrier"` des routes CRM (reste dans labels pour breadcrumbs si navigué directement)

  **Must NOT do**:
  - Ne pas changer les URLs
  - Ne pas supprimer les exports `NAV_PAIEMENTS_GROUP` ou `NAV_ADMINISTRATION_GROUP` si d'autres fichiers les importent — vérifier d'abord avec AST grep

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Modification d'un seul fichier config, patterns clairs
  - **Skills**: []
    - Aucune skill spéciale requise — c'est du TypeScript pur

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Task 4)
  - **Blocks**: Tasks 2, 3, 5
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `frontend/src/lib/nav-config.ts:63-95` — Structure de groupe existante (NAV_CRM_GROUP) — suivre ce pattern exactement
  - `frontend/src/lib/nav-config.ts:100-126` — NAV_FINANCE_VENTES_GROUP — c'est ici qu'on ajoute "Paiements"
  - `frontend/src/lib/nav-config.ts:131-166` — NAV_CATALOGUE_OPERATIONS_GROUP — c'est ici qu'on renomme DepanSur
  - `frontend/src/lib/nav-config.ts:251-257` — Array NAV_GROUPS — réduire à 3 entrées

  **Consumer References** (fichiers qui importent nav-config):
  - `frontend/src/components/app-sidebar.tsx:11` — Importe `NAV_GROUPS, DASHBOARD_ITEM` — se met à jour auto
  - `frontend/src/components/command-menu.tsx:13` — Importe `NAV_GROUPS, DASHBOARD_ITEM` — se met à jour auto

  **WHY Each Reference Matters**:
  - `nav-config.ts` est la source de vérité unique. Modifier ce fichier propage les changements automatiquement à la sidebar ET au command menu.
  - Vérifier avec `ast_grep_search` que `NAV_ADMINISTRATION_GROUP` et `NAV_PAIEMENTS_GROUP` ne sont pas importés directement ailleurs avant de les supprimer.

  **Acceptance Criteria**:

  - [ ] `NAV_GROUPS` exporte exactement 3 groupes : `crm`, `finance-ventes`, `catalogue-operations`
  - [ ] Aucun groupe `administration` ni `paiements` dans `NAV_GROUPS`
  - [ ] Item "Paiements" présent dans le groupe `finance-ventes` avec url `/paiements`
  - [ ] Item "Dossiers SAV" présent dans `catalogue-operations` avec url `/depanssur/dossiers`
  - [ ] Item "Calendrier" absent du groupe `crm`
  - [ ] `NAV_ROUTE_LABELS` mis à jour (entrées depanssur renommées, entrée paiements ajoutée)
  - [ ] `npm run build --prefix frontend` → BUILD SUCCESS

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: Verify NAV_GROUPS exports 3 groups
    Tool: Bash
    Preconditions: Frontend source code accessible
    Steps:
      1. Use ast_grep_search to find NAV_GROUPS array definition
      2. Verify it contains exactly 3 entries
      3. Verify no reference to NAV_ADMINISTRATION_GROUP or NAV_PAIEMENTS_GROUP in the array
    Expected Result: 3 groups only
    Evidence: AST search output

  Scenario: Build compiles after nav-config changes
    Tool: Bash
    Preconditions: Dependencies installed
    Steps:
      1. Run: npm run build --prefix frontend
      2. Assert: exit code 0
      3. Assert: no TypeScript errors related to nav-config imports
    Expected Result: Build passes
    Evidence: Build output captured
  ```

  **Commit**: YES
  - Message: `refactor(frontend): restructure sidebar navigation from 6 groups to 3`
  - Files: `frontend/src/lib/nav-config.ts`
  - Pre-commit: `npm run build --prefix frontend`

---

- [x] 2. Create `/paiements` index page with tab navigation

  **What to do**:
  - Créer `frontend/src/app/(main)/paiements/page.tsx` — page serveur simple
  - Créer `frontend/src/app/(main)/paiements/paiements-page-client.tsx` — client component
  - Le client component affiche une navigation par onglets (Tabs UI) pointant vers :
    - Routage → `/paiements/routing`
    - Archives → `/paiements/archives`
    - Alertes → `/paiements/alertes`
    - Exports → `/paiements/exports`
  - Par défaut, la page redirige ou affiche le contenu de "Routage" (premier onglet)
  - Utiliser le composant Tabs de Shadcn UI pour la navigation
  - Les onglets fonctionnent comme des **liens de navigation** (pas de re-rendering dans la même page) — chaque onglet navigue vers sa sous-page existante

  **Must NOT do**:
  - Ne pas restructurer les pages existantes (`routing/page.tsx`, `archives/page.tsx`, etc.)
  - Ne pas créer de layout.tsx — les sous-pages gardent leur autonomie
  - Ne pas embed les sous-pages dans des tab panels — utiliser `usePathname()` + `router.push()`

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Création d'une page simple avec composant UI existant (Tabs)
  - **Skills**: []
    - Pas de skill spéciale — Shadcn Tabs est déjà installé

  **Parallelization**:
  - **Can Run In Parallel**: YES (after Task 1)
  - **Parallel Group**: Wave 2 (with Tasks 3, 4)
  - **Blocks**: Task 5
  - **Blocked By**: Task 1

  **References**:

  **Pattern References**:
  - `frontend/src/app/(main)/paiements/routing/page.tsx:1-19` — Pattern de page serveur existant (server component léger → client component)
  - `frontend/src/app/(main)/paiements/routing/routing-page-client.tsx` — Pattern de client component paiements existant

  **API/Type References**:
  - `frontend/src/components/ui/tabs.tsx` — Composant Tabs de Shadcn UI à utiliser

  **WHY Each Reference Matters**:
  - La page doit suivre le même pattern que les sous-pages existantes (server component mince qui délègue)
  - Les Tabs Shadcn sont déjà dans le projet — réutiliser sans ajouter de dépendance

  **Acceptance Criteria**:

  - [ ] `/paiements` existe et ne renvoie pas 404
  - [ ] La page affiche 4 onglets : Routage, Archives, Alertes, Exports
  - [ ] Cliquer sur un onglet navigue vers la sous-page correspondante
  - [ ] L'onglet actif est déterminé par `usePathname()`
  - [ ] La page `/paiements` (sans sous-route) est accessible
  - [ ] Build passe

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: Paiements index page loads with tabs
    Tool: Playwright (playwright skill)
    Preconditions: Dev server running on localhost:3000, user authenticated
    Steps:
      1. Navigate to: http://localhost:3000/paiements
      2. Wait for: page content visible (timeout: 10s)
      3. Assert: 4 tab-like navigation elements visible with text "Routage", "Archives", "Alertes", "Exports"
      4. Screenshot: .sisyphus/evidence/task-2-paiements-index.png
    Expected Result: Page loads with 4 navigation tabs
    Evidence: .sisyphus/evidence/task-2-paiements-index.png

  Scenario: Tab navigation works
    Tool: Playwright (playwright skill)
    Preconditions: On /paiements page
    Steps:
      1. Click tab/link "Archives"
      2. Wait for: navigation to /paiements/archives (timeout: 5s)
      3. Assert: URL is /paiements/archives
      4. Assert: Page content loads (no 404)
      5. Screenshot: .sisyphus/evidence/task-2-paiements-archives.png
    Expected Result: Navigation to archives sub-page
    Evidence: .sisyphus/evidence/task-2-paiements-archives.png
  ```

  **Commit**: YES (groups with Task 3)
  - Message: `feat(frontend): add paiements index page with tab navigation`
  - Files: `frontend/src/app/(main)/paiements/page.tsx`, `frontend/src/app/(main)/paiements/paiements-page-client.tsx`
  - Pre-commit: `npm run build --prefix frontend`

---

- [x] 3. Rename DepanSur display labels to "Dossiers SAV"

  **What to do**:
  - Dans les pages `/depanssur/dossiers/page.tsx` et `/depanssur/reporting/page.tsx` : mettre à jour le titre de page h1/heading de "DepanSur" → "Dossiers SAV"
  - Chercher tout texte "DepanSur" ou "Depanssur" affiché dans les composants client des pages depanssur et le remplacer par "Dossiers SAV" ou "SAV" selon le contexte
  - NE PAS toucher aux noms de fichiers, imports, variables, noms de fonctions, URLs, ou actions

  **Must NOT do**:
  - Ne pas renommer les fichiers/dossiers (`depanssur/` reste tel quel)
  - Ne pas modifier les imports, variables, fonctions
  - Ne pas changer les URLs
  - Ne pas toucher au backend, proto, actions

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Renommage cosmétique de labels dans quelques fichiers
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (after Task 1)
  - **Parallel Group**: Wave 2 (with Tasks 2, 4)
  - **Blocks**: Task 5
  - **Blocked By**: Task 1

  **References**:

  **Pattern References**:
  - `frontend/src/app/(main)/depanssur/dossiers/page.tsx` — Page serveur à modifier (heading)
  - `frontend/src/app/(main)/depanssur/reporting/page.tsx` — Page serveur à modifier (heading)

  **Search Strategy**:
  - `grep -r "DepanSur\|Depanssur\|depanssur" frontend/src/ --include="*.tsx" --include="*.ts"` — Trouver toutes les occurrences d'affichage
  - Filtrer : ne modifier QUE les strings affichées à l'utilisateur, PAS les noms de variables/fichiers/imports

  **WHY Each Reference Matters**:
  - Les pages dossiers et reporting sont les deux seuls points d'entrée UI pour ce module
  - Le grep exhaustif garantit qu'aucun label "DepanSur" ne persiste dans l'UI

  **Acceptance Criteria**:

  - [ ] Aucun texte "DepanSur" visible dans la sidebar (vérifié par Task 1)
  - [ ] Aucun texte "DepanSur" visible sur les pages `/depanssur/dossiers` et `/depanssur/reporting`
  - [ ] Le titre de page affiche "Dossiers SAV" (ou équivalent)
  - [ ] Les URLs restent `/depanssur/*`

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: DepanSur pages show "Dossiers SAV" heading
    Tool: Playwright (playwright skill)
    Preconditions: Dev server running, user authenticated
    Steps:
      1. Navigate to: http://localhost:3000/depanssur/dossiers
      2. Wait for: page content visible (timeout: 10s)
      3. Assert: No text "DepanSur" visible on page (case-insensitive search in DOM)
      4. Assert: Text "Dossiers SAV" or "SAV" visible in h1 or heading
      5. Screenshot: .sisyphus/evidence/task-3-dossiers-sav.png
    Expected Result: Page heading says "Dossiers SAV", not "DepanSur"
    Evidence: .sisyphus/evidence/task-3-dossiers-sav.png

  Scenario: Reporting page also renamed
    Tool: Playwright (playwright skill)
    Preconditions: Dev server running
    Steps:
      1. Navigate to: http://localhost:3000/depanssur/reporting
      2. Wait for: page content visible (timeout: 10s)
      3. Assert: No text "DepanSur" visible on page
      4. Screenshot: .sisyphus/evidence/task-3-reporting-sav.png
    Expected Result: No "DepanSur" branding visible
    Evidence: .sisyphus/evidence/task-3-reporting-sav.png
  ```

  **Commit**: YES (groups with Task 2)
  - Message: `refactor(frontend): rename DepanSur to Dossiers SAV in UI labels`
  - Files: `frontend/src/app/(main)/depanssur/*/page.tsx`, client components
  - Pre-commit: `npm run build --prefix frontend`

---

- [x] 4. Extend `settings-dialog.tsx` with grouped admin sections

  **What to do**:
  - Restructurer le `navItems` array dans `settings-dialog.tsx` en 2 groupes :
    - **Compte** : Profil, Notifications, Sécurité
    - **Organisation** : PSP / Prestataires (renommé de "Paiements"), Rôles & Permissions, Marque Blanche, Calendrier, Types d'activités, Intégrations
  - Pour chaque nouvelle section admin, créer un composant contenu minimal qui **navigue vers la page existante** via `router.push()` + ferme la modale. Pattern : "Pour configurer [X], accédez à la page dédiée" + bouton "Ouvrir [X]" → `router.push('/parametres/roles-permissions')` + `onOpenChange(false)`
  - Renommer la section "Paiements" existante (PSP config) en "PSP / Prestataires" pour éviter la collision avec le nouvel item sidebar "Paiements"
  - Utiliser `SidebarGroupLabel` ou un séparateur visuel pour distinguer les 2 groupes dans la sidebar de la modale
  - Ajouter les icônes appropriées pour les nouvelles sections

  **Must NOT do**:
  - Ne pas re-implémenter les pages admin (Rôles, Marque Blanche, etc.) dans la modale
  - Ne pas créer de formulaires fonctionnels pour les nouvelles sections
  - Ne pas modifier le comportement des sections existantes (Profil, Notifications, Sécurité)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Extension d'un composant existant avec pattern clair
  - **Skills**: [`frontend-ui-ux`]
    - `frontend-ui-ux`: La modale settings passe de 4 à 9 items — besoin de bonne ergonomie pour le groupement visuel

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Task 1)
  - **Blocks**: Task 5
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `frontend/src/components/settings-dialog.tsx:56-61` — `navItems` array actuel (4 items) — étendre ce pattern
  - `frontend/src/components/settings-dialog.tsx:68-92` — `ProfilSettings` composant — pattern pour les panneaux de contenu
  - `frontend/src/components/ui/sidebar.tsx` — Composants SidebarGroup, SidebarGroupContent pour le groupement

  **Page References** (pages admin existantes à lier):
  - `/parametres/roles-permissions` — Page Rôles & Permissions existante
  - `/parametres/marque-blanche` — Page Marque Blanche existante
  - `/parametres/marque-blanche/partenaires` — Sous-page partenaires
  - `/parametres/marque-blanche/themes` — Sous-page thèmes
  - `/parametres/marque-blanche/statuts` — Sous-page statuts
  - `/calendrier` — Page calendrier admin existante
  - `/parametres/types-activites` — Page types d'activités existante
  - `/integrations/woocommerce` — Page intégrations existante

  **WHY Each Reference Matters**:
  - Le pattern `navItems` + composants de contenu doit être étendu de manière cohérente
  - Les pages admin existent déjà — on ne re-crée rien, on crée des liens de navigation vers elles

  **Acceptance Criteria**:

  - [ ] La modale Paramètres contient 2 groupes visuels : "Compte" et "Organisation"
  - [ ] Groupe "Compte" : Profil, Notifications, Sécurité (3 items)
  - [ ] Groupe "Organisation" : PSP / Prestataires, Rôles & Permissions, Marque Blanche, Calendrier, Types d'activités, Intégrations (6 items)
  - [ ] La section "Paiements" PSP est renommée "PSP / Prestataires"
  - [ ] Chaque nouvelle section affiche un lien/bouton vers la page existante
  - [ ] Cliquer sur "Ouvrir Rôles & Permissions" → navigue vers `/parametres/roles-permissions` et ferme la modale
  - [ ] Build passe

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: Settings modal shows grouped admin sections
    Tool: Playwright (playwright skill)
    Preconditions: Dev server running, user authenticated
    Steps:
      1. Navigate to: http://localhost:3000
      2. Click: user menu button at bottom of sidebar (SidebarMenuButton with avatar)
      3. Click: "Paramètres" menu item
      4. Wait for: dialog visible (timeout: 5s)
      5. Assert: Text "Compte" visible (group label)
      6. Assert: Text "Organisation" visible (group label)
      7. Assert: Nav items include "PSP / Prestataires" (not "Paiements")
      8. Assert: Nav items include "Rôles & Permissions", "Marque Blanche", "Calendrier", "Intégrations", "Types d'activités"
      9. Screenshot: .sisyphus/evidence/task-4-settings-modal.png
    Expected Result: Settings modal shows 2 groups with all admin sections
    Evidence: .sisyphus/evidence/task-4-settings-modal.png

  Scenario: Admin section navigates to existing page
    Tool: Playwright (playwright skill)
    Preconditions: Settings modal open
    Steps:
      1. Click: "Rôles & Permissions" in settings sidebar
      2. Wait for: content panel visible (timeout: 3s)
      3. Click: navigation button/link (e.g., "Ouvrir Rôles & Permissions")
      4. Wait for: dialog closes and navigation to /parametres/roles-permissions (timeout: 5s)
      5. Assert: URL is /parametres/roles-permissions
      6. Assert: Page content loads (not 404)
      7. Screenshot: .sisyphus/evidence/task-4-roles-navigation.png
    Expected Result: Modal closes, navigates to admin page
    Evidence: .sisyphus/evidence/task-4-roles-navigation.png

  Scenario: Existing settings sections still work
    Tool: Playwright (playwright skill)
    Preconditions: Settings modal open
    Steps:
      1. Click: "Profil" in settings sidebar
      2. Assert: Profil form content visible (input for "Nom d'affichage")
      3. Click: "Notifications" in settings sidebar
      4. Assert: Notification settings visible
      5. Screenshot: .sisyphus/evidence/task-4-existing-sections.png
    Expected Result: Existing sections unchanged and functional
    Evidence: .sisyphus/evidence/task-4-existing-sections.png
  ```

  **Commit**: YES
  - Message: `feat(frontend): extend settings modal with grouped admin sections`
  - Files: `frontend/src/components/settings-dialog.tsx`
  - Pre-commit: `npm run build --prefix frontend`

---

- [x] 5. Final verification — Build + Playwright E2E

  **What to do**:
  - Lancer `npm run build` pour vérifier la compilation
  - Lancer le serveur de dev et exécuter tous les scénarios Playwright de vérification
  - Vérifier que TOUTES les anciennes pages restent accessibles :
    - `/paiements/routing`, `/paiements/archives`, `/paiements/alertes`, `/paiements/exports`
    - `/depanssur/dossiers`, `/depanssur/reporting`
    - `/parametres/roles-permissions`, `/parametres/permissions`, `/parametres/types-activites`
    - `/parametres/marque-blanche`, `/parametres/marque-blanche/partenaires`, `/parametres/marque-blanche/themes`, `/parametres/marque-blanche/statuts`
    - `/calendrier`
    - `/integrations/woocommerce`
  - Vérifier la sidebar : exactement 3 groupes, pas d'Administration, pas de Paiements group
  - Vérifier Cmd+K : reflète la nouvelle structure
  - Capturer des screenshots de preuve

  **Must NOT do**:
  - Ne pas modifier de code — cette task est verification-only

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Vérification uniquement — pas de code à écrire
  - **Skills**: [`playwright`]
    - `playwright`: Indispensable pour la vérification UI (navigation, screenshots, assertions DOM)

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Sequential (final)
  - **Blocks**: None
  - **Blocked By**: Tasks 1, 2, 3, 4

  **References**:

  **Verification References**:
  - Toutes les acceptance criteria des Tasks 1-4
  - La liste exhaustive de pages dans la section "Acceptance Criteria" ci-dessous

  **Acceptance Criteria**:

  - [ ] `npm run build --prefix frontend` → exit code 0
  - [ ] Sidebar : exactement Dashboard + 3 groupes collapsibles (CRM, Finance, Catalogue & Opérations)
  - [ ] Sidebar : CRM contient exactement 4 items (Clients, Commerciaux, Tâches, Agenda)
  - [ ] Sidebar : Finance contient exactement 5 items (Commissions, Facturation, Abonnements, Paiements, Statistiques)
  - [ ] Sidebar : Catalogue & Opérations contient exactement 3 items (Catalogue, Expéditions, Dossiers SAV)
  - [ ] Aucun texte "DepanSur" visible dans la sidebar
  - [ ] Aucun groupe "Administration" dans la sidebar
  - [ ] Aucun groupe "Paiements" dans la sidebar
  - [ ] Modale Paramètres accessible via user menu et contient 9 sections en 2 groupes
  - [ ] Cmd+K ne montre PAS les items admin/paiements comme groupes séparés
  - [ ] 16 pages existantes chargent sans 404 (liste ci-dessous)

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: Full sidebar verification
    Tool: Playwright (playwright skill)
    Preconditions: Dev server running on localhost:3000, user authenticated
    Steps:
      1. Navigate to: http://localhost:3000
      2. Wait for: sidebar visible (timeout: 10s)
      3. Assert: Exactly 3 collapsible group labels visible: "CRM", "Finance & Ventes" (or "Finance"), "Catalogue & Opérations"
      4. Assert: No text "Administration" visible in sidebar
      5. Assert: No group-level "Paiements" label in sidebar
      6. Assert: Text "Dossiers SAV" visible in sidebar (not "DepanSur")
      7. Assert: Text "Paiements" visible inside Finance group (not as its own group)
      8. Assert: No text "Calendrier" visible in CRM group
      9. Screenshot: .sisyphus/evidence/task-5-sidebar-final.png
    Expected Result: Sidebar shows exactly 3 groups with correct items
    Evidence: .sisyphus/evidence/task-5-sidebar-final.png

  Scenario: Command palette reflects new structure
    Tool: Playwright (playwright skill)
    Preconditions: On main page
    Steps:
      1. Press: Ctrl+K (or Meta+K)
      2. Wait for: command dialog visible (timeout: 3s)
      3. Assert: No group heading "Administration" visible
      4. Assert: No group heading "Paiements" visible
      5. Assert: "Paiements" visible under Finance group
      6. Assert: "Dossiers SAV" visible (not "DepanSur")
      7. Screenshot: .sisyphus/evidence/task-5-command-menu.png
    Expected Result: Command palette matches sidebar structure
    Evidence: .sisyphus/evidence/task-5-command-menu.png

  Scenario: All existing pages still accessible (no 404)
    Tool: Playwright (playwright skill)
    Preconditions: Dev server running, user authenticated
    Steps:
      1. Navigate to each URL and assert page loads (no "404" or error):
         - /paiements (NEW — should load)
         - /paiements/routing
         - /paiements/archives
         - /paiements/alertes
         - /paiements/exports
         - /depanssur/dossiers
         - /depanssur/reporting
         - /parametres/roles-permissions
         - /parametres/permissions
         - /parametres/types-activites
         - /parametres/marque-blanche
         - /parametres/marque-blanche/partenaires
         - /parametres/marque-blanche/themes
         - /parametres/marque-blanche/statuts
         - /calendrier
         - /integrations/woocommerce
      2. For each: Assert no "404" text, no error boundary, page content visible
    Expected Result: All 16 pages load successfully
    Evidence: Terminal output with status for each URL

  Scenario: Settings modal complete verification
    Tool: Playwright (playwright skill)
    Preconditions: Dev server running, user authenticated
    Steps:
      1. Navigate to: http://localhost:3000
      2. Open user menu → click "Paramètres"
      3. Wait for: settings dialog visible (timeout: 5s)
      4. Assert: 2 group labels visible ("Compte", "Organisation")
      5. Assert: 9 nav items total
      6. Click each nav item and assert content panel renders without error:
         - Profil → form visible
         - Notifications → toggle/switch visible
         - Sécurité → password section visible
         - PSP / Prestataires → PSP config visible
         - Rôles & Permissions → link/button visible
         - Marque Blanche → link/button visible
         - Calendrier → link/button visible
         - Types d'activités → link/button visible
         - Intégrations → link/button visible
      7. Screenshot: .sisyphus/evidence/task-5-settings-all-sections.png
    Expected Result: All 9 sections render content
    Evidence: .sisyphus/evidence/task-5-settings-all-sections.png
  ```

  **Commit**: NO (verification only)

---

## Commit Strategy

| After Task | Message | Files | Verification |
|------------|---------|-------|--------------|
| 1 | `refactor(frontend): restructure sidebar navigation from 6 groups to 3` | `nav-config.ts` | `npm run build` |
| 2+3 | `feat(frontend): add paiements index page and rename DepanSur to Dossiers SAV` | `paiements/page.tsx`, `paiements/paiements-page-client.tsx`, depanssur page headings | `npm run build` |
| 4 | `feat(frontend): extend settings modal with grouped admin sections` | `settings-dialog.tsx` | `npm run build` |
| 5 | — | — | Playwright E2E |

---

## Success Criteria

### Verification Commands
```bash
npm run build --prefix frontend  # Expected: BUILD SUCCESS, exit code 0
```

### Final Checklist
- [x] Sidebar: 3 groupes, ~13 items (was 6 groupes, ~22 items)
- [x] "DepanSur" → "Dossiers SAV" partout dans l'UI
- [x] "Paiements" = 1 item dans Finance (was groupe séparé de 4 items)
- [x] "Calendrier" admin dans Paramètres (was dans CRM group)
- [x] Administration entièrement dans modale Paramètres
- [x] Modale Paramètres : 9 sections en 2 groupes (Compte, Organisation)
- [x] "PSP / Prestataires" (pas "Paiements") dans la modale settings
- [x] Cmd+K reflète la nouvelle structure
- [x] 0 pages cassées (toutes les URLs existantes fonctionnent)
- [x] Build compile sans erreur
