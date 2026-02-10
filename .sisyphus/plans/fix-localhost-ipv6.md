# Fix localhost IPv6 Hang on Windows

## TL;DR

> **Quick Summary**: Sur Windows, `localhost` résout en IPv6 (`::1`) ce qui cause un hang infini du middleware Next.js. Fix: forcer le hostname IPv4 (`0.0.0.0`) dans la config Next.js.
> 
> **Deliverables**:
> - `frontend/next.config.ts` : Ajout de `hostname: '0.0.0.0'` dans la config dev server
> 
> **Estimated Effort**: Quick (~5 min)
> **Parallel Execution**: NO - single task

---

## Context

### Problem
- `http://localhost:3000/` → page blanche, hang infini
- `http://127.0.0.1:3000/` → fonctionne parfaitement (redirect vers /login)
- Cause : Windows résout `localhost` en IPv6 (`::1`), et le middleware Next.js hang sur les connexions IPv6

### Root Cause
Next.js dev server écoute par défaut sur `::` (IPv6 all interfaces). Quand une requête arrive via IPv6 `::1`, le middleware Auth (NextAuth + Keycloak) hang indéfiniment. C'est un bug connu de compatibilité IPv6 avec certaines configurations Docker/middleware.

---

## TODOs

- [x] 1. Update NEXTAUTH_URL in frontend/.env.development to use 127.0.0.1

  **What to do**:
  - In `frontend/.env.development`, change `NEXTAUTH_URL=http://localhost:3000` to `NEXTAUTH_URL=http://127.0.0.1:3000`
  - This ensures NextAuth internal callbacks use IPv4

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **References**:
  - `frontend/.env.development:7` — Current: `NEXTAUTH_URL=http://localhost:3000`

  **Acceptance Criteria**:
  - [ ] `grep "NEXTAUTH_URL=http://127.0.0.1:3000" frontend/.env.development` returns 1 match
  - [ ] `http://localhost:3000/` loads in browser (after container restart)

  **Commit**: YES
  - Message: `fix(frontend): use 127.0.0.1 for NEXTAUTH_URL to avoid IPv6 hang on Windows`
  - Files: `frontend/.env.development`

---

## Success Criteria

- [x] `http://localhost:3000/` no longer hangs (redirects to /login or shows page)
- [x] `http://127.0.0.1:3000/` still works
- [x] No TypeScript code modified
