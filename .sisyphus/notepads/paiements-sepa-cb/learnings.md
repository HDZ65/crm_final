# Learnings — Paiements SEPA & CB

## 2026-02-07 Initialization
- service-finance uses DDD: domain/ application/ infrastructure/ interfaces/
- 3 bounded contexts: Payments (21 entities), Factures (10), Calendar (11)
- TypeORM with snake_case naming, PostgreSQL finance_db
- PSP accounts already exist as entities: SlimpayAccountEntity, MultiSafepayAccountEntity, EmerchantpayAccountEntity
- Proto in packages/proto/src/payments/payment.proto (~897 lines, ~70 RPCs)
- Frontend: Next.js 15, React 19, shadcn UI
- Debit config hierarchy: System → Company → Client → Contract

## 2026-02-07 Security foundation (service-finance)
- Added `infrastructure/security` for reusable payment-security primitives (encryption, masking, transformer, interceptor).
- AES-256-GCM implementation stores encrypted values as single base64 payload: `iv(12) + ciphertext + authTag(16)`.
- `ENCRYPTION_KEY` parsing supports 64-char hex and 32-byte base64; missing key falls back to random dev key with warning.
- IBAN masking keeps first 4 and last 4 characters and masks middle groups for log-safe output.
- Registered `EncryptionService` and `IbanMaskingService` in `PaymentsModule` exports for cross-module reuse.
- Added gRPC log interceptor that masks serialized response payloads without mutating actual response data.

## 2026-02-07 CDC Entity Creation (11 entities)
- Entity pattern: @Entity('table_name'), @PrimaryGeneratedColumn('uuid'), @CreateDateColumn({ name: 'created_at' })
- JSONB columns: @Column({ type: 'jsonb', default: '{}' }) for Record types, default: '[]' for arrays
- Composite indexes: @Index(['field1', 'field2']) at class level decorator
- Enums: TypeScript enums with uppercase values, used as type: 'enum', enum: EnumName
- PaymentStatusEntity uses @PrimaryColumn (not @PrimaryGeneratedColumn) since status_code is natural PK
- Unique constraints: @Unique(['field1', 'field2']) at class level
- All 11 entities registered in payments.module.ts TypeOrmModule.forFeature()
- Build: bun run build runs proto:clean, proto:generate, then nest build (tsc)
- LSP not available on Windows env, rely on nest build for TS compilation check

## 2026-02-07 Proto Extension (Task 2 — ~40 RPCs)
- Added 10 new RPC sections to PaymentService: Slimpay, MultiSafepay, Emerchantpay, Routing, Alerts, Exports, Scoring, Reconciliation, Status Mapping, Rejection Reasons
- Total new RPCs: 40 (5+3+4+10+3+4+4+4+2+3)
- Proto file grew from ~897 lines to ~1500+ lines
- All new messages follow existing pattern: string for UUIDs, int64 amount_cents for money, string for ISO dates
- Pagination pattern: page, page_size in requests; total, page, page_size in responses
- `buf generate` for TypeScript codegen, `buf lint` for validation
- Lint warnings are pre-existing in other protos (naming convention), no new errors from payment.proto
- Generated TS output: packages/proto/gen/ts/payments/payment.ts (~534KB after regeneration)
- Routing messages use JSON strings for JSONB fields (conditions, selection_query)
- Reconciliation uses bytes for file_content (bank statement import, export download)
- Domain context: Annexe C (routing rules, overrides, reassignment jobs), Annexe D (webhook events, status mappings)

## RUM Generator Service Implementation

### Created Files
- `services/service-finance/src/infrastructure/persistence/typeorm/repositories/payments/rum-generator.service.ts`

### Key Implementation Details

1. **Format**: `{ICS}-{ContractID}-{YYYY}` (Annexe L compliant)
   - ICS: SEPA Creditor Identifier from company
   - ContractID: Truncated/padded to fit within 35-char limit
   - YYYY: Year (current or specified)

2. **Methods**:
   - `generateRum(ics, contractId, year?)`: Generates RUM with automatic truncation
   - `validateRum(rum)`: Validates format, length (≤35), allowed chars (alphanumeric + hyphen)
   - `hashRum(rum)`: SHA-256 hash for integrity verification
   - `isUnique(companyId, rum)`: Checks uniqueness against existing mandates
   - `generateAndStore(companyId, ics, contractId)`: Generates, validates uniqueness, handles collisions with sequence numbers

