# Security Hardening + Event-Driven Architecture

## TL;DR

> **Quick Summary**: Fix critical security vulnerability (AuthInterceptor not registered) and implement NATS event-driven architecture for 5 core business events.
> 
> **Deliverables**:
> - AuthInterceptor enabled on all 19 services with JWT validation
> - JWT_SECRET configured across all environments
> - NATS JetStream infrastructure with shared NatsModule
> - 5 events: client.created, invoice.created, payment.received, payment.rejected, contract.signed
> - ProcessedEventsRepository for idempotent event handling
> 
> **Estimated Effort**: Large (6-8 weeks)
> **Parallel Execution**: YES - 4 waves
> **Critical Path**: JWT Validation → AuthInterceptor → NATS Foundation → Events

---

## Context

### Original Request
Enable backend JWT validation (security fix) and add NATS event-driven architecture with 5 core events using TDD approach.

### Interview Summary
**Key Discussions**:
- AuthInterceptor exists in @crm/grpc-utils but is NOT registered in any service
- This is a SECURITY VULNERABILITY - backend accepts any gRPC request without JWT validation
- User wants 5 events: client.created, invoice.created, payment.received, payment.rejected, contract.signed
- TDD approach (RED-GREEN-REFACTOR)
- JWT_SECRET as simple environment variable

**Research Findings**:
- crm_final has 19 microservices using gRPC
- Inter-service calls exist: payments→calendar, payments→retry, users→organisations, contrats→payments
- winaity-clean uses NATS JetStream with protobuf events and idempotency pattern
- AuthInterceptor uses `jose` library with symmetric key verification

### Metis Review
**Identified Gaps** (addressed):
- **CRITICAL**: Must verify Keycloak JWT algorithm (RS256 vs HS256) before enabling AuthInterceptor
- Service-to-service calls may break with auth enabled (need exemption or token propagation)
- Missing feature flag for safe rollout
- Need idempotency strategy for events (ProcessedEventsRepository)
- Need dead letter queue strategy for failed events

---

## Work Objectives

### Core Objective
Secure all gRPC endpoints with JWT validation and enable event-driven communication between services for decoupled, scalable architecture.

### Concrete Deliverables
1. JWT_SECRET in all 19 service .env.example files
2. AuthInterceptor registered globally in all services
3. Service-to-service auth exemption or token propagation
4. NATS container in docker-compose infrastructure
5. @crm/nats-utils package with NatsModule
6. Event proto schemas in @crm/proto
7. ProcessedEventsRepository table and repository
8. 5 event publishers in source services
9. ~15 event subscribers across target services

### Definition of Done
- [ ] `grpcurl -plaintext localhost:50052 clients.ClientBaseService/List` returns UNAUTHENTICATED
- [ ] `grpcurl -H "authorization: Bearer $TOKEN" ...` returns data with valid Keycloak token
- [ ] `nats sub "crm.events.client.created"` receives protobuf message when client created
- [ ] All TDD tests pass (`bun test`)
- [ ] docker compose up starts all services including NATS

### Must Have
- JWT validation on all external gRPC calls
- Health/readiness endpoints remain public
- Service-to-service calls continue working
- Idempotent event processing
- Protobuf event schemas (consistent with gRPC)

### Must NOT Have (Guardrails)
- NE PAS ajouter RBAC/authorization (identity only, not permissions)
- NE PAS ajouter plus de 5 événements (scope lock)
- NE PAS implémenter event sourcing (events are notifications, DB is source of truth)
- NE PAS bloquer les réponses gRPC en attendant la publication d'événements (fire-and-forget)
- NE PAS utiliser JSON pour les événements (protobuf only)
- NE PAS créer de configurations NATS par service (module partagé)

---

## Verification Strategy (MANDATORY)

### Test Decision
- **Infrastructure exists**: YES (tests/e2e/, *.spec.ts)
- **User wants tests**: YES (TDD - RED-GREEN-REFACTOR)
- **Framework**: Jest with NestJS testing utilities

### TDD Pattern for Each Task

