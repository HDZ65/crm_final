# Catalogue REST API — Integration Card (Settings Modal)

## TL;DR

> **Quick Summary**: Remplacer le placeholder "Bientôt disponible" de la card Catalogue REST API dans la modale Paramètres → Intégrations par une card fonctionnelle permettant de tester une API externe et d'importer les produits dans le catalogue CRM.
>
> **Deliverables**:
> - Nouvelle action serveur `actions/catalogue-api.ts` (test connexion + import)
> - Card fonctionnelle dans `settings-dialog.tsx` (URL input, test, import, résultats)
> - Rebuild Docker frontend
>
> **Estimated Effort**: Short (2 files, ~250 lignes)
> **Parallel Execution**: NO — séquentiel (action d'abord, puis UI qui l'importe)
> **Critical Path**: Task 1 → Task 2 → Task 3

---

## Context

### Original Request
L'utilisateur veut que la card "Catalogue REST API" dans la modale Paramètres → Intégrations permette de configurer une URL d'API externe qui retourne des produits, les tester, et les importer dans le catalogue CRM.

### External API Format
```json
{
  "id": 9,
  "nom": "Télécâble Sat",
  "description": "votre guide TV le plus complet...",
  "categorie": "Divertissement",
  "fournisseur": "Télécâble Sat",
  "logo_url": "/logo/telecable.png",
  "prix_base": 2.2,
  "features": null,
  "formules": null,
  "popular": true,
  "rating": 0,
  "isActive": true
}
```

### Field Mapping (External → CRM)
| JSON externe | → | CRM field | Notes |
|---|---|---|---|
| `id` | → | `codeExterne` = `"EXT-{id}"` | identifiant source + dedup |
| `id` | → | `sku` = `"EXT-{id}"` | même valeur (sku obligatoire) |
| `nom` | → | `nom` | direct |
| `description` | → | `description` | direct |
| `categorie` ("Divertissement") | → | **Gamme** (find or create) | PAS l'enum CategorieProduit |
| — | → | `categorie` = `SERVICE` (4) | default pour tous imports |
| — | → | `type` = `PARTENAIRE` (2) | produit externe |
| `prix_base` | → | `prix` | HT |
| — | → | `tauxTva` = 20 | défaut |
| — | → | `devise` = "EUR" | défaut |
| `logo_url` | → | `imageUrl` | direct |
| `isActive` | → | `statutCycle` | `true` → ACTIF (3), `false` → RETIRE (5) |
| `fournisseur`, `popular`, `rating`, `features`, `formules`, `categorie` | → | `metadata` (JSON string) | champs partenaire non exposés dans CreateProduitRequest |

### Metis Review
**Identified Gaps** (addressed):
- **URL non persistée** → Accepté : URL éphémère, saisie à chaque fois. Pas de save/config backend.
- **Re-import** → Skip-only pour les doublons (par codeExterne). Pas d'update.
- **Timeout** → 10s pour test, 30s pour import via AbortSignal.timeout()
- **Race condition gammes** → Charger la map de gammes UNE FOIS avant itération.
- **Formats API variés** → Supporter `[...]`, `{ data: [...] }`, `{ products: [...] }`

---

## Work Objectives

### Core Objective
Permettre à l'utilisateur de coller une URL d'API REST, tester qu'elle retourne des produits valides, puis importer ces produits dans le catalogue CRM en créant automatiquement les gammes.

### Concrete Deliverables
- `frontend/src/actions/catalogue-api.ts` — server action (test + import)
- Modification de `frontend/src/components/settings-dialog.tsx` — card fonctionnelle

### Definition of Done
- [ ] La card "Catalogue REST API" dans Paramètres → Intégrations est fonctionnelle (plus de "Bientôt disponible")
- [ ] L'utilisateur peut saisir une URL, tester la connexion, voir le nombre de produits + catégories
- [ ] L'utilisateur peut cliquer "Importer" et voir les résultats (importés/ignorés/erreurs/gammes créées)
- [ ] Les produits apparaissent dans la page /catalogue après import

### Must Have
- Input URL de l'API
- Bouton "Tester la connexion" avec résultat inline (nombre de produits, catégories trouvées)
- Bouton "Importer les produits" avec résultat inline (importés, ignorés, erreurs, gammes créées)
- Dedup par codeExterne (`EXT-{id}`)
- Création automatique des gammes depuis le champ `categorie`
- Timeout explicite (10s test, 30s import)

