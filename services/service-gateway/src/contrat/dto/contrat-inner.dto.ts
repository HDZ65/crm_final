import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray, IsDateString, IsNotEmpty, IsNumber, IsOptional,
  IsString, ValidateNested,
} from 'class-validator';
import { YousignDto } from './yousign.dto';

export class ContratInnerDto {
  @ApiProperty({ description: 'Titre du contrat', example: 'Forfait Protection Plus' })
  @IsString()
  @IsNotEmpty()
  titre: string;

  @ApiPropertyOptional({ description: 'Description du contrat', example: 'Assurance habitation formule 2' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Statut du contrat côté WinLead+', example: 'Signe' })
  @IsOptional()
  @IsString()
  statut?: string;

  @ApiPropertyOptional({ description: 'Type de contrat', example: 'souscription' })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional({ description: 'Mode de signature', example: 'electronic' })
  @IsOptional()
  @IsString()
  signature_mode?: string;

  @ApiPropertyOptional({ description: 'Date de signature', example: '2026-02-28T14:30:00.000Z', format: 'date-time' })
  @IsOptional()
  @IsDateString()
  date_signature?: string;

  @ApiPropertyOptional({ description: 'Date de validation', example: '2026-02-28T15:00:00.000Z', format: 'date-time' })
  @IsOptional()
  @IsDateString()
  date_validation?: string;

  @ApiPropertyOptional({ description: 'Montant TTC', example: 29.90, type: Number })
  @IsOptional()
  @IsNumber()
  montant?: number;

  @ApiPropertyOptional({ description: 'Société/marque fournisseur', example: 'Action Prevoyance' })
  @IsOptional()
  @IsString()
  fournisseur?: string;

  @ApiPropertyOptional({ description: 'URL du PDF signé', example: 'https://storage.yousign.com/xxx/contrat.pdf' })
  @IsOptional()
  @IsString()
  document_url?: string;

  @ApiPropertyOptional({ description: "URL piste d'audit YouSign", example: 'https://storage.yousign.com/xxx/audit-trail.pdf' })
  @IsOptional()
  @IsString()
  audit_trail_url?: string;

  @ApiPropertyOptional({ description: 'URL audio si validation vocale', example: null })
  @IsOptional()
  @IsString()
  voice_validation_audio_url?: string;

  @ApiPropertyOptional({ description: 'IDs des offres Néoliane sélectionnées', example: [101, 202], type: [Number] })
  @IsOptional()
  @IsArray()
  neoliane_offre_ids?: number[];

  @ApiPropertyOptional({ description: 'Données signature YouSign', type: () => YousignDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => YousignDto)
  yousign?: YousignDto;
}
