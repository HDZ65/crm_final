import { JournalReglementsService } from '../journal-reglements.service';
import {
  PaymentIntentEntity,
  PaymentIntentStatus,
} from '../../entities/payment-intent.entity';

// ── Mock repositories ─────────────────────────────────────────────────

function mockRepo() {
  return { find: jest.fn(), findOne: jest.fn(), save: jest.fn(), createQueryBuilder: jest.fn() };
}

function buildService(overrides: {
  paymentIntentRepo?: Partial<ReturnType<typeof mockRepo>>;
  exportConfigRepo?: Partial<ReturnType<typeof mockRepo>>;
  compteComptableRepo?: Partial<ReturnType<typeof mockRepo>>;
} = {}) {
  const paymentIntentRepo = { ...mockRepo(), ...overrides.paymentIntentRepo };
  const exportConfigRepo = { ...mockRepo(), ...overrides.exportConfigRepo };
  const compteComptableRepo = { ...mockRepo(), ...overrides.compteComptableRepo };

  const svc = Object.create(JournalReglementsService.prototype);
  svc.logger = { log: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() };
  svc.paymentIntentRepository = paymentIntentRepo;
  svc.exportConfigRepository = exportConfigRepo;
  svc.compteComptableRepository = compteComptableRepo;
  svc.defaultConfig = {
    code: 'BAN',
    libelle: 'Journal des Règlements',
    compte_debit_defaut: '512000',
    compte_credit_defaut: '411000',
  };
  return { svc, paymentIntentRepo, exportConfigRepo, compteComptableRepo };
}

function makePayment(overrides: Partial<PaymentIntentEntity> = {}): PaymentIntentEntity {
  const p = new PaymentIntentEntity();
  p.id = 'pi-001';
  p.societeId = 'soc-001';
  p.clientId = 'cli-001';
  p.amount = 500;
  p.currency = 'EUR';
  p.status = PaymentIntentStatus.SUCCEEDED;
  p.providerPaymentId = 'stripe_pi_123';
  p.createdAt = new Date('2026-01-15');
  p.paidAt = new Date('2026-01-16');
  Object.assign(p, overrides);
  return p;
}

// ── Tests ─────────────────────────────────────────────────────────────

