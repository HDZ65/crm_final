# Vue 360° Client — Import depuis projet collègue (V2 simplifié)

## TL;DR

> **Quick Summary**: Importer les prospects (avec contrats, souscriptions, paiements, commercial) depuis l'endpoint REST existant du collègue vers notre CRM microservices, créer une entity pour IBAN/BIC, et ajouter un KPI "Contrats par commercial" sur le dashboard home.
>
> **Deliverables**:
> - Service d'import qui parse le JSON imbriqué du collègue et upsert dans nos entités existantes
> - Entity InformationPaiementBancaire (IBAN/BIC en clair) dans service-finance
> - Cron horaire + bouton sync manuel
> - KPI "Contrats par commercial" sur le dashboard home
>
> **Estimated Effort**: Medium
> **Parallel Execution**: YES - 2 waves
> **Critical Path**: Task 1 (Entity IBAN) → Task 2 (Import Service) → Task 3 (Cron+Button) → Task 4 (KPI) → Task 5 (QA)

---

## Context

### Original Request
Vue 360° client dans le CRM : voir tous les contrats avec le client et le commercial associé. Les données viennent du projet Prisma/MySQL du collègue qui a DÉJÀ un endpoint REST retournant les prospects avec toutes les données imbriquées.

### Interview Summary
**Key Discussions**:
- L'endpoint du collègue est **déjà dispo** et retourne un JSON imbriqué complet par prospect
- On importe dans les entités **EXISTANTES** (pas de nouvelles entities sauf IBAN/BIC)
- IdentityCard stocké en JSON simple sur ClientBase
- Matching clients déjà implémenté
- Commerciaux : créer Apporteur + Utilisateur si inexistant
- Documents PDF : stocker juste le chemin
- Conflit : le plus récent gagne

**Format JSON reçu** (exemple réel):
```json
{
  "idProspect": 397,
  "nom": "HAMROUNI", "prenom": "Khalil",
  "email": "hamrounikhalil2023@gmail.com",
  "telephone": "0602540252",
  "ville": "Rennes", "codePostal": "35000",
  "statutProspect": "Valide",
  "commercialId": "b1597894-...",
  "informationsPaiement": [{ "IBAN": "FR41...", "BIC": "BNPAFRPPXXX", ... }],
  "Souscription": [{
    "offreId": 9,
    "totalAmount": 2.2,
    "offre": { "nom": "Télécâble Sat", "categorie": "Divertissement", "prix_base": 2.2, ... },
    "contrats": [{ "id": 583, "titre": "8177185WNC", "statut": "Validé", "dateSignature": "...", "documentUrl": "contracts/xxx.pdf", ... }]
  }],
  "commercial": { "id": "...", "nom": "Doe", "prenom": "John", "email": "doe.john@winleadplus.com" },
  "identityCard": null
}
```

**Research Findings**:
- Les pages détail client et commercial MONTRENT DÉJÀ les contrats avec client+commercial
- Le dashboard home n'a PAS de KPI "contrats par commercial"
- L'import service existant ne gère que les contrats (pas le JSON imbriqué complet)
- GoCardlessMandateEntity ne stocke pas IBAN/BIC en clair → nouvelle entity nécessaire
- 6/7 modèles ont déjà un équivalent dans notre CRM

