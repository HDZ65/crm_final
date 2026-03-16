# Learnings — crm-remediation-complete

## [2026-03-06] Session Init

### Architecture globale
- NestJS microservices (8 services): service-core, service-commercial, service-engagement, service-finance, service-logistics, service-gateway, service-telecom, service-scoring
- Event bus: NATS JetStream
- ORM: TypeORM
- Proto: `packages/proto/src/{domain}/{domain}.proto`
- Frontend: Next.js avec server actions + gRPC clients

### Patterns clés identifiés (audit)
- Mock pattern Transatel: `transatel-activation-mock.service.ts` → retourne `{activationId: 'transatel-{contratId}'}`
- NATS event naming: `crm.{service}.{domain}.{action}` (ex: `crm.commercial.reducbox.access.created`)
- Port pattern: interface dans `domain/ports/`, mock dans `infrastructure/external/`
- Lifecycle service pattern: `subscription-lifecycle.service.ts` (452 lignes) dans service-commercial
- Scheduler CRON pattern: `depanssur-scheduler.service.ts` + `provisioning-j14-scheduler.service.ts`

### Guardrails absolus
- ❌ Pas de vraies API calls (tout mock)
- ❌ Ne pas toucher Mondial TV
- ❌ Pas de TODO commentés dans le code livré
- ❌ Pas de `as any`, `@ts-ignore`, `console.log` prod
- ❌ Pas de nouveaux microservices (tout dans services existants)

### Convention migrations
- Pattern fichier: `{timestamp}-{Description}.ts`
- Voir: `services/service-telecom/src/migrations/1773000001000-CreateProvisioningLifecycle.ts`

## [2026-03-06] Task 1 — RG3 NATS Publish Activation

### Accomplishments
- ✅ Décommentées les lignes 54 et 60 du handler `depanssur-payment-succeeded.handler.ts`
- ✅ Créé handler stub `abonnement-restored.handler.ts` dans service-core
- ✅ Enregistré handler dans DepanssurModule
- ✅ Builds réussis (service-finance et service-core)

### Key Learnings
- **NATS publish signature**: `publishProto()` nécessite 3 arguments (subject, data, messageType)
  - Les types d'events (AbonnementRestoredEvent, RestartRecurringCommissionsEvent) ne sont PAS des proto messages
  - Solution: utiliser `publish()` au lieu de `publishProto()`
- **Handler pattern**: @Injectable() + OnModuleInit + subscribe() + handle()
- **Module registration**: Ajouter handler aux providers pour l'instanciation automatique

### Event Flow (RG3)
1. service-finance: payment.depanssur.succeeded → handlePaymentSucceeded()
2. Publie: abonnement.depanssur.restored (→ service-core)
3. Publie: commission.restart_recurring (→ service-commercial)
4. service-core: AbonnementRestoredHandler écoute et log (stub pour Task 20)

### Conventions Respectées
- ✅ Pas de console.log (utiliser NestJS Logger)
- ✅ Pas de TODO commentés dans le code livré
- ✅ Pas de @ts-ignore ou as any
- ✅ Imports correctement typés
- ✅ Erreur handling avec try/catch et logging

### Prochaines Étapes (Task 20)
- Implémenter la logique complète de restauration dans AbonnementRestoredHandler
- Mettre à jour le statut de l'abonnement à ACTIF
- Restaurer les features de souscription
- Notifier le client

## [2026-03-06] Task 3 — Proto: Étendre telecom.proto avec SuspendLine et TerminateLine RPCs

### Accomplishments
- ✅ Extended telecom.proto with ProvisioningState enum (SUSPENDU=6, RESILIE=7)
- ✅ Added SuspendLineRequest message (contrat_id, client_id, reason, correlation_id)
- ✅ Added SuspendLineResponse message (success, suspension_id)
- ✅ Added TerminateLineRequest message (contrat_id, client_id, reason, effective_date, correlation_id)
- ✅ Added TerminateLineResponse message (success, termination_id)
- ✅ Added rpc SuspendLine and rpc TerminateLine to TelecomProvisioningService
- ✅ Regenerated TypeScript types with npm run generate
- ✅ Verified service-telecom builds successfully
- ✅ Evidence saved to .sisyphus/evidence/task-3-proto-compile.txt

