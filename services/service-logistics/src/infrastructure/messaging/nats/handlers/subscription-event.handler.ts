import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { NatsService } from '@crm/shared-kernel';
import { FulfillmentBatchRepositoryService } from '../../../persistence/typeorm/repositories/fulfillment/fulfillment-batch-repository.service';
import { FulfillmentBatchLineRepositoryService } from '../../../persistence/typeorm/repositories/fulfillment/fulfillment-batch-line-repository.service';

interface SubscriptionActivatedPayload {
  subscriptionId: string;
  organisationId: string;
  clientId: string;
  productId: string;
}

interface SubscriptionCanceledPayload {
  subscriptionId: string;
}

@Injectable()
export class SubscriptionEventHandler implements OnModuleInit {
  private readonly logger = new Logger(SubscriptionEventHandler.name);

  constructor(
    private readonly natsService: NatsService,
    private readonly batchRepository: FulfillmentBatchRepositoryService,
    private readonly batchLineRepository: FulfillmentBatchLineRepositoryService,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.natsService.subscribe<SubscriptionActivatedPayload>(
      'crm.commercial.subscription.activated',
      async (data) => {
        await this.handleSubscriptionActivated(data);
      },
    );

    await this.natsService.subscribe<SubscriptionCanceledPayload>(
      'crm.commercial.subscription.canceled',
      async (data) => {
        await this.handleSubscriptionCanceled(data);
      },
    );

    this.logger.log('Subscription event handlers registered');
  }

  async handleSubscriptionActivated(data: SubscriptionActivatedPayload): Promise<void> {
    const { subscriptionId, organisationId, clientId, productId } = data;

    try {
      // Find or create OPEN batch for this organisation
      let batch = await this.batchRepository.findOpenBySocieteId(organisationId);
      if (!batch) {
        batch = await this.batchRepository.create({
          organisationId,
          societeId: organisationId,
          batchDate: new Date(),
        });
      }

      // Add batch line (snapshot IDs will be populated during LOCK phase)
      await this.batchLineRepository.create({
        organisationId,
        batchId: batch.id,
        subscriptionId,
        clientId,
        produitId: productId,
        quantite: 1,
        addressSnapshotId: '00000000-0000-0000-0000-000000000000',
        preferenceSnapshotId: '00000000-0000-0000-0000-000000000000',
      });

      // Update line count
      const lineCount = await this.batchLineRepository.countByBatchId(batch.id);
      await this.batchRepository.update(batch.id, { lineCount });

      this.logger.log(
        `Added batch line for subscription ${subscriptionId} to batch ${batch.id}`,
      );
    } catch (error: any) {
      this.logger.error(
        `Failed to handle subscription.activated: ${error.message}`,
        error.stack,
      );
    }
  }

  async handleSubscriptionCanceled(data: SubscriptionCanceledPayload): Promise<void> {
    const { subscriptionId } = data;

    try {
      // Remove pending batch lines for this subscription (only from OPEN batches)
      const deleted =
        await this.batchLineRepository.deleteBySubscriptionIdFromOpenBatches(subscriptionId);

      this.logger.log(
        `Removed ${deleted} batch line(s) for canceled subscription ${subscriptionId}`,
      );
    } catch (error: any) {
      this.logger.error(
        `Failed to handle subscription.canceled: ${error.message}`,
        error.stack,
      );
    }
  }
}
