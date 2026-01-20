import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { NotificationEntity, NotificationType } from './entities/notification.entity';
import { NotificationGateway } from '../websocket/notification.gateway';

export interface CreateNotificationInput {
  organisationId: string;
  utilisateurId: string;
  type: NotificationType;
  titre: string;
  message: string;
  metadata?: Record<string, any>;
  lienUrl?: string;
  broadcastWebsocket?: boolean;
}

export interface UpdateNotificationInput {
  titre?: string;
  message?: string;
  lu?: boolean;
  metadata?: Record<string, any>;
  lienUrl?: string;
}

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    @InjectRepository(NotificationEntity)
    private readonly notificationRepository: Repository<NotificationEntity>,
    private readonly notificationGateway: NotificationGateway,
  ) {}

  // ===== CRUD Operations =====

  async create(input: CreateNotificationInput): Promise<NotificationEntity> {
    const notification = this.notificationRepository.create({
      organisationId: input.organisationId,
      utilisateurId: input.utilisateurId,
      type: input.type,
      titre: input.titre,
      message: input.message,
      metadata: input.metadata || {},
      lienUrl: input.lienUrl,
      lu: false,
    });

    const saved = await this.notificationRepository.save(notification);
    this.logger.log(`Created notification ${saved.id} for user ${input.utilisateurId}`);

    // Broadcast via WebSocket if requested
    if (input.broadcastWebsocket !== false) {
      this.notificationGateway.notifyNewNotification(
        input.utilisateurId,
        input.organisationId,
        saved,
      );
    }

    return saved;
  }

  async findById(id: string): Promise<NotificationEntity> {
    const notification = await this.notificationRepository.findOne({ where: { id } });
    if (!notification) {
      throw new NotFoundException(`Notification with id ${id} not found`);
    }
    return notification;
  }

  async findByOrganisation(
    organisationId: string,
    options?: {
      limit?: number;
      offset?: number;
      typeFilter?: NotificationType;
      unreadOnly?: boolean;
    },
  ): Promise<{ notifications: NotificationEntity[]; total: number }> {
    const qb = this.notificationRepository
      .createQueryBuilder('n')
      .where('n.organisation_id = :organisationId', { organisationId });

    if (options?.typeFilter) {
      qb.andWhere('n.type = :type', { type: options.typeFilter });
    }

    if (options?.unreadOnly) {
      qb.andWhere('n.lu = false');
    }

    qb.orderBy('n.created_at', 'DESC');

    const total = await qb.getCount();

    if (options?.limit) {
      qb.take(options.limit);
    }
    if (options?.offset) {
      qb.skip(options.offset);
    }

    const notifications = await qb.getMany();

    return { notifications, total };
  }

  async findByUtilisateur(
    utilisateurId: string,
    limit?: number,
    offset?: number,
  ): Promise<{ notifications: NotificationEntity[]; total: number }> {
    const [notifications, total] = await this.notificationRepository.findAndCount({
      where: { utilisateurId },
      take: limit || 50,
      skip: offset || 0,
      order: { createdAt: 'DESC' },
    });

    return { notifications, total };
  }

  async findUnreadByUtilisateur(
    utilisateurId: string,
    limit?: number,
    offset?: number,
  ): Promise<{ notifications: NotificationEntity[]; total: number }> {
    const [notifications, total] = await this.notificationRepository.findAndCount({
      where: { utilisateurId, lu: false },
      take: limit || 50,
      skip: offset || 0,
      order: { createdAt: 'DESC' },
    });

    return { notifications, total };
  }

  async update(id: string, input: UpdateNotificationInput): Promise<NotificationEntity> {
    const notification = await this.findById(id);
    Object.assign(notification, input);
    return this.notificationRepository.save(notification);
  }

  async delete(id: string): Promise<void> {
    const notification = await this.findById(id);
    await this.notificationRepository.remove(notification);

    this.notificationGateway.notifyNotificationDeleted(
      notification.utilisateurId,
      notification.organisationId,
      id,
    );

    this.logger.log(`Deleted notification ${id}`);
  }

  // ===== Read Status Management =====

  async markAsRead(id: string): Promise<NotificationEntity> {
    const notification = await this.findById(id);
    notification.lu = true;
    const updated = await this.notificationRepository.save(notification);

    this.notificationGateway.notifyNotificationRead(
      notification.utilisateurId,
      notification.organisationId,
      id,
    );

    return updated;
  }

  async markAllAsRead(utilisateurId: string): Promise<number> {
    const result = await this.notificationRepository.update(
      { utilisateurId, lu: false },
      { lu: true },
    );

    const notification = await this.notificationRepository.findOne({
      where: { utilisateurId },
    });

    if (notification) {
      this.notificationGateway.notifyAllNotificationsRead(
        utilisateurId,
        notification.organisationId,
      );
    }

    return result.affected || 0;
  }

  async getUnreadCount(utilisateurId: string): Promise<{ total: number; unread: number }> {
    const total = await this.notificationRepository.count({
      where: { utilisateurId },
    });

    const unread = await this.notificationRepository.count({
      where: { utilisateurId, lu: false },
    });

    return { total, unread };
  }

  // ===== Batch Operations =====

  async deleteAllByUser(utilisateurId: string): Promise<number> {
    const result = await this.notificationRepository.delete({ utilisateurId });
    this.logger.log(`Deleted all notifications for user ${utilisateurId}`);
    return result.affected || 0;
  }

  async deleteOlderThan(date: Date): Promise<number> {
    const result = await this.notificationRepository.delete({
      createdAt: LessThan(date),
    });
    this.logger.log(`Deleted ${result.affected} notifications older than ${date.toISOString()}`);
    return result.affected || 0;
  }

  // ===== Business Notifications =====

  async notifyNewClient(
    organisationId: string,
    utilisateurId: string,
    clientId: string,
    clientNom: string,
  ): Promise<NotificationEntity> {
    const notification = await this.create({
      organisationId,
      utilisateurId,
      type: NotificationType.NOUVEAU_CLIENT,
      titre: 'Nouveau client',
      message: `Le client ${clientNom} a été créé.`,
      metadata: { clientId, clientNom },
      lienUrl: `/clients/${clientId}`,
    });

    this.notificationGateway.notifyNewClient(utilisateurId, organisationId, {
      clientId,
      clientNom,
    });

    return notification;
  }

  async notifyNewContrat(
    organisationId: string,
    utilisateurId: string,
    contratId: string,
    contratNumero: string,
    clientNom: string,
  ): Promise<NotificationEntity> {
    const notification = await this.create({
      organisationId,
      utilisateurId,
      type: NotificationType.NOUVEAU_CONTRAT,
      titre: 'Nouveau contrat',
      message: `Le contrat ${contratNumero} pour ${clientNom} a été créé.`,
      metadata: { contratId, contratNumero, clientNom },
      lienUrl: `/contrats/${contratId}`,
    });

    this.notificationGateway.notifyNewContrat(utilisateurId, organisationId, {
      contratId,
      contratNumero,
      clientNom,
    });

    return notification;
  }

  async notifyContratExpiringSoon(
    organisationId: string,
    utilisateurId: string,
    contratId: string,
    contratNumero: string,
    dateExpiration: string,
    joursRestants: number,
  ): Promise<NotificationEntity> {
    const notification = await this.create({
      organisationId,
      utilisateurId,
      type: NotificationType.CONTRAT_BIENTOT_EXPIRE,
      titre: 'Contrat bientôt expiré',
      message: `Le contrat ${contratNumero} expire dans ${joursRestants} jours (${dateExpiration}).`,
      metadata: { contratId, contratNumero, dateExpiration, joursRestants },
      lienUrl: `/contrats/${contratId}`,
    });

    this.notificationGateway.notifyContratExpiringSoon(utilisateurId, organisationId, {
      contratId,
      contratNumero,
      dateExpiration,
      joursRestants,
    });

    return notification;
  }

  async notifyContratExpired(
    organisationId: string,
    utilisateurId: string,
    contratId: string,
    contratNumero: string,
    dateExpiration: string,
  ): Promise<NotificationEntity> {
    return this.create({
      organisationId,
      utilisateurId,
      type: NotificationType.CONTRAT_EXPIRE,
      titre: 'Contrat expiré',
      message: `Le contrat ${contratNumero} a expiré le ${dateExpiration}.`,
      metadata: { contratId, contratNumero, dateExpiration },
      lienUrl: `/contrats/${contratId}`,
    });
  }

  async notifyImpaye(
    organisationId: string,
    utilisateurId: string,
    factureId: string,
    factureNumero: string,
    clientNom: string,
    montant: string,
  ): Promise<NotificationEntity> {
    const notification = await this.create({
      organisationId,
      utilisateurId,
      type: NotificationType.IMPAYE,
      titre: 'Facture impayée',
      message: `La facture ${factureNumero} de ${clientNom} (${montant}) est impayée.`,
      metadata: { factureId, factureNumero, clientNom, montant },
      lienUrl: `/factures/${factureId}`,
    });

    this.notificationGateway.notifyImpaye(utilisateurId, organisationId, {
      factureId,
      factureNumero,
      clientNom,
      montant,
    });

    return notification;
  }

  async notifyTacheAssignee(
    organisationId: string,
    utilisateurId: string,
    tacheId: string,
    tacheTitre: string,
    assignePar: string,
  ): Promise<NotificationEntity> {
    return this.create({
      organisationId,
      utilisateurId,
      type: NotificationType.TACHE_ASSIGNEE,
      titre: 'Tâche assignée',
      message: `${assignePar} vous a assigné la tâche: ${tacheTitre}`,
      metadata: { tacheId, tacheTitre, assignePar },
      lienUrl: `/taches/${tacheId}`,
    });
  }

  async notifyRappel(
    organisationId: string,
    utilisateurId: string,
    titre: string,
    message: string,
    lienUrl?: string,
  ): Promise<NotificationEntity> {
    return this.create({
      organisationId,
      utilisateurId,
      type: NotificationType.RAPPEL,
      titre,
      message,
      lienUrl,
    });
  }

  async notifyAlerte(
    organisationId: string,
    utilisateurId: string,
    titre: string,
    message: string,
    niveau: string,
  ): Promise<NotificationEntity> {
    return this.create({
      organisationId,
      utilisateurId,
      type: NotificationType.ALERTE,
      titre,
      message,
      metadata: { niveau },
    });
  }

  async notifyInfo(
    organisationId: string,
    utilisateurId: string,
    titre: string,
    message: string,
  ): Promise<NotificationEntity> {
    return this.create({
      organisationId,
      utilisateurId,
      type: NotificationType.INFO,
      titre,
      message,
    });
  }

  // ===== Broadcast to Organisation =====

  async notifyOrganisation(
    organisationId: string,
    utilisateurIds: string[],
    type: NotificationType,
    titre: string,
    message: string,
    metadata?: Record<string, any>,
  ): Promise<number> {
    let count = 0;

    for (const utilisateurId of utilisateurIds) {
      await this.create({
        organisationId,
        utilisateurId,
        type,
        titre,
        message,
        metadata,
      });
      count++;
    }

    return count;
  }
}
