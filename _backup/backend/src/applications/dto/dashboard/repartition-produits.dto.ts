import { ApiProperty } from '@nestjs/swagger';

export class RepartitionProduitDto {
  @ApiProperty({ description: 'ID du produit' })
  produitId: string;

  @ApiProperty({ description: 'Nom du produit' })
  nomProduit: string;

  @ApiProperty({ description: 'CA généré par ce produit en euros' })
  ca: number;

  @ApiProperty({ description: 'Pourcentage du CA total' })
  pourcentage: number;

  @ApiProperty({ description: 'Couleur pour le graphique (hex)' })
  couleur: string;
}

export class RepartitionProduitsResponseDto {
  @ApiProperty({ description: 'CA total en euros' })
  caTotal: number;

  @ApiProperty({
    type: [RepartitionProduitDto],
    description: 'Répartition par produit',
  })
  produits: RepartitionProduitDto[];
}
