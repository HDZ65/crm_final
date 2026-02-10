# Sidebar Shadcn Pattern Refactor

## TL;DR

> **Quick Summary**: Refactorer `nav-main.tsx` et `app-sidebar.tsx` pour suivre le pattern standard Shadcn sidebar — NavMain devient un composant Collapsible réutilisable, AppSidebar devient une composition propre et data-driven.
> 
> **Deliverables**:
> - `nav-main.tsx` réécrit : pattern Shadcn Collapsible avec group label, items collapsibles, sub-items
> - `app-sidebar.tsx` simplifié : JSX réduit de ~80 lignes inline à ~5 lignes de composition NavMain
> 
> **Estimated Effort**: Quick (1-2 heures)
> **Parallel Execution**: NO — séquentiel (NavMain d'abord, puis AppSidebar)
> **Critical Path**: Task 1 (NavMain) → Task 2 (AppSidebar)

---

## Context

### Original Request
Refactorer la sidebar pour suivre le pattern standard Shadcn avec `NavMain` comme composant Collapsible réutilisable (comme l'exemple officiel Shadcn sidebar-07).

### Interview Summary
**Key Discussions**:
- **Scope**: Sidebar + NavMain SEULEMENT — `nav-config.ts` inchangé
- **Dashboard**: Reste standalone en haut (pas intégré dans un groupe)
- **Sub-items**: Pattern Shadcn standard — parent item = Collapsible trigger, sub-items cachés par défaut
- **Architecture**: Two-level Collapsible — group level (CRM header) + item level (Tâches → children)

### Metis Review
**Identified Gaps (addressed)**:
- **Two-level Collapsible ambiguity** → Résolu : group-level Collapsible (label toggle) + item-level Collapsible (items avec children). Items SANS children = simple SidebarMenuItem (pas de Collapsible)
- **Active-state CSS hack** → orphan `nav-main.tsx` utilisait `sidebar-primary` (CSS var inexistante). On utilise le `isActive` prop standard de Shadcn.
- **NavMain shape** → `NavGroup` de nav-config.ts est directement consommable. Pas d'adapter nécessaire. On lit `children` (pas `items`).
- **Parent clickable vs toggle** → Pattern Shadcn : parent = CollapsibleTrigger (toggle). Navigation via sub-items uniquement.

---

## Work Objectives

### Core Objective
Transformer le rendu de la sidebar d'un inline rendering monolithique dans AppSidebar vers une composition propre NavMain → AppSidebar, suivant le pattern officiel Shadcn.

### Concrete Deliverables
- `frontend/src/components/nav-main.tsx` — Réécrit avec pattern Collapsible Shadcn
- `frontend/src/components/app-sidebar.tsx` — JSX simplifié (lignes 269-344 remplacées par composition NavMain)

### Definition of Done
- [ ] `bun run build` passe sans erreurs après chaque tâche
- [ ] `nav-config.ts` inchangé (`git diff` vide)
- [ ] `app-sidebar.tsx` n'a plus d'imports Collapsible/SidebarMenuSub
- [ ] `nav-main.tsx` contient Collapsible et SidebarMenuSub
- [ ] Dashboard standalone préservé en haut de la sidebar
- [ ] 5 groupes rendus avec collapse/expand fonctionnel
- [ ] Sub-items accessibles via Collapsible trigger sur items parents
- [ ] Active state fonctionne (parent + sub-items)

### Must Have
- NavMain composant réutilisable avec pattern Collapsible
- AppSidebar = composition propre (NavMain pour chaque groupe)
- Active state `isActive` via `usePathname()` + `startsWith`
- Tooltips avec `description ?? title`
- `<Link>` de Next.js (pas `<a href>`)
- Guard `children && children.length > 0` pour items sans sub-items

### Must NOT Have (Guardrails)
- **G1**: NE PAS modifier `nav-config.ts` (zéro changement data ou types)
- **G2**: NE PAS modifier `components/ui/sidebar.tsx` (Shadcn primitive)
- **G3**: NE PAS toucher les lignes 1-256 de `app-sidebar.tsx` (org/auth hooks, handlers, effects, memos)
- **G4**: NE PAS changer `Sidebar collapsible="offcanvas"` en autre mode
- **G5**: NE PAS utiliser `sidebar-primary` CSS vars (inexistantes) — utiliser `isActive` prop standard
- **G6**: NE PAS ajouter de filtrage par rôle (`requiredRole` est un champ mort)
- **G7**: NE PAS ajouter d'animations custom (utiliser chevron rotation Collapsible built-in)
- **G8**: NE PAS créer de sous-composants multiples (NavGroupItem, etc.) — UN composant NavMain
- **G9**: NE PAS ajouter de support 3+ niveaux de nesting

---

## Verification Strategy (MANDATORY)

> **UNIVERSAL RULE: ZERO HUMAN INTERVENTION**
> ALL tasks MUST be verifiable by running a command or using a tool.

### Test Decision
- **Infrastructure exists**: NO (zero tests)
- **Automated tests**: None — `bun run build` seule validation
- **Framework**: None

### Agent-Executed QA Scenarios (MANDATORY — ALL tasks)

**Verification Tool by Deliverable Type:**

| Type | Tool | How Agent Verifies |
|------|------|-------------------|
| **Sidebar changes** | Playwright | Navigate, verify sidebar structure, test collapse/expand |
| **Build check** | Bash | `bun run build` → exit code 0 |
| **File integrity** | Bash/Grep | Verify nav-config.ts untouched, imports correct |

---

## Execution Strategy

### Dependency Matrix

| Task | Depends On | Blocks | Can Parallelize With |
|------|------------|--------|---------------------|
| 1 | None | 2 | None |
| 2 | 1 | None | None |

### Agent Dispatch Summary

| Wave | Tasks | Recommended Agents |
|------|-------|-------------------|
| 1 | 1 | `category="visual-engineering", load_skills=["frontend-ui-ux"]` |
| 2 | 2 | `category="quick", load_skills=["frontend-ui-ux"]` |

---

## TODOs

### Task 1 — Réécrire NavMain (pattern Shadcn Collapsible)

- [x] 1. Réécrire `nav-main.tsx` avec le pattern Shadcn Collapsible

  **What to do**:
  - Supprimer tout le contenu actuel de `nav-main.tsx` (60 lignes — composant orphelin, jamais importé)
  - Réécrire avec le pattern suivant :
    - Props : `{ items: NavItem[], label?: string, defaultOpen?: boolean }` (consomme directement `NavItem` de `nav-config.ts`)
    - Structure : `SidebarGroup` → `SidebarGroupLabel` (comme CollapsibleTrigger group-level) → `SidebarMenu` → items
    - Items AVEC children : `Collapsible` wrapping `SidebarMenuItem`, parent = `CollapsibleTrigger` asChild sur `SidebarMenuButton`, sub-items dans `CollapsibleContent` → `SidebarMenuSub`
    - Items SANS children : simple `SidebarMenuItem` → `SidebarMenuButton` asChild → `<Link>`
    - Active state : `usePathname()` + `pathname === item.url || (item.url !== '/' && pathname.startsWith(item.url + '/'))`
    - Tooltips : `tooltip={item.description ?? item.title}` sur tous les SidebarMenuButton
    - Chevron : `ChevronRight` avec `transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90`
    - Sub-item icons : `{subItem.icon && <subItem.icon />}` (guard car certains sub-items n'ont pas d'icône)
    - `defaultOpen` sur items avec children : `true` si l'un des children est actif OU si `isActive` sur le parent

  **Code cible pour `nav-main.tsx`** :
  ```tsx
  "use client"

  import { ChevronRight, type LucideIcon } from "lucide-react"
  import Link from "next/link"
  import { usePathname } from "next/navigation"

  import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
  } from "@/components/ui/collapsible"
  import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
  } from "@/components/ui/sidebar"

  interface NavItem {
    title: string
    url: string
    icon?: LucideIcon
    description?: string
    children?: NavItem[]
  }

  export function NavMain({
    items,
    label,
    defaultOpen,
  }: {
    items: NavItem[]
    label?: string
    defaultOpen?: boolean
  }) {
    const pathname = usePathname()

    return (
      <SidebarGroup>
        {label && <SidebarGroupLabel>{label}</SidebarGroupLabel>}
        <SidebarMenu>
          {items.map((item) => {
            const isActive = pathname === item.url ||
              (item.url !== '/' && pathname.startsWith(item.url + '/'))

            if (item.children && item.children.length > 0) {
              // Item with sub-items → Collapsible
              return (
                <Collapsible
                  key={item.title}
                  asChild
                  defaultOpen={isActive}
                  className="group/collapsible"
                >
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton tooltip={item.description ?? item.title}>
                        {item.icon && <item.icon />}
                        <span>{item.title}</span>
                        <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {item.children.map((subItem) => {
                          const subIsActive = pathname === subItem.url ||
                            (subItem.url !== '/' && pathname.startsWith(subItem.url + '/'))
                          return (
                            <SidebarMenuSubItem key={subItem.title}>
                              <SidebarMenuSubButton asChild isActive={subIsActive}>
                                <Link href={subItem.url}>
                                  {subItem.icon && <subItem.icon />}
                                  <span>{subItem.title}</span>
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          )
                        })}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              )
            }

            // Regular item without children
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild isActive={isActive} tooltip={item.description ?? item.title}>
                  <Link href={item.url}>
                    {item.icon && <item.icon />}
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarGroup>
    )
  }
  ```

  **Must NOT do**:
  - Ne PAS utiliser `sidebar-primary` CSS vars
  - Ne PAS ajouter d'interface qui duplique `NavItem`
  - Ne PAS utiliser `<a href>` (utiliser `<Link>`)
  - Ne PAS ajouter de filtrage par rôle

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: Composant UI React avec pattern Shadcn Collapsible
  - **Skills**: [`frontend-ui-ux`]
    - `frontend-ui-ux`: Composition correcte des composants Shadcn sidebar

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Sequential — Wave 1
  - **Blocks**: Task 2
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `frontend/src/components/app-sidebar.tsx:282-344` — Logique de rendu actuelle à transplanter dans NavMain (Collapsible groups, items avec children, active state, tooltips)
  - `frontend/src/components/nav-main.tsx` — Fichier actuel orphelin à réécrire entièrement

  **API/Type References**:
  - `frontend/src/lib/nav-config.ts:33-41` — Interface `NavItem` que NavMain consomme (title, url, icon, description, children)
  - `frontend/src/lib/nav-config.ts:46-52` — Interface `NavGroup` (id, label, icon, defaultOpen, items)
  - `frontend/src/components/ui/sidebar.tsx` — Composants Shadcn à utiliser (SidebarGroup, SidebarGroupLabel, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarMenuSub, SidebarMenuSubItem, SidebarMenuSubButton)

  **External References**:
  - Pattern officiel Shadcn sidebar : `NavMain` avec Collapsible pattern (fourni par l'utilisateur dans la conversation)

  **WHY Each Reference Matters**:
  - `app-sidebar.tsx:282-344` : Contient la logique EXACTE à transplanter — active state, tooltip fallback, children guard, chevron rotation
  - `nav-config.ts:33-52` : Types à consommer directement (pas d'adapter)
  - `ui/sidebar.tsx` : Composants à utiliser (NE PAS modifier)

  **Acceptance Criteria**:
  - [ ] `nav-main.tsx` réécrit avec pattern Collapsible Shadcn
  - [ ] Utilise `usePathname()` pour active state
  - [ ] Items avec children : Collapsible trigger avec ChevronRight
  - [ ] Items sans children : simple SidebarMenuButton
  - [ ] Guard `children && children.length > 0`
  - [ ] Tooltip `description ?? title` sur tous les SidebarMenuButton
  - [ ] Sub-item icon guard `{subItem.icon && <subItem.icon />}`
  - [ ] `<Link>` de Next.js (pas `<a href>`)
  - [ ] `defaultOpen={isActive}` sur items avec children (auto-expand quand actif)
  - [ ] `bun run build` → exit code 0

  **Agent-Executed QA Scenarios**:

  ```
  Scenario: Build passes with rewritten NavMain
    Tool: Bash
    Preconditions: None
    Steps:
      1. Run: cd frontend && bun run build
      2. Assert: exit code 0
      3. Assert: no TypeScript errors related to nav-main
    Expected Result: Build succeeds
    Evidence: Build output captured

  Scenario: NavMain contains Collapsible pattern
    Tool: Bash (grep)
    Steps:
      1. grep -c "Collapsible" frontend/src/components/nav-main.tsx
      2. Assert: output >= 3
      3. grep -c "CollapsibleTrigger" frontend/src/components/nav-main.tsx
      4. Assert: output >= 1
      5. grep -c "SidebarMenuSub" frontend/src/components/nav-main.tsx
      6. Assert: output >= 1
      7. grep -c "usePathname" frontend/src/components/nav-main.tsx
      8. Assert: output >= 1
    Expected Result: All Shadcn patterns present
    Evidence: grep output captured
  ```

  **Commit**: YES
  - Message: `refactor(nav): rewrite NavMain with Shadcn Collapsible pattern`
  - Files: `frontend/src/components/nav-main.tsx`
  - Pre-commit: `bun run build`

---

### Task 2 — Simplifier AppSidebar (composition NavMain)

- [x] 2. Simplifier `app-sidebar.tsx` pour utiliser NavMain

  **What to do**:
  - **UNIQUEMENT modifier le bloc JSX return** (lignes ~269-344 de `app-sidebar.tsx`)
  - **NE PAS toucher les lignes 1-256** (hooks, handlers, effects, memos pour org/auth)
  - Remplacer le bloc de rendu inline (Dashboard + 5 groupes Collapsible) par :
    1. Import `NavMain` depuis `@/components/nav-main`
    2. Dashboard standalone : garder le `<SidebarMenu>` avec `DASHBOARD_ITEM` (lignes 271-280) — inchangé
    3. Remplacer le `{NAV_GROUPS.map(group => <Collapsible>...60 lignes inline...</Collapsible>)}` par :
       ```tsx
       {NAV_GROUPS.map((group) => (
         <NavMain
           key={group.id}
           items={group.items}
           label={group.label}
           defaultOpen={group.defaultOpen}
         />
       ))}
       ```
  - Supprimer les imports devenus inutiles de `app-sidebar.tsx` :
    - `Collapsible`, `CollapsibleContent`, `CollapsibleTrigger` (déplacés dans NavMain)
    - `SidebarGroupLabel`, `SidebarGroupContent` (utilisés dans NavMain maintenant)
    - `SidebarMenuSub`, `SidebarMenuSubItem`, `SidebarMenuSubButton` (utilisés dans NavMain)
    - `ChevronRight` de lucide-react
    - `usePathname` de next/navigation (plus nécessaire dans AppSidebar car NavMain gère le active state)
  - **Garder** les imports encore utilisés : `SidebarMenu`, `SidebarMenuItem`, `SidebarMenuButton` (pour Dashboard standalone), `SidebarGroup` (si utilisé pour Dashboard)

  **Must NOT do**:
  - NE PAS toucher les lignes 1-256 (org/auth logic)
  - NE PAS modifier le footer (lignes 346-362)
  - NE PAS modifier les dialogs (lignes 365-398)
  - NE PAS changer `collapsible="offcanvas"` sur `<Sidebar>`
  - NE PAS modifier `nav-config.ts`
  - NE PAS modifier `ui/sidebar.tsx`

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Remplacement de JSX inline par composition simple + cleanup imports
  - **Skills**: [`frontend-ui-ux`]

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Sequential — Wave 2
  - **Blocks**: None
  - **Blocked By**: Task 1

  **References**:

  **Pattern References**:
  - `frontend/src/components/app-sidebar.tsx:269-344` — Bloc JSX à remplacer
  - `frontend/src/components/app-sidebar.tsx:3-29` — Imports à nettoyer
  - `frontend/src/components/app-sidebar.tsx:271-280` — Dashboard standalone à GARDER
  - `frontend/src/components/nav-main.tsx` — Composant NavMain réécrit dans Task 1

  **API/Type References**:
  - `frontend/src/lib/nav-config.ts:305-311` — `NAV_GROUPS` array à mapper

  **WHY Each Reference Matters**:
  - `app-sidebar.tsx:269-344` : Zone EXACTE de modification — tout le rendu nav inline
  - `app-sidebar.tsx:271-280` : Dashboard standalone à préserver (ne PAS déplacer dans NavMain)
  - `nav-main.tsx` : Le composant qui remplace 60+ lignes de JSX inline

  **Acceptance Criteria**:
  - [ ] `NavMain` importé dans `app-sidebar.tsx`
  - [ ] Bloc JSX réduit : `NAV_GROUPS.map` → `<NavMain>` au lieu de Collapsible inline
  - [ ] Dashboard standalone préservé (SidebarMenu avec DASHBOARD_ITEM)
  - [ ] Imports Collapsible/SidebarMenuSub/ChevronRight supprimés de `app-sidebar.tsx`
  - [ ] `usePathname` supprimé de `app-sidebar.tsx` (NavMain gère le active state)
  - [ ] `nav-config.ts` inchangé (`git diff` vide)
  - [ ] `bun run build` → exit code 0

  **Agent-Executed QA Scenarios**:

  ```
  Scenario: Build passes with simplified AppSidebar
    Tool: Bash
    Preconditions: Task 1 completed
    Steps:
      1. Run: cd frontend && bun run build
      2. Assert: exit code 0
    Expected Result: Build succeeds
    Evidence: Build output captured

  Scenario: AppSidebar no longer has inline Collapsible
    Tool: Bash (grep)
    Steps:
      1. grep -c "CollapsibleTrigger" frontend/src/components/app-sidebar.tsx
      2. Assert: output is 0
      3. grep -c "SidebarMenuSub" frontend/src/components/app-sidebar.tsx
      4. Assert: output is 0
      5. grep -c "ChevronRight" frontend/src/components/app-sidebar.tsx
      6. Assert: output is 0
      7. grep -c "NavMain" frontend/src/components/app-sidebar.tsx
      8. Assert: output >= 1
    Expected Result: No inline nav rendering, NavMain used instead
    Evidence: grep output captured

  Scenario: nav-config.ts is untouched
    Tool: Bash (git)
    Steps:
      1. Run: git diff frontend/src/lib/nav-config.ts
      2. Assert: output is empty (no changes)
    Expected Result: nav-config.ts completely untouched
    Evidence: git diff output

  Scenario: Sidebar renders correctly with 5 groups
    Tool: Playwright (playwright skill)
    Preconditions: Dev server running on localhost:3000, user authenticated
    Steps:
      1. Navigate to: http://localhost:3000/
      2. Wait for: [data-slot="sidebar"] visible (timeout: 10s)
      3. Assert: Dashboard item visible at top
      4. Assert: "CRM" group label visible
      5. Assert: "Finance & Ventes" group label visible
      6. Assert: "Catalogue & Opérations" group label visible
      7. Assert: "Paiements" group label visible
      8. Assert: "Administration" group label visible
      9. Click: "CRM" group → verify items visible (Clients, Commerciaux, Tâches, Messagerie, Calendrier)
      10. Click: "Tâches" item → verify sub-items expand (Configuration)
      11. Click: "Configuration" sub-item → verify URL = /taches/configuration
      12. Screenshot: .sisyphus/evidence/task-2-sidebar-shadcn.png
    Expected Result: Sidebar renders with Shadcn Collapsible pattern
    Evidence: .sisyphus/evidence/task-2-sidebar-shadcn.png
  ```

  **Commit**: YES
  - Message: `refactor(nav): simplify AppSidebar with NavMain composition`
  - Files: `frontend/src/components/app-sidebar.tsx`
  - Pre-commit: `bun run build`

---

## Commit Strategy

| After Task | Message | Files | Verification |
|------------|---------|-------|--------------|
| 1 | `refactor(nav): rewrite NavMain with Shadcn Collapsible pattern` | `nav-main.tsx` | `bun run build` |
| 2 | `refactor(nav): simplify AppSidebar with NavMain composition` | `app-sidebar.tsx` | `bun run build` + Playwright |

---

## Success Criteria

### Verification Commands
```bash
# Build passes
cd frontend && bun run build  # Expected: exit 0

# nav-config.ts untouched
git diff frontend/src/lib/nav-config.ts  # Expected: empty

# NavMain has Collapsible pattern
grep -c "Collapsible" frontend/src/components/nav-main.tsx  # Expected: >= 3

# AppSidebar no longer has inline nav rendering
grep -c "CollapsibleTrigger" frontend/src/components/app-sidebar.tsx  # Expected: 0
grep -c "SidebarMenuSub" frontend/src/components/app-sidebar.tsx  # Expected: 0

# NavMain is imported
grep -c "NavMain" frontend/src/components/app-sidebar.tsx  # Expected: >= 1
```

### Final Checklist
- [ ] NavMain = Shadcn Collapsible pattern (comme exemple fourni par l'utilisateur)
- [ ] AppSidebar = composition propre (NavMain × 5 groupes + Dashboard standalone)
- [ ] 5 groupes rendus avec collapse/expand
- [ ] Sub-items via Collapsible trigger (items parents)
- [ ] Active state fonctionne (parent + sub-items)
- [ ] Tooltips préservés
- [ ] Build passes
- [ ] nav-config.ts inchangé
