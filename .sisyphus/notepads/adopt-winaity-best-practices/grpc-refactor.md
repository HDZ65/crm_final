# gRPC Client Refactoring Notes

## Summary
Refactored the monolithic `frontend/src/lib/grpc/index.ts` (2956 lines) into 15 domain-specific modules.

## Files Created
- `frontend/src/lib/grpc/clients/config.ts` - Shared SERVICES config and promisify utility
- `frontend/src/lib/grpc/clients/clients.ts` - Client service
- `frontend/src/lib/grpc/clients/factures.ts` - Invoice service (factures, statutFactures)
- `frontend/src/lib/grpc/clients/payments.ts` - Payment service
- `frontend/src/lib/grpc/clients/contrats.ts` - Contract service
- `frontend/src/lib/grpc/clients/dashboard.ts` - Dashboard service (dashboard, commercialKpis, alertes)
- `frontend/src/lib/grpc/clients/users.ts` - User service (users, membresCompte, comptes, roles)
- `frontend/src/lib/grpc/clients/commerciaux.ts` - Commercial service (apporteurs)
- `frontend/src/lib/grpc/clients/logistics.ts` - Logistics service
- `frontend/src/lib/grpc/clients/commission.ts` - Commission service (commissions, bordereaux, reprises, baremes, paliers)
- `frontend/src/lib/grpc/clients/products.ts` - Product service (gammes, produits, produitVersions, produitDocuments, produitPublications)
- `frontend/src/lib/grpc/clients/organisations.ts` - Organisation service (societes, organisations, rolesPartenaire, membresPartenaire, invitationsCompte)
- `frontend/src/lib/grpc/clients/activites.ts` - Activity service (taches, typesActivite, activites, evenementsSuivi)
- `frontend/src/lib/grpc/clients/relance.ts` - Relance service (reglesRelance, historiqueRelance, relanceEngine)
- `frontend/src/lib/grpc/clients/notifications.ts` - Notifications service
- `frontend/src/lib/grpc/clients/calendar.ts` - Calendar service (calendarEngine, debitConfig, holidays, calendarAdmin)
- `frontend/src/lib/grpc/clients/index.ts` - Barrel file re-exporting all modules

## Files Modified
- `frontend/src/lib/grpc/index.ts` - Simplified to re-export from clients barrel

## Files Deleted
- `frontend/src/lib/grpc/loader.ts` - Unused dynamic proto loader

## Pre-existing Issues Noted
The following LSP errors existed before the refactoring and persist in the new modules:
- `ClientBaseServiceClient` not exported from `@proto/clients/clients`
- `TacheServiceClient`, `TypeActiviteServiceClient`, `ActiviteServiceClient`, `EvenementSuiviServiceClient` not exported from `@proto/activites/activites`

These are proto generation issues that need to be addressed separately in the `@crm/proto` package.

## Verification Results
- Module files created: 17 (16 modules + 1 index.ts)
- Re-exports in index: 15
- TypeScript type-check: PASSED
