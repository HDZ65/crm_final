import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NatsService } from '@crm/shared-kernel';
import { ContratEntity } from '../../../../domain/contrats/entities/contrat.entity';
import { ControleQualiteEntity } from '../../../../domain/qualite/entities/controle-qualite.entity';
import { StatutCQ } from '../../../../domain/qualite/enums/statut-cq.enum';

interface ContratCQRejectedPayload {
  contrat_id: string;
  organisation_id: string;
  motif: string;
  timestamp: string;
}

/**
 * Handler for contrat.cq.rejected NATS events.
 * Updates the contrat's statut_cq to REJETE when CQ validation fails.
 */
@Injectable()
export class CQRejectedHandler implements OnModuleInit {
  private readonly logger = new Logger(CQRejectedHandler.name);

  constructor(
    private readonly natsService: NatsService,
    @InjectRepository(ContratEntity)
    private readonly contratRepository: Repository<ContratEntity>,
    @InjectRepository(ControleQualiteEntity)
    private readonly cqRepository: Repository<ControleQualiteEntity>,
  ) {}

  async onModuleInit(): Promise<void> {
    this.logger.log('CQRejectedHandler initialized — subscribing to contrat.cq.rejected');
    await this.natsService.subscribe<ContratCQRejectedPayload>(
      'contrat.cq.rejected',
      this.handleCQRejected.bind(this),
    );
  }

  private async handleCQRejected(data: ContratCQRejectedPayload): Promise<void> {
    this.logger.log(`Processing contrat.cq.rejected for contrat: ${data.contrat_id}`);
    try {
      const contratId = data.contrat_id;
      if (!contratId) {
        this.logger.warn('Received contrat.cq.rejected without contrat_id — skipping');
        return;
      }

      // Update contrat.statut_cq to REJETE
      await this.contratRepository.update(
        { id: contratId },
        { statutCq: StatutCQ.REJETE },
      );

      // Also update the ControleQualite record
      const controle = await this.cqRepository.findOne({
        where: { contratId },
        order: { dateSoumission: 'DESC' },
      });

      if (controle) {
        controle.statut = StatutCQ.REJETE;
        controle.motifRejet = data.motif || null;
        controle.dateValidation = new Date();
        await this.cqRepository.save(controle);
      }

      this.logger.log(`Contrat ${contratId} statut_cq updated to REJETE (motif: ${data.motif})`);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      const stack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Failed to process contrat.cq.rejected: ${message}`, stack);
    }
  }
}