describe('JournalReglementsService', () => {
  const societeId = 'soc-001';
  const periodFrom = new Date('2026-01-01');
  const periodTo = new Date('2026-01-31');

  describe('SUCCEEDED filter', () => {
    it('should query only SUCCEEDED payments', async () => {
      const { svc, paymentIntentRepo, exportConfigRepo, compteComptableRepo } = buildService();
      paymentIntentRepo.find.mockResolvedValue([]);
      exportConfigRepo.findOne.mockResolvedValue(null);
      compteComptableRepo.find.mockResolvedValue([]);

      await svc.generateJournalReglements(societeId, periodFrom, periodTo, 'fec');

      expect(paymentIntentRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: PaymentIntentStatus.SUCCEEDED,
          }),
        }),
      );
    });
  });

  describe('512/411 account mapping', () => {
    it('should produce Debit 512000 (Banque) and Credit 411000 (Clients)', async () => {
      const payment = makePayment({ amount: 750 });
      const { svc, paymentIntentRepo, exportConfigRepo, compteComptableRepo } = buildService();
      paymentIntentRepo.find.mockResolvedValue([payment]);
      exportConfigRepo.findOne.mockResolvedValue(null);
      compteComptableRepo.find.mockResolvedValue([]);

      const buffer = await svc.generateJournalReglements(societeId, periodFrom, periodTo, 'fec');
      const text = buffer.toString('latin1');
      const lines = text.split('\r\n');

      // header + 2 entries (debit 512, credit 411)
      expect(lines).toHaveLength(3);

      const debitLine = lines[1].split('\t');
      expect(debitLine[4]).toBe('512000');   // CompteNum
      expect(debitLine[11]).toBe('750.00');  // Debit
      expect(debitLine[12]).toBe('');        // Credit empty

      const creditLine = lines[2].split('\t');
      expect(creditLine[4]).toBe('411000');
      expect(creditLine[11]).toBe('');       // Debit empty
      expect(creditLine[12]).toBe('750.00'); // Credit
    });

    it('should pair entries with the same EcritureNum per payment', async () => {
      const p1 = makePayment({ id: 'pi-1', amount: 100 });
      const p2 = makePayment({ id: 'pi-2', amount: 200 });
      const { svc, paymentIntentRepo, exportConfigRepo, compteComptableRepo } = buildService();
      paymentIntentRepo.find.mockResolvedValue([p1, p2]);
      exportConfigRepo.findOne.mockResolvedValue(null);
      compteComptableRepo.find.mockResolvedValue([]);

      const buffer = await svc.generateJournalReglements(societeId, periodFrom, periodTo, 'fec');
      const text = buffer.toString('latin1');
      const lines = text.split('\r\n');

      // p1: 2 entries, p2: 2 entries → header + 4
      expect(lines).toHaveLength(5);
      expect(lines[1].split('\t')[2]).toBe('000001');
      expect(lines[2].split('\t')[2]).toBe('000001');
      expect(lines[3].split('\t')[2]).toBe('000002');
      expect(lines[4].split('\t')[2]).toBe('000002');
    });
  });

  describe('FEC format', () => {
    it('should use tab separator and 18 columns in header', async () => {
      const payment = makePayment();
      const { svc, paymentIntentRepo, exportConfigRepo, compteComptableRepo } = buildService();
      paymentIntentRepo.find.mockResolvedValue([payment]);
      exportConfigRepo.findOne.mockResolvedValue(null);
      compteComptableRepo.find.mockResolvedValue([]);

      const buffer = await svc.generateJournalReglements(societeId, periodFrom, periodTo, 'fec');
      const text = buffer.toString('latin1');
      const headerCols = text.split('\r\n')[0].split('\t');
      expect(headerCols).toHaveLength(18);
    });
  });

  describe('CSV format', () => {
    it('should have BOM and semicolon separator', async () => {
      const payment = makePayment();
      const { svc, paymentIntentRepo, exportConfigRepo, compteComptableRepo } = buildService();
      paymentIntentRepo.find.mockResolvedValue([payment]);
      exportConfigRepo.findOne.mockResolvedValue(null);
      compteComptableRepo.find.mockResolvedValue([]);

      const buffer = await svc.generateJournalReglements(societeId, periodFrom, periodTo, 'csv');
      const text = buffer.toString('utf-8');
      expect(text.charCodeAt(0)).toBe(0xFEFF);
      const headerAfterBom = text.split('\r\n')[0].substring(1);
      expect(headerAfterBom.split(';')).toHaveLength(18);
    });
  });

  describe('currency handling', () => {
    it('should set Montantdevise for non-EUR payments', async () => {
      const payment = makePayment({ amount: 100, currency: 'USD' });
      const { svc, paymentIntentRepo, exportConfigRepo, compteComptableRepo } = buildService();
      paymentIntentRepo.find.mockResolvedValue([payment]);
      exportConfigRepo.findOne.mockResolvedValue(null);
      compteComptableRepo.find.mockResolvedValue([]);

      const buffer = await svc.generateJournalReglements(societeId, periodFrom, periodTo, 'fec');
      const text = buffer.toString('latin1');
      const dataLine = text.split('\r\n')[1].split('\t');
      expect(dataLine[16]).toBe('100.00'); // Montantdevise
      expect(dataLine[17]).toBe('USD');    // Idevise
    });

    it('should leave Montantdevise empty for EUR payments', async () => {
      const payment = makePayment({ amount: 100, currency: 'EUR' });
      const { svc, paymentIntentRepo, exportConfigRepo, compteComptableRepo } = buildService();
      paymentIntentRepo.find.mockResolvedValue([payment]);
      exportConfigRepo.findOne.mockResolvedValue(null);
      compteComptableRepo.find.mockResolvedValue([]);

      const buffer = await svc.generateJournalReglements(societeId, periodFrom, periodTo, 'fec');
      const text = buffer.toString('latin1');
      const dataLine = text.split('\r\n')[1].split('\t');
      expect(dataLine[16]).toBe(''); // Montantdevise empty for EUR
      expect(dataLine[17]).toBe('EUR');
    });
  });

  describe('empty period', () => {
    it('should return header-only buffer when no SUCCEEDED payments', async () => {
      const { svc, paymentIntentRepo, exportConfigRepo, compteComptableRepo } = buildService();
      paymentIntentRepo.find.mockResolvedValue([]);
      exportConfigRepo.findOne.mockResolvedValue(null);
      compteComptableRepo.find.mockResolvedValue([]);

      const buffer = await svc.generateJournalReglements(societeId, periodFrom, periodTo, 'fec');
      const text = buffer.toString('latin1');
      const lines = text.split('\r\n');
      expect(lines).toHaveLength(1); // header only
    });
  });
});