### Must NOT Have (Guardrails)
- ❌ Pas de persistance de l'URL (pas de save, pas de localStorage)
- ❌ Pas de toggle enabled/disabled
- ❌ Pas d'update de produits existants au re-import (skip-only)
- ❌ Pas d'authentification pour l'API externe (URL publique)
- ❌ Pas de streaming/progress (single await)
- ❌ Pas d'extraction en composant séparé (tout inline dans IntegrationsSettings)
- ❌ Pas de validation Zod (simple check `!apiUrl`)
- ❌ Pas de retry logic ou circuit breaker
- ❌ Pas de nouveau fichier composant (AUCUN)
- ❌ Pas de modification de `actions/catalogue.ts` existant

---

## Verification Strategy

> **UNIVERSAL RULE: ZERO HUMAN INTERVENTION**

### Test Decision
- **Infrastructure exists**: NO (pas de tests unitaires dans ce projet)
- **Automated tests**: NO
- **Framework**: none

### Agent-Executed QA Scenarios (MANDATORY)

Chaque tâche inclut des scénarios Playwright / Bash pour vérification automatisée.

---

## Execution Strategy

### Dependency Chain
```
Task 1: Create actions/catalogue-api.ts (no dependencies)
    ↓
Task 2: Replace placeholder card in settings-dialog.tsx (depends: Task 1)
    ↓
Task 3: Rebuild frontend + verify (depends: Task 2)
```

### Dependency Matrix

| Task | Depends On | Blocks | Can Parallelize With |
|------|------------|--------|---------------------|
| 1 | None | 2 | None |
| 2 | 1 | 3 | None |
| 3 | 2 | None | None |

---

## TODOs

