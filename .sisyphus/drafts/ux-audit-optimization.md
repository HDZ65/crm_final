# Draft: UX Audit & Optimization — CRM Multi-Société

## Requirements (confirmed)
- **Objectif** : Optimisation complète de l'architecture UX (navigation + charge cognitive + filtres + search + breadcrumbs)
- **Timeline** : Refonte progressive 6-8 semaines
- **Scope** : Tout le CRM (admin + portal)
- **Contraintes** : Design system Shadcn intact, rôles/permissions à implémenter dans la nav

## Technical Decisions
- Composants Shadcn UI (`components/ui/`) ne doivent PAS être modifiés, uniquement composés
- Navigation doit filtrer les items par rôle utilisateur (owner vs member)
- Pas de breaking changes URL exigé par défaut (non spécifié comme contrainte)

## Research Findings (4 agents)

### Agent 1 — Navigation Structure
- 27 items sidebar (18 main + 4 paiements + 5 utilitaires) — **Hick's Law violation ×3**
- Active state matching exact (`===`) au lieu de `startsWith` — sub-items ne highlightent pas parent
- Keyboard shortcuts (⌘1, ⌘2) affichés mais non fonctionnels
- Composants NavSecondary et NavDocuments inutilisés
- Pas de role-based nav filtering

### Agent 2 — Page-Level Cognitive Load
- **5/5 (critique)** : Commissions (7 tabs), Client Detail (8 tabs), Rôles/Permissions (horiz scroll), Marque Blanche (3 tables), Config Tâches (3 panels)
- **4/5 (élevée)** : Catalogue, Clients liste, Statistiques, WooCommerce, Routing
- **3/5 (modérée)** : Dashboard, Facturation, Tâches, Calendrier, Abonnements, Expéditions
- **2/5 (OK)** : Commerciaux, Messagerie, Agenda

### Agent 3 — Layout & Cross-Cutting
- Layout hierarchy correct : Root → Main → OrganisationProvider → NotificationProvider → AiHealthProvider → SidebarProvider
- WebSocket notifications non reliées au switch d'org (stale data)
- Pas de loading state pendant switch d'org
- AI briefing timeout silent (10s)
- Pas de error boundary pour les context providers
- Pas de cross-tab notification sync

### Agent 4 — Portal & Settings
- Portal score 4/5 — léger mais manque back buttons sur Wincash/Justi+
- Marque Blanche : 3 CRUD tables sur 1 page = 21+ decision points
- Routing : JSON textarea pour conditions = barrière technique
- Commission Reporting : page vide (non implémenté)
- Expéditions Lots : page vide (non implémenté)

## Scope Boundaries
- **INCLUDE** : Restructuration sidebar, réduction tabs, breadcrumbs, command palette, filtres, empty states, role-based nav, portal navigation, permission matrix fix
- **EXCLUDE** : Refonte visuelle complète, changement de design system, refonte backend, nouvelles features business

## Test Strategy Decision
- **Infrastructure exists** : Non vérifié (frontend Next.js, pas de test setup visible)
- **Automated tests** : À déterminer — probablement tests-after pour les composants restructurés
- **Agent-Executed QA** : MANDATORY — Playwright pour vérification visuelle + navigation

## Open Questions
- Aucune — toutes les décisions prises
