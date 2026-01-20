# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a NestJS backend for a CRM/white-label partner management system, built with **Clean Architecture** principles. The system manages clients (persons and enterprises), partners, contracts, invoicing, and activities in a multi-tenant environment.

## Architecture

### Clean Architecture Layers

The codebase follows strict Clean Architecture with clear separation:

```
src/
├── core/                    # Domain layer (business logic, pure TypeScript)
│   ├── domain/             # Domain entities (business models)
│   └── port/               # Repository interfaces (ports)
├── applications/           # Application layer (use cases & DTOs)
│   ├── usecase/           # Business use cases (CRUD operations)
│   ├── dto/               # Data Transfer Objects
│   └── mapper/            # Domain ↔ Persistence mappers
└── infrastructure/        # Infrastructure layer (frameworks & external)
    ├── framework/nest/    # NestJS specific code
    │   ├── http/         # HTTP controllers
    │   └── app.module.ts # Dependency injection wiring
    ├── db/               # Database schemas/entities
    │   └── entities/     # TypeORM entities
    └── repositories/     # Repository implementations
```

### Key Patterns

1. **Dependency Inversion**: Domain entities define interfaces (ports), infrastructure implements them
2. **Mappers**: Separate domain entities from persistence entities using explicit mappers in `applications/mapper/`
3. **Use Cases**: Each business operation is a separate injectable use case class
4. **Port-Adapter**: Repositories implement port interfaces defined in `core/port/`

### Data Flow

```
Controller → Use Case → Repository Port → Repository Impl → TypeORM Entity
     ↓                                                            ↓
   DTO Response ← Domain Entity ← Mapper ← Persistence Entity
```

## Common Commands

### Development
```bash
npm run start:dev          # Start in watch mode
npm run start:debug        # Start with debugger
npm run start:prod         # Production mode
```

### Build & Quality
```bash
npm run build             # Compile TypeScript
npm run lint              # Run ESLint with auto-fix
npm run format            # Format with Prettier
```

### Testing
```bash
npm test                  # Run unit tests
npm run test:watch        # Run tests in watch mode
npm run test:cov          # Generate coverage report
npm run test:e2e          # Run e2e tests
npm run test:debug        # Debug tests
```

### Database
```bash
docker-compose up -d      # Start PostgreSQL container
# Set DB_SYNCHRONIZE=true in .env for development (disabled by default for safety)
```

### Code Generation
```bash
npm run make:feature      # Generate complete feature with Plop
```

This interactive generator creates:
- Domain entity (`core/domain/`)
- Repository port (`core/port/`)
- Mapper (`applications/mapper/`)
- DTOs: create, update, response (`applications/dto/`)
- Use cases: create, get, update, delete (`applications/usecase/`)
- TypeORM entity (`infrastructure/db/entities/`)
- Repository implementation (`infrastructure/repositories/`)
- HTTP Controller (`infrastructure/framework/nest/http/`)
- Auto-wires everything in `app.module.ts`

## Database Architecture

- **Primary DB**: PostgreSQL (via TypeORM)
- **Future Support**: MongoDB can be added via plop generator (currently uses TypeORM only)
- **Schema Sync**: Disabled by default for safety. Set `DB_SYNCHRONIZE=true` in dev mode only.
- **Inheritance**: Uses Table-Per-Concrete-Class (e.g., `ClientBase` → `ClientEntreprise`)

### Environment Variables

Configure in `.env` or use defaults:
```env
# Database
DB_TYPE=postgres           # Database type (postgres or mongo)
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=postgres
DB_SYNCHRONIZE=true        # Set to true for dev only, false in production!

# Server
PORT=3000

# OAuth2 (optional, for email integration)
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/oauth/callback/google

MICROSOFT_CLIENT_ID=your-app-id
MICROSOFT_CLIENT_SECRET=your-secret
MICROSOFT_REDIRECT_URI=http://localhost:3000/oauth/callback/microsoft
```

## Domain Model

