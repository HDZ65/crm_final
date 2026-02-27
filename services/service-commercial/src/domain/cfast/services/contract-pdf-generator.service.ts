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

      // Totals section
      if (contrat.montant) {
        doc.moveDown();
        doc.fontSize(11).text('─'.repeat(40));
        const sousTotal = contrat.montant;
        const tva = sousTotal * 0.2;
        const totalTTC = sousTotal * 1.2;
        doc.fontSize(10);
        doc.text(`Sous-total HT: ${sousTotal} ${contrat.devise || 'EUR'}`, { align: 'right' });
        doc.text(`TVA (20%): ${tva.toFixed(2)} ${contrat.devise || 'EUR'}`, { align: 'right' });
        doc.fontSize(12).text(`Total TTC: ${totalTTC.toFixed(2)} ${contrat.devise || 'EUR'}`, { align: 'right' });
        doc.moveDown();
      }

      // Footer section
      doc.fontSize(10).text('─'.repeat(40));
      doc.fontSize(9).text('Conditions générales: Ce contrat est soumis aux conditions générales de vente en vigueur.');
      if (contrat.notes) {
        doc.moveDown(0.3);
        doc.text(`Notes: ${contrat.notes}`);
      }

      doc.end();
    });
  }
}
