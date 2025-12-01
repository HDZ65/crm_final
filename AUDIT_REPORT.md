# Audit Backend/Frontend - CRM Final

**Date**: 2025-12-01
**Auteur**: Audit automatisé
**Scope**: Alignement logique métier backend ↔ frontend

---

## Résumé Exécutif

### Verdict Global: ⚠️ PARTIELLEMENT ALIGNÉ

Le frontend respecte **globalement** les contrats API backend, mais plusieurs **divergences critiques** ont été identifiées qui peuvent causer des bugs en production ou une UX trompeuse.

| Catégorie | Niveau |
|-----------|--------|
| Authentification | ✅ OK |
| Gestion des erreurs | ⚠️ Partiel |
| Types/Enums | ❌ Divergent |
| Validation formulaires | ⚠️ Partiel |
| Gestion des rôles | ⚠️ Partiel |
| Flux métier | ✅ OK |

### Risques Majeurs de Divergence

1. **Enums `typeBase` Commission incohérents** - Crash potentiel
2. **Rôles non vérifiés avant actions orchestration** - 403 silencieux
3. **Champs UI non implémentés backend** - UX trompeuse
4. **Validation email optionnelle front vs requise back** - Rejet silencieux

---

## 1. Cartographie des Domaines Métier

### 1.1 Domaines Identifiés

| Domaine | Responsabilités | Backend Controllers | Frontend Hooks |
|---------|-----------------|---------------------|----------------|
| **Auth** | Authentification, sync Keycloak, profil | `auth.controller.ts` | `useAuth.ts`, `organisation-context.tsx` |
| **Clients** | CRUD clients, statuts, groupes | `client-base.controller.ts`, `statut-client.controller.ts` | `use-clients.ts`, `use-statut-clients.ts` |
| **Contrats** | CRUD, orchestration lifecycle | `contrat.controller.ts`, `contract-orchestration.controller.ts` | `use-contract-orchestration.ts` |
| **Commissions** | Calcul, barèmes, reprises, bordereaux | `commission.controller.ts`, `commission-engine.controller.ts` | `use-commissions.ts`, `use-commission-engine.ts` |
| **Dashboard** | KPIs, stats, alertes | `dashboard.controller.ts` | `use-dashboard-kpis.ts`, `use-dashboard-stats.ts` |
| **Logistics** | Expéditions, colis, tracking | `expedition.controller.ts`, `logistics.controller.ts` | `use-expeditions.ts` |
| **Notifications** | Real-time WebSocket + REST | `notification.controller.ts` | `notification-context.tsx` |

### 1.2 Use-Cases Clés

#### UC-01: Authentification & Profil
- **Backend**: `GET /auth/me` - Décode JWT, sync utilisateur Keycloak → BDD, retourne profil + organisations
- **Frontend**: `useAuth()` + `useOrganisation()` - Session NextAuth, token refresh, sélection organisation active
- **Règles métier**: Token validité via décod manuel (pas de validation signature côté back sur /auth/me car @Public())

#### UC-02: Gestion Clients
- **Backend**: `POST/GET/PUT/DELETE /clientbases`
- **Frontend**: `useClients()`, `CreateClientDialog`, `EditClientDialog`
- **Règles métier**:
  - `statutId` obligatoire
  - `compteCode` généré automatiquement côté front
  - `partenaireId` requis backend, défaulté à `organisationId` côté front

#### UC-03: Orchestration Contrats
- **Backend**: `POST /orchestration/contracts/:id/{activate|suspend|terminate|port-in}`
- **Frontend**: `useContractOrchestration()`
- **Règles métier**:
  - Rôles requis: `realm:commercial`, `realm:manager`, `realm:admin`
  - Transitions d'état gérées côté backend

#### UC-04: Calcul Commissions
- **Backend**: `CommissionEngineService.calculerCommission()`
- **Frontend**: `useCommissionEngine()`
- **Règles métier**:
  - Types calcul: `fixe`, `pourcentage`, `palier`, `mixte`
  - Reprises automatiques: résiliation, impayé, annulation
  - Durée reprise: 3, 6 ou 12 mois selon barème

---

## 2. Contrats API & Données

### 2.1 Endpoints Critiques - Analyse Détaillée

