import { Injectable, Inject } from '@nestjs/common';
import {
  NotificationEntity,
  NotificationType,
} from '../../core/domain/notification.entity';
import type { NotificationRepositoryPort } from '../../core/port/notification-repository.port';
import { NotificationGateway } from '../websocket/notification.gateway';

export interface CreateNotificationParams {
  organisationId: string;
  utilisateurId: string;
  type: NotificationType;
  titre: string;
  message: string;
  metadata?: Record<string, any>;
  lienUrl?: string;
}

@Injectable()
export class NotificationService {
  constructor(
    @Inject('NotificationRepositoryPort')
    private readonly repository: NotificationRepositoryPort,
    private readonly gateway: NotificationGateway,
  ) {}

  /**
   * Crée une notification et l'envoie en temps réel via WebSocket
   */
  async createAndNotify(
    params: CreateNotificationParams,
  ): Promise<NotificationEntity> {
    const notification = new NotificationEntity({
      organisationId: params.organisationId,
      utilisateurId: params.utilisateurId,
      type: params.type,
      titre: params.titre,
      message: params.message,
      lu: false,
      metadata: params.metadata,
      lienUrl: params.lienUrl,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const saved = await this.repository.create(notification);

    // Envoyer via WebSocket
    this.gateway.notifyNewNotification(params.utilisateurId, {
      id: saved.id,
      type: saved.type,
      titre: saved.titre,
      message: saved.message,
      metadata: saved.metadata,
      lienUrl: saved.lienUrl,
      createdAt: saved.createdAt,
    });

    return saved;
  }

  /**
   * Envoie une notification à tous les utilisateurs d'une organisation
   */
  async notifyOrganisation(
    organisationId: string,
    utilisateurIds: string[],
    params: Omit<CreateNotificationParams, 'organisationId' | 'utilisateurId'>,
  ): Promise<NotificationEntity[]> {
    const notifications: NotificationEntity[] = [];

    for (const utilisateurId of utilisateurIds) {
      const notification = await this.createAndNotify({
        organisationId,
        utilisateurId,
        ...params,
      });
      notifications.push(notification);
    }

    return notifications;
  }

  // ============ NOTIFICATIONS MÉTIER PRÉ-DÉFINIES ============

  /**
   * Notification: Nouveau client créé
   */
  async notifyNewClient(
    organisationId: string,
    utilisateurId: string,
    clientNom: string,
    clientId: string,
  ): Promise<NotificationEntity> {
    return this.createAndNotify({
      organisationId,
      utilisateurId,
      type: 'NOUVEAU_CLIENT',
      titre: 'Nouveau client',
      message: `Le client "${clientNom}" a été créé.`,
      metadata: { clientId, clientNom },
      lienUrl: `/clients/${clientId}`,
    });
  }

  /**
   * Notification: Nouveau contrat créé
   */
  async notifyNewContrat(
    organisationId: string,
    utilisateurId: string,
    contratRef: string,
    contratId: string,
    clientNom: string,
  ): Promise<NotificationEntity> {
    return this.createAndNotify({
      organisationId,
      utilisateurId,
      type: 'NOUVEAU_CONTRAT',
      titre: 'Nouveau contrat',
      message: `Le contrat "${contratRef}" pour "${clientNom}" a été créé.`,
      metadata: { contratId, contratRef, clientNom },
      lienUrl: `/contrats/${contratId}`,
    });
  }

  /**
   * Notification: Contrat expire bientôt
   */
  async notifyContratExpiringSoon(
    organisationId: string,
    utilisateurId: string,
    contratRef: string,
    contratId: string,
    dateFin: string,
    joursRestants: number,
  ): Promise<NotificationEntity> {
    return this.createAndNotify({
      organisationId,
      utilisateurId,
      type: 'CONTRAT_BIENTOT_EXPIRE',
      titre: 'Contrat expire bientôt',
      message: `Le contrat "${contratRef}" expire dans ${joursRestants} jours (${dateFin}).`,
      metadata: { contratId, contratRef, dateFin, joursRestants },
      lienUrl: `/contrats/${contratId}`,
    });
  }

  /**
   * Notification: Contrat expiré
   */
  async notifyContratExpired(
    organisationId: string,
    utilisateurId: string,
    contratRef: string,
    contratId: string,
  ): Promise<NotificationEntity> {
    return this.createAndNotify({
      organisationId,
      utilisateurId,
      type: 'CONTRAT_EXPIRE',
      titre: 'Contrat expiré',
      message: `Le contrat "${contratRef}" a expiré.`,
      metadata: { contratId, contratRef },
      lienUrl: `/contrats/${contratId}`,
    });
  }

  /**
   * Notification: Client avec impayé
   */
  async notifyImpaye(
    organisationId: string,
    utilisateurId: string,
    clientNom: string,
    clientId: string,
    montant?: number,
  ): Promise<NotificationEntity> {
    const montantStr = montant ? ` (${montant.toFixed(2)} €)` : '';
    return this.createAndNotify({
      organisationId,
      utilisateurId,
      type: 'IMPAYE',
      titre: 'Impayé détecté',
      message: `Le client "${clientNom}" a un impayé${montantStr}.`,
      metadata: { clientId, clientNom, montant },
      lienUrl: `/clients/${clientId}`,
    });
  }

  /**
   * Notification: Tâche assignée
   */
  async notifyTacheAssignee(
    organisationId: string,
    utilisateurId: string,
    tacheTitre: string,
    tacheId: string,
    assignePar: string,
  ): Promise<NotificationEntity> {
    return this.createAndNotify({
      organisationId,
      utilisateurId,
      type: 'TACHE_ASSIGNEE',
      titre: 'Nouvelle tâche assignée',
      message: `"${tacheTitre}" vous a été assignée par ${assignePar}.`,
      metadata: { tacheId, tacheTitre, assignePar },
      lienUrl: `/taches/${tacheId}`,
    });
  }

  /**
   * Notification: Rappel
   */
  async notifyRappel(
    organisationId: string,
    utilisateurId: string,
    titre: string,
    message: string,
    lienUrl?: string,
  ): Promise<NotificationEntity> {
    return this.createAndNotify({
      organisationId,
      utilisateurId,
      type: 'RAPPEL',
      titre,
      message,
      lienUrl,
    });
  }

  /**
   * Notification: Alerte système
   */
  async notifyAlerte(
    organisationId: string,
    utilisateurId: string,
    titre: string,
    message: string,
    metadata?: Record<string, any>,
  ): Promise<NotificationEntity> {
    return this.createAndNotify({
      organisationId,
      utilisateurId,
      type: 'ALERTE',
      titre,
      message,
      metadata,
    });
  }

  /**
   * Notification: Information générale
   */
  async notifyInfo(
    organisationId: string,
    utilisateurId: string,
    titre: string,
    message: string,
    lienUrl?: string,
  ): Promise<NotificationEntity> {
    return this.createAndNotify({
      organisationId,
      utilisateurId,
      type: 'INFO',
      titre,
      message,
      lienUrl,
    });
  }
}
