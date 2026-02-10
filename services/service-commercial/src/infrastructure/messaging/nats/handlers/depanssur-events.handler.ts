import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { NatsService } from '@crm/shared-kernel';

/**
 * Handler for Depanssur events via NATS
 * Subscribes to depanssur.* events and processes commission-related logic
 */
@Injectable()
export class DepanssurEventsHandler implements OnModuleInit {
  private readonly logger = new Logger(DepanssurEventsHandler.name);

  constructor(
    private readonly natsService: NatsService,
  ) {}

  async onModuleInit(): Promise<void> {
    this.logger.log('DepanssurEventsHandler initialized - subscribing to depanssur events');

    // Subscribe to commission-relevant events
    await this.natsService.subscribe('depanssur.abonnement.created', this.handleAbonnementCreated.bind(this));
    await this.natsService.subscribe('depanssur.abonnement.upgraded', this.handleAbonnementUpgraded.bind(this));
    await this.natsService.subscribe('depanssur.abonnement.downgraded', this.handleAbonnementDowngraded.bind(this));
    await this.natsService.subscribe('depanssur.dossier.decision', this.handleDossierDecision.bind(this));
  }

  private async handleAbonnementCreated(data: any): Promise<void> {
    this.logger.log(`Processing depanssur.abonnement.created for commission: ${data.abonnement_id}`);
    try {
      // TODO: Create commission for new abonnement
      // 1. Lookup apporteur/partenaire for this client
      // 2. Calculate commission based on formule and bareme
      // 3. Create CommissionEntity with status PENDING
      // 4. Link to abonnement_id in metadata
      this.logger.debug(`Commission processing for abonnement ${data.abonnement_id} - formule: ${data.formule}`);
    } catch (error: any) {
      this.logger.error(`Failed to process commission for abonnement.created: ${data.abonnement_id}`, error.stack);
    }
  }

  private async handleAbonnementUpgraded(data: any): Promise<void> {
    this.logger.log(`Processing depanssur.abonnement.upgraded for commission: ${data.abonnement_id}`);
    try {
      // TODO: Create additional commission for upgrade
      // 1. Calculate delta commission (nouvelle_formule - ancienne_formule)
      // 2. Create CommissionEntity for upgrade bonus
      // 3. Link to abonnement_id in metadata
      this.logger.debug(`Upgrade commission for abonnement ${data.abonnement_id}: ${data.ancienne_formule} -> ${data.nouvelle_formule}`);
    } catch (error: any) {
      this.logger.error(`Failed to process commission for abonnement.upgraded: ${data.abonnement_id}`, error.stack);
    }
  }

  private async handleAbonnementDowngraded(data: any): Promise<void> {
    this.logger.log(`Processing depanssur.abonnement.downgraded for commission: ${data.abonnement_id}`);
    try {
      // TODO: Handle commission clawback for downgrade
      // 1. Check if commission was already paid
      // 2. If paid, create RepriseCommissionEntity (clawback)
      // 3. If pending, adjust commission amount
      this.logger.debug(`Downgrade commission adjustment for abonnement ${data.abonnement_id}: ${data.ancienne_formule} -> ${data.nouvelle_formule}`);
    } catch (error: any) {
      this.logger.error(`Failed to process commission for abonnement.downgraded: ${data.abonnement_id}`, error.stack);
    }
  }

  private async handleDossierDecision(data: any): Promise<void> {
    this.logger.log(`Processing depanssur.dossier.decision for commission: ${data.dossier_id}`);
    try {
      // TODO: Create commission for accepted dossier
      // 1. If decision is ACCEPTE, calculate commission on montant_accorde
      // 2. Lookup apporteur/partenaire for this client
      // 3. Create CommissionEntity with status PENDING
      // 4. Link to dossier_id in metadata
      if (data.decision === 'ACCEPTE') {
        this.logger.debug(`Commission processing for accepted dossier ${data.dossier_id} - montant: ${data.montant_accorde}€`);
      }
    } catch (error: any) {
      this.logger.error(`Failed to process commission for dossier.decision: ${data.dossier_id}`, error.stack);
    }
  }
}