#### `GET /auth/me`
| Aspect | Backend | Frontend | Alignement |
|--------|---------|----------|------------|
| Route | `/auth/me` | `/auth/me` | ✅ |
| Auth | `@Public()` + header manuel | Bearer token | ✅ |
| Response | `UserProfileResponseDto` | `AuthMeResponse` | ✅ |
| Champs | `id, keycloakId, email, nom, prenom, telephone, actif, organisations, hasOrganisation` | Identique | ✅ |

#### `POST /clientbases`
| Aspect | Backend | Frontend | Alignement |
|--------|---------|----------|------------|
| Route | `/clientbases` | `/clientbases` | ✅ |
| Body required | `organisationId, typeClient, nom, prenom, compteCode, partenaireId, dateCreation, telephone, statutId` | Généré | ⚠️ |
| `email` | `@IsOptional() @IsEmail()` | `z.string().email().optional()` | ✅ |
| `dateNaissance` | `@IsOptional() @IsISO8601()` | `z.string().optional()` | ⚠️ Pas de validation ISO8601 |

**Problème**: Le frontend ne valide pas le format ISO8601 pour `dateNaissance`. Une date invalide sera rejetée par le backend.

#### `GET /commissions`
| Aspect | Backend | Frontend | Alignement |
|--------|---------|----------|------------|
| Filters | `organisationId`, `apporteurId`, `periode` | Identique | ✅ |
| Response | `CommissionResponseDto[]` | `CommissionResponseDto[]` | ⚠️ |
| `typeBase` enum | Non documenté explicitement | `cotisation_ht \| ca_ht \| forfait` | ❌ **CRITIQUE** |

**Problème CRITIQUE**: L'entité backend utilise `forfait_fixe` et `pourcentage_ca` dans ses méthodes métier, mais le frontend définit `cotisation_ht`, `ca_ht`, `forfait`. **Risque de bug silencieux**.

#### `POST /orchestration/contracts/:id/activate`
| Aspect | Backend | Frontend | Alignement |
|--------|---------|----------|------------|
| Route | `/orchestration/contracts/:id/activate` | `/orchestration/contracts/${contractId}/activate` | ✅ |
| Auth | `@Roles(['realm:commercial', 'realm:manager', 'realm:admin'])` | Aucune vérification préalable | ❌ |
| Body | `OrchestrationCommandDto` | `OrchestrationPayload` | ✅ |

**Problème**: Le frontend ne vérifie pas les rôles avant d'afficher les boutons d'action. L'utilisateur peut cliquer et recevoir un 403.

### 2.2 Breaking Changes Potentiels

| API | Risque | Description |
|-----|--------|-------------|
| `typeBase` enum | **ÉLEVÉ** | Valeurs enum divergentes entre front/back |
| `dateNaissance` format | MOYEN | Pas de validation ISO8601 côté front |
| `partenaireId` default | FAIBLE | Défault à `organisationId`, sémantiquement incorrect |

---

## 3. Vérification Implémentation Front vs Back

### 3.1 Tableau Use-Case → Front

| Use-Case | Backend Endpoints | Frontend Files | Alignement |
|----------|-------------------|----------------|------------|
| **Auth/Login** | `GET /auth/me` | `src/hooks/auth/useAuth.ts:64-69`, `src/app/api/auth/[...nextauth]/route.ts` | ✅ OK |
| **Liste Clients** | `GET /clientbases` | `src/hooks/clients/use-clients.ts:273-311` | ✅ OK |
| **Créer Client** | `POST /clientbases` | `src/app/(main)/clients/create-client-dialog.tsx:112-140` | ⚠️ Partiel |
| **Modifier Client** | `PUT /clientbases/:id` | `src/app/(main)/clients/edit-client-dialog.tsx:110-128` | ⚠️ Partiel |
| **Liste Commissions** | `GET /commissions` | `src/hooks/commissions/use-commissions.ts:17-56` | ✅ OK |
| **Commissions détails** | `GET /commissions/with-details` | `src/hooks/commissions/use-commissions.ts:62-120` | ✅ OK |
| **Orchestration Contrat** | `POST /orchestration/contracts/:id/*` | `src/hooks/contracts/use-contract-orchestration.ts:44-74` | ⚠️ Partiel |
| **Dashboard KPIs** | `GET /dashboard/kpis` | `src/hooks/stats/use-dashboard-kpis.ts:31-139` | ✅ OK |
| **Notifications WS** | WebSocket `/notifications` | `src/contexts/notification-context.tsx:72-160` | ✅ OK |

