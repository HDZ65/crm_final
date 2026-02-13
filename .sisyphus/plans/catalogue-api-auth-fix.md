# Catalogue REST API — Ajout Authentification Bearer Token

## TL;DR

> **Quick Summary**: Ajouter le support d'un token d'authentification Bearer (Keycloak) aux fonctions serveur Catalogue REST API et aux deux interfaces utilisateur qui les consomment, suite au retour 401 de l'API externe.
>
> **Deliverables**:
> - Modification de `catalogue-api.ts` : paramètre `authToken` + header `Authorization: Bearer`
> - Modification de `settings-dialog.tsx` : champ token avec toggle reveal
> - Modification de `integrations-page-client.tsx` : champ token avec toggle reveal
> - Rebuild Docker frontend + vérification Playwright
>
> **Estimated Effort**: Short (3 fichiers modifiés, ~50 lignes ajoutées)
> **Parallel Execution**: YES — 2 waves
> **Critical Path**: Task 1 → Tasks 2+3 (parallel) → Task 4

---

## Context

### Original Request
L'API externe catalogue retourne un status **401** car elle attend un token Keycloak dans l'en-tête Authorization. Le plan original (`catalogue-rest-api-integration.md`) excluait explicitement l'authentification, mais le test réel a révélé qu'elle est nécessaire.

### Metis Review
**Identified Gaps** (addressed):
- **Second consumer file missed**: `integrations-page-client.tsx` appelle aussi `testCatalogueApiConnection` et `importCatalogueFromApi` — MUST update both UIs
- **Empty string guard**: `authToken?.trim()` obligatoire, pas juste `if (authToken)` — sinon envoie un header `Bearer ` vide
- **401 error message**: Message générique `"API returned status 401"` → remplacer par message spécifique mentionnant le token Keycloak
- **State name collision**: Utiliser `showCatalogueToken` (pas `showApiToken` qui est déjà pris par WLP dans les deux fichiers)

---

## Work Objectives

### Core Objective
Permettre à l'utilisateur de saisir un token Bearer Keycloak pour l'authentification auprès de l'API externe catalogue, dans les deux interfaces existantes (modale paramètres + page intégrations).

### Concrete Deliverables
- `frontend/src/actions/catalogue-api.ts` — ajout paramètre `authToken` aux 2 fonctions
- `frontend/src/components/settings-dialog.tsx` — ajout champ token + wiring
- `frontend/src/app/(main)/parametres/integrations/integrations-page-client.tsx` — ajout champ token + wiring

### Definition of Done
- [x] Les deux fonctions serveur acceptent un `authToken` optionnel et l'envoient comme `Authorization: Bearer ${token}` si fourni
- [x] Le champ token est visible dans la modale Paramètres → Intégrations → Catalogue REST API
- [x] Le champ token est visible dans la page Intégrations → Dialogue Catalogue REST API
- [x] Le toggle Eye/EyeOff fonctionne pour masquer/révéler le token
- [x] Tester la connexion sans token ne plante pas (backward compat)
- [x] Tester la connexion avec token envoie le header Authorization
- [x] Message d'erreur 401 mentionne le token Keycloak

### Must Have
- Paramètre `authToken?: string` sur les deux fonctions
- Header `Authorization: Bearer ${authToken.trim()}` quand token fourni (guard: `authToken?.trim()`)
- Champ password input avec Eye/EyeOff dans les deux UIs
- Message 401 spécifique : `"Authentification échouée (401) — vérifiez votre token Keycloak"`
- Token éphémère (pas de persistance)

### Must NOT Have (Guardrails)
- ❌ Pas de persistance du token (DB, localStorage, cookie)
- ❌ Pas de token refresh / expiry detection
- ❌ Pas de Keycloak OIDC discovery / `.well-known`
- ❌ Pas de schéma d'auth alternatif (API key, Basic)
- ❌ Pas de décodage JWT / validation côté client
- ❌ Pas de refactoring de `testCatalogueApiConnection` en object params — ajouter un 2e arg positionnel seulement
- ❌ Pas de modification du code WinLeadPlus ou WooCommerce
- ❌ Pas de texte d'aide "comment obtenir un token Keycloak"
- ❌ Pas de validation regex/longueur sur le champ token

---

## Verification Strategy

> **UNIVERSAL RULE: ZERO HUMAN INTERVENTION**

### Test Decision
- **Infrastructure exists**: NO
- **Automated tests**: NO
- **Framework**: none

