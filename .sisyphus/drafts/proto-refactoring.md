# Draft: Proto Refactoring (winaity-clean style)

## Requirements (confirmed)

**Objectif**: Restructurer `packages/proto/` selon le pattern winaity-clean

**Pattern cible**:
- Structure flat (tous les .proto à la racine)
- Séparation CQRS (`{domain}_commands.proto` + `{domain}_queries.proto`)
- Events séparés (`{domain}_events.proto`)
- Types communs centralisés (`common.proto`)
- DTOs explicites pour les réponses enrichies

## Technical Decisions

### Structure Cible

```
packages/proto/
├── common.proto                      # Types partagés
├── clients_commands.proto            # Write ops (Create/Update/Delete)
├── clients_queries.proto             # Read ops (Get/List/Search) + DTOs
├── clients_events.proto              # NATS events
├── organisations_commands.proto
├── organisations_queries.proto
├── organisations_events.proto
├── factures_commands.proto
├── factures_queries.proto
├── factures_events.proto
├── payments_commands.proto
├── payments_queries.proto
├── payments_events.proto
├── contrats_commands.proto
├── contrats_queries.proto
├── contrats_events.proto
├── commercial_commands.proto
├── commercial_queries.proto
├── commercial_events.proto
├── products_commands.proto
├── products_queries.proto
├── calendar_commands.proto
├── calendar_queries.proto
├── logistics_commands.proto
├── logistics_queries.proto
├── engagement_commands.proto
├── engagement_queries.proto
├── google/                           # Google deps locales
│   └── api/
│       └── field_behavior.proto
├── buf.yaml
├── buf.gen.yaml
└── package.json
```

### Mapping Domaines Actuels → Nouveaux Fichiers

| Domaine Actuel | Commands | Queries | Events |
|----------------|----------|---------|--------|
| `clients/clients.proto` | `clients_commands.proto` | `clients_queries.proto` | `clients_events.proto` |
| `organisations/organisations.proto` | `organisations_commands.proto` | `organisations_queries.proto` | - |
| `organisations/users.proto` | `users_commands.proto` | `users_queries.proto` | - |
| `factures/factures.proto` + `invoice.proto` | `factures_commands.proto` | `factures_queries.proto` | `factures_events.proto` |
| `payments/payment.proto` | `payments_commands.proto` | `payments_queries.proto` | `payments_events.proto` |
| `contrats/contrats.proto` | `contrats_commands.proto` | `contrats_queries.proto` | `contrats_events.proto` |
| `commerciaux/commerciaux.proto` | `commercial_commands.proto` | `commercial_queries.proto` | - |
| `commission/commission.proto` | Merge into `commercial_*` | | |
| `products/products.proto` | `products_commands.proto` | `products_queries.proto` | - |
| `calendar/calendar.proto` | `calendar_commands.proto` | `calendar_queries.proto` | - |
| `logistics/logistics.proto` | `logistics_commands.proto` | `logistics_queries.proto` | - |
| `email/email.proto` | `engagement_commands.proto` | `engagement_queries.proto` | - |
| `notifications/notifications.proto` | Merge into `engagement_*` | | |
| `dashboard/dashboard.proto` | Merge into `engagement_*` | | |
| `activites/activites.proto` | Merge into `engagement_*` | | |

### Conventions à Appliquer

1. **Package naming**: `{domain}.commands`, `{domain}.queries`, `{domain}.events`
2. **Import common**: `import "common.proto";`
3. **Import google**: `import "google/api/field_behavior.proto";`
4. **Service naming**: `{Entity}CommandService`, `{Entity}QueryService`
5. **DTO naming**: `{Entity}DTO` avec tous les champs enrichis
6. **Event ID**: `string eventId = 99;` sur chaque event
7. **Timestamps**: `int64` Unix milliseconds (pas google.protobuf.Timestamp)

## Research Findings

### Depuis winaity-clean

**common.proto contient**:
- Empty
- HealthCheckRequest/Response
- PaginationRequest/Response
- SortRequest
- ErrorDetail/ErrorResponse
- SuccessResponse
- IdResponse
- Metadata

**Structure Commands**:
```protobuf
service UserCommandService {
  rpc CreateUser(CreateUserRequest) returns (CreateUserResponse);
  rpc UpdateUser(UpdateUserRequest) returns (UpdateUserResponse);
  rpc DeleteUser(DeleteUserRequest) returns (DeleteUserResponse);
}
```

**Structure Queries**:
```protobuf
service UserQueryService {
  rpc HealthCheck(common.HealthCheckRequest) returns (common.HealthCheckResponse);
  rpc GetUser(GetUserRequest) returns (UserResponse);
  rpc ListUsers(ListUsersRequest) returns (ListUsersResponse);
}

message UserDTO {
  string id = 1;
  // ... all enriched fields
  int64 createdAt = 97;
  int64 updatedAt = 98;
  int32 version = 99;
}
```

**Structure Events**:
```protobuf
message ContactCreatedEvent {
  string userId = 1;
  string contactId = 2;
  // ... event data
  string eventId = 99;  // Pour idempotence
}
```

## Open Questions

- [x] Garder la rétrocompatibilité avec les services existants? → OUI, les services devront mettre à jour leurs imports
- [ ] Faut-il versionner les packages (v1)? → À confirmer avec l'utilisateur
- [ ] Faut-il déplacer les .proto actuels ou les recréer from scratch?
- [ ] Quelle stratégie pour les migrations des services?

## Scope Boundaries

### INCLUDE
- Restructurer tous les .proto en flat + CQRS
- Créer common.proto centralisé
- Mettre à jour buf.yaml et buf.gen.yaml
- Mettre à jour package.json exports

### EXCLUDE
- Migration des services (ils devront mettre à jour leurs imports séparément)
- Tests de régression sur les services
- Génération des types (sera fait après)

## Impact Analysis

### Services Impactés

Chaque service devra mettre à jour:
1. `proto:generate` script (chemins des imports)
2. Imports TypeScript dans le code (nouveaux chemins)

### Estimation Effort

- **Phase 1**: Créer common.proto → 30 min
- **Phase 2**: Restructurer chaque domaine en CQRS → 3-4h (34 fichiers actuels → ~30 nouveaux fichiers)
- **Phase 3**: Mettre à jour buf configs → 30 min
- **Phase 4**: Mettre à jour package.json exports → 30 min
- **Phase 5**: Régénérer les types et tester → 1h

**Total estimé**: 5-6h de travail

## Questions pour l'utilisateur

1. Voulez-vous la séparation CQRS stricte (commands/queries dans des fichiers séparés)?
2. Voulez-vous versionner les packages (`clients.commands.v1`)?
3. Préférez-vous une migration progressive (service par service) ou big-bang?
