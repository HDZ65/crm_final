import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { DashboardFilters } from '../kpis/kpis.service';

export interface RepartitionProduit {
  produitId: string;
  nomProduit: string;
  ca: number;
  pourcentage: number;
  couleur: string;
}

export interface RepartitionProduitsResult {
  caTotal: number;
  produits: RepartitionProduit[];
}

const CHART_COLORS = [
  '#3B82F6', // blue
  '#10B981', // green
  '#F59E0B', // amber
  '#EF4444', // red
  '#8B5CF6', // violet
  '#EC4899', // pink
  '#06B6D4', // cyan
  '#F97316', // orange
  '#6366F1', // indigo
  '#84CC16', // lime
];

@Injectable()
export class RepartitionProduitsService {
  private readonly logger = new Logger(RepartitionProduitsService.name);

  constructor(
    @InjectDataSource('factures')
    private readonly facturesDb: DataSource,
    @InjectDataSource('products')
    private readonly productsDb: DataSource,
  ) {}

  async getRepartitionProduits(filters: DashboardFilters): Promise<RepartitionProduitsResult> {
    // Validate organisationId - return empty result if empty
    if (!filters.organisationId || filters.organisationId.trim() === '') {
      this.logger.warn('organisationId is empty, returning empty distribution');
      return { caTotal: 0, produits: [] };
    }

    this.logger.log(`Getting product distribution for org ${filters.organisationId}`);

    const { dateDebut, dateFin } = this.resolvePeriod(filters);

    // Query 1: Get all products for the organisation from products_db
    let products: any[] = [];
    try {
      const productsQuery = `
        SELECT id, nom
        FROM produits
        WHERE organisation_id = $1
      `;
      products = await this.productsDb.query(productsQuery, [filters.organisationId]);
    } catch (error) {
      this.logger.warn(`Failed to query products: ${error.message}`);
      // Return empty result if products table doesn't exist
      return { caTotal: 0, produits: [] };
    }

    // Create a map of product id to product name
    const productMap = new Map<string, string>();
    for (const p of products) {
      productMap.set(p.id, p.nom);
    }

    // If no products found, return empty result
    if (productMap.size === 0) {
      return { caTotal: 0, produits: [] };
    }

    // Query 2: Get revenue per product from factures_db
    let revenueQuery = `
      SELECT
        lf.produit_id,
        COALESCE(SUM(lf.montant_ht), 0) as ca
      FROM ligne_facture lf
      JOIN facture f ON lf.facture_id = f.id
      WHERE f.organisation_id = $1
        AND f.date_emission BETWEEN $2 AND $3
    `;
    const params: any[] = [filters.organisationId, dateDebut, dateFin];

    // Note: facture table doesn't have societe_id column

    revenueQuery += ' GROUP BY lf.produit_id';

    let revenueResults: any[] = [];
    try {
      revenueResults = await this.facturesDb.query(revenueQuery, params);
    } catch (error) {
      this.logger.warn(`Failed to query revenue: ${error.message}`);
    }

    // Create a map of product id to revenue
    const revenueMap = new Map<string, number>();
    for (const r of revenueResults) {
      revenueMap.set(r.produit_id, parseFloat(r.ca || '0'));
    }

    // Merge data: products with their revenue (or 0 if no sales)
    const mergedResults: { produitId: string; nomProduit: string; ca: number }[] = [];
    for (const [produitId, nomProduit] of productMap) {
      mergedResults.push({
        produitId,
        nomProduit,
        ca: revenueMap.get(produitId) || 0,
      });
    }

    // Sort by CA descending
    mergedResults.sort((a, b) => b.ca - a.ca);

    const caTotal = mergedResults.reduce((sum, r) => sum + r.ca, 0);

    const produits: RepartitionProduit[] = mergedResults.map((r, index) => ({
      produitId: r.produitId,
      nomProduit: r.nomProduit,
      ca: Math.round(r.ca * 100) / 100,
      pourcentage: caTotal > 0 ? Math.round((r.ca / caTotal) * 100 * 100) / 100 : 0,
      couleur: CHART_COLORS[index % CHART_COLORS.length],
    }));

    return {
      caTotal: Math.round(caTotal * 100) / 100,
      produits,
    };
  }

  private resolvePeriod(filters: DashboardFilters): { dateDebut: string; dateFin: string } {
    const now = new Date();
    let dateDebut = filters.dateDebut;
    let dateFin = filters.dateFin;

    if (!dateDebut || !dateFin) {
      switch (filters.periodeRapide) {
        case 'mois_courant':
          dateDebut = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
          dateFin = now.toISOString().split('T')[0];
          break;
        case 'trimestre_courant':
          const quarter = Math.floor(now.getMonth() / 3);
          dateDebut = new Date(now.getFullYear(), quarter * 3, 1).toISOString().split('T')[0];
          dateFin = now.toISOString().split('T')[0];
          break;
        case 'annee_courante':
          dateDebut = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];
          dateFin = now.toISOString().split('T')[0];
          break;
        default:
          dateDebut = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
          dateFin = now.toISOString().split('T')[0];
      }
    }

    return { dateDebut, dateFin };
  }
}
