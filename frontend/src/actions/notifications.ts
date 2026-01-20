"use server";

import { notifications } from "@/lib/grpc";

export interface ActionResult<T> {
  data: T | null;
  error: string | null;
}

export interface NotificationData {
  id: string;
  type: string;
  titre: string;
  message: string;
  lu: boolean;
  utilisateurId: string;
  organisationId: string;
  metadata?: Record<string, string>;
  lienUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationCountData {
  total: number;
  unread: number;
}

/**
 * Get notifications for a user via gRPC
 */
export async function getNotificationsByUser(
  userId: string
): Promise<ActionResult<NotificationData[]>> {
  try {
    const response = await notifications.getByUser({ utilisateurId: userId });

    const data: NotificationData[] = (response.notifications || []).map((n) => ({
      id: n.id,
      type: String(n.type),
      titre: n.titre,
      message: n.message,
      lu: n.lu,
      utilisateurId: n.utilisateurId,
      organisationId: n.organisationId,
      metadata: n.metadata,
      lienUrl: n.lienUrl,
      createdAt: n.createdAt,
      updatedAt: n.updatedAt,
    }));

    return { data, error: null };
  } catch (err) {
    console.error("[getNotificationsByUser] error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors de la récupération des notifications",
    };
  }
}

/**
 * Get notification count for a user via gRPC
 */
export async function getNotificationCount(
  userId: string
): Promise<ActionResult<NotificationCountData>> {
  try {
    const response = await notifications.getCount({ utilisateurId: userId });

    return {
      data: {
        total: response.total,
        unread: response.unread,
      },
      error: null,
    };
  } catch (err) {
    console.error("[getNotificationCount] error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors du comptage des notifications",
    };
  }
}

/**
 * Mark a notification as read via gRPC
 */
export async function markNotificationAsRead(
  notificationId: string
): Promise<ActionResult<boolean>> {
  try {
    await notifications.markAsRead({ id: notificationId });
    return { data: true, error: null };
  } catch (err) {
    console.error("[markNotificationAsRead] error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors du marquage de la notification",
    };
  }
}

/**
 * Mark all notifications as read for a user via gRPC
 */
export async function markAllNotificationsAsRead(
  userId: string
): Promise<ActionResult<boolean>> {
  try {
    await notifications.markAllAsRead({ utilisateurId: userId });
    return { data: true, error: null };
  } catch (err) {
    console.error("[markAllNotificationsAsRead] error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors du marquage des notifications",
    };
  }
}

/**
 * Delete a notification via gRPC
 */
export async function deleteNotification(
  notificationId: string
): Promise<ActionResult<boolean>> {
  try {
    await notifications.delete({ id: notificationId });
    return { data: true, error: null };
  } catch (err) {
    console.error("[deleteNotification] error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors de la suppression de la notification",
    };
  }
}

/**
 * Delete all notifications for a user via gRPC
 */
export async function deleteAllNotifications(
  userId: string
): Promise<ActionResult<boolean>> {
  try {
    await notifications.deleteAll({ utilisateurId: userId });
    return { data: true, error: null };
  } catch (err) {
    console.error("[deleteAllNotifications] error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors de la suppression des notifications",
    };
  }
}
