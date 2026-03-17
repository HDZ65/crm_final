import { FecGeneratorService } from '../fec-generator.service';
import { FecEntry, FEC_COLUMNS, FEC_SEPARATOR } from '../../value-objects/fec-entry';

describe('FecGeneratorService', () => {
  let service: FecGeneratorService;

  beforeEach(() => {
    service = new FecGeneratorService();
  });

  // ── Helper ──────────────────────────────────────────────────────────

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

  // ── FEC_COLUMNS compliance ──────────────────────────────────────────

  describe('FEC_COLUMNS compliance', () => {
    it('should have exactly 18 columns defined', () => {
      expect(FEC_COLUMNS).toHaveLength(18);
    });

    it('should contain the 18 normative FEC columns in order', () => {
      const expected = [
        'JournalCode', 'JournalLib', 'EcritureNum', 'EcritureDate',
        'CompteNum', 'CompteLib', 'CompAuxNum', 'CompAuxLib',
        'PieceRef', 'PieceDate', 'EcritureLib', 'Debit', 'Credit',
        'EcritureLet', 'DateLet', 'ValidDate', 'Montantdevise', 'Idevise',
      ];
      expect(FEC_COLUMNS).toEqual(expected);
    });

    it('should use tab as FEC_SEPARATOR', () => {
      expect(FEC_SEPARATOR).toBe('\t');
    });
  });

  // ── Header row ──────────────────────────────────────────────────────

  describe('header row', () => {
    it('should produce header with exactly 18 tab-separated columns', () => {
      const entries: FecEntry[] = [makeFecEntry()];
      const { content } = service.generateFec(entries, '123456789', '20260101');
      const text = content.toString('latin1');
      const headerLine = text.split('\n')[0];
      const columns = headerLine.split('\t');
      expect(columns).toHaveLength(18);
      expect(columns).toEqual(FEC_COLUMNS);
    });
  });

  // ── latin1 encoding ─────────────────────────────────────────────────

  describe('encoding', () => {
    it('should return a Buffer encoded in latin1', () => {
      const entries: FecEntry[] = [makeFecEntry()];
      const { content } = service.generateFec(entries, '123456789', '20260101');
      expect(Buffer.isBuffer(content)).toBe(true);
      // latin1 round-trip: decode and re-encode should produce same buffer
      const decoded = content.toString('latin1');
      const reEncoded = Buffer.from(decoded, 'latin1');
      expect(reEncoded).toEqual(content);
    });

    it('should NOT include a BOM marker', () => {
      const entries: FecEntry[] = [makeFecEntry()];
      const { content } = service.generateFec(entries, '123456789', '20260101');
      const text = content.toString('latin1');
      expect(text.charCodeAt(0)).not.toBe(0xFEFF);
      expect(text.startsWith('JournalCode')).toBe(true);
    });
  });

  // ── Filename format ─────────────────────────────────────────────────

  describe('filename', () => {
    it('should produce {SIREN}FEC{dateCloture}.txt', () => {
      const entries: FecEntry[] = [makeFecEntry()];
      const { filename } = service.generateFec(entries, '123456789', '20260131');
      expect(filename).toBe('123456789FEC20260131.txt');
    });

    it('should embed different SIREN and dates', () => {
      const entries: FecEntry[] = [makeFecEntry()];
      const { filename } = service.generateFec(entries, '987654321', '20251231');
      expect(filename).toBe('987654321FEC20251231.txt');
    });
  });

  // ── Debit/Credit validation ─────────────────────────────────────────

  describe('Debit/Credit validation', () => {
    it('should throw when both Debit and Credit are empty', () => {
      const entry = makeFecEntry({ Debit: '', Credit: '' });
      expect(() =>
        service.generateFec([entry], '123456789', '20260101'),
      ).toThrow('Debit and Credit empty or zero');
    });

    it('should throw when both Debit and Credit are 0', () => {
      const entry = makeFecEntry({ Debit: '0', Credit: '0' });
      expect(() =>
        service.generateFec([entry], '123456789', '20260101'),
      ).toThrow('Debit and Credit empty or zero');
    });

    it('should accept entry with Debit > 0 and Credit empty', () => {
      const entry = makeFecEntry({ Debit: '100.00', Credit: '' });
      expect(() =>
        service.generateFec([entry], '123456789', '20260101'),
      ).not.toThrow();
    });

    it('should accept entry with Debit empty and Credit > 0', () => {
      const entry = makeFecEntry({ Debit: '', Credit: '100.00' });
      expect(() =>
        service.generateFec([entry], '123456789', '20260101'),
      ).not.toThrow();
    });

    it('should report the index of the offending entry', () => {
      const good = makeFecEntry({ Debit: '50.00', Credit: '' });
      const bad = makeFecEntry({ Debit: '0', Credit: '0' });
      expect(() =>
        service.generateFec([good, bad], '123456789', '20260101'),
      ).toThrow('Entry 1');
    });
  });

  // ── Sequential EcritureNum auto-assign ──────────────────────────────

  describe('EcritureNum auto-assign', () => {
    it('should assign sequential EcritureNum starting from 1 when empty', () => {
      const entries = [
        makeFecEntry({ EcritureNum: '' }),
        makeFecEntry({ EcritureNum: '', Debit: '', Credit: '200.00' }),
        makeFecEntry({ EcritureNum: '', Debit: '300.00' }),
      ];
      const { content } = service.generateFec(entries, '123456789', '20260101');
      const text = content.toString('latin1');
      const lines = text.split('\n');
      // Skip header (line 0), data starts at line 1
      expect(lines[1].split('\t')[2]).toBe('1');
      expect(lines[2].split('\t')[2]).toBe('2');
      expect(lines[3].split('\t')[2]).toBe('3');
    });

    it('should preserve EcritureNum if already set', () => {
      const entries = [
        makeFecEntry({ EcritureNum: 'EC-001' }),
        makeFecEntry({ EcritureNum: '', Debit: '', Credit: '50.00' }),
      ];
      const { content } = service.generateFec(entries, '123456789', '20260101');
      const text = content.toString('latin1');
      const lines = text.split('\n');
      expect(lines[1].split('\t')[2]).toBe('EC-001');
      expect(lines[2].split('\t')[2]).toBe('2');
    });
  });

  // ── Data rows ───────────────────────────────────────────────────────

  describe('data rows', () => {
    it('should output each entry as tab-separated values with 18 fields', () => {
      const entries = [
        makeFecEntry({ Debit: '100.00', Credit: '' }),
        makeFecEntry({ Debit: '', Credit: '100.00', CompteNum: '706000' }),
      ];
      const { content } = service.generateFec(entries, '123456789', '20260101');
      const text = content.toString('latin1');
      const lines = text.split('\n');
      // 1 header + 2 data rows
      expect(lines).toHaveLength(3);
      for (let i = 1; i < lines.length; i++) {
        expect(lines[i].split('\t')).toHaveLength(18);
      }
    });

    it('should use newline (\\n) as line separator', () => {
      const entries = [makeFecEntry()];
      const { content } = service.generateFec(entries, '123456789', '20260101');
      const text = content.toString('latin1');
      expect(text).toContain('\n');
      expect(text.split('\n')).toHaveLength(2);
    });
  });
});
