# Migration Guide - Applying Best Practices Improvements

This guide helps you adopt the new shared utilities, constants, and best practices across all microservices.

## Quick Start

1. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env and generate secrets:
   echo "KEYCLOAK_SECRET=$(openssl rand -base64 32)" >> .env
   echo "NEXTAUTH_SECRET=$(openssl rand -base64 32)" >> .env
   echo "ENCRYPTION_KEY=$(openssl rand -base64 32)" >> .env
   ```

2. **Install shared package (in each service):**
   ```bash
   cd services/service-clients
   npm install --save ../../shared
   ```

3. **Build shared package first:**
   ```bash
   cd shared
   npm install
   npm run build
   ```

---

## 1. Using Shared Pagination Utility

### Before (Duplicated Code):
```typescript
// services/service-clients/src/modules/client-base/client-base.service.ts
async findAll(filters: ClientBaseFilters) {
  const page = pagination?.page ?? 1;
  const limit = pagination?.limit ?? 20;
  const skip = (page - 1) * limit;
  
  const [clients, total] = await qb.getManyAndCount();
  
  return {
    clients,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}
```

### After (Using Shared Utility):
```typescript
import { PaginationUtil } from '@crm/shared';

async findAll(filters: ClientBaseFilters) {
  const { skip, limit } = PaginationUtil.getParams(filters.pagination);
  
  const qb = this.repository.createQueryBuilder('c');
  // ... add filters
  
  const [clients, total] = await qb.skip(skip).take(limit).getManyAndCount();
  
  return {
    clients,
    ...PaginationUtil.buildFromInput(clients, total, filters.pagination),
  };
}
```

**Benefits:**
- Consistent pagination across all services
- Built-in max limit protection (100 items)
- Additional fields: `hasNextPage`, `hasPreviousPage`
- Single source of truth for defaults

---

## 2. Using Shared Constants

### Before (Magic Numbers):
```typescript
// services/service-factures/src/modules/facture/facture.service.ts
const tauxTVA = ligne.tauxTVA ?? 20;  // Magic number
const pays = input.pays || 'France';  // Hardcoded
```

### After (Using Constants):
```typescript
import { DEFAULT_TVA_RATE, DEFAULT_COUNTRY } from '@crm/shared';

const tauxTVA = ligne.tauxTVA ?? DEFAULT_TVA_RATE;
const pays = input.pays || DEFAULT_COUNTRY;
```

**Available Constants:**
- `DEFAULT_TVA_RATE`, `TVA_RATE_REDUCED`, `TVA_RATE_SUPER_REDUCED`
- `DEFAULT_COUNTRY`, `DEFAULT_COUNTRY_CODE`
- `DEFAULT_CURRENCY`, `CURRENCY_SYMBOL`
- `DEFAULT_INVOICE_PREFIX`, `DEFAULT_PAYMENT_TERMS_DAYS`
- `DEFAULT_PAGE_SIZE`, `MAX_PAGE_SIZE`
- And many more (see `shared/constants/defaults.ts`)

---

## 3. Using Shared Enums

### Before (String Literals):
```typescript
// services/service-factures/src/modules/facture/entities/facture.entity.ts
estBrouillon(): boolean {
  return this.statut?.code === 'BROUILLON';  // String literal
}

if (entity.statut === 'ACTIF') { ... }  // Typos possible
```

### After (Using Enums):
```typescript
import { FactureStatus, ClientStatus } from '@crm/shared';

estBrouillon(): boolean {
  return this.statut?.code === FactureStatus.BROUILLON;
}

if (entity.statut === ClientStatus.ACTIF) { ... }
```

**Benefits:**
- Type safety
- Autocomplete in IDE
- No typos
- Centralized definition

**Available Enums:**
- `ClientStatus`, `ClientType`
- `FactureStatus`
- `ContratStatus`
- `PaymentStatus`, `PaymentMethod`
- `DocumentType`
- `UserRole`, `OrganisationStatus`
- `NotificationType`, `ActivityType`

---

## 4. Updating TypeScript Configuration

### For Each Service:

1. **Extend base tsconfig:**
```json
// services/service-clients/tsconfig.json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "paths": {
      "@proto/*": ["../../gen/ts/*"],
      "@crm/shared": ["../../shared"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.spec.ts"]
}
```

2. **Benefits:**
- Consistent compiler options across all services
- Centralized strictness settings
- Easy to progressively enable strict mode

---

## 5. Adding ESLint Configuration

### For Services Without ESLint Config:

1. **Create symlink or extend root config:**
```bash
cd services/service-clients
ln -s ../../eslint.config.mjs .
```

Or create service-specific config:
```javascript
// services/service-clients/eslint.config.mjs
import rootConfig from '../../eslint.config.mjs';
export default rootConfig;
```

2. **Update package.json:**
```json
{
  "scripts": {
    "lint": "eslint \"{src,apps,libs,test}/**/*.ts\"",
    "lint:fix": "eslint \"{src,apps,libs,test}/**/*.ts\" --fix"
  },
  "devDependencies": {
    "@eslint/js": "^9.39.2",
    "eslint": "^9.39.2",
    "eslint-plugin-prettier": "^5.2.1",
    "globals": "^15.15.0",
    "typescript-eslint": "^8.50.1"
  }
}
```

3. **Run linter:**
```bash
npm run lint:fix
```

---

## 6. Adding Prettier Configuration

Services without `.prettierrc` should add it:

```bash
cd services/service-clients
cp ../../.prettierrc .
```

Or symlink:
```bash
ln -s ../../.prettierrc .
```

**Format code:**
```bash
npx prettier --write "src/**/*.ts"
```

---

## 7. Fixing Type Safety Issues

### Replace `any` with Proper Types

**Before:**
```typescript
private mapClientBase(entity: any): ClientBase {
  return {
    id: entity.id,
    nom: entity.nom,
    // ...
  };
}
```

**After:**
```typescript
import { ClientBaseEntity } from './entities/client-base.entity';

private mapClientBase(entity: ClientBaseEntity): ClientBase {
  return {
    id: entity.id,
    nom: entity.nom,
    // ...
  };
}
```

### Fix Error Handling Types

**Before:**
```typescript
catch (error: any) {
  this.logger.error(error.message);
}
```

**After:**
```typescript
catch (error) {
  const message = error instanceof Error ? error.message : 'Unknown error';
  this.logger.error(message, error instanceof Error ? error.stack : undefined);
}
```

---

## 8. Adding Validation with DTOs

### For Services Without DTOs:

1. **Create DTO directory:**
```bash
mkdir -p services/service-clients/src/modules/client-base/dto
```

2. **Create DTOs:**
```typescript
// services/service-clients/src/modules/client-base/dto/create-client-base.dto.ts
import { IsString, IsEmail, IsOptional, IsUUID, Length, Matches } from 'class-validator';

export class CreateClientBaseDto {
  @IsUUID()
  organisationId: string;

  @IsString()
  @Length(1, 100)
  nom: string;

  @IsString()
  @Length(1, 100)
  @IsOptional()
  prenom?: string;

  @IsString()
  @Matches(/^\+?[1-9]\d{1,14}$/, { message: 'Invalid phone number format' })
  telephone: string;

  @IsEmail()
  @IsOptional()
  email?: string;
}
```

3. **Use in service:**
```typescript
import { CreateClientBaseDto } from './dto/create-client-base.dto';

async create(dto: CreateClientBaseDto): Promise<ClientBaseEntity> {
  // Validation already done by ValidationPipe
  const client = this.repository.create(dto);
  return this.repository.save(client);
}
```

4. **Enable ValidationPipe in main.ts:**
```typescript
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(...);
  
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));
  
  await app.listen();
}
```

---

## 9. Adding Transaction Support

### For Multi-Step Operations:

**Before (No Transaction):**
```typescript
async create(input: CreateFactureInput): Promise<FactureEntity> {
  const facture = await this.factureRepository.save({ ... });
  
  // If this fails, you have inconsistent data!
  if (lignes.length > 0) {
    await this.ligneRepository.save(lignes);
  }
  
  return facture;
}
```

**After (With Transaction):**
```typescript
async create(input: CreateFactureInput): Promise<FactureEntity> {
  return this.factureRepository.manager.transaction(async (manager) => {
    const factureRepo = manager.getRepository(FactureEntity);
    const ligneRepo = manager.getRepository(LigneFactureEntity);
    
    const facture = await factureRepo.save({ ... });
    
    if (lignes.length > 0) {
      for (const ligne of lignes) {
        ligne.factureId = facture.id;
      }
      await ligneRepo.save(lignes);
    }
    
    return facture;
  });
}
```

---

## 10. Migration Checklist (Per Service)

Use this checklist when migrating a service:

- [ ] Install `@crm/shared` package
- [ ] Extend `tsconfig.base.json`
- [ ] Add/symlink `eslint.config.mjs`
- [ ] Add/symlink `.prettierrc`
- [ ] Run `npm run lint:fix`
- [ ] Run `npx prettier --write "src/**/*.ts"`
- [ ] Replace magic numbers with constants from `@crm/shared`
- [ ] Replace string literals with enums from `@crm/shared`
- [ ] Replace all `any` types with proper types
- [ ] Use `PaginationUtil` for all pagination logic
- [ ] Create DTOs for all inputs
- [ ] Add `ValidationPipe` in main.ts
- [ ] Add transactions for multi-step operations
- [ ] Add error logging in controllers
- [ ] Test all changes

---

## Priority Migration Order

Based on business criticality and usage:

### Phase 1 (Week 1) - Critical Services:
1. ✅ service-factures (already best practices)
2. service-clients
3. service-contrats
4. service-payments

### Phase 2 (Week 2) - Core Services:
5. service-commission
6. service-users
7. service-organisations
8. service-dashboard

### Phase 3 (Week 3) - Supporting Services:
9. service-products
10. service-commerciaux
11. service-notifications
12. service-logistics

### Phase 4 (Week 4) - Remaining Services:
13. service-email
14. service-documents
15. service-calendar
16. service-activites
17. service-referentiel
18. service-relance
19. service-retry

---

## Testing After Migration

For each migrated service:

```bash
# 1. Lint
npm run lint

# 2. Type check
npm run build

# 3. Run tests (if exist)
npm test

# 4. Manual testing
npm run start:dev
```

---

## Getting Help

If you encounter issues during migration:

1. Check this guide first
2. Review `service-factures` as reference implementation
3. Check `SECURITY.md` for security-related questions
4. Ask in team chat or create a discussion

---

**Last Updated:** January 20, 2026  
**Migration Lead:** Development Team
