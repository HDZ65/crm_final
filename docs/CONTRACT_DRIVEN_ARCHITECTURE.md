# Contract-Driven Architecture - Zero-Tolerance Guide

## 🎯 Architecture Principles

### Source of Truth Hierarchy

```
1. proto/src/**/*.proto          ← ONLY source of truth
2. proto/gen/{frontend,services} ← Generated (NEVER edit)
3. Database schema               ← Derived from entities (auto snake_case)
4. Everything else               ← Consumes generated types
```

**RULE:** If it's not in a `.proto` file, it's not a contract.

---

## 📁 Repository Structure (MANDATORY)

```
/
├── proto/
│   ├── src/                     # All .proto files (snake_case)
│   │   ├── clients/
│   │   │   └── clients.proto
│   │   ├── common/
│   │   │   ├── pagination.proto
│   │   │   └── timestamp.proto
│   │   └── factures/
│   │       └── factures.proto
│   ├── gen/                     # Generated code (DO NOT EDIT)
│   │   ├── frontend/            # Next.js types + clients
│   │   ├── services/            # NestJS types
│   │   ├── validation/          # buf.validate schemas
│   │   └── docs/                # Auto-generated docs
│   ├── buf.yaml                 # Buf config (STRICT)
│   ├── buf.gen.yaml             # Generation config
│   └── buf.lock                 # Dependency lock
│
├── frontend/                    # Next.js
│   └── src/
│       ├── app/
│       ├── components/
│       └── lib/
│           └── grpc/            # Uses proto/gen/frontend ONLY
│
├── services/                    # NestJS microservices
│   ├── service-clients/
│   │   └── src/
│   │       ├── app.module.ts    # Uses StrictNamingStrategy
│   │       ├── controllers/     # Uses proto/gen/services ONLY
│   │       ├── entities/        # NO @Column({ name: '...' })
│   │       └── services/
│   └── service-factures/
│
└── shared/                      # Shared utilities (NO SCHEMAS)
    ├── orm/
    │   └── strict-naming.strategy.ts
    └── utils/
        └── pagination.util.ts   # Helpers ONLY, no types
```

---

## 🔒 Naming Convention Rules (NON-NEGOTIABLE)

### Proto Files (.proto)
```protobuf
// ✅ CORRECT: snake_case ONLY
message CreateClientRequest {
  string organisation_id = 1;
  string first_name = 2;
  string date_naissance = 3;
  int64 montant_ttc = 4;
}

// ❌ FORBIDDEN: camelCase
message CreateClientRequest {
  string organisationId = 1;  // ❌ WRONG
}
```

### Generated TypeScript (AUTO)
```typescript
// ✅ AUTO-GENERATED from above proto
export interface CreateClientRequest {
  organisationId: string;      // ← Automatic snake_case → camelCase
  firstName: string;
  dateNaissance: string;
  montantTtc: string;
}
```

### Application Code (TypeScript)
```typescript
// ✅ CORRECT: camelCase ONLY (from generated types)
import { CreateClientRequest } from '@proto/gen/services/clients/clients';

class ClientService {
  async create(request: CreateClientRequest) {
    // Use generated types directly - NO manual mapping
    const entity = this.repository.create({
      organisationId: request.organisationId,  // ✅ camelCase
      firstName: request.firstName,
    });
    return this.repository.save(entity);
  }
}

// ❌ FORBIDDEN: Manual DTO
interface CreateClientDto {  // ❌ Duplicates proto
  organisationId: string;
}
```

### Database (snake_case)
```sql
-- ✅ AUTO-GENERATED from ORM entities
CREATE TABLE client_base (
  id UUID PRIMARY KEY,
  organisation_id UUID NOT NULL,     -- ← Auto from camelCase
  first_name VARCHAR(100),
  date_naissance DATE,
  montant_ttc DECIMAL(10,2)
);
```

