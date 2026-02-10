# UI Polish: Dashboard, Clients & DatePicker

## TL;DR

> **Quick Summary**: 4 corrections UI indépendantes : retirer 2 cards du dashboard, fixer le contraste du bouton filtres clients, passer les selects du formulaire client en full-width, et remplacer tous les `<Input type="date">` par un DatePicker shadcn (Calendar + Popover).
> 
> **Deliverables**:
> - Dashboard page nettoyée (sans KPI Commerciaux ni Indicateurs clés)
> - Bouton Filtres lisible quand actif
> - Modale Nouveau client avec selects pleine largeur
> - Nouveau composant `date-picker.tsx` réutilisable
> - 9 inputs `type="date"` remplacés dans 5 fichiers
> 
> **Estimated Effort**: Medium
> **Parallel Execution**: YES - 3 waves
> **Critical Path**: Task 4a (créer DatePicker) → Task 4b (remplacer dans tous les fichiers)

---

## Context

### Original Request
L'utilisateur demande 4 corrections UI :
1. Dashboard : retirer la card "KPI Commerciaux" et la card "Indicateurs clés"
2. Clients : le bouton "Filtres" est illisible quand les filtres sont ouverts (texte blanc sur fond clair)
3. Clients : dans la modale "Nouveau client", les selects Type de client et Société doivent être full width
4. Tous les calendriers : utiliser le composant Calendar shadcn au lieu des `<Input type="date">` natifs

### Interview Summary
**Key Discussions**:
- **datetime-local scope** : L'utilisateur confirme qu'on ne remplace QUE les `type="date"` (9 inputs), PAS les `datetime-local` (5 inputs agenda + lots) qui nécessitent la sélection d'heure
- **Style bouton Filtres** : L'utilisateur choisit `bg-accent text-accent-foreground` (gris lisible)

### Metis Review
**Identified Gaps** (addressed):
- `dashboardData.kpis` est aussi passé à `GreetingBriefing` → on garde le fetch kpis, on retire seulement kpisCommerciaux
- `NativeFormField` dans create-client-dialog utilise `cloneElement` pour injecter le `name` → le DatePicker doit inclure un `<input type="hidden" name={name}>` pour que la soumission du formulaire fonctionne
- 3 patterns d'intégration différents pour les date inputs (native form, controlled state, react-hook-form) → le DatePicker doit accepter `value: string` et `onChange: (value: string) => void` pour être compatible avec tous

---

## Work Objectives

### Core Objective
Corriger 4 problèmes UI pour améliorer la cohérence visuelle et l'UX du CRM.

### Concrete Deliverables
- `frontend/src/app/(main)/page.tsx` — nettoyé sans 2 cards
- `frontend/src/app/(main)/clients/clients-page-client.tsx` — bouton filtres lisible
- `frontend/src/components/create-client-dialog.tsx` — selects full width
- `frontend/src/components/ui/date-picker.tsx` — nouveau composant réutilisable
- 5 fichiers avec `type="date"` → DatePicker

### Definition of Done
- [ ] `npm run build` réussit sans erreur
- [ ] Aucun `<Input type="date">` ne reste dans le codebase (hors `datetime-local`)
- [ ] Dashboard ne contient plus DashboardKPIs ni CommercialKpis

### Must Have
- Le DatePicker doit être string-in/string-out (API compatible avec les inputs actuels)
- Le DatePicker doit fonctionner avec NativeFormField (hidden input avec `name`)
- Le DatePicker doit fonctionner avec react-hook-form `{...field}`
- Locale française pour les dates affichées

### Must NOT Have (Guardrails)
- NE PAS toucher aux `type="datetime-local"` (agenda + lots)
- NE PAS supprimer les fichiers composants `dashboard-kpis.tsx` ou `commercial-kpis.tsx` (potentiellement utilisés ailleurs ou réactivés plus tard)
- NE PAS supprimer la fonction `getServerKpisCommerciaux` de `data.ts` (utilisée par `statistiques/page.tsx`)
- NE PAS modifier le Button variant globalement pour le fix du filtre
- NE PAS changer le grid Nom/Prénom (ligne 119 de create-client-dialog.tsx) — il reste en 2 colonnes
- NE PAS ajouter de fonctionnalités avancées au DatePicker (range, disabled dates, etc.)

