import { JournalVentesService } from '../journal-ventes.service';
import { FactureEntity } from '../../../factures/entities/facture.entity';
import { FEC_COLUMNS, FEC_SEPARATOR } from '../../value-objects/fec-entry';

// ── Mock repositories ─────────────────────────────────────────────────

function mockRepo() {
  return { find: jest.fn(), findOne: jest.fn(), save: jest.fn(), createQueryBuilder: jest.fn() };
}

function buildService(overrides: {
  factureRepo?: Partial<ReturnType<typeof mockRepo>>;
  exportConfigRepo?: Partial<ReturnType<typeof mockRepo>>;
  compteComptableRepo?: Partial<ReturnType<typeof mockRepo>>;
} = {}) {
  const factureRepo = { ...mockRepo(), ...overrides.factureRepo };
  const exportConfigRepo = { ...mockRepo(), ...overrides.exportConfigRepo };
  const compteComptableRepo = { ...mockRepo(), ...overrides.compteComptableRepo };

  // Construct with injected repos (bypass DI)
  const svc = Object.create(JournalVentesService.prototype);
  svc.logger = { log: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() };
  svc.factureRepository = factureRepo;
  svc.exportConfigRepository = exportConfigRepo;
  svc.compteComptableRepository = compteComptableRepo;
  svc.defaultConfig = {
    code: 'VT',
    libelle: 'Journal des Ventes',
    compte_debit_defaut: '411000',
    compte_credit_defaut: '706000',
    compte_tva: '445710',
  };
  return { svc, factureRepo, exportConfigRepo, compteComptableRepo };
}

function makeFacture(overrides: Partial<FactureEntity> = {}): FactureEntity {
  const f = new FactureEntity();
  f.id = 'fac-001';
  f.organisationId = 'soc-001';
  f.numero = 'FAC-2026-001';
  f.dateEmission = new Date('2026-01-15');
  f.montantHT = 1000;
  f.montantTTC = 1200;
  f.clientBaseId = 'cli-001';
  Object.assign(f, overrides);
  return f;
}

// ── Tests ─────────────────────────────────────────────────────────────

