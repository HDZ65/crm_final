// Types de notifications correspondant au backend
export enum NotificationType {
  CONTRAT_EXPIRE = 'CONTRAT_EXPIRE',
  CONTRAT_BIENTOT_EXPIRE = 'CONTRAT_BIENTOT_EXPIRE',
  IMPAYE = 'IMPAYE',
  NOUVEAU_CLIENT = 'NOUVEAU_CLIENT',
  NOUVEAU_CONTRAT = 'NOUVEAU_CONTRAT',
  TACHE_ASSIGNEE = 'TACHE_ASSIGNEE',
  TACHE_EN_RETARD = 'TACHE_EN_RETARD',
  TACHE_ECHEANCE_DEMAIN = 'TACHE_ECHEANCE_DEMAIN',
  RAPPEL = 'RAPPEL',
  ALERTE = 'ALERTE',
  INFO = 'INFO',
  SYSTEME = 'SYSTEME',
  // Types pour les organisations
  INVITATION_RECEIVED = 'invitation_received',
  MEMBER_JOINED = 'member_joined',
  MEMBER_LEFT = 'member_left',
}

export interface Notification {
  id: string;
  type: NotificationType;
  titre: string;
  message: string;
  lu: boolean;
  utilisateurId: string;
  organisationId: string;
  metadata?: Record<string, unknown>;
  lienUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationCount {
  total: number;
  unread: number;
}

// Événements WebSocket
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

// Payload pour l'authentification WebSocket
export interface WebSocketAuthPayload {
  userId: string;
  organisationId: string;
}
