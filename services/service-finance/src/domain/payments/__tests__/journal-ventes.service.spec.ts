import { JournalVentesService } from '../services/journal-ventes.service';
import { FactureEntity } from '../../factures/entities/facture.entity';
import { FEC_COLUMNS } from '../value-objects/fec-entry';

function mockRepo() {
  return { find: jest.fn(), findOne: jest.fn(), save: jest.fn() };
}

function buildService() {
  const factureRepo = mockRepo();
  const exportConfigRepo = mockRepo();
  const compteComptableRepo = mockRepo();

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

describe('JournalVentesService', () => {
  const societeId = 'soc-001';
  const from = new Date('2026-01-01');
  const to = new Date('2026-01-31');

  it('should return a Buffer from generateJournalVentes', async () => {
    const { svc, factureRepo, exportConfigRepo, compteComptableRepo } = buildService();
    factureRepo.find.mockResolvedValue([makeFacture()]);
    exportConfigRepo.findOne.mockResolvedValue(null);
    compteComptableRepo.find.mockResolvedValue([]);

    const result = await svc.generateJournalVentes(societeId, from, to, 'csv');
    expect(Buffer.isBuffer(result)).toBe(true);
  });

  it('CSV should start with BOM and use semicolon separator', async () => {
    const { svc, factureRepo, exportConfigRepo, compteComptableRepo } = buildService();
    factureRepo.find.mockResolvedValue([makeFacture()]);
    exportConfigRepo.findOne.mockResolvedValue(null);
    compteComptableRepo.find.mockResolvedValue([]);

    const buf = await svc.generateJournalVentes(societeId, from, to, 'csv');
    const text = buf.toString('utf-8');
    // BOM check
    expect(text.charCodeAt(0)).toBe(0xFEFF);
    // Header after BOM uses semicolons, 18 columns
    const headerAfterBom = text.split('\r\n')[0].substring(1);
    expect(headerAfterBom.split(';')).toHaveLength(18);
    expect(headerAfterBom.split(';')).toEqual(FEC_COLUMNS);
  });

  it('FEC should use tab separator, no BOM', async () => {
    const { svc, factureRepo, exportConfigRepo, compteComptableRepo } = buildService();
    factureRepo.find.mockResolvedValue([makeFacture()]);
    exportConfigRepo.findOne.mockResolvedValue(null);
    compteComptableRepo.find.mockResolvedValue([]);

    const buf = await svc.generateJournalVentes(societeId, from, to, 'fec');
    const text = buf.toString('latin1');
    expect(text.charCodeAt(0)).not.toBe(0xFEFF);
    expect(text.split('\r\n')[0].split('\t')).toHaveLength(18);
  });

  it('should map 411(debit)/706(credit)/445(TVA) for facture with TVA', async () => {
    const { svc, factureRepo, exportConfigRepo, compteComptableRepo } = buildService();
    factureRepo.find.mockResolvedValue([makeFacture({ montantHT: 1000, montantTTC: 1200 })]);
    exportConfigRepo.findOne.mockResolvedValue(null);
    compteComptableRepo.find.mockResolvedValue([]);

    const buf = await svc.generateJournalVentes(societeId, from, to, 'fec');
    const lines = buf.toString('latin1').split('\r\n');
    // header + 3 entries (debit 411, credit 706, credit 445)
    expect(lines).toHaveLength(4);

    const row1 = lines[1].split('\t');
    expect(row1[4]).toBe('411000');   // CompteNum
    expect(row1[11]).toBe('1200.00'); // Debit = TTC

    const row2 = lines[2].split('\t');
    expect(row2[4]).toBe('706000');
    expect(row2[12]).toBe('1000.00'); // Credit = HT

    const row3 = lines[3].split('\t');
    expect(row3[4]).toBe('445710');
    expect(row3[12]).toBe('200.00'); // Credit = TVA
  });

  it('should call factureRepository.find with mock', async () => {
    const { svc, factureRepo, exportConfigRepo, compteComptableRepo } = buildService();
    factureRepo.find.mockResolvedValue([]);
    exportConfigRepo.findOne.mockResolvedValue(null);
    compteComptableRepo.find.mockResolvedValue([]);

    await svc.generateJournalVentes(societeId, from, to);
    expect(factureRepo.find).toHaveBeenCalledTimes(1);
  });
});
