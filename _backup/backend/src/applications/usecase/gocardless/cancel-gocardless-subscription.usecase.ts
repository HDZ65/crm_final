import { Injectable, Inject, Logger, NotFoundException } from '@nestjs/common';
import { GoCardlessService } from '../../../infrastructure/services/gocardless.service';
import type { GoCardlessMandateRepositoryPort } from '../../../core/port/gocardless-mandate-repository.port';
import { GoCardlessSubscriptionResponseDto } from '../../dto/gocardless/create-subscription.dto';

@Injectable()
export class CancelGoCardlessSubscriptionUseCase {
  private readonly logger = new Logger(CancelGoCardlessSubscriptionUseCase.name);

  constructor(
    private readonly gocardlessService: GoCardlessService,
    @Inject('GoCardlessMandateRepositoryPort')
    private readonly repository: GoCardlessMandateRepositoryPort,
  ) {}

  async execute(subscriptionId: string): Promise<GoCardlessSubscriptionResponseDto> {
    this.logger.log(`Cancelling subscription: ${subscriptionId}`);

    // Cancel in GoCardless
    const subscription = await this.gocardlessService.cancelSubscription(subscriptionId);

    // Update local record
    const mandateRecord = await this.repository.findBySubscriptionId(subscriptionId);
    if (mandateRecord) {
      await this.repository.update(mandateRecord.id, {
        subscriptionStatus: 'cancelled',
        nextChargeDate: undefined,
      });
    }

    return new GoCardlessSubscriptionResponseDto(subscription);
  }

  async executeByClientId(clientId: string): Promise<GoCardlessSubscriptionResponseDto> {
    const mandates = await this.repository.findByClientId(clientId);
    const activeMandateWithSubscription = mandates.find(
      (m) => m.subscriptionId && m.subscriptionStatus !== 'cancelled',
    );

    if (!activeMandateWithSubscription?.subscriptionId) {
      throw new NotFoundException(`No active subscription found for client ${clientId}`);
    }

    return this.execute(activeMandateWithSubscription.subscriptionId);
  }
}
