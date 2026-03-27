import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { NatsService } from '@crm/shared-kernel';
import { NotificationService } from '../../../persistence/typeorm/repositories/engagement/notification.service';
import { NotificationType } from '../../../../domain/engagement/entities';

/**
 * Handler for Depanssur events via NATS
 * Subscribes to depanssur.* events and creates notifications for users
 */
@Injectable()
export class DepanssurEventsHandler implements OnModuleInit {
  private readonly logger = new Logger(DepanssurEventsHandler.name);

  constructor(
    private readonly natsService: NatsService,
    private readonly notificationService: NotificationService,
  ) {}

  async onModuleInit(): Promise<void> {
    this.logger.log('DepanssurEventsHandler initialized - subscribing to depanssur events');

    // Subscribe to all depanssur events
    await this.natsService.subscribe('depanssur.abonnement.created', this.handleAbonnementCreated.bind(this));
    await this.natsService.subscribe('depanssur.abonnement.status_changed', this.handleAbonnementStatusChanged.bind(this));
    await this.natsService.subscribe('depanssur.abonnement.upgraded', this.handleAbonnementUpgraded.bind(this));
    await this.natsService.subscribe('depanssur.abonnement.downgraded', this.handleAbonnementDowngraded.bind(this));
    await this.natsService.subscribe('depanssur.dossier.created', this.handleDossierCreated.bind(this));
    await this.natsService.subscribe('depanssur.dossier.status_changed', this.handleDossierStatusChanged.bind(this));
    await this.natsService.subscribe('depanssur.dossier.decision', this.handleDossierDecision.bind(this));
    await this.natsService.subscribe('depanssur.dossier.closed', this.handleDossierClosed.bind(this));
    await this.natsService.subscribe('depanssur.plafond.threshold_reached', this.handlePlafondThresholdReached.bind(this));
    await this.natsService.subscribe('depanssur.plafond.exceeded', this.handlePlafondExceeded.bind(this));
  }

  private async handleAbonnementCreated(data: any): Promise<void> {
    this.logger.log(`Processing depanssur.abonnement.created: ${data.abonnement_id}`);
    try {
      await this.createNotification({
        organisationId: data.organisation_id,
        clientId: data.client_id,
        type: 'DEPANSSUR_ABONNEMENT_CREATED',
        titre: 'Nouvel abonnement Depanssur',
        message: `Un nouvel abonnement ${data.formule} a été créé`,
        metadata: { abonnement_id: data.abonnement_id, formule: data.formule },
      });
    } catch (error: any) {
      this.logger.error(`Failed to process abonnement.created: ${data.abonnement_id}`, error.stack);
    }
  }

  private async handleAbonnementStatusChanged(data: any): Promise<void> {
    this.logger.log(`Processing depanssur.abonnement.status_changed: ${data.abonnement_id}`);
    try {
      await this.createNotification({
        organisationId: data.organisation_id,
        clientId: data.client_id,
        type: 'DEPANSSUR_ABONNEMENT_STATUS_CHANGED',
        titre: 'Changement de statut abonnement',
        message: `Statut de l'abonnement changé de ${data.ancien_statut} à ${data.nouveau_statut}`,
        metadata: { abonnement_id: data.abonnement_id, ancien_statut: data.ancien_statut, nouveau_statut: data.nouveau_statut },
      });
    } catch (error: any) {
      this.logger.error(`Failed to process abonnement.status_changed: ${data.abonnement_id}`, error.stack);
    }
  }

  private async handleAbonnementUpgraded(data: any): Promise<void> {
    this.logger.log(`Processing depanssur.abonnement.upgraded: ${data.abonnement_id}`);
    try {
      await this.createNotification({
        organisationId: data.organisation_id,
        clientId: data.client_id,
        type: 'DEPANSSUR_ABONNEMENT_UPGRADED',
        titre: 'Abonnement amélioré',
        message: `Abonnement amélioré de ${data.ancienne_formule} à ${data.nouvelle_formule}`,
        metadata: { abonnement_id: data.abonnement_id, ancienne_formule: data.ancienne_formule, nouvelle_formule: data.nouvelle_formule },
      });
    } catch (error: any) {
      this.logger.error(`Failed to process abonnement.upgraded: ${data.abonnement_id}`, error.stack);
    }
  }

  private async handleAbonnementDowngraded(data: any): Promise<void> {
    this.logger.log(`Processing depanssur.abonnement.downgraded: ${data.abonnement_id}`);
    try {
      await this.createNotification({
        organisationId: data.organisation_id,
        clientId: data.client_id,
        type: 'DEPANSSUR_ABONNEMENT_DOWNGRADED',
        titre: 'Abonnement réduit',
        message: `Abonnement réduit de ${data.ancienne_formule} à ${data.nouvelle_formule}`,
        metadata: { abonnement_id: data.abonnement_id, ancienne_formule: data.ancienne_formule, nouvelle_formule: data.nouvelle_formule },
      });
    } catch (error: any) {
      this.logger.error(`Failed to process abonnement.downgraded: ${data.abonnement_id}`, error.stack);
    }
  }

