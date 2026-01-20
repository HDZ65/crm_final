import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class FactureSettingsResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  societeId: string;

  // Branding
  @ApiPropertyOptional()
  logoBase64?: string | null;

  @ApiPropertyOptional()
  logoMimeType?: string | null;

  @ApiProperty()
  primaryColor: string;

  @ApiPropertyOptional()
  secondaryColor?: string | null;

  // Informations entreprise
  @ApiPropertyOptional()
  companyName?: string | null;

  @ApiPropertyOptional()
  companyAddress?: string | null;

  @ApiPropertyOptional()
  companyPhone?: string | null;

  @ApiPropertyOptional()
  companyEmail?: string | null;

  @ApiPropertyOptional()
  companySiret?: string | null;

  @ApiPropertyOptional()
  companyTvaNumber?: string | null;

  @ApiPropertyOptional()
  companyRcs?: string | null;

  @ApiPropertyOptional()
  companyCapital?: string | null;

  // Coordonnées bancaires
  @ApiPropertyOptional()
  iban?: string | null;

  @ApiPropertyOptional()
  bic?: string | null;

  @ApiPropertyOptional()
  bankName?: string | null;

  // Textes personnalisés
  @ApiPropertyOptional()
  headerText?: string | null;

  @ApiPropertyOptional()
  footerText?: string | null;

  @ApiPropertyOptional()
  legalMentions?: string | null;

  @ApiPropertyOptional()
  paymentTerms?: string | null;

  // Paramètres
  @ApiPropertyOptional()
  invoicePrefix?: string | null;

  @ApiProperty()
  showLogo: boolean;

  @ApiProperty()
  logoPosition: 'left' | 'center' | 'right';

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  // Computed
  @ApiProperty({ description: 'Indique si un logo est configuré' })
  hasLogo: boolean;

  @ApiPropertyOptional({ description: 'Data URL du logo pour affichage direct' })
  logoDataUrl?: string | null;
}
