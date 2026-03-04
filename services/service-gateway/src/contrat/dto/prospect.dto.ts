import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean, IsDateString, IsEmail, IsEnum, IsNotEmpty,
  IsOptional, IsString, ValidateNested,
} from 'class-validator';
import { Civilite, CspNeoliane, Profession, RegimeSocial } from '../enums';
import { AdresseDto } from './adresse.dto';

export class ProspectDto {
  @ApiProperty({ description: 'Nom de famille', example: 'Dupont' })
  @IsString()
  @IsNotEmpty()
  nom: string;

  @ApiProperty({ description: 'Prénom', example: 'Jean' })
  @IsString()
  @IsNotEmpty()
  prenom: string;

  @ApiProperty({ description: 'Civilité', example: 'M', enum: Civilite, enumName: 'Civilite' })
  @IsEnum(Civilite)
  civilite: Civilite;

  @ApiPropertyOptional({ description: 'Adresse email (optionnel)', example: 'jean.dupont@mail.com', format: 'email' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ description: 'Numéro de téléphone (unique côté WinLead+)', example: '+33612345678' })
  @IsString()
  @IsNotEmpty()
  telephone: string;

  @ApiPropertyOptional({ description: 'Date de naissance', example: '1985-03-15T00:00:00.000Z', format: 'date-time' })
  @IsOptional()
  @IsDateString()
  date_naissance?: string;

  @ApiPropertyOptional({ description: 'Lieu de naissance', example: 'Lyon' })
  @IsOptional()
  @IsString()
  lieu_naissance?: string;

  @ApiPropertyOptional({ description: 'Code postal de naissance', example: '69000' })
  @IsOptional()
  @IsString()
  code_postal_naissance?: string;

  @ApiPropertyOptional({ description: 'Pays de naissance', example: 'FR' })
  @IsOptional()
  @IsString()
  pays_naissance?: string;

  @ApiPropertyOptional({ description: 'Catégorie socio-professionnelle Néoliane', example: 'SALARIE_59_ANS_OU_MOINS', enum: CspNeoliane, enumName: 'CspNeoliane' })
  @IsOptional()
  @IsEnum(CspNeoliane)
  csp?: CspNeoliane;

  @ApiPropertyOptional({ description: 'Numéro de sécurité sociale', example: '1850375123456' })
  @IsOptional()
  @IsString()
  numss?: string;

  @ApiPropertyOptional({ description: 'Numéro organisme de sécurité sociale', example: '012345' })
  @IsOptional()
  @IsString()
  numorganisme?: string;

  @ApiPropertyOptional({ description: 'Régime social', example: 'SALARIE', enum: RegimeSocial, enumName: 'RegimeSocial' })
  @IsOptional()
  @IsEnum(RegimeSocial)
  regime_social?: RegimeSocial;

  @ApiPropertyOptional({ description: 'Profession', example: 'CADRE_PROFESSION_INTELLECTUELLE', enum: Profession, enumName: 'Profession' })
  @IsOptional()
  @IsEnum(Profession)
  profession?: Profession;

  @ApiPropertyOptional({ description: 'Personne politiquement exposée', example: false })
  @IsOptional()
  @IsBoolean()
  is_politically_exposed?: boolean;

  @ApiPropertyOptional({ description: "Étape dans le tunnel WinLead+", example: 'SIGNE' })
  @IsOptional()
  @IsString()
  etape_courante?: string;

  @ApiPropertyOptional({ description: 'Statut prospect', example: 'Signe' })
  @IsOptional()
  @IsString()
  statut_prospect?: string;

  @ApiProperty({ description: 'Adresse postale', type: () => AdresseDto })
  @ValidateNested()
  @Type(() => AdresseDto)
  adresse: AdresseDto;

  @ApiProperty({ description: 'Consentement RGPD traitement des données', example: true })
  @IsBoolean()
  consentement_rgpd_traitement: boolean;

  @ApiPropertyOptional({ description: 'Consentement RGPD communications commerciales', example: false })
  @IsOptional()
  @IsBoolean()
  consentement_rgpd_commercial?: boolean;

  @ApiPropertyOptional({ description: 'Note libre', example: 'RAS' })
  @IsOptional()
  @IsString()
  note?: string;
}
