# Draft: Analyse Gaps CRM pour Gestion Abonnements (PUREA CAFE)

## Requirements (confirmed)
- Cahier des charges: "Gestion des clients PUREA CAFE.docx" — système d'abonnements café avec WooCommerce
- Scope design: **GÉNÉRIQUE multi-tenant** (pas spécifique café — réutilisable pour tout type d'abonnement)
- L'utilisateur veut approfondir 5 gaps sur 7 avant de planifier

## Gaps à approfondir (sélectionnés par l'utilisateur)
1. **Abonnements (lifecycle)** — state machine, fréquence, pause/reprise, pro-rata, next_charge_at
2. **WooCommerce (sync)** — webhooks, mapping, réconciliation, event log
3. **Fulfillment batching** — cut-off, lots préparation, workflow batch→expédition
4. **Préférences client** — modèle préférences liées à l'abonnement, historique, règles cut-off
5. **Satisfaction/NPS + Retours** — enquêtes post-livraison, scoring, gestion retours/SAV

## Gaps NON sélectionnés (pour plus tard)
- Variantes produit (enrichissement modèle Produit)
- Portail client self-service

## Technical Decisions
### GAP 1 — Abonnements
- **Architecture**: Extension du service contrats existant (PAS nouveau microservice)
- **Lien contrat**: Indépendant — l'abonnement peut exister sans contrat (contrat_id optional)
- **Modèle de charge**: Charge-then-ship (prélèvement avant expédition)
- **State machine**: PENDING → ACTIVE → PAUSED/PAST_DUE → CANCELED/EXPIRED
- **Design**: Nouveau bounded context `Subscription` dans le service contrats, avec son propre proto, ses propres tables, mais dans le même service

### GAP 2 — WooCommerce Integration
- **Scope**: WooCommerce uniquement (pas e-commerce générique)
- **Instance**: WooCommerce + WooCommerce Subscriptions déjà en production avec clients actifs
- **Sync**: Unidirectionnelle WooCommerce → CRM via webhooks
- **Architecture**: Webhook receiver → NATS → workers dédiés par entité
- **Mapping**: Table WooCommerceMapping (woo_id ↔ crm_entity_id) + WooCommerceWebhookEvent log

### GAP 3 — Fulfillment Batching
- **Placement**: Dans service-logistics existant (extension, pas nouveau service)
- **Cut-off**: Configurable par société (jour + heure + timezone)
- **Workflow**: OPEN → LOCKED (cut-off) → DISPATCHED → COMPLETED
- **Snapshots**: Adresse + préférences figées au moment du LOCK
- **Lien logistics**: Batch lines PREPARED → génère Expedition via service existant

### GAP 4 — Préférences Client
- **Placement**: Dans service-contrats (avec abonnements)
- **Schéma**: Dynamique — SubscriptionPreferenceSchema configurable par organisation
- **Modèle**: Schema (définit les champs) + Preference (valeurs par abonnement) + History (changelog)
- **Règle cut-off**: Changement avant cut-off = cycle N, après cut-off = cycle N+1
- **Snapshot**: Préférences figées au moment du LOCK du fulfillment batch

### GAP 5 — Satisfaction/NPS + Retours/SAV
- **Placement NPS**: Dans service-activites (extension)
- **Placement Retours**: Dans service-activites (extension — retour = tâche SAV assignée)
- **Priorité NPS**: Phase ultérieure (PAS dans le MVP)
- **Priorité Retours**: Phase ultérieure (PAS dans le MVP)
- **Design NPS**: SatisfactionSurvey + SatisfactionConfig (trigger post-livraison, score, commentaire)
- **Design Retours**: ReturnRequest (reason, status workflow, resolution) + ReturnConfig

## Research Findings
- CRM existant couvre : clients, contrats, factures, paiements multi-PSP, relance/dunning, notifications WebSocket, calendar L1-L4, logistics, products, dashboard KPIs, commissions, retry AM04, reminders multi-canal
- Manquant : abonnements lifecycle, WooCommerce sync, fulfillment batching, préférences, satisfaction/NPS, retours/SAV, portail self-service

## Open Questions (RESOLVED)
- ✅ Architecture abonnements : Extension service contrats (bounded context Subscription)
- ✅ WooCommerce : Webhook receiver → NATS → workers (WooCommerce uniquement)
- ✅ Fulfillment : Extension service-logistics existant
- ✅ NPS/Satisfaction : Extension service-activites (phase ultérieure)
- ✅ Retours/SAV : Extension service-activites (phase ultérieure)
- ✅ Préférences : Dans service-contrats, schéma dynamique

## Scope Boundaries
- **MVP INCLUDE**: Abonnements lifecycle, WooCommerce sync, Fulfillment batching, Préférences dynamiques
- **POST-MVP INCLUDE**: Satisfaction/NPS, Retours/SAV
- **EXCLUDE**: Variantes produit (enrichissement spécifique café), Portail client self-service

## Phase Plan
- **Phase 1 (MVP)**: Abonnements + WooCommerce + Fulfillment + Préférences
- **Phase 2**: Satisfaction/NPS + Retours/SAV
- **Phase 3**: Portail client self-service + Variantes produit enrichies
