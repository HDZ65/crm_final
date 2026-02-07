import { Injectable, Optional } from '@nestjs/common';
import { DomainException, NatsService } from '@crm/shared-kernel';
import type { SubscriptionEntity } from '../entities/subscription.entity';
import type { SubscriptionStatusHistoryEntity } from '../entities/subscription-status-history.entity';
import type { ISubscriptionRepository } from '../repositories/ISubscriptionRepository';
import type { ISubscriptionStatusHistoryRepository } from '../repositories/ISubscriptionStatusHistoryRepository';

export enum SubscriptionStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  PAST_DUE = 'PAST_DUE',
  CANCELED = 'CANCELED',
  EXPIRED = 'EXPIRED',
}

export interface SubscriptionSchedulingPort {
  calculateNextChargeAt(frequency: string, currentPeriodEnd: string): string;
}

@Injectable()
export class SubscriptionLifecycleService {
  constructor(
    private readonly subscriptionRepository: ISubscriptionRepository,
    private readonly statusHistoryRepository: ISubscriptionStatusHistoryRepository,
    private readonly schedulingService: SubscriptionSchedulingPort,
    @Optional() private readonly natsService?: NatsService,
  ) {}

  async activate(subscriptionId: string): Promise<SubscriptionEntity> {
    return this.transition({
      subscriptionId,
      targetStatus: SubscriptionStatus.ACTIVE,
      allowedFrom: [SubscriptionStatus.PENDING],
      subject: 'subscription.activated',
    });
  }

  async pause(subscriptionId: string, reason?: string): Promise<SubscriptionEntity> {
    return this.transition({
      subscriptionId,
      targetStatus: SubscriptionStatus.PAUSED,
      allowedFrom: [SubscriptionStatus.ACTIVE],
      reason,
      subject: 'subscription.paused',
      onBeforeSave: (subscription) => {
        subscription.pausedAt = new Date().toISOString();
      },
    });
  }

  async resume(subscriptionId: string): Promise<SubscriptionEntity> {
    return this.transition({
      subscriptionId,
      targetStatus: SubscriptionStatus.ACTIVE,
      allowedFrom: [SubscriptionStatus.PAUSED],
      subject: 'subscription.resumed',
      onBeforeSave: (subscription) => {
        subscription.nextChargeAt = this.schedulingService.calculateNextChargeAt(
          subscription.frequency,
          subscription.nextChargeAt,
        );
        subscription.resumedAt = new Date().toISOString();
        subscription.pausedAt = null;
      },
    });
  }

  async markPastDue(subscriptionId: string): Promise<SubscriptionEntity> {
    return this.transition({
      subscriptionId,
      targetStatus: SubscriptionStatus.PAST_DUE,
      allowedFrom: [SubscriptionStatus.ACTIVE],
      subject: 'subscription.past_due',
    });
  }

  async cancel(
    subscriptionId: string,
    reason: string,
    cancelAtPeriodEnd: boolean,
  ): Promise<SubscriptionEntity> {
    return this.transition({
      subscriptionId,
      targetStatus: SubscriptionStatus.CANCELED,
      allowedFrom: [
        SubscriptionStatus.PENDING,
        SubscriptionStatus.ACTIVE,
        SubscriptionStatus.PAUSED,
        SubscriptionStatus.PAST_DUE,
        SubscriptionStatus.EXPIRED,
      ],
      reason,
      subject: 'subscription.canceled',
      extraPayload: {
        cancelAtPeriodEnd,
      },
      onBeforeSave: (subscription) => {
        subscription.endDate = cancelAtPeriodEnd ? subscription.nextChargeAt : new Date().toISOString();
      },
    });
  }

  async expire(subscriptionId: string): Promise<SubscriptionEntity> {
    return this.transition({
      subscriptionId,
      targetStatus: SubscriptionStatus.EXPIRED,
      allowedFrom: [SubscriptionStatus.ACTIVE],
      subject: 'subscription.expired',
      onBeforeSave: (subscription) => {
        subscription.endDate = new Date().toISOString();
      },
    });
  }

  private async transition(input: {
    subscriptionId: string;
    targetStatus: SubscriptionStatus;
    allowedFrom: SubscriptionStatus[];
    reason?: string;
    subject: string;
    extraPayload?: Record<string, unknown>;
    onBeforeSave?: (subscription: SubscriptionEntity) => void;
  }): Promise<SubscriptionEntity> {
    const subscription = await this.requireSubscription(input.subscriptionId);
    const currentStatus = subscription.status as SubscriptionStatus;

    if (!input.allowedFrom.includes(currentStatus)) {
      throw new DomainException(
        `Invalid transition from ${currentStatus} to ${input.targetStatus}`,
        'SUBSCRIPTION_INVALID_STATUS_TRANSITION',
        {
          subscriptionId: input.subscriptionId,
          currentStatus,
          targetStatus: input.targetStatus,
          allowedFrom: input.allowedFrom,
        },
      );
    }

    subscription.status = input.targetStatus;
    input.onBeforeSave?.(subscription);

    const saved = await this.subscriptionRepository.save(subscription);

    await this.createHistoryEntry({
      subscriptionId: saved.id,
      previousStatus: currentStatus,
      newStatus: input.targetStatus,
      reason: input.reason ?? null,
    });

    await this.publishEvent(input.subject, {
      subscriptionId: saved.id,
      previousStatus: currentStatus,
      newStatus: input.targetStatus,
      reason: input.reason ?? null,
      occurredAt: new Date().toISOString(),
      ...input.extraPayload,
    });

    return saved;
  }

  private async requireSubscription(subscriptionId: string): Promise<SubscriptionEntity> {
    const subscription = await this.subscriptionRepository.findById(subscriptionId);
    if (!subscription) {
      throw new DomainException(
        `Subscription ${subscriptionId} not found`,
        'SUBSCRIPTION_NOT_FOUND',
        { subscriptionId },
      );
    }
    return subscription;
  }

  private async createHistoryEntry(input: {
    subscriptionId: string;
    previousStatus: SubscriptionStatus;
    newStatus: SubscriptionStatus;
    reason: string | null;
  }): Promise<void> {
    const history: Partial<SubscriptionStatusHistoryEntity> = {
      subscriptionId: input.subscriptionId,
      previousStatus: input.previousStatus,
      newStatus: input.newStatus,
      reason: input.reason,
      changedBy: null,
    };

    await this.statusHistoryRepository.save(history as SubscriptionStatusHistoryEntity);
  }

  private async publishEvent(subject: string, payload: Record<string, unknown>): Promise<void> {
    if (!this.natsService || !this.natsService.isConnected()) {
      return;
    }

    await this.natsService.publish(subject, payload);
  }
}