### Key Learnings
- **Proto structure**: Messages and RPCs follow the pattern from subscriptions.proto and contrats.proto
- **Enum numbering**: SUSPENDU=6, RESILIE=7 (next available after ERREUR=5)
- **Message fields**: All request messages include correlation_id for tracing
- **Response pattern**: Simple success boolean + ID field (suspension_id, termination_id)
- **Build verification**: service-telecom builds without errors after proto changes
- **Generation process**: `npm run generate` in packages/proto directory regenerates all TypeScript types

### Proto Generation
- Command: `npm run generate` in packages/proto
- Generated file: packages/proto/gen/ts/telecom/telecom.ts
- All new types properly exported and available for services
- Verified with PowerShell: SuspendLine, TerminateLine, SUSPENDU, RESILIE all present

### Conventions Respectées
- ✅ Proto3 syntax
- ✅ Proper message naming (Request/Response suffix)
- ✅ Enum values with UNSPECIFIED = 0
- ✅ String fields for IDs and dates
- ✅ Boolean for success flags
- ✅ No modifications to existing RPCs
- ✅ No TODO comments

### Blockers Resolved
- None — task completed successfully

### Next Steps (Wave 2 Telecom Tasks)
- Task 8: Implement SuspendLine handler in service-telecom
- Task 9: Implement TerminateLine handler in service-telecom
- Task 10-13: Frontend integration and state management
## [2026-03-06] Task 4 — Create reducbox.proto for ReducBox bounded context

### Accomplishments
- ✅ Created `packages/proto/src/reducbox/reducbox.proto` with complete service definition
- ✅ Defined ReducBoxService with 5 RPCs:
  - CreateAccess(CreateAccessRequest) → CreateAccessResponse
  - SuspendAccess(SuspendAccessRequest) → SuspendAccessResponse
  - RestoreAccess(RestoreAccessRequest) → RestoreAccessResponse
  - GetAccessStatus(GetAccessStatusRequest) → GetAccessStatusResponse
  - ListAccessByClient(ListAccessByClientRequest) → ListAccessByClientResponse
- ✅ Defined ReducBoxAccessStatus enum with 5 values (UNSPECIFIED, PENDING, ACTIVE, SUSPENDED, CANCELLED)
- ✅ Defined ReducBoxAccess message with all required fields (id, client_id, contrat_id, status, timestamps)
- ✅ Defined 3 event messages (ReducBoxAccessCreatedEvent, ReducBoxAccessSuspendedEvent, ReducBoxAccessRestoredEvent)
- ✅ Passed buf lint validation (no linting errors)
- ✅ Generated TypeScript types via `npm run gen`
- ✅ All interfaces properly exported in packages/proto/gen/ts/reducbox/reducbox.ts

### Key Learnings
- **Proto enum naming convention**: Enum values must be prefixed with ENUM_NAME_ (e.g., REDUC_BOX_ACCESS_STATUS_PENDING)
- **RPC response naming**: Response types should be named {RpcName}Response (e.g., GetAccessStatusResponse, not just ReducBoxAccess)
- **Proto structure pattern**: Follow subscriptions.proto pattern with service definition, messages, enums, and common messages
- **Generation process**: `npm run gen` in packages/proto directory regenerates all TypeScript types from proto files
- **Windows compatibility**: Use `npm run gen` directly; rm command not available on Windows

### Conventions Respectées
- ✅ No business logic (proto definitions only)
- ✅ No modifications to existing proto files
- ✅ No TODO comments
- ✅ Proper field numbering and typing
- ✅ Enum values properly prefixed
- ✅ Response types properly named

### Blockers Resolved
- Initial linting errors on enum naming → Fixed by prefixing with REDUC_BOX_ACCESS_STATUS_
- GetAccessStatus RPC response type → Fixed by creating GetAccessStatusResponse message

### Next Steps (Wave 2 ReducBox Tasks)
- Task 14: Implement ReducBoxService in service-commercial
- Task 15: Create ReducBox aggregate and entities
- Task 16: Implement ReducBox command handlers

## [2026-03-06] Task 5 — Create energie.proto for Énergie bounded context

