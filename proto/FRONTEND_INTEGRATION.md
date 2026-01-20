# Frontend Integration Guide - Proto/gRPC

This guide explains how to integrate the generated proto files in your frontend application (React, Vue, Angular, etc.).

## Quick Start

### 1. Install Dependencies

```bash
cd frontend
npm install @connectrpc/connect @connectrpc/connect-web
```

### 2. Generate Proto Files

From the root directory:
```bash
npm run proto:generate
```

This will generate TypeScript files in `frontend/src/gen/`

### 3. Use in Your Frontend

```typescript
import { createPromiseClient } from "@connectrpc/connect";
import { createGrpcWebTransport } from "@connectrpc/connect-web";
import { PaymentService } from "./gen/payment_connect";

// Create transport
const transport = createGrpcWebTransport({
  baseUrl: "http://localhost:3000",
});

// Create client
const client = createPromiseClient(PaymentService, transport);

// Make requests
const response = await client.createStripeCheckoutSession({
  societeId: "123",
  amount: 2000,
  currency: "eur",
  mode: "payment",
  successUrl: "https://example.com/success",
  cancelUrl: "https://example.com/cancel",
});
```

## Available Services

All proto files are now centralized in `/proto`:

- **payment.proto** - Stripe, PayPal, GoCardless, Schedules, Payment Events
- **invoice.proto** - Invoice management and PDF generation
- **logistics.proto** - Shipping, parcels, tracking, Maileva integration
- **email.proto** - Email/mailbox management with OAuth2
- **notifications.proto** - Real-time notifications with WebSocket
- **commission.proto** - Commission calculation and management
- **mcp.proto** - AI tools integration

## Next Steps

1. **Install Buf CLI**:
   ```bash
   # macOS
   brew install bufbuild/buf/buf

   # Linux/WSL
   curl -sSL "https://github.com/bufbuild/buf/releases/latest/download/buf-$(uname -s)-$(uname -m)" -o /usr/local/bin/buf && chmod +x /usr/local/bin/buf

   # Or via npm
   npm install -g @bufbuild/buf
   ```

2. **Generate Code for Frontend and Backend**
   ```bash
   npm run proto:generate
   ```

   This will create:
   - `frontend/src/gen/` - TypeScript definitions for frontend
   - `backend/src/gen/proto/` - Node.js code for backend

3. **Add to Git**
   ```bash
   git add proto/
   ```

4. **Update Services** to use the centralized proto files:
   - Update import paths in microservices
   - Point to `/proto` directory instead of local `proto/` folders

## Next Steps

1. **Install Buf CLI**:
   ```bash
   # macOS
   brew install bufbuild/buf/buf

   # Linux
   curl -sSL "https://github.com/bufbuild/buf/releases/latest/download/buf-$(uname -s)-$(uname -m)" -o /usr/local/bin/buf && chmod +x /usr/local/bin/buf

   # Or via npm (global)
   npm install -g @bufbuild/buf
   ```

2. **Verify Installation**:
   ```bash
   buf --version
   ```

3. **Generate Code**:
   ```bash
   npm run proto:all
   ```

4. **Update Service References**: Update all microservices to use the generated code from the centralized proto directory.

## Generated Output

After running `buf generate`, code will be generated at:
- **Frontend**: `frontend/src/gen/` - TypeScript with Connect-RPC
- **Backend**: `backend/src/gen/proto/` - Node.js/TypeScript for NestJS

## Next Steps

1. **Install Buf**:
   ```bash
   # macOS
   brew install bufbuild/buf/buf

   # Linux
   curl -sSL "https://github.com/bufbuild/buf/releases/latest/download/buf-$(uname -s)-$(uname -m)" -o /usr/local/bin/buf && chmod +x /usr/local/bin/buf

   # Or via npm
   npm install -g @bufbuild/buf
   ```

2. **Generate Code**:
   ```bash
   npm run proto:all
   ```

3. **Frontend Setup**: Add Connect-RPC dependencies to your frontend
   ```bash
   cd frontend
   npm install @connectrpc/connect @connectrpc/connect-web
   ```

4. **Backend Setup**: The generated code will be in `backend/src/gen/proto/`

## Next Steps

1. Install Buf CLI (see README.md in proto/)
2. Run `npm run proto:generate` to generate code
3. Import generated types in your frontend and backend
4. Start using type-safe gRPC clients!

## Example Commands

```bash
# Lint all proto files
npm run proto:lint

# Generate code for frontend and backend
npm run proto:generate

# Check for breaking changes
npm run proto:breaking

# Format proto files
npm run proto:format

# Run all proto tasks (lint + generate)
npm run proto:all
```
