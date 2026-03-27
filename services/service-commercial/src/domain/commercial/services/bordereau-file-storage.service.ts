import { Injectable } from '@nestjs/common';
import { mkdir, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';

export interface SauvegarderExportsInput {
  societe: string;
  annee: string;
  referenceBordereau: string;
  pdfBuffer: Buffer;
  excelBuffer: Buffer;
}

export interface SauvegarderExportsResult {
  pdfUrl: string;
  excelUrl: string;
  pdfAbsolutePath: string;
  excelAbsolutePath: string;
}

@Injectable()
export class BordereauFileStorageService {
  private readonly uploadsRoot = resolve(process.cwd(), 'uploads');

  async sauvegarderExports(input: SauvegarderExportsInput): Promise<SauvegarderExportsResult> {
    const societe = this.sanitizeSegment(input.societe);
    const annee = this.sanitizeSegment(input.annee);
    const bordereauBase = this.sanitizeSegment(input.referenceBordereau);
    const timestamp = Date.now();
    const cdcName = `CDC_${bordereauBase}_${timestamp}`;

    const relativeFolder = join('bordereaux', societe, annee);
    const absoluteFolder = join(this.uploadsRoot, relativeFolder);
    await mkdir(absoluteFolder, { recursive: true });

    const pdfFile = `${cdcName}.pdf`;
    const excelFile = `${cdcName}.xlsx`;

    const pdfAbsolutePath = join(absoluteFolder, pdfFile);
    const excelAbsolutePath = join(absoluteFolder, excelFile);

    await writeFile(pdfAbsolutePath, input.pdfBuffer);
    await writeFile(excelAbsolutePath, input.excelBuffer);

    const baseUrl = '/uploads';
    return {
      pdfUrl: `${baseUrl}/${relativeFolder.replace(/\\/g, '/')}/${pdfFile}`,
      excelUrl: `${baseUrl}/${relativeFolder.replace(/\\/g, '/')}/${excelFile}`,
      pdfAbsolutePath,
      excelAbsolutePath,
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
