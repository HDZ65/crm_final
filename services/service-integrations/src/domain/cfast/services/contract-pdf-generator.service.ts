import { Injectable } from '@nestjs/common';
import { ContratEntity } from '../../contrats/entities/contrat.entity';
import { LigneContratEntity } from '../../contrats/entities/ligne-contrat.entity';

/**
 * Generates a minimal PDF for a contract using raw PDF syntax.
 * No external dependencies required.
 */
@Injectable()
export class ContractPdfGeneratorService {
  async generatePdf(contrat: ContratEntity & { lignes?: LigneContratEntity[] }): Promise<Buffer> {
    const lines: string[] = [];

    lines.push(`CONTRAT`);
    lines.push(`Référence: ${contrat.reference || '-'}`);
    lines.push(`Titre: ${contrat.titre || '-'}`);
    lines.push(`Type: ${contrat.type || '-'}`);
    lines.push(`Statut: ${contrat.statut || '-'}`);
    lines.push(`Date début: ${contrat.dateDebut ? contrat.dateDebut.toISOString().split('T')[0] : '-'}`);
    if (contrat.dateFin) {
      lines.push(`Date fin: ${contrat.dateFin.toISOString().split('T')[0]}`);
    }
    if (contrat.frequenceFacturation) {
      lines.push(`Fréquence: ${contrat.frequenceFacturation}`);
    }
    if (contrat.montant != null) {
      lines.push(`Montant: ${contrat.montant} ${contrat.devise || 'EUR'}`);
    }

    if (contrat.lignes && contrat.lignes.length > 0) {
      lines.push('');
      lines.push('Lignes du contrat:');
      contrat.lignes.forEach((ligne, i) => {
        lines.push(`  ${i + 1}. Qté: ${ligne.quantite} x ${ligne.prixUnitaire} EUR`);
      });
    }

    if (contrat.montant != null) {
      const sousTotal = Number(contrat.montant);
      const tva = sousTotal * 0.2;
      const totalTTC = sousTotal * 1.2;
      lines.push('');
      lines.push(`Sous-total HT: ${sousTotal} ${contrat.devise || 'EUR'}`);
      lines.push(`TVA (20%): ${tva.toFixed(2)} ${contrat.devise || 'EUR'}`);
      lines.push(`Total TTC: ${totalTTC.toFixed(2)} ${contrat.devise || 'EUR'}`);
    }

    lines.push('');
    lines.push('Conditions générales: Ce contrat est soumis aux conditions générales de vente en vigueur.');
    if (contrat.notes) {
      lines.push(`Notes: ${contrat.notes}`);
    }

    return this.buildMinimalPdf(lines);
  }

  private buildMinimalPdf(textLines: string[]): Buffer {
    // Build a minimal valid PDF with raw text content
    const pageWidth = 595;
    const pageHeight = 842;
    const margin = 50;
    const lineHeight = 15;
    const fontSize = 11;

    let y = pageHeight - margin;
    const contentLines: string[] = [];

    for (const line of textLines) {
      y -= lineHeight;
      const escaped = line
        .replace(/\\/g, '\\\\')
        .replace(/\(/g, '\\(')
        .replace(/\)/g, '\\)');
      contentLines.push(`BT /F1 ${fontSize} Tf ${margin} ${y} Td (${escaped}) Tj ET`);
    }

    const streamContent = contentLines.join('\n');
    const streamBytes = Buffer.from(streamContent, 'latin1');

    const objects: string[] = [];
    let offset = 0;
    const offsets: number[] = [];

    const header = '%PDF-1.4\n';
    offset += header.length;

    // Object 1: Catalog
    offsets.push(offset);
    const obj1 = '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n';
    objects.push(obj1);
    offset += obj1.length;

    // Object 2: Pages
    offsets.push(offset);
    const obj2 = `2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n`;
    objects.push(obj2);
    offset += obj2.length;

    // Object 3: Page
    offsets.push(offset);
    const obj3 = `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n`;
    objects.push(obj3);
    offset += obj3.length;

    // Object 4: Content stream
    offsets.push(offset);
    const obj4 = `4 0 obj\n<< /Length ${streamBytes.length} >>\nstream\n${streamContent}\nendstream\nendobj\n`;
    objects.push(obj4);
    offset += obj4.length;

    // Object 5: Font
    offsets.push(offset);
    const obj5 = '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n';
    objects.push(obj5);
    offset += obj5.length;

    const xrefOffset = offset;
    const xref = [
      'xref',
      `0 ${objects.length + 1}`,
      '0000000000 65535 f ',
      ...offsets.map((o) => `${String(o).padStart(10, '0')} 00000 n `),
    ].join('\n') + '\n';

    const trailer = `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;

    return Buffer.concat([
      Buffer.from(header, 'latin1'),
      ...objects.map((o) => Buffer.from(o, 'latin1')),
      Buffer.from(xref, 'latin1'),
      Buffer.from(trailer, 'latin1'),
    ]);
  }
}