### Metis Review
**Identified Gaps** (addressed):
- Import dependency ordering : Offres → Clients → Commerciaux → Contrats (enforced dans l'orchestrateur)
- Dashboard nom_complet vide : résoudre noms commerciaux via cross-service call
- IBAN/BIC storage gap : nouvelle entity InformationPaiementBancaire
- Incremental sync : paramètre updated_since pour éviter de tout re-importer

---

## Work Objectives

### Core Objective
Importer les données du collègue (1 endpoint JSON imbriqué) dans nos entités existantes et afficher un KPI "contrats par commercial" sur le dashboard.

### Concrete Deliverables
- `services/service-finance/src/domain/payments/entities/information-paiement-bancaire.entity.ts` — Nouvelle entity
- `services/service-commercial/src/domain/import/` — Service d'import multi-entités
- `services/service-commercial/src/infrastructure/scheduling/` — Cron horaire mis à jour
- `frontend/src/components/dashboard-contrats-par-commercial.tsx` — KPI card
- `frontend/src/components/import-contrats-dialog.tsx` — Bouton sync mis à jour

### Definition of Done
- [ ] L'import parse le JSON du collègue et upsert dans toutes les entités
- [ ] Les commerciaux sont créés s'ils n'existent pas
- [ ] IBAN/BIC stockés dans InformationPaiementBancaire
- [ ] Le cron tourne toutes les heures
- [ ] Le bouton sync déclenche un import manuel
- [ ] Le dashboard home affiche "Contrats par commercial"
- [ ] Build passe sur tous les services modifiés
- [ ] Zero erreurs LSP

### Must Have
- Import du JSON imbriqué complet (prospect + contrats + souscriptions + paiements + commercial)
- Création Apporteur + Utilisateur si commercial inexistant
- Upsert (pas de doublons)
- IBAN/BIC en clair dans nouvelle entity
- KPI sur home dashboard
- Cron horaire + bouton manuel

### Must NOT Have (Guardrails)
- ❌ Pas de nouvelles pages frontend
- ❌ Pas de download de documents PDF (stocker juste le chemin)
- ❌ Pas de webhook temps réel
- ❌ Pas de suppression de données locales si absentes de la source (append-only)
- ❌ Pas de chiffrement IBAN/BIC (stockage en clair)
- ❌ Pas d'entity IdentityCard dédiée (JSON simple sur ClientBase)
- ❌ Pas d'import de ChoixNeoline, NeolianeCartResponse, NeolianeSubscriptionResponse, ProspectDuplicate

---

## Verification Strategy

> **UNIVERSAL RULE: ZERO HUMAN INTERVENTION**

### Test Decision
- **Infrastructure exists**: YES (bun test)
- **Automated tests**: NO (pas demandé)
- **Verification**: LSP + builds + QA scénarios agent-exécutés

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Start Immediately):
├── Task 1: Entity InformationPaiementBancaire (aucune dépendance)
└── Task 4: KPI Dashboard (aucune dépendance — frontend only)

Wave 2 (After Task 1):
├── Task 2: Import Service multi-entités (dépend: Task 1)
└── Task 3: Cron + Bouton Sync (dépend: Task 2)

Wave 3 (After all):
└── Task 5: QA Validation

Critical Path: Task 1 → Task 2 → Task 3 → Task 5
Parallel Speedup: ~30% (Task 4 parallèle avec Wave 2)
```

### Dependency Matrix

| Task | Depends On | Blocks | Can Parallelize With |
|------|-----------|--------|---------------------|
| 1 | None | 2 | 4 |
| 2 | 1 | 3, 5 | 4 |
| 3 | 2 | 5 | 4 |
| 4 | None | 5 | 1, 2, 3 |
| 5 | All | None | None (final) |

---

## TODOs

- [x] 1. Entity InformationPaiementBancaire dans service-finance

  **What to do**:
  - Créer `services/service-finance/src/domain/payments/entities/information-paiement-bancaire.entity.ts`:
    - TypeORM entity: id (uuid), organisation_id (uuid), client_id (uuid), iban (varchar 34), bic (varchar 11), titulaire_compte (varchar 255, nullable), mandat_sepa_reference (varchar 255, nullable), date_mandat (timestamp, nullable), statut (varchar 50, default 'ACTIF'), commentaire (text, nullable), external_id (varchar 255, nullable — l'idInfoPaiement du collègue), created_at, updated_at
    - Indexes: client_id, external_id (unique per org), iban
  - Créer `services/service-finance/src/domain/payments/services/information-paiement-bancaire.service.ts`:
    - CRUD: create, findById, findByClientId, findByExternalId, upsertByExternalId, delete
    - `upsertByExternalId(orgId, externalId, data)` : crée ou met à jour (conflit: le plus récent gagne)
  - Créer le repository TypeORM correspondant
  - Créer `services/service-finance/src/infrastructure/grpc/payments/information-paiement-bancaire.controller.ts`:
    - Expose les méthodes via gRPC
  - Ajouter proto `packages/proto/src/payments/payment-info.proto`:
    - Message InformationPaiementBancaire + Service CRUD
  - Ajouter migration TypeORM pour la table

  **Must NOT do**:
  - Ne pas modifier GoCardlessMandateEntity
  - Ne pas ajouter de chiffrement IBAN/BIC

  **Recommended Agent Profile**:
  - **Category**: `unspecified-low`
    - Reason: Création d'entité TypeORM standard suivant patterns existants
  - **Skills**: [`microservice-maintainer`]
    - `microservice-maintainer`: Ajout de feature dans microservice existant

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Task 4)
  - **Blocks**: Task 2
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `services/service-finance/src/domain/payments/entities/gocardless-mandate.entity.ts` — Pattern entity dans service-finance (décorateurs TypeORM, colonnes, indexes)
  - `services/service-finance/src/infrastructure/persistence/typeorm/repositories/` — Pattern repository
  - `services/service-finance/src/infrastructure/grpc/` — Pattern controller gRPC

  **API/Type References**:
  - JSON exemple du collègue — champs `informationsPaiement[]: { idInfoPaiement, IBAN, BIC, mandatSEPA, dateMandat, commentaire, prospectId }`

  **Acceptance Criteria**:

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: Build succeeds with new entity
    Tool: Bash
    Steps:
      1. Run: bun run build in services/service-finance
      2. Assert: zero build errors
    Expected Result: Service builds successfully
    Evidence: Build output

  Scenario: LSP diagnostics clean
    Tool: LSP
    Steps:
      1. Check diagnostics on information-paiement-bancaire.entity.ts
      2. Check diagnostics on information-paiement-bancaire.service.ts
      3. Check diagnostics on information-paiement-bancaire.controller.ts
      4. Assert: zero errors
    Expected Result: All clean
    Evidence: LSP output

  Scenario: Proto compiles
    Tool: Bash
    Steps:
      1. Verify packages/proto/src/payments/payment-info.proto exists
      2. Run proto build/compilation
      3. Assert: no errors
    Expected Result: Proto compiles
    Evidence: Build output
  ```

  **Commit**: YES
  - Message: `feat(finance): add InformationPaiementBancaire entity for IBAN/BIC storage`
  - Files: `services/service-finance/src/domain/payments/**`, `packages/proto/src/payments/payment-info.proto`

