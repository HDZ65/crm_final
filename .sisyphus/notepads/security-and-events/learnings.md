
## Invoice Created Event Implementation (2026-02-02)

### Patterns Used
- **Publisher Pattern**: Inject NatsService, use `publishProto(subject, event, EventType)` after successful operation
- **Subscriber Pattern**: Implement `OnModuleInit`, subscribe in `onModuleInit()`, handle events with idempotency check
- **Idempotency**: Use `ProcessedEventsRepository` - check `exists()` before processing, `markProcessed()` after

### Event Structure
- Subject format: `crm.events.<entity>.<action>` (e.g., `crm.events.invoice.created`)
- Event import: `@crm/proto/events/<entity>` (e.g., `@crm/proto/events/invoice`)
- Event interface already generated from proto at `packages/proto/gen/ts/events/invoice_events.ts`

### Files Changed
1. Publisher: `services/service-factures/src/modules/invoices/invoices.controller.ts`
2. Subscribers (4 services):
   - `services/service-email/src/modules/events/invoice-created.handler.ts`
   - `services/service-notifications/src/modules/events/invoice-created.handler.ts`
   - `services/service-dashboard/src/modules/events/invoice-created.handler.ts`
   - `services/service-relance/src/modules/events/invoice-created.handler.ts`
3. Events modules updated to register new handlers
