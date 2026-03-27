# Service-Engagement

Microservice handling notifications, mailboxes, activities, tasks, and event tracking. Built with NestJS and gRPC.

## DDD Architecture

This service follows Domain-Driven Design (DDD) with clear layer separation:

```
src/
├── domain/              # Business entities & repository interfaces
├── application/         # DTOs & service port interfaces
├── infrastructure/      # Technical implementations (TypeORM, NATS, WebSocket)
├── interfaces/          # API layer (gRPC controllers)
├── migrations/          # Database migrations
├── engagement.module.ts # Engagement bounded context module
├── app.module.ts        # Root module
└── main.ts              # Bootstrap
```

## Bounded Context

### Engagement (6 entities)
- `NotificationEntity` - User notifications with read/unread status
- `MailboxEntity` - Email mailbox configuration (encrypted credentials)
- `ActiviteEntity` - Activity records linked to clients/contracts
- `TacheEntity` - Tasks with due dates and completion status
- `TypeActiviteEntity` - Activity type referential
- `EvenementSuiviEntity` - Event tracking/follow-up records

## Layer Responsibilities

### Domain Layer (`src/domain/`)
- **Entities**: TypeORM entities with business rules
- **Repository Interfaces**: Abstract contracts (I*Repository.ts)
- Pure business logic, no framework dependencies

### Application Layer (`src/application/`)
- **DTOs**: class-validator decorated transfer objects
- **Service Ports**: Interface definitions (I*Service.ts)
- Orchestration and business use cases

### Infrastructure Layer (`src/infrastructure/`)
- **Persistence**: TypeORM repository implementations
- **Messaging**: NATS event handlers
- **WebSocket**: Real-time notification gateway
- **Common**: Shared utilities (EncryptionService)
- Technical adapters implementing application ports

### Interfaces Layer (`src/interfaces/`)
- **gRPC Controllers**: Protocol buffer API handlers
- Transport-specific adapters

## Module Wiring

The engagement bounded context module wires:
- TypeOrmModule.forFeature() for all 6 entities
- Controllers from interfaces/grpc/controllers/engagement/
- Services from infrastructure/persistence/typeorm/repositories/engagement/
- NotificationGateway for WebSocket support
- EncryptionService for mailbox credential encryption
- Exports services for cross-context usage

## Key Patterns

### Repository Pattern
```typescript
// Domain interface
export interface INotificationRepository {
  findById(id: string): Promise<NotificationEntity | null>;
  findByUserId(userId: string): Promise<NotificationEntity[]>;
}

// Infrastructure implementation
@Injectable()
export class NotificationService implements INotificationRepository {
  // ...
}
```

### Event Handling (NATS)
```typescript
// infrastructure/messaging/nats/handlers/
@Injectable()
export class ClientCreatedHandler implements OnModuleInit {
  async onModuleInit() {
    await this.natsService.subscribeProto(...);
  }
}
```

### WebSocket Gateway
```typescript
// infrastructure/websocket/
@WebSocketGateway()
export class NotificationGateway {
  @SubscribeMessage('subscribe')
  handleSubscribe(client: Socket, userId: string) {
    // Real-time notification delivery
  }
}
```

### Encryption Service
```typescript
// infrastructure/common/
@Injectable()
export class EncryptionService {
  encrypt(text: string): string;
  decrypt(encryptedText: string): string;
}
```

## Database

- **PostgreSQL** with `engagement_db` database
- **TypeORM** for ORM
- **Snake Case** naming strategy
- Migrations in `src/migrations/`

## gRPC Services

Proto definitions in `packages/proto/`:
- `@crm/proto/engagement` - Engagement service (notifications, activities, tasks)
- `@crm/proto/events/client` - Client events (for NATS handlers)

## Special Features

### Notification System
- Real-time WebSocket delivery via NotificationGateway
- Persistent storage with read/unread tracking
- User-specific notification channels

### Mailbox Integration
- Encrypted credential storage (AES-256)
- IMAP/SMTP configuration support
- Per-user mailbox settings

### Activity Tracking
- Linked to clients and contracts
- Type-based categorization (TypeActiviteEntity)
- Historical event tracking (EvenementSuiviEntity)

### Task Management
- Due date tracking
- Completion status
- User assignment

## Migration Notes

### From Old Structure (modules/)

The service was refactored from a feature-module structure to DDD layers:

**Before:**
```
modules/
├── notification/
│   ├── notification.module.ts
│   ├── notification.service.ts
│   ├── notification.controller.ts
│   └── entities/notification.entity.ts
├── mailbox/
├── activite/
└── ...
```

**After:**
```
domain/engagement/entities/notification.entity.ts
domain/engagement/repositories/INotificationRepository.ts
infrastructure/persistence/typeorm/repositories/engagement/notification.service.ts
interfaces/grpc/controllers/engagement/notification.controller.ts
engagement.module.ts
```

### Removed Modules
- Dashboard modules were removed (they queried external databases, not engagement entities)
- Consolidated into single bounded context (simpler than multi-context services)

## Commands

```bash
# Development
bun run start:dev

# Build
bun run build

# Tests
bun test

# Proto generation
bun run proto:generate
```

## Dependencies

- `@crm/grpc-utils` - gRPC utilities
- `@crm/nats-utils` - NATS messaging utilities
- `@crm/proto` - Protocol buffer definitions
- TypeORM, NestJS, class-validator
- Socket.io for WebSocket support