See [crm_class_diagram_whitelabel.mmd](crm_class_diagram_whitelabel.mmd) for complete entity relationship diagram.

### Core Entities

- **ClientBase**: Base client (person/enterprise) with inheritance to `ClientEntreprise`
- **Utilisateur**: CRM users with role-based access
- **BoiteMail**: Email mailboxes (OAuth2 or SMTP/IMAP) linked to users
- **Contrat**: Contract with lines, status history, attachments
- **Facture**: Invoices linked to contracts and clients
- **PartenaireMarqueBlanche**: White-label partners with themes and pricing grids
- **Activite**: Activity tracking for clients/contracts
- **Produit**: Products with pricing grids

## Adding New Features

### Manual Steps

1. **Domain Entity** (`core/domain/`): Define business model extending `BaseEntity`
2. **Repository Port** (`core/port/`): Define interface extending `BaseRepositoryPort<T>`
3. **Mapper** (`applications/mapper/`): Create bidirectional mapper (toDomain/toPersistence)
4. **DTOs** (`applications/dto/`): Create, Update, Response DTOs
5. **Use Cases** (`applications/usecase/`): CRUD use cases injecting repository port
6. **TypeORM Entity** (`infrastructure/db/entities/`): Define database schema
7. **Repository** (`infrastructure/repositories/`): Implement port interface
8. **Controller** (`infrastructure/framework/nest/http/`): REST endpoints
9. **Wire in app.module.ts**: Add imports, controllers, providers

### Using Plop Generator (Recommended)

Run `npm run make:feature` and answer prompts. It handles all the above automatically.

## Important Conventions

### Naming

- **Domain entities**: `EntityName + Entity` (e.g., `ClientBaseEntity`)
- **TypeORM entities**: Same name but in `infrastructure/db/entities/`
- **Repository ports**: `EntityName + RepositoryPort`
- **Repository implementations**: `TypeOrm + EntityName + Repository`
- **Use cases**: `Verb + EntityName + UseCase` (e.g., `CreateClientBaseUseCase`)
- **DTOs**: `Verb + EntityName + Dto` or `EntityName + ResponseDto`
- **Controllers**: `EntityName + Controller`

### File Structure

- Use kebab-case for file names: `client-base.entity.ts`
- Group by feature: each feature has its own folder in `dto/` and `usecase/`
- Keep one class per file

### Dependency Injection

- Repository ports are injected by string token: `@Inject('EntityNameRepositoryPort')`
- Providers bind ports to implementations in `app.module.ts`
- Use cases and controllers use constructor injection

## API Documentation

- **Swagger/OpenAPI**: Available at `http://localhost:3000/docs` when running
- Auto-generated from decorators and DTOs
- Use `@nestjs/swagger` decorators for better documentation

## Validation

- Global validation pipe enabled in `main.ts`
- Uses `class-validator` decorators in DTOs
- Strict mode: `whitelist: true`, `forbidNonWhitelisted: true`
- Auto-transforms types

## Code Generation Markers

The `app.module.ts` uses plop marker comments for code generation:
```typescript
// <plop:imports>
// <plop:modules>
// <plop:controllers>
// <plop:providers>
```

Do not remove these markers - they enable automated feature generation.

## Multi-Database Support

The plop generator supports PostgreSQL and MongoDB. The app.module.ts conditionally loads:
- TypeORM for PostgreSQL (`DB_TYPE=postgres` or unset)
- Mongoose for MongoDB (`DB_TYPE=mongo`)
- Both can coexist with runtime switching

## Mapper Pattern

Always use mappers in `applications/mapper/` to convert between:
- **Domain entities**: Business logic, in-memory objects
- **Persistence entities**: Database schemas, framework-specific

Mappers have two methods:
- `toDomain(persistence: OrmEntity): DomainEntity`
- `toPersistence(domain: DomainEntity): Partial<OrmEntity>`

## Additional Documentation

