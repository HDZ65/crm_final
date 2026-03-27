import { Controller, Logger } from '@nestjs/common';
import { GrpcMethod, RpcException } from '@nestjs/microservices';
import { NotificationService } from '../persistence/typeorm/repositories/engagement';
import { NotificationGateway } from '../websocket/notification.gateway';
import { NotificationType, NotificationEntity } from '../../domain/engagement/entities';
import { status } from '@grpc/grpc-js';
import type {
  Notification as NotificationProto,
  CreateNotificationRequest,
  GetNotificationRequest,
  GetNotificationsRequest,
  GetNotificationsByUserRequest,
  UpdateNotificationRequest,
  DeleteNotificationRequest,
  NotificationResponse,
  NotificationListResponse,
  MarkAsReadRequest,
  MarkAllAsReadRequest,
  OperationResponse,
  GetUnreadCountRequest,
  UnreadCountResponse,
  DeleteAllByUserRequest,
  DeleteOlderThanRequest,
  DeleteResponse,
  NotifyNewClientRequest,
  NotifyNewContratRequest,
  NotifyContratExpiringRequest,
  NotifyImpayeRequest,
  NotifyTacheRequest,
  NotifyRappelRequest,
  NotifyAlerteRequest,
  NotifyInfoRequest,
  NotifyOrganisationRequest,
  ConnectedUsersResponse,
  IsUserConnectedRequest,
  IsUserConnectedResponse,
  EmptyRequest,
} from '@proto/notifications';

// ============================================
// Helper Functions
// ============================================

function toGrpcNotificationType(type: NotificationType): number {
  const mapping: Record<NotificationType, number> = {
    [NotificationType.CONTRAT_EXPIRE]: 1,
    [NotificationType.CONTRAT_BIENTOT_EXPIRE]: 2,
    [NotificationType.IMPAYE]: 3,
    [NotificationType.NOUVEAU_CLIENT]: 4,
    [NotificationType.NOUVEAU_CONTRAT]: 5,
    [NotificationType.TACHE_ASSIGNEE]: 6,
    [NotificationType.RAPPEL]: 7,
    [NotificationType.ALERTE]: 8,
    [NotificationType.INFO]: 9,
    [NotificationType.SYSTEME]: 10,
  };
  return mapping[type] || 0;
}

function fromGrpcNotificationType(value: number): NotificationType {
  const mapping: Record<number, NotificationType> = {
    1: NotificationType.CONTRAT_EXPIRE,
    2: NotificationType.CONTRAT_BIENTOT_EXPIRE,
    3: NotificationType.IMPAYE,
    4: NotificationType.NOUVEAU_CLIENT,
    5: NotificationType.NOUVEAU_CONTRAT,
    6: NotificationType.TACHE_ASSIGNEE,
    7: NotificationType.RAPPEL,
    8: NotificationType.ALERTE,
    9: NotificationType.INFO,
    10: NotificationType.SYSTEME,
  };
  return mapping[value] || NotificationType.INFO;
}

function metadataToMap(metadata: Record<string, unknown>): Record<string, string> {
  const result: Record<string, string> = {};
  if (metadata) {
    for (const [key, value] of Object.entries(metadata)) {
      result[key] = String(value);
    }
  }
  return result;
}

function mapToMetadata(map: Record<string, string>): Record<string, unknown> {
  return map || {};
}

@Controller()
export class NotificationController {
  private readonly logger = new Logger(NotificationController.name);

  constructor(
    private readonly notificationService: NotificationService,
    private readonly notificationGateway: NotificationGateway,
  ) {}

  // ============================================
  // CRUD Operations
  // ============================================

