# Draft: Audit de Cohérence Inter-Services (Post-Consolidation)

## Context
- Audit précédent (2 fév 2026) : sur 19 services AVANT consolidation
- Situation actuelle : 5 services consolidés (core, commercial, finance, engagement, logistics)
- La consolidation a introduit de NOUVELLES incohérences

## Findings Synthétisés

### CRITIQUES (P0) — Impact sur la fiabilité

1. **service-finance : datasource.ts MANQUANT**
   - Impossible d'exécuter les commandes TypeORM CLI (migrations)
   - Les 4 autres services ont un datasource.ts

2. **migrationsRun incohérent**
   - service-core: true ✓
   - service-commercial: true ✓
   - service-finance: FALSE ⚠️
   - service-engagement: non défini (default false) ⚠️
   - service-logistics: true ✓

3. **NatsModule absent dans 2 services**
   - service-finance: pas de NatsModule → event handlers ne fonctionnent pas
   - service-engagement: pas de NatsModule → event handlers ne fonctionnent pas
   - Les handlers NATS existent mais sont probablement morts

4. **GrpcExceptionFilter non enregistré**
   - Le shared-kernel fournit GrpcExceptionFilter mais aucun service ne l'enregistre
   - Les exceptions de domaine ne sont pas mappées en codes gRPC

### IMPORTANTS (P1) — Impact sur la maintenabilité

5. **Error handling complètement incohérent entre controllers**
   - service-core: RpcException + status codes ✓
   - service-commercial: RpcException + Logger ✓
   - service-finance: minimal, retourne null silencieusement ✗
   - service-engagement: throw Error générique ✗
   - service-logistics: throw Error générique ✗

6. **DTO mapping patterns divergents**
   - service-core: fonctions de mapping au niveau module (utilisateurToProto)
   - service-engagement: méthodes toProto() privées dans le controller
   - service-logistics: mapping inline dans les return statements
   - service-commercial/finance: retour direct d'entité (pas de mapping)

7. **Application layer vide**
   - Répertoires application/ existent mais vides dans tous les services
   - Pas de DTOs, pas de class-validator
   - Pas de validation d'entrée sur les méthodes gRPC

8. **Events NATS incomplets**
   - service-finance: TODO comments, subscriptions commentées
   - service-commercial: TODO comments, implémentation incomplète
   - Aucune idempotence dans les handlers d'événements
   - Naming inconsistant: `depanssur.abonnement.created` vs `crm.commercial.subscription.activated`

### MINEURS (P2) — Impact cosmétique/organisationnel

9. **Pool de connexion DB incohérent**
   - service-finance: max=20 (les autres: max=10)

10. **Entity loading pattern mixte**
    - 3 services: autoLoadEntities: true
    - 2 services: liste explicite d'entités

11. **Jest config variantes**
    - service-finance: moduleNameMapper pour .js
    - service-engagement: moduleNameMapper pour @proto/*
    - service-logistics: jest.config.js séparé avec transformIgnorePatterns

12. **package.json description en français vs anglais**
    - service-core: anglais
    - service-finance: français
    - service-engagement: français
    - Pas de `jest` config dans package.json de service-commercial et service-logistics

### BONNES PRATIQUES DÉJÀ COHÉRENTES ✓

- Versions des deps core (NestJS, TypeORM, gRPC): identiques partout
- DDD layering (domain/application/infrastructure): structure identique
- File naming (kebab-case) ✓
- Class naming (PascalCase + suffixe) ✓
- Database naming (snake_case plurals) ✓
- Module wiring pattern (TypeOrmModule.forFeature + forwardRef) ✓
- Repository injection (@InjectRepository) ✓
- Pagination response format ✓

## Décisions CONFIRMÉES

1. **Périmètre** : P0 + P1 + P2 COMPLET (~10-12h)
2. **Application layer / DTOs** : Rester proto-first. PAS de DTOs class-validator.
3. **Events NATS** : Plomberie + implémenter les TODO handlers (finance/commercial)
4. **Tests** : Non mentionnés → à confirmer

## Open Questions
- AUCUNE — Toutes les décisions sont prises.

## Test Strategy Decision
- **Infrastructure exists**: OUI (Jest dans tous les package.json)
- **Automated tests**: OUI (tests après corrections)
- **Framework**: Jest + ts-jest (déjà en place)
- **Agent-Executed QA**: ALWAYS (build + lint vérification)
