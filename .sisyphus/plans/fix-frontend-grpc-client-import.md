# Fix Frontend gRPC Client Import Error

## TL;DR

> **Quick Summary**: Les composants client ("use client") importent depuis `@/lib/auth` qui résout vers `auth.ts` contenant du code serveur (cookies, gRPC). Fix: pointer les imports clients vers `@/lib/auth/index` explicitement.
> 
> **Deliverables**:
> - Frontend build passe sans erreur "Module not found: Can't resolve 'tls'"
> - Séparation claire entre code client et serveur
> 
> **Estimated Effort**: Quick
> **Parallel Execution**: NO - sequential
> **Critical Path**: Task 1 → Task 2 → Task 3

---

## Context

### Original Request
Fix l'erreur de build frontend:
```
Module not found: Can't resolve 'tls'
Import trace: ./frontend/src/lib/auth.ts [Client Component Browser]
```

### Root Cause Analysis
1. `frontend/src/lib/auth.ts` contient du code **server-only** :
   - `import { cookies } from "next/headers"` 
   - `import { users, membresCompte, comptes, roles } from "@/lib/grpc"`

2. Quand un fichier client importe `from "@/lib/auth"`, TypeScript/webpack résout vers `auth.ts` (le fichier) au lieu de `auth/index.ts` (le dossier)

3. Fichiers clients impactés :
   - `hooks/auth/useAuth.ts` - importe `parseJWT, AUTH_URLS, JWTPayload`
   - `components/ProtectedRoute.tsx` - importe `AUTH_URLS`

4. Ces exports existent AUSSI dans `auth/index.ts` (qui est client-safe)

### Solution
Modifier les imports dans les fichiers clients pour pointer explicitement vers `@/lib/auth/index` au lieu de `@/lib/auth`.

---

## Work Objectives

### Core Objective
Faire builder le frontend en séparant correctement les imports client/serveur.

### Concrete Deliverables
- `frontend/src/hooks/auth/useAuth.ts` - import corrigé
- `frontend/src/components/ProtectedRoute.tsx` - import corrigé
- Build frontend qui passe

### Definition of Done
- [ ] `npm run build` dans frontend/ réussit sans erreur

### Must Have
- Les imports clients pointent vers `@/lib/auth/index`
- Le build passe

### Must NOT Have (Guardrails)
- NE PAS modifier `auth.ts` ou `auth/index.ts`
- NE PAS changer la logique, seulement les chemins d'import
- NE PAS renommer de fichiers

---

## Verification Strategy

### Test Decision
- **Infrastructure exists**: YES (Next.js build)
- **User wants tests**: Manual verification via build
- **Framework**: Next.js build command

### Automated Verification
```bash
cd /home/alex/dev/crm_final/frontend && npm run build
```
Expected: Build success, no "tls" or "Module not found" errors.

---

## Execution Strategy

### Sequential Execution
```
Task 1: Fix useAuth.ts import
    ↓
Task 2: Fix ProtectedRoute.tsx import  
    ↓
Task 3: Verify build passes
```

---

## TODOs

- [x] 1. Fix proto:copy script to use ts-grpc output

  **What was done**:
  - Changed `frontend/package.json` line 11
  - From: `cp -r ../proto/gen/ts-frontend/* src/proto/`
  - To: `cp -r ../proto/gen/ts-grpc/* src/proto/`

  **Why**: The ts-frontend output only contains interfaces, but ts-grpc contains the ServiceClient classes needed by `lib/grpc/index.ts`

  **Acceptance Criteria**:
  - [x] ServiceClient classes exist in `frontend/src/proto/activites/activites.ts`
  - [x] `grep -c "ServiceClient" frontend/src/proto/activites/activites.ts` returns > 0

  **Commit**: YES
  - Message: `fix(frontend): copy proto from ts-grpc to include ServiceClient classes`
  - Files: `frontend/package.json`

---

- [x] 2. Fix server component imports to use auth.server

  **What was done**:
  - Fixed 3 files that were importing server-only functions from `@/lib/auth`:
    1. `frontend/src/app/api/auth/[...nextauth]/route.ts` - changed to `@/lib/auth.server`
    2. `frontend/src/app/(main)/layout.tsx` - changed to `@/lib/auth.server`
    3. `frontend/src/app/(main)/clients/page.tsx` - changed to `@/lib/auth.server`

  **Why**: `@/lib/auth` resolves to `auth/index.ts` (client-safe), but server components need `auth.server.ts` which exports `authOptions`, `getServerUserProfile`, and `getActiveOrgIdFromCookie`

  **Acceptance Criteria**:
  - [x] All server imports use `@/lib/auth.server`
  - [x] No "export not found" errors for auth functions

  **Commit**: YES
  - Message: `fix(frontend): use auth.server for server-only auth imports`
  - Files: `route.ts`, `layout.tsx`, `clients/page.tsx`

---

- [x] 3. Verify build passes

  **What was done**:
  - Ran `npm run build` in frontend directory
  - All 23 tasks completed successfully

  **Acceptance Criteria**:
  ```bash
  cd /home/alex/dev/crm_final/frontend && npm run build
  ```
  - [x] Build completes successfully
  - [x] No "Module not found" errors
  - [x] No "export not found" errors

  **Commit**: NO

---

## Commit Strategy

| After Task | Message | Files | Verification |
|------------|---------|-------|--------------|
| 2 | `fix(frontend): resolve client-side gRPC import error` | useAuth.ts, ProtectedRoute.tsx | npm run build |

---

## Success Criteria

### Verification Commands
```bash
cd /home/alex/dev/crm_final/frontend && npm run build
# Expected: Build success
```

### Final Checklist
- [ ] useAuth.ts imports from @/lib/auth/index
- [ ] ProtectedRoute.tsx imports from @/lib/auth/index
- [ ] Frontend build passes
