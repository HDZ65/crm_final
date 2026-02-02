import { credentials, SERVICES, promisify } from "./config";
import {
  NotificationServiceClient,
  type NotificationResponse,
  type NotificationListResponse,
  type GetNotificationsByUserRequest,
  type MarkAsReadRequest,
  type MarkAllAsReadRequest,
  type DeleteNotificationRequest,
  type DeleteAllByUserRequest,
  type OperationResponse,
  type UnreadCountResponse,
  type GetUnreadCountRequest,
} from "@proto/notifications/notifications";

let notificationInstance: NotificationServiceClient | null = null;

function getNotificationClient(): NotificationServiceClient {
  if (!notificationInstance) {
    notificationInstance = new NotificationServiceClient(
      SERVICES.notifications,
      credentials.createInsecure()
    );
  }
  return notificationInstance;
}

export const notifications = {
  getByUser: (request: GetNotificationsByUserRequest): Promise<NotificationListResponse> =>
    promisify<GetNotificationsByUserRequest, NotificationListResponse>(
      getNotificationClient(),
      "getNotificationsByUser"
    )(request),

  getUnreadByUser: (request: GetNotificationsByUserRequest): Promise<NotificationListResponse> =>
    promisify<GetNotificationsByUserRequest, NotificationListResponse>(
      getNotificationClient(),
      "getUnreadNotificationsByUser"
    )(request),

  getCount: (request: GetUnreadCountRequest): Promise<UnreadCountResponse> =>
    promisify<GetUnreadCountRequest, UnreadCountResponse>(
      getNotificationClient(),
      "getUnreadCount"
    )(request),

  markAsRead: (request: MarkAsReadRequest): Promise<OperationResponse> =>
    promisify<MarkAsReadRequest, OperationResponse>(
      getNotificationClient(),
      "markAsRead"
    )(request),

  markAllAsRead: (request: MarkAllAsReadRequest): Promise<OperationResponse> =>
    promisify<MarkAllAsReadRequest, OperationResponse>(
      getNotificationClient(),
      "markAllAsRead"
    )(request),

  delete: (request: DeleteNotificationRequest): Promise<OperationResponse> =>
    promisify<DeleteNotificationRequest, OperationResponse>(
      getNotificationClient(),
      "delete"
    )(request),

  deleteAll: (request: DeleteAllByUserRequest): Promise<OperationResponse> =>
    promisify<DeleteAllByUserRequest, OperationResponse>(
      getNotificationClient(),
      "deleteAllByUser"
    )(request),
};
