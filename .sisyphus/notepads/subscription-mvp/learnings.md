- 2026-02-07: `bun test` in this repo requires `import type` for interface-only imports, otherwise Bun throws runtime `Export named ... not found` errors.
- 2026-02-07: Domain services under subscriptions should avoid runtime imports of TypeORM entities when only types are needed, to prevent circular initialization errors in test runtime.
- 2026-02-07: PaymentService gRPC `CreatePaymentIntent` requests must keep snake_case field names (`organisation_id`, `societe_id`, `psp_name`, `idempotency_key`) because proto loader uses `keepCase: true`.
- 2026-02-07: Subscription charge idempotency works reliably when key format is exactly `${subscriptionId}-${nextChargeAt}` and checked before external payment calls.
- 2026-02-07: Fulfillment batch lock should capture immutable address and preference snapshots at lock time, not at event ingestion time, to preserve cut-off consistency.
- 2026-02-07: Calendar-style cut-off checks in logistics require Monday-based weekday mapping (0=Mon..6=Sun) plus timezone-aware HH:mm evaluation.

## Task 6: WooCommerce Sync Workers
- WooCommerce entity was heavily modified from Task 7: uses `source`, `externalEventId`, `signature`, domain methods (`markVerified`, `markProcessed`, etc.)
- Subscription entity was also modified by another task: uses TypeORM enums (SubscriptionStatus, SubscriptionFrequency), has `planType`, `storeSource`, removed old string fields
- bun test + TypeORM decorators: circular import causes 'Cannot access before initialization'. Fix: define local enums in service files, use `import type` for entities in tests
- HTTP webhook controller already existed at `infrastructure/http/woocommerce/`, separate WooCommerceModule was already wired
- NatsService pattern: `publish(subject, data)`, `subscribe(subject, handler)`, `isConnected()`
- Test pattern: createFixture() with in-memory stores (Map), mock repos, assert on saved collections
