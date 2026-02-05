# Plan: Consolidation des Microservices (12 → 6)

## TL;DR

> **Quick Summary**: Consolider 12 microservices en 6 services plus gros pour réduire la consommation RAM de ~4 GB et simplifier l'architecture.
> 
> **Deliverables**:
> - 6 services consolidés (au lieu de 12)
> - Docker Compose mis à jour
> - Tests de non-régression validés
> - Documentation mise à jour
> 
> **Estimated Effort**: Large (2-3 semaines)
> **Parallel Execution**: Partiellement (certaines phases en parallèle)
> **Critical Path**: Preparation → service-engagement → service-finance → service-commercial → service-core → Cleanup

---

## Context

### Original Request
L'utilisateur ne peut pas lancer son projet CRM avec 16 GB de RAM. 12 microservices + 4 PostgreSQL consomment trop de mémoire.

### Interview Summary
**Key Discussions**:
- Regroupement en 5-6 services : **VALIDÉ**
- Logistics reste séparé : **VALIDÉ**
- Garder 4 DB séparées : **VALIDÉ**

**Research Findings**:
- Dépendances via NATS events (pas de gRPC inter-services)
- Chaque service a sa propre DB
- service-engagement est le hub de notifications

### Architecture Finale

| Nouveau Service | Fusionne | Port | DB |
|-----------------|----------|------|-----|
| service-core | identity + clients + documents | 50052 | identity_db |
| service-commercial | commercial + contrats + products | 50053 | commercial_db |
| service-finance | factures + payments + calendar | 50059 | postgres-main |
| service-engagement | engagement + activites | 50061 | engagement_db |
| service-logistics | (seul) | 50060 | postgres-main |

---

## Work Objectives

### Core Objective
Réduire le nombre de microservices de 12 à 6 pour diminuer la consommation RAM et permettre le développement sur une machine avec 16 GB.

### Concrete Deliverables
- 6 services NestJS consolidés avec leurs modules fusionnés
- 6 fichiers docker-compose (compose/dev/service-*.yml)
- 6 Dockerfiles mis à jour
- Tests unitaires et d'intégration fonctionnels
- Documentation CLAUDE.md mise à jour

### Definition of Done
- [ ] `make dev-up-sequential` démarre les 6 services sans erreur
- [ ] Tous les endpoints gRPC existants fonctionnent
- [ ] Les événements NATS sont correctement routés
- [ ] RAM totale < 10 GB (au lieu de ~14 GB)

### Must Have
- Rétrocompatibilité des APIs gRPC
- Conservation des événements NATS existants
- Migrations de DB préservées

### Must NOT Have (Guardrails)
- NE PAS fusionner les bases de données
- NE PAS changer les noms des événements NATS
- NE PAS modifier les contrats proto existants
- NE PAS supprimer de fonctionnalités

---

## Verification Strategy

### Test Decision
- **Infrastructure exists**: OUI (Jest configuré dans chaque service)
- **Automated tests**: Tests-after (vérifier non-régression)
- **Framework**: Jest + bun test

### Agent-Executed QA Scenarios (MANDATORY)

Chaque consolidation sera vérifiée par :
1. Build du service (`bun run build`)
2. Démarrage du conteneur Docker
3. Health check gRPC
4. Test des endpoints principaux via grpcurl

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Preparation):
├── Task 1: Setup structure projet consolidé
└── Task 2: Créer les nouveaux Dockerfiles

Wave 2 (Consolidation - Séquentiel):
├── Task 3: service-engagement (+ activites)
├── Task 4: service-finance (factures + payments + calendar)
├── Task 5: service-commercial (commercial + contrats + products)
└── Task 6: service-core (identity + clients + documents)

