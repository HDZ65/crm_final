# Learnings - Consolidate Microservices

## Session Started
- Date: 2026-02-05T10:35:57.246Z
- Session: ses_3d2cc717effewVPlbNqWZJQ31t
- Goal: Reduce 12 microservices to 6 for RAM optimization

## Architecture Decisions
- service-core = identity + clients + documents (port 50052, identity_db)
- service-commercial = commercial + contrats + products (port 50053, commercial_db)
- service-finance = factures + payments + calendar (port 50059, postgres-main)
- service-engagement = engagement + activites (port 50061, engagement_db)
- service-logistics = stays separate (port 50060, postgres-main)

## Phase 1: Base Structure Creation (2026-02-05)

### Completed Tasks
1. ✅ Created service-core directory with full NestJS structure
   - package.json with @crm/service-core name
   - tsconfig.json (identical to service-identity)
   - src/app.module.ts with TypeORM config (database: core_db)
   - src/main.ts with gRPC bootstrap (port 50052)
   - Dockerfile with multi-stage build
   - .env.development with port 50052

2. ✅ Verified service-commercial structure exists
   - Already has package.json, tsconfig.json, src/app.module.ts, src/main.ts
   - Port: 50053 (confirmed in .env.development)
   - No action needed

3. ✅ Created service-finance directory with full NestJS structure
   - package.json with @crm/service-finance name
   - tsconfig.json (identical to service-identity)
   - src/app.module.ts with TypeORM config (database: finance_db)
   - src/main.ts with gRPC bootstrap (port 50059)
   - Dockerfile with multi-stage build
   - .env.development with port 50059

4. ✅ Ran bun install in both new services
   - service-core: 698 packages installed successfully
   - service-finance: 698 packages installed successfully
   - Warnings about local packages (@crm/grpc-utils, @crm/proto, @crm/shared) are expected for file: references

### Key Patterns Identified
- All services use identical tsconfig.json (ES2022, strict null checks)
- All services use identical package.json structure with NestJS 11.1.12
- All services use TypeOrmModule.forRootAsync with ConfigService
- All services use SnakeNamingStrategy for database naming
- All services use AuthInterceptor from @crm/grpc-utils
- Dockerfile pattern: deps → development → builder → production (4 stages)
- Each service has dedicated database (core_db, finance_db, etc.)
- Port mapping: core=50052, commercial=50053, finance=50059, engagement=50061

### Database Configuration
- service-core: core_db on crm-core-db
- service-commercial: commercial_db on crm-commercial-db (existing)
- service-finance: finance_db on crm-finance-db
- service-engagement: engagement_db on crm-engagement-db (existing)

### Next Phase
- Phase 2: Merge module code from old services into new consolidated services
- Phase 3: Update gRPC proto definitions for consolidated services
- Phase 4: Update docker-compose.yml with new service configurations
- Phase 5: Test inter-service communication via gRPC

## Phase 2: Module Consolidation - service-activites ? service-engagement (2026-02-05)

### Completed Tasks
1. ? Copied all 4 modules from service-activites to service-engagement:
   - activite (activite.module.ts, activite.service.ts, activite.controller.ts, entities/activite.entity.ts)
   - tache (tache.module.ts, tache.service.ts, tache.controller.ts, entities/tache.entity.ts)
   - type-activite (type-activite.module.ts, type-activite.service.ts, type-activite.controller.ts, entities/type-activite.entity.ts)
   - evenement-suivi (evenement-suivi.module.ts, evenement-suivi.service.ts, evenement-suivi.controller.ts, entities/evenement-suivi.entity.ts)

2. ? Updated service-engagement/src/app.module.ts:
   - Added imports for all 4 modules (ActiviteModule, TacheModule, TypeActiviteModule, EvenementSuiviModule)
   - Added entity imports (Activite, Tache, TypeActivite, EvenementSuivi)
   - Registered entities in TypeOrmModule engagement_db configuration
   - Modules added to @Module imports array

3. ? Updated service-engagement/package.json:
   - Added activites proto to proto:generate script
   - Fixed proto:clean script for Windows compatibility (uses rimraf)

### Key Patterns for Module Consolidation
- Copy entire module directories with PowerShell (xcopy/robocopy have issues on Windows bash)
- Preserve module structure exactly (same relative imports work because directory layout matches)
- Add entities to EXISTING TypeOrmModule config (engagement_db), don't create new connection
- Module imports go at end of imports array with comment for clarity
- Entity imports need to be added alongside module imports

