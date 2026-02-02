# Authentication & Event-Driven Architecture

## Authentication (JWT)

### Overview

All gRPC endpoints are protected by JWT authentication via `AuthInterceptor`. The interceptor validates tokens on every request and rejects unauthenticated calls with `UNAUTHENTICATED` status.

### Configuration

Add to each service's `.env` file:

```bash
JWT_SECRET=your-256-bit-secret-key-here
```

### How It Works

1. Client sends gRPC request with `authorization: Bearer <token>` metadata
2. `AuthInterceptor` extracts and validates the JWT
3. If valid, request proceeds to controller
4. If invalid/missing, returns `UNAUTHENTICATED` error

### Public Endpoints

The following endpoints bypass authentication:
- `grpc.health.v1.Health/Check` - Health checks for load balancers

### Service-to-Service Communication

Internal service calls use the `x-internal-service` header to bypass JWT validation:

```typescript
const metadata = new grpc.Metadata();
metadata.set('x-internal-service', 'service-payments');
client.someMethod(request, metadata, callback);
```

### Testing Authentication

```bash
# Without token (should return UNAUTHENTICATED)
grpcurl -plaintext localhost:50052 clients.ClientBaseService/List

# With valid token
export TOKEN="your-jwt-token"
grpcurl -plaintext -H "authorization: Bearer $TOKEN" localhost:50052 clients.ClientBaseService/List

# Health check (public, no token needed)
grpcurl -plaintext localhost:50052 grpc.health.v1.Health/Check
```

---

## Event-Driven Architecture (NATS)

### Overview

Services communicate asynchronously via NATS JetStream. Events are fire-and-forget notifications that trigger side effects in subscriber services.

### Starting NATS

```bash
docker compose -f compose/dev/infrastructure.yml up -d nats
```

NATS ports:
- `4222` - Client connections
- `8222` - Monitoring HTTP endpoint

### Configuration

Add to each service's `.env` file:

```bash
NATS_URL=nats://localhost:4222
```

### Events

| Event | Subject | Publisher | Subscribers |
|-------|---------|-----------|-------------|
| client.created | `crm.events.client.created` | service-clients | email, notifications, dashboard, relance |
| invoice.created | `crm.events.invoice.created` | service-factures | email, notifications, dashboard, relance |
| payment.received | `crm.events.payment.received` | service-payments | notifications, dashboard, relance, commission |
| payment.rejected | `crm.events.payment.rejected` | service-payments | retry, relance, notifications, email |
| contract.signed | `crm.events.contract.signed` | service-contrats | payments, email, documents |

### Event Flow

```
┌──────────────────┐     publish      ┌──────────────┐     subscribe     ┌──────────────────┐
│  service-clients │ ───────────────► │     NATS     │ ─────────────────► │  service-email   │
│                  │                  │   JetStream  │                    │  service-notif   │
│  Create Client   │                  │              │                    │  service-dash    │
│        ↓         │                  │              │                    │  service-relance │
│  Publish Event   │                  └──────────────┘                    └──────────────────┘
└──────────────────┘
```

### Idempotency

All subscribers use `ProcessedEventsRepository` to prevent duplicate processing:

```typescript
@Injectable()
export class ClientCreatedHandler implements OnModuleInit {
  constructor(
    private readonly natsService: NatsService,
    private readonly processedEvents: ProcessedEventsRepository,
  ) {}

  async onModuleInit() {
    await this.natsService.subscribe('crm.events.client.created', async (event) => {
      if (await this.processedEvents.exists(event.eventId)) {
        return; // Already processed
      }
      
      // Process event...
      
      await this.processedEvents.markProcessed(event.eventId, 'client.created');
    });
  }
}
```

### Proto Schemas

Event schemas are defined in `packages/proto/src/events/`:

```protobuf
// client_events.proto
message ClientCreatedEvent {
  string event_id = 1;
  google.protobuf.Timestamp timestamp = 2;
  string client_id = 3;
  string organisation_id = 4;
  string nom = 5;
  string prenom = 6;
  string email = 7;
}
```

### Testing Events

```bash
# Subscribe to all events
nats sub "crm.events.>"

# Subscribe to specific event
nats sub "crm.events.client.created"

# Check NATS server status
curl http://localhost:8222/varz
```

---

## E2E Tests

### Running Tests

```bash
cd tests/e2e

# All tests (mock mode)
npm run test:all

# Auth tests
npm run test:auth           # Mock mode
npm run test:auth:live      # Requires running services

# Event tests
npm run test:events         # Mock mode
npm run test:events:live    # Requires running NATS
```

### Environment Variables for Live Tests

```bash
export GRPC_HOST=localhost
export TEST_JWT_TOKEN="your-keycloak-token"
export NATS_URL=nats://localhost:4222
```
