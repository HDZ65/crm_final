import { describe, expect, it } from 'bun:test';
import {
  StoreSource,
  SubscriptionFrequency,
  SubscriptionPlanType,
  SubscriptionStatus,
  type SubscriptionEntity,
} from '../../entities/subscription.entity';
import type { SubscriptionChargeService } from '../subscription-charge.service';
import type { SubscriptionLifecycleService } from '../subscription-lifecycle.service';
import { SubscriptionTrialService } from '../subscription-trial.service';

function makeSubscription(overrides: Partial<SubscriptionEntity> = {}): SubscriptionEntity {
  return {
    id: 'sub-1',
    organisationId: 'org-1',
    clientId: 'client-1',
    planType: SubscriptionPlanType.PREMIUM_SVOD,
    status: SubscriptionStatus.TRIAL,
    frequency: SubscriptionFrequency.MONTHLY,
    trialStart: new Date('2026-01-01T00:00:00.000Z'),
    trialEnd: new Date('2026-02-01T00:00:00.000Z'),
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
    lines: [],
    history: [],
    cycles: [],
    statusHistory: [],
    contratId: null,
    retryCount: 0,
    ...overrides,
  };
}

interface FixtureOptions {
  dueSubscriptions?: SubscriptionEntity[];
  chargeResultsBySubscriptionId?: Record<string, { status: 'CHARGED' | 'FAILED' | 'SKIPPED'; reason?: string }>;
  natsConnected?: boolean;
}

function createFixture(options: FixtureOptions = {}) {
  const dueSubscriptions = options.dueSubscriptions || [makeSubscription()];
  const chargeCalls: string[] = [];
  const lifecycleActivations: string[] = [];
  const publishedEvents: Array<{ subject: string; payload: Record<string, unknown> }> = [];

  let lastSchedulingQuery: { organisationId: string; now: Date | undefined } | null = null;

  const schedulingService = {
    getDueForTrialConversion: async (organisationId: string, now?: Date) => {
      lastSchedulingQuery = { organisationId, now };
      return dueSubscriptions.map((item) => ({ ...item }));
    },
  };

  const chargeService = {
    chargeTrialConversion: async (subscription: SubscriptionEntity) => {
      chargeCalls.push(subscription.id);
      const configured = options.chargeResultsBySubscriptionId?.[subscription.id];
      if (!configured) {
        return {
          subscriptionId: subscription.id,
          idempotencyKey: `${subscription.id}-key`,
          status: 'CHARGED' as const,
          paymentIntentId: `pi-${subscription.id}`,
          invoiceId: `fac-${subscription.id}`,
        };
      }

      return {
        subscriptionId: subscription.id,
        idempotencyKey: `${subscription.id}-key`,
        status: configured.status,
        reason: configured.reason,
      };
    },
  } as unknown as SubscriptionChargeService;

  const lifecycleService = {
    activateFromTrial: async (subscriptionId: string) => {
      lifecycleActivations.push(subscriptionId);
      return makeSubscription({
        id: subscriptionId,
        status: SubscriptionStatus.ACTIVE,
      });
    },
  } as unknown as SubscriptionLifecycleService;

  const natsService = {
    isConnected: () => options.natsConnected ?? true,
    publish: async (subject: string, payload: Record<string, unknown>) => {
      publishedEvents.push({ subject, payload });
    },
  };

  const service = new SubscriptionTrialService(
    schedulingService,
    chargeService,
    lifecycleService,
    natsService as any,
    {
      now: () => new Date('2026-02-01T10:00:00.000Z'),
    },
  );

  return {
    service,
    chargeCalls,
    lifecycleActivations,
    publishedEvents,
    getLastSchedulingQuery: () => lastSchedulingQuery,
  };
}