### Agent-Executed QA Scenarios (MANDATORY — ALL tasks)

Chaque tâche inclut des scénarios Bash / Playwright pour vérification automatisée.

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Start Immediately):
└── Task 1: Modify catalogue-api.ts (no dependencies)

Wave 2 (After Wave 1):
├── Task 2: Modify settings-dialog.tsx (depends: Task 1)
└── Task 3: Modify integrations-page-client.tsx (depends: Task 1)

Wave 3 (After Wave 2):
└── Task 4: Rebuild Docker + Playwright verification (depends: Tasks 2, 3)

Critical Path: Task 1 → Task 2 → Task 4
Parallel Speedup: Tasks 2+3 run in parallel (~20% faster)
```

### Dependency Matrix

| Task | Depends On | Blocks | Can Parallelize With |
|------|------------|--------|---------------------|
| 1 | None | 2, 3 | None |
| 2 | 1 | 4 | 3 |
| 3 | 1 | 4 | 2 |
| 4 | 2, 3 | None | None (final) |

### Agent Dispatch Summary

| Wave | Tasks | Recommended Agents |
|------|-------|-------------------|
| 1 | 1 | `task(category="quick", load_skills=[], ...)` |
| 2 | 2, 3 | `task(category="quick", load_skills=["frontend-ui-ux"], run_in_background=true)` x2 in parallel |
| 3 | 4 | `task(category="quick", load_skills=["playwright"], ...)` |

---

## TODOs

- [x] 1. Ajouter `authToken` aux fonctions serveur `catalogue-api.ts`

  **What to do**:
  - Modifier `testCatalogueApiConnection(apiUrl: string)` → `testCatalogueApiConnection(apiUrl: string, authToken?: string)`
  - Modifier `importCatalogueFromApi(params: { organisationId: string; apiUrl: string })` → `importCatalogueFromApi(params: { organisationId: string; apiUrl: string; authToken?: string })`
  - Dans les deux fonctions, ajouter un objet headers au fetch :
    ```typescript
    const headers: HeadersInit = {};
    if (authToken?.trim()) {
      headers["Authorization"] = `Bearer ${authToken.trim()}`;
    }
    
    const response = await fetch(apiUrl, {
      signal: controller.signal,
      headers,
    });
    ```
  - Pour `importCatalogueFromApi`, utiliser `params.authToken` au lieu de `authToken` directement
  - Améliorer le message d'erreur 401 dans les DEUX fonctions (lignes ~76 et ~158) :
    ```typescript
    if (!response.ok) {
      const errorMsg = response.status === 401
        ? "Authentification échouée (401) — vérifiez votre token Keycloak"
        : `API returned status ${response.status}`;
      return { data: null, error: errorMsg };
    }
    ```

  **Must NOT do**:
  - Ne PAS refactorer `testCatalogueApiConnection` en objet params (garder positional args)
  - Ne PAS ajouter de décodage JWT ou validation du token
  - Ne PAS ajouter de retry logic sur 401
  - Ne PAS modifier les types de retour `ActionResult<...>`

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Single file edit, well-defined changes (add param + header + error message)
  - **Skills**: `[]`
    - No special skills needed — pure TypeScript server action modification

  **Parallelization**:
  - **Can Run In Parallel**: NO (first task)
  - **Parallel Group**: Wave 1 (solo)
  - **Blocks**: Tasks 2, 3
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `frontend/src/actions/catalogue-api.ts:62-137` — Fonction `testCatalogueApiConnection` actuelle : fetch sans headers, error handling
  - `frontend/src/actions/catalogue-api.ts:143-367` — Fonction `importCatalogueFromApi` actuelle : fetch sans headers, error handling
  - `frontend/src/actions/catalogue-api.ts:69-71` — Fetch actuel dans test : `fetch(apiUrl, { signal: controller.signal })` — ajouter `headers` ici
  - `frontend/src/actions/catalogue-api.ts:151-153` — Fetch actuel dans import : `fetch(params.apiUrl, { signal: controller.signal })` — ajouter `headers` ici
  - `frontend/src/actions/catalogue-api.ts:75-79` — Error handling HTTP status dans test : remplacer par message 401-spécifique
  - `frontend/src/actions/catalogue-api.ts:157-161` — Error handling HTTP status dans import : remplacer par message 401-spécifique

  **Acceptance Criteria**:

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: authToken parameter added to testCatalogueApiConnection
    Tool: Bash
    Steps:
      1. grep "testCatalogueApiConnection" frontend/src/actions/catalogue-api.ts | head -3
      2. Assert: function signature contains "authToken"
      3. grep "Authorization" frontend/src/actions/catalogue-api.ts
      4. Assert: at least 2 occurrences (one per function)
      5. grep "Bearer" frontend/src/actions/catalogue-api.ts
      6. Assert: at least 2 occurrences
    Expected Result: Both functions accept authToken and set Authorization header
  ```

  ```
  Scenario: authToken parameter added to importCatalogueFromApi
    Tool: Bash
    Steps:
      1. grep -A2 "importCatalogueFromApi" frontend/src/actions/catalogue-api.ts | head -5
      2. Assert: params includes "authToken"
    Expected Result: Import function params include authToken
  ```

  ```
  Scenario: 401-specific error message present
    Tool: Bash
    Steps:
      1. grep -c "401" frontend/src/actions/catalogue-api.ts
      2. Assert: at least 2 occurrences (one per function)
      3. grep "Keycloak" frontend/src/actions/catalogue-api.ts
      4. Assert: at least 2 occurrences
    Expected Result: Both functions show Keycloak-specific 401 error message
  ```

  ```
  Scenario: Empty token guard uses trim()
    Tool: Bash
    Steps:
      1. grep "trim()" frontend/src/actions/catalogue-api.ts
      2. Assert: at least 2 occurrences (guard check + header value)
    Expected Result: Token is trimmed before use
  ```

  **Commit**: YES
  - Message: `feat(integrations): add Bearer token auth support to catalogue API actions`
  - Files: `frontend/src/actions/catalogue-api.ts`