Wave 3 (Finalization):
├── Task 7: Mettre à jour Docker Compose
├── Task 8: Tests d'intégration complets
└── Task 9: Documentation et cleanup
```

---

## TODOs

### Phase 1: Préparation

- [x] 1. Créer la structure des nouveaux services consolidés

  **What to do**:
  - Créer les dossiers pour les 5 nouveaux services (service-core, service-commercial, service-finance, service-engagement consolidé)
  - Copier les package.json et tsconfig.json de base
  - Préparer les app.module.ts vides

  **Must NOT do**:
  - Ne pas encore fusionner le code
  - Ne pas supprimer les anciens services

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Blocks**: Tasks 3, 4, 5, 6

  **References**:
  - `services/service-identity/` - Structure de référence
  - `services/service-identity/package.json` - Dépendances NestJS standard

  **Acceptance Criteria**:
  - [ ] 4 nouveaux dossiers créés dans services/
  - [ ] package.json valide dans chaque dossier
  - [ ] `bun install` réussit dans chaque nouveau service

  **Commit**: YES
  - Message: `chore(services): scaffold consolidated service structure`
  - Files: `services/service-*/`

---

### Phase 2: Consolidation service-engagement

- [ ] 2. Fusionner service-engagement + service-activites → service-engagement

  **What to do**:
  - Copier tous les modules de service-activites dans service-engagement
  - Mettre à jour app.module.ts pour inclure les modules d'activités
  - Fusionner les entités TypeORM
  - Mettre à jour les imports et exports

  **Must NOT do**:
  - Ne pas modifier les endpoints gRPC existants
  - Ne pas changer les noms des événements NATS

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: []
  - Reason: Refactoring complexe avec multiples modules

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Blocks**: Task 7
  - **Blocked By**: Task 1

  **References**:
  - `services/service-engagement/src/app.module.ts` - Module principal
  - `services/service-activites/src/modules/` - Modules à fusionner
  - `packages/proto/activites.proto` - Contrat gRPC activités

  **Acceptance Criteria**:
  - [ ] Tous les modules d'activités présents dans service-engagement
  - [ ] `bun run build` réussit sans erreur
  - [ ] Les endpoints gRPC activités fonctionnent

  **Agent-Executed QA Scenarios**:
  ```
  Scenario: Build service-engagement consolidé
    Tool: Bash
    Steps:
      1. cd services/service-engagement
      2. bun install
      3. bun run build
    Expected Result: Build successful, no errors
    Evidence: Build output captured

  Scenario: Vérifier les modules activités
    Tool: Bash
    Steps:
      1. ls services/service-engagement/src/modules/ | grep -E "(activite|tache|evenement)"
    Expected Result: Modules activités présents
  ```

  **Commit**: YES
  - Message: `feat(service-engagement): merge service-activites modules`
  - Files: `services/service-engagement/`

---

### Phase 3: Consolidation service-finance

- [ ] 3. Fusionner service-factures + service-payments + service-calendar → service-finance

  **What to do**:
  - Créer service-finance avec les modules des 3 services
  - Fusionner les configurations TypeORM
  - Unifier les connexions DB (postgres-main)
  - Mettre à jour les événements NATS (publishers)

  **Must NOT do**:
  - Ne pas modifier les contrats proto
  - Ne pas changer les noms des événements NATS

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: []
  - Reason: 3 services à fusionner, logique métier complexe (paiements, factures)

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Blocks**: Task 7
  - **Blocked By**: Task 2

  **References**:
  - `services/service-factures/src/modules/` - Facturation, PDF, Factur-X
  - `services/service-payments/src/modules/` - PSP, Stripe, GoCardless, relances
  - `services/service-calendar/src/modules/` - Calendrier paiements, jours fériés
  - `packages/proto/factures.proto` - Contrat facturation
  - `packages/proto/payments.proto` - Contrat paiements

  **Acceptance Criteria**:
  - [ ] service-finance contient tous les modules des 3 services
  - [ ] `bun run build` réussit sans erreur
  - [ ] Endpoints gRPC factures, payments, calendar fonctionnent
  - [ ] Événements INVOICE_CREATED, PAYMENT_RECEIVED publiés correctement

  **Agent-Executed QA Scenarios**:
  ```
  Scenario: Build service-finance
    Tool: Bash
    Steps:
      1. cd services/service-finance
      2. bun install
      3. bun run build
    Expected Result: Build successful
    Evidence: Build output

  Scenario: Vérifier présence modules
    Tool: Bash
    Steps:
      1. ls services/service-finance/src/modules/
    Expected Result: Modules facture, payment, calendar présents
  ```

  **Commit**: YES
  - Message: `feat(service-finance): consolidate factures + payments + calendar`
  - Files: `services/service-finance/`

---

### Phase 4: Consolidation service-commercial

- [ ] 4. Fusionner service-commercial + service-contrats + service-products → service-commercial

  **What to do**:
  - Étendre service-commercial avec les modules contrats et products
  - Fusionner les entités TypeORM
  - Mettre à jour les connexions DB (commercial_db)
  - Unifier les événements NATS

  **Must NOT do**:
  - Ne pas modifier les contrats proto
  - Ne pas supprimer les fonctionnalités existantes

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: []
  - Reason: 3 services, logique métier commerciale complexe

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Blocks**: Task 7
  - **Blocked By**: Task 3

  **References**:
  - `services/service-commercial/src/modules/` - Commissions, apporteurs, barèmes
  - `services/service-contrats/src/modules/` - Contrats, lignes, orchestration
  - `services/service-products/src/modules/` - Produits, gammes, tarifs
  - `packages/proto/commercial.proto`
  - `packages/proto/contrats.proto`
  - `packages/proto/products.proto`

  **Acceptance Criteria**:
  - [ ] service-commercial contient tous les modules
  - [ ] `bun run build` réussit
  - [ ] Événement CONTRACT_SIGNED publié correctement
  - [ ] Endpoints gRPC commercial, contrats, products fonctionnent

  **Agent-Executed QA Scenarios**:
  ```
  Scenario: Build service-commercial consolidé
    Tool: Bash
    Steps:
      1. cd services/service-commercial
      2. bun install && bun run build
    Expected Result: Build successful

  Scenario: Vérifier modules
    Tool: Bash
    Steps:
      1. ls services/service-commercial/src/modules/ | wc -l
    Expected Result: > 15 modules (commission + contrat + product)
  ```

  **Commit**: YES
  - Message: `feat(service-commercial): consolidate contrats + products`
  - Files: `services/service-commercial/`

---

### Phase 5: Consolidation service-core

- [ ] 5. Fusionner service-identity + service-clients + service-documents → service-core

  **What to do**:
  - Créer service-core avec les modules des 3 services
  - Fusionner les entités TypeORM
  - Configurer identity_db comme DB principale
  - Mettre à jour les événements NATS (CLIENT_CREATED)

  **Must NOT do**:
  - Ne pas modifier les contrats proto
  - Ne pas changer la logique d'authentification

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: []
  - Reason: Service fondamental, 3 domaines à fusionner

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Blocks**: Task 7
  - **Blocked By**: Task 4

  **References**:
  - `services/service-identity/src/modules/` - Users, organisations, permissions
  - `services/service-clients/src/modules/` - Clients, adresses, statuts
  - `services/service-documents/src/modules/` - Documents, pièces jointes
  - `packages/proto/identity.proto`
  - `packages/proto/clients.proto`
  - `packages/proto/documents.proto`

  **Acceptance Criteria**:
  - [ ] service-core contient tous les modules
  - [ ] `bun run build` réussit
  - [ ] Événement CLIENT_CREATED publié
  - [ ] Endpoints gRPC identity, clients, documents fonctionnent

  **Agent-Executed QA Scenarios**:
  ```
  Scenario: Build service-core
    Tool: Bash
    Steps:
      1. cd services/service-core
      2. bun install && bun run build
    Expected Result: Build successful

  Scenario: Vérifier modules identity
    Tool: Bash
    Steps:
      1. ls services/service-core/src/modules/ | grep -E "(user|client|document)"
    Expected Result: Modules présents
  ```

  **Commit**: YES
  - Message: `feat(service-core): consolidate identity + clients + documents`
  - Files: `services/service-core/`

---

### Phase 6: Infrastructure et Docker

- [ ] 6. Mettre à jour Docker Compose pour les 6 services

  **What to do**:
  - Créer/mettre à jour compose/dev/service-core.yml
  - Créer compose/dev/service-finance.yml
  - Mettre à jour service-commercial.yml et service-engagement.yml
  - Supprimer les anciens fichiers yml des services fusionnés
  - Mettre à jour make/dev.mk avec les nouveaux services

  **Must NOT do**:
  - Ne pas modifier infrastructure.yml
  - Ne pas changer les ports existants si possible

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Blocked By**: Tasks 2, 3, 4, 5

  **References**:
  - `compose/dev/service-identity.yml` - Template de référence
  - `compose/dev/infrastructure.yml` - Dépendances DB
  - `make/dev.mk` - Scripts make

  **Acceptance Criteria**:
  - [ ] 6 fichiers service-*.yml (core, commercial, finance, engagement, logistics, frontend)
  - [ ] `make dev-ps` liste les 6 services
  - [ ] `make dev-up-sequential` fonctionne

  **Agent-Executed QA Scenarios**:
  ```
  Scenario: Lister les fichiers compose
    Tool: Bash
    Steps:
      1. ls compose/dev/service-*.yml | wc -l
    Expected Result: 6 fichiers

  Scenario: Valider syntaxe docker-compose
    Tool: Bash
    Steps:
      1. docker compose -f compose/dev/infrastructure.yml -f compose/dev/service-core.yml config --quiet
    Expected Result: No errors
  ```

  **Commit**: YES
  - Message: `chore(compose): update docker-compose for 6 consolidated services`
  - Files: `compose/dev/`, `make/dev.mk`

---

### Phase 7: Cleanup et Tests

- [ ] 7. Supprimer les anciens services et tester l'ensemble

  **What to do**:
  - Supprimer les dossiers des anciens services fusionnés
  - Exécuter `make dev-up-sequential`
  - Vérifier tous les health checks
  - Tester les endpoints gRPC principaux
  - Vérifier les événements NATS

  **Must NOT do**:
  - Ne pas supprimer service-logistics (reste seul)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-low`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Blocked By**: Task 6

  **References**:
  - Tous les services consolidés
  - `make/dev.mk` - Commandes de test

  **Acceptance Criteria**:
  - [ ] Anciens services supprimés (activites, calendar, clients, contrats, documents, factures, identity, payments, products)
  - [ ] `make dev-up-sequential` démarre sans erreur
  - [ ] Tous les services healthy
  - [ ] Frontend accessible sur http://localhost:3000

  **Agent-Executed QA Scenarios**:
  ```
  Scenario: Démarrage complet
    Tool: Bash
    Steps:
      1. make dev-down
      2. make dev-up-sequential
      3. make dev-ps
    Expected Result: 6 services + infrastructure running
    Evidence: docker ps output

  Scenario: Health checks
    Tool: Bash
    Steps:
      1. docker ps --format "{{.Names}}: {{.Status}}" | grep -E "(healthy|starting)"
    Expected Result: All services healthy
  ```

  **Commit**: YES
  - Message: `chore(cleanup): remove legacy services after consolidation`
  - Files: `services/`

