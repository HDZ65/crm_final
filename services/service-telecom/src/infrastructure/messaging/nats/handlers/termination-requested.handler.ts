import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { NatsService } from '@crm/shared-kernel';
import { ProvisioningSagaService } from '../../../../domain/provisioning/services';

interface TerminationRequestedPayload {
  contratId?: string;
  contrat_id?: string;
  reason?: string;
  correlationId?: string;
  correlation_id?: string;
}

@Injectable()
export class TerminationRequestedHandler implements OnModuleInit {
  private readonly logger = new Logger(TerminationRequestedHandler.name);

  constructor(
    private readonly natsService: NatsService,
    private readonly sagaService: ProvisioningSagaService,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.natsService.subscribe<TerminationRequestedPayload>(
      'crm.telecom.termination.requested',
      this.handle.bind(this),
    );
  }

  async handle(payload: TerminationRequestedPayload): Promise<void> {
    const contratId = payload.contratId || payload.contrat_id;
    const reason = payload.reason || 'UNKNOWN';

    if (!contratId) {
      this.logger.warn('Ignoring termination requested event with missing contratId');
      return;
    }

    await this.sagaService.processTermination(contratId, reason);
  }
}
