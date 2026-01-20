import { ApiProperty } from '@nestjs/swagger';

export type NiveauAlerte = 'critique' | 'avertissement' | 'info';
export type TypeAlerte =
  | 'taux_impayes'
  | 'taux_churn'
  | 'controles_qualite'
  | 'objectif_ca'
  | 'autre';

export class AlerteDto {
  @ApiProperty({ description: "ID unique de l'alerte" })
  id: string;

  @ApiProperty({ description: "Titre de l'alerte" })
  titre: string;

  @ApiProperty({ description: "Description détaillée de l'alerte" })
  description: string;

  @ApiProperty({
    enum: ['critique', 'avertissement', 'info'],
    description: "Niveau de l'alerte",
  })
  niveau: NiveauAlerte;

  @ApiProperty({
    enum: [
      'taux_impayes',
      'taux_churn',
      'controles_qualite',
      'objectif_ca',
      'autre',
    ],
    description: "Type d'alerte",
  })
  type: TypeAlerte;

  @ApiProperty({ description: 'Valeur actuelle du KPI en alerte' })
  valeurActuelle: number;

  @ApiProperty({ description: 'Seuil dépassé' })
  seuil: number;

  @ApiProperty({ description: "Date de détection de l'alerte" })
  dateDetection: string;

  @ApiProperty({
    description: 'Entité concernée (société, produit, etc.)',
    required: false,
  })
  entiteConcernee?: string;

  @ApiProperty({ description: "ID de l'entité concernée", required: false })
  entiteId?: string;
}

export class AlertesResponseDto {
  @ApiProperty({ type: [AlerteDto], description: 'Liste des alertes actives' })
  alertes: AlerteDto[];

  @ApiProperty({ description: "Nombre total d'alertes" })
  total: number;

  @ApiProperty({ description: "Nombre d'alertes critiques" })
  nombreCritiques: number;

  @ApiProperty({ description: "Nombre d'avertissements" })
  nombreAvertissements: number;

  @ApiProperty({ description: "Nombre d'alertes informatives" })
  nombreInfos: number;
}
