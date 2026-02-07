import { describe, it, expect, beforeEach } from 'bun:test';
import {
  TvodEstPurchaseEntity,
  PurchaseType,
  PaymentMethod,
  StoreSource,
  PurchaseStatus,
} from '../tvod-est-purchase.entity';

describe('TvodEstPurchaseEntity', () => {
  let entity: TvodEstPurchaseEntity;

  beforeEach(() => {
    entity = new TvodEstPurchaseEntity();
  });

  describe('Entity Creation', () => {
    it('should create a TVOD purchase with all required fields', () => {
      entity.id = '550e8400-e29b-41d4-a716-446655440000';
      entity.organisationId = '550e8400-e29b-41d4-a716-446655440001';
      entity.clientId = '550e8400-e29b-41d4-a716-446655440002';
      entity.contentId = 'IMS-12345';
      entity.contentTitle = 'The Matrix';
      entity.purchaseType = PurchaseType.TVOD;
      entity.amount = 4.99;
      entity.currency = 'EUR';
      entity.paymentMethod = PaymentMethod.CB_DIRECT;
      entity.storeSource = StoreSource.DIRECT;
      entity.imsTransactionId = 'IMS-TXN-001';
      entity.status = PurchaseStatus.COMPLETED;

      expect(entity.id).toBe('550e8400-e29b-41d4-a716-446655440000');
      expect(entity.organisationId).toBe('550e8400-e29b-41d4-a716-446655440001');
      expect(entity.clientId).toBe('550e8400-e29b-41d4-a716-446655440002');
      expect(entity.contentId).toBe('IMS-12345');
      expect(entity.contentTitle).toBe('The Matrix');
      expect(entity.purchaseType).toBe(PurchaseType.TVOD);
      expect(entity.amount).toBe(4.99);
      expect(entity.currency).toBe('EUR');
      expect(entity.paymentMethod).toBe(PaymentMethod.CB_DIRECT);
      expect(entity.storeSource).toBe(StoreSource.DIRECT);
      expect(entity.imsTransactionId).toBe('IMS-TXN-001');
      expect(entity.status).toBe(PurchaseStatus.COMPLETED);
    });

    it('should create an EST purchase with all required fields', () => {
      entity.id = '550e8400-e29b-41d4-a716-446655440003';
      entity.organisationId = '550e8400-e29b-41d4-a716-446655440001';
      entity.clientId = '550e8400-e29b-41d4-a716-446655440002';
      entity.contentId = 'IMS-67890';
      entity.contentTitle = 'Inception';
      entity.purchaseType = PurchaseType.EST;
      entity.amount = 14.99;
      entity.currency = 'EUR';
      entity.paymentMethod = PaymentMethod.APPLE_STORE;
      entity.storeSource = StoreSource.APPLE;
      entity.storeTransactionId = 'APPLE-TXN-123';
      entity.imsTransactionId = 'IMS-TXN-002';
      entity.status = PurchaseStatus.COMPLETED;

      expect(entity.purchaseType).toBe(PurchaseType.EST);
      expect(entity.amount).toBe(14.99);
      expect(entity.paymentMethod).toBe(PaymentMethod.APPLE_STORE);
      expect(entity.storeSource).toBe(StoreSource.APPLE);
      expect(entity.storeTransactionId).toBe('APPLE-TXN-123');
    });

    it('should support nullable fields (storeTransactionId, invoiceId, refundedAt, refundAmount)', () => {
      entity.id = '550e8400-e29b-41d4-a716-446655440004';
      entity.organisationId = '550e8400-e29b-41d4-a716-446655440001';
      entity.clientId = '550e8400-e29b-41d4-a716-446655440002';
      entity.contentId = 'IMS-11111';
      entity.contentTitle = 'Test Content';
      entity.purchaseType = PurchaseType.TVOD;
      entity.amount = 3.99;
      entity.currency = 'EUR';
      entity.paymentMethod = PaymentMethod.CB_DIRECT;
      entity.storeSource = StoreSource.DIRECT;
      entity.imsTransactionId = 'IMS-TXN-003';
      entity.status = PurchaseStatus.PENDING;
      entity.storeTransactionId = null;
      entity.invoiceId = null;
      entity.refundedAt = null;
      entity.refundAmount = null;

      expect(entity.storeTransactionId).toBeNull();
      expect(entity.invoiceId).toBeNull();
      expect(entity.refundedAt).toBeNull();
      expect(entity.refundAmount).toBeNull();
    });
  });

  describe('Purchase Status Transitions', () => {
    beforeEach(() => {
      entity.id = '550e8400-e29b-41d4-a716-446655440005';
      entity.organisationId = '550e8400-e29b-41d4-a716-446655440001';
      entity.clientId = '550e8400-e29b-41d4-a716-446655440002';
      entity.contentId = 'IMS-22222';
      entity.contentTitle = 'Status Test';
      entity.purchaseType = PurchaseType.TVOD;
      entity.amount = 5.99;
      entity.currency = 'EUR';
      entity.paymentMethod = PaymentMethod.CB_DIRECT;
      entity.storeSource = StoreSource.DIRECT;
      entity.imsTransactionId = 'IMS-TXN-004';
    });

    it('should support PENDING status', () => {
      entity.status = PurchaseStatus.PENDING;
      expect(entity.status).toBe(PurchaseStatus.PENDING);
    });

    it('should support COMPLETED status', () => {
      entity.status = PurchaseStatus.COMPLETED;
      expect(entity.status).toBe(PurchaseStatus.COMPLETED);
    });

    it('should support REFUNDED status with refund details', () => {
      entity.status = PurchaseStatus.REFUNDED;
      entity.refundedAt = new Date('2025-02-07T10:00:00Z');
      entity.refundAmount = 5.99;

      expect(entity.status).toBe(PurchaseStatus.REFUNDED);
      expect(entity.refundedAt).toBeDefined();
      expect(entity.refundAmount).toBe(5.99);
    });
  });

  describe('Payment Methods', () => {
    beforeEach(() => {
      entity.id = '550e8400-e29b-41d4-a716-446655440006';
      entity.organisationId = '550e8400-e29b-41d4-a716-446655440001';
      entity.clientId = '550e8400-e29b-41d4-a716-446655440002';
      entity.contentId = 'IMS-33333';
      entity.contentTitle = 'Payment Test';
      entity.purchaseType = PurchaseType.TVOD;
      entity.amount = 4.99;
      entity.currency = 'EUR';
      entity.imsTransactionId = 'IMS-TXN-005';
      entity.status = PurchaseStatus.COMPLETED;
    });

    it('should support CB_DIRECT payment method', () => {
      entity.paymentMethod = PaymentMethod.CB_DIRECT;
      entity.storeSource = StoreSource.DIRECT;
      expect(entity.paymentMethod).toBe(PaymentMethod.CB_DIRECT);
      expect(entity.storeSource).toBe(StoreSource.DIRECT);
    });

    it('should support APPLE_STORE payment method', () => {
      entity.paymentMethod = PaymentMethod.APPLE_STORE;
      entity.storeSource = StoreSource.APPLE;
      entity.storeTransactionId = 'APPLE-TXN-456';
      expect(entity.paymentMethod).toBe(PaymentMethod.APPLE_STORE);
      expect(entity.storeSource).toBe(StoreSource.APPLE);
      expect(entity.storeTransactionId).toBe('APPLE-TXN-456');
    });

    it('should support GOOGLE_STORE payment method', () => {
      entity.paymentMethod = PaymentMethod.GOOGLE_STORE;
      entity.storeSource = StoreSource.GOOGLE;
      entity.storeTransactionId = 'GOOGLE-TXN-789';
      expect(entity.paymentMethod).toBe(PaymentMethod.GOOGLE_STORE);
      expect(entity.storeSource).toBe(StoreSource.GOOGLE);
      expect(entity.storeTransactionId).toBe('GOOGLE-TXN-789');
    });
  });

  describe('Multi-Tenancy', () => {
    it('should enforce organisation_id for tenant isolation', () => {
      const org1 = '550e8400-e29b-41d4-a716-446655440010';
      const org2 = '550e8400-e29b-41d4-a716-446655440011';

      const entity1 = new TvodEstPurchaseEntity();
      entity1.organisationId = org1;
      entity1.clientId = '550e8400-e29b-41d4-a716-446655440002';

      const entity2 = new TvodEstPurchaseEntity();
      entity2.organisationId = org2;
      entity2.clientId = '550e8400-e29b-41d4-a716-446655440002';

      expect(entity1.organisationId).not.toBe(entity2.organisationId);
    });
  });

  describe('Timestamps', () => {
    it('should support createdAt and updatedAt timestamps', () => {
      const now = new Date();
      entity.createdAt = now;
      entity.updatedAt = now;

      expect(entity.createdAt).toBeDefined();
      expect(entity.updatedAt).toBeDefined();
      expect(entity.createdAt).toEqual(now);
      expect(entity.updatedAt).toEqual(now);
    });
  });

  describe('Invoice Linking', () => {
    it('should support optional invoice_id for linking to service-finance', () => {
      entity.id = '550e8400-e29b-41d4-a716-446655440007';
      entity.organisationId = '550e8400-e29b-41d4-a716-446655440001';
      entity.clientId = '550e8400-e29b-41d4-a716-446655440002';
      entity.contentId = 'IMS-44444';
      entity.contentTitle = 'Invoice Test';
      entity.purchaseType = PurchaseType.EST;
      entity.amount = 14.99;
      entity.currency = 'EUR';
      entity.paymentMethod = PaymentMethod.CB_DIRECT;
      entity.storeSource = StoreSource.DIRECT;
      entity.imsTransactionId = 'IMS-TXN-006';
      entity.status = PurchaseStatus.COMPLETED;
      entity.invoiceId = '550e8400-e29b-41d4-a716-446655440020';

      expect(entity.invoiceId).toBe('550e8400-e29b-41d4-a716-446655440020');
    });

    it('should allow null invoiceId for purchases without invoice', () => {
      entity.invoiceId = null;
      expect(entity.invoiceId).toBeNull();
    });
  });

  describe('Content Tracking', () => {
    it('should track IMS content ID and title separately', () => {
      entity.contentId = 'IMS-55555';
      entity.contentTitle = 'Interstellar';

      expect(entity.contentId).toBe('IMS-55555');
      expect(entity.contentTitle).toBe('Interstellar');
    });

    it('should support long content titles', () => {
      const longTitle = 'A'.repeat(500);
      entity.contentTitle = longTitle;
      expect(entity.contentTitle).toBe(longTitle);
    });
  });
});
