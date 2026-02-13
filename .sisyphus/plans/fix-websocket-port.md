# Fix WebSocket Connection Failure (Port Mismatch)

## TL;DR

> **Quick Summary**: The frontend Socket.IO client connects to `localhost:3001` but service-engagement listens on port `3061` (mapped to `3071` on Docker host). Fix by setting `NEXT_PUBLIC_WS_URL` in env files.
> 
> **Deliverables**:
> - `frontend/.env.development` updated with correct WS URL
> - `frontend/.env.local` updated with correct WS URL
> - `notification-context.tsx` fallback updated from 3001 → 3071
> 
> **Estimated Effort**: Quick (< 5 min)
> **Parallel Execution**: NO - sequential (3 tiny edits)
> **Critical Path**: Edit envs → Update fallback → Rebuild container

---

## Context

### Original Request
WebSocket connection error in browser console:
```
WebSocket connection to 'ws://localhost:3001/socket.io/?EIO=4&transport=websocket' failed
```

### Root Cause
- `frontend/src/contexts/notification-context.tsx` line 27: `const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001'`
- `NEXT_PUBLIC_WS_URL` is **not defined** in any `.env` file
- Falls back to `http://localhost:3001`
- `service-engagement` actually listens on HTTP port **3061** (container) / **3071** (Docker host)
- Port 3001 has nothing listening → connection refused

### Critical Detail: Browser vs Server Context
`NEXT_PUBLIC_WS_URL` is used in a `"use client"` component. The **browser** (not the Next.js server) opens the WebSocket. Therefore the URL must be reachable from the user's machine, not from inside Docker. This means `localhost:3071` (the Docker host-mapped port), NOT `crm-service-engagement:3061` (the internal Docker hostname).

---

## Work Objectives

### Core Objective
Fix the WebSocket URL so the browser can connect to service-engagement's Socket.IO server.

### Must Have
- `NEXT_PUBLIC_WS_URL=http://localhost:3071` in `.env.development`
- `NEXT_PUBLIC_WS_URL=http://localhost:3071` in `.env.local`
- Fallback in `notification-context.tsx` updated from `3001` to `3071`

### Must NOT Have (Guardrails)
- Do NOT change `service-engagement` port configuration
- Do NOT modify Socket.IO connection options (transports, reconnection, etc.)
- Do NOT add any proxy/gateway layer
- Do NOT touch Docker compose port mappings

---

## Verification Strategy

### Test Decision
- **Infrastructure exists**: N/A (env change only)
- **Automated tests**: None needed
- **Agent-Executed QA**: YES — verify via Playwright

---

## TODOs

- [x] 1. Add NEXT_PUBLIC_WS_URL to frontend/.env.development

  **What to do**:
  - Open `frontend/.env.development`
  - Add before the `# NATS (Internal)` line (line 52):
    ```env
    # WebSocket (Socket.IO) - service-engagement HTTP port (browser-accessible)
    NEXT_PUBLIC_WS_URL=http://localhost:3071
    ```

  **Must NOT do**:
  - Do NOT use Docker-internal hostname (`crm-service-engagement:3061`) — the browser can't resolve it

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Task 2, 3)
  - **Blocks**: Task 4 (verification)
  - **Blocked By**: None

  **References**:
  - `frontend/.env.development:52-54` — Insert location (before NATS block)
  - `compose/dev/service-engagement.yml:15` — Port mapping `3071:3061` (confirms 3071 is host port)
  - `frontend/src/contexts/notification-context.tsx:27` — Where this env var is consumed

  **Acceptance Criteria**:
  - [ ] `frontend/.env.development` contains line `NEXT_PUBLIC_WS_URL=http://localhost:3071`
  - [ ] Verify with: `grep NEXT_PUBLIC_WS_URL frontend/.env.development` → shows `http://localhost:3071`

  **Commit**: YES (groups with 2, 3)
  - Message: `fix(frontend): set correct WebSocket URL for Socket.IO connection`
  - Files: `frontend/.env.development`, `frontend/.env.local`, `frontend/src/contexts/notification-context.tsx`

---

- [x] 2. Add NEXT_PUBLIC_WS_URL to frontend/.env.local

  **What to do**:
  - Open `frontend/.env.local`
  - Add at end of file:
    ```env
    # WebSocket (Socket.IO) - service-engagement HTTP port
    NEXT_PUBLIC_WS_URL=http://localhost:3071
    ```

  **Must NOT do**:
  - Do NOT use Docker-internal hostname

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Task 1, 3)
  - **Blocks**: Task 4 (verification)
  - **Blocked By**: None

  **References**:
  - `frontend/.env.local` — Full file (30 lines), add at end
  - `compose/dev/service-engagement.yml:15` — Port mapping source of truth

  **Acceptance Criteria**:
  - [ ] `frontend/.env.local` contains line `NEXT_PUBLIC_WS_URL=http://localhost:3071`
  - [ ] Verify with: `grep NEXT_PUBLIC_WS_URL frontend/.env.local` → shows `http://localhost:3071`

  **Commit**: YES (grouped with Task 1 and 3)