- [ ] 1. Créer l'action serveur `actions/catalogue-api.ts`

  **What to do**:
  - Créer le fichier `frontend/src/actions/catalogue-api.ts` avec la directive `"use server"`
  - Exporter `testCatalogueApiConnection(apiUrl: string): Promise<ActionResult<CatalogueApiTestResult>>`
    - Fetch l'URL avec `AbortSignal.timeout(10000)`
    - Supporter 3 formats de réponse : `[...]`, `{ data: [...] }`, `{ products: [...] }`
    - Valider que le premier élément a un champ `nom`
    - Retourner `{ success, message, productCount, sampleCategories }`
  - Exporter `importCatalogueFromApi({ organisationId, apiUrl }): Promise<ActionResult<CatalogueApiImportResult>>`
    - Fetch avec `AbortSignal.timeout(30000)`
    - Charger les gammes existantes via `getGammesByOrganisation` → construire `Map<string, string>` (nom lowercase → id)
    - Charger les produits existants via `getProduitsByOrganisation` → construire `Set<string>` des `codeExterne` existants
    - Pour chaque produit externe :
      - Si `codeExterne` = `EXT-{id}` existe déjà → skip, incrémenter `skipped`
      - Sinon : find or create gamme depuis `categorie` (lookup dans la Map)
      - Appeler `createProduit` avec le mapping documenté ci-dessus
      - `metadata` = `JSON.stringify({ source: "catalogue-rest-api", externalId, fournisseur, categorieOrigine, popular, rating, features, formules })`
    - Retourner `{ success, message, imported, skipped, errors, gammesCreated }`
  - Exporter les interfaces : `ExternalProduct`, `CatalogueApiTestResult`, `CatalogueApiImportResult`

  **Must NOT do**:
  - Ne PAS modifier `actions/catalogue.ts`
  - Ne PAS ajouter de logique de retry ou circuit breaker
  - Ne PAS ajouter de pagination sur l'API externe
  - Ne PAS ajouter d'update de produits existants

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Single file creation, well-defined input/output, clear patterns to follow
  - **Skills**: [`frontend-ui-ux`]
    - `frontend-ui-ux`: Connaît les patterns Next.js server actions

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Sequential
  - **Blocks**: Task 2
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `frontend/src/actions/catalogue.ts:176-218` — Pattern de `createProduit` : paramètres, try/catch, ActionResult, revalidatePath
  - `frontend/src/actions/catalogue.ts:33-51` — Pattern de `getGammesByOrganisation` : appel gRPC, gestion erreur
  - `frontend/src/actions/catalogue.ts:56-92` — Pattern de `createGamme` : auto-génération du code depuis le nom
  - `frontend/src/actions/catalogue.ts:151-171` — Pattern de `getProduitsByOrganisation` : liste pour dedup

  **API/Type References**:
  - `frontend/src/proto/products/products.ts:667-682` — `CreateProduitRequest` : tous les champs acceptés
  - `frontend/src/proto/products/products.ts:58-63` — `TypeProduit` enum (PARTENAIRE = 2)
  - `frontend/src/proto/products/products.ts:154-162` — `CategorieProduit` enum (SERVICE = 4)
  - `frontend/src/proto/products/products.ts:97-105` — `StatutCycleProduit` enum (ACTIF = 3, RETIRE = 5)
  - `frontend/src/lib/types/common.ts` — `ActionResult<T>` type pattern

  **Acceptance Criteria**:

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: Action file created with correct exports
    Tool: Bash
    Steps:
      1. grep -c "export async function" frontend/src/actions/catalogue-api.ts
      2. Assert: output is "2"
      3. head -1 frontend/src/actions/catalogue-api.ts
      4. Assert: contains "use server"
      5. grep "testCatalogueApiConnection" frontend/src/actions/catalogue-api.ts
      6. Assert: function exists
      7. grep "importCatalogueFromApi" frontend/src/actions/catalogue-api.ts
      8. Assert: function exists
    Expected Result: File exists with 2 exported async functions and "use server" directive
  ```

  ```
  Scenario: Imports reference correct catalogue actions
    Tool: Bash
    Steps:
      1. grep "createProduit" frontend/src/actions/catalogue-api.ts
      2. Assert: import from "@/actions/catalogue"
      3. grep "getGammesByOrganisation" frontend/src/actions/catalogue-api.ts
      4. Assert: import present
      5. grep "createGamme" frontend/src/actions/catalogue-api.ts
      6. Assert: import present
      7. grep "AbortSignal.timeout" frontend/src/actions/catalogue-api.ts
      8. Assert: at least 2 occurrences (10000 and 30000)
    Expected Result: All required imports and timeouts present
  ```

  **Commit**: YES
  - Message: `feat(integrations): add catalogue REST API server actions for test and import`
  - Files: `frontend/src/actions/catalogue-api.ts`

---

- [ ] 2. Remplacer la card placeholder dans settings-dialog.tsx

  **What to do**:
  - Dans `frontend/src/components/settings-dialog.tsx`, ajouter l'import de `testCatalogueApiConnection` et `importCatalogueFromApi` depuis `@/actions/catalogue-api`
  - Ajouter l'import des types `CatalogueApiTestResult` et `CatalogueApiImportResult` depuis `@/actions/catalogue-api`
  - Dans la fonction `IntegrationsSettings`, ajouter les states :
    - `catalogueApiUrl: string` (initialisé à "")
    - `catalogueTestStatus: "idle" | "loading" | "success" | "error"` 
    - `catalogueTestMessage: string`
    - `catalogueTestDetails: { productCount, sampleCategories } | null`
    - `catalogueImportStatus: "idle" | "loading" | "success" | "error"`
    - `catalogueImportMessage: string`
    - `catalogueImportDetails: { imported, skipped, errors, gammesCreated } | null`
  - Ajouter les handlers :
    - `handleTestCatalogueApi` → appelle `testCatalogueApiConnection(catalogueApiUrl)`, met à jour status/message/details
    - `handleImportCatalogue` → appelle `importCatalogueFromApi({ organisationId: activeOrganisation.organisationId, apiUrl: catalogueApiUrl })`, met à jour status/message/details
  - Remplacer le block placeholder (le `<div>` avec `opacity-60` contenant "Bientôt disponible") par :
    - Card avec icône `Package` (déjà importé), titre "Catalogue REST API", description "Connecteur API REST pour importer des offres externes"
    - PAS de `opacity-60` (card active)
    - PAS de badge "Bientôt disponible"
    - Input URL : placeholder `"https://api.example.com/products"`
    - Bouton "Tester la connexion" (réutilise `renderTestResult` existant pour le status)
    - Si test success : afficher le détail "X produits trouvés" + badges des catégories trouvées
    - Bouton "Importer les produits" (disabled si test pas success ou URL vide)
    - Si import terminé : afficher résumé inline "X importé(s), Y ignoré(s)" + gammes créées + erreurs s'il y en a
  - L'import du JSON tooltip avec Info icon n'est PAS nécessaire pour cette card (c'était pour WinLeadPlus)

  **Must NOT do**:
  - Ne PAS toucher aux cards WinLeadPlus ou WooCommerce (lignes avant le placeholder)
  - Ne PAS créer de fichier composant séparé
  - Ne PAS ajouter de persistance de l'URL
  - Ne PAS ajouter de toggle enabled/disabled
  - Ne PAS ajouter de champ authentification
  - Ne PAS extraire `IntegrationsSettings` dans un fichier séparé

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Single file edit, UI pattern already established by WinLeadPlus card
  - **Skills**: [`frontend-ui-ux`]
    - `frontend-ui-ux`: Connaît shadcn/ui patterns, Card/Badge/Button, responsive layout

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Sequential
  - **Blocks**: Task 3
  - **Blocked By**: Task 1

  **References**:

  **Pattern References**:
  - `frontend/src/components/settings-dialog.tsx:871-1074` — Card WinLeadPlus : structure Card avec icône, badge, Separator, handlers test/save, renderTestResult
  - `frontend/src/components/settings-dialog.tsx:826-852` — Fonction `renderTestResult(status, message)` : réutiliser tel quel pour le status
  - `frontend/src/components/settings-dialog.tsx:1076-1093` — Block placeholder actuel "Bientôt disponible" : ce qui doit être REMPLACÉ
  - `frontend/src/components/settings-dialog.tsx:689-708` — Guards organisation/isOwner/isLoading : ne pas dupliquer, déjà gérés plus haut

  **API/Type References**:
  - `frontend/src/actions/catalogue-api.ts` — Les 2 fonctions et types à importer (créés en Task 1)

  **UI Components** (déjà importés dans le fichier):
  - `Badge` — pour catégories trouvées + résultats import
  - `Button` — test + import buttons
  - `Input` — URL field
  - `Separator` — entre sections
  - `Loader2` — spinner pendant loading
  - `Package` — icône de la card (déjà importé dans les icons Lucide)

  **Acceptance Criteria**:

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: Placeholder "Bientôt disponible" removed
    Tool: Bash
    Steps:
      1. grep -c "Bientôt disponible" frontend/src/components/settings-dialog.tsx
      2. Assert: output is "0"
      3. grep -c "opacity-60" frontend/src/components/settings-dialog.tsx
      4. Assert: output is "0" (the only opacity-60 was the placeholder)
    Expected Result: No trace of placeholder in the file
  ```

  ```
  Scenario: New imports added
    Tool: Bash
    Steps:
      1. grep "testCatalogueApiConnection" frontend/src/components/settings-dialog.tsx
      2. Assert: import present
      3. grep "importCatalogueFromApi" frontend/src/components/settings-dialog.tsx
      4. Assert: import present
    Expected Result: Both catalogue-api actions imported
  ```

  ```
  Scenario: Card renders in settings modal (Playwright)
    Tool: Playwright (playwright skill)
    Preconditions: Dev server running, user logged in
    Steps:
      1. Open settings dialog (click settings icon/button in sidebar)
      2. Click "Intégrations" in settings sidebar
      3. Scroll to bottom of integrations content
      4. Assert: text "Catalogue REST API" is visible
      5. Assert: text "Bientôt disponible" is NOT visible
      6. Assert: input with placeholder containing "api" or "url" is visible
      7. Assert: button containing "Tester" is visible
      8. Screenshot: .sisyphus/evidence/task-2-catalogue-card.png
    Expected Result: Functional card visible without placeholder badge
    Evidence: .sisyphus/evidence/task-2-catalogue-card.png
  ```

  **Commit**: YES
  - Message: `feat(integrations): replace catalogue REST API placeholder with functional import card`
  - Files: `frontend/src/components/settings-dialog.tsx`

