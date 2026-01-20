import { BaseEntity } from './base.entity';

export interface FactureSettingsProps {
  id?: string;
  societeId: string;

  // Branding
  logoBase64?: string | null;       // Logo en base64 (PNG, JPG, max ~500KB)
  logoMimeType?: string | null;     // image/png, image/jpeg
  primaryColor: string;             // Couleur principale (#hex)
  secondaryColor?: string | null;   // Couleur secondaire (#hex)

  // Informations entreprise (override de Societe si besoin)
  companyName?: string | null;      // Si différent de raisonSociale
  companyAddress?: string | null;
  companyPhone?: string | null;
  companyEmail?: string | null;
  companySiret?: string | null;
  companyTvaNumber?: string | null;
  companyRcs?: string | null;
  companyCapital?: string | null;

  // Coordonnées bancaires
  iban?: string | null;
  bic?: string | null;
  bankName?: string | null;

  // Textes personnalisés
  headerText?: string | null;       // Texte en-tête
  footerText?: string | null;       // Texte pied de page
  legalMentions?: string | null;    // Mentions légales additionnelles
  paymentTerms?: string | null;     // Conditions de paiement personnalisées

  // Paramètres
  invoicePrefix?: string | null;    // Préfixe numérotation (ex: "FAC-")
  showLogo: boolean;
  logoPosition: 'left' | 'center' | 'right';

  createdAt?: Date;
  updatedAt?: Date;
}

export class FactureSettingsEntity extends BaseEntity {
  societeId: string;

  // Branding
  logoBase64?: string | null;
  logoMimeType?: string | null;
  primaryColor: string;
  secondaryColor?: string | null;

  // Informations entreprise
  companyName?: string | null;
  companyAddress?: string | null;
  companyPhone?: string | null;
  companyEmail?: string | null;
  companySiret?: string | null;
  companyTvaNumber?: string | null;
  companyRcs?: string | null;
  companyCapital?: string | null;

  // Coordonnées bancaires
  iban?: string | null;
  bic?: string | null;
  bankName?: string | null;

  // Textes personnalisés
  headerText?: string | null;
  footerText?: string | null;
  legalMentions?: string | null;
  paymentTerms?: string | null;

  // Paramètres
  invoicePrefix?: string | null;
  showLogo: boolean;
  logoPosition: 'left' | 'center' | 'right';

  constructor(props: FactureSettingsProps) {
    super(props);
    this.societeId = props.societeId;

    this.logoBase64 = props.logoBase64 ?? null;
    this.logoMimeType = props.logoMimeType ?? null;
    this.primaryColor = props.primaryColor;
    this.secondaryColor = props.secondaryColor ?? null;

    this.companyName = props.companyName ?? null;
    this.companyAddress = props.companyAddress ?? null;
    this.companyPhone = props.companyPhone ?? null;
    this.companyEmail = props.companyEmail ?? null;
    this.companySiret = props.companySiret ?? null;
    this.companyTvaNumber = props.companyTvaNumber ?? null;
    this.companyRcs = props.companyRcs ?? null;
    this.companyCapital = props.companyCapital ?? null;

    this.iban = props.iban ?? null;
    this.bic = props.bic ?? null;
    this.bankName = props.bankName ?? null;

    this.headerText = props.headerText ?? null;
    this.footerText = props.footerText ?? null;
    this.legalMentions = props.legalMentions ?? null;
    this.paymentTerms = props.paymentTerms ?? null;

    this.invoicePrefix = props.invoicePrefix ?? null;
    this.showLogo = props.showLogo;
    this.logoPosition = props.logoPosition;
  }

  hasLogo(): boolean {
    return !!(this.logoBase64 && this.logoMimeType);
  }

  hasBankDetails(): boolean {
    return !!(this.iban && this.bic);
  }

  getLogoDataUrl(): string | null {
    if (!this.hasLogo()) return null;
    return `data:${this.logoMimeType};base64,${this.logoBase64}`;
  }
}
