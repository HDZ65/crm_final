import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { NatsService } from '@crm/shared-kernel';
import {
  BundlePriceRecalculatedPayload,
  ConsolidatedBillingService,
} from '../../../persistence/typeorm/repositories/factures/consolidated-billing.service';

@Injectable()
export class BundlePriceRecalculatedHandler implements OnModuleInit {
  private readonly logger = new Logger(BundlePriceRecalculatedHandler.name);

  constructor(
    private readonly natsService: NatsService,
    private readonly consolidatedBillingService: ConsolidatedBillingService,
  ) {}

  async onModuleInit(): Promise<void> {
    this.logger.log(
      'BundlePriceRecalculatedHandler initialized - ready for bundle.price.recalculated',
    );
    await this.natsService.subscribe<BundlePriceRecalculatedPayload>(
      'bundle.price.recalculated',
      this.handleBundlePriceRecalculated.bind(this),
    );
  }

  async handleBundlePriceRecalculated(
    payload: BundlePriceRecalculatedPayload,
  ): Promise<void> {
    const facture =
      await this.consolidatedBillingService.handleBundlePriceRecalculated(payload);

    if (!facture) {
      this.logger.warn(
        'bundle.price.recalculated received but no matching facture was found',
      );
      return;
    }

    this.logger.log(
      `bundle.price.recalculated applied on facture ${facture.id}`,
    );
  }
}
