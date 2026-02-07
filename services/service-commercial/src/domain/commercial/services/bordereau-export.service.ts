import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';
import { createHash } from 'node:crypto';
import type { BordereauCommissionEntity } from '../entities/bordereau-commission.entity';
import type { LigneBordereauEntity } from '../entities/ligne-bordereau.entity';

@Injectable()
export class BordereauExportService {
  async genererPDF(
    bordereau: BordereauCommissionEntity,
    lignes: LigneBordereauEntity[],
  ): Promise<Buffer> {
    const doc = new PDFDocument({ margin: 40 });
    const buffers: Buffer[] = [];

    doc.on('data', (chunk: Buffer) => buffers.push(chunk));

    doc.fontSize(20).text('Winvest Capital');
    doc.moveDown(0.5);
    doc.fontSize(14).text(`Bordereau de Commissions - ${bordereau.periode}`);
    doc.moveDown(1);

    doc.fontSize(11);
    doc.text(`Reference: ${bordereau.reference}`);
    doc.text(`Total Brut: ${Number(bordereau.totalBrut || 0).toFixed(2)} EUR`);
    doc.text(`Total Reprises: ${Number(bordereau.totalReprises || 0).toFixed(2)} EUR`);
    doc.text(`Total Net: ${Number(bordereau.totalNetAPayer || 0).toFixed(2)} EUR`);

    doc.addPage();
    doc.fontSize(13).text('Detail des Commissions');
    doc.moveDown(0.5);

    let y = doc.y;
    for (const ligne of lignes) {
      const client = ligne.clientNom ?? '';
      doc.fontSize(10).text(`${ligne.contratReference} - ${client}`, 40, y, { width: 360 });
      doc.text(`Net: ${Number(ligne.montantNet || 0).toFixed(2)} EUR`, 420, y);
      y += 18;

      if (y > 740) {
        doc.addPage();
        y = 40;
      }
    }

    doc.end();

    return await new Promise<Buffer>((resolve, reject) => {
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);
    });
  }

  async genererExcel(
    bordereau: BordereauCommissionEntity,
    lignes: LigneBordereauEntity[],
  ): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();

    const totalSheet = workbook.addWorksheet('Total');
    totalSheet.addRow(['Total Brut', Number(bordereau.totalBrut || 0)]);
    totalSheet.addRow(['Total Reprises', Number(bordereau.totalReprises || 0)]);
    totalSheet.addRow(['Total Net', Number(bordereau.totalNetAPayer || 0)]);

    const lineaireSheet = workbook.addWorksheet('Lineaire');
    lineaireSheet.addRow(['Contrat', 'Client', 'Produit', 'Brut', 'Reprise', 'Net']);
    for (const ligne of lignes) {
      lineaireSheet.addRow([
        ligne.contratReference,
        ligne.clientNom ?? '',
        ligne.produitNom ?? '',
        Number(ligne.montantBrut || 0),
        Number(ligne.montantReprise || 0),
        Number(ligne.montantNet || 0),
      ]);
    }

    const reprisesSheet = workbook.addWorksheet('Reprises');
    reprisesSheet.addRow(['Contrat', 'Montant Reprise']);
    for (const ligne of lignes.filter((entry) => Number(entry.montantReprise || 0) > 0)) {
      const row = reprisesSheet.addRow([
        ligne.contratReference,
        Number(ligne.montantReprise || 0),
      ]);
      row.getCell(2).font = { color: { argb: 'FFFF0000' } };
    }

    const output = await workbook.xlsx.writeBuffer();
    return Buffer.isBuffer(output) ? output : Buffer.from(output);
  }

  calculerHashSHA256(buffer: Buffer): string {
    return createHash('sha256').update(buffer).digest('hex');
  }
}
