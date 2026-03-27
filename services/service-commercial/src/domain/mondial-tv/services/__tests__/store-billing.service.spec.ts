import { DomainException } from '@crm/shared-kernel';
import { StoreBillingService, StoreEventInput } from '../store-billing.service';
import {
  StoreBillingRecordEntity,
  StoreBillingStatus,
  StoreSource,
  StoreEventType,
} from '../../entities/store-billing-record.entity';

// Mock repository implementation
class MockStoreBillingRecordRepository {
  findByStoreTransaction = jest.fn();
  save = jest.fn();
  findBySubscription = jest.fn();
  aggregateRevenueByStore = jest.fn();
  findById = jest.fn();
  findByStatus = jest.fn();
  delete = jest.fn();
  findAll = jest.fn();
}

describe('StoreBillingService', () => {
  let service: StoreBillingService;
  let repository: MockStoreBillingRecordRepository;

  const mockOrganisationId = 'org-123';
  const mockSubscriptionId = 'sub-456';
  const mockClientId = 'client-789';

  beforeEach(() => {
    repository = new MockStoreBillingRecordRepository();
    service = new StoreBillingService(repository as any);
  });

  describe('recordStorePayment', () => {
    it('should create StoreBillingRecord with PAID status for INITIAL_PURCHASE event', async () => {
      const storeEvent: StoreEventInput = {
        organisationId: mockOrganisationId,
        subscriptionId: mockSubscriptionId,
        clientId: mockClientId,
        storeSource: StoreSource.APPLE_STORE,
        storeTransactionId: 'apple-txn-001',
        storeProductId: 'com.example.premium.monthly',
        amount: 999,
        currency: 'EUR',
        eventType: StoreEventType.INITIAL_PURCHASE,
        eventDate: new Date('2026-01-15T10:00:00Z'),
        receiptData: { receipt: 'base64-encoded-receipt' },
      };

      repository.findByStoreTransaction.mockResolvedValue(null);
      repository.save.mockImplementation(async (entity) => ({
        ...entity,
        id: 'record-001',
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      const result = await service.recordStorePayment(mockSubscriptionId, storeEvent);

      expect(result.status).toBe(StoreBillingStatus.PAID);
      expect(result.storeSource).toBe(StoreSource.APPLE_STORE);
      expect(result.amount).toBe(999);
      expect(result.eventType).toBe(StoreEventType.INITIAL_PURCHASE);
      expect(repository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: StoreBillingStatus.PAID,
          storeTransactionId: 'apple-txn-001',
        }),
      );
    });

    it('should create StoreBillingRecord with PAID status for RENEWAL event', async () => {
      const storeEvent: StoreEventInput = {
        organisationId: mockOrganisationId,
        subscriptionId: mockSubscriptionId,
        clientId: mockClientId,
        storeSource: StoreSource.GOOGLE_STORE,
        storeTransactionId: 'google-txn-002',
        storeProductId: 'com.example.premium.annual',
        amount: 9990,
        currency: 'EUR',
        eventType: StoreEventType.RENEWAL,
        eventDate: new Date('2026-02-15T10:00:00Z'),
        originalTransactionId: 'google-txn-001',
      };

      repository.findByStoreTransaction.mockResolvedValue(null);
      repository.save.mockImplementation(async (entity) => ({
        ...entity,
        id: 'record-002',
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      const result = await service.recordStorePayment(mockSubscriptionId, storeEvent);

      expect(result.status).toBe(StoreBillingStatus.PAID);
      expect(result.eventType).toBe(StoreEventType.RENEWAL);
      expect(result.originalTransactionId).toBe('google-txn-001');
    });

    it('should create StoreBillingRecord with REFUNDED status for REFUND event', async () => {
      const storeEvent: StoreEventInput = {
        organisationId: mockOrganisationId,
        subscriptionId: mockSubscriptionId,
        clientId: mockClientId,
        storeSource: StoreSource.TV_STORE,
        storeTransactionId: 'tv-refund-001',
        storeProductId: 'com.example.premium.monthly',
        amount: 999,
        currency: 'EUR',
        eventType: StoreEventType.REFUND,
        eventDate: new Date('2026-01-20T10:00:00Z'),
        originalTransactionId: 'tv-txn-001',
      };

      repository.findByStoreTransaction.mockResolvedValue(null);
      repository.save.mockImplementation(async (entity) => ({
        ...entity,
        id: 'record-003',
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      const result = await service.recordStorePayment(mockSubscriptionId, storeEvent);

      expect(result.status).toBe(StoreBillingStatus.REFUNDED);
      expect(result.eventType).toBe(StoreEventType.REFUND);
    });

    it('should throw DomainException for duplicate store transaction', async () => {
      const storeEvent: StoreEventInput = {
        organisationId: mockOrganisationId,
        subscriptionId: mockSubscriptionId,
        clientId: mockClientId,
        storeSource: StoreSource.APPLE_STORE,
        storeTransactionId: 'apple-txn-duplicate',
        storeProductId: 'com.example.premium.monthly',
        amount: 999,
        currency: 'EUR',
        eventType: StoreEventType.INITIAL_PURCHASE,
        eventDate: new Date('2026-01-15T10:00:00Z'),
      };

      const existingRecord = new StoreBillingRecordEntity();
      existingRecord.id = 'existing-record-001';
      existingRecord.storeTransactionId = 'apple-txn-duplicate';

      repository.findByStoreTransaction.mockResolvedValue(existingRecord);

      await expect(
        service.recordStorePayment(mockSubscriptionId, storeEvent),
      ).rejects.toThrow(DomainException);

      try {
        await service.recordStorePayment(mockSubscriptionId, storeEvent);
      } catch (error: any) {
        expect(error.code).toBe('STORE_BILLING_DUPLICATE_TRANSACTION');
      }

      expect(repository.save).not.toHaveBeenCalled();
    });

    it('should throw DomainException for negative amount', async () => {
      const storeEvent: StoreEventInput = {
        organisationId: mockOrganisationId,
        subscriptionId: mockSubscriptionId,
        clientId: mockClientId,
        storeSource: StoreSource.APPLE_STORE,
        storeTransactionId: 'apple-txn-negative',
        storeProductId: 'com.example.premium.monthly',
        amount: -999,
        currency: 'EUR',
        eventType: StoreEventType.INITIAL_PURCHASE,
        eventDate: new Date('2026-01-15T10:00:00Z'),
      };

      await expect(
        service.recordStorePayment(mockSubscriptionId, storeEvent),
      ).rejects.toThrow(DomainException);

      try {
        await service.recordStorePayment(mockSubscriptionId, storeEvent);
      } catch (error: any) {
        expect(error.code).toBe('STORE_BILLING_INVALID_AMOUNT');
      }
    });

    it('should throw DomainException for subscription ID mismatch', async () => {
      const storeEvent: StoreEventInput = {
        organisationId: mockOrganisationId,
        subscriptionId: 'different-sub-id',
        clientId: mockClientId,
        storeSource: StoreSource.APPLE_STORE,
        storeTransactionId: 'apple-txn-mismatch',
        storeProductId: 'com.example.premium.monthly',
        amount: 999,
        currency: 'EUR',
        eventType: StoreEventType.INITIAL_PURCHASE,
        eventDate: new Date('2026-01-15T10:00:00Z'),
      };

      await expect(
        service.recordStorePayment(mockSubscriptionId, storeEvent),
      ).rejects.toThrow(DomainException);

      try {
        await service.recordStorePayment(mockSubscriptionId, storeEvent);
      } catch (error: any) {
        expect(error.code).toBe('STORE_BILLING_SUBSCRIPTION_MISMATCH');
      }
    });
  });

  describe('getRevenueByStore', () => {
    it('should return revenue aggregated by store source (Apple and Google)', async () => {
      repository.aggregateRevenueByStore.mockImplementation(
        async (orgId: string, storeSource: StoreSource) => {
          if (storeSource === StoreSource.APPLE_STORE) {
            return { totalAmount: 50000, count: 50 };
          }
          if (storeSource === StoreSource.GOOGLE_STORE) {
            return { totalAmount: 30000, count: 30 };
          }
          return { totalAmount: 0, count: 0 };
        },
      );

      const result = await service.getRevenueByStore(mockOrganisationId);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        storeSource: StoreSource.APPLE_STORE,
        totalAmount: 50000,
        transactionCount: 50,
        currency: 'EUR',
      });
      expect(result[1]).toEqual({
        storeSource: StoreSource.GOOGLE_STORE,
        totalAmount: 30000,
        transactionCount: 30,
        currency: 'EUR',
      });
    });

    it('should return empty array when no store transactions exist', async () => {
      repository.aggregateRevenueByStore.mockResolvedValue({
        totalAmount: 0,
        count: 0,
      });

      const result = await service.getRevenueByStore(mockOrganisationId);

      expect(result).toHaveLength(0);
    });

    it('should throw DomainException when organisationId is missing', async () => {
      await expect(service.getRevenueByStore('')).rejects.toThrow(DomainException);
      
      try {
        await service.getRevenueByStore('');
      } catch (error: any) {
        expect(error.code).toBe('STORE_BILLING_MISSING_ORGANISATION_ID');
      }
    });
  });

  describe('getSubscriptionStoreHistory', () => {
    it('should return subscription store history ordered by eventDate DESC', async () => {
      const record1 = new StoreBillingRecordEntity();
      record1.id = 'record-001';
      record1.subscriptionId = mockSubscriptionId;
      record1.eventDate = new Date('2026-02-01T10:00:00Z');
      record1.status = StoreBillingStatus.PAID;

      const record2 = new StoreBillingRecordEntity();
      record2.id = 'record-002';
      record2.subscriptionId = mockSubscriptionId;
      record2.eventDate = new Date('2026-01-01T10:00:00Z');
      record2.status = StoreBillingStatus.PAID;

      repository.findBySubscription.mockResolvedValue([record1, record2]);

      const result = await service.getSubscriptionStoreHistory(mockSubscriptionId);

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('record-001');
      expect(result[1].id).toBe('record-002');
      expect(repository.findBySubscription).toHaveBeenCalledWith('', mockSubscriptionId);
    });

    it('should return empty array when no store history exists', async () => {
      repository.findBySubscription.mockResolvedValue([]);

      const result = await service.getSubscriptionStoreHistory(mockSubscriptionId);

      expect(result).toHaveLength(0);
    });

    it('should throw DomainException when subscriptionId is missing', async () => {
      await expect(service.getSubscriptionStoreHistory('')).rejects.toThrow(
        DomainException,
      );
      
      try {
        await service.getSubscriptionStoreHistory('');
      } catch (error: any) {
        expect(error.code).toBe('STORE_BILLING_MISSING_SUBSCRIPTION_ID');
      }
    });
  });
});