---

- [x] 2. Ajouter champ token dans `settings-dialog.tsx` (Catalogue REST API card)

  **What to do**:
  - Ajouter les states (à côté des existants lignes 703-710) :
    ```typescript
    const [catalogueApiToken, setCatalogueApiToken] = React.useState("")
    const [showCatalogueToken, setShowCatalogueToken] = React.useState(false)
    ```
    **IMPORTANT** : Ne PAS utiliser `showApiToken` qui est déjà utilisé par WinLeadPlus (ligne 693)
  - Modifier `handleTestCatalogueApi` (ligne 843) pour passer le token :
    ```typescript
    const { data, error } = await testCatalogueApiConnection(catalogueApiUrl, catalogueApiToken || undefined)
    ```
  - Modifier `handleImportCatalogue` (ligne 863) pour passer le token :
    ```typescript
    const { data, error } = await importCatalogueFromApi({
      organisationId: activeOrganisation.organisationId,
      apiUrl: catalogueApiUrl,
      authToken: catalogueApiToken || undefined,
    })
    ```
  - Ajouter le champ token dans la card Catalogue REST API, APRÈS le champ URL (ligne 1165) et AVANT les boutons (ligne 1167) :
    ```tsx
    <div className="space-y-2">
      <Label htmlFor="catalogue-api-token">Token d&apos;authentification (optionnel)</Label>
      <div className="relative">
        <Input
          id="catalogue-api-token"
          type={showCatalogueToken ? "text" : "password"}
          placeholder="eyJhbGciOiJSUzI1NiIs..."
          value={catalogueApiToken}
          onChange={(e) => setCatalogueApiToken(e.target.value)}
          className="pr-10"
        />
        <button
          type="button"
          onClick={() => setShowCatalogueToken(!showCatalogueToken)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
        >
          {showCatalogueToken ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>
    </div>
    ```

  **Must NOT do**:
  - Ne PAS toucher aux cards WinLeadPlus ou WooCommerce
  - Ne PAS utiliser le state `showApiToken` existant (appartient à WLP)
  - Ne PAS persister le token
  - Ne PAS ajouter de validation regex/longueur sur le token
  - Ne PAS ajouter de label "Bearer" dans le placeholder (le code le fait automatiquement)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Single file edit, UI pattern already established by WinLeadPlus card at lines 1007-1024
  - **Skills**: [`frontend-ui-ux`]
    - `frontend-ui-ux`: Connaît shadcn/ui patterns, Input avec toggle reveal

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Task 3)
  - **Blocks**: Task 4
  - **Blocked By**: Task 1

  **References**:

  **Pattern References**:
  - `frontend/src/components/settings-dialog.tsx:1007-1024` — WinLeadPlus token input pattern : `relative` div, `Input type={showApiToken ? "text" : "password"}`, `button` avec Eye/EyeOff toggle, `pr-10` padding-right — **COPIER ce pattern exactement** avec état `showCatalogueToken`
  - `frontend/src/components/settings-dialog.tsx:703-710` — Existing Catalogue API states : ajouter `catalogueApiToken` et `showCatalogueToken` ici
  - `frontend/src/components/settings-dialog.tsx:837-855` — Handler `handleTestCatalogueApi` : modifier l'appel à `testCatalogueApiConnection` pour passer le token
  - `frontend/src/components/settings-dialog.tsx:857-880` — Handler `handleImportCatalogue` : modifier l'appel à `importCatalogueFromApi` pour passer `authToken`
  - `frontend/src/components/settings-dialog.tsx:1155-1165` — Champ URL actuel dans la card Catalogue : ajouter le champ token APRÈS ce block
  - `frontend/src/components/settings-dialog.tsx:1167-1191` — Boutons test/import : le champ token va AVANT ce block

  **Acceptance Criteria**:

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: Token state variables added
    Tool: Bash
    Steps:
      1. grep "catalogueApiToken" frontend/src/components/settings-dialog.tsx
      2. Assert: useState declaration present
      3. grep "showCatalogueToken" frontend/src/components/settings-dialog.tsx
      4. Assert: useState declaration present
    Expected Result: Two new state variables exist
  ```

  ```
  Scenario: Token passed to test function
    Tool: Bash
    Steps:
      1. grep -A3 "testCatalogueApiConnection" frontend/src/components/settings-dialog.tsx | grep -v "import"
      2. Assert: call includes catalogueApiToken or authToken
    Expected Result: Test function receives token parameter
  ```

  ```
  Scenario: Token passed to import function
    Tool: Bash
    Steps:
      1. grep -A5 "importCatalogueFromApi" frontend/src/components/settings-dialog.tsx | grep -v "import"
      2. Assert: call includes authToken
    Expected Result: Import function receives token parameter
  ```

  ```
  Scenario: Password input with toggle exists in Catalogue card
    Tool: Bash
    Steps:
      1. grep "catalogue-api-token" frontend/src/components/settings-dialog.tsx
      2. Assert: input id present
      3. grep "showCatalogueToken" frontend/src/components/settings-dialog.tsx | grep -c "EyeOff\|Eye"
      4. Assert: toggle references present
    Expected Result: Token password input with reveal toggle exists
  ```

  **Commit**: YES (groups with Task 3)
  - Message: `feat(integrations): add token input field to catalogue API integration UIs`
  - Files: `frontend/src/components/settings-dialog.tsx`, `frontend/src/app/(main)/parametres/integrations/integrations-page-client.tsx`

---

- [x] 3. Ajouter champ token dans `integrations-page-client.tsx` (Catalogue dialog)

  **What to do**:
  - Ajouter un state dans la section "Catalogue REST API state" (après ligne 124) :
    ```typescript
    const [showCatalogueToken, setShowCatalogueToken] = React.useState(false)
    ```
    **IMPORTANT** : Ne PAS utiliser `showApiToken` qui est déjà utilisé par WLP (ligne 104)
  - Ajouter `authToken` au `catalogueForm` state (ligne 119) :
    ```typescript
    const [catalogueForm, setCatalogueForm] = React.useState({
      apiUrl: "",
      authToken: "",
    })
    ```
  - Modifier `openCatalogueDialog` (ligne 225-228) pour réinitialiser le token :
    ```typescript
    const openCatalogueDialog = () => {
      setCatalogueForm({ apiUrl: "", authToken: "" })
      setCatalogueTestResult({ status: "idle" })
      setShowCatalogueToken(false)
      setCatalogueDialogOpen(true)
    }
    ```
  - Modifier `handleTestCatalogueApi` (ligne 237) pour passer le token :
    ```typescript
    const result = await testCatalogueApiConnection(catalogueForm.apiUrl, catalogueForm.authToken || undefined)
    ```
  - Modifier `handleImportCatalogue` (ligne 257-260) pour passer le token :
    ```typescript
    const result = await importCatalogueFromApi({
      organisationId: activeOrgId,
      apiUrl: catalogueForm.apiUrl,
      authToken: catalogueForm.authToken || undefined,
    })
    ```
  - Ajouter le champ token dans le dialogue Catalogue (après le champ URL, ligne 747, et avant le bouton test, ligne 749) :
    ```tsx
    <div>
      <Label htmlFor="catalogue-token">Token d&apos;authentification (optionnel)</Label>
      <div className="relative mt-1.5">
        <Input
          id="catalogue-token"
          type={showCatalogueToken ? "text" : "password"}
          placeholder="eyJhbGciOiJSUzI1NiIs..."
          value={catalogueForm.authToken}
          onChange={(e) =>
            setCatalogueForm({ ...catalogueForm, authToken: e.target.value })
          }
          className="pr-10"
        />
        <button
          type="button"
          onClick={() => setShowCatalogueToken(!showCatalogueToken)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
        >
          {showCatalogueToken ? (
            <EyeOff className="size-4" />
          ) : (
            <Eye className="size-4" />
          )}
        </button>
      </div>
    </div>
    ```

  **Must NOT do**:
  - Ne PAS toucher au code WinLeadPlus ou WooCommerce
  - Ne PAS utiliser `showApiToken` (pris par WLP ligne 104)
  - Ne PAS persister le token
  - Ne PAS ajouter de validation sur le champ

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Single file edit, exact same pattern as Task 2 but in different file
  - **Skills**: [`frontend-ui-ux`]
    - `frontend-ui-ux`: Connaît shadcn/ui patterns, Dialog forms

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Task 2)
  - **Blocks**: Task 4
  - **Blocked By**: Task 1

  **References**:

  **Pattern References**:
  - `frontend/src/app/(main)/parametres/integrations/integrations-page-client.tsx:611-640` — WinLeadPlus token input pattern **dans ce même fichier** : `relative` div, `Input type={showApiToken ? "text" : "password"}`, Eye/EyeOff toggle — **COPIER ce pattern** avec état `showCatalogueToken`
  - `frontend/src/app/(main)/parametres/integrations/integrations-page-client.tsx:117-124` — Existing Catalogue state : ajouter `showCatalogueToken` + modifier `catalogueForm`
  - `frontend/src/app/(main)/parametres/integrations/integrations-page-client.tsx:225-229` — `openCatalogueDialog` : réinitialiser token + showCatalogueToken
  - `frontend/src/app/(main)/parametres/integrations/integrations-page-client.tsx:231-249` — `handleTestCatalogueApi` : passer `catalogueForm.authToken`
  - `frontend/src/app/(main)/parametres/integrations/integrations-page-client.tsx:251-270` — `handleImportCatalogue` : passer `authToken`
  - `frontend/src/app/(main)/parametres/integrations/integrations-page-client.tsx:732-747` — Champ URL dans le dialogue : ajouter token APRÈS
  - `frontend/src/app/(main)/parametres/integrations/integrations-page-client.tsx:749-765` — Bouton test : le champ token va AVANT

  **Acceptance Criteria**:

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: Token field exists in catalogue form state
    Tool: Bash
    Steps:
      1. grep -A3 "catalogueForm.*useState" frontend/src/app/(main)/parametres/integrations/integrations-page-client.tsx
      2. Assert: contains "authToken"
      3. grep "showCatalogueToken" frontend/src/app/(main)/parametres/integrations/integrations-page-client.tsx
      4. Assert: useState declaration present
    Expected Result: catalogueForm includes authToken, showCatalogueToken state exists
  ```

  ```
  Scenario: Token passed to test and import functions
    Tool: Bash
    Steps:
      1. grep -B2 -A3 "testCatalogueApiConnection" frontend/src/app/(main)/parametres/integrations/integrations-page-client.tsx | grep -v "import"
      2. Assert: catalogueForm.authToken or similar passed
      3. grep -B2 -A5 "importCatalogueFromApi" frontend/src/app/(main)/parametres/integrations/integrations-page-client.tsx | grep -v "import"
      4. Assert: authToken passed in params
    Expected Result: Both function calls include auth token
  ```

  ```
  Scenario: Token reset on dialog open
    Tool: Bash
    Steps:
      1. grep -A5 "openCatalogueDialog" frontend/src/app/(main)/parametres/integrations/integrations-page-client.tsx
      2. Assert: authToken reset to "" in setCatalogueForm
      3. Assert: setShowCatalogueToken(false) called
    Expected Result: Token and reveal state reset when dialog opens
  ```

  ```
  Scenario: Password input with toggle exists in catalogue dialog
    Tool: Bash
    Steps:
      1. grep "catalogue-token" frontend/src/app/(main)/parametres/integrations/integrations-page-client.tsx
      2. Assert: input id present
      3. grep -c "showCatalogueToken" frontend/src/app/(main)/parametres/integrations/integrations-page-client.tsx
      4. Assert: at least 3 occurrences (state + toggle + conditional)
    Expected Result: Token password input with reveal toggle exists in dialogue
  ```

  **Commit**: YES (groups with Task 2)
  - Message: `feat(integrations): add token input field to catalogue API integration UIs`
  - Files: `frontend/src/components/settings-dialog.tsx`, `frontend/src/app/(main)/parametres/integrations/integrations-page-client.tsx`

---

- [x] 4. Ajouter auto-injection du token de session Keycloak dans `catalogue-api.ts`

  **Context (SCOPE CHANGE)**: L'utilisateur a confirmé que l'API externe utilise le MÊME Keycloak que le CRM. Le token est déjà dans `session.accessToken` via NextAuth. Il faut l'utiliser automatiquement avec possibilité de surcharge manuelle.

  **Comportement cible**: manual token override > session token auto > pas de token

  **What to do**:
  - Ajouter l'import de `auth` depuis `@/lib/auth/auth.server` en haut du fichier
  - Créer une fonction utilitaire `resolveAuthToken` qui :
    1. Si un `manualToken?.trim()` est fourni → le retourner (surcharge manuelle)
    2. Sinon, tenter `const session = await auth(); return session?.accessToken` (auto depuis session)
    3. Si pas de session → retourner `undefined` (pas d'auth)
  - Modifier les deux fonctions pour appeler `resolveAuthToken` au lieu du guard direct :
    - Dans `testCatalogueApiConnection`:
      ```typescript
      const token = await resolveAuthToken(authToken);
      const headers: HeadersInit = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
      ```
    - Dans `importCatalogueFromApi`:
      ```typescript
      const token = await resolveAuthToken(params.authToken);
      const headers: HeadersInit = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
      ```
  - Garder le message 401 spécifique Keycloak tel quel

  **Must NOT do**:
  - Ne PAS supprimer le paramètre `authToken` des deux fonctions (il reste pour la surcharge manuelle)
  - Ne PAS modifier les signatures de fonctions (backward compatible)
  - Ne PAS supprimer le guard `trim()` dans `resolveAuthToken` pour le token manuel
  - Ne PAS modifier les types de retour
  - Ne PAS toucher aux UIs (les champs token restent, ils servent de surcharge)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Single file edit, add helper function + modify 2 fetch calls
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 3 (sequential)
  - **Blocks**: Task 5 (UI update), Task 6 (rebuild)
  - **Blocked By**: Tasks 1, 2, 3

  **References**:

  **Pattern References**:
  - `frontend/src/lib/auth/auth.server.ts:11-13` — `getServerAuth()` function (deprecated alias for `auth()`)
  - `frontend/src/lib/auth/auth.server.ts:22-23` — Pattern: `const session = await auth(); session?.accessToken`
  - `frontend/src/lib/grpc/auth.ts:27-34` — `getAuthMetadata()` function — EXACT same pattern to follow: calls `auth()`, gets `session?.accessToken`, uses it for Bearer header
  - `frontend/src/lib/auth/auth.ts:4` — `export const { auth } = NextAuth(authConfig)` — this is what to import
  - `frontend/src/actions/catalogue-api.ts:14` — Current imports location (add `auth` import after this line)
  - `frontend/src/actions/catalogue-api.ts:70-73` — Current headers block in `testCatalogueApiConnection` (replace)
  - `frontend/src/actions/catalogue-api.ts:162-165` — Current headers block in `importCatalogueFromApi` (replace)

  **Acceptance Criteria**:

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: resolveAuthToken function exists
    Tool: Bash
    Steps:
      1. grep "resolveAuthToken" frontend/src/actions/catalogue-api.ts
      2. Assert: function declaration present
      3. grep "await auth()" frontend/src/actions/catalogue-api.ts
      4. Assert: session retrieval present inside resolveAuthToken
    Expected Result: resolveAuthToken helper exists and calls auth()
  ```

  ```
  Scenario: Import of auth from auth.server exists
    Tool: Bash
    Steps:
      1. grep "import.*auth.*from.*auth.server" frontend/src/actions/catalogue-api.ts
      2. Assert: import present
    Expected Result: auth imported from @/lib/auth/auth.server
  ```

  ```
  Scenario: Both functions use resolveAuthToken
    Tool: Bash
    Steps:
      1. grep -c "resolveAuthToken" frontend/src/actions/catalogue-api.ts
      2. Assert: at least 3 (1 declaration + 2 calls)
    Expected Result: Both fetch functions call resolveAuthToken
  ```

  **Commit**: YES
  - Message: `feat(integrations): auto-inject Keycloak session token for catalogue API calls`
  - Files: `frontend/src/actions/catalogue-api.ts`

---

- [x] 5. Mettre à jour les placeholders UI pour indiquer le comportement auto-token

  **What to do**:
  - Dans `settings-dialog.tsx`, modifier le label et placeholder du champ token :
    - Label: `Token d'authentification (optionnel — auto si vide)` au lieu de `Token d'authentification (optionnel)`
    - Ajouter un petit texte descriptif sous l'input : `<p className="text-xs text-muted-foreground mt-1">Laissez vide pour utiliser le token de votre session Keycloak</p>`
  - Dans `integrations-page-client.tsx`, idem :
    - Label: `Token d'authentification (optionnel — auto si vide)`
    - Ajouter le même texte descriptif

  **Must NOT do**:
  - Ne PAS supprimer les champs token (ils servent de surcharge manuelle)
  - Ne PAS toucher aux cards WinLeadPlus ou WooCommerce
  - Ne PAS modifier la logique des handlers

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Simple label/text changes in 2 files
  - **Skills**: [`frontend-ui-ux`]

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 4
  - **Blocks**: Task 6
  - **Blocked By**: Task 4

  **References**:

  **Pattern References**:
  - `frontend/src/components/settings-dialog.tsx:1171` — Current label: `Token d'authentification (optionnel)` — modify this
  - `frontend/src/components/settings-dialog.tsx:1170-1189` — Current token field block — add descriptive text after
  - `frontend/src/app/(main)/parametres/integrations/integrations-page-client.tsx:754` — Current label — modify
  - `frontend/src/app/(main)/parametres/integrations/integrations-page-client.tsx:753-778` — Current token field block — add descriptive text

  **Acceptance Criteria**:

  ```
  Scenario: Labels updated in both files
    Tool: Bash
    Steps:
      1. grep "auto si vide" frontend/src/components/settings-dialog.tsx
      2. Assert: label present
      3. grep "auto si vide" frontend/src/app/(main)/parametres/integrations/integrations-page-client.tsx
      4. Assert: label present
      5. grep "session Keycloak" frontend/src/components/settings-dialog.tsx
      6. Assert: help text present
      7. grep "session Keycloak" frontend/src/app/(main)/parametres/integrations/integrations-page-client.tsx
      8. Assert: help text present
    Expected Result: Both UIs show auto-token hint
  ```

  **Commit**: YES (groups with Task 4)
  - Message: `feat(integrations): auto-inject Keycloak session token for catalogue API calls`
  - Files: `frontend/src/actions/catalogue-api.ts`, `settings-dialog.tsx`, `integrations-page-client.tsx`

---

- [x] 6. Ajouter la mise à jour des produits existants lors du re-import

- [x] 7. Rebuild frontend Docker + vérification Playwright

  **What to do**:
  - Rebuild l'image : `docker build -t crmdev-crm-frontend --target development -f frontend/Dockerfile .`
  - Démarrer le container avec labels Traefik :
    ```bash
    docker run -d --name alex-frontend --network shared_dev_net -p 3070:3000 --restart unless-stopped \
      -l "traefik.enable=true" \
      -l "traefik.http.routers.alex-front.rule=Host(\`alex.local\`)" \
      -l "traefik.http.services.alex-front.loadbalancer.server.port=3000" \
      crmdev-crm-frontend
    ```
  - Attendre que le container soit `Ready` (vérifier `docker logs alex-frontend --tail 5`)
  - Vérification Playwright des DEUX interfaces

  **Must NOT do**:
  - Ne PAS utiliser `docker compose`

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Rebuild + verification, no code changes
  - **Skills**: [`playwright`]
    - `playwright`: Pour vérification visuelle des deux UIs

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 5 (final)
  - **Blocks**: None
  - **Blocked By**: Tasks 4, 5

  **References**:

  **Pattern References**:
  - Previous successful build command: `docker build -t crmdev-crm-frontend --target development -f frontend/Dockerfile .`
  - Previous successful run command with Traefik labels

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
  Scenario: Settings dialog — Catalogue REST API card complete
    Tool: Playwright (playwright skill)
    Preconditions: alex-frontend container running, accessible at alex.local:8081, user logged in
    Steps:
      1. Navigate to http://alex.local:8081/
      2. Log in with valid credentials
      3. Open settings dialog (click settings icon in sidebar)
      4. Click "Intégrations" in settings sidebar
      5. Scroll to Catalogue REST API card
      6. Assert: text "Catalogue REST API" is visible
      7. Assert: URL input visible
      8. Assert: Token input (password type) visible with auto-token hint text
      9. Assert: Eye/EyeOff toggle works (click → type changes to text)
      10. Screenshot: .sisyphus/evidence/task-6-settings-catalogue-card.png
    Expected Result: Complete catalogue card with token field and auto-hint
    Evidence: .sisyphus/evidence/task-6-settings-catalogue-card.png
  ```

  ```
  Scenario: Integrations page — Catalogue dialog complete
    Tool: Playwright (playwright skill)
    Preconditions: User logged in
    Steps:
      1. Navigate to http://alex.local:8081/parametres/integrations
      2. Find the Catalogue REST API card
      3. Click the "Configurer" button on the Catalogue card
      4. Wait for dialog to open
      5. Assert: URL input visible
      6. Assert: Token input (password type) visible with auto-token hint text
      7. Assert: "Tester la connexion" button visible
      8. Assert: "Importer" button visible (disabled since no test yet)
      9. Screenshot: .sisyphus/evidence/task-6-integrations-catalogue-dialog.png
    Expected Result: Catalogue dialog with token field and auto-hint
    Evidence: .sisyphus/evidence/task-6-integrations-catalogue-dialog.png
  ```

  **Commit**: NO (rebuild only, no code changes)

---

## Commit Strategy

| After Task | Message | Files | Verification |
|------------|---------|-------|--------------|
| 1 | `feat(integrations): add Bearer token auth support to catalogue API actions` | `frontend/src/actions/catalogue-api.ts` | grep Authorization, grep 401, grep trim |
| 2+3 | `feat(integrations): add token input field to catalogue API integration UIs` | `settings-dialog.tsx`, `integrations-page-client.tsx` | grep catalogueApiToken, grep showCatalogueToken |
| 4+5 | `feat(integrations): auto-inject Keycloak session token for catalogue API calls` | `catalogue-api.ts`, `settings-dialog.tsx`, `integrations-page-client.tsx` | grep resolveAuthToken, grep "auto si vide" |

---

## Success Criteria

### Verification Commands
```bash
# Auth header support in actions
grep -c "Authorization" frontend/src/actions/catalogue-api.ts  # Expected: 2
grep -c "Bearer" frontend/src/actions/catalogue-api.ts  # Expected: 2

# Auto-token from session
grep "resolveAuthToken" frontend/src/actions/catalogue-api.ts  # Expected: 3+ (decl + 2 calls)
grep "await auth()" frontend/src/actions/catalogue-api.ts  # Expected: 1 (inside resolveAuthToken)

# 401 specific message
grep -c "Keycloak" frontend/src/actions/catalogue-api.ts  # Expected: 2

# Token field in settings-dialog
grep -c "catalogueApiToken" frontend/src/components/settings-dialog.tsx  # Expected: ≥3
grep -c "showCatalogueToken" frontend/src/components/settings-dialog.tsx  # Expected: ≥3
grep "auto si vide" frontend/src/components/settings-dialog.tsx  # Expected: present

# Token field in integrations-page
grep -c "showCatalogueToken" frontend/src/app/(main)/parametres/integrations/integrations-page-client.tsx  # Expected: ≥3
grep "auto si vide" frontend/src/app/(main)/parametres/integrations/integrations-page-client.tsx  # Expected: present

# Docker container running
docker ps --filter "name=alex-frontend" --format "{{.Status}}"  # Expected: Up ...
```

### Final Checklist
- [x] `authToken` parameter added to both server actions
- [x] `Authorization: Bearer` header sent when token provided
- [x] `authToken?.trim()` guard used (not just `if (authToken)`)
- [x] 401 error shows Keycloak-specific message in both functions
- [x] Token input (password) with Eye/EyeOff toggle in settings-dialog.tsx
- [x] Token input (password) with Eye/EyeOff toggle in integrations-page-client.tsx
- [x] State names are `showCatalogueToken` / `catalogueApiToken` (not reusing `showApiToken`)
- [x] Token reset on catalogue dialog open (integrations-page)
- [x] Auto-injection of session Keycloak token via `resolveAuthToken`
- [x] Manual token override still works (entered token takes priority)
- [x] UI labels mention "auto si vide" behavior
- [x] Help text: "Laissez vide pour utiliser le token de votre session Keycloak"
- [x] No token persistence (not saved anywhere)
- [x] WinLeadPlus and WooCommerce code untouched
- [x] Container frontend rebuilt and healthy
