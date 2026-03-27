import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CategorieProduit, ProduitEntity, TypeProduit } from '../../products/entities/produit.entity';

/**
 * Shape of a single product from the partner webhook JSON payload.
 */
export interface PartnerProductPayload {
  id: number | string;
  nom: string;
  description?: string | null;
  categorie?: string | null;
  fournisseur?: string | null;
  logo_url?: string | null;
  prix_base?: number | null;
  features?: unknown | null;
  formules?: unknown | null;
  popular?: boolean;
  rating?: number | null;
  isActive?: boolean;
  sku?: string | null;
}

/**
 * Result of a single product upsert operation.
 */
export interface UpsertResult {
  produitId: string;
  codeExterne: string;
  action: 'CREATED' | 'UPDATED';
}

/**
 * CatalogueWebhookMappingService
 *
 * Maps partner catalogue JSON to ProduitEntity and performs upsert
 * (find by keycloakGroupId + codeExterne → update if found, create if not).
 *
 * Does NOT use ProduitService.create()/update() because those accept
 * proto-enum integers. Direct TypeORM repository access is required.
 */
@Injectable()
export class CatalogueWebhookMappingService {
  private readonly logger = new Logger(CatalogueWebhookMappingService.name);

  constructor(
    @InjectRepository(ProduitEntity)
    private readonly produitRepository: Repository<ProduitEntity>,
  ) {}

  /**
   * Upsert a single partner product into ProduitEntity.
   * Lookup key: (keycloakGroupId, codeExterne).
   */
  async upsertPartnerProduct(keycloakGroupId: string, payload: PartnerProductPayload): Promise<UpsertResult> {
    const partnerId = String(payload.id);
    const codeExterne = `partner-${partnerId}`;
    const sku = payload.sku || `PARTNER-${partnerId}`;

    // Lookup existing product by (keycloakGroupId, codeExterne)
    const existing = await this.produitRepository.findOne({
      where: { keycloakGroupId, codeExterne },
    });

    if (existing) {
      // UPDATE existing product
      this.applyMapping(existing, keycloakGroupId, payload, codeExterne, sku);
      const saved = await this.produitRepository.save(existing);

      this.logger.log(`Updated partner product: ${saved.nom} (codeExterne=${codeExterne}, id=${saved.id})`);

      return { produitId: saved.id, codeExterne, action: 'UPDATED' };
    }

    // CREATE new product
    const produit = new ProduitEntity();
    this.applyMapping(produit, keycloakGroupId, payload, codeExterne, sku);
    const saved = await this.produitRepository.save(produit);

    this.logger.log(`Created partner product: ${saved.nom} (codeExterne=${codeExterne}, id=${saved.id})`);

    return { produitId: saved.id, codeExterne, action: 'CREATED' };
  }

  /**
   * Batch upsert: processes an array of partner products.
   * Returns results for each product (no early exit on individual failures).
   */
  async upsertBatch(
    keycloakGroupId: string,
    products: PartnerProductPayload[],
  ): Promise<{ results: UpsertResult[]; errors: Array<{ index: number; error: string }> }> {
    const results: UpsertResult[] = [];
    const errors: Array<{ index: number; error: string }> = [];

    for (let i = 0; i < products.length; i++) {
      try {
        const result = await this.upsertPartnerProduct(keycloakGroupId, products[i]!);
        results.push(result);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        this.logger.error(`Failed to upsert partner product at index ${i} (id=${products[i]?.id}): ${message}`);
        errors.push({ index: i, error: message });
      }
    }

    return { results, errors };
  }

  /**
   * Apply partner JSON → ProduitEntity field mapping.
   */
  private applyMapping(
    produit: ProduitEntity,
    keycloakGroupId: string,
    payload: PartnerProductPayload,
    codeExterne: string,
    sku: string,
  ): void {
    produit.keycloakGroupId = keycloakGroupId;
    produit.codeExterne = codeExterne;
    produit.sku = sku;
    produit.nom = payload.nom;
    produit.description = payload.description ?? null;
    produit.fournisseur = payload.fournisseur ?? null;
    produit.logoUrl = payload.logo_url ?? null;
    produit.prix = payload.prix_base ?? 0;
    produit.popular = payload.popular ?? false;
    produit.rating = payload.rating ?? null;
    produit.actif = payload.isActive ?? true;

    // Partner category as free-text + default enum
    produit.categoriePartenaire = payload.categorie ?? null;
    produit.categorie = CategorieProduit.SERVICE;

    // JSONB fields — store as-is (no parsing to FormuleProduitEntity)
    produit.featuresData = (payload.features as Record<string, unknown>) ?? null;
    produit.formulesData = (payload.formules as Record<string, unknown>) ?? null;

    // Fixed values for partner products
    produit.type = TypeProduit.PARTENAIRE;
    produit.sourceDerniereModif = 'webhook_partner';
  }
}
