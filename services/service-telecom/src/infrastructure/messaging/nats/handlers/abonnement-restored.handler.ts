import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { NatsService } from '@crm/shared-kernel';
import { CarrierSelectorService } from '../../../../domain/provisioning/services/carrier-selector.service';
import { randomUUID } from 'crypto';

interface AbonnementRestoredEvent {
  abonnementId: string;
  clientId: string;
  organisationId: string;
  restoredAt: string;
}

/**
 * NATS handler for abonnement.depanssur.restored in service-telecom.
 *
 * Reactivates the telecom line via the appropriate carrier when an abonnement
 * is restored after successful payment (RG3 auto-reactivation).
 */
@Injectable()
export class AbonnementRestoredHandler implements OnModuleInit {
  private readonly logger = new Logger(AbonnementRestoredHandler.name);

  constructor(
    private readonly natsService: NatsService,
    private readonly carrierSelectorService: CarrierSelectorService,
  ) {}

  async onModuleInit(): Promise<void> {
    this.logger.log(
      'AbonnementRestoredHandler initialized — subscribing to abonnement.depanssur.restored',
    );
    await this.natsService.subscribe<AbonnementRestoredEvent>(
      'abonnement.depanssur.restored',
      this.handle.bind(this),
    );
  }

  async handle(event: AbonnementRestoredEvent): Promise<void> {
    this.logger.log(
      `Processing abonnement.depanssur.restored: abonnementId=${event.abonnementId} clientId=${event.clientId}`,
    );

    try {
      const carrier = this.carrierSelectorService.selectCarrier();
      const correlationId = randomUUID();

      const result = await carrier.activateLine(
        event.abonnementId,
        event.clientId,
        '',
        '',
        correlationId,
      );

      this.logger.log(
        `Telecom line reactivated for abonnement ${event.abonnementId}: activationId=${result.activationId} correlationId=${correlationId}`,
      );
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      const stack = error instanceof Error ? error.stack : undefined;
      this.logger.error(
        `Failed to reactivate telecom line for abonnementId=${event.abonnementId}: ${message}`,
        stack,
      );
      throw error;
    }
  }
}