### Accomplishments
- ✅ Created `packages/proto/src/energie/energie.proto` with complete service definition
- ✅ Defined EnergieService with 5 RPCs:
  - CreateRaccordement(CreateRaccordementRequest) → CreateRaccordementResponse
  - UpdateRaccordementStatus(UpdateRaccordementStatusRequest) → UpdateRaccordementStatusResponse
  - GetRaccordement(GetRaccordementRequest) → GetRaccordementResponse
  - ListRaccordementsByClient(ListRaccordementsByClientRequest) → ListRaccordementsByClientResponse
  - GetActivationStatus(GetActivationStatusRequest) → GetActivationStatusResponse
- ✅ Defined RaccordementStatus enum with 8 values (UNSPECIFIED, DEMANDE_ENVOYEE, EN_COURS, RACCORDE, ACTIVE, SUSPENDU, RESILIE, ERREUR)
- ✅ Defined PartenaireEnergie enum with 3 values (UNSPECIFIED, PLENITUDE, OHM)
- ✅ Defined Raccordement message with 12 fields (id, client_id, contrat_id, partenaire, statut_raccordement, statut_activation, adresse, pdl_pce, date_demande, date_activation, created_at, updated_at)
- ✅ Defined 3 event messages (RaccordementCreatedEvent, RaccordementStatusChangedEvent, EnergieActivatedEvent)
- ✅ Passed buf lint validation (no linting errors)
- ✅ Evidence saved to `.sisyphus/evidence/task-5-energie-proto.txt`

### Key Learnings
- **Proto enum naming convention**: Enum values must be prefixed with ENUM_NAME_ (e.g., RACCORDEMENT_STATUS_DEMANDE_ENVOYEE)
- **Optional fields in proto3**: Use `optional` keyword for nullable fields (e.g., `optional string date_activation = 10`)
- **RPC response naming**: Response types should be named {RpcName}Response (e.g., CreateRaccordementResponse)
- **Proto structure pattern**: Follow reducbox.proto pattern with service definition, messages, enums, and common messages
- **Generation process**: `npm run gen` in packages/proto directory regenerates all TypeScript types from proto files
- **Windows memory issue**: buf generate may fail with memory allocation errors on Windows; proto file validation via lint still works

### Conventions Respectées
- ✅ No business logic (proto definitions only)
- ✅ No modifications to existing proto files
- ✅ No TODO comments
- ✅ Proper field numbering and typing
- ✅ Enum values properly prefixed
- ✅ Response types properly named
- ✅ Follows reducbox.proto pattern exactly

### Blockers Resolved
- None — task completed successfully

### Next Steps (Wave 2 Énergie Tasks)
- Task 17: Implement EnergieService in service-commercial
- Task 18: Create Énergie aggregate and entities
- Task 19: Implement Énergie command handlers

## [2026-03-06] Task 6 — Extend logistics.proto with WelcomeKit and DeliveryNotification RPCs

### Accomplishments
- ✅ Extended `packages/proto/src/logistics/logistics.proto` with 3 new RPCs:
  - CreateWelcomeKit(CreateWelcomeKitRequest) → CreateWelcomeKitResponse
  - GenerateWelcomeLabel(GenerateWelcomeLabelRequest) → GenerateWelcomeLabelResponse
  - NotifyDeliveryStatus(NotifyDeliveryStatusRequest) → NotifyDeliveryStatusResponse
- ✅ Defined KitType enum with 4 values (KIT_TYPE_UNSPECIFIED, SIM_ONLY, KIT_COMPLET, KIT_BIENVENUE)
- ✅ Defined WelcomeKit message with fields: id, type, contenu (repeated), statut, label_url
- ✅ Defined DeliveryNotification message with fields: expedition_id, channel, sent_at, status
- ✅ Defined all request/response messages with proper field numbering
- ✅ Regenerated TypeScript types via `npm run gen`
- ✅ All interfaces properly exported in packages/proto/gen/ts/logistics/logistics.ts
- ✅ Saved evidence to .sisyphus/evidence/task-6-logistics-proto.txt

