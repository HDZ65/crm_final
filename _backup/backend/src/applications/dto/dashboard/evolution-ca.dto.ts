import { ApiProperty } from '@nestjs/swagger';

export class EvolutionCaMensuelleDto {
  @ApiProperty({ description: 'Mois au format YYYY-MM' })
  mois: string;

  @ApiProperty({ description: 'CA réalisé en euros' })
  caRealise: number;

  @ApiProperty({ description: 'Objectif CA en euros' })
  objectif: number;
}

export class EvolutionCaResponseDto {
  @ApiProperty({ description: 'Période de début' })
  periodeDebut: string;

  @ApiProperty({ description: 'Période de fin' })
  periodeFin: string;

  @ApiProperty({
    type: [EvolutionCaMensuelleDto],
    description: 'Données mensuelles',
  })
  donnees: EvolutionCaMensuelleDto[];
}
