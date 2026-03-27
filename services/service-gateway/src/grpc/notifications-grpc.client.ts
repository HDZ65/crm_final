import { Injectable, Inject, OnModuleInit, Logger } from '@nestjs/common';
import type { ClientGrpc } from '@nestjs/microservices';
import { Observable } from 'rxjs';
import { wrapGrpcCall } from './base-grpc.client';

export interface NotificationServiceClient {
  CreateNotification(data: Record<string, unknown>): Observable<unknown>;
  GetNotification(data: Record<string, unknown>): Observable<unknown>;
  GetNotifications(data: Record<string, unknown>): Observable<unknown>;
  GetNotificationsByUser(data: Record<string, unknown>): Observable<unknown>;
  GetUnreadNotificationsByUser(data: Record<string, unknown>): Observable<unknown>;
  UpdateNotification(data: Record<string, unknown>): Observable<unknown>;
  DeleteNotification(data: Record<string, unknown>): Observable<unknown>;
  MarkAsRead(data: Record<string, unknown>): Observable<unknown>;
  MarkAllAsRead(data: Record<string, unknown>): Observable<unknown>;
  GetUnreadCount(data: Record<string, unknown>): Observable<unknown>;
  DeleteAllByUser(data: Record<string, unknown>): Observable<unknown>;
  DeleteOlderThan(data: Record<string, unknown>): Observable<unknown>;
  NotifyNewClient(data: Record<string, unknown>): Observable<unknown>;
  NotifyNewContrat(data: Record<string, unknown>): Observable<unknown>;
  NotifyContratExpiringSoon(data: Record<string, unknown>): Observable<unknown>;
  NotifyContratExpired(data: Record<string, unknown>): Observable<unknown>;
  NotifyImpaye(data: Record<string, unknown>): Observable<unknown>;
  NotifyTacheAssignee(data: Record<string, unknown>): Observable<unknown>;
  NotifyRappel(data: Record<string, unknown>): Observable<unknown>;
  NotifyAlerte(data: Record<string, unknown>): Observable<unknown>;
  NotifyInfo(data: Record<string, unknown>): Observable<unknown>;
  NotifyOrganisation(data: Record<string, unknown>): Observable<unknown>;
  GetConnectedUsersCount(data: Record<string, unknown>): Observable<unknown>;
  IsUserConnected(data: Record<string, unknown>): Observable<unknown>;
}

@Injectable()
export class NotificationsGrpcClient implements OnModuleInit {
  private readonly logger = new Logger(NotificationsGrpcClient.name);
  private notificationService: NotificationServiceClient;

  constructor(@Inject('ENGAGEMENT_PACKAGE') private client: ClientGrpc) {}

  onModuleInit() {
    this.notificationService =
      this.client.getService<NotificationServiceClient>('NotificationService');
  }

  // ===== CRUD Operations =====

  createNotification(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.notificationService.CreateNotification(data),
      this.logger,
      'NotificationService',
      'CreateNotification',
    );
  }

  getNotification(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.notificationService.GetNotification(data),
      this.logger,
      'NotificationService',
      'GetNotification',
    );
  }

  getNotifications(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.notificationService.GetNotifications(data),
      this.logger,
      'NotificationService',
      'GetNotifications',
    );
  }

  getNotificationsByUser(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.notificationService.GetNotificationsByUser(data),
      this.logger,
      'NotificationService',
      'GetNotificationsByUser',
    );
  }

  getUnreadNotificationsByUser(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.notificationService.GetUnreadNotificationsByUser(data),
      this.logger,
      'NotificationService',
      'GetUnreadNotificationsByUser',
    );
  }

  updateNotification(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.notificationService.UpdateNotification(data),
      this.logger,
      'NotificationService',
      'UpdateNotification',
    );
  }

  deleteNotification(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.notificationService.DeleteNotification(data),
      this.logger,
      'NotificationService',
      'DeleteNotification',
    );
  }

  // ===== Read Status Management =====

  markAsRead(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.notificationService.MarkAsRead(data),
      this.logger,
      'NotificationService',
      'MarkAsRead',
    );
  }

  markAllAsRead(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.notificationService.MarkAllAsRead(data),
      this.logger,
      'NotificationService',
      'MarkAllAsRead',
    );
  }

  getUnreadCount(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.notificationService.GetUnreadCount(data),
      this.logger,
      'NotificationService',
      'GetUnreadCount',
    );
  }

  // ===== Batch Operations =====

  deleteAllByUser(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.notificationService.DeleteAllByUser(data),
      this.logger,
      'NotificationService',
      'DeleteAllByUser',
    );
  }

  deleteOlderThan(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.notificationService.DeleteOlderThan(data),
      this.logger,
      'NotificationService',
      'DeleteOlderThan',
    );
  }

  // ===== Business Notifications =====

  notifyNewClient(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.notificationService.NotifyNewClient(data),
      this.logger,
      'NotificationService',
      'NotifyNewClient',
    );
  }

  notifyNewContrat(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.notificationService.NotifyNewContrat(data),
      this.logger,
      'NotificationService',
      'NotifyNewContrat',
    );
  }

  notifyContratExpiringSoon(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.notificationService.NotifyContratExpiringSoon(data),
      this.logger,
      'NotificationService',
      'NotifyContratExpiringSoon',
    );
  }

  notifyContratExpired(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.notificationService.NotifyContratExpired(data),
      this.logger,
      'NotificationService',
      'NotifyContratExpired',
    );
  }

  notifyImpaye(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.notificationService.NotifyImpaye(data),
      this.logger,
      'NotificationService',
      'NotifyImpaye',
    );
  }

  notifyTacheAssignee(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.notificationService.NotifyTacheAssignee(data),
      this.logger,
      'NotificationService',
      'NotifyTacheAssignee',
    );
  }

  notifyRappel(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.notificationService.NotifyRappel(data),
      this.logger,
      'NotificationService',
      'NotifyRappel',
    );
  }

  notifyAlerte(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.notificationService.NotifyAlerte(data),
      this.logger,
      'NotificationService',
      'NotifyAlerte',
    );
  }

  notifyInfo(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.notificationService.NotifyInfo(data),
      this.logger,
      'NotificationService',
      'NotifyInfo',
    );
  }

  // ===== Broadcast =====

  notifyOrganisation(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.notificationService.NotifyOrganisation(data),
      this.logger,
      'NotificationService',
      'NotifyOrganisation',
    );
  }

  // ===== WebSocket Status =====

  getConnectedUsersCount(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.notificationService.GetConnectedUsersCount(data),
      this.logger,
      'NotificationService',
      'GetConnectedUsersCount',
    );
  }

  isUserConnected(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.notificationService.IsUserConnected(data),
      this.logger,
      'NotificationService',
      'IsUserConnected',
    );
  }
}
