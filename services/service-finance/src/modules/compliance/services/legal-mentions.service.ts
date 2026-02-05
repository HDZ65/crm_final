import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  CompanyInfo,
  MANDATORY_MENTIONS,
  InvoiceValidation,
  REQUIRED_INVOICE_FIELDS,
  REQUIRED_ITEM_FIELDS,
} from '../constants/legal-requirements.constant';
import { Invoice } from '../../invoices/entities/invoice.entity';

/**
 * Service de gestion des mentions légales obligatoires
 * Conformité réglementation française 2025
 */
@Injectable()
export class LegalMentionsService {
  constructor(private readonly configService: ConfigService) {}

  /**
   * Récupère les informations de l'entreprise émettrice
   */
  getCompanyInfo(): CompanyInfo {
    return {
      name: this.configService.get<string>('COMPANY_NAME') || '',
      address: this.configService.get<string>('COMPANY_ADDRESS') || '',
      siret: this.configService.get<string>('COMPANY_SIRET') || '',
      siren: this.configService.get<string>('COMPANY_SIREN') || '',
      tvaNumber: this.configService.get<string>('COMPANY_TVA') || '',
      rcs: this.configService.get<string>('COMPANY_RCS'),
      capital: this.configService.get<number>('COMPANY_CAPITAL'),
      email: this.configService.get<string>('COMPANY_EMAIL') || '',
      phone: this.configService.get<string>('COMPANY_PHONE') || '',
    };
  }

  /**
   * Génère la mention de pénalités de retard
   */
  getLatePaymentPenaltyMention(rate: number): string {
    return MANDATORY_MENTIONS.LATE_PAYMENT_PENALTY.replace(
      '{rate}',
      rate.toString(),
    );
  }

  /**
   * Génère la mention d'indemnité de recouvrement
   */
  getRecoveryIndemnityMention(amount: number): string {
    return MANDATORY_MENTIONS.RECOVERY_INDEMNITY.replace(
      '{amount}',
      amount.toString(),
    );
  }

  /**
   * Génère la mention de délai de paiement
   */
  getPaymentTermsMention(days: number): string {
    return MANDATORY_MENTIONS.PAYMENT_TERMS.replace('{days}', days.toString());
  }

  /**
   * Retourne la mention de garantie légale (pour ventes aux particuliers)
   */
  getLegalWarrantyMention(): string {
    return MANDATORY_MENTIONS.LEGAL_WARRANTY;
  }

  /**
   * Retourne la mention de franchise de TVA (si applicable)
   */
  getTvaFranchiseMention(): string {
    return MANDATORY_MENTIONS.TVA_FRANCHISE;
  }

  /**
   * Génère toutes les mentions légales pour une facture
   */
  generateAllMentions(invoice: Invoice): string[] {
    const mentions: string[] = [];

    // Pénalités de retard (OBLIGATOIRE)
    mentions.push(
      this.getLatePaymentPenaltyMention(invoice.latePaymentInterestRate),
    );

    // Indemnité de recouvrement (OBLIGATOIRE)
    mentions.push(this.getRecoveryIndemnityMention(invoice.recoveryIndemnity));

    // Délai de paiement (OBLIGATOIRE)
    mentions.push(this.getPaymentTermsMention(invoice.paymentTermsDays));

    // Mention TVA spécifique (si renseignée)
    if (invoice.vatMention) {
      mentions.push(invoice.vatMention);
    }

    // Garantie légale (recommandée pour B2C)
    // À activer conditionnellement selon le type de client
    // mentions.push(this.getLegalWarrantyMention());

    return mentions;
  }

  /**
   * Valide qu'une facture contient toutes les mentions obligatoires
   */
  validateInvoiceCompliance(invoice: Invoice): InvoiceValidation {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Vérification des champs obligatoires
    REQUIRED_INVOICE_FIELDS.forEach((field) => {
      if (!invoice[field] || invoice[field] === '') {
        errors.push(`Champ obligatoire manquant: ${field}`);
      }
    });

    // Vérification du numéro de facture unique
    if (!invoice.invoiceNumber || invoice.invoiceNumber.trim() === '') {
      errors.push(
        'Numéro de facture manquant (numérotation séquentielle obligatoire)',
      );
    }

    // Vérification des dates
    if (!invoice.issueDate) {
      errors.push("Date d'émission manquante");
    }

    if (!invoice.deliveryDate) {
      errors.push('Date de livraison/fin de prestation manquante');
    }

    // Vérification des montants
    if (invoice.totalHT <= 0) {
      errors.push('Montant HT invalide');
    }

    if (invoice.totalTTC <= 0) {
      errors.push('Montant TTC invalide');
    }

    // Vérification des lignes de facture
    if (!invoice.items || invoice.items.length === 0) {
      errors.push('Aucune ligne de facture (au moins une ligne requise)');
    } else {
      invoice.items.forEach((item, index) => {
        REQUIRED_ITEM_FIELDS.forEach((field) => {
          if (item[field] === undefined || item[field] === null) {
            errors.push(
              `Ligne ${index + 1}: Champ obligatoire manquant: ${field}`,
            );
          }
        });
      });
    }

    // Vérification des conditions de paiement
    if (!invoice.paymentTermsDays || invoice.paymentTermsDays <= 0) {
      warnings.push('Délai de paiement non défini (défaut: 30 jours)');
    }

    if (invoice.paymentTermsDays > 60) {
      warnings.push(
        'Délai de paiement supérieur à 60 jours (peut nécessiter une justification)',
      );
    }

    // Vérification des pénalités de retard
    if (
      !invoice.latePaymentInterestRate ||
      invoice.latePaymentInterestRate <= 0
    ) {
      errors.push('Taux de pénalité de retard manquant (obligatoire)');
    }

    // Vérification de l'indemnité de recouvrement
    if (!invoice.recoveryIndemnity || invoice.recoveryIndemnity !== 40) {
      warnings.push(
        "Indemnité de recouvrement incorrecte (doit être 40€ selon la loi)",
      );
    }

    // Vérification des informations client
    if (!invoice.customerName || invoice.customerName.trim() === '') {
      errors.push('Nom du client manquant');
    }

    if (!invoice.customerAddress || invoice.customerAddress.trim() === '') {
      errors.push('Adresse du client manquante');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Vérifie si un SIRET est au bon format (14 chiffres)
   */
  validateSiret(siret: string): boolean {
    return /^\d{14}$/.test(siret);
  }

  /**
   * Vérifie si un numéro de TVA français est au bon format
   */
  validateFrenchTvaNumber(tva: string): boolean {
    return /^FR\d{11}$/.test(tva);
  }
}
