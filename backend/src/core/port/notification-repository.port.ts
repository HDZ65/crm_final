import { NotificationEntity } from '../domain/notification.entity';
import { BaseRepositoryPort } from './repository.port';

export interface NotificationRepositoryPort
  extends BaseRepositoryPort<NotificationEntity> {
  findByUtilisateurId(utilisateurId: string): Promise<NotificationEntity[]>;
  findUnreadByUtilisateurId(utilisateurId: string): Promise<NotificationEntity[]>;
  countUnreadByUtilisateurId(utilisateurId: string): Promise<number>;
  markAsRead(id: string): Promise<NotificationEntity>;
  markAllAsReadByUtilisateurId(utilisateurId: string): Promise<void>;
  deleteOlderThan(date: Date): Promise<number>;
}
