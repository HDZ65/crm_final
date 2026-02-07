import { describe, expect, it } from 'bun:test';
import { DomainException } from '@crm/shared-kernel';
import type { SubscriptionEntity } from '../../entities/subscription.entity';
import type { ISubscriptionRepository } from '../../repositories/ISubscriptionRepository';
import type { ISubscriptionStatusHistoryRepository } from '../../repositories/ISubscriptionStatusHistoryRepository';
import {
  SubscriptionLifecycleService,
  SubscriptionStatus,
} from '../subscription-lifecycle.service';

function makeSubscription(overrides: Partial<SubscriptionEntity> = {}): SubscriptionEntity {
  return {
    id: 'sub-1',
    organisationId: 'org-1',
    clientId: 'client-1',
    contratId: null,
    status: SubscriptionStatus.PENDING,
    frequency: 'MONTHLY',
    amount: 19.9,
    currency: 'EUR',
    startDate: '2026-01-01T00:00:00.000Z',
    endDate: null,
    pausedAt: null,
    resumedAt: null,
    nextChargeAt: '2026-02-01T00:00:00.000Z',
    retryCount: 0,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    lines: [],
    history: [],
    cycles: [],
    statusHistory: [],
    ...overrides,
  };
}

function createFixture(initialSubscription: SubscriptionEntity | null) {
  let subscription = initialSubscription ? { ...initialSubscription } : null;
  const savedSubscriptions: SubscriptionEntity[] = [];
  const savedHistory: Array<{
    subscriptionId: string;
    previousStatus: string | null;
    newStatus: string;
    reason: string | null;
  }> = [];
  const publishedEvents: Array<{ subject: string; payload: Record<string, unknown> }> = [];
  const schedulingCalls: Array<{ frequency: string; currentPeriodEnd: string }> = [];

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
      return entity;
    },
  } as unknown as ISubscriptionRepository;

  const statusHistoryRepository = {
    save: async (entity: {
      subscriptionId: string;
      previousStatus: string | null;
      newStatus: string;
      reason: string | null;
    }) => {
      savedHistory.push({
        subscriptionId: entity.subscriptionId,
        previousStatus: entity.previousStatus,
        newStatus: entity.newStatus,
        reason: entity.reason,
      });
      return entity;
    },
  } as unknown as ISubscriptionStatusHistoryRepository;

  const schedulingService = {
    calculateNextChargeAt: (frequency: string, currentPeriodEnd: string) => {
      schedulingCalls.push({ frequency, currentPeriodEnd });
      return '2026-03-15T00:00:00.000Z';
    },
  };

  const natsService = {
    isConnected: () => true,
    publish: async (subject: string, payload: Record<string, unknown>) => {
      publishedEvents.push({ subject, payload });
    },
  };

  const service = new SubscriptionLifecycleService(
    subscriptionRepository,
    statusHistoryRepository,
    schedulingService,
    natsService as any,
  );

  return {
    service,
    savedSubscriptions,
    savedHistory,
    publishedEvents,
    schedulingCalls,
  };
}

