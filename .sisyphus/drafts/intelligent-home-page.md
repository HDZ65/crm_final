# Draft: Intelligent Home Page (Attio-inspired)

## Requirements (confirmed)
- **Target users**: Dirigeants / Managers (strategic vision)
- **Usage frequency**: Quotidien (daily driver) — "morning cockpit"
- **Pain points identified**:
  1. Pas assez actionnable — KPIs informatifs mais ne guident pas l'action
  2. Manque de vue d'ensemble — 5+ pages pour comprendre l'état de l'activité
  3. Pas personnalisé — même vue pour tous, quel que soit le rôle
- **Data sources prioritaires** (user choice):
  1. KPIs commerciaux (classement, conversion, panier moyen, prévision CA 3 mois)
  2. Alertes critiques (impayés élevés, contrats expirant, churn anormal)
  3. Notifications récentes (feed d'événements business en temps réel)

## Technical Context (discovered)
- **Currently displayed**: 4 KPIs cards + 1 area chart (CA evolution) + 1 pie chart (contrats par société)
- **Backend data ALREADY available but unused**:
  - `getAlertes()` → alertes critique/avertissement/info
  - `getKpisCommerciaux()` → classement commerciaux, taux conversion, panier moyen, prévision CA 3 mois
  - `getRepartitionProduits()` → répartition CA par produit
  - WebSocket notifications → real-time business events
- **User profile data available**: role, permissions, fullName, preferences (including dashboard.widgets)
- **Organisation data**: nom, secteur, membres
- **Filters available but unused**: societe_id, produit_id, canal, periode_rapide

## Design Philosophy
- "What do I need to do NOW?" > "What are the numbers?"
- Action-oriented > Information-only
- Contextual greeting > Generic dashboard
- Alerts drive behavior > Charts inform passively

## Design Decisions (confirmed)

### Zone 1 — Briefing du matin (header contextuel)
- **AI Summary**: OUI — L'IA génère un briefing textuel quotidien à partir des données agrégées
  - Exploite le endpoint AI assistant existant (streaming, markdown)
  - Exemple: "Bonjour Marc, aujourd'hui: MRR en hausse de 5%, 2 impayés critiques à traiter, 1 contrat expire vendredi"
- **Alertes critiques**: BANNIÈRE COMPACTE + LIEN
  - Pas de cards détaillées — juste un bandeau cliquable par alerte
  - Ex: "⚠️ 3 contrats expirent sous 7j" → lien vers liste filtrée
  - Utilise `getAlertes()` (critique, avertissement, info)
- **Quick Actions**: OUI, essentielles
  - Boutons raccourcis manager : "Nouveau contrat", "Voir impayés", "Relancer client", "Exporter rapport"
  - Gain de temps quotidien, évite la navigation sidebar

### Zone 2 — Vue d'ensemble (KPIs + Charts)
- KPIs existants conservés (contrats actifs, MRR, churn, impayés)
- AJOUT: KPIs commerciaux agrégés (taux conversion, panier moyen, prévision CA 3 mois)
- AJOUT: Répartition produits (camembert CA par produit)
- Chart CA evolution conservé (déjà fonctionnel)
- PAS de classement commerciaux sur la home (sensible → page dédiée)

### Zone 3 — Feed d'activité temps réel
- Notifications business récentes (WebSocket)
- Événements : nouveaux clients, contrats signés, impayés, expéditions
- PAS de classement commerciaux (confirmé)

## Scope Boundaries
- INCLUDE: Home page redesign (3 zones), AI briefing, alertes compactes, quick actions, KPIs commerciaux, feed activité
- EXCLUDE: Custom widget builder (drag-and-drop), classement commerciaux sur home, workflow automation, full reporting overhaul
- EXCLUDE: Adaptation par rôle (v2 — pour l'instant focus manager)

## Technical Decisions

### AI Briefing UX
- **Approach**: Skeleton + streaming
  - Page charge d'abord les KPIs/alertes (server-side, rapide)
  - Puis le briefing IA apparaît en streaming (comme ChatGPT)
  - Skeleton placeholder pendant le chargement
  - Composant similaire à ai-assistant-fab.tsx (streaming markdown déjà implémenté)

### Scope technique
- **Frontend + ajustements backend**
  - Principalement frontend : nouveau layout page.tsx, nouveaux composants
  - Backend si nécessaire : endpoint agrégé pour le briefing IA (contexte + prompt)
  - Pas de refonte backend majeure

### Données à connecter (TOUTES déjà disponibles côté backend)
- `getAlertes()` → alertes bannière (EXISTE, non utilisé)
- `getKpisCommerciaux()` → KPIs conversion/panier/prévision (EXISTE, non utilisé)
- `getRepartitionProduits()` → camembert produits (EXISTE, non utilisé)
- WebSocket notifications → feed temps réel (EXISTE, utilisé dans header seulement)
- AI assistant endpoint → briefing streaming (EXISTE, utilisé dans FAB)
- User store → prénom, rôle, préférences (EXISTE)

### Test Strategy Decision
- **Infrastructure exists**: YES (vitest/bun test - to be confirmed)
- **Automated tests**: TBD during plan generation
- **Agent-Executed QA**: ALWAYS (Playwright for UI verification)
