# Decisions - fix-websocket-port

This file captures architectural and implementation choices made during execution.

## [2026-02-12T12:02] Decision: Use localhost:3071 for NEXT_PUBLIC_WS_URL

**Context**: Frontend runs in Docker but browser runs on host machine.

**Decision**: Set `NEXT_PUBLIC_WS_URL=http://localhost:3071` in both `.env.development` and `.env.local`.

**Rationale**: 
- `NEXT_PUBLIC_*` env vars are used client-side (browser context)
- Browser cannot resolve Docker internal hostnames like `crm-service-engagement`
- Docker compose maps service-engagement HTTP port: `3071:3061` (host:container)
- Browser must connect to host-accessible port `3071`

**Alternatives Considered**:
- ❌ `crm-service-engagement:3061` — Browser can't resolve Docker hostnames
- ❌ `localhost:3061` — Port 3061 not exposed on host (3071 is the mapped port)
- ✅ `localhost:3071` — Correct host-accessible port
