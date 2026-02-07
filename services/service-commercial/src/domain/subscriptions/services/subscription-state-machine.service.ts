import { Injectable } from '@nestjs/common';
import type { SubscriptionEntity } from '../entities/subscription.entity';
import type { SubscriptionStatusHistoryEntity } from '../entities/subscription-status-history.entity';

export enum SubscriptionStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  PAST_DUE = 'PAST_DUE',
  CANCELED = 'CANCELED',
  EXPIRED = 'EXPIRED',
}

type CancelFields = {
  canceledAt?: string | null;
  cancelReason?: string | null;
};

@Injectable()
export class SubscriptionStateMachineService {
  private readonly validTransitions: Record<SubscriptionStatus, SubscriptionStatus[]> = {
    [SubscriptionStatus.PENDING]: [SubscriptionStatus.ACTIVE, SubscriptionStatus.CANCELED],
    [SubscriptionStatus.ACTIVE]: [
      SubscriptionStatus.PAUSED,
      SubscriptionStatus.PAST_DUE,
      SubscriptionStatus.CANCELED,
      SubscriptionStatus.EXPIRED,
    ],
    [SubscriptionStatus.PAUSED]: [SubscriptionStatus.ACTIVE, SubscriptionStatus.CANCELED],
    [SubscriptionStatus.PAST_DUE]: [
      SubscriptionStatus.ACTIVE,
      SubscriptionStatus.CANCELED,
      SubscriptionStatus.EXPIRED,
    ],
    [SubscriptionStatus.CANCELED]: [],
    [SubscriptionStatus.EXPIRED]: [],
  };

  canTransition(from: string, to: string): boolean {
    return this.validTransitions[from as SubscriptionStatus]?.includes(to as SubscriptionStatus) ?? false;
  }

  transition(
    subscription: SubscriptionEntity,
    newStatus: string,
    reason?: string,
    changedBy?: string,
  ): { subscription: SubscriptionEntity; historyEntry: SubscriptionStatusHistoryEntity } {
    if (!this.canTransition(subscription.status, newStatus)) {
      throw new Error(`Invalid transition from ${subscription.status} to ${newStatus}`);
    }

    const previousStatus = subscription.status;
    subscription.status = newStatus;

    const nowIso = new Date().toISOString();

    if (newStatus === SubscriptionStatus.PAUSED) {
      subscription.pausedAt = nowIso;
    } else if (newStatus === SubscriptionStatus.CANCELED) {
      subscription.endDate = nowIso;

      const cancelData = subscription as SubscriptionEntity & CancelFields;
      cancelData.canceledAt = nowIso;
      cancelData.cancelReason = reason ?? null;
    } else if (newStatus === SubscriptionStatus.ACTIVE && previousStatus === SubscriptionStatus.PAUSED) {
      subscription.pausedAt = null;
    }

    const historyEntry = {
      subscriptionId: subscription.id,
      previousStatus,
      newStatus,
      reason: reason ?? null,
      changedBy: changedBy ?? 'system',
    } as SubscriptionStatusHistoryEntity;

    return { subscription, historyEntry };
  }

  getAvailableTransitions(currentStatus: string): string[] {
    return [...(this.validTransitions[currentStatus as SubscriptionStatus] ?? [])];
  }
}