---

- [x] 2. Import Service — Parse JSON imbriqué du collègue

  **What to do**:
  - Créer `services/service-commercial/src/domain/import/services/import-orchestrator.service.ts`:
    - `importAll(config: { apiUrl: string, apiKey: string, organisationId: string, dryRun?: boolean, updatedSince?: string })`:
      1. `GET {apiUrl}/api/prospects?has_contrats=true` (ou filtre équivalent) avec header `X-API-Key`
      2. Paginer si nécessaire
      3. Pour chaque prospect dans la réponse, dans l'ORDRE:
         a. **Upsert Commercial** : Si `prospect.commercial` présent → chercher Apporteur par email → si inexistant, créer Apporteur + Utilisateur via gRPC service-core
         b. **Upsert Client** : Mapper prospect → ClientBase via matching existant → si inexistant, créer via gRPC service-core
         c. **Upsert Offres** : Pour chaque `Souscription[].offre` → upsert ProduitEntity (match par nom+fournisseur)
         d. **Upsert Contrats** : Pour chaque `Souscription[].contrats[]` → upsert ContratEntity (match par titre/reference ou external_id)
            - commercial_id = ID de l'Apporteur résolu en étape (a)
            - client_id = ID du ClientBase résolu en étape (b)
            - documentUrl = stocker le chemin tel quel
         e. **Upsert Souscriptions** : Mapper vers SubscriptionEntity existante (match par external_id = idSouscription)
         f. **Upsert Paiements** : Pour chaque `informationsPaiement[]` → upsert InformationPaiementBancaire via gRPC service-finance (match par external_id = idInfoPaiement)
         g. **IdentityCard** : Si `identityCard` non null → stocker en JSON sur un champ du client (ou ignorer si pas de champ dispo)
      4. Résolution de conflit: comparer `createdAt` (le plus récent gagne)
      5. Retourner `ImportResult { total, created, updated, skipped, errors[] }` avec détail par type d'entité
    - Chaque étape: try/catch individuel, log l'erreur, continuer avec le prospect suivant
    - Support dry-run: simuler sans écrire
  - Créer `services/service-commercial/src/domain/import/services/import-mapper.service.ts`:
    - Fonctions de mapping pures:
      - `mapProspectToClientBase(prospectJson)` → ClientBase fields
      - `mapCommercialToApporteur(commercialJson)` → Apporteur fields
      - `mapContratToContratEntity(contratJson, clientId, commercialId)` → ContratEntity fields
      - `mapSouscriptionToSubscription(souscriptionJson, clientId)` → Subscription fields
      - `mapOffreToProductEntity(offreJson)` → ProduitEntity fields
      - `mapPaiementToInfoPaiement(paiementJson, clientId)` → InformationPaiementBancaire fields
  - Créer gRPC controller: `services/service-commercial/src/infrastructure/grpc/import/import-orchestrator.controller.ts`
    - `ImportAll(config)` — lance l'import
    - `GetImportStatus(importId)` — statut
  - Mettre à jour proto si nécessaire pour les nouvelles méthodes

  **Must NOT do**:
  - Ne pas supprimer de données locales absentes de la source (append-only)
  - Ne pas bloquer l'import si un prospect échoue (continuer)
  - Ne pas télécharger les PDFs (stocker le chemin)
  - Ne pas créer d'entity IdentityCard

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: Logique complexe d'orchestration avec résolution de dépendances, cross-service calls, mapping, error handling
  - **Skills**: [`microservice-maintainer`]
    - `microservice-maintainer`: Ajout majeur de feature dans microservice existant

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Sequential (Wave 2, after Task 1)
  - **Blocks**: Task 3, Task 5
  - **Blocked By**: Task 1

  **References**:

  **Pattern References**:
  - `services/service-commercial/src/domain/contrats/services/contrat-import.service.ts` — Import service existant (pattern fetch HTTP + validate + upsert). CE FICHIER EST LE POINT DE DÉPART — le refactorer ou s'en inspirer.
  - `services/service-commercial/src/infrastructure/grpc/contrats/contrat-import.controller.ts` — Controller gRPC import existant
  - `services/service-commercial/src/infrastructure/grpc/calendar/calendar-grpc-client.ts` — Pattern cross-service gRPC call (pour appels vers service-core et service-finance)
  - `services/service-commercial/src/domain/subscriptions/services/subscription-charge.service.ts:171-221` — Pattern loadGrpcPackage pour appels inter-services
  - `services/service-commercial/src/infrastructure/persistence/typeorm/repositories/contrats/contrat.service.ts` — ContratService avec findByReference pour upsert

  **API/Type References**:
  - `packages/proto/src/clients/clients.proto` — ClientService pour upsert clients via gRPC
  - `packages/proto/src/contrats/contrats.proto` — ContratService
  - `packages/proto/src/subscriptions/subscriptions.proto` — SubscriptionService
  - `packages/proto/src/products/products.proto` — ProduitService
  - `packages/proto/src/payments/payment-info.proto` — InformationPaiementBancaireService (Task 1)
  - `services/service-commercial/src/domain/commercial/entities/apporteur.entity.ts` — Apporteur entity pour création commercial
  - `services/service-core/src/domain/users/entities/utilisateur.entity.ts` — Utilisateur entity

  **External References**:
  - JSON exemple complet du collègue (dans le draft) — structure exacte à parser

  **WHY Each Reference Matters**:
  - `contrat-import.service.ts`: Copier le pattern fetch HTTP + X-API-Key + validation + upsert. C'est le squelette.
  - `calendar-grpc-client.ts`: Pattern pour appeler service-core (upsert client) et service-finance (upsert paiement) via gRPC depuis service-commercial
  - `subscription-charge.service.ts:171-221`: loadGrpcPackage — la méthode exacte pour charger un client gRPC
  - `apporteur.entity.ts`: Comprendre les champs pour mapper commercial.{id,nom,prenom,email} → Apporteur

  **Acceptance Criteria**:

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: Build succeeds with import service
    Tool: Bash
    Steps:
      1. Run: bun run build in services/service-commercial
      2. Assert: zero build errors
    Expected Result: Service builds
    Evidence: Build output

  Scenario: LSP diagnostics clean on all import files
    Tool: LSP
    Steps:
      1. Check diagnostics on import-orchestrator.service.ts
      2. Check diagnostics on import-mapper.service.ts
      3. Check diagnostics on import-orchestrator.controller.ts
      4. Assert: zero errors
    Expected Result: All clean
    Evidence: LSP output

  Scenario: Mapper functions handle real JSON structure
    Tool: Bash (bun eval or manual verification)
    Steps:
      1. Verify mapProspectToClientBase handles all fields from JSON example
      2. Verify mapContratToContratEntity handles nested Souscription[].contrats[] structure
      3. Verify mapCommercialToApporteur handles {id, nom, prenom, email} object
      4. Verify null identityCard is handled gracefully
    Expected Result: All mappers handle the real JSON structure
    Evidence: Code review / LSP verification
  ```

  **Commit**: YES
  - Message: `feat(commercial): implement full import orchestrator parsing colleague's nested JSON`
  - Files: `services/service-commercial/src/domain/import/**`

