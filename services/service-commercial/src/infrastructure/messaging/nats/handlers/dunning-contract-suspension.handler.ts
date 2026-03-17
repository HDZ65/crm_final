import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { DomainException, NatsService } from '@crm/shared-kernel';
import { ContratLifecycleService } from '../../../../domain/contrats/services/contrat-lifecycle.service';
import { ContratService } from '../../../persistence/typeorm/repositories/contrats/contrat.service';

/**
 * Handler for dunning max retries exceeded events via NATS.
 * When the dunning system exhausts all payment retry attempts,
 * this handler automatically suspends the associated contract.
 */
@Injectable()
export class DunningContractSuspensionHandler implements OnModuleInit {
  private readonly logger = new Logger(DunningContractSuspensionHandler.name);

  constructor(
    private readonly natsService: NatsService,
    private readonly lifecycleService: ContratLifecycleService,
    private readonly contratService: ContratService,
  ) {}

  async onModuleInit(): Promise<void> {
    this.logger.log(
      'DunningContractSuspensionHandler initialized - subscribing to dunning events',
    );

    await this.natsService.subscribe(
      'dunning.max_retries_exceeded',
      this.handleDunningMaxRetries.bind(this),
    );
  }

  private async handleDunningMaxRetries(data: any): Promise<void> {
    this.logger.log('Received dunning.max_retries_exceeded event');

    const contratId = data?.contratId || data?.contrat_id;

    if (!contratId) {
      this.logger.warn(
        'dunning.max_retries_exceeded event received without contratId — cannot suspend contract. ' +
          `Payload keys: [${Object.keys(data || {}).join(', ')}]`,
      );
      return;
    }

    try {
      await this.lifecycleService.suspend(contratId, {
        reason: 'DUNNING_IMPAYE',
        triggeredBy: 'SYSTEM',
      });

      this.logger.log(
        `Contract ${contratId} suspended due to dunning max retries exceeded`,
      );
    } catch (error: any) {
      if (error instanceof DomainException) {
        if (error.code === 'CONTRAT_INVALID_STATUS_TRANSITION') {
          this.logger.warn(
            `Contract ${contratId} already suspended or in terminal state, ignoring`,
          );
          return;
        }

        if (error.code === 'CONTRAT_NOT_FOUND') {
          this.logger.warn(
            `Contract ${contratId} not found — cannot suspend for dunning`,
          );
          return;
        }
      }

      this.logger.error(
        `Failed to suspend contract ${contratId} for dunning: ${error.message}`,
        error.stack,
      );
    }
  }
}
