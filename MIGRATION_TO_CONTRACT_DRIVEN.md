# Migration to Strict Contract-Driven Architecture

## 🎯 Executive Summary

This project now implements a **zero-tolerance contract-driven architecture** where:

✅ Protobuf is the **ONLY** source of truth  
✅ **ZERO** manual DTOs, mappers, or schema duplication  
✅ Automatic snake_case (DB) ↔ camelCase (code) conversion  
✅ CI/CD fails on **ANY** architectural violation  
✅ buf.validate provides centralized validation  

---

## 📁 New Repository Structure

```
/
├── proto/
│   ├── src/              # ← SOURCE OF TRUTH (all .proto files)
│   │   ├── common/       # Shared messages (pagination, timestamps)
│   │   ├── examples/     # Reference implementation (strict_client.proto)
│   │   ├── clients/
│   │   ├── factures/
│   │   └── ...
│   ├── gen/              # ← GENERATED CODE (DO NOT EDIT)
│   │   ├── frontend/     # Next.js types + gRPC clients
│   │   ├── services/     # NestJS types
│   │   ├── validation/   # buf.validate schemas
│   │   └── docs/         # Auto-generated docs
│   ├── buf.yaml          # Strict lint + breaking detection
│   └── buf.gen.yaml      # Generation config (snakeToCamel=true)
│
├── frontend/             # Next.js - uses proto/gen/frontend ONLY
├── services/             # NestJS - uses proto/gen/services ONLY
│
└── shared/
    ├── orm/
    │   └── strict-naming.strategy.ts  # Auto snake_case ↔ camelCase
    ├── constants/
    │   └── defaults.ts
    └── enums/
        └── statut.enum.ts
```

---

## 🚀 Quick Start (5 minutes)

### 1. Install Buf

```bash
# macOS
brew install bufbuild/buf/buf

# Linux
curl -sSL "https://github.com/bufbuild/buf/releases/download/v1.47.2/buf-$(uname -s)-$(uname -m)" -o /usr/local/bin/buf
chmod +x /usr/local/bin/buf

# Verify
buf --version
```

### 2. Generate Code from Proto

```bash
cd proto
buf generate

# This creates:
# - proto/gen/frontend/  (Next.js types)
# - proto/gen/services/  (NestJS types)
# - proto/gen/validation/ (buf.validate)
```

### 3. Update a Service to Use Generated Types

**Example: service-clients**

```typescript
// BEFORE (manual DTO - FORBIDDEN)
class CreateClientDto {
  @IsString()
  organisationId: string;
  // ...
}

// AFTER (use generated type)
import { CreateClientRequest } from '@proto/gen/services/clients/clients';

@GrpcMethod('ClientService', 'CreateClient')
async createClient(request: CreateClientRequest): Promise<Client> {
  // request.organisationId ← already camelCase from proto
  return this.service.create(request);
}
```

### 4. Update Entity to Use Auto-Mapping

```typescript
// BEFORE (manual mapping - FORBIDDEN)
@Entity('client_base')
export class ClientEntity {
  @Column({ name: 'organisation_id' })  // ❌ FORBIDDEN
  organisationId: string;
}

// AFTER (automatic conversion)
@Entity('client_base')
export class ClientEntity {
  @Column()  // ✅ Auto converts to organisation_id
  organisationId: string;
}
```

### 5. Apply Naming Strategy in app.module.ts

```typescript
import { StrictContractDrivenNamingStrategy } from '@crm/shared/orm';

TypeOrmModule.forRoot({
  type: 'postgres',
  namingStrategy: new StrictContractDrivenNamingStrategy(),
  // ...
})
```

---

## ✅ What's Already Done

### Security & Quality Improvements
- [x] Secrets removed from docker-compose.yml
- [x] SSL validation fixed (6 services)
- [x] ESLint config standardized
- [x] TypeScript base config created
- [x] Shared utilities (pagination, constants, enums)
- [x] Complete security documentation (SECURITY.md)

### Contract-Driven Architecture
- [x] Proto files reorganized to `/proto/src/`
- [x] Strict `buf.yaml` configuration (ZERO exceptions)
- [x] `buf.gen.yaml` with snakeToCamel conversion
- [x] buf.validate integration
- [x] StrictNamingStrategy ORM (auto snake↔camel)
- [x] Complete architecture guide (CONTRACT_DRIVEN_ARCHITECTURE.md)
- [x] CI/CD fail-fast pipeline
- [x] PR template with contract checklist
- [x] Example proto (strict_client.proto)

---

## 📋 Migration Checklist (Per Service)

### Phase 1: Backend Service Migration

For each service in `services/`:

- [ ] 1. **Remove manual DTOs**
  ```bash
  # Delete all *.dto.ts files
  find services/service-clients -name "*.dto.ts" -delete
  ```

- [ ] 2. **Import generated types**
  ```typescript
  // Add to package.json paths
  "paths": {
    "@proto/*": ["../../proto/gen/services/*"]
  }
  ```

- [ ] 3. **Update controllers**
  ```typescript
  import { CreateClientRequest, Client } from '@proto/gen/services/clients/clients';
  
  @GrpcMethod('ClientService', 'CreateClient')
  async createClient(request: CreateClientRequest): Promise<Client> {
    return this.service.create(request);
  }
  ```

- [ ] 4. **Remove @Column({ name: '...' })**
  ```bash
  # Find violations
  grep -r "@Column.*{.*name:" services/service-clients/src
  
  # Remove all manual mappings
  ```