---

- [x] 3. Cron horaire + Bouton Sync Manuel

  **What to do**:
  - Mettre à jour `services/service-commercial/src/infrastructure/scheduling/contrat-import-scheduler.service.ts`:
    - Changer pour appeler `ImportOrchestratorService.importAll()` au lieu de juste contrat import
    - Fréquence: `0 * * * *` (toutes les heures) configurable via env var `IMPORT_CRON_SCHEDULE`
    - Garder le guard de concurrence
    - Stocker la date du dernier sync réussi pour passer `updatedSince` (sync incrémental)
  - Mettre à jour `frontend/src/components/import-contrats-dialog.tsx`:
    - Adapter pour afficher les résultats par type d'entité: Clients créés/mis à jour, Contrats, Souscriptions, Paiements, Commerciaux
    - Ajouter indicateur "Dernier sync: {date}"
  - Mettre à jour `frontend/src/actions/contrat-import.ts`:
    - Appeler le nouveau endpoint ImportAll
  - Mettre à jour le label du bouton dans `frontend/src/components/contrats-card.tsx`:
    - "Importer des contrats" → "Synchroniser"

  **Must NOT do**:
  - Ne pas ajouter de configuration URL/API key côté frontend (tout en env vars backend)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Mise à jour de fichiers existants, logique simple
  - **Skills**: [`microservice-maintainer`]
    - `microservice-maintainer`: Modification service existant

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Sequential after Task 2
  - **Blocks**: Task 5
  - **Blocked By**: Task 2

  **References**:

  **Pattern References**:
  - `services/service-commercial/src/infrastructure/scheduling/contrat-import-scheduler.service.ts` — Scheduler existant à modifier
  - `services/service-core/src/infrastructure/scheduling/depanssur-scheduler.service.ts:80-133` — Pattern cron avec concurrency guard
  - `frontend/src/components/import-contrats-dialog.tsx` — Dialog import à adapter
  - `frontend/src/actions/contrat-import.ts` — Server action à adapter
  - `frontend/src/components/contrats-card.tsx` — Bouton import

  **Acceptance Criteria**:

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: Backend + Frontend build
    Tool: Bash
    Steps:
      1. Run: bun run build in services/service-commercial → Assert: zero errors
      2. Run: bun run build in frontend → Assert: zero errors
    Expected Result: Both build
    Evidence: Build output
  ```

  **Commit**: YES
  - Message: `feat(commercial,frontend): update sync to hourly multi-entity import with manual trigger`
  - Files: scheduler, frontend dialog, action, contrats-card

---

- [x] 4. KPI Dashboard — "Contrats par commercial" sur Home

  **What to do**:
  - Créer `frontend/src/components/dashboard-contrats-par-commercial.tsx`:
    - Bar chart ou table: Commercial (nom), Nombre de contrats, Montant total
    - Tri par nombre de contrats décroissant
    - Filtrage par rôle:
      - Admin: voit tout
      - Manager: voit son équipe
      - Commercial: voit ses stats uniquement
  - Créer `frontend/src/actions/dashboard-contrats-commercial.ts`:
    - Server action: appelle service-commercial pour stats agrégées
    - Agrégation: COUNT contrats + SUM montant par commercial_id
    - Enrichissement: résoudre commercial_id → nom via Apporteur
  - Intégrer dans `frontend/src/app/(main)/page.tsx` (home dashboard):
    - Après les KPIs existants ou dans la section charts
  - Si nécessaire, ajouter endpoint gRPC dans service-commercial:
    - `GetContratsStatsByCommercial(organisation_id)` → `{ commercial_id, nom, contrats_count, montant_total }[]`

  **Must NOT do**:
  - Ne pas créer de nouvelle page
  - Ne pas afficher d'infos sensibles (IBAN)
  - Ne pas casser le layout existant

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: Composant frontend avec chart/table, intégration dans layout existant
  - **Skills**: [`frontend-ui-ux`]
    - `frontend-ui-ux`: Design du composant KPI

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Task 1)
  - **Blocks**: Task 5
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `frontend/src/components/dashboard-kpis.tsx` — Pattern KPI cards (Active Contracts, MRR, etc.)
  - `frontend/src/app/(main)/page.tsx` — Home dashboard layout
  - `frontend/src/app/(main)/statistiques/statistiques-page-client.tsx` — Charts et rankings patterns
  - `frontend/src/components/commercial-detail/commercial-contrats.tsx` — Pattern table contrats

  **API/Type References**:
  - `packages/proto/src/contrats/contrats.proto` — Contrat message avec commercial_id
  - `services/service-commercial/src/domain/commercial/entities/apporteur.entity.ts` — Apporteur pour nom commercial

  **Acceptance Criteria**:

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: Frontend builds
    Tool: Bash
    Steps:
      1. Run: bun run build in frontend
      2. Assert: zero errors
    Expected Result: Builds
    Evidence: Build output

  Scenario: LSP diagnostics clean
    Tool: LSP
    Steps:
      1. Check diagnostics on dashboard-contrats-par-commercial.tsx
      2. Check diagnostics on dashboard-contrats-commercial.ts
      3. Check diagnostics on page.tsx
      4. Assert: zero errors
    Expected Result: Clean
    Evidence: LSP output

  Scenario: KPI renders on home page (Playwright — when services available)
    Tool: Playwright (playwright skill)
    Preconditions: Dev server running on localhost:3000, authenticated user
    Steps:
      1. Navigate to: http://localhost:3000
      2. Wait for: dashboard loaded (timeout: 10s)
      3. Assert: Section "Contrats par commercial" visible
      4. Assert: At least one row with commercial name + count
      5. Screenshot: .sisyphus/evidence/task-4-kpi-contrats-commercial.png
    Expected Result: KPI section visible
    Evidence: .sisyphus/evidence/task-4-kpi-contrats-commercial.png
  ```

  **Commit**: YES
  - Message: `feat(frontend): add contrats par commercial KPI on home dashboard`
  - Files: `frontend/src/components/dashboard-contrats-par-commercial.tsx`, `frontend/src/actions/dashboard-contrats-commercial.ts`, `frontend/src/app/(main)/page.tsx`