3. **Uniqueness Handling**:
   - Checks DB for existing RUM per company
   - If collision, appends sequence number (1-9) to contractId
   - Max 10 attempts before throwing error

4. **Module Registration**:
   - Registered in `payments.module.ts` as provider and export
   - Exported from `infrastructure/persistence/typeorm/repositories/payments/index.ts`
   - Injected with GoCardlessMandateEntity repository

5. **SEPA Compliance**:
   - Max length: 35 characters (SEPA RUM limit)
   - Immutable during mandate lifetime
   - Unique per ICS (creditor identifier)
   - Allowed characters: alphanumeric + hyphen only

### Build Status
- RUM service compiles successfully
- Pre-existing build errors in emerchantpay-webhook.handler.ts (unrelated)
- Service ready for integration with mandate creation workflow


## 2026-02-07 ProviderStatusMappingService Implementation

### Created Files
- `services/service-finance/src/infrastructure/persistence/typeorm/repositories/payments/provider-status-mapping.service.ts`
- `services/service-finance/src/infrastructure/grpc/payments/status-mapping.controller.ts`

### Key Implementation Details

1. **Service Architecture**:
   - `ProviderStatusMappingService` implements `OnModuleInit` for cache loading
   - In-memory cache: `Map<string, ProviderStatusMappingEntity>` keyed by `provider:rawStatus:reason`
   - Cache loaded on module init from database, invalidated after updates

2. **Core Methods**:
   - `mapStatus(provider, rawStatus, rawReason?)`: Maps PSP raw status to internal code
     - Returns `{ statusCode, retryAdvice }`
     - If mapping not found: creates UNKNOWN_STATUS_MAPPING alert, returns `{ statusCode: 'API_ERROR', retryAdvice: 'MANUAL' }`
   - `invalidateCache()`: Reloads cache from database (called after updates)
   - `onModuleInit()`: Loads all mappings into cache on startup
   - `listMappings(providerId?)`: Lists all mappings, optionally filtered by provider
   - `updateMapping(id, data)`: Updates statusCode/retryAdvice, invalidates cache

3. **Alert Handling**:
   - Unknown status mappings trigger `AlertEntity` creation with:
     - scope: PROVIDER
     - severity: WARNING
     - code: UNKNOWN_STATUS_MAPPING
   - Alert creation failures don't block status mapping (graceful degradation)

4. **gRPC Controller**:
   - `ListProviderStatusMappings`: Lists mappings, filters by provider_name
   - `UpdateProviderStatusMapping`: Updates mapping, invalidates cache
   - Proto response mapping: `providerId` → `provider_name`, `providerRawStatus` → `provider_status`, etc.

5. **Module Registration**:
   - Registered in `payments.module.ts` as provider and export
   - Controller registered in `controllers` array
   - Injected with `ProviderStatusMappingEntity` and `AlertEntity` repositories

6. **Type Safety**:
   - Fixed null/undefined issue: `mapping.providerRawReason || undefined` for cache key generation
   - Proper TypeScript types for all methods

### Build Status
- Service compiles successfully (no new errors introduced)
- Pre-existing build errors in emerchantpay-webhook.handler.ts and missing PSP modules (unrelated)
- Ready for integration with PSP connectors

### Annexe K Compliance
- Supports all 4 PSP providers: Slimpay (8 mappings), MultiSafepay (8), Emerchantpay (8), GoCardless (8)
- Maps to internal status codes: PENDING, SUBMITTED, PAID, REJECT_INSUFF_FUNDS, REJECT_OTHER, CANCELLED, REFUNDED, API_ERROR
- Retry advice: AUTO, MANUAL, NEVER
- Cache ensures O(1) lookup performance for high-frequency status mapping operations


## 2026-02-07 Slimpay PSP Connector Implementation

### Created Files
- `services/service-finance/src/infrastructure/psp/slimpay/slimpay-api.service.ts` — HTTP client with OAuth2
- `services/service-finance/src/infrastructure/psp/slimpay/slimpay-webhook.handler.ts` — Webhook handler with HMAC
- `services/service-finance/src/infrastructure/psp/slimpay/index.ts` — barrel export
- `services/service-finance/src/interfaces/grpc/controllers/payments/slimpay.controller.ts` — gRPC controller