- [ ] 5. **Apply StrictNamingStrategy**
  ```typescript
  // app.module.ts
  import { StrictContractDrivenNamingStrategy } from '@crm/shared/orm';
  
  TypeOrmModule.forRoot({
    namingStrategy: new StrictContractDrivenNamingStrategy(),
  })
  ```

- [ ] 6. **Test & Verify**
  ```bash
  npm run build
  npm test
  ```

### Phase 2: Frontend Migration

- [ ] 1. **Import frontend types**
  ```typescript
  import type { CreateClientRequest } from '@proto/gen/frontend/clients/clients';
  ```

- [ ] 2. **Use gRPC clients**
  ```typescript
  import { ClientServiceClient } from '@proto/gen/frontend/clients/clients';
  
  const client = new ClientServiceClient(
    process.env.GRPC_CLIENTS_URL!,
    credentials.createInsecure()
  );
  ```

- [ ] 3. **Remove manual types**
  ```bash
  # Delete manual interface definitions that duplicate proto
  ```

---

## 🚫 Anti-Patterns to Fix

### ❌ Manual DTOs
```typescript
// WRONG
export class CreateClientDto {
  @IsString()
  organisationId: string;
}

// RIGHT
import { CreateClientRequest } from '@proto/gen/services/clients/clients';
```

### ❌ Manual Column Mapping
```typescript
// WRONG
@Column({ name: 'organisation_id' })
organisationId: string;

// RIGHT
@Column()  // Auto converts via StrictNamingStrategy
organisationId: string;
```

### ❌ Manual Mappers
```typescript
// WRONG
mapProtoToEntity(proto) {
  return {
    organisationId: proto.organisation_id,  // Manual conversion
  };
}

// RIGHT
// Just use the entity directly - types already match!
this.repository.create(request);
```

---

## 🔧 Fixing Common Issues

### Issue 1: "Module not found @proto/gen"

**Solution:**
```json
// tsconfig.json
{
  "compilerOptions": {
    "paths": {
      "@proto/*": ["../../proto/gen/services/*"]
    }
  }
}
```

### Issue 2: "buf: command not found"

**Solution:**
```bash
# Install Buf
brew install bufbuild/buf/buf  # macOS
# OR download from https://github.com/bufbuild/buf/releases
```

### Issue 3: "Generated code out of sync"

**Solution:**
```bash
cd proto
buf generate
git add proto/gen/
git commit -m "chore: regenerate proto code"
```

### Issue 4: Database column names mismatch

**Solution:**
```typescript
// Ensure StrictNamingStrategy is applied in app.module.ts
import { StrictContractDrivenNamingStrategy } from '@crm/shared/orm';

TypeOrmModule.forRoot({
  namingStrategy: new StrictContractDrivenNamingStrategy(),
})
```

---

## 📊 Migration Priority (4 weeks)

### Week 1: Critical Services (High Traffic)
1. service-clients
2. service-factures  
3. service-contrats
4. service-payments

### Week 2: Core Services
5. service-commission
6. service-users
7. service-organisations
8. service-dashboard

### Week 3: Supporting Services
9. service-products
10. service-commerciaux
11. service-notifications
12. service-logistics

### Week 4: Remaining Services
13. service-email
14. service-documents
15. service-calendar
16. service-activites
17. service-referentiel
18. service-relance
19. service-retry

---

## 🧪 Testing Migration

For each migrated service:

```bash
# 1. Lint proto
cd proto
buf lint

# 2. Generate code
buf generate

# 3. Build service
cd ../services/service-clients
npm run build

# 4. Run tests
npm test

# 5. Check for anti-patterns
grep -r "@Column.*{.*name:" src/
grep -r "\.dto\.ts" src/

# 6. Verify no manual DTOs
find src -name "*.dto.ts"
```

---

## ✅ Definition of Done

A service is fully migrated when:

- [ ] **NO** `*.dto.ts` files exist
- [ ] **NO** `@Column({ name: '...' })` in entities
- [ ] **ALL** types imported from `@proto/gen/services/*`
- [ ] `StrictNamingStrategy` applied in app.module.ts
- [ ] `npm run build` succeeds
- [ ] All tests pass
- [ ] CI/CD pipeline passes (lint, build, tests)
- [ ] Code review approved with contract checklist

---

## 📚 Key Documents

- **Architecture Guide**: [CONTRACT_DRIVEN_ARCHITECTURE.md](./CONTRACT_DRIVEN_ARCHITECTURE.md)
- **Security Guide**: [SECURITY.md](./SECURITY.md)
- **PR Template**: [.github/PULL_REQUEST_TEMPLATE.md](./.github/PULL_REQUEST_TEMPLATE.md)
- **Example Proto**: [proto/src/examples/strict_client.proto](./proto/src/examples/strict_client.proto)

---

## 🆘 Getting Help

1. **Proto syntax**: See [proto/src/examples/strict_client.proto](./proto/src/examples/strict_client.proto)
2. **NestJS example**: See architecture guide Section "Example 2"
3. **Frontend example**: See architecture guide Section "Example 3"
4. **CI/CD**: See [.github/workflows/contract-driven-ci.yml](./.github/workflows/contract-driven-ci.yml)

---

**Migration Lead**: Development Team  
**Target Completion**: 4 weeks from now  
**Status**: In Progress (structure ready, services to migrate)
