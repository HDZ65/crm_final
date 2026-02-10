# Draft: Vue 360° Client + Import Contrats depuis projet collègue

## Requirements (confirmés)

- **Objectif principal**: Vue 360° client dans le CRM — voir TOUT d'un client (contrats, commercial associé)
- **Source données**: Projet du collègue (Prisma/MySQL) — API REST à créer par le collègue
- **Destination**: Notre CRM microservices (service-commercial + frontend Next.js)
- **Dashboard**: Nombre de contrats par commercial, visible par tous (commercial voit ses stats, manager voit équipe, admin voit tout)
- **Pas de nouvelle page**: Enrichir les pages existantes (détail client, etc.)

## Contexte collègue

- Schéma Prisma fourni avec modèles: Prospect, Contrat, User, Souscription, Abonnement, IdentityCard, etc.
- Le modèle Contrat du collègue a: titre, description, statut, dateSignature, dateValidation, montant, fournisseur, type, documentUrl, auditTrailUrl
- Contrat → Prospect (client) via prospectId
- Commercial accessible via Prospect.commercialId → User
- PAS de commercialId direct sur Contrat chez le collègue

## Technical Decisions

- **Sync**: Cron automatique + bouton manuel pour forcer
- **Matching clients**: Mix — certains clients existent déjà dans notre CRM, d'autres non
- **Création si inexistant**: Si prospect/commercial n'existe pas dans notre CRM, on le crée
- **Commercial du contrat**: À clarifier — le commercial peut-il changer après signature ? (user dit "pas sûr")

## Scope Boundaries

- **INCLUDE**: 
  - Spec API pour le collègue (comme la dernière fois)
  - Import/sync service (cron + bouton)
  - Enrichissement pages existantes (détail client, détail commercial)
  - Dashboard contrats par commercial (par rôle)
  - Matching + création prospects/commerciaux
- **EXCLUDE**:
  - Nouvelles pages dédiées
  - Import temps réel (webhook) — on fait cron + bouton

## Decisions finales (V2 — simplifié)

- **Endpoint collègue**: DÉJÀ DISPO — retourne liste de prospects avec tout imbriqué
- **Format JSON**: 1 seul endpoint, données imbriquées (contrats, souscriptions, offres, paiements, commercial, identityCard)
- **Filtre**: Seulement prospects avec contrats
- **Matching clients**: Déjà en place
- **Matching commerciaux**: Créer Apporteur + Utilisateur si inexistant (par email)
- **Import**: Mapper JSON imbriqué vers entités EXISTANTES
- **Nouvelle entity**: 1 seule — InformationPaiementBancaire (IBAN/BIC en clair) dans service-finance
- **IdentityCard**: Stocker en JSON simple sur ClientBase (pas de nouvelle entity)
- **Documents PDF**: Stocker juste le chemin (pas de download)
- **Conflit**: Le plus récent gagne
- **URL endpoint**: Variable d'environnement (EXTERNAL_API_URL)
- **Cron**: Toutes les heures + bouton manuel
- **KPI Dashboard**: "Contrats par commercial" sur la page d'accueil
- **Pages**: Enrichir les existantes, pas de nouvelle page

### Exemple JSON reçu de l'endpoint
```json
{
  "idProspect": 397,
  "nom": "HAMROUNI", "prenom": "Khalil",
  "email": "hamrounikhalil2023@gmail.com",
  "telephone": "0602540252",
  "commercialId": "b1597894-...",
  "informationsPaiement": [{ "IBAN": "FR41...", "BIC": "BNPAFRPPXXX" }],
  "Souscription": [{
    "offre": { "nom": "Télécâble Sat", ... },
    "contrats": [{ "titre": "8177185WNC", "statut": "Validé", ... }]
  }],
  "commercial": { "id": "...", "nom": "Doe", "prenom": "John", "email": "..." },
  "identityCard": null
}
```

## Research (complété)

### Frontend — État actuel
- **Page détail client** (`/clients/[id]`): DÉJÀ riche — tabs Overview, Payments, Activities, Documents
  - Contracts table: Reference, Product, Status, Start Date, Payment Method, Withdrawal Day, **Commercial**
  - Client info accordion, history timeline, shipments
- **Page détail commercial** (`/commerciaux/[id]`): tabs Overview, Commissions, **Contracts**, Activities, Documents
  - Contracts table: Reference, **Client**, Status, Amount, Start Date, Withdrawal Day, End Date
- **Page détail contrat** (`/contrats/[id]`): Reference, Status, Amount, Dates, **Client**, **Commercial**, Withdrawal config, Lines
- **Dashboard home** (`/`): CA Evolution, Product Distribution, Contracts by Company, Activity Feed
- **Statistiques** (`/statistiques`): 3 tabs — Direction (KPIs, charts), Commercial (rankings), Risks
  - KPIs existants: Active Contracts, MRR, Churn Rate, Unpaid Rate
  - **MANQUANT**: Pas de KPI "Contrats par commercial" dédié

→ **Conclusion frontend**: Les pages détail client et commercial MONTRENT DÉJÀ les contrats avec client+commercial. Le manque = KPI dashboard + données importées.

### Backend — Data Model actuel
- **ContratEntity** a DÉJÀ `client_id` (uuid) et `commercial_id` (uuid) comme champs requis
- **ClientBase** dans service-core: nom, prenom, email, telephone, statut, etc.
- **Apporteur** (commercial) dans service-commercial: utilisateur_id → Utilisateur, nom, prenom, email, telephone
- **Import service existant**: Gère upsert contrats par reference, MAIS:
  - ❌ Ne crée PAS les clients si inexistants
  - ❌ Ne crée PAS les commerciaux si inexistants
  - ❌ Ne valide PAS que client_id/commercial_id existent
  - ❌ Pas de mapping depuis le schéma Prisma du collègue

### Mapping Prisma → Notre modèle
| Collègue (Prisma)     | Notre CRM                   | Notes                          |
|------------------------|-----------------------------|---------------------------------|
| Prospect              | ClientBase (service-core)   | email/telephone pour matching   |
| User                  | Apporteur + Utilisateur     | email pour matching             |
| Contrat               | ContratEntity               | reference pour upsert           |
| Contrat.prospectId    | Contrat.client_id           | Résolu via matching             |
| Contrat.commercialId  | Contrat.commercial_id       | Via Prospect.commercialId       |
| Souscription          | ???                         | À décider si importé            |
| Abonnement            | ???                         | À décider si importé            |
