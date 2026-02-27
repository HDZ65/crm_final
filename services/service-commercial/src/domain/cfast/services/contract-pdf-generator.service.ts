import { Injectable, Logger } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import { ContratEntity } from '../../contrats/entities/contrat.entity';
import { LigneContratEntity } from '../../contrats/entities/ligne-contrat.entity';

@Injectable()
export class ContractPdfGeneratorService {
  private readonly logger = new Logger(ContractPdfGeneratorService.name);

  async generatePdf(
    contrat: ContratEntity & { lignes?: LigneContratEntity[] },
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Header
      doc.fontSize(20).text('CONTRAT', { align: 'center' });
      doc.moveDown();

      // Contract info
      doc.fontSize(12);
      doc.text(`Référence: ${contrat.reference || '-'}`);
      doc.text(`Titre: ${contrat.titre || '-'}`);
      doc.text(`Type: ${contrat.type || '-'}`);
      doc.text(`Date début: ${contrat.dateDebut || '-'}`);
      if (contrat.dateFin) doc.text(`Date fin: ${contrat.dateFin}`);
      if (contrat.frequenceFacturation)
        doc.text(`Fréquence: ${contrat.frequenceFacturation}`);
      if (contrat.montant)
        doc.text(`Montant: ${contrat.montant} ${contrat.devise || 'EUR'}`);
      doc.moveDown();

      // Line items if available
      if (contrat.lignes && contrat.lignes.length > 0) {
        doc.fontSize(14).text('Lignes du contrat:');
        doc.moveDown(0.5);
        doc.fontSize(10);
        contrat.lignes.forEach((ligne, i) => {
          doc.text(
            `${i + 1}. Qté: ${ligne.quantite} × ${ligne.prixUnitaire} EUR`,
          );
        });
        doc.moveDown();
      }

      // Notes
      if (contrat.notes) {
        doc.fontSize(10).text(`Notes: ${contrat.notes}`);
      }

      doc.end();
    });
  }
}