### Key Learnings
- **Proto extension pattern**: Add new RPCs to existing service, then define messages and enums at end of file
- **Enum naming convention**: Enum values must be prefixed with ENUM_NAME_ (e.g., KIT_TYPE_UNSPECIFIED, SIM_ONLY)
- **Message field ordering**: Request messages typically have 1-4 fields, response messages have 1-2 fields
- **Repeated fields**: Use `repeated string contenu = 3;` for array-like fields
- **Generation process**: `npm run gen` in packages/proto directory regenerates all TypeScript types
- **Windows compatibility**: Use `npm run gen` directly; rm command not available on Windows

### Conventions Respectées
- ✅ No modifications to existing RPCs (Expedition, Colis, Tracking, CarrierAccount, Maileva, ReturnLabel)
- ✅ No deletion of existing fields or messages
- ✅ No TODO comments
- ✅ Proper field numbering and typing
- ✅ Enum values properly prefixed
- ✅ Response types properly named

### Blockers Resolved
- None — task completed smoothly

### Next Steps (Wave 2 Logistics Tasks)
- Task 24: Implement WelcomeKit service in service-logistics
- Task 25: Implement DeliveryNotification handlers
  
## [2026-03-06] Task 7 — RG1: Create CQ (Contrôle Qualité) status display module  
  
### Accomplishments  
- ✅ Created statut-cq.entity.ts (referential entity)  
- ✅ Created migration 1774200001000-CreateStatutCQ.ts  
- ✅ Created controle-qualite.service.ts repository  
- ✅ Created qualite.controller.ts gRPC controller  
- ✅ Created qualite.module.ts  
- ✅ Registered QualiteModule in app.module.ts  
- ✅ Build passes with no errors  

## [2026-03-06] Task 11 — Stelogy Carrier Port + Mock Service

### Accomplishments
- ✅ Created `ProvisioningStelogyPort` interface in `domain/provisioning/ports/`
- ✅ Created `StelogyActivationMockService` in `infrastructure/external/telecom/stelogy/`
- ✅ Added `PROVISIONING_STELOGY_PORT` injection token in saga service
- ✅ Registered provider in `provisioning.module.ts`
- ✅ Updated barrel export in `ports/index.ts`
- ✅ Build passes, 0 LSP diagnostics

### Key Learnings
- **Parallel Task 10 (Networth) already done**: ports/ directory + index.ts barrel already existed
- **Port pattern**: Interface in `domain/provisioning/ports/{carrier}.port.ts`, mock in `infrastructure/external/telecom/{carrier}/`
- **Injection token pattern**: `export const PROVISIONING_{CARRIER}_PORT = 'PROVISIONING_{CARRIER}_PORT'` in saga service file
- **Mock return pattern**: `{ activationId: '{carrier}-{contratId}' }` — deterministic for testing
- **Multi-carrier methods**: Stelogy/Networth ports add suspendLine + terminateLine beyond Transatel's activateLine-only

### Conventions Respectées
- ✅ NestJS Logger (no console.log)
- ✅ No TODO comments
- ✅ No `as any` or `@ts-ignore`
- ✅ Matches Networth port pattern exactly (Task 10 parallel)
- ✅ JSDoc on port interface and mock service
  
## [2026-03-06] Task 8 — Suspension Port + Mock + Saga Integration  
  
### Patterns confirmed  
- Port interfaces live in saga service file (alongside DI tokens), not separate ports/ dir  
- ports/ directory exists but only re-exports from saga service (added suspension port to it)  
- Mock services follow `transatel-activation-mock.service.ts` pattern: TELECOM_TRANSATEL_FORCE_*_FAILURE env var  
- NATS handler pattern: @Injectable + OnModuleInit + subscribe() with snake_case/camelCase dual field support  
- gRPC controller: SuspendLine uses contrat_id directly (not findById then contratId) since proto uses contrat_id  
- Constructor order matters: all tests use positional args, adding suspensionPort requires updating ALL test constructors  
  
### Issues found  
- cancelProvisioning had missing closing brace for if block (pre-existing from Task 7 termination changes) - fixed  
- 3 activation reelle tests fail pre-existingly (dateFinRetractation guard vs current date)  
- AST grep replace was essential for updating 9 constructor calls atomically  
- Proto gen/ts/ directory doesn't exist on disk (generated at build time by buf) 

