import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import {
  DunningDepanssurService,
  type DepanssurPaymentFailedEvent,
} from '../../../../domain/payments/services/dunning-depanssur.service';

/**
 * NATS handler for payment.depanssur.failed.
 *
 * Listens for Depanssur subscription payment failures and triggers
 * the dunning sequence (J0/J+2/J+5/J+10).
 */
@Injectable()
export class DepanssurPaymentFailedHandler implements OnModuleInit {
  private readonly logger = new Logger(DepanssurPaymentFailedHandler.name);

  constructor(
    private readonly dunningDepanssurService: DunningDepanssurService,
  ) {}

  async onModuleInit(): Promise<void> {
    this.logger.log(
      'DepanssurPaymentFailedHandler initialized — ready for payment.depanssur.failed',
    );
    // TODO: Wire NATS subscription when nats-utils transport is available.
    // await this.natsService.subscribeProto('payment.depanssur.failed', this.handle.bind(this));
  }

  async handle(event: DepanssurPaymentFailedEvent): Promise<void> {
    this.logger.log(
      `Processing payment.depanssur.failed: abonnement=${event.abonnementId} schedule=${event.scheduleId}`,
    );

    try {
      await this.dunningDepanssurService.handlePaymentFailed(event);

      this.logger.log(
        `Dunning sequence initiated/advanced for abonnement=${event.abonnementId}`,
      );
    } catch (error: any) {
      this.logger.error(
        `Failed to process payment.depanssur.failed for abonnement=${event.abonnementId}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}
