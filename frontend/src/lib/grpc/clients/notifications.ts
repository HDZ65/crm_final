import { createAuthChannelCredentials } from "@/lib/grpc/auth";
import { credentials, SERVICES, promisify, makeClient, type GrpcClient } from "./config";
import {
  NotificationServiceService,
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

let notificationInstance: GrpcClient | null = null;

function getNotificationClient(): GrpcClient {
  if (!notificationInstance) {
    notificationInstance = makeClient(
      NotificationServiceService,
      "NotificationService",
      SERVICES.notifications,
      createAuthChannelCredentials(credentials.createInsecure())
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
