import { Injectable, Inject } from '@nestjs/common';
import { NotificationEntity, NotificationType } from '../../../core/domain/notification.entity';
import type { NotificationRepositoryPort } from '../../../core/port/notification-repository.port';
import { CreateNotificationDto } from '../../dto/notification/create-notification.dto';

@Injectable()
export class CreateNotificationUseCase {
  constructor(
    @Inject('NotificationRepositoryPort')
    private readonly repository: NotificationRepositoryPort,
  ) {}

  async execute(dto: CreateNotificationDto): Promise<NotificationEntity> {
    const entity = new NotificationEntity({
      organisationId: dto.organisationId,
      utilisateurId: dto.utilisateurId,
      type: dto.type as NotificationType,
      titre: dto.titre,
      message: dto.message,
      lu: dto.lu ?? false,
      metadata: dto.metadata,
      lienUrl: dto.lienUrl,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return await this.repository.create(entity);
  }
}
