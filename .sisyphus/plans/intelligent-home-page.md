# Intelligent Home Page — Cockpit Manager Quotidien

## TL;DR

> **Quick Summary**: Remplacer le dashboard statique actuel (4 KPI cards + 1 area chart + 1 pie chart) par un cockpit manager intelligent en 3 zones : (1) Briefing IA contextuel + alertes compactes + quick actions, (2) KPIs enrichis + charts existants + nouveau camembert produits, (3) Feed d'activité temps réel. Le backend doit aussi implémenter les 3 endpoints stub (alertes, KPIs commerciaux, répartition produits).
>
> **Deliverables**:
> - Home page redesignée avec 3 zones distinctes
> - Composant AI briefing streaming (skeleton → texte progressif)
> - Composant alertes bannière compacte avec liens
> - Composant quick actions manager
> - Composant KPIs commerciaux (conversion, panier moyen, prévision CA)
> - Composant répartition produits (pie chart)
> - Composant feed d'activité temps réel
> - Backend : implémentation réelle des 3 endpoints stub
>
> **Estimated Effort**: Large
> **Parallel Execution**: YES - 3 waves
> **Critical Path**: Task 1 (backend endpoints) → Task 4 (KPIs commerciaux) + Task 5 (répartition produits) → Task 8 (page assembly)

---

## Context

### Original Request
Redesigner la home page du CRM en s'inspirant de l'expérience "Good morning" d'Attio.com — transformer un dashboard passif en cockpit décisionnel quotidien pour managers.

### Interview Summary
**Key Discussions**:
- **Utilisateurs cibles** : Dirigeants/Managers — vision stratégique
- **Fréquence d'usage** : Quotidien (daily driver, ouvert chaque matin)
- **Pain points** : Dashboard pas actionnable, manque de vue d'ensemble, pas personnalisé
- **Zone 1 (Briefing)** : IA streaming + alertes compactes bannière + quick actions essentielles
- **Zone 2 (Overview)** : KPIs existants conservés + KPIs commerciaux + répartition produits
- **Zone 3 (Feed)** : Notifications temps réel WebSocket — pas de classement commerciaux
- **AI UX** : Skeleton + streaming (comme ChatGPT)
- **Alertes** : Bannière compacte + lien vers liste filtrée
- **Quick actions** : "Nouveau contrat", "Voir impayés", "Relancer client", "Exporter rapport"
- **Classement commerciaux** : PAS sur la home (sensible)
- **Backend stubs** : Inclure l'implémentation backend dans le plan
- **AI service** : Existe (externe sur localhost:8000), on l'utilise

**Research Findings**:
- Backend expose 6 endpoints dashboard gRPC dont 3 sont des stubs (alertes, kpisCommerciaux, repartitionProduits)
- AI streaming déjà implémenté dans `ai-assistant-store.ts` (SSE + ReadableStream)
- WebSocket notifications déjà en place dans `notification-context.tsx` (Socket.io)
- User store contient prenom, nom, role, preferences (dont dashboard.widgets)
- `page.tsx` actuel est un Server Component (pattern à préserver)
- `lib/server/data.ts` fetch en parallèle via Promise.all (pattern à étendre)
- Filtres dashboard non exploités : societe_id, produit_id, canal, periode_rapide

### Metis Review
**Identified Gaps** (addressed):
- **Backend stubs** : Endpoints retournent des données vides → inclus dans le plan (Tasks 1)
- **AI backend externe** : Pas dans les microservices → confirmé existant, on l'utilise avec un prompt briefing
- **AiAssistantFab duplication** : FAB dans page.tsx + FloatingAiChat dans layout → on retire le FAB de page.tsx
- **utilisateur.prenom nullable** : Fallback vers email si vide
- **Alert overflow** : Cap à 5 alertes visibles + lien "Voir tout"
- **Tab sleep stale data** : Refetch via visibilitychange event
- **Zone error isolation** : Chaque zone gère ses erreurs indépendamment

---

## Work Objectives

### Core Objective
Transformer la home page en cockpit manager quotidien qui répond à "Qu'est-ce que je dois faire MAINTENANT ?" via un briefing IA contextuel, des alertes actionnables et une vue d'ensemble enrichie.

### Concrete Deliverables
- `frontend/src/app/(main)/page.tsx` — refonte du layout 3 zones (Server Component)
- `frontend/src/components/dashboard/greeting-briefing.tsx` — Zone 1 : greeting + AI briefing streaming
- `frontend/src/components/dashboard/alert-banners.tsx` — Zone 1 : bannières d'alertes compactes
- `frontend/src/components/dashboard/quick-actions.tsx` — Zone 1 : raccourcis manager
- `frontend/src/components/dashboard/commercial-kpis.tsx` — Zone 2 : KPIs commerciaux
- `frontend/src/components/dashboard/product-distribution.tsx` — Zone 2 : camembert répartition produits
- `frontend/src/components/dashboard/activity-feed.tsx` — Zone 3 : feed temps réel
- `frontend/src/lib/server/data.ts` — extension pour fetch des 3 nouveaux endpoints
- Backend service-commercial : implémentation `GetKpisCommerciaux` et `GetRepartitionProduits`
- Backend service-core ou service-finance : implémentation `GetAlertes`

### Definition of Done
- [ ] La home page affiche les 3 zones avec données réelles
- [ ] Le briefing IA stream du texte en temps réel avec skeleton initial
- [ ] Les alertes critiques apparaissent en bannière cliquable
- [ ] Les quick actions naviguent vers les pages correctes
- [ ] Les KPIs commerciaux (conversion, panier moyen, prévision CA) affichent des données
- [ ] Le camembert produits affiche la répartition CA
- [ ] Le feed d'activité affiche les notifications WebSocket
- [ ] Chaque zone gère ses erreurs/loading/empty states indépendamment
- [ ] La page reste un Server Component (pas de "use client" sur page.tsx)
- [ ] Mobile responsive : zones empilées verticalement sur <768px

