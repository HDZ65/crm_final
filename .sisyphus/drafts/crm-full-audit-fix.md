# Draft: CRM Full Audit & Fix

## Requirements (confirmed)
- Fix ALL 5 major problems identified in CRM analysis
- Build UI for ALL ~37 backend controllers not connected to frontend
- Migrate ALL REST API calls to gRPC (server actions)
- Remove test pages and mock data
- Fix all critical TODOs
- Update staging Docker to match 5-service architecture
- No tests required

## Technical Decisions
- **REST → gRPC migration**: All hooks using REST (payments, commissions, etc.) must be migrated to gRPC server actions
- **UI for all controllers**: Every backend controller gets a frontend interface, including internal ones (routing, archive, dunning, scoring, etc.)
- **Staging Docker**: Update to reflect 5-service consolidated architecture
- **Test strategy**: No automated tests, QA via Agent-Executed scenarios only

## Research Findings
- **Backend**: 5 NestJS microservices + 1 Python (FastAPI), ~60+ controllers, 100+ entities, gRPC + NATS
- **Frontend**: Next.js 16, React 19, 22 gRPC clients, 27 server actions, 41 pages
- **Gap**: ~50% controllers unconnected, double REST/gRPC system, 5 test pages, 5 mock files
- **Existing tests**: 41 spec files (backend), 3 e2e tests, Jest framework - but user chose no new tests

## Scope Boundaries
- INCLUDE: All 5 problems (controllers UI, REST migration, cleanup, TODOs, staging Docker)
- INCLUDE: service-scoring Python service connection to frontend
- EXCLUDE: Automated tests
- EXCLUDE: Backend code changes (unless needed for frontend connection)
- EXCLUDE: Database migrations

## Open Questions
- None - all answered by user
