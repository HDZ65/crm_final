# Learnings — Mondial TV MVP

## Conventions & Patterns

_Accumulated knowledge from task execution_

---

## Task 2: ClientExternalMapping Entity

### Key Learnings

#### DDD Structure Pattern
- **Domain Layer**: Entity + Repository Interface
  - `domain/mondial-tv/entities/client-external-mapping.entity.ts` - TypeORM entity with business logic
  - `domain/mondial-tv/repositories/IClientExternalMappingRepository.ts` - Repository contract
- **Infrastructure Layer**: Repository Implementation
  - `infrastructure/persistence/typeorm/repositories/mondial-tv/client-external-mapping.service.ts` - Implements IClientExternalMappingRepository
- **Migrations**: Raw SQL queries (not TypeORM Table API)
  - Use `queryRunner.query()` with raw SQL for complex constraints
  - Partial unique indexes (WHERE clause) must be in raw SQL, not decorators

#### TypeORM Decorator Limitations
- `@Index()` decorator does NOT support partial indexes (WHERE clause)
- Partial unique indexes must be created in migrations using raw SQL
- Example: `CREATE UNIQUE INDEX idx_name ON table(col1, col2) WHERE col IS NOT NULL`

#### Entity Design
- Use `@Column({ type: 'enum', enum: SourceSystem })` for enum fields
- Use `@Column({ type: 'jsonb', nullable: true, default: null })` for flexible metadata
- Always include `@CreateDateColumn` and `@UpdateDateColumn` for audit trails
- Use snake_case in `name` parameter for database column names

#### Repository Pattern
- Interface defines contract: `findById()`, `findByImsUserId()`, `findByClientId()`, etc.
- Service implements interface with error handling (RpcException for gRPC)
- Catch database errors (e.g., unique constraint violations) and convert to gRPC status codes

#### Testing with Bun
- Use `describe()`, `it()`, `expect()` from `bun:test`
- Use `beforeEach()` for test setup
- Test entity creation, field validation, relationships, and constraints
- Tests run with: `bun test path/to/spec.ts`

#### Migration Naming
- Timestamp format: Unix seconds (e.g., `1770487474000`)
- Class name: `CreateClientExternalMappings1770487474000`
- Implement `MigrationInterface` with `up()` and `down()` methods
- Always include `down()` for rollback capability

#### Multi-Tenancy Pattern
- Always include `organisation_id` in entities for tenant isolation
- Create indexes on `(organisation_id, other_field)` for efficient filtering
- Unique constraints should be scoped to organisation: `(organisation_id, unique_field)`

#### Cross-Service Boundaries
- Store `client_id` as UUID reference to service-core (no foreign key constraint)
- This avoids cross-database foreign key issues
- Metadata JSONB field provides extensibility without schema changes

---

## Task 1: Proto Definitions — Subscriptions + Mondial TV

### Patterns Discovered
- **Package per directory**: Proto files in the same directory share the same `package` name. Within a package, message names must be unique across ALL files.
- **Pagination duplication**: Each package (contrats, subscriptions, payments) redefines `Pagination` and `PaginationResult` locally. For mondial-tv (multi-file package), extracted to `common.proto` and used imports.
- **Enum naming convention**: All enum values are prefixed with the enum type name in SCREAMING_SNAKE_CASE (e.g., `SUBSCRIPTION_STATUS_ACTIVE`, `STORE_SOURCE_APPLE_STORE`). First value is always `_UNSPECIFIED = 0`.
- **buf generate**: Uses `buf generate` via `bun run generate` in `packages/proto/`. The `bun run proto:generate` alias does NOT exist at root level.
- **buf lint**: STANDARD rules with PACKAGE_VERSION_SUFFIX and PACKAGE_DIRECTORY_MATCH excepted. This is why `mondial_tv` package works in `mondial-tv/` directory.
- **ts-proto**: Generated with `nestJs=true`, `snakeToCamel=false`, `outputServices=grpc-js`. Frontend gets a separate generation with `nestJs=false` and `snakeToCamel=true`.
- **google.protobuf.Timestamp warnings**: The `duplicate generated file name "google/protobuf/timestamp.ts"` warning is pre-existing and harmless.

