import { ReconciliationMatchingService, ReconciliationMatchConfidence } from '../reconciliation-matching.service';
import { ParsedTransaction } from '../camt053-parser.service';
import { PaymentIntentEntity, PaymentIntentStatus } from '../../entities/payment-intent.entity';

describe('ReconciliationMatchingService', () => {
  let service: ReconciliationMatchingService;

  beforeEach(() => {
    service = new ReconciliationMatchingService();
  });

  // ────────────────────────────────────────────────────────────────────
  // EXACT Match Tests
  // ────────────────────────────────────────────────────────────────────

  describe('matchTransactions - EXACT by reference', () => {
    it('should match transaction by reference field', () => {
      const transaction: ParsedTransaction = {
        id: 'tx-001',
        amount: 100.0,
        currency: 'EUR',
        creditDebitIndicator: 'CRDT',
        status: 'BOOK',
        bookingDate: '2026-03-16',
        valueDate: '2026-03-16',
        reference: 'REF-12345',
      };

      const paymentIntent = new PaymentIntentEntity();
      paymentIntent.id = 'pi-001';
      paymentIntent.providerPaymentId = 'REF-12345';
      paymentIntent.amount = 100.0;
      paymentIntent.status = PaymentIntentStatus.SUCCEEDED;
      paymentIntent.createdAt = new Date('2026-03-16');

      const results = service.matchTransactions([transaction], [paymentIntent]);

      expect(results).toHaveLength(1);
      expect(results[0].confidence).toBe(ReconciliationMatchConfidence.EXACT);
      expect(results[0].matchedBy).toBe('reference');
      expect(results[0].paymentIntent).toBe(paymentIntent);
    });
  });

  describe('matchTransactions - EXACT by endToEndId', () => {
    it('should match transaction by endToEndId field', () => {
      const transaction: ParsedTransaction = {
        id: 'tx-002',
        amount: 250.5,
        currency: 'EUR',
        creditDebitIndicator: 'CRDT',
        status: 'BOOK',
        bookingDate: '2026-03-16',
        valueDate: '2026-03-16',
        endToEndId: 'E2E-99999',
      };

      const paymentIntent = new PaymentIntentEntity();
      paymentIntent.id = 'pi-002';
      paymentIntent.providerPaymentId = 'E2E-99999';
      paymentIntent.amount = 250.5;
      paymentIntent.status = PaymentIntentStatus.SUCCEEDED;
      paymentIntent.createdAt = new Date('2026-03-16');

      const results = service.matchTransactions([transaction], [paymentIntent]);

      expect(results).toHaveLength(1);
      expect(results[0].confidence).toBe(ReconciliationMatchConfidence.EXACT);
      expect(results[0].matchedBy).toBe('endToEndId');
      expect(results[0].paymentIntent).toBe(paymentIntent);
    });
  });

  // ────────────────────────────────────────────────────────────────────
  // FUZZY Match Tests
  // ────────────────────────────────────────────────────────────────────

  describe('matchTransactions - FUZZY by amount and date', () => {
    it('should match transaction by amount (within 0.01) and date (within 1 day)', () => {
      const transaction: ParsedTransaction = {
        id: 'tx-003',
        amount: 500.0,
        currency: 'EUR',
        creditDebitIndicator: 'CRDT',
        status: 'BOOK',
        bookingDate: '2026-03-16',
        valueDate: '2026-03-16',
      };

      const paymentIntent = new PaymentIntentEntity();
      paymentIntent.id = 'pi-003';
      paymentIntent.providerPaymentId = 'UNKNOWN-REF';
      paymentIntent.amount = 500.0; // Exact amount in cents
      paymentIntent.status = PaymentIntentStatus.SUCCEEDED;
      paymentIntent.createdAt = new Date('2026-03-16T10:00:00Z');

      const results = service.matchTransactions([transaction], [paymentIntent]);

      expect(results).toHaveLength(1);
      expect(results[0].confidence).toBe(ReconciliationMatchConfidence.FUZZY);
      expect(results[0].matchedBy).toBe('amount_date');
      expect(results[0].paymentIntent).toBe(paymentIntent);
    });

    it('should match transaction with amount tolerance (0.01 EUR)', () => {
      const transaction: ParsedTransaction = {
        id: 'tx-004',
        amount: 100.005, // 100.00 EUR + 0.005 rounding
        currency: 'EUR',
        creditDebitIndicator: 'CRDT',
        status: 'BOOK',
        bookingDate: '2026-03-16',
        valueDate: '2026-03-16',
      };

      const paymentIntent = new PaymentIntentEntity();
      paymentIntent.id = 'pi-004';
      paymentIntent.providerPaymentId = 'UNKNOWN-REF';
      paymentIntent.amount = 100.0; // 100.00 EUR
      paymentIntent.status = PaymentIntentStatus.SUCCEEDED;
      paymentIntent.createdAt = new Date('2026-03-16');

      const results = service.matchTransactions([transaction], [paymentIntent]);

      expect(results).toHaveLength(1);
      expect(results[0].confidence).toBe(ReconciliationMatchConfidence.FUZZY);
    });

    it('should match transaction with date tolerance (1 day)', () => {
      const transaction: ParsedTransaction = {
        id: 'tx-005',
        amount: 75.0,
        currency: 'EUR',
        creditDebitIndicator: 'CRDT',
        status: 'BOOK',
        bookingDate: '2026-03-16',
        valueDate: '2026-03-16',
      };

       const paymentIntent = new PaymentIntentEntity();
       paymentIntent.id = 'pi-005';
       paymentIntent.providerPaymentId = 'UNKNOWN-REF';
       paymentIntent.amount = 75.0;
       paymentIntent.status = PaymentIntentStatus.SUCCEEDED;
       paymentIntent.createdAt = new Date('2026-03-17T00:00:00Z'); // 1 day later

      const results = service.matchTransactions([transaction], [paymentIntent]);

      expect(results).toHaveLength(1);
      expect(results[0].confidence).toBe(ReconciliationMatchConfidence.FUZZY);
    });

    it('should NOT match if amount difference exceeds 0.01', () => {
      const transaction: ParsedTransaction = {
        id: 'tx-006',
        amount: 100.0,
        currency: 'EUR',
        creditDebitIndicator: 'CRDT',
        status: 'BOOK',
        bookingDate: '2026-03-16',
        valueDate: '2026-03-16',
      };

      const paymentIntent = new PaymentIntentEntity();
      paymentIntent.id = 'pi-006';
      paymentIntent.providerPaymentId = 'UNKNOWN-REF';
      paymentIntent.amount = 100.02; // 0.02 EUR difference (exceeds tolerance)
      paymentIntent.status = PaymentIntentStatus.SUCCEEDED;
      paymentIntent.createdAt = new Date('2026-03-16');

      const results = service.matchTransactions([transaction], [paymentIntent]);

      expect(results).toHaveLength(1);
      expect(results[0].confidence).toBe(ReconciliationMatchConfidence.UNMATCHED);
    });

    it('should NOT match if date difference exceeds 1 day', () => {
      const transaction: ParsedTransaction = {
        id: 'tx-007',
        amount: 100.0,
        currency: 'EUR',
        creditDebitIndicator: 'CRDT',
        status: 'BOOK',
        bookingDate: '2026-03-16',
        valueDate: '2026-03-16',
      };

      const paymentIntent = new PaymentIntentEntity();
      paymentIntent.id = 'pi-007';
      paymentIntent.providerPaymentId = 'UNKNOWN-REF';
      paymentIntent.amount = 100.0;
      paymentIntent.status = PaymentIntentStatus.SUCCEEDED;
      paymentIntent.createdAt = new Date('2026-03-18T10:00:00Z'); // 2 days later

      const results = service.matchTransactions([transaction], [paymentIntent]);

      expect(results).toHaveLength(1);
      expect(results[0].confidence).toBe(ReconciliationMatchConfidence.UNMATCHED);
    });
  });

  // ────────────────────────────────────────────────────────────────────
  // UNMATCHED Tests
  // ────────────────────────────────────────────────────────────────────

  describe('matchTransactions - UNMATCHED', () => {
    it('should mark transaction as unmatched when no match found', () => {
      const transaction: ParsedTransaction = {
        id: 'tx-008',
        amount: 999.99,
        currency: 'EUR',
        creditDebitIndicator: 'CRDT',
        status: 'BOOK',
        bookingDate: '2026-03-16',
        valueDate: '2026-03-16',
        reference: 'UNKNOWN-REF',
      };

      const paymentIntent = new PaymentIntentEntity();
      paymentIntent.id = 'pi-008';
      paymentIntent.providerPaymentId = 'DIFFERENT-REF';
      paymentIntent.amount = 100.0;
      paymentIntent.status = PaymentIntentStatus.SUCCEEDED;
      paymentIntent.createdAt = new Date('2026-03-16');

      const results = service.matchTransactions([transaction], [paymentIntent]);

      expect(results).toHaveLength(1);
      expect(results[0].confidence).toBe(ReconciliationMatchConfidence.UNMATCHED);
      expect(results[0].paymentIntent).toBeNull();
      expect(results[0].matchedBy).toBeUndefined();
    });

    it('should handle empty payment intents list', () => {
      const transaction: ParsedTransaction = {
        id: 'tx-009',
        amount: 100.0,
        currency: 'EUR',
        creditDebitIndicator: 'CRDT',
        status: 'BOOK',
        bookingDate: '2026-03-16',
        valueDate: '2026-03-16',
        reference: 'REF-12345',
      };

      const results = service.matchTransactions([transaction], []);

      expect(results).toHaveLength(1);
      expect(results[0].confidence).toBe(ReconciliationMatchConfidence.UNMATCHED);
      expect(results[0].paymentIntent).toBeNull();
    });
  });

  // ────────────────────────────────────────────────────────────────────
  // flagUnmatchedAfter48h Tests
  // ────────────────────────────────────────────────────────────────────

  describe('flagUnmatchedAfter48h', () => {
    it('should identify unmatched transactions older than 48 hours', () => {
      const now = new Date('2026-03-18T12:00:00Z');
      const oldDate = new Date('2026-03-16T10:00:00Z'); // 50 hours before now

      const transaction: ParsedTransaction = {
        id: 'tx-010',
        amount: 100.0,
        currency: 'EUR',
        creditDebitIndicator: 'CRDT',
        status: 'BOOK',
        bookingDate: oldDate.toISOString(),
        valueDate: oldDate.toISOString(),
      };

      const results = [
        {
          transaction,
          paymentIntent: null,
          confidence: ReconciliationMatchConfidence.UNMATCHED,
        },
      ];

      const flagged = service.flagUnmatchedAfter48h(results, now);

      expect(flagged).toHaveLength(1);
      expect(flagged[0].confidence).toBe(ReconciliationMatchConfidence.UNMATCHED);
      // Transaction is old enough to be flagged
    });

    it('should NOT flag unmatched transactions younger than 48 hours', () => {
      const now = new Date('2026-03-18T12:00:00Z');
      const recentDate = new Date('2026-03-18T10:00:00Z'); // 2 hours before now

      const transaction: ParsedTransaction = {
        id: 'tx-011',
        amount: 100.0,
        currency: 'EUR',
        creditDebitIndicator: 'CRDT',
        status: 'BOOK',
        bookingDate: recentDate.toISOString(),
        valueDate: recentDate.toISOString(),
      };

      const results = [
        {
          transaction,
          paymentIntent: null,
          confidence: ReconciliationMatchConfidence.UNMATCHED,
        },
      ];

      const flagged = service.flagUnmatchedAfter48h(results, now);

      expect(flagged).toHaveLength(1);
      expect(flagged[0].confidence).toBe(ReconciliationMatchConfidence.UNMATCHED);
      // Transaction is recent, not flagged
    });

    it('should NOT flag EXACT or FUZZY matched transactions', () => {
      const now = new Date('2026-03-18T12:00:00Z');
      const oldDate = new Date('2026-03-16T10:00:00Z');

      const transaction: ParsedTransaction = {
        id: 'tx-012',
        amount: 100.0,
        currency: 'EUR',
        creditDebitIndicator: 'CRDT',
        status: 'BOOK',
        bookingDate: oldDate.toISOString(),
        valueDate: oldDate.toISOString(),
      };

      const paymentIntent = new PaymentIntentEntity();
      paymentIntent.id = 'pi-012';
      paymentIntent.providerPaymentId = 'REF-12345';
      paymentIntent.amount = 100.0;

      const results = [
        {
          transaction,
          paymentIntent,
          confidence: ReconciliationMatchConfidence.EXACT,
          matchedBy: 'reference',
        },
      ];

      const flagged = service.flagUnmatchedAfter48h(results, now);

      expect(flagged).toHaveLength(1);
      expect(flagged[0].confidence).toBe(ReconciliationMatchConfidence.EXACT);
      // Matched transactions are not flagged
    });
  });

  // ────────────────────────────────────────────────────────────────────
  // Integration Tests
  // ────────────────────────────────────────────────────────────────────

  describe('Integration: Multiple transactions and payment intents', () => {
    it('should handle mixed EXACT, FUZZY, and UNMATCHED results', () => {
      const transactions: ParsedTransaction[] = [
        {
          id: 'tx-exact',
          amount: 100.0,
          currency: 'EUR',
          creditDebitIndicator: 'CRDT',
          status: 'BOOK',
          bookingDate: '2026-03-16',
          valueDate: '2026-03-16',
          reference: 'REF-EXACT',
        },
        {
          id: 'tx-fuzzy',
          amount: 200.0,
          currency: 'EUR',
          creditDebitIndicator: 'CRDT',
          status: 'BOOK',
          bookingDate: '2026-03-16',
          valueDate: '2026-03-16',
        },
        {
          id: 'tx-unmatched',
          amount: 999.99,
          currency: 'EUR',
          creditDebitIndicator: 'CRDT',
          status: 'BOOK',
          bookingDate: '2026-03-16',
          valueDate: '2026-03-16',
        },
      ];

      const pi1 = new PaymentIntentEntity();
      pi1.id = 'pi-1';
      pi1.providerPaymentId = 'REF-EXACT';
      pi1.amount = 100.0;
      pi1.createdAt = new Date('2026-03-16');

      const pi2 = new PaymentIntentEntity();
      pi2.id = 'pi-2';
      pi2.providerPaymentId = 'REF-FUZZY';
      pi2.amount = 200.0;
      pi2.createdAt = new Date('2026-03-16');

      const results = service.matchTransactions(transactions, [pi1, pi2]);

      expect(results).toHaveLength(3);
      expect(results[0].confidence).toBe(ReconciliationMatchConfidence.EXACT);
      expect(results[1].confidence).toBe(ReconciliationMatchConfidence.FUZZY);
      expect(results[2].confidence).toBe(ReconciliationMatchConfidence.UNMATCHED);
    });
  });
});