---

## Verification Strategy

> **UNIVERSAL RULE: ZERO HUMAN INTERVENTION**
> ALL tasks are verifiable by running commands or using tools.

### Test Decision
- **Infrastructure exists**: YES (the project has build/lint)
- **Automated tests**: NO (pas de test unitaire demandé)
- **Framework**: N/A
- **Agent-Executed QA**: ALWAYS

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Start Immediately — all independent):
├── Task 1: Dashboard removal
├── Task 2: Filter button contrast fix
└── Task 3: Create client dialog full-width selects

Wave 2 (After Wave 1 — foundational):
└── Task 4a: Create DatePicker component

Wave 3 (After Task 4a):
└── Task 4b: Replace all type="date" inputs across 5 files

Final: Build verification
```

### Dependency Matrix

| Task | Depends On | Blocks | Can Parallelize With |
|------|------------|--------|---------------------|
| 1 | None | None | 2, 3 |
| 2 | None | None | 1, 3 |
| 3 | None | None | 1, 2 |
| 4a | None | 4b | 1, 2, 3 |
| 4b | 4a | None | None |

### Agent Dispatch Summary

| Wave | Tasks | Recommended |
|------|-------|-------------|
| 1 | 1, 2, 3 | 3 agents quick en parallèle |
| 2 | 4a | 1 agent visual-engineering |
| 3 | 4b | 1 agent unspecified-high |

---

## TODOs

- [ ] 1. Dashboard: Retirer les cards KPI Commerciaux et Indicateurs clés

  **What to do**:
  - Dans `frontend/src/app/(main)/page.tsx` :
    - Supprimer l'import `DashboardKPIs` (ligne 2)
    - Supprimer `CommercialKpis` de l'import destructuré `@/components/dashboard` (ligne 7)
    - Supprimer le JSX `<DashboardKPIs initialData={dashboardData.kpis} />` (ligne 43)
    - Supprimer le JSX `<CommercialKpis initialData={dashboardData.kpisCommerciaux} />` (ligne 46)
    - Supprimer `kpisCommerciaux: null` du fallback object (ligne 25)
  - Dans `frontend/src/lib/server/data.ts` :
    - Dans la fonction `getServerDashboardData`, retirer l'appel `getServerKpisCommerciaux(orgId)` du `Promise.all`
    - Retirer `kpisCommerciaux` de l'objet retourné
    - NE PAS supprimer la fonction `getServerKpisCommerciaux` elle-même (utilisée par statistiques)

  **Must NOT do**:
  - Ne pas supprimer les fichiers `dashboard-kpis.tsx` ou `commercial-kpis.tsx`
  - Ne pas retirer le fetch `kpis` qui est utilisé par `GreetingBriefing`
  - Ne pas toucher à `getServerKpisCommerciaux` en tant que fonction

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []
    - Simple removal task, no special skill needed

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 2, 3)
  - **Blocks**: None
  - **Blocked By**: None

  **References**:
  - `frontend/src/app/(main)/page.tsx` — Dashboard page, lines 1-66. DashboardKPIs at line 43, CommercialKpis at line 46, imports at lines 2 and 7
  - `frontend/src/lib/server/data.ts` — Server data fetching, function `getServerDashboardData` handles the Promise.all. `kpisCommerciaux` is one of 6 fetches
  - `frontend/src/app/(main)/statistiques/page.tsx` — Also uses `getServerKpisCommerciaux` — proof that we must NOT delete the function itself
  - `frontend/src/components/dashboard/greeting-briefing.tsx` — Uses `initialKpis` prop — proof that kpis fetch must stay

  **Acceptance Criteria**:

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: Dashboard page no longer contains KPI cards
    Tool: Bash (grep)
    Preconditions: Files saved
    Steps:
      1. grep -c "DashboardKPIs\|CommercialKpis" frontend/src/app/(main)/page.tsx
      2. Assert: Output is "0"
      3. grep "initialKpis" frontend/src/app/(main)/page.tsx
      4. Assert: At least 1 match (GreetingBriefing still uses it)
    Expected Result: Zero mentions of removed components, kpis still passed to greeting
    Evidence: grep output captured

  Scenario: Build succeeds after removal
    Tool: Bash
    Preconditions: All changes saved
    Steps:
      1. Run: npx tsc --noEmit in frontend/
      2. Assert: No new errors related to page.tsx or data.ts
    Expected Result: Clean build
    Evidence: Build output captured
  ```

  **Commit**: YES
  - Message: `fix(dashboard): remove KPI Commerciaux and Indicateurs clés cards`
  - Files: `frontend/src/app/(main)/page.tsx`, `frontend/src/lib/server/data.ts`

