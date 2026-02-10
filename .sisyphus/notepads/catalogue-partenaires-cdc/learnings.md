# Learnings — Catalogue Partenaires CDC

## Conventions

### Architecture
- Microservices NestJS DDD: domain/application/infrastructure/interfaces
- Proto definitions: packages/proto/
- TypeORM migrations: services/*/src/migrations/
- Snake_case naming strategy pour DB

### Patterns
- Repository pattern: interface dans domain/, implémentation dans infrastructure/
- gRPC controllers dans interfaces/grpc/controllers/
- DTOs dans application/dtos/
- Event handlers NATS dans infrastructure/messaging/nats/handlers/

### Guardrails
- ❌ NE PAS modifier PartenaireMarqueBlancheEntity (white-label ≠ commercial partner)
- ❌ NE PAS créer de nouveau microservice
- ❌ Additive only — ne pas casser l'existant
- ❌ Pas de portail self-service (hors scope)

## Session Start
- Date: 2026-02-07T17:42:04.872Z
- Session: ses_3c6f53d88ffenbu02mVDr00FeZ
- Plan: catalogue-partenaires-cdc
- Status: Starting Wave 0 (Tasks 1-3 in parallel)

## Audit Trail Global Implementation (Wave 0 - Task 1)

### Completed
- ✅ Created migrations for both services adding `created_by` and `modified_by` columns
- ✅ Updated all 14 entities in service-commercial (produit, gamme, grille_tarifaire, prix_produit, produit_versions, produit_documents, produit_publications, modeledistributions, apporteurs, baremes_commission, palier_commission, contrat, ligne_contrat)
- ✅ Updated all 6 entities in service-core (organisations, societes, partenairemarqueblanches, clientbases, cliententreprises, clientpartenaires)
- ✅ Created AuditSubscriber EntitySubscriber for both services
- ✅ Registered AuditSubscribers in app.module.ts for both services

### Key Patterns
- **Naming**: Used `created_by` and `modified_by` (snake_case) to match DB naming strategy
- **Column Type**: VARCHAR(255) NULL for both columns (matches existing audit patterns like creePar/modifiePar)
- **Subscriber Pattern**: @EventSubscriber() + EntitySubscriberInterface with beforeInsert/beforeUpdate hooks
- **Registration**: Subscribers registered as providers in app.module.ts (auto-registered via DataSource)

### Migration Strategy
- Timestamp: 1739000000000 (Feb 2026)
- Additive only: ALTER TABLE ADD COLUMN (no breaking changes)
- Reversible: DOWN migrations drop columns in reverse order

### AuditSubscriber Implementation Notes
- Placeholder for getUserId() from gRPC context (TODO: integrate with AsyncLocalStorage)
- Intercepts INSERT: sets both created_by and modified_by
- Intercepts UPDATE: updates modified_by only
- Gracefully handles entities without audit columns (checks 'in' operator)

### Next Steps (Future Waves)
1. Integrate getUserId() with gRPC metadata context (AuthInterceptor)
2. Add AsyncLocalStorage for request-scoped user context
3. Test migrations with actual database
4. Add audit logging for compliance tracking
5. Consider audit event publishing to NATS for audit trail service


## Wave 0 - Task: Enrichir GammeEntity avec hiérarchie parent-enfant

### Implémentation complétée

#### 1. **Entité GammeEntity enrichie**
- Ajout de `parent_id` (UUID NULL) pour la relation parent
- Ajout de `niveau` (INT DEFAULT 0) pour la profondeur hiérarchique
- Ajout de `type_gamme` (ENUM: RISQUE, FAMILLE, SOUS_FAMILLE)
- Relations self-referencing:
  - `@ManyToOne(() => GammeEntity)` parent (nullable, onDelete: SET NULL)
  - `@OneToMany(() => GammeEntity)` children

#### 2. **Enum TypeGamme**
- Créé dans `domain/products/enums/type-gamme.enum.ts`
- Valeurs: RISQUE (0), FAMILLE (1), SOUS_FAMILLE (2)
- Utilisé dans l'entité et le proto

#### 3. **Migration TypeORM**
- Fichier: `1739010000000-AddHierarchyToGamme.ts`
- Ajoute les 3 colonnes avec index sur parent_id
- Migration de données: gammes existantes → niveau=1, type_gamme='FAMILLE'
- Rollback: supprime les colonnes et l'index

#### 4. **Proto gRPC enrichi**
- Enum TypeGamme ajouté au proto
- Message Gamme: parent_id, niveau, type_gamme
- Nouveaux messages: GammeNode (structure récursive), GetGammeTreeRequest, GetGammeTreeResponse
- Endpoint GetTree ajouté au service GammeService

#### 5. **Service GammeService**
- Méthode `hasCycle()`: détecte les cycles dans la hiérarchie
- Méthode `getDepth()`: calcule la profondeur depuis la racine
- Méthode `buildTree()`: construit l'arborescence récursive
- Validation: max 3 niveaux, pas de cycles

#### 6. **Contrôleur gRPC GammeController**
- Implémente les 6 RPC: Create, Update, Get, List, Delete, GetTree
- Validation des cycles et profondeur lors de l'update
- Mapping proto/entité avec gestion des relations

### Patterns appliqués

1. **Self-referencing relations**: Parent ManyToOne, Children OneToMany
2. **Cycle detection**: Parcours en profondeur avec Set de visited nodes
3. **Depth validation**: Comptage des niveaux depuis la racine
4. **Recursive tree building**: Construction de l'arborescence avec appels récursifs
5. **Nullable parent**: Permet les racines (parent_id IS NULL)

### Fichiers créés/modifiés

**Créés:**
- `src/domain/products/enums/type-gamme.enum.ts`
- `src/domain/products/enums/index.ts`
- `src/infrastructure/persistence/typeorm/repositories/products/gamme.service.ts`
- `src/infrastructure/grpc/products/gamme.controller.ts`
- `src/migrations/1739010000000-AddHierarchyToGamme.ts`

**Modifiés:**
- `src/domain/products/entities/gamme.entity.ts` (enrichie)
- `src/domain/products/index.ts` (export enums)
- `src/infrastructure/persistence/typeorm/repositories/products/index.ts` (export GammeService)
- `src/infrastructure/grpc/products/index.ts` (export GammeController)
- `src/products.module.ts` (wire GammeService + GammeController)
- `packages/proto/src/products/products.proto` (enrichi)

### Validation

- Build: ✅ Compile sans erreurs (erreurs subscriptions pré-existantes ignorées)
- Proto generation: ✅ GetGammeTree, GammeNode, TypeGamme générés
- Imports: ✅ Tous les chemins corrigés et index créés
- Types: ✅ Tous les types TypeScript validés

### Notes d'implémentation

1. **Enum TypeGamme**: Utilisé dans TypeORM avec `type: 'enum'` et dans proto avec `enum TypeGamme`
2. **Nullable parent**: `onDelete: 'SET NULL'` pour éviter les suppressions en cascade
3. **Cycle detection**: Implémentée avec Set pour O(n) complexity
4. **Depth limit**: Max 3 niveaux (0=Risque, 1=Famille, 2=Sous-famille)
5. **Tree building**: Récursif, charge les enfants pour chaque nœud

### Prochaines étapes (Wave 1-5)

- Tester la migration en environnement de développement
- Implémenter les endpoints de gestion (Create avec parent_id, Update hiérarchie)
- Ajouter les validations métier (ex: Risque ne peut pas avoir de parent)
- Tester GetGammeTree avec grpcurl
- Mettre à jour le frontend pour afficher l'arborescence (Wave 5)


## Wave 0 - Task: Enrichir SocieteEntity — Logo, devise, paramètres comptables

### Implémentation complétée

#### 1. **SocieteEntity enrichie avec 10 nouveaux champs**
- `logo_url` (TEXT NULL) — URL du logo de la société
- `devise` (VARCHAR(3) DEFAULT 'EUR') — Devise de tenue de compte
- `ics` (VARCHAR(50) NULL) — Identifiant Créancier SEPA
- `journal_vente` (VARCHAR(20) NULL) — Code du journal de vente comptable
- `compte_produit_defaut` (VARCHAR(20) NULL) — Compte produit par défaut
- `plan_comptable` (JSONB NULL) — Plan comptable structuré (JSON)
- `adresse_siege` (TEXT NULL) — Adresse du siège social
- `telephone` (VARCHAR(50) NULL) — Téléphone de contact
- `email_contact` (VARCHAR(255) NULL) — Email de contact
- `parametres_fiscaux` (JSONB NULL) — Paramètres fiscaux (JSON)

#### 2. **Migration TypeORM créée**
- Fichier: `1770487050000-EnrichSocieteEntity.ts`
- Ajoute les 10 colonnes avec types appropriés
- DEFAULT 'EUR' pour devise
- JSONB pour plan_comptable et parametres_fiscaux
- Rollback: supprime les colonnes en ordre inverse

#### 3. **Proto gRPC enrichi**
- Message `Societe`: 10 nouveaux champs (fields 8-17)
- Message `CreateSocieteRequest`: 10 nouveaux champs (fields 5-14)
- Message `UpdateSocieteRequest`: 10 nouveaux champs (fields 5-14)
- Tous les champs en type `string` (proto3 convention)

#### 4. **SocieteController mis à jour**
- Fonction `societeToProto()`: mappe les 10 nouveaux champs
  - JSONB fields sérialisés en JSON string pour proto
  - Null values convertis en empty string
  - devise par défaut 'EUR'
- Méthode `create()`: accepte et parse les 10 nouveaux champs
  - JSON parsing pour plan_comptable et parametres_fiscaux
  - Fallback à null si JSON invalide
- Méthode `update()`: accepte et parse les 10 nouveaux champs

#### 5. **SocieteService mis à jour**
- Méthode `create()`: signature étendue avec 10 paramètres optionnels
  - Tous les champs nullable sauf devise (DEFAULT 'EUR')
  - Utilise ?? null pour les valeurs non fournies
- Méthode `update()`: signature étendue avec 10 paramètres optionnels
  - Conditional updates: if (input.field !== undefined)
  - Préserve les valeurs existantes si non fournies

#### 6. **Datasource.ts créé**
- Fichier: `services/service-core/src/datasource.ts`
- Configuration TypeORM pour migrations CLI
- Database: core_db (par défaut)
- Naming strategy: SnakeNamingStrategy
- Migrations path: src/migrations/*

### Patterns appliqués

1. **JSONB Handling**: Sérialisation JSON en proto (string), désérialisation en controller
2. **Default Values**: devise DEFAULT 'EUR' au niveau DB et application
3. **Nullable Fields**: Tous les nouveaux champs nullable sauf devise
4. **Proto Field Numbering**: Séquentiel (8-17) après les champs existants (1-7)
5. **Snake_case DB / camelCase TS**: Naming strategy appliquée automatiquement

### Fichiers créés/modifiés

**Créés:**
- `services/service-core/src/migrations/1770487050000-EnrichSocieteEntity.ts`
- `services/service-core/src/datasource.ts`

**Modifiés:**
- `services/service-core/src/domain/organisations/entities/societe.entity.ts` (10 colonnes)
- `services/service-core/src/infrastructure/grpc/organisations/societe.controller.ts` (mapping + parsing)
- `services/service-core/src/infrastructure/persistence/typeorm/repositories/organisations/societe.service.ts` (create/update)
- `packages/proto/src/organisations/organisations.proto` (Societe, CreateSocieteRequest, UpdateSocieteRequest)

### Validation

- ✅ Entity: 10 nouveaux champs avec types corrects
- ✅ Migration: Créée avec up/down, DEFAULT 'EUR', JSONB support
- ✅ Proto: Généré avec tous les champs (buf generate)
- ✅ Controller: Compile sans erreurs (LSP diagnostics clean)
- ✅ Service: Compile sans erreurs (LSP diagnostics clean)
- ✅ Build: `bun run build` réussit
- ✅ Proto generation: `bun run gen:all` réussit (warnings pré-existants ignorés)

### Notes d'implémentation

1. **JSONB Serialization**: Proto3 n'a pas de type JSONB natif → utiliser string + JSON.stringify/parse
2. **Default Values**: devise DEFAULT 'EUR' au niveau DB ET application (fallback)
3. **Nullable Handling**: Tous les champs nullable sauf devise
4. **Proto Field Numbers**: Commencer à 8 (après les 7 champs existants)
5. **Datasource.ts**: Nécessaire pour les migrations CLI (typeorm migration:run)

### Prochaines étapes (Wave 1-5)

- Tester la migration avec une base de données réelle
- Implémenter les validations métier (ex: devise ISO 4217)
- Ajouter les endpoints de gestion (Create/Update avec nouveaux champs)
- Tester gRPC Create avec grpcurl
- Mettre à jour le frontend pour afficher les nouveaux champs (Wave 5)


## Wave 1 - Task: Create PartenaireCommercialEntity

### Implémentation complétée

#### 1. **PartenaireCommercialEntity (25+ fields)**
- Table: `partenaire_commercial`
- ENUMs: `TypePartenaire` (ASSUREUR, FAI, ENERGIE, OTT, MARKETPLACE, COURTIER, FOURNISSEUR, AUTRE)
- ENUMs: `StatutPartenaire` (PROSPECT, EN_COURS_INTEGRATION, ACTIF, SUSPENDU, RESILIE)
- Identification: denomination, siren, siret, numeroTva
- JSONB fields: adresses, contacts, apiCredentials (TODO: pgcrypto), metadata
- Bancaire: iban, bic
- Extranet/API: codeExtranet, apiBaseUrl, apiCredentials
- SLA: slaDelaiTraitementHeures, slaTauxDisponibilite, slaContactUrgence
- Contrat: statut, dateDebutContrat, dateFinContrat
- Audit: createdBy, modifiedBy, createdAt, updatedAt
- Indexes: organisationId, (organisationId + type), (organisationId + statut)
- Unique: (organisationId + denomination)

#### 2. **PartenaireCommercialSocieteEntity (many-to-many join)**
- Table: `partenaire_commercial_societes`
- Fields: partenaireId, societeId, actif, dateActivation, dateDesactivation
- Unique: (partenaireId + societeId)
- FK: partenaire_id → partenaire_commercial(id) ON DELETE CASCADE
- ManyToOne relation to PartenaireCommercialEntity

#### 3. **IPartenaireCommercialRepository interface**
- CRUD: findById, findByOrganisation (with filters/pagination), save, update, delete
- Société activation: findSocietesByPartenaire, activerSociete, desactiverSociete

#### 4. **PartenaireCommercialService (infrastructure)**
- Implements IPartenaireCommercialRepository
- Injects both PartenaireCommercialEntity and PartenaireCommercialSocieteEntity repositories
- Uniqueness check on (organisationId + denomination) for create and update
- Pagination pattern matching existing services (page/limit/totalPages)
- activerSociete: upsert pattern (create or reactivate)
- desactiverSociete: sets actif=false + dateDesactivation

#### 5. **Migration 1739020000000-CreatePartenaireCommercial**
- Creates ENUM types: type_partenaire_enum, statut_partenaire_enum
- Creates partenaire_commercial table with all fields
- Creates partenaire_commercial_societes join table
- Indexes: organisation_id, org+type, org+statut, societe_id
- Reversible: drops tables then ENUMs in down()
- Comment on api_credentials column for future encryption

#### 6. **Module registration**
- Both entities registered in TypeOrmModule.forFeature()
- PartenaireCommercialService registered as provider and exported

### Patterns appliqués
1. **Enum in entity file**: TypePartenaire and StatutPartenaire defined in same file as entity
2. **JSONB for flexible structures**: adresses, contacts, apiCredentials, metadata
3. **Join entity (not @ManyToMany)**: Explicit join table with extra fields (actif, dates)
4. **Upsert for activation**: activerSociete reactivates existing or creates new
5. **Pre-existing build error**: client-external-mapping.entity.ts TS2769 (not related)

### Validation
- ✅ `tsc --noEmit`: Clean (0 errors)
- ✅ `nest build`: Only pre-existing error in client-external-mapping.entity.ts (unrelated)
- ✅ All index files updated (entities, repositories, infrastructure services)
- ✅ commercial.module.ts: entities + service registered and exported

### Fichiers créés
- `src/domain/commercial/entities/partenaire-commercial.entity.ts`
- `src/domain/commercial/entities/partenaire-commercial-societe.entity.ts`
- `src/domain/commercial/repositories/IPartenaireCommercialRepository.ts`
- `src/infrastructure/persistence/typeorm/repositories/commercial/partenaire-commercial.service.ts`
- `src/migrations/1739020000000-CreatePartenaireCommercial.ts`

### Fichiers modifiés
- `src/domain/commercial/entities/index.ts`
- `src/domain/commercial/repositories/index.ts`
- `src/infrastructure/persistence/typeorm/repositories/commercial/index.ts`
- `src/commercial.module.ts`


## Wave 1 - Task: Enrich ProduitEntity (11 new fields)

### Implémentation complétée

#### 1. **TypeTarification Enum**
- Créé dans `domain/products/enums/type-tarification.enum.ts`
- 7 valeurs: FIXE, PALIER, RECURRENT, USAGE, BUNDLE, NEGOCIE, INDEXE
- Exporté via `enums/index.ts`
- Pattern identique à TypeGamme

#### 2. **ProduitEntity enrichie (11 colonnes + 2 relations)**

**Termes contractuels:**
- `duree_engagement_mois` (INT NULL) — durée d'engagement en mois
- `frequence_renouvellement` (VARCHAR(50) NULL) — fréquence de renouvellement
- `conditions_resiliation` (TEXT NULL) — conditions de résiliation
- `unite_vente` (VARCHAR(50) DEFAULT 'UNITE') — unité de vente

**Mapping comptable:**
- `code_comptable` (VARCHAR(20) NULL) — code comptable
- `compte_produit` (VARCHAR(20) NULL) — compte produit comptable
- `journal_vente` (VARCHAR(20) NULL) — journal de vente

**FK partenaire & distribution:**
- `partenaire_commercial_id` (UUID NULL FK → partenaire_commercial) — avec index
- `modele_distribution_id` (UUID NULL FK → modeledistributions) — avec index
- ManyToOne relations avec onDelete: SET NULL

**Configuration tarification:**
- `type_tarification` (ENUM DEFAULT 'FIXE') — modèle tarifaire
- `config_tarification` (JSONB NULL) — configuration flexible du modèle

#### 3. **Migration 1739030000000-EnrichProduitEntity**
- Crée le type ENUM `type_tarification_enum`
- Ajoute les 11 colonnes par groupes logiques
- Crée les indexes sur les FK
- Ajoute les contraintes FK avec ON DELETE SET NULL
- Rollback complet: drop FK → drop indexes → drop columns → drop enum

#### 4. **Proto products.proto enrichi**
- Enum `TypeTarification` ajouté (8 valeurs dont UNSPECIFIED)
- Message Produit: 11 nouveaux fields (24-34)
- `optional int32` pour duree_engagement_mois (nullable)
- `string` pour les champs texte (proto3 convention)
- `TypeTarification` pour type_tarification

### Patterns appliqués
1. **Enum séparé**: TypeTarification dans fichier dédié (réutilisé par Task 8)
2. **FK avec index**: Index sur les colonnes FK pour perf des JOINs
3. **JSONB pour config flexible**: configTarification = configuration du moteur tarifaire
4. **Proto field numbering**: Séquentiel après les champs existants (24-34)
5. **Defaults applicatifs**: uniteVente='UNITE', typeTarification='FIXE'

### Validation
- ✅ Build: Compile (erreurs pré-existantes woocommerce/subscriptions uniquement)
- ✅ Proto: `buf generate` réussit, TypeTarification généré correctement
- ✅ Aucune modification des champs existants
- ✅ FK vers PartenaireCommercialEntity (Task 4) et ModeleDistributionEntity

### Fichiers créés
- `src/domain/products/enums/type-tarification.enum.ts`
- `src/migrations/1739030000000-EnrichProduitEntity.ts`

### Fichiers modifiés
- `src/domain/products/entities/produit.entity.ts` (11 colonnes + 2 relations)
- `src/domain/products/enums/index.ts` (export TypeTarification)
- `packages/proto/src/products/products.proto` (enum + fields 24-34)



## Wave 1 - Task: Enrich ModeleDistributionEntity (9 new fields)

### Implémentation complétée

#### 1. **ModeleDistributionEntity enrichie avec 9 nouveaux champs**
- `organisationId` (UUID NOT NULL) — Lien vers l'organisation
- `partenaireCommercialId` (UUID NULL FK) — Lien vers partenaire commercial
- `societeId` (UUID NULL FK) — Lien vers société
- `canalVente` (VARCHAR(50) NULL) — Canal de vente
- `tauxPartageRevenu` (DECIMAL 5,2 NULL) — Taux de partage du revenu (%)
- `tauxCommissionPartenaire` (DECIMAL 5,2 NULL) — Taux de commission partenaire (%)
- `reglesPartage` (JSONB NULL) — Règles de partage structurées (JSON)
- `actif` (BOOLEAN DEFAULT true) — Activation du modèle
- `dateDebut` (DATE NULL) — Date de début de validité
- `dateFin` (DATE NULL) — Date de fin de validité

#### 2. **Migration TypeORM créée**
- Fichier: `1739050000000-EnrichModeleDistribution.ts`
- Ajoute les 10 colonnes (9 + organisationId)
- Crée les indexes sur organisationId, partenaireCommercialId, societeId
- FK vers partenaire_commercial et societes avec ON DELETE SET NULL
- Rollback: supprime les FK → indexes → colonnes en ordre inverse

#### 3. **Indexes créés**
- `idx_modele_distribution_organisation_id` sur organisationId
- `idx_modele_distribution_partenaire_id` sur partenaireCommercialId
- `idx_modele_distribution_societe_id` sur societeId

#### 4. **Contraintes FK**
- `fk_modele_distribution_partenaire_commercial` → partenaire_commercial(id) ON DELETE SET NULL
- `fk_modele_distribution_societe` → societes(id) ON DELETE SET NULL

### Patterns appliqués

1. **Decimal pour pourcentages**: DECIMAL(5,2) pour tauxPartageRevenu et tauxCommissionPartenaire (0-999.99%)
2. **JSONB pour règles flexibles**: reglesPartage = structure JSON pour règles métier complexes
3. **Activation avec dates**: actif + dateDebut/dateFin pour gestion temporelle
4. **FK nullable**: partenaireCommercialId et societeId nullable pour flexibilité
5. **organisationId NOT NULL**: Lien obligatoire vers l'organisation (multi-tenant)

### Validation

- ✅ Entity: 9 nouveaux champs + 3 indexes + 2 FK
- ✅ Migration: Créée avec up/down, FK avec ON DELETE SET NULL
- ✅ Build: Compile (erreurs pré-existantes subscriptions/mondial-tv ignorées)
- ✅ Aucune modification des champs existants (code, nom, description, audit fields)

### Fichiers créés
- `services/service-commercial/src/migrations/1739050000000-EnrichModeleDistribution.ts`

### Fichiers modifiés
- `services/service-commercial/src/domain/products/entities/modele-distribution.entity.ts` (9 colonnes + 3 indexes)

### Prochaines étapes (Wave 2+)

- Tester la migration avec une base de données réelle
- Implémenter les endpoints gRPC (Create/Update/Get avec nouveaux champs)
- Ajouter les validations métier (ex: dateDebut < dateFin)
- Tester les FK avec grpcurl
- Mettre à jour le frontend pour afficher les nouveaux champs (Wave 5)


## Wave 2 - Task: Moteur de tarification multi-modèles

### Implémentation complétée

#### 1. **TarificationService (engine central) ajouté**
- Fichier: `src/domain/products/services/tarification.engine.ts`
- Interface `ITarificationEngine` avec `calculate(produitId, quantite, options)`
- Cascade implémentée: **Formule > Grille > Promotion > Modèle tarifaire**
- Résolution Formule: `formuleId` ou `formuleCode`
- Résolution Grille: lookup `prix_produit` actif + application remise/min/max
- Promotion appliquée uniquement si active et dans la fenêtre date_debut/date_fin

#### 2. **Pattern Strategy pour 7 modèles**
- Dossier: `src/domain/products/services/tarification-strategies/`
- Stratégies créées:
  - `fixe.strategy.ts`
  - `palier.strategy.ts`
  - `recurrent.strategy.ts`
  - `usage.strategy.ts`
  - `bundle.strategy.ts`
  - `negocie.strategy.ts`
  - `indexe.strategy.ts`
- Chaque stratégie implémente `calculate(produit, quantite, options): PrixCalcule`

#### 3. **Parsing configTarification JSONB par modèle**
- **PALIER**: `{ paliers: [{ seuilMin, seuilMax, prix }] }` avec sélection du palier applicable
- **RECURRENT**: `{ frequence, prixMensuel, dureeMinimale }` (ANNUEL = mensuel * 12)
- **USAGE**: `{ prixParUnite, unitesMesure, plancherMensuel, plafondMensuel }` avec bornes
- **BUNDLE**: `{ produitIds, prixBundle, remisePourcent }`
- **NEGOCIE**: `{ prixBase, margeNegociation: { min, max } }` avec clamp du prix négocié
- **INDEXE**: `{ prixBase, indexReference, coefficientActuel, dateReference }`

#### 4. **Endpoint gRPC CatalogService.CalculatePrice exposé**
- Nouveau contrôleur: `src/infrastructure/grpc/products/catalog.controller.ts`
- Méthode: `@GrpcMethod('CatalogService', 'CalculatePrice')`
- Validation entrée: `produit_id` requis, `quantite > 0`
- Mapping vers proto `CalculatePriceResponse`

#### 5. **Wiring module NestJS mis à jour**
- `products.module.ts`:
  - provider ajouté: `TarificationService`
  - controller ajouté: `CatalogController`
  - export ajouté: `TarificationService`
- `infrastructure/grpc/products/index.ts`: export `CatalogController`

#### 6. **Tests unitaires ajoutés (stratégies + cascade)**
- Fichier: `src/domain/products/services/__tests__/tarification.engine.spec.ts`
- Couverture:
  - 7 tests de stratégies (FIXE, PALIER, RECURRENT, USAGE, BUNDLE, NEGOCIE, INDEXE)
  - 4 tests de cascade (Formule, Grille, Promotion, fallback Modèle)

### Patterns retenus

1. **Cascade explicite et déterministe**: priorité métier codée côté engine, jamais implicite
2. **Strategy map par enum**: `Map<TypeTarification, ITarificationStrategy>` pour extensibilité
3. **Fail-safe pricing**: fallback FIXE si type absent/non reconnu
4. **Remise additionnelle transverse**: appliquée après résolution de la source de prix
5. **Résultat enrichi**: `PrixCalcule` contient source/type/details pour auditabilité

### Validation

- ✅ `bun run build` exécuté
- ⚠️ Build global KO à cause d'erreurs TypeScript pré-existantes hors scope (subscriptions, mondial-tv)
- ⚠️ `lsp_diagnostics` indisponible localement (binary non résolu par l'outil malgré installation)
- ✅ Aucun changement sur entités `GrilleTarifaire` / `PrixProduit` (respect contrainte)

## Wave 2 - Task: Proto + gRPC Controller + Frontend for PartenaireCommercial

### Implémentation complétée

#### 1. **Proto: packages/proto/src/partenaires/partenaires.proto**
- New proto package `partenaires` (separate from `commerciaux`)
- PartenaireCommercialService with 11 RPCs: Create, Update, Get, List, Delete, Search, Activer, Desactiver, ActiverPourSociete, DesactiverPourSociete, ListBySociete
- PartenaireCommercialMessage: 27 fields (all entity fields + societes repeated)
- PartenaireCommercialSocieteMessage: 7 fields (join table)
- JSONB fields serialized as string in proto (adresses, contacts, apiCredentials, metadata)
- Common messages (Pagination, PaginationResult, DeleteResponse) duplicated in package (proto3 requirement)

#### 2. **gRPC Controller: partenaire-commercial.controller.ts**
- 11 GrpcMethod handlers matching all proto RPCs
- partenaireToProto() helper for entity → proto mapping
- societeToProto() helper for societe entity → proto mapping
- parseJsonSafe() for JSON string → object parsing
- TypePartenaire/StatutPartenaire enum casting from proto strings
- Date fields: toISOString() for proto, new Date() from proto

#### 3. **Frontend gRPC Client: frontend/src/lib/grpc/clients/partenaires.ts**
- Follows exact same pattern as commerciaux.ts
- Singleton client via getPartenaireClient()
- SERVICES.partenaires added to config.ts (port 50053)
- All 11 methods exposed via promisify pattern

#### 4. **Frontend Server Actions: frontend/src/actions/partenaires.ts**
- 11 server actions: getPartenairesByOrganisation, getPartenaire, searchPartenaires, createPartenaire, updatePartenaire, activerPartenaire, desactiverPartenaire, deletePartenaire, activerPartenairePourSociete, desactiverPartenairePourSociete, getPartenairesBySociete
- All follow ActionResult<T> pattern
- revalidatePath("/partenaires") on mutations

#### 5. **Wiring updates**
- commercial.module.ts: PartenaireCommercialController added to controllers array
- infrastructure/grpc/commercial/index.ts: export added
- main.ts: 'partenaires' added to getMultiGrpcOptions()
- packages/proto/package.json: "./partenaires" export added
- service-commercial/package.json: proto:generate script updated to copy partenaires.ts
- frontend config.ts: SERVICES.partenaires entry added

### Key Patterns
1. **Separate proto package**: partenaires has its own package (not merged into commerciaux)
2. **JSONB → string**: JSON fields serialized as string in proto3, parsed in controller
3. **Proto field naming**: snake_case in proto, camelCase in TS (via snakeToCamel config)
4. **Service registration**: Controller in commercial.module.ts controllers array, service already registered as provider
5. **Frontend proto copy**: proto:generate script must include new file path
6. **Windows proto:copy issue**: rm -rf / cp -r in package.json scripts fails on Windows CMD; works in Git Bash

### Validation
- ✅ `buf generate`: Proto compiled, gen/ts + gen/ts-frontend generated
- ✅ `bun run build` (service-commercial): Zero new errors (18 pre-existing subscriptions/mondial-tv)
- ✅ `next build` (frontend): Zero new errors (1 pre-existing auth.ts TS error)
- ✅ All 11 RPCs mapped in controller
- ✅ All 11 methods in frontend client
- ✅ All 11 server actions created

### Files Created
- `packages/proto/src/partenaires/partenaires.proto`
- `services/service-commercial/src/infrastructure/grpc/commercial/partenaire-commercial.controller.ts`
- `frontend/src/lib/grpc/clients/partenaires.ts`
- `frontend/src/actions/partenaires.ts`

### Files Modified
- `packages/proto/package.json` (export added)
- `services/service-commercial/package.json` (proto:generate updated)
- `services/service-commercial/src/main.ts` (grpc options updated)
- `services/service-commercial/src/commercial.module.ts` (controller registered)
- `services/service-commercial/src/infrastructure/grpc/commercial/index.ts` (export added)
- `frontend/src/lib/grpc/clients/config.ts` (SERVICES.partenaires added)


## Wave 2 - Task: Create CanalVente enum, CanalVenteProduitEntity, and update proto

### Implémentation complétée

#### 1. **CanalVente Enum**
- Fichier: `src/domain/products/enums/canal-vente.enum.ts`
- 5 valeurs: TERRAIN, TELEPHONE, WEB, MARQUE_BLANCHE, MARKETPLACE
- Utilisé dans CanalVenteProduitEntity et proto

#### 2. **CanalVenteProduitEntity (many-to-many)**
- Fichier: `src/domain/products/entities/canal-vente-produit.entity.ts`
- Table: `canal_vente_produit`
- Champs:
  - `id` (UUID PK)
  - `produit_id` (UUID FK → produits)
  - `canal` (ENUM CanalVente)
  - `actif` (BOOLEAN DEFAULT true)
  - `config` (JSONB NULL) — configuration flexible par canal
  - `created_at`, `updated_at` (timestamps)
- Unique constraint: (produit_id, canal)
- Indexes: produit_id, canal, actif
- Relation: ManyToOne vers ProduitEntity avec ON DELETE CASCADE

#### 3. **Migration TypeORM**
- Fichier: `src/migrations/1739060000000-CreateCanalVente.ts`
- Crée le type ENUM `canal_vente_enum`
- Crée la table `canal_vente_produit` avec tous les champs
- Crée les indexes pour perf
- Rollback: drop indexes → drop table → drop enum

#### 4. **LigneContratEntity enrichie**
- Ajout de `canalVente` (VARCHAR(50) NULL)
- Champ optionnel pour tracker le canal de souscription
- Positionné avant `created_by` pour cohérence

#### 5. **Proto products.proto enrichi**
- Enum `CanalVente` ajouté (6 valeurs dont UNSPECIFIED)
- Valeurs: CANAL_VENTE_TERRAIN, CANAL_VENTE_TELEPHONE, CANAL_VENTE_WEB, CANAL_VENTE_MARQUE_BLANCHE, CANAL_VENTE_MARKETPLACE

#### 6. **Proto contrats.proto enrichi**
- Message `LigneContrat`: ajout de `canal_vente` (field 7)
- Message `CreateLigneContratRequest`: ajout de `optional canal_vente` (field 6)
- Message `UpdateLigneContratRequest`: ajout de `optional canal_vente` (field 6)
- Renumération des fields pour éviter les conflits

### Patterns appliqués

1. **Enum pour valeurs fixes**: CanalVente enum au niveau domain + proto
2. **Many-to-many avec config JSONB**: Permet la flexibilité par canal (tarifs, règles, etc.)
3. **Unique constraint composite**: (produit_id, canal) pour éviter les doublons
4. **Nullable canalVente dans LigneContrat**: Optionnel pour compatibilité rétroactive
5. **Proto field numbering**: Séquentiel, UNSPECIFIED = 0 pour enums

### Validation

- ✅ Enum: Compile sans erreurs
- ✅ Entity: Syntaxe TypeScript valide
- ✅ Migration: Syntaxe TypeORM valide
- ✅ Proto: Généré correctement (buf generate)
- ✅ Build: Aucune nouvelle erreur (23 pré-existantes subscriptions/mondial-tv ignorées)

### Fichiers créés
- `src/domain/products/enums/canal-vente.enum.ts`
- `src/domain/products/entities/canal-vente-produit.entity.ts`
- `src/migrations/1739060000000-CreateCanalVente.ts`

### Fichiers modifiés
- `src/domain/contrats/entities/ligne-contrat.entity.ts` (ajout canalVente)
- `packages/proto/src/products/products.proto` (enum CanalVente)
- `packages/proto/src/contrats/contrats.proto` (canal_vente dans LigneContrat)

### Prochaines étapes (Wave 3+)

- Créer migration pour ajouter colonne `canal_vente` à `ligne_contrat`
- Implémenter les endpoints gRPC pour gérer les canaux par produit
- Ajouter les validations métier (ex: certains produits ne supportent que certains canaux)
- Tester la migration avec une base de données réelle
- Mettre à jour le frontend pour afficher/gérer les canaux (Wave 5)



## Wave 3 - Task: FormuleProduit Proto + gRPC Controller + Frontend Server Actions

### Implémentation complétée

#### 1. **Proto: packages/proto/src/products/products.proto**
- Enums: `FranchiseType` (MONTANT, POURCENTAGE), `TypeAjustementPrix` (MONTANT, POURCENTAGE)
- Messages: `GarantieFormule`, `OptionFormule`, `FormuleProduit` (19 fields)
- Request messages: Create, Update, Get, ListByProduit, Delete, Activer, Desactiver
- Response messages: ListFormulesProduitResponse, DeleteFormuleProduitResponse
- Service: `FormuleProduitService` with 7 RPCs: Create, Update, Get, ListByProduit, Delete, Activer, Desactiver

#### 2. **gRPC Controller: formule-produit.controller.ts**
- 7 GrpcMethod handlers matching all proto RPCs
- formuleProduitToProto() helper for entity → proto mapping
- JSON serialization for metadata field (JSONB → string in proto)
- Enum casting for FranchiseType and TypeAjustementPrix
- Date fields: toISOString() for proto, new Date() from proto
- Error handling with RpcException and status codes

#### 3. **Frontend gRPC Client: frontend/src/lib/grpc/clients/products.ts**
- FormuleProduitServiceService imported from @proto/products
- getFormuleProduitClient() singleton factory
- 7 methods exposed via promisify pattern:
  - createFormule, updateFormule, getFormule
  - listFormulesByProduit (maps to ListByProduit RPC)
  - deleteFormule, activerFormule, desactiverFormule

#### 4. **Frontend Server Actions: frontend/src/actions/catalogue.ts**
- 6 server actions: getFormulesByProduit, createFormuleProduit, updateFormuleProduit, deleteFormuleProduit, activerFormuleProduit, desactiverFormuleProduit
- All follow ActionResult<T> pattern
- revalidatePath("/catalogue") on mutations
- Error handling with console.error and user-friendly messages

#### 5. **Wiring updates**
- products.module.ts: FormuleProduitController added to controllers array
- infrastructure/grpc/products/index.ts: export added
- frontend products.ts: FormuleProduitServiceService imported, client factory added, 7 methods added to produits export

### Patterns appliqués

1. **Proto service naming**: FormuleProduitService (not FormuleService) to match entity naming
2. **RPC method naming**: ListByProduit (not ListFormulesByProduit) for consistency with other services
3. **JSONB → string**: metadata field serialized as JSON string in proto3 (no native JSONB type)
4. **Enum handling**: FranchiseType and TypeAjustementPrix enums from domain/products/enums
5. **Frontend client pattern**: Singleton factory + promisify wrapper for gRPC methods

### Validation

- ✅ `buf generate`: Proto compiled, FormuleProduit messages and service generated
- ✅ Proto generation: 151 occurrences of "FormuleProduit" in generated products.ts
- ✅ Controller: Syntax fixed (removed extra brace), follows existing patterns
- ✅ Module registration: FormuleProduitController added to products.module.ts
- ✅ Frontend client: FormuleProduitServiceService imported, 7 methods added to produits export
- ✅ Server actions: 6 actions created following ActionResult<T> pattern

### Fichiers créés
- `services/service-commercial/src/infrastructure/grpc/products/formule-produit.controller.ts`

### Fichiers modifiés
- `packages/proto/src/products/products.proto` (FormuleProduit messages + service)
- `services/service-commercial/src/infrastructure/grpc/products/index.ts` (export added)
- `services/service-commercial/src/products.module.ts` (controller registered)
- `frontend/src/lib/grpc/clients/products.ts` (FormuleProduitServiceService + 7 methods)
- `frontend/src/actions/catalogue.ts` (6 server actions)

### Notes d'implémentation

1. **Proto field numbering**: FormuleProduit fields 1-19 (sequential, no gaps)
2. **Enum values**: FranchiseType/TypeAjustementPrix start at 0 (UNSPECIFIED) per proto3 convention
3. **Nullable fields**: optional string/double for nullable fields in proto3
4. **Service registration**: Controller in products.module.ts controllers array (not providers)
5. **Frontend client pattern**: Matches existing gammes/produits/produitVersions pattern exactly

### Prochaines étapes (Wave 4+)

- Implémenter les endpoints de gestion (Create/Update/Get avec nouveaux champs)
- Tester les RPCs avec grpcurl
- Ajouter les validations métier (ex: code unique par produit)
- Mettre à jour le frontend pour afficher les formules (Wave 5)
- Intégrer avec TarificationService pour utiliser les formules dans le calcul de prix