### Key Decisions
- Extended existing `subscriptions.proto` with OTT enums (PlanType, StoreSource, SubscriptionFrequency, TriggeredBy) rather than creating separate files — the file was already the target from PUREA CAFE subscription-mvp.
- Added `TriggeredBy` enum (USER/SYSTEM/IMS/STORE/DUNNING) to all lifecycle RPCs for audit trail.
- Used `int64` for amounts in store-billing and tvod-est (cents) following payment.proto pattern, while subscriptions uses `double` (following existing contrats.proto pattern).
- Created `mondial-tv/common.proto` for shared Pagination/PaginationResult within the `mondial_tv` package.
- Added package.json exports for all new mondial-tv modules.

### Files Created/Modified
- Modified: `packages/proto/src/subscriptions/subscriptions.proto` (added OTT enums + fields)
- Modified: `packages/proto/src/subscriptions/subscription_events.proto` (added 6 new events)
- Created: `packages/proto/src/mondial-tv/common.proto`
- Created: `packages/proto/src/mondial-tv/ims-webhook.proto`
- Created: `packages/proto/src/mondial-tv/store-billing.proto`
- Created: `packages/proto/src/mondial-tv/tvod-est.proto`
- Created: `packages/proto/src/mondial-tv/coupon.proto`
- Modified: `packages/proto/package.json` (added mondial-tv exports)

---

## Task 5: IMS Webhook Receiver + Mock IMS Client

### Key Learnings

#### NestJS + Bun import compatibility
- `RawBodyRequest` must be imported as a **type** (or avoided) under Bun test runtime to prevent named-export runtime errors.
- `express` `Request` should also be imported as `import type { Request } from 'express'` to avoid Bun ESM/CJS named export issues.

#### Raw body typing pattern
- When using `rawBody: true` in `main.ts`, controller typing should declare a local request type extension:
  - `type RequestWithRawBody = Request & { rawBody?: Buffer }`
- This avoids compile errors (`Property 'rawBody' does not exist on type Request`) while keeping runtime behavior intact.

#### HMAC signature validation hardening
- Accepting both `sha256=<hex>` and plain hex/base64 signatures improves interoperability for external webhook senders.
- Use `timingSafeEqual` with equal-length buffers to avoid timing-attack-prone string equality checks.

#### Idempotency reuse approach
- `IdempotenceService` from shared-kernel can be reused by providing a small local `IdempotenceStore` adapter backed by the webhook event repository (`event_id` uniqueness + existence check).

#### Verification reality
- `bun test ims-webhook` passes with 10 tests.
- Full service build currently fails because of pre-existing subscription/grpc typing issues unrelated to IMS webhook changes.

---

## Task 4: TVOD/EST Purchase Entity

### Key Learnings

#### Entity Design for E-Commerce Purchases
- **Separate IMS reference from content**: Store `content_id` (IMS ID) and `content_title` separately
  - `content_id`: VARCHAR(255) for IMS content identifier
  - `content_title`: VARCHAR(500) for display/audit purposes
  - This avoids storing full content objects and maintains loose coupling with IMS
- **Purchase Type Enum**: TVOD (rental/temporary) vs EST (permanent purchase)
- **Payment Method Tracking**: CB_DIRECT, APPLE_STORE, GOOGLE_STORE with corresponding store sources
- **Store Transaction ID**: Nullable field for store-specific transaction references (Apple/Google)
- **IMS Transaction ID**: Required field for audit trail linking to IMS

#### Repository Pattern for Analytics
- **Aggregate Calculations**: `calculateAggregates()` and `calculateContentAggregates()` use QueryBuilder
  - Filter by `status = 'COMPLETED'` for revenue calculations
  - Use `SUM()`, `AVG()`, `COUNT()` for metrics
  - Return structured `AggregateMetrics` interface with totalVolume, totalRevenue, averageBasket, transactionCount
- **Pagination Support**: All find methods support `limit` and `offset` parameters
- **Counting Methods**: Separate `countByClient()` and `countByContent()` for pagination metadata

#### Multi-Tenancy Pattern (Reinforced)
- Always include `organisation_id` in WHERE clauses for all queries
- Create composite indexes: `(organisation_id, other_field)` for efficient filtering
- Example indexes:
  - `(organisation_id, client_id)` for client lookups
  - `(organisation_id, content_id)` for content lookups
  - `(organisation_id, status)` for status filtering
  - `(client_id, created_at)` for time-series queries

#### Refund Tracking
- **Refund Fields**: `refunded_at` (TIMESTAMPTZ), `refund_amount` (DECIMAL)
- **Status Transition**: PENDING → COMPLETED → REFUNDED
- Both fields nullable; only populated when status = REFUNDED
- Allows audit trail of refund operations