  @GrpcMethod('NotificationService', 'CreateNotification')
  async createNotification(request: CreateNotificationRequest): Promise<NotificationResponse> {
    try {
      const notification = await this.notificationService.create({
        organisationId: request.organisation_id,
        utilisateurId: request.utilisateur_id,
        type: fromGrpcNotificationType(request.type),
        titre: request.titre,
        message: request.message,
        metadata: mapToMetadata(request.metadata),
        lienUrl: request.lien_url,
        broadcastWebsocket: request.broadcast_websocket !== false,
      });

      return { notification: this.toProto(notification) };
    } catch (e: unknown) {
      const error = e instanceof Error ? e : new Error(String(e));
      this.logger.error('CreateNotification failed', error);
      throw new RpcException({
        code: status.INTERNAL,
        message: error.message,
      });
    }
  }

  @GrpcMethod('NotificationService', 'GetNotification')
  async getNotification(request: GetNotificationRequest): Promise<NotificationResponse> {
    try {
      const notification = await this.notificationService.findById(request.id);
      return { notification: this.toProto(notification) };
    } catch (e: unknown) {
      const error = e as Error & { status?: number };
      this.logger.error('GetNotification failed', error);
      throw new RpcException({
        code: error.status === 404 ? status.NOT_FOUND : status.INTERNAL,
        message: error.message,
      });
    }
  }

  @GrpcMethod('NotificationService', 'GetNotifications')
  async getNotifications(request: GetNotificationsRequest): Promise<NotificationListResponse> {
    try {
      const result = await this.notificationService.findByOrganisation(
        request.organisation_id,
        {
          limit: request.limit,
          offset: request.offset,
          typeFilter: request.type_filter
            ? fromGrpcNotificationType(request.type_filter)
            : undefined,
          unreadOnly: request.unread_only,
        },
      );

      return {
        notifications: result.notifications.map((n) => this.toProto(n)),
        total: result.total,
      };
    } catch (e: unknown) {
      const error = e instanceof Error ? e : new Error(String(e));
      this.logger.error('GetNotifications failed', error);
      throw new RpcException({
        code: status.INTERNAL,
        message: error.message,
      });
    }
  }

  @GrpcMethod('NotificationService', 'GetNotificationsByUser')
  async getNotificationsByUser(request: GetNotificationsByUserRequest): Promise<NotificationListResponse> {
    try {
      const result = await this.notificationService.findByUtilisateur(
        request.utilisateur_id,
        request.limit,
        request.offset,
      );

      return {
        notifications: result.notifications.map((n) => this.toProto(n)),
        total: result.total,
      };
    } catch (e: unknown) {
      const error = e instanceof Error ? e : new Error(String(e));
      this.logger.error('GetNotificationsByUser failed', error);
      throw new RpcException({
        code: status.INTERNAL,
        message: error.message,
      });
    }
  }

  @GrpcMethod('NotificationService', 'GetUnreadNotificationsByUser')
  async getUnreadNotificationsByUser(request: GetNotificationsByUserRequest): Promise<NotificationListResponse> {
    try {
      const result = await this.notificationService.findUnreadByUtilisateur(
        request.utilisateur_id,
        request.limit,
        request.offset,
      );

      return {
        notifications: result.notifications.map((n) => this.toProto(n)),
        total: result.total,
      };
    } catch (e: unknown) {
      const error = e instanceof Error ? e : new Error(String(e));
      this.logger.error('GetUnreadNotificationsByUser failed', error);
      throw new RpcException({
        code: status.INTERNAL,
        message: error.message,
      });
    }
  }

  @GrpcMethod('NotificationService', 'UpdateNotification')
  async updateNotification(request: UpdateNotificationRequest): Promise<NotificationResponse> {
    try {
      const notification = await this.notificationService.update(request.id, {
        titre: request.titre,
        message: request.message,
        lu: request.lu,
        metadata: request.metadata ? mapToMetadata(request.metadata) : undefined,
        lienUrl: request.lien_url,
      });

      return { notification: this.toProto(notification) };
    } catch (e: unknown) {
      const error = e as Error & { status?: number };
      this.logger.error('UpdateNotification failed', error);
      throw new RpcException({
        code: error.status === 404 ? status.NOT_FOUND : status.INTERNAL,
        message: error.message,
      });
    }
  }

