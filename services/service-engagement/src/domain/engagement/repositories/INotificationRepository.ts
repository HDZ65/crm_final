import { NotificationEntity, NotificationType } from '../entities/notification.entity';

export interface INotificationRepository {
  findById(id: string): Promise<NotificationEntity | null>;
  findByOrganisation(
    organisationId: string,
    options?: { limit?: number; offset?: number; typeFilter?: NotificationType; unreadOnly?: boolean },
  ): Promise<{ notifications: NotificationEntity[]; total: number }>;
  findByUtilisateur(
    utilisateurId: string,
    limit?: number,
    offset?: number,
  ): Promise<{ notifications: NotificationEntity[]; total: number }>;
  save(entity: NotificationEntity): Promise<NotificationEntity>;
  delete(id: string): Promise<void>;
  markAsRead(id: string): Promise<NotificationEntity>;
  markAllAsRead(utilisateurId: string): Promise<number>;
}