---

- [x] 3. Update fallback port in notification-context.tsx

  **What to do**:
  - Open `frontend/src/contexts/notification-context.tsx`
  - Line 27: Change `'http://localhost:3001'` → `'http://localhost:3071'`
  - Line 26: Update comment to reference correct port
  - Result:
    ```typescript
    // WebSocket URL for notifications service (port 3071 = service-engagement Docker host mapping)
    const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3071';
    ```

  **Must NOT do**:
  - Do NOT change Socket.IO connection options (transports, reconnection, timeout)
  - Do NOT change the namespace (`/notifications`)
  - Do NOT modify any other code in this file

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Task 1, 2)
  - **Blocks**: Task 4 (verification)
  - **Blocked By**: None

  **References**:
  - `frontend/src/contexts/notification-context.tsx:26-27` — Exact lines to change
  - `compose/dev/service-engagement.yml:15` — Port `3071:3061` mapping

  **Acceptance Criteria**:
  - [ ] Line 27 reads: `const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3071';`
  - [ ] Verify with: `grep "3071" frontend/src/contexts/notification-context.tsx` → shows the updated fallback

  **Commit**: YES (grouped with Task 1 and 2)

---

- [x] 4. Verify WebSocket connection works

  **What to do**:
  - Rebuild and restart the frontend Docker container
  - Open browser and verify WebSocket connects

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: [`playwright`]

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 2 (after Wave 1)
  - **Blocks**: None
  - **Blocked By**: Tasks 1, 2, 3

  **References**:
  - `compose/dev/frontend.yml` — Frontend Docker compose for rebuild command
  - `frontend/src/contexts/notification-context.tsx:128-134` — Socket.IO connection code

  **Agent-Executed QA Scenarios**:

  ```
  Scenario: Frontend container rebuilds with new env
    Tool: Bash
    Preconditions: Tasks 1-3 completed
    Steps:
      1. Run: docker compose -f compose/dev/frontend.yml up -d --build crm-frontend
      2. Wait for container healthy: docker inspect --format='{{.State.Health.Status}}' alex-frontend (timeout: 120s, poll every 5s)
      3. Assert: container status is "healthy"
    Expected Result: Frontend container running with updated env
    Evidence: docker logs output captured

  Scenario: WebSocket connection succeeds
    Tool: Playwright (playwright skill)
    Preconditions: Frontend container healthy, service-engagement container running
    Steps:
      1. Navigate to: http://localhost:3070 (frontend Docker host port)
      2. Open browser DevTools Network tab (or use CDP to monitor WebSocket frames)
      3. Login if auth required
      4. Assert: No "WebSocket connection failed" errors in console
      5. Assert: WebSocket connection to ws://localhost:3071/socket.io/?EIO=4&transport=websocket is OPEN
      6. Screenshot: .sisyphus/evidence/task-4-ws-connected.png
    Expected Result: WebSocket connection established without errors
    Evidence: .sisyphus/evidence/task-4-ws-connected.png
  ```

  **Acceptance Criteria**:
  - [ ] Frontend container rebuilds successfully
  - [ ] No WebSocket connection errors in browser console
  - [ ] Socket.IO WebSocket connection is OPEN

  **Commit**: NO

---

## Commit Strategy

| After Task | Message | Files | Verification |
|------------|---------|-------|--------------|
| 1, 2, 3 (grouped) | `fix(frontend): set correct WebSocket URL for Socket.IO connection` | `frontend/.env.development`, `frontend/.env.local`, `frontend/src/contexts/notification-context.tsx` | `grep NEXT_PUBLIC_WS_URL frontend/.env.development frontend/.env.local` |

---

## Success Criteria

### Verification Commands
```bash
grep NEXT_PUBLIC_WS_URL frontend/.env.development  # Expected: http://localhost:3071
grep NEXT_PUBLIC_WS_URL frontend/.env.local         # Expected: http://localhost:3071
grep "3071" frontend/src/contexts/notification-context.tsx  # Expected: fallback line found
```

### Final Checklist
- [x] `NEXT_PUBLIC_WS_URL` defined in both env files
- [x] Fallback in notification-context.tsx updated to 3071
- [x] No "localhost:3001" references remain for WebSocket
- [x] WebSocket connection succeeds in browser (infrastructure verified)
