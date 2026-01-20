import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { NotificationEntity } from '../../../core/domain/notification.entity';
import type { NotificationRepositoryPort } from '../../../core/port/notification-repository.port';

@Injectable()
export class GetNotificationUseCase {
  constructor(
    @Inject('NotificationRepositoryPort')
    private readonly repository: NotificationRepositoryPort,
  ) {}

  async execute(id: string): Promise<NotificationEntity> {
    const entity = await this.repository.findById(id);
    if (!entity) {
      throw new NotFoundException(`Notification with id ${id} not found`);
    }
    return entity;
  }

  async executeAll(): Promise<NotificationEntity[]> {
    return await this.repository.findAll();
  }

  async executeByUtilisateurId(
    utilisateurId: string,
  ): Promise<NotificationEntity[]> {
    return await this.repository.findByUtilisateurId(utilisateurId);
  }

  async executeUnreadByUtilisateurId(
    utilisateurId: string,
  ): Promise<NotificationEntity[]> {
    return await this.repository.findUnreadByUtilisateurId(utilisateurId);
  }

  async executeCountUnread(utilisateurId: string): Promise<number> {
    return await this.repository.countUnreadByUtilisateurId(utilisateurId);
  }
}