**Task Structure:**
1. **RED**: Write failing test first
   - Test file: `[path].spec.ts`
   - Test command: `bun test [file]`
   - Expected: FAIL (test exists, implementation doesn't)
2. **GREEN**: Implement minimum code to pass
   - Command: `bun test [file]`
   - Expected: PASS
3. **REFACTOR**: Clean up while keeping green
   - Command: `bun test [file]`
   - Expected: PASS (still)

### Automated Verification Commands

**For Auth (grpcurl):**
```bash
# Without token - should fail
grpcurl -plaintext localhost:50052 clients.ClientBaseService/List
# Assert: Returns UNAUTHENTICATED

# With valid token - should succeed
grpcurl -plaintext -H "authorization: Bearer $TOKEN" localhost:50052 clients.ClientBaseService/List
# Assert: Returns data or empty list

# Health endpoint - should work without auth
grpcurl -plaintext localhost:50052 grpc.health.v1.Health/Check
# Assert: Returns SERVING
```

**For NATS (nats CLI):**
```bash
# Subscribe to event
nats sub "crm.events.client.created" --count=1 &

# Create client via gRPC
grpcurl -plaintext -H "authorization: Bearer $TOKEN" \
  -d '{"nom":"Test","organisationId":"org-123"}' \
  localhost:50052 clients.ClientBaseService/Create

# Assert: Subscriber receives protobuf message
```

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Validation & Foundation):
├── Task 1: Validate Keycloak JWT algorithm (RS256 vs HS256)
├── Task 2: Add JWT_SECRET to all .env.example files
└── Task 3: Add NATS to docker-compose infrastructure

Wave 2 (Auth Implementation):
├── Task 4: Create service-to-service auth bypass mechanism
├── Task 5: Register AuthInterceptor in all 19 services
└── Task 6: Create @crm/nats-utils package with NatsModule

Wave 3 (Event Foundation):
├── Task 7: Create event proto schemas in @crm/proto
├── Task 8: Create ProcessedEventsRepository
└── Task 9: Add NatsModule to all publisher/subscriber services

Wave 4 (Event Implementation):
├── Task 10: Implement client.created event (publisher + 4 subscribers)
├── Task 11: Implement invoice.created event (publisher + 4 subscribers)
├── Task 12: Implement payment.received event (publisher + 4 subscribers)
├── Task 13: Implement payment.rejected event (publisher + 4 subscribers)
└── Task 14: Implement contract.signed event (publisher + 3 subscribers)