describe('SubscriptionTrialService', () => {
  it('finds expired trials through scheduling service', async () => {
    const { service, getLastSchedulingQuery } = createFixture();

    await service.processTrialConversions('org-1');

    expect(getLastSchedulingQuery()).toEqual({
      organisationId: 'org-1',
      now: new Date('2026-02-01T10:00:00.000Z'),
    });
  });

  it('FREE_AVOD trial conversion transitions TRIAL to ACTIVE without charge', async () => {
    const freeTrial = makeSubscription({
      id: 'sub-free',
      planType: SubscriptionPlanType.FREE_AVOD,
    });

    const { service, chargeCalls, lifecycleActivations, publishedEvents } = createFixture({
      dueSubscriptions: [freeTrial],
    });

    const result = await service.processTrialConversions('org-1');

    expect(chargeCalls.length).toBe(0);
    expect(lifecycleActivations).toEqual(['sub-free']);
    expect(result.convertedCount).toBe(1);
    expect(result.results[0].status).toBe('CONVERTED');
    expect(result.results[0].reason).toBe('FREE_PLAN_NO_CHARGE');
    expect(publishedEvents[0].subject).toBe('SUBSCRIPTION_TRIAL_CONVERTED');
  });

  it('paid trial conversion charges and activates subscription on success', async () => {
    const paidTrial = makeSubscription({ id: 'sub-paid' });

    const { service, chargeCalls, lifecycleActivations } = createFixture({
      dueSubscriptions: [paidTrial],
      chargeResultsBySubscriptionId: {
        'sub-paid': { status: 'CHARGED' },
      },
    });

    const result = await service.processTrialConversions('org-1');

    expect(chargeCalls).toEqual(['sub-paid']);
    expect(lifecycleActivations).toEqual(['sub-paid']);
    expect(result.convertedCount).toBe(1);
    expect(result.pastDueCount).toBe(0);
    expect(result.results[0].status).toBe('CONVERTED');
  });

  it('paid trial conversion moves to PAST_DUE when charge fails', async () => {
    const paidTrial = makeSubscription({ id: 'sub-failed' });

    const { service, chargeCalls, lifecycleActivations } = createFixture({
      dueSubscriptions: [paidTrial],
      chargeResultsBySubscriptionId: {
        'sub-failed': { status: 'FAILED', reason: 'PAYMENT_DECLINED' },
      },
    });

    const result = await service.processTrialConversions('org-1');

    expect(chargeCalls).toEqual(['sub-failed']);
    expect(lifecycleActivations.length).toBe(0);
    expect(result.convertedCount).toBe(0);
    expect(result.pastDueCount).toBe(1);
    expect(result.results[0].status).toBe('PAST_DUE');
    expect(result.results[0].reason).toBe('PAYMENT_DECLINED');
  });

  it('store-source subscriptions are excluded from trial conversion engine', async () => {
    const storeTrial = makeSubscription({
      id: 'sub-apple',
      storeSource: StoreSource.APPLE_STORE,
    });

    const { service, chargeCalls, lifecycleActivations } = createFixture({
      dueSubscriptions: [storeTrial],
    });

    const result = await service.processTrialConversions('org-1');

    expect(chargeCalls.length).toBe(0);
    expect(lifecycleActivations.length).toBe(0);
    expect(result.skippedCount).toBe(1);
    expect(result.results[0].reason).toBe('STORE_SOURCE_EXCLUDED');
  });

  it('trial not yet expired is skipped', async () => {
    const upcomingTrial = makeSubscription({
      id: 'sub-upcoming',
      trialEnd: new Date('2026-03-01T00:00:00.000Z'),
    });

    const { service, chargeCalls, lifecycleActivations } = createFixture({
      dueSubscriptions: [upcomingTrial],
    });

    const result = await service.processTrialConversions('org-1');

    expect(chargeCalls.length).toBe(0);
    expect(lifecycleActivations.length).toBe(0);
    expect(result.skippedCount).toBe(1);
    expect(result.results[0].reason).toBe('TRIAL_NOT_EXPIRED');
  });

  it('processes multiple trials in same organisation', async () => {
    const freeTrial = makeSubscription({
      id: 'sub-free',
      planType: SubscriptionPlanType.FREE_AVOD,
    });
    const paidSuccess = makeSubscription({ id: 'sub-paid-ok' });
    const paidFail = makeSubscription({ id: 'sub-paid-fail' });

    const { service, chargeCalls, lifecycleActivations } = createFixture({
      dueSubscriptions: [freeTrial, paidSuccess, paidFail],
      chargeResultsBySubscriptionId: {
        'sub-paid-ok': { status: 'CHARGED' },
        'sub-paid-fail': { status: 'FAILED', reason: 'DECLINED' },
      },
    });

    const result = await service.processTrialConversions('org-1');

    expect(chargeCalls).toEqual(['sub-paid-ok', 'sub-paid-fail']);
    expect(lifecycleActivations).toEqual(['sub-free', 'sub-paid-ok']);
    expect(result.convertedCount).toBe(2);
    expect(result.pastDueCount).toBe(1);
    expect(result.skippedCount).toBe(0);
  });

  it('non-TRIAL subscriptions are skipped', async () => {
    const nonTrial = makeSubscription({
      id: 'sub-active',
      status: SubscriptionStatus.ACTIVE,
    });

    const { service, chargeCalls, lifecycleActivations } = createFixture({
      dueSubscriptions: [nonTrial],
    });

    const result = await service.processTrialConversions('org-1');

    expect(chargeCalls.length).toBe(0);
    expect(lifecycleActivations.length).toBe(0);
    expect(result.skippedCount).toBe(1);
    expect(result.results[0].reason).toBe('STATUS_NOT_TRIAL');
  });
});
