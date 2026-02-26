# Intégration CFAST — Import Factures

## TL;DR

> **Quick Summary**: Ajouter une intégration CFAST au CRM qui importe les factures depuis la plateforme télécom CFAST dans la table `facture` existante, avec matching client par nom+prénom+téléphone, gestion OAuth2, et téléchargement PDF.
> 
> **Deliverables**:
> - Configuration CFAST (credentials chiffrées AES-256-GCM) dans service-commercial
> - Client HTTP CFAST avec auth OAuth2 ROPC + rate limiting (2 req/sec)
> - Migration schema facture (sourceSystem, externalId, importedAt) + colonnes nullable
> - Import orchestrator avec matching client et création factures via gRPC
> - Proxy PDF pour téléchargement factures CFAST
> - Frontend : carte intégration + config dialog + filtre source dans factures + bouton refresh
> 
> **Estimated Effort**: Medium
> **Parallel Execution**: YES - 4 waves
> **Critical Path**: Proto → Migration → API Client → Import Service → Frontend

---

## Context

### Original Request
L'utilisateur veut ajouter une intégration CFAST (plateforme de gestion d'opérateurs télécom français) pour importer les factures dans son CRM.

### Interview Summary
**Key Discussions**:
- **Direction** : CFAST → CRM uniquement (lecture seule, import)
- **Scope V1** : Factures seulement (pas customers, contacts, contrats, services)
- **Déclenchement** : On-demand via bouton refresh (pas de webhooks, pas de cron)
- **Stockage** : En BDD dans table `facture` existante avec colonnes source
- **Matching client** : Par nom + prénom + numéro de téléphone (avec normalisation)
- **Niveau de détail** : Liste + détail + téléchargement PDF
- **Tests** : Pas de tests automatisés — QA scenarios agent uniquement

**Research Findings**:
- CFAST API : OAuth2 OIDC (ROPC flow), base URL `v2.cfast.fr`, billing API `/api/billing`, rate limit 2/sec, token expire 10h
- CRM : Monorepo NestJS 11 + Next.js 16, 5 services, TypeORM+PostgreSQL, gRPC, NATS
- Pattern WooCommerce : config entity, API client, gRPC, NATS workers, frontend — **MAIS** CFAST est plus léger (pas de webhooks/NATS)
- Schema facture : 6 FK non-nullable (`statutId`, `emissionFactureId`, `clientBaseId`, `contratId`, `clientPartenaireId`, `adresseFacturationId`)
- Deux systèmes factures : `facture` (principal) et `invoices` (Factur-X) — on utilise `facture`
- `EncryptionService` existe dans service-finance (AES-256-GCM) — réutilisable pour credentials CFAST

### Metis Review
**Identified Gaps** (addressed):
- **Credential encryption** : WooCommerce hash one-way ≠ CFAST OAuth2 (besoin plaintext). Résolu : utiliser `EncryptionService` AES-256-GCM existant
- **Cross-service write path** : Config dans service-commercial, factures dans service-finance. Résolu : import orchestrator dans service-commercial appelle `FactureService.Create` via gRPC
- **FK non-nullable** : `emissionFactureId`, `clientPartenaireId`, `adresseFacturationId` requis pour toute facture. Résolu : migration pour rendre nullable + seed CFAST
- **Invoice number collision** : `numero` unique constraint. Résolu : CFAST invoices stockées avec `numero = NULL`, numéro CFAST dans `externalId`
- **produitId NOT NULL** dans `ligne_facture` : Résolu : migration pour rendre nullable + V1 import lignes avec produitId NULL
- **Phone normalization** : Pas de normalisation existante. Résolu : normalizer +33/0033 → 0, strip espaces/tirets
- **Rate limiting** : Pas d'utilitaire existant. Résolu : simple delay 500ms entre appels
- **Token caching** : In-memory sur le service, refresh auto si expiré
- **Client match failure** : Si aucun match → skip facture, log warning, compteur dans résultat import
- **PDF proxy** : Endpoint HTTP (pas gRPC) pour streamer le PDF depuis CFAST

---

## Work Objectives

### Core Objective
Importer les factures depuis CFAST dans la table `facture` existante du CRM, avec configuration sécurisée, matching client, et affichage frontend.

### Concrete Deliverables
- `cfast.proto` — Définitions gRPC (CfastConfigService + CfastImportService)
- `CfastConfigEntity` — Credentials chiffrées AES-256-GCM
- `CfastApiClient` — Client HTTP OAuth2 avec rate limiting
- `CfastImportService` — Orchestrateur import (fetch → match → create)
- Migration facture — `source_system`, `external_id`, `imported_at` + nullable FKs + nullable `produitId`
- `cfast.module.ts` — Wiring NestJS
- Frontend — Carte intégration, dialog config, filtre source, bouton refresh, badge CFAST, proxy PDF
- Seed data — Statut `IMPORTEE`, émission `CFAST_IMPORT`

### Definition of Done
- [ ] `bun run proto:generate` compile sans erreur
- [ ] Migration s'applique sur finance_db sans erreur
- [ ] Config CFAST créable/testable via gRPC
- [ ] Import factures retourne un résultat (imported, skipped, errors)
- [ ] Factures CFAST visibles dans la liste factures avec badge "CFAST"
- [ ] PDF téléchargeable depuis le frontend
- [ ] Credentials chiffrées en DB (pas de plaintext)

### Must Have
- Chiffrement AES-256-GCM des credentials (pas de hash)
- Normalisation téléphone avant matching client
- `externalId` unique pour idempotence (re-import safe)
- Rate limiting 2 req/sec vers CFAST API
- Gestion auto du token OAuth2 (cache + refresh)
- Factures CFAST en lecture seule dans le CRM (pas d'édition)
- Résultat d'import détaillé (nombre importé, skippé, erreurs)

### Must NOT Have (Guardrails)
- ❌ Webhook event entity / receiver pour CFAST (V1 = pull only)
- ❌ NATS workers / events pour CFAST (sync synchrone on-demand)
- ❌ Mapping entity séparée (externalId suffit sur facture)
- ❌ Hash des credentials (besoin plaintext pour OAuth2 → encryption)
- ❌ Tests automatisés (user explicit: pas de tests)
- ❌ Sync customers/products/contracts depuis CFAST (V1 = factures only)
- ❌ Cron/scheduler pour sync automatique
- ❌ Édition des factures CFAST dans le CRM (read-only)
- ❌ JSDoc/documentation excessive (suivre convention codebase)
- ❌ Stockage numéro CFAST dans `numero` (collision unique constraint → utiliser `externalId`)

---

## Verification Strategy

> **ZERO HUMAN INTERVENTION** — ALL verification is agent-executed. No exceptions.

### Test Decision
- **Infrastructure exists**: YES (Jest 30 dans service-finance/commercial)
- **Automated tests**: NO (user explicit)
- **Framework**: N/A
- **QA Policy**: Agent-executed QA scenarios with evidence capture

### QA Policy
Every task MUST include agent-executed QA scenarios.
Evidence saved to `.sisyphus/evidence/task-{N}-{scenario-slug}.{ext}`.

- **Backend gRPC**: Use Bash (grpcurl) — Send requests, assert status + response fields
- **Backend HTTP**: Use Bash (curl) — Send requests, assert status + response
- **Database**: Use Bash (psql/docker exec) — Query schema, verify data
- **Frontend/UI**: Use Playwright (playwright skill) — Navigate, interact, assert DOM, screenshot
- **Proto generation**: Use Bash (bun run) — Verify compilation

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Start Immediately — proto + migration + seed):
├── Task 1: Proto definitions (cfast.proto + update factures.proto) [quick]
├── Task 2: Migration facture schema (3 new columns + nullable FKs) [quick]
├── Task 3: Seed data (statut IMPORTEE + emission CFAST_IMPORT) [quick]
└── Task 4: EncryptionService extraction vers shared-kernel [quick]

Wave 2 (After Wave 1 — core backend):
├── Task 5: CfastConfigEntity + repository + gRPC controller [unspecified-high]
├── Task 6: CfastApiClient (OAuth2 + rate limiting + billing API) [deep]
├── Task 7: Update FactureEntity + FactureService (sourceSystem filter) [quick]
└── Task 8: Phone normalizer utility [quick]