- **[OAUTH2_GUIDE.md](OAUTH2_GUIDE.md)** - Complete OAuth2 integration guide with Google/Microsoft setup
- **[MAILBOX_FEATURE_SUMMARY.md](MAILBOX_FEATURE_SUMMARY.md)** - Detailed summary of email/mailbox features
- **[crm_class_diagram_whitelabel.mmd](crm_class_diagram_whitelabel.mmd)** - Complete entity relationship diagram

## Key Dependencies

**Core Framework:**
- `@nestjs/core`, `@nestjs/common` - NestJS framework
- `@nestjs/typeorm`, `typeorm` - ORM for PostgreSQL
- `@nestjs/config` - Configuration management
- `@nestjs/swagger` - API documentation

**Validation & Transformation:**
- `class-validator` - DTO validation
- `class-transformer` - Type transformation

**OAuth2 & Email:**
- `googleapis` - Google OAuth2 & Gmail API
- `@azure/msal-node` - Microsoft Authentication Library
- `@microsoft/microsoft-graph-client` - Microsoft Graph API
- `axios` - HTTP client

**Database:**
- `pg` - PostgreSQL driver

## Common Pitfalls & Solutions

### Repository Method Names
Custom repository methods should be added to both:
1. Port interface (`core/port/xxx-repository.port.ts`)
2. Implementation (`infrastructure/repositories/typeorm-xxx.repository.ts`)

Example: `findByUtilisateurId()` must be in both `BoiteMailRepositoryPort` and `TypeOrmBoiteMailRepository`

### OAuth2 Token Refresh
- Google: Returns new refresh token only on first authorization with `prompt: 'consent'`
- Microsoft: MSAL handles token cache internally, refresh token not directly accessible
- Always check `tokenExpiration` before using access tokens
- Use `RefreshOAuthTokenUseCase` to refresh expired tokens

### Plop Markers
Never remove `// <plop:xxx>` markers in `app.module.ts` - they enable code generation

### TypeORM Entities vs Domain Entities
- TypeORM entities (`infrastructure/db/entities/`) - Database schema, framework-specific
- Domain entities (`core/domain/`) - Business logic, framework-agnostic
- Always use mappers to convert between them

## Stripe Integration (Payments & Subscriptions)

### Overview

The system integrates Stripe for card payments, subscriptions, and checkout sessions. The integration follows the existing multi-PSP architecture with `PSPName.STRIPE`.

### Architecture

```
src/
├── applications/dto/stripe/           # Stripe-specific DTOs
│   ├── create-checkout-session.dto.ts
│   ├── create-stripe-payment-intent.dto.ts
│   ├── create-stripe-customer.dto.ts
│   ├── create-stripe-subscription.dto.ts
│   ├── create-refund.dto.ts
│   └── stripe-response.dto.ts
└── infrastructure/
    ├── services/stripe/               # Stripe services
    │   ├── stripe.service.ts          # Main Stripe API client
    │   └── stripe-webhook.service.ts  # Webhook event handlers
    └── framework/nest/payment/
        └── controllers/stripe.controller.ts  # REST endpoints
```

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/stripe/checkout/sessions` | Create a Checkout Session (hosted payment page) |
| POST | `/stripe/payment-intents` | Create a Payment Intent (custom flow) |
| GET | `/stripe/payment-intents/:id` | Retrieve Payment Intent |
| POST | `/stripe/payment-intents/:id/cancel` | Cancel Payment Intent |
| POST | `/stripe/customers` | Create a Stripe Customer |
| GET | `/stripe/customers/:id` | Retrieve Customer |
| POST | `/stripe/subscriptions` | Create a Subscription |
| GET | `/stripe/subscriptions/:id` | Retrieve Subscription |
| DELETE | `/stripe/subscriptions/:id` | Cancel Subscription |
| POST | `/stripe/refunds` | Create a Refund |
| POST | `/stripe/webhooks` | Handle Stripe Webhooks |

### Environment Variables

```env
STRIPE_SECRET_KEY=sk_test_xxx        # Backend secret key
STRIPE_PUBLISHABLE_KEY=pk_test_xxx   # Frontend public key
STRIPE_WEBHOOK_SECRET=whsec_xxx      # Webhook signature verification
```

### Webhook Events Handled

- `payment_intent.succeeded` - Payment successful
- `payment_intent.payment_failed` - Payment failed
- `payment_intent.processing` - Payment processing
- `payment_intent.canceled` - Payment cancelled
- `checkout.session.completed` - Checkout completed
- `checkout.session.expired` - Checkout expired
- `customer.subscription.created` - Subscription created
- `customer.subscription.updated` - Subscription updated
- `customer.subscription.deleted` - Subscription cancelled
- `invoice.paid` - Invoice paid (for subscriptions)
- `invoice.payment_failed` - Invoice payment failed
- `charge.refunded` - Refund processed

### Usage Example (Backend)

```typescript
// Inject StripeService
constructor(private readonly stripeService: StripeService) {}

