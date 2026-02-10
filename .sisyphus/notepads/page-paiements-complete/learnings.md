# Learnings - Page Paiements Complete

## Proto Messages Added - 2026-02-10

### Task: Add ListPayments and GetPaymentStats RPCs

**Files Modified:**
- packages/proto/src/payments/payment.proto

**RPCs Added to PaymentService:**
1. `rpc ListPayments(ListPaymentsRequest) returns (ListPaymentsResponse)`
2. `rpc GetPaymentStats(GetPaymentStatsRequest) returns (GetPaymentStatsResponse)`

**Messages Added:**

1. **ListPaymentsRequest** (14 fields):
   - societe_id (required)
   - 12 optional filters: search, status, psp_provider, payment_method, debit_lot, risk_tier, source_channel, date_from, date_to, min_amount, max_amount
   - Pagination: page, limit

2. **ListPaymentsResponse** (4 fields):
   - payments: PaymentItem[]
   - total, page, limit

3. **PaymentItem** (24 fields):
   - Core: id, payment_reference
   - Relations: client_id, client_name, contract_id, contract_reference, company
   - Financial: amount (cents), currency, payment_method
   - Status: status, payment_type
   - PSP: psp_provider, psp_transaction_id
   - Calendar: planned_debit_date, actual_debit_date, debit_lot
   - Risk: risk_score, risk_tier
   - Retry: retry_count
   - SEPA: rum, iban_masked
   - Metadata: created_at, updated_at

4. **GetPaymentStatsRequest** (3 fields):
   - societe_id (required)
   - date_from, date_to (optional)

5. **GetPaymentStatsResponse** (10 fields):
   - total_payments, total_amount (cents)
   - paid_count, paid_amount (cents)
   - pending_count, pending_amount (cents)
   - rejected_count, rejected_amount (cents)
   - reject_rate (percentage), average_amount (cents)

**Generated TypeScript Types:**
- Location: frontend/src/proto/payments/payment.ts
- All interfaces generated with camelCase field names
- Service methods added to PaymentService definition

**Verification:**
✅ Proto compiles without errors
✅ TypeScript types generated in frontend/src/proto/payments/payment.ts
✅ All 4 message interfaces present
✅ RPCs added to service definition
✅ Field mappings match frontend Payment, PaymentFilters, PaymentStats interfaces

**Pattern Followed:**
- Followed existing payment.proto RPC pattern (lines 9-133)
- Used pagination pattern from factures.proto
- Amounts stored as int64 cents (not float)
- Dates as ISO strings
- Optional fields use `optional` keyword

**Key Conventions:**
- Proto uses snake_case for field names
- Generated TS uses camelCase automatically
- Monetary amounts ALWAYS in cents (int64), never float
- All dates as ISO string format
- Pagination fields: page, limit (not page_size)

## Task 2: ListPayments Backend Implementation - 2026-02-10

### Data Enrichment Strategy: Option B-lite (local JOINs, metadata-based)

**Reason:** PaymentIntentEntity does NOT have client_name, contract_reference, company columns.
ScheduleEntity has contratId but no names. No cross-service gRPC calls available locally.
Strategy: JOIN PaymentIntentEntity + ScheduleEntity + RiskScoreEntity,
extract client_name/contract_reference/company from metadata jsonb fields.
Frontend can further enrich from its own service-core cache if needed.

**Files Created:**
- `services/service-finance/src/application/queries/payment-query.service.ts`
- `services/service-finance/src/interfaces/grpc/controllers/payments/payment-query.controller.ts`

**Files Modified:**
- `services/service-finance/src/payments.module.ts` (added controller + provider + export)

**Key Implementation Details:**
- DB stores amounts as decimal, proto expects cents (int64) — multiply by 100
- Stats use raw SQL aggregation (COUNT, SUM, CASE WHEN) for performance
- reject_rate = (rejected_count / total_payments) * 100
- All 12 filters implemented: search, status, psp_provider, payment_method, debit_lot,
  risk_tier, source_channel, date_from, date_to, min_amount, max_amount
- Pagination capped at 1000 results max
- Status mapping: proto PAID=entity SUCCEEDED, proto REJECTED=entity FAILED
- Proto import path: `@proto/payment` (mapped via tsconfig to `proto/generated/`)
- Followed AlertController pattern for controller structure
- Followed ExportService pattern for QueryBuilder usage with PaymentIntentEntity