Wave 3 (After Wave 2 — import orchestration + module):
├── Task 9: CfastImportService (orchestration: fetch→match→create) [deep]
├── Task 10: PDF proxy HTTP endpoint [unspecified-high]
└── Task 11: cfast.module.ts + app.module.ts wiring [quick]

Wave 4 (After Wave 3 — frontend):
├── Task 12: Frontend gRPC client + server actions CFAST [quick]
├── Task 13: Carte intégration CFAST + dialog config [visual-engineering]
├── Task 14: Filtre source + badge CFAST dans liste factures [visual-engineering]
└── Task 15: Bouton import/refresh + résultat + téléchargement PDF [visual-engineering]

Wave FINAL (After ALL tasks — verification):
├── Task F1: Plan compliance audit (oracle)
├── Task F2: Code quality review (unspecified-high)
├── Task F3: Real QA — full flow (unspecified-high + playwright)
└── Task F4: Scope fidelity check (deep)

Critical Path: Task 1 → Task 6 → Task 9 → Task 15 → F1-F4
Parallel Speedup: ~60% faster than sequential
Max Concurrent: 4 (Wave 1)
```

### Dependency Matrix

| Task | Depends On | Blocks | Wave |
|------|-----------|--------|------|
| 1 | — | 5, 6, 7, 9, 12 | 1 |
| 2 | — | 7 | 1 |
| 3 | 2 | 9 | 1 |
| 4 | — | 5, 6 | 1 |
| 5 | 1, 4 | 9, 12, 13 | 2 |
| 6 | 1, 4 | 9, 10 | 2 |
| 7 | 1, 2 | 9, 14 | 2 |
| 8 | — | 9 | 2 |
| 9 | 5, 6, 7, 8 | 15 | 3 |
| 10 | 6 | 15 | 3 |
| 11 | 5, 6, 9, 10 | 12 | 3 |
| 12 | 1, 11 | 13, 14, 15 | 4 |
| 13 | 5, 12 | F3 | 4 |
| 14 | 7, 12 | F3 | 4 |
| 15 | 9, 10, 12 | F3 | 4 |

### Agent Dispatch Summary

- **Wave 1**: **4 tasks** — T1→`quick`, T2→`quick`, T3→`quick`, T4→`quick`
- **Wave 2**: **4 tasks** — T5→`unspecified-high`, T6→`deep`, T7→`quick`, T8→`quick`
- **Wave 3**: **3 tasks** — T9→`deep`, T10→`unspecified-high`, T11→`quick`
- **Wave 4**: **4 tasks** — T12→`quick`, T13→`visual-engineering`, T14→`visual-engineering`, T15→`visual-engineering`
- **FINAL**: **4 tasks** — F1→`oracle`, F2→`unspecified-high`, F3→`unspecified-high`+`playwright`, F4→`deep`

---

## TODOs


### Wave 1 — Foundation (proto + migration + seed + encryption)

- [ ] 1. Proto definitions (cfast.proto + update factures.proto)

  **What to do**:
  - Créer `packages/proto/src/cfast/cfast.proto` avec :
    - `CfastConfigService` : Create, Update, Get, GetByOrganisation, Delete, TestConnection
    - `CfastImportService` : ImportInvoices, GetImportStatus
    - Messages : CfastConfig (id, organisation_id, base_url, client_id_encrypted, client_secret_encrypted, username_encrypted, password_encrypted, active, last_sync_at, sync_error, created_at, updated_at)
    - ImportInvoicesRequest (organisation_id), ImportInvoicesResponse (imported_count, skipped_count, errors[])
    - TestConnectionResponse (success, message, api_version)
  - Modifier `packages/proto/src/factures/factures.proto` :
    - Ajouter `source_system` (string) dans message `Facture`
    - Ajouter `external_id` (string) dans message `Facture`
    - Ajouter `imported_at` (string) dans message `Facture`
    - Ajouter `source_system` filter dans `ListFacturesRequest`
  - Run `bun run proto:generate` pour générer les types TypeScript

  **Must NOT do**:
  - Ne PAS ajouter de WebhookService ou MappingService dans le proto
  - Ne PAS ajouter de méthodes d'écriture vers CFAST

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Fichiers proto déclaratifs, pattern clair à suivre
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 2, 3, 4)
  - **Blocks**: Tasks 5, 6, 7, 9, 12
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `packages/proto/src/woocommerce/woocommerce.proto` — Pattern exact pour CfastConfigService (même structure Create/Update/Get/Delete/TestConnection)
  - `packages/proto/src/factures/factures.proto` — Message Facture actuel à étendre avec 3 champs

  **API/Type References**:
  - `packages/proto/gen/ts/` — Vérifier que les types générés sont bien créés après `proto:generate`

  **External References**:
  - https://developers.cfast.fr/docs/authentication — Auth flow pour comprendre les champs credentials
  - https://developers.cfast.fr/docs/manage-a-bill-process-todo — Billing API structure

  **WHY Each Reference Matters**:
  - woocommerce.proto : copier la structure ConfigService (CRUD + TestConnection) en remplaçant les messages
  - factures.proto : étendre le message Facture existant sans casser la compatibilité (champs optionnels)

  **Acceptance Criteria**:
  - [ ] `bun run proto:generate` → 0 errors
  - [ ] Fichier `packages/proto/gen/ts/cfast/` existe avec types générés
  - [ ] Message Facture dans gen/ts contient source_system, external_id, imported_at

  **QA Scenarios:**
  ```
  Scenario: Proto generation succeeds
    Tool: Bash
    Preconditions: packages/proto/src/cfast/cfast.proto exists
    Steps:
      1. Run `bun run proto:generate` in packages/proto/
      2. Check exit code is 0
      3. Verify `packages/proto/gen/ts/cfast/cfast.ts` exists
      4. Grep for 'CfastConfigService' in generated file
    Expected Result: File exists and contains CfastConfigService type definitions
    Failure Indicators: Non-zero exit code, missing generated files
    Evidence: .sisyphus/evidence/task-1-proto-generation.txt

  Scenario: Backward compatibility of factures.proto
    Tool: Bash
    Preconditions: Existing factures.proto modified
    Steps:
      1. Run `bun run proto:generate`
      2. Grep for 'source_system' in packages/proto/gen/ts/factures/
      3. Verify existing fields (numero, montant_ht, etc.) still present
    Expected Result: New fields present AND all old fields intact
    Failure Indicators: Missing old fields, compilation errors
    Evidence: .sisyphus/evidence/task-1-backward-compat.txt
  ```

  **Commit**: YES (groups with 2, 3, 4)
  - Message: `feat(cfast): add proto definitions and facture schema migration`
  - Files: `packages/proto/src/cfast/cfast.proto`, `packages/proto/src/factures/factures.proto`
  - Pre-commit: `bun run proto:generate`

- [ ] 2. Migration facture schema (new columns + nullable FKs)

  **What to do**:
  - Créer migration dans `services/service-finance/src/migrations/` :
    - Ajouter `source_system VARCHAR(50) DEFAULT 'INTERNAL'` à table `facture`
    - Ajouter `external_id VARCHAR(255) NULLABLE UNIQUE` à table `facture`
    - Ajouter `imported_at TIMESTAMPTZ NULLABLE` à table `facture`
    - Rendre `client_partenaire_id` NULLABLE (pour factures importées sans partenaire)
    - Rendre `adresse_facturation_id` NULLABLE (pour factures importées sans adresse)
    - Rendre `emission_facture_id` NULLABLE (pour factures importées)
    - Rendre `produit_id` NULLABLE dans `ligne_facture` (pour lignes importées sans produit CRM)
    - Créer index `idx_facture_source_system` sur `(source_system)`
    - Créer index `idx_facture_external_id` sur `(external_id)` WHERE external_id IS NOT NULL
    - Créer index `idx_facture_imported_at` sur `(imported_at)` WHERE imported_at IS NOT NULL

  **Must NOT do**:
  - Ne PAS supprimer ou renommer des colonnes existantes
  - Ne PAS toucher aux index existants
  - Ne PAS créer de table séparée pour les factures CFAST

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Migration SQL déclarative, pattern clair
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 3, 4)
  - **Blocks**: Task 7
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `services/service-finance/src/migrations/1707340800000-AddAvoirFieldsToFacture.ts` — Pattern exact pour ajouter colonnes à facture (même style ALTER TABLE)

  **API/Type References**:
  - `services/service-finance/src/domain/factures/entities/facture.entity.ts` — Entity actuelle pour comprendre les colonnes existantes
  - `services/service-finance/src/domain/factures/entities/ligne-facture.entity.ts` — Pour produitId nullable

  **WHY Each Reference Matters**:
  - Migration avoir : copier le pattern QueryRunner (up/down) avec ALTER TABLE ADD COLUMN
  - Entity facture : vérifier les noms de colonnes exacts (snake_case) pour la migration

  **Acceptance Criteria**:
  - [ ] Migration s'applique sans erreur sur finance_db
  - [ ] `SELECT column_name FROM information_schema.columns WHERE table_name='facture' AND column_name IN ('source_system','external_id','imported_at')` retourne 3 lignes
  - [ ] `client_partenaire_id` est nullable : `SELECT is_nullable FROM information_schema.columns WHERE table_name='facture' AND column_name='client_partenaire_id'` retourne 'YES'

  **QA Scenarios:**
  ```
  Scenario: Migration applies successfully
    Tool: Bash
    Preconditions: finance_db running, migration file created
    Steps:
      1. Run TypeORM migration on service-finance
      2. Query information_schema.columns for new columns
      3. Verify source_system default is 'INTERNAL'
      4. Insert a facture with source_system='CFAST', external_id='TEST-001', client_partenaire_id=NULL
    Expected Result: All 3 columns exist, insert succeeds with nullable FKs
    Failure Indicators: Migration error, insert fails due to NOT NULL constraint
    Evidence: .sisyphus/evidence/task-2-migration-apply.txt

  Scenario: Existing factures unaffected
    Tool: Bash
    Preconditions: Existing factures in DB before migration
    Steps:
      1. Count factures before migration
      2. Run migration
      3. Count factures after, verify source_system='INTERNAL' for all existing
    Expected Result: Same count, all existing factures have source_system='INTERNAL'
    Failure Indicators: Row count changed, source_system is NULL for existing records
    Evidence: .sisyphus/evidence/task-2-existing-unaffected.txt
  ```

  **Commit**: YES (groups with 1, 3, 4)
  - Message: (grouped)
  - Files: migration file
  - Pre-commit: migration runs

- [ ] 3. Seed data (statut IMPORTEE + emission CFAST_IMPORT)

  **What to do**:
  - Créer un seed/migration dans `services/service-finance/src/migrations/` :
    - INSERT INTO `statut_facture` (id, code, nom, description, ordre_affichage) VALUES (uuid, 'IMPORTEE', 'Importée', 'Facture importée depuis un système externe', 50)
    - INSERT INTO `emission_facture` (id, code, nom, description) VALUES (uuid, 'CFAST_IMPORT', 'Import CFAST', 'Facture importée depuis CFAST')
  - Utiliser des UUIDs déterministes (générés à l'avance) pour pouvoir les référencer dans le code

  **Must NOT do**:
  - Ne PAS modifier les statuts/émissions existants
  - Ne PAS utiliser de UUIDs aléatoires (besoin de constantes référençables)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Simple INSERT SQL
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (but logically after Task 2 migration)
  - **Parallel Group**: Wave 1 (with Tasks 1, 2, 4)
  - **Blocks**: Task 9
  - **Blocked By**: Task 2 (tables must exist)

  **References**:

  **Pattern References**:
  - `services/service-finance/src/domain/factures/entities/statut-facture.entity.ts` — Structure de la table statut_facture (code, nom, description, ordreAffichage)
  - `services/service-finance/src/domain/factures/entities/emission-facture.entity.ts` — Structure de la table emission_facture

  **WHY Each Reference Matters**:
  - statut-facture.entity : connaître les champs exacts à remplir dans le seed
  - emission-facture.entity : idem pour le type d'émission

  **Acceptance Criteria**:
  - [ ] `SELECT * FROM statut_facture WHERE code = 'IMPORTEE'` retourne 1 ligne
  - [ ] `SELECT * FROM emission_facture WHERE code = 'CFAST_IMPORT'` retourne 1 ligne

  **QA Scenarios:**
  ```
  Scenario: Seed data exists after migration
    Tool: Bash
    Preconditions: Migration applied
    Steps:
      1. Query `SELECT code, nom FROM statut_facture WHERE code = 'IMPORTEE'`
      2. Query `SELECT code, nom FROM emission_facture WHERE code = 'CFAST_IMPORT'`
    Expected Result: Both return exactly 1 row with correct nom values
    Failure Indicators: 0 rows returned, duplicate code errors
    Evidence: .sisyphus/evidence/task-3-seed-data.txt
  ```

  **Commit**: YES (groups with 1, 2, 4)
  - Message: (grouped)
  - Files: seed migration file
  - Pre-commit: migration runs

- [ ] 4. EncryptionService extraction vers shared-kernel ou copie

  **What to do**:
  - Vérifier si `service-finance/src/infrastructure/security/encryption.service.ts` peut être réutilisé par service-commercial
  - Option A (recommandée) : Copier `EncryptionService` dans `services/service-commercial/src/infrastructure/security/encryption.service.ts`
  - Option B : Extraire vers `packages/shared-kernel/src/security/encryption.service.ts`
  - Le service utilise AES-256-GCM avec `ENCRYPTION_KEY` depuis env vars
  - Méthodes nécessaires : `encrypt(plaintext): string` et `decrypt(ciphertext): string`

  **Must NOT do**:
  - Ne PAS utiliser de hash (MD5, SHA, bcrypt) — besoin de déchiffrement pour OAuth2
  - Ne PAS modifier le EncryptionService de service-finance

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Copie de fichier existant avec adaptation mineure
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 2, 3)
  - **Blocks**: Tasks 5, 6
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `services/service-finance/src/infrastructure/security/encryption.service.ts` — Implémentation AES-256-GCM à copier (encrypt/decrypt avec IV + authTag)

  **WHY Each Reference Matters**:
  - C'est le fichier source à copier/adapter pour service-commercial. Même pattern, même env var ENCRYPTION_KEY.

  **Acceptance Criteria**:
  - [ ] EncryptionService disponible dans service-commercial
  - [ ] `encrypt('test')` retourne une chaîne différente de 'test'
  - [ ] `decrypt(encrypt('test'))` retourne 'test'

  **QA Scenarios:**
  ```
  Scenario: Encryption roundtrip works
    Tool: Bash
    Preconditions: EncryptionService file created, ENCRYPTION_KEY env var set
    Steps:
      1. Write a minimal test script that imports EncryptionService
      2. Call encrypt('my-secret-password')
      3. Verify output is NOT 'my-secret-password'
      4. Call decrypt(result)
      5. Verify output IS 'my-secret-password'
    Expected Result: Roundtrip encryption/decryption preserves original value
    Failure Indicators: decrypt returns different value, or throws error
    Evidence: .sisyphus/evidence/task-4-encryption-roundtrip.txt
  ```

  **Commit**: YES (groups with 1, 2, 3)
  - Message: (grouped)
  - Files: encryption.service.ts in service-commercial
  - Pre-commit: `tsc --noEmit`

### Wave 2 — Core Backend (config entity, API client, facture update, normalizer)

- [ ] 5. CfastConfigEntity + repository + gRPC controller

  **What to do**:
  - Créer `services/service-commercial/src/domain/cfast/entities/cfast-config.entity.ts` :
    - id (UUID PK), organisationId (UUID indexed unique), baseUrl (varchar 500), clientIdEncrypted (varchar 500), clientSecretEncrypted (varchar 500), usernameEncrypted (varchar 500), passwordEncrypted (varchar 500), scopes (varchar 500, default 'openid identity bill'), active (boolean default false), lastSyncAt (timestamptz nullable), syncError (text nullable), lastImportedCount (int default 0), createdAt, updatedAt
  - Créer repository interface `ICfastConfigRepository.ts` : findByOrganisationId, save, delete
  - Créer TypeORM impl `infrastructure/persistence/typeorm/repositories/cfast/cfast-config.service.ts`
  - Créer gRPC controller `infrastructure/grpc/subscriptions/cfast-config.controller.ts` :
    - Implémenter Create (chiffrer credentials avant save), Update, Get, GetByOrganisation, Delete, TestConnection
    - TestConnection : tente un OAuth2 token exchange et retourne success/failure
  - Créer migration `services/service-commercial/src/migrations/{timestamp}-CreateCfastConfigTable.ts`

  **Must NOT do**:
  - Ne PAS stocker credentials en clair ou hashées — utiliser EncryptionService (Task 4)
  - Ne PAS créer de webhook_events ou mapping entity

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Plusieurs fichiers, logique de chiffrement, gRPC controller avec TestConnection
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 6, 7, 8)
  - **Blocks**: Tasks 9, 12, 13
  - **Blocked By**: Tasks 1 (proto), 4 (encryption)

  **References**:

  **Pattern References**:
  - `services/service-commercial/src/domain/woocommerce/entities/woocommerce-config.entity.ts` — Structure entity config (mêmes colonnes organisationId, active, lastSyncAt, syncError) MAIS remplacer hash par encrypted
  - `services/service-commercial/src/infrastructure/grpc/subscriptions/woocommerce-config.controller.ts` — Pattern gRPC controller (toProto(), @GrpcMethod, RpcException)
  - `services/service-commercial/src/infrastructure/persistence/typeorm/repositories/woocommerce/woocommerce-config.service.ts` — Pattern TypeORM repository

  **External References**:
  - https://developers.cfast.fr/docs/authentication — OAuth2 ROPC endpoint pour TestConnection

  **WHY Each Reference Matters**:
  - woocommerce-config.entity : copier la structure exacte en remplaçant consumerKeyHash par clientIdEncrypted etc.
  - woocommerce-config.controller : copier Create/Update/Get/Delete/TestConnection pattern

  **Acceptance Criteria**:
  - [ ] Table `cfast_configs` créée en DB
  - [ ] gRPC Create retourne un config avec credentials chiffrées
  - [ ] gRPC GetByOrganisation retourne la config
  - [ ] TestConnection tente un appel OAuth2 et retourne success/failure

  **QA Scenarios:**
  ```
  Scenario: Config CRUD lifecycle
    Tool: Bash (grpcurl)
    Preconditions: service-commercial running, proto generated
    Steps:
      1. grpcurl Create with base_url='https://v2.cfast.fr', client_id='test', client_secret='secret', username='user', password='pass'
      2. Assert response has id, active=true, organisation_id set
      3. grpcurl GetByOrganisation with same org_id
      4. Assert same config returned
      5. grpcurl Delete with id
      6. grpcurl GetByOrganisation → should return NOT_FOUND
    Expected Result: Full CRUD lifecycle works
    Failure Indicators: gRPC error, missing fields, credentials in plaintext in response
    Evidence: .sisyphus/evidence/task-5-config-crud.txt

  Scenario: Credentials are encrypted in DB
    Tool: Bash (psql)
    Preconditions: Config created via gRPC
    Steps:
      1. Query `SELECT client_id_encrypted FROM cfast_configs LIMIT 1`
      2. Verify value is NOT 'test' (plaintext)
      3. Verify value contains ':' separator (IV:ciphertext:authTag format)
    Expected Result: Stored value is encrypted, not plaintext
    Failure Indicators: Plaintext credential found in DB
    Evidence: .sisyphus/evidence/task-5-credentials-encrypted.txt
  ```

  **Commit**: YES (groups with 6, 7, 8)
  - Message: `feat(cfast): add config entity, API client, and phone normalizer`
  - Files: entity, repository, controller, migration
  - Pre-commit: `tsc --noEmit`

- [ ] 6. CfastApiClient (OAuth2 + rate limiting + billing API)

  **What to do**:
  - Créer `services/service-commercial/src/infrastructure/external/cfast/cfast-api-client.ts` :
    - Classe injectable avec méthodes :
      - `authenticate(config: CfastConfigEntity): Promise<{access_token, expires_in, refresh_token?}>` — OAuth2 ROPC token exchange
      - `refreshToken(config, refreshToken): Promise<{access_token, expires_in}>` — Refresh token flow
      - `listBillingSessions(token): Promise<BillingSession[]>` — GET /api/billing/billing-sessions
      - `listInvoices(token, billingSessionId?): Promise<CfastInvoice[]>` — Lister les factures (endpoint exact à découvrir via l'API)
      - `getInvoice(token, invoiceId): Promise<CfastInvoiceDetail>` — Détail facture
      - `downloadInvoicePdf(token, invoiceId): Promise<Buffer>` — Télécharger PDF
    - Token caching in-memory : stocker token + expiry, re-fetch si expiré (avec marge 60s)
    - Rate limiting : simple delay 500ms entre chaque appel HTTP (2 req/sec max)
    - Error handling : gérer 401 (re-auth), 429 (respect Retry-After header), 5xx (retry 1x)
    - Utiliser `EncryptionService` pour déchiffrer credentials avant utilisation
  - Créer types `services/service-commercial/src/domain/cfast/types/cfast-api.types.ts` :
    - CfastInvoice, CfastInvoiceDetail, CfastBillingSession, CfastCustomer (minimal pour matching)

  **Must NOT do**:
  - Ne PAS exposer les credentials au frontend
  - Ne PAS ignorer le rate limiting
  - Ne PAS stocker le token en DB (in-memory suffit)

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: Logique OAuth2 complexe, rate limiting, error handling, token lifecycle
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 5, 7, 8)
  - **Blocks**: Tasks 9, 10
  - **Blocked By**: Tasks 1 (proto types), 4 (encryption)

  **References**:

  **Pattern References**:
  - `services/service-finance/src/infrastructure/security/encryption.service.ts` — Pattern decrypt() pour déchiffrer credentials avant OAuth2

  **External References**:
  - https://developers.cfast.fr/docs/authentication — OAuth2 ROPC flow exact (curl examples, token format)
  - https://developers.cfast.fr/docs/api-rate-limit — Rate limit 2/sec, headers X-RateLimit-*
  - https://developers.cfast.fr/docs/manage-a-bill-process-todo — Billing API endpoints

  **WHY Each Reference Matters**:
  - Auth docs : endpoint exact `/auth/connect/token`, format body `grant_type=password`, header `Authorization: Basic`
  - Rate limit docs : comprendre les headers de réponse pour adapter le délai
  - Billing docs : endpoints `/api/billing/billing-sessions` et structure de réponse

  **Acceptance Criteria**:
  - [ ] `authenticate()` retourne un token JWT valide (avec mock ou vrais credentials)
  - [ ] Rate limiting respecte 500ms entre appels
  - [ ] Token réutilisé tant que non expiré
  - [ ] 429 géré avec Retry-After

  **QA Scenarios:**
  ```
  Scenario: OAuth2 authentication flow
    Tool: Bash (curl)
    Preconditions: CFAST test credentials available (or mock server)
    Steps:
      1. Call authenticate() with valid config
      2. Verify response has access_token, expires_in, token_type='Bearer'
      3. Use token in Authorization header for a billing API call
      4. Verify 200 response
    Expected Result: Token obtained and usable for API calls
    Failure Indicators: 401 error, missing token fields
    Evidence: .sisyphus/evidence/task-6-oauth2-auth.txt

  Scenario: Rate limiting enforced
    Tool: Bash
    Preconditions: CfastApiClient instantiated
    Steps:
      1. Make 5 rapid sequential API calls
      2. Measure time between calls
      3. Verify minimum 500ms gap between each
    Expected Result: All calls succeed, timing shows >= 500ms between each
    Failure Indicators: 429 error from CFAST, or calls faster than 500ms apart
    Evidence: .sisyphus/evidence/task-6-rate-limiting.txt
  ```

  **Commit**: YES (groups with 5, 7, 8)
  - Message: (grouped)
  - Files: cfast-api-client.ts, cfast-api.types.ts
  - Pre-commit: `tsc --noEmit`

- [ ] 7. Update FactureEntity + FactureService (sourceSystem filter)

  **What to do**:
  - Modifier `services/service-finance/src/domain/factures/entities/facture.entity.ts` :
    - Ajouter `@Column({ type: 'varchar', length: 50, default: 'INTERNAL' }) sourceSystem: string`
    - Ajouter `@Column({ type: 'varchar', length: 255, nullable: true, unique: true }) externalId: string | null`
    - Ajouter `@Column({ type: 'timestamptz', nullable: true }) importedAt: Date | null`
    - Rendre `clientPartenaireId`, `adresseFacturationId`, `emissionFactureId` nullable dans les décorateurs TypeORM
  - Modifier `services/service-finance/src/domain/factures/entities/ligne-facture.entity.ts` :
    - Rendre `produitId` nullable : `@Column({ type: 'uuid', nullable: true })`
  - Modifier `services/service-finance/src/infrastructure/persistence/typeorm/repositories/factures/facture.service.ts` :
    - Ajouter filtre `sourceSystem` dans la méthode de listing (WHERE source_system = :sourceSystem si fourni)
  - Modifier gRPC controller `services/service-finance/src/infrastructure/grpc/factures/facture.controller.ts` :
    - Mapper les nouveaux champs dans `toProto()` et `fromProto()`
    - Supporter le filtre `source_system` dans List

  **Must NOT do**:
  - Ne PAS casser la création de factures internes (source_system='INTERNAL' par défaut)
  - Ne PAS modifier la logique métier existante (validation, calcul totaux)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Ajout de champs et filtre, pattern clair
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 5, 6, 8)
  - **Blocks**: Tasks 9, 14
  - **Blocked By**: Tasks 1 (proto), 2 (migration)

  **References**:

  **Pattern References**:
  - `services/service-finance/src/domain/factures/entities/facture.entity.ts` — Entity à modifier (ajouter 3 champs)
  - `services/service-finance/src/domain/factures/entities/ligne-facture.entity.ts` — Rendre produitId nullable
  - `services/service-finance/src/infrastructure/persistence/typeorm/repositories/factures/facture.service.ts` — Repository à modifier (ajouter filtre sourceSystem)
  - `services/service-finance/src/infrastructure/grpc/factures/facture.controller.ts` — Controller à modifier (mapper nouveaux champs)

  **WHY Each Reference Matters**:
  - Chaque fichier doit être modifié pour supporter les factures CFAST. L'entity définit les colonnes, le repository le filtre, le controller le mapping proto.

  **Acceptance Criteria**:
  - [ ] `tsc --noEmit` passe sur service-finance
  - [ ] Création facture interne fonctionne toujours (régression)
  - [ ] Filtre `source_system='CFAST'` via gRPC List retourne uniquement factures CFAST

  **QA Scenarios:**
  ```
  Scenario: Backward compatibility — internal invoices still work
    Tool: Bash (grpcurl)
    Preconditions: service-finance running with updated entity
    Steps:
      1. Create a facture via FactureService.Create (no sourceSystem specified)
      2. Get the facture, verify source_system='INTERNAL'
      3. List all factures, verify it appears
    Expected Result: Internal invoices work exactly as before
    Failure Indicators: Default source_system not 'INTERNAL', creation fails
    Evidence: .sisyphus/evidence/task-7-backward-compat.txt

  Scenario: Source system filter works
    Tool: Bash (grpcurl)
    Preconditions: Mix of INTERNAL and CFAST factures in DB
    Steps:
      1. List with source_system='CFAST' filter
      2. Verify only CFAST factures returned
      3. List with source_system='INTERNAL' filter
      4. Verify only internal factures returned
      5. List without filter → all factures returned
    Expected Result: Filter correctly isolates by source
    Failure Indicators: Wrong factures returned, filter ignored
    Evidence: .sisyphus/evidence/task-7-source-filter.txt
  ```

  **Commit**: YES (groups with 5, 6, 8)
  - Message: (grouped)
  - Files: facture.entity.ts, ligne-facture.entity.ts, facture.service.ts, facture.controller.ts
  - Pre-commit: `tsc --noEmit`

- [ ] 8. Phone normalizer utility

  **What to do**:
  - Créer `services/service-commercial/src/domain/cfast/utils/phone-normalizer.ts` :
    - `normalizePhone(phone: string): string` — Normalise un numéro de téléphone français
    - Supprimer espaces, tirets, points
    - Convertir +33 / 0033 → 0 (format national)
    - Retirer le préfixe +33 et remplacer par 0
    - Garder les 10 chiffres (format 0XXXXXXXXX)
    - `matchPhones(phone1: string, phone2: string): boolean` — Compare deux numéros normalisés

  **Must NOT do**:
  - Ne PAS gérer les numéros internationaux hors France (V1)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Utilitaire simple avec regex
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 5, 6, 7)
  - **Blocks**: Task 9
  - **Blocked By**: None

  **References**:
  - Pas de référence codebase spécifique — utilitaire standalone

  **Acceptance Criteria**:
  - [ ] `normalizePhone('+33 6 12 34 56 78')` retourne `'0612345678'`
  - [ ] `normalizePhone('0033612345678')` retourne `'0612345678'`
  - [ ] `normalizePhone('06.12.34.56.78')` retourne `'0612345678'`
  - [ ] `matchPhones('+33612345678', '0612345678')` retourne `true`

  **QA Scenarios:**
  ```
  Scenario: Phone normalization edge cases
    Tool: Bash (bun eval)
    Preconditions: phone-normalizer.ts created
    Steps:
      1. Import normalizePhone
      2. Test: normalizePhone('+33 6 12 34 56 78') === '0612345678'
      3. Test: normalizePhone('0033612345678') === '0612345678'
      4. Test: normalizePhone('06-12-34-56-78') === '0612345678'
      5. Test: normalizePhone('06.12.34.56.78') === '0612345678'
      6. Test: matchPhones('+33612345678', '0612345678') === true
      7. Test: matchPhones('0612345678', '0712345678') === false
    Expected Result: All assertions pass
    Failure Indicators: Any assertion fails
    Evidence: .sisyphus/evidence/task-8-phone-normalizer.txt
  ```

  **Commit**: YES (groups with 5, 6, 7)
  - Message: (grouped)
  - Files: phone-normalizer.ts
  - Pre-commit: `tsc --noEmit`

### Wave 3 — Import Orchestration + PDF Proxy + Module Wiring

- [ ] 9. CfastImportService (fetch → match → create)

  **What to do**:
  - Créer `services/service-commercial/src/domain/cfast/services/cfast-import.service.ts` :
    - Méthode `importInvoices(organisationId: string): Promise<ImportResult>` :
      1. Charger CfastConfig via repository
      2. Authentifier via CfastApiClient
      3. Fetch billing sessions depuis CFAST
      4. Pour chaque facture CFAST :
         a. Vérifier si `externalId` existe déjà en DB (idempotence) → skip si oui
         b. Extraire les infos client CFAST (nom, prénom, téléphone)
         c. Normaliser le téléphone via phoneNormalizer
         d. Chercher le client CRM via gRPC (SearchClients par nom+prénom+téléphone)
         e. Si match trouvé : créer facture via FactureService.Create gRPC avec :
            - sourceSystem='CFAST', externalId=cfast_invoice_id, importedAt=now()
            - clientBaseId=matched_client.id
            - statutId=UUID du statut 'IMPORTEE' (seed Task 3)
            - emissionFactureId=UUID de l'émission 'CFAST_IMPORT' (seed Task 3)
            - montantHT, montantTTC, dateEmission depuis CFAST
            - contratId=NULL, clientPartenaireId=NULL, adresseFacturationId=NULL (nullable)
            - numero=NULL (pas de numéro CRM pour import)
         f. Si pas de match : log warning, incrémenter compteur skipped
      5. Retourner ImportResult { importedCount, skippedCount, errors[] }
    - Gérer les erreurs partielles : continuer l'import même si une facture échoue
    - Mettre à jour config.lastSyncAt et config.syncError après import
  - Créer gRPC controller `infrastructure/grpc/subscriptions/cfast-import.controller.ts` :
    - @GrpcMethod ImportInvoices : appelle importInvoices(), retourne le résultat

  **Must NOT do**:
  - Ne PAS créer de NATS events/workers pour le traitement
  - Ne PAS bloquer indéfiniment — timeout après 5 min
  - Ne PAS créer de clients CRM automatiquement (skip si pas de match)

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: Orchestration complexe multi-service (CFAST API + client search gRPC + facture create gRPC + error handling)
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO (dépend de 5, 6, 7, 8)
  - **Parallel Group**: Wave 3 (with Tasks 10, 11)
  - **Blocks**: Task 15
  - **Blocked By**: Tasks 5 (config), 6 (API client), 7 (facture entity), 8 (phone normalizer), 3 (seed data)

  **References**:

  **Pattern References**:
  - `services/service-commercial/src/domain/woocommerce/services/woocommerce-sync.service.ts` — Pattern de sync avec reconciliation (search by email/phone before creating). Copier la logique de matching mais adapter pour nom+prénom+téléphone

  **API/Type References**:
  - `packages/proto/src/clients/clients.proto` — Vérifier le RPC SearchClients pour la recherche par nom/téléphone
  - `packages/proto/src/factures/factures.proto` — CreateFactureRequest avec les nouveaux champs

  **External References**:
  - https://developers.cfast.fr/docs/manage-a-bill-process-todo — Structure billing sessions et factures

  **WHY Each Reference Matters**:
  - woocommerce-sync.service : copier le pattern de reconciliation (check mapping → search client → create/link)
  - clients.proto : comprendre comment chercher un client par nom+téléphone via gRPC

  **Acceptance Criteria**:
  - [ ] ImportInvoices retourne un ImportResult avec compteurs corrects
  - [ ] Factures créées avec sourceSystem='CFAST' et externalId set
  - [ ] Re-import skip les factures déjà importées (idempotent)
  - [ ] Factures sans match client sont skipées (pas d'erreur)
  - [ ] config.lastSyncAt mis à jour après import

  **QA Scenarios:**
  ```
  Scenario: Full import flow (happy path)
    Tool: Bash (grpcurl)
    Preconditions: CFAST config created, test data in CFAST (or mock), matching client in CRM DB
    Steps:
      1. grpcurl CfastImportService/ImportInvoices with organisation_id
      2. Verify response has imported_count > 0, skipped_count >= 0
      3. grpcurl FactureService/List with source_system='CFAST'
      4. Verify returned factures have correct sourceSystem, externalId, montants
    Expected Result: Invoices imported and visible in facture list
    Failure Indicators: imported_count=0 when data exists, gRPC error
    Evidence: .sisyphus/evidence/task-9-import-flow.txt

  Scenario: Idempotent re-import
    Tool: Bash (grpcurl)
    Preconditions: Import already run once
    Steps:
      1. grpcurl CfastImportService/ImportInvoices again
      2. Verify imported_count=0 (all already exist)
      3. Count factures in DB — same as before
    Expected Result: Zero new imports, no duplicates
    Failure Indicators: imported_count > 0, duplicate factures in DB
    Evidence: .sisyphus/evidence/task-9-idempotent.txt

  Scenario: Unmatched client graceful skip
    Tool: Bash (grpcurl)
    Preconditions: CFAST has invoices for customers NOT in CRM
    Steps:
      1. Run import
      2. Check skipped_count > 0
      3. Verify NO facture created with NULL clientBaseId
    Expected Result: Unmatched invoices skipped, count reported
    Failure Indicators: Error thrown, or facture with NULL clientBaseId created
    Evidence: .sisyphus/evidence/task-9-unmatched-skip.txt
  ```

  **Commit**: YES (groups with 10, 11)
  - Message: `feat(cfast): add import orchestrator and PDF proxy`
  - Files: cfast-import.service.ts, cfast-import.controller.ts
  - Pre-commit: `tsc --noEmit`

- [ ] 10. PDF proxy HTTP endpoint

  **What to do**:
  - Créer `services/service-commercial/src/infrastructure/http/cfast/cfast-pdf.controller.ts` :
    - `GET /api/cfast/invoices/:invoiceId/pdf?organisationId=xxx`
    - Charger CfastConfig par organisationId
    - Authentifier via CfastApiClient
    - Télécharger le PDF depuis CFAST via `downloadInvoicePdf(token, invoiceId)`
    - Streamer le PDF en réponse avec headers `Content-Type: application/pdf`, `Content-Disposition: attachment`
    - Gérer 404 si facture non trouvée dans CFAST
    - Gérer 401 si credentials invalides

  **Must NOT do**:
  - Ne PAS exposer le token CFAST dans l'URL ou les headers de réponse
  - Ne PAS cacher le PDF en DB (fetch live à chaque téléchargement)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: HTTP controller avec streaming binaire, auth proxy
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Tasks 9, 11)
  - **Blocks**: Task 15
  - **Blocked By**: Task 6 (API client)

  **References**:

  **Pattern References**:
  - `services/service-commercial/src/infrastructure/http/woocommerce/webhook.controller.ts` — Pattern HTTP controller NestJS dans service-commercial (@Controller, @Post/@Get, @Req/@Res)

  **WHY Each Reference Matters**:
  - Copier le pattern Controller NestJS HTTP mais pour un GET qui streame un PDF (pas un webhook POST)

  **Acceptance Criteria**:
  - [ ] GET /api/cfast/invoices/:id/pdf retourne un PDF (Content-Type: application/pdf)
  - [ ] Sans credentials valides → 401
  - [ ] Facture inexistante → 404

  **QA Scenarios:**
  ```
  Scenario: PDF download succeeds
    Tool: Bash (curl)
    Preconditions: CFAST config active, valid invoice ID known
    Steps:
      1. curl -o invoice.pdf 'http://localhost:3053/api/cfast/invoices/{id}/pdf?organisationId={orgId}'
      2. Verify HTTP 200
      3. Verify Content-Type header is 'application/pdf'
      4. Verify file size > 0
    Expected Result: PDF file downloaded successfully
    Failure Indicators: Non-200 status, empty file, wrong content-type
    Evidence: .sisyphus/evidence/task-10-pdf-download.pdf

  Scenario: Invalid invoice ID returns 404
    Tool: Bash (curl)
    Preconditions: CFAST config active
    Steps:
      1. curl 'http://localhost:3053/api/cfast/invoices/nonexistent/pdf?organisationId={orgId}'
      2. Verify HTTP 404
    Expected Result: 404 Not Found
    Failure Indicators: 500 error, or 200 with empty body
    Evidence: .sisyphus/evidence/task-10-pdf-404.txt
  ```

  **Commit**: YES (groups with 9, 11)
  - Message: (grouped)
  - Files: cfast-pdf.controller.ts
  - Pre-commit: `tsc --noEmit`

- [ ] 11. cfast.module.ts + app.module.ts wiring

  **What to do**:
  - Créer `services/service-commercial/src/cfast.module.ts` :
    - TypeOrmModule.forFeature([CfastConfigEntity])
    - Controllers : CfastConfigController, CfastImportController, CfastPdfController
    - Providers : CfastConfigService (TypeORM), CfastApiClient, CfastImportService (useFactory), EncryptionService, PhoneNormalizerService
    - Exports : CfastConfigService, CfastApiClient
  - Modifier `services/service-commercial/src/app.module.ts` :
    - Ajouter `CfastModule` dans imports
  - Vérifier que gRPC options incluent le nouveau package 'cfast'

  **Must NOT do**:
  - Ne PAS créer de NATS module ou worker pour CFAST

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Wiring NestJS standard, pattern clair
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO (dépend de 5, 6, 9, 10)
  - **Parallel Group**: Wave 3 (après Tasks 5, 6, 9, 10)
  - **Blocks**: Task 12
  - **Blocked By**: Tasks 5, 6, 9, 10

  **References**:

  **Pattern References**:
  - `services/service-commercial/src/woocommerce.module.ts` — Pattern module exact (TypeOrmModule.forFeature, useFactory, exports)
  - `services/service-commercial/src/app.module.ts` — Ajouter CfastModule dans imports

  **WHY Each Reference Matters**:
  - woocommerce.module : copier la structure imports/controllers/providers/exports
  - app.module : ajouter CfastModule à côté de WooCommerceModule

  **Acceptance Criteria**:
  - [ ] `tsc --noEmit` passe sur service-commercial
  - [ ] Service démarre sans erreur d'injection de dépendances

  **QA Scenarios:**
  ```
  Scenario: Service starts with CFAST module
    Tool: Bash
    Preconditions: All backend tasks complete
    Steps:
      1. Start service-commercial (npm run start:dev or docker)
      2. Check logs for 'CfastModule' initialization
      3. Verify no DI errors in logs
      4. grpcurl list localhost:50053 → verify cfast services appear
    Expected Result: Service starts, CFAST gRPC services registered
    Failure Indicators: DI error, missing service, startup crash
    Evidence: .sisyphus/evidence/task-11-module-wiring.txt
  ```

  **Commit**: YES (groups with 9, 10)
  - Message: (grouped)
  - Files: cfast.module.ts, app.module.ts
  - Pre-commit: `tsc --noEmit`

### Wave 4 — Frontend (gRPC client, actions, UI components)

- [ ] 12. Frontend gRPC client + server actions CFAST

  **What to do**:
  - Créer `frontend/src/lib/grpc/clients/cfast.ts` :
    - Lazy-loaded singleton gRPC clients pour CfastConfigService et CfastImportService
    - Pattern : copier le pattern de `frontend/src/lib/grpc/clients/factures.ts`
  - Créer `frontend/src/actions/cfast.ts` :
    - `getCfastConfig(organisationId)` → ActionResult<CfastConfig>
    - `saveCfastConfig(input)` → ActionResult<CfastConfig> (Create ou Update)
    - `deleteCfastConfig(id)` → ActionResult<boolean>
    - `testCfastConnection(organisationId)` → ActionResult<TestResult>
    - `importCfastInvoices(organisationId)` → ActionResult<ImportResult>
    - Chaque action : try/catch, console.error, return { data, error }
    - `revalidatePath` après save/import

  **Must NOT do**:
  - Ne PAS exposer credentials dans les réponses frontend

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Pattern copier-coller depuis factures.ts, actions standard
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 4 (démarre Wave 4, débloque 13, 14, 15)
  - **Blocks**: Tasks 13, 14, 15
  - **Blocked By**: Tasks 1 (proto types), 11 (module wiring)

  **References**:

  **Pattern References**:
  - `frontend/src/lib/grpc/clients/factures.ts` — Pattern gRPC client lazy singleton
  - `frontend/src/actions/factures.ts` — Pattern server actions (try/catch, ActionResult<T>, revalidatePath)
  - `frontend/src/actions/woocommerce.ts` — Alternative référence pour actions d'intégration

  **WHY Each Reference Matters**:
  - factures.ts (client) : copier createChannel + createClient + promisify pattern
  - factures.ts (actions) : copier try/catch + ActionResult return type

  **Acceptance Criteria**:
  - [ ] `import { getCfastConfig } from '@/actions/cfast'` compile
  - [ ] Actions retournent ActionResult avec data ou error

  **QA Scenarios:**
  ```
  Scenario: Server action compilation
    Tool: Bash
    Preconditions: Proto generated, gRPC client created
    Steps:
      1. Run `tsc --noEmit` or `bun run build` on frontend
      2. Verify 0 errors related to cfast actions
    Expected Result: Clean compilation
    Failure Indicators: TypeScript errors in cfast.ts or cfast client
    Evidence: .sisyphus/evidence/task-12-actions-compile.txt
  ```

  **Commit**: YES (groups with 13, 14, 15)
  - Message: `feat(cfast): add frontend integration (config, import, filters)`
  - Files: cfast.ts (client), cfast.ts (actions)
  - Pre-commit: `bun run build`

- [ ] 13. Carte intégration CFAST + dialog config dans paramètres

  **What to do**:
  - Modifier `frontend/src/app/(main)/parametres/integrations/integrations-page-client.tsx` :
    - Ajouter une carte "CFAST" à côté des intégrations existantes
    - Badge : Connected (vert) / Disconnected (gris) selon config.active
    - Infos affichées : Base URL, dernière sync, nombre de factures importées
    - Bouton "Configurer" ouvre un Dialog
    - Bouton "Tester la connexion" avec feedback (loading/success/error)
  - Créer le Dialog de configuration CFAST :
    - Champs : Base URL, Client ID, Client Secret, Username, Password, Scopes
    - Validation Zod : tous requis, URL valide
    - Submit → saveCfastConfig() server action
    - Toast success/error via Sonner
  - Ajouter le logo CFAST (ou icône générique télécom)

  **Must NOT do**:
  - Ne PAS afficher les credentials en clair dans l'UI (masquer passwords)
  - Ne PAS créer une page séparée pour CFAST (carte dans la page intégrations existante)

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: UI component avec dialog, formulaire, badges, toast
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4 (with Tasks 14, 15)
  - **Blocks**: F3
  - **Blocked By**: Tasks 5 (config gRPC), 12 (actions)

  **References**:

  **Pattern References**:
  - `frontend/src/app/(main)/parametres/integrations/integrations-page-client.tsx` — Fichier exact à modifier — copier le pattern de la carte WooCommerce (Card + Badge + Dialog)
  - `frontend/src/components/create-facture-dialog.tsx` — Pattern Dialog avec React Hook Form + Zod validation

  **WHY Each Reference Matters**:
  - integrations-page-client : comprendre la structure des cartes existantes pour ajouter CFAST de manière cohérente
  - create-facture-dialog : copier le pattern Form + Dialog + Submit + Toast

  **Acceptance Criteria**:
  - [ ] Carte CFAST visible dans la page intégrations
  - [ ] Badge affiche Connected/Disconnected correctement
  - [ ] Dialog s'ouvre, formulaire se soumet, toast s'affiche
  - [ ] Test connexion affiche le résultat

  **QA Scenarios:**
  ```
  Scenario: CFAST integration card and config dialog
    Tool: Playwright
    Preconditions: Frontend running, user logged in
    Steps:
      1. Navigate to /parametres/integrations
      2. Verify card with text 'CFAST' is visible
      3. Verify badge shows 'Disconnected' (no config yet)
      4. Click 'Configurer' button on CFAST card
      5. Verify dialog opens with form fields (Base URL, Client ID, etc.)
      6. Fill form with test values
      7. Click submit
      8. Verify toast notification appears
      9. Verify badge changes to 'Connected'
    Expected Result: Full config flow works end-to-end
    Failure Indicators: Card missing, dialog doesn't open, submit fails
    Evidence: .sisyphus/evidence/task-13-cfast-card.png

  Scenario: Password fields are masked
    Tool: Playwright
    Preconditions: CFAST dialog open
    Steps:
      1. Check input type of 'Client Secret' field → should be 'password'
      2. Check input type of 'Password' field → should be 'password'
    Expected Result: Sensitive fields use type='password'
    Failure Indicators: Plaintext password visible
    Evidence: .sisyphus/evidence/task-13-password-masked.png
  ```

  **Commit**: YES (groups with 12, 14, 15)
  - Message: (grouped)
  - Files: integrations-page-client.tsx (modified)
  - Pre-commit: `bun run build`

- [ ] 14. Filtre source + badge CFAST dans liste factures

  **What to do**:
  - Modifier la page facturation frontend (trouver dans `frontend/src/app/(main)/`) :
    - Ajouter un filtre/dropdown "Source" : Toutes / Interne / CFAST
    - Passer `source_system` au server action `getFacturesByOrganisation`
    - Modifier le server action pour passer le filtre au gRPC
  - Ajouter un badge "CFAST" sur les factures importées :
    - Si `sourceSystem === 'CFAST'` → afficher Badge variant="outline" avec texte "CFAST"
    - Dans la colonne source ou à côté du numéro de facture
  - Afficher `importedAt` dans le détail de la facture

  **Must NOT do**:
  - Ne PAS modifier l'affichage des factures internes
  - Ne PAS ajouter de boutons d'édition sur les factures CFAST (read-only)

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: UI filter, badge, data table modification
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4 (with Tasks 13, 15)
  - **Blocks**: F3
  - **Blocked By**: Tasks 7 (facture entity), 12 (actions)

  **References**:

  **Pattern References**:
  - `frontend/src/actions/factures.ts` — Server action à modifier pour passer source_system filter
  - `frontend/src/components/data-table.tsx` — Pattern DataTable pour ajouter colonne/filtre

  **WHY Each Reference Matters**:
  - factures.ts actions : ajouter le paramètre source_system dans l'appel gRPC
  - data-table : comprendre comment ajouter un filtre dropdown

  **Acceptance Criteria**:
  - [ ] Filtre source affiché dans la page factures
  - [ ] Filtre 'CFAST' ne montre que les factures CFAST
  - [ ] Badge 'CFAST' visible sur les factures importées
  - [ ] Factures internes non impactées

  **QA Scenarios:**
  ```
  Scenario: Source filter and badge display
    Tool: Playwright
    Preconditions: Mix of CFAST and internal invoices in DB
    Steps:
      1. Navigate to facturation page
      2. Verify all invoices shown by default
      3. Select 'CFAST' in source filter
      4. Verify only invoices with CFAST badge are shown
      5. Select 'Interne' filter
      6. Verify no CFAST badges visible
      7. Select 'Toutes'
      8. Verify both types visible
    Expected Result: Filter correctly toggles, badges display properly
    Failure Indicators: Filter doesn't work, badges missing, wrong invoices shown
    Evidence: .sisyphus/evidence/task-14-source-filter.png
  ```

  **Commit**: YES (groups with 12, 13, 15)
  - Message: (grouped)
  - Files: facturation page, factures actions
  - Pre-commit: `bun run build`

- [ ] 15. Bouton import/refresh + résultat + téléchargement PDF

  **What to do**:
  - Ajouter un bouton "Importer depuis CFAST" dans la page factures (ou dans la carte CFAST des intégrations) :
    - Bouton avec icône refresh/download
    - Au clic : appeler `importCfastInvoices(organisationId)`
    - Afficher loading state pendant l'import
    - Afficher résultat : "X factures importées, Y ignorées" via toast ou alert
    - Si erreurs : afficher la liste des erreurs
    - Revalidate la liste des factures après import
  - Ajouter bouton "Télécharger PDF" dans le détail d'une facture CFAST :
    - Visible seulement si sourceSystem === 'CFAST' et externalId présent
    - Au clic : `window.open('/api/cfast/invoices/{externalId}/pdf?organisationId=xxx')`
    - Ou fetch via API et déclencher le download côté client

  **Must NOT do**:
  - Ne PAS afficher le bouton import si aucune config CFAST active
  - Ne PAS permettre l'import simultané (désactiver bouton pendant loading)

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: Boutons interactifs, loading states, toast résultats, PDF download
  - **Skills**: [`playwright`]
    - playwright: Pour QA du flow complet

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4 (with Tasks 13, 14)
  - **Blocks**: F3
  - **Blocked By**: Tasks 9 (import service), 10 (PDF proxy), 12 (actions)

  **References**:

  **Pattern References**:
  - `frontend/src/app/(main)/parametres/integrations/integrations-page-client.tsx` — Pattern bouton avec loading state + toast result

  **WHY Each Reference Matters**:
  - integrations-page-client : copier le pattern handleTest() pour le bouton import (setLoading → call → toast → refresh)

  **Acceptance Criteria**:
  - [ ] Bouton 'Importer depuis CFAST' visible et fonctionnel
  - [ ] Loading state pendant import
  - [ ] Résultat affiché (X importées, Y ignorées)
  - [ ] Liste factures se rafraîchit après import
  - [ ] Bouton PDF visible uniquement sur factures CFAST
  - [ ] PDF se télécharge correctement

  **QA Scenarios:**
  ```
  Scenario: Import flow from UI
    Tool: Playwright
    Preconditions: CFAST configured, invoices available in CFAST
    Steps:
      1. Navigate to facturation page
      2. Click 'Importer depuis CFAST' button
      3. Verify button shows loading spinner
      4. Wait for toast notification
      5. Verify toast shows 'X factures importées'
      6. Verify new invoices appear in the list with CFAST badge
    Expected Result: Import succeeds, UI updates, toast confirms
    Failure Indicators: Button doesn't respond, no toast, invoices don't appear
    Evidence: .sisyphus/evidence/task-15-import-ui.png

  Scenario: PDF download from invoice detail
    Tool: Playwright
    Preconditions: CFAST invoice imported, detail page accessible
    Steps:
      1. Click on a CFAST invoice in the list
      2. Verify 'Télécharger PDF' button is visible
      3. Click the PDF button
      4. Verify download starts (check download event or new tab)
    Expected Result: PDF file downloads
    Failure Indicators: Button missing, download fails, wrong file
    Evidence: .sisyphus/evidence/task-15-pdf-download.png

  Scenario: Import button disabled without config
    Tool: Playwright
    Preconditions: No CFAST config for the organisation
    Steps:
      1. Navigate to facturation page
      2. Verify import button is hidden or disabled
    Expected Result: Button not clickable without active CFAST config
    Failure Indicators: Button clickable, error on click
    Evidence: .sisyphus/evidence/task-15-no-config.png
  ```

  **Commit**: YES (groups with 12, 13, 14)
  - Message: (grouped)
  - Files: facturation page components
  - Pre-commit: `bun run build`
## Final Verification Wave

- [ ] F1. **Plan Compliance Audit** — `oracle`
  Read the plan end-to-end. For each "Must Have": verify implementation exists (read file, grpcurl endpoint, run command). For each "Must NOT Have": search codebase for forbidden patterns (webhook event entity, NATS workers, hash of credentials, cron scheduler) — reject with file:line if found. Check evidence files exist in .sisyphus/evidence/. Compare deliverables against plan.
  Output: `Must Have [N/N] | Must NOT Have [N/N] | Tasks [N/N] | VERDICT: APPROVE/REJECT`

- [ ] F2. **Code Quality Review** — `unspecified-high`
  Run `tsc --noEmit` on service-commercial + service-finance. Run `bun run proto:generate`. Review all changed files for: `as any`, `@ts-ignore`, empty catches, console.log in prod, commented-out code, unused imports. Check AI slop: excessive comments, over-abstraction, generic names (data/result/item/temp). Verify encryption is AES-256-GCM not MD5/SHA.
  Output: `Build [PASS/FAIL] | Proto [PASS/FAIL] | Files [N clean/N issues] | VERDICT`

- [ ] F3. **Real Manual QA** — `unspecified-high` (+ `playwright` skill)
  Start from clean state. Full flow: 1) Go to integrations page → configure CFAST → test connection. 2) Trigger import → verify factures appear in list with CFAST badge. 3) Click detail → verify data. 4) Download PDF → verify file. 5) Re-import → verify idempotency (0 new). 6) Test with invalid credentials → verify error handling. Save all screenshots/evidence to `.sisyphus/evidence/final-qa/`.
  Output: `Scenarios [N/N pass] | Integration [N/N] | Edge Cases [N tested] | VERDICT`

- [ ] F4. **Scope Fidelity Check** — `deep`
  For each task: read "What to do", read actual diff. Verify 1:1 — everything in spec was built, nothing beyond spec was built. Check "Must NOT do" compliance (no webhooks, no NATS, no cron, no mapping entity). Detect cross-task contamination. Flag unaccounted changes.
  Output: `Tasks [N/N compliant] | Contamination [CLEAN/N issues] | Unaccounted [CLEAN/N files] | VERDICT`

---

## Commit Strategy

- **After Wave 1**: `feat(cfast): add proto definitions and facture schema migration`
  - Files: `packages/proto/src/cfast/cfast.proto`, `packages/proto/src/factures/factures.proto`, migration file, seed file, encryption extraction
  - Pre-commit: `bun run proto:generate`

- **After Wave 2**: `feat(cfast): add config entity, API client, and phone normalizer`
  - Files: entities, repositories, controllers, CfastApiClient, phone normalizer, updated FactureEntity
  - Pre-commit: `tsc --noEmit` on service-commercial + service-finance

- **After Wave 3**: `feat(cfast): add import orchestrator and PDF proxy`
  - Files: CfastImportService, PDF controller, cfast.module.ts
  - Pre-commit: `tsc --noEmit` on service-commercial

- **After Wave 4**: `feat(cfast): add frontend integration (config, import, filters)`
  - Files: actions, gRPC client, integration card, facture filters, import button
  - Pre-commit: `bun run build` on frontend

---

## Success Criteria

### Verification Commands
```bash
# Proto generation
bun run proto:generate  # Expected: 0 errors

# Migration
docker exec service-finance-db psql -U postgres -d finance_db -c "SELECT column_name FROM information_schema.columns WHERE table_name='facture' AND column_name IN ('source_system','external_id','imported_at')"
# Expected: 3 rows

# TypeScript compilation
cd services/service-commercial && tsc --noEmit  # Expected: 0 errors
cd services/service-finance && tsc --noEmit     # Expected: 0 errors

# Config CRUD
grpcurl -plaintext localhost:50053 cfast.CfastConfigService/Create
# Expected: returns config with id

# Import
grpcurl -plaintext localhost:50053 cfast.CfastImportService/ImportInvoices
# Expected: returns {imported: N, skipped: N, errors: []}

# Frontend build
cd frontend && bun run build  # Expected: 0 errors
```

### Final Checklist
- [ ] All "Must Have" present
- [ ] All "Must NOT Have" absent
- [ ] Config CFAST CRUD fonctionne
- [ ] Import factures retourne résultat correct
- [ ] Factures CFAST visibles dans UI avec badge
- [ ] PDF téléchargeable
- [ ] Re-import idempotent (0 doublons)
- [ ] Credentials chiffrées en DB
- [ ] Phone normalization active
- [ ] Rate limiting respecté (2 req/sec)
