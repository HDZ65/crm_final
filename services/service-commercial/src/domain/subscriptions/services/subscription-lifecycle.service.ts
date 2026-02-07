import { Injectable, Optional } from '@nestjs/common';
import { DomainException, NatsService } from '@crm/shared-kernel';
import {
  SubscriptionPlanType,
  SubscriptionStatus,
  type SubscriptionEntity,
} from '../entities/subscription.entity';
import { SubscriptionTriggeredBy } from '../entities/subscription-history.entity';
import type { SubscriptionStatusHistoryEntity } from '../entities/subscription-status-history.entity';
import type { ISubscriptionHistoryRepository } from '../repositories/ISubscriptionHistoryRepository';
import type { ISubscriptionRepository } from '../repositories/ISubscriptionRepository';
import type { ISubscriptionStatusHistoryRepository } from '../repositories/ISubscriptionStatusHistoryRepository';

export interface SubscriptionSchedulingPort {
  calculateNextChargeAt(frequency: string, currentPeriodEnd: string): Date | string;
}

@Injectable()
export class SubscriptionLifecycleService {
  constructor(
    private readonly subscriptionRepository: ISubscriptionRepository,
    private readonly statusHistoryRepository:
      | ISubscriptionHistoryRepository
      | ISubscriptionStatusHistoryRepository,
    @Optional() private readonly natsService?: NatsService,
    @Optional() private readonly schedulingService?: SubscriptionSchedulingPort,
  ) {}

  async startTrial(
    subscriptionId: string,
    input: { trialDays: number; triggeredBy: SubscriptionTriggeredBy },
  ): Promise<SubscriptionEntity> {
    if (input.trialDays <= 0) {
      throw new DomainException(
        `trialDays must be greater than zero: ${input.trialDays}`,
        'SUBSCRIPTION_TRIAL_DAYS_INVALID',
        { subscriptionId, trialDays: input.trialDays },
      );
    }

    return this.transition({
      subscriptionId,
      targetStatus: SubscriptionStatus.TRIAL,
      allowedFrom: [SubscriptionStatus.PENDING],
      subject: 'subscription.trial_started',
      triggeredBy: input.triggeredBy,
      extraPayload: {
        trialDays: input.trialDays,
      },
      onBeforeSave: (subscription) => {
        if (subscription.planType === SubscriptionPlanType.FREE_AVOD) {
          throw new DomainException(
            'FREE_AVOD subscriptions cannot start trial',
            'SUBSCRIPTION_TRIAL_NOT_ALLOWED_FOR_FREE_PLAN',
            {
              subscriptionId,
              planType: subscription.planType,
            },
          );
        }

        const trialStart = new Date();
        const trialEnd = new Date(trialStart);
        trialEnd.setUTCDate(trialEnd.getUTCDate() + input.trialDays);

        subscription.trialStart = trialStart;
        subscription.trialEnd = trialEnd;
      },
    });
  }

  async activateFromPending(
    subscriptionId: string,
    input: { trialDays: number; triggeredBy: SubscriptionTriggeredBy },
  ): Promise<SubscriptionEntity> {
    return this.transition({
      subscriptionId,
      targetStatus: SubscriptionStatus.ACTIVE,
      allowedFrom: [SubscriptionStatus.PENDING],
      subject: 'subscription.activated',
      triggeredBy: input.triggeredBy,
      onBeforeSave: (subscription) => {
        if (subscription.planType !== SubscriptionPlanType.FREE_AVOD && input.trialDays > 0) {
          throw new DomainException(
            'Paid subscriptions with trial days must transition to TRIAL first',
            'SUBSCRIPTION_PENDING_TO_ACTIVE_REQUIRES_TRIAL',
            {
              subscriptionId,
              planType: subscription.planType,
              trialDays: input.trialDays,
            },
          );
        }

        subscription.trialStart = null;
        subscription.trialEnd = null;
      },
    });
  }

  async activateFromTrial(
    subscriptionId: string,
    input: { triggeredBy: SubscriptionTriggeredBy },
  ): Promise<SubscriptionEntity> {
    return this.transition({
      subscriptionId,
      targetStatus: SubscriptionStatus.ACTIVE,
      allowedFrom: [SubscriptionStatus.TRIAL],
      subject: 'subscription.activated',
      triggeredBy: input.triggeredBy,
    });
  }

