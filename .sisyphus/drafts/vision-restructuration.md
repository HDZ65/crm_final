# Draft: Restructuration Vision CRM

## Objectif Principal (confirmé par l'utilisateur)
> Gérer contrats / clients / commerciaux + prélèvement des clients

## État des lieux (audit complet 2026-02-10)

### Architecture Actuelle
- **Frontend**: Next.js 15, React 19, Shadcn UI, 49 pages, 43 server actions (500+ fonctions)
- **Backend**: 5 services NestJS + 1 service Python (scoring)
  - service-core (port 50052): users, orgs, clients, documents
  - service-commercial (port 50053): commerciaux, contrats, produits, subscriptions
  - service-finance (port 50059): factures, paiements (6 PSPs), calendrier prélèvement
  - service-engagement (port 50051): notifications, mailbox, activités, tâches
  - service-logistics (port 50060): expéditions, colis, tracking
- **Communication**: gRPC (sync) + NATS (async, infra prête mais pas utilisée)
- **DB**: PostgreSQL (4-5 bases séparées)

### Pages Frontend (13 dans la navigation)
**CRM**: clients, commerciaux, tâches, réunions
**Finance**: commissions, facturation, abonnements, paiements, statistiques
**Catalogue & Ops**: catalogue, expéditions, dossiers SAV

### Système de Paiement
- 6 PSPs définis: Stripe, PayPal, GoCardless, Slimpay, MultiSafepay, Emerchantpay
- Implémentés backend: Slimpay, MultiSafepay, Emerchantpay
- Partiels (entités seulement): Stripe, PayPal, GoCardless
- Routing engine: ✅ complet
- Retry/dunning: ✅ complet
- Portail paiement: ✅ complet (UI)

### Plans existants: 37 plans + 21 drafts
### Dette technique identifiée:
- ~37 controllers backend sans UI
- gRPC coverage ~40%
- NATS non utilisé
- 170+ fichiers redondants (DTOs, interfaces)
- REST/gRPC mixte

## Décisions Confirmées (interview 2026-02-10)

### Vision
- CRM générique d'abord, partenaires spécifiques plus tard
- Toutes les pages existantes sont utiles, on garde tout
- Deux modes de paiement selon le client :
  - **Prélèvement auto** : Contrat → Mandat SEPA → Prélèvement mensuel
  - **Paiement ponctuel** : Contrat → Facture → Paiement (carte/virement)

### PSPs prioritaires (3)
1. **Slimpay** — backend COMPLET (API service + webhooks + gRPC controller)
2. **GoCardless** — entités définies, PAS de backend API service
3. **Stripe** — entités + frontend composants, PAS de backend API service

### Priorité immédiate
> **La page Paiements complète** — afficher les vrais prélèvements, statuts, historique

### Blocage principal
- Pas de blocage spécifique ressenti, mais beaucoup de chantiers ouverts (37 plans)

## Ce qui manque pour la page Paiements complète
1. Page paiements actuelle = 4 tabs (routing, archives, alertes, exports) — ce sont des fonctions ADMIN
2. Il manque un tab principal "Paiements" avec la table des vrais paiements (PaymentIntents)
3. Il manque le lien Contrat → Schedule → PaymentIntents pour voir le cycle complet
4. Stripe et GoCardless n'ont pas de backend API service
5. La page utilise les données de routing/exports mais pas les PaymentIntents réels
