# Fix Frontend gRPC Module Resolution (Bun + Turbopack Bug)

## TL;DR

> **Quick Summary**: Le runtime Bun dans le conteneur dev frontend cause un bug avec Turbopack où `@grpc/grpc-js` est renommé avec un hash (`@grpc/grpc-js-a3bed6b460f5f8b6`) et ne peut plus être résolu. Fix : utiliser `node:22-alpine` pour le stage development du Dockerfile, et corriger le `NEXTAUTH_URL` pour éviter le hang IPv6 sur Windows.
> 
> **Deliverables**:
> - `frontend/Dockerfile` : stage development basé sur `node:22-alpine` au lieu de `oven/bun:1-alpine`
> - `frontend/.env.development` : `NEXTAUTH_URL=http://127.0.0.1:3000`
> 
> **Estimated Effort**: Quick (~15 min)
> **Parallel Execution**: NO - sequential
> **Critical Path**: Task 1 → Task 2 → Task 3

---

## Context

### Problem 1: gRPC Module Resolution
- **Error**: `Failed to load external module @grpc/grpc-js-a3bed6b460f5f8b6: Cannot find module`
- **Root Cause**: Bug connu Bun + Turbopack — [oven-sh/bun#25370](https://github.com/oven-sh/bun/issues/25370). Le fix Next.js [PR #86697](https://github.com/vercel/next.js/pull/86697) corrige pour Node.js mais PAS pour Bun.
- **Fix**: Utiliser `node:22-alpine` pour le stage dev du Dockerfile

### Problem 2: localhost IPv6 Hang
- **Symptôme**: `http://localhost:3000/` → page blanche, `http://127.0.0.1:3000/` → fonctionne
- **Root Cause**: Windows résout `localhost` en IPv6 `::1`, et le middleware NextAuth hang sur IPv6
- **Fix**: Changer `NEXTAUTH_URL` pour utiliser `127.0.0.1`

---

## Work Objectives

### Must Have
- Le frontend démarre sans erreur gRPC
- `http://127.0.0.1:3000/` charge la page (redirect vers /login ou dashboard)
- Les stages deps, builder, et production du Dockerfile restent sur Bun (pas de régression)

### Must NOT Have
- **NE PAS** changer les stages `deps`, `builder`, `production` du Dockerfile
- **NE PAS** modifier le code TypeScript
- **NE PAS** modifier les proto files ou la config gRPC

---

## TODOs

- [x] 1. Update Dockerfile development stage to use node:22-alpine

  **What to do**:
  - In `frontend/Dockerfile`, change ONLY the development stage (lines 19-43)
  - Replace the base image from `oven/bun:1-alpine` to `node:22-alpine`
  - Update the CMD to use `npx next dev` instead of `bun dev`
  - Install bun for package compatibility: `RUN npm install -g bun`
  - Keep the deps stage as `oven/bun:1-alpine` (bun install is fast)

  **Exact change for the development stage:**
  ```dockerfile
  # ---------------------------------------------------------
  # Stage 2: Development - Hot-reload mode
  # ---------------------------------------------------------
  FROM node:22-alpine AS development

  WORKDIR /app

  # Copy dependencies from deps stage
  COPY --from=deps /app/node_modules ./node_modules

  # Copy proto package for runtime
  COPY packages/proto /packages/proto

  # Copy package.json for scripts
  COPY frontend/package.json ./

  # Environment
  ENV NODE_ENV=development
  ENV NEXT_TELEMETRY_DISABLED=1
  ENV PORT=3000
  ENV HOSTNAME="0.0.0.0"

  EXPOSE 3000

  # Copy proto files at startup and run dev server with Node.js runtime
  # (Bun runtime has a known bug with Turbopack serverExternalPackages - oven-sh/bun#25370)
  CMD sh -c "mkdir -p src/proto && cp -r /packages/proto/gen/ts-frontend/* src/proto/ && npx next dev"
  ```

  **Must NOT do**:
  - Do NOT change the `deps` stage (keep oven/bun:1-alpine for fast installs)
  - Do NOT change the `builder` or `production` stages
  - Do NOT modify any other files

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **References**:
  - `frontend/Dockerfile:19-43` — Current development stage to REPLACE
  - [oven-sh/bun#25370](https://github.com/oven-sh/bun/issues/25370) — Bug report
  - [vercel/next.js#86697](https://github.com/vercel/next.js/pull/86697) — Fix for Node.js only

  **Acceptance Criteria**:
  ```
  Scenario: Development stage uses node:22-alpine
    Tool: Bash (grep)
    Steps:
      1. grep "node:22-alpine" frontend/Dockerfile
      2. Assert: at least 1 match (development stage)
      3. grep "npx next dev" frontend/Dockerfile
      4. Assert: 1 match
      5. grep "oven/bun:1-alpine" frontend/Dockerfile
      6. Assert: still present (deps, builder, production stages unchanged)
    Expected Result: dev stage uses Node, other stages use Bun
  ```

  **Commit**: YES (group with 2)
  - Message: `fix(frontend): use node:22-alpine for dev to fix Turbopack+Bun gRPC bug`
  - Files: `frontend/Dockerfile`, `frontend/.env.development`

---

- [x] 2. Fix NEXTAUTH_URL to use 127.0.0.1 instead of localhost

  **What to do**:
  - In `frontend/.env.development`, change line 7:
    - `NEXTAUTH_URL=http://localhost:3000` → `NEXTAUTH_URL=http://127.0.0.1:3000`

  **Must NOT do**:
  - Do NOT change any other env variables

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **References**:
  - `frontend/.env.development:7` — Current: `NEXTAUTH_URL=http://localhost:3000`

  **Acceptance Criteria**:
  ```
  Scenario: NEXTAUTH_URL uses 127.0.0.1
    Tool: Bash (grep)
    Steps:
      1. grep "NEXTAUTH_URL=http://127.0.0.1:3000" frontend/.env.development
      2. Assert: 1 match
    Expected Result: NEXTAUTH_URL points to IPv4
  ```

  **Commit**: YES (group with 1)

---

- [x] 3. Rebuild frontend container and verify

  **What to do**:
  - Rebuild: `make frontend-down && make frontend-up`
  - Wait for frontend to be ready (check logs for "Ready" message)
  - Test: `curl -s -m 15 http://127.0.0.1:3000/ 2>&1 | head -5` (should return HTML, not hang)
  - Verify no gRPC error in logs: `docker logs dev-crm-frontend --tail 20 2>&1 | grep -i "grpc"` (should be empty)

  **Acceptance Criteria**:
  ```
  Scenario: Frontend loads without gRPC errors
    Tool: Bash
    Steps:
      1. make frontend-down && make frontend-up
      2. sleep 30 (wait for Next.js compilation)
      3. docker logs dev-crm-frontend --tail 30 2>&1
      4. Assert: no "Failed to load external module" error
      5. curl -s -m 15 http://127.0.0.1:3000/ 2>&1
      6. Assert: returns HTTP response (not timeout)
    Expected Result: Frontend starts clean, page loads
  ```

  **Commit**: NO (verification only)

---

## Success Criteria

- [x] Frontend container starts without `@grpc/grpc-js` module resolution error
- [x] `http://127.0.0.1:3000/` loads (redirect to /login or shows page)
- [x] No Turbopack hash suffix errors in frontend logs
- [x] deps/builder/production Dockerfile stages unchanged (still use Bun)