### 3.2 Détail des Divergences

#### ❌ Create Client Dialog - Divergence Partielle
**Fichier**: `src/app/(main)/clients/create-client-dialog.tsx:122-134`

```typescript
// FRONTEND (ligne 128-129)
compteCode: `CLI-${Date.now().toString(36).toUpperCase()}`,
partenaireId: activeOrganisation.id, // Default to organisation
```

**Problème**:
- `partenaireId` est défaulté à `organisationId`, ce qui n'est pas sémantiquement correct. Un partenaire n'est pas une organisation.
- Pas de sélecteur de partenaire dans le formulaire.

**Impact**: Données incorrectes en BDD, relations cassées.

#### ❌ Edit Client Dialog - Type Date Incorrect
**Fichier**: `src/app/(main)/clients/edit-client-dialog.tsx:116`

```typescript
// FRONTEND
dateNaissance: data.dateNaissance ? new Date(data.dateNaissance) : null,
```

**Problème**: Le backend attend un string ISO8601 (`@IsISO8601()`), pas un objet `Date`.

**Impact**: Erreur de validation 400 Bad Request.

#### ❌ Commission TypeBase - Enum Mismatch
**Fichier Frontend**: `src/types/commission-dto.ts:7`
```typescript
export type TypeBase = 'cotisation_ht' | 'ca_ht' | 'forfait'
```

**Fichier Backend**: `src/core/domain/commission.entity.ts:57-64`
```typescript
isForfaitFixe(): boolean { return this.typeBase === 'forfait_fixe'; }
isPourcentageCA(): boolean { return this.typeBase === 'pourcentage_ca'; }
```

**Impact CRITIQUE**: Les méthodes métier backend utilisent des valeurs différentes. Risque de données incohérentes ou de bugs de filtrage.

#### ⚠️ Contract Orchestration - Pas de Vérification Rôle
**Fichier**: `src/hooks/contracts/use-contract-orchestration.ts`

Le hook ne vérifie pas si l'utilisateur a les rôles requis (`realm:commercial`, `realm:manager`, `realm:admin`) avant d'appeler l'API.

**Impact**: L'utilisateur voit les boutons d'action, clique, et reçoit une erreur 403 Forbidden.

**Recommandation**:
```typescript
// Ajouter dans useContractOrchestration
const { hasAnyRole } = useAuth();
const canOrchestrate = hasAnyRole(['realm:commercial', 'realm:manager', 'realm:admin']);
```

### 3.3 Gestion des Erreurs

#### Backend Error Format
**Fichier**: `src/infrastructure/framework/nest/filters/all-exceptions.filter.ts`

```typescript
interface ErrorResponse {
  code: string;      // Ex: 'BAD_REQUEST', 'UNAUTHORIZED'
  message: string;   // Message traduit
  timestamp: string;
  path: string;
  method: string;
  details?: unknown; // Erreurs de validation
}
```

#### Frontend Error Handling
**Fichier**: `src/lib/api.ts:97-114`

```typescript
// Frontend extrait le message mais ignore le code
errorMessage = errorData.message || errorData.error || errorMessage;
```

**Problème**: Le frontend n'utilise pas le `code` d'erreur standardisé pour un handling plus précis.

#### Frontend Error Translation
**Fichier**: `src/lib/error-messages.ts`

✅ **Bien fait**: Mapping extensif des messages backend → messages UX français.

⚠️ **Manque**: Pas de mapping pour certains codes comme `UNPROCESSABLE_ENTITY`, `TOO_MANY_REQUESTS`.

---

## 4. Gestion des États UI

### 4.1 États Loading/Error/Empty

| Hook | Loading | Error | Empty | Retry |
|------|---------|-------|-------|-------|
| `useClients` | ✅ | ✅ | ❌ Non géré | ✅ `refetch` |
| `useCommissions` | ✅ | ✅ | ❌ Non géré | ✅ `refetch` |
| `useDashboardKPIs` | ✅ | ✅ | ❌ Non géré | ✅ `refetch` |
| `useOrganisation` | ✅ | ✅ | ✅ `hasOrganisation` | ✅ `refetch` |

**Problème**: Pas de gestion explicite de l'état "vide" (liste sans résultats) dans la plupart des hooks.

