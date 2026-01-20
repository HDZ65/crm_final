# Proto/Buf Cheatsheet - Quick Reference

Quick reference for common proto/buf operations.

## 📋 Daily Commands

```bash
# Lint proto files
npm run proto:lint

# Generate code for frontend & backend
npm run proto:generate

# Check for breaking changes
npm run proto:breaking

# Format proto files
npm run proto:format

# Lint + Generate (recommended workflow)
npm run proto:all
```

## 🏗️ Buf Commands

```bash
# Install Buf
brew install bufbuild/buf/buf          # macOS
npm install -g @bufbuild/buf          # npm

# Verify installation
buf --version

# Lint
buf lint                               # Lint all protos
buf lint --error-format=json          # JSON output

# Generate
buf generate                          # Generate code
buf generate --path payment.proto     # Generate specific file

# Breaking changes
buf breaking --against '.git#branch=main'
buf breaking --against '.git#tag=v1.0.0'

# Format
buf format -w                         # Format in place
buf format --diff                     # Show diff
```

## 🧪 Testing with grpcurl

```bash
# List services
grpcurl -plaintext localhost:50051 list

# List methods
grpcurl -plaintext localhost:50051 list payment.PaymentService

# Describe method
grpcurl -plaintext localhost:50051 describe payment.PaymentService.CreateStripeCheckoutSession

# Call method
grpcurl -plaintext \
  -d '{"societeId":"123","amount":2000,"currency":"eur","mode":"payment","successUrl":"https://example.com/success","cancelUrl":"https://example.com/cancel"}' \
  localhost:50051 \
  payment.PaymentService/CreateStripeCheckoutSession
```

## 📦 Service Endpoints

| Service       | Port  | Package         | Proto File         |
|---------------|-------|-----------------|-------------------|
| Payment       | 50051 | payment         | payment.proto     |
| Invoice       | 50052 | invoice         | invoice.proto     |
| Logistics     | 50053 | logistics       | logistics.proto   |
| Email         | 50054 | email           | email.proto       |
| Notifications | 50055 | notifications   | notifications.proto|
| Commission    | 50056 | commission      | commission.proto  |
| MCP           | 50057 | mcp             | mcp.proto         |

## 🎯 Common Operations

### Payment Service

**Stripe Checkout:**
```bash
grpcurl -plaintext -d '{"societeId":"123","amount":2000,"currency":"eur","mode":"payment","successUrl":"https://example.com/success","cancelUrl":"https://example.com/cancel"}' localhost:50051 payment.PaymentService/CreateStripeCheckoutSession
```

**PayPal Order:**
```bash
grpcurl -plaintext -d '{"societeId":"123","intent":"CAPTURE","purchaseUnits":[{"amount":2999,"currency":"EUR"}],"returnUrl":"https://example.com/success","cancelUrl":"https://example.com/cancel"}' localhost:50051 payment.PaymentService/CreatePayPalOrder
```

**GoCardless Mandate:**
```bash
grpcurl -plaintext -d '{"clientId":"client-123","societeId":"societe-456","scheme":"sepa_core","successRedirectUrl":"https://example.com/success"}' localhost:50051 payment.PaymentService/SetupGoCardlessMandate
```

### Invoice Service

**Create Invoice:**
```bash
grpcurl -plaintext -d '{"customerName":"John Doe","customerEmail":"john@example.com","items":[{"description":"Service","quantity":1,"unitPriceHT":100,"vatRate":20}]}' localhost:50052 invoice.InvoiceService/CreateInvoice
```

**List Invoices:**
```bash
grpcurl -plaintext -d '{"limit":10,"offset":0}' localhost:50052 invoice.InvoiceService/FindAllInvoices
```

### Logistics Service

**Track Shipment:**
```bash
grpcurl -plaintext -d '{"trackingNumber":"1234567890"}' localhost:50053 logistics.LogisticsService/TrackShipment
```

### Email Service

**Send Email:**
```bash
grpcurl -plaintext -d '{"mailboxId":"mailbox-123","to":[{"email":"user@example.com"}],"subject":"Test","htmlBody":"<p>Hello</p>"}' localhost:50054 email.EmailService/SendEmail
```

### Notification Service

**Create Notification:**
```bash
grpcurl -plaintext -d '{"organisationId":"org-123","utilisateurId":"user-456","type":9,"titre":"Test","message":"Hello"}' localhost:50055 notifications.NotificationService/CreateNotification
```

### Commission Service

**Calculate Commission:**
```bash
grpcurl -plaintext -d '{"organisationId":"org-123","apporteurId":"app-456","contratId":"contrat-789","typeProduit":"ASSURANCE","montantBase":"10000","periode":"2024-01"}' localhost:50056 commission.CommissionService/CalculerCommission
```