  @GrpcMethod('NotificationService', 'DeleteNotification')
  async deleteNotification(request: DeleteNotificationRequest): Promise<DeleteResponse> {
    try {
      await this.notificationService.delete(request.id);
      return { success: true, message: 'Notification deleted successfully' };
    } catch (e: unknown) {
      const error = e as Error & { status?: number };
      this.logger.error('DeleteNotification failed', error);
      throw new RpcException({
        code: error.status === 404 ? status.NOT_FOUND : status.INTERNAL,
        message: error.message,
      });
    }
  }

  // ============================================
  // Read Status Management
  // ============================================

  @GrpcMethod('NotificationService', 'MarkAsRead')
  async markAsRead(request: MarkAsReadRequest): Promise<NotificationResponse> {
    try {
      const notification = await this.notificationService.markAsRead(request.id);
      return { notification: this.toProto(notification) };
    } catch (e: unknown) {
      const error = e as Error & { status?: number };
      this.logger.error('MarkAsRead failed', error);
      throw new RpcException({
        code: error.status === 404 ? status.NOT_FOUND : status.INTERNAL,
        message: error.message,
      });
    }
  }

  @GrpcMethod('NotificationService', 'MarkAllAsRead')
  async markAllAsRead(request: MarkAllAsReadRequest): Promise<OperationResponse> {
    try {
      const count = await this.notificationService.markAllAsRead(
        request.utilisateur_id,
      );
      return {
        success: true,
        message: `Marked ${count} notifications as read`,
        affected_count: count,
      };
    } catch (e: unknown) {
      const error = e instanceof Error ? e : new Error(String(e));
      this.logger.error('MarkAllAsRead failed', error);
      throw new RpcException({
        code: status.INTERNAL,
        message: error.message,
      });
    }
  }

  @GrpcMethod('NotificationService', 'GetUnreadCount')
  async getUnreadCount(request: GetUnreadCountRequest): Promise<UnreadCountResponse> {
    try {
      const result = await this.notificationService.getUnreadCount(
        request.utilisateur_id,
      );
      return { total: result.total, unread: result.unread };
    } catch (e: unknown) {
      const error = e instanceof Error ? e : new Error(String(e));
      this.logger.error('GetUnreadCount failed', error);
      throw new RpcException({
        code: status.INTERNAL,
        message: error.message,
      });
    }
  }

  // ============================================
  // Batch Operations
  // ============================================

  @GrpcMethod('NotificationService', 'DeleteAllByUser')
  async deleteAllByUser(request: DeleteAllByUserRequest): Promise<OperationResponse> {
    try {
      const count = await this.notificationService.deleteAllByUser(
        request.utilisateur_id,
      );
      return {
        success: true,
        message: `Deleted ${count} notifications`,
        affected_count: count,
      };
    } catch (e: unknown) {
      const error = e instanceof Error ? e : new Error(String(e));
      this.logger.error('DeleteAllByUser failed', error);
      throw new RpcException({
        code: status.INTERNAL,
        message: error.message,
      });
    }
  }

  @GrpcMethod('NotificationService', 'DeleteOlderThan')
  async deleteOlderThan(request: DeleteOlderThanRequest): Promise<OperationResponse> {
    try {
      const date = new Date(request.date);
      const count = await this.notificationService.deleteOlderThan(date);
      return {
        success: true,
        message: `Deleted ${count} notifications older than ${request.date}`,
        affected_count: count,
      };
    } catch (e: unknown) {
      const error = e instanceof Error ? e : new Error(String(e));
      this.logger.error('DeleteOlderThan failed', error);
      throw new RpcException({
        code: status.INTERNAL,
        message: error.message,
      });
    }
  }

  // ============================================
  // Business Notifications
  // ============================================