// Create a checkout session
const session = await this.stripeService.createCheckoutSession({
  amount: 2000, // 20.00 EUR in cents
  currency: 'eur',
  mode: 'payment',
  successUrl: 'https://yoursite.com/success',
  cancelUrl: 'https://yoursite.com/cancel',
  metadata: { orderId: '12345' },
});

// Create a customer
const customer = await this.stripeService.createCustomer({
  email: 'client@example.com',
  name: 'John Doe',
});

// Create a subscription
const subscription = await this.stripeService.createSubscription({
  customerId: customer.id,
  priceId: 'price_xxx',
});
```

### Frontend Integration

1. Install Stripe.js: `npm install @stripe/stripe-js`
2. Load Stripe with publishable key
3. Redirect to Checkout URL or use Elements for custom forms

```typescript
// Redirect to Stripe Checkout
const response = await fetch('/stripe/checkout/sessions', {
  method: 'POST',
  body: JSON.stringify({ amount: 2000, currency: 'eur', mode: 'payment', ... }),
});
const { url } = await response.json();
window.location.href = url;
```

### Testing

Use Stripe test card: `4242 4242 4242 4242` (any future date, any CVC)

For webhooks, use Stripe CLI:
```bash
stripe listen --forward-to localhost:3000/stripe/webhooks
```

## PayPal Integration (Payments & Subscriptions)

### Overview

The system integrates PayPal for online payments using the Orders API v2. The integration follows the multi-PSP architecture with `PSPName.PAYPAL`.

### Architecture

```
src/
├── applications/dto/paypal/           # PayPal operation DTOs
│   ├── create-paypal-order.dto.ts
│   ├── capture-paypal-order.dto.ts
│   └── paypal-response.dto.ts
├── applications/dto/paypal-account/   # Account configuration DTOs
│   ├── create-paypal-account.dto.ts
│   └── paypal-account-response.dto.ts
├── core/
│   ├── domain/paypal-account.entity.ts  # Domain entity
│   └── port/paypal-account-repository.port.ts
└── infrastructure/
    ├── db/entities/paypal-account.entity.ts  # TypeORM entity
    ├── services/paypal/               # PayPal services
    │   ├── paypal.service.ts          # Main PayPal API client
    │   └── paypal-webhook.service.ts  # Webhook event handlers
    └── framework/nest/payment/
        └── controllers/
            ├── paypal.controller.ts           # Payment operations
            └── paypal-account.controller.ts   # Account management
```

### API Endpoints

**Account Management:**
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/paypal-accounts` | Create a PayPal account for a société |
| GET | `/paypal-accounts` | List all accounts |
| GET | `/paypal-accounts/active` | List active accounts |
| GET | `/paypal-accounts/:id` | Get account by ID |
| GET | `/paypal-accounts/societe/:societeId` | Get account by société |
| PUT | `/paypal-accounts/:id` | Update account |
| DELETE | `/paypal-accounts/:id` | Delete account |