---

- [ ] 3. Rebuild frontend Docker + vérification complète

  **What to do**:
  - Arrêter le container `alex-frontend` : `docker stop alex-frontend && docker rm alex-frontend`
  - Rebuild l'image : `docker build -t crmdev-crm-frontend --target development -f frontend/Dockerfile .`
  - Démarrer le container avec labels Traefik :
    ```
    docker run -d --name alex-frontend --network shared_dev_net -p 3070:3000 --restart unless-stopped \
      -l "traefik.enable=true" \
      -l "traefik.http.routers.alex-front.rule=Host(\`alex.local\`)" \
      -l "traefik.http.services.alex-front.loadbalancer.server.port=3000" \
      crmdev-crm-frontend
    ```
  - Attendre que le container soit `Ready` (vérifier `docker logs alex-frontend --tail 5`)
  - Vérification Playwright complète de la modale Intégrations

  **Must NOT do**:
  - Ne PAS utiliser `docker compose` (le frontend n'est pas dans le compose principal selon les notes de contexte, cela crée des conflits)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Simple rebuild + verification, no code changes
  - **Skills**: [`playwright`]
    - `playwright`: Pour vérification visuelle du rendu de la modale

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Sequential (final)
  - **Blocks**: None
  - **Blocked By**: Task 2

  **References**:

  **Pattern References**:
  - Previous successful build command: `docker build -t crmdev-crm-frontend --target development -f frontend/Dockerfile .`
  - Previous successful run command with Traefik labels from this session

  **Acceptance Criteria**:

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: Frontend container starts and is healthy
    Tool: Bash
    Steps:
      1. Wait 15 seconds after docker run
      2. docker logs alex-frontend --tail 5
      3. Assert: output contains "Ready in" 
      4. docker ps --filter "name=alex-frontend" --format "{{.Status}}"
      5. Assert: contains "Up"
    Expected Result: Container running and Next.js ready
  ```

  ```
  Scenario: Full integration card verification (Playwright)
    Tool: Playwright (playwright skill)
    Preconditions: alex-frontend container running, accessible at alex.local:8081
    Steps:
      1. Navigate to http://alex.local:8081/
      2. Log in with valid credentials
      3. Open settings dialog
      4. Click "Intégrations" in settings sidebar
      5. Assert: "WinLeadPlus" card visible with badge
      6. Assert: "WooCommerce" card visible with badge
      7. Assert: "Catalogue REST API" card visible WITHOUT "Bientôt disponible"
      8. Assert: URL input field present in Catalogue REST API card
      9. Assert: "Tester" button visible
      10. Screenshot: .sisyphus/evidence/task-3-all-integrations.png
    Expected Result: All 3 integration cards visible and functional
    Evidence: .sisyphus/evidence/task-3-all-integrations.png
  ```

  ```
  Scenario: Catalogue REST API test connection (Playwright)
    Tool: Playwright (playwright skill)
    Preconditions: User logged in, settings dialog open on Intégrations tab
    Steps:
      1. Fill URL input with a known test API URL (or mock)
      2. Click "Tester la connexion" 
      3. Wait for result (timeout: 15s)
      4. Assert: result message appears (success or error)
      5. Screenshot: .sisyphus/evidence/task-3-catalogue-test.png
    Expected Result: Test connection returns a result (success or meaningful error)
    Evidence: .sisyphus/evidence/task-3-catalogue-test.png
  ```

  **Commit**: NO (rebuild only, no code changes)

---

## Commit Strategy

| After Task | Message | Files | Verification |
|------------|---------|-------|--------------|
| 1 | `feat(integrations): add catalogue REST API server actions for test and import` | `frontend/src/actions/catalogue-api.ts` | grep exports |
| 2 | `feat(integrations): replace catalogue REST API placeholder with functional import card` | `frontend/src/components/settings-dialog.tsx` | grep no "Bientôt disponible" |

---

## Success Criteria

### Verification Commands
```bash
# Action file exists with correct exports
grep -c "export async function" frontend/src/actions/catalogue-api.ts  # Expected: 2

# Placeholder removed
grep -c "Bientôt disponible" frontend/src/components/settings-dialog.tsx  # Expected: 0

# Docker container running
docker ps --filter "name=alex-frontend" --format "{{.Status}}"  # Expected: Up ...
```

### Final Checklist
- [ ] "Bientôt disponible" supprimé
- [ ] Card Catalogue REST API fonctionnelle (input URL, test, import)
- [ ] Gammes créées automatiquement depuis le champ `categorie` externe
- [ ] Produits importés avec `type=PARTENAIRE`, `categorie=SERVICE`, `codeExterne=EXT-{id}`
- [ ] Doublons ignorés au re-import
- [ ] Pas de persistance d'URL
- [ ] Pas de nouveau fichier composant
- [ ] Container frontend rebuilt et healthy