### Key Implementation Details

1. **SlimpayApiService**:
   - OAuth2 client_credentials flow with per-societeId token caching
   - Token auto-refresh with 60s buffer before expiry
   - SlimpayAccountEntity lookup: `societeId + actif: true`
   - Base URL: sandbox (api.preprod.slimpay.com) vs production (api.slimpay.com) based on `isSandbox`
   - `SLIMPAY_API_URL` env var overrides both environments
   - Uses native `fetch` for HTTP calls (no extra dependencies)
   - HAL+JSON content type (`application/hal+json`) per Slimpay API conventions
   - All API calls logged via PaymentEventEntity
   - IbanMaskingService used for IBAN logging, plain IBAN sent to Slimpay API only

2. **SlimpayWebhookHandler**:
   - HMAC SHA-256 signature verification with `crypto.timingSafeEqual` (constant-time)
   - Anti-replay: rejects webhooks with dateCreated > 5 minutes old
   - Idempotence: checks PSPEventInboxEntity by (PSPProvider.SLIMPAY, eventId) unique index
   - Status mapping via ProviderStatusMappingEntity (DB lookup), with fallback hardcoded mapping
   - Fallback mapping (Annexe K.2): created→PENDING, accepted→SUBMITTED, executed→PAID, rejected+AM04→REJECT_INSUFF_FUNDS, rejected+other→REJECT_OTHER, cancelled→CANCELLED, refunded→REFUNDED, error→API_ERROR
   - Every status change creates a PaymentEventEntity record

3. **SlimpayController (gRPC)**:
   - Implements 5 RPCs: CreateSlimpayMandate, GetSlimpayMandate, CancelSlimpayMandate, CreateSlimpayPayment, GetSlimpayPayment
   - Uses `@GrpcMethod('PaymentService', 'RpcName')` decorator pattern
   - Proto types imported as `import type { ... } from '@proto/payment'`
   - Maps between proto snake_case fields and service camelCase types

4. **Module Registration**:
   - SlimpayApiService, SlimpayWebhookHandler registered as providers and exports
   - SlimpayController registered as controller
   - All in PaymentsModule (payments.module.ts)

### Patterns Discovered
- PSP connector directory: `infrastructure/psp/{provider}/` with api service, webhook handler, and barrel index
- gRPC controllers for PSPs live in `interfaces/grpc/controllers/payments/`
- Path from interfaces controller to infrastructure: `../../../../infrastructure/psp/...` (4 levels up)
- SlimpayAccountEntity uses `appName`/`appSecret` (not apiKey/apiSecret as originally noted)
- `webhookSecret` field exists on SlimpayAccountEntity for HMAC verification
- Slimpay HAPI API uses HAL+JSON with `_embedded` and `_links` structures

### Build Status
- All Slimpay files compile successfully (no new errors)
- Pre-existing errors: emerchantpay TS1272 (express import issue), multisafepay missing barrel (3 errors total)
- These pre-existing errors are not from our changes

## Task 5: MultiSafepay PSP Connector - Learnings

### Patterns
- PSP connectors live in `src/infrastructure/psp/<provider>/` with barrel index.ts
- gRPC controllers go in `src/interfaces/grpc/controllers/payments/` (NOT infrastructure/grpc/)
- Path from interfaces/grpc/controllers/payments/ to infrastructure/psp/ needs 4 levels up: `../../../../infrastructure/psp/`
- Controller uses inline interface definitions matching proto messages (no import from @proto/payment needed)
- PaymentProvider enum is in schedule.entity.ts (lowercase values: 'multisafepay')
- PSPProvider enum is in portal-session.entity.ts (uppercase values: 'MULTISAFEPAY')
- Use PSPProvider for PSPEventInboxEntity, PaymentProvider for PaymentEventEntity
- EncryptionService available globally, handles isEncrypted check before decrypt

### MSP-specific
- API key auth via `api_key` header (not Authorization)
- Base URL from MULTISAFEPAY_API_URL env var, default: testapi.multisafepay.com
- Status mapping (Annexe K.3): completed→PAID, declined→REJECT_OTHER, chargeback→REJECT_INSUFF_FUNDS, refunded→REFUNDED, cancelled→CANCELLED, expired→CANCELLED
- HMAC uses SHA-512 for webhook verification
- webhookSecret stored in MultiSafepayAccountEntity, encrypted

