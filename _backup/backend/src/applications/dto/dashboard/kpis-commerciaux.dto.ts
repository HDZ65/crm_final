import { ApiProperty } from '@nestjs/swagger';

export class VariationKpiDto {
  @ApiProperty({ description: 'Valeur de variation en pourcentage' })
  pourcentage: number;

  @ApiProperty({ description: 'Tendance: hausse, baisse ou stable' })
  tendance: 'hausse' | 'baisse' | 'stable';
}

export class ClassementCommercialDto {
  @ApiProperty({ description: 'ID du commercial' })
  commercialId: string;

  @ApiProperty({ description: 'Nom complet du commercial' })
  nomComplet: string;

  @ApiProperty({
    description: 'Valeur (nombre de ventes, CA ou taux de conversion)',
  })
  valeur: number;

  @ApiProperty({ description: 'Position dans le classement' })
  rang: number;
}

export class KpisCommerciauxResponseDto {
  @ApiProperty({ description: 'Nombre de nouveaux clients ce mois' })
  nouveauxClientsMois: number;

  @ApiProperty({
    description: 'Variation des nouveaux clients vs mois dernier',
    type: VariationKpiDto,
  })
  nouveauxClientsVariation: VariationKpiDto;

  @ApiProperty({ description: 'Taux de conversion en pourcentage' })
  tauxConversion: number;

  @ApiProperty({
    description: 'Variation du taux de conversion vs mois dernier',
    type: VariationKpiDto,
  })
  tauxConversionVariation: VariationKpiDto;

  @ApiProperty({ description: 'Panier moyen en euros' })
  panierMoyen: number;

  @ApiProperty({
    description: 'Variation du panier moyen vs mois dernier',
    type: VariationKpiDto,
  })
  panierMoyenVariation: VariationKpiDto;

  @ApiProperty({ description: 'CA prévisionnel sur 3 mois en euros' })
  caPrevisionnel3Mois: number;

  @ApiProperty({
    description: 'Classement des commerciaux par nombre de ventes',
    type: [ClassementCommercialDto],
  })
  classementParVentes: ClassementCommercialDto[];

  @ApiProperty({
    description: "Classement des commerciaux par chiffre d'affaires",
    type: [ClassementCommercialDto],
  })
  classementParCA: ClassementCommercialDto[];

  @ApiProperty({
    description: 'Classement des commerciaux par taux de conversion',
    type: [ClassementCommercialDto],
  })
  classementParConversion: ClassementCommercialDto[];
}