### 4.2 Transitions d'État Contrat

**Backend** (implicite via orchestration):
```
DRAFT → ACTIVE → SUSPENDED → TERMINATED
              ↘ TERMINATED
```

**Frontend**: Aucune machine à états explicite. Les transitions sont gérées via appels API directs.

**Recommandation**: Ajouter une validation côté front avant d'autoriser certaines transitions.

---

## 5. Alignement Global Front/Back

### 5.1 Cohérence des Noms de Champs

| Backend | Frontend | Alignement |
|---------|----------|------------|
| `organisationId` | `organisationId` | ✅ |
| `statutId` | `statutId` | ✅ |
| `createdAt` | `createdAt` | ✅ |
| `montantNetAPayer` | `montantNetAPayer` | ✅ |
| `typeBase` | `typeBase` | ❌ Valeurs différentes |

✅ Pas de problème snake_case ↔ camelCase (tout en camelCase).

### 5.2 Sérialisation/Désérialisation

| Type | Backend | Frontend | Alignement |
|------|---------|----------|------------|
| Dates | ISO8601 string | `Date \| string` union type | ⚠️ |
| Montants | `number` | `number` | ✅ |
| UUIDs | `string` | `string` | ✅ |
| Booleans | `boolean` | `boolean` | ✅ |

**Problème Date**: Le frontend accepte `Date | string` mais le backend sérialise toujours en string. Incohérence potentielle lors de l'envoi (voir Edit Client).

### 5.3 Auth - Stockage Token

| Aspect | Implémentation | Sécurité |
|--------|----------------|----------|
| Stockage | NextAuth session (JWT strategy) | ✅ Pas de localStorage |
| Refresh | Auto via `refreshToken()` | ✅ |
| Expiration | Vérifié à chaque requête | ✅ |
| 401 Handling | `api.setOnUnauthorized()` callback | ✅ |

### 5.4 Protection Routes

**Middleware**: `src/middleware.ts`
- Routes publiques correctement définies
- Redirection vers `/login` avec `callbackUrl`

**Gardes de rôles**: `src/components/role-guard.tsx`
- `<RoleGuard>` composant disponible
- `useRoleCheck()` hook disponible
- **Problème**: Non utilisé systématiquement (ex: orchestration)

---

## 6. Antipatterns Détectés

### 6.1 Logique Métier dans le Front

| Fichier | Problème | Recommandation |
|---------|----------|----------------|
| `create-client-dialog.tsx:128` | Génération `compteCode` | Déplacer côté backend |
| `create-client-dialog.tsx:129` | Default `partenaireId = organisationId` | Ajouter sélecteur partenaire |
| `use-clients.ts:54-68` | Calcul `formatCreatedAgo()` | OK (pure UI) |

### 6.2 Logique Backend Non Implémentée Front

| Backend | Frontend | Impact |
|---------|----------|--------|
| Rôles orchestration | Pas de vérification | UX trompeuse, 403 |
| `typeBase` enum complet | Enum partiel | Données filtrées incorrectement |
| Validation ISO8601 | Validation absente | Erreurs 400 |

### 6.3 Types Détachés du Contrat Réel

**Fichier**: `src/types/commission-dto.ts`

Les types sont définis manuellement et non générés depuis le backend (Swagger/OpenAPI). Risque de désynchronisation.

**Recommandation**: Générer les types depuis `http://backend/api-json` avec `openapi-typescript`.

### 6.4 Endpoints Non Implémentés

| Endpoint | Status | Impact |
|----------|--------|--------|
| `GET /clientbases/:id/paiements` | Non implémenté backend | Front retourne `[]` |
| `GET /clientbases/:id/documents` | Non implémenté backend | Front retourne `[]` |
| `GET /clientbases/:id/evenements` | Non implémenté backend | Front retourne `[]` |

**Source**: `src/hooks/clients/use-clients.ts:332-339` - Commentaire indiquant l'absence d'endpoints.

---

## 7. Top Priorités (Actions Correctives)

### P1 - CRITIQUE

#### 1. Aligner Enum `typeBase` Commission
**Impact**: Bugs de filtrage, données incohérentes
**Fichiers**:
- Backend: `src/core/domain/commission.entity.ts`
- Frontend: `src/types/commission-dto.ts:7`

