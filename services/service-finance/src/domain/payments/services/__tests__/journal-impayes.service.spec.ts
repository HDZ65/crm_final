// Mock the entity that causes the circular reference FIRST (jest.mock is hoisted)
jest.mock('../../entities/retry-attempt.entity', () => ({
  RetryAttemptEntity: class MockRetryAttemptEntity {},
  RetryAttemptStatus: { SCHEDULED: 'SCHEDULED' },
}));

import { JournalImpayesService, AgingBucket } from '../journal-impayes.service';
import {
  PaymentIntentEntity,
  PaymentIntentStatus,
} from '../../entities/payment-intent.entity';

// ── Mock repositories ─────────────────────────────────────────────────

function mockRepo() {
  return { find: jest.fn(), findOne: jest.fn(), save: jest.fn(), createQueryBuilder: jest.fn() };
}

function mockQueryBuilder() {
  const qb = {
    innerJoin: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    getRawMany: jest.fn().mockResolvedValue([]),
  };
  return qb;
}

function buildService(overrides: {
  paymentIntentRepo?: Partial<ReturnType<typeof mockRepo>>;
  retryScheduleRepo?: Partial<ReturnType<typeof mockRepo>>;
  reminderRepo?: Partial<ReturnType<typeof mockRepo>>;
  exportConfigRepo?: Partial<ReturnType<typeof mockRepo>>;
  compteComptableRepo?: Partial<ReturnType<typeof mockRepo>>;
} = {}) {
  const paymentIntentRepo = { ...mockRepo(), ...overrides.paymentIntentRepo };
  const retryScheduleRepo = { ...mockRepo(), ...overrides.retryScheduleRepo };
  const reminderRepo = { ...mockRepo(), ...overrides.reminderRepo };
  const exportConfigRepo = { ...mockRepo(), ...overrides.exportConfigRepo };
  const compteComptableRepo = { ...mockRepo(), ...overrides.compteComptableRepo };

  retryScheduleRepo.createQueryBuilder = jest.fn().mockReturnValue(mockQueryBuilder());

  const svc = Object.create(JournalImpayesService.prototype);
  svc.logger = { log: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() };
  svc.paymentIntentRepository = paymentIntentRepo;
  svc.retryScheduleRepository = retryScheduleRepo;
  svc.reminderRepository = reminderRepo;
  svc.exportConfigRepository = exportConfigRepo;
  svc.compteComptableRepository = compteComptableRepo;
  svc.defaultConfig = {
    code: 'IMP',
    libelle: 'Journal des Impayés',
    compte_debit_defaut: '416000',
    compte_credit_defaut: '411000',
  };
  return { svc, paymentIntentRepo, retryScheduleRepo, reminderRepo, exportConfigRepo, compteComptableRepo };
}

function makePayment(overrides: Partial<PaymentIntentEntity> = {}): PaymentIntentEntity {
  const p = new PaymentIntentEntity();
  p.id = 'pi-fail-001';
  p.societeId = 'soc-001';
  p.clientId = 'cli-001';
  p.amount = 300;
  p.currency = 'EUR';
  p.status = PaymentIntentStatus.FAILED;
  p.providerPaymentId = 'stripe_pi_fail_123';
  p.createdAt = new Date('2026-01-10');
  Object.assign(p, overrides);
  return p;
}

// ── Tests ─────────────────────────────────────────────────────────────

