import { Injectable } from '@nestjs/common';
import { FecEntry, FEC_COLUMNS, FEC_SEPARATOR } from '../value-objects/fec-entry';

@Injectable()
export class FecGeneratorService {
  /**
   * Generates a FEC (Fichier des Écritures Comptables) file from accounting entries.
   * Compliant with French tax authority (LPF article A47 A-1).
   *
   * @param entries - Array of FecEntry objects
   * @param siren - SIREN number (9 digits)
   * @param dateCloture - Closing date in YYYYMMDD format
   * @returns Object with Buffer content and filename
   * @throws Error if any entry has both Debit and Credit empty/zero
   */
  generateFec(
    entries: FecEntry[],
    siren: string,
    dateCloture: string,
  ): { content: Buffer; filename: string } {
    // Validate entries
    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      const debit = parseFloat(entry.Debit || '0');
      const credit = parseFloat(entry.Credit || '0');

      if (debit === 0 && credit === 0) {
        throw new Error(
          `Entry ${i} has both Debit and Credit empty or zero. At least one must have a value.`,
        );
      }
    }

    // Auto-assign EcritureNum if empty
    const processedEntries = entries.map((entry, index) => ({
      ...entry,
      EcritureNum: entry.EcritureNum || String(index + 1),
    }));

    // Build header row
    const headerRow = FEC_COLUMNS.join(FEC_SEPARATOR);

    // Build data rows
    const dataRows = processedEntries.map((entry) =>
      FEC_COLUMNS.map((col) => entry[col] || '').join(FEC_SEPARATOR),
    );

    // Combine header and data
    const lines = [headerRow, ...dataRows];
    const content = lines.join('\n');

    // Encode to latin1 (windows-1252), no BOM
    const buffer = Buffer.from(content, 'latin1');

    // Generate filename: {SIREN}FEC{dateCloture}.txt
    const filename = `${siren}FEC${dateCloture}.txt`;

    return { content: buffer, filename };
  }
}
