import { describe, expect, it } from 'bun:test';
import type { SubscriptionEntity } from '../../entities/subscription.entity';
import type { ISubscriptionRepository } from '../../repositories/ISubscriptionRepository';
import {
  type CreateSubscriptionFactureInput,
  type CreateSubscriptionPaymentIntentInput,
  type SubscriptionFactureClient,
  type SubscriptionPaymentClient,
  SubscriptionChargeService,
} from '../subscription-charge.service';

function makeSubscription(overrides: Partial<SubscriptionEntity> = {}): SubscriptionEntity {
  return {
    id: 'sub-1',
    organisationId: 'org-1',
    clientId: 'client-1',
    contratId: null,
    status: 'ACTIVE',
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
  const paymentCalls: CreateSubscriptionPaymentIntentInput[] = [];
  const factureCalls: CreateSubscriptionFactureInput[] = [];
  const publishedEvents: Array<{ subject: string; payload: Record<string, unknown> }> = [];

  const subscriptionRepository = {
    save: async (entity: SubscriptionEntity) => {
      const saved = { ...entity };
      savedSubscriptions.push(saved);
      return saved;
    },
  } as unknown as ISubscriptionRepository;

  const schedulingService = {
    getDueSubscriptions: async () => dueSubscriptions.map((item) => ({ ...item })),
    calculateNextChargeAt: (_frequency: string, currentPeriodEnd: string) => {
      const next = new Date(currentPeriodEnd);
      next.setUTCMonth(next.getUTCMonth() + 1);
      return next.toISOString();
    },
  };

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
    isProcessed: async (idempotencyKey: string) => processedKeys.has(idempotencyKey),
    markProcessed: async (idempotencyKey: string) => {
      processedKeys.add(idempotencyKey);
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
    paymentCalls,
    factureCalls,
    publishedEvents,
  };
}

describe('SubscriptionChargeService', () => {
  it('successful charge: next_charge_at advanced and retry_count reset', async () => {
    const { service, savedSubscriptions, paymentCalls } = createFixture({
      dueSubscriptions: [makeSubscription({ retryCount: 2 })],
    });

    const result = await service.processCharges('org-1');

    expect(result.successCount).toBe(1);
    expect(result.failedCount).toBe(0);
    expect(savedSubscriptions[0].nextChargeAt).toBe('2026-03-01T00:00:00.000Z');
    expect(savedSubscriptions[0].retryCount).toBe(0);
    expect(paymentCalls.length).toBe(1);
  });

  it('successful charge: facture created and SUBSCRIPTION_CHARGED emitted', async () => {
    const { service, factureCalls, publishedEvents } = createFixture();

    await service.processCharges('org-1');

    expect(factureCalls.length).toBe(1);
    expect(factureCalls[0].subscriptionId).toBe('sub-1');
    expect(publishedEvents.length).toBe(1);
    expect(publishedEvents[0].subject).toBe('SUBSCRIPTION_CHARGED');
    expect(publishedEvents[0].payload.invoiceId).toBe('fac-sub-1');
  });

  it('failed charge: retry_count incremented', async () => {
    const { service, savedSubscriptions } = createFixture({
      dueSubscriptions: [makeSubscription({ id: 'sub-fail', retryCount: 0 })],
      paymentFailures: ['sub-fail'],
      maxRetries: 3,
    });

    const result = await service.processCharges('org-1');

    expect(result.failedCount).toBe(1);
    expect(savedSubscriptions[0].retryCount).toBe(1);
    expect(savedSubscriptions[0].status).toBe('ACTIVE');
  });

  it('max retries reached: status moved to PAST_DUE', async () => {
    const { service, savedSubscriptions } = createFixture({
      dueSubscriptions: [makeSubscription({ id: 'sub-past-due', retryCount: 2 })],
      paymentFailures: ['sub-past-due'],
      maxRetries: 3,
    });

    await service.processCharges('org-1');

    expect(savedSubscriptions[0].retryCount).toBe(3);
    expect(savedSubscriptions[0].status).toBe('PAST_DUE');
  });

  it('idempotency key format: subscription_id-next_charge_at', async () => {
    const { service, paymentCalls } = createFixture({
      dueSubscriptions: [
        makeSubscription({
          id: 'sub-key',
          nextChargeAt: '2026-02-15T00:00:00.000Z',
        }),
      ],
    });

    await service.processCharges('org-1');

    expect(paymentCalls[0].idempotencyKey).toBe('sub-key-2026-02-15T00:00:00.000Z');
  });

  it('idempotency key prevents double-charge for same period', async () => {
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

  it('already charged subscription is skipped', async () => {
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

  it('failed charge: SUBSCRIPTION_CHARGE_FAILED emitted', async () => {
    const { service, publishedEvents } = createFixture({
      dueSubscriptions: [makeSubscription({ id: 'sub-event-fail' })],
      paymentFailures: ['sub-event-fail'],
      maxRetries: 3,
    });

    await service.processCharges('org-1');

    expect(publishedEvents.length).toBe(1);
    expect(publishedEvents[0].subject).toBe('SUBSCRIPTION_CHARGE_FAILED');
    expect(publishedEvents[0].payload.retryCount).toBe(1);
    expect(String(publishedEvents[0].payload.reason)).toContain('PAYMENT_FAILED_sub-event-fail');
  });
});
