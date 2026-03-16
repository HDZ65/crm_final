import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { NatsService } from '@crm/shared-kernel';
import { EnergieLifecycleService } from '../../../../domain/energie/services/energie-lifecycle.service';
import { RaccordementEnergieRepositoryService } from '../../../persistence/typeorm/repositories/energie';
import {
  PartenaireEnergie,
  StatutRaccordement,
} from '../../../../domain/energie/entities/raccordement-energie.entity';

/**
 * Handler for contract lifecycle events that affect Énergie raccordements.
 * - crm.contrat.signed → if contrat type is énergie → creates raccordement
 * - crm.contrat.suspended → suspends raccordement for the contract
 */
@Injectable()
export class EnergieContractHandler implements OnModuleInit {
  private readonly logger = new Logger(EnergieContractHandler.name);

  constructor(
    private readonly natsService: NatsService,
    private readonly lifecycleService: EnergieLifecycleService,
    private readonly raccordementRepository: RaccordementEnergieRepositoryService,
  ) {}

  async onModuleInit(): Promise<void> {
    this.logger.log('EnergieContractHandler initialized - subscribing to contract events');

    await this.natsService.subscribe(
      'crm.contrat.signed',
      this.handleContractSigned.bind(this),
    );

    await this.natsService.subscribe(
      'crm.contrat.suspended',
      this.handleContractSuspended.bind(this),
    );
  }

  private async handleContractSigned(data: Record<string, unknown>): Promise<void> {
    this.logger.log('Received crm.contrat.signed event for Énergie');

    const contratType = (data?.contrat_type || data?.contratType || data?.type) as string | undefined;
    if (!contratType || !this.isEnergieContract(contratType)) {
      this.logger.log(`Contract type "${contratType}" is not énergie — skipping`);
      return;
    }

    const contratId = (data?.contrat_id || data?.contratId) as string | undefined;
    const clientId = (data?.client_id || data?.clientId) as string | undefined;

    if (!contratId || !clientId) {
      this.logger.warn(
        `crm.contrat.signed event missing contratId or clientId — skipping Énergie creation. ` +
          `Keys: [${Object.keys(data || {}).join(', ')}]`,
      );
      return;
    }

    try {
      const existing = await this.raccordementRepository.findByContratId(contratId);
      if (existing) {
        this.logger.log(`Raccordement already exists for contrat ${contratId} — skipping creation`);
        return;
      }

      const partenaireRaw = (data?.partenaire as string) || 'PLENITUDE';
      const partenaire = this.resolvePartenaire(partenaireRaw);
      const adresse = (data?.adresse as string) || undefined;

      await this.lifecycleService.createRaccordement(clientId, contratId, partenaire, adresse);
      this.logger.log(`Raccordement created for contrat ${contratId}, client ${clientId}`);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Failed to create raccordement for contrat ${contratId}: ${message}`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }

  private async handleContractSuspended(data: Record<string, unknown>): Promise<void> {
    this.logger.log('Received crm.contrat.suspended event for Énergie');

    const contratId = (data?.contrat_id || data?.contratId) as string | undefined;
    if (!contratId) {
      this.logger.warn('crm.contrat.suspended event without contratId — skipping Énergie suspension');
      return;
    }

    try {
      const raccordement = await this.raccordementRepository.findByContratId(contratId);
      if (!raccordement) {
        this.logger.log(`No raccordement found for contrat ${contratId} — nothing to suspend`);
        return;
      }

      if (raccordement.statutRaccordement === StatutRaccordement.SUSPENDU) {
        this.logger.log(`Raccordement ${raccordement.id} already SUSPENDU — skipping`);
        return;
      }

      await this.lifecycleService.updateStatus(raccordement.id, StatutRaccordement.SUSPENDU);
      this.logger.log(`Raccordement ${raccordement.id} suspended due to contract ${contratId} suspension`);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Failed to suspend raccordement for contrat ${contratId}: ${message}`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }

  private isEnergieContract(type: string): boolean {
    const energieTypes = ['energie', 'énergie', 'ENERGIE', 'ÉNERGIE', 'energy'];
    return energieTypes.includes(type.toLowerCase());
  }

  private resolvePartenaire(raw: string): PartenaireEnergie {
    const upper = raw.toUpperCase();
    if (upper === 'OHM') return PartenaireEnergie.OHM;
    return PartenaireEnergie.PLENITUDE;
  }
}