**Payment Operations:**
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/paypal/orders` | Create a PayPal order |
| GET | `/paypal/orders/:id` | Retrieve order (header: x-societe-id) |
| POST | `/paypal/orders/:id/capture` | Capture an approved order |
| POST | `/paypal/orders/:id/authorize` | Authorize order (no immediate capture) |
| POST | `/paypal/webhooks` | Handle PayPal Webhooks |

### Webhook Events Handled

- `CHECKOUT.ORDER.APPROVED` - Order approved by buyer
- `CHECKOUT.ORDER.COMPLETED` - Order completed
- `PAYMENT.CAPTURE.COMPLETED` - Payment captured successfully
- `PAYMENT.CAPTURE.DENIED` - Payment denied
- `PAYMENT.CAPTURE.PENDING` - Payment pending
- `PAYMENT.CAPTURE.REFUNDED` - Payment refunded
- `BILLING.SUBSCRIPTION.CREATED` - Subscription created
- `BILLING.SUBSCRIPTION.ACTIVATED` - Subscription active
- `BILLING.SUBSCRIPTION.CANCELLED` - Subscription cancelled
- `PAYMENT.SALE.COMPLETED` - Recurring payment successful

### Usage Example (Backend)

```typescript
// Inject PaypalService
constructor(private readonly paypalService: PaypalService) {}

// Create an order
const order = await this.paypalService.createOrder({
  societeId: 'your-societe-id',
  intent: 'CAPTURE',
  purchaseUnits: [{
    amount: 2999, // 29.99 EUR in cents
    currency: 'EUR',
    description: 'Product purchase',
  }],
  returnUrl: 'https://yoursite.com/success',
  cancelUrl: 'https://yoursite.com/cancel',
});

// Redirect user to: order.approveUrl

// After user approval, capture the payment
const captured = await this.paypalService.captureOrder({
  societeId: 'your-societe-id',
  orderId: order.id,
});
```

### Frontend Integration

PayPal uses a dynamically loaded SDK. See [PAYPAL_FRONTEND_GUIDE.md](PAYPAL_FRONTEND_GUIDE.md) for complete examples.

```typescript
// Load PayPal SDK and render buttons
paypal.Buttons({
  createOrder: async () => {
    const response = await fetch('/paypal/orders', {
      method: 'POST',
      body: JSON.stringify({
        societeId: 'xxx',
        intent: 'CAPTURE',
        purchaseUnits: [{ amount: 2999, currency: 'EUR' }],
        returnUrl: window.location.href,
        cancelUrl: window.location.href,
      }),
    });
    const { id } = await response.json();
    return id;
  },
  onApprove: async (data) => {
    await fetch(`/paypal/orders/${data.orderID}/capture`, {
      method: 'POST',
      body: JSON.stringify({ societeId: 'xxx' }),
    });
    alert('Payment successful!');
  },
}).render('#paypal-container');
```

### Testing

Use PayPal Sandbox accounts from [PayPal Developer](https://developer.paypal.com/):
- Create Business (seller) and Personal (buyer) sandbox accounts
- Use sandbox credentials in your PayPal account configuration

## Email & OAuth2 Integration

### BoiteMail (Mailbox) System

The system allows users to connect their email accounts securely via OAuth2 or traditional SMTP/IMAP.

**Entity: BoiteMail** (`core/domain/boite-mail.entity.ts`)
- Stores email configurations and OAuth2 tokens
- Supports multiple providers: Gmail, Outlook, SMTP, Exchange, others
- Two connection types: `oauth2` or `smtp/imap`
- Relation: `Utilisateur 1 → N BoiteMail`
- Business methods: `isOAuth2()`, `isTokenExpired()`, `isConfigured()`

**API Endpoints:** `/boites-mail`
- `POST /boites-mail` - Create mailbox (manual SMTP/IMAP)
- `GET /boites-mail?utilisateurId=xxx` - List mailboxes (filterable by user)
- `GET /boites-mail/default/:utilisateurId` - Get user's default mailbox
- `GET /boites-mail/:id` - Get specific mailbox
- `PUT /boites-mail/:id` - Update mailbox
- `DELETE /boites-mail/:id` - Delete mailbox

### OAuth2 Services

**GoogleOAuthService** (`infrastructure/services/google-oauth.service.ts`)
- Uses `googleapis` library
- Scopes: `gmail.send`, `gmail.readonly`, `userinfo.email`
- Methods: `getAuthorizationUrl()`, `getTokensFromCode()`, `refreshAccessToken()`, `getUserInfo()`, `revokeToken()`

**MicrosoftOAuthService** (`infrastructure/services/microsoft-oauth.service.ts`)
- Uses `@azure/msal-node` and `@microsoft/microsoft-graph-client`
- Scopes: `Mail.Send`, `Mail.Read`, `User.Read`, `offline_access`
- Methods: `getAuthorizationUrl()`, `getTokensFromCode()`, `refreshAccessToken()`, `getUserInfo()`
- Note: MSAL manages token cache internally
- **Supports:**
  - Personal accounts: `@outlook.com`, `@hotmail.com`, `@live.fr`
  - Microsoft 365 / Office 365: Custom domains like `@finanssor.fr`, `@votre-entreprise.com`

### OAuth2 Flow (3-Step Process)

**Step 1: Generate Authorization URL**
```
POST /oauth/authorization-url
Body: { provider, clientId, clientSecret, redirectUri }
→ Returns: { authorizationUrl, provider }
```

**Step 2: Exchange Authorization Code**
```
POST /oauth/exchange-code
Body: { provider, code, clientId, clientSecret, redirectUri, utilisateurId }
→ Exchanges code for tokens
→ Automatically creates BoiteMail in database
→ Returns: { accessToken, refreshToken, expiryDate, userEmail, userName }
```

**Step 3: Refresh Expired Tokens**
```
POST /oauth/refresh-token/:boiteMailId
→ Refreshes tokens using stored refresh token
→ Automatically updates BoiteMail in database
```

### OAuth2 Configuration

**Environment Variables:**
```env
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxx
GOOGLE_REDIRECT_URI=http://localhost:3000/oauth/callback/google

