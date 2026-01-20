import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Controllers
import { NotificationController } from './controllers/notification.controller';

// Entities
import { NotificationEntity } from '../../../db/entities/notification.entity';
import { UtilisateurEntity } from '../../../db/entities/utilisateur.entity';

// Repositories
import { TypeOrmNotificationRepository } from '../../../repositories/typeorm-notification.repository';

// Services
import { NotificationService } from '../../../services/notification.service';

// WebSocket Gateway
import { NotificationGateway } from '../../../websocket/notification.gateway';

// Modules for dependencies
import { KeycloakModule } from '../keycloak.module';

// Use Cases
import { CreateNotificationUseCase } from '../../../../applications/usecase/notification/create-notification.usecase';
import { GetNotificationUseCase } from '../../../../applications/usecase/notification/get-notification.usecase';
import { UpdateNotificationUseCase } from '../../../../applications/usecase/notification/update-notification.usecase';
import { DeleteNotificationUseCase } from '../../../../applications/usecase/notification/delete-notification.usecase';

@Module({
  imports: [
    TypeOrmModule.forFeature([NotificationEntity, UtilisateurEntity]),
    // Required for @Public() and @Roles() decorators
    KeycloakModule,
  ],
  controllers: [NotificationController],
  providers: [
    // Repository
    {
      provide: 'NotificationRepositoryPort',
      useClass: TypeOrmNotificationRepository,
    },

    // Use Cases
    CreateNotificationUseCase,
    GetNotificationUseCase,
    UpdateNotificationUseCase,
    DeleteNotificationUseCase,

    // Services
    NotificationService,
    NotificationGateway,
  ],
  exports: [
    'NotificationRepositoryPort',
    NotificationService,
    NotificationGateway,
  ],
})
export class NotificationModule {}
