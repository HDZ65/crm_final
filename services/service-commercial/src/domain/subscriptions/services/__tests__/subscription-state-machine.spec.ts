import { beforeEach, describe, expect, it } from 'bun:test';
import type { SubscriptionEntity } from '../../entities/subscription.entity';
import {
  SubscriptionStateMachineService,
  SubscriptionStatus,
} from '../subscription-state-machine.service';

type TransitionCase = {
  from: SubscriptionStatus;
  to: SubscriptionStatus;
};

type CancelFields = {
  canceledAt?: string | null;
  cancelReason?: string | null;
};

const validTransitions: TransitionCase[] = [
  { from: SubscriptionStatus.PENDING, to: SubscriptionStatus.ACTIVE },
  { from: SubscriptionStatus.PENDING, to: SubscriptionStatus.CANCELED },
  { from: SubscriptionStatus.ACTIVE, to: SubscriptionStatus.PAUSED },
  { from: SubscriptionStatus.ACTIVE, to: SubscriptionStatus.PAST_DUE },
  { from: SubscriptionStatus.ACTIVE, to: SubscriptionStatus.CANCELED },
  { from: SubscriptionStatus.ACTIVE, to: SubscriptionStatus.EXPIRED },
  { from: SubscriptionStatus.PAUSED, to: SubscriptionStatus.ACTIVE },
  { from: SubscriptionStatus.PAUSED, to: SubscriptionStatus.CANCELED },
  { from: SubscriptionStatus.PAST_DUE, to: SubscriptionStatus.ACTIVE },
  { from: SubscriptionStatus.PAST_DUE, to: SubscriptionStatus.CANCELED },
  { from: SubscriptionStatus.PAST_DUE, to: SubscriptionStatus.EXPIRED },
];

const invalidTransitions: TransitionCase[] = [
  { from: SubscriptionStatus.PENDING, to: SubscriptionStatus.PAUSED },
  { from: SubscriptionStatus.PENDING, to: SubscriptionStatus.PAST_DUE },
  { from: SubscriptionStatus.PENDING, to: SubscriptionStatus.EXPIRED },
  { from: SubscriptionStatus.ACTIVE, to: SubscriptionStatus.PENDING },
  { from: SubscriptionStatus.PAUSED, to: SubscriptionStatus.PAST_DUE },
  { from: SubscriptionStatus.PAUSED, to: SubscriptionStatus.EXPIRED },
  { from: SubscriptionStatus.CANCELED, to: SubscriptionStatus.ACTIVE },
  { from: SubscriptionStatus.EXPIRED, to: SubscriptionStatus.ACTIVE },
];

