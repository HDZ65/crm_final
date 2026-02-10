import { Injectable } from '@nestjs/common';
import {
  SubscriptionStatus,
  type SubscriptionEntity,
} from '../entities/subscription.entity';
import type { SubscriptionStatusHistoryEntity } from '../entities/subscription-status-history.entity';

type CancelFields = {
  canceledAt?: string | null;
  cancelReason?: string | null;
};

@Injectable()
export class SubscriptionStateMachineService {
  private readonly validTransitions: Record<SubscriptionStatus, SubscriptionStatus[]> = {
    [SubscriptionStatus.PENDING]: [SubscriptionStatus.ACTIVE, SubscriptionStatus.CANCELLED],
    [SubscriptionStatus.TRIAL]: [
      SubscriptionStatus.ACTIVE,
      SubscriptionStatus.CANCELLED,
      SubscriptionStatus.EXPIRED,
    ],
    [SubscriptionStatus.ACTIVE]: [
      SubscriptionStatus.SUSPENDED,
      SubscriptionStatus.PAST_DUE,
      SubscriptionStatus.CANCELLED,
      SubscriptionStatus.EXPIRED,
    ],
    [SubscriptionStatus.SUSPENDED]: [SubscriptionStatus.ACTIVE, SubscriptionStatus.CANCELLED],
    [SubscriptionStatus.PAST_DUE]: [
      SubscriptionStatus.ACTIVE,
      SubscriptionStatus.CANCELLED,
      SubscriptionStatus.EXPIRED,
    ],
    [SubscriptionStatus.CANCELLED]: [],
    [SubscriptionStatus.EXPIRED]: [],
  };

  canTransition(from: SubscriptionStatus, to: SubscriptionStatus): boolean {
    return this.validTransitions[from]?.includes(to) ?? false;
  }

  transition(
    subscription: SubscriptionEntity,
    newStatus: SubscriptionStatus,
    reason?: string,
    changedBy?: string,
  ): { subscription: SubscriptionEntity; historyEntry: SubscriptionStatusHistoryEntity } {
    if (!this.canTransition(subscription.status, newStatus)) {
      throw new Error(`Invalid transition from ${subscription.status} to ${newStatus}`);
    }

    const previousStatus = subscription.status;
    subscription.status = newStatus;

    const nowIso = new Date().toISOString();

    if (newStatus === SubscriptionStatus.SUSPENDED) {
      subscription.pausedAt = nowIso;
    } else if (newStatus === SubscriptionStatus.CANCELLED) {
      subscription.endDate = nowIso;

      const cancelData = subscription as SubscriptionEntity & CancelFields;
      cancelData.canceledAt = nowIso;
      cancelData.cancelReason = reason ?? null;
    } else if (
      newStatus === SubscriptionStatus.ACTIVE &&
      previousStatus === SubscriptionStatus.SUSPENDED
    ) {
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

  getAvailableTransitions(currentStatus: SubscriptionStatus): string[] {
    return [...(this.validTransitions[currentStatus] ?? [])];
  }
}
