import { describe, expect, it } from 'bun:test';
import { DomainException } from '@crm/shared-kernel';
import type { SubscriptionEntity } from '../../entities/subscription.entity';
import type { ISubscriptionRepository } from '../../repositories/ISubscriptionRepository';
import {
  SubscriptionFrequency,
  SubscriptionSchedulingService,
} from '../subscription-scheduling.service';

function makeSubscription(overrides: Partial<SubscriptionEntity> = {}): SubscriptionEntity {
  return {
    id: 'sub-1',
    organisationId: 'org-1',
    clientId: 'client-1',
    contratId: null,
    status: 'ACTIVE',
    frequency: SubscriptionFrequency.MONTHLY,
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

function createFixture(subscriptions: SubscriptionEntity[] = []) {
  let lastQuery: { organisationId: string; beforeDate: string } | null = null;

  const subscriptionRepository = {
    findDueForCharge: async (organisationId: string, beforeDate: string) => {
      lastQuery = { organisationId, beforeDate };
      return subscriptions;
    },
  } as unknown as ISubscriptionRepository;

  const service = new SubscriptionSchedulingService(subscriptionRepository);

  return {
    service,
    getLastQuery: () => lastQuery,
  };
}

describe('SubscriptionSchedulingService', () => {
  it('calculateNextChargeAt: WEEKLY ajoute 7 jours', () => {
    const { service } = createFixture();
    const next = service.calculateNextChargeAt(SubscriptionFrequency.WEEKLY, '2026-01-01T00:00:00.000Z');
    expect(next).toBe('2026-01-08T00:00:00.000Z');
  });

  it('calculateNextChargeAt: MONTHLY conserve jour si possible', () => {
    const { service } = createFixture();
    const next = service.calculateNextChargeAt(SubscriptionFrequency.MONTHLY, '2026-01-15T00:00:00.000Z');
    expect(next).toBe('2026-02-15T00:00:00.000Z');
  });

  it('calculateNextChargeAt: QUARTERLY ajoute 3 mois', () => {
    const { service } = createFixture();
    const next = service.calculateNextChargeAt(SubscriptionFrequency.QUARTERLY, '2026-01-15T00:00:00.000Z');
    expect(next).toBe('2026-04-15T00:00:00.000Z');
  });

  it('isChargeEligible: true si ACTIVE et next_charge_at <= now', () => {
    const { service } = createFixture();
    const eligible = service.isChargeEligible(
      makeSubscription({ status: 'ACTIVE', nextChargeAt: '2026-02-01T00:00:00.000Z' }),
      new Date('2026-02-01T00:00:00.000Z'),
    );
    expect(eligible).toBe(true);
  });

  it('isChargeEligible: false si statut != ACTIVE', () => {
    const { service } = createFixture();
    const eligible = service.isChargeEligible(
      makeSubscription({ status: 'PAUSED', nextChargeAt: '2026-01-01T00:00:00.000Z' }),
      new Date('2026-02-01T00:00:00.000Z'),
    );
    expect(eligible).toBe(false);
  });

  it('getDueSubscriptions: query repository + filtre subscriptions eligibles', async () => {
    const beforeDate = new Date('2026-02-15T00:00:00.000Z');
    const { service, getLastQuery } = createFixture([
      makeSubscription({ id: 'eligible', status: 'ACTIVE', nextChargeAt: '2026-02-10T00:00:00.000Z' }),
      makeSubscription({ id: 'paused', status: 'PAUSED', nextChargeAt: '2026-02-10T00:00:00.000Z' }),
      makeSubscription({ id: 'future', status: 'ACTIVE', nextChargeAt: '2026-03-01T00:00:00.000Z' }),
    ]);

    const due = await service.getDueSubscriptions('org-1', beforeDate);

    expect(getLastQuery()).toEqual({
      organisationId: 'org-1',
      beforeDate: '2026-02-15T00:00:00.000Z',
    });
    expect(due.map((item) => item.id)).toEqual(['eligible']);
  });

  it('invalid: frequency inconnue throw DomainException', () => {
    const { service } = createFixture();
    expect(() => service.calculateNextChargeAt('FORTNIGHTLY', '2026-02-01T00:00:00.000Z')).toThrow(
      DomainException,
    );
  });
});
