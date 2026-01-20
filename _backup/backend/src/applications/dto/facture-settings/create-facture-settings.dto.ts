import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsBoolean,
  IsIn,
  IsUUID,
  MaxLength,
  Matches,
  IsBase64,
} from 'class-validator';

export class CreateFactureSettingsDto {
  @ApiProperty({ description: 'ID de la société' })
  @IsUUID()
  societeId: string;

  // Branding
  @ApiPropertyOptional({ description: 'Logo en base64 (max ~500KB)' })
  @IsOptional()
  @IsString()
  logoBase64?: string;

  @ApiPropertyOptional({ description: 'Type MIME du logo (image/png, image/jpeg)' })
  @IsOptional()
  @IsString()
  @IsIn(['image/png', 'image/jpeg', 'image/jpg'])
  logoMimeType?: string;

  @ApiProperty({ description: 'Couleur principale (#hex)', default: '#000000' })
  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/, { message: 'La couleur doit être au format #RRGGBB' })
  primaryColor: string = '#000000';

  @ApiPropertyOptional({ description: 'Couleur secondaire (#hex)' })
  @IsOptional()
  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/, { message: 'La couleur doit être au format #RRGGBB' })
  secondaryColor?: string;

  // Informations entreprise
  @ApiPropertyOptional({ description: 'Nom de l\'entreprise (override)' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  companyName?: string;

  @ApiPropertyOptional({ description: 'Adresse de l\'entreprise' })
  @IsOptional()
  @IsString()
  companyAddress?: string;

  @ApiPropertyOptional({ description: 'Téléphone' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  companyPhone?: string;

  @ApiPropertyOptional({ description: 'Email' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  companyEmail?: string;

  @ApiPropertyOptional({ description: 'SIRET' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  companySiret?: string;

  @ApiPropertyOptional({ description: 'Numéro TVA' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  companyTvaNumber?: string;

  @ApiPropertyOptional({ description: 'RCS' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  companyRcs?: string;

  @ApiPropertyOptional({ description: 'Capital social' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  companyCapital?: string;

  // Coordonnées bancaires
  @ApiPropertyOptional({ description: 'IBAN' })
  @IsOptional()
  @IsString()
  @MaxLength(34)
  iban?: string;

  @ApiPropertyOptional({ description: 'BIC' })
  @IsOptional()
  @IsString()
  @MaxLength(11)
  bic?: string;

  @ApiPropertyOptional({ description: 'Nom de la banque' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  bankName?: string;

  // Textes personnalisés
  @ApiPropertyOptional({ description: 'Texte en-tête' })
  @IsOptional()
  @IsString()
  headerText?: string;

  @ApiPropertyOptional({ description: 'Texte pied de page' })
  @IsOptional()
  @IsString()
  footerText?: string;

  @ApiPropertyOptional({ description: 'Mentions légales additionnelles' })
  @IsOptional()
  @IsString()
  legalMentions?: string;

  @ApiPropertyOptional({ description: 'Conditions de paiement personnalisées' })
  @IsOptional()
  @IsString()
  paymentTerms?: string;

  // Paramètres
  @ApiPropertyOptional({ description: 'Préfixe numérotation facture (ex: FAC-)' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  invoicePrefix?: string;

  @ApiProperty({ description: 'Afficher le logo', default: true })
  @IsBoolean()
  showLogo: boolean = true;

  @ApiProperty({ description: 'Position du logo', default: 'left' })
  @IsString()
  @IsIn(['left', 'center', 'right'])
  logoPosition: 'left' | 'center' | 'right' = 'left';
}
