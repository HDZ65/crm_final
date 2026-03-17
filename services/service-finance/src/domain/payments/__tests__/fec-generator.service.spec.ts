import { FecGeneratorService } from '../services/fec-generator.service';
import { FecEntry, FEC_COLUMNS, FEC_SEPARATOR } from '../value-objects/fec-entry';

function makeFecEntry(overrides: Partial<FecEntry> = {}): FecEntry {
  return {
    JournalCode: 'VT',
    JournalLib: 'Journal des Ventes',
    EcritureNum: '',
    EcritureDate: '20260101',
    CompteNum: '411000',
    CompteLib: 'Clients',
    CompAuxNum: '',
    CompAuxLib: '',
    PieceRef: 'FAC-001',
    PieceDate: '20260101',
    EcritureLib: 'Facture FAC-001',
    Debit: '1200.00',
    Credit: '',
    EcritureLet: '',
    DateLet: '',
    ValidDate: '20260101',
    Montantdevise: '',
    Idevise: 'EUR',
    ...overrides,
  };
}

describe('FecGeneratorService', () => {
  let service: FecGeneratorService;

  beforeEach(() => {
    service = new FecGeneratorService();
  });

  it('should return { content: Buffer, filename: string }', () => {
    const result = service.generateFec([makeFecEntry()], '123456789', '20260101');
    expect(Buffer.isBuffer(result.content)).toBe(true);
    expect(typeof result.filename).toBe('string');
  });

  it('should produce filename as {SIREN}FEC{dateCloture}.txt', () => {
    const { filename } = service.generateFec([makeFecEntry()], '123456789', '20260131');
    expect(filename).toBe('123456789FEC20260131.txt');
  });

  it('should have exactly 18 tab-separated columns in header row', () => {
    const { content } = service.generateFec([makeFecEntry()], '123456789', '20260101');
    const text = content.toString('latin1');
    const headerLine = text.split('\n')[0];
    const columns = headerLine.split('\t');
    expect(columns).toHaveLength(18);
    expect(columns).toEqual(FEC_COLUMNS);
  });

  it('should use tab as field separator', () => {
    const { content } = service.generateFec([makeFecEntry()], '123456789', '20260101');
    const text = content.toString('latin1');
    const dataLine = text.split('\n')[1];
    expect(dataLine.split('\t')).toHaveLength(18);
  });

  it('should auto-assign sequential EcritureNum when empty', () => {
    const entries = [
      makeFecEntry({ EcritureNum: '' }),
      makeFecEntry({ EcritureNum: '', Debit: '', Credit: '200.00' }),
    ];
    const { content } = service.generateFec(entries, '123456789', '20260101');
    const text = content.toString('latin1');
    const lines = text.split('\n');
    expect(lines[1].split('\t')[2]).toBe('1');
    expect(lines[2].split('\t')[2]).toBe('2');
  });

  it('should preserve EcritureNum if already set', () => {
    const entries = [makeFecEntry({ EcritureNum: 'EC-001' })];
    const { content } = service.generateFec(entries, '123456789', '20260101');
    const text = content.toString('latin1');
    expect(text.split('\n')[1].split('\t')[2]).toBe('EC-001');
  });

  it('should throw when both Debit and Credit are empty/zero', () => {
    expect(() =>
      service.generateFec([makeFecEntry({ Debit: '', Credit: '' })], '123456789', '20260101'),
    ).toThrow('Debit and Credit empty or zero');

    expect(() =>
      service.generateFec([makeFecEntry({ Debit: '0', Credit: '0' })], '123456789', '20260101'),
    ).toThrow('Debit and Credit empty or zero');
  });

  it('should encode content as latin1 Buffer without BOM', () => {
    const { content } = service.generateFec([makeFecEntry()], '123456789', '20260101');
    const text = content.toString('latin1');
    expect(text.startsWith('JournalCode')).toBe(true); // no BOM
    expect(Buffer.from(text, 'latin1')).toEqual(content); // round-trip
  });
});
