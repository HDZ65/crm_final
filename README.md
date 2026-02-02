# CRM Multi-Tenant Microservices

Application CRM multi-tenant basee sur une architecture microservices avec communication gRPC.

## Architecture

```
crm_final/
├── packages/                    # Packages partages (monorepo)
│   ├── proto/                   # @crm/proto - Definitions Protocol Buffers
│   │   ├── src/                 # Fichiers .proto sources
│   │   └── gen/ts/              # Types TypeScript generes
│   ├── grpc-utils/              # @crm/grpc-utils - Utilitaires gRPC
│   └── shared/                  # @crm/shared - Utilitaires partages
├── services/                    # 19 microservices NestJS
│   ├── service-activites/       # Gestion des activites
│   ├── service-calendar/        # Calendrier et planification
│   ├── service-clients/         # Gestion des clients
│   ├── service-commerciaux/     # Gestion des commerciaux
│   ├── service-commission/      # Calcul des commissions
│   ├── service-contrats/        # Gestion des contrats
│   ├── service-dashboard/       # Tableaux de bord et KPIs
│   ├── service-documents/       # Gestion documentaire
│   ├── service-email/           # Envoi d'emails (OAuth)
│   ├── service-factures/        # Facturation
│   ├── service-logistics/       # Logistique (Maileva)
│   ├── service-notifications/   # Notifications temps reel
│   ├── service-organisations/   # Multi-tenancy
│   ├── service-payments/        # Paiements SEPA
│   ├── service-products/        # Catalogue produits
│   ├── service-referentiel/     # Donnees de reference
│   ├── service-relance/         # Relances automatiques
│   ├── service-retry/           # Gestion des rejets AM04
│   └── service-users/           # Authentification et utilisateurs
├── frontend/                    # Application React
├── tests/e2e/                   # Tests E2E gRPC
├── docker-compose.yml           # Configuration Docker
└── turbo.json                   # Configuration Turborepo
```

## Stack Technique

- **Runtime**: Node.js 20 LTS
- **Framework**: NestJS 10+
- **Communication**: gRPC avec Protocol Buffers
- **Base de donnees**: PostgreSQL 18
- **Monorepo**: npm workspaces + Turborepo
- **Containerisation**: Docker multi-stage

## Demarrage Rapide

### Prerequisites

- Node.js 20+
- npm 10+
- Docker et Docker Compose

### Installation

```bash
# Cloner le repository
git clone <repo-url>
cd crm_final

# Installer les dependances
npm install

# Builder les packages partages
npm run build --workspace=@crm/grpc-utils
npm run build --workspace=@crm/shared
```

### Developpement

```bash
# Demarrer un service specifique
npm run start:dev --workspace=@crm/service-clients

# Builder tous les services
npm run build --workspaces

# Lancer les tests E2E gRPC (mode mock)
cd tests/e2e && npm run test:mock
```

### Docker

```bash
# Builder et demarrer tous les services
docker-compose up -d

# Builder un service specifique
docker build -f services/service-clients/Dockerfile -t crm/service-clients .

# Voir les logs
docker-compose logs -f service-clients
```

## Packages Partages

### @crm/proto

Definitions Protocol Buffers et types TypeScript generes.

```typescript
// Importer les types
import type { Client, CreateClientRequest } from '@crm/proto/clients';
import type { PaymentSchedule } from '@crm/proto/payments';
import type { CalendarDay } from '@crm/proto/calendar';
```

### @crm/grpc-utils

Utilitaires pour la configuration gRPC.

```typescript
import { getGrpcOptions, createGrpcClient, SERVICE_REGISTRY } from '@crm/grpc-utils';

// Configuration NestJS main.ts
const app = await NestFactory.createMicroservice<MicroserviceOptions>(
  AppModule,
  {
    transport: Transport.GRPC,
    options: getGrpcOptions('clients'),
  }
);

// Creer un client gRPC
const client = createGrpcClient('payments', 'PaymentService', { url: 'localhost:50063' });
```

### @crm/shared

Utilitaires partages (constants, enums, helpers).

```typescript
import { formatCurrency, validateIBAN } from '@crm/shared';
```

## Ports des Services

| Service | Port |
|---------|------|
| service-activites | 50051 |
| service-clients | 50052 |
| service-commerciaux | 50053 |
| service-commission | 50054 |
| service-contrats | 50055 |
| service-dashboard | 50056 |
| service-documents | 50057 |
| service-email | 50058 |
| service-factures | 50059 |
| service-logistics | 50060 |
| service-notifications | 50061 |
| service-organisations | 50062 |
| service-payments | 50063 |
| service-products | 50064 |
| service-referentiel | 50065 |
| service-relance | 50066 |
| service-users | 50067 |
| service-calendar | 50068 |
| service-retry | 50070 |

