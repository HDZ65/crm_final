- 2026-02-07: For consolidated billing in service-finance, `LigneFactureEntity` can safely carry per-line service metadata (`serviceCode`, catalog price, discount flags) without impacting mono-service creation flow.
- 2026-02-07: A robust `bundle.price.recalculated` handler should accept both snake_case and camelCase payload fields to stay compatible with evolving cross-service event contracts.
- 2026-02-07: Bun tests in this repo execute Nest services well when imports avoid broad entity barrels that trigger circular TypeORM entity evaluation at runtime.

## 2026-02-07 19:13 - Task 8 Complete: Portal API Integration

- Successfully integrated Server Actions into all 4 portal pages (dashboard, services, justi-plus, wincash)
- Created 4 gRPC clients (bundle, conciergerie, justi-plus, wincash) following existing patterns
- Created 4 Server Action files with proper error handling and ActionResult<T> return types
- All pages now fetch real data from backend services instead of mock data
- Bundle pricing calculation integrated with discount logic
- Token-based authentication pattern established (token used as clientId for now)

