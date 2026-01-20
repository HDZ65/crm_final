# Migration Guide - Centralized Proto Directory

This guide helps you migrate existing microservices to use the centralized proto directory.

## What Changed?

**Before:**
```
backend/proto/payment.proto
service-factures/proto/invoice.proto
service-logistics/proto/logistics.proto
service-email/proto/email.proto
service-notifications/proto/notifications.proto
service-commission/proto/commission.proto
```

**After:**
```
proto/                          # Centralized at root
├── payment.proto
├── invoice.proto
├── logistics.proto
├── email.proto
├── notifications.proto
├── commission.proto
└── mcp.proto
```

## Benefits

1. **Single Source of Truth**: All proto definitions in one place
2. **Easier Frontend Integration**: Generate code once for all services
3. **Better Version Control**: Track changes to all APIs in one location
4. **Simplified Maintenance**: Update proto files without navigating multiple directories
5. **Buf Integration**: Centralized linting, breaking change detection, and code generation

## Migration Steps for Each Microservice

### Step 1: Update Proto Import Paths

**service-factures (Invoice Service)**

Update `src/main.ts` or gRPC server configuration:

```typescript
// Before
const PROTO_PATH = path.join(__dirname, '../proto/invoice.proto');

// After
const PROTO_PATH = path.join(__dirname, '../../proto/invoice.proto');
```

### Step 2: Update Package.json Scripts

**service-factures/package.json**

```json
{
  "scripts": {
    "proto:generate": "cd ../proto && buf generate",
    "proto:lint": "cd ../proto && buf lint"
  }
}
```

### Step 3: Update Docker Compose (if applicable)

If using Docker Compose with volume mounts:

```yaml
# docker-compose.yml
services:
  invoice-service:
    volumes:
      - ./proto:/app/proto:ro  # Mount centralized proto directory
```

### Step 4: Update NestJS gRPC Module Configuration

**For each microservice using @nestjs/microservices:**

```typescript
import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { join } from 'path';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'INVOICE_PACKAGE',
        transport: Transport.GRPC,
        options: {
          package: 'invoice',
          // Update path to use centralized proto
          protoPath: join(__dirname, '../../proto/invoice.proto'),
          url: 'localhost:50051',
        },
      },
    ]),
  ],
})
export class InvoiceModule {}
```

### Step 5: Update Generated Code Imports

**Backend (NestJS)**

If using generated code:
```typescript
// Before
import { PaymentServiceClient } from './gen/payment';

// After
import { PaymentServiceClient } from '../../../backend/src/gen/proto/payment';
```

**Frontend**

```typescript
// Before (if you had separate generations)
import { InvoiceService } from './gen/invoice';

// After
import { InvoiceService } from './gen/invoice_connect';
```

## Service-by-Service Migration Checklist

### Backend (Main API)

- [x] Proto files copied to `/proto`
- [ ] Update imports in gRPC service configurations
- [ ] Update proto paths in `app.module.ts` or main.ts
- [ ] Test gRPC endpoints still work
- [ ] Remove old `/backend/proto` directory

### Service-Factures (Invoice)

- [x] Proto files copied to `/proto`
- [ ] Update `src/main.ts` proto path
- [ ] Update gRPC client configuration
- [ ] Test invoice generation
- [ ] Remove old `/service-factures/proto` directory

### Service-Payments

- [x] Proto files copied to `/proto`
- [ ] Update payment service configuration
- [ ] Test Stripe, PayPal, GoCardless integrations
- [ ] Remove old proto directory

### Service-Logistics

- [x] Proto files copied to `/proto`
- [ ] Update expedition tracking service
- [ ] Test Maileva integration
- [ ] Remove old `/service-logistics/proto` directory

### Service-Email

- [x] Proto files copied to `/proto`
- [ ] Update OAuth2 service configuration
- [ ] Test Google/Microsoft email integration
- [ ] Remove old `/service-email/proto` directory

### Service-Notifications

- [x] Proto files copied to `/proto`
- [ ] Update WebSocket notification service
- [ ] Test real-time notifications
- [ ] Remove old `/service-notifications/proto` directory

### Service-Commission

- [x] Proto files copied to `/proto`
- [ ] Update commission calculation engine
- [ ] Test bareme and bordereau generation
- [ ] Remove old `/service-commission/proto` directory

## Testing After Migration

1. **Run Code Generation**
   ```bash
   npm run proto:generate
   ```

2. **Start All Services**
   ```bash
   # Backend
   cd backend && npm run start:dev

   # Each microservice
   cd service-factures && npm run start:dev
   cd service-payments && npm run start:dev
   # ... etc
   ```

3. **Test gRPC Endpoints**
   ```bash
   # Use grpcurl to test each service
   grpcurl -plaintext localhost:50051 list
   grpcurl -plaintext localhost:50051 invoice.InvoiceService/FindAllInvoices
   ```

4. **Test Frontend Integration**
   ```bash
   cd frontend && npm run dev
   ```

## Rollback Plan

If something goes wrong:

1. **Keep Old Proto Files**: Don't delete old proto directories until migration is confirmed working
2. **Git Revert**: Use git to revert changes if needed
3. **Dual Configuration**: Temporarily support both old and new paths during transition

## Common Issues & Solutions

### Issue: Cannot find proto file

**Error:**
```
Error: Cannot find module '../proto/invoice.proto'
```

**Solution:**
Update the proto path to point to the root `/proto` directory:
```typescript
const protoPath = join(__dirname, '../../proto/invoice.proto');
```

### Issue: Generated code not found

**Error:**
```
Cannot find module './gen/proto/payment'
```

**Solution:**
Run code generation first:
```bash
npm run proto:generate
```

### Issue: Breaking changes detected

**Error:**
```
buf breaking: breaking changes detected
```

**Solution:**
Review changes carefully. If intentional, document them and inform all teams:
```bash
# Check what changed
buf breaking --against '.git#branch=main'

# Exclude specific files if needed
buf breaking --against '.git#branch=main' --exclude-path payment.proto
```

### Issue: Different proto versions in services

**Problem:** Services using different versions of the same proto file

**Solution:**
1. Merge proto definitions carefully
2. Use optional fields for new additions
3. Never remove or rename existing fields
4. Communicate changes to all teams

## Post-Migration

1. **Delete Old Proto Directories**
   ```bash
   rm -rf backend/proto
   rm -rf service-factures/proto
   rm -rf service-logistics/proto
   rm -rf service-email/proto
   rm -rf service-notifications/proto
   rm -rf service-commission/proto
   ```

2. **Update Documentation**
   - Update README files in each service
   - Update architecture diagrams
   - Update onboarding docs for new developers

3. **Set Up CI/CD**
   ```yaml
   # .github/workflows/proto.yml
   name: Proto Validation

   on: [push, pull_request]

   jobs:
     validate:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v3
         - uses: bufbuild/buf-setup-action@v1
         - run: buf lint
         - run: buf breaking --against '.git#branch=main'
   ```

4. **Train Team**
   - Share this migration guide
   - Demo the new workflow
   - Update team documentation

## Support

If you encounter issues during migration:

1. Check this guide first
2. Review proto/README.md
3. Test with `buf lint` and `buf generate`
4. Consult Buf documentation: https://buf.build/docs
5. Contact the platform team

## Timeline

Recommended migration timeline:

- **Week 1**: Set up centralized proto directory (✅ Done)
- **Week 2**: Migrate backend and 2-3 microservices
- **Week 3**: Migrate remaining microservices
- **Week 4**: Frontend integration and testing
- **Week 5**: Production deployment and monitoring