## Variables d'Environnement

```bash
# Base de donnees
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=crm_db

# gRPC
GRPC_HOST=0.0.0.0
GRPC_PORT=50051

# Environnement
NODE_ENV=development

# Authentication
JWT_SECRET=your-256-bit-secret-key-here

# Events (NATS)
NATS_URL=nats://localhost:4222
```

## Authentication (JWT)

All gRPC endpoints require JWT authentication via `AuthInterceptor`.

```bash
# Without token (returns UNAUTHENTICATED)
grpcurl -plaintext localhost:50052 clients.ClientBaseService/List

# With valid token
grpcurl -plaintext -H "authorization: Bearer $TOKEN" localhost:50052 clients.ClientBaseService/List

# Health check (public, no token needed)
grpcurl -plaintext localhost:50052 grpc.health.v1.Health/Check
```

Service-to-service calls use `x-internal-service` header to bypass auth.

See [docs/auth-and-events.md](docs/auth-and-events.md) for details.

## Event-Driven Architecture (NATS)

Services communicate asynchronously via NATS JetStream:

| Event | Publisher | Subscribers |
|-------|-----------|-------------|
| client.created | service-clients | email, notifications, dashboard, relance |
| invoice.created | service-factures | email, notifications, dashboard, relance |
| payment.received | service-payments | notifications, dashboard, relance, commission |
| payment.rejected | service-payments | retry, relance, notifications, email |
| contract.signed | service-contrats | payments, email, documents |

```bash
# Start NATS
docker compose -f compose/dev/infrastructure.yml up -d nats

# Subscribe to events
nats sub "crm.events.>"
```

See [docs/auth-and-events.md](docs/auth-and-events.md) for details.

## Tests

```bash
# Tests unitaires d'un service
npm run test --workspace=@crm/service-clients

# Tests E2E gRPC (chargement proto)
cd tests/e2e && npm run test:mock

# Tests E2E gRPC (connectivite - services demarres)
cd tests/e2e && npm run test:live
```

## Scripts Utiles

```bash
# Generer les Dockerfiles de tous les services
node scripts/generate-dockerfiles.js

# Builder un service
npm run build --workspace=@crm/service-clients

# Lancer en mode dev
npm run start:dev --workspace=@crm/service-clients
```

## Structure d'un Service

```
service-xxx/
├── src/
│   ├── main.ts                 # Point d'entree (gRPC)
│   ├── app.module.ts           # Module racine
│   └── modules/
│       └── xxx/
│           ├── xxx.controller.ts   # Controleur gRPC
│           ├── xxx.service.ts      # Logique metier
│           └── entities/           # Entites TypeORM
├── Dockerfile
├── package.json
└── tsconfig.json
```

## Communication Inter-Services

Les services communiquent via gRPC. Exemple d'appel depuis service-contrats vers service-payments:

```typescript
// Dans service-contrats
import { createGrpcClient } from '@crm/grpc-utils';
import type { PaymentService } from '@crm/proto/payments';

const paymentClient = createGrpcClient<PaymentService>(
  'payments',
  'PaymentService',
  { url: process.env.PAYMENTS_SERVICE_URL }
);

const schedule = await paymentClient.createSchedule(request);
```

## Migration Notes (Wave 4 - Final Cleanup)

### Changes Summary

This wave completes the adoption of Winaity best practices with final cleanup and verification:

- **Obsolete Files Removed**:
  - `Dockerfile.base` - Replaced by multi-stage Dockerfiles in each service
  - `frontend/src/lib/grpc/loader.ts` - Functionality integrated into @crm/grpc-utils

- **E2E Tests Verified**: All 14 gRPC proto loading and client creation tests pass
- **Docker Services**: All 20 services (19 microservices + PostgreSQL) start and run healthily
- **Architecture**: Fully aligned with Winaity best practices for microservices

### Verification Commands

```bash
# Verify E2E tests pass
cd tests/e2e && npm run test:mock

# Verify all services start
docker compose up -d
sleep 30
docker compose ps

# Verify no obsolete files remain
test ! -f Dockerfile.base && test ! -f frontend/src/lib/grpc/loader.ts && echo "✓ Cleanup complete"
```

## Contribution

1. Creer une branche feature (`git checkout -b feature/ma-feature`)
2. Commiter les changements (`git commit -am 'Ajouter ma feature'`)
3. Pousser la branche (`git push origin feature/ma-feature`)
4. Creer une Pull Request

## License

Proprietary - Tous droits reserves
