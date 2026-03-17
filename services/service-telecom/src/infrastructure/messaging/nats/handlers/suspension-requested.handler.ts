import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { NatsService } from '@crm/shared-kernel';
import { ProvisioningSagaService } from '../../../../domain/provisioning/services';

interface IncomingSuspensionRequestedPayload {
  contratId?: string;
  contrat_id?: string;
  reason?: string;
  correlationId?: string;
  correlation_id?: string;
}

@Injectable()
export class SuspensionRequestedHandler implements OnModuleInit {
  private readonly logger = new Logger(SuspensionRequestedHandler.name);

  constructor(
    private readonly natsService: NatsService,
    private readonly sagaService: ProvisioningSagaService,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.natsService.subscribe<IncomingSuspensionRequestedPayload>(
      'crm.telecom.suspension.requested',
      this.handle.bind(this),
    );
  }

  async handle(payload: IncomingSuspensionRequestedPayload): Promise<void> {
    const contratId = payload.contratId || payload.contrat_id;
    const reason = payload.reason || 'Non spécifié';
    const correlationId = payload.correlationId || payload.correlation_id;

    if (!contratId) {
      this.logger.warn('Ignoring suspension requested event with missing contratId');
      return;
    }

    await this.sagaService.processSuspension(contratId, reason, correlationId);
  }
}
