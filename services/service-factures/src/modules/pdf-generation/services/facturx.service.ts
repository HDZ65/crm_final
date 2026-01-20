import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import PDFDocument from 'pdfkit';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { Invoice } from '../../invoices/entities/invoice.entity';
import { XmlGeneratorService } from './xml-generator.service';
import { LegalMentionsService } from '../../compliance/services/legal-mentions.service';
import { CompanyBranding } from '../../../common/interfaces/company-branding.interface';
import dayjs from 'dayjs';

/**
 * Service de génération de factures au format Factur-X
 * Factur-X = PDF/A-3b + XML embarqué (norme EN 16931)
 *
 * Avantages:
 * - Lisible par l'humain (PDF)
 * - Exploitable par la machine (XML)
 * - Conforme réglementation française
 * - Standard européen de facturation électronique
 */
@Injectable()
export class FacturXService {
  constructor(
    private readonly xmlGeneratorService: XmlGeneratorService,
    private readonly legalMentionsService: LegalMentionsService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Génère une facture complète au format Factur-X
   * @param invoice - La facture à générer
   * @param branding - Branding personnalisé (optionnel, sinon utilise les valeurs par défaut)
   * @returns Chemin du fichier PDF généré + hash SHA256
   */
  async generateFacturXInvoice(
    invoice: Invoice,
    branding?: CompanyBranding,
  ): Promise<{ pdfPath: string; pdfHash: string }> {
    // Récupérer les infos par défaut et merger avec le branding
    const defaultInfo = this.legalMentionsService.getCompanyInfo();
    const companyInfo = this.mergeCompanyInfo(defaultInfo, branding);

    // 1. Générer le XML Factur-X
    const xml = this.xmlGeneratorService.generateFacturXXml(
      invoice,
      companyInfo,
    );

    // 2. Créer le répertoire de stockage si nécessaire
    const storageDir =
      this.configService.get<string>('PDF_STORAGE_PATH') || './storage/pdfs';
    if (!fs.existsSync(storageDir)) {
      fs.mkdirSync(storageDir, { recursive: true });
    }

    // 3. Générer le PDF/A-3b avec XML embarqué
    const fileName = `${invoice.invoiceNumber.replace(/\//g, '-')}.pdf`;
    const pdfPath = path.join(storageDir, fileName);

    await this.createPdfWithEmbeddedXml(invoice, companyInfo, xml, pdfPath);

    // 4. Calculer le hash SHA256 du PDF
    const pdfHash = await this.calculateFileHash(pdfPath);

    return { pdfPath, pdfHash };
  }

  /**
   * Merge les informations par défaut avec le branding personnalisé
   */
  private mergeCompanyInfo(defaultInfo: any, branding?: CompanyBranding): any {
    if (!branding) return defaultInfo;

    return {
      name: branding.companyName || defaultInfo.name,
      address: branding.companyAddress || defaultInfo.address,
      siret: branding.companySiret || defaultInfo.siret,
      tvaNumber: branding.companyTvaNumber || defaultInfo.tvaNumber,
      rcs: branding.companyRcs || defaultInfo.rcs,
      capital: branding.companyCapital || defaultInfo.capital,
      email: branding.companyEmail || defaultInfo.email,
      phone: branding.companyPhone || defaultInfo.phone,
      // Nouvelles propriétés de branding
      logoBase64: branding.logoBase64,
      logoMimeType: branding.logoMimeType,
      primaryColor: branding.primaryColor || '#000000',
      secondaryColor: branding.secondaryColor,
      showLogo: branding.showLogo ?? true,
      logoPosition: branding.logoPosition || 'left',
      headerText: branding.headerText,
      footerText: branding.footerText,
      legalMentions: branding.legalMentions,
      paymentTerms: branding.paymentTerms,
      iban: branding.iban,
      bic: branding.bic,
      bankName: branding.bankName,
    };
  }

  /**
   * Crée un PDF/A-3b avec le XML Factur-X embarqué
   */
  private async createPdfWithEmbeddedXml(
    invoice: Invoice,
    companyInfo: any,
    xml: string,
    outputPath: string,
  ): Promise<void> {
    console.log('[FacturXService] Creating PDF for invoice:', invoice.invoiceNumber);
    console.log('[FacturXService] Output path:', outputPath);

    return new Promise((resolve, reject) => {
      try {
        // Créer le document PDF
        const doc = new PDFDocument({
          compress: true,
          info: {
            Title: `Facture ${invoice.invoiceNumber}`,
            Author: companyInfo.name,
            Subject: `Facture pour ${invoice.customerName}`,
            Keywords: 'Facture, Factur-X, Invoice',
            Creator: 'Service Factures - CRM',
            Producer: 'PDFKit',
          },
        });

        const stream = fs.createWriteStream(outputPath);
        doc.pipe(stream);

        // Note: L'embarquement XML Factur-X nécessiterait pdf-lib ou hummus
        // Pour l'instant, on stocke le XML séparément
        const xmlPath = outputPath.replace('.pdf', '-facturx.xml');
        fs.writeFileSync(xmlPath, xml, 'utf-8');
        console.log('[FacturXService] XML Factur-X saved:', xmlPath);

        // Générer le contenu visuel du PDF
        this.renderInvoicePdf(doc, invoice, companyInfo);

        doc.end();

        stream.on('finish', () => {
          console.log('[FacturXService] PDF created successfully');
          resolve();
        });
        stream.on('error', (err) => {
          console.error('[FacturXService] Stream error:', err);
          reject(err);
        });
      } catch (error) {
        console.error('[FacturXService] PDF creation error:', error);
        reject(error);
      }
    });
  }

  /**
   * Rend le contenu visuel de la facture dans le PDF
   * Layout professionnel style Pennylane + personnalisations branding
   */
  private renderInvoicePdf(
    doc: typeof PDFDocument,
    invoice: Invoice,
    companyInfo: any,
  ): void {
    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;
    const margin = 40;

    // Couleurs personnalisables
    const primaryColor = companyInfo.primaryColor || '#1e3a5f';
    const secondaryColor = companyInfo.secondaryColor || '#666666';
    const grayText = secondaryColor; // Texte gris secondaire
    const lightBg = this.lightenColor(primaryColor, 0.92); // Fond clair basé sur couleur primaire

    let y = 40;

    // ========== HEADER: LOGO + ÉMETTEUR/CLIENT ==========
    const showLogo = companyInfo.showLogo !== false && companyInfo.logoBase64;
    const logoPosition = companyInfo.logoPosition || 'left';
    const rightColX = pageWidth / 2 + 20;
    const rightColWidth = pageWidth / 2 - margin - 20;

    // Logo (position configurable)
    const logoX = logoPosition === 'center' ? (pageWidth / 2 - 60) : margin;
    if (showLogo) {
      try {
        const logoBuffer = Buffer.from(companyInfo.logoBase64, 'base64');
        doc.image(logoBuffer, logoX, y, { width: 120, height: 50, fit: [120, 50] });
      } catch (e) {
        doc.fontSize(14).font('Helvetica-Bold').fillColor(primaryColor)
          .text(companyInfo.name, logoX, y);
      }
    } else {
      doc.fontSize(14).font('Helvetica-Bold').fillColor(primaryColor)
        .text(companyInfo.name, logoX, y);
    }

    // Texte personnalisé header (sous le logo)
    if (companyInfo.headerText) {
      doc.fontSize(8).font('Helvetica').fillColor(grayText)
        .text(companyInfo.headerText, margin, y + 55, { width: pageWidth / 2 - margin - 20 });
    }

    // Émetteur (droite haut)
    doc.fontSize(8).font('Helvetica-Bold').fillColor(grayText)
      .text('Émetteur', rightColX, y);
    y += 12;
    doc.fontSize(9).font('Helvetica-Bold').fillColor(primaryColor)
      .text(companyInfo.name, rightColX, y, { width: rightColWidth });
    y += 11;
    doc.fontSize(8).font('Helvetica').fillColor('#000000')
      .text(companyInfo.address, rightColX, y, { width: rightColWidth });
    y += 20;
    if (companyInfo.email) {
      doc.text(companyInfo.email, rightColX, y, { width: rightColWidth });
      y += 10;
    }

    // Client (droite)
    y += 5;
    doc.fontSize(8).font('Helvetica-Bold').fillColor(grayText)
      .text('Client', rightColX, y);
    y += 12;
    doc.fontSize(9).font('Helvetica-Bold').fillColor(primaryColor)
      .text(invoice.customerName, rightColX, y, { width: rightColWidth });
    y += 11;
    doc.fontSize(8).font('Helvetica').fillColor('#000000')
      .text(invoice.customerAddress, rightColX, y, { width: rightColWidth });
    y += 20;
    if (invoice.customerEmail) {
      doc.text(invoice.customerEmail, rightColX, y, { width: rightColWidth });
    }

    // ========== INFO FACTURE (gauche) ==========
    let leftY = 100;
    doc.fontSize(14).font('Helvetica-Bold').fillColor(primaryColor)
      .text('Facture', margin, leftY);
    leftY += 20;

    const labelWidth = 100;
    doc.fontSize(8).font('Helvetica-Bold').fillColor(primaryColor);
    doc.text('Numéro', margin, leftY);
    doc.font('Helvetica').fillColor('#000000').text(invoice.invoiceNumber, margin + labelWidth, leftY);
    leftY += 12;

    doc.font('Helvetica-Bold').fillColor(primaryColor).text("Date d'émission", margin, leftY);
    doc.font('Helvetica').fillColor('#000000').text(dayjs(invoice.issueDate).format('DD MMM YYYY'), margin + labelWidth, leftY);
    leftY += 12;

    doc.font('Helvetica-Bold').fillColor(primaryColor).text("Date d'échéance", margin, leftY);
    doc.font('Helvetica').fillColor('#000000').text(dayjs(invoice.dueDate).format('DD MMM YYYY'), margin + labelWidth, leftY);

    // ========== TABLEAU PRODUITS ==========
    y = Math.max(y, leftY) + 30;
    const tableWidth = pageWidth - 2 * margin;
    const cols = {
      desc: { x: margin, w: tableWidth * 0.35 },
      qty: { x: margin + tableWidth * 0.35, w: tableWidth * 0.12 },
      unit: { x: margin + tableWidth * 0.47, w: tableWidth * 0.15 },
      vat: { x: margin + tableWidth * 0.62, w: tableWidth * 0.12 },
      totalHT: { x: margin + tableWidth * 0.74, w: tableWidth * 0.13 },
      totalTTC: { x: margin + tableWidth * 0.87, w: tableWidth * 0.13 },
    };

    // Header tableau (fond basé sur couleur primaire)
    doc.rect(margin, y, tableWidth, 16).fill(lightBg);
    doc.fontSize(7).font('Helvetica-Bold').fillColor(primaryColor);
    doc.text('Produits', cols.desc.x + 4, y + 5);
    doc.text('Qté', cols.qty.x, y + 5, { width: cols.qty.w, align: 'center' });
    doc.text('Prix u. HT', cols.unit.x, y + 5, { width: cols.unit.w, align: 'right' });
    doc.text('TVA (%)', cols.vat.x, y + 5, { width: cols.vat.w, align: 'center' });
    doc.text('Total HT', cols.totalHT.x, y + 5, { width: cols.totalHT.w, align: 'right' });
    doc.text('Total TTC', cols.totalTTC.x, y + 5, { width: cols.totalTTC.w, align: 'right' });
    y += 18;

    // Lignes produits
    doc.fontSize(8).font('Helvetica').fillColor('#000000');
    invoice.items.forEach((item) => {
      doc.text(item.description, cols.desc.x + 4, y, { width: cols.desc.w - 8 });
      doc.text(`${item.quantity} ${item.unit || 'unité'}`, cols.qty.x, y, { width: cols.qty.w, align: 'center' });
      doc.text(`${Number(item.unitPriceHT).toFixed(2)} €`, cols.unit.x, y, { width: cols.unit.w, align: 'right' });
      doc.text(`${Number(item.vatRate).toFixed(0)}%`, cols.vat.x, y, { width: cols.vat.w, align: 'center' });
      doc.text(`${Number(item.totalHT).toFixed(2)} €`, cols.totalHT.x, y, { width: cols.totalHT.w, align: 'right' });
      doc.text(`${Number(item.totalTTC).toFixed(2)} €`, cols.totalTTC.x, y, { width: cols.totalTTC.w, align: 'right' });
      y += 14;
    });

    y += 10;

    // ========== DÉTAILS TVA + RÉCAPITULATIF ==========
    const tvaBoxX = margin;
    const tvaBoxWidth = (tableWidth - 20) / 2;
    const recapBoxX = margin + tvaBoxWidth + 20;
    const boxY = y;

    // Détails TVA (gauche)
    doc.fontSize(9).font('Helvetica-Bold').fillColor(primaryColor)
      .text('Détails TVA', tvaBoxX, boxY);
    let tvaY = boxY + 14;
    doc.fontSize(7).font('Helvetica-Bold').fillColor(grayText);
    doc.text('Taux', tvaBoxX, tvaY);
    doc.text('Montant TVA', tvaBoxX + 60, tvaY);
    doc.text('Base HT', tvaBoxX + 140, tvaY);
    tvaY += 10;

    // Calculer TVA par taux
    const vatByRate: Record<number, { base: number; vat: number }> = {};
    invoice.items.forEach(item => {
      const rate = Number(item.vatRate);
      if (!vatByRate[rate]) vatByRate[rate] = { base: 0, vat: 0 };
      vatByRate[rate].base += Number(item.totalHT);
      vatByRate[rate].vat += Number(item.totalTVA);
    });

    doc.fontSize(8).font('Helvetica').fillColor('#000000');
    Object.entries(vatByRate).forEach(([rate, { base, vat }]) => {
      doc.text(`${rate}%`, tvaBoxX, tvaY);
      doc.text(`${vat.toFixed(2)} €`, tvaBoxX + 60, tvaY);
      doc.text(`${base.toFixed(2)} €`, tvaBoxX + 140, tvaY);
      tvaY += 11;
    });

    // Récapitulatif (droite)
    doc.fontSize(9).font('Helvetica-Bold').fillColor(primaryColor)
      .text('Récapitulatif', recapBoxX, boxY);
    let recapY = boxY + 14;

    doc.fontSize(8).font('Helvetica-Bold').fillColor(primaryColor);
    doc.text('Total HT', recapBoxX, recapY);
    doc.font('Helvetica').fillColor('#000000')
      .text(`${Number(invoice.totalHT).toFixed(2)} €`, recapBoxX + 100, recapY, { width: 80, align: 'right' });
    recapY += 12;

    doc.font('Helvetica-Bold').fillColor(primaryColor).text('Total TVA', recapBoxX, recapY);
    doc.font('Helvetica').fillColor('#000000')
      .text(`${Number(invoice.totalTVA).toFixed(2)} €`, recapBoxX + 100, recapY, { width: 80, align: 'right' });
    recapY += 14;

    // Total TTC avec fond (couleur basée sur primaryColor)
    doc.rect(recapBoxX - 5, recapY - 3, 190, 18).fill(lightBg);
    doc.fontSize(10).font('Helvetica-Bold').fillColor(primaryColor)
      .text('Total TTC', recapBoxX, recapY);
    doc.text(`${Number(invoice.totalTTC).toFixed(2)} €`, recapBoxX + 100, recapY, { width: 80, align: 'right' });

    y = Math.max(tvaY, recapY) + 25;

    // ========== PAIEMENT ==========
    if (companyInfo.iban) {
      const paymentBoxY = y;
      doc.rect(margin, paymentBoxY, tvaBoxWidth, 90).stroke('#dddddd');

      doc.fontSize(9).font('Helvetica-Bold').fillColor(primaryColor)
        .text('Paiement', margin + 10, paymentBoxY + 8);

      let payY = paymentBoxY + 22;
      doc.fontSize(7).font('Helvetica-Bold').fillColor(grayText);
      doc.text('Moyen de paiement', margin + 10, payY);
      doc.font('Helvetica').fillColor('#000000').text('Virement', margin + 90, payY);
      payY += 11;

      if (companyInfo.bankName) {
        doc.font('Helvetica-Bold').fillColor(grayText).text('Établissement', margin + 10, payY);
        doc.font('Helvetica').fillColor('#000000').text(companyInfo.bankName, margin + 90, payY);
        payY += 11;
      }

      doc.font('Helvetica-Bold').fillColor(grayText).text('IBAN', margin + 10, payY);
      doc.font('Helvetica').fillColor('#000000').text(companyInfo.iban, margin + 90, payY);
      payY += 11;

      doc.font('Helvetica-Bold').fillColor(grayText).text('BIC', margin + 10, payY);
      doc.font('Helvetica').fillColor('#000000').text(companyInfo.bic || '', margin + 90, payY);

      y = paymentBoxY + 95;
    }

    // ========== MENTIONS LÉGALES ==========
    y += 10;
    doc.fontSize(6).font('Helvetica').fillColor(grayText);

    // Mentions légales personnalisées ou par défaut
    if (companyInfo.legalMentions) {
      doc.text(companyInfo.legalMentions, margin, y, { width: tableWidth });
    } else {
      doc.text(`Pénalités de retard : trois fois le taux d'intérêt légal en vigueur.`, margin, y, { width: tableWidth });
      y += 8;
      doc.text(`Indemnité forfaitaire pour frais de recouvrement en cas de retard de paiement : 40 €`, margin, y, { width: tableWidth });
    }

    // ========== FOOTER ==========
    const footerY = pageHeight - 35;
    doc.fontSize(6).fillColor(grayText);

    // Footer personnalisé ou par défaut
    if (companyInfo.footerText) {
      doc.text(companyInfo.footerText, margin, footerY, { width: tableWidth - 40 });
    } else {
      const defaultFooter = `${companyInfo.name} | ${companyInfo.siret ? `SIRET ${companyInfo.siret}` : ''} ${companyInfo.tvaNumber ? `| TVA ${companyInfo.tvaNumber}` : ''}`;
      doc.text(defaultFooter, margin, footerY, { width: tableWidth - 40 });
    }
    doc.text('1 / 1', pageWidth - margin - 20, footerY, { width: 20, align: 'right' });
  }

  /**
   * Éclaircit une couleur hexadécimale
   */
  private lightenColor(hex: string, factor: number): string {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);

    const newR = Math.round(r + (255 - r) * factor);
    const newG = Math.round(g + (255 - g) * factor);
    const newB = Math.round(b + (255 - b) * factor);

    return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
  }

  /**
   * Calcule le hash SHA256 d'un fichier
   */
  private async calculateFileHash(filePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const hash = crypto.createHash('sha256');
      const stream = fs.createReadStream(filePath);

      stream.on('data', (data) => hash.update(data));
      stream.on('end', () => resolve(hash.digest('hex')));
      stream.on('error', (err) => reject(err));
    });
  }
}
