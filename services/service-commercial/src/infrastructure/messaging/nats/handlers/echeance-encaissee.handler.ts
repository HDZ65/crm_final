import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { NatsService } from '@crm/shared-kernel';
import { RecurrenceGenerationService } from '../../../../domain/commercial/services/recurrence-generation.service';

interface EcheanceEncaisseePayload {
  echeance_id: string;
  contrat_id: string;
  organisation_id: string;
  montant: number;
  date_encaissement: string;
}

/**
 * Handler for payment.echeance.encaissee NATS events.
 * Triggers recurring commission generation when an echeance is paid.
 */
@Injectable()
export class EcheanceEncaisseeHandler implements OnModuleInit {
  private readonly logger = new Logger(EcheanceEncaisseeHandler.name);

  constructor(
    private readonly natsService: NatsService,
    private readonly recurrenceGenerationService: RecurrenceGenerationService,
  ) {}

  async onModuleInit(): Promise<void> {
    this.logger.log('EcheanceEncaisseeHandler initialized — subscribing to payment.echeance.encaissee');
    await this.natsService.subscribe<EcheanceEncaisseePayload>(
      'payment.echeance.encaissee',
      this.handleEcheanceEncaissee.bind(this),
    );
  }

  private async handleEcheanceEncaissee(data: EcheanceEncaisseePayload): Promise<void> {
    this.logger.log(
      `Processing payment.echeance.encaissee for contrat: ${data.contrat_id}, echeance: ${data.echeance_id}`,
    );
    try {
      const contratId = data.contrat_id;
      const echeanceId = data.echeance_id;
      const dateEncaissement = data.date_encaissement;

      if (!contratId || !echeanceId) {
        this.logger.warn('Received payment.echeance.encaissee with missing contrat_id or echeance_id — skipping');
        return;
      }

      const result = await this.recurrenceGenerationService.genererRecurrence(
        contratId,
        echeanceId,
        dateEncaissement,
      );

      if (result.creee) {
        this.logger.log(
          `Recurring commission generated for contrat ${contratId}, echeance ${echeanceId}: montant=${result.recurrence?.montantCalcule}`,
        );
      } else {
        this.logger.log(
          `Recurring commission not generated for contrat ${contratId}: ${result.raison}`,
        );
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      const stack = error instanceof Error ? error.stack : undefined;
      this.logger.error(
        `Failed to process payment.echeance.encaissee for contrat ${data.contrat_id}: ${message}`,
        stack,
      );
    }
  }
}
