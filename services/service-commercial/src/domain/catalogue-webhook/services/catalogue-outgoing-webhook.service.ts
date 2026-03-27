import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProduitEntity } from '../../products/entities/produit.entity';

/**
 * CatalogueOutgoingWebhookService
 *
 * Pushes CRM products to partner webhook endpoint.
 * V1: Fire-and-forget, no retry/queue.
 * Anti-loop: Only pushes products where sourceDerniereModif !== 'webhook_partner'.
 */
@Injectable()
export class CatalogueOutgoingWebhookService {
  private readonly logger = new Logger(CatalogueOutgoingWebhookService.name);

  constructor(
    @InjectRepository(ProduitEntity)
    private readonly produitRepository: Repository<ProduitEntity>,
  ) {}

  /**
   * Push all active products for an organisation to partner webhook.
   * Filters out products originating from partner webhook (anti-loop).
   *
   * @param organisationId - Organisation UUID
   * @returns Result object with success status, count, and optional error
   */
  async pushAllProducts(organisationId: string): Promise<{
    success: boolean;
    productsSynced: number;
    error?: string;
  }> {
    try {
      // 1. Load all active products for the organisation
      const allProducts = await this.produitRepository.find({
        where: { organisationId, actif: true },
      });

      this.logger.log(
        `Loaded ${allProducts.length} active products for organisation ${organisationId}`,
      );

      // 2. Filter out products where sourceDerniereModif === 'webhook_partner' (anti-loop)
      const productsToSync = allProducts.filter(
        (p) => p.sourceDerniereModif !== 'webhook_partner',
      );

      this.logger.log(
        `Filtered to ${productsToSync.length} products (excluded ${allProducts.length - productsToSync.length} webhook_partner products)`,
      );

      if (productsToSync.length === 0) {
        this.logger.log('No products to sync after filtering');
        return { success: true, productsSynced: 0 };
      }

      // 3. Serialize to JSON (full ProduitEntity format)
      const payload = productsToSync.map((p) => ({
        id: p.id,
        organisationId: p.organisationId,
        gammeId: p.gammeId,
        sku: p.sku,
        nom: p.nom,
        description: p.description,
        categorie: p.categorie,
        type: p.type,
        prix: p.prix,
        tauxTva: p.tauxTva,
        devise: p.devise,
        actif: p.actif,
        statutCycle: p.statutCycle,
        promotionActive: p.promotionActive,
        prixPromotion: p.prixPromotion,
        dateDebutPromotion: p.dateDebutPromotion,
        dateFinPromotion: p.dateFinPromotion,
        imageUrl: p.imageUrl,
        codeExterne: p.codeExterne,
        dureeEngagementMois: p.dureeEngagementMois,
        frequenceRenouvellement: p.frequenceRenouvellement,
        conditionsResiliation: p.conditionsResiliation,
        uniteVente: p.uniteVente,
        codeComptable: p.codeComptable,
        compteProduit: p.compteProduit,
        journalVente: p.journalVente,
        partenaireCommercialId: p.partenaireCommercialId,
        modeleDistributionId: p.modeleDistributionId,
        typeTarification: p.typeTarification,
        configTarification: p.configTarification,
        metadata: p.metadata,
        popular: p.popular,
        rating: p.rating,
        logoUrl: p.logoUrl,
        featuresData: p.featuresData,
        formulesData: p.formulesData,
        categoriePartenaire: p.categoriePartenaire,
        sourceDerniereModif: p.sourceDerniereModif,
        fournisseur: p.fournisseur,
        createdBy: p.createdBy,
        modifiedBy: p.modifiedBy,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      }));

      // 4. POST to partner webhook URL
      const webhookUrl = process.env.CATALOGUE_WEBHOOK_OUTGOING_URL;

      if (!webhookUrl) {
        const error = 'CATALOGUE_WEBHOOK_OUTGOING_URL not configured';
        this.logger.error(error);
        return { success: false, productsSynced: 0, error };
      }

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      // 5. Log result (fire-and-forget, no retry)
      if (response.ok) {
        this.logger.log(
          `Successfully pushed ${productsToSync.length} products to ${webhookUrl} (status: ${response.status})`,
        );
        return { success: true, productsSynced: productsToSync.length };
      } else {
        const errorText = await response.text().catch(() => 'Unable to read response body');
        const error = `Webhook POST failed with status ${response.status}: ${errorText}`;
        this.logger.error(error);
        return { success: false, productsSynced: 0, error };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to push products: ${errorMessage}`, error instanceof Error ? error.stack : undefined);
      return { success: false, productsSynced: 0, error: errorMessage };
    }
  }

  /**
   * Push a single product to partner webhook.
   * V2 stub: Currently just logs, no implementation.
   *
   * @param product - ProduitEntity to push
   */
  async pushSingleProduct(product: ProduitEntity): Promise<void> {
    this.logger.log(
      `pushSingleProduct stub called for product ${product.id} (${product.nom}) - V2 implementation pending`,
    );
    // V2: Implement single-product push with same anti-loop filter
  }
}
