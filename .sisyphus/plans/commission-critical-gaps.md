# Combler les 5 écarts critiques du Module Commission

## TL;DR

> **Quick Summary**: Implémenter les 5 fonctionnalités critiques manquantes entre le cahier des charges du Module Commission Winvest Capital et le CRM existant : moteur de calcul avancé, validation ADV, génération PDF/Excel, contestation, et reporting/KPI.
> 
> **Deliverables**:
> - Moteur de calcul DDD complet (reprises, récurrence, régularisation, calcul mixte)
> - Interface de validation ADV avec présélection, motifs, totaux dynamiques, verrouillage
> - Génération PDF/Excel des bordereaux avec hash SHA-256
> - Système de contestation complet (statut, workflow, régularisation)
> - Dashboard reporting avec KPIs, comparatifs et snapshots mensuels
> 
> **Estimated Effort**: XL (5 features majeures)
> **Parallel Execution**: YES - 3 waves
> **Critical Path**: Task 0 → Task 1 → Task 2 → Task 3 → Task 4/5 parallèle → Task 6 → Task 7/8 → Task 9

---

## Context

### Original Request
Analyse du cahier des charges "Module Commission" (1646 lignes, 13 sections + 7 annexes) pour le groupe Winvest Capital, et identification des écarts par rapport au CRM existant. Implémentation des 5 écarts critiques.

### Interview Summary
**Key Discussions**:
- **Approche PDF/Excel**: Backend (service-commercial) choisi — plus robuste pour hash SHA-256
- **Architecture moteur**: Extraction du controller (833 lignes) vers un domain service DDD dédié
- **Tests**: TDD (Red-Green-Refactor) — critique pour les formules de calcul
- **Priorité**: Moteur de calcul en premier car fondation pour les autres features

**Research Findings**:
- Le CRM couvre ~40-45% du CDC globalement, avec ~95% des CRUD API mais seulement ~40% de la logique métier
- 40+ RPCs gRPC existent déjà, les entités sont toutes créées, les tables BDD existent
- Le calcul actuel est simplifié (lignes 620-663 du controller): juste fixe/% /palier sans mixte, sans reprises auto, sans récurrence
- GenererBordereau crée un bordereau vide (pas de lignes, pas de calcul)
- DeclencherReprise est un stub (montants à 0, pas de formule)
- Le frontend a 16+ composants commission mais pas de page ADV dédiée
- Recharts est déjà installé pour les graphiques
- service-engagement existe pour les notifications (hors scope mais utile à savoir)

### Metis Review
**Identified Gaps** (addressed):
- Précision décimale: Utiliser string pour les montants dans les calculs intermédiaires, DECIMAL(12,2) en BDD → appliqué dans chaque task
- Stockage fichiers PDF/Excel: Écriture locale /uploads/bordereaux/ avec URL relative en BDD → appliqué dans Task 4
- Rétrocompatibilité proto: Ajouter de nouveaux RPCs, ne pas modifier les existants → appliqué partout
- Edge cases moteur: 14 cas identifiés (montants négatifs, pas de barème, concurrence, arrondis) → intégrés dans tests TDD
- Validation ADV concurrence: Verrouillage optimiste sur bordereau → intégré Task 3
- Contestation sans entité: Créer une entity ContestationEntity → intégré Task 5

---

## Work Objectives

### Core Objective
Amener le module commission du CRM de ~40% à ~90% de couverture du cahier des charges en implémentant les 5 fonctionnalités critiques manquantes, avec une approche TDD et architecture DDD.

### Concrete Deliverables
- `CommissionCalculationService` (domain service) avec formules CDC complètes
- `RepriseCalculationService` (domain service) avec formula CDC
- `RecurrenceGenerationService` (domain service) avec auto-génération
- Interface ADV frontend complète (page dédiée /commissions/validation)
- Service de génération PDF (PDFKit) et Excel (ExcelJS) côté backend
- Entity `ContestationCommission` + workflow complet
- Dashboard KPI frontend avec graphiques Recharts
- `SnapshotKpiService` pour alimentation automatique

### Definition of Done
- [ ] `bun test` dans service-commercial → tous les tests passent
- [ ] `bun run build` dans service-commercial → build réussi sans erreur
- [ ] `npm run build` dans frontend → build réussi sans erreur
- [ ] Chaque feature a des tests TDD avec couverture des edge cases CDC
- [ ] Les 14 tables existantes ne sont pas cassées (migrations additives uniquement)

### Must Have
- Formule de reprise du CDC: `min(Σ commissions versées dans fenêtre, commission due période)`
- Formule récurrence: `round(base × (taux_recurrence / 100), 2)` avec condition `encaissé_seulement`
- Arrondis bancaires au centime (DECIMAL 12,2)
- Hash SHA-256 sur chaque bordereau PDF/Excel exporté
- Motif obligatoire sur désélection de ligne ADV
- Verrouillage du bordereau après validation finale
- Statut "contestee" dans le référentiel commission

### Must NOT Have (Guardrails)
- **PAS de table `retrocessions`** — hors scope (écart important #6, pas critique)
- **PAS de table `baremes_versions` séparée** — le champ version dans baremes_commission suffit pour cette phase
- **PAS de table `acomptes` séparée** — les champs montant_acomptes existants suffisent
- **PAS de table `equipes`/`rattachements`** — hors scope
- **PAS d'intégration email/notifications** — hors scope malgré service-engagement existant
- **PAS d'extranet partenaires** — Phase 2 explicite dans le CDC
- **PAS de transmission RWIN RH** (HMAC/SFTP) — phase ultérieure
- **PAS de modification des RPCs gRPC existants** — uniquement ajouts (backward compatible)
- **PAS de modification des tables existantes** — migrations additives seulement
- **PAS de RBAC granulaire commission** — hérité du CRM existant
- **PAS de multi-devise** — tout en EUR
- **PAS de batch/import CSV** — calculs individuels ou par période
- **PAS de PDF customisable** (template engine) — format fixe Winvest Capital

---

## Verification Strategy

> **UNIVERSAL RULE: ZERO HUMAN INTERVENTION**
>
> ALL tasks in this plan MUST be verifiable WITHOUT any human action.
> Every criterion is verified by running a command or using a tool.

### Test Decision
- **Infrastructure exists**: OUI (Jest configuré via NestJS, bun test disponible)
- **Automated tests**: TDD (Red-Green-Refactor)
- **Framework**: bun test (Jest sous le capot via NestJS)

### TDD Workflow (chaque task)

1. **RED**: Écrire les tests en premier
   - Fichier test: `src/domain/commercial/services/__tests__/{service}.spec.ts`
   - Commande: `bun test {file}`
   - Expected: FAIL (tests existent, implémentation pas encore)
2. **GREEN**: Implémenter le minimum pour passer les tests
   - Commande: `bun test {file}`
   - Expected: PASS
3. **REFACTOR**: Nettoyer en gardant vert
   - Commande: `bun test {file}`
   - Expected: PASS (toujours)

### Agent-Executed QA Scenarios

| Type | Tool | How Agent Verifies |
|------|------|-------------------|
| Backend services | Bash (bun test) | Run unit tests, assert pass |
| Backend build | Bash (bun run build) | Compile, assert no errors |
| Frontend build | Bash (npm run build) | Next.js build, assert no errors |
| Frontend UI | Playwright | Navigate, interact, assert DOM, screenshot |
| Database | Bash (TypeORM migration) | Run migration, assert success |

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Start Immediately):
├── Task 0: Setup test infrastructure & helpers [no dependencies]
└── Task 1: CommissionCalculationService (domain service extraction + TDD) [no dependencies]

Wave 2 (After Wave 1):
├── Task 2: RepriseCalculationService + RecurrenceGenerationService [depends: 1]
├── Task 3: Interface validation ADV (backend + frontend) [depends: 1]
└── Task 5: Système de contestation (entity + workflow) [depends: 0]

