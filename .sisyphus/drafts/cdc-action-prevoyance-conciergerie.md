# Draft: Implémentation CDC Action Prévoyance Conciergerie - Justi+ - Wincash

## Requirements (confirmed)
- **Roadmap**: Suivre les 10 étapes MVP du cahier des charges dans l'ordre
- **APIs Justi+/Wincash**: Pas d'accès aux specs → prévoir des services mock
- **Architecture Demandes**: Ajout dans `service-engagement` existant (décision utilisateur)
- **Test Strategy**: Tests après implémentation (pas TDD) + Agent-Executed QA
- **Périmètre**: Plan complet couvrant les 10 étapes MVP

## Scope: Les 10 Étapes MVP
1. Schéma de données (Client multi-service, Souscription, Facturation, Cas Justi+, Cashback Wincash, Tickets Conciergerie)
2. Webhooks Wincash → CRM
3. Webhooks Justi+ → CRM
4. Moteur de remise bundle paramétrable
5. Facturation récurrente + relance + facture PDF consolidée
6. Portail client multi-service
7. Module Conciergerie (tickets + SLA)
8. Dashboards KPI
9. RBAC + conformité GDPR
10. Tests end-to-end (solo, dual, triple service)

## Technical Decisions
- **Framework**: NestJS + gRPC (cohérent avec l'existant)
- **ORM**: TypeORM (cohérent)
- **Messaging**: NATS JetStream (cohérent)
- **Base de données**: PostgreSQL (nouveau DB `demandes_db`)
- **Frontend**: Next.js 15 + Shadcn UI (cohérent)
- **Mocks**: Services mock pour Justi+ et Wincash en attendant les vraies APIs

## Research Findings
- Le CRM est un monorepo microservices DDD : service-core, service-commercial, service-finance, service-engagement, service-logistics
- Aucune entité "demande", "ticket", "cas juridique" ou "cashback" n'existe côté backend
- Le frontend a un composant tickets.tsx mais 100% mock data
- Le système de paiement est très complet (6 PSPs, retry, reminders, calendar)
- Le système de produits/tarifs existe mais pas de logique bundle
- RBAC générique existe (Role, Permission) mais pas les rôles métier spécifiques

## Open Questions
- Confirmation architecture `service-demandes` comme nouveau microservice ?
- Test strategy : TDD ou tests après implémentation ?
- Quel niveau de détail pour les services mock Justi+/Wincash ?

## Scope Boundaries
- INCLUDE: Tout le CDC (10 étapes MVP)
- EXCLUDE: Intégrations réelles Justi+/Wincash (mocks seulement), refactoring des services existants non nécessaire
