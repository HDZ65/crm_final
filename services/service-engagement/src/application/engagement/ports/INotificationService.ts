import {
  CreateNotificationDto,
  UpdateNotificationDto,
  NotificationResponseDto,
} from '../dtos';
import { NotificationType } from '../../../domain/engagement/entities';

export interface INotificationService {
  create(dto: CreateNotificationDto): Promise<NotificationResponseDto>;
  findById(id: string): Promise<NotificationResponseDto>;
  findByOrganisation(
    organisationId: string,
    options?: { limit?: number; offset?: number; typeFilter?: NotificationType; unreadOnly?: boolean },
  ): Promise<{ notifications: NotificationResponseDto[]; total: number }>;
  findByUtilisateur(
    utilisateurId: string,
    limit?: number,
    offset?: number,
  ): Promise<{ notifications: NotificationResponseDto[]; total: number }>;
  update(id: string, dto: UpdateNotificationDto): Promise<NotificationResponseDto>;
  delete(id: string): Promise<void>;
  markAsRead(id: string): Promise<NotificationResponseDto>;
  markAllAsRead(utilisateurId: string): Promise<number>;
  getUnreadCount(utilisateurId: string): Promise<{ total: number; unread: number }>;
}

export const NOTIFICATION_SERVICE = Symbol('INotificationService');