describe('JournalVentesService', () => {
  const societeId = 'soc-001';
  const periodFrom = new Date('2026-01-01');
  const periodTo = new Date('2026-01-31');

  describe('account mapping (411/7xx/445)', () => {
    it('should produce Debit 411000, Credit 706000, Credit 445710 for facture with TVA', async () => {
      const facture = makeFacture({ montantHT: 1000, montantTTC: 1200 });
      const { svc, factureRepo, exportConfigRepo, compteComptableRepo } = buildService();
      factureRepo.find.mockResolvedValue([facture]);
      exportConfigRepo.findOne.mockResolvedValue(null);
      compteComptableRepo.find.mockResolvedValue([]);

      const buffer = await svc.generateJournalVentes(societeId, periodFrom, periodTo, 'fec');
      const text = buffer.toString('latin1');
      const lines = text.split('\r\n');
      // header + 3 entries (debit 411, credit 706, credit 445)
      expect(lines).toHaveLength(4);

      const debitLine = lines[1].split('\t');
      expect(debitLine[4]).toBe('411000');  // CompteNum
      expect(debitLine[11]).toBe('1200.00'); // Debit
      expect(debitLine[12]).toBe('');        // Credit empty

      const creditLine = lines[2].split('\t');
      expect(creditLine[4]).toBe('706000');
      expect(creditLine[11]).toBe('');       // Debit empty
      expect(creditLine[12]).toBe('1000.00'); // Credit = HT

      const tvaLine = lines[3].split('\t');
      expect(tvaLine[4]).toBe('445710');
      expect(tvaLine[11]).toBe('');
      expect(tvaLine[12]).toBe('200.00');    // TVA = TTC - HT
    });

    it('should skip TVA entry when montantTVA is 0 (no-tax facture)', async () => {
      const facture = makeFacture({ montantHT: 1000, montantTTC: 1000 });
      const { svc, factureRepo, exportConfigRepo, compteComptableRepo } = buildService();
      factureRepo.find.mockResolvedValue([facture]);
      exportConfigRepo.findOne.mockResolvedValue(null);
      compteComptableRepo.find.mockResolvedValue([]);

      const buffer = await svc.generateJournalVentes(societeId, periodFrom, periodTo, 'fec');
      const text = buffer.toString('latin1');
      const lines = text.split('\r\n');
      // header + 2 entries only (no TVA)
      expect(lines).toHaveLength(3);
    });
  });

  describe('CSV format (BOM + semicolon)', () => {
    it('should start with UTF-8 BOM and use semicolon separator', async () => {
      const facture = makeFacture();
      const { svc, factureRepo, exportConfigRepo, compteComptableRepo } = buildService();
      factureRepo.find.mockResolvedValue([facture]);
      exportConfigRepo.findOne.mockResolvedValue(null);
      compteComptableRepo.find.mockResolvedValue([]);

      const buffer = await svc.generateJournalVentes(societeId, periodFrom, periodTo, 'csv');
      const text = buffer.toString('utf-8');
      // BOM check
      expect(text.charCodeAt(0)).toBe(0xFEFF);

      const lines = text.split('\r\n');
      // Header after BOM uses semicolon
      const headerCols = lines[0].substring(1).split(';'); // skip BOM char
      expect(headerCols).toHaveLength(18);
      expect(headerCols).toEqual(FEC_COLUMNS);
    });

    it('should use semicolon in data rows', async () => {
      const facture = makeFacture({ montantHT: 500, montantTTC: 500 }); // no TVA
      const { svc, factureRepo, exportConfigRepo, compteComptableRepo } = buildService();
      factureRepo.find.mockResolvedValue([facture]);
      exportConfigRepo.findOne.mockResolvedValue(null);
      compteComptableRepo.find.mockResolvedValue([]);

      const buffer = await svc.generateJournalVentes(societeId, periodFrom, periodTo, 'csv');
      const text = buffer.toString('utf-8');
      const lines = text.split('\r\n');
      // data row should have 18 semicolon-separated fields
      expect(lines[1].split(';')).toHaveLength(18);
    });
  });

  describe('FEC format (tab separator)', () => {
    it('should use tab separator and latin1 encoding', async () => {
      const facture = makeFacture();
      const { svc, factureRepo, exportConfigRepo, compteComptableRepo } = buildService();
      factureRepo.find.mockResolvedValue([facture]);
      exportConfigRepo.findOne.mockResolvedValue(null);
      compteComptableRepo.find.mockResolvedValue([]);

      const buffer = await svc.generateJournalVentes(societeId, periodFrom, periodTo, 'fec');
      const text = buffer.toString('latin1');
      const lines = text.split('\r\n');
      const headerCols = lines[0].split('\t');
      expect(headerCols).toHaveLength(18);
      expect(headerCols).toEqual(FEC_COLUMNS);
    });

    it('should NOT contain BOM in FEC output', async () => {
      const facture = makeFacture();
      const { svc, factureRepo, exportConfigRepo, compteComptableRepo } = buildService();
      factureRepo.find.mockResolvedValue([facture]);
      exportConfigRepo.findOne.mockResolvedValue(null);
      compteComptableRepo.find.mockResolvedValue([]);

      const buffer = await svc.generateJournalVentes(societeId, periodFrom, periodTo, 'fec');
      const text = buffer.toString('latin1');
      expect(text.charCodeAt(0)).not.toBe(0xFEFF);
    });
  });

  describe('multiple factures', () => {
    it('should produce entries for all factures with sequential EcritureNum', async () => {
      const f1 = makeFacture({ id: 'f1', numero: 'FAC-001', montantHT: 100, montantTTC: 100 });
      const f2 = makeFacture({ id: 'f2', numero: 'FAC-002', montantHT: 200, montantTTC: 240 });
      const { svc, factureRepo, exportConfigRepo, compteComptableRepo } = buildService();
      factureRepo.find.mockResolvedValue([f1, f2]);
      exportConfigRepo.findOne.mockResolvedValue(null);
      compteComptableRepo.find.mockResolvedValue([]);

      const buffer = await svc.generateJournalVentes(societeId, periodFrom, periodTo, 'fec');
      const text = buffer.toString('latin1');
      const lines = text.split('\r\n');
      // f1: 2 entries (no TVA), f2: 3 entries (with TVA) → header + 5
      expect(lines).toHaveLength(6);

      // EcritureNum: f1 entries share 000001, f2 entries share 000002
      expect(lines[1].split('\t')[2]).toBe('000001');
      expect(lines[2].split('\t')[2]).toBe('000001');
      expect(lines[3].split('\t')[2]).toBe('000002');
    });
  });

  describe('empty period', () => {
    it('should return buffer with header only when no factures found', async () => {
      const { svc, factureRepo, exportConfigRepo, compteComptableRepo } = buildService();
      factureRepo.find.mockResolvedValue([]);
      exportConfigRepo.findOne.mockResolvedValue(null);
      compteComptableRepo.find.mockResolvedValue([]);

      const buffer = await svc.generateJournalVentes(societeId, periodFrom, periodTo, 'fec');
      const text = buffer.toString('latin1');
      const lines = text.split('\r\n');
      expect(lines).toHaveLength(1); // header only
    });
  });

  describe('repository calls', () => {
    it('should call factureRepository.find with correct filters', async () => {
      const { svc, factureRepo, exportConfigRepo, compteComptableRepo } = buildService();
      factureRepo.find.mockResolvedValue([]);
      exportConfigRepo.findOne.mockResolvedValue(null);
      compteComptableRepo.find.mockResolvedValue([]);

      await svc.generateJournalVentes(societeId, periodFrom, periodTo, 'csv');
      expect(factureRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            organisationId: societeId,
          }),
          order: { dateEmission: 'ASC', numero: 'ASC' },
        }),
      );
    });
  });
});