  private async handleDossierCreated(data: any): Promise<void> {
    this.logger.log(`Processing depanssur.dossier.created: ${data.dossier_id}`);
    try {
      await this.createNotification({
        organisationId: data.organisation_id,
        clientId: data.client_id,
        type: 'DEPANSSUR_DOSSIER_CREATED',
        titre: 'Nouveau dossier Depanssur',
        message: `Un nouveau dossier ${data.type_sinistre} a été créé`,
        metadata: { dossier_id: data.dossier_id, type_sinistre: data.type_sinistre, montant_declare: data.montant_declare },
      });
    } catch (error: any) {
      this.logger.error(`Failed to process dossier.created: ${data.dossier_id}`, error.stack);
    }
  }

  private async handleDossierStatusChanged(data: any): Promise<void> {
    this.logger.log(`Processing depanssur.dossier.status_changed: ${data.dossier_id}`);
    try {
      await this.createNotification({
        organisationId: data.organisation_id,
        clientId: data.client_id,
        type: 'DEPANSSUR_DOSSIER_STATUS_CHANGED',
        titre: 'Changement de statut dossier',
        message: `Statut du dossier changé de ${data.ancien_statut} à ${data.nouveau_statut}`,
        metadata: { dossier_id: data.dossier_id, ancien_statut: data.ancien_statut, nouveau_statut: data.nouveau_statut },
      });
    } catch (error: any) {
      this.logger.error(`Failed to process dossier.status_changed: ${data.dossier_id}`, error.stack);
    }
  }

  private async handleDossierDecision(data: any): Promise<void> {
    this.logger.log(`Processing depanssur.dossier.decision: ${data.dossier_id}`);
    try {
      const message = data.decision === 'ACCEPTE'
        ? `Dossier accepté - Montant accordé: ${data.montant_accorde}€`
        : `Dossier refusé - Motif: ${data.motif_refus || 'Non spécifié'}`;

      await this.createNotification({
        organisationId: data.organisation_id,
        clientId: data.client_id,
        type: 'DEPANSSUR_DOSSIER_DECISION',
        titre: 'Décision sur dossier',
        message,
        metadata: { dossier_id: data.dossier_id, decision: data.decision, montant_accorde: data.montant_accorde },
      });
    } catch (error: any) {
      this.logger.error(`Failed to process dossier.decision: ${data.dossier_id}`, error.stack);
    }
  }

  private async handleDossierClosed(data: any): Promise<void> {
    this.logger.log(`Processing depanssur.dossier.closed: ${data.dossier_id}`);
    try {
      await this.createNotification({
        organisationId: data.organisation_id,
        clientId: data.client_id,
        type: 'DEPANSSUR_DOSSIER_CLOSED',
        titre: 'Dossier clôturé',
        message: `Dossier clôturé - Motif: ${data.motif_cloture}`,
        metadata: { dossier_id: data.dossier_id, motif_cloture: data.motif_cloture },
      });
    } catch (error: any) {
      this.logger.error(`Failed to process dossier.closed: ${data.dossier_id}`, error.stack);
    }
  }

  private async handlePlafondThresholdReached(data: any): Promise<void> {
    this.logger.log(`Processing depanssur.plafond.threshold_reached: ${data.abonnement_id}`);
    try {
      await this.createNotification({
        organisationId: data.organisation_id,
        clientId: data.client_id,
        type: 'DEPANSSUR_PLAFOND_THRESHOLD',
        titre: 'Seuil de plafond atteint',
        message: `Attention: ${data.pourcentage_utilise.toFixed(0)}% du plafond annuel utilisé (${data.montant_utilise}€ / ${data.plafond_annuel}€)`,
        metadata: { abonnement_id: data.abonnement_id, plafond_annuel: data.plafond_annuel, montant_utilise: data.montant_utilise, pourcentage_utilise: data.pourcentage_utilise },
      });
    } catch (error: any) {
      this.logger.error(`Failed to process plafond.threshold_reached: ${data.abonnement_id}`, error.stack);
    }
  }

  private async handlePlafondExceeded(data: any): Promise<void> {
    this.logger.log(`Processing depanssur.plafond.exceeded: ${data.abonnement_id}`);
    try {
      await this.createNotification({
        organisationId: data.organisation_id,
        clientId: data.client_id,
        type: 'DEPANSSUR_PLAFOND_EXCEEDED',
        titre: 'Plafond dépassé',
        message: `ALERTE: Plafond annuel dépassé de ${data.montant_depasse}€ (${data.montant_utilise}€ / ${data.plafond_annuel}€)`,
        metadata: { abonnement_id: data.abonnement_id, plafond_annuel: data.plafond_annuel, montant_utilise: data.montant_utilise, montant_depasse: data.montant_depasse },
      });
    } catch (error: any) {
      this.logger.error(`Failed to process plafond.exceeded: ${data.abonnement_id}`, error.stack);
    }
  }

  private async createNotification(data: {
    organisationId: string;
    clientId: string;
    type: string;
    titre: string;
    message: string;
    metadata: Record<string, any>;
  }): Promise<void> {
    try {
      // Create notification for the client
      await this.notificationService.create({
        organisationId: data.organisationId,
        utilisateurId: data.clientId, // Assuming client_id maps to utilisateurId
        type: NotificationType.INFO,
        titre: data.titre,
        message: data.message,
        metadata: { ...data.metadata, eventType: data.type },
      });
      this.logger.debug(`Notification created: ${data.type} for client ${data.clientId}`);
    } catch (error: any) {
      this.logger.error(`Failed to create notification: ${data.type}`, error.stack);
      throw error;
    }
  }
}