#### Invoice Linking
- `invoice_id` (UUID, nullable) links to service-finance invoices
- Not created by this service; populated by charge engine or IMS webhook handler
- Enables cross-service reconciliation without foreign key constraints

#### Testing with Bun
- Entity tests focus on field assignment and enum validation
- Test all enum variants: PurchaseType (TVOD/EST), PaymentMethod (3 variants), StoreSource (3 variants), PurchaseStatus (3 variants)
- Test nullable fields explicitly (storeTransactionId, invoiceId, refundedAt, refundAmount)
- Test multi-tenancy isolation with different organisation_ids
- Test status transitions and refund scenarios
- All 15 tests pass with bun:test

#### Migration Patterns
- Create enum types BEFORE table creation
- Use raw SQL for enum creation (TypeORM decorators don't support custom enums well)
- Create indexes in migration for query optimization
- Always include `down()` method for rollback
- Naming: `1770510000000-CreateTvodEstPurchases.ts` (Unix timestamp + descriptive name)

### Files Created
- `domain/mondial-tv/entities/tvod-est-purchase.entity.ts` - Entity with 4 enums
- `domain/mondial-tv/repositories/ITvodEstPurchaseRepository.ts` - Repository interface with 10 methods
- `infrastructure/persistence/typeorm/repositories/mondial-tv/tvod-est-purchase.service.ts` - Repository implementation
- `migrations/1770510000000-CreateTvodEstPurchases.ts` - Database migration with enum types and indexes
- `domain/mondial-tv/entities/__tests__/tvod-est-purchase.entity.spec.ts` - 15 comprehensive tests

### Test Results
✅ 15 tests pass (44 expect() calls)
- Entity creation (TVOD, EST, nullable fields)
- Status transitions (PENDING, COMPLETED, REFUNDED)
- Payment methods (CB_DIRECT, APPLE_STORE, GOOGLE_STORE)
- Multi-tenancy isolation
- Timestamps
- Invoice linking
- Content tracking


---

## Task 6: Store Billing Mirror Entities

### Key Learnings

#### Store Billing Record Entity Design
- **Fields**: id, organisation_id, subscription_id, client_id, store_source (enum), store_transaction_id (unique per store), store_product_id, amount (bigint in cents), currency (3-char), status (enum), receipt_data (jsonb), event_type (enum), original_transaction_id (for renewals), event_date, created_at, updated_at
- **Enums**: StoreSource (APPLE_STORE, GOOGLE_STORE, TV_STORE), StoreBillingStatus (PENDING, PAID, FAILED, REFUNDED), StoreEventType (INITIAL_PURCHASE, RENEWAL, CANCELLATION, REFUND)
- **Indexes**: (organisation_id, subscription_id), (organisation_id, client_id), (organisation_id, store_source), UNIQUE (store_source, store_transaction_id), (organisation_id, status)
- **Business Methods**: isPaid(), isFailed(), isRefunded(), isPending(), markPaid(), markFailed(), markRefunded(), isRenewal(), isInitialPurchase()

#### Store Config Entity Design
- **Fields**: id, organisation_id, store_type (enum), bundle_id, shared_secret_hash (hashed, never plaintext), webhook_url, active, created_at, updated_at
- **Enums**: StoreType (APPLE, GOOGLE)
- **Indexes**: UNIQUE (organisation_id, store_type), (organisation_id, active)
- **Business Methods**: isActive(), deactivate(), activate(), isAppleStore(), isGoogleStore()
- **Security**: shared_secret_hash is stored hashed, never plaintext. Hashing happens at application layer before persistence.

#### Repository Pattern for Store Billing
- **IStoreBillingRecordRepository**: findById, findBySubscription, findByStoreTransaction, findByStatus, aggregateRevenueByStore, save, delete, findAll
- **aggregateRevenueByStore**: Uses QueryBuilder with SUM(amount) and COUNT for revenue analytics by store source
- **Error Handling**: Catches unique constraint violations (code 23505) and converts to RpcException with ALREADY_EXISTS status

#### Repository Pattern for Store Config
- **IStoreConfigRepository**: findById, findByOrganisationAndType, findByOrganisation, findActiveByOrganisation, save, delete, findAll
- **Filtering**: Supports optional filters for organisation_id, store_type, active status
- **Error Handling**: Same pattern as StoreBillingRecord for constraint violations

#### Migration Strategy
- **Enum Types**: Create separate enum types in PostgreSQL (store_source_enum, store_billing_status_enum, store_event_type_enum, store_type_enum)
- **Unique Constraints**: Use raw SQL for unique indexes with WHERE clauses (e.g., UNIQUE on store_source + store_transaction_id)
- **Rollback**: Always implement down() method with DROP INDEX, DROP TABLE, DROP TYPE in reverse order
- **Timestamp**: Use TIMESTAMPTZ for all date columns, DEFAULT NOW() for created_at

#### Testing with Bun
- **Entity Tests**: 25 tests covering entity creation, status checks, status transitions, event type checks, multi-tenancy, receipt data, store sources, amounts/currency, timestamps
- **Test Structure**: beforeEach() setup, describe() blocks for logical grouping, expect() assertions
- **Coverage**: Test all enums, all status transitions, business methods, null handling, relationships
- **Execution**: `bun test path/to/spec.ts` runs all tests in file

#### Multi-Tenancy Pattern
- **Isolation**: All queries filter by organisation_id first
- **Indexes**: Always include organisation_id in composite indexes for efficient filtering
- **Unique Constraints**: Scoped to organisation (e.g., UNIQUE (organisation_id, store_type))
- **Cross-Service**: Store subscription_id and client_id as UUID references (no foreign keys to avoid cross-database issues)

#### Amount Handling
- **Cents**: Store amounts as BIGINT in cents (e.g., 999 = $9.99)
- **Currency**: 3-character ISO code (USD, EUR, GBP, etc.)
- **Aggregation**: Use QueryBuilder with SUM() for revenue calculations

#### Event Tracking
- **Event Date**: Separate from created_at — event_date is when store event occurred, created_at is when CRM recorded it
- **Original Transaction ID**: Used for renewals to link back to initial purchase
- **Event Types**: INITIAL_PURCHASE, RENEWAL, CANCELLATION, REFUND — supports full subscription lifecycle

#### Files Created
- `domain/mondial-tv/entities/store-billing-record.entity.ts` — Entity with enums and business methods
- `domain/mondial-tv/entities/store-config.entity.ts` — Config entity with activation methods
- `domain/mondial-tv/repositories/IStoreBillingRecordRepository.ts` — Repository interface
- `domain/mondial-tv/repositories/IStoreConfigRepository.ts` — Repository interface
- `infrastructure/persistence/typeorm/repositories/mondial-tv/store-billing-record.service.ts` — Repository implementation
- `infrastructure/persistence/typeorm/repositories/mondial-tv/store-config.service.ts` — Repository implementation
- `migrations/1770490000000-CreateStoreBilling.ts` — Database migration
- `domain/mondial-tv/entities/__tests__/store-billing-record.entity.spec.ts` — 25 comprehensive tests

#### Test Results
- ✅ 25 tests pass
- ✅ 70 expect() calls
- ✅ All entity creation, status transitions, event types, multi-tenancy, timestamps covered

---

## Task 3: Subscription Entity Circular Dependency Fix

### Key Learnings
- Circular init errors in TypeORM entities can persist with direct class imports and relation lambdas when modules evaluate in a cycle.
- Using string-based relation targets/inverse fields (`@ManyToOne('SubscriptionEntity', 'history')`) removes eager class resolution and breaks runtime cycles.
- Applying the same pattern to `@OneToMany` in `SubscriptionEntity` avoids importing child entity classes and fully removes the circular bootstrap path.
- `bun test subscription-lifecycle` no longer throws `ReferenceError: Cannot access 'SubscriptionEntity' before initialization`; remaining failures are unrelated service/test API mismatches.

---

## Task 3: Subscription Lifecycle API Alignment

### Key Learnings
- Lifecycle service and tests diverged on public API names; adding wrappers is not enough when transition semantics differ (`PAUSED`/`CANCELED` vs `SUSPENDED`/`CANCELLED`).
- The safest transition implementation is a single `transition()` path with method-specific guards (trial validation, FREE_AVOD direct activation, allowed source states) and explicit event subjects.
- History persistence must tolerate both repository shapes used in this codebase (`create` with `triggeredBy`/`metadata` and legacy `save` status-history records).
- `triggeredBy` and `metadata` need to be propagated to both history entries and NATS payloads to satisfy audit expectations.
- Scheduling service expectations in tests require Date-native APIs (`calculateNextChargeAt` returns `Date`, `isTrialExpired`, `getDueForCharge`, `getDueForTrialConversion`) with legacy helper compatibility retained.

## Task 7 Follow-up: Trial Conversion Test Hardening
- Trial conversion service should defensively skip entries with trial_end in the future (reason: TRIAL_NOT_EXPIRED), even if scheduling returns them.
- IdempotenceStore test doubles must implement shared-kernel contract methods exactly: isEventProcessed(eventId) and markEventProcessed(eventId, eventType).
- subscription-trial spec coverage should include free conversion (no charge), paid success, paid failure to PAST_DUE, non-expired skip, and mixed multi-subscription batch behavior in one organisation.

---

## Task 10: Dunning Workflow — Seed Data + Twilio SMS

### Key Learnings

#### SMS Service Abstraction
- Interface `ISmsService` with `SendSmsInput`/`SendSmsResult` enables clean swap between TwilioSmsService (prod) and MockSmsService (test/dev).
- MockSmsService records all sent messages in `sentMessages` array for test assertions.
- TwilioSmsService uses native `fetch()` to Twilio REST API — no SDK dependency needed for basic SMS.
- Credentials from env: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER.
- Service degrades gracefully when credentials missing (returns `SMS_DISABLED` error, logs warning).

#### IMS Client Abstraction
- Same pattern: `IImsClient` interface with `MockImsClientService` for dev.
- Uses NestJS DI tokens: `SMS_SERVICE_TOKEN` and `IMS_CLIENT_TOKEN` for injection.
- IMPORTANT: Must use `import type { IImsClient }` (not regular import) when used in constructor with `@Inject()` due to `isolatedModules` + `emitDecoratorMetadata` TS1272 error.

#### Seed Data Pattern
- Deterministic UUIDs for seed records (idempotent: skip if exists).
- `DunningSeedService implements OnModuleInit` — seeds run on app bootstrap.
- Pure functions `buildMondialTvRetryPolicy()` and `buildMondialTvReminderPolicy()` exported for testing.
- RetryPolicy: retryDelaysDays=[2,5,10], maxAttempts=3, maxTotalDays=10, backoffStrategy=FIXED.
- ReminderPolicy: 4 triggerRules (J0 email, J+2 sms, J+5 email, J+10 system).

#### NATS Handler Pattern
- `DunningMaxRetriesExceededHandler implements OnModuleInit` — same pattern as BundlePriceRecalculatedHandler.
- Handler flow: IMS notification → schedule status transition to PAUSED → metadata enrichment.
- Gracefully handles missing schedule (logs warning, IMS still notified).

#### CB Update Session
- `CbUpdateSessionService` generates 24h crypto tokens (32 bytes hex).
- Token hash stored (SHA256), raw token in SMS link.
- Rejects STORE subscription type (SMS only for WEB_DIRECT).
- In-memory session store (Map) — suitable for MVP, replace with DB in production.

#### Testing
- 13 tests covering all 5 components + MockImsClient.
- Jest with `ts-jest` (not bun:test) — existing selective-dunning.spec.ts uses bun:test which breaks under Jest.
- Test pattern: construct service with mock repositories (jest.fn()), invoke method, assert.

### Files Created
- `infrastructure/external/sms/sms-service.interface.ts` — ISmsService interface
- `infrastructure/external/sms/twilio-sms.service.ts` — Twilio implementation
- `infrastructure/external/sms/mock-sms.service.ts` — Mock for tests
- `infrastructure/external/sms/index.ts` — Barrel export
- `infrastructure/external/ims/ims-client.interface.ts` — IImsClient interface
- `infrastructure/external/ims/mock-ims-client.service.ts` — Mock IMS client
- `infrastructure/external/ims/index.ts` — Barrel export
- `infrastructure/persistence/typeorm/repositories/payments/dunning-seed.service.ts` — Seed data
- `infrastructure/persistence/typeorm/repositories/payments/cb-update-session.service.ts` — CB update service
- `infrastructure/messaging/nats/handlers/dunning-max-retries-exceeded.handler.ts` — NATS handler
- `interfaces/http/controllers/payments/cb-update-session.controller.ts` — POST /portal/cb-update-session
- `infrastructure/persistence/typeorm/repositories/payments/dunning-workflow.spec.ts` — 13 tests

### Files Modified
- `payments.module.ts` — Wired all new services, controllers, DI tokens
- `infrastructure/messaging/nats/handlers/index.ts` — Added handler export
- `infrastructure/persistence/typeorm/repositories/payments/index.ts` — Added service exports

### Test Results
- ✅ 13 tests pass (dunning-workflow.spec.ts)
- ✅ tsc --noEmit clean (0 errors)
