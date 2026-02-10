# Task 2: Delete Dead Code — Findings

## Summary
- **85 files deleted** (44 DTOs + 37 port interfaces + 4 CRUD-only repo interfaces)
- **27 barrel/index files deleted** (15 DTO barrels + 12 port barrels)
- **14 parent application index.ts files deleted** (only re-exported dtos/ports)
- **4 application-level index.ts files deleted** (engagement, commercial, finance, core)
- **4 repo barrel exports updated** (removed references to deleted CRUD-only repos)
- **68 domain-specific repo interfaces KEPT**

## Files Deleted

### DTOs (44 files)
All files matching `services/**/application/*/dtos/*.dto.ts` — zero external consumers.

### Port Interfaces (37 files)
All files matching `services/**/application/*/ports/I*.ts` — zero external consumers.

### CRUD-Only Repo Interfaces (4 files)
- `service-engagement/src/domain/engagement/repositories/IEvenementSuiviRepository.ts`
- `service-core/src/domain/organisations/repositories/IThemeMarqueRepository.ts`
- `service-core/src/domain/organisations/repositories/IOrganisationRepository.ts`
- `service-core/src/domain/users/repositories/ICompteRepository.ts`

## Broken Imports (for Tasks 3-7)

### service-logistics — 5 files import deleted port interfaces
These are the ONLY files in the entire codebase that imported the deleted port interfaces:

1. `infrastructure/persistence/typeorm/repositories/logistics/tracking.service.ts`
   - `import type { ITrackingService } from '../../../../../application/logistics/ports';`
   - `export class TrackingService implements ITrackingService`

2. `infrastructure/persistence/typeorm/repositories/logistics/expedition.service.ts`
   - `import type { IExpeditionService } from '../../../../../application/logistics/ports';`
   - `export class ExpeditionService implements IExpeditionService`

3. `infrastructure/persistence/typeorm/repositories/logistics/colis.service.ts`
   - `import type { IColisService } from '../../../../../application/logistics/ports';`
   - `export class ColisService implements IColisService`

4. `infrastructure/persistence/typeorm/repositories/logistics/carrier.service.ts`
   - `import type { ICarrierService } from '../../../../../application/logistics/ports';`
   - `export class CarrierService implements ICarrierService`

5. `infrastructure/external/maileva/maileva.service.ts`
   - `import type { IMailevaService, LogisticsAddress, LabelRequest, LabelResponse, TrackingResponse, AddressValidationResponse, PricingResponse } from '../../../application/logistics/ports';`
   - `export class MailevaService implements IMailevaService`

**Action needed in Tasks 3-7**: Remove these `import type` lines and `implements I*Service` clauses from the 5 logistics infrastructure services.

### No other services had imports of deleted files
- service-core: No imports of DTOs/ports from application layer
- service-commercial: No imports of DTOs/ports from application layer
- service-finance: No imports of DTOs/ports from application layer
- service-engagement: No imports of DTOs/ports from application layer

## Domain-Specific Repo Interfaces KEPT (68 files)

All 68 remaining repo interfaces have domain-specific methods beyond basic CRUD.
None are imported by any consumer code — they are technically dead code too,
but preserved per task instructions since they contain domain logic that may be
useful as documentation/reference.

### By Service:
- **service-logistics**: 4 (ITrackingEventRepository, IExpeditionRepository, IColisRepository, ICarrierAccountRepository)
- **service-engagement**: 5 (INotificationRepository, IMailboxRepository, IActiviteRepository, ITacheRepository, ITypeActiviteRepository)
- **service-finance**: 10 (IPlannedDebitRepository, IHolidayRepository, IConfigurationRepository, IPortalSessionRepository, IRetryPolicyRepository, IPaymentIntentRepository, IInvoiceRepository, IRegleRelanceRepository, ILigneFactureRepository, IStatutFactureRepository, IFactureRepository, IScheduleRepository)
- **service-commercial**: 24 (all products, contrats, commercial repos)
- **service-core**: 25 (all clients, organisations, users, documents repos minus the 4 deleted)

## Barrel Export Updates
Updated 3 repo barrel index.ts files to remove references to deleted CRUD-only repos:
- `service-engagement/src/domain/engagement/repositories/index.ts` — removed IEvenementSuiviRepository
- `service-core/src/domain/organisations/repositories/index.ts` — removed IOrganisationRepository, IThemeMarqueRepository
- `service-core/src/domain/users/repositories/index.ts` — removed ICompteRepository