---

- [ ] 2. Clients: Fix contraste bouton Filtres quand ouvert

  **What to do**:
  - Dans `frontend/src/app/(main)/clients/clients-page-client.tsx`, ligne 258 :
    - Changer `isAdvancedFiltersOpen && "bg-accent"` en `isAdvancedFiltersOpen && "bg-accent text-accent-foreground"`
    - Cela ajoute la couleur de texte appropriée pour le fond accent, garantissant la lisibilité

  **Must NOT do**:
  - Ne pas modifier les variants du composant Button globalement
  - Ne pas changer d'autres boutons sur cette page

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 3)
  - **Blocks**: None
  - **Blocked By**: None

  **References**:
  - `frontend/src/app/(main)/clients/clients-page-client.tsx:252-269` — Le bouton Filtres avec la classe conditionnelle. `variant="outline"` baseline + `bg-accent` quand ouvert. Le problème: le variant outline a `text-white` mais `bg-accent` est un gris clair → texte invisible

  **Acceptance Criteria**:

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: Filter button text is readable when filters are open
    Tool: Bash (grep)
    Preconditions: File saved
    Steps:
      1. grep "text-accent-foreground" frontend/src/app/(main)/clients/clients-page-client.tsx
      2. Assert: At least 1 match in the filter button area
      3. grep -c "\"bg-accent\"" frontend/src/app/(main)/clients/clients-page-client.tsx
      4. Assert: 0 matches (bg-accent alone without text-accent-foreground should not exist)
    Expected Result: bg-accent is always paired with text-accent-foreground
    Evidence: grep output captured

  Scenario: Visual verification of filter button
    Tool: Playwright (playwright skill)
    Preconditions: Dev server running on localhost:3000
    Steps:
      1. Navigate to: http://localhost:3000/clients
      2. Wait for page load (timeout: 10s)
      3. Click: button containing text "Filtres"
      4. Wait for: collapsible filter panel visible (timeout: 3s)
      5. Screenshot: .sisyphus/evidence/task-2-filters-button-open.png
      6. Assert: Button text "Filtres" is visually readable (contrast check)
    Expected Result: Button text clearly visible on accent background
    Evidence: .sisyphus/evidence/task-2-filters-button-open.png
  ```

  **Commit**: YES (groups with Task 3)
  - Message: `fix(clients): improve filter button contrast when filters panel is open`
  - Files: `frontend/src/app/(main)/clients/clients-page-client.tsx`

---

- [ ] 3. Clients: Selects Type de client et Société en full width dans modale Nouveau client

  **What to do**:
  - Dans `frontend/src/components/create-client-dialog.tsx`, ligne 80 :
    - Changer `<div className="grid grid-cols-2 gap-4">` en `<div className="grid grid-cols-1 gap-4">`
    - Cela rend les 2 selects (Type de client + Société) full width, empilés verticalement

  **Must NOT do**:
  - Ne pas changer le `grid grid-cols-2 gap-4` de la ligne 119 (Nom/Prénom — doit rester en 2 colonnes)
  - Ne pas restructurer d'autres champs du formulaire

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 2)
  - **Blocks**: None
  - **Blocked By**: None

  **References**:
  - `frontend/src/components/create-client-dialog.tsx:80-117` — Le `<div className="grid grid-cols-2 gap-4">` qui contient NativeFormField (Type de client) et le div Société. Les 2 selects sont side-by-side à 250px chacun dans un dialog de 500px
  - `frontend/src/components/create-client-dialog.tsx:119` — Le grid Nom/Prénom qui doit rester en grid-cols-2

  **Acceptance Criteria**:

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: Type and Société selects are full width
    Tool: Bash (grep)
    Preconditions: File saved
    Steps:
      1. grep -n "grid-cols-2" frontend/src/components/create-client-dialog.tsx
      2. Assert: Exactly 1 match (the Nom/Prénom row around line 119)
      3. grep -n "grid-cols-1" frontend/src/components/create-client-dialog.tsx
      4. Assert: Exactly 1 match (the Type/Société row)
    Expected Result: One grid-cols-1 (Type/Société) and one grid-cols-2 (Nom/Prénom)
    Evidence: grep output captured

  Scenario: Visual verification of create client dialog
    Tool: Playwright (playwright skill)
    Preconditions: Dev server running, user logged in, on /clients page
    Steps:
      1. Navigate to: http://localhost:3000/clients
      2. Click: button containing text "Nouveau client"
      3. Wait for: dialog visible (timeout: 5s)
      4. Assert: Select "Type de client" trigger width equals dialog content width
      5. Assert: Select "Société" trigger width equals dialog content width
      6. Screenshot: .sisyphus/evidence/task-3-create-client-dialog.png
    Expected Result: Both selects span full width of the dialog
    Evidence: .sisyphus/evidence/task-3-create-client-dialog.png
  ```

  **Commit**: YES (groups with Task 2)
  - Message: `fix(clients): make Type and Société selects full width in create client dialog`
  - Files: `frontend/src/components/create-client-dialog.tsx`

