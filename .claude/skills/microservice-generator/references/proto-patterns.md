# Proto Patterns (Winaity-clean style)

## Organisation des fichiers

```
packages/proto/
├── buf.yaml
├── buf.lock
├── <context>_commands.proto
├── <context>_queries.proto
├── common.proto
├── google/api/
│   ├── annotations.proto
│   └── http.proto
└── gen/
    ├── ts/                    # TypeScript généré
    ├── rs/                    # Rust généré
    └── openapi/               # OpenAPI généré
```

## Convention de nommage

| Élément | Convention | Exemple |
|---------|------------|---------|
| Package | `winaity.<context>.<type>` | `winaity.billing.commands` |
| Service | `<Context><Type>Service` | `BillingCommandsService` |
| Message Request | `<Action><Entity>Request` | `CreateInvoiceRequest` |
| Message Response | `<Action><Entity>Response` | `CreateInvoiceResponse` |
| Enum | `<Entity><Property>` | `InvoiceStatus` |

---

## Template: Commands Proto

```protobuf
// <context>_commands.proto
syntax = "proto3";

package winaity.<context>.commands;

option go_package = "github.com/winaity/proto/<context>/commands";

import "google/api/annotations.proto";
import "common.proto";

// Service de commandes (mutations)
service <Context>CommandsService {
  // Create
  rpc Create<Aggregate>(Create<Aggregate>Request) returns (Create<Aggregate>Response) {
    option (google.api.http) = {
      post: "/v1/<context>s"
      body: "*"
    };
  }

  // Update
  rpc Update<Aggregate>(Update<Aggregate>Request) returns (Update<Aggregate>Response) {
    option (google.api.http) = {
      patch: "/v1/<context>s/{id}"
      body: "*"
    };
  }

  // Delete
  rpc Delete<Aggregate>(Delete<Aggregate>Request) returns (Delete<Aggregate>Response) {
    option (google.api.http) = {
      delete: "/v1/<context>s/{id}"
    };
  }

  // Actions métier
  rpc Activate<Aggregate>(Activate<Aggregate>Request) returns (Activate<Aggregate>Response) {
    option (google.api.http) = {
      post: "/v1/<context>s/{id}/activate"
    };
  }
}

// === Create ===
message Create<Aggregate>Request {
  string user_id = 1;
  string name = 2;
  // ... autres champs
}

message Create<Aggregate>Response {
  string id = 1;
  bool success = 2;
}

// === Update ===
message Update<Aggregate>Request {
  string id = 1;
  optional string name = 2;
  // ... autres champs optionnels
}

message Update<Aggregate>Response {
  bool success = 1;
}

// === Delete ===
message Delete<Aggregate>Request {
  string id = 1;
}

message Delete<Aggregate>Response {
  bool success = 1;
}

// === Activate ===
message Activate<Aggregate>Request {
  string id = 1;
}

message Activate<Aggregate>Response {
  bool success = 1;
}
```

---

## Template: Queries Proto

```protobuf
// <context>_queries.proto
syntax = "proto3";

package winaity.<context>.queries;

option go_package = "github.com/winaity/proto/<context>/queries";

import "google/api/annotations.proto";
import "common.proto";

// Service de queries (lectures)
service <Context>QueriesService {
  // Get by ID
  rpc Get<Aggregate>(Get<Aggregate>Request) returns (Get<Aggregate>Response) {
    option (google.api.http) = {
      get: "/v1/<context>s/{id}"
    };
  }

  // List with pagination
  rpc List<Aggregate>s(List<Aggregate>sRequest) returns (List<Aggregate>sResponse) {
    option (google.api.http) = {
      get: "/v1/<context>s"
    };
  }

  // Search / Filter
  rpc Search<Aggregate>s(Search<Aggregate>sRequest) returns (Search<Aggregate>sResponse) {
    option (google.api.http) = {
      post: "/v1/<context>s/search"
      body: "*"
    };
  }
}

// === Get ===
message Get<Aggregate>Request {
  string id = 1;
}

message Get<Aggregate>Response {
  <Aggregate>Dto <aggregate> = 1;
}

// === List ===
message List<Aggregate>sRequest {
  string user_id = 1;
  winaity.common.PaginationRequest pagination = 2;
  optional string status = 3;
}

message List<Aggregate>sResponse {
  repeated <Aggregate>Dto items = 1;
  winaity.common.PaginationResponse pagination = 2;
}

// === Search ===
message Search<Aggregate>sRequest {
  string user_id = 1;
  string query = 2;
  repeated string statuses = 3;
  winaity.common.PaginationRequest pagination = 4;
}

message Search<Aggregate>sResponse {
  repeated <Aggregate>Dto items = 1;
  winaity.common.PaginationResponse pagination = 2;
  int32 total_count = 3;
}

// === DTO ===
message <Aggregate>Dto {
  string id = 1;
  string user_id = 2;
  string name = 3;
  <Aggregate>Status status = 4;
  string created_at = 5;  // ISO 8601
  string updated_at = 6;  // ISO 8601
}

// === Enum ===
enum <Aggregate>Status {
  <AGGREGATE>_STATUS_UNSPECIFIED = 0;
  <AGGREGATE>_STATUS_DRAFT = 1;
  <AGGREGATE>_STATUS_ACTIVE = 2;
  <AGGREGATE>_STATUS_ARCHIVED = 3;
}
```

