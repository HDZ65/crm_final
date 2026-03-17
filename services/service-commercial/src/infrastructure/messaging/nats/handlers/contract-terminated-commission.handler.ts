import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NatsService } from '@crm/shared-kernel';
import {
  RepriseCommissionEntity,
  TypeReprise,
  StatutReprise,
} from '../../../../domain/commercial/entities/reprise-commission.entity';
import {
  CommissionRecurrenteEntity,
  StatutRecurrence,
} from '../../../../domain/commercial/entities/commission-recurrente.entity';

/**
 * Handler for contract termination/suspension events via NATS.
 * Creates commission reprises (clawbacks) when a contract is terminated.
 * Logs suspension events for future handling.
 */
@Injectable()
export class ContractTerminatedCommissionHandler implements OnModuleInit {
  private readonly logger = new Logger(ContractTerminatedCommissionHandler.name);

  constructor(
    private readonly natsService: NatsService,
    @InjectRepository(RepriseCommissionEntity)
    private readonly repriseRepo: Repository<RepriseCommissionEntity>,
    @InjectRepository(CommissionRecurrenteEntity)
    private readonly commissionRepo: Repository<CommissionRecurrenteEntity>,
  ) {}

  async onModuleInit(): Promise<void> {
    this.logger.log('ContractTerminatedCommissionHandler initialized - subscribing to contract lifecycle events');

    await this.natsService.subscribe(
      'crm.contrat.terminated',
      this.handleContractTerminated.bind(this),
    );
    await this.natsService.subscribe(
      'crm.contrat.suspended',
      this.handleContractSuspended.bind(this),
    );
  }

  private async handleContractTerminated(data: any): Promise<void> {
    this.logger.log(`Processing crm.contrat.terminated event: ${JSON.stringify(data)}`);
    try {
      const contratId = data.contrat_id || data.contratId;
      if (!contratId) {
        this.logger.warn('Received crm.contrat.terminated event without contratId — skipping');
        return;
      }

      const activeCommissions = await this.commissionRepo.find({
        where: { contratId, statutRecurrence: StatutRecurrence.ACTIVE },
      });

      if (activeCommissions.length === 0) {
        this.logger.log(`No active recurring commissions found for contrat ${contratId}`);
        return;
      }

      const now = new Date();
      const periodeActuelle = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

      const reprises: RepriseCommissionEntity[] = [];

      for (const commission of activeCommissions) {
        const reprise = this.repriseRepo.create({
          organisationId: commission.organisationId,
          commissionOriginaleId: commission.id,
          contratId,
          apporteurId: commission.apporteurId,
          reference: `REP-RESIL-${contratId.substring(0, 8)}-${commission.id.substring(0, 8)}`,
          typeReprise: TypeReprise.RESILIATION,
          montantReprise: 0,
          tauxReprise: 100,
          montantOriginal: commission.montantCalcule,
          periodeOrigine: commission.periode,
          periodeApplication: periodeActuelle,
          dateEvenement: now,
          dateLimite: new Date(now.getFullYear(), now.getMonth() + 3, now.getDate()),
          statutReprise: StatutReprise.EN_ATTENTE,
          motif: `Résiliation contrat ${contratId}`,
        });

        const saved = await this.repriseRepo.save(reprise);
        reprises.push(saved);
      }

      this.logger.log(
        `Créé ${reprises.length} reprises de commission pour contrat ${contratId}`,
      );
    } catch (error: any) {
      this.logger.error(
        `Failed to process crm.contrat.terminated event: ${error.message}`,
        error.stack,
      );
    }
  }

  private async handleContractSuspended(data: any): Promise<void> {
    this.logger.log(`Processing crm.contrat.suspended event: ${JSON.stringify(data)}`);
    try {
      const contratId = data.contrat_id || data.contratId;
      if (!contratId) {
        this.logger.warn('Received crm.contrat.suspended event without contratId — skipping');
        return;
      }

      this.logger.log(
        `Contract suspended - commission generation paused for contrat ${contratId}`,
      );
    } catch (error: any) {
      this.logger.error(
        `Failed to process crm.contrat.suspended event: ${error.message}`,
        error.stack,
      );
    }
  }
}