### TypeORM Entities
```typescript
// ✅ CORRECT: NO manual column mapping
@Entity('client_base')
export class ClientBaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  organisationId: string;  // ← Auto converts to organisation_id

  @Column()
  firstName: string;       // ← Auto converts to first_name

  @Column('date')
  dateNaissance: Date;     // ← Auto converts to date_naissance
}

// ❌ FORBIDDEN: Manual mapping
@Entity('client_base')
export class ClientBaseEntity {
  @Column({ name: 'organisation_id' })  // ❌ FORBIDDEN
  organisationId: string;
}
```

---

## 🚫 Zero-Tolerance Violations

### ❌ VIOLATION #1: Manual DTO Creation

**WRONG:**
```typescript
// ❌ Duplicates proto schema
export class CreateClientDto {
  @IsString()
  organisationId: string;

  @IsString()
  firstName: string;
}
```

**CORRECT:**
```typescript
// ✅ Use generated type directly
import { CreateClientRequest } from '@proto/gen/services/clients/clients';

// Validation comes from buf.validate in proto
```

---

### ❌ VIOLATION #2: Manual Mapping Functions

**WRONG:**
```typescript
// ❌ Manual mapper (forbidden)
function mapProtoToEntity(proto: ClientProto): ClientEntity {
  return {
    id: proto.id,
    organisationId: proto.organisation_id,  // ❌ Manual conversion
    firstName: proto.first_name,
  };
}
```

**CORRECT:**
```typescript
// ✅ Direct assignment (types match)
function createEntity(request: CreateClientRequest): ClientBaseEntity {
  return this.repository.create(request);
  // Works because:
  // - Proto generated as camelCase
  // - Entity properties are camelCase
  // - ORM converts to snake_case automatically
}
```

---

### ❌ VIOLATION #3: Parallel Schemas

**WRONG:**
```typescript
// ❌ OpenAPI schema alongside proto
@ApiProperty()
@IsString()
organisationId: string;  // ❌ Duplicate of proto

// ❌ Zod schema manually written
const clientSchema = z.object({
  organisationId: z.string(),  // ❌ Duplicate
});
```

**CORRECT:**
```typescript
// ✅ Generate OpenAPI/Zod FROM proto
// Use protoc-gen-openapi or protoc-gen-zod

// No manual schemas EVER
```

---

### ❌ VIOLATION #4: snake_case in Application Code

**WRONG:**
```typescript
// ❌ snake_case leaking into app code
const client = {
  organisation_id: '123',  // ❌ Should be camelCase
  first_name: 'John',
};
```

**CORRECT:**
```typescript
// ✅ camelCase everywhere in application
const client = {
  organisationId: '123',
  firstName: 'John',
};
```

---

### ❌ VIOLATION #5: Manual Column Names

**WRONG:**
```typescript
@Entity()
export class Client {
  @Column({ name: 'organisation_id' })  // ❌ FORBIDDEN
  organisationId: string;

  @Column({ name: 'date_naissance' })   // ❌ FORBIDDEN
  dateNaissance: Date;
}
```

**CORRECT:**
```typescript
@Entity('client_base')
export class ClientBaseEntity {
  @Column()
  organisationId: string;  // ✅ Auto → organisation_id

  @Column('date')
  dateNaissance: Date;     // ✅ Auto → date_naissance
}
```

---

## ✅ Correct Implementation Examples

### Example 1: Proto Definition

```protobuf
// proto/src/clients/clients.proto
syntax = "proto3";
package clients;

import "buf/validate/validate.proto";
import "common/pagination.proto";

// All fields: snake_case
message CreateClientRequest {
  string organisation_id = 1 [(buf.validate.field).string.uuid = true];
  string first_name = 2 [(buf.validate.field).string.min_len = 1];
  string email = 3 [(buf.validate.field).string.email = true];
  optional string date_naissance = 4;
}

message Client {
  string id = 1;
  string organisation_id = 2;
  string first_name = 3;
  string email = 4;
  optional string date_naissance = 5;
  string created_at = 6;
  string updated_at = 7;
}

message ListClientsRequest {
  string organisation_id = 1;
  common.PaginationRequest pagination = 2;
}

message ListClientsResponse {
  repeated Client clients = 1;
  common.PaginationResponse pagination = 2;
}

service ClientService {
  rpc CreateClient(CreateClientRequest) returns (Client);
  rpc ListClients(ListClientsRequest) returns (ListClientsResponse);
}
```

