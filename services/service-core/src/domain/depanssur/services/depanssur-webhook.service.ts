import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  WebhookEventLogEntity,
  WebhookEventStatus,
} from '../entities/webhook-event-log.entity';
import { ClientBaseService } from '../../../infrastructure/persistence/typeorm/repositories/clients/client-base.service';
import { AbonnementService } from '../../../infrastructure/persistence/typeorm/repositories/depanssur/abonnement.service';
import { DossierDeclaratifService } from '../../../infrastructure/persistence/typeorm/repositories/depanssur/dossier-declaratif.service';
import { RegleDepanssurService } from './regle-depanssur.service';

export interface DepanssurWebhookPayload {
  eventId: string;
  eventType: string;
  timestamp: string;
  data: Record<string, any>;
}

@Injectable()
export class DepanssurWebhookService {
  private readonly logger = new Logger(DepanssurWebhookService.name);

  constructor(
    @InjectRepository(WebhookEventLogEntity)
    private readonly webhookLogRepository: Repository<WebhookEventLogEntity>,
    private readonly clientBaseService: ClientBaseService,
    private readonly abonnementService: AbonnementService,
    private readonly dossierDeclaratifService: DossierDeclaratifService,
    private readonly regleDepanssurService: RegleDepanssurService,
  ) {}

  /**
   * Main entry point: log event, check idempotency, dispatch to handler, update status.
   * Returns the log entry (caller can respond 200 immediately).
   */
  async processWebhook(
    payload: DepanssurWebhookPayload,
    signature: string | null,
  ): Promise<WebhookEventLogEntity> {
    // 1. Persist the raw event (idempotency check via unique constraint)
    const logEntry = await this.logEvent(payload, signature);
    if (logEntry.isDuplicate()) {
      this.logger.warn(`Duplicate webhook event: ${payload.eventId}`);
      return logEntry;
    }

    // 2. Dispatch async — do not block the HTTP response
    setImmediate(() => {
      this.dispatchEvent(logEntry, payload).catch((err) => {
        this.logger.error(
          `Unhandled error dispatching webhook ${payload.eventId}: ${err.message}`,
          err.stack,
        );
      });
    });

    return logEntry;
  }

  /**
   * Log event with idempotency via unique eventId constraint.
   * If eventId already exists, mark as DUPLICATE.
   */
  private async logEvent(
    payload: DepanssurWebhookPayload,
    signature: string | null,
  ): Promise<WebhookEventLogEntity> {
    // Check for existing event
    const existing = await this.webhookLogRepository.findOne({
      where: { eventId: payload.eventId },
    });

    if (existing) {
      existing.markDuplicate();
      return existing; // Don't save again — just return in-memory mark
    }

    const entry = this.webhookLogRepository.create({
      eventId: payload.eventId,
      eventType: payload.eventType,
      rawPayload: JSON.stringify(payload),
      signature,
      status: WebhookEventStatus.RECEIVED,
    });

    try {
      return await this.webhookLogRepository.save(entry);
    } catch (error: any) {
      // Handle race condition on unique constraint (concurrent same eventId)
      if (error?.code === '23505' || error?.detail?.includes('already exists')) {
        entry.markDuplicate();
        return entry;
      }
      throw error;
    }
  }

  /**
   * Dispatch event to the appropriate handler based on eventType.
   */
  private async dispatchEvent(
    logEntry: WebhookEventLogEntity,
    payload: DepanssurWebhookPayload,
  ): Promise<void> {
    try {
      switch (payload.eventType) {
        case 'customer.created':
          await this.handleCustomerCreated(payload.data);
          break;
        case 'customer.updated':
          await this.handleCustomerUpdated(payload.data);
          break;
        case 'subscription.created':
          await this.handleSubscriptionCreated(payload.data);
          break;
        case 'subscription.updated':
          await this.handleSubscriptionUpdated(payload.data);
          break;
        case 'case.created':
          await this.handleCaseCreated(payload.data);
          break;
        case 'case.updated':
          await this.handleCaseUpdated(payload.data);
          break;
        case 'case.closed':
          await this.handleCaseClosed(payload.data);
          break;
        case 'case.decision':
          await this.handleCaseDecision(payload.data);
          break;
        default:
          this.logger.warn(`Unknown webhook event type: ${payload.eventType}`);
          break;
      }

      logEntry.markProcessed();
      await this.webhookLogRepository.save(logEntry);
      this.logger.log(`Webhook processed: ${payload.eventId} (${payload.eventType})`);
    } catch (error: any) {
      logEntry.markFailed(error.message ?? 'Unknown error');
      await this.webhookLogRepository.save(logEntry).catch((saveErr) => {
        this.logger.error(`Failed to save webhook error status: ${saveErr.message}`);
      });
      this.logger.error(
        `Webhook processing failed: ${payload.eventId} (${payload.eventType}) — ${error.message}`,
        error.stack,
      );
    }
  }

