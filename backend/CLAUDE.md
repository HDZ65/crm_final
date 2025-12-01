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
│   ├── port/               # Repository interfaces (ports)
│   └── mapper/             # Domain ↔ Persistence mappers
├── applications/           # Application layer (use cases & DTOs)
│   ├── usecase/           # Business use cases (CRUD operations)
│   └── dto/               # Data Transfer Objects
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
2. **Mappers**: Separate domain entities from persistence entities using explicit mappers in `core/mapper/`
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
# Database auto-syncs in dev (DB_SYNCHRONIZE=true)
```

### Code Generation
```bash
npm run make:feature      # Generate complete feature with Plop
```

This interactive generator creates:
- Domain entity (`core/domain/`)
- Repository port (`core/port/`)
- Mapper (`core/mapper/`)
- DTOs: create, update, response (`applications/dto/`)
- Use cases: create, get, update, delete (`applications/usecase/`)
- TypeORM entity (`infrastructure/db/entities/`)
- Repository implementation (`infrastructure/repositories/`)
- HTTP Controller (`infrastructure/framework/nest/http/`)
- Auto-wires everything in `app.module.ts`

## Database Architecture

- **Primary DB**: PostgreSQL (via TypeORM)
- **Future Support**: MongoDB can be added via plop generator (currently uses TypeORM only)
- **Schema Sync**: Auto-sync enabled in dev mode (`DB_SYNCHRONIZE=true`)
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
DB_SYNCHRONIZE=true        # Auto-sync schema in dev

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
3. **Mapper** (`core/mapper/`): Create bidirectional mapper (toDomain/toPersistence)
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

Always use mappers in `core/mapper/` to convert between:
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