Wave 5 (Final):
└── Task 15: Integration tests and documentation
```

### Dependency Matrix

| Task | Depends On | Blocks | Can Parallelize With |
|------|------------|--------|---------------------|
| 1 | None | 4, 5 | 2, 3 |
| 2 | None | 5 | 1, 3 |
| 3 | None | 6, 9 | 1, 2 |
| 4 | 1 | 5 | 6 |
| 5 | 1, 2, 4 | 10-15 | 6 |
| 6 | 3 | 9 | 4, 5 |
| 7 | None | 10-14 | 8 |
| 8 | None | 10-14 | 7 |
| 9 | 3, 6 | 10-14 | 7, 8 |
| 10 | 5, 7, 8, 9 | 15 | 11, 12, 13, 14 |
| 11 | 5, 7, 8, 9 | 15 | 10, 12, 13, 14 |
| 12 | 5, 7, 8, 9 | 15 | 10, 11, 13, 14 |
| 13 | 5, 7, 8, 9 | 15 | 10, 11, 12, 14 |
| 14 | 5, 7, 8, 9 | 15 | 10, 11, 12, 13 |
| 15 | 10-14 | None | None (final) |

---

## TODOs

### Wave 1: Validation & Foundation (Parallel)

- [x] 1. Validate Keycloak JWT Algorithm

  **What to do**:
  - Get a real JWT token from Keycloak
  - Decode header to check `alg` field (RS256 or HS256)
  - If RS256: Modify AuthInterceptor to use asymmetric verification with Keycloak public key
  - If HS256: Current implementation is correct, just need JWT_SECRET
  - Document the algorithm and key retrieval method

  **Must NOT do**:
  - Skip this validation step
  - Assume HS256 without verification

  **Recommended Agent Profile**:
  - **Category**: `deep`
  - **Skills**: `[]`
    - Security-critical investigation requiring careful analysis

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 2, 3)
  - **Blocks**: Tasks 4, 5
  - **Blocked By**: None

  **References**:
  - `packages/grpc-utils/src/interceptors/auth.interceptor.ts:29-45` - Current JWT verification logic
  - `frontend/src/lib/auth/keycloak.ts` - Keycloak configuration
  - `frontend/src/lib/auth/jwt.ts` - JWT parsing utilities

  **Acceptance Criteria**:
  ```bash
  # Get token from Keycloak
  TOKEN=$(curl -s -X POST "$KEYCLOAK_URL/realms/$REALM/protocol/openid-connect/token" \
    -d "grant_type=password&client_id=$CLIENT_ID&username=test&password=test" \
    | jq -r '.access_token')
  
  # Decode and check algorithm
  echo $TOKEN | cut -d'.' -f1 | base64 -d 2>/dev/null | jq '.alg'
  # Assert: Returns "RS256" or "HS256"
  
  # If RS256, verify public key endpoint exists
  curl -s "$KEYCLOAK_URL/realms/$REALM/protocol/openid-connect/certs" | jq '.keys[0].kty'
  # Assert: Returns "RSA" if RS256
  ```

  **Commit**: YES
  - Message: `docs(auth): document Keycloak JWT algorithm and key retrieval`
  - Files: `docs/auth-configuration.md`

---

- [x] 2. Add JWT_SECRET to All Service .env.example Files

  **What to do**:
  - Add `JWT_SECRET=your-secret-key-here` to all 19 service .env.example files
  - Add documentation comment explaining the variable
  - If RS256 (from Task 1): Add `KEYCLOAK_REALM_URL` instead for public key retrieval

  **Must NOT do**:
  - Add actual secrets to .env.example (use placeholder)
  - Skip any service

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: `[]`
    - Simple file modification across multiple locations

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 3)
  - **Blocks**: Task 5
  - **Blocked By**: None

  **References**:
  - `services/service-clients/.env.example` - Example of existing .env.example
  - All 19 services in `services/` directory

  **Acceptance Criteria**:
  ```bash
  # Verify JWT_SECRET in all services
  for service in services/service-*; do
    grep -q "JWT_SECRET" "$service/.env.example" || echo "MISSING: $service"
  done
  # Assert: No output (all services have JWT_SECRET)
  
  # Count services with JWT_SECRET
  grep -l "JWT_SECRET" services/service-*/.env.example | wc -l
  # Assert: Returns 19
  ```

  **Commit**: YES
  - Message: `chore(config): add JWT_SECRET to all service .env.example files`
  - Files: `services/service-*/.env.example`

---

- [x] 3. Add NATS to Docker Compose Infrastructure

  **What to do**:
  - Add NATS container with JetStream enabled to `compose/dev/infrastructure.yml`
  - Configure ports: 4222 (client), 8222 (monitoring)
  - Add healthcheck
  - Create `compose/dev/nats.yml` if needed for separation

  **Must NOT do**:
  - Add to production compose (separate task)
  - Configure authentication for dev (keep simple)

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: `[]`
    - Docker compose configuration

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 2)
  - **Blocks**: Tasks 6, 9
  - **Blocked By**: None

  **References**:
  - `compose/dev/infrastructure.yml` - Existing infrastructure config
  - `/tmp/winaity-clean/compose/staging/infrastructure.yml` - NATS configuration example

  **Acceptance Criteria**:
  ```bash
  # Validate compose config
  docker compose -f compose/dev/infrastructure.yml config --quiet
  # Assert: Exit code 0
  
  # Start NATS
  docker compose -f compose/dev/infrastructure.yml up -d nats
  
  # Wait for healthy
  sleep 5
  docker compose -f compose/dev/infrastructure.yml ps nats --format json | jq -r '.[0].State'
  # Assert: Returns "running"
  
  # Verify NATS is accessible
  curl -s http://localhost:8222/varz | jq '.server_name'
  # Assert: Returns server name
  ```

  **Commit**: YES
  - Message: `build(compose): add NATS JetStream to dev infrastructure`
  - Files: `compose/dev/infrastructure.yml`

---

### Wave 2: Auth Implementation (Partial Parallel)

- [x] 4. Create Service-to-Service Auth Bypass Mechanism

  **What to do**:
  - Identify all inter-service gRPC calls (payments→calendar, etc.)
  - Option A: Add internal service token/header that bypasses auth
  - Option B: Propagate user token through service chain
  - Option C: Whitelist internal service IPs/hostnames
  - Implement chosen approach in AuthInterceptor
  - Add tests for inter-service call scenarios

  **Must NOT do**:
  - Completely disable auth for internal calls without verification
  - Hardcode service credentials

  **Recommended Agent Profile**:
  - **Category**: `deep`
  - **Skills**: `[]`
    - Security-critical design decision

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Task 6)
  - **Blocks**: Task 5
  - **Blocked By**: Task 1

  **References**:
  - `packages/grpc-utils/src/interceptors/auth.interceptor.ts` - Current interceptor
  - `services/service-payments/src/modules/calendar/calendar-client.service.ts` - Inter-service call example
  - `packages/grpc-utils/src/grpc-client.ts` - gRPC client factory

  **Acceptance Criteria**:
  ```bash
  # Test: Payment service can call Calendar service internally
  # 1. Start both services
  # 2. Create payment that triggers calendar check
  # Assert: No UNAUTHENTICATED error in logs
  
  # Test: External call without token fails
  grpcurl -plaintext localhost:50063 payments.PaymentScheduleService/List
  # Assert: Returns UNAUTHENTICATED
  ```

  **Commit**: YES
  - Message: `feat(grpc-utils): add service-to-service auth bypass mechanism`
  - Files: `packages/grpc-utils/src/interceptors/auth.interceptor.ts`

---

- [x] 5. Register AuthInterceptor in All 19 Services

  **What to do**:
  - Add `APP_INTERCEPTOR` provider to each service's `app.module.ts`
  - Import AuthInterceptor from `@crm/grpc-utils`
  - Ensure JWT_SECRET env var is loaded via ConfigModule
  - Add feature flag `AUTH_ENABLED` for safe rollout (default: true)

  **Must NOT do**:
  - Modify AuthInterceptor logic (except from Task 4)
  - Skip any service
  - Deploy without testing each service

  **Recommended Agent Profile**:
  - **Category**: `unspecified-low`
  - **Skills**: `[]`
    - Repetitive code addition across many files

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Task 6)
  - **Blocks**: Tasks 10-15
  - **Blocked By**: Tasks 1, 2, 4

  **References**:
  - `services/service-clients/src/app.module.ts` - Example module structure
  - `packages/grpc-utils/src/index.ts` - AuthInterceptor export
  - NestJS docs: Global interceptors pattern

  **Acceptance Criteria**:
  ```bash
  # TDD: Write test first
  # packages/grpc-utils/src/interceptors/auth.interceptor.spec.ts
  bun test packages/grpc-utils/src/interceptors/auth.interceptor.spec.ts
  # Assert: RED (tests fail before implementation)
  
  # Verify interceptor registered in all services
  for service in services/service-*; do
    grep -q "AuthInterceptor" "$service/src/app.module.ts" || echo "MISSING: $service"
  done
  # Assert: No output
  
  # Integration test: Call without token
  docker compose up -d service-clients
  sleep 10
  grpcurl -plaintext localhost:50052 clients.ClientBaseService/List
  # Assert: Returns UNAUTHENTICATED
  
  # Integration test: Health still works
  grpcurl -plaintext localhost:50052 grpc.health.v1.Health/Check
  # Assert: Returns SERVING
  ```

  **Commit**: YES
  - Message: `feat(services): enable AuthInterceptor on all 19 services`
  - Files: `services/service-*/src/app.module.ts`

---

- [x] 6. Create @crm/nats-utils Package with NatsModule

  **What to do**:
  - Create new package `packages/nats-utils/`
  - Implement `NatsModule.forRoot()` with configuration
  - Implement `NatsService` with publish/subscribe methods
  - Support protobuf serialization/deserialization
  - Add connection retry logic and graceful shutdown
  - Export from package index

  **Must NOT do**:
  - Create per-service NATS configurations
  - Use JSON serialization (protobuf only)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: `[]`
    - New package creation with multiple components

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 4, 5)
  - **Blocks**: Task 9
  - **Blocked By**: Task 3

  **References**:
  - `/tmp/winaity-clean/packages/shared-kernel/src/infrastructure/nats/` - NATS module example
  - `packages/grpc-utils/` - Existing shared package structure
  - `packages/grpc-utils/package.json` - Package configuration example

  **Acceptance Criteria**:
  ```bash
  # TDD: Write tests first
  bun test packages/nats-utils/src/nats.module.spec.ts
  # Assert: RED initially, then GREEN after implementation
  
  # Verify package structure
  test -f packages/nats-utils/package.json && \
  test -f packages/nats-utils/src/index.ts && \
  test -f packages/nats-utils/src/nats.module.ts && \
  test -f packages/nats-utils/src/nats.service.ts
  # Assert: Exit code 0
  
  # Verify exports
  grep -q "NatsModule" packages/nats-utils/src/index.ts
  grep -q "NatsService" packages/nats-utils/src/index.ts
  # Assert: Both found
  
  # Build package
  npm run build --workspace=@crm/nats-utils
  # Assert: Exit code 0
  ```

  **Commit**: YES
  - Message: `feat(nats-utils): create shared NATS module with protobuf support`
  - Files: `packages/nats-utils/`

---

### Wave 3: Event Foundation (Parallel)

- [x] 7. Create Event Proto Schemas in @crm/proto

  **What to do**:
  - Create `packages/proto/src/events/` directory
  - Create proto files for each event type:
    - `client_events.proto` - ClientCreatedEvent
    - `invoice_events.proto` - InvoiceCreatedEvent
    - `payment_events.proto` - PaymentReceivedEvent, PaymentRejectedEvent
    - `contract_events.proto` - ContractSignedEvent
  - Include standard fields: eventId, timestamp, correlationId
  - Run proto generation

  **Must NOT do**:
  - Use JSON schema (protobuf only)
  - Include sensitive data in events (passwords, full payment details)

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: `[]`
    - Proto schema creation following existing patterns

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Tasks 8, 9)
  - **Blocks**: Tasks 10-14
  - **Blocked By**: None

  **References**:
  - `packages/proto/src/clients/clients.proto` - Existing proto structure
  - `/tmp/winaity-clean/services/workflow-service/proto/` - Event proto examples
  - `packages/proto/buf.gen.yaml` - Proto generation config

  **Acceptance Criteria**:
  ```bash
  # Verify proto files created
  ls packages/proto/src/events/*.proto
  # Assert: Shows client_events.proto, invoice_events.proto, payment_events.proto, contract_events.proto
  
  # Generate TypeScript
  cd packages/proto && npm run generate
  # Assert: Exit code 0
  
  # Verify generated types
  test -f packages/proto/gen/ts/events/client_events.ts
  test -f packages/proto/gen/ts/events/invoice_events.ts
  test -f packages/proto/gen/ts/events/payment_events.ts
  test -f packages/proto/gen/ts/events/contract_events.ts
  # Assert: All exist
  ```

  **Commit**: YES
  - Message: `feat(proto): add event schemas for client, invoice, payment, contract events`
  - Files: `packages/proto/src/events/`

---

- [x] 8. Create ProcessedEventsRepository for Idempotency

  **What to do**:
  - Create `processed_events` table migration in shared database
  - Create `ProcessedEventsRepository` in @crm/grpc-utils or @crm/nats-utils
  - Implement `exists(eventId)` and `markProcessed(eventId, eventType)` methods
  - Add TTL for old entries (30 days retention)

  **Must NOT do**:
  - Store full event payload (only eventId for deduplication)
  - Skip index on eventId column

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: `[]`
    - Database migration and repository creation

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Tasks 7, 9)
  - **Blocks**: Tasks 10-14
  - **Blocked By**: None

  **References**:
  - `/tmp/winaity-clean/` - ProcessedEventsRepository pattern (search for it)
  - `services/service-clients/src/modules/` - Existing repository pattern
  - TypeORM migration examples in services

  **Acceptance Criteria**:
  ```bash
  # TDD: Write test first
  bun test packages/nats-utils/src/processed-events.repository.spec.ts
  # Assert: RED then GREEN
  
  # Verify repository methods
  grep -q "exists" packages/nats-utils/src/processed-events.repository.ts
  grep -q "markProcessed" packages/nats-utils/src/processed-events.repository.ts
  # Assert: Both found
  
  # Verify migration
  ls packages/nats-utils/src/migrations/*processed_events*.ts
  # Assert: Migration file exists
  ```

  **Commit**: YES
  - Message: `feat(nats-utils): add ProcessedEventsRepository for idempotent event handling`
  - Files: `packages/nats-utils/src/processed-events.repository.ts`, migration files

---

- [x] 9. Add NatsModule to Publisher/Subscriber Services

  **What to do**:
  - Import NatsModule in services that publish events:
    - service-clients (client.created)
    - service-factures (invoice.created)
    - service-payments (payment.received, payment.rejected)
    - service-contrats (contract.signed)
  - Import NatsModule in services that subscribe:
    - service-email, service-notifications, service-dashboard, service-relance
    - service-commission, service-retry, service-documents
  - Configure NATS_URL environment variable

  **Must NOT do**:
  - Import NatsModule in services that don't need events
  - Configure different NATS settings per service

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: `[]`
    - Module import across multiple services

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Tasks 7, 8)
  - **Blocks**: Tasks 10-14
  - **Blocked By**: Tasks 3, 6

  **References**:
  - `packages/nats-utils/src/nats.module.ts` - NatsModule from Task 6
  - `services/service-clients/src/app.module.ts` - Module import pattern

  **Acceptance Criteria**:
  ```bash
  # Verify NatsModule in publisher services
  grep -q "NatsModule" services/service-clients/src/app.module.ts
  grep -q "NatsModule" services/service-factures/src/app.module.ts
  grep -q "NatsModule" services/service-payments/src/app.module.ts
  grep -q "NatsModule" services/service-contrats/src/app.module.ts
  # Assert: All found
  
  # Verify NatsModule in key subscriber services
  grep -q "NatsModule" services/service-email/src/app.module.ts
  grep -q "NatsModule" services/service-notifications/src/app.module.ts
  # Assert: Both found
  
  # Verify NATS_URL in .env.example
  grep -q "NATS_URL" services/service-clients/.env.example
  # Assert: Found
  ```

  **Commit**: YES
  - Message: `feat(services): add NatsModule to event publisher and subscriber services`
  - Files: `services/service-*/src/app.module.ts`

---

### Wave 4: Event Implementation (Parallel)

- [x] 10. Implement client.created Event

  **What to do**:
  - **Publisher** (service-clients):
    - Inject NatsService in ClientBaseController
    - After successful client creation, publish ClientCreatedEvent
    - Include: clientId, organisationId, nom, prenom, email, createdAt, eventId
  - **Subscribers**:
    - service-email: Send welcome email
    - service-notifications: Notify account manager
    - service-dashboard: Update new clients KPI
    - service-relance: Schedule first follow-up
  - Implement idempotency check in each subscriber

  **Must NOT do**:
  - Block gRPC response waiting for event publish
  - Include sensitive client data in event

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: `[]`
    - Multi-service event implementation

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4 (with Tasks 11-14)
  - **Blocks**: Task 15
  - **Blocked By**: Tasks 5, 7, 8, 9

  **References**:
  - `services/service-clients/src/modules/client-base/client-base.controller.ts:19` - Publisher location
  - `packages/proto/src/events/client_events.proto` - Event schema from Task 7
  - `/tmp/winaity-clean/services/workflow-service/src/workflows/infrastructure/nats/` - Subscriber pattern

  **Acceptance Criteria**:
  ```bash
  # TDD: Write publisher test
  bun test services/service-clients/src/modules/client-base/client-base.controller.spec.ts
  # Assert: RED then GREEN
  
  # TDD: Write subscriber tests
  bun test services/service-email/src/modules/events/client-created.handler.spec.ts
  # Assert: RED then GREEN
  
  # Integration test
  # 1. Subscribe to event
  nats sub "crm.events.client.created" --count=1 &
  
  # 2. Create client
  grpcurl -plaintext -H "authorization: Bearer $TOKEN" \
    -d '{"nom":"Test","prenom":"User","organisationId":"org-123"}' \
    localhost:50052 clients.ClientBaseService/Create
  
  # Assert: Subscriber receives event with correct fields
  ```

  **Commit**: YES
  - Message: `feat(events): implement client.created event with 4 subscribers`
  - Files: publisher in service-clients, subscribers in service-email, service-notifications, service-dashboard, service-relance

---

- [x] 11. Implement invoice.created Event

  **What to do**:
  - **Publisher** (service-factures):
    - After invoice creation, publish InvoiceCreatedEvent
    - Include: invoiceId, clientId, montant, dateEcheance, eventId
  - **Subscribers**:
    - service-email: Send invoice to client
    - service-notifications: Notify finance team
    - service-dashboard: Update revenue metrics
    - service-relance: Schedule payment reminder (J+15)

  **Must NOT do**:
  - Include full invoice PDF in event (use ID reference)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4 (with Tasks 10, 12-14)
  - **Blocks**: Task 15
  - **Blocked By**: Tasks 5, 7, 8, 9

  **References**:
  - `services/service-factures/src/modules/invoices/invoices.controller.ts:25` - Publisher location
  - `packages/proto/src/events/invoice_events.proto` - Event schema

  **Acceptance Criteria**:
  ```bash
  # TDD tests for publisher and subscribers
  bun test services/service-factures/src/modules/invoices/invoices.controller.spec.ts
  bun test services/service-relance/src/modules/events/invoice-created.handler.spec.ts
  # Assert: All GREEN
  
  # Integration test
  nats sub "crm.events.invoice.created" --count=1 &
  grpcurl -plaintext -H "authorization: Bearer $TOKEN" \
    -d '{"clientId":"client-123","montant":1000}' \
    localhost:50059 factures.InvoiceService/Create
  # Assert: Event received
  ```

  **Commit**: YES
  - Message: `feat(events): implement invoice.created event with 4 subscribers`
  - Files: publisher in service-factures, subscribers in email, notifications, dashboard, relance

---

- [x] 12. Implement payment.received Event

  **What to do**:
  - **Publisher** (service-payments):
    - After payment confirmation, publish PaymentReceivedEvent
    - Include: paymentId, scheduleId, clientId, montant, dateReception, eventId
  - **Subscribers**:
    - service-notifications: Notify finance team
    - service-relance: Cancel scheduled reminders for this invoice
    - service-dashboard: Update cash flow metrics
    - service-commission: Calculate sales commission

  **Must NOT do**:
  - Include bank account details in event

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4 (with Tasks 10, 11, 13, 14)
  - **Blocks**: Task 15
  - **Blocked By**: Tasks 5, 7, 8, 9

  **References**:
  - `services/service-payments/src/modules/schedules/` - Payment processing
  - `packages/proto/src/events/payment_events.proto` - Event schema

  **Acceptance Criteria**:
  ```bash
  # TDD tests
  bun test services/service-payments/src/modules/schedules/schedules.controller.spec.ts
  bun test services/service-commission/src/modules/events/payment-received.handler.spec.ts
  # Assert: All GREEN
  
  # Integration test
  nats sub "crm.events.payment.received" --count=1 &
  # Trigger payment confirmation
  # Assert: Event received with correct fields
  ```

  **Commit**: YES
  - Message: `feat(events): implement payment.received event with 4 subscribers`
  - Files: publisher in service-payments, subscribers in notifications, relance, dashboard, commission

---

- [x] 13. Implement payment.rejected Event (AM04)

  **What to do**:
  - **Publisher** (service-payments):
    - After AM04 rejection detected, publish PaymentRejectedEvent
    - Include: paymentId, scheduleId, clientId, motifRejet, dateRejet, eventId
  - **Subscribers**:
    - service-retry: Queue for retry
    - service-relance: Schedule follow-up
    - service-notifications: Alert finance team
    - service-email: Send notification to client requesting updated bank details

  **Must NOT do**:
  - Retry immediately in publisher (let subscriber handle)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4 (with Tasks 10-12, 14)
  - **Blocks**: Task 15
  - **Blocked By**: Tasks 5, 7, 8, 9

  **References**:
  - `services/service-payments/src/modules/payment-emission/` - Payment emission job
  - `services/service-retry/` - Retry service structure

  **Acceptance Criteria**:
  ```bash
  # TDD tests
  bun test services/service-payments/src/modules/payment-emission/payment-emission.job.spec.ts
  bun test services/service-retry/src/modules/events/payment-rejected.handler.spec.ts
  # Assert: All GREEN
  
  # Integration test
  nats sub "crm.events.payment.rejected" --count=1 &
  # Simulate AM04 rejection
  # Assert: Event received with motifRejet
  ```

  **Commit**: YES
  - Message: `feat(events): implement payment.rejected (AM04) event with 4 subscribers`
  - Files: publisher in service-payments, subscribers in retry, relance, notifications, email

---

- [x] 14. Implement contract.signed Event

  **What to do**:
  - **Publisher** (service-contrats):
    - After contract signature, publish ContractSignedEvent
    - Include: contratId, clientId, produitId, montantTotal, dateSignature, eventId
  - **Subscribers**:
    - service-payments: Create payment schedule
    - service-email: Send confirmation
    - service-documents: Archive signed contract

  **Must NOT do**:
  - Include full contract document in event

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4 (with Tasks 10-13)
  - **Blocks**: Task 15
  - **Blocked By**: Tasks 5, 7, 8, 9

  **References**:
  - `services/service-contrats/src/modules/contrat/contrat.controller.ts` - Publisher location
  - `packages/proto/src/events/contract_events.proto` - Event schema

  **Acceptance Criteria**:
  ```bash
  # TDD tests
  bun test services/service-contrats/src/modules/contrat/contrat.controller.spec.ts
  bun test services/service-payments/src/modules/events/contract-signed.handler.spec.ts
  # Assert: All GREEN
  
  # Integration test
  nats sub "crm.events.contract.signed" --count=1 &
  grpcurl -plaintext -H "authorization: Bearer $TOKEN" \
    -d '{"clientId":"client-123","produitId":"prod-456"}' \
    localhost:50055 contrats.ContratService/Create
  # Assert: Event received
  ```

  **Commit**: YES
  - Message: `feat(events): implement contract.signed event with 3 subscribers`
  - Files: publisher in service-contrats, subscribers in payments, email, documents

---

### Wave 5: Final

- [ ] 15. Integration Tests and Documentation

  **What to do**:
  - Create E2E test suite for auth flow
  - Create E2E test suite for event flow
  - Update README.md with:
    - Auth configuration instructions
    - NATS setup instructions
    - Event documentation (subjects, schemas, publishers, subscribers)
  - Create architecture diagram showing event flows

  **Must NOT do**:
  - Skip E2E tests
  - Leave documentation incomplete

  **Recommended Agent Profile**:
  - **Category**: `writing`
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Final (after all)
  - **Blocks**: None
  - **Blocked By**: Tasks 10-14

  **References**:
  - `tests/e2e/` - Existing E2E test structure
  - `README.md` - Current documentation
  - `docs/` - Documentation directory

  **Acceptance Criteria**:
  ```bash
  # Run E2E auth tests
  cd tests/e2e && npm run test:auth
  # Assert: All pass
  
  # Run E2E event tests
  cd tests/e2e && npm run test:events
  # Assert: All pass
  
  # Verify documentation
  grep -q "JWT_SECRET" README.md
  grep -q "NATS" README.md
  # Assert: Both found
  
  # Full system test
  docker compose up -d
  sleep 60
  docker compose ps --format json | jq -r '.[].State' | sort | uniq -c
  # Assert: All "running"
  ```

  **Commit**: YES
  - Message: `docs: add auth and NATS event documentation with E2E tests`
  - Files: `README.md`, `docs/events.md`, `tests/e2e/`

---

## Commit Strategy

| After Task | Message | Files |
|------------|---------|-------|
| 1 | `docs(auth): document Keycloak JWT algorithm` | docs/ |
| 2 | `chore(config): add JWT_SECRET to all .env.example` | services/*/.env.example |
| 3 | `build(compose): add NATS JetStream` | compose/dev/ |
| 4 | `feat(grpc-utils): add service-to-service auth bypass` | packages/grpc-utils/ |
| 5 | `feat(services): enable AuthInterceptor on all services` | services/*/src/app.module.ts |
| 6 | `feat(nats-utils): create shared NATS module` | packages/nats-utils/ |
| 7 | `feat(proto): add event schemas` | packages/proto/src/events/ |
| 8 | `feat(nats-utils): add ProcessedEventsRepository` | packages/nats-utils/ |
| 9 | `feat(services): add NatsModule to services` | services/*/src/app.module.ts |
| 10 | `feat(events): implement client.created event` | service-clients, service-email, etc. |
| 11 | `feat(events): implement invoice.created event` | service-factures, etc. |
| 12 | `feat(events): implement payment.received event` | service-payments, etc. |
| 13 | `feat(events): implement payment.rejected event` | service-payments, service-retry, etc. |
| 14 | `feat(events): implement contract.signed event` | service-contrats, etc. |
| 15 | `docs: add auth and events documentation` | README.md, docs/, tests/e2e/ |

---

## Success Criteria

### Verification Commands
```bash
# 1. Auth working
grpcurl -plaintext localhost:50052 clients.ClientBaseService/List
# Expected: UNAUTHENTICATED error

grpcurl -H "authorization: Bearer $TOKEN" -plaintext localhost:50052 clients.ClientBaseService/List
# Expected: Returns data

# 2. Health endpoints public
grpcurl -plaintext localhost:50052 grpc.health.v1.Health/Check
# Expected: SERVING status

# 3. NATS events flowing
nats sub "crm.events.>" --count=5 &
# Create a client, invoice, etc.
# Expected: 5 events received

# 4. Idempotency working
# Publish same event ID twice
# Expected: Second processing skipped

# 5. All tests pass
bun test
# Expected: All green
```

### Final Checklist
- [ ] All 19 services have AuthInterceptor registered
- [ ] JWT_SECRET in all .env.example files
- [ ] Service-to-service calls work with auth enabled
- [ ] NATS container running with JetStream
- [ ] @crm/nats-utils package created and working
- [ ] 5 events implemented with publishers and subscribers
- [ ] ProcessedEventsRepository preventing duplicate processing
- [ ] E2E tests passing for auth and events
- [ ] Documentation complete
