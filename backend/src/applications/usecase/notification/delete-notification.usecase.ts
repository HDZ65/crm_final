import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import type { NotificationRepositoryPort } from '../../../core/port/notification-repository.port';

@Injectable()
export class DeleteNotificationUseCase {
  constructor(
    @Inject('NotificationRepositoryPort')
    private readonly repository: NotificationRepositoryPort,
  ) {}

  async execute(id: string): Promise<void> {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundException(`Notification with id ${id} not found`);
    }
    await this.repository.delete(id);
  }

  async deleteOlderThan(days: number): Promise<number> {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return await this.repository.deleteOlderThan(date);
  }
}