## Task 14 — ReducBox Entities + Migration + Repository
- New bounded context follows same pattern as mondial-tv: domain/reducbox/entities, repositories, infra repos
- Each bounded context gets its own NestJS module (reducbox.module.ts) registered in app.module.ts
- Migration timestamp 1774400000000 > latest 1774300000000
- Entity enum pattern: create PostgreSQL enum type in migration, reference via TypeORM enum+enumName
- History entity uses ManyToOne string-based relation ('ReducBoxAccessEntity', 'history') matching OneToMany pattern
- Repository service injects both access+history repos for addHistory method
- autoLoadEntities:true means TypeOrmModule.forFeature() is sufficient for entity registration

## Task 17 — Énergie Entities + Migration + Repository
- Énergie bounded context follows ReducBox pattern: domain/energie/entities, infra repos, energie.module.ts
- Migration timestamp 1774500000000 (ReducBox used 1774400000000) - must coordinate for parallel tasks
- Entity enum pattern: TypeORM enum decorator with enum type auto-creates PostgreSQL enum; migration creates explicitly for safety
- Status history entity uses ManyToOne string-based relation matching OneToMany pattern from parent
- Repository pattern: @InjectRepository for both entities, CRUD + addHistory methods
- Module registration: TypeOrmModule.forFeature + provider + export, then import in app.module.ts
- Windows dist/ lock: rmdir /s /q dist before rebuild when EPERM errors occur

## Task 13 — SUSPENDU + RESILIE states
- provisioning_state column is varchar(60) not a Postgres enum → no migration needed for new values
- 3 generated TS files need updating: frontend/src/proto, packages/proto/gen/ts, packages/proto/gen/ts-frontend
- Backend gen uses snake_case (en_attente), frontend gen uses camelCase (enAttente)
- GetProvisioningStats countByState() returns Record<string,number> from GROUP BY — new states auto-counted
- Saga already had processSuspension/processTermination with correct state transitions

## [2026-03-16] Task 12 — CarrierSelectorService

### Multi-carrier strategy pattern
- Transatel mocks use object-param interfaces (ProvisioningTransatelPort, ProvisioningSuspensionPort)
- Networth/Stelogy mocks use flat-param interfaces matching TelecomCarrierPort directly
- CarrierSelectorService bridges the gap with an inline adapter for Transatel (object->flat param mapping)
- Carrier resolution: explicit param > TELECOM_DEFAULT_CARRIER env > 'transatel' default
- All injection tokens defined in provisioning-saga.service.ts, re-exported via services/index.ts

## [2026-03-16] Task 15 — ReducBox Lifecycle Service + Mock API Client

### Accomplishments
- Created ReducBoxPort interface in domain/reducbox/ports/reducbox.port.ts
- Created ReducBoxMockClient in infrastructure/external/reducbox/reducbox-mock.client.ts
- Created ReducBoxLifecycleService in domain/reducbox/services/reducbox-lifecycle.service.ts
- Registered mock client (via REDUCBOX_PORT token) and lifecycle service in reducbox.module.ts

### Key Patterns
- Port interface pattern: domain port with DI token constant (REDUCBOX_PORT = 'REDUCBOX_PORT')
- Mock client pattern: follows MockImsClient — recordCall helper, Logger, counter-based IDs (reducbox-{clientId}-{counter})
- Lifecycle service pattern: follows SubscriptionLifecycleService — @Optional NatsService, isConnected() guard before publish
- NATS event subjects: crm.commercial.reducbox.access.{created|suspended|restored}
- History tracking: every state transition creates a ReducBoxAccessHistoryEntity entry
- Module wiring: provide/useClass for port injection, direct class for lifecycle service

## [2026-03-16] Task 18 — Énergie Lifecycle Service + Plénitude/OHM Mock Clients

### Accomplishments
- Created EnergiePartenairePort interface in domain/energie/ports/energie-partenaire.port.ts
- Created PlenitudeMockClient in infrastructure/external/energie/plenitude-mock.client.ts
- Created OhmMockClient in infrastructure/external/energie/ohm-mock.client.ts
- Created EnergieLifecycleService in domain/energie/services/energie-lifecycle.service.ts
- Updated energie.module.ts with port bindings and lifecycle service