---

- [ ] 8. Mettre à jour la documentation

  **What to do**:
  - Mettre à jour README.md avec la nouvelle architecture
  - Mettre à jour QUICK_START.md
  - Mettre à jour les fichiers CLAUDE.md des services

  **Recommended Agent Profile**:
  - **Category**: `writing`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (avec Task 7)
  - **Blocked By**: Task 6

  **References**:
  - `README.md`
  - `QUICK_START.md`
  - `docs/`

  **Acceptance Criteria**:
  - [ ] README.md reflète l'architecture 6 services
  - [ ] QUICK_START.md mis à jour
  - [ ] Diagrammes d'architecture mis à jour si présents

  **Commit**: YES
  - Message: `docs: update documentation for consolidated architecture`
  - Files: `README.md`, `QUICK_START.md`, `docs/`

---

## Commit Strategy

| After Task | Message | Files |
|------------|---------|-------|
| 1 | `chore(services): scaffold consolidated service structure` | services/ |
| 2 | `feat(service-engagement): merge service-activites modules` | services/service-engagement/ |
| 3 | `feat(service-finance): consolidate factures + payments + calendar` | services/service-finance/ |
| 4 | `feat(service-commercial): consolidate contrats + products` | services/service-commercial/ |
| 5 | `feat(service-core): consolidate identity + clients + documents` | services/service-core/ |
| 6 | `chore(compose): update docker-compose for 6 consolidated services` | compose/, make/ |
| 7 | `chore(cleanup): remove legacy services after consolidation` | services/ |
| 8 | `docs: update documentation for consolidated architecture` | README.md, docs/ |

---

## Success Criteria

### Verification Commands
```bash
# Démarrer tout
make dev-up-sequential  # Expected: All 6 services start

# Vérifier les services
make dev-ps  # Expected: 6 services running

# Vérifier la RAM
docker stats --no-stream --format "table {{.Name}}\t{{.MemUsage}}"
# Expected: < 10 GB total
```

### Final Checklist
- [ ] 6 services au lieu de 12
- [ ] RAM totale < 10 GB
- [ ] Tous les endpoints gRPC fonctionnent
- [ ] Événements NATS correctement routés
- [ ] Frontend accessible
- [ ] Documentation à jour
