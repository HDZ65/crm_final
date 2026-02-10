/**
 * UI-specific notification types (no proto equivalent)
 */
import type { Notification } from "@proto/notifications/notifications";

export interface NotificationCount {
  total: number;
  unread: number;
}

export interface NotificationEvents {
  'notification:new': Notification;
  'notification:read': { id: string };
  'notification:all-read': void;
  'notification:deleted': { id: string };
  'client:new': { id: string; nom: string };
  'contrat:new': { id: string; numero: string };
  'contrat:expiring-soon': { id: string; numero: string; daysLeft: number };
  'client:impaye': { clientId: string; clientNom: string; montant: number };
}

export interface WebSocketAuthPayload {
  userId: string;
  organisationId: string;
}
