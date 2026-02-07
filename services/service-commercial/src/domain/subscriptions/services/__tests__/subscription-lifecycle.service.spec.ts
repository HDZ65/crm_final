import { describe, expect, it } from 'bun:test';
import { DomainException } from '@crm/shared-kernel';
import {
  SubscriptionEntity,
  SubscriptionFrequency,
  SubscriptionPlanType,
  SubscriptionStatus,
  StoreSource,
} from '../../entities/subscription.entity';
import { SubscriptionTriggeredBy } from '../../entities/subscription-history.entity';
import type { ISubscriptionHistoryRepository } from '../../repositories/ISubscriptionHistoryRepository';
import type { ISubscriptionRepository } from '../../repositories/ISubscriptionRepository';
import { SubscriptionLifecycleService } from '../subscription-lifecycle.service';

function makeSubscription(overrides: Partial<SubscriptionEntity> = {}): SubscriptionEntity {
  return {
    id: 'sub-1',
    organisationId: 'org-1',
    clientId: 'client-1',
    planType: SubscriptionPlanType.PREMIUM_SVOD,
    status: SubscriptionStatus.PENDING,
    frequency: SubscriptionFrequency.MONTHLY,
    trialStart: null,
    trialEnd: null,
    currentPeriodStart: new Date('2026-01-01T00:00:00.000Z'),
    currentPeriodEnd: new Date('2026-02-01T00:00:00.000Z'),
    nextChargeAt: new Date('2026-02-01T00:00:00.000Z'),
    amount: 19.9,
    currency: 'EUR',
    storeSource: StoreSource.WEB_DIRECT,
    imsSubscriptionId: null,
    couponId: null,
    cancelAtPeriodEnd: false,
    cancelledAt: null,
    suspendedAt: null,
    suspensionReason: null,
    addOns: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    history: [],
    lines: [],
    cycles: [],
    statusHistory: [],
    contratId: null,
    retryCount: 0,
    ...overrides,
  };
}

function createFixture(initialSubscription: SubscriptionEntity | null) {
  let subscription = initialSubscription ? { ...initialSubscription } : null;
  const savedSubscriptions: SubscriptionEntity[] = [];
  const historyEntries: Array<{
    oldStatus: string | null;
    newStatus: string;
    reason: string | null;
    triggeredBy: string;
    metadata: Record<string, unknown> | null;
  }> = [];
  const publishedEvents: Array<{ subject: string; payload: Record<string, unknown> }> = [];

  const subscriptionRepository = {
    findById: async (id: string) => {
      if (!subscription || subscription.id !== id) {
        return null;
      }
      return { ...subscription };
    },
    save: async (entity: SubscriptionEntity) => {
      subscription = { ...entity };
      savedSubscriptions.push({ ...entity });
      return { ...entity };
    },
  } as unknown as ISubscriptionRepository;

  const historyRepository = {
    create: async (input: {
      oldStatus: string | null;
      newStatus: string;
      reason?: string | null;
      triggeredBy: string;
      metadata?: Record<string, unknown> | null;
    }) => {
      historyEntries.push({
        oldStatus: input.oldStatus,
        newStatus: input.newStatus,
        reason: input.reason || null,
        triggeredBy: input.triggeredBy,
        metadata: input.metadata || null,
      });
      return input as any;
    },
  } as unknown as ISubscriptionHistoryRepository;

  const natsService = {
    isConnected: () => true,
    publish: async (subject: string, payload: Record<string, unknown>) => {
      publishedEvents.push({ subject, payload });
    },
  };

  const service = new SubscriptionLifecycleService(
    subscriptionRepository,
    historyRepository,
    natsService as any,
  );

  return {
    service,
    savedSubscriptions,
    historyEntries,
    publishedEvents,
  };
}