  @GrpcMethod('NotificationService', 'NotifyNewClient')
  async notifyNewClient(request: NotifyNewClientRequest): Promise<NotificationResponse> {
    try {
      const notification = await this.notificationService.notifyNewClient(
        request.organisation_id,
        request.utilisateur_id,
        request.client_id,
        request.client_nom,
      );
      return { notification: this.toProto(notification) };
    } catch (e: unknown) {
      const error = e instanceof Error ? e : new Error(String(e));
      this.logger.error('NotifyNewClient failed', error);
      throw new RpcException({
        code: status.INTERNAL,
        message: error.message,
      });
    }
  }

  @GrpcMethod('NotificationService', 'NotifyNewContrat')
  async notifyNewContrat(request: NotifyNewContratRequest): Promise<NotificationResponse> {
    try {
      const notification = await this.notificationService.notifyNewContrat(
        request.organisation_id,
        request.utilisateur_id,
        request.contrat_id,
        request.contrat_numero,
        request.client_nom,
      );
      return { notification: this.toProto(notification) };
    } catch (e: unknown) {
      const error = e instanceof Error ? e : new Error(String(e));
      this.logger.error('NotifyNewContrat failed', error);
      throw new RpcException({
        code: status.INTERNAL,
        message: error.message,
      });
    }
  }

  @GrpcMethod('NotificationService', 'NotifyContratExpiringSoon')
  async notifyContratExpiringSoon(request: NotifyContratExpiringRequest): Promise<NotificationResponse> {
    try {
      const notification = await this.notificationService.notifyContratExpiringSoon(
        request.organisation_id,
        request.utilisateur_id,
        request.contrat_id,
        request.contrat_numero,
        request.date_expiration,
        request.jours_restants,
      );
      return { notification: this.toProto(notification) };
    } catch (e: unknown) {
      const error = e instanceof Error ? e : new Error(String(e));
      this.logger.error('NotifyContratExpiringSoon failed', error);
      throw new RpcException({
        code: status.INTERNAL,
        message: error.message,
      });
    }
  }

  @GrpcMethod('NotificationService', 'NotifyContratExpired')
  async notifyContratExpired(request: NotifyContratExpiringRequest): Promise<NotificationResponse> {
    try {
      const notification = await this.notificationService.notifyContratExpired(
        request.organisation_id,
        request.utilisateur_id,
        request.contrat_id,
        request.contrat_numero,
        request.date_expiration,
      );
      return { notification: this.toProto(notification) };
    } catch (e: unknown) {
      const error = e instanceof Error ? e : new Error(String(e));
      this.logger.error('NotifyContratExpired failed', error);
      throw new RpcException({
        code: status.INTERNAL,
        message: error.message,
      });
    }
  }

  @GrpcMethod('NotificationService', 'NotifyImpaye')
  async notifyImpaye(request: NotifyImpayeRequest): Promise<NotificationResponse> {
    try {
      const notification = await this.notificationService.notifyImpaye(
        request.organisation_id,
        request.utilisateur_id,
        request.facture_id,
        request.facture_numero,
        request.client_nom,
        request.montant,
      );
      return { notification: this.toProto(notification) };
    } catch (e: unknown) {
      const error = e instanceof Error ? e : new Error(String(e));
      this.logger.error('NotifyImpaye failed', error);
      throw new RpcException({
        code: status.INTERNAL,
        message: error.message,
      });
    }
  }

  @GrpcMethod('NotificationService', 'NotifyTacheAssignee')
  async notifyTacheAssignee(request: NotifyTacheRequest): Promise<NotificationResponse> {
    try {
      const notification = await this.notificationService.notifyTacheAssignee(
        request.organisation_id,
        request.utilisateur_id,
        request.tache_id,
        request.tache_titre,
        request.assigne_par,
      );
      return { notification: this.toProto(notification) };
    } catch (e: unknown) {
      const error = e instanceof Error ? e : new Error(String(e));
      this.logger.error('NotifyTacheAssignee failed', error);
      throw new RpcException({
        code: status.INTERNAL,
        message: error.message,
      });
    }
  }

