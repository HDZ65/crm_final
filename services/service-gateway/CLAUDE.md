# Service-Gateway

Stateless external REST ingress for the CRM. Receives webhook payloads from WinLead+ and future integrations, validates them via Keycloak JWT, and forwards internally via NATS + gRPC to multiple domain services (Engagement, Core, Commercial, Finance, Logistics).

## Architecture

This service is intentionally **stateless** — no database, no gRPC server, no migrations.

```
src/
├── auth/                   # Keycloak JWT guard + CurrentUser decorator
├── common/                 # HttpExceptionFilter (global)
├── contrat/                # POST /api/winleadplus webhook controller + DTOs + enums
│   ├── dto/                # class-validator DTOs (snake_case, matches WinLead+ schema)
│   └── enums/              # Civilite, CspNeoliane, RegimeSocial, Profession, etc.
├── health/                 # GET /health controller
├── nats/                   # NATS publisher module (publish-only, no subscriptions)
├── grpc/                   # gRPC clients to 5 domain services (engagement, core, commercial, finance, logistics)
├── app.module.ts           # Root module
└── main.ts                 # HTTP bootstrap (no gRPC server)
```

**Flow**: `WinLead+ → POST /api/winleadplus → KeycloakJwtGuard → ValidationPipe → ContratController → NATS publish + gRPC call (optional) → HTTP 202`

## Endpoints

| Method | Path | Auth | Response |
|--------|------|------|----------|
| `POST` | `/api/winleadplus` | Keycloak JWT (Bearer) | `202 { success, correlation_id, message }` |
| `GET` | `/health` | None | `200 { status: "ok", timestamp, service }` |
| `GET` | `/api/docs` | None | Swagger/OpenAPI 3.0 documentation |
| `*` | `/api/{domain}/*` | Keycloak JWT (Bearer) | Multi-service REST proxy (~730+ endpoints across 25 domain modules) |

### POST /api/winleadplus

- Validates payload against `docs/contract-payload-schema.jsonc` using class-validator DTOs
- Publishes to NATS subject `crm.gateway.winleadplus.received` with `{ correlation_id, payload, received_at, source: "winleadplus" }`
- Optionally calls `ContratService.Create` on service-commercial via gRPC (non-blocking — failure still returns 202)
- Logs only `correlation_id` and `societe_id` — never logs PII (IBAN, email, nom, prenom)

## Authentication

Keycloak JWT validation via `jose` JWKS (`createRemoteJWKSet`).

- Guard: `src/auth/keycloak-jwt.guard.ts`
- Fetches JWKS from `${KEYCLOAK_ISSUER_URL}/protocol/openid-connect/certs`
- Validates: signature, issuer, audience (`KEYCLOAK_GATEWAY_CLIENT_ID`)
- JWKS instance is cached (created once in constructor, reused per request)
- Uses dynamic `await import('jose')` for ESM/CJS compatibility

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `HTTP_PORT` | `3405` | HTTP server port |
| `NATS_URL` | `nats://localhost:4222` | NATS server URL |
| `GRPC_CONTRAT_URL` | `localhost:50053` | service-commercial gRPC address (legacy) |
| `GRPC_ENGAGEMENT_URL` | `localhost:50051` | service-engagement gRPC address |
| `GRPC_CORE_URL` | `localhost:50052` | service-core gRPC address |
| `GRPC_COMMERCIAL_URL` | `localhost:50053` | service-commercial gRPC address |
| `GRPC_FINANCE_URL` | `localhost:50059` | service-finance gRPC address |
| `GRPC_LOGISTICS_URL` | `localhost:50060` | service-logistics gRPC address |
| `KEYCLOAK_ISSUER_URL` | — | Keycloak realm URL (e.g. `https://finanssorssoapi.com/realms/master`) |
| `KEYCLOAK_GATEWAY_CLIENT_ID` | — | Expected JWT audience (e.g. `winleadplus-api`) |

## Commands

```bash
# Install dependencies
bun install

# Development (hot reload)
bun run start:dev

# Build
bun run build

# Production
bun run start:prod
```

## Internal Communication

- **NATS**: Publishes to `crm.gateway.winleadplus.received` — consumed by downstream orchestration services
- **gRPC**: Clients to 5 domain services (engagement, core, commercial, finance, logistics) — routes REST requests to appropriate service based on domain module

## Dependencies

| Package | Purpose |
|---------|---------|
| `@nestjs/common`, `@nestjs/core`, `@nestjs/platform-express` | NestJS HTTP framework |
| `@nestjs/microservices` | gRPC client support |
| `@nestjs/config` | Environment variable management |
| `@crm/shared-kernel` | `NatsModule`, `NatsService`, `resolveProtoPath` |
| `jose` | Keycloak JWT validation via JWKS |
| `class-validator` | DTO field validation |
| `class-transformer` | Nested DTO transformation |
| `@nestjs/swagger` | Swagger/OpenAPI documentation + UI |

## Guardrails

- ❌ No TypeORM / PostgreSQL / database
- ❌ No gRPC server (HTTP ingress only)
- ✅ Swagger UI at `/api/docs` (OpenAPI 3.0)
- ❌ No @nestjs/passport or nest-keycloak-connect
- ❌ No unit tests (explicit project decision)
- ❌ No Redis / idempotency cache (downstream handles dedup)