describe('SubscriptionLifecycleService', () => {
  it('PENDING -> TRIAL when trial_days > 0', async () => {
    const { service, savedSubscriptions, historyEntries, publishedEvents } = createFixture(
      makeSubscription({ status: SubscriptionStatus.PENDING }),
    );

    const updated = await service.startTrial('sub-1', {
      trialDays: 7,
      triggeredBy: SubscriptionTriggeredBy.SYSTEM,
    });

    expect(updated.status).toBe(SubscriptionStatus.TRIAL);
    expect(updated.trialStart).toBeTruthy();
    expect(updated.trialEnd).toBeTruthy();
    expect(savedSubscriptions[0].status).toBe(SubscriptionStatus.TRIAL);
    expect(historyEntries[0].oldStatus).toBe(SubscriptionStatus.PENDING);
    expect(historyEntries[0].newStatus).toBe(SubscriptionStatus.TRIAL);
    expect(historyEntries[0].triggeredBy).toBe(SubscriptionTriggeredBy.SYSTEM);
    expect(publishedEvents[0].subject).toBe('subscription.trial_started');
  });

  it('PENDING -> ACTIVE when no trial days', async () => {
    const { service, historyEntries, publishedEvents } = createFixture(
      makeSubscription({ status: SubscriptionStatus.PENDING }),
    );

    const updated = await service.activateFromPending('sub-1', {
      trialDays: 0,
      triggeredBy: SubscriptionTriggeredBy.USER,
    });

    expect(updated.status).toBe(SubscriptionStatus.ACTIVE);
    expect(historyEntries[0].newStatus).toBe(SubscriptionStatus.ACTIVE);
    expect(historyEntries[0].triggeredBy).toBe(SubscriptionTriggeredBy.USER);
    expect(publishedEvents[0].subject).toBe('subscription.activated');
  });

  it('PENDING -> ACTIVE for FREE_AVOD even when trial_days > 0', async () => {
    const { service } = createFixture(
      makeSubscription({
        status: SubscriptionStatus.PENDING,
        planType: SubscriptionPlanType.FREE_AVOD,
      }),
    );

    const updated = await service.activateFromPending('sub-1', {
      trialDays: 14,
      triggeredBy: SubscriptionTriggeredBy.SYSTEM,
    });

    expect(updated.status).toBe(SubscriptionStatus.ACTIVE);
  });

  it('TRIAL -> ACTIVE on conversion', async () => {
    const { service, historyEntries, publishedEvents } = createFixture(
      makeSubscription({
        status: SubscriptionStatus.TRIAL,
        trialStart: new Date('2026-01-01T00:00:00.000Z'),
        trialEnd: new Date('2026-01-08T00:00:00.000Z'),
      }),
    );

    const updated = await service.activateFromTrial('sub-1', {
      triggeredBy: SubscriptionTriggeredBy.SYSTEM,
    });

    expect(updated.status).toBe(SubscriptionStatus.ACTIVE);
    expect(historyEntries[0].oldStatus).toBe(SubscriptionStatus.TRIAL);
    expect(publishedEvents[0].subject).toBe('subscription.activated');
  });

  it('ACTIVE -> PAST_DUE when payment fails', async () => {
    const { service, historyEntries, publishedEvents } = createFixture(
      makeSubscription({ status: SubscriptionStatus.ACTIVE }),
    );

    const updated = await service.markPastDue('sub-1', {
      reason: 'payment_failed',
      triggeredBy: SubscriptionTriggeredBy.SYSTEM,
    });

    expect(updated.status).toBe(SubscriptionStatus.PAST_DUE);
    expect(historyEntries[0].reason).toBe('payment_failed');
    expect(publishedEvents[0].subject).toBe('subscription.past_due');
  });

  it('ACTIVE -> SUSPENDED on dunning/admin', async () => {
    const { service, historyEntries, publishedEvents } = createFixture(
      makeSubscription({ status: SubscriptionStatus.ACTIVE }),
    );

    const updated = await service.suspend('sub-1', {
      reason: 'dunning_j10',
      triggeredBy: SubscriptionTriggeredBy.DUNNING,
    });

    expect(updated.status).toBe(SubscriptionStatus.SUSPENDED);
    expect(updated.suspendedAt).toBeTruthy();
    expect(updated.suspensionReason).toBe('dunning_j10');
    expect(historyEntries[0].triggeredBy).toBe(SubscriptionTriggeredBy.DUNNING);
    expect(publishedEvents[0].subject).toBe('subscription.suspended');
  });

  it('ACTIVE -> CANCELLED on user request', async () => {
    const { service, historyEntries, publishedEvents } = createFixture(
      makeSubscription({ status: SubscriptionStatus.ACTIVE }),
    );

    const updated = await service.cancel('sub-1', {
      reason: 'user_request',
      triggeredBy: SubscriptionTriggeredBy.USER,
      cancelAtPeriodEnd: true,
    });

    expect(updated.status).toBe(SubscriptionStatus.CANCELLED);
    expect(updated.cancelAtPeriodEnd).toBe(true);
    expect(historyEntries[0].newStatus).toBe(SubscriptionStatus.CANCELLED);
    expect(historyEntries[0].triggeredBy).toBe(SubscriptionTriggeredBy.USER);
    expect(publishedEvents[0].subject).toBe('subscription.cancelled');
  });

  it('PAST_DUE -> ACTIVE on payment success', async () => {
    const { service, historyEntries, publishedEvents } = createFixture(
      makeSubscription({ status: SubscriptionStatus.PAST_DUE }),
    );

    const updated = await service.reactivateFromPastDue('sub-1', {
      triggeredBy: SubscriptionTriggeredBy.SYSTEM,
      reason: 'payment_recovered',
    });

    expect(updated.status).toBe(SubscriptionStatus.ACTIVE);
    expect(historyEntries[0].oldStatus).toBe(SubscriptionStatus.PAST_DUE);
    expect(publishedEvents[0].subject).toBe('subscription.reactivated');
  });

  it('PAST_DUE -> SUSPENDED on dunning J+10', async () => {
    const { service, historyEntries, publishedEvents } = createFixture(
      makeSubscription({ status: SubscriptionStatus.PAST_DUE }),
    );

    const updated = await service.suspendFromPastDue('sub-1', {
      reason: 'dunning_j10',
      triggeredBy: SubscriptionTriggeredBy.DUNNING,
    });

    expect(updated.status).toBe(SubscriptionStatus.SUSPENDED);
    expect(historyEntries[0].oldStatus).toBe(SubscriptionStatus.PAST_DUE);
    expect(publishedEvents[0].subject).toBe('subscription.suspended');
  });

  it('SUSPENDED -> ACTIVE on reactivation', async () => {
    const { service, publishedEvents } = createFixture(
      makeSubscription({
        status: SubscriptionStatus.SUSPENDED,
        suspendedAt: new Date('2026-02-10T00:00:00.000Z'),
        suspensionReason: 'dunning_j10',
      }),
    );

    const updated = await service.reactivateFromSuspended('sub-1', {
      triggeredBy: SubscriptionTriggeredBy.USER,
    });

    expect(updated.status).toBe(SubscriptionStatus.ACTIVE);
    expect(updated.suspendedAt).toBeNull();
    expect(updated.suspensionReason).toBeNull();
    expect(publishedEvents[0].subject).toBe('subscription.reactivated');
  });

  it('CANCELLED -> EXPIRED at natural end', async () => {
    const { service, historyEntries, publishedEvents } = createFixture(
      makeSubscription({ status: SubscriptionStatus.CANCELLED }),
    );

    const updated = await service.expire('sub-1');

    expect(updated.status).toBe(SubscriptionStatus.EXPIRED);
    expect(historyEntries[0].oldStatus).toBe(SubscriptionStatus.CANCELLED);
    expect(historyEntries[0].triggeredBy).toBe(SubscriptionTriggeredBy.SYSTEM);
    expect(publishedEvents[0].subject).toBe('subscription.expired');
  });

  it('rejects PENDING -> TRIAL when trial_days <= 0', async () => {
    const { service } = createFixture(makeSubscription({ status: SubscriptionStatus.PENDING }));

    await expect(
      service.startTrial('sub-1', {
        trialDays: 0,
        triggeredBy: SubscriptionTriggeredBy.SYSTEM,
      }),
    ).rejects.toBeInstanceOf(DomainException);
  });

  it('rejects PENDING -> ACTIVE when trial exists on paid plan', async () => {
    const { service } = createFixture(
      makeSubscription({
        status: SubscriptionStatus.PENDING,
        planType: SubscriptionPlanType.PREMIUM_SVOD,
      }),
    );

    await expect(
      service.activateFromPending('sub-1', {
        trialDays: 7,
        triggeredBy: SubscriptionTriggeredBy.SYSTEM,
      }),
    ).rejects.toBeInstanceOf(DomainException);
  });

  it('rejects TRIAL -> ACTIVE via pending activation path', async () => {
    const { service } = createFixture(makeSubscription({ status: SubscriptionStatus.TRIAL }));

    await expect(
      service.activateFromPending('sub-1', {
        trialDays: 0,
        triggeredBy: SubscriptionTriggeredBy.SYSTEM,
      }),
    ).rejects.toBeInstanceOf(DomainException);
  });

  it('rejects ACTIVE -> EXPIRED directly', async () => {
    const { service } = createFixture(makeSubscription({ status: SubscriptionStatus.ACTIVE }));
    await expect(service.expire('sub-1')).rejects.toBeInstanceOf(DomainException);
  });

  it('rejects SUSPENDED -> PAST_DUE path call', async () => {
    const { service } = createFixture(makeSubscription({ status: SubscriptionStatus.SUSPENDED }));

    await expect(
      service.markPastDue('sub-1', {
        triggeredBy: SubscriptionTriggeredBy.SYSTEM,
      }),
    ).rejects.toBeInstanceOf(DomainException);
  });

  it('rejects when subscription does not exist', async () => {
    const { service } = createFixture(null);

    await expect(
      service.startTrial('sub-1', {
        trialDays: 7,
        triggeredBy: SubscriptionTriggeredBy.SYSTEM,
      }),
    ).rejects.toBeInstanceOf(DomainException);
  });

  it('stores metadata and triggered_by in history payload', async () => {
    const { service, historyEntries, publishedEvents } = createFixture(
      makeSubscription({ status: SubscriptionStatus.ACTIVE }),
    );

    await service.markPastDue('sub-1', {
      triggeredBy: SubscriptionTriggeredBy.DUNNING,
      metadata: { attempt: 3, provider: 'stripe' },
    });

    expect(historyEntries[0].triggeredBy).toBe(SubscriptionTriggeredBy.DUNNING);
    expect(historyEntries[0].metadata).toEqual({ attempt: 3, provider: 'stripe' });
    expect(publishedEvents[0].payload.triggeredBy).toBe(SubscriptionTriggeredBy.DUNNING);
  });
});
