# Draft: Implémentation Depanssur dans Winvest CRM

## Requirements (confirmed)
- **Source**: Cahier des charges `docs/Gestion des clients Depanssur.docx`
- **Scope**: Implémenter TOUTES les fonctionnalités manquantes identifiées dans l'analyse gap
- **Priorité**: Tout d'un coup (pas de phases)
- **Dossier déclaratif**: Dans `service-core` (pas de nouveau service)
- **API Depanssur externe**: N'existe pas encore — on design les webhooks nous-mêmes

## Technical Decisions
- **Dossier déclaratif** → `service-core` (cohérent avec clients, adresses, documents)
- **Abonnement Depanssur** → À décider: extension ContratEntity ou nouvelle entité liée
- **Webhooks Depanssur** → Receiver dans service-core (endpoint REST dédié)
- **Avoirs** → service-finance (extension du domaine facturation)
- **Jobs automatisés** → Répartis par domaine (paiement→finance, carence/plafonds→core)
- **Notifications** → service-engagement (système existant)
- **Reporting Depanssur** → Extension dashboard existant

## Scope Boundaries
### INCLUDE (ce qu'on implémente):
1. Extension champs client (civilité, consentements RGPD, adresse de risque)
2. Modèle Abonnement Depanssur (carence, franchise, plafonds, options, compteurs)
3. Dossier déclaratif miroir (entité, workflow, UI)
4. Webhooks Depanssur (receiver + handlers)
5. Règles métier (carence, plafonds, upgrade/downgrade, adresse cutoff)
6. Jobs automatisés (quotidiens + hebdomadaires)
7. Notifications templates Depanssur (email + SMS)
8. Avoirs (credit notes)
9. Reporting Depanssur (MRR, churn, sinistralité, NPS, DSO)
10. Parcours souscription Depanssur
11. Dunning séquence spécifique Depanssur

### EXCLUDE (hors périmètre, cf. CDC §2):
- Affectation artisan
- Planning d'intervention
- Devis/réparations détaillés
- Achats pièces
- SLA terrain
- Tout ce qui est "outil opérationnel Depanssur"

## Research Findings
- CRM = monorepo NestJS microservices + gRPC + NATS + PostgreSQL/TypeORM
- 5 services: core, commercial, finance, engagement, logistics
- 127 entités existantes, 100+ endpoints gRPC
- Frontend Next.js 16 + React 19 + Tailwind 4
- Multi-PSP paiement déjà intégré (6 providers)
- Commission management déjà complet
- RBAC + multi-tenant existant

## Test Strategy Decision
- **Infrastructure exists**: YES (Jest configured in all services, Bun tests in service-commercial)
- **Automated tests**: YES (Tests-after) — implement first, write unit tests after
- **Framework**: Bun test (suivre le pattern de service-commercial)
- **Agent-Executed QA**: ALWAYS (mandatory for all tasks)

## Open Questions
- (all resolved)
