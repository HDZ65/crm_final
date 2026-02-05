# Plan: Refactoring DDD Strict (winaity-clean style)

## TL;DR

> **Quick Summary**: Restructurer les 5 microservices de la structure NestJS "by-feature" vers une architecture DDD stricte avec séparation domain/application/infrastructure/interfaces.
> 
> **Deliverables**:
> - 5 services restructurés en couches DDD
> - Conventions cohérentes entre tous les services
> - Documentation CLAUDE.md mise à jour pour chaque service
> 
> **Estimated Effort**: XL (3-4 semaines)
> **Parallel Execution**: Partiellement (1 service à la fois, mais tâches internes en parallèle)
> **Critical Path**: service-core (référence) → service-commercial → service-finance → service-engagement → service-logistics

---

## Context

### Original Request
Auditer et harmoniser les 5 microservices selon les principes DDD stricts de winaity-clean.

### Interview Summary
**Key Discussions**:
- Audit complet des 5 services : **VALIDÉ**
- Rigueur DDD stricte (winaity-clean) : **VALIDÉ**

### Current Architecture (BY-FEATURE)

```
src/
├── modules/
│   ├── {feature}/
│   │   ├── {feature}.module.ts
│   │   ├── {feature}.service.ts
│   │   ├── {feature}.controller.ts
│   │   └── entities/{feature}.entity.ts
```

### Target Architecture (DDD - winaity-clean style)

```
src/
├── domain/
│   ├── {bounded-context}/
│   │   ├── entities/
│   │   ├── value-objects/
│   │   ├── events/
│   │   └── repositories/ (interfaces only)
├── application/
│   ├── {bounded-context}/
│   │   ├── commands/
│   │   ├── queries/
│   │   ├── handlers/
│   │   └── dtos/
├── infrastructure/
│   ├── persistence/
│   │   ├── typeorm/
│   │   │   ├── entities/ (TypeORM decorators)
│   │   │   ├── repositories/
│   │   │   └── migrations/
│   │   └── mappers/
│   └── messaging/
│       └── nats/
│           ├── publishers/
│           └── handlers/
└── interfaces/
    └── grpc/
        └── controllers/
```

---

## Coherence Report Summary

### Profile: `typescript-grpc` + `ddd-strict` + `event-driven`

| Severity | Count | Issues |
|----------|-------|--------|
| Critical | 4 | DDD layers missing, entities in wrong layer, no CQRS, controllers mixed |
| Warning | 4 | Inconsistent scripts, missing test, version mismatch, missing nats-utils |
| Info | 2 | Script naming, missing main field |

---

## Work Objectives

### Core Objective
Refactorer progressivement les 5 services vers une architecture DDD stricte tout en maintenant la rétrocompatibilité gRPC.

### Concrete Deliverables
- Structure DDD dans chaque service
- Séparation domain/application/infrastructure/interfaces
- Conventions cohérentes (scripts, versions, dépendances)
- CLAUDE.md mis à jour dans chaque service

### Definition of Done
- [x] Chaque service a les 4 couches DDD
- [x] `bun run build` passe sur tous les services
- [x] Les endpoints gRPC fonctionnent identiquement
- [x] Les événements NATS sont préservés

### Must Have
- Rétrocompatibilité totale des APIs gRPC
- Préservation des événements NATS
- Pas de changement de schéma de base de données

### Must NOT Have (Guardrails)
- NE PAS modifier la logique métier
- NE PAS changer les migrations
- NE PAS modifier les contrats proto
- NE PAS ajouter de nouvelles fonctionnalités

---

## Verification Strategy

### Test Decision
- **Infrastructure exists**: OUI (Jest)
- **Automated tests**: Tests-after (vérification non-régression)
- **Framework**: Jest

### Agent-Executed QA Scenarios

Chaque phase sera vérifiée par :
1. `bun run build` - Compilation sans erreur
2. `bun test` - Tests existants passent
3. Vérification que les imports ne cassent pas

---

## Execution Strategy

### Approach: Reference Implementation First

1. **Phase 1**: Restructurer `service-core` comme référence (golden service)
2. **Phase 2**: Appliquer le même pattern aux autres services
3. **Phase 3**: Harmoniser les conventions (scripts, versions)
4. **Phase 4**: Validation finale

### Dependency Matrix

```
Phase 1: service-core (référence)
    ↓
Phase 2a: service-commercial (parallèle possible)
Phase 2b: service-finance (parallèle possible)
Phase 2c: service-engagement (parallèle possible)
Phase 2d: service-logistics (parallèle possible)
    ↓
Phase 3: Harmonisation
    ↓
Phase 4: Validation
```

---

## TODOs

### Phase 1: Service-Core comme Référence

