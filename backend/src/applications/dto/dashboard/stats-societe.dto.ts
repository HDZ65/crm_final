import { ApiProperty } from '@nestjs/swagger';

export class StatsSocieteDto {
  @ApiProperty({ description: 'ID de la société' })
  societeId: string;

  @ApiProperty({ description: 'Nom de la société' })
  nomSociete: string;

  @ApiProperty({ description: 'Nombre de contrats actifs' })
  contratsActifs: number;

  @ApiProperty({ description: 'MRR (Monthly Recurring Revenue) en euros' })
  mrr: number;

  @ApiProperty({ description: 'ARR (Annual Recurring Revenue) en euros' })
  arr: number;

  @ApiProperty({ description: 'Nombre de nouveaux clients sur la période' })
  nouveauxClients: number;

  @ApiProperty({ description: 'Variation des nouveaux clients' })
  nouveauxClientsVariation: number;

  @ApiProperty({ description: 'Taux de churn en pourcentage' })
  tauxChurn: number;

  @ApiProperty({ description: 'Taux d\'impayés en pourcentage' })
  tauxImpayes: number;
}

export class StatsSocietesResponseDto {
  @ApiProperty({ type: [StatsSocieteDto], description: 'Statistiques par société' })
  societes: StatsSocieteDto[];

  @ApiProperty({ description: 'Nombre total de sociétés' })
  total: number;
}