### Windows Build Issues
- bun install fails with EPERM for local file: packages (@crm/*)
- Workaround: Manual copy of packages to node_modules/@crm/
- proto:clean fails with rm -rf on empty directory, use rimraf instead
- cp -r doesn't work in Windows bash, use PowerShell Copy-Item

### Pre-existing Build Issues (Not Caused by Merge)
- Property naming mismatch: snake_case in proto vs camelCase in code
- Examples: organisation_id vs organisationId, date_debut vs dateDebut
- These are systemic issues across the entire service-engagement codebase
- Same patterns exist in original service-activites code

## Phase 2: Module Consolidation - service-finance (2026-02-05)

### Overview
Consolidated three services into service-finance:
- service-factures (8 modules, 40 files)
- service-payments (16 modules, 100+ files)
- service-calendar (5 modules, 29 files)

### Completed Tasks
1. Copied all modules from service-factures:
   - facture, ligne-facture, statut-facture, emission-facture
   - facture-settings, generation, pdf-generation, compliance, invoices

2. Copied all modules from service-payments:
   - PSP integrations: stripe, paypal, gocardless, slimpay, multisafepay, emerchantpay
   - Core: schedules, portal, calendar (client), retry, psp-accounts, payment-emission, events
   - Relance: regle-relance, historique-relance, engine, events

3. Copied all modules from service-calendar:
   - engine, configuration, holidays, csv-import, audit

4. Resolved naming conflicts:
   - Renamed audit module to calendar-audit (from calendar)
   - Created payment-audit (from payments)
   - Renamed service classes: CalendarAuditService, CalendarAuditController, PaymentAuditService

5. Updated app.module.ts:
   - Imports all 28 modules organized by source service
   - Uses autoLoadEntities: true for TypeORM
   - Includes NatsModule for event handling
   - Connection pool increased to 20 (from 10)

6. Updated main.ts for hybrid gRPC:
   - HTTP server on port 3059 (for Portal webhooks)
   - gRPC Factures on port 50059
   - gRPC Payments on port 50063
   - gRPC Calendar on port 50068

7. Updated package.json:
   - Added all dependencies from 3 services (stripe, gocardless, paypal, pdfkit, etc.)
   - Added @crm/nats-utils
   - Proto generation includes: common, factures, payments, calendar, events
   - Fixed proto:clean for Windows (rimraf pattern)

8. Created validation.pipe for retry modules

### Build Status
Build has 483 errors, primarily:
- snake_case vs camelCase property access in proto types (systemic issue)
- Stripe API version updated to 2026-01-28.clover
- Module imports all resolved

### Key Learnings
1. **Audit Module Conflicts**: When merging services with same module names:
   - Rename module classes (AuditModule -> CalendarAuditModule)
   - Rename service classes (AuditService -> CalendarAuditService)
   - Update all imports in dependent modules

2. **Hybrid gRPC Application**: NestJS supports multiple gRPC services:
   - Use app.connectMicroservice() for each proto
   - Each gRPC service needs its own port
   - HTTP server for webhooks via NestFactory.create()

3. **Local Package Issues on Windows**:
   - bun install EPERM with file: packages
   - Manual copy: Copy-Item -Path packages/X -Destination node_modules/@crm/X -Recurse
   - Don't use nested Copy-Item (creates X/X structure)

4. **Proto Property Access**:
   - Proto generated types use snake_case (event_id, client_id, etc.)
   - Original code uses camelCase (eventId, clientId)
   - This is a systemic issue requiring codebase-wide refactoring

### Files Structure Created
```
services/service-finance/
├── src/
│   ├── app.module.ts       (comprehensive with all 28 modules)
│   ├── main.ts             (hybrid HTTP + 3 gRPC services)
│   ├── common/             (from factures)
│   │   ├── exceptions/
│   │   ├── interceptors/
│   │   └── interfaces/
│   └── modules/
│       ├── facture/
│       ├── ligne-facture/
│       ├── statut-facture/
│       ├── emission-facture/
│       ├── facture-settings/
│       ├── generation/
│       ├── pdf-generation/
│       ├── compliance/
│       ├── invoices/
│       ├── stripe/
│       ├── paypal/
│       ├── gocardless/
│       ├── slimpay/
│       ├── multisafepay/
│       ├── emerchantpay/
│       ├── schedules/
│       ├── portal/
│       ├── calendar/        (gRPC client)
│       ├── retry/
│       ├── psp-accounts/
│       ├── payment-emission/
│       ├── events/
│       ├── payment-audit/
│       ├── relance/
│       ├── engine/
│       ├── configuration/
│       ├── holidays/
│       ├── csv-import/
│       └── calendar-audit/
└── package.json            (consolidated dependencies)
```

### Follow-up Work Required
1. Fix snake_case property access across all modules (~483 errors)
2. Update inter-service gRPC clients (CalendarClientService, RetryClientService) to use direct imports
3. Test database migrations for consolidated schema
4. Update docker-compose.yml with new service configuration
5. Test NATS event handlers work correctly