- [x] 1. Créer la structure DDD dans service-core

  **What to do**:
  - Créer les dossiers: `src/domain/`, `src/application/`, `src/infrastructure/`, `src/interfaces/`
  - Créer les sous-dossiers pour chaque bounded context (users, organisations, clients, documents)
  - NE PAS déplacer de fichiers encore

  **Must NOT do**:
  - Ne pas modifier les fichiers existants
  - Ne pas supprimer l'ancienne structure

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []
  - Reason: Création de structure uniquement

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Blocks**: Task 2, 3, 4, 5

  **References**:
  - winaity-clean structure pattern
  - `services/service-core/src/modules/` - Structure actuelle

  **Acceptance Criteria**:
  - [ ] Dossier `src/domain/` créé avec sous-dossiers (users, organisations, clients, documents)
  - [ ] Dossier `src/application/` créé
  - [ ] Dossier `src/infrastructure/` créé
  - [ ] Dossier `src/interfaces/` créé

  **Commit**: NO (attendre Task 5)

---

- [x] 2. Migrer les entités vers domain layer (service-core)

  **What to do**:
  - Copier les entités TypeORM de `modules/{feature}/entities/` vers `domain/{bounded-context}/entities/`
  - Créer les interfaces de repository dans `domain/{bounded-context}/repositories/`
  - Les entités restent avec décorateurs TypeORM pour l'instant (pragmatique)

  **Bounded Contexts**:
  - `users`: utilisateur, role, permission, compte, membre-compte, invitation-compte
  - `organisations`: organisation, societe, partenaire, theme-marque, etc.
  - `clients`: client-base, client-entreprise, client-partenaire, adresse, statut-client
  - `documents`: piece-jointe, boite-mail

  **Must NOT do**:
  - Ne pas modifier la logique des entités
  - Ne pas supprimer les anciens fichiers encore

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: []
  - Reason: Refactoring structurel important

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Blocked By**: Task 1
  - **Blocks**: Task 3

  **References**:
  - `services/service-core/src/modules/users/*/entities/*.entity.ts`
  - `services/service-core/src/modules/organisations/*/entities/*.entity.ts`
  - `services/service-core/src/modules/*/entities/*.entity.ts`

  **Acceptance Criteria**:
  - [ ] Toutes les entités copiées dans `src/domain/{context}/entities/`
  - [ ] Interfaces IRepository créées dans `src/domain/{context}/repositories/`
  - [ ] Les imports ne sont pas cassés (compilation OK)

  **Commit**: NO (attendre Task 5)

---

- [x] 3. Créer la couche application (service-core)

  **What to do**:
  - Créer les DTOs dans `application/{context}/dtos/`
  - Extraire les interfaces de services dans `application/{context}/ports/`
  - Organiser par bounded context

  **Must NOT do**:
  - Ne pas implémenter de nouveaux use-cases
  - Ne pas modifier la logique existante

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Blocked By**: Task 2
  - **Blocks**: Task 4

  **References**:
  - Services existants dans modules/
  - DTOs existants si présents

  **Acceptance Criteria**:
  - [ ] DTOs créés dans `src/application/{context}/dtos/`
  - [ ] Interfaces de services définies
  - [ ] Compilation OK

  **Commit**: NO (attendre Task 5)

---

- [x] 4. Migrer l'infrastructure et interfaces (service-core)

  **What to do**:
  - Déplacer les repositories TypeORM vers `infrastructure/persistence/typeorm/repositories/`
  - Déplacer les controllers gRPC vers `interfaces/grpc/controllers/`
  - Déplacer les handlers NATS vers `infrastructure/messaging/nats/handlers/`
  - Mettre à jour tous les imports

  **Must NOT do**:
  - Ne pas modifier la logique
  - Ne pas casser les endpoints gRPC

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: []
  - Reason: Déplacements multiples avec mise à jour d'imports

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Blocked By**: Task 3
  - **Blocks**: Task 5

  **References**:
  - `services/service-core/src/modules/*/`
  - Controllers, services, handlers existants

  **Acceptance Criteria**:
  - [ ] Controllers dans `src/interfaces/grpc/controllers/`
  - [ ] Repositories dans `src/infrastructure/persistence/typeorm/repositories/`
  - [ ] Handlers NATS dans `src/infrastructure/messaging/nats/handlers/`
  - [ ] `bun run build` passe
  - [ ] Les endpoints gRPC fonctionnent

  **Commit**: NO (attendre Task 5)

---

- [x] 5. Finaliser service-core et nettoyer

  **What to do**:
  - Mettre à jour `app.module.ts` avec la nouvelle structure
  - Supprimer l'ancienne structure `modules/` si tout fonctionne
  - Mettre à jour le CLAUDE.md du service
  - Créer un index.ts par couche pour les exports

  **Must NOT do**:
  - Ne pas supprimer si les tests ne passent pas

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Blocked By**: Task 4
  - **Blocks**: Tasks 6-9 (autres services)

  **References**:
  - Nouvelle structure créée dans Tasks 1-4
  - `services/service-core/src/app.module.ts`

  **Acceptance Criteria**:
  - [ ] `app.module.ts` utilise la nouvelle structure
  - [ ] `bun run build` passe
  - [ ] `bun test` passe
  - [ ] Ancien dossier `modules/` supprimé
  - [ ] CLAUDE.md mis à jour

  **Agent-Executed QA Scenarios**:
  ```
  Scenario: Build service-core restructuré
    Tool: Bash
    Steps:
      1. cd services/service-core
      2. bun install
      3. bun run build
    Expected Result: Build successful
    Evidence: Build output

  Scenario: Tests service-core
    Tool: Bash
    Steps:
      1. cd services/service-core
      2. bun test
    Expected Result: All tests pass
  ```

  **Commit**: YES
  - Message: `refactor(service-core): restructure to DDD layers (domain/application/infrastructure/interfaces)`
  - Files: `services/service-core/src/`

