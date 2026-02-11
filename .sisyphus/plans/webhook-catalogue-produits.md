# Webhook Bidirectionnel — Catalogue Produits Partenaire

## TL;DR

> **Quick Summary**: Ajouter un webhook bidirectionnel au service-commercial pour synchroniser un catalogue produits entre le CRM et l'outil d'un collègue. Le webhook entrant reçoit un JSON simplifié de produits et fait un upsert dans ProduitEntity. Le webhook sortant pousse le catalogue complet vers une URL fixe (env var) automatiquement et manuellement.
> 
> **Deliverables**:
> - Endpoint HTTP `POST /webhooks/catalogue/:organisationId` (entrant, API key auth)
> - Nouvelles colonnes sur ProduitEntity (popular, rating, logo_url, features_data, formules_data, categorie_partenaire, source_derniere_modif)
> - Webhook event inbox entity + NATS async processing
> - Service sortant (push HTTP vers URL partenaire)
> - Endpoint gRPC `SyncCatalogue` pour bouton "Synchroniser" frontend
> - Bouton "Synchroniser le catalogue" sur la page catalogue frontend
> - 2 migrations DB
> 
> **Estimated Effort**: Medium
> **Parallel Execution**: YES — 3 waves
> **Critical Path**: Task 1 (migration) → Task 2 (inbox entity) → Task 3 (HTTP controller) → Task 4 (NATS worker + upsert) → Task 6 (outgoing webhook) → Task 7 (gRPC endpoint) → Task 8 (frontend)

---

## Context

### Original Request
L'utilisateur veut un webhook bidirectionnel pour synchroniser un catalogue produits entre son CRM NestJS et l'outil de son collègue. Le JSON partenaire contient ~10 champs simples (id, nom, description, categorie, fournisseur, logo_url, prix_base, features, formules, popular, rating, isActive).

### Interview Summary
**Key Discussions**:
- **Modèle de données**: Mapper directement vers ProduitEntity (pas d'entité séparée), ajouter les colonnes manquantes
- **ID partagé**: Le partenaire utilise un ID numérique (1, 2, 3...) mais ProduitEntity.id est un UUID auto-généré. On utilise le champ `code_externe` existant pour stocker l'ID partenaire et faire l'upsert dessus.
- **Catégories**: Ajouter un champ `categorie_partenaire` en texte libre en plus de l'enum interne
- **Auth**: API Key simple dans le header `x-api-key`
- **Webhook sortant**: Automatique sur modif produit + bouton "Synchroniser" sur page catalogue
- **Format sortant**: ProduitEntity complet (JSON)
- **URL sortante**: Variable d'environnement `CATALOGUE_WEBHOOK_OUTGOING_URL`
- **Multi-tenant**: Par organisation (URL inclut `/:organisationId`)
- **Tests**: Pas de tests unitaires, QA par agent (curl, Playwright)

### Metis Review
**Identified Gaps** (addressed):
- **Boucle infinie webhook** → Ajout colonne `source_derniere_modif` ('webhook_partner' | 'crm_user') pour skip le push sortant quand la dernière modif vient du partenaire
- **ID partagé vs UUID** → On utilise `code_externe` existant (varchar 100) pour stocker l'ID partenaire. L'upsert se fait sur `(organisationId, codeExterne)` au lieu de l'ID UUID
- **Outgoing trigger** → Pour V1, le sortant automatique est déclenché UNIQUEMENT depuis le worker NATS catalogue + le bouton sync. On NE modifie PAS `ProduitService.create/update` existant pour éviter les effets de bord. Le push auto sur modif CRM viendra en V2.
- **Features/Formules du partenaire** → Stockés en JSONB sur de nouvelles colonnes (`features_data`, `formules_data`), PAS comme `FormuleProduitEntity` records
- **Colonnes nullable** → Toutes les nouvelles colonnes sont nullable avec defaults pour ne pas casser les données existantes

---

## Work Objectives

### Core Objective
Permettre la synchronisation bidirectionnelle d'un catalogue produits entre le CRM et un outil partenaire via des webhooks HTTP, en suivant les patterns existants (IMS/WooCommerce) du service-commercial.

### Concrete Deliverables
- `POST /webhooks/catalogue/:organisationId` — endpoint HTTP entrant
- `CatalogueWebhookEventEntity` — inbox entity avec state machine 4 états
- `CatalogueWebhookService` — service domain (validation, dedup, mapping, upsert)
- `CatalogueOutgoingWebhookService` — service sortant (HTTP push)
- `SyncCatalogue` RPC dans products.proto — pour bouton frontend
- Bouton "Synchroniser" sur la page catalogue frontend
- 2 migrations TypeORM

### Definition of Done
- [ ] `curl -X POST /webhooks/catalogue/:orgId` avec API key valide → 200 + produit upserted en base
- [ ] `curl -X POST /webhooks/catalogue/:orgId` sans API key → 401
- [ ] `curl -X POST /webhooks/catalogue/:orgId` avec même payload 2x → deuxième retourne `duplicate`
- [ ] Produits reçus via webhook visible sur la page catalogue frontend
- [ ] Bouton "Synchroniser" envoie tous les produits actifs vers URL partenaire
- [ ] `bun run build` sur service-commercial et frontend → 0 erreur

### Must Have
- Validation API key sur webhook entrant
- Idempotence (pas de doublon)
- Upsert basé sur `(organisationId, codeExterne)`
- Protection anti-boucle (`source_derniere_modif`)
- Colonnes ProduitEntity: popular, rating, logo_url, features_data, formules_data, categorie_partenaire, source_derniere_modif
- Module séparé `CatalogueWebhookModule` (pas dans ProductsModule ou WooCommerceModule)

### Must NOT Have (Guardrails)
- NE PAS modifier `ProduitService.create()` ou `ProduitService.update()` — le sortant auto sur modif CRM est hors scope V1
- NE PAS créer des `FormuleProduitEntity` records depuis le JSON partenaire — stocker en JSONB
- NE PAS implémenter de retry/DLQ complexe — fire-and-forget avec logging pour le sortant
- NE PAS utiliser HMAC-SHA256 — API key simple comme décidé
- NE PAS toucher au code WooCommerce ou IMS existant
- NE PAS changer la stratégie de génération de `ProduitEntity.id` (reste UUID auto-généré)
- NE PAS ajouter de colonnes NOT NULL sur ProduitEntity (tout nullable avec defaults)

---

## Verification Strategy

> **UNIVERSAL RULE: ZERO HUMAN INTERVENTION**
>
> ALL tasks are verifiable WITHOUT any human action.
> ALL verification is executed by the agent using tools (curl, Playwright, Bash).

### Test Decision
- **Infrastructure exists**: NO
- **Automated tests**: None
- **Framework**: none

### Agent-Executed QA Scenarios (PRIMARY verification)

Chaque task inclut des scénarios détaillés ci-dessous.

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Start Immediately):
├── Task 1: Migration DB — nouvelles colonnes ProduitEntity
└── Task 2: Migration DB — table catalogue_webhook_events + CatalogueWebhookEventEntity