**Fix Backend** (recommandé):
```typescript
// Standardiser sur les valeurs métier
export type TypeBase = 'cotisation_ht' | 'ca_ht' | 'forfait';

// Mettre à jour les méthodes entity
isCotisationHT(): boolean { return this.typeBase === 'cotisation_ht'; }
isCAHT(): boolean { return this.typeBase === 'ca_ht'; }
isForfait(): boolean { return this.typeBase === 'forfait'; }
```

#### 2. Corriger Edit Client Date Serialization
**Impact**: Erreur 400 systématique sur modification
**Fichier**: `src/app/(main)/clients/edit-client-dialog.tsx:116`

**Fix**:
```typescript
// AVANT
dateNaissance: data.dateNaissance ? new Date(data.dateNaissance) : null,

// APRÈS
dateNaissance: data.dateNaissance || null, // Garder en string ISO8601
```

### P2 - HAUTE

#### 3. Ajouter Vérification Rôles Orchestration
**Impact**: UX trompeuse, erreurs 403
**Fichier**: `src/hooks/contracts/use-contract-orchestration.ts`

**Fix**:
```typescript
export function useContractOrchestration(contractId: string): UseContractOrchestrationResult {
  const { hasAnyRole } = useAuth();

  const canOrchestrate = useMemo(() =>
    hasAnyRole(['realm:commercial', 'realm:manager', 'realm:admin']),
    [hasAnyRole]
  );

  // ... reste du hook

  return {
    loading,
    error,
    lastAction,
    canOrchestrate, // NOUVEAU
    activate: canOrchestrate ? activate : async () => false,
    // ...
  };
}
```

#### 4. Validation ISO8601 pour dateNaissance
**Impact**: Rejet silencieux formulaire
**Fichier**: `src/app/(main)/clients/create-client-dialog.tsx:42`

**Fix**:
```typescript
// AVANT
dateNaissance: z.string().optional(),

// APRÈS
dateNaissance: z.string()
  .refine(val => !val || /^\d{4}-\d{2}-\d{2}$/.test(val), 'Date au format YYYY-MM-DD')
  .optional(),
```

### P3 - MOYENNE

#### 5. Ajouter Sélecteur Partenaire dans Création Client
**Impact**: Données incorrectes
**Fichier**: `src/app/(main)/clients/create-client-dialog.tsx`

**Action**: Ajouter un champ `Select` pour `partenaireId` avec fetch depuis `GET /apporteurs` ou endpoint dédié.

#### 6. Générer Types depuis OpenAPI
**Impact**: Désynchronisation types
**Action**:
```bash
npx openapi-typescript http://localhost:8000/api-json -o src/types/api.generated.ts
```

#### 7. Gestion État Empty pour Listes
**Impact**: UX incomplète
**Fichiers**: Tous les hooks de liste

**Fix Pattern**:
```typescript
return {
  data,
  loading,
  error,
  isEmpty: !loading && !error && data.length === 0, // NOUVEAU
  refetch,
};
```

---

## 8. Résumé des Fichiers Impactés

| Fichier | Type | Problèmes |
|---------|------|-----------|
| `frontend/src/types/commission-dto.ts:7` | Type | Enum `typeBase` incorrect |
| `frontend/src/app/(main)/clients/edit-client-dialog.tsx:116` | Component | Date serialization |
| `frontend/src/app/(main)/clients/create-client-dialog.tsx:128-129` | Component | Logique métier, partenaire |
| `frontend/src/hooks/contracts/use-contract-orchestration.ts` | Hook | Pas de vérification rôles |
| `frontend/src/hooks/clients/use-clients.ts:332-339` | Hook | Endpoints non implémentés |
| `backend/src/core/domain/commission.entity.ts:57-64` | Entity | Valeurs enum différentes |

---

## Conclusion

L'application présente une architecture solide avec une bonne séparation des responsabilités. Cependant, **7 problèmes critiques ou importants** nécessitent une correction avant mise en production :

1. ❌ Enum `typeBase` divergent (P1)
2. ❌ Serialisation date incorrecte (P1)
3. ⚠️ Rôles non vérifiés orchestration (P2)
4. ⚠️ Validation ISO8601 manquante (P2)
5. ⚠️ `partenaireId` mal géré (P3)
6. ⚠️ Types non générés (P3)
7. ⚠️ État empty non géré (P3)

**Effort estimé**: 2-3 jours développeur pour les corrections P1/P2.