  @GrpcMethod('NotificationService', 'NotifyRappel')
  async notifyRappel(request: NotifyRappelRequest): Promise<NotificationResponse> {
    try {
      const notification = await this.notificationService.notifyRappel(
        request.organisation_id,
        request.utilisateur_id,
        request.titre,
        request.message,
        request.lien_url,
      );
      return { notification: this.toProto(notification) };
    } catch (e: unknown) {
      const error = e instanceof Error ? e : new Error(String(e));
      this.logger.error('NotifyRappel failed', error);
      throw new RpcException({
        code: status.INTERNAL,
        message: error.message,
      });
    }
  }

  @GrpcMethod('NotificationService', 'NotifyAlerte')
  async notifyAlerte(request: NotifyAlerteRequest): Promise<NotificationResponse> {
    try {
      const notification = await this.notificationService.notifyAlerte(
        request.organisation_id,
        request.utilisateur_id,
        request.titre,
        request.message,
        request.niveau,
      );
      return { notification: this.toProto(notification) };
    } catch (e: unknown) {
      const error = e instanceof Error ? e : new Error(String(e));
      this.logger.error('NotifyAlerte failed', error);
      throw new RpcException({
        code: status.INTERNAL,
        message: error.message,
      });
    }
  }

  @GrpcMethod('NotificationService', 'NotifyInfo')
  async notifyInfo(request: NotifyInfoRequest): Promise<NotificationResponse> {
    try {
      const notification = await this.notificationService.notifyInfo(
        request.organisation_id,
        request.utilisateur_id,
        request.titre,
        request.message,
      );
      return { notification: this.toProto(notification) };
    } catch (e: unknown) {
      const error = e instanceof Error ? e : new Error(String(e));
      this.logger.error('NotifyInfo failed', error);
      throw new RpcException({
        code: status.INTERNAL,
        message: error.message,
      });
    }
  }

  @GrpcMethod('NotificationService', 'NotifyOrganisation')
  async notifyOrganisation(request: NotifyOrganisationRequest): Promise<OperationResponse> {
    try {
      const count = await this.notificationService.notifyOrganisation(
        request.organisation_id,
        request.utilisateur_ids,
        fromGrpcNotificationType(request.type),
        request.titre,
        request.message,
        mapToMetadata(request.metadata),
      );
      return {
        success: true,
        message: `Sent ${count} notifications`,
        affected_count: count,
      };
    } catch (e: unknown) {
      const error = e instanceof Error ? e : new Error(String(e));
      this.logger.error('NotifyOrganisation failed', error);
      throw new RpcException({
        code: status.INTERNAL,
        message: error.message,
      });
    }
  }

  // ============================================
  // WebSocket Status
  // ============================================

  @GrpcMethod('NotificationService', 'GetConnectedUsersCount')
  async getConnectedUsersCount(): Promise<ConnectedUsersResponse> {
    return { count: this.notificationGateway.getConnectedUsersCount() };
  }

  @GrpcMethod('NotificationService', 'IsUserConnected')
  async isUserConnected(request: IsUserConnectedRequest): Promise<IsUserConnectedResponse> {
    return {
      connected: this.notificationGateway.isUserConnected(request.utilisateur_id),
    };
  }

  // ============================================
  // Helper Methods
  // ============================================

  private toProto(notification: NotificationEntity): NotificationProto {
    return {
      id: notification.id,
      organisation_id: notification.organisationId,
      utilisateur_id: notification.utilisateurId,
      type: toGrpcNotificationType(notification.type),
      titre: notification.titre,
      message: notification.message,
      lu: notification.lu,
      metadata: metadataToMap(notification.metadata),
      lien_url: notification.lienUrl ?? undefined,
      created_at: notification.createdAt?.toISOString() ?? '',
      updated_at: notification.updatedAt?.toISOString() ?? '',
    };
  }
}
