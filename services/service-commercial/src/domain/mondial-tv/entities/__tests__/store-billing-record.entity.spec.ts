import { describe, it, expect, beforeEach } from 'bun:test';
import {
  StoreBillingRecordEntity,
  StoreSource,
  StoreBillingStatus,
  StoreEventType,
} from '../store-billing-record.entity';

describe('StoreBillingRecordEntity', () => {
  let entity: StoreBillingRecordEntity;

  beforeEach(() => {
    entity = new StoreBillingRecordEntity();
    entity.id = '550e8400-e29b-41d4-a716-446655440000';
    entity.organisationId = '550e8400-e29b-41d4-a716-446655440001';
    entity.subscriptionId = '550e8400-e29b-41d4-a716-446655440002';
    entity.clientId = '550e8400-e29b-41d4-a716-446655440003';
    entity.storeSource = StoreSource.APPLE_STORE;
    entity.storeTransactionId = 'apple-txn-12345';
    entity.storeProductId = 'com.mondial.tv.premium';
    entity.amount = 999; // $9.99 in cents
    entity.currency = 'USD';
    entity.status = StoreBillingStatus.PENDING;
    entity.receiptData = { bundleId: 'com.mondial.tv' };
    entity.eventType = StoreEventType.INITIAL_PURCHASE;
    entity.originalTransactionId = null;
    entity.eventDate = new Date('2025-02-07T10:00:00Z');
    entity.createdAt = new Date('2025-02-07T10:00:00Z');
    entity.updatedAt = new Date('2025-02-07T10:00:00Z');
  });

  describe('Entity Creation', () => {
    it('should create a store billing record with all fields', () => {
      expect(entity.id).toBeDefined();
      expect(entity.organisationId).toBeDefined();
      expect(entity.subscriptionId).toBeDefined();
      expect(entity.clientId).toBeDefined();
      expect(entity.storeSource).toBe(StoreSource.APPLE_STORE);
      expect(entity.storeTransactionId).toBe('apple-txn-12345');
      expect(entity.storeProductId).toBe('com.mondial.tv.premium');
      expect(entity.amount).toBe(999);
      expect(entity.currency).toBe('USD');
      expect(entity.status).toBe(StoreBillingStatus.PENDING);
      expect(entity.eventType).toBe(StoreEventType.INITIAL_PURCHASE);
    });

    it('should support all store sources', () => {
      const sources = [StoreSource.APPLE_STORE, StoreSource.GOOGLE_STORE, StoreSource.TV_STORE];
      sources.forEach((source) => {
        entity.storeSource = source;
        expect(entity.storeSource).toBe(source);
      });
    });

    it('should support all billing statuses', () => {
      const statuses = [
        StoreBillingStatus.PENDING,
        StoreBillingStatus.PAID,
        StoreBillingStatus.FAILED,
        StoreBillingStatus.REFUNDED,
      ];
      statuses.forEach((status) => {
        entity.status = status;
        expect(entity.status).toBe(status);
      });
    });

    it('should support all event types', () => {
      const eventTypes = [
        StoreEventType.INITIAL_PURCHASE,
        StoreEventType.RENEWAL,
        StoreEventType.CANCELLATION,
        StoreEventType.REFUND,
      ];
      eventTypes.forEach((eventType) => {
        entity.eventType = eventType;
        expect(entity.eventType).toBe(eventType);
      });
    });
  });

  describe('Status Checks', () => {
    it('should correctly identify paid status', () => {
      entity.status = StoreBillingStatus.PAID;
      expect(entity.isPaid()).toBe(true);
      expect(entity.isFailed()).toBe(false);
      expect(entity.isRefunded()).toBe(false);
      expect(entity.isPending()).toBe(false);
    });

    it('should correctly identify failed status', () => {
      entity.status = StoreBillingStatus.FAILED;
      expect(entity.isFailed()).toBe(true);
      expect(entity.isPaid()).toBe(false);
      expect(entity.isRefunded()).toBe(false);
      expect(entity.isPending()).toBe(false);
    });

    it('should correctly identify refunded status', () => {
      entity.status = StoreBillingStatus.REFUNDED;
      expect(entity.isRefunded()).toBe(true);
      expect(entity.isPaid()).toBe(false);
      expect(entity.isFailed()).toBe(false);
      expect(entity.isPending()).toBe(false);
    });

    it('should correctly identify pending status', () => {
      entity.status = StoreBillingStatus.PENDING;
      expect(entity.isPending()).toBe(true);
      expect(entity.isPaid()).toBe(false);
      expect(entity.isFailed()).toBe(false);
      expect(entity.isRefunded()).toBe(false);
    });
  });

  describe('Status Transitions', () => {
    it('should transition from pending to paid', () => {
      entity.status = StoreBillingStatus.PENDING;
      entity.markPaid();
      expect(entity.status).toBe(StoreBillingStatus.PAID);
      expect(entity.isPaid()).toBe(true);
    });

    it('should transition from pending to failed', () => {
      entity.status = StoreBillingStatus.PENDING;
      entity.markFailed();
      expect(entity.status).toBe(StoreBillingStatus.FAILED);
      expect(entity.isFailed()).toBe(true);
    });

    it('should transition from paid to refunded', () => {
      entity.status = StoreBillingStatus.PAID;
      entity.markRefunded();
      expect(entity.status).toBe(StoreBillingStatus.REFUNDED);
      expect(entity.isRefunded()).toBe(true);
    });
  });

  describe('Event Type Checks', () => {
    it('should correctly identify renewal events', () => {
      entity.eventType = StoreEventType.RENEWAL;
      expect(entity.isRenewal()).toBe(true);
      expect(entity.isInitialPurchase()).toBe(false);
    });

    it('should correctly identify initial purchase events', () => {
      entity.eventType = StoreEventType.INITIAL_PURCHASE;
      expect(entity.isInitialPurchase()).toBe(true);
      expect(entity.isRenewal()).toBe(false);
    });

    it('should support original transaction id for renewals', () => {
      entity.eventType = StoreEventType.RENEWAL;
      entity.originalTransactionId = 'apple-original-txn-99999';
      expect(entity.originalTransactionId).toBe('apple-original-txn-99999');
      expect(entity.isRenewal()).toBe(true);
    });
  });

  describe('Multi-Tenancy', () => {
    it('should isolate records by organisation', () => {
      const org1 = '550e8400-e29b-41d4-a716-446655440001';
      const org2 = '550e8400-e29b-41d4-a716-446655440002';

      entity.organisationId = org1;
      expect(entity.organisationId).toBe(org1);

      entity.organisationId = org2;
      expect(entity.organisationId).toBe(org2);
    });

    it('should track subscription and client relationships', () => {
      const subId = '550e8400-e29b-41d4-a716-446655440002';
      const clientId = '550e8400-e29b-41d4-a716-446655440003';

      entity.subscriptionId = subId;
      entity.clientId = clientId;

      expect(entity.subscriptionId).toBe(subId);
      expect(entity.clientId).toBe(clientId);
    });
  });

  describe('Receipt Data', () => {
    it('should store receipt data as JSONB', () => {
      const receiptData = {
        bundleId: 'com.mondial.tv',
        productId: 'com.mondial.tv.premium',
        purchaseDate: '2025-02-07T10:00:00Z',
        expirationDate: '2025-03-07T10:00:00Z',
      };

      entity.receiptData = receiptData;
      expect(entity.receiptData).toEqual(receiptData);
      expect(entity.receiptData?.bundleId).toBe('com.mondial.tv');
    });

    it('should allow null receipt data', () => {
      entity.receiptData = null;
      expect(entity.receiptData).toBeNull();
    });
  });

  describe('Store Sources', () => {
    it('should support Apple Store transactions', () => {
      entity.storeSource = StoreSource.APPLE_STORE;
      entity.storeTransactionId = 'apple-txn-12345';
      expect(entity.storeSource).toBe(StoreSource.APPLE_STORE);
    });

    it('should support Google Store transactions', () => {
      entity.storeSource = StoreSource.GOOGLE_STORE;
      entity.storeTransactionId = 'google-txn-67890';
      expect(entity.storeSource).toBe(StoreSource.GOOGLE_STORE);
    });

    it('should support TV Store transactions', () => {
      entity.storeSource = StoreSource.TV_STORE;
      entity.storeTransactionId = 'tv-txn-11111';
      expect(entity.storeSource).toBe(StoreSource.TV_STORE);
    });
  });

  describe('Amount and Currency', () => {
    it('should store amount in cents (bigint)', () => {
      entity.amount = 9999; // $99.99
      expect(entity.amount).toBe(9999);
    });

    it('should support different currencies', () => {
      const currencies = ['USD', 'EUR', 'GBP', 'CAD'];
      currencies.forEach((curr) => {
        entity.currency = curr;
        expect(entity.currency).toBe(curr);
      });
    });
  });

  describe('Timestamps', () => {
    it('should track event date separately from creation date', () => {
      const eventDate = new Date('2025-02-07T10:00:00Z');
      const createdAt = new Date('2025-02-07T10:05:00Z');

      entity.eventDate = eventDate;
      entity.createdAt = createdAt;

      expect(entity.eventDate).toEqual(eventDate);
      expect(entity.createdAt).toEqual(createdAt);
      expect(entity.eventDate.getTime()).toBeLessThan(entity.createdAt.getTime());
    });

    it('should track update timestamp', () => {
      const originalUpdatedAt = entity.updatedAt;
      const newUpdatedAt = new Date();
      entity.updatedAt = newUpdatedAt;

      expect(entity.updatedAt).toEqual(newUpdatedAt);
      expect(entity.updatedAt.getTime()).toBeGreaterThanOrEqual(originalUpdatedAt.getTime());
    });
  });
});
