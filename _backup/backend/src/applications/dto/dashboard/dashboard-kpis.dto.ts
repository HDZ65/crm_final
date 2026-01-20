import { ApiProperty } from '@nestjs/swagger';

export class VariationDto {
  @ApiProperty({ description: 'Valeur de variation en pourcentage' })
  pourcentage: number;

  @ApiProperty({ description: 'Tendance: hausse, baisse ou stable' })
  tendance: 'hausse' | 'baisse' | 'stable';
}

export class DashboardKpisDto {
  @ApiProperty({ description: 'Nombre total de contrats actifs' })
  contratsActifs: number;

  @ApiProperty({ description: 'Variation des contrats actifs vs mois dernier' })
  contratsActifsVariation: VariationDto;

  @ApiProperty({
    description: "Chiffre d'affaires récurrent mensuel (MRR) en euros",
  })
  mrr: number;

  @ApiProperty({ description: 'Variation du MRR vs mois dernier' })
  mrrVariation: VariationDto;

  @ApiProperty({ description: 'Taux de churn (résiliation) en pourcentage' })
  tauxChurn: number;

  @ApiProperty({ description: 'Variation du taux de churn vs mois dernier' })
  tauxChurnVariation: VariationDto;

  @ApiProperty({ description: "Taux d'impayés en pourcentage" })
  tauxImpayes: number;

  @ApiProperty({ description: "Variation du taux d'impayés vs mois dernier" })
  tauxImpayesVariation: VariationDto;
}
