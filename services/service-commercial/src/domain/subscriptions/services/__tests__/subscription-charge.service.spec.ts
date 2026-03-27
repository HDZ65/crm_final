import { describe, expect, it } from 'bun:test';
import {
  StoreSource,
  SubscriptionFrequency,
  SubscriptionPlanType,
  SubscriptionStatus,
  type SubscriptionEntity,
} from '../../entities/subscription.entity';
import type { ISubscriptionRepository } from '../../repositories/ISubscriptionRepository';
import {
  type CreateSubscriptionFactureInput,
  type CreateSubscriptionPaymentIntentInput,
  type SubscriptionFactureClient,
  type SubscriptionPaymentClient,
  SubscriptionChargeService,
} from '../subscription-charge.service';
import type { SubscriptionLifecycleService } from '../subscription-lifecycle.service';

function makeSubscription(overrides: Partial<SubscriptionEntity> = {}): SubscriptionEntity {
  return {
    id: 'sub-1',
    organisationId: 'org-1',
    clientId: 'client-1',
    planType: SubscriptionPlanType.PREMIUM_SVOD,
    status: SubscriptionStatus.ACTIVE,
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
  paymentFailures?: string[];
  preProcessedKeys?: string[];
  maxRetries?: number;
  natsConnected?: boolean;
}

function createFixture(options: FixtureOptions = {}) {
  const paymentFailures = new Set(options.paymentFailures || []);
  const processedKeys = new Set(options.preProcessedKeys || []);

  const dueSubscriptions = options.dueSubscriptions || [makeSubscription()];
  const savedSubscriptions: SubscriptionEntity[] = [];
  const lifecycleTransitions: string[] = [];
  const paymentCalls: CreateSubscriptionPaymentIntentInput[] = [];
  const factureCalls: CreateSubscriptionFactureInput[] = [];
  const publishedEvents: Array<{ subject: string; payload: Record<string, unknown> }> = [];

  const subscriptionsById = new Map<string, SubscriptionEntity>();
  for (const item of dueSubscriptions) {
    subscriptionsById.set(item.id, { ...item });
  }

  const subscriptionRepository = {
    save: async (entity: SubscriptionEntity) => {
      const saved = { ...entity };
      subscriptionsById.set(saved.id, saved);
      savedSubscriptions.push(saved);
      return saved;
    },
    findById: async (id: string) => {
      const entity = subscriptionsById.get(id);
      return entity ? { ...entity } : null;
    },
  } as unknown as ISubscriptionRepository;

  const schedulingService = {
    getDueSubscriptions: async () => dueSubscriptions.map((item) => ({ ...item })),
    calculateNextChargeAt: (frequency: string, currentPeriodEnd: Date | string) => {
      const next = new Date(currentPeriodEnd);
      if (String(frequency).toUpperCase() === SubscriptionFrequency.ANNUAL) {
        next.setUTCFullYear(next.getUTCFullYear() + 1);
      } else {
        next.setUTCMonth(next.getUTCMonth() + 1);
      }
      return next;
    },
  };

  const lifecycleService = {
    markPastDue: async (subscriptionId: string) => {
      lifecycleTransitions.push(subscriptionId);
      const existing = subscriptionsById.get(subscriptionId);
      if (!existing) {
        throw new Error(`Subscription ${subscriptionId} not found`);
      }

      const updated = {
        ...existing,
        status: SubscriptionStatus.PAST_DUE,
      };

      subscriptionsById.set(subscriptionId, updated);
      savedSubscriptions.push(updated);
      return updated;
    },
  } as unknown as SubscriptionLifecycleService;

  const paymentClient: SubscriptionPaymentClient = {
    createPaymentIntent: async (input) => {
      paymentCalls.push(input);
      const subscriptionId = input.metadata.subscription_id;
      if (paymentFailures.has(subscriptionId)) {
        throw new Error(`PAYMENT_FAILED_${subscriptionId}`);
      }

      return {
        id: `pi-${subscriptionId}`,
      };
    },
  };

  const factureClient: SubscriptionFactureClient = {
    createFacture: async (input) => {
      factureCalls.push(input);
      return {
        id: `fac-${input.subscriptionId}`,
      };
    },
  };

  const idempotencyStore = {
    isEventProcessed: async (eventId: string) => processedKeys.has(eventId),
    markEventProcessed: async (eventId: string) => {
      processedKeys.add(eventId);
    },
  };

  const natsService = {
    isConnected: () => options.natsConnected ?? true,
    publish: async (subject: string, payload: Record<string, unknown>) => {
      publishedEvents.push({ subject, payload });
    },
  };

  const service = new SubscriptionChargeService(
    subscriptionRepository,
    schedulingService,
    lifecycleService,
    paymentClient,
    factureClient,
    idempotencyStore,
    natsService as any,
    {
      maxRetries: options.maxRetries ?? 3,
      pspName: 'GOCARDLESS',
      now: () => new Date('2026-02-01T10:00:00.000Z'),
    },
  );

  return {
    service,
    savedSubscriptions,
    lifecycleTransitions,
    paymentCalls,
    factureCalls,
    publishedEvents,
  };
}

describe('SubscriptionChargeService', () => {
  it('successful MONTHLY charge advances next_charge_at and resets retry_count', async () => {
    const { service, savedSubscriptions } = createFixture({
      dueSubscriptions: [makeSubscription({ retryCount: 2 })],
    });

    const result = await service.processCharges('org-1');

    expect(result.successCount).toBe(1);
    expect(result.failedCount).toBe(0);
    expect(savedSubscriptions[0].nextChargeAt?.toISOString()).toBe('2026-03-01T00:00:00.000Z');
    expect(savedSubscriptions[0].retryCount).toBe(0);
  });

  it('successful ANNUAL charge advances next_charge_at by one year', async () => {
    const { service, savedSubscriptions } = createFixture({
      dueSubscriptions: [
        makeSubscription({
          frequency: SubscriptionFrequency.ANNUAL,
          nextChargeAt: new Date('2026-02-15T00:00:00.000Z'),
        }),
      ],
    });

    await service.processCharges('org-1');

    expect(savedSubscriptions[0].nextChargeAt?.toISOString()).toBe('2027-02-15T00:00:00.000Z');
  });

  it('successful charge creates facture and emits SUBSCRIPTION_CHARGED', async () => {
    const { service, factureCalls, publishedEvents } = createFixture();

    await service.processCharges('org-1');

    expect(factureCalls.length).toBe(1);
    expect(factureCalls[0].subscriptionId).toBe('sub-1');
    expect(publishedEvents.length).toBe(1);
    expect(publishedEvents[0].subject).toBe('SUBSCRIPTION_CHARGED');
    expect(publishedEvents[0].payload.invoiceId).toBe('fac-sub-1');
  });

  it('failed charge increments retry_count without moving to PAST_DUE before max retries', async () => {
    const { service, savedSubscriptions, lifecycleTransitions } = createFixture({
      dueSubscriptions: [makeSubscription({ id: 'sub-fail', retryCount: 0 })],
      paymentFailures: ['sub-fail'],
      maxRetries: 3,
    });

    const result = await service.processCharges('org-1');

    expect(result.failedCount).toBe(1);
    expect(savedSubscriptions[0].retryCount).toBe(1);
    expect(savedSubscriptions[0].status).toBe(SubscriptionStatus.ACTIVE);
    expect(lifecycleTransitions.length).toBe(0);
  });

  it('failed charge moves subscription to PAST_DUE when max retries are reached', async () => {
    const { service, savedSubscriptions, lifecycleTransitions } = createFixture({
      dueSubscriptions: [makeSubscription({ id: 'sub-past-due', retryCount: 2 })],
      paymentFailures: ['sub-past-due'],
      maxRetries: 3,
    });

    await service.processCharges('org-1');

    expect(lifecycleTransitions).toEqual(['sub-past-due']);
    const latest = savedSubscriptions.filter((item) => item.id === 'sub-past-due').at(-1);
    expect(latest?.status).toBe(SubscriptionStatus.PAST_DUE);
  });

  it('idempotency key format is subscription_id-next_charge_at', async () => {
    const { service, paymentCalls } = createFixture({
      dueSubscriptions: [
        makeSubscription({
          id: 'sub-key',
          nextChargeAt: new Date('2026-02-15T00:00:00.000Z'),
        }),
      ],
    });

    await service.processCharges('org-1');

    expect(paymentCalls[0].idempotencyKey).toBe('sub-key-2026-02-15T00:00:00.000Z');
  });

  it('idempotency key prevents double-charge for same subscription period', async () => {
    const samePeriodA = makeSubscription({ id: 'sub-dup' });
    const samePeriodB = makeSubscription({ id: 'sub-dup' });

    const { service, paymentCalls } = createFixture({
      dueSubscriptions: [samePeriodA, samePeriodB],
    });

    const result = await service.processCharges('org-1');

    expect(paymentCalls.length).toBe(1);
    expect(result.successCount).toBe(1);
    expect(result.skippedCount).toBe(1);
    expect(result.results[1].reason).toBe('ALREADY_CHARGED');
  });

  it('already processed idempotency key skips charge processing', async () => {
    const subscription = makeSubscription({ id: 'sub-skip' });
    const idempotencyKey = 'sub-skip-2026-02-01T00:00:00.000Z';

    const { service, paymentCalls, savedSubscriptions } = createFixture({
      dueSubscriptions: [subscription],
      preProcessedKeys: [idempotencyKey],
    });

    const result = await service.processCharges('org-1');

    expect(paymentCalls.length).toBe(0);
    expect(savedSubscriptions.length).toBe(0);
    expect(result.skippedCount).toBe(1);
    expect(result.results[0].reason).toBe('ALREADY_CHARGED');
  });

  it('store subscriptions are excluded from processCharges', async () => {
    const { service, paymentCalls } = createFixture({
      dueSubscriptions: [
        makeSubscription({ id: 'sub-apple', storeSource: StoreSource.APPLE_STORE }),
        makeSubscription({ id: 'sub-google', storeSource: StoreSource.GOOGLE_STORE }),
        makeSubscription({ id: 'sub-tv', storeSource: StoreSource.TV_STORE }),
        makeSubscription({ id: 'sub-box', storeSource: StoreSource.BOX }),
      ],
    });

    const result = await service.processCharges('org-1');

    expect(paymentCalls.length).toBe(0);
    expect(result.successCount).toBe(0);
    expect(result.skippedCount).toBe(4);
    expect(result.results.every((item) => item.reason === 'STORE_SOURCE_EXCLUDED')).toBe(true);
  });

  it('FREE_AVOD subscriptions are excluded from processCharges', async () => {
    const { service, paymentCalls } = createFixture({
      dueSubscriptions: [
        makeSubscription({
          id: 'sub-free',
          planType: SubscriptionPlanType.FREE_AVOD,
        }),
      ],
    });

    const result = await service.processCharges('org-1');

    expect(paymentCalls.length).toBe(0);
    expect(result.successCount).toBe(0);
    expect(result.skippedCount).toBe(1);
    expect(result.results[0].reason).toBe('FREE_PLAN_NO_CHARGE');
  });

  it('only ACTIVE subscriptions are processed by recurring charge engine', async () => {
    const { service, paymentCalls } = createFixture({
      dueSubscriptions: [
        makeSubscription({
          id: 'sub-past-due',
          status: SubscriptionStatus.PAST_DUE,
        }),
      ],
    });

    const result = await service.processCharges('org-1');

    expect(paymentCalls.length).toBe(0);
    expect(result.skippedCount).toBe(1);
    expect(result.results[0].reason).toBe('STATUS_NOT_ELIGIBLE');
  });
});
