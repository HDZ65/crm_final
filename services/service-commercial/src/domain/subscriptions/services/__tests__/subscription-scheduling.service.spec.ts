import { describe, expect, it } from 'bun:test';
import { DomainException } from '@crm/shared-kernel';
import {
  SubscriptionEntity,
  SubscriptionFrequency,
  SubscriptionPlanType,
  SubscriptionStatus,
  StoreSource,
} from '../../entities/subscription.entity';
import type { ISubscriptionRepository } from '../../repositories/ISubscriptionRepository';
import { SubscriptionSchedulingService } from '../subscription-scheduling.service';

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
    history: [],
    lines: [],
    cycles: [],
    statusHistory: [],
    contratId: null,
    retryCount: 0,
    ...overrides,
  };
}

function createFixture(subscriptions: SubscriptionEntity[] = []) {
  let lastDueForChargeQuery: { organisationId: string; beforeDate: Date } | null = null;
  let lastDueForTrialQuery: string | null = null;

  const repository = {
    getDueForCharge: async (organisationId: string, beforeDate: Date) => {
      lastDueForChargeQuery = { organisationId, beforeDate };
      return subscriptions;
    },
    getDueForTrialConversion: async (organisationId: string) => {
      lastDueForTrialQuery = organisationId;
      return subscriptions;
    },
  } as unknown as ISubscriptionRepository;

  const service = new SubscriptionSchedulingService(repository);

  return {
    service,
    getLastDueForChargeQuery: () => lastDueForChargeQuery,
    getLastDueForTrialQuery: () => lastDueForTrialQuery,
  };
}

describe('SubscriptionSchedulingService', () => {
  it('calculateNextChargeAt adds one month for MONTHLY frequency', () => {
    const { service } = createFixture();

    const next = service.calculateNextChargeAt(
      SubscriptionFrequency.MONTHLY,
      new Date('2026-01-31T00:00:00.000Z'),
    );

    expect(next.toISOString()).toBe('2026-02-28T00:00:00.000Z');
  });

  it('calculateNextChargeAt adds one year for ANNUAL frequency', () => {
    const { service } = createFixture();

    const next = service.calculateNextChargeAt(
      SubscriptionFrequency.ANNUAL,
      new Date('2026-01-15T00:00:00.000Z'),
    );

    expect(next.toISOString()).toBe('2027-01-15T00:00:00.000Z');
  });

  it('throws DomainException for unsupported frequency', () => {
    const { service } = createFixture();

    expect(() => {
      service.calculateNextChargeAt('WEEKLY' as SubscriptionFrequency, new Date('2026-01-15'));
    }).toThrow(DomainException);
  });

  it('isTrialExpired returns true for TRIAL subscriptions beyond trial_end', () => {
    const { service } = createFixture();

    const expired = service.isTrialExpired(
      makeSubscription({
        status: SubscriptionStatus.TRIAL,
        trialEnd: new Date('2026-01-05T00:00:00.000Z'),
      }),
      new Date('2026-01-06T00:00:00.000Z'),
    );

    expect(expired).toBe(true);
  });

  it('isTrialExpired returns false when status is not TRIAL', () => {
    const { service } = createFixture();

    const expired = service.isTrialExpired(
      makeSubscription({
        status: SubscriptionStatus.ACTIVE,
        trialEnd: new Date('2026-01-05T00:00:00.000Z'),
      }),
      new Date('2026-01-06T00:00:00.000Z'),
    );

    expect(expired).toBe(false);
  });

  it('getDueForCharge delegates to repository query', async () => {
    const due = makeSubscription({ id: 'sub-due' });
    const { service, getLastDueForChargeQuery } = createFixture([due]);

    const result = await service.getDueForCharge(
      'org-1',
      new Date('2026-02-15T00:00:00.000Z'),
    );

    expect(getLastDueForChargeQuery()).toEqual({
      organisationId: 'org-1',
      beforeDate: new Date('2026-02-15T00:00:00.000Z'),
    });
    expect(result.map((item) => item.id)).toEqual(['sub-due']);
  });

  it('getDueForTrialConversion filters expired trial subscriptions', async () => {
    const { service, getLastDueForTrialQuery } = createFixture([
      makeSubscription({
        id: 'expired-trial',
        status: SubscriptionStatus.TRIAL,
        trialEnd: new Date('2026-02-01T00:00:00.000Z'),
      }),
      makeSubscription({
        id: 'active-trial',
        status: SubscriptionStatus.TRIAL,
        trialEnd: new Date('2026-02-20T00:00:00.000Z'),
      }),
    ]);

    const result = await service.getDueForTrialConversion(
      'org-1',
      new Date('2026-02-10T00:00:00.000Z'),
    );

    expect(getLastDueForTrialQuery()).toBe('org-1');
    expect(result.map((item) => item.id)).toEqual(['expired-trial']);
  });
});