---

### Phase 2: Appliquer aux autres services

- [x] 6. Restructurer service-commercial en DDD

  **What to do**:
  - Appliquer le même pattern que service-core
  - Bounded contexts: commercial (commissions, baremes), contrats, products

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (avec 7, 8, 9)
  - **Blocked By**: Task 5

  **Acceptance Criteria**:
  - [ ] Structure DDD complète
  - [ ] `bun run build` passe
  - [ ] `bun test` passe

  **Commit**: YES
  - Message: `refactor(service-commercial): restructure to DDD layers`

---

- [x] 7. Restructurer service-finance en DDD

  **What to do**:
  - Appliquer le même pattern que service-core
  - Bounded contexts: factures, payments, calendar

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (avec 6, 8, 9)
  - **Blocked By**: Task 5

  **Acceptance Criteria**:
  - [ ] Structure DDD complète
  - [ ] `bun run build` passe
  - [ ] `bun test` passe

  **Commit**: YES
  - Message: `refactor(service-finance): restructure to DDD layers`

---

- [x] 8. Restructurer service-engagement en DDD

  **What to do**:
  - Appliquer le même pattern que service-core
  - Bounded contexts: email, notifications, dashboard, activites

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (avec 6, 7, 9)
  - **Blocked By**: Task 5

  **Acceptance Criteria**:
  - [ ] Structure DDD complète
  - [ ] `bun run build` passe
  - [ ] `bun test` passe

  **Commit**: YES
  - Message: `refactor(service-engagement): restructure to DDD layers`

---

- [x] 9. Restructurer service-logistics en DDD

  **What to do**:
  - Appliquer le même pattern que service-core
  - Bounded contexts: logistics (maileva, shipments)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (avec 6, 7, 8)
  - **Blocked By**: Task 5

  **Acceptance Criteria**:
  - [ ] Structure DDD complète
  - [ ] `bun run build` passe
  - [ ] `bun test` passe

  **Commit**: YES
  - Message: `refactor(service-logistics): restructure to DDD layers`

---

### Phase 3: Harmonisation des conventions

- [x] 10. Harmoniser les scripts et versions

  **What to do**:
  - Ajouter script `test` manquant dans service-commercial
  - Unifier les scripts `proto:generate` (même syntaxe)
  - Aligner les versions (1.0.0 pour tous)
  - Ajouter `@crm/nats-utils` à service-logistics

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Blocked By**: Tasks 6-9

  **References**:
  - package.json de chaque service

  **Acceptance Criteria**:
  - [ ] Tous les services ont script `test`
  - [ ] Tous les services ont même format proto:generate
  - [ ] Versions alignées à 1.0.0
  - [ ] `@crm/nats-utils` présent dans tous les services

  **Commit**: YES
  - Message: `chore(services): harmonize scripts and versions across all services`

---

### Phase 4: Validation finale

- [x] 11. Validation complète et documentation

  **What to do**:
  - Exécuter `bun run build` sur tous les services
  - Exécuter `bun test` sur tous les services
  - Mettre à jour le README.md principal avec la nouvelle architecture
  - Créer un guide de structure DDD dans `docs/`

  **Recommended Agent Profile**:
  - **Category**: `writing`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Blocked By**: Task 10

  **Acceptance Criteria**:
  - [ ] Tous les builds passent
  - [ ] Tous les tests passent
  - [ ] Documentation à jour

  **Commit**: YES
  - Message: `docs: update documentation for DDD architecture`

---

## Commit Strategy

| After Task | Message | Files |
|------------|---------|-------|
| 5 | `refactor(service-core): restructure to DDD layers` | services/service-core/ |
| 6 | `refactor(service-commercial): restructure to DDD layers` | services/service-commercial/ |
| 7 | `refactor(service-finance): restructure to DDD layers` | services/service-finance/ |
| 8 | `refactor(service-engagement): restructure to DDD layers` | services/service-engagement/ |
| 9 | `refactor(service-logistics): restructure to DDD layers` | services/service-logistics/ |
| 10 | `chore(services): harmonize scripts and versions` | services/*/package.json |
| 11 | `docs: update documentation for DDD architecture` | README.md, docs/ |

---

## Success Criteria

### Verification Commands
```bash
# Build tous les services
for svc in services/service-*/; do (cd "$svc" && bun run build); done

# Test tous les services
for svc in services/service-*/; do (cd "$svc" && bun test); done

# Vérifier la structure
ls services/service-core/src/
# Expected: domain/ application/ infrastructure/ interfaces/
```

### Final Checklist
- [x] 5 services avec structure DDD
- [x] Tous les builds passent
- [x] Tous les tests passent
- [x] Endpoints gRPC fonctionnels
- [x] Événements NATS préservés
- [x] Documentation à jour
