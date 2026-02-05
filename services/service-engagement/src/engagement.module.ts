import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProcessedEvent, ProcessedEventsRepository } from '@crm/nats-utils';

// Domain entities
import {
  NotificationEntity,
  MailboxEntity,
  ActiviteEntity,
  TacheEntity,
  TypeActiviteEntity,
  EvenementSuiviEntity,
} from './domain/engagement/entities';

// Infrastructure services
import {
  NotificationService,
  MailboxService,
  ActiviteService,
  TacheService,
  TypeActiviteService,
  EvenementSuiviService,
} from './infrastructure/persistence/typeorm/repositories/engagement';

// Infrastructure common
import { EncryptionService } from './infrastructure/common/encryption.service';

// Infrastructure websocket
import { NotificationGateway } from './infrastructure/websocket/notification.gateway';

// Infrastructure messaging handlers
import { NotificationClientCreatedHandler } from './infrastructure/messaging/nats/handlers';

// Interface controllers
import {
  NotificationController,
  MailboxController,
  ActiviteController,
  TacheController,
  TypeActiviteController,
  EvenementSuiviController,
} from './interfaces/grpc/controllers/engagement';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      NotificationEntity,
      MailboxEntity,
      ActiviteEntity,
      TacheEntity,
      TypeActiviteEntity,
      EvenementSuiviEntity,
      ProcessedEvent,
    ]),
  ],
  controllers: [
    NotificationController,
    MailboxController,
    ActiviteController,
    TacheController,
    TypeActiviteController,
    EvenementSuiviController,
  ],
  providers: [
    // Services
    NotificationService,
    MailboxService,
    ActiviteService,
    TacheService,
    TypeActiviteService,
    EvenementSuiviService,
    // Common
    EncryptionService,
    // WebSocket
    NotificationGateway,
    // Event handlers
    ProcessedEventsRepository,
    NotificationClientCreatedHandler,
  ],
  exports: [
    NotificationService,
    MailboxService,
    ActiviteService,
    TacheService,
    TypeActiviteService,
    EvenementSuiviService,
    EncryptionService,
    NotificationGateway,
  ],
})
export class EngagementModule {}