### Parallel task conflicts
- payments.module.ts is heavily modified by parallel tasks (Slimpay, Archive, Emerchantpay)
- Need to re-read before each edit due to concurrent modifications
- Emerchantpay task has pre-existing TS1272 errors (import type issue) - not our problem

## 2026-02-07 Payment Archive System

### Created Files
- `domain/payments/entities/payment-archive.entity.ts` — Archive entity (table: payment_archives)
- `infrastructure/persistence/typeorm/repositories/payments/archive-scheduler.service.ts` — Cron scheduler
- `interfaces/grpc/controllers/payments/archive.controller.ts` — Manual trigger gRPC controller

### Key Implementation Details
- PaymentArchiveEntity mirrors PaymentIntentEntity + archivedAt, archivedBy, originalPaymentId
- ArchiveSchedulerService uses @Cron('0 3 * * *') for daily 03:00 execution
- ScheduleModule.forRoot() from @nestjs/schedule added to PaymentsModule imports
- Archival is copy-only: originals NOT deleted, just copied to payment_archives
- Dedup check: skips if originalPaymentId already exists in archive table
- Interactions archived (deleted) at J+90, portal sessions at J+7
- Archive policy: configurable per company (TODO: load from company_settings)
- Final statuses for archival: SUCCEEDED, REFUNDED, CANCELLED, FAILED
- gRPC controller provides manual triggers: ArchivePayments, ArchiveInteractions, ArchivePortalSessions, RunFullArchive, GetArchivePolicy

### Build Status
- All archive files compile successfully (no new errors)
- Pre-existing errors: emerchantpay TS1272 (2 errors, unrelated)

## 2026-02-07 CustomerInteractionService Implementation

### Created Files
- `services/service-finance/src/infrastructure/persistence/typeorm/repositories/payments/customer-interaction.service.ts`

### Key Implementation Details

1. **Service Architecture**:
   - `CustomerInteractionService` bridges ReminderEntity with CustomerInteractionEntity
   - Tracks all customer communications (EMAIL, SMS, CALL)
   - Supports pagination and statistics aggregation

2. **Core Methods**:
   - `recordInteraction(params)`: Create interaction record with channel, message_type, payload, status
   - `recordFromReminder(reminder)`: Bridge method converting ReminderEntity to CustomerInteractionEntity
     - Maps ReminderChannel → InteractionChannel (PHONE_CALL→CALL, PUSH_NOTIFICATION/POSTAL_MAIL→EMAIL)
     - Maps ReminderStatus → InteractionStatus (PENDING→QUEUED, SENT/DELIVERED/OPENED/CLICKED→SENT, FAILED/CANCELLED/BOUNCED→FAILED)
     - Stores reminder metadata in payload JSONB: reminderId, templateVariables, trigger, providerName, providerMessageId
   - `listByCustomer(customerId, page, pageSize)`: Paginated list with total/totalPages
   - `listByPayment(paymentId)`: List interactions for specific payment
   - `updateStatus(interactionId, status, errorMessage?)`: Update status, auto-set sentAt on SENT
   - `getInteractionStats(companyId)`: Aggregate counts by channel and status

3. **Channel Mapping**:
   - ReminderChannel.EMAIL → InteractionChannel.EMAIL
   - ReminderChannel.SMS → InteractionChannel.SMS
   - ReminderChannel.PHONE_CALL → InteractionChannel.CALL
   - ReminderChannel.PUSH_NOTIFICATION → InteractionChannel.EMAIL (fallback)
   - ReminderChannel.POSTAL_MAIL → InteractionChannel.EMAIL (fallback)

4. **Status Mapping**:
   - REMINDER_PENDING → QUEUED
   - REMINDER_SENT/DELIVERED/OPENED/CLICKED → SENT
   - REMINDER_FAILED/CANCELLED/BOUNCED → FAILED

5. **Module Registration**:
   - Registered in `payments.module.ts` as provider and export
   - Exported from `infrastructure/persistence/typeorm/repositories/payments/index.ts`
   - Injected with CustomerInteractionEntity repository only (no cross-entity dependencies)

6. **Type Exports**:
   - `PaginatedResult<T>`: Generic pagination wrapper with data, total, page, pageSize, totalPages
   - `InteractionStats`: Aggregation result with byChannel, byStatus, totalInteractions