---

### Example 2: NestJS Service (Backend)

```typescript
// services/service-clients/src/app.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StrictContractDrivenNamingStrategy } from '@crm/shared/orm';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      namingStrategy: new StrictContractDrivenNamingStrategy(),  // ✅ Global
      // ...
    }),
  ],
})
export class AppModule {}
```

```typescript
// services/service-clients/src/clients/clients.controller.ts
import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import {
  CreateClientRequest,
  Client,
  ListClientsRequest,
  ListClientsResponse,
} from '@proto/gen/services/clients/clients';  // ✅ Generated types ONLY

@Controller()
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @GrpcMethod('ClientService', 'CreateClient')
  async createClient(request: CreateClientRequest): Promise<Client> {
    // ✅ Direct usage of generated type
    // ✅ NO manual mapping
    return this.clientsService.create(request);
  }

  @GrpcMethod('ClientService', 'ListClients')
  async listClients(request: ListClientsRequest): Promise<ListClientsResponse> {
    return this.clientsService.findAll(request);
  }
}
```

```typescript
// services/service-clients/src/clients/clients.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateClientRequest, Client } from '@proto/gen/services/clients/clients';
import { ClientBaseEntity } from './entities/client-base.entity';

@Injectable()
export class ClientsService {
  constructor(
    @InjectRepository(ClientBaseEntity)
    private readonly repository: Repository<ClientBaseEntity>,
  ) {}

  async create(request: CreateClientRequest): Promise<Client> {
    // ✅ Direct entity creation from proto type
    const entity = this.repository.create({
      organisationId: request.organisationId,  // camelCase
      firstName: request.firstName,
      email: request.email,
      dateNaissance: request.dateNaissance,
    });

    const saved = await this.repository.save(entity);  // ✅ Auto → snake_case in DB

    // ✅ Return proto type directly
    return {
      id: saved.id,
      organisationId: saved.organisationId,
      firstName: saved.firstName,
      email: saved.email,
      dateNaissance: saved.dateNaissance,
      createdAt: saved.createdAt.toISOString(),
      updatedAt: saved.updatedAt.toISOString(),
    };
  }
}
```

```typescript
// services/service-clients/src/clients/entities/client-base.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('client_base')  // ✅ Explicit table name
export class ClientBaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;  // ✅ Auto → id

  @Column()
  organisationId: string;  // ✅ Auto → organisation_id

  @Column({ length: 100 })
  firstName: string;  // ✅ Auto → first_name

  @Column({ unique: true })
  email: string;  // ✅ Auto → email

  @Column({ type: 'date', nullable: true })
  dateNaissance?: string;  // ✅ Auto → date_naissance

  @CreateDateColumn()
  createdAt: Date;  // ✅ Auto → created_at

  @UpdateDateColumn()
  updatedAt: Date;  // ✅ Auto → updated_at
}
```

---

### Example 3: Next.js Frontend

```typescript
// frontend/src/lib/grpc/clients.ts
import { credentials } from '@grpc/grpc-js';
import { ClientServiceClient } from '@proto/gen/frontend/clients/clients';  // ✅ Generated

const client = new ClientServiceClient(
  process.env.GRPC_CLIENTS_URL!,
  credentials.createInsecure(),
);

export { client as clientsGrpcClient };
```

```typescript
// frontend/src/app/clients/actions.ts
'use server';

import { clientsGrpcClient } from '@/lib/grpc/clients';
import type { CreateClientRequest, Client } from '@proto/gen/frontend/clients/clients';  // ✅ Types

export async function createClient(data: CreateClientRequest): Promise<Client> {
  return new Promise((resolve, reject) => {
    clientsGrpcClient.createClient(data, (error, response) => {
      if (error) reject(error);
      else if (response) resolve(response);
    });
  });
}
```

