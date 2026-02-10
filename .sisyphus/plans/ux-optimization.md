# UX/UI Architecture Optimization — CRM Multi-Société

## TL;DR

> **Quick Summary**: Refonte progressive de l'architecture UX d'un CRM multi-société Next.js 15. Restructuration de la sidebar (26 items plats → 5 groupes collapsibles), réduction de la charge cognitive sur 5 pages critiques, ajout de breadcrumbs auto-générés, command palette (Cmd+K), et filtrage nav par rôle.
> 
> **Deliverables**:
> - Sidebar restructurée en 5 groupes collapsibles (≤5 items/groupe)
> - Breadcrumbs auto-générés sur toutes les pages internes
> - Command palette (Cmd+K) pour navigation rapide
> - SiteHeader décomposé en 5 sous-composants
> - Active state corrigé (startsWith au lieu de ===)
> - Pages critiques allégées (Client 7→5 tabs, Marque Blanche split)
> - Hook `useNavPermissions()` pour filtrage nav par rôle
> - Corrections UX cross-cutting (empty states, filter badges, portal back buttons)
> 
> **Estimated Effort**: Large (6-8 semaines, 4 phases)
> **Parallel Execution**: YES — 3 waves per phase where applicable
> **Critical Path**: Task 1 (nav config) → Task 2 (sidebar) → Task 5 (SiteHeader decomp) → Task 6 (breadcrumbs) → Task 11 (command palette)

---

## Context

### Original Request
Audit UX complet de l'architecture du CRM multi-société afin d'optimiser la navigation, la charge cognitive et la findability.

### Interview Summary
**Key Discussions**:
- **Objectif** : Optimisation complète (pas juste quick wins) — navigation + charge cognitive + filtres + search + breadcrumbs
- **Timeline** : Refonte progressive 6-8 semaines
- **Contrainte Shadcn** : Composants `components/ui/` ne doivent PAS être modifiés, seulement composés
- **Rôles/permissions** : Filtrage nav par rôle à implémenter (infrastructure inexistante actuellement)

**Research Findings (4 agents + Metis)**:
- **26 sidebar items** + 5 pages orphelines = 31 routes total (Metis correction)
- **Commissions = 3 tabs** (pas 7 comme estimé initialement) — surcharge due à la densité d'info (1100+ lignes)
- **Client Detail = 7 tabs** (pas 8) — consolidation 7→5 reste valide
- **SiteHeader = 696 lignes** — God component avec pathname→title map hardcodé
- **Breadcrumb + Command (cmdk)** = composants Shadcn déjà installés mais jamais utilisés
- **Zero tests** — `bun run build` seule validation automatisée
- **Zero infrastructure permissions** — seulement `isOwner: boolean`, pas de `usePermission()`
- **9 Zustand stores** — aucun ne se reset au changement d'organisation
- **WebSocket notifications** — potentiel race condition au changement d'org

### Metis Review
**Identified Gaps (addressed)**:
- Tab count surestimé (Commissions 7→3, Client 8→7) — corrigé dans le plan
- 5 pages orphelines non mentionnées — ajoutées au grouping sidebar
- SiteHeader doit être décomposé AVANT breadcrumbs — ajouté comme tâche prérequise
- Permission infrastructure inexistante — Phase 4 resized (2 semaines)
- Commissions : problème = densité d'info, pas tabs — reframé en progressive disclosure
- Command palette : utiliser cmdk existant — spécifié dans la tâche

---

## Work Objectives

### Core Objective
Restructurer l'architecture d'information du CRM pour réduire la charge cognitive de 5/5 à ≤3/5 sur toutes les pages, améliorer la findability, et préparer l'infrastructure de filtrage par rôle.

### Concrete Deliverables
- `components/nav-sidebar.tsx` — nouveau composant de navigation groupée (remplace 3 arrays dans `app-sidebar.tsx`)
- `lib/nav-config.ts` — configuration centralisée de la navigation avec groupes, URLs, icônes, rôles
- `components/header/` — SiteHeader décomposé en 5 sous-composants
- `components/breadcrumb-nav.tsx` — breadcrumbs auto-générés depuis pathname
- `components/command-menu.tsx` — command palette avec recherche navigation (utilise `cmdk` existant)
- `hooks/use-nav-permissions.ts` — hook de filtrage nav par rôle (Phase 4)
- Pages modifiées : Client Detail (tabs), Marque Blanche (split), Config Tâches (tabs)

### Definition of Done
- [ ] `bun run build` passe sans erreurs après chaque tâche
- [ ] Sidebar affiche ≤5 groupes avec ≤6 items par groupe
- [ ] Breadcrumbs visibles sur toutes les pages de profondeur ≥1
- [ ] Cmd+K ouvre le command palette depuis n'importe quelle page
- [ ] Active state fonctionne pour sub-pages (`/abonnements/plans` active `Abonnements`)
- [ ] Navigation filtrée par rôle (owner voit tout, member voit sous-ensemble)

### Must Have
- Navigation groupée en sections collapsibles
- Active state parent highlighting (startsWith)
- Breadcrumbs auto-générés
- Command palette (navigation search)
- SiteHeader décomposé
- Role-based nav filtering
- `bun run build` valide après chaque tâche