  // ---------------------------------------------------------------------------
  // Event Handlers
  // ---------------------------------------------------------------------------

  /**
   * customer.created → Upsert ClientBase
   */
  async handleCustomerCreated(data: Record<string, any>): Promise<void> {
    this.logger.log(`handleCustomerCreated: ${JSON.stringify(data)}`);

    await this.clientBaseService.create({
      organisationId: data.organisationId ?? data.organisation_id,
      typeClient: data.typeClient ?? data.type_client ?? 'PARTICULIER',
      nom: data.nom ?? data.lastName ?? '',
      prenom: data.prenom ?? data.firstName ?? '',
      dateNaissance: data.dateNaissance ?? data.date_naissance ?? null,
      compteCode: data.compteCode ?? data.compte_code ?? 'DEFAULT',
      partenaireId: data.partenaireId ?? data.partenaire_id,
      telephone: data.telephone ?? data.phone ?? '',
      email: data.email ?? null,
      statut: data.statut ?? 'ACTIF',
      societeId: data.societeId ?? data.societe_id ?? null,
      civilite: data.civilite ?? null,
    });
  }

  /**
   * customer.updated → Update existing ClientBase
   */
  async handleCustomerUpdated(data: Record<string, any>): Promise<void> {
    this.logger.log(`handleCustomerUpdated: clientId=${data.clientId ?? data.client_id}`);

    const clientId = data.clientId ?? data.client_id;
    if (!clientId) {
      throw new Error('customer.updated: clientId is required');
    }

    await this.clientBaseService.update({
      id: clientId,
      nom: data.nom ?? data.lastName,
      prenom: data.prenom ?? data.firstName,
      telephone: data.telephone ?? data.phone,
      email: data.email,
      statut: data.statut,
      civilite: data.civilite,
    });
  }

  /**
   * subscription.created → Upsert AbonnementDepanssur
   */
  async handleSubscriptionCreated(data: Record<string, any>): Promise<void> {
    this.logger.log(`handleSubscriptionCreated: clientId=${data.clientId ?? data.client_id}`);

    await this.abonnementService.create({
      organisationId: data.organisationId ?? data.organisation_id,
      clientId: data.clientId ?? data.client_id,
      planType: data.planType ?? data.plan_type ?? 'ESSENTIEL',
      periodicite: data.periodicite ?? 'MENSUELLE',
      periodeAttente: data.periodeAttente ?? data.periode_attente ?? 0,
      franchise: data.franchise ?? null,
      plafondParIntervention: data.plafondParIntervention ?? data.plafond_par_intervention ?? null,
      plafondAnnuel: data.plafondAnnuel ?? data.plafond_annuel ?? null,
      nbInterventionsMax: data.nbInterventionsMax ?? data.nb_interventions_max ?? null,
      dateSouscription: data.dateSouscription ?? data.date_souscription ?? new Date().toISOString(),
      dateEffet: data.dateEffet ?? data.date_effet ?? new Date().toISOString(),
      prochaineEcheance: data.prochaineEcheance ?? data.prochaine_echeance ?? new Date().toISOString(),
      prixTtc: data.prixTtc ?? data.prix_ttc ?? '0.00',
      tauxTva: data.tauxTva ?? data.taux_tva ?? '20.00',
      montantHt: data.montantHt ?? data.montant_ht ?? '0.00',
    });
  }

  /**
   * subscription.updated → Update existing AbonnementDepanssur
   */
  async handleSubscriptionUpdated(data: Record<string, any>): Promise<void> {
    this.logger.log(`handleSubscriptionUpdated: id=${data.abonnementId ?? data.abonnement_id}`);

    const abonnementId = data.abonnementId ?? data.abonnement_id ?? data.id;
    if (!abonnementId) {
      throw new Error('subscription.updated: abonnementId is required');
    }

    await this.abonnementService.update({
      id: abonnementId,
      planType: data.planType ?? data.plan_type,
      periodicite: data.periodicite,
      statut: data.statut,
      motifResiliation: data.motifResiliation ?? data.motif_resiliation,
      dateFin: data.dateFin ?? data.date_fin,
      prochaineEcheance: data.prochaineEcheance ?? data.prochaine_echeance,
      prixTtc: data.prixTtc ?? data.prix_ttc,
      tauxTva: data.tauxTva ?? data.taux_tva,
      montantHt: data.montantHt ?? data.montant_ht,
    });
  }

  /**
   * case.created → Create DossierDeclaratif with status ENREGISTRE
   */
  async handleCaseCreated(data: Record<string, any>): Promise<void> {
    this.logger.log(`handleCaseCreated: ref=${data.referenceExterne ?? data.reference_externe}`);

    await this.dossierDeclaratifService.create({
      organisationId: data.organisationId ?? data.organisation_id,
      abonnementId: data.abonnementId ?? data.abonnement_id,
      clientId: data.clientId ?? data.client_id,
      referenceExterne: data.referenceExterne ?? data.reference_externe,
      dateOuverture: data.dateOuverture ?? data.date_ouverture ?? new Date().toISOString(),
      type: data.type ?? 'AUTRE',
      adresseRisqueId: data.adresseRisqueId ?? data.adresse_risque_id ?? null,
      montantEstimatif: data.montantEstimatif ?? data.montant_estimatif ?? null,
    });
  }