describe('SubscriptionLifecycleService', () => {
  it('activate: PENDING -> ACTIVE et historise + emit event', async () => {
    const { service, savedSubscriptions, savedHistory, publishedEvents } = createFixture(
      makeSubscription({ status: SubscriptionStatus.PENDING }),
    );

    const updated = await service.activate('sub-1');

    expect(updated.status).toBe(SubscriptionStatus.ACTIVE);
    expect(savedSubscriptions[0].status).toBe(SubscriptionStatus.ACTIVE);
    expect(savedHistory[0]).toEqual({
      subscriptionId: 'sub-1',
      previousStatus: SubscriptionStatus.PENDING,
      newStatus: SubscriptionStatus.ACTIVE,
      reason: null,
    });
    expect(publishedEvents[0].subject).toBe('subscription.activated');
  });

  it('pause: ACTIVE -> PAUSED avec reason', async () => {
    const { service, savedHistory, publishedEvents } = createFixture(
      makeSubscription({ status: SubscriptionStatus.ACTIVE }),
    );

    const updated = await service.pause('sub-1', 'manual intervention');

    expect(updated.status).toBe(SubscriptionStatus.PAUSED);
    expect(updated.pausedAt).toBeTruthy();
    expect(savedHistory[0].reason).toBe('manual intervention');
    expect(publishedEvents[0].subject).toBe('subscription.paused');
  });

  it('resume: PAUSED -> ACTIVE recalcule next_charge_at', async () => {
    const { service, schedulingCalls, publishedEvents } = createFixture(
      makeSubscription({
        status: SubscriptionStatus.PAUSED,
        pausedAt: '2026-02-10T00:00:00.000Z',
        nextChargeAt: '2026-02-12T00:00:00.000Z',
      }),
    );

    const updated = await service.resume('sub-1');

    expect(updated.status).toBe(SubscriptionStatus.ACTIVE);
    expect(updated.pausedAt).toBeNull();
    expect(updated.resumedAt).toBeTruthy();
    expect(updated.nextChargeAt).toBe('2026-03-15T00:00:00.000Z');
    expect(schedulingCalls[0]).toEqual({
      frequency: 'MONTHLY',
      currentPeriodEnd: '2026-02-12T00:00:00.000Z',
    });
    expect(publishedEvents[0].subject).toBe('subscription.resumed');
  });

  it('markPastDue: ACTIVE -> PAST_DUE', async () => {
    const { service, savedHistory, publishedEvents } = createFixture(
      makeSubscription({ status: SubscriptionStatus.ACTIVE }),
    );

    const updated = await service.markPastDue('sub-1');

    expect(updated.status).toBe(SubscriptionStatus.PAST_DUE);
    expect(savedHistory[0].newStatus).toBe(SubscriptionStatus.PAST_DUE);
    expect(publishedEvents[0].subject).toBe('subscription.past_due');
  });

  it('cancel: any -> CANCELED avec reason + cancelAtPeriodEnd', async () => {
    const { service, savedHistory, publishedEvents } = createFixture(
      makeSubscription({ status: SubscriptionStatus.PAUSED }),
    );

    const updated = await service.cancel('sub-1', 'client request', true);

    expect(updated.status).toBe(SubscriptionStatus.CANCELED);
    expect(savedHistory[0].reason).toBe('client request');
    expect(publishedEvents[0].subject).toBe('subscription.canceled');
    expect(publishedEvents[0].payload.cancelAtPeriodEnd).toBe(true);
  });

  it('expire: ACTIVE -> EXPIRED', async () => {
    const { service, savedHistory, publishedEvents } = createFixture(
      makeSubscription({ status: SubscriptionStatus.ACTIVE }),
    );

    const updated = await service.expire('sub-1');

    expect(updated.status).toBe(SubscriptionStatus.EXPIRED);
    expect(savedHistory[0].newStatus).toBe(SubscriptionStatus.EXPIRED);
    expect(publishedEvents[0].subject).toBe('subscription.expired');
  });

  it('invalid: activate refuse si deja ACTIVE', async () => {
    const { service } = createFixture(makeSubscription({ status: SubscriptionStatus.ACTIVE }));
    await expect(service.activate('sub-1')).rejects.toBeInstanceOf(DomainException);
  });

  it('invalid: pause refuse si deja PAUSED', async () => {
    const { service } = createFixture(makeSubscription({ status: SubscriptionStatus.PAUSED }));
    await expect(service.pause('sub-1')).rejects.toBeInstanceOf(DomainException);
  });

  it('invalid: resume refuse si statut != PAUSED', async () => {
    const { service } = createFixture(makeSubscription({ status: SubscriptionStatus.ACTIVE }));
    await expect(service.resume('sub-1')).rejects.toBeInstanceOf(DomainException);
  });

  it('invalid: markPastDue refuse si statut != ACTIVE', async () => {
    const { service } = createFixture(makeSubscription({ status: SubscriptionStatus.PAUSED }));
    await expect(service.markPastDue('sub-1')).rejects.toBeInstanceOf(DomainException);
  });

  it('invalid: cancel refuse si deja CANCELED', async () => {
    const { service } = createFixture(makeSubscription({ status: SubscriptionStatus.CANCELED }));
    await expect(service.cancel('sub-1', 'already canceled', false)).rejects.toBeInstanceOf(DomainException);
  });

  it('invalid: expire refuse si statut != ACTIVE', async () => {
    const { service } = createFixture(makeSubscription({ status: SubscriptionStatus.PENDING }));
    await expect(service.expire('sub-1')).rejects.toBeInstanceOf(DomainException);
  });

  it('invalid: operation refuse si subscription introuvable', async () => {
    const { service } = createFixture(null);
    await expect(service.activate('sub-1')).rejects.toBeInstanceOf(DomainException);
  });
});