---

## Template: Common Proto

```protobuf
// common.proto
syntax = "proto3";

package winaity.common;

option go_package = "github.com/winaity/proto/common";

// Pagination
message PaginationRequest {
  int32 page = 1;
  int32 page_size = 2;
  optional string sort_by = 3;
  optional string sort_order = 4;  // ASC | DESC
}

message PaginationResponse {
  int32 page = 1;
  int32 page_size = 2;
  int32 total_pages = 3;
  int32 total_items = 4;
  bool has_next = 5;
  bool has_previous = 6;
}

// Error
message ErrorDetail {
  string code = 1;
  string message = 2;
  string field = 3;
}

message ErrorResponse {
  string code = 1;
  string message = 2;
  repeated ErrorDetail details = 3;
}

// Metadata
message RequestMetadata {
  string correlation_id = 1;
  string user_id = 2;
  string tenant_id = 3;
}
```

---

## buf.yaml

```yaml
version: v1
name: buf.build/winaity/proto
deps:
  - buf.build/googleapis/googleapis
breaking:
  use:
    - FILE
lint:
  use:
    - DEFAULT
  except:
    - PACKAGE_VERSION_SUFFIX
```

---

## Génération

### buf.gen.yaml

```yaml
version: v1
managed:
  enabled: true
  go_package_prefix:
    default: github.com/winaity/proto/gen/go
plugins:
  # TypeScript
  - plugin: buf.build/community/stephenh-ts-proto
    out: gen/ts
    opt:
      - esModuleInterop=true
      - outputServices=grpc-js
      - useOptionals=messages
      - exportCommonSymbols=false

  # Go
  - plugin: buf.build/protocolbuffers/go
    out: gen/go
    opt:
      - paths=source_relative

  # OpenAPI
  - plugin: buf.build/grpc-ecosystem/openapiv2
    out: gen/openapi
    opt:
      - logtostderr=true
```

### Commandes

```bash
# Générer tous les langages
buf generate

# Lint
buf lint

# Breaking changes check
buf breaking --against '.git#branch=main'

# Copier vers un service
cp -r gen/ts/* ../services/<service-name>/proto/generated/
```

---

## Erreurs gRPC

### Codes standards

| Code | Usage |
|------|-------|
| `NOT_FOUND` | Ressource inexistante |
| `ALREADY_EXISTS` | Doublon (unicité violée) |
| `INVALID_ARGUMENT` | Paramètre invalide |
| `FAILED_PRECONDITION` | État invalide pour l'opération |
| `PERMISSION_DENIED` | Pas autorisé (handled by gateway) |
| `INTERNAL` | Erreur serveur |

### Mapping Domain → gRPC

```typescript
// infrastructure/grpc/<context>.grpc-error-mapper.ts
import { RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { DomainError, NotFoundException, BusinessRuleException } from '@winaity/shared-kernel';

export function mapDomainErrorToGrpc(error: Error): RpcException {
  if (error instanceof NotFoundException) {
    return new RpcException({
      code: status.NOT_FOUND,
      message: error.message,
    });
  }

  if (error instanceof BusinessRuleException) {
    return new RpcException({
      code: status.FAILED_PRECONDITION,
      message: error.message,
    });
  }

  if (error instanceof DomainError) {
    return new RpcException({
      code: status.INVALID_ARGUMENT,
      message: error.message,
    });
  }

  return new RpcException({
    code: status.INTERNAL,
    message: 'Internal server error',
  });
}
```

---

## Versioning

### Stratégie

1. **Nouvelle version majeure** : Nouveau package (`winaity.<context>.v2`)
2. **Ajout de champs** : Compatible (fields optionnels)
3. **Renommage** : Jamais (breaking change)
4. **Suppression** : Marquer `deprecated`, supprimer après 2 releases

### Extension d'un proto existant

```protobuf
// Ajouter un nouveau champ (compatible)
message Create<Aggregate>Request {
  string user_id = 1;
  string name = 2;
  optional string description = 3;  // NOUVEAU - optionnel
}

// Ajouter une nouvelle RPC (compatible)
service <Context>CommandsService {
  // ... existants ...

  // NOUVEAU
  rpc Clone<Aggregate>(Clone<Aggregate>Request) returns (Clone<Aggregate>Response);
}
```

---

## Intégration Gateway (Rust)

Le gateway lit les annotations `google.api.http` pour exposer les endpoints REST.

```rust
// gateway/src/grpc_clients/<context>.rs
use tonic::transport::Channel;

pub struct <Context>Client {
    commands: <Context>CommandsServiceClient<Channel>,
    queries: <Context>QueriesServiceClient<Channel>,
}

impl <Context>Client {
    pub async fn new(addr: &str) -> Result<Self, Box<dyn std::error::Error>> {
        let channel = Channel::from_shared(addr.to_string())?
            .connect()
            .await?;

        Ok(Self {
            commands: <Context>CommandsServiceClient::new(channel.clone()),
            queries: <Context>QueriesServiceClient::new(channel),
        })
    }
}
```
