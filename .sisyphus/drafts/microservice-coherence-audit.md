# Draft: Microservice Coherence Audit

## Requirements (confirmed)
- **Scope**: Audit complet des 5 services
- **Rigueur DDD**: Strict (winaity-clean style)
- **Services**: service-core, service-commercial, service-finance, service-engagement, service-logistics

## Research Findings

### Current Structure Pattern: BY-FEATURE (NestJS standard)

```
src/
├── modules/
│   ├── {feature}/
│   │   ├── {feature}.module.ts
│   │   ├── {feature}.service.ts
│   │   ├── {feature}.controller.ts
│   │   └── entities/{feature}.entity.ts
```

### Target Structure Pattern: DDD (winaity-clean style)

```
src/
├── domain/
│   ├── entities/
│   ├── value-objects/
│   ├── events/
│   └── repositories/ (interfaces)
├── application/
│   ├── commands/
│   ├── queries/
│   ├── handlers/
│   └── dtos/
├── infrastructure/
│   ├── persistence/
│   │   ├── repositories/
│   │   └── migrations/
│   └── messaging/
│       └── nats/
└── interfaces/
    ├── grpc/
    │   └── controllers/
    └── http/ (if any)
```

## Detected Issues

### Critical (Structure)
1. **No DDD layers** - All services use flat by-feature pattern
2. **Entities mixed with infrastructure** - TypeORM entities in modules, not domain layer
3. **No CQRS separation** - Commands/Queries not separated
4. **Controllers in modules** - Should be in interfaces/grpc/

### Warning (Consistency)
1. **Inconsistent proto:generate scripts** - Different approaches across services
2. **Missing test script** in service-commercial
3. **Version mismatch** - service-engagement v0.0.1 vs others v1.0.0
4. **Inconsistent @crm/nats-utils** - service-logistics missing it

### Info (Cosmetic)
1. **Inconsistent script naming** - proto:generate varies
2. **Missing main field** in some package.json

## Technical Decisions
- Restructure to DDD layers progressively (one service at a time)
- Start with service-core as reference implementation
- Use winaity-clean patterns for domain isolation

## Scope Boundaries
- INCLUDE: Structure reorganization, DDD layers, event patterns
- EXCLUDE: Business logic changes, new features, database migrations