describe('JournalImpayesService', () => {
  const societeId = 'soc-001';
  const periodFrom = new Date('2026-01-01');
  const periodTo = new Date('2026-03-31');

  describe('FAILED filter', () => {
    it('should query only FAILED payments', async () => {
      const { svc, paymentIntentRepo, exportConfigRepo, compteComptableRepo } = buildService();
      paymentIntentRepo.find.mockResolvedValue([]);
      exportConfigRepo.findOne.mockResolvedValue(null);
      compteComptableRepo.find.mockResolvedValue([]);

      await svc.generateJournalImpayes(societeId, periodFrom, periodTo, 'fec');

      expect(paymentIntentRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: PaymentIntentStatus.FAILED,
          }),
        }),
      );
    });
  });

  describe('416/411 account mapping', () => {
    it('should produce Debit 416000 (Clients douteux) and Credit 411000 (Clients)', async () => {
      const payment = makePayment({ amount: 300 });
      const { svc, paymentIntentRepo, exportConfigRepo, compteComptableRepo } = buildService();
      paymentIntentRepo.find.mockResolvedValue([payment]);
      exportConfigRepo.findOne.mockResolvedValue(null);
      compteComptableRepo.find.mockResolvedValue([]);

      const buffer = await svc.generateJournalImpayes(societeId, periodFrom, periodTo, 'fec');
      const text = buffer.toString('latin1');
      const lines = text.split('\r\n');

      // header + 2 entries (debit 416, credit 411)
      expect(lines).toHaveLength(3);

      const debitLine = lines[1].split('\t');
      expect(debitLine[4]).toBe('416000');   // CompteNum
      expect(debitLine[11]).toBe('300.00');  // Debit
      expect(debitLine[12]).toBe('');        // Credit empty

      const creditLine = lines[2].split('\t');
      expect(creditLine[4]).toBe('411000');
      expect(creditLine[11]).toBe('');       // Debit empty
      expect(creditLine[12]).toBe('300.00'); // Credit
    });
  });

  describe('aging buckets', () => {
    it('should classify 0-30 day old payments in BUCKET_0_30', () => {
      const svc = Object.create(JournalImpayesService.prototype);
      const ref = new Date('2026-03-16');
      const payment = makePayment({ createdAt: new Date('2026-03-01'), amount: 100 });
      const summary = svc.computeAgingSummary([payment], ref);
      const bucket = summary.find((s: { bucket: string }) => s.bucket === AgingBucket.BUCKET_0_30);
      expect(bucket).toBeDefined();
      expect(bucket!.count).toBe(1);
      expect(bucket!.totalAmount).toBe(100);
    });

    it('should classify 31-60 day old payments in BUCKET_31_60', () => {
      const svc = Object.create(JournalImpayesService.prototype);
      const ref = new Date('2026-03-16');
      const payment = makePayment({ createdAt: new Date('2026-02-01'), amount: 200 });
      const summary = svc.computeAgingSummary([payment], ref);
      const bucket = summary.find((s: { bucket: string }) => s.bucket === AgingBucket.BUCKET_31_60);
      expect(bucket).toBeDefined();
      expect(bucket!.count).toBe(1);
      expect(bucket!.totalAmount).toBe(200);
    });

    it('should classify 61-90 day old payments in BUCKET_61_90', () => {
      const svc = Object.create(JournalImpayesService.prototype);
      const ref = new Date('2026-03-16');
      const payment = makePayment({ createdAt: new Date('2026-01-05'), amount: 300 });
      const summary = svc.computeAgingSummary([payment], ref);
      const bucket = summary.find((s: { bucket: string }) => s.bucket === AgingBucket.BUCKET_61_90);
      expect(bucket).toBeDefined();
      expect(bucket!.count).toBe(1);
      expect(bucket!.totalAmount).toBe(300);
    });

    it('should classify >90 day old payments in BUCKET_OVER_90', () => {
      const svc = Object.create(JournalImpayesService.prototype);
      const ref = new Date('2026-06-01');
      const payment = makePayment({ createdAt: new Date('2026-01-01'), amount: 500 });
      const summary = svc.computeAgingSummary([payment], ref);
      const bucket = summary.find((s: { bucket: string }) => s.bucket === AgingBucket.BUCKET_OVER_90);
      expect(bucket).toBeDefined();
      expect(bucket!.count).toBe(1);
      expect(bucket!.totalAmount).toBe(500);
    });

    it('should distribute multiple payments across aging buckets', () => {
      const svc = Object.create(JournalImpayesService.prototype);
      const ref = new Date('2026-03-16');
      const payments = [
        makePayment({ id: 'p1', createdAt: new Date('2026-03-10'), amount: 100 }), // 6 days -> 0-30
        makePayment({ id: 'p2', createdAt: new Date('2026-02-01'), amount: 200 }), // 43 days -> 31-60
        makePayment({ id: 'p3', createdAt: new Date('2026-01-01'), amount: 300 }), // 74 days -> 61-90
        makePayment({ id: 'p4', createdAt: new Date('2025-11-01'), amount: 400 }), // 136 days -> >90
      ];
      const summary = svc.computeAgingSummary(payments, ref);

      expect(summary).toHaveLength(4);
      const b030 = summary.find((s: { bucket: string }) => s.bucket === AgingBucket.BUCKET_0_30);
      const b3160 = summary.find((s: { bucket: string }) => s.bucket === AgingBucket.BUCKET_31_60);
      const b6190 = summary.find((s: { bucket: string }) => s.bucket === AgingBucket.BUCKET_61_90);
      const b90plus = summary.find((s: { bucket: string }) => s.bucket === AgingBucket.BUCKET_OVER_90);

      expect(b030!.count).toBe(1);
      expect(b030!.totalAmount).toBe(100);
      expect(b3160!.count).toBe(1);
      expect(b3160!.totalAmount).toBe(200);
      expect(b6190!.count).toBe(1);
      expect(b6190!.totalAmount).toBe(300);
      expect(b90plus!.count).toBe(1);
      expect(b90plus!.totalAmount).toBe(400);
    });

    it('should return all 4 buckets even with empty data', () => {
      const svc = Object.create(JournalImpayesService.prototype);
      const summary = svc.computeAgingSummary([], new Date());
      expect(summary).toHaveLength(4);
      for (const bucket of summary) {
        expect(bucket.count).toBe(0);
        expect(bucket.totalAmount).toBe(0);
      }
    });
  });

  describe('aging label in EcritureLib', () => {
    it('should include aging bucket label in EcritureLib', async () => {
      const payment = makePayment({
        createdAt: new Date('2026-03-10'),
        amount: 100,
      });
      const { svc, paymentIntentRepo, exportConfigRepo, compteComptableRepo } = buildService();
      paymentIntentRepo.find.mockResolvedValue([payment]);
      exportConfigRepo.findOne.mockResolvedValue(null);
      compteComptableRepo.find.mockResolvedValue([]);

      // Freeze "now" for predictable aging - use jest.useFakeTimers
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2026-03-16'));

      try {
        const buffer = await svc.generateJournalImpayes(societeId, periodFrom, periodTo, 'fec');
        const text = buffer.toString('latin1');
        const lines = text.split('\r\n');
        const ecritureLib = lines[1].split('\t')[10]; // EcritureLib column
        expect(ecritureLib).toContain('[0-30j]');
      } finally {
        jest.useRealTimers();
      }
    });
  });

  describe('empty period', () => {
    it('should return header-only buffer when no FAILED payments', async () => {
      const { svc, paymentIntentRepo, exportConfigRepo, compteComptableRepo } = buildService();
      paymentIntentRepo.find.mockResolvedValue([]);
      exportConfigRepo.findOne.mockResolvedValue(null);
      compteComptableRepo.find.mockResolvedValue([]);

      const buffer = await svc.generateJournalImpayes(societeId, periodFrom, periodTo, 'fec');
      const text = buffer.toString('latin1');
      const lines = text.split('\r\n');
      expect(lines).toHaveLength(1); // header only
    });
  });
});