  async suspend(
    subscriptionId: string,
    input: { reason: string; triggeredBy: SubscriptionTriggeredBy },
  ): Promise<SubscriptionEntity> {
    return this.transition({
      subscriptionId,
      targetStatus: SubscriptionStatus.SUSPENDED,
      allowedFrom: [SubscriptionStatus.ACTIVE],
      reason: input.reason,
      subject: 'subscription.suspended',
      triggeredBy: input.triggeredBy,
      onBeforeSave: (subscription) => {
        subscription.suspendedAt = new Date();
        subscription.suspensionReason = input.reason;
      },
    });
  }

  async reactivateFromPastDue(
    subscriptionId: string,
    input: { triggeredBy: SubscriptionTriggeredBy; reason: string },
  ): Promise<SubscriptionEntity> {
    return this.transition({
      subscriptionId,
      targetStatus: SubscriptionStatus.ACTIVE,
      allowedFrom: [SubscriptionStatus.PAST_DUE],
      reason: input.reason,
      subject: 'subscription.reactivated',
      triggeredBy: input.triggeredBy,
      onBeforeSave: (subscription) => {
        subscription.suspendedAt = null;
        subscription.suspensionReason = null;
      },
    });
  }

  async suspendFromPastDue(
    subscriptionId: string,
    input: { reason: string; triggeredBy: SubscriptionTriggeredBy },
  ): Promise<SubscriptionEntity> {
    return this.transition({
      subscriptionId,
      targetStatus: SubscriptionStatus.SUSPENDED,
      allowedFrom: [SubscriptionStatus.PAST_DUE],
      reason: input.reason,
      subject: 'subscription.suspended',
      triggeredBy: input.triggeredBy,
      onBeforeSave: (subscription) => {
        subscription.suspendedAt = new Date();
        subscription.suspensionReason = input.reason;
      },
    });
  }

  async reactivateFromSuspended(
    subscriptionId: string,
    input: { triggeredBy: SubscriptionTriggeredBy },
  ): Promise<SubscriptionEntity> {
    return this.transition({
      subscriptionId,
      targetStatus: SubscriptionStatus.ACTIVE,
      allowedFrom: [SubscriptionStatus.SUSPENDED],
      subject: 'subscription.reactivated',
      triggeredBy: input.triggeredBy,
      onBeforeSave: (subscription) => {
        subscription.suspendedAt = null;
        subscription.suspensionReason = null;
      },
    });
  }

  async activate(subscriptionId: string): Promise<SubscriptionEntity> {
    return this.activateFromPending(subscriptionId, {
      trialDays: 0,
      triggeredBy: SubscriptionTriggeredBy.SYSTEM,
    });
  }

  async pause(subscriptionId: string, reason?: string): Promise<SubscriptionEntity> {
    return this.transition({
      subscriptionId,
      targetStatus: SubscriptionStatus.SUSPENDED,
      allowedFrom: [SubscriptionStatus.ACTIVE],
      reason,
      subject: 'subscription.paused',
      triggeredBy: SubscriptionTriggeredBy.SYSTEM,
      onBeforeSave: (subscription) => {
        subscription.suspendedAt = new Date();
        subscription.suspensionReason = reason ?? null;
      },
    });
  }

  async resume(subscriptionId: string): Promise<SubscriptionEntity> {
    return this.transition({
      subscriptionId,
      targetStatus: SubscriptionStatus.ACTIVE,
      allowedFrom: [SubscriptionStatus.SUSPENDED],
      subject: 'subscription.resumed',
      triggeredBy: SubscriptionTriggeredBy.SYSTEM,
      onBeforeSave: (subscription) => {
        if (this.schedulingService && subscription.nextChargeAt) {
          const nextChargeAt = this.schedulingService.calculateNextChargeAt(
            subscription.frequency,
            subscription.nextChargeAt.toISOString(),
          );
          subscription.nextChargeAt =
            nextChargeAt instanceof Date ? nextChargeAt : new Date(nextChargeAt);
        }

        subscription.resumedAt = new Date().toISOString();
        subscription.suspendedAt = null;
        subscription.suspensionReason = null;
      },
    });
  }

  async markPastDue(
    subscriptionId: string,
    input?: {
      reason?: string;
      triggeredBy?: SubscriptionTriggeredBy;
      metadata?: Record<string, unknown> | null;
    },
  ): Promise<SubscriptionEntity> {
    return this.transition({
      subscriptionId,
      targetStatus: SubscriptionStatus.PAST_DUE,
      allowedFrom: [SubscriptionStatus.ACTIVE],
      reason: input?.reason,
      subject: 'subscription.past_due',
      triggeredBy: input?.triggeredBy ?? SubscriptionTriggeredBy.SYSTEM,
      metadata: input?.metadata ?? null,
    });
  }