### Must Have
- Greeting personnalisé avec prénom de l'utilisateur
- AI briefing streaming avec fallback si AI offline
- Alertes bannière compactes cliquables avec navigation
- Quick actions : 4 boutons raccourcis minimum
- KPIs commerciaux avec valeurs réelles du backend
- Feed d'activité temps réel via WebSocket existant
- Error isolation par zone (une zone qui crash ne casse pas les autres)
- Skeleton loading states pour chaque zone

### Must NOT Have (Guardrails)
- ❌ NE PAS convertir page.tsx en "use client" — doit rester Server Component
- ❌ NE PAS créer de nouveaux React Context providers — utiliser Zustand ou contextes existants
- ❌ NE PAS construire de drag-and-drop widget builder — layout hardcodé v1
- ❌ NE PAS ajouter de filtrage/recherche dans le feed — liste chronologique simple
- ❌ NE PAS créer de nouvelle connexion WebSocket — réutiliser NotificationProvider
- ❌ NE PAS afficher le classement des commerciaux sur la home
- ❌ NE PAS cloner pixel-perfect le design d'Attio — s'inspirer du concept, pas du visuel
- ❌ NE PAS ajouter d'animations complexes (typing cursor, fade-in par mot)
- ❌ NE PAS dupliquer l'AiAssistantFab — FloatingAiChat est déjà dans le layout

---

## Verification Strategy (MANDATORY)

> **UNIVERSAL RULE: ZERO HUMAN INTERVENTION**
>
> ALL tasks in this plan MUST be verifiable WITHOUT any human action.
> This is NOT conditional — it applies to EVERY task, regardless of test strategy.
>
> **FORBIDDEN** — acceptance criteria that require:
> - "User manually tests..." / "User visually confirms..."
> - ANY step where a human must perform an action
>
> **ALL verification is executed by the agent** using tools (Playwright, Bash, curl, etc.).

### Test Decision
- **Infrastructure exists**: YES (Biome linting, TypeScript strict)
- **Automated tests**: Tests-after (unit tests pour hooks/utilitaires critiques)
- **Framework**: vitest ou bun test (à confirmer selon config existante)

### Agent-Executed QA Scenarios (MANDATORY — ALL tasks)

Chaque task inclut des scénarios Playwright et/ou curl pour vérification automatique.

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Start Immediately):
├── Task 1: Backend — Implémenter les 3 endpoints stub
├── Task 2: Frontend — Composant greeting-briefing (AI streaming)
└── Task 3: Frontend — Composant alert-banners + quick-actions

Wave 2 (After Wave 1):
├── Task 4: Frontend — Composant commercial-kpis (depends: Task 1 backend)
├── Task 5: Frontend — Composant product-distribution (depends: Task 1 backend)
└── Task 6: Frontend — Composant activity-feed (no backend dependency)

