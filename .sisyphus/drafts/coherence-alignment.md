# [ARCHIVED] Ce draft a été converti en plan final.
# Voir: .sisyphus/plans/coherence-alignment.md
- ZERO sur-ingénierie, ZERO dette technique, ZERO band-aids
- Champs optionnels dans le proto (sauf exception légitime)
- Code prêt pour la production
- Vérifier le flux E2E avant ajouts/modifications/suppressions
- S'appuyer sur clone/winaity-clean comme référence
- On peut casser pour mieux reconstruire (rien en production)
- Repérer les incohérences par rapport au repo cloné

## Architecture Actuelle

### Structure
- **5 services consolidés**: service-core (50052), service-commercial (50053), service-engagement (50051), service-finance (50059), service-logistics (50054)
- **Repo de référence**: clone/winaity-clean (10 services, architecture différente mais patterns à suivre)
- **Packages partagés**: packages/proto (@crm/proto), packages/shared-kernel (@crm/shared-kernel)

### Problèmes Identifiés

#### 1. SUR-INGÉNIERIE MASSIVE (CRITIQUE)
- **90+ DTOs redondants** (application/*/dtos/) → dupliquent les messages proto
- **50+ Repository Interfaces** (domain/*/repositories/) → 1:1 mapping TypeORM sans valeur ajoutée
- **50+ Service Port Interfaces** (application/*/ports/) → dupliquent les interfaces repository
- **mapToProto() wrappers** dans 5 controllers → conversion manuelle inutile
- **mapToResponse() wrappers** dans service-logistics
- **data: any** dans les controllers gRPC → pas de type safety

#### 2. INCOHÉRENCES PROTO
- Proto organisé en sous-dossiers (packages/proto/src/*/) vs flat dans la référence
- buf.yaml v2 vs v1 dans la référence (OK, main project est plus récent)
- Chemins d'export INCORRECTS dans package.json (@crm/proto) ex: "./users" pointe vers organisations/users.ts
- 34 proto files (main) vs 27 (référence) - domaines différents
- Pas de validation rules dans les proto

#### 3. NATS NON IMPLÉMENTÉ
- Infrastructure NATS existe dans shared-kernel (nats.service.ts, nats.module.ts, base-event.handler.ts)
- AUCUN service n'utilise NATS (pas de @EventPattern, pas de @MessagePattern)
- Events proto définis mais pas consommés
- Tous les workflows asynchrones manquants

#### 4. gRPC COUVERTURE PARTIELLE (40%)
- service-finance: 0% implémenté (11 services manquants) ← CRITIQUE
- service-commercial: 31% (9 services manquants)
- service-core: 57% (10 services manquants)
- service-engagement: 83% (1 service manquant)
- service-logistics: 100% ✓
- Registry config définit 19 services mais seulement 9 sont registered dans main.ts

#### 5. DOCKER/INFRA INCOHÉRENCES
- Naming inconsistant: "dev-crm-engagement" vs "dev-crm-service-core"
- DB strategy mismatch: Dev = 6 DBs séparées, Staging/Prod = 1 DB partagée
- Pas de path aliases TypeScript (@crm/*)

#### 6. SHARED-KERNEL SUR-INGÉNIERIE
- gRPC client factory (152 lignes) → NestJS gère nativement
- 27 Value Objects domain-specific → devraient être dans les proto
- NATS service complet mais jamais utilisé

## Scope Boundaries

### INCLUDE
- Suppression des couches DTOs/Ports/Repository interfaces inutiles
- Fix des exports proto package.json
- Typage des controllers gRPC avec types proto generated
- Suppression des mapToProto()/mapToResponse() wrappers
- Alignement des patterns avec la référence winaity-clean
- Simplification du shared-kernel
- Fix des incohérences Docker/config
- Implémentation des services gRPC manquants
- Wiring NATS events

### EXCLUDE  
- Changement de la structure des proto (garder les sous-dossiers, c'est plus organisé que flat)
- Migration de la structure 5→10 services
- Changement de stack technique
- Ajout de Consul/service discovery
- Frontend

## Technical Decisions
- Garder buf v2 (plus récent que la référence)
- Garder la structure modulaire des proto (meilleure organisation)
- Garder @crm/proto comme nom de package
- Supprimer les couches DTO/Ports/Repository interfaces qui dupliquent les proto
- Controllers gRPC doivent importer directement les types proto generated
- Si un champ optionnel est nécessaire → l'ajouter dans le proto

## Test Strategy Decision
- **Infrastructure exists**: OUI (Jest configuré, pas de tests écrits)
- **Automated tests**: NON — L'utilisateur ne veut PAS de tests
- **Agent-Executed QA**: OUI (vérification par build, compilation, lint)

## Open Questions
- (aucune - le scope est clair d'après les consignes utilisateur)

## Research Findings

### Référence winaity-clean
- ZERO DTOs hand-written
- Repository interfaces UNIQUEMENT quand elles ajoutent de la logique domain-specific
- ZERO service port interfaces
- Mappers gRPC uniquement pour conversion domain ↔ proto (légitime)
- NATS pleinement utilisé avec event handlers
- Proto types utilisés directement dans les controllers

### Métriques de cleanup
- ~170+ fichiers à supprimer
- ~3300+ lignes de code redondant
- Réduction de ~40% de la complexité
