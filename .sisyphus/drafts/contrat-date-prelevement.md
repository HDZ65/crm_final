# Draft: Ajouter la date de prélèvement dans le contrat

## Requirements (confirmés)
- **Ce qu'on affiche**: La prochaine date de prélèvement **calculée** (par le Calendar Engine)
- **Quand configurer**: À la création du contrat ET modifiable après
- **Backend + Frontend**: Les deux doivent être impactés

## Architecture actuelle
- **ContratEntity** → `service-commercial` (21 champs, aucun lié au prélèvement)
- **ContractDebitConfigurationEntity** → `service-finance` (mode, batch, fixedDay, shiftStrategy)
- **PlannedDebitEntity** → `service-finance` (plannedDebitDate, status, contratId)
- **Lien**: `contratId` (UUID) dans les deux entités finance → pointe vers ContratEntity.id
- **Relation**: 1 contrat = 1 config (1:1) + N planned debits (1:N)

## Ce qui existe déjà
- Backend: Calendar Engine calcule les dates, config CRUD complet, gRPC services
- Frontend: `calendar-config.ts` actions (getContractConfig, createContractConfig, resolveConfiguration)
- Frontend: Affichage dans module Paiements uniquement (payment-table.tsx)

## Ce qui manque
- Backend: Le contrat (proto + gRPC) ne retourne PAS la date de prélèvement
- Frontend: Les vues contrat n'affichent PAS la date ni la config de prélèvement
- Frontend: Le formulaire de création ne permet PAS de configurer le prélèvement

## Décisions techniques (confirmées)
- **Cross-service**: Enrichissement côté backend (service-commercial → service-finance via gRPC)
- **Précédent**: subscription-charge.service.ts fait déjà des appels gRPC vers payments et factures (loadGrpcPackage pattern)
- **Formulaire**: Juste le jour fixe (1-28), simple pour l'utilisateur
- **Affichage**: Partout — liste contrats (colonne) + détail contrat + formulaire création/édition
- **Tests**: Pas de tests automatisés
- **Import**: Système d'import générique depuis APIs externes (Salesforce, HubSpot, etc.)
  - Le jour de prélèvement peut être présent ou absent dans les données importées
  - L'import est à inclure dans ce plan

## Scope
- INCLUDE:
  - Backend: enrichir la réponse contrat avec la date de prélèvement (gRPC cross-service)
  - Backend: accepter le jour fixe de prélèvement à la création/modification du contrat
  - Frontend: colonne date prélèvement dans table contrats
  - Frontend: section prélèvement dans détail contrat
  - Frontend: champ jour de prélèvement dans formulaire création/édition
  - Import: système générique d'import de contrats depuis APIs externes avec jour de prélèvement optionnel
- EXCLUDE:
  - CalendarEngine complet (jours fériés, shift strategy, business days)
  - Synchronisation bidirectionnelle
  - REST endpoints (tout en gRPC)
  - Framework ETL/adapter pattern générique pour l'import

## Metis Findings (résolus)
- CalendarEngine non implémenté backend → Approche SIMPLE (calcul trivial, pas de jours fériés)
- CRUD gRPC ContractDebitConfig non wirés (2/13) → Inclus en Phase 0 du plan
- Déduplication import → Mise à jour si même référence
- Direction import → Pull (CRM appelle l'outil externe)
- Page détail contrat → N'existe pas, à créer
- Pattern cross-service → loadGrpcPackage dans subscription-charge.service.ts
- Pattern cron → @Cron dans depanssur-scheduler.service.ts