function makeSubscription(
  status: SubscriptionStatus,
  overrides: Partial<SubscriptionEntity> = {},
): SubscriptionEntity {
  return {
    id: 'sub-1',
    organisationId: 'org-1',
    clientId: 'client-1',
    contratId: null,
    status,
    frequency: 'MONTHLY',
    amount: 29.9,
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

describe('SubscriptionStateMachineService', () => {
  let service: SubscriptionStateMachineService;

  beforeEach(() => {
    service = new SubscriptionStateMachineService();
  });

  describe('canTransition', () => {
    validTransitions.forEach(({ from, to }) => {
      it(`allows ${from} -> ${to}`, () => {
        expect(service.canTransition(from, to)).toBe(true);
      });
    });

    it('allows transitions when called with raw string statuses', () => {
      expect(service.canTransition('ACTIVE', 'CANCELED')).toBe(true);
    });

    invalidTransitions.forEach(({ from, to }) => {
      it(`rejects ${from} -> ${to}`, () => {
        expect(service.canTransition(from, to)).toBe(false);
      });
    });

    it('returns false for unknown origin status', () => {
      expect(service.canTransition('UNKNOWN', SubscriptionStatus.ACTIVE)).toBe(false);
    });

    it('returns false for unknown target status', () => {
      expect(service.canTransition(SubscriptionStatus.ACTIVE, 'UNKNOWN')).toBe(false);
    });
  });

  describe('transition', () => {
    it('creates history entry with expected fields', () => {
      const subscription = makeSubscription(SubscriptionStatus.PENDING, { id: 'sub-history' });

      const result = service.transition(
        subscription,
        SubscriptionStatus.ACTIVE,
        'manual activation',
        'user-123',
      );

      expect(result.subscription.status).toBe(SubscriptionStatus.ACTIVE);
      expect(result.historyEntry.subscriptionId).toBe('sub-history');
      expect(result.historyEntry.previousStatus).toBe(SubscriptionStatus.PENDING);
      expect(result.historyEntry.newStatus).toBe(SubscriptionStatus.ACTIVE);
      expect(result.historyEntry.reason).toBe('manual activation');
      expect(result.historyEntry.changedBy).toBe('user-123');
    });

    it('uses default history values when reason and changedBy are omitted', () => {
      const subscription = makeSubscription(SubscriptionStatus.PENDING);

      const result = service.transition(subscription, SubscriptionStatus.ACTIVE);

      expect(result.historyEntry.reason).toBeNull();
      expect(result.historyEntry.changedBy).toBe('system');
    });

    it('sets pausedAt when transitioning to PAUSED', () => {
      const subscription = makeSubscription(SubscriptionStatus.ACTIVE);

      const result = service.transition(subscription, SubscriptionStatus.PAUSED);

      expect(result.subscription.pausedAt).toBeTruthy();
      expect(Number.isNaN(Date.parse(result.subscription.pausedAt as string))).toBe(false);
    });

    it('sets cancellation metadata when transitioning to CANCELED', () => {
      const subscription = makeSubscription(SubscriptionStatus.ACTIVE);

      const result = service.transition(subscription, SubscriptionStatus.CANCELED, 'customer request');
      const canceled = result.subscription as SubscriptionEntity & CancelFields;

      expect(result.subscription.endDate).toBeTruthy();
      expect(canceled.canceledAt).toBeTruthy();
      expect(canceled.cancelReason).toBe('customer request');
    });

    it('clears pausedAt when transitioning from PAUSED to ACTIVE', () => {
      const subscription = makeSubscription(SubscriptionStatus.PAUSED, {
        pausedAt: '2026-02-10T00:00:00.000Z',
      });

      const result = service.transition(subscription, SubscriptionStatus.ACTIVE);

      expect(result.subscription.pausedAt).toBeNull();
    });

    it('throws on invalid transition', () => {
      const subscription = makeSubscription(SubscriptionStatus.CANCELED);

      expect(() => {
        service.transition(subscription, SubscriptionStatus.ACTIVE);
      }).toThrow('Invalid transition from CANCELED to ACTIVE');
    });
  });

  describe('getAvailableTransitions', () => {
    it('returns expected transitions for PENDING', () => {
      expect(service.getAvailableTransitions(SubscriptionStatus.PENDING)).toEqual([
        SubscriptionStatus.ACTIVE,
        SubscriptionStatus.CANCELED,
      ]);
    });

    it('returns expected transitions for ACTIVE', () => {
      expect(service.getAvailableTransitions(SubscriptionStatus.ACTIVE)).toEqual([
        SubscriptionStatus.PAUSED,
        SubscriptionStatus.PAST_DUE,
        SubscriptionStatus.CANCELED,
        SubscriptionStatus.EXPIRED,
      ]);
    });

    it('returns empty array for terminal status CANCELED', () => {
      expect(service.getAvailableTransitions(SubscriptionStatus.CANCELED)).toEqual([]);
    });

    it('returns empty array for terminal status EXPIRED', () => {
      expect(service.getAvailableTransitions(SubscriptionStatus.EXPIRED)).toEqual([]);
    });

    it('returns empty array for unknown status', () => {
      expect(service.getAvailableTransitions('UNKNOWN')).toEqual([]);
    });

    it('returns a copy so external mutations do not alter transition map', () => {
      const transitions = service.getAvailableTransitions(SubscriptionStatus.PENDING);
      transitions.push(SubscriptionStatus.EXPIRED);

      expect(service.getAvailableTransitions(SubscriptionStatus.PENDING)).toEqual([
        SubscriptionStatus.ACTIVE,
        SubscriptionStatus.CANCELED,
      ]);
    });
  });
});
