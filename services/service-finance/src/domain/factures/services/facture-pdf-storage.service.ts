import { Injectable } from '@nestjs/common';
import { mkdir, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';

export interface SauvegarderFacturePdfInput {
  societe: string;
  annee: string;
  referenceFacture: string;
  pdfBuffer: Buffer;
}

export interface SauvegarderFacturePdfResult {
  pdfUrl: string;
  pdfAbsolutePath: string;
}

@Injectable()
export class FacturePdfStorageService {
  private readonly uploadsRoot = resolve(process.cwd(), 'uploads');

  async sauvegarder(input: SauvegarderFacturePdfInput): Promise<SauvegarderFacturePdfResult> {
    const societe = this.sanitizeSegment(input.societe);
    const annee = this.sanitizeSegment(input.annee);
    const factureBase = this.sanitizeSegment(input.referenceFacture);
    const timestamp = Date.now();
    const fileName = `FAC_${factureBase}_${timestamp}.pdf`;

    const relativeFolder = join('factures', societe, annee);
    const absoluteFolder = join(this.uploadsRoot, relativeFolder);
    await mkdir(absoluteFolder, { recursive: true });

    const pdfAbsolutePath = join(absoluteFolder, fileName);
    await writeFile(pdfAbsolutePath, input.pdfBuffer);

    const baseUrl = '/uploads';
    return {
      pdfUrl: `${baseUrl}/${relativeFolder.replace(/\\/g, '/')}/${fileName}`,
      pdfAbsolutePath,
    };
  }

  private sanitizeSegment(raw: string): string {
    const normalized = (raw || '').trim().toLowerCase();
    if (!normalized) {
      return 'na';
    }
    return normalized.replace(/[^a-z0-9_-]/g, '-').replace(/-+/g, '-');
  }
}