Wave 3 (After Wave 2):
└── Task 7: Frontend — Assemblage page.tsx + data.ts + integration tests
```

### Dependency Matrix

| Task | Depends On | Blocks | Can Parallelize With |
|------|------------|--------|---------------------|
| 1 | None | 4, 5, 7 | 2, 3 |
| 2 | None | 7 | 1, 3 |
| 3 | None | 7 | 1, 2 |
| 4 | 1 | 7 | 5, 6 |
| 5 | 1 | 7 | 4, 6 |
| 6 | None | 7 | 4, 5 |
| 7 | 2, 3, 4, 5, 6 | None | None (final assembly) |

### Agent Dispatch Summary

| Wave | Tasks | Recommended Agents |
|------|-------|-------------------|
| 1 | 1, 2, 3 | Task 1: category=unspecified-high (backend DDD). Tasks 2, 3: category=visual-engineering |
| 2 | 4, 5, 6 | category=visual-engineering, parallel dispatch |
| 3 | 7 | category=visual-engineering (assembly + QA) |

---

## TODOs

- [ ] 1. Backend — Implémenter les 3 endpoints dashboard stub

  **What to do**:
  - Implémenter `GetAlertes` dans le service approprié (service-finance ou service-core) :
    - Requêter les contrats expirant dans les 7/30 prochains jours
    - Requêter le taux d'impayés et détecter si > seuil (configurable, défaut 10%)
    - Requêter le taux de churn et détecter si anormal (vs mois précédent)
    - Retourner des `Alerte { niveau: 'critique'|'avertissement'|'info', type, message, nombre, lien_url }`
  - Implémenter `GetKpisCommerciaux` dans service-commercial :
    - Calculer `taux_conversion` : contrats signés / contrats créés sur la période
    - Calculer `panier_moyen` : CA total / nombre de contrats sur la période
    - Calculer `ca_previsionnel_3_mois` : projection basée sur tendance des 3 derniers mois
    - Calculer `nouveaux_clients_mois` : count clients créés ce mois
  - Implémenter `GetRepartitionProduits` dans service-commercial :
    - Agréger le CA par produit/gamme sur la période
    - Retourner `{ produit_id, nom_produit, ca, pourcentage, couleur }`
    - Calculer `ca_total`
  - Respecter les proto definitions existantes dans `packages/proto/src/dashboard/dashboard.proto`
  - Respecter le pattern DDD : Controller → Application Service → Repository query

  **Must NOT do**:
  - Ne pas modifier les proto definitions (les messages sont déjà définis)
  - Ne pas créer de nouveaux modules — utiliser les modules existants dans chaque service
  - Ne pas hardcoder de seuils d'alerte — les rendre configurables

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Backend DDD avec queries SQL complexes, cross-service, nécessite compréhension du domain model
  - **Skills**: [`microservice-maintainer`]
    - `microservice-maintainer`: Implémentation dans services existants, respecte les conventions DDD du projet

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 2, 3)
  - **Blocks**: Tasks 4, 5, 7
  - **Blocked By**: None

  **References**:

  **Pattern References** (existing code to follow):
  - `services/service-commercial/src/modules/dashboard/` — Module dashboard existant avec controllers stub
  - `services/service-commercial/src/modules/dashboard/application/controllers/kpis-commerciaux.controller.ts` — Stub à implémenter
  - `services/service-commercial/src/modules/dashboard/application/controllers/repartition-produits.controller.ts` — Stub à implémenter
  - `services/service-commercial/src/modules/dashboard/application/controllers/alertes.controller.ts` — Stub à implémenter (ou service-finance selon l'emplacement)
  - `services/service-commercial/src/modules/contrats/` — Entités Contrat, StatutContrat pour les requêtes
  - `services/service-finance/src/modules/factures/` — Entités Facture pour calcul impayés

  **API/Type References** (contracts to implement against):
  - `packages/proto/src/dashboard/dashboard.proto` — Messages AlertesResponse, KpisCommerciauxResponse, RepartitionProduitsResponse
  - `packages/proto/src/dashboard/dashboard.proto` — DashboardFilters message (organisation_id, societe_id, dates, etc.)

  **Documentation References**:
  - `packages/shared-kernel/` — Base classes DDD (AggregateRoot, ValueObject, Repository patterns)

  **Acceptance Criteria**:

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: GetAlertes returns real alert data
    Tool: Bash (grpcurl or curl)
    Preconditions: Backend service running, database seeded with contracts/invoices
    Steps:
      1. Call GetAlertes gRPC endpoint with valid organisation_id
      2. Assert: response.alertes is array with length > 0 (or 0 if no alerts conditions met)
      3. Assert: each alerte has niveau ('critique', 'avertissement', or 'info')
      4. Assert: each alerte has type, message, nombre fields populated
      5. If contracts expiring within 7 days exist: assert alerte of type contrats_expirant present
    Expected Result: Structured alert data based on real business conditions
    Evidence: Response body captured

  Scenario: GetKpisCommerciaux returns computed metrics
    Tool: Bash (grpcurl or curl)
    Preconditions: Backend service running, contracts and clients in database
    Steps:
      1. Call GetKpisCommerciaux with valid organisation_id and date range
      2. Assert: response.taux_conversion is number between 0 and 100
      3. Assert: response.panier_moyen is number >= 0
      4. Assert: response.ca_previsionnel_3_mois is number >= 0
      5. Assert: response.nouveaux_clients_mois is integer >= 0
    Expected Result: All commercial KPI fields populated with computed values
    Evidence: Response body captured

  Scenario: GetRepartitionProduits returns product breakdown
    Tool: Bash (grpcurl or curl)
    Preconditions: Backend service running, products with contracts in database
    Steps:
      1. Call GetRepartitionProduits with valid organisation_id
      2. Assert: response.produits is array
      3. Assert: response.ca_total >= 0
      4. Assert: sum of produits[].pourcentage ~= 100 (if produits.length > 0)
      5. Assert: each produit has nom_produit, ca, pourcentage fields
    Expected Result: Product distribution with percentages summing to ~100%
    Evidence: Response body captured
  ```

  **Commit**: YES
  - Message: `feat(dashboard): implement GetAlertes, GetKpisCommerciaux, GetRepartitionProduits endpoints`
  - Files: `services/service-commercial/src/modules/dashboard/**`
  - Pre-commit: `bun run build` in service-commercial

---

