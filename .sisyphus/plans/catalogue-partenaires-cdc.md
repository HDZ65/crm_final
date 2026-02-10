# Implémentation CDC — Module Catalogue Produits & Partenaires

## TL;DR

> **Quick Summary**: Implémenter toutes les fonctionnalités manquantes du cahier des charges "Module Catalogue Produits & Partenaires" du CRM Winvest Capital : entité Partenaire Commercial enrichie, Formules/Plans produit, modèles tarifaires avancés, intégration OggoData, webhooks produit, mapping comptable, catalogue publishable, canaux de vente, et DIPA dynamique.
>
> **Deliverables**:
> - Entité `PartenaireCommercialEntity` complète dans service-commercial
> - Entité `FormuleProduitEntity` avec garanties, options, franchises
> - Moteur de tarification multi-modèle (palier, récurrent, usage, bundle, négocié, indexé)
> - Intégration OggoData/APIMarket (consultation tarifaire, sync, webhooks)
> - Système de webhooks produit via NATS
> - Mapping comptable produit + exports CSV/Excel
> - Entité Catalogue agrégée publishable
> - Segmentation canaux de vente
> - Enrichissement SocieteEntity, GammeEntity, ProduitEntity, ContratEntity
> - Audit trail (created_by/modified_by) sur toutes les entités
> - Frontend complet pour toutes les nouvelles fonctionnalités
>
> **Estimated Effort**: XL (40-60 tâches, 5-7 vagues)
> **Parallel Execution**: YES — 6 waves
> **Critical Path**: Task 1 (Audit) → Task 2-5 (Entités core) → Task 8-10 (Tarification) → Task 13-14 (OggoData) → Task 16-18 (Frontend)

---

## Context

### Original Request
Analyser le cahier des charges "Module Catalogue Produits & Partenaires" et identifier ce qui manque au CRM pour le couvrir intégralement, puis créer un plan d'implémentation complet.

### Interview Summary
**Key Discussions**:
- Scope: TOUT le CDC, pas de priorisation partielle
- Intégrations: OggoData/APIMarket réelles (pas de stubs)
- Tests: Après implémentation (pas TDD)
- Architecture: Microservices NestJS DDD existants à enrichir

**Research Findings**:
- Le CRM a déjà une base solide (8 entités Products, 7 entités Commercial, Contrats, Frontend complet)
- `PartenaireMarqueBlancheEntity` (service-core) ≠ Partenaire Commercial du CDC → nouvelle entité nécessaire
- Le pattern DDD est bien établi (domain/application/infrastructure/interfaces)
- Proto definitions dans packages/proto, migrations TypeORM, gRPC + NATS

