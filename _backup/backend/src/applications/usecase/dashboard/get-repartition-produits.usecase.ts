import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LigneContratEntity } from '../../../infrastructure/db/entities/ligne-contrat.entity';
import { ProduitEntity } from '../../../infrastructure/db/entities/produit.entity';
import {
  RepartitionProduitsResponseDto,
  RepartitionProduitDto,
} from '../../dto/dashboard/repartition-produits.dto';
import { DashboardFiltersDto } from '../../dto/dashboard/dashboard-filters.dto';

// Couleurs prédéfinies pour le graphique
const COULEURS = [
  '#3B82F6', // Bleu
  '#10B981', // Vert
  '#F59E0B', // Orange
  '#8B5CF6', // Violet
  '#EF4444', // Rouge
  '#06B6D4', // Cyan
  '#EC4899', // Rose
  '#84CC16', // Lime
];

@Injectable()
export class GetRepartitionProduitsUseCase {
  constructor(
    @InjectRepository(LigneContratEntity)
    private readonly ligneContratRepository: Repository<LigneContratEntity>,
    @InjectRepository(ProduitEntity)
    private readonly produitRepository: Repository<ProduitEntity>,
  ) {}

  async execute(
    filters: DashboardFiltersDto,
  ): Promise<RepartitionProduitsResponseDto> {
    const { organisationId } = filters;

    // Récupérer la répartition du CA par produit via les lignes de contrat
    const queryBuilder =
      this.ligneContratRepository.createQueryBuilder('ligne');

    queryBuilder.select('ligne.produitId', 'produitId');
    queryBuilder.addSelect('SUM(ligne.prixUnitaire * ligne.quantite)', 'ca');
    queryBuilder.innerJoin('ligne.contrat', 'contrat');

    // Filtrer par organisation si spécifié
    if (organisationId) {
      queryBuilder.andWhere('contrat.organisationId = :organisationId', {
        organisationId,
      });
    }

    queryBuilder.groupBy('ligne.produitId');
    queryBuilder.orderBy('ca', 'DESC');

    const results = await queryBuilder.getRawMany();

    // Calculer le CA total
    const caTotal = results.reduce(
      (sum, r) => sum + parseFloat(r.ca || '0'),
      0,
    );

    // Récupérer les noms des produits
    const produitIds = results.map((r) => r.produitId).filter(Boolean);
    const produits =
      produitIds.length > 0
        ? await this.produitRepository.findByIds(produitIds)
        : [];

    const produitsMap = new Map(produits.map((p) => [p.id, p.nom]));

    // Construire la réponse
    const produitsResponse: RepartitionProduitDto[] = results.map(
      (r, index) => {
        const ca = parseFloat(r.ca || '0');
        return {
          produitId: r.produitId,
          nomProduit: produitsMap.get(r.produitId) || 'Produit inconnu',
          ca,
          pourcentage:
            caTotal > 0 ? parseFloat(((ca / caTotal) * 100).toFixed(1)) : 0,
          couleur: COULEURS[index % COULEURS.length],
        };
      },
    );

    return {
      caTotal,
      produits: produitsResponse,
    };
  }
}
