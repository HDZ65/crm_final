import { FEC_COLUMNS, FEC_SEPARATOR, DEFAULT_JOURNAL_CONFIGS, JournalType } from '../value-objects/fec-entry';
import { DEFAULT_ACCOUNT_MAPPINGS } from '../value-objects/account-mapping';

describe('FEC value objects', () => {
  it('FEC_COLUMNS should have exactly 18 entries', () => {
    expect(FEC_COLUMNS).toHaveLength(18);
  });

  it('FEC_COLUMNS should contain all normative column names in order', () => {
    expect(FEC_COLUMNS).toEqual([
      'JournalCode', 'JournalLib', 'EcritureNum', 'EcritureDate',
      'CompteNum', 'CompteLib', 'CompAuxNum', 'CompAuxLib',
      'PieceRef', 'PieceDate', 'EcritureLib', 'Debit', 'Credit',
      'EcritureLet', 'DateLet', 'ValidDate', 'Montantdevise', 'Idevise',
    ]);
  });

  it('FEC_SEPARATOR should be tab character', () => {
    expect(FEC_SEPARATOR).toBe('\t');
  });

  it('DEFAULT_ACCOUNT_MAPPINGS should include key PCG accounts', () => {
    const numbers = DEFAULT_ACCOUNT_MAPPINGS.map(m => m.numero_compte);
    expect(numbers).toContain('411000'); // Clients
    expect(numbers).toContain('416000'); // Clients douteux
    expect(numbers).toContain('445710'); // TVA collectée
    expect(numbers).toContain('512000'); // Banque
    expect(numbers).toContain('706000'); // Prestations de services
  });

  it('DEFAULT_JOURNAL_CONFIGS should have VENTES, REGLEMENTS, IMPAYES', () => {
    expect(DEFAULT_JOURNAL_CONFIGS[JournalType.VENTES].code).toBe('VT');
    expect(DEFAULT_JOURNAL_CONFIGS[JournalType.REGLEMENTS].code).toBe('BAN');
    expect(DEFAULT_JOURNAL_CONFIGS[JournalType.IMPAYES].code).toBe('IMP');
  });
});