  /**
   * case.updated → Update dossier status & fields
   */
  async handleCaseUpdated(data: Record<string, any>): Promise<void> {
    const dossierId = await this.resolveDossierId(data);
    this.logger.log(`handleCaseUpdated: dossierId=${dossierId}`);

    await this.dossierDeclaratifService.update({
      id: dossierId,
      statut: data.statut,
      montantEstimatif: data.montantEstimatif ?? data.montant_estimatif,
      priseEnCharge: data.priseEnCharge ?? data.prise_en_charge,
      franchiseAppliquee: data.franchiseAppliquee ?? data.franchise_appliquee,
      resteACharge: data.resteACharge ?? data.reste_a_charge,
      montantPrisEnCharge: data.montantPrisEnCharge ?? data.montant_pris_en_charge,
      npsScore: data.npsScore ?? data.nps_score,
      npsCommentaire: data.npsCommentaire ?? data.nps_commentaire,
      adresseRisqueId: data.adresseRisqueId ?? data.adresse_risque_id,
      motif: data.motif,
    });
  }

  /**
   * case.closed → Update dossier to CLOTURE + set dateCloture
   */
  async handleCaseClosed(data: Record<string, any>): Promise<void> {
    const dossierId = await this.resolveDossierId(data);
    this.logger.log(`handleCaseClosed: dossierId=${dossierId}`);

    await this.dossierDeclaratifService.update({
      id: dossierId,
      statut: 'CLOTURE',
      dateCloture: data.dateCloture ?? data.date_cloture ?? new Date().toISOString(),
      npsScore: data.npsScore ?? data.nps_score,
      npsCommentaire: data.npsCommentaire ?? data.nps_commentaire,
      motif: data.motif ?? 'Clôture via webhook Depanssur',
    });
  }

  /**
   * case.decision → Update decision fields + call RegleDepanssurService.majCompteurs()
   */
  async handleCaseDecision(data: Record<string, any>): Promise<void> {
    const dossierId = await this.resolveDossierId(data);
    this.logger.log(`handleCaseDecision: dossierId=${dossierId}`);

    const priseEnCharge = data.priseEnCharge ?? data.prise_en_charge ?? null;
    const montantPrisEnCharge = data.montantPrisEnCharge ?? data.montant_pris_en_charge ?? null;
    const franchiseAppliquee = data.franchiseAppliquee ?? data.franchise_appliquee ?? null;
    const resteACharge = data.resteACharge ?? data.reste_a_charge ?? null;
    const statut = data.statut ?? (priseEnCharge === true ? 'ACCEPTE' : priseEnCharge === false ? 'REFUSE' : undefined);

    // Update dossier decision fields
    await this.dossierDeclaratifService.update({
      id: dossierId,
      statut,
      priseEnCharge,
      montantPrisEnCharge,
      franchiseAppliquee,
      resteACharge,
      motif: data.motif ?? 'Décision via webhook Depanssur',
    });

    // MAJ compteurs if decision is favorable and montant is known
    if (priseEnCharge === true && montantPrisEnCharge != null) {
      const dossier = await this.dossierDeclaratifService.findById(dossierId);
      if (dossier) {
        const abonnement = await this.abonnementService.findById(dossier.abonnementId);
        if (abonnement) {
          try {
            await this.regleDepanssurService.majCompteurs(
              abonnement,
              Number(montantPrisEnCharge),
              dossier.dateOuverture,
            );
            this.logger.log(
              `Compteurs updated for abonnement ${abonnement.id}, montant=${montantPrisEnCharge}`,
            );
          } catch (error: any) {
            this.logger.error(
              `Failed to update compteurs for abonnement ${abonnement.id}: ${error.message}`,
            );
            // Don't rethrow — decision fields are already saved, compteur failure is logged
          }
        }
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  /**
   * Resolve dossier ID from webhook data: either by direct ID or by referenceExterne lookup.
   */
  private async resolveDossierId(data: Record<string, any>): Promise<string> {
    const directId = data.dossierId ?? data.dossier_id ?? data.id;
    if (directId) {
      return directId;
    }

    const referenceExterne = data.referenceExterne ?? data.reference_externe;
    const organisationId = data.organisationId ?? data.organisation_id;
    if (referenceExterne && organisationId) {
      const dossier = await this.dossierDeclaratifService.findByReferenceExterne(
        organisationId,
        referenceExterne,
      );
      if (dossier) {
        return dossier.id;
      }
    }

    throw new Error(
      `Cannot resolve dossier: no dossierId and no matching referenceExterne (ref=${referenceExterne})`,
    );
  }
}