---

- [x] 5. QA Validation finale

  **What to do**:
  - Build ALL modified services:
    - `bun run build` : packages/proto, service-finance, service-commercial, frontend
  - LSP diagnostics sur tous les fichiers modifiés/créés
  - Si services disponibles: test import via grpcurl + vérification UI via Playwright

  **Must NOT do**:
  - Ne pas modifier de code

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Commandes de validation
  - **Skills**: [`playwright`]
    - `playwright`: Vérification UI si services dispo

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Sequential (final)
  - **Blocks**: None
  - **Blocked By**: All

  **References**: Tous les fichiers des Tasks 1-4

  **Acceptance Criteria**:

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: All builds pass
    Tool: Bash
    Steps:
      1. bun run build in packages/proto → Assert: zero errors
      2. bun run build in services/service-finance → Assert: zero errors
      3. bun run build in services/service-commercial → Assert: zero errors
      4. bun run build in frontend → Assert: zero errors
    Expected Result: All 4 builds pass
    Evidence: Build outputs

  Scenario: Zero LSP errors
    Tool: LSP
    Steps:
      1. Check diagnostics on every file from Tasks 1-4
      2. Assert: zero errors
    Expected Result: Clean codebase
    Evidence: LSP report
  ```

  **Commit**: NO (validation only)

---

## Commit Strategy

| After Task | Message | Verification |
|------------|---------|-------------|
| 1 | `feat(finance): add InformationPaiementBancaire entity for IBAN/BIC storage` | bun run build |
| 2 | `feat(commercial): implement full import orchestrator parsing colleague's nested JSON` | bun run build |
| 3 | `feat(commercial,frontend): update sync to hourly multi-entity import` | bun run build |
| 4 | `feat(frontend): add contrats par commercial KPI on home dashboard` | bun run build |

---

## Success Criteria

### Verification Commands
```bash
bun run build  # In packages/proto → zero errors
bun run build  # In services/service-finance → zero errors
bun run build  # In services/service-commercial → zero errors
bun run build  # In frontend → zero errors
```

### Final Checklist
- [ ] Entity InformationPaiementBancaire créée (IBAN/BIC en clair)
- [ ] Import service parse le JSON imbriqué du collègue correctement
- [ ] Commerciaux créés si inexistants
- [ ] Upsert fonctionne (pas de doublons)
- [ ] Cron toutes les heures
- [ ] Bouton sync manuel
- [ ] KPI "Contrats par commercial" sur home dashboard
- [ ] Tous les builds passent
- [ ] Zero erreurs LSP
