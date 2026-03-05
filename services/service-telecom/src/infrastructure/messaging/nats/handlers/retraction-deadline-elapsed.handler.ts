import { Injectable, OnModuleInit } from '@nestjs/common';
import { NatsService } from '@crm/shared-kernel';
import {
  type RetractionDeadlineElapsedEventPayload,
  ProvisioningSagaService,
} from '../../../../domain/provisioning/services';

interface IncomingRetractionDeadlinePayload {
  contratId?: string;
  contrat_id?: string;
  triggeredAt?: string;
  triggered_at?: string;
  correlationId?: string;
  correlation_id?: string;
}

@Injectable()
export class RetractionDeadlineElapsedHandler implements OnModuleInit {
  constructor(
    private readonly natsService: NatsService,
    private readonly sagaService: ProvisioningSagaService,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.natsService.subscribe<IncomingRetractionDeadlinePayload>(
      'crm.provisioning.delai_retractation.ecoule',
      this.handle.bind(this),
    );
  }

  async handle(payload: IncomingRetractionDeadlinePayload): Promise<void> {
    const contratId = payload.contratId || payload.contrat_id;
    if (!contratId) {
      return;
    }

    const event: RetractionDeadlineElapsedEventPayload = {
      contratId,
      triggeredAt: payload.triggeredAt || payload.triggered_at,
      correlationId: payload.correlationId || payload.correlation_id,
    };

    await this.sagaService.processRetractionDeadlineElapsed(event);
  }
}
