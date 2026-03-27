import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NatsService } from '@crm/shared-kernel';
import { ContratEntity } from '../../../../domain/contrats/entities/contrat.entity';
import { ControleQualiteEntity } from '../../../../domain/qualite/entities/controle-qualite.entity';
import { StatutCQ } from '../../../../domain/qualite/enums/statut-cq.enum';

interface ContratCQValidatedPayload {
  contrat_id: string;
  organisation_id: string;
  validateur_id: string;
  score: number;
  timestamp: string;
}

/**
 * Handler for contrat.cq.validated NATS events.
 * Updates the contrat's statut_cq to VALIDE when CQ validation passes.
 */
@Injectable()
export class CQValidatedHandler implements OnModuleInit {
  private readonly logger = new Logger(CQValidatedHandler.name);

  constructor(
    private readonly natsService: NatsService,
    @InjectRepository(ContratEntity)
    private readonly contratRepository: Repository<ContratEntity>,
    @InjectRepository(ControleQualiteEntity)
    private readonly cqRepository: Repository<ControleQualiteEntity>,
  ) {}

  async onModuleInit(): Promise<void> {
    this.logger.log('CQValidatedHandler initialized — subscribing to contrat.cq.validated');
    await this.natsService.subscribe<ContratCQValidatedPayload>(
      'contrat.cq.validated',
      this.handleCQValidated.bind(this),
    );
  }

  private async handleCQValidated(data: ContratCQValidatedPayload): Promise<void> {
    this.logger.log(`Processing contrat.cq.validated for contrat: ${data.contrat_id}`);
    try {
      const contratId = data.contrat_id;
      if (!contratId) {
        this.logger.warn('Received contrat.cq.validated without contrat_id — skipping');
        return;
      }

      // Update contrat.statut_cq to VALIDE
      await this.contratRepository.update(
        { id: contratId },
        { statutCq: StatutCQ.VALIDE },
      );

      // Also update the ControleQualite record
      const controle = await this.cqRepository.findOne({
        where: { contratId },
        order: { dateSoumission: 'DESC' },
      });

      if (controle) {
        controle.statut = StatutCQ.VALIDE;
        controle.validateurId = data.validateur_id || null;
        controle.score = data.score ?? null;
        controle.dateValidation = new Date();
        await this.cqRepository.save(controle);
      }

      this.logger.log(`Contrat ${contratId} statut_cq updated to VALIDE`);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      const stack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Failed to process contrat.cq.validated: ${message}`, stack);
    }
  }
}