### Key Patterns
- Multi-port pattern: two injection tokens (PLENITUDE_PORT, OHM_PORT) for two external providers
- Port selection: selectPort(partenaire) switch based on PartenaireEnergie enum
- Mock ID pattern: plenitude-{clientId} / ohm-{clientId} (deterministic, no counter needed)
- Lifecycle methods: createRaccordement, updateStatus, activateSupply — each publishes NATS event
- NATS subjects: crm.commercial.energie.{raccordement.created|status.changed|activated}
- Metadata for external ID storage: entity.metadata = { externalId } (jsonb column)
- Module wiring: two provide/useClass entries for two ports + lifecycle service class

## [2026-03-16] Task 16: ReducBox gRPC Controller + NATS Handlers

### Patterns
- NATS subject convention: crm.contrat.{status} (e.g., crm.contrat.suspended, crm.contrat.activated)
- NATS handlers: @Injectable() + OnModuleInit + natsService.subscribe(subject, handler.bind(this))
- gRPC controllers: @Controller() + @GrpcMethod('ServiceName', 'MethodName')
- Entity-to-proto mapping: manual inline mapping (camelCase to snake_case, Date to ISO string, enum to number)
- Error handling: catch + check message.includes('not found') to throw RpcException with NOT_FOUND
- Contract event payload: contrat_id or contratId (handle both for resilience)
- NATS handlers registered as providers (not controllers) in module

## [2026-03-16] Task 19 — Énergie gRPC Controller + NATS Handlers

### Pattern: gRPC Controller for Énergie
- Same pattern as ReducBox: `@GrpcMethod('EnergieService', 'RpcName')` decorator
- Proto enums mapped bidirectionally with `mapXxxToProto`/`mapXxxFromProto` helpers
- Invalid proto enum values throw `RpcException` with `INVALID_ARGUMENT`
- Entity-to-proto mapping via private `toProto()` method handles null→empty string coercion

### Pattern: NATS Event Handler for Énergie
- `OnModuleInit` pattern — subscribe in `onModuleInit()`, bind handlers
- `crm.contrat.signed` → filter by `contrat_type` containing "energie" before processing
- `crm.contrat.suspended` → lookup by contratId, skip if already SUSPENDU
- Always handle both `snake_case` and `camelCase` event field names for resilience

### Key Implementation Notes
- `energie.module.ts` lives at `src/energie.module.ts` (not in domain folder)
- EnergieController registered in `controllers: []` array, handler in `providers: []`
- Proto `PartenaireEnergie` enum: PLENITUDE=1, OHM=2 (0=UNSPECIFIED)
- Proto `RaccordementStatus` enum: 1-7 mapping matches domain `StatutRaccordement`

## [2026-03-16] Task 20 — RG3 Auto-Reactivation Downstream Handlers

### Pattern: Cross-service event handlers for same NATS subject
- Multiple services can subscribe to the same NATS subject (`abonnement.depanssur.restored`)
- Each service handles its own responsibility: core (status update), telecom (line reactivation), engagement (notification)
- Class naming must be unique across the project barrel exports: used `AbonnementRestoredEngagementHandler` in engagement to avoid collision with telecom's `AbonnementRestoredHandler`

### Pattern: AbonnementService.update() auto-tracks history
- The `update()` method in service-core's AbonnementService automatically:
  1. Detects status changes and writes to `HistoriqueStatutAbonnementEntity`
  2. Publishes `depanssur.abonnement.status_changed` event via NATS
- No need to manually write history or publish events when using `update()`

### Pattern: CarrierSelectorService usage
- `selectCarrier()` with no args defaults to env var or 'transatel'
- Returns `TelecomCarrierPort` with `activateLine(contratId, clientId, msisdn, iccid, correlationId)`
- For reactivation (no SIM provisioning), pass empty strings for msisdn/iccid

### Pattern: Engagement notification creation
- `NotificationService.create()` takes `{ organisationId, utilisateurId, type, titre, message, metadata }`
- `NotificationType.INFO` used for non-critical informational notifications
- metadata should include `eventType` key for traceability (matching DepanssurEventsHandler pattern)