---

- [ ] 4a. Créer le composant DatePicker réutilisable

  **What to do**:
  - Créer `frontend/src/components/ui/date-picker.tsx`
  - Le composant doit :
    - Utiliser `Calendar` de `@/components/ui/calendar` + `Popover`/`PopoverTrigger`/`PopoverContent` de `@/components/ui/popover`
    - API props : `{ value?: string; onChange?: (value: string) => void; placeholder?: string; disabled?: boolean; id?: string; name?: string; className?: string }`
    - `value` est un string au format `"YYYY-MM-DD"` (ISO date, comme les inputs actuels)
    - `onChange` reçoit un string `"YYYY-MM-DD"` (pas un Date object)
    - Convertir `value` string → `Date` pour le Calendar via `parse(value, "yyyy-MM-dd", new Date())` de `date-fns`
    - Convertir le `Date` sélectionné → string via `format(selectedDate, "yyyy-MM-dd")` de `date-fns`
    - Afficher la date formatée en français dans le trigger : `format(date, "d MMMM yyyy", { locale: fr })` de `date-fns/locale/fr`
    - Utiliser `Button variant="outline"` comme trigger avec `CalendarIcon` de lucide-react
    - Inclure un `<input type="hidden" name={name} value={stringValue} />` quand `name` est fourni (pour les formulaires natifs type NativeFormField)
    - Fermer le popover automatiquement quand une date est sélectionnée
    - Le Calendar doit utiliser `mode="single"` et `captionLayout="dropdown"` comme montré dans la doc shadcn fournie par l'utilisateur
    - Exporter le composant comme `DatePicker`

  **Must NOT do**:
  - Pas de mode range
  - Pas de disabled dates
  - Pas de sélection d'heure (time picker)
  - Pas de modification du composant Calendar existant

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: [`frontend-ui-ux`]
    - `frontend-ui-ux`: Composant UI avec popover, bon styling, cohérence design

  **Parallelization**:
  - **Can Run In Parallel**: YES (can start in Wave 1 alongside tasks 1-3)
  - **Parallel Group**: Wave 2
  - **Blocks**: Task 4b
  - **Blocked By**: None

  **References**:
  - `frontend/src/components/ui/calendar.tsx` — Le composant Calendar existant, exporte `Calendar` et `CalendarDayButton`. Utilise react-day-picker v9, DayPicker avec classNames customisés
  - `frontend/src/components/ui/popover.tsx` — Composant Popover shadcn pour le wrapper
  - `frontend/src/components/ui/button.tsx` — Pour le trigger `variant="outline"`
  - `frontend/package.json` — `date-fns` déjà installé, `react-day-picker` v9.13 déjà installé
  - Doc shadcn Calendar fournie par l'utilisateur — pattern `<Calendar mode="single" captionLayout="dropdown" className="rounded-lg border" />`
  - Shadcn DatePicker pattern standard : `Button variant="outline"` → `Popover` → `Calendar mode="single"`

  **Acceptance Criteria**:

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: DatePicker component file exists and exports correctly
    Tool: Bash (grep)
    Preconditions: File created
    Steps:
      1. Verify file exists: frontend/src/components/ui/date-picker.tsx
      2. grep "export.*DatePicker" frontend/src/components/ui/date-picker.tsx
      3. Assert: At least 1 match
      4. grep "type=\"hidden\"" frontend/src/components/ui/date-picker.tsx
      5. Assert: At least 1 match (hidden input for form submission)
      6. grep "captionLayout" frontend/src/components/ui/date-picker.tsx
      7. Assert: At least 1 match (dropdown caption as per user's requirement)
    Expected Result: Component exists with correct exports, hidden input, and dropdown caption
    Evidence: grep output captured

  Scenario: TypeScript compiles without errors
    Tool: Bash
    Preconditions: File created
    Steps:
      1. Run: npx tsc --noEmit in frontend/
      2. Assert: No errors in date-picker.tsx
    Expected Result: Clean compilation
    Evidence: Build output captured
  ```

  **Commit**: YES
  - Message: `feat(ui): add DatePicker component with Calendar popover`
  - Files: `frontend/src/components/ui/date-picker.tsx`

---

- [ ] 4b. Remplacer tous les `<Input type="date">` par DatePicker

  **What to do**:
  - Remplacer les 9 instances de `<Input type="date" ...>` dans 5 fichiers par `<DatePicker ...>` :

  **Fichier 1: `frontend/src/components/create-client-dialog.tsx`** (1 instance, ligne 134)
  - Pattern actuel : `<NativeFormField name="dateNaissance" ...><Input type="date" /></NativeFormField>`
  - Remplacement : `<NativeFormField name="dateNaissance" ...><DatePicker name="dateNaissance" placeholder="Sélectionnez une date" /></NativeFormField>`
  - Note : Le `name` prop du DatePicker génère le hidden input. NativeFormField peut aussi injecter le name via cloneElement, mais le hidden input du DatePicker prend priorité. Vérifier que la soumission du formulaire envoie bien `dateNaissance`.
  - Import à ajouter : `import { DatePicker } from "@/components/ui/date-picker"`

  **Fichier 2: `frontend/src/components/catalogue/product-details-panel.tsx`** (4 instances, lignes 651, 664, 870, 880)
  - Pattern actuel : `<Input type="date" value={form.field} onChange={e => setForm({...form, field: e.target.value})} />`
  - Remplacement : `<DatePicker value={form.field} onChange={(value) => setForm({...form, field: value})} />`
  - 4 champs à remplacer (vérifier les noms exacts des champs dans le formulaire)
  - Import à ajouter : `import { DatePicker } from "@/components/ui/date-picker"`

  **Fichier 3: `frontend/src/app/(main)/abonnements/abonnements-page-client.tsx`** (2 instances, lignes 741, 752)
  - Pattern actuel : `<Input type="date" value={subscriptionFormData.field} onChange={e => ...} />`
  - Remplacement : `<DatePicker value={subscriptionFormData.field} onChange={(value) => setSubscriptionFormData({...prev, field: value})} />`
  - Import à ajouter

  **Fichier 4: `frontend/src/components/commissions/create-bareme-dialog.tsx`** (1 instance, ligne 512)
  - Pattern actuel : `<Input className="w-full" type="date" {...field} />`
  - Remplacement : `<DatePicker value={field.value} onChange={field.onChange} />`
  - Note : react-hook-form `field` a `.value` (string) et `.onChange` (function). Le DatePicker est string-in/string-out donc compatible.
  - Import à ajouter

  **Fichier 5: `frontend/src/app/(main)/paiements/exports/exports-page-client.tsx`** (2 instances, lignes 325, 336)
  - Pattern actuel : `<Input type="date" value={formData.field} onChange={e => ...} />`
  - Remplacement : `<DatePicker value={formData.field} onChange={(value) => setFormData({...prev, field: value})} />`
  - Import à ajouter

  **Pour chaque remplacement** :
  - Ajouter l'import du DatePicker
  - Remplacer `<Input type="date" ...>` par `<DatePicker ...>`
  - Adapter le `onChange` : l'ancien reçoit un event (`e.target.value`), le nouveau reçoit directement le string value
  - Conserver le `id`, `disabled`, `className` si présents
  - Retirer les imports `Input` si plus utilisés dans le fichier (vérifier d'abord)

  **Must NOT do**:
  - Ne PAS toucher aux 5 `type="datetime-local"` (agenda x4 + lots x1)
  - Ne PAS modifier la logique de soumission des formulaires
  - Ne PAS changer les noms de champs dans les state objects

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: [`frontend-ui-ux`]
    - `frontend-ui-ux`: Multiple fichiers UI à modifier avec cohérence

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 3 (sequential after 4a)
  - **Blocks**: None
  - **Blocked By**: Task 4a

  **References**:
  - `frontend/src/components/ui/date-picker.tsx` — Le composant créé en Task 4a. API: `{ value?: string; onChange?: (value: string) => void; name?: string; placeholder?: string; disabled?: boolean; id?: string }`
  - `frontend/src/components/create-client-dialog.tsx:129-135` — NativeFormField + Input type="date" pour dateNaissance. NativeFormField utilise cloneElement pour injecter name/id
  - `frontend/src/components/catalogue/product-details-panel.tsx:645-670, 865-885` — 4 date inputs dans des formulaires de version et publication. Pattern: `value={form.field} onChange={e => setForm(...)}`
  - `frontend/src/app/(main)/abonnements/abonnements-page-client.tsx:735-755` — 2 date inputs pour dates d'abonnement. Pattern: controlled state
  - `frontend/src/components/commissions/create-bareme-dialog.tsx:510-515` — 1 date input avec react-hook-form `{...field}`. Field.value est un string
  - `frontend/src/app/(main)/paiements/exports/exports-page-client.tsx:320-340` — 2 date inputs pour plage d'export. Pattern: controlled state
  - `frontend/src/components/ui/form-field.tsx` — NativeFormField component, uses cloneElement to inject name/id/aria props into child

  **Acceptance Criteria**:

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: No more type="date" inputs in codebase
    Tool: Bash (grep)
    Preconditions: All replacements done
    Steps:
      1. grep -r 'type="date"' frontend/src/ --include="*.tsx" | grep -v "datetime-local" | grep -v node_modules | grep -v ".next"
      2. Assert: 0 matches
    Expected Result: All type="date" inputs replaced
    Evidence: grep output showing 0 results

  Scenario: datetime-local inputs untouched
    Tool: Bash (grep)
    Preconditions: All replacements done
    Steps:
      1. grep -rc 'type="datetime-local"' frontend/src/app/ frontend/src/components/ --include="*.tsx"
      2. Assert: Total matches >= 5 (agenda 4 + lots 1)
    Expected Result: All datetime-local inputs preserved
    Evidence: grep output captured

  Scenario: DatePicker imported in all 5 replacement files
    Tool: Bash (grep)
    Preconditions: All replacements done
    Steps:
      1. grep -l "DatePicker" frontend/src/components/create-client-dialog.tsx frontend/src/components/catalogue/product-details-panel.tsx frontend/src/app/(main)/abonnements/abonnements-page-client.tsx frontend/src/components/commissions/create-bareme-dialog.tsx frontend/src/app/(main)/paiements/exports/exports-page-client.tsx
      2. Assert: 5 files listed
    Expected Result: All 5 files import and use DatePicker
    Evidence: grep output captured

  Scenario: Build succeeds
    Tool: Bash
    Preconditions: All changes saved
    Steps:
      1. Run: npx tsc --noEmit in frontend/
      2. Assert: No new errors related to date-picker imports or usage
    Expected Result: Clean build
    Evidence: Build output captured

  Scenario: Create client dialog form submission works
    Tool: Playwright (playwright skill)
    Preconditions: Dev server running, user logged in
    Steps:
      1. Navigate to: http://localhost:3000/clients
      2. Click: button "Nouveau client"
      3. Wait for: dialog visible (timeout: 5s)
      4. Find: DatePicker for "Date de naissance"
      5. Click the DatePicker trigger button
      6. Wait for: popover with calendar visible (timeout: 3s)
      7. Click a date in the calendar
      8. Assert: Popover closes
      9. Assert: DatePicker trigger shows formatted date (e.g., "9 février 2026")
      10. Screenshot: .sisyphus/evidence/task-4b-datepicker-in-dialog.png
    Expected Result: DatePicker works in dialog context with Calendar popover
    Evidence: .sisyphus/evidence/task-4b-datepicker-in-dialog.png
  ```

  **Commit**: YES
  - Message: `refactor(ui): replace all native date inputs with DatePicker component`
  - Files: `frontend/src/components/create-client-dialog.tsx`, `frontend/src/components/catalogue/product-details-panel.tsx`, `frontend/src/app/(main)/abonnements/abonnements-page-client.tsx`, `frontend/src/components/commissions/create-bareme-dialog.tsx`, `frontend/src/app/(main)/paiements/exports/exports-page-client.tsx`

---

## Commit Strategy

| After Task | Message | Files | Verification |
|------------|---------|-------|--------------|
| 1 | `fix(dashboard): remove KPI Commerciaux and Indicateurs clés cards` | page.tsx, data.ts | tsc --noEmit |
| 2+3 | `fix(clients): improve filter button contrast and full-width selects in create dialog` | clients-page-client.tsx, create-client-dialog.tsx | tsc --noEmit |
| 4a | `feat(ui): add DatePicker component with Calendar popover` | date-picker.tsx | tsc --noEmit |
| 4b | `refactor(ui): replace all native date inputs with DatePicker component` | 5 files | tsc --noEmit + grep verification |

---

## Success Criteria

### Verification Commands
```bash
# 1. No more DashboardKPIs/CommercialKpis in dashboard
grep -c "DashboardKPIs\|CommercialKpis" frontend/src/app/\(main\)/page.tsx  # Expected: 0

# 2. Filter button has text-accent-foreground
grep "text-accent-foreground" frontend/src/app/\(main\)/clients/clients-page-client.tsx  # Expected: 1+ match

# 3. Create client dialog has grid-cols-1 for Type/Société
grep -c "grid-cols-2" frontend/src/components/create-client-dialog.tsx  # Expected: 1 (only Nom/Prénom)

# 4. No type="date" remains (excluding datetime-local)
grep -r 'type="date"' frontend/src/ --include="*.tsx" | grep -v datetime-local | wc -l  # Expected: 0

# 5. DatePicker component exists
test -f frontend/src/components/ui/date-picker.tsx && echo OK  # Expected: OK

# 6. Build passes
cd frontend && npx tsc --noEmit  # Expected: 0 new errors
```

### Final Checklist
- [ ] Dashboard ne contient plus KPI Commerciaux ni Indicateurs clés
- [ ] Bouton Filtres lisible avec `bg-accent text-accent-foreground`
- [ ] Selects Type/Société en full width dans modale client
- [ ] Composant DatePicker créé et fonctionnel
- [ ] 9 inputs `type="date"` remplacés dans 5 fichiers
- [ ] 5 inputs `type="datetime-local"` inchangés
- [ ] Build TypeScript réussi