Wave 3 (After Wave 2):
├── Task 4: Génération PDF/Excel des bordereaux [depends: 3]
├── Task 6: Dashboard Reporting & KPIs backend [depends: 2]
└── Task 7: Dashboard Reporting & KPIs frontend [depends: 6]

Wave 4 (Final):
├── Task 8: Intégration GenererBordereau avancé [depends: 1, 2, 3, 4]
└── Task 9: Tests E2E & validation globale [depends: all]
```

### Dependency Matrix

| Task | Depends On | Blocks | Can Parallelize With |
|------|------------|--------|---------------------|
| 0 | None | 5 | 1 |
| 1 | None | 2, 3, 8 | 0 |
| 2 | 1 | 6, 8 | 3, 5 |
| 3 | 1 | 4, 8 | 2, 5 |
| 4 | 3 | 8 | 5, 6 |
| 5 | 0 | None | 2, 3, 4 |
| 6 | 2 | 7 | 4, 5 |
| 7 | 6 | 9 | 4, 5 |
| 8 | 1, 2, 3, 4 | 9 | 7 |
| 9 | All | None | None (final) |

### Agent Dispatch Summary

| Wave | Tasks | Recommended Agents |
|------|-------|-------------------|
| 1 | 0, 1 | task(category="deep", load_skills=["microservice-maintainer"]) |
| 2 | 2, 3, 5 | 2→deep, 3→visual-engineering+microservice-maintainer, 5→deep |
| 3 | 4, 6, 7 | 4→deep, 6→deep, 7→visual-engineering |
| 4 | 8, 9 | 8→deep, 9→deep+playwright |

---

## TODOs

---

- [ ] 0. Setup test infrastructure & helpers de calcul

  **What to do**:
  - Vérifier que `bun test` fonctionne dans service-commercial
  - Créer les helpers de test partagés:
    - `src/domain/commercial/services/__tests__/helpers/calculation-helpers.ts` — fonctions utilitaires pour les tests (créer un barème mock, une commission mock, un contrat mock)
    - `src/domain/commercial/services/__tests__/helpers/decimal-helpers.ts` — helpers pour les assertions DECIMAL(12,2) avec tolérance ±0.01€
  - Créer un fichier barrel pour les mocks: `src/domain/commercial/services/__tests__/mocks/index.ts`
  - Vérifier que les imports TypeORM fonctionnent dans les tests (mock du DataSource)
  - Créer un test canary simple qui passe pour valider l'infrastructure

  **Must NOT do**:
  - Ne pas modifier les fichiers de configuration NestJS existants
  - Ne pas installer de nouvelles dépendances (Jest est déjà via NestJS)

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: [`microservice-maintainer`]
    - `microservice-maintainer`: Connaissance du service DDD existant et de ses conventions

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Task 1)
  - **Blocks**: [5]
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `services/service-commercial/package.json` — vérifier les scripts test existants
  - `services/service-commercial/CLAUDE.md` — conventions DDD du service (domain/, infrastructure/, interfaces/)
  - `services/service-commercial/src/domain/commercial/entities/commission.entity.ts` — entity à mocker (75 lignes, DECIMAL 12,2 pour montants)
  - `services/service-commercial/src/domain/commercial/entities/bareme-commission.entity.ts` — entity à mocker (126 lignes, enum TypeCalcul, BaseCalcul)

  **Acceptance Criteria**:
  - [ ] `bun test` dans service-commercial → exécute au moins 1 test et PASS
  - [ ] Fichier helpers/calculation-helpers.ts créé avec fonctions `createMockBareme()`, `createMockCommission()`, `createMockContrat()`
  - [ ] Fichier helpers/decimal-helpers.ts créé avec `expectDecimalEqual(actual, expected, tolerance=0.01)`
  - [ ] Test canary: `src/domain/commercial/services/__tests__/canary.spec.ts` → PASS

  **Agent-Executed QA Scenarios**:

  ```
  Scenario: Test infrastructure works
    Tool: Bash (bun test)
    Preconditions: service-commercial directory exists
    Steps:
      1. cd services/service-commercial
      2. bun test src/domain/commercial/services/__tests__/canary.spec.ts
      3. Assert: exit code 0
      4. Assert: stdout contains "1 passed" or "Tests: 1 passed"
    Expected Result: Canary test passes
    Evidence: Terminal output captured
  ```

  **Commit**: YES
  - Message: `feat(commission): setup test infrastructure and calculation helpers`
  - Files: `services/service-commercial/src/domain/commercial/services/__tests__/**`

---

- [ ] 1. CommissionCalculationService — Extraction et calcul avancé (TDD)

  **What to do**:
  - **RED**: Écrire d'abord les tests pour `CommissionCalculationService`:
    - Test calcul FIXE: barème fixe → retourne montantFixe
    - Test calcul POURCENTAGE: montantBase × taux / 100
    - Test calcul PALIER: trouver le bon palier par seuils, retourner montantPrime
    - Test calcul MIXTE: fixe + pourcentage combinés (CDC section 4.1)
    - Test précision: résultat arrondi au centime (banker's rounding)
    - Test edge: montantBase = 0 → retourne 0
    - Test edge: aucun barème applicable → throw DomainException
    - Test edge: montantBase négatif → throw DomainException
    - Test edge: taux = 0 → retourne 0 (pas d'erreur)
    - Test palier cumulable (CDC section 3.1): primes produits cumulables jusqu'à 1000€
    - Test primes d'équipe par volume (CDC: 100=200€, 200=500€... 1000=2500€)
  - **GREEN**: Implémenter `CommissionCalculationService` dans `src/domain/commercial/services/commission-calculation.service.ts`:
    - Méthode `calculer(contrat, bareme, montantBase): CommissionResult`
    - Méthode `calculerPalier(bareme, montantBase): number`
    - Méthode `calculerMixte(bareme, montantBase): number`
    - Méthode `verifierPrimesVolume(apporteurId, periode, paliers): PrimeResult[]`
    - Utiliser `Decimal` ou string intermédiaire pour la précision
    - Arrondi: `Math.round(value * 100) / 100`
  - **REFACTOR**: Extraire la logique du controller (lignes 620-663) vers le nouveau service. Le controller appelle le service.
  - Enregistrer le service dans le module NestJS `commercial.module.ts`
  - Mettre à jour le controller pour utiliser le service au lieu de la logique inline

  **Must NOT do**:
  - Ne pas supprimer l'ancien code du controller tant que les tests ne passent pas
  - Ne pas modifier les RPCs existants (signature identique)
  - Ne pas toucher aux entités existantes
  - Ne pas implémenter les rétrocessions (hors scope)

  **Recommended Agent Profile**:
  - **Category**: `deep`
  - **Skills**: [`microservice-maintainer`]
    - `microservice-maintainer`: Implémentation de la logique métier dans un service DDD existant avec extraction du controller

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Task 0)
  - **Blocks**: [2, 3, 8]
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `services/service-commercial/src/infrastructure/grpc/commercial/commission.controller.ts:615-663` — Logique de calcul actuelle à extraire (CalculerCommission RPC). Montre les 3 types implémentés (pourcentage, fixe, palier) et le pattern audit log
  - `services/service-commercial/src/domain/commercial/entities/bareme-commission.entity.ts` — Entité barème complète (126 lignes): enum TypeCalcul (FIXE/POURCENTAGE/PALIER/MIXTE), BaseCalcul, champs taux, montant, récurrence, reprise
  - `services/service-commercial/src/domain/commercial/entities/palier-commission.entity.ts` — Entité palier: seuilMin, seuilMax, montantPrime, tauxBonus, cumulable, parPeriode
  - `services/service-commercial/CLAUDE.md` — Conventions DDD: domain services dans `src/domain/commercial/services/`, repository pattern, wiring module

  **Documentation References (CDC)**:
  - Section 4.1 (ligne 157-161): 3 bases de calcul, combinaison possible
  - Section 4.6 (ligne 188-199): Journalisation obligatoire de chaque calcul
  - Section 3.1 (ligne 101-134): Profils VRP/Manager/Directeur/Partenaire — primes produits cumulables, bonus volume
  - Annexe F.5 (ligne 1105-1111): Formule récurrence = `round(base × (taux_recurrence / 100), 2)`

  **Acceptance Criteria**:
  - [ ] Tests RED écrits: `src/domain/commercial/services/__tests__/commission-calculation.service.spec.ts` → au moins 11 tests
  - [ ] `bun test commission-calculation` → FAIL (RED phase confirmée)
  - [ ] Service implémenté: `src/domain/commercial/services/commission-calculation.service.ts`
  - [ ] `bun test commission-calculation` → PASS (11+ tests, 0 failures)
  - [ ] Controller mis à jour: `CalculerCommission` RPC appelle `CommissionCalculationService`
  - [ ] `bun run build` → succès
  - [ ] Calcul MIXTE (fixe + %) fonctionne: 50€ fixe + 5% de 1000€ = 100€
  - [ ] Arrondi: 33.33% de 100.01 = 33.34€ (pas 33.333333)
  - [ ] Edge case: montantBase < 0 → DomainException

  **Agent-Executed QA Scenarios**:

  ```
  Scenario: TDD cycle complet pour calcul commission
    Tool: Bash (bun test)
    Preconditions: Task 0 completed, test infrastructure exists
    Steps:
      1. Verify test file exists: src/domain/commercial/services/__tests__/commission-calculation.service.spec.ts
      2. bun test commission-calculation.service.spec.ts
      3. Assert: 11+ tests pass
      4. Assert: 0 failures
    Expected Result: All commission calculation tests pass
    Evidence: Terminal output captured

  Scenario: Build réussit après extraction
    Tool: Bash (bun run build)
    Preconditions: Service extracted, controller updated
    Steps:
      1. cd services/service-commercial
      2. bun run build
      3. Assert: exit code 0
      4. Assert: no TypeScript errors
    Expected Result: Clean build
    Evidence: Build output captured
  ```

  **Commit**: YES
  - Message: `feat(commission): extract calculation engine to domain service with TDD`
  - Files: `services/service-commercial/src/domain/commercial/services/commission-calculation.service.ts`, `services/service-commercial/src/domain/commercial/services/__tests__/commission-calculation.service.spec.ts`, `services/service-commercial/src/infrastructure/grpc/commercial/commission.controller.ts`
  - Pre-commit: `bun test`

---

- [ ] 2. RepriseCalculationService + RecurrenceGenerationService (TDD)

  **What to do**:
  - **A) RepriseCalculationService** (TDD):
    - **RED**: Tests pour la formule CDC: `reprise_montant = min(Σ commissions_versées_dans_fenêtre, commission_due_période_courante)`
      - Test résiliation infra-annuelle (3 mois) → reprise 100% commissions versées
      - Test résiliation avec fenêtre 12 mois assurance
      - Test impayé → suspension récurrence + ligne reprise
      - Test régularisation positive (impayé soldé → création ligne positive automatique)
      - Test report négatif: (brut - reprises - acomptes) < 0 → report sur période suivante
      - Test edge: aucune commission dans la fenêtre → reprise = 0
      - Test edge: fenêtre = 0 → throw DomainException
    - **GREEN**: Implémenter `src/domain/commercial/services/reprise-calculation.service.ts`
      - Méthode `calculerReprise(contratId, typeReprise, fenetre, periodeActuelle): RepriseResult`
      - Méthode `calculerReportNegatif(apporteurId, periode, brut, reprises, acomptes): ReportResult`
      - Méthode `genererRegularisation(repriseOriginale): RegularisationResult`
    - **REFACTOR**: Mettre à jour `DeclencherReprise` dans le controller (actuellement stub avec montants à 0)

  - **B) RecurrenceGenerationService** (TDD):
    - **RED**: Tests basés sur Annexe F du CDC:
      - Test: échéance réglée → création ligne récurrente
      - Test: échéance échue non réglée → aucune ligne
      - Test: contrat résilié → aucune récurrence post-résiliation
      - Test: durée max atteinte (mois > dureeRecurrenceMois) → stop
      - Test: durée illimitée (null) → continue
      - Test: changement barème → version en vigueur à date d'encaissement (non rétroactif)
      - Test: formule `round(base × (taux_recurrence / 100), 2)`
    - **GREEN**: Implémenter `src/domain/commercial/services/recurrence-generation.service.ts`
      - Méthode `genererRecurrence(contratId, echeanceId, dateEncaissement): RecurrenceResult`
      - Méthode `suspendreRecurrences(contratId, motif): void`
      - Méthode `verifierEligibilite(contrat, bareme, periode): boolean`

  **Must NOT do**:
  - Ne pas modifier l'entity RepriseCommissionEntity (structure existante suffisante)
  - Ne pas modifier l'entity CommissionRecurrenteEntity (structure existante suffisante)
  - Ne pas implémenter les rétrocessions multi-niveaux (hors scope)
  - Ne pas toucher à la table reports_negatifs (juste créer des entrées via le service existant)

  **Recommended Agent Profile**:
  - **Category**: `deep`
  - **Skills**: [`microservice-maintainer`]
    - `microservice-maintainer`: Logique métier complexe dans un service DDD existant

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 3, 5)
  - **Blocks**: [6, 8]
  - **Blocked By**: [1]

  **References**:

  **Pattern References**:
  - `services/service-commercial/src/infrastructure/grpc/commercial/commission.controller.ts:685-700` — Stub DeclencherReprise actuel (montants à 0, à remplacer)
  - `services/service-commercial/src/domain/commercial/entities/reprise-commission.entity.ts` — Entity reprise (98 lignes): TypeReprise enum, StatutReprise, montantReprise, fenêtre, période
  - `services/service-commercial/src/domain/commercial/entities/commission-recurrente.entity.ts` — Entity récurrence (84 lignes): baremeVersion, montantBase, tauxRecurrence, montantCalcule, statutRecurrence
  - `services/service-commercial/src/infrastructure/persistence/typeorm/repositories/commercial/reprise.service.ts` — Repository reprise existant
  - `services/service-commercial/src/infrastructure/persistence/typeorm/repositories/commercial/commission-recurrente.service.ts` — Repository récurrence existant
  - `services/service-commercial/src/infrastructure/persistence/typeorm/repositories/commercial/report-negatif.service.ts` — Repository report négatif existant

  **Documentation References (CDC)**:
  - Section 4.4 (ligne 177-182): Reprises automatiques — formule, report négatif, régularisation
  - Section 4.3 (ligne 171-175): Récurrence — stop auto, version barème, traçabilité
  - Annexe F (lignes 1057-1145): Logique détaillée récurrence — pseudo-SQL éligibilité, formule, versionning, cas particuliers
  - Annexe G (lignes 1146-1205): Logique détaillée reprises — fenêtres (3/6/12 mois), reports négatifs, régularisation

  **Acceptance Criteria**:
  - [ ] `bun test reprise-calculation` → PASS (7+ tests, 0 failures)
  - [ ] `bun test recurrence-generation` → PASS (7+ tests, 0 failures)
  - [ ] Formule reprise: min(Σ versées dans fenêtre, due période) correctement implémentée
  - [ ] Report négatif: (500 brut - 700 reprise - 0 acompte) = -200 → report 200€ sur période suivante
  - [ ] Récurrence: 1000 HT × 3% = 30.00€ (arrondi centime)
  - [ ] Régularisation: impayé soldé → ligne positive créée automatiquement
  - [ ] Controller DeclencherReprise utilise RepriseCalculationService (plus de montants à 0)
  - [ ] `bun run build` → succès

  **Agent-Executed QA Scenarios**:

  ```
  Scenario: Formule de reprise CDC
    Tool: Bash (bun test)
    Steps:
      1. bun test reprise-calculation.service.spec.ts
      2. Assert: test "résiliation infra-annuelle" passes
      3. Assert: test "report négatif" passes
      4. Assert: test "régularisation positive" passes
    Expected Result: All reprise calculation tests pass
    Evidence: Terminal output

  Scenario: Récurrence auto-stop sur résiliation
    Tool: Bash (bun test)
    Steps:
      1. bun test recurrence-generation.service.spec.ts
      2. Assert: test "contrat résilié stop récurrence" passes
      3. Assert: test "durée max atteinte" passes
    Expected Result: All recurrence tests pass
    Evidence: Terminal output
  ```

  **Commit**: YES
  - Message: `feat(commission): implement reprise calculation and recurrence generation with TDD`
  - Files: `services/service-commercial/src/domain/commercial/services/reprise-calculation.service.ts`, `services/service-commercial/src/domain/commercial/services/recurrence-generation.service.ts`, tests
  - Pre-commit: `bun test`

---

- [ ] 3. Interface de validation ADV — Backend + Frontend

  **What to do**:
  
  **A) Backend — Nouveaux RPCs gRPC** (ne pas modifier les existants):
  - Ajouter dans `commission.proto`:
    - `rpc PreselectionnerLignes(PreselectionRequest) returns (PreselectionResponse)` — auto-sélection des lignes éligibles (contrat validé CQ + échéance encaissée + statut commission "a_payer")
    - `rpc RecalculerTotauxBordereau(RecalculerTotauxRequest) returns (TotauxResponse)` — recalcul dynamique Brut/Reprises/Net/Reports basé sur lignes sélectionnées
    - `rpc ValiderBordereauFinal(ValiderBordereauFinalRequest) returns (ValiderBordereauFinalResponse)` — validation finale avec verrouillage (horodatage, ID unique, gel des lignes), refuser si bordereau déjà validé (antidoublon)
    - `rpc GetLignesForValidation(GetLignesForValidationRequest) returns (GetLignesForValidationResponse)` — liste paginée des lignes avec infos enrichies pour l'ADV
  - Implémenter les handlers dans le controller ou un nouveau service `BordereauValidationService`
  - Verrouillage optimiste: vérifier `statut_bordereau !== 'valide'` avant validation
  - Audit log: chaque (dé)sélection manuelle enregistrée avec motif

  **B) Frontend — Page dédiée /commissions/validation**:
  - Créer `frontend/src/app/(main)/commissions/validation/page.tsx` (server component)
  - Créer `frontend/src/app/(main)/commissions/validation/validation-page-client.tsx`
  - Composants:
    - `ValidationFilters` — filtres par période, produit, société, apporteur, statut
    - `ValidationTable` — TanStack Table avec colonnes: checkbox, contrat, client, produit, brut, reprise, net, statut, version barème
    - `TotauxDynamiques` — barre fixe en bas avec Brut/Reprises/Net/Reports, mise à jour en temps réel
    - `MotifDeselectionDialog` — déjà existant (`deselection-reason-dialog.tsx`), à intégrer
    - `ValiderBordereauButton` — bouton de validation finale avec confirmation
  - Comportement:
    - Au chargement: appeler `PreselectionnerLignes` pour pré-cocher les éligibles
    - Chaque (dé)cochage → appel `RecalculerTotauxBordereau` → mise à jour `TotauxDynamiques`
    - Désélection → ouvre MotifDeselectionDialog → motif obligatoire
    - Bouton Valider → confirmation dialog → appel `ValiderBordereauFinal` → verrouillage → redirect vers bordereau
  - Ajouter la route dans la sidebar (navigation-items)

  **Must NOT do**:
  - Ne pas modifier les RPCs `ValidateBordereau` et `ValidateLigne` existants
  - Ne pas créer un système RBAC dédié (hérité du CRM)
  - Ne pas implémenter l'email de notification (hors scope)
  - Ne pas modifier le composant `bordereaux-list.tsx` existant
  - Ne pas ajouter de websocket pour le recalcul temps réel (polling ou optimistic update suffisent)

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: [`microservice-maintainer`, `frontend-ui-ux`]
    - `microservice-maintainer`: Pour les RPCs backend et la logique de validation
    - `frontend-ui-ux`: Pour l'interface ADV complète avec TanStack Table, totaux dynamiques, UX fluide

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 2, 5)
  - **Blocks**: [4, 8]
  - **Blocked By**: [1]

  **References**:

  **Pattern References**:
  - `services/service-commercial/src/domain/commercial/entities/ligne-bordereau.entity.ts` — Entity ligne (113 lignes): StatutLigne enum (SELECTIONNEE/DESELECTIONNEE/VALIDEE/REJETEE), selectionne boolean, motifDeselection
  - `services/service-commercial/src/domain/commercial/entities/bordereau-commission.entity.ts` — Entity bordereau (93 lignes): StatutBordereau enum, dateValidation, validateurId, fichierPdfUrl, fichierExcelUrl
  - `services/service-commercial/src/infrastructure/grpc/commercial/commission.controller.ts:665-683` — GenererBordereau actuel (stub vide)
  - `packages/proto/src/commission/commission.proto` — Proto existant à étendre (pas modifier)
  - `frontend/src/app/(main)/commissions/commissions-page-client.tsx` — Page commissions existante (pattern de tabs, filtres, server actions)
  - `frontend/src/components/commissions/deselection-reason-dialog.tsx` — Dialog motif désélection existant, à réutiliser
  - `frontend/src/components/commissions/bordereaux-list.tsx` — Pattern existant pour listes de bordereaux
  - `frontend/src/components/data-table-basic.tsx` — Composant TanStack Table wrapper à utiliser
  - `frontend/CLAUDE.md` — Conventions frontend: Shadcn UI, React Hook Form, TanStack Table, path aliases

  **Documentation References (CDC)**:
  - Section 7.1-7.6 (lignes 309-338): Interface ADV complète — cases à cocher, filtres, présélection, motif, verrouillage, SHA-256
  - Annexe E.2 (lignes 1007-1022): Spécifications UX bordereau — filtres, tableau, totaux, boutons, couleurs statut

  **Acceptance Criteria**:
  - [ ] Proto: 4 nouveaux RPCs ajoutés (PreselectionnerLignes, RecalculerTotauxBordereau, ValiderBordereauFinal, GetLignesForValidation)
  - [ ] Backend: Présélection auto des lignes éligibles (validé CQ + encaissé + a_payer)
  - [ ] Backend: Antidoublon — impossible de valider un bordereau déjà validé → erreur gRPC ALREADY_EXISTS
  - [ ] Backend: Motif obligatoire sur désélection → erreur si motif vide
  - [ ] Frontend: Page /commissions/validation accessible
  - [ ] Frontend: Tableau TanStack avec checkboxes fonctionnelles
  - [ ] Frontend: Totaux dynamiques recalculés à chaque (dé)cochage
  - [ ] Frontend: Dialog motif affiché sur désélection
  - [ ] Frontend: Bouton Valider grisé si aucune ligne sélectionnée
  - [ ] `bun run build` backend → succès
  - [ ] `npm run build` frontend → succès

  **Agent-Executed QA Scenarios**:

  ```
  Scenario: Page validation ADV charge correctement
    Tool: Playwright (playwright skill)
    Preconditions: Dev servers running (backend 3001, frontend 3000)
    Steps:
      1. Navigate to: http://localhost:3000/commissions/validation
      2. Wait for: table visible (timeout: 10s)
      3. Assert: Filtres période/produit/apporteur visibles
      4. Assert: Totaux Brut/Reprises/Net affichés en pied de page
      5. Screenshot: .sisyphus/evidence/task-3-validation-page.png
    Expected Result: Page ADV avec tableau et totaux
    Evidence: .sisyphus/evidence/task-3-validation-page.png

  Scenario: Désélection avec motif obligatoire
    Tool: Playwright (playwright skill)
    Steps:
      1. Click checkbox d'une ligne sélectionnée pour décocher
      2. Wait for: dialog motif visible (timeout: 3s)
      3. Assert: Bouton confirmer désactivé tant que motif vide
      4. Fill: textarea motif → "Dossier en vérification"
      5. Click: Confirmer
      6. Assert: Ligne décochée, totaux mis à jour
      7. Screenshot: .sisyphus/evidence/task-3-deselection.png
    Expected Result: Motif enregistré, totaux recalculés
    Evidence: .sisyphus/evidence/task-3-deselection.png

  Scenario: Validation finale verrouille le bordereau
    Tool: Playwright (playwright skill)
    Steps:
      1. Sélectionner au moins 1 ligne
      2. Click: "Valider le bordereau"
      3. Wait for: dialog confirmation
      4. Click: "Confirmer la validation"
      5. Assert: Toast "Bordereau validé" ou redirect
      6. Assert: Lignes en lecture seule (checkboxes désactivées)
    Expected Result: Bordereau verrouillé
    Evidence: .sisyphus/evidence/task-3-validation-finale.png
  ```

  **Commit**: YES
  - Message: `feat(commission): implement ADV validation interface with pre-selection and locking`
  - Files: `packages/proto/src/commission/commission.proto`, `services/service-commercial/src/**`, `frontend/src/app/(main)/commissions/validation/**`, `frontend/src/components/commissions/validation-*`
  - Pre-commit: `bun test && npm run build`

---

- [ ] 4. Génération PDF/Excel des bordereaux (Backend)

  **What to do**:
  - Installer les dépendances dans service-commercial: `pdfkit` (pour PDF) et `exceljs` (pour Excel)
  - Créer `src/domain/commercial/services/bordereau-export.service.ts`:
    - Méthode `genererPDF(bordereau, lignes): Buffer` — format CDC Annexe H:
      - Page 1: En-tête Winvest Capital, totaux (Brut/Reprises/Net/Reports), période, société
      - Pages suivantes: Section Linéaire (une ligne par contrat/échéance)
      - Section Reprises (montants négatifs, motifs, périodes origine)
      - Pied de page: hash SHA-256, horodatage, pagination
    - Méthode `genererExcel(bordereau, lignes): Buffer` — format CDC Annexe H:
      - Onglet "Total": graphique Brut/Reprises/Net
      - Onglet "Linéaire": tableau filtrable avec colonnes CDC (contrat, client, produit, formule, cotisation HT, base, taux, brut, reprise, acompte, net, statut, version barème)
      - Onglet "Reprises": montants négatifs en rouge
    - Méthode `calculerHashSHA256(buffer): string`
  - Créer `src/domain/commercial/services/bordereau-file-storage.service.ts`:
    - Sauvegarder les fichiers dans `/uploads/bordereaux/{societe}/{annee}/`
    - Nommage CDC: `Bordereau_Commissions_{Societe}_{YYYY-MM}.pdf` / `.xlsx`
    - Mettre à jour `fichierPdfUrl` et `fichierExcelUrl` dans l'entity bordereau
    - Stocker le hash dans un nouveau champ (ou commentaire du bordereau)
  - Ajouter RPC: `rpc ExportBordereauFiles(ExportBordereauRequest) returns (ExportBordereauResponse)` dans le proto
  - Implémenter le handler qui appelle les services de génération
  - Migration: Ajouter colonne `hash_sha256 VARCHAR(64)` sur la table `bordereaux_commission`

  **Must NOT do**:
  - Ne pas utiliser Puppeteer/headless Chrome (trop lourd, PDFKit suffit)
  - Ne pas créer de template engine HTML → PDF (format fixe suffit)
  - Ne pas implémenter l'envoi SFTP (hors scope)
  - Ne pas modifier l'entity bordereau existante au-delà de l'ajout hash_sha256
  - Ne pas implémenter la signature numérique (hash SHA-256 suffit pour cette phase)

  **Recommended Agent Profile**:
  - **Category**: `deep`
  - **Skills**: [`microservice-maintainer`]
    - `microservice-maintainer`: Création de services dans le contexte DDD existant + migration

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Tasks 6, 7)
  - **Blocks**: [8]
  - **Blocked By**: [3]

  **References**:

  **Pattern References**:
  - `services/service-commercial/src/domain/commercial/entities/bordereau-commission.entity.ts:72-76` — Champs fichierPdfUrl et fichierExcelUrl déjà présents mais toujours null
  - `services/service-commercial/src/domain/commercial/entities/ligne-bordereau.entity.ts` — Colonnes exactes à exporter: contratReference, clientNom, produitNom, montantBrut, montantReprise, montantNet, baseCalcul, tauxApplique, typeLigne
  - `services/service-commercial/src/migrations/` — Pattern de migration TypeORM existant

  **Documentation References (CDC)**:
  - Annexe H (lignes 1266-1387): Format bordereau PDF/Excel — 3 sections (Total, Linéaire, Reprises), colonnes exactes, nommage fichiers, contrôles avant export
  - Section 8.1 (lignes 341-349): Formats PDF et Excel synchrones, même contenu
  - Section 7.6 (lignes 334-338): Hash SHA-256 obligatoire, archivage automatique

  **External References**:
  - PDFKit: `https://pdfkit.org/` — API pour création PDF programmatique en Node.js
  - ExcelJS: `https://github.com/exceljs/exceljs` — Création Excel avec onglets, styles, graphiques

  **Acceptance Criteria**:
  - [ ] `pdfkit` et `exceljs` installés dans package.json service-commercial
  - [ ] `bordereau-export.service.ts` créé avec genererPDF() et genererExcel()
  - [ ] PDF généré contient: en-tête, totaux, section linéaire, section reprises, hash, pagination
  - [ ] Excel généré contient: 3 onglets (Total, Linéaire, Reprises), reprises en rouge
  - [ ] Hash SHA-256 calculé et stocké dans bordereau
  - [ ] Fichiers sauvegardés avec nommage CDC: `Bordereau_Commissions_{Societe}_{YYYY-MM}.pdf`
  - [ ] Migration ajoutant `hash_sha256` sur bordereaux_commission exécutée
  - [ ] Nouveau RPC `ExportBordereauFiles` dans proto et implémenté
  - [ ] `bun test bordereau-export` → PASS (tests TDD)
  - [ ] `bun run build` → succès

  **Agent-Executed QA Scenarios**:

  ```
  Scenario: Génération PDF avec contenu correct
    Tool: Bash (bun test)
    Steps:
      1. bun test bordereau-export.service.spec.ts
      2. Assert: test "génère PDF avec sections Total/Linéaire/Reprises" passes
      3. Assert: test "hash SHA-256 calculé" passes
      4. Assert: test "nommage fichier correct" passes
    Expected Result: PDF generation tests pass
    Evidence: Terminal output

  Scenario: Génération Excel avec onglets
    Tool: Bash (bun test)
    Steps:
      1. Assert: test "Excel avec 3 onglets" passes
      2. Assert: test "onglet Reprises montants négatifs" passes
      3. Assert: test "colonnes conformes CDC" passes
    Expected Result: Excel generation tests pass
    Evidence: Terminal output

  Scenario: Migration hash_sha256
    Tool: Bash
    Steps:
      1. Run TypeORM migration in service-commercial
      2. Assert: colonne hash_sha256 ajoutée à bordereaux_commission
      3. Assert: migration réversible (down fonctionne)
    Expected Result: Migration successful
    Evidence: Migration output
  ```

  **Commit**: YES
  - Message: `feat(commission): implement PDF/Excel bordereau generation with SHA-256 hash`
  - Files: `services/service-commercial/src/domain/commercial/services/bordereau-export.service.ts`, `services/service-commercial/src/domain/commercial/services/bordereau-file-storage.service.ts`, migration, proto
  - Pre-commit: `bun test`

---

- [ ] 5. Système de contestation

  **What to do**:
  - **A) Ajouter le statut "contestee"** dans le référentiel statuts_commission (via seed ou migration)
  - **B) Créer l'entity ContestationCommission**:
    - `src/domain/commercial/entities/contestation-commission.entity.ts`
    - Champs: id, organisationId, commissionId, bordereauId, apporteurId, motif, dateContestation, dateLimite (datePublication + 2 mois), statut (en_cours, acceptee, rejetee), commentaireResolution, resoluPar, dateResolution, ligneRegularisationId (nullable)
    - Migration pour créer la table `contestations_commission`
  - **C) RPCs gRPC** (ajouter au proto):
    - `rpc CreerContestation(CreerContestationRequest) returns (ContestationResponse)` — vérifie délai 2 mois, crée contestation en statut "en_cours", met commission en statut "contestee"
    - `rpc GetContestations(GetContestationsRequest) returns (GetContestationsResponse)` — liste avec filtres
    - `rpc ResoudreContestation(ResoudreContestationRequest) returns (ContestationResponse)` — accepter ou rejeter, commentaire obligatoire, si acceptée → génération automatique ligne régularisation via RepriseCalculationService
  - **D) Frontend**:
    - `ContestationsList` composant dans la page commissions (nouvel onglet "Contestations")
    - `CreerContestationDialog` — formulaire avec motif obligatoire
    - `ResoudreContestationDialog` — accepter/rejeter avec commentaire
    - Badge "Contestée" dans les listes de commissions existantes

  **Must NOT do**:
  - Ne pas créer de système de notifications email pour les contestations (hors scope)
  - Ne pas modifier le workflow existant des commissions
  - Ne pas implémenter d'interface partenaire/commercial pour contester (back-office ADV uniquement pour cette phase)

  **Recommended Agent Profile**:
  - **Category**: `deep`
  - **Skills**: [`microservice-maintainer`, `frontend-ui-ux`]
    - `microservice-maintainer`: Nouvelle entity, migration, RPCs
    - `frontend-ui-ux`: Composants contestation dans l'UI existante

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 2, 3)
  - **Blocks**: None
  - **Blocked By**: [0]

  **References**:

  **Pattern References**:
  - `services/service-commercial/src/domain/commercial/entities/reprise-commission.entity.ts` — Pattern d'entity avec enum statut, TypeORM decorators (à suivre pour ContestationEntity)
  - `services/service-commercial/src/domain/commercial/entities/statut-commission.entity.ts` — Référentiel statuts existant (ajouter "contestee")
  - `services/service-commercial/src/infrastructure/persistence/typeorm/repositories/commercial/reprise.service.ts` — Pattern de repository service TypeORM
  - `services/service-commercial/src/migrations/` — Pattern de migration
  - `frontend/src/components/commissions/reprises-list.tsx` — Pattern de composant liste pour les contestations

  **Documentation References (CDC)**:
  - Section 5.5 (lignes 276-283): Workflow contestation — délai 2 mois, statut Contestée, notification ADV, validation/rejet, régularisation automatique
  - Annexe B.2b (lignes 757-758): Clause contractuelle — délai 2 mois, bordereau réputé définitif passé ce délai

  **Acceptance Criteria**:
  - [ ] Statut "contestee" ajouté au référentiel
  - [ ] Entity ContestationCommission créée avec tous les champs
  - [ ] Migration `contestations_commission` exécutée
  - [ ] 3 RPCs ajoutés (CreerContestation, GetContestations, ResoudreContestation)
  - [ ] Vérification délai 2 mois: contestation après délai → erreur DEADLINE_EXCEEDED
  - [ ] Résolution acceptée → ligne régularisation automatique créée
  - [ ] Résolution rejetée → commentaire obligatoire, commission revient en statut précédent
  - [ ] Frontend: Onglet "Contestations" dans la page commissions
  - [ ] `bun test contestation` → PASS
  - [ ] `bun run build` et `npm run build` → succès

  **Agent-Executed QA Scenarios**:

  ```
  Scenario: Création contestation dans le délai
    Tool: Bash (bun test)
    Steps:
      1. bun test contestation.service.spec.ts
      2. Assert: test "contestation dans délai 2 mois → créée" passes
      3. Assert: test "contestation hors délai → erreur" passes
      4. Assert: test "résolution acceptée → régularisation" passes
    Expected Result: All contestation tests pass
    Evidence: Terminal output

  Scenario: UI contestation
    Tool: Playwright (playwright skill)
    Steps:
      1. Navigate to: http://localhost:3000/commissions
      2. Click: onglet "Contestations"
      3. Assert: liste (vide ou avec données) affichée
      4. Screenshot: .sisyphus/evidence/task-5-contestations.png
    Expected Result: Onglet contestations fonctionnel
    Evidence: .sisyphus/evidence/task-5-contestations.png
  ```

  **Commit**: YES
  - Message: `feat(commission): implement contestation system with 2-month deadline and auto-regularization`
  - Files: `services/service-commercial/src/domain/commercial/entities/contestation-commission.entity.ts`, migration, proto, services, frontend components
  - Pre-commit: `bun test`

---

- [ ] 6. Dashboard Reporting & KPIs — Backend

  **What to do**:
  - Créer `src/domain/commercial/services/snapshot-kpi.service.ts`:
    - Méthode `genererSnapshot(periode, organisationId): SnapshotKpi` — calcule et persiste:
      - Total brut, total reprises, total net, récurrence, taux de reprise (%)
      - Nombre contrats validés, production par équipe (agrégation apporteur)
      - Délai moyen validation ADV (diff date CQ → date validation)
    - Méthode `getKpiDashboard(organisationId, filters): DashboardKpiResponse` — KPIs consolidés avec filtres
    - Méthode `getComparatifs(organisationId, periodeA, periodeB): ComparatifsResponse`
  - Ajouter RPCs gRPC:
    - `rpc GetDashboardKpi(GetDashboardKpiRequest) returns (DashboardKpiResponse)` — KPIs avec filtres période/produit/apporteur
    - `rpc GenererSnapshotKpi(GenererSnapshotRequest) returns (SnapshotKpiResponse)` — génération manuelle
    - `rpc GetComparatifs(GetComparatifsRequest) returns (ComparatifsResponse)` — comparatif temporel et par produit
    - `rpc ExportAnalytique(ExportAnalytiqueRequest) returns (ExportAnalytiqueResponse)` — export CSV/Excel consolidé
  - Implémenter l'alimentation automatique du snapshot à la validation du bordereau (appeler `genererSnapshot` dans le flow `ValiderBordereauFinal`)
  - Utiliser la table `snapshots_kpi` existante (kpi_json pour le payload)

  **Must NOT do**:
  - Ne pas créer de nouvelles tables (snapshots_kpi existe déjà)
  - Ne pas implémenter d'export automatique programmé (cron) — manuel seulement
  - Ne pas implémenter d'exports vers direction/RH automatiques
  - Ne pas ajouter de BI/analytics avancé (agrégations simples via SQL suffisent)

  **Recommended Agent Profile**:
  - **Category**: `deep`
  - **Skills**: [`microservice-maintainer`]
    - `microservice-maintainer`: Service de reporting dans le contexte DDD existant

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Tasks 4, 7)
  - **Blocks**: [7]
  - **Blocked By**: [2]

  **References**:

  **Pattern References**:
  - `services/service-commercial/src/migrations/1737800000000-CreateAuditRecurrenceReportTables.ts` — Table snapshots_kpi créée ici (id, organisationId, periode, societe, equipeId, apporteurId, kpiJson, createdAt)
  - `services/service-commercial/src/infrastructure/persistence/typeorm/repositories/commercial/commission.service.ts` — Requêtes commission existantes (findByPeriode, findByApporteur)
  - `services/service-commercial/src/infrastructure/persistence/typeorm/repositories/commercial/bordereau.service.ts` — Requêtes bordereau (findByPeriode)

  **Documentation References (CDC)**:
  - Section 9.1-9.5 (lignes 422-478): Tableaux de bord, KPIs, comparatifs, snapshots, exports analytiques
  - Annexe I (lignes 1388-1489): KPIs détaillés — structure snapshots_kpi, formules, droits d'accès

  **Acceptance Criteria**:
  - [ ] `snapshot-kpi.service.ts` créé avec genererSnapshot(), getKpiDashboard(), getComparatifs()
  - [ ] 4 RPCs ajoutés dans proto et implémentés
  - [ ] KPIs calculés: brut, net, reprises, récurrence, taux_reprise, volume, délai_validation
  - [ ] Snapshot auto-alimenté à la validation du bordereau
  - [ ] Comparatif temporel: M-1, M-3, M-12 fonctionnel
  - [ ] `bun test snapshot-kpi` → PASS
  - [ ] `bun run build` → succès

  **Agent-Executed QA Scenarios**:

  ```
  Scenario: Calcul KPIs correct
    Tool: Bash (bun test)
    Steps:
      1. bun test snapshot-kpi.service.spec.ts
      2. Assert: test "taux reprise = reprises/brut * 100" passes
      3. Assert: test "snapshot créé à validation bordereau" passes
      4. Assert: test "comparatif M-1 calcule delta" passes
    Expected Result: KPI calculation tests pass
    Evidence: Terminal output
  ```

  **Commit**: YES
  - Message: `feat(commission): implement KPI snapshot service and reporting RPCs`
  - Files: `services/service-commercial/src/domain/commercial/services/snapshot-kpi.service.ts`, proto, tests
  - Pre-commit: `bun test`

---

- [ ] 7. Dashboard Reporting & KPIs — Frontend

  **What to do**:
  - Créer page `/commissions/reporting/page.tsx` et `reporting-page-client.tsx`
  - Composants:
    - `KpiCards` — 6 cartes KPI en haut: Brut, Net, Reprises, Récurrence, Taux reprise, Volume contrats
    - `ProductionChart` — Recharts BarChart: production par produit
    - `TrendChart` — Recharts LineChart: courbe Brut/Net/Reprises sur 12 mois glissants
    - `RepriseHeatmap` — Recharts: taux de reprise par apporteur (heatmap ou bar)
    - `ComparatifsTable` — Tableau comparatif M-1, M-3, M-12 avec deltas colorés (vert +, rouge -)
    - `TopApporteurs` — Classement des meilleurs commerciaux par net encaissé
    - `ReportingFilters` — Filtres: période, produit, société, apporteur
    - `ExportButton` — Bouton export CSV/Excel via RPC ExportAnalytique
  - Utiliser les composants Recharts existants du projet comme patterns
  - Server actions pour appeler les RPCs backend (GetDashboardKpi, GetComparatifs)
  - Ajouter la route dans la navigation sidebar

  **Must NOT do**:
  - Ne pas créer de dashboard temps réel (websocket) — rechargement au filtre suffit
  - Ne pas implémenter de scheduled export
  - Ne pas créer de vue individuelle commercial (phase 2 extranet)

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: [`frontend-ui-ux`]
    - `frontend-ui-ux`: Dashboard visuel riche avec graphiques Recharts, cards KPI, design cohérent

  **Parallelization**:
  - **Can Run In Parallel**: NO (depends on Task 6 backend)
  - **Parallel Group**: Sequential after Task 6
  - **Blocks**: [9]
  - **Blocked By**: [6]

  **References**:

  **Pattern References**:
  - `frontend/src/app/(main)/commissions/commissions-page-client.tsx` — Pattern de page commissions existante (tabs, filtres, server actions, data fetching)
  - `frontend/CLAUDE.md` — Conventions: Recharts pour charts, Shadcn UI pour components, TanStack Table pour tableaux
  - `frontend/src/components/ui/card.tsx` — Card component Shadcn pour les KPI cards
  - `frontend/src/app/(main)/page.tsx` — Dashboard home (pattern de cartes KPI et graphiques à suivre)

  **Documentation References (CDC)**:
  - Section 9.1 (lignes 424-430): Filtres multi-critères, graphiques interactifs, totaux instantanés
  - Section 9.2 (lignes 431-459): KPIs: brut, reprises, net, récurrence, taux reprise, production équipe, délai moyen ADV
  - Section 9.3 (lignes 460-466): Comparatifs: temporel, produit, apporteur, direction
  - Annexe I.3 (lignes 1429-1438): Visualisations: courbe 12 mois, histogramme produits, heatmap reprises, camembert sociétés

  **Acceptance Criteria**:
  - [ ] Page /commissions/reporting accessible et affiche des KPIs
  - [ ] 6 KPI cards affichées (brut, net, reprises, récurrence, taux reprise, volume)
  - [ ] Graphique courbe 12 mois (Brut/Net/Reprises) via Recharts
  - [ ] Tableau comparatif avec deltas colorés
  - [ ] Filtres période/produit/apporteur fonctionnels
  - [ ] Bouton export CSV/Excel fonctionnel
  - [ ] Route ajoutée dans la navigation sidebar
  - [ ] `npm run build` → succès

  **Agent-Executed QA Scenarios**:

  ```
  Scenario: Dashboard reporting charge avec KPIs
    Tool: Playwright (playwright skill)
    Preconditions: Backend running avec données de test
    Steps:
      1. Navigate to: http://localhost:3000/commissions/reporting
      2. Wait for: .kpi-card visible (timeout: 10s)
      3. Assert: 6 KPI cards affichées
      4. Assert: Au moins 1 graphique Recharts rendu (svg element)
      5. Screenshot: .sisyphus/evidence/task-7-dashboard.png
    Expected Result: Dashboard avec KPIs et graphiques
    Evidence: .sisyphus/evidence/task-7-dashboard.png

  Scenario: Filtrage par période
    Tool: Playwright (playwright skill)
    Steps:
      1. Select période: "2025-03"
      2. Wait for: données rechargées (spinner disparaît)
      3. Assert: KPI cards mises à jour
      4. Assert: Graphiques reflètent la période sélectionnée
      5. Screenshot: .sisyphus/evidence/task-7-filter.png
    Expected Result: Données filtrées correctement
    Evidence: .sisyphus/evidence/task-7-filter.png
  ```

  **Commit**: YES
  - Message: `feat(commission): implement reporting dashboard with KPIs charts and comparatives`
  - Files: `frontend/src/app/(main)/commissions/reporting/**`, `frontend/src/components/commissions/reporting-*`
  - Pre-commit: `npm run build`

---

- [ ] 8. Intégration GenererBordereau avancé

  **What to do**:
  - Réécrire le RPC `GenererBordereau` (actuellement stub) pour intégrer tous les services:
    1. Appeler `CommissionCalculationService` pour calculer les commissions de la période
    2. Appeler `RepriseCalculationService` pour vérifier et appliquer les reprises
    3. Appeler `RecurrenceGenerationService` pour générer les récurrences
    4. Créer le bordereau avec toutes les lignes (commissions + reprises + récurrences)
    5. Auto-présélectionner les lignes éligibles
    6. Calculer les totaux (brut, reprises, acomptes, net)
    7. Logger l'audit complet
  - Tester le flow complet: contrat validé → calcul → bordereau avec lignes
  - S'assurer que les reprises reportées des périodes précédentes sont incluses
  - Intégrer la génération PDF/Excel (Task 4) dans le flow ExportBordereau

  **Must NOT do**:
  - Ne pas modifier la signature du RPC existant GenererBordereau
  - Ne pas casser le flow existant de création bordereau vide

  **Recommended Agent Profile**:
  - **Category**: `deep`
  - **Skills**: [`microservice-maintainer`]
    - `microservice-maintainer`: Orchestration de services dans un contexte DDD complexe

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Sequential (Wave 4)
  - **Blocks**: [9]
  - **Blocked By**: [1, 2, 3, 4]

  **References**:

  **Pattern References**:
  - `services/service-commercial/src/infrastructure/grpc/commercial/commission.controller.ts:665-683` — GenererBordereau actuel (stub vide, crée bordereau sans lignes)
  - Tous les services créés dans Tasks 1-4

  **Documentation References (CDC)**:
  - Section 6 (lignes 285-307): Processus métier 8 étapes — flow complet du calcul à l'archivage
  - Section 2.3 (lignes 79-98): Workflow complet — CQ → Engine → ADV → Bordereau → Export → Archive

  **Acceptance Criteria**:
  - [ ] GenererBordereau crée un bordereau AVEC lignes (pas vide)
  - [ ] Commissions calculées automatiquement pour la période
  - [ ] Reprises appliquées automatiquement (résiliations, impayés dans fenêtre)
  - [ ] Récurrences générées pour contrats actifs encaissés
  - [ ] Reports négatifs des périodes précédentes inclus
  - [ ] Totaux calculés correctement (brut, reprises, acomptes, net)
  - [ ] `bun test generer-bordereau-integration` → PASS
  - [ ] `bun run build` → succès

  **Agent-Executed QA Scenarios**:

  ```
  Scenario: Génération bordereau avec calcul complet
    Tool: Bash (bun test)
    Steps:
      1. bun test generer-bordereau-integration.spec.ts
      2. Assert: test "bordereau contient lignes commissions" passes
      3. Assert: test "reprises auto-appliquées" passes
      4. Assert: test "récurrences incluses" passes
      5. Assert: test "totaux corrects" passes
    Expected Result: Integration tests pass
    Evidence: Terminal output
  ```

  **Commit**: YES
  - Message: `feat(commission): integrate all services into GenererBordereau for complete workflow`
  - Files: `services/service-commercial/src/infrastructure/grpc/commercial/commission.controller.ts`, tests
  - Pre-commit: `bun test`

---

- [ ] 9. Tests E2E & validation globale

  **What to do**:
  - Vérifier que tous les tests unitaires passent: `bun test` (service-commercial complet)
  - Vérifier le build backend: `bun run build` (service-commercial)
  - Vérifier le build frontend: `npm run build` (frontend)
  - Lancer les tests E2E via Playwright:
    - Flow complet: création commission → validation ADV → export PDF → vérification fichier
    - Contestation: créer → résoudre → vérifier régularisation
    - Dashboard: ouvrir reporting → vérifier KPIs → filtrer → exporter
  - Documenter les résultats dans `.sisyphus/evidence/`

  **Must NOT do**:
  - Ne pas ajouter de nouveaux features
  - Ne pas modifier du code (uniquement lire et tester)

  **Recommended Agent Profile**:
  - **Category**: `deep`
  - **Skills**: [`playwright`, `microservice-maintainer`]
    - `playwright`: Tests E2E navigateur
    - `microservice-maintainer`: Vérification build et tests backend

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Sequential (final)
  - **Blocks**: None
  - **Blocked By**: All previous tasks

  **References**:

  **Documentation References (CDC)**:
  - Section 13 (lignes 635-680): Scénarios de tests — cas normaux, exceptionnels, import/export, historisation, performance
  - Annexe J (lignes 1491-1570): Plan de tests détaillé — jeux de données, critères de validation, tolérance ±0.01€

  **Acceptance Criteria**:
  - [ ] `bun test` dans service-commercial → ALL PASS (40+ tests)
  - [ ] `bun run build` service-commercial → succès
  - [ ] `npm run build` frontend → succès
  - [ ] Playwright: flow complet commission → bordereau → export → vérification
  - [ ] Playwright: page validation ADV fonctionnelle
  - [ ] Playwright: dashboard reporting avec KPIs
  - [ ] Toutes les captures d'écran dans `.sisyphus/evidence/`

  **Agent-Executed QA Scenarios**:

  ```
  Scenario: Build global
    Tool: Bash
    Steps:
      1. cd services/service-commercial && bun test
      2. Assert: all tests pass
      3. cd services/service-commercial && bun run build
      4. Assert: exit code 0
      5. cd frontend && npm run build
      6. Assert: exit code 0
    Expected Result: All builds pass
    Evidence: Terminal outputs

  Scenario: E2E flow complet
    Tool: Playwright (playwright skill)
    Steps:
      1. Navigate to /commissions/validation
      2. Assert: page loads with lines
      3. Select lines and validate
      4. Navigate to /commissions/reporting
      5. Assert: KPIs displayed
      6. Screenshot: .sisyphus/evidence/task-9-e2e.png
    Expected Result: Full flow works
    Evidence: .sisyphus/evidence/task-9-e2e.png
  ```

  **Commit**: YES (if any fixes needed)
  - Message: `test(commission): add E2E validation for complete commission workflow`

---

## Commit Strategy

| After Task | Message | Files | Verification |
|------------|---------|-------|--------------|
| 0 | `feat(commission): setup test infrastructure and calculation helpers` | tests helpers | `bun test canary` |
| 1 | `feat(commission): extract calculation engine to domain service with TDD` | service + tests + controller | `bun test` |
| 2 | `feat(commission): implement reprise calculation and recurrence generation with TDD` | 2 services + tests | `bun test` |
| 3 | `feat(commission): implement ADV validation interface with pre-selection and locking` | proto + backend + frontend | `bun test && npm run build` |
| 4 | `feat(commission): implement PDF/Excel bordereau generation with SHA-256 hash` | service + migration + proto | `bun test` |
| 5 | `feat(commission): implement contestation system with 2-month deadline` | entity + migration + proto + frontend | `bun test` |
| 6 | `feat(commission): implement KPI snapshot service and reporting RPCs` | service + proto + tests | `bun test` |
| 7 | `feat(commission): implement reporting dashboard with KPIs charts` | frontend pages + components | `npm run build` |
| 8 | `feat(commission): integrate all services into GenererBordereau workflow` | controller + tests | `bun test` |
| 9 | `test(commission): add E2E validation for complete commission workflow` | tests | all builds pass |

---

## Success Criteria

### Verification Commands
```bash
cd services/service-commercial && bun test     # Expected: 40+ tests, ALL PASS
cd services/service-commercial && bun run build # Expected: Build succeeded
cd frontend && npm run build                    # Expected: Build succeeded
```

### Final Checklist
- [ ] Moteur de calcul: FIXE, %, PALIER, MIXTE implémentés avec TDD
- [ ] Formule reprise CDC: `min(Σ versées fenêtre, due période)` implémentée
- [ ] Récurrence: auto-génération sur encaissement, stop sur résiliation
- [ ] Report négatif: apurement automatique inter-périodes
- [ ] Validation ADV: présélection, motif obligatoire, totaux dynamiques, verrouillage
- [ ] PDF/Excel: 3 sections (Total/Linéaire/Reprises), hash SHA-256
- [ ] Contestation: entity, workflow 2 mois, régularisation automatique
- [ ] Dashboard: 6 KPIs, graphiques 12 mois, comparatifs, export
- [ ] Snapshot KPI auto-alimenté à la validation bordereau
- [ ] Aucune modification cassante des RPCs existants
- [ ] Aucune modification des tables existantes (migrations additives seulement)
- [ ] Tous les guardrails "Must NOT Have" respectés