  async cancel(
    subscriptionId: string,
    input: {
      reason: string;
      triggeredBy: SubscriptionTriggeredBy;
      cancelAtPeriodEnd: boolean;
      metadata?: Record<string, unknown> | null;
    },
  ): Promise<SubscriptionEntity>;

  async cancel(
    subscriptionId: string,
    reason: string,
    cancelAtPeriodEnd: boolean,
  ): Promise<SubscriptionEntity>;

  async cancel(
    subscriptionId: string,
    inputOrReason:
      | {
          reason: string;
          triggeredBy: SubscriptionTriggeredBy;
          cancelAtPeriodEnd: boolean;
          metadata?: Record<string, unknown> | null;
        }
      | string,
    cancelAtPeriodEnd?: boolean,
  ): Promise<SubscriptionEntity> {
    const input =
      typeof inputOrReason === 'string'
        ? {
            reason: inputOrReason,
            triggeredBy: SubscriptionTriggeredBy.SYSTEM,
            cancelAtPeriodEnd: cancelAtPeriodEnd ?? false,
            metadata: null,
          }
        : inputOrReason;

    return this.transition({
      subscriptionId,
      targetStatus: SubscriptionStatus.CANCELLED,
      allowedFrom: [
        SubscriptionStatus.PENDING,
        SubscriptionStatus.TRIAL,
        SubscriptionStatus.ACTIVE,
        SubscriptionStatus.SUSPENDED,
        SubscriptionStatus.PAST_DUE,
      ],
      reason: input.reason,
      subject: 'subscription.cancelled',
      triggeredBy: input.triggeredBy,
      metadata: input.metadata ?? null,
      extraPayload: {
        cancelAtPeriodEnd: input.cancelAtPeriodEnd,
      },
      onBeforeSave: (subscription) => {
        subscription.cancelAtPeriodEnd = input.cancelAtPeriodEnd;
        subscription.cancelledAt = new Date();

        if (!input.cancelAtPeriodEnd) {
          subscription.currentPeriodEnd = new Date();
        }
      },
    });
  }

  async expire(subscriptionId: string): Promise<SubscriptionEntity> {
    return this.transition({
      subscriptionId,
      targetStatus: SubscriptionStatus.EXPIRED,
      allowedFrom: [SubscriptionStatus.CANCELLED],
      subject: 'subscription.expired',
      triggeredBy: SubscriptionTriggeredBy.SYSTEM,
      onBeforeSave: (subscription) => {
        subscription.currentPeriodEnd = new Date();
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
    triggeredBy?: SubscriptionTriggeredBy;
    metadata?: Record<string, unknown> | null;
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
      triggeredBy: input.triggeredBy ?? SubscriptionTriggeredBy.SYSTEM,
      metadata: input.metadata ?? null,
    });

    await this.publishEvent(input.subject, {
      subscriptionId: saved.id,
      previousStatus: currentStatus,
      newStatus: input.targetStatus,
      reason: input.reason ?? null,
      triggeredBy: input.triggeredBy ?? SubscriptionTriggeredBy.SYSTEM,
      metadata: input.metadata ?? null,
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
    triggeredBy: SubscriptionTriggeredBy;
    metadata: Record<string, unknown> | null;
  }): Promise<void> {
    const historyRepository = this.statusHistoryRepository as {
      create?: (input: Record<string, unknown>) => Promise<unknown>;
      save?: (entity: SubscriptionStatusHistoryEntity) => Promise<unknown>;
    };

    if (typeof historyRepository.create === 'function') {
      await historyRepository.create({
        subscriptionId: input.subscriptionId,
        oldStatus: input.previousStatus,
        previousStatus: input.previousStatus,
        newStatus: input.newStatus,
        reason: input.reason,
        triggeredBy: input.triggeredBy,
        changedBy: input.triggeredBy,
        metadata: input.metadata,
      });

      return;
    }

    if (typeof historyRepository.save !== 'function') {
      throw new DomainException(
        'History repository does not expose create or save',
        'SUBSCRIPTION_HISTORY_REPOSITORY_INVALID',
        {
          subscriptionId: input.subscriptionId,
        },
      );
    }

    const history: Partial<SubscriptionStatusHistoryEntity> = {
      subscriptionId: input.subscriptionId,
      previousStatus: input.previousStatus,
      newStatus: input.newStatus,
      reason: input.reason,
      changedBy: input.triggeredBy,
    };

    await historyRepository.save(history as SubscriptionStatusHistoryEntity);
  }

  private async publishEvent(subject: string, payload: Record<string, unknown>): Promise<void> {
    if (!this.natsService || !this.natsService.isConnected()) {
      return;
    }

    await this.natsService.publish(subject, payload);
  }
}
