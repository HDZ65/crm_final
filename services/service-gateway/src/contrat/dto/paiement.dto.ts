import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class PaiementDto {
  @ApiProperty({ description: 'IBAN du compte bancaire', example: 'FR7630006000011234567890189' })
  @IsString()
  @IsNotEmpty()
  iban: string;

  @ApiProperty({ description: 'BIC/SWIFT de la banque', example: 'BNPAFRPP' })
  @IsString()
  @IsNotEmpty()
  bic: string;

  @ApiPropertyOptional({ description: 'Référence mandat SEPA', example: 'RUM-2026-001234' })
  @IsOptional()
  @IsString()
  mandat_sepa?: string;

  @ApiPropertyOptional({ description: 'Date de signature du mandat SEPA', example: '2026-02-28T14:30:00.000Z', format: 'date-time' })
  @IsOptional()
  @IsDateString()
  date_mandat?: string;

  @ApiPropertyOptional({ description: 'Commentaire libre', example: null })
  @IsOptional()
  @IsString()
  commentaire?: string;
}