### Metis Review
**Identified Gaps** (addressed):
- **Partenaire Commercial vs Marque Blanche**: Création d'une NOUVELLE entité `PartenaireCommercialEntity` dans service-commercial (ne pas conflater avec PartenaireMarqueBlanche qui gère le white-label)
- **OggoData sans specs API**: Architecture port/adapter avec interface définie, implémentation réelle quand specs disponibles. Prévoir un mock adapter en parallèle
- **Audit trail transversal**: Migration globale ajoutant created_by/modified_by, pas entité par entité
- **Risque scope creep**: Verrouiller les exclusions (pas de refonte UI existante, pas d'autres CDC)

---

## Work Objectives

### Core Objective
Compléter le CRM Winvest Capital pour couvrir 100% du cahier des charges "Module Catalogue Produits & Partenaires" : gestion des partenaires commerciaux, formules produit, tarification avancée multi-modèle, intégrations externes, mapping comptable, catalogue publishable, et canaux de vente.

### Concrete Deliverables
- 8+ nouvelles entités TypeORM avec migrations
- 5+ nouveaux proto services gRPC
- Moteur de tarification avec 8 modèles de prix
- Adapter OggoData/APIMarket
- Système de webhooks produit via NATS
- 6+ nouvelles pages/composants frontend
- Exports comptables CSV/Excel

### Definition of Done
- [ ] Toutes les entités du CDC sont modélisées et migrées en DB
- [ ] Tous les services gRPC sont exposés et fonctionnels
- [ ] Le frontend permet le CRUD complet sur toutes les nouvelles entités
- [ ] L'intégration OggoData répond à une consultation tarifaire
- [ ] Les exports comptables génèrent des CSV/Excel valides
- [ ] Les webhooks produit émettent sur NATS
- [ ] Les tests passent pour chaque nouveau module

### Must Have
- Nouvelle entité PartenaireCommercial distincte de PartenaireMarqueBlanche
- Formules produit avec garanties et options
- Moteur de tarification supportant au minimum : fixe, palier, récurrent, bundle
- Audit trail (created_by/modified_by) sur toutes les entités modifiées/créées
- Mapping comptable produit
- Frontend pour gérer partenaires commerciaux et formules

### Must NOT Have (Guardrails)
- ❌ NE PAS modifier PartenaireMarqueBlancheEntity (white-label, scope différent)
- ❌ NE PAS refondre le frontend catalogue existant (l'enrichir uniquement)
- ❌ NE PAS toucher aux modules Paiements SEPA, Commission (autres CDC)
- ❌ NE PAS créer de microservice supplémentaire (enrichir les existants)
- ❌ NE PAS modifier les entités/APIs qui fonctionnent déjà (additive only)
- ❌ NE PAS implémenter de portail client/partenaire self-service (hors scope CDC)
- ❌ NE PAS ajouter de champs non spécifiés dans le CDC (éviter le gold-plating)

---

## Verification Strategy

> **UNIVERSAL RULE: ZERO HUMAN INTERVENTION**
>
> ALL tasks in this plan MUST be verifiable WITHOUT any human action.

### Test Decision
- **Infrastructure exists**: YES (bun test, jest config exists in services)
- **Automated tests**: Tests-after (write tests after implementation)
- **Framework**: bun test / jest (per service existing setup)

### Agent-Executed QA Scenarios (MANDATORY — ALL tasks)

**Verification Tool by Deliverable Type:**

| Type | Tool | How Agent Verifies |
|------|------|-------------------|
| **Backend Entity/Migration** | Bash (bun run migration, curl gRPC) | Run migration, verify table exists, CRUD via gRPC |
| **Proto/gRPC** | Bash (grpcurl) | Call service methods, verify request/response shapes |
| **Frontend UI** | Playwright (playwright skill) | Navigate, interact, assert DOM, screenshot |
| **Integration OggoData** | Bash (curl) | Send tarification request, verify response structure |
| **Export CSV/Excel** | Bash (curl + file inspection) | Trigger export, verify file content and format |
| **NATS Events** | Bash (nats-cli subscribe) | Subscribe to subject, trigger action, verify event payload |

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 0 (Foundation — Start Immediately):
├── Task 1: Audit trail migration (created_by/modified_by global)
├── Task 2: Enrichir SocieteEntity (logo, devise, params comptables)
└── Task 3: Enrichir GammeEntity (hiérarchie parent-enfant)

Wave 1 (Core Entities — After Wave 0):
├── Task 4: Créer PartenaireCommercialEntity
├── Task 5: Enrichir ProduitEntity (champs contractuels/comptables)
├── Task 6: Créer FormuleProduitEntity
└── Task 7: Enrichir ModeleDistributionEntity

Wave 2 (Services & Tarification — After Wave 1):
├── Task 8: Moteur de tarification avancé (modèles multiples)
├── Task 9: Proto + gRPC PartenaireCommercial
├── Task 10: Proto + gRPC FormuleProduit
└── Task 11: Canaux de vente (entity + enum + proto)

Wave 3 (Intégrations & Événements — After Wave 2):
├── Task 12: Système webhooks produit (NATS)
├── Task 13: Port/Adapter OggoData (interface + mock)
├── Task 14: Implémentation réelle OggoData
└── Task 15: Mapping comptable + exports CSV/Excel

Wave 4 (Catalogue & Documents — After Wave 2):
├── Task 16: Entité Catalogue agrégé publishable
├── Task 17: DIPA dynamique (génération par canal/produit)
└── Task 18: Enrichir ContratEntity (FK partenaire, canal)

Wave 5 (Frontend — After Waves 3+4):
├── Task 19: Page gestion Partenaires Commerciaux
├── Task 20: UI Formules Produit (dans le détail produit)
├── Task 21: UI Tarification avancée
├── Task 22: UI Canaux de vente & Catalogue publishable
├── Task 23: UI Mapping comptable & Exports
└── Task 24: UI Intégration OggoData

Wave 6 (Tests & Finalisation — After Wave 5):
├── Task 25: Tests backend (entities, services, tarification)
├── Task 26: Tests frontend (composants, intégration)
└── Task 27: Tests intégration E2E (flux complets)
```

### Dependency Matrix

| Task | Depends On | Blocks | Can Parallelize With |
|------|------------|--------|---------------------|
| 1 | None | 4,5,6,7 | 2, 3 |
| 2 | None | 15 | 1, 3 |
| 3 | None | 6 | 1, 2 |
| 4 | 1 | 9, 13, 18, 19 | 5, 6, 7 |
| 5 | 1 | 8, 10, 15 | 4, 6, 7 |
| 6 | 1, 3 | 10, 17, 20 | 4, 5, 7 |
| 7 | 1 | 11 | 4, 5, 6 |
| 8 | 5 | 14, 21 | 9, 10, 11 |
| 9 | 4 | 13, 19 | 8, 10, 11 |
| 10 | 5, 6 | 20 | 8, 9, 11 |
| 11 | 7 | 22 | 8, 9, 10 |
| 12 | None (infra NATS exists) | 24 | 13, 14, 15 |
| 13 | 9 | 14 | 12, 15 |
| 14 | 8, 13 | 24 | 15, 16 |
| 15 | 2, 5 | 23 | 12, 13, 14 |
| 16 | 10 | 22 | 17, 18 |
| 17 | 6 | None | 16, 18 |
| 18 | 4 | None | 16, 17 |
| 19 | 9 | None | 20, 21, 22, 23 |
| 20 | 10 | None | 19, 21, 22, 23 |
| 21 | 8 | None | 19, 20, 22, 23 |
| 22 | 11, 16 | None | 19, 20, 21, 23 |
| 23 | 15 | None | 19, 20, 21, 22 |
| 24 | 14 | None | 19-23 |
| 25 | 4-18 | 27 | 26 |
| 26 | 19-24 | 27 | 25 |
| 27 | 25, 26 | None | None (final) |

### Agent Dispatch Summary

| Wave | Tasks | Recommended Agents |
|------|-------|-------------------|
| 0 | 1, 2, 3 | task(category="quick", load_skills=["microservice-maintainer"]) × 3 parallel |
| 1 | 4, 5, 6, 7 | task(category="unspecified-high", load_skills=["microservice-maintainer"]) × 4 parallel |
| 2 | 8, 9, 10, 11 | task(category="ultrabrain", load_skills=["microservice-maintainer"]) for 8; quick for 9,10,11 |
| 3 | 12, 13, 14, 15 | task(category="unspecified-high", load_skills=["microservice-maintainer"]) × 4 parallel |
| 4 | 16, 17, 18 | task(category="unspecified-low", load_skills=["microservice-maintainer"]) × 3 parallel |
| 5 | 19-24 | task(category="visual-engineering", load_skills=["frontend-ui-ux"]) × 6 parallel |
| 6 | 25, 26, 27 | task(category="unspecified-high", load_skills=[]) sequentially |

---

## TODOs

---

### WAVE 0 — Foundation

---

- [x] 1. Audit Trail Global — Ajouter created_by/modified_by sur toutes les entités

  **What to do**:
  - Créer une migration TypeORM dans chaque service (service-commercial, service-core) qui ajoute les colonnes `created_by VARCHAR(255) NULL` et `modified_by VARCHAR(255) NULL` sur TOUTES les tables existantes
  - Créer un `AuditSubscriber` TypeORM (EntitySubscriber) qui intercepte les INSERT/UPDATE et peuple automatiquement created_by/modified_by depuis le contexte utilisateur (metadata gRPC)
  - Mettre à jour les entités TypeORM existantes pour ajouter les colonnes `@Column`
  - Tables concernées dans service-commercial: produit, gamme, grille_tarifaire, prix_produit, produit_versions, produit_documents, produit_publications, modeledistributions, apporteurs, baremes_commission, palier_commission, contrat, ligne_contrat
  - Tables concernées dans service-core: organisations, societes, partenairemarqueblanches, clientbases, cliententreprises, clientpartenaires

  **Must NOT do**:
  - Ne pas modifier la logique métier existante
  - Ne pas toucher aux services ou controllers, uniquement entités + subscriber + migration
  - Ne pas supprimer de colonnes existantes

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: [`microservice-maintainer`]
    - `microservice-maintainer`: Modifications sur services existants, ajout de champs

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 0 (with Tasks 2, 3)
  - **Blocks**: Tasks 4, 5, 6, 7
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `services/service-commercial/src/domain/commercial/entities/bareme-commission.entity.ts:108-115` — Seule entité ayant déjà creePar/modifiePar (pattern à reproduire)
  - `services/service-commercial/src/domain/products/entities/produit.entity.ts` — Exemple d'entité à enrichir
  - `services/service-core/src/domain/organisations/entities/organisation.entity.ts` — Exemple côté service-core

  **Infrastructure References**:
  - `services/service-commercial/src/migrations/` — Dossier migrations service-commercial
  - `services/service-core/src/migrations/` — Dossier migrations service-core
  - `services/service-commercial/src/datasource.ts` — Config TypeORM (snake_case naming strategy)

  **Documentation References**:
  - CDC §9 Gouvernance: "Audit & traçabilité (qui change quoi/quand)"

  **Acceptance Criteria**:
  - [ ] Migration créée et exécutée sans erreur: `bun run migration:run` → SUCCESS
  - [ ] Colonnes created_by et modified_by existent sur toutes les tables listées: `SELECT column_name FROM information_schema.columns WHERE table_name='produit' AND column_name IN ('created_by','modified_by')` → 2 rows
  - [ ] AuditSubscriber intercepte les opérations: créer un produit via gRPC → vérifier que created_by est peuplé
  - [ ] Tests: `bun test` dans service-commercial et service-core → PASS

  **Agent-Executed QA Scenarios**:

  ```
  Scenario: Migration adds audit columns to produit table
    Tool: Bash
    Preconditions: Database running, service-commercial connected
    Steps:
      1. Run: bun run migration:run (workdir: services/service-commercial)
      2. Query: psql commercial_db -c "SELECT column_name FROM information_schema.columns WHERE table_name='produit' AND column_name IN ('created_by','modified_by')"
      3. Assert: 2 rows returned (created_by, modified_by)
    Expected Result: Audit columns exist on produit table
    Evidence: Query output captured

  Scenario: AuditSubscriber populates created_by on insert
    Tool: Bash (grpcurl)
    Preconditions: service-commercial running with migration applied
    Steps:
      1. Create a product via gRPC with user metadata
      2. Query DB: SELECT created_by FROM produit WHERE id='<new_id>'
      3. Assert: created_by is NOT NULL
    Expected Result: created_by is populated automatically
    Evidence: DB query output
  ```

  **Commit**: YES
  - Message: `feat(audit): add created_by/modified_by columns and AuditSubscriber across all entities`
  - Files: `services/service-commercial/src/migrations/*.ts`, `services/service-core/src/migrations/*.ts`, `services/*/src/domain/**/entities/*.entity.ts`, `services/*/src/infrastructure/persistence/typeorm/audit-subscriber.ts`

---

- [x] 2. Enrichir SocieteEntity — Logo, devise, paramètres comptables

  **What to do**:
  - Ajouter à `SocieteEntity` les colonnes: `logo_url TEXT NULL`, `devise VARCHAR(3) DEFAULT 'EUR'`, `ics VARCHAR(50) NULL` (Identifiant Créancier SEPA), `journal_vente VARCHAR(20) NULL`, `compte_produit_defaut VARCHAR(20) NULL`, `plan_comptable JSONB NULL`, `adresse_siege TEXT NULL`, `telephone VARCHAR(50) NULL`, `email_contact VARCHAR(255) NULL`, `parametres_fiscaux JSONB NULL`
  - Créer la migration TypeORM dans service-core
  - Mettre à jour le proto `organisations.proto` pour inclure les nouveaux champs dans SocieteMessage
  - Mettre à jour le controller gRPC et le service pour gérer ces champs
  - Mettre à jour le DTO CreateSociete/UpdateSociete

  **Must NOT do**:
  - Ne pas modifier OrganisationEntity (elle reste le tenant parent)
  - Ne pas modifier le frontend à cette étape (Wave 5)

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: [`microservice-maintainer`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 0 (with Tasks 1, 3)
  - **Blocks**: Task 15
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `services/service-core/src/domain/organisations/entities/societe.entity.ts` — Entité à enrichir (actuellement: raisonSociale, siren, numeroTva uniquement)
  - `packages/proto/src/organisations/` — Proto definitions à mettre à jour

  **Documentation References**:
  - CDC §2.1 Société: "ID, Raison sociale, SIREN/SIRET, TVA, logo/charte, devise de tenue de compte, paramètres fiscaux/comptables (journaux, comptes, ICS si utile), statuts, adresses, contacts"

  **Acceptance Criteria**:
  - [ ] Migration service-core créée et exécutée: `bun run migration:run` → SUCCESS
  - [ ] SocieteEntity a les 10 nouveaux champs
  - [ ] Proto SocieteMessage inclut les nouveaux champs
  - [ ] gRPC CreateSociete/UpdateSociete acceptent les nouveaux champs
  - [ ] Tests: `bun test` dans service-core → PASS

  **Agent-Executed QA Scenarios**:

  ```
  Scenario: Create société with enriched fields
    Tool: Bash (grpcurl)
    Preconditions: service-core running with migration applied
    Steps:
      1. grpcurl -plaintext -d '{"organisationId":"<uuid>","raisonSociale":"Test SARL","siren":"123456789","numeroTva":"FR12345","devise":"EUR","ics":"FR12ZZZ123456","logoUrl":"https://example.com/logo.png","journalVente":"VT01"}' localhost:5001 organisations.SocieteService/Create
      2. Assert: response contains id (UUID)
      3. grpcurl -plaintext -d '{"id":"<returned_id>"}' localhost:5001 organisations.SocieteService/Get
      4. Assert: response.devise == "EUR", response.ics == "FR12ZZZ123456"
    Expected Result: All new fields persisted and returned
    Evidence: gRPC response captured
  ```

  **Commit**: YES
  - Message: `feat(organisations): enrich SocieteEntity with accounting params, logo, currency per CDC`
  - Files: `services/service-core/src/domain/organisations/entities/societe.entity.ts`, `services/service-core/src/migrations/*.ts`, `packages/proto/src/organisations/*.proto`

---

- [x] 3. Enrichir GammeEntity — Hiérarchie parent-enfant (Risque > Famille)

  **What to do**:
  - Ajouter à `GammeEntity`: `parent_id UUID NULL REFERENCES gamme(id)`, `niveau INT DEFAULT 0` (0=Risque, 1=Famille, 2=Sous-famille), `type_gamme ENUM('RISQUE','FAMILLE','SOUS_FAMILLE') DEFAULT 'FAMILLE'`
  - Ajouter la relation ManyToOne self-referencing (parent) et OneToMany (children)
  - Créer la migration TypeORM
  - Mettre à jour le proto GammeMessage et le service gRPC pour supporter la hiérarchie
  - Ajouter un endpoint `GetGammeTree` qui retourne l'arborescence complète
  - Mettre à jour le service pour valider la cohérence hiérarchique (pas de cycle, max 3 niveaux)

  **Must NOT do**:
  - Ne pas supprimer les gammes existantes plates (elles deviennent niveau 1 par défaut)
  - Ne pas modifier le frontend sidebar catégorie (Wave 5)

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: [`microservice-maintainer`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 0 (with Tasks 1, 2)
  - **Blocks**: Task 6
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `services/service-commercial/src/domain/products/entities/gamme.entity.ts` — Entité à enrichir (actuellement: code, nom, description, icone, ordre, actif)
  - `packages/proto/src/products/products.proto` — Proto GammeService à mettre à jour

  **Documentation References**:
  - CDC §2.1 Risque/Famille: "Taxonomie (ex: Santé, Obsèques, Dépannage, Télécom, Énergie…), hiérarchique"

  **Acceptance Criteria**:
  - [ ] GammeEntity a parent_id, niveau, type_gamme
  - [ ] Self-referencing relation fonctionne (parent/children)
  - [ ] `GetGammeTree` retourne une arborescence JSON correcte
  - [ ] Gammes existantes migrées comme niveau=1 type=FAMILLE
  - [ ] Validation: impossible de créer un cycle (A parent de B parent de A)
  - [ ] Tests: `bun test` → PASS

  **Agent-Executed QA Scenarios**:

  ```
  Scenario: Create hierarchical gamme tree
    Tool: Bash (grpcurl)
    Preconditions: service-commercial running
    Steps:
      1. Create root gamme (Risque): type_gamme=RISQUE, nom="Santé", parent_id=null
      2. Create child gamme (Famille): type_gamme=FAMILLE, nom="Complémentaire Santé", parent_id=<root_id>
      3. Create sub-child (Sous-famille): type_gamme=SOUS_FAMILLE, nom="Individuelle", parent_id=<child_id>
      4. Call GetGammeTree
      5. Assert: tree has 3 levels, root has 1 child, child has 1 child
    Expected Result: Full tree returned with proper nesting
    Evidence: gRPC response JSON

  Scenario: Reject cycle creation
    Tool: Bash (grpcurl)
    Preconditions: Gammes A→B→C exist
    Steps:
      1. Update gamme A, set parent_id=C (creating cycle A→B→C→A)
      2. Assert: error returned with cycle detection message
    Expected Result: Validation rejects cyclic reference
    Evidence: Error response captured
  ```

  **Commit**: YES
  - Message: `feat(products): add hierarchical gamme taxonomy (Risk > Family > Subfamily)`
  - Files: `services/service-commercial/src/domain/products/entities/gamme.entity.ts`, `services/service-commercial/src/migrations/*.ts`, `packages/proto/src/products/products.proto`

---

### WAVE 1 — Core Entities

---

- [ ] 4. Créer PartenaireCommercialEntity (nouvelle entité)

  **What to do**:
  - Créer `PartenaireCommercialEntity` dans `services/service-commercial/src/domain/commercial/entities/` avec:
    - id (UUID PK)
    - organisationId (UUID FK)
    - denomination (VARCHAR 255)
    - type (ENUM: ASSUREUR, FAI, ENERGIE, OTT, MARKETPLACE, COURTIER, FOURNISSEUR, AUTRE)
    - siren (VARCHAR 20)
    - siret (VARCHAR 20 NULL)
    - numeroTva (VARCHAR 50 NULL)
    - adresseSiege (TEXT NULL)
    - adresseCorrespondance (TEXT NULL)
    - iban (VARCHAR 34 NULL)
    - bic (VARCHAR 11 NULL)
    - codeExtranet (VARCHAR 100 NULL) — code partenaire dans système extranet
    - apiBaseUrl (VARCHAR 500 NULL)
    - apiCredentials (JSONB NULL) — {clientId, clientSecret, apiKey} — CHIFFRÉ
    - slaDelaiReponseHeures (INT NULL)
    - slaDisponibilite (DECIMAL 5,2 NULL) — ex: 99.9%
    - contactCommercialNom (VARCHAR 255 NULL)
    - contactCommercialEmail (VARCHAR 255 NULL)
    - contactCommercialTelephone (VARCHAR 50 NULL)
    - contactTechniqueEmail (VARCHAR 255 NULL)
    - statut (ENUM: PROSPECT, EN_COURS_INTEGRATION, ACTIF, SUSPENDU, RESILIE)
    - dateDebutContrat (DATE NULL)
    - dateFinContrat (DATE NULL)
    - notes (TEXT NULL)
    - metadata (JSONB NULL)
    - created_by, modified_by, created_at, updated_at
  - Créer la table `partenaire_commercial_societes` (many-to-many): partenaire_id, societe_id, actif, date_activation, date_desactivation → permet l'activation par société
  - Créer le repository interface `IPartenaireCommercialRepository`
  - Créer le service d'infrastructure
  - Créer migration TypeORM
  - Ajouter l'entité au commercial.module.ts

  **Must NOT do**:
  - NE PAS modifier `PartenaireMarqueBlancheEntity` (elle reste pour le white-label)
  - NE PAS stocker les API credentials en clair (utiliser pgcrypto ou chiffrement applicatif)
  - NE PAS créer le controller gRPC ici (Task 9)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: [`microservice-maintainer`]
    - `microservice-maintainer`: Création d'entité dans un service DDD existant

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 5, 6, 7)
  - **Blocks**: Tasks 9, 13, 18, 19
  - **Blocked By**: Task 1

  **References**:

  **Pattern References**:
  - `services/service-commercial/src/domain/commercial/entities/apporteur.entity.ts` — Pattern entité commercial existant
  - `services/service-commercial/src/domain/commercial/entities/bareme-commission.entity.ts` — Pattern entité complète avec audit
  - `services/service-commercial/src/commercial.module.ts` — Module à enrichir avec la nouvelle entité
  - `services/service-core/src/domain/organisations/entities/partenaire-marque-blanche.entity.ts` — Entité à NE PAS confondre (référence négative)

  **Documentation References**:
  - CDC §2.1 Partenaire/Compagnie: "ID, Type (Assureur, FAI, Énergie, OTT, Marketplace…), SIREN, adresses, IBAN/RIB, codes extranet, API credentials, SLA, statut d'activation par société"

  **Acceptance Criteria**:
  - [ ] Entité PartenaireCommercialEntity créée avec tous les champs listés
  - [ ] Table partenaire_commercial_societes créée (many-to-many)
  - [ ] Migration exécutée: `bun run migration:run` → SUCCESS
  - [ ] Interface IPartenaireCommercialRepository créée
  - [ ] Service d'infrastructure implémenté avec CRUD
  - [ ] Module commercial.module.ts mis à jour
  - [ ] `bun test` → PASS

  **Agent-Executed QA Scenarios**:

  ```
  Scenario: Verify partenaire_commercial table structure
    Tool: Bash
    Steps:
      1. bun run migration:run (workdir: services/service-commercial)
      2. psql commercial_db -c "\d partenaire_commercial"
      3. Assert: columns include type, iban, bic, api_base_url, sla_delai_reponse_heures, statut
      4. psql commercial_db -c "\d partenaire_commercial_societes"
      5. Assert: columns include partenaire_id, societe_id, actif, date_activation
    Expected Result: Both tables exist with correct schema
    Evidence: psql output captured
  ```

  **Commit**: YES
  - Message: `feat(commercial): create PartenaireCommercialEntity with per-company activation`
  - Files: `services/service-commercial/src/domain/commercial/entities/partenaire-commercial.entity.ts`, `services/service-commercial/src/domain/commercial/entities/partenaire-commercial-societe.entity.ts`, `services/service-commercial/src/domain/commercial/repositories/IPartenaireCommercialRepository.ts`, `services/service-commercial/src/infrastructure/persistence/typeorm/repositories/commercial/partenaire-commercial.service.ts`, `services/service-commercial/src/migrations/*.ts`, `services/service-commercial/src/commercial.module.ts`

---

- [ ] 5. Enrichir ProduitEntity — Champs contractuels et comptables

  **What to do**:
  - Ajouter à `ProduitEntity`:
    - `dureeEngagementMois INT NULL` — durée d'engagement en mois
    - `frequenceRenouvellement VARCHAR(50) NULL` — MENSUEL, TRIMESTRIEL, ANNUEL, UNIQUE
    - `conditionsResiliation TEXT NULL`
    - `uniteVente VARCHAR(50) DEFAULT 'UNITE'` — UNITE, MOIS, ANNEE, FORFAIT, KWH, GO
    - `codeComptable VARCHAR(20) NULL` — code comptable pour exports
    - `compteProduit VARCHAR(20) NULL` — numéro de compte produit
    - `journalVente VARCHAR(20) NULL`
    - `partenaireCommercialId UUID NULL FK` — lien vers PartenaireCommercialEntity
    - `modeleDistributionId UUID NULL FK` — lien vers ModeleDistribution
    - `typeTarification ENUM('FIXE','PALIER','RECURRENT','USAGE','BUNDLE','NEGOCIE','INDEXE') DEFAULT 'FIXE'`
    - `configTarification JSONB NULL` — config spécifique au type de tarification
  - Ajouter les relations ManyToOne vers PartenaireCommercial et ModeleDistribution
  - Créer la migration
  - Mettre à jour le proto ProduitMessage

  **Must NOT do**:
  - Ne pas modifier les champs existants de ProduitEntity
  - Ne pas modifier les services existants de tarification (le moteur avancé est Task 8)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: [`microservice-maintainer`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 4, 6, 7)
  - **Blocks**: Tasks 8, 10, 15
  - **Blocked By**: Task 1

  **References**:

  **Pattern References**:
  - `services/service-commercial/src/domain/products/entities/produit.entity.ts` — Entité à enrichir (130 lignes actuellement)
  - `packages/proto/src/products/products.proto` — Proto ProduitMessage à mettre à jour

  **Documentation References**:
  - CDC §2.1 Produit: "SKU, nom, description, type, catégorie, prix, TVA, unité, code comptable, durée engagement, fréquence renouvellement"
  - CDC §1 Objectifs: "Support des modèles tarifaires: fixe, palier/échelonné, récurrent, usage, bundle/pack, remise promo, prix négocié, indexé"

  **Acceptance Criteria**:
  - [ ] ProduitEntity a les 11 nouveaux champs
  - [ ] FK vers PartenaireCommercial et ModeleDistribution fonctionnent
  - [ ] Enum TypeTarification créé avec 7 valeurs
  - [ ] Migration exécutée sans erreur
  - [ ] Proto mis à jour
  - [ ] Produits existants conservent leurs valeurs (defaults appliqués)
  - [ ] `bun test` → PASS

  **Commit**: YES (groups with 4)
  - Message: `feat(products): enrich ProduitEntity with contractual, accounting, and tarification fields`
  - Files: `services/service-commercial/src/domain/products/entities/produit.entity.ts`, `services/service-commercial/src/migrations/*.ts`, `packages/proto/src/products/products.proto`

---

- [ ] 6. Créer FormuleProduitEntity (nouvelle entité)

  **What to do**:
  - Créer `FormuleProduitEntity` dans `services/service-commercial/src/domain/products/entities/`:
    - id (UUID PK)
    - produitId (UUID FK → Produit)
    - code (VARCHAR 50) — ex: "ESSENTIELLE", "PREMIUM", "EXCELLENCE"
    - nom (VARCHAR 200)
    - description (TEXT NULL)
    - ordre (INT DEFAULT 0) — pour affichage
    - garanties (JSONB) — [{nom, description, plafond, franchise, actif}]
    - options (JSONB NULL) — [{nom, prix_supplement, description, obligatoire}]
    - franchiseMontant (DECIMAL 12,2 NULL) — franchise globale
    - franchiseType (ENUM: FIXE, POURCENTAGE, JOURS NULL)
    - prixFormule (DECIMAL 12,2 NULL) — surcharge/réduction vs prix produit
    - typeAjustementPrix (ENUM: ABSOLU, RELATIF NULL) — le prix est-il absolu ou relatif au produit
    - actif (BOOLEAN DEFAULT true)
    - versionProduitId (UUID FK NULL → VersionProduit) — lié à une version spécifique
    - metadata (JSONB NULL)
    - created_by, modified_by, created_at, updated_at
  - Ajouter la relation OneToMany sur ProduitEntity: `formules: FormuleProduitEntity[]`
  - Créer le repository interface et le service d'infrastructure
  - Ajouter au products.module.ts
  - Créer la migration

  **Must NOT do**:
  - Ne pas créer le proto/controller ici (Task 10)
  - Ne pas implémenter le calcul de prix des formules ici (Task 8)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: [`microservice-maintainer`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 4, 5, 7)
  - **Blocks**: Tasks 10, 17, 20
  - **Blocked By**: Tasks 1, 3

  **References**:

  **Pattern References**:
  - `services/service-commercial/src/domain/products/entities/version-produit.entity.ts` — Pattern entity liée à Produit
  - `services/service-commercial/src/domain/products/entities/document-produit.entity.ts` — Autre pattern entity enfant de Version
  - `services/service-commercial/src/products.module.ts` — Module à enrichir

  **Documentation References**:
  - CDC §2.1 Formule: "Code, Nom, Garanties (JSON array), Options, Franchise, Prix ajusté"

  **Acceptance Criteria**:
  - [ ] FormuleProduitEntity créée avec tous les champs
  - [ ] Relation bidirectionnelle Produit ↔ Formules
  - [ ] JSONB garanties stocke un array structuré
  - [ ] Migration exécutée: `bun run migration:run` → SUCCESS
  - [ ] Index unique sur (produitId, code)
  - [ ] `bun test` → PASS

  **Agent-Executed QA Scenarios**:

  ```
  Scenario: Create formula with guarantees and options
    Tool: Bash
    Steps:
      1. Insert produit, then insert formule with garanties=[{nom:"Hospitalisation",plafond:10000}] and options=[{nom:"Dentaire",prix_supplement:5.99}]
      2. Query: SELECT garanties, options FROM formule_produit WHERE produit_id='<id>'
      3. Assert: garanties is valid JSON array with 1 element
      4. Assert: options is valid JSON array with 1 element
    Expected Result: JSONB fields store structured data correctly
    Evidence: Query output
  ```

  **Commit**: YES
  - Message: `feat(products): create FormuleProduitEntity with guarantees, options, and deductibles`
  - Files: `services/service-commercial/src/domain/products/entities/formule-produit.entity.ts`, `services/service-commercial/src/domain/products/repositories/IFormuleProduitRepository.ts`, `services/service-commercial/src/infrastructure/persistence/typeorm/repositories/products/formule-produit.service.ts`, `services/service-commercial/src/migrations/*.ts`, `services/service-commercial/src/products.module.ts`

---

- [ ] 7. Enrichir ModeleDistributionEntity — Liens partenaire, règles partage

  **What to do**:
  - Enrichir `ModeleDistributionEntity`:
    - `organisationId UUID NOT NULL` (ajouter scope organisation)
    - `partenaireCommercialId UUID NULL FK` — lien vers le partenaire
    - `societeId UUID NULL FK` — applicable à une société spécifique ou NULL=toutes
    - `canalVente VARCHAR(50) NULL` — TERRAIN, TELEPHONE, WEB, MARQUE_BLANCHE, MARKETPLACE
    - `tauxPartageRevenu DECIMAL(5,2) NULL` — % de revenu partagé avec partenaire
    - `tauxCommissionPartenaire DECIMAL(5,2) NULL` — commission versée au partenaire
    - `reglesPartage JSONB NULL` — règles complexes de partage
    - `actif BOOLEAN DEFAULT true`
    - `dateDebut DATE NULL`
    - `dateFin DATE NULL`
    - created_by, modified_by
  - Créer la migration
  - Mettre à jour le service et le proto si existant

  **Must NOT do**:
  - Ne pas supprimer les champs existants (code, nom, description)

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: [`microservice-maintainer`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 4, 5, 6)
  - **Blocks**: Task 11
  - **Blocked By**: Task 1

  **References**:

  **Pattern References**:
  - `services/service-commercial/src/domain/products/entities/modele-distribution.entity.ts` — Entité à enrichir (29 lignes, squelette)

  **Documentation References**:
  - CDC §3 Fonctionnalités: "Modèle de distribution — règles de partage revenus par partenaire/société/canal"

  **Acceptance Criteria**:
  - [ ] 9 nouveaux champs ajoutés
  - [ ] FK vers PartenaireCommercial et Societe
  - [ ] Migration exécutée
  - [ ] `bun test` → PASS

  **Commit**: YES (groups with 6)
  - Message: `feat(products): enrich ModeleDistribution with partner links, revenue sharing rules`
  - Files: `services/service-commercial/src/domain/products/entities/modele-distribution.entity.ts`, `services/service-commercial/src/migrations/*.ts`

---

### WAVE 2 — Services & Tarification

---

- [x] 8. Moteur de tarification avancé (multi-modèle)

  **What to do**:
  - Créer un `TarificationService` dans `services/service-commercial/src/domain/products/services/` qui implémente le calcul de prix pour chaque modèle:
    - **FIXE**: prix unitaire direct (existant via PrixProduit)
    - **PALIER**: tranches de volume avec prix dégressif — [{seuilMin, seuilMax, prixUnitaire}]
    - **RECURRENT**: prix × fréquence (mensuel/trimestriel/annuel) avec calcul prorata
    - **USAGE**: prix par unité consommée avec plancher/plafond
    - **BUNDLE**: ensemble de produits avec prix pack < somme individuelle
    - **NEGOCIE**: prix de base + surcharge/remise négociée par client
    - **INDEXE**: prix de base × coefficient d'indexation (ex: index énergie)
  - Créer les structures de configuration pour chaque modèle dans `configTarification` JSONB:
    ```typescript
    // Palier
    {paliers: [{seuilMin: 0, seuilMax: 10, prix: 100}, {seuilMin: 11, seuilMax: 50, prix: 90}]}
    // Recurrent
    {frequence: 'MENSUEL', prixMensuel: 29.99, dureeMinimale: 12}
    // Usage
    {prixParUnite: 0.05, unitesMesure: 'KWH', plancherMensuel: 10, plafondMensuel: 500}
    // Bundle
    {produitIds: ['uuid1','uuid2'], prixBundle: 49.99, remisePourcent: 15}
    // Negocie
    {prixBase: 100, margeNegociation: {min: -20, max: 10}}
    // Indexe
    {prixBase: 100, indexReference: 'CPI_FR', coefficientActuel: 1.023, dateReference: '2025-01-01'}
    ```
  - Créer l'interface `ITarificationEngine` et l'implémentation
  - Exposer via gRPC: `CalculatePrice(produitId, quantite, options) → PrixCalcule`
  - Le service doit résoudre la cascade: Formule > Grille > Promotion > Modèle tarifaire

  **Must NOT do**:
  - Ne pas modifier la grille tarifaire existante (GrilleTarifaire/PrixProduit restent pour le modèle FIXE)
  - Ne pas implémenter le connecteur OggoData ici (Task 13-14)
  - Ne pas over-engineer le modèle INDEXE (pas besoin de feed temps réel)

  **Recommended Agent Profile**:
  - **Category**: `ultrabrain`
    - Reason: Logique métier complexe avec cascades de prix et 7 modèles
  - **Skills**: [`microservice-maintainer`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 9, 10, 11)
  - **Blocks**: Tasks 14, 21
  - **Blocked By**: Task 5

  **References**:

  **Pattern References**:
  - `services/service-commercial/src/domain/products/entities/prix-produit.entity.ts` — Modèle FIXE existant
  - `services/service-commercial/src/domain/products/entities/grille-tarifaire.entity.ts` — Grille existante
  - `services/service-commercial/src/domain/products/entities/produit.entity.ts:59-71` — categorie, type, prix existants
  - `packages/proto/src/products/products.proto` — CatalogService.CalculatePrice existant à enrichir

  **Documentation References**:
  - CDC §1: "Support des modèles tarifaires: fixe, palier/échelonné, récurrent (mensuel/annuel), usage (consommation), bundle/pack, remise promo, prix négocié, indexé"
  - CDC Annexe A: JSON schemas des configurations tarifaires

  **Acceptance Criteria**:
  - [ ] ITarificationEngine interface définie avec méthode `calculate(produitId, quantite, options)`
  - [ ] 7 strategies de calcul implémentées
  - [ ] Cascade Formule > Grille > Promotion > Modèle fonctionne
  - [ ] gRPC CalculatePrice retourne le bon prix pour chaque modèle
  - [ ] Tests unitaires pour chaque modèle tarifaire
  - [ ] `bun test` → PASS

  **Agent-Executed QA Scenarios**:

  ```
  Scenario: Calculate tiered pricing (PALIER)
    Tool: Bash (grpcurl)
    Steps:
      1. Create product with typeTarification=PALIER, configTarification={paliers:[{seuilMin:0,seuilMax:10,prix:100},{seuilMin:11,seuilMax:50,prix:90}]}
      2. CalculatePrice(produitId, quantite=5) → Assert prix=500 (5×100)
      3. CalculatePrice(produitId, quantite=15) → Assert prix=1000+450=1450 (10×100 + 5×90)
    Expected Result: Tiered pricing correctly calculated
    Evidence: gRPC responses

  Scenario: Calculate bundle pricing (BUNDLE)
    Tool: Bash (grpcurl)
    Steps:
      1. Create 2 products (A=30€, B=25€)
      2. Create bundle product with typeTarification=BUNDLE, configTarification={produitIds:[A,B],prixBundle:49.99}
      3. CalculatePrice(bundleId, 1) → Assert prix=49.99 (not 55)
    Expected Result: Bundle price applied instead of sum
    Evidence: gRPC response

  Scenario: Price cascade priority (Formule > Grille > Promo > Base)
    Tool: Bash (grpcurl)
    Steps:
      1. Create product prix=100, promotion prix=80, grille prix=90, formule prix=75
      2. CalculatePrice with formuleId → Assert prix=75 (formule wins)
      3. CalculatePrice without formuleId → Assert prix=80 (promotion wins over grille)
    Expected Result: Cascade priority respected
    Evidence: gRPC responses
  ```

  **Commit**: YES
  - Message: `feat(products): implement multi-model pricing engine (fixed, tiered, recurring, usage, bundle, negotiated, indexed)`
  - Files: `services/service-commercial/src/domain/products/services/tarification.engine.ts`, `services/service-commercial/src/domain/products/services/tarification-strategies/*.ts`, `services/service-commercial/src/infrastructure/persistence/typeorm/repositories/products/tarification.service.ts`

---

- [x] 9. Proto + gRPC PartenaireCommercial

  **What to do**:
  - Créer `packages/proto/src/partenaires/partenaires.proto` avec:
    - PartenaireCommercialMessage (tous les champs de l'entité)
    - PartenaireCommercialSocieteMessage (activation par société)
    - PartenaireCommercialService: Create, Update, Get, List, Delete, Search, Activer, Desactiver, ActiverPourSociete, DesactiverPourSociete, ListBySociete
  - Créer le controller gRPC dans `services/service-commercial/src/interfaces/grpc/controllers/commercial/partenaire-commercial.controller.ts`
  - Créer les DTOs dans `services/service-commercial/src/application/dtos/commercial/`
  - Générer les types TypeScript: `bun run proto:generate`
  - Créer le client gRPC frontend dans `frontend/src/lib/grpc/clients/partenaires.ts`
  - Créer les server actions frontend dans `frontend/src/actions/partenaires.ts`

  **Must NOT do**:
  - Ne pas créer la page frontend ici (Task 19)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: [`microservice-maintainer`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 8, 10, 11)
  - **Blocks**: Tasks 13, 19
  - **Blocked By**: Task 4

  **References**:

  **Pattern References**:
  - `packages/proto/src/commerciaux/commerciaux.proto` — Pattern proto existant (ApporteurService)
  - `services/service-commercial/src/interfaces/grpc/controllers/commercial/apporteur.controller.ts` — Pattern controller commercial
  - `frontend/src/lib/grpc/clients/commerciaux.ts` — Pattern client gRPC frontend
  - `frontend/src/actions/commerciaux.ts` — Pattern server actions

  **Acceptance Criteria**:
  - [ ] Proto compilé: `bun run proto:generate` → SUCCESS
  - [ ] Controller gRPC créé et enregistré dans commercial.module.ts
  - [ ] CRUD complet fonctionne via grpcurl
  - [ ] Client frontend et server actions créés
  - [ ] `bun test` → PASS

  **Commit**: YES
  - Message: `feat(commercial): add PartenaireCommercial gRPC service with full CRUD and per-company activation`
  - Files: `packages/proto/src/partenaires/partenaires.proto`, `services/service-commercial/src/interfaces/grpc/controllers/commercial/partenaire-commercial.controller.ts`, `services/service-commercial/src/application/dtos/commercial/partenaire-commercial.dto.ts`, `frontend/src/lib/grpc/clients/partenaires.ts`, `frontend/src/actions/partenaires.ts`

---

- [x] 10. Proto + gRPC FormuleProduit

  **What to do**:
  - Ajouter au proto `products.proto` (ou créer `formules.proto`):
    - FormuleProduitMessage
    - FormuleProduitService: Create, Update, Get, ListByProduit, Delete, Activer, Desactiver
  - Créer le controller gRPC `formule-produit.controller.ts`
  - Créer les DTOs
  - Générer les types, client frontend, server actions

  **Must NOT do**:
  - Ne pas créer la page frontend (Task 20)

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: [`microservice-maintainer`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 8, 9, 11)
  - **Blocks**: Task 20
  - **Blocked By**: Tasks 5, 6

  **References**:

  **Pattern References**:
  - `packages/proto/src/products/products.proto` — Proto products existant
  - `services/service-commercial/src/interfaces/grpc/controllers/products/` — Controllers products existants
  - `frontend/src/actions/catalogue.ts` — Server actions catalogue existants

  **Acceptance Criteria**:
  - [ ] Proto compilé, types générés
  - [ ] CRUD FormuleProduit fonctionne via grpcurl
  - [ ] ListByProduit retourne les formules d'un produit
  - [ ] Server actions frontend créés
  - [ ] `bun test` → PASS

  **Commit**: YES
  - Message: `feat(products): add FormuleProduit gRPC service`
  - Files: `packages/proto/src/products/products.proto`, `services/service-commercial/src/interfaces/grpc/controllers/products/formule-produit.controller.ts`, `frontend/src/actions/catalogue.ts`

---

- [x] 11. Canaux de vente — Entity, Enum, Proto

  **What to do**:
  - Créer l'enum `CanalVente` : TERRAIN, TELEPHONE, WEB, MARQUE_BLANCHE, MARKETPLACE
  - Créer `CanalVenteProduitEntity` (many-to-many Produit ↔ Canal): produit_id, canal, actif, config JSONB (ex: script de vente, documents requis par canal)
  - Ajouter le canal de vente au proto ProduitMessage et ContratMessage
  - Ajouter `canalVente` sur `LigneContratEntity` pour tracer le canal de souscription
  - Migration TypeORM

  **Must NOT do**:
  - Ne pas modifier le frontend catalogue existant (Wave 5)

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: [`microservice-maintainer`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 8, 9, 10)
  - **Blocks**: Task 22
  - **Blocked By**: Task 7

  **References**:

  **Pattern References**:
  - `services/service-commercial/src/domain/products/entities/publication-produit.entity.ts:31-32` — channels[] JSONB existant (approche similaire)
  - `services/service-commercial/src/domain/commercial/entities/bareme-commission.entity.ts:81-82` — canalVente déjà sur baremes

  **Documentation References**:
  - CDC §3: "Segmentation par canal: Terrain, Téléphone, Web, Marque Blanche, Marketplace"

  **Acceptance Criteria**:
  - [ ] Enum CanalVente créé
  - [ ] Table canal_vente_produit créée avec migration
  - [ ] Proto mis à jour
  - [ ] `bun test` → PASS

  **Commit**: YES
  - Message: `feat(products): add sales channels segmentation (Terrain, Phone, Web, WhiteLabel, Marketplace)`
  - Files: `services/service-commercial/src/domain/products/entities/canal-vente-produit.entity.ts`, `services/service-commercial/src/migrations/*.ts`, `packages/proto/src/products/products.proto`

---

### WAVE 3 — Intégrations & Événements

---

- [ ] 12. Système webhooks produit (NATS)

  **What to do**:
  - Créer `ProductEventPublisher` dans service-commercial qui émet des événements NATS sur:
    - `product.created` — quand un produit est créé
    - `product.updated` — quand un produit est modifié
    - `product.status_changed` — quand le cycle de vie change (Brouillon→Actif, etc.)
    - `product.published` — quand une publication est créée/activée
    - `product.price_changed` — quand un prix est modifié
    - `product.partner_linked` — quand un partenaire commercial est associé
  - Créer les proto messages d'événements dans `packages/proto/src/events/product_events.proto`
  - Créer un `WebhookDispatcherService` qui:
    - Consomme les événements NATS
    - Maintient un registre d'abonnés (URL callback + événements souscrits)
    - Envoie les POST HTTP aux abonnés
    - Gère les statuts: ENVOYE, CONFIRME, ECHOUE, REJOUE
    - Implémente retry avec backoff exponentiel
  - Créer `WebhookSubscriptionEntity` pour stocker les abonnements
  - Créer `WebhookDeliveryEntity` pour tracer les livraisons (log)

  **Must NOT do**:
  - Ne pas modifier les événements existants (contract.signed, payment.received)
  - Ne pas créer de UI d'administration des webhooks (hors scope CDC immédiat)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: [`microservice-maintainer`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Tasks 13, 14, 15)
  - **Blocks**: Task 24
  - **Blocked By**: None (NATS infra already exists)

  **References**:

  **Pattern References**:
  - `packages/proto/src/events/contract_events.proto` — Pattern proto events existant
  - `packages/proto/src/events/payment_events.proto` — Autre pattern events
  - `packages/shared-kernel/src/infrastructure/nats/` — Utilitaires NATS partagés
  - `services/service-engagement/src/infrastructure/messaging/nats/handlers/` — Pattern event handlers

  **Documentation References**:
  - CDC Annexe C: "Statuts webhook: ENVOYE, CONFIRME (2xx), ECHOUE (timeout/5xx), REJOUE"

  **Acceptance Criteria**:
  - [ ] ProductEventPublisher émet sur NATS lors des opérations produit
  - [ ] Proto product_events.proto créé avec tous les types d'événements
  - [ ] WebhookSubscriptionEntity et WebhookDeliveryEntity créées
  - [ ] WebhookDispatcher envoie les POST HTTP aux abonnés
  - [ ] Retry avec backoff exponentiel fonctionne
  - [ ] `bun test` → PASS

  **Agent-Executed QA Scenarios**:

  ```
  Scenario: Product creation emits NATS event
    Tool: Bash
    Steps:
      1. Subscribe to product.created on NATS: nats sub product.created &
      2. Create a product via gRPC
      3. Assert: NATS message received with product data
    Expected Result: Event published on product.created
    Evidence: NATS message captured

  Scenario: Webhook delivery with retry
    Tool: Bash
    Steps:
      1. Register webhook subscription (URL=httpbin.org/status/500, events=[product.created])
      2. Create a product → triggers webhook
      3. Query webhook_delivery: Assert status=ECHOUE, retry_count > 0
      4. Update subscription URL to httpbin.org/post
      5. Trigger manual replay
      6. Assert: status=CONFIRME
    Expected Result: Failed delivery retried, success recorded
    Evidence: DB records captured
  ```

  **Commit**: YES
  - Message: `feat(products): implement product webhook system via NATS with delivery tracking and retry`
  - Files: `packages/proto/src/events/product_events.proto`, `services/service-commercial/src/infrastructure/messaging/nats/publishers/product-event.publisher.ts`, `services/service-commercial/src/domain/products/entities/webhook-subscription.entity.ts`, `services/service-commercial/src/domain/products/entities/webhook-delivery.entity.ts`, `services/service-commercial/src/infrastructure/messaging/webhooks/webhook-dispatcher.service.ts`

---

- [ ] 13. Port/Adapter OggoData — Interface + Mock

  **What to do**:
  - Créer le port (interface) `IOggoDataAdapter` dans `services/service-commercial/src/application/ports/`:
    ```typescript
    interface IOggoDataAdapter {
      consulterTarif(params: ConsultationTarifaireRequest): Promise<ConsultationTarifaireResponse>;
      synchroniserFichePartenaire(partenaireId: string): Promise<FichePartenaire>;
      recevoirWebhook(payload: OggoWebhookPayload): Promise<void>;
      verifierDisponibilite(): Promise<HealthCheck>;
    }
    ```
  - Définir les types Request/Response dans `services/service-commercial/src/application/dtos/oggodata/`
  - Créer le mock adapter `OggoDataMockAdapter` qui retourne des données réalistes pour le développement
  - Créer le controller webhook pour recevoir les callbacks OggoData
  - Enregistrer le port dans le module avec injection par token (pour switcher mock/réel)

  **Must NOT do**:
  - Ne pas implémenter l'appel HTTP réel ici (Task 14)
  - Ne pas stocker de credentials OggoData en dur

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: [`microservice-maintainer`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Tasks 12, 14, 15)
  - **Blocks**: Task 14
  - **Blocked By**: Task 9

  **References**:

  **Pattern References**:
  - Architecture DDD du projet: ports dans application/, adapters dans infrastructure/
  - `services/service-logistics/src/` — Pattern d'intégration externe (Maileva)

  **Documentation References**:
  - CDC §3: "Intégrations partenaires (OggoData / APIMarket): consultation tarifaire automatique, synchronisation fiches, webhooks"

  **Acceptance Criteria**:
  - [ ] Interface IOggoDataAdapter définie avec 4 méthodes
  - [ ] Types Request/Response créés
  - [ ] MockAdapter retourne des données cohérentes
  - [ ] Injection par token permet de switcher mock/réel
  - [ ] Controller webhook peut recevoir des POST
  - [ ] `bun test` → PASS

  **Commit**: YES
  - Message: `feat(oggodata): create port/adapter interface with mock implementation`
  - Files: `services/service-commercial/src/application/ports/IOggoDataAdapter.ts`, `services/service-commercial/src/application/dtos/oggodata/*.ts`, `services/service-commercial/src/infrastructure/integrations/oggodata/oggodata-mock.adapter.ts`, `services/service-commercial/src/interfaces/http/webhooks/oggodata-webhook.controller.ts`

---

- [ ] 14. Implémentation réelle OggoData

  **What to do**:
  - Créer `OggoDataHttpAdapter` dans `services/service-commercial/src/infrastructure/integrations/oggodata/`:
    - Implémente `IOggoDataAdapter`
    - Utilise HttpService (Axios) pour les appels REST
    - Gère l'authentification (OAuth2 client_credentials ou API Key selon les specs OggoData)
    - Consultation tarifaire: POST /api/tarification avec les paramètres produit/client
    - Sync fiches: GET /api/partenaires/{id} et mise à jour locale
    - Healthcheck: GET /api/health
  - Configurer via variables d'environnement: OGGODATA_API_URL, OGGODATA_CLIENT_ID, OGGODATA_CLIENT_SECRET
  - Ajouter circuit breaker (retry + fallback vers mock/cache)
  - Ajouter logging des appels API (durée, status, erreurs)
  - Lier au moteur de tarification (Task 8): quand typeTarification=INDEXE et partenaire a apiBaseUrl, appeler OggoData

  **Must NOT do**:
  - Ne pas hard-coder les credentials
  - Ne pas faire d'appels synchrones bloquants en production (utiliser cache + async)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: [`microservice-maintainer`]

  **Parallelization**:
  - **Can Run In Parallel**: YES (si specs OggoData disponibles)
  - **Parallel Group**: Wave 3 (with Tasks 12, 15)
  - **Blocks**: Task 24
  - **Blocked By**: Tasks 8, 13

  **References**:

  **Pattern References**:
  - `services/service-commercial/src/infrastructure/integrations/oggodata/oggodata-mock.adapter.ts` — Mock créé en Task 13
  - `services/service-logistics/src/infrastructure/` — Pattern intégration HTTP externe (Maileva)

  **External References**:
  - OggoData API documentation (à obtenir du partenaire)

  **Acceptance Criteria**:
  - [ ] OggoDataHttpAdapter implémente IOggoDataAdapter
  - [ ] Authentification gérée (OAuth2 ou API Key)
  - [ ] Circuit breaker avec fallback vers cache/mock
  - [ ] Variables d'environnement configurées
  - [ ] Logging des appels API
  - [ ] `bun test` → PASS (avec mock server ou WireMock)

  **Commit**: YES
  - Message: `feat(oggodata): implement real HTTP adapter with circuit breaker and caching`
  - Files: `services/service-commercial/src/infrastructure/integrations/oggodata/oggodata-http.adapter.ts`, `services/service-commercial/src/infrastructure/integrations/oggodata/oggodata.module.ts`

---

- [ ] 15. Mapping comptable produit + Exports CSV/Excel

  **What to do**:
  - Créer `MappingComptableService` dans service-commercial:
    - Résout le mapping: Produit → (codeComptable, compteProduit, journalVente) en cascade: Produit > Gamme > Société > Défaut
    - Génère les écritures comptables pour chaque vente
  - Créer un endpoint gRPC `ComptabiliteService`:
    - `ExportComptable(societeId, dateDebut, dateFin, format)` → fichier CSV ou Excel
    - `GetMappingComptable(produitId)` → mapping résolu
    - `UpdateMappingComptable(produitId, mapping)` → mise à jour du mapping
  - Format export CSV: conforme à l'Annexe F du CDC (colonnes: date, journal, compte, libellé, débit, crédit, pièce)
  - Format export Excel: idem avec en-têtes + sheet par journal
  - Utiliser `exceljs` (ou `xlsx`) pour la génération Excel
  - Créer l'endpoint REST (pas gRPC) pour le téléchargement de fichier: GET /api/exports/comptabilite?societeId=&debut=&fin=&format=csv|xlsx

  **Must NOT do**:
  - Ne pas créer un système comptable complet (juste le mapping et l'export)
  - Ne pas modifier service-finance (les écritures restent dans service-commercial pour le mapping produit)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: [`microservice-maintainer`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Tasks 12, 13, 14)
  - **Blocks**: Task 23
  - **Blocked By**: Tasks 2, 5

  **References**:

  **Pattern References**:
  - `services/service-commercial/src/domain/products/entities/produit.entity.ts` — codeComptable, compteProduit, journalVente (ajoutés Task 5)
  - `services/service-core/src/domain/organisations/entities/societe.entity.ts` — journalVente, compteProduitDefaut (ajoutés Task 2)

  **Documentation References**:
  - CDC Annexe F: "Exports comptables CSV/Excel par société: date, journal, compte, libellé, débit, crédit, pièce"

  **Acceptance Criteria**:
  - [ ] MappingComptableService résout la cascade Produit > Gamme > Société > Défaut
  - [ ] Export CSV conforme à l'Annexe F
  - [ ] Export Excel avec sheets par journal
  - [ ] Endpoint REST de téléchargement fonctionne
  - [ ] `bun test` → PASS

  **Agent-Executed QA Scenarios**:

  ```
  Scenario: Export CSV comptable
    Tool: Bash (curl)
    Steps:
      1. Create société with journal_vente="VT01", compte_produit_defaut="701000"
      2. Create products with sales (contrats signés)
      3. curl -o export.csv "http://localhost:3001/api/exports/comptabilite?societeId=<id>&debut=2025-01-01&fin=2025-12-31&format=csv"
      4. Assert: HTTP 200, Content-Type: text/csv
      5. Assert: file contains headers: date,journal,compte,libelle,debit,credit,piece
      6. Assert: at least 1 data row
    Expected Result: Valid CSV file downloaded
    Evidence: File content captured

  Scenario: Export Excel comptable
    Tool: Bash (curl)
    Steps:
      1. Same setup as above
      2. curl -o export.xlsx "...&format=xlsx"
      3. Assert: HTTP 200, Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
      4. Assert: file size > 0
    Expected Result: Valid XLSX file downloaded
    Evidence: File saved
  ```

  **Commit**: YES
  - Message: `feat(products): implement accounting mapping and CSV/Excel export per company`
  - Files: `services/service-commercial/src/domain/products/services/mapping-comptable.service.ts`, `services/service-commercial/src/interfaces/http/controllers/export-comptable.controller.ts`, `packages/proto/src/products/products.proto`

---

### WAVE 4 — Catalogue & Documents

---

- [ ] 16. Entité Catalogue agrégé publishable

  **What to do**:
  - Créer `CatalogueEntity` dans `services/service-commercial/src/domain/products/entities/`:
    - id (UUID PK)
    - organisationId (UUID)
    - societeId (UUID FK)
    - nom (VARCHAR 200)
    - description (TEXT NULL)
    - statut (ENUM: BROUILLON, PUBLIE, ARCHIVE)
    - datePublication (TIMESTAMP NULL)
    - dateArchivage (TIMESTAMP NULL)
    - versionProduitIds (UUID[] / JSONB) — snapshot des versions publiées
    - canalVente (VARCHAR 50 NULL) — catalogue par canal
    - periodeValidite (JSONB) — {debut, fin}
    - created_by, modified_by, created_at, updated_at
  - Créer `CatalogueService` qui:
    - Agrège les produits publiés (PublicationProduit) pour une société/canal
    - Permet de "figer" un catalogue (snapshot des versions actuelles)
    - Gère le cycle Brouillon → Publié → Archivé
  - Proto + gRPC: CatalogueService (Create, Publish, Archive, Get, List, GetPublished)
  - Migration

  **Must NOT do**:
  - Ne pas supprimer le CatalogService.GetCatalog existant (il reste pour la consultation dynamique)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-low`
  - **Skills**: [`microservice-maintainer`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4 (with Tasks 17, 18)
  - **Blocks**: Task 22
  - **Blocked By**: Task 10

  **References**:

  **Pattern References**:
  - `services/service-commercial/src/domain/products/entities/publication-produit.entity.ts` — Publication individuelle existante
  - `packages/proto/src/products/products.proto` — CatalogService existant

  **Documentation References**:
  - CDC §3: "Catalogue publishable avec état Brouillon/Publié/Archivé"

  **Acceptance Criteria**:
  - [ ] CatalogueEntity créée avec tous les champs
  - [ ] Cycle Brouillon → Publié → Archivé fonctionne
  - [ ] Snapshot fige les versions actuelles
  - [ ] gRPC GetPublished retourne le catalogue actif d'une société
  - [ ] `bun test` → PASS

  **Commit**: YES
  - Message: `feat(products): create publishable Catalogue aggregate with lifecycle management`
  - Files: `services/service-commercial/src/domain/products/entities/catalogue.entity.ts`, `services/service-commercial/src/infrastructure/persistence/typeorm/repositories/products/catalogue.service.ts`, `services/service-commercial/src/interfaces/grpc/controllers/products/catalogue.controller.ts`, `services/service-commercial/src/migrations/*.ts`

---

- [ ] 17. DIPA dynamique — Génération par canal/produit

  **What to do**:
  - Créer `DipaGeneratorService` qui:
    - Prend un produit + formule + canal en entrée
    - Génère un Document d'Information Précontractuelle Adapté (DIPA) au format PDF ou HTML
    - Utilise des templates Handlebars par canal (terrain vs web vs téléphone)
    - Inclut: garanties, exclusions, franchise, prix, conditions de résiliation
    - Stocke le DIPA généré comme DocumentProduit (type=DIPA)
  - Templates dans `services/service-commercial/src/infrastructure/templates/dipa/`:
    - `dipa-terrain.hbs`, `dipa-web.hbs`, `dipa-telephone.hbs`
  - Endpoint gRPC: `GenerateDipa(produitId, formuleId, canalVente) → DocumentProduitMessage`
  - Utiliser `puppeteer` ou `@react-pdf/renderer` pour la génération PDF

  **Must NOT do**:
  - Ne pas créer un éditeur WYSIWYG de DIPA (template-based uniquement)
  - Ne pas remplacer les DIPA uploadés manuellement (coexistence)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-low`
  - **Skills**: [`microservice-maintainer`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4 (with Tasks 16, 18)
  - **Blocks**: None
  - **Blocked By**: Task 6

  **References**:

  **Pattern References**:
  - `services/service-commercial/src/domain/products/entities/document-produit.entity.ts` — TypeDocumentProduit.DIPA existe déjà
  - `services/service-commercial/src/domain/products/entities/formule-produit.entity.ts` — Garanties/options (Task 6)

  **Documentation References**:
  - CDC Annexe B: "Documents légaux par canal — DIPA obligatoire pour chaque canal de distribution"

  **Acceptance Criteria**:
  - [ ] Templates DIPA créés pour 3 canaux
  - [ ] GenerateDipa retourne un DocumentProduit avec fileUrl vers le PDF/HTML
  - [ ] DIPA contient: garanties, prix, conditions résiliation du produit/formule
  - [ ] `bun test` → PASS

  **Commit**: YES
  - Message: `feat(products): implement dynamic DIPA generation by channel and product/formula`
  - Files: `services/service-commercial/src/domain/products/services/dipa-generator.service.ts`, `services/service-commercial/src/infrastructure/templates/dipa/*.hbs`

---

- [ ] 18. Enrichir ContratEntity — FK partenaire, canal de vente

  **What to do**:
  - Ajouter à `ContratEntity`:
    - `partenaireCommercialId UUID NULL FK` → lien vers PartenaireCommercialEntity
    - `canalVente VARCHAR(50) NULL` — canal par lequel le contrat a été souscrit
    - `formuleId UUID NULL FK` → formule souscrite
    - `catalogueId UUID NULL FK` → catalogue source
  - Ajouter les relations ManyToOne
  - Enrichir `LigneContratEntity`:
    - `formuleId UUID NULL FK`
    - `canalVente VARCHAR(50) NULL`
  - Créer la migration
  - Mettre à jour le proto contrats.proto

  **Must NOT do**:
  - Ne pas modifier la logique métier existante des contrats
  - Ne pas modifier le workflow de signature existant

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: [`microservice-maintainer`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4 (with Tasks 16, 17)
  - **Blocks**: None
  - **Blocked By**: Task 4

  **References**:

  **Pattern References**:
  - `services/service-commercial/src/domain/contrats/entities/contrat.entity.ts` — Entité à enrichir
  - `services/service-commercial/src/domain/contrats/entities/ligne-contrat.entity.ts` — Ligne à enrichir
  - `packages/proto/src/contrats/contrats.proto` — Proto à mettre à jour

  **Acceptance Criteria**:
  - [ ] ContratEntity a les 4 nouveaux champs avec FK
  - [ ] LigneContratEntity a formuleId et canalVente
  - [ ] Migration exécutée
  - [ ] Proto mis à jour
  - [ ] Contrats existants non affectés (nullable)
  - [ ] `bun test` → PASS

  **Commit**: YES
  - Message: `feat(contrats): add partner, channel, formula, and catalogue references to contracts`
  - Files: `services/service-commercial/src/domain/contrats/entities/contrat.entity.ts`, `services/service-commercial/src/domain/contrats/entities/ligne-contrat.entity.ts`, `services/service-commercial/src/migrations/*.ts`, `packages/proto/src/contrats/contrats.proto`

---

### WAVE 5 — Frontend

---

- [ ] 19. Page gestion Partenaires Commerciaux

  **What to do**:
  - Créer la page `/partenaires` dans `frontend/src/app/(main)/partenaires/`:
    - `page.tsx` (server component)
    - `partenaires-page-client.tsx` (client component)
  - Composants dans `frontend/src/components/partenaires/`:
    - `partenaires-table.tsx` — tableau avec colonnes: Dénomination, Type, SIREN, Statut, Sociétés actives, Contact
    - `partenaires-filters.tsx` — filtres: type, statut, société
    - `create-partenaire-dialog.tsx` — formulaire création complet (tous les champs de l'entité)
    - `edit-partenaire-dialog.tsx` — édition avec onglets (Infos, Financier, API, SLA, Sociétés)
    - `partenaire-detail-panel.tsx` — panneau latéral avec détails + liste des produits associés
    - `activation-societe-dialog.tsx` — gérer l'activation par société
  - Ajouter l'entrée dans la sidebar navigation (`app-sidebar.tsx`)
  - Hooks: `frontend/src/hooks/partenaires/use-partenaires.ts`

  **Must NOT do**:
  - Ne pas modifier les pages existantes
  - Ne pas intégrer de portail self-service partenaire

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: [`frontend-ui-ux`]
    - `frontend-ui-ux`: Design et implémentation UI/UX de qualité

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 5 (with Tasks 20-24)
  - **Blocks**: None
  - **Blocked By**: Task 9

  **References**:

  **Pattern References**:
  - `frontend/src/app/(main)/commerciaux/` — Pattern page existant (table + filtres + dialogs)
  - `frontend/src/components/commerciaux/` — Pattern composants CRUD
  - `frontend/src/actions/commerciaux.ts` — Pattern server actions
  - `frontend/src/components/app-sidebar.tsx` — Navigation sidebar à mettre à jour

  **Acceptance Criteria**:
  - [ ] Page /partenaires accessible depuis la sidebar
  - [ ] Tableau affiche les partenaires avec filtres
  - [ ] Création d'un partenaire via dialog fonctionne
  - [ ] Édition avec onglets fonctionne
  - [ ] Activation/désactivation par société fonctionne
  - [ ] Responsive sur mobile

  **Agent-Executed QA Scenarios**:

  ```
  Scenario: Navigate to partenaires page and create partner
    Tool: Playwright
    Preconditions: Dev server running, user authenticated
    Steps:
      1. Navigate to: http://localhost:3000/partenaires
      2. Wait for: table visible (timeout: 10s)
      3. Click: button containing "Nouveau partenaire" or "Créer"
      4. Wait for: dialog visible
      5. Fill: input[name="denomination"] → "Partenaire Test SARL"
      6. Select: select[name="type"] → "ASSUREUR"
      7. Fill: input[name="siren"] → "123456789"
      8. Fill: input[name="contactCommercialEmail"] → "contact@test.com"
      9. Click: button[type="submit"]
      10. Wait for: dialog closes, table refreshes
      11. Assert: table contains "Partenaire Test SARL"
      12. Screenshot: .sisyphus/evidence/task-19-create-partner.png
    Expected Result: Partner created and visible in table
    Evidence: .sisyphus/evidence/task-19-create-partner.png

  Scenario: Activate partner for specific company
    Tool: Playwright
    Steps:
      1. Click on partner row to open detail
      2. Click "Gérer les sociétés" or activation tab
      3. Toggle activation for a specific société
      4. Assert: status changes to "Actif" for that société
      5. Screenshot: .sisyphus/evidence/task-19-activate-company.png
    Expected Result: Per-company activation works
    Evidence: .sisyphus/evidence/task-19-activate-company.png
  ```

  **Commit**: YES
  - Message: `feat(frontend): add Partner Management page with full CRUD and per-company activation`
  - Files: `frontend/src/app/(main)/partenaires/**`, `frontend/src/components/partenaires/**`, `frontend/src/hooks/partenaires/**`, `frontend/src/components/app-sidebar.tsx`

---

- [ ] 20. UI Formules Produit (dans le détail produit)

  **What to do**:
  - Enrichir le panneau de détail produit (`product-details-panel.tsx`) avec un nouvel onglet "Formules"
  - Composants dans `frontend/src/components/catalogue/formules/`:
    - `formules-list.tsx` — liste des formules d'un produit
    - `create-formule-dialog.tsx` — création avec champs: code, nom, garanties (array builder), options (array builder), franchise, prix
    - `edit-formule-dialog.tsx` — édition
    - `garanties-editor.tsx` — éditeur inline de garanties (ajouter/supprimer/modifier)
    - `options-editor.tsx` — éditeur inline d'options
  - Server actions dans `frontend/src/actions/catalogue.ts` (ajouter formules CRUD)
  - Hook: `frontend/src/hooks/catalogue/use-formules.ts`

  **Must NOT do**:
  - Ne pas modifier le layout existant du catalogue (ajouter un onglet, pas refondre)

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: [`frontend-ui-ux`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 5 (with Tasks 19, 21-24)
  - **Blocks**: None
  - **Blocked By**: Task 10

  **References**:

  **Pattern References**:
  - `frontend/src/components/catalogue/product-details-panel.tsx` — Panneau à enrichir
  - `frontend/src/components/commissions/manage-paliers-dialog.tsx` — Pattern éditeur array inline (paliers de commission)
  - `frontend/src/actions/catalogue.ts` — Actions existantes à enrichir

  **Acceptance Criteria**:
  - [ ] Onglet "Formules" visible dans le détail produit
  - [ ] CRUD formules complet
  - [ ] Éditeur garanties inline fonctionne (ajouter/modifier/supprimer)
  - [ ] Éditeur options inline fonctionne

  **Agent-Executed QA Scenarios**:

  ```
  Scenario: Add formula with guarantees to product
    Tool: Playwright
    Steps:
      1. Navigate to /catalogue
      2. Click on a product to open detail panel
      3. Click tab "Formules"
      4. Click "Ajouter une formule"
      5. Fill code="PREMIUM", nom="Formule Premium"
      6. In garanties editor, click "Ajouter" → fill nom="Hospitalisation", plafond=10000
      7. In options editor, click "Ajouter" → fill nom="Dentaire", prix_supplement=5.99
      8. Submit
      9. Assert: formule appears in list
      10. Screenshot: .sisyphus/evidence/task-20-formula-created.png
    Expected Result: Formula with guarantees and options created
    Evidence: .sisyphus/evidence/task-20-formula-created.png
  ```

  **Commit**: YES
  - Message: `feat(frontend): add Formula management UI in product detail panel`
  - Files: `frontend/src/components/catalogue/formules/**`, `frontend/src/components/catalogue/product-details-panel.tsx`, `frontend/src/actions/catalogue.ts`, `frontend/src/hooks/catalogue/use-formules.ts`

---

- [ ] 21. UI Tarification avancée

  **What to do**:
  - Enrichir le formulaire de création/édition produit pour supporter les 7 modèles tarifaires
  - Composants dans `frontend/src/components/catalogue/tarification/`:
    - `tarification-selector.tsx` — sélecteur de type (radio/select avec description de chaque modèle)
    - `config-fixe.tsx` — formulaire prix fixe (existant, wrapper)
    - `config-palier.tsx` — éditeur de paliers avec tableau editable (seuilMin, seuilMax, prix)
    - `config-recurrent.tsx` — fréquence + prix mensuel + durée minimale
    - `config-usage.tsx` — prix/unité + unité de mesure + plancher/plafond
    - `config-bundle.tsx` — sélecteur multi-produits + prix bundle
    - `config-negocie.tsx` — prix base + marge négociation (min/max)
    - `config-indexe.tsx` — prix base + index référence + coefficient
    - `prix-calculator-preview.tsx` — simulateur de prix (appelle CalculatePrice et affiche le résultat)
  - Intégrer dans `create-product-dialog.tsx` et `edit-product-dialog.tsx`

  **Must NOT do**:
  - Ne pas supprimer la gestion de prix fixe existante

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: [`frontend-ui-ux`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 5 (with Tasks 19, 20, 22-24)
  - **Blocks**: None
  - **Blocked By**: Task 8

  **References**:

  **Pattern References**:
  - `frontend/src/components/catalogue/create-product-dialog.tsx` — Dialog à enrichir
  - `frontend/src/components/catalogue/edit-product-dialog.tsx` — Dialog à enrichir
  - `frontend/src/components/commissions/manage-paliers-dialog.tsx` — Pattern éditeur paliers (à réutiliser pour config-palier)

  **Acceptance Criteria**:
  - [ ] 7 types de tarification sélectionnables
  - [ ] Chaque type affiche son formulaire de configuration spécifique
  - [ ] Simulateur de prix fonctionne pour chaque type
  - [ ] Données sauvegardées correctement en JSONB

  **Commit**: YES
  - Message: `feat(frontend): add advanced pricing configuration UI for 7 tarification models`
  - Files: `frontend/src/components/catalogue/tarification/**`, `frontend/src/components/catalogue/create-product-dialog.tsx`, `frontend/src/components/catalogue/edit-product-dialog.tsx`

---

- [ ] 22. UI Canaux de vente & Catalogue publishable

  **What to do**:
  - Ajouter un onglet "Canaux" dans le détail produit pour gérer les canaux de vente par produit
  - Créer la page `/catalogues` (ou section dans /catalogue) pour gérer les catalogues publishables:
    - Liste des catalogues avec statut (Brouillon/Publié/Archivé)
    - Création de catalogue: sélection société + canal + produits
    - Publication: bouton "Publier" qui change le statut
    - Archivage
  - Composants: `catalogues-list.tsx`, `create-catalogue-dialog.tsx`, `catalogue-detail.tsx`
  - Server actions pour CatalogueService

  **Must NOT do**:
  - Ne pas modifier la page catalogue existante (ajouter à côté)

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: [`frontend-ui-ux`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 5 (with Tasks 19-21, 23, 24)
  - **Blocks**: None
  - **Blocked By**: Tasks 11, 16

  **References**:

  **Pattern References**:
  - `frontend/src/components/catalogue/product-details-panel.tsx` — Panel à enrichir (onglet Canaux)
  - `frontend/src/components/catalogue/catalogue-filters.tsx` — Filtres existants

  **Acceptance Criteria**:
  - [ ] Onglet "Canaux" dans le détail produit
  - [ ] Page/section catalogues publishables
  - [ ] Workflow Brouillon → Publié → Archivé fonctionne
  - [ ] Sélection produits pour catalogue fonctionne

  **Commit**: YES
  - Message: `feat(frontend): add sales channels UI and publishable catalog management`
  - Files: `frontend/src/app/(main)/catalogues/**`, `frontend/src/components/catalogues/**`, `frontend/src/components/catalogue/channels-tab.tsx`

---

- [ ] 23. UI Mapping comptable & Exports

  **What to do**:
  - Ajouter un onglet "Comptabilité" dans le détail produit pour le mapping comptable (code, compte, journal)
  - Créer la page `/exports-comptables` (ou section dans paramètres):
    - Sélecteur société + période
    - Boutons "Export CSV" et "Export Excel"
    - Prévisualisation des écritures avant export
    - Historique des exports
  - Composants: `mapping-comptable-form.tsx`, `export-comptable-dialog.tsx`, `ecritures-preview-table.tsx`

  **Must NOT do**:
  - Ne pas créer un module comptable complet (juste mapping + export)

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: [`frontend-ui-ux`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 5 (with Tasks 19-22, 24)
  - **Blocks**: None
  - **Blocked By**: Task 15

  **References**:

  **Pattern References**:
  - `frontend/src/components/catalogue/product-details-panel.tsx` — Panel à enrichir
  - `frontend/src/components/calendar/configuration-panel.tsx` — Pattern panneau configuration

  **Acceptance Criteria**:
  - [ ] Mapping comptable éditable dans le détail produit
  - [ ] Export CSV téléchargeable
  - [ ] Export Excel téléchargeable
  - [ ] Prévisualisation des écritures
  - [ ] Filtres société + période fonctionnent

  **Agent-Executed QA Scenarios**:

  ```
  Scenario: Download CSV export
    Tool: Playwright
    Steps:
      1. Navigate to /exports-comptables
      2. Select société and date range
      3. Click "Export CSV"
      4. Wait for download
      5. Assert: file downloaded with .csv extension
      6. Assert: file contains expected headers
      7. Screenshot: .sisyphus/evidence/task-23-csv-export.png
    Expected Result: CSV file downloaded with accounting entries
    Evidence: .sisyphus/evidence/task-23-csv-export.png
  ```

  **Commit**: YES
  - Message: `feat(frontend): add accounting mapping UI and CSV/Excel export page`
  - Files: `frontend/src/app/(main)/exports-comptables/**`, `frontend/src/components/comptabilite/**`

---

- [ ] 24. UI Intégration OggoData

  **What to do**:
  - Ajouter dans la page Partenaires un onglet "Intégration API" montrant:
    - Statut de connexion OggoData (healthcheck)
    - Bouton "Tester la connexion"
    - Bouton "Synchroniser les fiches"
    - Logs des derniers appels API
  - Dans le détail produit partenaire, ajouter:
    - Bouton "Consulter tarif OggoData" qui appelle le moteur de tarification externe
    - Affichage du tarif retourné
  - Composants: `oggodata-status.tsx`, `oggodata-sync-button.tsx`, `tarif-externe-dialog.tsx`

  **Must NOT do**:
  - Ne pas créer un dashboard OggoData complet

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: [`frontend-ui-ux`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 5 (with Tasks 19-23)
  - **Blocks**: None
  - **Blocked By**: Task 14

  **References**:

  **Pattern References**:
  - `frontend/src/components/partenaires/` — Page partenaires (Task 19)

  **Acceptance Criteria**:
  - [ ] Onglet "Intégration API" dans le détail partenaire
  - [ ] Healthcheck affiche le statut connexion
  - [ ] Bouton sync déclenche la synchronisation
  - [ ] Consultation tarifaire externe fonctionne

  **Commit**: YES
  - Message: `feat(frontend): add OggoData integration UI with status, sync, and external pricing`
  - Files: `frontend/src/components/partenaires/oggodata-status.tsx`, `frontend/src/components/partenaires/oggodata-sync-button.tsx`, `frontend/src/components/catalogue/tarif-externe-dialog.tsx`

---

### WAVE 6 — Tests & Finalisation

---

- [ ] 25. Tests backend — Entities, services, tarification

  **What to do**:
  - Tests unitaires pour:
    - TarificationService (chaque modèle de prix)
    - MappingComptableService (cascade de résolution)
    - DipaGeneratorService (génération par canal)
    - ProductEventPublisher (émission d'événements)
    - WebhookDispatcher (livraison + retry)
    - OggoDataMockAdapter et HttpAdapter
  - Tests d'intégration pour:
    - CRUD PartenaireCommercial (service → DB → controller)
    - CRUD FormuleProduit
    - Activation partenaire par société
    - Export comptable CSV/Excel
  - Couvrir les edge cases:
    - Tarification avec produit sans config
    - Export comptable période vide
    - Webhook vers URL inaccessible
    - OggoData circuit breaker activation

  **Must NOT do**:
  - Ne pas modifier les tests existants
  - Ne pas atteindre 100% coverage (viser les chemins critiques)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: [`microservice-maintainer`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 6 (with Task 26)
  - **Blocks**: Task 27
  - **Blocked By**: Tasks 4-18

  **References**:

  **Pattern References**:
  - Tests existants dans chaque service (pattern jest/bun test)

  **Acceptance Criteria**:
  - [ ] Tous les tests passent: `bun test` → PASS dans service-commercial
  - [ ] Couverture des 7 modèles tarifaires
  - [ ] Couverture des edge cases listés
  - [ ] Aucune régression sur les tests existants

  **Commit**: YES
  - Message: `test(commercial): add unit and integration tests for pricing engine, partners, formulas, and exports`
  - Files: `services/service-commercial/src/**/__tests__/**`

---

- [ ] 26. Tests frontend — Composants, intégration

  **What to do**:
  - Tests de composants pour:
    - Formulaire création partenaire (validation champs)
    - Éditeur garanties/options (ajout/suppression dynamique)
    - Sélecteur tarification (switch entre modèles)
    - Preview calculateur de prix
    - Export comptable dialog
  - Tests d'intégration:
    - Flow création partenaire → affichage dans tableau
    - Flow création formule → affichage dans détail produit
    - Flow export CSV → téléchargement

  **Must NOT do**:
  - Ne pas modifier les tests frontend existants

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: [`frontend-ui-ux`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 6 (with Task 25)
  - **Blocks**: Task 27
  - **Blocked By**: Tasks 19-24

  **References**:

  **Pattern References**:
  - Tests frontend existants (si présents)

  **Acceptance Criteria**:
  - [ ] Tous les tests frontend passent
  - [ ] Formulaires validés (champs requis, formats)
  - [ ] Éditeurs dynamiques testés

  **Commit**: YES
  - Message: `test(frontend): add component and integration tests for partners, formulas, and pricing UI`
  - Files: `frontend/src/**/__tests__/**`

---

- [ ] 27. Tests E2E — Flux complets

  **What to do**:
  - Tests E2E Playwright pour les flux critiques:
    - **Flux 1**: Créer partenaire → Associer produit → Configurer tarification → Consulter tarif
    - **Flux 2**: Créer produit avec formules → Publier dans catalogue → Vérifier catalogue publié
    - **Flux 3**: Configurer mapping comptable → Créer contrat → Exporter écritures
    - **Flux 4**: Créer produit partenaire → Activer OggoData → Consulter tarif externe
  - Chaque flux doit couvrir le happy path ET au moins 1 cas d'erreur

  **Must NOT do**:
  - Ne pas tester les flux existants (contrats, commissions, paiements)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: [`playwright`, `frontend-ui-ux`]

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Sequential (final)
  - **Blocks**: None (final task)
  - **Blocked By**: Tasks 25, 26

  **References**:

  **Pattern References**:
  - Tests E2E existants (si présents)

  **Acceptance Criteria**:
  - [ ] 4 flux E2E passent
  - [ ] Chaque flux a 1+ cas d'erreur
  - [ ] Screenshots capturées pour chaque étape clé
  - [ ] `npx playwright test` → PASS

  **Agent-Executed QA Scenarios**:

  ```
  Scenario: E2E — Partner to pricing flow
    Tool: Playwright
    Steps:
      1. Login
      2. Navigate /partenaires → Create partner (type=ASSUREUR)
      3. Navigate /catalogue → Create product (type=PARTENAIRE, link to partner)
      4. Add formula "Premium" with guarantees
      5. Configure tarification PALIER
      6. Use price calculator → verify result
      7. Screenshot at each step
    Expected Result: Full flow from partner creation to price calculation
    Evidence: .sisyphus/evidence/task-27-e2e-partner-pricing.png

  Scenario: E2E — Product catalog publication
    Tool: Playwright
    Steps:
      1. Create product with formulas and documents
      2. Navigate /catalogues → Create catalog (Brouillon)
      3. Add products to catalog
      4. Click "Publier"
      5. Assert: status changes to "Publié"
      6. Navigate /catalogue → verify products visible
    Expected Result: Full catalog lifecycle
    Evidence: .sisyphus/evidence/task-27-e2e-catalog-publication.png
  ```

  **Commit**: YES
  - Message: `test(e2e): add end-to-end tests for partner, catalog, pricing, and accounting flows`
  - Files: `frontend/e2e/**`

---

## Commit Strategy

| After Task(s) | Message | Key Files | Verification |
|---------------|---------|-----------|--------------|
| 1 | `feat(audit): add created_by/modified_by` | migrations, entities, subscriber | `bun run migration:run` |
| 2 | `feat(organisations): enrich SocieteEntity` | societe.entity, migrations, proto | `bun test` |
| 3 | `feat(products): hierarchical gamme` | gamme.entity, migrations, proto | `bun test` |
| 4 | `feat(commercial): PartenaireCommercialEntity` | entities, repos, migrations | `bun run migration:run` |
| 5 | `feat(products): enrich ProduitEntity` | produit.entity, migrations, proto | `bun test` |
| 6 | `feat(products): FormuleProduitEntity` | entities, repos, migrations | `bun test` |
| 7 | `feat(products): enrich ModeleDistribution` | entity, migrations | `bun test` |
| 8 | `feat(products): pricing engine` | tarification services | `bun test` |
| 9 | `feat(commercial): PartenaireCommercial gRPC` | proto, controller, actions | `bun test` |
| 10 | `feat(products): FormuleProduit gRPC` | proto, controller, actions | `bun test` |
| 11 | `feat(products): sales channels` | entity, migrations, proto | `bun test` |
| 12 | `feat(products): webhook system` | publishers, entities, dispatcher | `bun test` |
| 13 | `feat(oggodata): port/adapter + mock` | ports, adapters, DTOs | `bun test` |
| 14 | `feat(oggodata): HTTP adapter` | adapter, module | `bun test` |
| 15 | `feat(products): accounting mapping + exports` | service, controller | `bun test` + curl export |
| 16 | `feat(products): Catalogue aggregate` | entity, service, controller | `bun test` |
| 17 | `feat(products): DIPA generator` | service, templates | `bun test` |
| 18 | `feat(contrats): partner + channel refs` | entities, migrations, proto | `bun test` |
| 19 | `feat(frontend): Partners page` | pages, components | Playwright |
| 20 | `feat(frontend): Formula UI` | components, actions | Playwright |
| 21 | `feat(frontend): Pricing UI` | components | Playwright |
| 22 | `feat(frontend): Channels + Catalog UI` | pages, components | Playwright |
| 23 | `feat(frontend): Accounting UI` | pages, components | Playwright |
| 24 | `feat(frontend): OggoData UI` | components | Playwright |
| 25 | `test(commercial): backend tests` | test files | `bun test` |
| 26 | `test(frontend): frontend tests` | test files | test runner |
| 27 | `test(e2e): E2E flows` | e2e files | `npx playwright test` |

---

## Success Criteria

### Verification Commands
```bash
# Backend
cd services/service-commercial && bun run migration:run   # All migrations succeed
cd services/service-commercial && bun test                 # All tests pass
cd services/service-core && bun run migration:run          # Core migrations succeed
cd services/service-core && bun test                       # Core tests pass

# Proto
cd packages/proto && bun run proto:generate                # Proto compilation succeeds

# Frontend
cd frontend && bun run build                               # Frontend builds without errors
cd frontend && bun test                                    # Frontend tests pass

# E2E
cd frontend && npx playwright test                         # E2E tests pass

# Exports
curl http://localhost:3001/api/exports/comptabilite?format=csv  # Returns CSV
curl http://localhost:3001/api/exports/comptabilite?format=xlsx # Returns XLSX
```

### Final Checklist
- [ ] All "Must Have" present (PartenaireCommercial, Formules, Tarification multi-modèle, Audit trail, Mapping comptable, Frontend)
- [ ] All "Must NOT Have" absent (no PartenaireMarqueBlanche modifications, no new microservice, no portal)
- [ ] All migrations run successfully
- [ ] All gRPC services respond
- [ ] All frontend pages load and CRUD works
- [ ] OggoData adapter connects (or falls back to mock gracefully)
- [ ] CSV/Excel exports generate valid files
- [ ] All 27 tasks completed with evidence