- [ ] 2. Frontend — Composant Greeting + AI Briefing Streaming

  **What to do**:
  - Créer `frontend/src/components/dashboard/greeting-briefing.tsx` (Client Component "use client")
  - Section greeting : "Bonjour {prenom}" avec heure contextuelle (Bon matin / Bonjour / Bonsoir)
    - Utiliser `useOrganisation()` pour obtenir `utilisateur.prenom`
    - Fallback : si prenom est vide, utiliser le prénom extrait de l'email ou "Bonjour"
  - Section AI briefing :
    - Au mount, envoyer une requête SSE à `${BACKEND_API_URL}/ai/generate` avec un prompt briefing
    - Le prompt doit contenir le contexte : KPIs actuels, alertes, données clés (passés en props depuis le Server Component)
    - Afficher un skeleton loader (3 lignes shimmer) pendant le chargement
    - Stream le texte token par token avec rendu markdown (pattern `ai-assistant-store.ts`)
    - Timeout de 10 secondes : si pas de réponse, afficher un briefing template statique construit à partir des données KPI
    - Si AI health = offline (via `useAiHealth()`), afficher directement le briefing template
  - Briefing template fallback : "Aujourd'hui : {contratsActifs} contrats actifs, MRR à {mrr}€, {alertCount} alertes à traiter"
  - Bouton "Rafraîchir le briefing" discret (icône refresh)
  - Gérer le cas visibilitychange : quand l'onglet redevient actif, proposer de rafraîchir si > 30min

  **Must NOT do**:
  - Ne pas créer un nouveau store Zustand pour le briefing — state local suffit (useState + useRef)
  - Ne pas créer une nouvelle connexion WebSocket — l'AI streaming utilise fetch SSE
  - Ne pas ajouter de cursor typing animation
  - Ne pas dupliquer le code de streaming — extraire un hook réutilisable si nécessaire

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: Composant UI riche avec streaming, skeleton, markdown rendering, responsive
  - **Skills**: [`frontend-ui-ux`]
    - `frontend-ui-ux`: Design soigné du greeting + briefing, skeleton animations, responsive layout

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 3)
  - **Blocks**: Task 7
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `frontend/src/stores/ai-assistant-store.ts:97-154` — Pattern SSE streaming avec ReadableStream et TextDecoder
  - `frontend/src/components/floating-ai-chat.tsx` — Composant chat avec rendu markdown streaming
  - `frontend/src/components/dashboard-kpis.tsx:62-96` — Pattern server/client data fetching hybrid (initialData + fallback)
  - `frontend/src/contexts/ai-health-context.tsx` — Hook `useAiHealth()` pour vérifier si l'AI est en ligne

  **API/Type References**:
  - `frontend/src/stores/ai-assistant-store.ts` — Interface du endpoint AI : `POST /ai/generate` avec body `{ message, session_id }`, réponse SSE `data: { token, is_final }`
  - `frontend/src/contexts/organisation-context.tsx` — `useOrganisation()` retourne `{ user: { utilisateur: { prenom, nom, email } } }`

  **External References**:
  - Shadcn UI Skeleton : composant existant dans `frontend/src/components/ui/skeleton.tsx`

  **Acceptance Criteria**:

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: Greeting displays user first name
    Tool: Playwright (playwright skill)
    Preconditions: Dev server running on localhost:3000, user logged in
    Steps:
      1. Navigate to: http://localhost:3000
      2. Wait for: [data-testid="greeting-text"] visible (timeout: 5s)
      3. Assert: text matches pattern /^(Bon matin|Bonjour|Bonsoir),?\s+\w+/
      4. Screenshot: .sisyphus/evidence/task-2-greeting.png
    Expected Result: Personalized greeting with user's first name
    Evidence: .sisyphus/evidence/task-2-greeting.png

  Scenario: AI briefing shows skeleton then streams text
    Tool: Playwright (playwright skill)
    Preconditions: Dev server running, AI service running on localhost:8000
    Steps:
      1. Navigate to: http://localhost:3000
      2. Wait for: [data-testid="briefing-skeleton"] visible (timeout: 2s)
      3. Wait for: [data-testid="briefing-text"] visible (timeout: 15s)
      4. Assert: [data-testid="briefing-text"] text length > 20 characters
      5. Screenshot: .sisyphus/evidence/task-2-briefing-streaming.png
    Expected Result: Skeleton appears first, then text streams in progressively
    Evidence: .sisyphus/evidence/task-2-briefing-streaming.png

  Scenario: AI offline shows template fallback
    Tool: Playwright (playwright skill)
    Preconditions: Dev server running, AI service NOT running (offline)
    Steps:
      1. Navigate to: http://localhost:3000
      2. Wait for: [data-testid="briefing-fallback"] visible (timeout: 12s)
      3. Assert: [data-testid="briefing-fallback"] text contains "contrat" or "MRR"
      4. Assert: no error/crash in console
      5. Screenshot: .sisyphus/evidence/task-2-briefing-fallback.png
    Expected Result: Static template briefing rendered cleanly without errors
    Evidence: .sisyphus/evidence/task-2-briefing-fallback.png
  ```

  **Commit**: YES
  - Message: `feat(dashboard): add AI-powered greeting and daily briefing component`
  - Files: `frontend/src/components/dashboard/greeting-briefing.tsx`
  - Pre-commit: `bun run typecheck` in frontend

---

- [ ] 3. Frontend — Composants Alert Banners + Quick Actions

  **What to do**:
  - Créer `frontend/src/components/dashboard/alert-banners.tsx` (Client Component) :
    - Accepte `initialAlertes` props (server-side fetched)
    - Affiche max 5 alertes en bannières compactes horizontales
    - Chaque bannière : icône gravité (🔴 critique, 🟠 avertissement, 🔵 info) + message court + lien
    - Bannière critique : fond rouge léger, texte bold
    - Bannière avertissement : fond orange léger
    - Bannière info : fond bleu léger
    - Si > 5 alertes : lien "Voir les {total} alertes" en bas
    - Si 0 alertes : afficher un message positif discret "Aucune alerte — tout va bien ✓"
    - Le lien de chaque alerte navigue vers la page filtrée (ex: `/contrats?statut=expirant` ou `/facturation?statut=impaye`)
    - Utiliser les variant colors de Shadcn (destructive, warning, default)
  - Créer `frontend/src/components/dashboard/quick-actions.tsx` (Client Component) :
    - Grille de 4 boutons raccourcis avec icônes Lucide :
      - "Nouveau contrat" (Plus icon) → `/contrats/nouveau` ou ouvrir dialog
      - "Voir impayés" (AlertTriangle icon) → `/facturation?statut=impaye`
      - "Relancer client" (Mail icon) → ouvrir email composer dialog
      - "Exporter rapport" (Download icon) → trigger export CSV des KPIs
    - Layout : flex row, gap-3, boutons style outline avec hover effect
    - Responsive : 2x2 grid sur mobile, 4 inline sur desktop

  **Must NOT do**:
  - Ne pas créer de bannière dismissable (pas de logique de "fermer l'alerte" — les alertes reflètent l'état réel)
  - Ne pas construire un système de routing complexe pour les liens d'alertes — liens statiques suffisent
  - Ne pas surcharger les quick actions (4 max, pas plus)

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: Composants UI purs avec design soigné, couleurs conditionnelles, responsive grid
  - **Skills**: [`frontend-ui-ux`]
    - `frontend-ui-ux`: Alertes visuellement claires, quick actions accessibles, bon usage des couleurs

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 2)
  - **Blocks**: Task 7
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `frontend/src/components/dashboard-kpis.tsx:62-96` — Pattern initialData + client fallback
  - `frontend/src/components/ui/alert.tsx` — Composant Alert Shadcn existant (si disponible)
  - `frontend/src/components/ui/button.tsx` — Boutons Shadcn avec variants

  **API/Type References**:
  - `packages/proto/src/dashboard/dashboard.proto` — Message Alerte { niveau, type, message, nombre, lien_url }
  - `frontend/src/actions/dashboard.ts` — `getAlertes(filters)` server action

  **Acceptance Criteria**:

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: Alert banners render with severity colors
    Tool: Playwright (playwright skill)
    Preconditions: Dev server running, backend returning alerts (or mock data)
    Steps:
      1. Navigate to: http://localhost:3000
      2. Wait for: [data-testid="alert-banners"] visible (timeout: 5s)
      3. If alerts exist: assert [data-testid="alert-banner"] count >= 1 and <= 5
      4. Assert: critique alerts have class containing "destructive" or red styling
      5. Screenshot: .sisyphus/evidence/task-3-alerts.png
    Expected Result: Color-coded alert banners or positive "no alerts" message
    Evidence: .sisyphus/evidence/task-3-alerts.png

  Scenario: Alert banner link navigates correctly
    Tool: Playwright (playwright skill)
    Preconditions: Dev server running, at least 1 alert present
    Steps:
      1. Navigate to: http://localhost:3000
      2. Click: first [data-testid="alert-banner"] a link
      3. Assert: URL changed to expected filtered page (contains query params)
      4. Screenshot: .sisyphus/evidence/task-3-alert-nav.png
    Expected Result: Navigation to filtered list page
    Evidence: .sisyphus/evidence/task-3-alert-nav.png

  Scenario: Quick actions render 4 buttons
    Tool: Playwright (playwright skill)
    Preconditions: Dev server running
    Steps:
      1. Navigate to: http://localhost:3000
      2. Wait for: [data-testid="quick-actions"] visible (timeout: 5s)
      3. Assert: [data-testid="quick-action-btn"] count = 4
      4. Assert: button texts include "Nouveau contrat", "Voir impayés"
      5. Click: "Voir impayés" button
      6. Assert: URL contains "/facturation"
      7. Screenshot: .sisyphus/evidence/task-3-quick-actions.png
    Expected Result: 4 functional quick action buttons
    Evidence: .sisyphus/evidence/task-3-quick-actions.png

  Scenario: Mobile responsive layout
    Tool: Playwright (playwright skill)
    Preconditions: Dev server running
    Steps:
      1. Set viewport: 375x812
      2. Navigate to: http://localhost:3000
      3. Assert: quick action buttons in 2x2 grid (check CSS grid-template-columns)
      4. Assert: alert banners stack vertically
      5. Screenshot: .sisyphus/evidence/task-3-mobile.png
    Expected Result: Responsive grid on mobile
    Evidence: .sisyphus/evidence/task-3-mobile.png
  ```

  **Commit**: YES
  - Message: `feat(dashboard): add alert banners and quick actions components`
  - Files: `frontend/src/components/dashboard/alert-banners.tsx`, `frontend/src/components/dashboard/quick-actions.tsx`
  - Pre-commit: `bun run typecheck` in frontend