MICROSOFT_CLIENT_ID=xxx
MICROSOFT_CLIENT_SECRET=xxx
MICROSOFT_REDIRECT_URI=http://localhost:3000/oauth/callback/microsoft
```

**Setup Required:**
1. **Google**: Create OAuth 2.0 credentials in [Google Cloud Console](https://console.cloud.google.com)
   - Enable Gmail API
   - Configure redirect URIs

2. **Microsoft Personal**: Register app in [Azure Portal](https://portal.azure.com)
   - Configure API permissions (delegated)
   - Add redirect URIs

3. **Microsoft 365 / Office 365** (for custom domains like `@finanssor.fr`):
   - **Admin access required** - Must be configured by Microsoft 365 administrator
   - Register app in Azure Active Directory
   - Configure API permissions with admin consent
   - See [OAUTH2_GUIDE.md](OAUTH2_GUIDE.md) for detailed 6-step admin setup

**Complete Documentation:** See [OAUTH2_GUIDE.md](OAUTH2_GUIDE.md) for:
- Detailed setup instructions (Google Cloud Console, Azure Portal)
- Frontend integration examples (React)
- Token refresh strategies
- Security best practices
- Troubleshooting

### Security Considerations

**⚠️ CRITICAL for Production:**
- Encrypt sensitive fields: `clientSecret`, `refreshToken`, `accessToken`, `motDePasse`
- Use key management service: AWS KMS, Azure Key Vault, Google Cloud KMS, or HashiCorp Vault
- Response DTOs already exclude sensitive fields (security by design)
- Never expose credentials in API responses (already implemented)
- Always use HTTPS in production

**Current State (Development):**
- Credentials stored in plaintext in database
- Response DTOs filter out sensitive data
- Suitable for development only
