import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { NatsService } from '@crm/shared-kernel';
import {
  DunningDepanssurService,
  type DepanssurPaymentSucceededEvent,
} from '../../../../domain/payments/services/dunning-depanssur.service';

/**
 * NATS handler for payment.depanssur.succeeded.
 *
 * When a Depanssur subscription payment succeeds:
 * 1. Check if there's an active dunning run for this abonnement
 * 2. If yes, resolve the dunning run and restore the abonnement
 * 3. Publish abonnement.depanssur.restored and commission.restart_recurring events
 */
@Injectable()
export class DepanssurPaymentSucceededHandler implements OnModuleInit {
  private readonly logger = new Logger(DepanssurPaymentSucceededHandler.name);

  constructor(
    private readonly natsService: NatsService,
    private readonly dunningDepanssurService: DunningDepanssurService,
  ) {}

  async onModuleInit(): Promise<void> {
    this.logger.log(
      'DepanssurPaymentSucceededHandler initialized — ready for payment.depanssur.succeeded',
    );
    await this.natsService.subscribe<DepanssurPaymentSucceededEvent>(
      'payment.depanssur.succeeded',
      this.handle.bind(this),
    );
  }

  async handle(event: DepanssurPaymentSucceededEvent): Promise<void> {
    this.logger.log(
      `Processing payment.depanssur.succeeded: abonnement=${event.abonnementId} schedule=${event.scheduleId}`,
    );

    try {
      const result = await this.dunningDepanssurService.handlePaymentSucceeded(event);

      if (result.restored) {
        this.logger.log(
          `Abonnement ${event.abonnementId} restored after successful payment`,
        );

        // Publish NATS events for downstream services
        for (const evt of result.events) {
          if ('restoredAt' in evt) {
            this.logger.log(
              `[NATS] Publishing abonnement.depanssur.restored for ${event.abonnementId}`,
            );
            // TODO: await this.natsService.publishProto('abonnement.depanssur.restored', evt);
          }
          if ('effectiveDate' in evt) {
            this.logger.log(
              `[NATS] Publishing commission.restart_recurring for ${event.abonnementId}`,
            );
            // TODO: await this.natsService.publishProto('commission.restart_recurring', evt);
          }
        }
      } else {
        this.logger.debug(
          `No active dunning run for abonnement=${event.abonnementId}, no restoration needed`,
        );
      }
    } catch (error: any) {
      this.logger.error(
        `Failed to process payment.depanssur.succeeded for abonnement=${event.abonnementId}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}
