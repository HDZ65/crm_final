import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsDateString } from 'class-validator';

export class DashboardFiltersDto {
  @ApiProperty({ description: "ID de l'organisation", required: false })
  @IsOptional()
  @IsString()
  organisationId?: string;

  @ApiProperty({ description: 'ID de la société', required: false })
  @IsOptional()
  @IsString()
  societeId?: string;

  @ApiProperty({ description: 'ID du produit', required: false })
  @IsOptional()
  @IsString()
  produitId?: string;

  @ApiProperty({ description: 'Canal de distribution', required: false })
  @IsOptional()
  @IsString()
  canal?: string;

  @ApiProperty({
    description: 'Date de début de la période (YYYY-MM-DD)',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  dateDebut?: string;

  @ApiProperty({
    description: 'Date de fin de la période (YYYY-MM-DD)',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  dateFin?: string;

  @ApiProperty({
    description: 'Période rapide prédéfinie',
    enum: [
      'mois_courant',
      'mois_dernier',
      'trimestre_courant',
      'annee_courante',
      'personnalisee',
    ],
    required: false,
  })
  @IsOptional()
  @IsString()
  periodeRapide?:
    | 'mois_courant'
    | 'mois_dernier'
    | 'trimestre_courant'
    | 'annee_courante'
    | 'personnalisee';
}