---

- [ ] 4. Frontend — Composant KPIs Commerciaux

  **What to do**:
  - Créer `frontend/src/components/dashboard/commercial-kpis.tsx` (Client Component) :
    - Même pattern que `dashboard-kpis.tsx` : accepte `initialData`, fallback client-side
    - Afficher 3 KPI cards supplémentaires :
      - **Taux de conversion** : pourcentage avec icône TrendingUp, trend indicator
      - **Panier moyen** : montant EUR avec icône ShoppingCart
      - **Prévision CA 3 mois** : montant EUR avec icône Target, couleur selon atteinte objectif
    - Cards style cohérent avec `dashboard-kpis.tsx` existant (même taille, même typo, mêmes couleurs trend)
    - Layout : flex row, 3 cards, responsive stack sur mobile
    - Loading state : skeleton cards (même dimensions que les cards finales)
    - Error state : message discret "Données commerciales indisponibles" avec retry button
    - Empty state : cards avec valeurs "—" et tooltip "Aucune donnée pour cette période"

  **Must NOT do**:
  - Ne pas dupliquer le code de `dashboard-kpis.tsx` — factoriser si possible (créer un composant KpiCard réutilisable)
  - Ne pas afficher de classement commerciaux (exclu du scope)
  - Ne pas créer un nouveau server action — utiliser `getKpisCommerciaux()` existant

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: Composant UI de data visualization, cohérence design avec composants existants
  - **Skills**: [`frontend-ui-ux`]
    - `frontend-ui-ux`: Cohérence visuelle avec les KPI cards existants

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 5, 6)
  - **Blocks**: Task 7
  - **Blocked By**: Task 1 (backend endpoints needed)

  **References**:

  **Pattern References**:
  - `frontend/src/components/dashboard-kpis.tsx` — Pattern complet à reproduire (initialData, skeleton, error, trend indicators)
  - `frontend/src/actions/dashboard.ts` — `getKpisCommerciaux(filters)` server action existant

  **API/Type References**:
  - `packages/proto/src/dashboard/dashboard.proto` — KpisCommerciauxResponse { taux_conversion, panier_moyen, ca_previsionnel_3_mois, nouveaux_clients_mois }

  **Acceptance Criteria**:

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: Commercial KPIs display real data
    Tool: Playwright (playwright skill)
    Preconditions: Dev server + backend running with data
    Steps:
      1. Navigate to: http://localhost:3000
      2. Wait for: [data-testid="commercial-kpis"] visible (timeout: 8s)
      3. Assert: [data-testid="kpi-conversion"] contains a number or "—"
      4. Assert: [data-testid="kpi-panier-moyen"] contains a number or "—"
      5. Assert: [data-testid="kpi-prevision-ca"] contains a number or "—"
      6. Screenshot: .sisyphus/evidence/task-4-commercial-kpis.png
    Expected Result: 3 commercial KPI cards with data or graceful empty state
    Evidence: .sisyphus/evidence/task-4-commercial-kpis.png

  Scenario: Commercial KPIs handle backend error
    Tool: Playwright (playwright skill)
    Preconditions: Dev server running, backend KPIs endpoint returning error
    Steps:
      1. Navigate to: http://localhost:3000
      2. Wait for: [data-testid="commercial-kpis"] visible (timeout: 8s)
      3. Assert: error message or "—" values shown (no crash)
      4. Assert: other zones (greeting, alerts) still render correctly
      5. Screenshot: .sisyphus/evidence/task-4-kpis-error.png
    Expected Result: Graceful error isolation — other zones unaffected
    Evidence: .sisyphus/evidence/task-4-kpis-error.png
  ```

  **Commit**: YES (groups with 5)
  - Message: `feat(dashboard): add commercial KPIs and product distribution widgets`
  - Files: `frontend/src/components/dashboard/commercial-kpis.tsx`, `frontend/src/components/dashboard/product-distribution.tsx`
  - Pre-commit: `bun run typecheck` in frontend

---

- [ ] 5. Frontend — Composant Répartition Produits (Pie Chart)

  **What to do**:
  - Créer `frontend/src/components/dashboard/product-distribution.tsx` (Client Component) :
    - Même pattern que `contrats-card.tsx` : initialData, client fallback, chart
    - Pie/Donut chart Recharts montrant le CA par produit
    - Légende avec nom produit + montant + pourcentage
    - Couleurs cycliques cohérentes (même palette que contrats-card)
    - Loading state : skeleton cercle
    - Empty state : "Aucun produit avec CA sur cette période"
    - Optionnel : tooltip au hover avec détails produit
  - Le composant doit être compact (pas full-width, s'intègre dans la grille Zone 2)

  **Must NOT do**:
  - Ne pas ajouter de filtres dans ce composant — les filtres globaux viendront en v2
  - Ne pas ajouter d'export CSV ici — c'est dans les quick actions

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: Data visualization Recharts, design cohérent
  - **Skills**: [`frontend-ui-ux`]
    - `frontend-ui-ux`: Pie chart lisible, couleurs harmonieuses

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 4, 6)
  - **Blocks**: Task 7
  - **Blocked By**: Task 1

  **References**:

  **Pattern References**:
  - `frontend/src/components/contrats-card.tsx` — Pattern Recharts PieChart existant (couleurs, légende, tooltip)
  - `frontend/src/actions/dashboard.ts` — `getRepartitionProduits(filters)` server action existant

  **API/Type References**:
  - `packages/proto/src/dashboard/dashboard.proto` — RepartitionProduitsResponse { ca_total, produits[] { produit_id, nom_produit, ca, pourcentage, couleur } }

  **Acceptance Criteria**:

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: Product distribution chart renders
    Tool: Playwright (playwright skill)
    Preconditions: Dev server + backend running with product data
    Steps:
      1. Navigate to: http://localhost:3000
      2. Wait for: [data-testid="product-distribution"] visible (timeout: 8s)
      3. Assert: SVG element present inside component (Recharts renders SVG)
      4. Assert: legend items present with product names
      5. Screenshot: .sisyphus/evidence/task-5-product-chart.png
    Expected Result: Donut/pie chart with product breakdown
    Evidence: .sisyphus/evidence/task-5-product-chart.png
  ```

  **Commit**: YES (groups with 4)
  - Message: `feat(dashboard): add commercial KPIs and product distribution widgets`
  - Files: `frontend/src/components/dashboard/product-distribution.tsx`