```tsx
// frontend/src/app/clients/create/page.tsx
'use client';

import { useState } from 'react';
import { createClient } from '../actions';
import type { CreateClientRequest } from '@proto/gen/frontend/clients/clients';  // ✅ Type

export default function CreateClientPage() {
  const [formData, setFormData] = useState<CreateClientRequest>({
    organisationId: '',  // ✅ camelCase from generated type
    firstName: '',
    email: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const client = await createClient(formData);  // ✅ Type-safe
    console.log('Created:', client);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        value={formData.firstName}  // ✅ camelCase
        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
      />
      {/* ... */}
    </form>
  );
}
```

---

## 🔄 Data Flow (Zero Manual Conversion)

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. PROTO DEFINITION (snake_case)                                │
│    message CreateClientRequest {                                 │
│      string organisation_id = 1;                                 │
│      string first_name = 2;                                      │
│    }                                                             │
└────────────────────────┬────────────────────────────────────────┘
                         │ buf generate
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2. GENERATED TYPESCRIPT (camelCase) - AUTOMATIC                 │
│    interface CreateClientRequest {                               │
│      organisationId: string;  ← snakeToCamel=true               │
│      firstName: string;                                          │
│    }                                                             │
└────────────────────────┬────────────────────────────────────────┘
                         │ import & use
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 3. APPLICATION CODE (camelCase)                                 │
│    const entity = repository.create({                            │
│      organisationId: request.organisationId,                     │
│      firstName: request.firstName,                               │
│    });                                                           │
└────────────────────────┬────────────────────────────────────────┘
                         │ StrictNamingStrategy
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 4. DATABASE (snake_case) - AUTOMATIC                            │
│    INSERT INTO client_base (                                     │
│      organisation_id,  ← Auto from camelCase                    │
│      first_name                                                  │
│    ) VALUES (...)                                                │
└─────────────────────────────────────────────────────────────────┘

CONVERSIONS: 2 (both automatic)
MANUAL MAPPINGS: 0 ✅
```

---

## 🔍 Code Review Checklist

Before merging ANY code:

### ✅ Proto Validation
- [ ] All `.proto` files use `snake_case` (fields, messages, RPCs)
- [ ] No `camelCase` in proto files
- [ ] `buf lint` passes with ZERO warnings
- [ ] `buf breaking` passes (or breaking changes documented)
- [ ] All fields have validation rules (`buf.validate`)

### ✅ Generated Code
- [ ] Code generated from `proto/gen/{frontend,services}` ONLY
- [ ] NO manual edits in `proto/gen/**/*`
- [ ] Generation is deterministic (same input = same output)

### ✅ Application Code
- [ ] All types imported from `@proto/gen/*`
- [ ] ZERO manual DTOs/interfaces for API contracts
- [ ] ZERO `@Column({ name: '...' })` in entities
- [ ] All code uses `camelCase` (no `snake_case` variables)
- [ ] NO `any` or `unknown` types

### ✅ Database
- [ ] All tables/columns use `snake_case`
- [ ] Migration generated from entities (TypeORM migration:generate)
- [ ] NO manual column name overrides

### ✅ Validation
- [ ] Validation rules in `.proto` files (buf.validate)
- [ ] NO class-validator decorators duplicating proto rules
- [ ] Validation errors fail fast (no silent fallbacks)

### ✅ Testing
- [ ] Tests use generated types
- [ ] NO mock DTOs differing from proto
- [ ] Breaking changes fail CI

---

## 🚨 CI/CD Fail-Fast Rules

CI MUST fail if:

1. `buf lint` produces any warning
2. `buf breaking` detects breaking changes (unless documented)
3. Generated code is out of sync (`buf generate` changes files)
4. Any `.proto` file uses `camelCase`
5. Any entity has `@Column({ name: '...' })`
6. Any manual DTO exists for proto-defined contracts
7. TypeScript compilation fails
8. Tests fail

See: `.github/workflows/contract-driven-ci.yml`

---

## 📚 Further Reading

- [Proto Style Guide](./proto/STYLE_GUIDE.md)
- [Buf Documentation](https://buf.build/docs)
- [Migration Guide](./MIGRATION_TO_CONTRACT_DRIVEN.md)
- [Common Pitfalls](./ANTI_PATTERNS.md)

---

**Last Updated:** January 20, 2026  
**Enforcement:** MANDATORY for all new code  
**Violations:** Block PR merge
