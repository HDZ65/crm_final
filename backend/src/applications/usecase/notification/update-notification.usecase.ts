import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { NotificationEntity } from '../../../core/domain/notification.entity';
import type { NotificationRepositoryPort } from '../../../core/port/notification-repository.port';
import { UpdateNotificationDto } from '../../dto/notification/update-notification.dto';

@Injectable()
export class UpdateNotificationUseCase {
  constructor(
    @Inject('NotificationRepositoryPort')
    private readonly repository: NotificationRepositoryPort,
  ) {}

  async execute(id: string, dto: UpdateNotificationDto): Promise<NotificationEntity> {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundException(`Notification with id ${id} not found`);
    }
    return await this.repository.update(id, dto as Partial<NotificationEntity>);
  }

  async markAsRead(id: string): Promise<NotificationEntity> {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundException(`Notification with id ${id} not found`);
    }
    return await this.repository.markAsRead(id);
  }

  async markAllAsRead(utilisateurId: string): Promise<void> {
    await this.repository.markAllAsReadByUtilisateurId(utilisateurId);
  }
}