### Must NOT Have (Guardrails)
- **G1** : NE PAS modifier de fichier dans `components/ui/` — composants Shadcn sont des primitives, les composer uniquement
- **G2** : NE PAS changer l'ordre de nesting des providers dans `(main)/layout.tsx` (OrganisationProvider → NotificationProvider → OrganizationGuard → AiHealthProvider → SidebarProvider)
- **G3** : NE PAS changer les URLs/paths de routes — aucune route ne doit être renommée
- **G4** : `app-sidebar.tsx` DOIT rester un client component (`"use client"`)
- **G5** : NE PAS ajouter d'animations custom à la sidebar — utiliser `Collapsible` Shadcn built-in
- **G6** : NE PAS ajouter d'internationalisation — labels restent hardcodés en français
- **G7** : Command palette = recherche navigation UNIQUEMENT (pas d'entity search, pas d'actions, pas d'IA)
- **G8** : NE PAS restructurer le contenu des pages dans Phase 1 — uniquement le grouping sidebar
- **G9** : NE PAS construire un RBAC complet — seulement `useNavPermissions()` hook lisant `isOwner`
- **G10** : NE PAS ajouter de nouvelles dépendances — utiliser cmdk et les composants déjà installés

---

## Verification Strategy (MANDATORY)

> **UNIVERSAL RULE: ZERO HUMAN INTERVENTION**
> ALL tasks MUST be verifiable by running a command or using a tool.

### Test Decision
- **Infrastructure exists**: NO (zero test files, zero test config)
- **Automated tests**: None — `bun run build` is the only automated check
- **Framework**: None
- **Build verification**: `bun run build` after EVERY task (MANDATORY — G7)

### Agent-Executed QA Scenarios (MANDATORY — ALL tasks)

> ALL verification is Playwright-based (browser navigation) + build check.
> The executing agent starts dev server, navigates, and verifies visually.

**Verification Tool by Deliverable Type:**

| Type | Tool | How Agent Verifies |
|------|------|-------------------|
| **Sidebar changes** | Playwright | Navigate to /, verify sidebar structure, count groups, test collapse/expand |
| **Breadcrumbs** | Playwright | Navigate to deep pages, verify breadcrumb trail, click breadcrumb links |
| **Command palette** | Playwright | Press Cmd+K, type nav item name, verify results, press Enter to navigate |
| **Active state** | Playwright | Navigate to sub-pages, verify parent item is highlighted |
| **Tab consolidation** | Playwright | Navigate to client detail, count visible tabs, test tab switching |
| **Build check** | Bash | `bun run build` → exit code 0 |

---

## Execution Strategy

### Parallel Execution Waves

```
PHASE 1 — Foundation (Week 1-2)
Wave 1.1 (Start Immediately):
├── Task 1: Create nav config (lib/nav-config.ts)
└── Task 3: Fix active state (nav-main.tsx)

Wave 1.2 (After Task 1):
├── Task 2: Restructure sidebar groups (app-sidebar.tsx)
└── Task 4: Add orphaned pages to nav config

Wave 1.3 (After Wave 1.2):
└── Task 5: Decompose SiteHeader (696 lines → 5 sub-components)

PHASE 2 — Navigation Enhancements (Week 3-4)
Wave 2.1 (After Task 5):
├── Task 6: Auto-generated breadcrumbs
├── Task 7: Filter badge indicators (Clients, Facturation)
└── Task 8: Merge Agenda/Calendrier labels

Wave 2.2 (After Task 6):
└── Task 11: Command palette (Cmd+K)

PHASE 3 — Cognitive Load Reduction (Week 5-6)
Wave 3.1 (Start Immediately — independent):
├── Task 9: Client Detail tabs 7→5
├── Task 10: Marque Blanche split 3 pages
├── Task 12: Task Config layout → tabs
└── Task 13: Portal back buttons

Wave 3.2 (After Wave 3.1):
├── Task 14: Commissions progressive disclosure
├── Task 15: Empty states on list pages
└── Task 16: Permissions matrix fix

PHASE 4 — Role-Based Nav + Polish (Week 7-8)
Wave 4.1 (After Phase 3):
├── Task 17: Build useNavPermissions() hook
└── Task 18: WebSocket org-switch fix

Wave 4.2 (After Task 17):
├── Task 19: Apply nav filtering to sidebar
└── Task 20: Zustand stores org-switch reset

Wave 4.3 (After Wave 4.2):
└── Task 21: Final integration QA + cleanup

Critical Path: Task 1 → Task 2 → Task 5 → Task 6 → Task 11
```

### Dependency Matrix

| Task | Depends On | Blocks | Can Parallelize With |
|------|------------|--------|---------------------|
| 1 | None | 2, 4, 11 | 3 |
| 2 | 1 | 5, 19 | 4 |
| 3 | None | — | 1 |
| 4 | 1 | — | 2 |
| 5 | 2 | 6, 8 | — |
| 6 | 5 | 11 | 7, 8 |
| 7 | None (Phase 2) | — | 6, 8 |
| 8 | 5 | — | 6, 7 |
| 9 | None (Phase 3) | — | 10, 12, 13 |
| 10 | None (Phase 3) | — | 9, 12, 13 |
| 11 | 6 | — | — |
| 12 | None (Phase 3) | — | 9, 10, 13 |
| 13 | None (Phase 3) | — | 9, 10, 12 |
| 14 | Phase 3 Wave 1 | — | 15, 16 |
| 15 | Phase 3 Wave 1 | — | 14, 16 |
| 16 | Phase 3 Wave 1 | — | 14, 15 |
| 17 | Phase 3 | 19 | 18 |
| 18 | Phase 3 | — | 17 |
| 19 | 17 | 21 | 20 |
| 20 | Phase 3 | 21 | 19 |
| 21 | 19, 20 | — | — |

### Agent Dispatch Summary

| Wave | Tasks | Recommended Agents |
|------|-------|-------------------|
| 1.1 | 1, 3 | `category="quick"` for each |
| 1.2 | 2, 4 | `category="visual-engineering", load_skills=["frontend-ui-ux"]` |
| 1.3 | 5 | `category="unspecified-high"` (decomposition) |
| 2.1 | 6, 7, 8 | `category="visual-engineering"` parallel |
| 2.2 | 11 | `category="visual-engineering", load_skills=["frontend-ui-ux"]` |
| 3.1 | 9, 10, 12, 13 | `category="quick"` parallel (4 independent tasks) |
| 3.2 | 14, 15, 16 | `category="visual-engineering"` parallel |
| 4.1 | 17, 18 | `category="unspecified-high"` |
| 4.2 | 19, 20 | `category="quick"` parallel |
| 4.3 | 21 | `category="deep", load_skills=["playwright"]` |

---

## TODOs

### PHASE 1 — Foundation (Week 1-2)

- [x] 1. Créer la configuration centralisée de navigation

  **What to do**:
  - Créer `frontend/src/lib/nav-config.ts` avec la structure de navigation groupée
  - Définir l'interface `NavGroup` avec : `id`, `label`, `icon`, `defaultOpen`, `items[]`
  - Chaque item : `title`, `url`, `icon`, `parentUrl?`, `requiredRole?`
  - Définir 5 groupes :
    - **CRM** (Clients, Commerciaux, Tâches, Messagerie, Calendrier) — `defaultOpen: true`
    - **Finance & Ventes** (Commissions [→Validation, Reporting], Facturation, Abonnements [→Plans], Statistiques)
    - **Catalogue & Opérations** (Catalogue [→Formules], Expéditions [→Lots], DepanSur [→Dossiers, Reporting])
    - **Paiements** (Routage, Archives, Alertes, Exports)
    - **Administration** (Paramètres, Permissions, Rôles & Permissions, Marque Blanche, Intégrations, Onboarding)
  - Dashboard reste hors groupe (item top-level)
  - Inclure les 5 pages orphelines dans les groupes appropriés
  - Exporter un `NAV_ROUTE_LABELS: Record<string, string>` pour les breadcrumbs (mapping route segment → label français)

  **Must NOT do**:
  - Ne PAS modifier de composant UI Shadcn
  - Ne PAS changer les URLs
  - Ne PAS ajouter de logique de filtrage par rôle (Phase 4)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Création d'un fichier de config pur TypeScript, pas de composant UI
  - **Skills**: []
    - Pas de skill spécifique nécessaire

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1.1 (with Task 3)
  - **Blocks**: Tasks 2, 4, 11
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `frontend/src/components/app-sidebar.tsx:50-187` — Les 3 arrays actuels (NAV_ITEMS, NAV_PAIEMENTS_ITEMS, NAV_SECONDARY_ITEMS) à remplacer par la config centralisée

  **API/Type References**:
  - `frontend/src/components/nav-main.tsx:7-12` — Interface actuelle des items de navigation (titre, url, icon)

  **External References**:
  - Pattern Shadcn Sidebar : composant `SidebarGroup` + `SidebarGroupLabel` + `Collapsible` dans `components/ui/sidebar.tsx`

  **WHY Each Reference Matters**:
  - `app-sidebar.tsx:50-187` : Contient TOUTES les URLs et icônes actuelles — la config doit reproduire exactement ces items
  - `nav-main.tsx:7-12` : L'interface TypeScript actuelle qu'il faut étendre (ajouter `parentUrl`, `requiredRole`, `children`)

  **Acceptance Criteria**:
  - [ ] Fichier `frontend/src/lib/nav-config.ts` créé
  - [ ] 5 groupes définis avec ≤6 items par groupe
  - [ ] Les 31 routes (26 sidebar + 5 orphelines) sont toutes présentes dans la config
  - [ ] `NAV_ROUTE_LABELS` exporte un mapping complet des segments
  - [ ] `bun run build` → exit code 0

  **Agent-Executed QA Scenarios**:

  ```
  Scenario: Build passes with new nav config
    Tool: Bash
    Preconditions: None
    Steps:
      1. Run: bun run build
      2. Assert: exit code 0
      3. Assert: no TypeScript errors related to nav-config
    Expected Result: Build succeeds
    Evidence: Build output captured
  ```

  **Commit**: YES
  - Message: `feat(nav): add centralized navigation config with 5 groups`
  - Files: `frontend/src/lib/nav-config.ts`
  - Pre-commit: `bun run build`

---

- [x] 2. Restructurer la sidebar en groupes collapsibles

  **What to do**:
  - Modifier `frontend/src/components/app-sidebar.tsx` :
    - Remplacer les 3 arrays (NAV_ITEMS, NAV_PAIEMENTS_ITEMS, NAV_SECONDARY_ITEMS) par import de `nav-config.ts`
    - Remplacer les 3 appels `<NavMain items={...} />` par un mapping sur les groupes
    - Chaque groupe rendu dans un `SidebarGroup` avec `Collapsible` (déjà disponible dans Shadcn)
    - Dashboard reste un item standalone au-dessus des groupes
    - Groupe "CRM" ouvert par défaut, les autres fermés
  - Créer ou modifier `frontend/src/components/nav-group.tsx` :
    - Composant qui rend un groupe avec `SidebarGroupLabel` + `Collapsible` + items
    - Supporte les sub-items (Commissions → Validation, Reporting)
    - Utilise les composants Shadcn existants (`SidebarGroup`, `SidebarGroupLabel`, `SidebarGroupContent`, `SidebarMenu`, `SidebarMenuItem`, `SidebarMenuButton`, `SidebarMenuSub`, `SidebarMenuSubItem`, `SidebarMenuSubButton`)

  **Must NOT do**:
  - Ne PAS modifier `components/ui/sidebar.tsx` (Shadcn primitive)
  - Ne PAS changer les URLs
  - Ne PAS ajouter d'animations custom (utiliser Collapsible built-in)
  - Ne PAS ajouter de logique de filtrage par rôle
  - Ne PAS modifier le TeamSwitcher ou NavUser

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: Restructuration visuelle de composant React avec composition Shadcn
  - **Skills**: [`frontend-ui-ux`]
    - `frontend-ui-ux`: Nécessaire pour la composition correcte des composants Shadcn sidebar

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1.2 (with Task 4)
  - **Blocks**: Tasks 5, 19
  - **Blocked By**: Task 1

  **References**:

  **Pattern References**:
  - `frontend/src/components/app-sidebar.tsx:409-443` — Structure JSX actuelle du sidebar (SidebarHeader → SidebarContent → SidebarFooter)
  - `frontend/src/components/app-sidebar.tsx:421-424` — Les 3 `<NavMain>` calls actuels à remplacer
  - `frontend/src/components/nav-main.tsx` — Composant actuel de rendu flat des items (sera remplacé/adapté)

  **API/Type References**:
  - `frontend/src/components/ui/sidebar.tsx` — Composants Shadcn disponibles : `SidebarGroup`, `SidebarGroupLabel`, `SidebarGroupContent`, `SidebarMenu`, `SidebarMenuItem`, `SidebarMenuButton`, `SidebarMenuSub`, `SidebarMenuSubItem`, `SidebarMenuSubButton`, `Collapsible`
  - `frontend/src/lib/nav-config.ts` — Config créée dans Task 1 (import)

  **WHY Each Reference Matters**:
  - `app-sidebar.tsx:421-424` : Point exact de modification — les 3 NavMain à remplacer par le nouveau composant groupé
  - `ui/sidebar.tsx` : Composants Shadcn à composer (NE PAS modifier, seulement utiliser)

  **Acceptance Criteria**:
  - [ ] Sidebar affiche 5 groupes collapsibles + Dashboard standalone
  - [ ] Chaque groupe a un label et une icône
  - [ ] Groupe "CRM" ouvert par défaut, les autres fermés
  - [ ] Sub-items (Commissions → Validation, Reporting) visibles quand parent expandé
  - [ ] 31 routes accessibles depuis la sidebar (26 existantes + 5 orphelines)
  - [ ] `bun run build` → exit code 0

  **Agent-Executed QA Scenarios**:

  ```
  Scenario: Sidebar displays 5 groups with correct items
    Tool: Playwright (playwright skill)
    Preconditions: Dev server running on localhost:3000, user authenticated
    Steps:
      1. Navigate to: http://localhost:3000/
      2. Wait for: [data-slot="sidebar"] visible (timeout: 10s)
      3. Assert: Exactly 5 SidebarGroup elements visible (excluding Dashboard standalone)
      4. Assert: "CRM" group is expanded by default
      5. Assert: "Finance & Ventes", "Catalogue & Opérations", "Paiements", "Administration" are collapsed
      6. Click: "Finance & Ventes" group label
      7. Wait for: group content visible (timeout: 2s)
      8. Assert: Contains items "Commissions", "Facturation", "Abonnements", "Statistiques"
      9. Screenshot: .sisyphus/evidence/task-2-sidebar-groups.png
    Expected Result: 5 collapsible groups with correct items
    Evidence: .sisyphus/evidence/task-2-sidebar-groups.png

  Scenario: Sub-items expand correctly
    Tool: Playwright (playwright skill)
    Preconditions: Dev server running, sidebar visible
    Steps:
      1. Click: "Finance & Ventes" group label (expand)
      2. Assert: "Commissions" item visible
      3. Hover/Click: "Commissions" → sub-items appear
      4. Assert: "Validation ADV" sub-item visible
      5. Assert: "Reporting" sub-item visible
      6. Click: "Validation ADV"
      7. Wait for: URL = /commissions/validation
      8. Screenshot: .sisyphus/evidence/task-2-sub-items.png
    Expected Result: Sub-items navigate correctly
    Evidence: .sisyphus/evidence/task-2-sub-items.png
  ```

  **Commit**: YES
  - Message: `refactor(nav): restructure sidebar into 5 collapsible groups`
  - Files: `frontend/src/components/app-sidebar.tsx`, `frontend/src/components/nav-group.tsx`
  - Pre-commit: `bun run build`

---

- [x] 3. Corriger l'active state (parent highlighting)

  **What to do**:
  - Modifier `frontend/src/components/nav-main.tsx` ligne 38 :
    - Remplacer `const isActive = pathname === item.url` par `const isActive = pathname === item.url || (item.url !== '/' && pathname.startsWith(item.url + '/'))`
    - Le check `item.url !== '/'` évite que Dashboard soit toujours actif
  - Si `nav-group.tsx` est créé dans Task 2, appliquer la même logique d'active state

  **Must NOT do**:
  - Ne PAS modifier `components/ui/sidebar.tsx`
  - Ne PAS changer les styles d'active state (juste la logique de détection)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Modification d'une seule ligne de logique
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1.1 (with Task 1)
  - **Blocks**: None
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `frontend/src/components/nav-main.tsx:38` — Ligne exacte du bug : `const isActive = pathname === item.url`

  **WHY Each Reference Matters**:
  - `nav-main.tsx:38` : Le bug est à cette ligne exacte. Le fix est un one-liner.

  **Acceptance Criteria**:
  - [ ] Naviguer vers `/abonnements/plans` active l'item "Abonnements" dans la sidebar
  - [ ] Naviguer vers `/commissions/validation` active l'item "Commissions"
  - [ ] Dashboard (`/`) n'est PAS actif quand on est sur une autre page
  - [ ] `bun run build` → exit code 0

  **Agent-Executed QA Scenarios**:

  ```
  Scenario: Sub-page highlights parent nav item
    Tool: Playwright (playwright skill)
    Preconditions: Dev server running, user authenticated
    Steps:
      1. Navigate to: http://localhost:3000/abonnements/plans
      2. Wait for: sidebar visible (timeout: 10s)
      3. Assert: Nav item containing "Abonnements" has data-active="true"
      4. Navigate to: http://localhost:3000/commissions/validation
      5. Assert: Nav item containing "Commissions" has data-active="true"
      6. Navigate to: http://localhost:3000/clients
      7. Assert: Dashboard item does NOT have data-active="true"
      8. Screenshot: .sisyphus/evidence/task-3-active-state.png
    Expected Result: Parent items correctly highlighted
    Evidence: .sisyphus/evidence/task-3-active-state.png
  ```

  **Commit**: YES
  - Message: `fix(nav): use startsWith for parent active state detection`
  - Files: `frontend/src/components/nav-main.tsx`
  - Pre-commit: `bun run build`

---

- [x] 4. Intégrer les 5 pages orphelines dans la navigation

  **What to do**:
  - Vérifier que les 5 pages orphelines sont bien dans `nav-config.ts` (Task 1) :
    - `/depanssur/dossiers` → groupe "Catalogue & Opérations" sous "DepanSur"
    - `/depanssur/reporting` → groupe "Catalogue & Opérations" sous "DepanSur"
    - `/integrations/woocommerce` → groupe "Administration" sous "Intégrations"
    - `/expeditions/lots` → groupe "Catalogue & Opérations" sous "Expéditions"
    - `/taches/configuration` → groupe "CRM" sous "Tâches"
  - Mettre à jour le pathname→title map dans `SiteHeader` pour inclure ces 5 routes

  **Must NOT do**:
  - Ne PAS créer de nouvelles pages
  - Ne PAS modifier le contenu des pages existantes

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Ajout d'entrées dans une config existante + 5 lignes dans SiteHeader
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1.2 (with Task 2)
  - **Blocks**: None
  - **Blocked By**: Task 1

  **References**:

  **Pattern References**:
  - `frontend/src/lib/nav-config.ts` — Config créée dans Task 1
  - `frontend/src/components/site-header.tsx:354-370` — Pathname→title map hardcodé à étendre

  **WHY Each Reference Matters**:
  - `site-header.tsx:354-370` : Ce map DOIT inclure les nouvelles routes sinon le header affichera un titre vide

  **Acceptance Criteria**:
  - [ ] Les 5 pages orphelines sont accessibles depuis la sidebar
  - [ ] Naviguer vers `/depanssur/dossiers` affiche un titre dans le header
  - [ ] `bun run build` → exit code 0

  **Agent-Executed QA Scenarios**:

  ```
  Scenario: Orphaned pages accessible from sidebar
    Tool: Playwright (playwright skill)
    Preconditions: Dev server running, user authenticated
    Steps:
      1. Navigate to: http://localhost:3000/
      2. Expand "Catalogue & Opérations" group
      3. Assert: "DepanSur" item visible
      4. Click: "DepanSur" → sub-items
      5. Click: "Dossiers" sub-item
      6. Wait for: URL = /depanssur/dossiers
      7. Assert: Header title is not empty
      8. Screenshot: .sisyphus/evidence/task-4-orphaned.png
    Expected Result: All 5 orphaned pages navigable
    Evidence: .sisyphus/evidence/task-4-orphaned.png
  ```

  **Commit**: YES (groups with Task 2)
  - Message: `feat(nav): add 5 orphaned pages to navigation config`
  - Files: `frontend/src/lib/nav-config.ts`, `frontend/src/components/site-header.tsx`
  - Pre-commit: `bun run build`

---

- [x] 5. Décomposer SiteHeader (696 lignes → 5 sous-composants)

  **What to do**:
  - Créer `frontend/src/components/header/` directory
  - Extraire de `site-header.tsx` (pure extraction, ZERO changement de comportement) :
    - `header-breadcrumb.tsx` — logique pathname→title (sera étendu dans Task 6)
    - `header-societe-selector.tsx` — sélecteur de société avec Zustand store
    - `header-tasks-dropdown.tsx` — dropdown des tâches du jour
    - `header-notifications-dropdown.tsx` — dropdown notifications temps réel
    - `header-quick-actions.tsx` — menu d'actions rapides + dialogs
  - `site-header.tsx` ne fait plus que composer ces 5 sous-composants
  - Objectif : `site-header.tsx` réduit à ≤100 lignes

  **Must NOT do**:
  - NE PAS changer le comportement — pure extraction
  - NE PAS ajouter de nouvelles fonctionnalités au header
  - NE PAS modifier les styles
  - NE PAS changer l'ordre d'affichage des éléments

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Refactoring d'extraction de 696 lignes en 5 composants — nécessite attention aux dépendances
  - **Skills**: [`frontend-ui-ux`]
    - `frontend-ui-ux`: Compréhension des patterns de composition React

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Sequential — Wave 1.3
  - **Blocks**: Tasks 6, 8
  - **Blocked By**: Task 2

  **References**:

  **Pattern References**:
  - `frontend/src/components/site-header.tsx` — Fichier complet de 696 lignes à décomposer
  - `frontend/src/components/site-header.tsx:354-370` — Pathname→title map (vers header-breadcrumb)
  - `frontend/src/components/site-header.tsx:1-50` — Imports et hooks à distribuer

  **Documentation References**:
  - Pattern "Extract Component" — déplacer les sections JSX + leurs hooks/state dans des fichiers séparés

  **WHY Each Reference Matters**:
  - Le fichier entier de 696 lignes est le sujet de cette tâche — il faut le lire, identifier les boundaries, extraire

  **Acceptance Criteria**:
  - [ ] 5 fichiers créés dans `components/header/`
  - [ ] `site-header.tsx` ≤ 100 lignes
  - [ ] Comportement visuellement identique avant/après
  - [ ] `bun run build` → exit code 0

  **Agent-Executed QA Scenarios**:

  ```
  Scenario: Header looks and works identically after decomposition
    Tool: Playwright (playwright skill)
    Preconditions: Dev server running, user authenticated
    Steps:
      1. Navigate to: http://localhost:3000/
      2. Assert: Header visible with title "Tableau de Bord"
      3. Assert: Société selector visible
      4. Assert: Notification bell visible
      5. Assert: Quick actions button visible
      6. Click: Notification bell → dropdown opens
      7. Close dropdown
      8. Navigate to: /clients
      9. Assert: Title changes to "Gestion Clients"
      10. Screenshot: .sisyphus/evidence/task-5-header.png
    Expected Result: Header unchanged visually and functionally
    Evidence: .sisyphus/evidence/task-5-header.png
  ```

  **Commit**: YES
  - Message: `refactor(header): decompose SiteHeader into 5 sub-components`
  - Files: `frontend/src/components/header/*.tsx`, `frontend/src/components/site-header.tsx`
  - Pre-commit: `bun run build`

---

### PHASE 2 — Navigation Enhancements (Week 3-4)

- [x] 6. Ajouter des breadcrumbs auto-générés

  **What to do**:
  - Créer `frontend/src/components/breadcrumb-nav.tsx` :
    - Parser `usePathname()` en segments
    - Mapper chaque segment via `NAV_ROUTE_LABELS` (de `nav-config.ts`)
    - Pour les segments dynamiques (`[id]`), afficher l'ID ou accepter un prop `entityName`
    - Utiliser les composants Shadcn existants : `Breadcrumb`, `BreadcrumbList`, `BreadcrumbItem`, `BreadcrumbLink`, `BreadcrumbPage`, `BreadcrumbSeparator`
  - Intégrer dans `header-breadcrumb.tsx` (Task 5) :
    - Remplacer le pathname→title map hardcodé par le composant breadcrumb
    - Le titre de page = dernier segment du breadcrumb
  - Dashboard (`/`) : pas de breadcrumb (page racine)

  **Must NOT do**:
  - Ne PAS modifier `components/ui/breadcrumb.tsx` (Shadcn primitive)
  - Ne PAS construire un fichier de config breadcrumb séparé — dériver des routes
  - Ne PAS faire d'appels API pour résoudre les noms d'entités (utiliser prop ou ID)

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: Composant UI avec logique de parsing de pathname
  - **Skills**: [`frontend-ui-ux`]
    - `frontend-ui-ux`: Composition de composants Shadcn breadcrumb

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2.1 (with Tasks 7, 8)
  - **Blocks**: Task 11
  - **Blocked By**: Task 5

  **References**:

  **Pattern References**:
  - `frontend/src/components/ui/breadcrumb.tsx` — Composant Shadcn installé mais jamais utilisé. Contient : `Breadcrumb`, `BreadcrumbList`, `BreadcrumbItem`, `BreadcrumbLink`, `BreadcrumbPage`, `BreadcrumbSeparator`
  - `frontend/src/components/header/header-breadcrumb.tsx` — Créé dans Task 5, contient l'ancien pathname→title map à remplacer

  **API/Type References**:
  - `frontend/src/lib/nav-config.ts:NAV_ROUTE_LABELS` — Mapping segment → label français créé dans Task 1

  **WHY Each Reference Matters**:
  - `ui/breadcrumb.tsx` : Le composant existe déjà — pas besoin de l'installer ou le créer
  - `NAV_ROUTE_LABELS` : Source de vérité pour traduire les segments d'URL en labels lisibles

  **Acceptance Criteria**:
  - [ ] Breadcrumbs visibles sur toutes les pages de profondeur ≥1
  - [ ] `/clients` affiche : `Dashboard > Clients`
  - [ ] `/clients/abc123` affiche : `Dashboard > Clients > abc123`
  - [ ] `/commissions/validation` affiche : `Dashboard > Commissions > Validation ADV`
  - [ ] Chaque segment cliquable navigue vers la bonne URL
  - [ ] Dashboard (`/`) n'affiche PAS de breadcrumb
  - [ ] `bun run build` → exit code 0

  **Agent-Executed QA Scenarios**:

  ```
  Scenario: Breadcrumbs display correctly on deep pages
    Tool: Playwright (playwright skill)
    Preconditions: Dev server running, user authenticated
    Steps:
      1. Navigate to: http://localhost:3000/commissions/validation
      2. Wait for: breadcrumb element visible (timeout: 5s)
      3. Assert: Breadcrumb shows "Dashboard > Commissions > Validation ADV"
      4. Click: "Commissions" breadcrumb link
      5. Wait for: URL = /commissions
      6. Assert: Breadcrumb shows "Dashboard > Commissions"
      7. Click: "Dashboard" breadcrumb link
      8. Wait for: URL = /
      9. Assert: No breadcrumb visible on Dashboard
      10. Screenshot: .sisyphus/evidence/task-6-breadcrumbs.png
    Expected Result: Breadcrumbs navigable on all pages
    Evidence: .sisyphus/evidence/task-6-breadcrumbs.png
  ```

  **Commit**: YES
  - Message: `feat(nav): add auto-generated breadcrumbs from pathname`
  - Files: `frontend/src/components/breadcrumb-nav.tsx`, `frontend/src/components/header/header-breadcrumb.tsx`
  - Pre-commit: `bun run build`

---

- [x] 7. Ajouter des badges de filtres actifs (Clients, Facturation)

  **What to do**:
  - Sur les pages Clients (`/clients`) et Facturation (`/facturation`) :
    - Ajouter un badge compteur sur le bouton "Filtres avancés" montrant le nombre de filtres actifs
    - Si des filtres sont actifs, ouvrir le panneau par défaut
    - Ajouter un bouton "Réinitialiser les filtres" visible quand des filtres sont actifs

  **Must NOT do**:
  - Ne PAS modifier les filtres eux-mêmes
  - Ne PAS changer la logique de filtrage backend

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: [`frontend-ui-ux`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2.1 (with Tasks 6, 8)
  - **Blocks**: None
  - **Blocked By**: None (Phase 2 start)

  **References**:

  **Pattern References**:
  - `frontend/src/app/(main)/clients/page.tsx` — Page clients avec filtres collapsibles
  - `frontend/src/app/(main)/facturation/page.tsx` — Page facturation avec filtres collapsibles
  - `frontend/src/components/ui/badge.tsx` — Composant Badge Shadcn

  **Acceptance Criteria**:
  - [ ] Badge affiche "3" quand 3 filtres sont actifs
  - [ ] Panneau de filtres auto-expand quand filtres actifs
  - [ ] Bouton reset visible quand filtres actifs
  - [ ] `bun run build` → exit code 0

  **Commit**: YES
  - Message: `feat(ux): add active filter count badges on Clients and Facturation`
  - Files: Client files modifiés
  - Pre-commit: `bun run build`

---

- [x] 8. Différencier Agenda/Calendrier dans la navigation

  **What to do**:
  - Dans `nav-config.ts`, différencier visuellement :
    - "Calendrier" → icône `CalendarDays` (gestion des jours fériés/zones)
    - "Agenda" → icône `CalendarClock` (planification/événements)
  - Ajouter des micro-descriptions dans les tooltips sidebar pour clarifier la différence

  **Must NOT do**:
  - Ne PAS fusionner les pages (ce sont des features différentes)
  - Ne PAS modifier le contenu des pages

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2.1 (with Tasks 6, 7)
  - **Blocks**: None
  - **Blocked By**: Task 5

  **References**:
  - `frontend/src/lib/nav-config.ts` — Config nav à modifier (icônes)
  - Lucide icons : `CalendarDays`, `CalendarClock` — différentes de `Calendar` utilisé actuellement pour les deux

  **Acceptance Criteria**:
  - [ ] Agenda et Calendrier ont des icônes distinctes dans la sidebar
  - [ ] Hover sur chaque item montre un tooltip explicatif
  - [ ] `bun run build` → exit code 0

  **Commit**: YES (groups with Task 7)
  - Message: `fix(nav): differentiate Agenda and Calendrier icons and tooltips`
  - Files: `frontend/src/lib/nav-config.ts`
  - Pre-commit: `bun run build`

---

- [x] 11. Ajouter le Command Palette (Cmd+K)

  **What to do**:
  - Créer `frontend/src/components/command-menu.tsx` :
    - Utiliser le composant `Command` Shadcn existant (wraps `cmdk`)
    - Écouter `Cmd+K` / `Ctrl+K` globalement
    - Afficher dans un `Dialog` au centre de l'écran
    - Lister tous les items de `nav-config.ts` groupés par section
    - Recherche fuzzy sur les titres de navigation
    - Sélection d'un item → `router.push(item.url)` + fermer le dialog
    - Afficher les raccourcis clavier si disponibles
  - Intégrer dans `(main)/layout.tsx` (composant global, toujours disponible)
  - Optionnel : ajouter un indicateur "⌘K" dans le footer de la sidebar

  **Must NOT do**:
  - Ne PAS ajouter de recherche d'entités (clients, contrats) — navigation UNIQUEMENT
  - Ne PAS ajouter d'actions (créer client, etc.)
  - Ne PAS modifier `components/ui/command.tsx` (Shadcn primitive)
  - Ne PAS ajouter de fonctionnalités IA

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: Composant UI interactif avec gestion de raccourcis clavier
  - **Skills**: [`frontend-ui-ux`]
    - `frontend-ui-ux`: Composition cmdk + Dialog + pattern command palette

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Sequential — Wave 2.2
  - **Blocks**: None
  - **Blocked By**: Task 6

  **References**:

  **Pattern References**:
  - `frontend/src/components/ui/command.tsx` — Composant cmdk Shadcn installé, jamais utilisé dans l'app
  - `frontend/src/components/ui/dialog.tsx` — Dialog Shadcn pour wrapping
  - `frontend/src/lib/nav-config.ts` — Source des items de navigation à rechercher

  **WHY Each Reference Matters**:
  - `ui/command.tsx` : Le composant existe — l'utiliser tel quel, pas réinventer
  - `nav-config.ts` : Source unique de vérité pour les items navigables

  **Acceptance Criteria**:
  - [ ] Cmd+K ouvre le command palette depuis n'importe quelle page
  - [ ] Taper "Comm" affiche "Commissions" et ses sous-items
  - [ ] Sélectionner un item navigue vers la bonne URL
  - [ ] Escape ferme le palette
  - [ ] `bun run build` → exit code 0

  **Agent-Executed QA Scenarios**:

  ```
  Scenario: Command palette opens and navigates
    Tool: Playwright (playwright skill)
    Preconditions: Dev server running, user authenticated, on any page
    Steps:
      1. Navigate to: http://localhost:3000/
      2. Press: Ctrl+K (or Meta+K on Mac)
      3. Wait for: command palette dialog visible (timeout: 3s)
      4. Type: "Fact"
      5. Assert: "Facturation" item visible in results
      6. Click: "Facturation" result
      7. Wait for: URL = /facturation
      8. Assert: Command palette closed
      9. Screenshot: .sisyphus/evidence/task-11-command.png
    Expected Result: Command palette works for navigation search
    Evidence: .sisyphus/evidence/task-11-command.png

  Scenario: Command palette closes on Escape
    Tool: Playwright (playwright skill)
    Steps:
      1. Press: Ctrl+K
      2. Wait for: dialog visible
      3. Press: Escape
      4. Assert: dialog closed
    Expected Result: Escape closes palette
  ```

  **Commit**: YES
  - Message: `feat(nav): add command palette (Cmd+K) for navigation search`
  - Files: `frontend/src/components/command-menu.tsx`, `frontend/src/app/(main)/layout.tsx`
  - Pre-commit: `bun run build`

---

### PHASE 3 — Cognitive Load Reduction (Week 5-6)

- [x] 9. Consolider les tabs Client Detail (7→5)

  **What to do**:
  - Modifier le composant client detail :
    - Fusionner "Paiements" + "Expéditions" → "Paiements & Expéditions"
    - Fusionner "Activités" + "Tâches" → "Activités & Tâches"
    - Résultat : Overview, Paramètres, Paiements & Expéditions, Activités & Tâches, Documents
  - Le contenu des tabs fusionnés est empilé verticalement avec des sections séparées par des headers

  **Must NOT do**:
  - Ne PAS modifier le contenu des sections (juste le regroupement)
  - Ne PAS changer les composants de données (tables, cards)

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: [`frontend-ui-ux`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3.1 (with Tasks 10, 12, 13)
  - **Blocks**: None
  - **Blocked By**: None (Phase 3 start)

  **References**:
  - `frontend/src/app/(main)/clients/[id]/page.tsx` — Page client detail avec 7 tabs actuels
  - Le composant client côté client (chercher `client-detail-client.tsx` ou similaire)

  **Acceptance Criteria**:
  - [ ] Client detail affiche 5 tabs au lieu de 7
  - [ ] Contenu de "Paiements" et "Expéditions" visible dans l'onglet fusionné
  - [ ] `bun run build` → exit code 0

  **Commit**: YES
  - Message: `refactor(clients): consolidate client detail tabs from 7 to 5`
  - Files: Client detail components
  - Pre-commit: `bun run build`

---

- [x] 10. Éclater Marque Blanche en 3 sous-pages

  **What to do**:
  - Créer 3 sous-pages sous `/parametres/marque-blanche/` :
    - `frontend/src/app/(main)/parametres/marque-blanche/partenaires/page.tsx`
    - `frontend/src/app/(main)/parametres/marque-blanche/themes/page.tsx`
    - `frontend/src/app/(main)/parametres/marque-blanche/statuts/page.tsx`
  - La page parent `/parametres/marque-blanche/` devient un hub avec 3 cards cliquables
  - Chaque sous-page contient UNE SEULE table CRUD (celle correspondante)
  - Mettre à jour `nav-config.ts` pour inclure les 3 sous-pages

  **Must NOT do**:
  - Ne PAS modifier la logique CRUD existante
  - Ne PAS changer les dialogs de création/édition

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: [`frontend-ui-ux`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3.1 (with Tasks 9, 12, 13)
  - **Blocks**: None
  - **Blocked By**: None (Phase 3 start)

  **References**:
  - `frontend/src/app/(main)/parametres/marque-blanche/page.tsx` — Page actuelle avec 3 tables CRUD
  - `frontend/src/lib/nav-config.ts` — Config nav à mettre à jour

  **Acceptance Criteria**:
  - [ ] `/parametres/marque-blanche` affiche un hub avec 3 cards
  - [ ] Chaque sous-page affiche une seule table
  - [ ] Breadcrumbs fonctionnent sur les sous-pages
  - [ ] `bun run build` → exit code 0

  **Commit**: YES
  - Message: `refactor(settings): split Marque Blanche into 3 sub-pages`
  - Files: `frontend/src/app/(main)/parametres/marque-blanche/...`
  - Pre-commit: `bun run build`

---

- [x] 12. Convertir Config Tâches en layout tabs

  **What to do**:
  - Modifier la page configuration des tâches (`/taches/configuration`) :
    - Remplacer le layout 3 panneaux (table + sidebar historique + dialog) par 2 tabs
    - Tab 1 : "Règles" — contient la table des règles d'automatisation
    - Tab 2 : "Historique" — contient le log d'exécution

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: [`frontend-ui-ux`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3.1 (with Tasks 9, 10, 13)

  **References**:
  - `frontend/src/app/(main)/taches/configuration/page.tsx` — Page actuelle

  **Acceptance Criteria**:
  - [ ] 2 tabs visibles : "Règles" et "Historique"
  - [ ] `bun run build` → exit code 0

  **Commit**: YES
  - Message: `refactor(tasks): convert task config from 3-panel to tabs layout`
  - Pre-commit: `bun run build`

---

- [x] 13. Ajouter des back buttons sur les pages Portal

  **What to do**:
  - Sur les pages Portal : Wincash, Justi+, Services, Dashboard :
    - Ajouter un lien "← Retour" en haut de page pointant vers `/portal/[token]`
    - Le token est récupéré depuis `useParams()`

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3.1 (with Tasks 9, 10, 12)

  **References**:
  - `frontend/src/app/portal/[token]/wincash/page.tsx`
  - `frontend/src/app/portal/[token]/justi-plus/page.tsx`
  - `frontend/src/app/portal/[token]/services/page.tsx`
  - `frontend/src/app/portal/[token]/dashboard/page.tsx`

  **Acceptance Criteria**:
  - [ ] Back button visible sur les 4 sous-pages portal
  - [ ] Click navigue vers `/portal/[token]`
  - [ ] `bun run build` → exit code 0

  **Commit**: YES
  - Message: `fix(portal): add back navigation buttons on sub-pages`
  - Pre-commit: `bun run build`

---

- [ ] 14. Commissions : progressive disclosure

  **What to do**:
  - Sur la page Commissions (`/commissions`) :
    - Collapser les stat cards par défaut (ajouter un toggle "Voir les statistiques")
    - Regrouper les action buttons dans un dropdown menu "Actions" au lieu de les disperser
    - Ajouter des sections séparées visuellement avec des headers

  **Must NOT do**:
  - Ne PAS changer les tabs (3 tabs est correct — Metis correction)
  - Ne PAS restructurer les données dans les tabs
  - Ne PAS modifier la logique métier

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: [`frontend-ui-ux`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3.2 (with Tasks 15, 16)
  - **Blocked By**: Wave 3.1

  **References**:
  - `frontend/src/app/(main)/commissions/page.tsx` — Page commissions
  - Composant client-side des commissions (chercher `commissions-page-client.tsx`)

  **Acceptance Criteria**:
  - [ ] Stat cards collapsées par défaut
  - [ ] Boutons d'action regroupés dans un dropdown
  - [ ] `bun run build` → exit code 0

  **Commit**: YES
  - Message: `refactor(commissions): apply progressive disclosure and group actions`
  - Pre-commit: `bun run build`

---

- [ ] 15. Ajouter des empty states sur les pages liste

  **What to do**:
  - Sur les pages Commerciaux, Expéditions, Abonnements :
    - Utiliser le composant `Empty` existant (`components/ui/empty.tsx`)
    - Afficher un message + CTA quand la liste est vide
    - Ex: "Aucun commercial trouvé" + bouton "Ajouter un commercial"

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: [`frontend-ui-ux`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3.2 (with Tasks 14, 16)

  **References**:
  - `frontend/src/components/ui/empty.tsx` — Composant Empty Shadcn existant

  **Acceptance Criteria**:
  - [ ] Empty state visible quand une liste est vide
  - [ ] CTA fonctionnel
  - [ ] `bun run build` → exit code 0

  **Commit**: YES
  - Message: `feat(ux): add empty states to Commerciaux, Expeditions, Abonnements`
  - Pre-commit: `bun run build`

---

- [ ] 16. Corriger la matrice de permissions (scroll horizontal)

  **What to do**:
  - Sur `/parametres/roles-permissions` :
    - Grouper les permissions par domaine (ex: "Clients", "Facturation", "Administration")
    - Chaque groupe dans un accordéon (`Accordion` Shadcn)
    - Dans chaque groupe, afficher les permissions en layout vertical (checkbox + label par ligne)
    - Supprimer le layout matrice horizontale

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: [`frontend-ui-ux`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3.2 (with Tasks 14, 15)

  **References**:
  - `frontend/src/app/(main)/parametres/roles-permissions/page.tsx`
  - `frontend/src/components/ui/accordion.tsx` — Composant Accordion Shadcn

  **Acceptance Criteria**:
  - [ ] Pas de scroll horizontal sur la page permissions
  - [ ] Permissions groupées par domaine dans des accordéons
  - [ ] `bun run build` → exit code 0

  **Commit**: YES
  - Message: `refactor(settings): fix permissions matrix horizontal scroll with accordion groups`
  - Pre-commit: `bun run build`

---

### PHASE 4 — Role-Based Nav + Polish (Week 7-8)

- [ ] 17. Créer le hook `useNavPermissions()`

  **What to do**:
  - Créer `frontend/src/hooks/use-nav-permissions.ts` :
    - Consomme `useOrganisation()` pour obtenir `isOwner`
    - Définit un mapping statique : quels items de nav sont `ownerOnly`
    - Items admin (Rôles & Permissions, Marque Blanche, Onboarding) = `ownerOnly: true`
    - Tous les autres items = visible pour tous
    - Exporte une fonction `filterNavItems(items)` qui filtre selon le rôle
  - Ce hook lit une config STATIQUE — pas d'appel API, pas de permission dynamique

  **Must NOT do**:
  - Ne PAS construire un système RBAC complet
  - Ne PAS ajouter d'appels API pour vérifier les permissions
  - Ne PAS modifier le contexte organisation

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4.1 (with Task 18)
  - **Blocks**: Task 19

  **References**:
  - `frontend/src/contexts/organisation-context.tsx:114` — `isOwner` boolean existant
  - `frontend/src/lib/nav-config.ts` — Config nav avec champ `requiredRole?` (Task 1)

  **Acceptance Criteria**:
  - [ ] Hook créé et exporté
  - [ ] `filterNavItems()` filtre correctement les items ownerOnly
  - [ ] `bun run build` → exit code 0

  **Commit**: YES
  - Message: `feat(auth): add useNavPermissions hook for role-based nav filtering`
  - Pre-commit: `bun run build`

---

- [ ] 18. Corriger le WebSocket au changement d'organisation

  **What to do**:
  - Dans `frontend/src/contexts/notification-context.tsx` :
    - S'assurer que l'ancien socket est `disconnect()` AVANT de créer le nouveau
    - Ajouter un délai (100ms) entre disconnect et reconnect pour éviter le race condition
    - Réinitialiser le state des notifications au changement d'org

  **Must NOT do**:
  - Ne PAS ajouter d'indicateur de connexion UI
  - Ne PAS changer la logique de retry
  - Ne PAS ajouter de mode offline

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4.1 (with Task 17)

  **References**:
  - `frontend/src/contexts/notification-context.tsx:128-134` — Socket.io initialization
  - `frontend/src/contexts/notification-context.tsx:213` — Effect dependency on activeOrganisation

  **Acceptance Criteria**:
  - [ ] Changer d'organisation déconnecte l'ancien socket et reconnecte le nouveau
  - [ ] Pas de race condition observable
  - [ ] `bun run build` → exit code 0

  **Commit**: YES
  - Message: `fix(notifications): reconnect WebSocket on organization switch`
  - Pre-commit: `bun run build`

---

- [ ] 19. Appliquer le filtrage nav par rôle dans la sidebar

  **What to do**:
  - Dans `app-sidebar.tsx` (ou `nav-group.tsx`) :
    - Utiliser `useNavPermissions().filterNavItems()` sur les items de chaque groupe
    - Les items `ownerOnly` sont masqués pour les membres non-owner
    - Les groupes vides (après filtrage) sont masqués

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4.2 (with Task 20)
  - **Blocked By**: Task 17

  **References**:
  - `frontend/src/hooks/use-nav-permissions.ts` — Hook créé dans Task 17
  - `frontend/src/components/app-sidebar.tsx` ou `nav-group.tsx`

  **Acceptance Criteria**:
  - [ ] Un member ne voit PAS "Rôles & Permissions" dans la sidebar
  - [ ] Un member ne voit PAS "Marque Blanche"
  - [ ] Un owner voit tous les items
  - [ ] Groupes vides masqués
  - [ ] `bun run build` → exit code 0

  **Commit**: YES
  - Message: `feat(auth): apply role-based navigation filtering in sidebar`
  - Pre-commit: `bun run build`

---

- [ ] 20. Réinitialiser les Zustand stores au changement d'org

  **What to do**:
  - Identifier les stores contenant des données org-specific :
    - `client-search-store.ts` — filtres clients
    - `societe-store.ts` — société sélectionnée
  - Ajouter un mécanisme de reset quand l'org active change :
    - Écouter le changement de `activeOrganisation` dans `OrganisationProvider`
    - Appeler les méthodes `reset()` des stores concernés
  - Ne PAS reset les stores UI-only (`ui-store.ts`, `app-store.ts`)

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4.2 (with Task 19)

  **References**:
  - `frontend/src/stores/client-search-store.ts`
  - `frontend/src/stores/societe-store.ts`
  - `frontend/src/contexts/organisation-context.tsx` — Provider où écouter le changement

  **Acceptance Criteria**:
  - [ ] Changer d'organisation réinitialise les filtres clients
  - [ ] Changer d'organisation réinitialise la société sélectionnée
  - [ ] `bun run build` → exit code 0

  **Commit**: YES
  - Message: `fix(stores): reset org-specific Zustand stores on organization switch`
  - Pre-commit: `bun run build`

---

- [ ] 21. QA d'intégration finale + cleanup

  **What to do**:
  - Exécuter un parcours complet de l'application via Playwright :
    - Naviguer dans chaque groupe sidebar (5 groupes × collapse/expand)
    - Vérifier les breadcrumbs sur 5+ pages de profondeur différente
    - Tester le command palette (Cmd+K) avec 3+ recherches
    - Vérifier l'active state sur 5+ sub-pages
    - Tester le changement d'organisation (sidebar, notifications, stores)
    - Vérifier les pages Portal (back buttons)
    - Vérifier les empty states
  - Supprimer les composants inutilisés :
    - `nav-secondary.tsx` (si plus utilisé)
    - `nav-documents.tsx` (si plus utilisé)
    - L'ancien `nav-main.tsx` (si remplacé par `nav-group.tsx`)
  - `bun run build` final

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: QA exhaustive nécessitant parcours complet de l'app
  - **Skills**: [`playwright`]
    - `playwright`: Automatisation du parcours de test

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Sequential — Wave 4.3 (final)
  - **Blocked By**: Tasks 19, 20

  **References**:
  - Toutes les tâches précédentes

  **Acceptance Criteria**:
  - [ ] 5 groupes sidebar fonctionnels et collapsibles
  - [ ] Breadcrumbs corrects sur toutes les pages testées
  - [ ] Command palette fonctionnel
  - [ ] Active state correct sur sub-pages
  - [ ] Changement d'org fonctionne (notifications, stores, sidebar)
  - [ ] Portal back buttons fonctionnels
  - [ ] Empty states affichés sur les pages vides
  - [ ] Aucun composant inutilisé restant
  - [ ] `bun run build` → exit code 0

  **Agent-Executed QA Scenarios**:

  ```
  Scenario: Full integration test — sidebar navigation
    Tool: Playwright (playwright skill)
    Steps:
      1. Navigate to http://localhost:3000/
      2. Verify 5 collapsible groups in sidebar
      3. Expand each group, verify items present
      4. Click an item from each group, verify navigation
      5. Verify active state highlights correct item
      6. Verify breadcrumbs on each destination page
      7. Screenshot each state
    Expected Result: All navigation works correctly
    Evidence: .sisyphus/evidence/task-21-nav-integration.png

  Scenario: Full integration test — command palette
    Tool: Playwright (playwright skill)
    Steps:
      1. Press Ctrl+K
      2. Search "Client" → verify result → navigate
      3. Press Ctrl+K again
      4. Search "Commission" → verify result → navigate
      5. Press Escape → verify closes
    Expected Result: Command palette works from any page
    Evidence: .sisyphus/evidence/task-21-command-integration.png

  Scenario: Full integration test — role filtering
    Tool: Playwright (playwright skill)
    Steps:
      1. Login as member (non-owner)
      2. Verify "Rôles & Permissions" NOT in sidebar
      3. Verify "Marque Blanche" NOT in sidebar
      4. Login as owner
      5. Verify both items ARE visible
    Expected Result: Role-based filtering works
    Evidence: .sisyphus/evidence/task-21-role-filtering.png
  ```

  **Commit**: YES
  - Message: `chore(cleanup): remove unused nav components, final QA pass`
  - Files: Deleted unused components
  - Pre-commit: `bun run build`

---

## Commit Strategy

| After Task | Message | Files | Verification |
|------------|---------|-------|--------------|
| 1 | `feat(nav): add centralized navigation config with 5 groups` | `lib/nav-config.ts` | `bun run build` |
| 2 | `refactor(nav): restructure sidebar into 5 collapsible groups` | `app-sidebar.tsx`, `nav-group.tsx` | `bun run build` |
| 3 | `fix(nav): use startsWith for parent active state detection` | `nav-main.tsx` | `bun run build` |
| 4 | `feat(nav): add 5 orphaned pages to navigation config` | `nav-config.ts`, `site-header.tsx` | `bun run build` |
| 5 | `refactor(header): decompose SiteHeader into 5 sub-components` | `components/header/*.tsx` | `bun run build` |
| 6 | `feat(nav): add auto-generated breadcrumbs from pathname` | `breadcrumb-nav.tsx`, `header-breadcrumb.tsx` | `bun run build` |
| 7 | `feat(ux): add active filter count badges` | Client/Facturation pages | `bun run build` |
| 8 | `fix(nav): differentiate Agenda and Calendrier icons` | `nav-config.ts` | `bun run build` |
| 11 | `feat(nav): add command palette (Cmd+K)` | `command-menu.tsx`, `layout.tsx` | `bun run build` |
| 9 | `refactor(clients): consolidate client detail tabs 7→5` | Client detail | `bun run build` |
| 10 | `refactor(settings): split Marque Blanche into 3 sub-pages` | Marque blanche pages | `bun run build` |
| 12 | `refactor(tasks): convert task config to tabs layout` | Task config | `bun run build` |
| 13 | `fix(portal): add back navigation buttons on sub-pages` | Portal pages | `bun run build` |
| 14 | `refactor(commissions): apply progressive disclosure` | Commissions page | `bun run build` |
| 15 | `feat(ux): add empty states to list pages` | List pages | `bun run build` |
| 16 | `refactor(settings): fix permissions matrix with accordion groups` | Permissions page | `bun run build` |
| 17 | `feat(auth): add useNavPermissions hook` | `use-nav-permissions.ts` | `bun run build` |
| 18 | `fix(notifications): reconnect WebSocket on org switch` | `notification-context.tsx` | `bun run build` |
| 19 | `feat(auth): apply role-based nav filtering in sidebar` | `app-sidebar.tsx` | `bun run build` |
| 20 | `fix(stores): reset Zustand stores on org switch` | Store files | `bun run build` |
| 21 | `chore(cleanup): remove unused components, final QA` | Multiple | `bun run build` |

---

## Success Criteria

### Verification Commands
```bash
bun run build  # Expected: exit code 0, no TypeScript errors
```

### Final Checklist
- [ ] Sidebar : 5 groupes collapsibles, ≤6 items/groupe
- [ ] Active state : sub-pages highlightent le parent
- [ ] Breadcrumbs : visibles sur toutes les pages profondeur ≥1
- [ ] Command palette : Cmd+K fonctionne depuis toute page
- [ ] SiteHeader : ≤100 lignes, 5 sous-composants
- [ ] Client Detail : 5 tabs (au lieu de 7)
- [ ] Marque Blanche : 3 sous-pages (au lieu de 3 tables)
- [ ] Config Tâches : layout tabs (au lieu de 3 panneaux)
- [ ] Commissions : stat cards collapsées, actions groupées
- [ ] Portal : back buttons sur toutes les sous-pages
- [ ] Permissions : pas de scroll horizontal
- [ ] Empty states : présents sur les pages liste vides
- [ ] Role filtering : member ne voit pas les items admin
- [ ] WebSocket : reconnexion propre au changement d'org
- [ ] Zustand stores : reset au changement d'org
- [ ] 31 routes toutes accessibles (0 orphelines)
- [ ] `bun run build` → exit code 0
