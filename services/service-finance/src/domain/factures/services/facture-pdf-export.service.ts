import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import { createHash } from 'node:crypto';
import type { FactureEntity } from '../entities/facture.entity';
import type { LigneFactureEntity } from '../entities/ligne-facture.entity';
import type { FactureSettingsEntity } from '../entities/facture-settings.entity';

export interface ClientInfoPdf {
  nom: string;
  adresse: string | null;
  siret: string | null;
}

export interface GenererFacturePdfInput {
  facture: FactureEntity;
  lignes: LigneFactureEntity[];
  settings: FactureSettingsEntity;
  client: ClientInfoPdf;
  dateEcheance: string | null;
}

@Injectable()
export class FacturePdfExportService {
  async genererPDF(input: GenererFacturePdfInput): Promise<Buffer> {
    const { facture, lignes, settings, client, dateEcheance } = input;
    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    const buffers: Buffer[] = [];

    doc.on('data', (chunk: Buffer) => buffers.push(chunk));

    const isBrouillon = facture.estBrouillon();

    // --- Watermark BROUILLON ---
    if (isBrouillon) {
      doc.save();
      doc.rotate(45, { origin: [300, 400] });
      doc.fontSize(60).fillOpacity(0.15).text('BROUILLON', 100, 400);
      doc.restore();
      doc.fillOpacity(1);
    }

    // --- En-tete societe ---
    this.renderHeader(doc, settings);

    // --- Titre ---
    doc.moveDown(1.5);
    const titre = isBrouillon ? 'FACTURE - BROUILLON' : 'FACTURE';
    doc.fontSize(18).font('Helvetica-Bold').text(titre, { align: 'center' });
    doc.moveDown(0.5);

    doc.fontSize(11).font('Helvetica');
    if (facture.numero) {
      doc.text(`Numero: ${facture.numero}`, { align: 'center' });
    }
    const dateEmission = facture.dateEmission instanceof Date
      ? facture.dateEmission.toLocaleDateString('fr-FR')
      : String(facture.dateEmission);
    doc.text(`Date d'emission: ${dateEmission}`, { align: 'center' });
    if (dateEcheance) {
      doc.text(`Date d'echeance: ${dateEcheance}`, { align: 'center' });
    }

    // --- Bloc client ---
    doc.moveDown(1);
    this.renderClientBlock(doc, client);

    // --- Tableau lignes ---
    doc.moveDown(1);
    this.renderLignesTable(doc, lignes);

    // --- Totaux ---
    doc.moveDown(1);
    this.renderTotaux(doc, facture, lignes);

    // --- Mentions legales ---
    doc.moveDown(2);
    this.renderMentionsLegales(doc, settings);

    // --- Pied de page ---
    this.renderFooter(doc, settings);

    doc.end();

    return await new Promise<Buffer>((resolve, reject) => {
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);
    });
  }

  calculerHashSHA256(buffer: Buffer): string {
    return createHash('sha256').update(buffer).digest('hex');
  }

  // ─── Private rendering methods ────────────────────────────────────────

  private renderHeader(doc: PDFKit.PDFDocument, settings: FactureSettingsEntity): void {
    const startY = doc.y;

    // Logo
    if (settings.showLogo && settings.logoBase64 && settings.logoMimeType) {
      try {
        const logoBuffer = Buffer.from(settings.logoBase64, 'base64');
        doc.image(logoBuffer, 40, startY, { width: 80 });
      } catch {
        // Logo decode failed — skip silently
      }
    }

    const textX = settings.showLogo && settings.logoBase64 ? 140 : 40;

    // Company name
    if (settings.companyName) {
      doc.fontSize(20).font('Helvetica-Bold').text(settings.companyName, textX, startY);
    }
    doc.fontSize(9).font('Helvetica');
    if (settings.companyAddress) {
      doc.text(settings.companyAddress, textX, doc.y + 2);
    }
    if (settings.companyPhone) {
      doc.text(`Tel: ${settings.companyPhone}`, textX);
    }
    if (settings.companyEmail) {
      doc.text(`Email: ${settings.companyEmail}`, textX);
    }

    // Legal identifiers
    const legalParts: string[] = [];
    if (settings.companySiret) legalParts.push(`SIRET: ${settings.companySiret}`);
    if (settings.companyTvaNumber) legalParts.push(`TVA: ${settings.companyTvaNumber}`);
    if (settings.companyRcs) legalParts.push(`RCS: ${settings.companyRcs}`);
    if (settings.companyCapital) legalParts.push(`Capital: ${settings.companyCapital}`);
    if (legalParts.length > 0) {
      doc.text(legalParts.join(' | '), textX);
    }
  }

  private renderClientBlock(doc: PDFKit.PDFDocument, client: ClientInfoPdf): void {
    const blockX = 320;
    const blockWidth = 220;
    const startY = doc.y;

    // Draw border
    doc.rect(blockX - 5, startY - 5, blockWidth + 10, 70).stroke();

    doc.fontSize(10).font('Helvetica-Bold').text('Client', blockX, startY);
    doc.fontSize(10).font('Helvetica');
    doc.text(client.nom, blockX, doc.y + 2, { width: blockWidth });
    if (client.adresse) {
      doc.text(client.adresse, blockX, doc.y, { width: blockWidth });
    }
    if (client.siret) {
      doc.text(`SIRET: ${client.siret}`, blockX, doc.y, { width: blockWidth });
    }

    // Ensure cursor moves past the block
    doc.y = Math.max(doc.y, startY + 70);
  }

  private renderLignesTable(doc: PDFKit.PDFDocument, lignes: LigneFactureEntity[]): void {
    // Column layout
    const colX = { desc: 40, qte: 280, prixHT: 330, tva: 410, montantHT: 470 };
    const tableWidth = 515;

    // Header row
    const headerY = doc.y;
    doc.rect(40, headerY - 2, tableWidth, 18).fill('#f0f0f0');
    doc.fillColor('#000000');
    doc.fontSize(9).font('Helvetica-Bold');
    doc.text('Description', colX.desc, headerY, { width: 230 });
    doc.text('Qte', colX.qte, headerY, { width: 40, align: 'right' });
    doc.text('Prix unit. HT', colX.prixHT, headerY, { width: 70, align: 'right' });
    doc.text('TVA %', colX.tva, headerY, { width: 50, align: 'right' });
    doc.text('Montant HT', colX.montantHT, headerY, { width: 80, align: 'right' });

    doc.font('Helvetica').fontSize(9);
    let y = headerY + 22;

    const sortedLignes = [...lignes].sort((a, b) => a.ordreAffichage - b.ordreAffichage);

    for (const ligne of sortedLignes) {
      // Pagination
      if (y > 700) {
        doc.addPage();
        y = 40;
      }

      const desc = ligne.description || `Produit ${ligne.produitId}`;
      doc.text(desc, colX.desc, y, { width: 230 });
      doc.text(String(ligne.quantite), colX.qte, y, { width: 40, align: 'right' });
      doc.text(this.formatMontant(Number(ligne.prixUnitaire)), colX.prixHT, y, {
        width: 70,
        align: 'right',
      });
      doc.text(`${Number(ligne.tauxTVA).toFixed(1)}%`, colX.tva, y, {
        width: 50,
        align: 'right',
      });
      doc.text(this.formatMontant(Number(ligne.montantHT)), colX.montantHT, y, {
        width: 80,
        align: 'right',
      });

      y += 18;
    }

    // Separator line
    doc.moveTo(40, y + 2).lineTo(40 + tableWidth, y + 2).stroke();
    doc.y = y + 6;
  }

  private renderTotaux(
    doc: PDFKit.PDFDocument,
    facture: FactureEntity,
    lignes: LigneFactureEntity[],
  ): void {
    const rightX = 400;
    const valueX = 470;
    const valueW = 85;

    const totalTVA = lignes.reduce((sum, l) => sum + Number(l.montantTVA || 0), 0);

    doc.fontSize(10).font('Helvetica');
    doc.text('Total HT:', rightX, doc.y, { width: 65, align: 'right' });
    doc.text(`${this.formatMontant(Number(facture.montantHT))} EUR`, valueX, doc.y - doc.currentLineHeight(), {
      width: valueW,
      align: 'right',
    });

    doc.moveDown(0.3);
    doc.text('Total TVA:', rightX, doc.y, { width: 65, align: 'right' });
    doc.text(`${this.formatMontant(totalTVA)} EUR`, valueX, doc.y - doc.currentLineHeight(), {
      width: valueW,
      align: 'right',
    });

    doc.moveDown(0.5);
    doc.fontSize(13).font('Helvetica-Bold');
    doc.text('Total TTC:', rightX, doc.y, { width: 65, align: 'right' });
    doc.text(`${this.formatMontant(Number(facture.montantTTC))} EUR`, valueX, doc.y - doc.currentLineHeight(), {
      width: valueW,
      align: 'right',
    });

    doc.font('Helvetica').fontSize(10);
  }

  private renderMentionsLegales(doc: PDFKit.PDFDocument, settings: FactureSettingsEntity): void {
    doc.fontSize(8).font('Helvetica').fillColor('#555555');

    const paymentTerms = settings.paymentTerms || 'Paiement a 30 jours';
    doc.text(`Conditions de paiement: ${paymentTerms}`, 40, doc.y, { width: 515 });

    doc.text(
      'En cas de retard de paiement, une penalite de 3 fois le taux d\'interet legal sera appliquee (taux BCE + 10 points).',
      40,
      doc.y + 2,
      { width: 515 },
    );

    doc.text(
      'Indemnite forfaitaire pour frais de recouvrement : 40,00 EUR',
      40,
      doc.y + 2,
      { width: 515 },
    );

    if (settings.legalMentions) {
      doc.text(settings.legalMentions, 40, doc.y + 4, { width: 515 });
    }

    doc.fillColor('#000000');
  }

  private renderFooter(doc: PDFKit.PDFDocument, settings: FactureSettingsEntity): void {
    const footerY = 760;

    doc.fontSize(8).font('Helvetica').fillColor('#555555');

    if (settings.hasBankDetails()) {
      const bankParts: string[] = [];
      if (settings.iban) bankParts.push(`IBAN: ${settings.iban}`);
      if (settings.bic) bankParts.push(`BIC: ${settings.bic}`);
      if (settings.bankName) bankParts.push(`Banque: ${settings.bankName}`);
      doc.text(bankParts.join(' | '), 40, footerY, { width: 515, align: 'center' });
    }

    if (settings.footerText) {
      const bankOffset = settings.hasBankDetails() ? 12 : 0;
      doc.text(settings.footerText, 40, footerY + bankOffset, { width: 515, align: 'center' });
    }

    doc.fillColor('#000000');
  }

  private formatMontant(value: number): string {
    return value.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  }
}