Wave 2 (After Wave 1):
├── Task 3: HTTP Controller entrant + CatalogueWebhookModule (wiring)
├── Task 4: NATS Worker + CatalogueWebhookService (mapping + upsert)
└── Task 5: Proto update — SyncCatalogue RPC

Wave 3 (After Wave 2):
├── Task 6: CatalogueOutgoingWebhookService (push sortant)
├── Task 7: gRPC Controller SyncCatalogue + server action frontend
└── Task 8: Bouton "Synchroniser" sur page catalogue frontend
```

### Dependency Matrix

| Task | Depends On | Blocks | Can Parallelize With |
|------|------------|--------|---------------------|
| 1 | None | 3, 4 | 2 |
| 2 | None | 3, 4 | 1 |
| 3 | 1, 2 | 4, 6, 7 | 5 |
| 4 | 1, 2, 3 | 6 | 5 |
| 5 | None | 7 | 3, 4 |
| 6 | 4 | 7 | — |
| 7 | 5, 6 | 8 | — |
| 8 | 7 | None | — |

### Agent Dispatch Summary

| Wave | Tasks | Recommended Agents |
|------|-------|-------------------|
| 1 | 1, 2 | `task(category="quick", load_skills=[], ...)` — parallel |
| 2 | 3, 4, 5 | `task(category="unspecified-high", load_skills=[], ...)` — 3+4 sequential, 5 parallel |
| 3 | 6, 7, 8 | `task(category="unspecified-high", load_skills=["frontend-ui-ux"], ...)` — sequential |

---

## TODOs

- [x] 1. Migration DB — Nouvelles colonnes ProduitEntity

  **What to do**:
  - Créer une migration TypeORM `{timestamp}-AddCataloguePartnerColumns.ts` dans `services/service-commercial/src/migrations/`
  - Ajouter les colonnes suivantes à la table `produit` :
    - `popular` BOOLEAN DEFAULT false
    - `rating` DECIMAL(3,2) DEFAULT NULL
    - `logo_url` TEXT DEFAULT NULL
    - `features_data` JSONB DEFAULT NULL (pour stocker le tableau features du partenaire)
    - `formules_data` JSONB DEFAULT NULL (pour stocker les formules du partenaire)
    - `categorie_partenaire` VARCHAR(100) DEFAULT NULL (catégorie texte libre du partenaire)
    - `source_derniere_modif` VARCHAR(50) DEFAULT NULL (valeurs: 'webhook_partner', 'crm_user', null)
    - `fournisseur` VARCHAR(200) DEFAULT NULL (nom du fournisseur partenaire)
  - Mettre à jour `ProduitEntity` avec les nouvelles colonnes (même pattern que les colonnes existantes)
  - DOWN: `ALTER TABLE produit DROP COLUMN IF EXISTS ...` pour chaque colonne

  **Must NOT do**:
  - NE PAS ajouter de colonnes NOT NULL (casse les données existantes)
  - NE PAS modifier les colonnes existantes
  - NE PAS créer d'index sur ces colonnes (pas nécessaire V1)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Tâche simple et bien définie — ajout de colonnes via migration, pattern très clair
  - **Skills**: `[]`
    - Pas de skill spécifique nécessaire, c'est du TypeORM/SQL basique

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Task 2)
  - **Blocks**: Tasks 3, 4
  - **Blocked By**: None

  **References**:

  **Pattern References** (migration existante à copier):
  - `services/service-commercial/src/migrations/1770510000000-CreateImsWebhookEvents.ts` — Pattern migration complet (CREATE TYPE, CREATE TABLE, indexes, down avec IF EXISTS). Copier la structure de la migration.
  - `services/service-commercial/src/migrations/1739030000000-EnrichProduitEntity.ts` — Migration d'enrichissement de ProduitEntity existante. Regarder comment les ALTER TABLE ADD COLUMN sont faits.

  **Entity Reference** (entité à modifier):
  - `services/service-commercial/src/domain/products/entities/produit.entity.ts` — Lignes 1-199. ProduitEntity actuelle. Ajouter les nouvelles @Column() après la ligne 164 (après le champ `metadata`). Suivre exactement le même pattern de décorateurs que les colonnes existantes (ex: `imageUrl` ligne 109, `codeExterne` ligne 113).

  **Acceptance Criteria**:

  Agent-Executed QA Scenarios:

  ```
  Scenario: Migration runs without errors
    Tool: Bash
    Preconditions: service-commercial database accessible, migrations already applied
    Steps:
      1. Run: bun run typeorm migration:run -d src/data-source.ts (from services/service-commercial/)
      2. Assert: Exit code 0
      3. Assert: stdout contains migration name
    Expected Result: Migration applied successfully
    Evidence: Terminal output captured

  Scenario: New columns exist on produit table
    Tool: Bash (psql or TypeORM query)
    Preconditions: Migration applied
    Steps:
      1. Query: SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'produit' AND column_name IN ('popular', 'rating', 'logo_url', 'features_data', 'formules_data', 'categorie_partenaire', 'source_derniere_modif', 'fournisseur')
      2. Assert: 8 rows returned
      3. Assert: All columns are nullable (is_nullable = 'YES')
    Expected Result: All 8 columns exist and are nullable
    Evidence: Query output captured

  Scenario: Build succeeds
    Tool: Bash
    Steps:
      1. Run: bun run build (from services/service-commercial/)
      2. Assert: Exit code 0
    Expected Result: No TypeScript compilation errors
    Evidence: Terminal output captured
  ```

  **Commit**: YES
  - Message: `feat(products): add partner catalogue columns to ProduitEntity`
  - Files: `services/service-commercial/src/migrations/{timestamp}-AddCataloguePartnerColumns.ts`, `services/service-commercial/src/domain/products/entities/produit.entity.ts`
  - Pre-commit: `bun run build` (from services/service-commercial/)

---

- [x] 2. Migration DB + Entity — Table catalogue_webhook_events + CatalogueWebhookEventEntity

  **What to do**:
  - Créer la migration `{timestamp}-CreateCatalogueWebhookEvents.ts` dans `services/service-commercial/src/migrations/`
  - Créer le type enum: `catalogue_webhook_processing_status_enum` (RECEIVED, PROCESSING, DONE, FAILED)
  - Créer la table `catalogue_webhook_events` avec les colonnes :
    - `id` UUID PRIMARY KEY DEFAULT gen_random_uuid()
    - `organisation_id` UUID NOT NULL
    - `event_id` VARCHAR(255) NOT NULL (identifiant unique de l'event pour idempotence)
    - `event_type` VARCHAR(100) NOT NULL (ex: 'catalogue.sync', 'catalogue.product.updated')
    - `payload` JSONB NOT NULL (le JSON brut reçu)
    - `api_key_valid` BOOLEAN NOT NULL DEFAULT false
    - `processing_status` catalogue_webhook_processing_status_enum NOT NULL DEFAULT 'RECEIVED'
    - `error_message` TEXT NULL
    - `retry_count` INT NOT NULL DEFAULT 0
    - `processed_at` TIMESTAMPTZ NULL
    - `created_at` TIMESTAMPTZ NOT NULL DEFAULT NOW()
  - Indexes: UNIQUE sur event_id, INDEX sur organisation_id, INDEX composite sur (organisation_id, processing_status), INDEX sur (event_type, created_at)
  - Créer `CatalogueWebhookEventEntity` dans `services/service-commercial/src/domain/catalogue-webhook/entities/catalogue-webhook-event.entity.ts`
  - Avec enum `CatalogueWebhookProcessingStatus` et méthodes domain: `markProcessing()`, `markDone()`, `markFailed()`, `incrementRetry()`
  - Créer le barrel export `services/service-commercial/src/domain/catalogue-webhook/entities/index.ts`

  **Must NOT do**:
  - NE PAS mettre cette entity dans le dossier `domain/products/entities/` — créer un nouveau bounded context `domain/catalogue-webhook/`
  - NE PAS ajouter de relation FK vers ProduitEntity dans cette entity

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Pattern très clair à copier (ImsWebhookEventEntity), tâche bien définie
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Task 1)
  - **Blocks**: Tasks 3, 4
  - **Blocked By**: None

  **References**:

  **Pattern References** (entity + migration à copier):
  - `services/service-commercial/src/domain/mondial-tv/entities/ims-webhook-event.entity.ts` — Lignes 1-79. **COPIER CE FICHIER** comme base. Renommer l'enum, la classe, les noms de table/index. Changer `hmac_valid` par `api_key_valid`. Le pattern est identique.
  - `services/service-commercial/src/migrations/1770510000000-CreateImsWebhookEvents.ts` — Lignes 1-52. Migration de référence. Copier la structure exacte : CREATE TYPE → CREATE TABLE → CREATE INDEX (4 indexes) → DOWN avec DROP IF EXISTS.

  **Directory Structure Reference**:
  - `services/service-commercial/src/domain/mondial-tv/entities/` — Comment les entities d'un bounded context webhook sont organisées. Créer la même structure dans `domain/catalogue-webhook/entities/`.

  **Acceptance Criteria**:

  ```
  Scenario: Migration creates table and enum
    Tool: Bash
    Steps:
      1. Run: bun run typeorm migration:run -d src/data-source.ts (from services/service-commercial/)
      2. Assert: Exit code 0
      3. Query: SELECT tablename FROM pg_tables WHERE tablename = 'catalogue_webhook_events'
      4. Assert: 1 row returned
      5. Query: SELECT enumlabel FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid WHERE t.typname = 'catalogue_webhook_processing_status_enum'
      6. Assert: 4 values (RECEIVED, PROCESSING, DONE, FAILED)
    Expected Result: Table and enum created
    Evidence: Query output captured

  Scenario: Build succeeds with new entity
    Tool: Bash
    Steps:
      1. Run: bun run build (from services/service-commercial/)
      2. Assert: Exit code 0
    Expected Result: No compilation errors
    Evidence: Terminal output captured
  ```

  **Commit**: YES (groups with Task 1)
  - Message: `feat(catalogue-webhook): add webhook event inbox entity and migration`
  - Files: `services/service-commercial/src/migrations/{timestamp}-CreateCatalogueWebhookEvents.ts`, `services/service-commercial/src/domain/catalogue-webhook/entities/catalogue-webhook-event.entity.ts`, `services/service-commercial/src/domain/catalogue-webhook/entities/index.ts`
  - Pre-commit: `bun run build`

---

- [x] 3. HTTP Controller entrant + CatalogueWebhookModule (wiring complet)

  **What to do**:
  - Créer `CatalogueWebhookController` dans `services/service-commercial/src/infrastructure/http/catalogue-webhook/catalogue-webhook.controller.ts`
  - Route: `POST /webhooks/catalogue/:organisationId`
  - Extraction de l'API key depuis le header `x-api-key`
  - Validation contre `process.env.CATALOGUE_WEBHOOK_API_KEY`
  - Si invalide → 401 UnauthorizedException
  - Générer un `event_id` unique: `catalogue-${organisationId}-${Date.now()}-${randomUUID().slice(0,8)}`
  - Vérifier l'idempotence avec `IdempotenceService` (même pattern que IMS)
  - Si doublon → retourner `{ success: true, status: 'duplicate', eventId }`
  - Stocker dans `CatalogueWebhookEventEntity` avec status RECEIVED
  - Publier sur NATS: `crm.commercial.catalogue.webhook.received`
  - Payload NATS: `{ internalEventId, organisationId, eventType: 'catalogue.sync', payload: body, receivedAt }`
  - Retourner `{ success: true, status: 'received', eventId }`
  - Créer le repository service `CatalogueWebhookEventRepoService` dans `services/service-commercial/src/infrastructure/persistence/typeorm/repositories/catalogue-webhook/catalogue-webhook-event.service.ts` — CRUD + `isEventProcessed()` + `findByEventId()`
  - Créer `CatalogueWebhookModule` dans `services/service-commercial/src/catalogue-webhook.module.ts`
  - Wirer: TypeOrmModule.forFeature([CatalogueWebhookEventEntity]), controllers, providers
  - Importer `ProductsModule` (forwardRef) pour accéder à `ProduitService` dans le worker NATS (task 4)
  - Ajouter `CatalogueWebhookModule` dans les imports de `app.module.ts`

  **Must NOT do**:
  - NE PAS utiliser HMAC-SHA256 — API key simple
  - NE PAS valider le body avec class-validator (le JSON partenaire est souple)
  - NE PAS traiter les produits dans le controller — juste stocker et publier NATS

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Plusieurs fichiers à créer/modifier, wiring module NestJS, mais pattern très clair à suivre
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES (avec Task 5)
  - **Parallel Group**: Wave 2
  - **Blocks**: Tasks 4, 6, 7
  - **Blocked By**: Tasks 1, 2

  **References**:

  **Pattern References** (copier ces patterns exactement):
  - `services/service-commercial/src/infrastructure/http/mondial-tv/ims-webhook.controller.ts` — Lignes 46-142. **PATTERN PRINCIPAL**. Copier la structure : constructor avec NatsService + RepoService + IdempotenceService, méthode @Post avec extraction headers, validation, idempotence check, store entity, NATS publish, return. SIMPLIFIER : remplacer HMAC par API key check.
  - `services/service-commercial/src/woocommerce.module.ts` — Lignes 1-97. Pattern module complet avec TypeOrmModule.forFeature, HTTP controllers, useFactory providers, exports. Copier cette structure pour CatalogueWebhookModule.
  - `services/service-commercial/src/infrastructure/persistence/typeorm/repositories/mondial-tv/ims-webhook-event.service.ts` — Repository service pattern. Copier pour créer CatalogueWebhookEventRepoService.

  **Import Reference** (wiring app.module):
  - `services/service-commercial/src/app.module.ts` — Ajouter `CatalogueWebhookModule` dans les imports du root module, au même niveau que `WooCommerceModule`.

  **Shared Kernel Reference**:
  - `IdempotenceService` et `NatsService` importés depuis `@crm/shared-kernel` — voir ligne 20 du controller IMS.

  **Acceptance Criteria**:

  ```
  Scenario: Webhook entrant accepte un payload valide
    Tool: Bash (curl)
    Preconditions: service-commercial running on localhost:3053, env CATALOGUE_WEBHOOK_API_KEY=test-key-123
    Steps:
      1. curl -s -w "\n%{http_code}" -X POST http://localhost:3053/webhooks/catalogue/<org-uuid> \
           -H "Content-Type: application/json" \
           -H "x-api-key: test-key-123" \
           -d '[{"id":1,"nom":"Forfait Test","description":"Test","categorie":"Téléphonie","fournisseur":"BLEUTEL","logo_url":"/logo/test.png","prix_base":5.9,"features":[],"formules":null,"popular":true,"rating":4.5,"isActive":true}]'
      2. Assert: HTTP status 200
      3. Assert: response.success is true
      4. Assert: response.status is "received"
    Expected Result: Webhook accepted and stored
    Evidence: Response body captured

  Scenario: Webhook rejeté sans API key
    Tool: Bash (curl)
    Steps:
      1. curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:3053/webhooks/catalogue/<org-uuid> \
           -H "Content-Type: application/json" \
           -d '[{"id":1,"nom":"Test"}]'
      2. Assert: HTTP status 401
    Expected Result: Unauthorized error
    Evidence: HTTP status code

  Scenario: Doublon détecté (idempotence)
    Tool: Bash (curl)
    Steps:
      1. Envoyer le même payload 2 fois (même org, même contenu)
      2. Premier appel: Assert status "received"
      3. Second appel: Assert status "duplicate"
    Expected Result: Deuxième appel retourne duplicate
    Evidence: Response bodies captured

  Scenario: Build succeeds
    Tool: Bash
    Steps:
      1. Run: bun run build (from services/service-commercial/)
      2. Assert: Exit code 0
    Expected Result: Compilation OK
    Evidence: Terminal output
  ```

  **Commit**: YES
  - Message: `feat(catalogue-webhook): add inbound HTTP controller and module wiring`
  - Files: `services/service-commercial/src/infrastructure/http/catalogue-webhook/catalogue-webhook.controller.ts`, `services/service-commercial/src/infrastructure/persistence/typeorm/repositories/catalogue-webhook/catalogue-webhook-event.service.ts`, `services/service-commercial/src/catalogue-webhook.module.ts`, `services/service-commercial/src/app.module.ts`
  - Pre-commit: `bun run build`

---

- [x] 4. NATS Worker + CatalogueWebhookService (mapping JSON → ProduitEntity + upsert)

  **What to do**:
  - Créer `CatalogueWebhookMappingService` dans `services/service-commercial/src/domain/catalogue-webhook/services/catalogue-webhook-mapping.service.ts`
  - Ce service fait le mapping du JSON partenaire vers ProduitEntity :
    - `id` (partenaire) → `codeExterne` (string, ex: "partner-1")
    - `nom` → `nom`
    - `description` → `description`
    - `categorie` (texte libre) → `categoriePartenaire` + `categorie` mappé vers `CategorieProduit.SERVICE` par défaut
    - `fournisseur` → `fournisseur`
    - `logo_url` → `logoUrl`
    - `prix_base` → `prix`
    - `features` → `featuresData` (JSONB)
    - `formules` → `formulesData` (JSONB)
    - `popular` → `popular`
    - `rating` → `rating`
    - `isActive` → `actif`
    - Set `sourceDerniereModif` = `'webhook_partner'`
    - Set `type` = `TypeProduit.PARTENAIRE`
    - Générer `sku` depuis le nom si pas fourni: ex `"PARTNER-{id}"`
  - Logique d'upsert: chercher par `(organisationId, codeExterne)` — si trouvé → update, sinon → create
  - Créer `CatalogueWebhookNatsWorker` dans `services/service-commercial/src/infrastructure/messaging/nats/handlers/catalogue-webhook/catalogue-webhook.handler.ts`
  - Subscribe to: `crm.commercial.catalogue.webhook.received`
  - Flux: récupérer l'event → markProcessing → parser le payload (array de produits) → pour chaque produit: mapping + upsert → markDone / markFailed
  - Le worker injecte `ProduitService` (via ProductsModule) et `CatalogueWebhookEventRepoService`

  **Must NOT do**:
  - NE PAS créer des `FormuleProduitEntity` records — stocker dans `formulesData` JSONB
  - NE PAS modifier `ProduitService.create()/update()` — utiliser directement le repository TypeORM pour l'upsert
  - NE PAS déclencher le webhook sortant depuis ce worker (on ne push pas vers le partenaire ce qu'il vient de nous envoyer — anti-boucle)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Logique métier de mapping + upsert, NATS subscription pattern, interaction cross-module
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: NO (dépend de Task 3)
  - **Parallel Group**: Wave 2 (après Task 3)
  - **Blocks**: Task 6
  - **Blocked By**: Tasks 1, 2, 3

  **References**:

  **Pattern References**:
  - `services/service-commercial/src/infrastructure/messaging/nats/handlers/mondial-tv/ims-event-handler.ts` — Pattern NATS worker complet: `OnModuleInit`, `natsService.subscribe()`, handler avec try/catch + markProcessing/markDone/markFailed. **COPIER CE PATTERN.**
  - `services/service-commercial/src/domain/woocommerce/services/woocommerce-sync.service.ts` — Pattern de service de sync qui mappe des données externes vers des entities internes. Voir comment le mapping est fait.

  **Entity/Type References**:
  - `services/service-commercial/src/domain/products/entities/produit.entity.ts` — Lignes 20-31. Enums `TypeProduit`, `CategorieProduit`. Pour le mapping: utiliser `TypeProduit.PARTENAIRE` et `CategorieProduit.SERVICE` par défaut.
  - `services/service-commercial/src/domain/products/entities/produit.entity.ts` — Lignes 43-199. Tous les champs de ProduitEntity — comprendre quoi remplir et quoi laisser null.

  **Repository Reference**:
  - `services/service-commercial/src/infrastructure/persistence/typeorm/repositories/products/` — ProduitService existant. Pour l'upsert, on a besoin d'un `findOne({ where: { organisationId, codeExterne } })` suivi d'un `save()`.

  **Acceptance Criteria**:

  ```
  Scenario: NATS worker processes catalogue webhook and creates products
    Tool: Bash (curl + database query)
    Preconditions: service-commercial running, NATS connected
    Steps:
      1. POST webhook with 3 products payload to /webhooks/catalogue/<org-uuid>
      2. Wait 5 seconds for NATS processing
      3. Query products: SELECT id, nom, code_externe, prix, categorie_partenaire, source_derniere_modif FROM produit WHERE organisation_id = '<org-uuid>' AND code_externe LIKE 'partner-%'
      4. Assert: 3 products exist
      5. Assert: Each product has source_derniere_modif = 'webhook_partner'
      6. Assert: Each product has categorie_partenaire matching the JSON
    Expected Result: Products created from webhook payload
    Evidence: Database query output

  Scenario: Upsert updates existing product instead of creating duplicate
    Tool: Bash (curl + database query)
    Steps:
      1. POST webhook with product id=1, nom="V1", prix_base=5.9
      2. Wait 3 seconds
      3. POST webhook with product id=1, nom="V2", prix_base=9.9
      4. Wait 3 seconds
      5. Query: SELECT COUNT(*) FROM produit WHERE organisation_id = '<org-uuid>' AND code_externe = 'partner-1'
      6. Assert: COUNT = 1 (not 2)
      7. Query: SELECT nom, prix FROM produit WHERE code_externe = 'partner-1' AND organisation_id = '<org-uuid>'
      8. Assert: nom = 'V2' AND prix = 9.9
    Expected Result: One product, updated not duplicated
    Evidence: Database query output

  Scenario: Webhook event marked as DONE after processing
    Tool: Bash (database query)
    Steps:
      1. After successful webhook + processing
      2. Query: SELECT processing_status FROM catalogue_webhook_events ORDER BY created_at DESC LIMIT 1
      3. Assert: processing_status = 'DONE'
    Expected Result: Event inbox shows DONE status
    Evidence: Query output
  ```

  **Commit**: YES
  - Message: `feat(catalogue-webhook): add NATS worker and product mapping/upsert service`
  - Files: `services/service-commercial/src/domain/catalogue-webhook/services/catalogue-webhook-mapping.service.ts`, `services/service-commercial/src/infrastructure/messaging/nats/handlers/catalogue-webhook/catalogue-webhook.handler.ts`
  - Pre-commit: `bun run build`

---

- [x] 5. Proto update — Ajouter SyncCatalogue RPC + nouveaux champs Produit

  **What to do**:
  - Modifier `packages/proto/src/products/products.proto` :
    - Ajouter dans le message `Produit` les champs: `popular` (bool), `rating` (double), `logo_url` (string), `features_data` (string, JSON stringifié), `formules_data` (string, JSON stringifié), `categorie_partenaire` (string), `source_derniere_modif` (string), `fournisseur` (string)
    - Ajouter un nouveau RPC dans `ProduitService`: `rpc SyncCatalogue(SyncCatalogueRequest) returns (SyncCatalogueResponse)`
    - Définir `SyncCatalogueRequest`: `string organisation_id = 1;`
    - Définir `SyncCatalogueResponse`: `bool success = 1; int32 products_synced = 2; string error = 3;`
  - Régénérer les types TypeScript: `bun run proto:generate` (depuis packages/proto/)
  - S'assurer que le frontend régénère aussi ses types proto

  **Must NOT do**:
  - NE PAS modifier les RPCs existants (Create, Update, Get, List, Delete, SetPromotion, ClearPromotion)
  - NE PAS changer les numéros de champ existants dans le message Produit

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Modification d'un fichier proto + commande de régénération
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES (avec Tasks 3, 4)
  - **Parallel Group**: Wave 2
  - **Blocks**: Task 7
  - **Blocked By**: None (proto indépendant)

  **References**:

  **Pattern References**:
  - `packages/proto/src/products/products.proto` — Fichier proto existant. Voir comment les messages et RPCs sont définis. Ajouter les nouveaux champs avec des numéros de champ > au dernier existant.
  - `packages/proto/src/woocommerce/woocommerce.proto` — Exemple de proto avec webhook RPCs (ProcessWebhook, ListWebhookEvents, etc.)

  **Build Reference**:
  - `packages/proto/package.json` — Script `proto:generate` pour régénérer les types TS

  **Frontend Proto Reference**:
  - `frontend/src/proto/products/products.ts` — Types TS générés. Sera mis à jour par la régénération.

  **Acceptance Criteria**:

  ```
  Scenario: Proto compiles without errors
    Tool: Bash
    Steps:
      1. Run: bun run proto:generate (from packages/proto/)
      2. Assert: Exit code 0
      3. Verify: frontend/src/proto/products/products.ts contains SyncCatalogueRequest type
    Expected Result: Types generated successfully
    Evidence: Terminal output + grep of generated file

  Scenario: Both services build with new proto
    Tool: Bash
    Steps:
      1. Run: bun run build (from services/service-commercial/)
      2. Assert: Exit code 0
      3. Run: npm run build (from frontend/)
      4. Assert: Exit code 0
    Expected Result: No compilation errors
    Evidence: Terminal output
  ```

  **Commit**: YES
  - Message: `feat(proto): add SyncCatalogue RPC and partner catalogue fields to Produit`
  - Files: `packages/proto/src/products/products.proto`, generated files
  - Pre-commit: `bun run proto:generate`

---

- [x] 6. CatalogueOutgoingWebhookService (push sortant HTTP)

  **What to do**:
  - Créer `CatalogueOutgoingWebhookService` dans `services/service-commercial/src/domain/catalogue-webhook/services/catalogue-outgoing-webhook.service.ts`
  - Méthode `pushAllProducts(organisationId: string): Promise<{ success: boolean; productsSynced: number; error?: string }>`
    - Charger tous les produits actifs de l'organisation via TypeORM (`where: { organisationId, actif: true }`)
    - Filtrer: ne pousser que les produits dont `sourceDerniereModif !== 'webhook_partner'` (anti-boucle: ne pas re-pousser ce qu'on a reçu du partenaire)
    - Sérialiser en JSON (format ProduitEntity complet)
    - POST vers `process.env.CATALOGUE_WEBHOOK_OUTGOING_URL` avec headers `Content-Type: application/json`
    - Fire-and-forget: logger le succès/échec, ne pas retry
    - Retourner le nombre de produits sync'ed
  - Méthode `pushSingleProduct(product: ProduitEntity): Promise<void>` — pour usage futur V2
  - Ajouter le service dans `CatalogueWebhookModule` providers + exports

  **Must NOT do**:
  - NE PAS implémenter de retry/queue/DLQ — V1 est fire-and-forget
  - NE PAS pousser les produits dont `sourceDerniereModif === 'webhook_partner'` (anti-boucle)
  - NE PAS utiliser NATS pour le sortant — c'est un appel HTTP direct

  **Recommended Agent Profile**:
  - **Category**: `unspecified-low`
    - Reason: Service simple avec un fetch HTTP, pas de logique complexe
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 3 (séquentiel après Wave 2)
  - **Blocks**: Task 7
  - **Blocked By**: Task 4

  **References**:

  **Pattern References**:
  - `services/service-commercial/src/domain/mondial-tv/entities/ims-webhook-event.entity.ts` — Pas de pattern sortant existant. Ce sera le premier outgoing webhook du codebase. S'inspirer du pattern `fetch()` standard Node.js.
  - `services/service-commercial/src/domain/products/entities/produit.entity.ts` — Entity complète à sérialiser pour le push sortant.

  **Anti-loop Reference**:
  - La colonne `source_derniere_modif` (Task 1) est le mécanisme anti-boucle. Quand un produit arrive du partenaire, on set `sourceDerniereModif = 'webhook_partner'`. Le service sortant filtre ces produits.

  **Acceptance Criteria**:

  ```
  Scenario: Outgoing webhook pushes products
    Tool: Bash (curl to test endpoint + check logs)
    Preconditions: CATALOGUE_WEBHOOK_OUTGOING_URL set to a mock endpoint (e.g., https://webhook.site/xxx or localhost mock), products exist in DB
    Steps:
      1. Create test products via gRPC or direct DB insert (with source_derniere_modif = 'crm_user' or NULL)
      2. Call the sync service (via gRPC endpoint in Task 7 or direct test)
      3. Check logs: grep for "Outgoing catalogue webhook" in service-commercial logs
      4. Assert: Log shows POST to the configured URL
      5. Assert: Log shows number of products sent
    Expected Result: Products pushed to partner URL
    Evidence: Service logs

  Scenario: Products from partner are excluded from outgoing push (anti-loop)
    Tool: Bash
    Steps:
      1. Create product with source_derniere_modif = 'webhook_partner'
      2. Call sync
      3. Check logs: the partner product should NOT be in the outgoing payload
    Expected Result: Partner products filtered out
    Evidence: Service logs showing filtered count

  Scenario: Build succeeds
    Tool: Bash
    Steps:
      1. Run: bun run build (from services/service-commercial/)
      2. Assert: Exit code 0
    Expected Result: Compilation OK
    Evidence: Terminal output
  ```

  **Commit**: YES
  - Message: `feat(catalogue-webhook): add outgoing webhook service for partner push`
  - Files: `services/service-commercial/src/domain/catalogue-webhook/services/catalogue-outgoing-webhook.service.ts`, `services/service-commercial/src/catalogue-webhook.module.ts`
  - Pre-commit: `bun run build`

---

- [x] 7. gRPC Controller SyncCatalogue + server action frontend

  **What to do**:
  - Créer `CatalogueWebhookGrpcController` dans `services/service-commercial/src/infrastructure/grpc/catalogue-webhook/catalogue-webhook.controller.ts`
  - Implémenter le RPC `SyncCatalogue(request: SyncCatalogueRequest): SyncCatalogueResponse`
  - Ce RPC appelle `CatalogueOutgoingWebhookService.pushAllProducts(request.organisationId)`
  - Retourne `{ success, productsSynced, error }`
  - Ajouter le controller dans `CatalogueWebhookModule` controllers
  - Ajouter `'catalogue-webhook'` dans la liste des proto packages de `main.ts` (ligne 13)
  - Côté frontend:
    - Ajouter le client gRPC pour catalogue-webhook dans `frontend/src/lib/grpc.ts` (si c'est là que les clients sont initialisés)
    - Créer la server action `syncCatalogue` dans `frontend/src/actions/catalogue.ts` — appelle le gRPC `SyncCatalogue`
    - Return: `ActionResult<{ success: boolean; productsSynced: number }>`

  **Must NOT do**:
  - NE PAS ajouter de logique métier dans le controller gRPC — déléguer au service
  - NE PAS créer un nouveau fichier proto — utiliser le RPC ajouté dans Task 5

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Modification cross-stack (backend gRPC + frontend server action), plusieurs fichiers
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 3 (séquentiel)
  - **Blocks**: Task 8
  - **Blocked By**: Tasks 5, 6

  **References**:

  **Pattern References** (gRPC controller backend):
  - `services/service-commercial/src/infrastructure/grpc/products/` — Controllers gRPC existants pour les produits. Voir comment `ProduitController` implémente les RPCs. Copier le pattern de décorateurs `@GrpcMethod`.

  **Pattern References** (frontend server action):
  - `frontend/src/actions/catalogue.ts` — Lignes 176-217. Pattern `createProduit` — structure try/catch avec gRPC call et `ActionResult` return type. **COPIER CE PATTERN** pour `syncCatalogue`.

  **Frontend gRPC client Reference**:
  - `frontend/src/lib/grpc.ts` — Voir comment les clients gRPC sont initialisés. Ajouter le client `catalogueWebhook` ou réutiliser le client `produits` si le RPC est sur le même service proto.

  **Main.ts Reference**:
  - `services/service-commercial/src/main.ts` — Ligne 13. Ajouter `'catalogue-webhook'` dans le tableau de `getMultiGrpcOptions`. Ou si le RPC SyncCatalogue est ajouté dans le ProduitService du proto, pas besoin de nouveau package.

  **Acceptance Criteria**:

  ```
  Scenario: gRPC SyncCatalogue returns success
    Tool: Bash (grpcurl or frontend server action test)
    Preconditions: service-commercial running with products in DB
    Steps:
      1. Call SyncCatalogue RPC with organisation_id
      2. Assert: response.success is true
      3. Assert: response.products_synced >= 0
    Expected Result: Sync completed
    Evidence: gRPC response

  Scenario: Frontend server action returns data
    Tool: Bash
    Steps:
      1. Run: npm run build (from frontend/)
      2. Assert: Exit code 0 (the new server action compiles)
    Expected Result: Frontend builds with new action
    Evidence: Terminal output

  Scenario: Both services build
    Tool: Bash
    Steps:
      1. bun run build (from services/service-commercial/)
      2. npm run build (from frontend/)
      3. Assert: Both exit code 0
    Expected Result: Full stack builds
    Evidence: Terminal output
  ```

  **Commit**: YES
  - Message: `feat(catalogue-webhook): add SyncCatalogue gRPC endpoint and frontend server action`
  - Files: `services/service-commercial/src/infrastructure/grpc/catalogue-webhook/catalogue-webhook.controller.ts`, `services/service-commercial/src/main.ts`, `services/service-commercial/src/catalogue-webhook.module.ts`, `frontend/src/actions/catalogue.ts`, `frontend/src/lib/grpc.ts`
  - Pre-commit: `bun run build && npm run build --prefix frontend`

---

- [x] 8. Bouton "Synchroniser le catalogue" sur page catalogue frontend

  **What to do**:
  - Modifier `frontend/src/app/(main)/catalogue/catalogue-page-client.tsx`
  - Ajouter un bouton "Synchroniser le catalogue" dans la barre d'actions en haut de la page (à côté du bouton "Nouveau produit")
  - Icône: `RefreshCw` de lucide-react
  - Au clic:
    - Disable le bouton + spinner
    - Appeler `syncCatalogue({ organisationId })` (server action de Task 7)
    - Si success: toast succès "X produits synchronisés"
    - Si error: toast erreur avec le message
    - Re-enable le bouton
  - Style: Button variant="outline" pour le différencier du bouton principal "Nouveau"

  **Must NOT do**:
  - NE PAS changer le layout existant de la page
  - NE PAS ajouter de modal de confirmation (action simple, réversible)
  - NE PAS ajouter de logique de sync dans le component — tout est dans la server action

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: Modification UI React avec composants Shadcn, intégration server action
  - **Skills**: `["frontend-ui-ux"]`
    - `frontend-ui-ux`: Placement correct du bouton dans le layout existant, respect du design system Shadcn

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 3 (dernier)
  - **Blocks**: None (dernière tâche)
  - **Blocked By**: Task 7

  **References**:

  **Pattern References** (layout page catalogue):
  - `frontend/src/app/(main)/catalogue/catalogue-page-client.tsx` — Lignes 1-80 lues. Le component utilise Shadcn (Button, Sheet, Dialog), lucide icons, et importe depuis `@/actions/catalogue`. Ajouter le bouton dans la même zone que les boutons existants.

  **Pattern References** (action call + toast):
  - `frontend/src/app/(main)/catalogue/catalogue-page-client.tsx` — Voir comment les actions existantes (createProduit, updateProduit) sont appelées avec toast success/error. Copier le même pattern pour syncCatalogue.

  **Server Action Reference**:
  - `frontend/src/actions/catalogue.ts` — La server action `syncCatalogue` ajoutée en Task 7.

  **UI Components Reference**:
  - `frontend/src/components/ui/button.tsx` — Composant Button Shadcn avec variants (default, outline, ghost, destructive)
  - Import à ajouter: `RefreshCw` de `lucide-react`, `syncCatalogue` de `@/actions/catalogue`

  **Acceptance Criteria**:

  ```
  Scenario: Bouton "Synchroniser" visible et fonctionnel
    Tool: Playwright (playwright skill)
    Preconditions: Frontend running on localhost:3000, user logged in, on catalogue page
    Steps:
      1. Navigate to: http://localhost:3000/catalogue
      2. Wait for: page loaded (products grid visible)
      3. Assert: Button with text "Synchroniser" or icon RefreshCw is visible in the top action bar
      4. Click: the sync button
      5. Wait for: button shows spinner/loading state (timeout: 2s)
      6. Wait for: toast notification appears (timeout: 15s)
      7. Assert: toast contains "synchronisé" or error message
      8. Assert: button is re-enabled after completion
      9. Screenshot: .sisyphus/evidence/task-8-sync-button.png
    Expected Result: Button visible, clickable, shows feedback via toast
    Evidence: .sisyphus/evidence/task-8-sync-button.png

  Scenario: Frontend builds successfully
    Tool: Bash
    Steps:
      1. npm run build (from frontend/)
      2. Assert: Exit code 0
    Expected Result: No compilation errors
    Evidence: Terminal output
  ```

  **Commit**: YES
  - Message: `feat(catalogue): add "Synchroniser" button to catalogue page for partner sync`
  - Files: `frontend/src/app/(main)/catalogue/catalogue-page-client.tsx`
  - Pre-commit: `npm run build --prefix frontend`

---

## Commit Strategy

| After Task | Message | Key Files | Verification |
|------------|---------|-----------|--------------|
| 1 | `feat(products): add partner catalogue columns to ProduitEntity` | migration + entity | `bun run build` |
| 2 | `feat(catalogue-webhook): add webhook event inbox entity and migration` | migration + entity + barrel | `bun run build` |
| 3 | `feat(catalogue-webhook): add inbound HTTP controller and module wiring` | controller + repo + module + app.module | `bun run build` |
| 4 | `feat(catalogue-webhook): add NATS worker and product mapping/upsert service` | mapping service + NATS handler | `bun run build` |
| 5 | `feat(proto): add SyncCatalogue RPC and partner catalogue fields to Produit` | proto + generated | `bun run proto:generate` |
| 6 | `feat(catalogue-webhook): add outgoing webhook service for partner push` | outgoing service + module update | `bun run build` |
| 7 | `feat(catalogue-webhook): add SyncCatalogue gRPC endpoint and frontend server action` | grpc controller + main.ts + server action + grpc client | `bun run build` + `npm run build` |
| 8 | `feat(catalogue): add "Synchroniser" button to catalogue page for partner sync` | catalogue-page-client.tsx | `npm run build` |

---

## Environment Variables (à ajouter)

```env
# Webhook catalogue entrant — API key pour validation
CATALOGUE_WEBHOOK_API_KEY=<clé-partagée-avec-le-collègue>

# Webhook catalogue sortant — URL de l'outil du collègue
CATALOGUE_WEBHOOK_OUTGOING_URL=https://collegue-tool.example.com/api/webhook/catalogue
```

---

## Success Criteria

### Verification Commands
```bash
# 1. Build backend
cd services/service-commercial && bun run build  # Expected: Exit code 0

# 2. Build frontend
cd frontend && npm run build  # Expected: Exit code 0

# 3. Test webhook entrant (avec API key valide)
curl -s -X POST http://localhost:3053/webhooks/catalogue/<org-uuid> \
  -H "Content-Type: application/json" \
  -H "x-api-key: <test-key>" \
  -d '[{"id":1,"nom":"Test","prix_base":9.9,"categorie":"Téléphonie","fournisseur":"BLEUTEL","isActive":true}]'
# Expected: {"success":true,"status":"received","eventId":"..."}

# 4. Test webhook rejeté (sans API key)
curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:3053/webhooks/catalogue/<org-uuid> \
  -H "Content-Type: application/json" -d '[]'
# Expected: 401

# 5. Vérifier produit créé en base (après traitement NATS)
# Query: SELECT * FROM produit WHERE code_externe = 'partner-1' AND organisation_id = '<org-uuid>'
# Expected: 1 row with nom='Test', prix=9.9
```

### Final Checklist
- [ ] Webhook entrant accepte et upsert les produits partenaire
- [ ] Webhook entrant rejette les appels sans API key (401)
- [ ] Idempotence fonctionne (pas de doublon)
- [ ] Produits partenaire visibles dans le catalogue CRM
- [ ] Bouton "Synchroniser" pousse les produits vers URL partenaire
- [ ] Protection anti-boucle active (produits du partenaire pas re-poussés)
- [ ] Toutes les nouvelles colonnes ProduitEntity sont nullable
- [ ] `bun run build` (service-commercial) → 0 erreur
- [ ] `npm run build` (frontend) → 0 erreur