---

- [ ] 6. Frontend — Composant Activity Feed temps réel

  **What to do**:
  - Créer `frontend/src/components/dashboard/activity-feed.tsx` (Client Component) :
    - Consommer `useNotifications()` du `notification-context.tsx` existant
    - Afficher les 10 dernières notifications en liste chronologique (plus récent en haut)
    - Chaque item : icône type (client, contrat, impayé, expédition) + message + timestamp relatif (il y a 5min)
    - Icônes par type d'événement :
      - `client:new` → UserPlus (vert)
      - `contrat:new` → FileText (bleu)
      - `contrat:expiring-soon` → Clock (orange)
      - `client:impaye` → AlertTriangle (rouge)
      - Défaut → Bell (gris)
    - Mise à jour temps réel : quand `notification:new` arrive via WebSocket, l'ajouter en haut de la liste avec animation slide-in
    - Si WebSocket déconnecté (`isConnected === false`) : afficher badge "Hors ligne" discret
    - Empty state : "Aucune activité récente" avec illustration
    - Lien "Voir toutes les notifications" en bas → page notifications si elle existe
    - Scroll interne si > 10 items (max-height avec overflow-y-auto)

  **Must NOT do**:
  - Ne pas créer une nouvelle connexion WebSocket — utiliser uniquement `useNotifications()` du contexte existant
  - Ne pas ajouter de filtrage par type (v2)
  - Ne pas marquer les notifications comme lues depuis le feed (on ne fait que les afficher)

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: Composant UI avec animations, temps réel, état de connexion
  - **Skills**: [`frontend-ui-ux`]
    - `frontend-ui-ux`: Feed design, animations subtiles, états de connexion visuels

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 4, 5)
  - **Blocks**: Task 7
  - **Blocked By**: None (utilise l'infra WebSocket existante)

  **References**:

  **Pattern References**:
  - `frontend/src/contexts/notification-context.tsx:162-207` — Événements WebSocket disponibles et pattern de consommation
  - `frontend/src/components/site-header.tsx` — Pattern d'affichage des notifications dans le header (à adapter)

  **API/Type References**:
  - `frontend/src/contexts/notification-context.tsx` — Interface Notification { id, type, titre, message, lu, metadata, lienUrl, createdAt }
  - `frontend/src/contexts/notification-context.tsx` — `useNotifications()` retourne { notifications, unreadCount, isConnected }

  **Acceptance Criteria**:

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: Activity feed renders notifications
    Tool: Playwright (playwright skill)
    Preconditions: Dev server running, user logged in with notifications
    Steps:
      1. Navigate to: http://localhost:3000
      2. Wait for: [data-testid="activity-feed"] visible (timeout: 5s)
      3. Assert: feed items present OR empty state message visible
      4. If items present: assert each item has icon, message, timestamp
      5. Screenshot: .sisyphus/evidence/task-6-activity-feed.png
    Expected Result: Chronological notification list or empty state
    Evidence: .sisyphus/evidence/task-6-activity-feed.png

  Scenario: Feed updates in real-time on new notification
    Tool: Playwright (playwright skill)
    Preconditions: Dev server running, WebSocket connected
    Steps:
      1. Navigate to: http://localhost:3000
      2. Count initial feed items: store as N
      3. Trigger a business event (create client or contract via API)
      4. Wait for: feed item count > N (timeout: 5s)
      5. Assert: new item appears at top of list
      6. Screenshot: .sisyphus/evidence/task-6-feed-realtime.png
    Expected Result: New notification appears without page refresh
    Evidence: .sisyphus/evidence/task-6-feed-realtime.png
  ```

  **Commit**: YES
  - Message: `feat(dashboard): add real-time activity feed component`
  - Files: `frontend/src/components/dashboard/activity-feed.tsx`
  - Pre-commit: `bun run typecheck` in frontend

---

- [ ] 7. Frontend — Assemblage Page + Data Fetching + Tests E2E

  **What to do**:
  - Refactorer `frontend/src/app/(main)/page.tsx` :
    - Garder comme Server Component (PAS de "use client")
    - Étendre `getServerDashboardData()` dans `lib/server/data.ts` pour fetch en parallèle :
      - getServerDashboardKpis (existant)
      - getServerEvolutionCa (existant)
      - getServerStatsSocietes (existant)
      - getServerAlertes (NOUVEAU)
      - getServerKpisCommerciaux (NOUVEAU)
      - getServerRepartitionProduits (NOUVEAU)
    - Nouveau layout 3 zones :
      ```
      <main>
        <!-- Zone 1: Briefing -->
        <section data-testid="zone-briefing" className="space-y-4">
          <GreetingBriefing initialKpis={kpis} initialAlertes={alertes} />
          <AlertBanners initialAlertes={alertes} />
          <QuickActions />
        </section>

        <!-- Zone 2: Overview (grid 2 colonnes) -->
        <section data-testid="zone-overview" className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <DashboardKPIs initialData={kpis} />
          <CommercialKpis initialData={kpisCommerciaux} />
          <ChartAreaInteractive initialData={evolutionCa} />
          <ProductDistribution initialData={repartitionProduits} />
        </section>

        <!-- Zone 3: Activity -->
        <section data-testid="zone-activity">
          <ActivityFeed />
        </section>
      </main>
      ```
    - Retirer l'import `AiAssistantFab` de page.tsx (FloatingAiChat est dans layout.tsx)
    - Ajouter les 3 fonctions server-side dans `lib/server/data.ts` : getServerAlertes, getServerKpisCommerciaux, getServerRepartitionProduits
    - Gérer les erreurs indépendamment : si un fetch échoue, passer `null` au composant (le composant gère son propre error state)
    - Ajouter visibilitychange listener dans un composant wrapper pour proposer le refresh après 30min d'inactivité

  - Vérifier en profondeur :
    - Utiliser `lsp_find_references` sur `DashboardKPIs`, `ChartAreaInteractive`, `ContratsCard` pour s'assurer qu'aucune autre page ne les utilise
    - Conserver `ContratsCard` dans la grille Zone 2 OU le retirer si redondant avec ProductDistribution (évaluer)

  **Must NOT do**:
  - Ne pas ajouter "use client" à page.tsx
  - Ne pas créer de nouveau provider/context
  - Ne pas casser les composants existants (DashboardKPIs, ChartAreaInteractive) — ils gardent leur API
  - Ne pas supprimer ContratsCard sans vérifier qu'il n'est pas utilisé ailleurs

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: Assemblage final, layout responsive, coordination des composants, tests E2E
  - **Skills**: [`frontend-ui-ux`, `playwright`]
    - `frontend-ui-ux`: Layout cohérent, responsive design, coordination visuelle
    - `playwright`: Tests E2E de la page complète assemblée

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 3 (sequential, final)
  - **Blocks**: None (final task)
  - **Blocked By**: Tasks 2, 3, 4, 5, 6

  **References**:

  **Pattern References**:
  - `frontend/src/app/(main)/page.tsx` — Page actuelle à refactorer (Server Component pattern)
  - `frontend/src/lib/server/data.ts` — Fonctions getServer* existantes avec Promise.all
  - `frontend/src/app/(main)/layout.tsx` — Layout parent avec providers (FloatingAiChat, NotificationProvider)

  **API/Type References**:
  - `frontend/src/actions/dashboard.ts` — Toutes les server actions disponibles

  **Tool References**:
  - `lsp_find_references` sur les composants existants avant modification
  - `ast_grep_search` pour trouver tous les imports de dashboard components

  **Acceptance Criteria**:

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: Full page loads with all 3 zones
    Tool: Playwright (playwright skill)
    Preconditions: Dev server + backend + AI service running
    Steps:
      1. Navigate to: http://localhost:3000
      2. Wait for: [data-testid="zone-briefing"] visible (timeout: 10s)
      3. Wait for: [data-testid="zone-overview"] visible (timeout: 10s)
      4. Wait for: [data-testid="zone-activity"] visible (timeout: 10s)
      5. Assert: no JavaScript errors in console
      6. Screenshot: .sisyphus/evidence/task-7-full-page.png
    Expected Result: All 3 zones visible and functional
    Evidence: .sisyphus/evidence/task-7-full-page.png

  Scenario: Page loads in under 3 seconds
    Tool: Playwright (playwright skill)
    Preconditions: Dev server running
    Steps:
      1. Measure navigation start time
      2. Navigate to: http://localhost:3000
      3. Wait for: [data-testid="zone-overview"] visible
      4. Measure LCP time
      5. Assert: LCP < 3000ms
    Expected Result: Page LCP under 3 seconds
    Evidence: Performance metrics logged

  Scenario: Zone error isolation — one zone fails, others work
    Tool: Playwright (playwright skill)
    Preconditions: Dev server running, one backend endpoint intentionally down
    Steps:
      1. Navigate to: http://localhost:3000
      2. Assert: at least 2 of 3 zones render content (the failing zone shows error state)
      3. Assert: no full page crash or white screen
      4. Screenshot: .sisyphus/evidence/task-7-error-isolation.png
    Expected Result: Graceful degradation — broken zone shows error, others work
    Evidence: .sisyphus/evidence/task-7-error-isolation.png

  Scenario: Mobile responsive — zones stack vertically
    Tool: Playwright (playwright skill)
    Preconditions: Dev server running
    Steps:
      1. Set viewport: 375x812 (iPhone SE)
      2. Navigate to: http://localhost:3000
      3. Assert: [data-testid="zone-briefing"] width = viewport width
      4. Assert: [data-testid="zone-overview"] width = viewport width
      5. Assert: no horizontal scroll (document.scrollingElement.scrollWidth <= viewport width)
      6. Screenshot: .sisyphus/evidence/task-7-mobile.png
    Expected Result: All zones stack vertically, no horizontal overflow
    Evidence: .sisyphus/evidence/task-7-mobile.png

  Scenario: Dark mode renders correctly
    Tool: Playwright (playwright skill)
    Preconditions: Dev server running
    Steps:
      1. Navigate to: http://localhost:3000
      2. Execute: document.documentElement.classList.add('dark')
      3. Wait for: 500ms (CSS transition)
      4. Assert: no elements with white background on dark mode (spot check key zones)
      5. Screenshot: .sisyphus/evidence/task-7-dark-mode.png
    Expected Result: All zones render correctly in dark mode
    Evidence: .sisyphus/evidence/task-7-dark-mode.png

  Scenario: Page refreshes data on tab re-focus after 30min
    Tool: Playwright (playwright skill)
    Preconditions: Dev server running
    Steps:
      1. Navigate to: http://localhost:3000
      2. Store current KPI values
      3. Execute: manually dispatch visibilitychange (simulate 30min via mocking Date.now)
      4. Assert: refresh indicator or data re-fetch triggered
    Expected Result: Stale data detection and refresh mechanism works
    Evidence: Console logs captured
  ```

  **Commit**: YES
  - Message: `feat(dashboard): assemble intelligent 3-zone home page with server-side data fetching`
  - Files: `frontend/src/app/(main)/page.tsx`, `frontend/src/lib/server/data.ts`
  - Pre-commit: `bun run typecheck && bun run build` in frontend

---

## Commit Strategy

| After Task | Message | Files | Verification |
|------------|---------|-------|--------------|
| 1 | `feat(dashboard): implement GetAlertes, GetKpisCommerciaux, GetRepartitionProduits endpoints` | services/service-commercial/src/modules/dashboard/** | `bun run build` in service-commercial |
| 2 | `feat(dashboard): add AI-powered greeting and daily briefing component` | frontend/src/components/dashboard/greeting-briefing.tsx | `bun run typecheck` in frontend |
| 3 | `feat(dashboard): add alert banners and quick actions components` | frontend/src/components/dashboard/alert-banners.tsx, quick-actions.tsx | `bun run typecheck` in frontend |
| 4+5 | `feat(dashboard): add commercial KPIs and product distribution widgets` | frontend/src/components/dashboard/commercial-kpis.tsx, product-distribution.tsx | `bun run typecheck` in frontend |
| 6 | `feat(dashboard): add real-time activity feed component` | frontend/src/components/dashboard/activity-feed.tsx | `bun run typecheck` in frontend |
| 7 | `feat(dashboard): assemble intelligent 3-zone home page` | frontend/src/app/(main)/page.tsx, frontend/src/lib/server/data.ts | `bun run typecheck && bun run build` in frontend |

---

## Success Criteria

### Verification Commands
```bash
# Frontend typecheck
cd frontend && bun run typecheck  # Expected: no errors

# Frontend build
cd frontend && bun run build  # Expected: successful build

# Backend build
cd services/service-commercial && bun run build  # Expected: no errors

# Backend endpoints respond
grpcurl -plaintext localhost:50053 dashboard.AlertesService/GetAlertes  # Expected: JSON response
grpcurl -plaintext localhost:50053 dashboard.KpisCommerciauxService/GetKpisCommerciaux  # Expected: JSON response
grpcurl -plaintext localhost:50053 dashboard.RepartitionProduitsService/GetRepartitionProduits  # Expected: JSON response
```

### Final Checklist
- [ ] La home page affiche 3 zones distinctes (briefing, overview, activity)
- [ ] Le greeting affiche le prénom de l'utilisateur
- [ ] Le briefing IA stream du texte OU affiche un fallback template
- [ ] Les alertes apparaissent en bannières compactes colorées
- [ ] Les quick actions naviguent vers les bonnes pages
- [ ] Les 4 KPIs existants sont toujours visibles
- [ ] Les 3 KPIs commerciaux affichent des données réelles
- [ ] Le camembert produits affiche la répartition CA
- [ ] Le chart CA evolution est toujours fonctionnel
- [ ] Le feed d'activité affiche les notifications temps réel
- [ ] Chaque zone gère indépendamment ses erreurs
- [ ] Page responsive (zones stackées sur mobile)
- [ ] Dark mode fonctionne correctement
- [ ] page.tsx reste un Server Component (pas de "use client")
- [ ] Aucun nouveau Context provider créé
- [ ] AiAssistantFab retiré de page.tsx (FloatingAiChat dans layout)
- [ ] Build frontend réussit sans erreur
- [ ] Build backend réussit sans erreur
