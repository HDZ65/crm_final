/**
 * Interface pour le branding de la société
 * Utilisé pour personnaliser les factures PDF
 */
export interface CompanyBranding {
  // Branding visuel
  logoBase64?: string;
  logoMimeType?: string;
  primaryColor?: string;
  secondaryColor?: string;

  // Informations entreprise
  companyName?: string;
  companyAddress?: string;
  companyPhone?: string;
  companyEmail?: string;
  companySiret?: string;
  companyTvaNumber?: string;
  companyRcs?: string;
  companyCapital?: string;

  // Coordonnées bancaires
  iban?: string;
  bic?: string;
  bankName?: string;

  // Textes personnalisés
  headerText?: string;
  footerText?: string;
  legalMentions?: string;
  paymentTerms?: string;

  // Paramètres
  invoicePrefix?: string;
  showLogo?: boolean;
  logoPosition?: 'left' | 'center' | 'right';
}

/**
 * Convertit le branding gRPC en interface interne
 */
export function toCompanyBranding(grpcBranding: Partial<CompanyBranding> | undefined | null): CompanyBranding | undefined {
  if (!grpcBranding) return undefined;

  return {
    logoBase64: grpcBranding.logoBase64 || undefined,
    logoMimeType: grpcBranding.logoMimeType || undefined,
    primaryColor: grpcBranding.primaryColor || undefined,
    secondaryColor: grpcBranding.secondaryColor || undefined,
    companyName: grpcBranding.companyName || undefined,
    companyAddress: grpcBranding.companyAddress || undefined,
    companyPhone: grpcBranding.companyPhone || undefined,
    companyEmail: grpcBranding.companyEmail || undefined,
    companySiret: grpcBranding.companySiret || undefined,
    companyTvaNumber: grpcBranding.companyTvaNumber || undefined,
    companyRcs: grpcBranding.companyRcs || undefined,
    companyCapital: grpcBranding.companyCapital || undefined,
    iban: grpcBranding.iban || undefined,
    bic: grpcBranding.bic || undefined,
    bankName: grpcBranding.bankName || undefined,
    headerText: grpcBranding.headerText || undefined,
    footerText: grpcBranding.footerText || undefined,
    legalMentions: grpcBranding.legalMentions || undefined,
    paymentTerms: grpcBranding.paymentTerms || undefined,
    invoicePrefix: grpcBranding.invoicePrefix || undefined,
    showLogo: grpcBranding.showLogo ?? true,
    logoPosition: grpcBranding.logoPosition || 'left',
  };
}
