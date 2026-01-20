import { Controller, Logger } from '@nestjs/common';
import { GrpcMethod, RpcException } from '@nestjs/microservices';
import { NotificationService } from './modules/notification/notification.service';
import { NotificationGateway } from './modules/websocket/notification.gateway';
import { NotificationType } from './modules/notification/entities/notification.entity';
import { status } from '@grpc/grpc-js';
import type {
  CreateNotificationRequest,
  GetNotificationRequest,
  GetNotificationsRequest,
  GetNotificationsByUserRequest,
  UpdateNotificationRequest,
  DeleteNotificationRequest,
  MarkAsReadRequest,
  MarkAllAsReadRequest,
  GetUnreadCountRequest,
  DeleteAllByUserRequest,
  DeleteOlderThanRequest,
  NotifyNewClientRequest,
  NotifyNewContratRequest,
  NotifyContratExpiringRequest,
  NotifyImpayeRequest,
  NotifyTacheRequest,
  NotifyRappelRequest,
  NotifyAlerteRequest,
  NotifyInfoRequest,
  NotifyOrganisationRequest,
  IsUserConnectedRequest,
  Notification as ProtoNotification,
  NotificationResponse,
  NotificationListResponse,
  DeleteResponse,
  OperationResponse,
  UnreadCountResponse,
  ConnectedUsersResponse,
  IsUserConnectedResponse,
  NotificationType as ProtoNotificationType,
} from '@proto/notifications/notifications';

// ============================================
// Helper Functions
// ============================================

function toGrpcNotificationType(type: NotificationType): ProtoNotificationType {
  const mapping: Record<NotificationType, ProtoNotificationType> = {
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

function fromGrpcNotificationType(value: ProtoNotificationType): NotificationType {
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

function metadataToMap(metadata: Record<string, any>): Record<string, string> {
  const result: Record<string, string> = {};
  if (metadata) {
    for (const [key, value] of Object.entries(metadata)) {
      result[key] = String(value);
    }
  }
  return result;
}

function mapToMetadata(map: Record<string, string>): Record<string, any> {
  return map || {};
}

@Controller()
export class NotificationsController {
  private readonly logger = new Logger(NotificationsController.name);

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
        organisationId: request.organisationId,
        utilisateurId: request.utilisateurId,
        type: fromGrpcNotificationType(request.type),
        titre: request.titre,
        message: request.message,
        metadata: mapToMetadata(request.metadata),
        lienUrl: request.lienUrl,
        broadcastWebsocket: request.broadcastWebsocket !== false,
      });

      return { notification: this.toGrpcNotification(notification) };
    } catch (error) {
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
      return { notification: this.toGrpcNotification(notification) };
    } catch (error) {
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
        request.organisationId,
        {
          limit: request.limit,
          offset: request.offset,
          typeFilter: request.typeFilter
            ? fromGrpcNotificationType(request.typeFilter)
            : undefined,
          unreadOnly: request.unreadOnly,
        },
      );

      return {
        notifications: result.notifications.map((n) => this.toGrpcNotification(n)),
        total: result.total,
      };
    } catch (error) {
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
        request.utilisateurId,
        request.limit,
        request.offset,
      );

      return {
        notifications: result.notifications.map((n) => this.toGrpcNotification(n)),
        total: result.total,
      };
    } catch (error) {
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
        request.utilisateurId,
        request.limit,
        request.offset,
      );

      return {
        notifications: result.notifications.map((n) => this.toGrpcNotification(n)),
        total: result.total,
      };
    } catch (error) {
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
        lienUrl: request.lienUrl,
      });

      return { notification: this.toGrpcNotification(notification) };
    } catch (error) {
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
    } catch (error) {
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
      return { notification: this.toGrpcNotification(notification) };
    } catch (error) {
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
        request.utilisateurId,
      );
      return {
        success: true,
        message: `Marked ${count} notifications as read`,
        affectedCount: count,
      };
    } catch (error) {
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
        request.utilisateurId,
      );
      return { total: result.total, unread: result.unread };
    } catch (error) {
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
        request.utilisateurId,
      );
      return {
        success: true,
        message: `Deleted ${count} notifications`,
        affectedCount: count,
      };
    } catch (error) {
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
        affectedCount: count,
      };
    } catch (error) {
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
        request.organisationId,
        request.utilisateurId,
        request.clientId,
        request.clientNom,
      );
      return { notification: this.toGrpcNotification(notification) };
    } catch (error) {
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
        request.organisationId,
        request.utilisateurId,
        request.contratId,
        request.contratNumero,
        request.clientNom,
      );
      return { notification: this.toGrpcNotification(notification) };
    } catch (error) {
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
        request.organisationId,
        request.utilisateurId,
        request.contratId,
        request.contratNumero,
        request.dateExpiration,
        request.joursRestants,
      );
      return { notification: this.toGrpcNotification(notification) };
    } catch (error) {
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
        request.organisationId,
        request.utilisateurId,
        request.contratId,
        request.contratNumero,
        request.dateExpiration,
      );
      return { notification: this.toGrpcNotification(notification) };
    } catch (error) {
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
        request.organisationId,
        request.utilisateurId,
        request.factureId,
        request.factureNumero,
        request.clientNom,
        request.montant,
      );
      return { notification: this.toGrpcNotification(notification) };
    } catch (error) {
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
        request.organisationId,
        request.utilisateurId,
        request.tacheId,
        request.tacheTitre,
        request.assignePar,
      );
      return { notification: this.toGrpcNotification(notification) };
    } catch (error) {
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
        request.organisationId,
        request.utilisateurId,
        request.titre,
        request.message,
        request.lienUrl,
      );
      return { notification: this.toGrpcNotification(notification) };
    } catch (error) {
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
        request.organisationId,
        request.utilisateurId,
        request.titre,
        request.message,
        request.niveau,
      );
      return { notification: this.toGrpcNotification(notification) };
    } catch (error) {
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
        request.organisationId,
        request.utilisateurId,
        request.titre,
        request.message,
      );
      return { notification: this.toGrpcNotification(notification) };
    } catch (error) {
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
        request.organisationId,
        request.utilisateurIds,
        fromGrpcNotificationType(request.type),
        request.titre,
        request.message,
        mapToMetadata(request.metadata),
      );
      return {
        success: true,
        message: `Sent ${count} notifications`,
        affectedCount: count,
      };
    } catch (error) {
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
      connected: this.notificationGateway.isUserConnected(request.utilisateurId),
    };
  }

  // ============================================
  // Helper Methods
  // ============================================

  private toGrpcNotification(notification: any): ProtoNotification {
    return {
      id: notification.id,
      organisationId: notification.organisationId,
      utilisateurId: notification.utilisateurId,
      type: toGrpcNotificationType(notification.type),
      titre: notification.titre,
      message: notification.message,
      lu: notification.lu,
      metadata: metadataToMap(notification.metadata),
      lienUrl: notification.lienUrl,
      createdAt: notification.createdAt?.toISOString() ?? '',
      updatedAt: notification.updatedAt?.toISOString() ?? '',
    };
  }
}