**Verification:**
✅ tsc --noEmit: no new errors (pre-existing gocardless/stripe errors only)
✅ @GrpcMethod count in controller: 2 (ListPayments + GetPaymentStats)
✅ PaymentQueryService found in payments.module.ts providers and exports
## [2026-02-10] Task 3: Stripe PSP Implementation
- Files created:
  1. services/service-finance/src/infrastructure/psp/stripe/stripe-api.service.ts (~530 lines)
  2. services/service-finance/src/infrastructure/psp/stripe/stripe-webhook.handler.ts (~220 lines)
  3. services/service-finance/src/infrastructure/psp/stripe/index.ts (barrel export)
  4. services/service-finance/src/interfaces/grpc/controllers/payments/stripe.controller.ts (~320 lines)
- File modified: services/service-finance/src/payments.module.ts (added StripeApiService, StripeWebhookHandler, StripeController)
- SDK version: stripe@20.2.0 (import Stripe from 'stripe')
- Cache strategy: in-memory Map<string, Stripe> by societeId
- API methods: createPaymentIntent, getPaymentIntent, cancelPaymentIntent, createCheckoutSession, createCustomer, getCustomer, createSubscription, getSubscription, cancelSubscription, createRefund, createSetupIntent, createBillingPortalSession
- Event types mapped (6): payment_intent.succeeded->PAID, payment_intent.payment_failed->REJECT_OTHER, charge.refunded->REFUNDED, charge.dispute.created->DISPUTE_CREATED, customer.subscription.deleted->SUBSCRIPTION_CANCELLED, customer.subscription.updated->SUBSCRIPTION_UPDATED
- Webhook: uses stripe.webhooks.constructEvent() for signature verification
- Idempotence: checks PSPEventInboxEntity by pspProvider=STRIPE + pspEventId
- gRPC methods: 12 @GrpcMethod decorators (CreateStripeCheckoutSession, CreateStripePaymentIntent, GetStripePaymentIntent, CancelStripePaymentIntent, CreateStripeCustomer, GetStripeCustomer, CreateStripeSubscription, GetStripeSubscription, CancelStripeSubscription, CreateStripeRefund, CreateStripeSetupIntent, CreateStripeBillingPortalSession)
- Note: Stripe SDK v20 changed Subscription type - current_period_start/end accessed via 'as any' cast
- Note: Controllers use locally-defined interfaces (not @proto/payment imports), matching MultiSafepay pattern
- Pre-existing errors: gocardless-api.service.ts has 14 TS errors (unrelated)


## [2026-02-10] Task 4: GoCardless PSP Integration
- Files created:
  1. services/service-finance/src/infrastructure/psp/gocardless/gocardless-api.service.ts
  2. services/service-finance/src/infrastructure/psp/gocardless/gocardless-webhook.handler.ts
  3. services/service-finance/src/infrastructure/psp/gocardless/index.ts
  4. services/service-finance/src/interfaces/grpc/controllers/payments/gocardless.controller.ts
- Files modified:
  - services/service-finance/src/domain/payments/entities/gocardless-account.entity.ts (added hasWebhookSecret())
  - services/service-finance/src/payments.module.ts (registered GoCardlessApiService, GoCardlessWebhookHandler, GoCardlessController)
- SDK version: gocardless-nodejs@7.0.0
  - Import: `GoCardlessClient` from `gocardless-nodejs/client`, `Environments` from `gocardless-nodejs/constants`
  - SDK uses string types for amounts (need parseInt conversions)
  - cancel() methods require empty `{}` as requestParameters arg
  - BillingRequestFlow does NOT have session_token parameter
- Event types mapped (5 max):
  1. payments.confirmed / payments.paid_out -> PAID
  2. payments.failed -> REJECT_OTHER or REJECT_INSUFF_FUNDS
  3. payments.cancelled -> CANCELLED
  4. mandates.active -> MANDATE_ACTIVE
  5. mandates.cancelled / mandates.failed -> MANDATE_CANCELLED
- Signature method: HMAC-SHA256 with crypto.timingSafeEqual for constant-time comparison
- hasWebhookSecret() added to GoCardlessAccountEntity
- Controller implements 6 RPCs: SetupGoCardlessMandate, GetGoCardlessMandate, CancelGoCardlessMandate, CreateGoCardlessPayment, CreateGoCardlessSubscription, CancelGoCardlessSubscription
- Proto types at @proto/payment (mapped from services/service-finance/proto/generated/payment.ts)
- PSPProvider.GOCARDLESS already exists in portal-session.entity.ts
- PaymentProvider.GOCARDLESS already exists in schedule.entity.ts
