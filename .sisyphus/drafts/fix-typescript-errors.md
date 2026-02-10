# Draft: Fix Pre-existing TypeScript Errors

## Requirements (confirmed)
- Fix ALL pre-existing TypeScript errors in the frontend
- User wants a clean `npx tsc --noEmit` output

## Known Error Files (from previous build output)
1. `frontend/src/actions/agenda.ts` - ~11 errors (TS2561: snake_case vs camelCase)
2. `frontend/src/actions/auth.ts` - ~2 errors (TS2352: type conversion)
3. `frontend/src/actions/catalogue.ts` - ~2 errors (TS2322: undefined assignability)
4. `frontend/src/actions/documents.ts` - ~3 errors (TS2345: argument type mismatch)
5. `frontend/src/actions/logistics.ts` - ~13 errors (mixed: TS2561, TS2305, TS2322, TS2739)

## Error Categories
- **TS2561**: Object literal property name mismatch (snake_case should be camelCase)
- **TS2352**: Unsafe type conversion
- **TS2322**: Type not assignable (usually `undefined` issue)
- **TS2345**: Argument type mismatch (optional vs required properties)
- **TS2305**: Missing exports from module
- **TS2739**: Missing required properties

## Research Status
- [DONE] Full tsc output from explore agent
- [DONE] File-by-file analysis from explore agent

## Full Scope (from research)
**Total: ~180 errors across 28 files**

### Error Categories with Counts
| Category | Count | Description |
|----------|-------|-------------|
| TS2561 | 28 | snake_case → camelCase in action files |
| TS2339/TS2551 | 35+ | Missing properties/methods on proto types |
| TS2345 | 15+ | Optional params → required proto fields |
| TS2322 | 12 | Type assignability (undefined) |
| TS2353 | 7 | Unknown properties in object literals |
| TS2352 | 6 | Unsafe type conversions |
| TS2305/TS2724 | 5 | Missing module exports |
| TS2367/TS7053 | 6 | Enum/index mismatches |
| TS2739 | 2 | Missing required properties |

### All 28 Files with Error Counts
**Action files (11 files, ~60 errors):**
1. agenda.ts (12) - snake_case → camelCase
2. payments.ts (15) - missing methods + snake_case
3. logistics.ts (15) - missing exports + snake_case
4. mailbox.ts (4) - snake_case
5. documents.ts (3) - optional→required
6. marque-blanche.ts (3) - optional→required
7. auth.ts (2) - type cast safety
8. catalogue.ts (2) - undefined arrays
9. societes.ts (2) - missing required props
10. subscriptions.ts (1) - missing export
11. woocommerce.ts (1) - missing export

**Page/component files (15 files, ~120 errors):**
12. woocommerce-page-client.tsx (24) - missing props/exports
13. marque-blanche-page-client.tsx (20-28) - missing props
14. client-abonnement-depanssur.tsx (13) - type mismatches
15. portal/wincash/page.tsx (9) - missing props
16. taches/configuration/page.tsx (7-8) - enum mismatches
17. portal/services/page.tsx (6-7) - unknown props
18. portal/dashboard/page.tsx (7) - unknown props
19. portal/justi-plus/page.tsx (4) - missing props
20. depanssur/dossiers/dossiers-page-client.tsx (4) - type mismatches
21. depanssur/create-abonnement-dialog.tsx (5) - TS2322
22. depanssur/reporting/reporting-client.tsx (2) - unknown prop pageSize
23. agenda-page-client.tsx (2) - snake_case access
24. facturation/facturation-page-client.tsx (1) - missing props
25. woocommerce/page.tsx (1) - missing prop
26. header/header-breadcrumb.tsx (1) - missing module

**Lib files (2 files, ~6 errors):**
27. lib/auth/auth.server.ts (4) - TS2352 type cast
28. lib/grpc/clients/config.ts (2) - TS2345

## Proto Setup (RESOLVED)
- Proto files are GENERATED from `.proto` source files in `/packages/proto/src/`
- Generation: Buf → protoc-gen-ts_proto → `gen/ts-frontend/` → copied to `frontend/src/proto/`
- All property names in generated TS use **camelCase** (not snake_case)

## Root Causes Identified
1. **Frontend code written against wrong API**: Frontend devs used snake_case but proto generates camelCase
2. **Frontend code expects non-existent properties**: WooCommerce, MarqueBlanche, portal pages written against imagined proto schemas
3. **Wrong import paths**: FulfillmentBatch types exist in `@proto/fulfillment/fulfillment`, not `@proto/logistics/logistics`
4. **Missing methods**: `deletePaymentEvent` and `triggerPaymentProcessing` don't exist in payments proto
5. **Generic vs specific types**: Protos use `DeleteResponse` not `SubscriptionDeleteResponse`/`WooCommerceDeleteResponse`

## Fix Strategy (confirmed by user: fix everything)
- Fix ALL 180 errors across all 28 files
- Approach: Update FRONTEND code to match ACTUAL proto types (don't change protos)
- For missing methods: Remove dead code or use closest available method
- For property mismatches: Map to actual proto property names
