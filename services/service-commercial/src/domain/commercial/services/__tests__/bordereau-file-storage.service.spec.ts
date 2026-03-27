import { afterEach, describe, expect, it } from 'bun:test';
import { mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { BordereauFileStorageService } from '../bordereau-file-storage.service';

describe('BordereauFileStorageService', () => {
  let tempRoot: string | undefined;

  afterEach(async () => {
    if (tempRoot) {
      await rm(tempRoot, { recursive: true, force: true });
      tempRoot = undefined;
    }
  });

  it('stores pdf and excel in uploads/bordereaux/{societe}/{annee}', async () => {
    tempRoot = await mkdtemp(join(tmpdir(), 'bordereau-export-'));
    const service = new BordereauFileStorageService(tempRoot);

    const result = await service.sauvegarderExports({
      societe: 'acme',
      annee: '2026',
      referenceBordereau: 'BRD-2026-01-0001',
      pdfBuffer: Buffer.from('pdf-content'),
      excelBuffer: Buffer.from('excel-content'),
    });

    expect(result.pdfUrl).toContain('/uploads/bordereaux/acme/2026/CDC_');
    expect(result.excelUrl).toContain('/uploads/bordereaux/acme/2026/CDC_');
    expect(result.pdfAbsolutePath).toContain('bordereaux');
    expect(result.excelAbsolutePath).toContain('bordereaux');
  });
});
