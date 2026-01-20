# Proto Files - CRM Final

This directory contains all Protocol Buffer (protobuf) definitions for the CRM system's gRPC services.

## Overview

All microservices share the same proto definitions centralized in this directory. This ensures consistency across the entire system and simplifies frontend/backend integration.

## Structure

```
proto/
├── buf.yaml              # Buf configuration (linting, breaking changes)
├── buf.gen.yaml         # Code generation configuration
├── payment.proto        # Payment service (Stripe, PayPal, GoCardless, etc.)
├── invoice.proto        # Invoice/billing service
├── logistics.proto      # Logistics/shipping service
├── email.proto          # Email service (OAuth2 integration)
├── notifications.proto  # Real-time notifications service
├── commission.proto     # Commission calculation service
└── mcp.proto           # MCP tools service for AI integration
```

## Services

### Payment Service (`payment.proto`)
Unified payment service supporting multiple PSPs:
- **Stripe**: Checkout, Payment Intents, Subscriptions, Refunds
- **PayPal**: Orders, Capture, Authorization
- **GoCardless**: Direct Debit mandates, Subscriptions
- **Schedules**: Recurring payment automation
- **Events**: Payment event tracking and webhook handling

### Invoice Service (`invoice.proto`)
Complete invoicing system:
- Create, validate, and manage invoices
- Credit note generation
- PDF generation with white-label branding
- Multi-currency support

### Logistics Service (`logistics.proto`)
Shipping and expedition management:
- Expedition tracking
- Parcel (colis) management
- Carrier accounts (transporteur)
- Maileva integration for label generation
- Address validation and pricing simulation

### Email Service (`email.proto`)
Email integration with OAuth2:
- Mailbox management (Gmail, Outlook, SMTP)
- OAuth2 authentication (Google, Microsoft)
- Send/receive emails
- Template support

### Notifications Service (`notifications.proto`)
Real-time notification system:
- Create and manage notifications
- WebSocket integration
- Business-specific notifications (contracts, tasks, alerts)
- Organization-wide broadcasts

### Commission Service (`commission.proto`)
Commission calculation and management:
- Commission CRUD
- Bareme (commission scale) with paliers (tiers)
- Bordereau (commission statements)
- Reprise (commission clawback) handling
- Automated commission engine

### MCP Service (`mcp.proto`)
AI tools integration:
- List available AI tools
- Execute tools with parameters
- Integration with Claude/LLM systems

## Installation

### Prerequisites

Install Buf CLI:
```bash
# macOS
brew install bufbuild/buf/buf

# Linux
curl -sSL "https://github.com/bufbuild/buf/releases/latest/download/buf-$(uname -s)-$(uname -m)" -o /usr/local/bin/buf
chmod +x /usr/local/bin/buf

# Windows
npm install -g @bufbuild/buf
```

### Verify Installation
```bash
buf --version
```

## Usage

### 1. Lint Proto Files
```bash
cd proto
buf lint
```

### 2. Generate Code

Generate TypeScript for frontend and JavaScript/TypeScript for backend:
```bash
cd proto
buf generate
```

This will create:
- `frontend/src/gen/` - TypeScript code for frontend (Connect-RPC compatible)
- `backend/src/gen/proto/` - Node.js/TypeScript code for NestJS backend

### 3. Check Breaking Changes

Before deploying changes, verify compatibility:
```bash
buf breaking --against '.git#branch=main'
```

### 4. Format Proto Files
```bash
buf format -w
```

## NPM Scripts

Add to your `package.json`:

```json
{
  "scripts": {
    "proto:lint": "cd proto && buf lint",
    "proto:generate": "cd proto && buf generate",
    "proto:breaking": "cd proto && buf breaking --against '.git#branch=main'",
    "proto:format": "cd proto && buf format -w",
    "proto:all": "npm run proto:lint && npm run proto:generate"
  }
}
```

Then use:
```bash
npm run proto:all
```

## Frontend Integration

### Install Dependencies
```bash
npm install @connectrpc/connect @connectrpc/connect-web
```

### Example Usage (React/TypeScript)
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

// Use the client
const response = await client.createStripeCheckoutSession({
  societeId: "123",
  amount: 2000,
  currency: "eur",
  mode: "payment",
  successUrl: "https://example.com/success",
  cancelUrl: "https://example.com/cancel",
});

console.log(response.url); // Redirect to Stripe
```

## Backend Integration (NestJS)

### Install Dependencies
```bash
npm install @grpc/grpc-js @grpc/proto-loader
```

### Example Usage
```typescript
import { Injectable } from '@nestjs/common';
import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';

@Injectable()
export class PaymentGrpcClient {
  private client: any;

  constructor() {
    const packageDefinition = protoLoader.loadSync(
      'proto/payment.proto',
      { keepCase: true, longs: String, enums: String, defaults: true }
    );

    const proto = grpc.loadPackageDefinition(packageDefinition);
    this.client = new proto.payment.PaymentService(
      'localhost:50051',
      grpc.credentials.createInsecure()
    );
  }

  async createCheckoutSession(request: any): Promise<any> {
    return new Promise((resolve, reject) => {
      this.client.CreateStripeCheckoutSession(request, (error, response) => {
        if (error) reject(error);
        else resolve(response);
      });
    });
  }
}
```

## Development Workflow

1. **Modify Proto Files**: Edit `.proto` files in this directory
2. **Lint**: `buf lint` to check for issues
3. **Generate**: `buf generate` to regenerate code
4. **Test**: Test changes in frontend/backend
5. **Breaking Check**: `buf breaking` before committing
6. **Commit**: Commit proto changes with generated code

## Best Practices

1. **Versioning**: Never remove or rename fields, only add new ones
2. **Backwards Compatibility**: Use `optional` for new fields
3. **Comments**: Document all messages and services
4. **Naming**: Use snake_case for field names
5. **Organization**: Group related messages and services
6. **Enums**: Always include a zero-value (e.g., `UNSPECIFIED`)

## Multi-Tenant Support

All services support multi-tenancy via:
- `organisation_id`: Top-level organization
- `societe_id`: Sub-organization/company within organization

Always include these fields in requests for proper data isolation.

## Resources

- [Protocol Buffers Documentation](https://protobuf.dev/)
- [Buf Documentation](https://buf.build/docs)
- [gRPC Documentation](https://grpc.io/docs/)
- [Connect-RPC Documentation](https://connectrpc.com/docs/)
- [NestJS gRPC](https://docs.nestjs.com/microservices/grpc)

## Troubleshooting

### Buf Command Not Found
Ensure Buf is installed and in your PATH. Try reinstalling:
```bash
npm install -g @bufbuild/buf
```

### Generation Fails
1. Check `buf.gen.yaml` paths are correct
2. Ensure output directories exist
3. Verify all imports are valid

### Breaking Changes Detected
Review changes carefully. If intentional:
```bash
buf breaking --against '.git#branch=main' --exclude-path path/to/file.proto
```

## Support

For issues or questions:
1. Check this README
2. Review proto comments
3. Consult Buf/gRPC documentation
4. Contact the development team