### Build Status
- Service compiles successfully
- `bun run build` passes with no new errors
- Compiled output: dist/src/infrastructure/persistence/typeorm/repositories/payments/customer-interaction.service.{js,d.ts}

### Design Notes
- No direct dependency on ReminderEntity repository (only receives entity instance)
- Payload JSONB stores reminder context for audit trail
- sentAt auto-set on status update to SENT (idempotent)
- Statistics use in-memory aggregation (suitable for small datasets; consider DB aggregation for large companies)

## 2026-02-07 AlertService & AlertController Implementation

### Created Files
- `services/service-finance/src/infrastructure/persistence/typeorm/repositories/payments/alert.service.ts` — Multi-channel alert management
- `services/service-finance/src/interfaces/grpc/controllers/payments/alert.controller.ts` — gRPC controller (3 RPCs)

### Key Implementation Details

1. **AlertService**:
   - `createAlert(params)`: Creates alert, dispatches notifications based on severity
   - `acknowledgeAlert(alertId, userId)`: Uses entity's `acknowledge()` business method
   - `listAlerts(filters)`: QueryBuilder-based with scope, severity, code, acknowledged, date range, pagination
   - `getAlertStats(fromDate, toDate)`: In-memory aggregation by severity and code
   - `resolveAlert(alertId)`: Soft delete via TypeORM remove

2. **Multi-Channel Notifications (CDC Section 5.3)**:
   - CRITICAL → Email + Slack + UI
   - WARNING → Email + UI
   - INFO → UI only
   - Email: logs content (no nodemailer dep, external SMTP)
   - Slack: logs webhook payload (env var `SLACK_WEBHOOK_URL`)
   - UI: logs NATS `alert.created` event (no NATS in service-finance yet)

3. **AlertController (gRPC)**:
   - `ListAlerts`: Maps proto ListAlertsRequest to AlertFilters, returns paginated response
   - `AcknowledgeAlert`: Delegates to service
   - `GetAlertStats`: Returns counts by severity + by_type breakdown
   - All RPCs use `@GrpcMethod('PaymentService', 'RpcName')` pattern

4. **9 Alert Codes (CDC Section 5.2)**:
   - CRITICAL: PROVIDER_ROUTING_NOT_FOUND, API_CREDENTIALS_INVALID, HIGH_RISK_MISROUTED
   - WARNING: PAYMENT_NOT_SUBMITTED, REJECT_SPIKES, BATCH_DAY_EMPTY, CUTOFF_MISSED, HIGH_RISK_SCORE
   - INFO: FAILED_REMINDER

5. **Naming Collision Fix**:
   - Renamed `PaginatedResult` → `AlertPaginatedResult` to avoid conflict with `customer-interaction.service.ts` barrel export
   - Barrel export from `index.ts` re-exports both files

### Build Status
- `bun run build` passes cleanly (no new errors)
- Pre-existing export.controller.ts null/undefined issue fixed by parallel task

## 2026-02-07 ExportService Implementation

### Created Files
- `infrastructure/persistence/typeorm/repositories/payments/export.service.ts`
- `interfaces/grpc/controllers/payments/export.controller.ts`

### Key Implementation Details
- ExportService: createExportJob, generateExport (async fire-and-forget), getExportJob, listExportJobs, getDownloadUrl
- Annexe J.2 columns: 21 fields including risk_score, risk_tier, reminder_count
- Annexe J.6 accounting mapping: PAID→debit BAN(512)/credit CLIENT(411), REJECT→contre-passation, REFUNDED→reverse entry
- CSV: separator `;`, UTF-8 BOM, header included
- XLSX: simplified as tab-separated (no heavy library per MUST NOT constraint)
- JSON: structured array
- Files compressed with gzip, hashed SHA-256 for integrity
- Signed download URL: HMAC-SHA256 token with 24h expiry
- Scheduled exports: @Cron daily 06:00, weekly Mon 06:30, monthly 1st 07:00
- Reminder counts loaded via retry_schedule join (ReminderEntity has retryScheduleId, not paymentIntentId directly)
- Named ExportPaginatedResult to avoid barrel export conflict with CustomerInteractionService
- gRPC controller: 4 RPCs (CreateExportJob, GetExportJob, ListExportJobs, DownloadExport) on PaymentService
- DownloadExport returns signed URL, not file bytes
- Build passes cleanly