## 🔧 Troubleshooting

### Buf not found
```bash
which buf                             # Check if installed
brew install bufbuild/buf/buf         # Reinstall (macOS)
npm install -g @bufbuild/buf         # Reinstall (npm)
```

### Generation fails
```bash
# Check paths
cat proto/buf.gen.yaml

# Create output dirs
mkdir -p frontend/src/gen
mkdir -p backend/src/gen/proto

# Try again
cd proto && buf generate
```

### grpcurl connection refused
```bash
# Check if service is running
lsof -i :50051

# Start service
cd backend && npm run start:dev
```

### Import errors in code
```bash
# Regenerate
npm run proto:generate

# Install dependencies
cd frontend && npm install @connectrpc/connect @connectrpc/connect-web
```

## 📁 File Structure

```
proto/
├── buf.yaml                    # Buf config
├── buf.gen.yaml               # Generation config
├── *.proto                    # Proto definitions
├── examples/
│   ├── frontend-client-example.ts
│   ├── backend-nestjs-example.ts
│   └── testing-guide.md
├── README.md                  # Complete docs
├── FRONTEND_INTEGRATION.md    # Frontend guide
├── MIGRATION_GUIDE.md         # Migration guide
└── CHEATSHEET.md             # This file
```

## 🚀 Quick Start

**First time setup:**
```bash
# 1. Install Buf
brew install bufbuild/buf/buf

# 2. Generate code
npm run proto:generate

# 3. Install frontend deps
cd frontend
npm install @connectrpc/connect @connectrpc/connect-web

# 4. Start services
cd ../backend && npm run start:dev
```

**Daily workflow:**
```bash
# 1. Edit proto file
vim proto/payment.proto

# 2. Lint
npm run proto:lint

# 3. Generate
npm run proto:generate

# 4. Test
npm test

# 5. Commit
git add proto/
git commit -m "feat: add new payment method"
```

## 📚 Documentation Links

- **[README.md](README.md)** - Full documentation
- **[FRONTEND_INTEGRATION.md](FRONTEND_INTEGRATION.md)** - Frontend setup
- **[MIGRATION_GUIDE.md](MIGRATION_GUIDE.md)** - Migration guide
- **[examples/](examples/)** - Code examples

## 🔗 External Resources

- [Buf Documentation](https://buf.build/docs)
- [gRPC Documentation](https://grpc.io/docs/)
- [Connect-RPC](https://connectrpc.com/docs/)
- [Protocol Buffers](https://protobuf.dev/)
- [grpcurl](https://github.com/fullstorydev/grpcurl)

## 💡 Tips

1. **Always lint before committing**: `npm run proto:lint`
2. **Check breaking changes**: `npm run proto:breaking`
3. **Use optional for new fields**: Maintains backwards compatibility
4. **Never remove fields**: Only add, never delete or rename
5. **Document changes**: Update comments in proto files
6. **Test locally**: Use grpcurl before deploying
7. **Regenerate after changes**: `npm run proto:generate`

## 🎓 Proto Best Practices

```protobuf
// ✅ GOOD
message CreateUserRequest {
  string name = 1;              // Required fields first
  string email = 2;
  optional string phone = 3;    // Optional fields after
  optional string address = 4;
}

// ❌ BAD
message CreateUserRequest {
  optional string address = 1;  // Optional first (confusing)
  string name = 2;              // Required after (bad order)
}
```

```protobuf
// ✅ GOOD - Explicit enum zero value
enum Status {
  STATUS_UNSPECIFIED = 0;      // Always define zero
  STATUS_ACTIVE = 1;
  STATUS_INACTIVE = 2;
}

// ❌ BAD - No zero value
enum Status {
  ACTIVE = 1;                  // Missing zero value
  INACTIVE = 2;
}
```

```protobuf
// ✅ GOOD - Descriptive comments
message Invoice {
  string id = 1;               // Unique invoice identifier
  int64 amount = 2;            // Amount in cents (e.g., 2000 = €20.00)
  string currency = 3;         // ISO 4217 currency code (e.g., "EUR")
}

// ❌ BAD - No comments
message Invoice {
  string id = 1;
  int64 amount = 2;
  string currency = 3;
}
```

## 🆘 Quick Help

**Need help?**
1. Check this cheatsheet
2. Read [README.md](README.md)
3. Check examples in [examples/](examples/)
4. Review official docs
5. Ask the team

**Common issues:**
- Generation fails → Check output dirs exist
- Import errors → Run `npm run proto:generate`
- Connection refused → Check service is running
- Buf not found → Reinstall Buf CLI
