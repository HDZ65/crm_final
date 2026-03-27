import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import type {
  CreateProduitRequest,
  DeleteProduitRequest,
  GetProduitBySkuRequest,
  GetProduitRequest,
  ListProduitsRequest,
  UpdateProduitRequest,
} from '@proto/products';
import { ProduitService } from '../../persistence/typeorm/repositories/products/produit.service';

@Controller()
export class ProduitController {
  constructor(private readonly produitService: ProduitService) {}

  /** Serialize jsonb metadata back to string for gRPC (proto expects string) */
  private serializeEntity(entity: any): any {
    if (entity?.metadata && typeof entity.metadata === 'object') {
      entity.metadata = JSON.stringify(entity.metadata);
    }
    return entity;
  }

  @GrpcMethod('ProduitService', 'Create')
  async create(data: CreateProduitRequest) {
    return this.serializeEntity(await this.produitService.create({
      organisation_id: data.organisationId,
      gamme_id: data.gammeId,
      sku: data.sku,
      nom: data.nom,
      description: data.description,
      categorie: data.categorie,
      type: data.type,
      statut_cycle: data.statutCycle,
      prix: data.prix,
      taux_tva: data.tauxTva,
      devise: data.devise,
      image_url: data.imageUrl,
      code_externe: data.codeExterne,
      metadata: data.metadata,
    }));
  }

  @GrpcMethod('ProduitService', 'Update')
  async update(data: UpdateProduitRequest) {
    return this.serializeEntity(await this.produitService.update(data));
  }

  @GrpcMethod('ProduitService', 'Get')
  async get(data: GetProduitRequest) {
    return this.serializeEntity(await this.produitService.findById(data.id));
  }

  @GrpcMethod('ProduitService', 'GetBySku')
  async getBySku(data: GetProduitBySkuRequest) {
    return this.serializeEntity(await this.produitService.findBySku(data.organisationId, data.sku));
  }

  @GrpcMethod('ProduitService', 'List')
  async list(data: ListProduitsRequest) {
    const result = await this.produitService.findAll({
      organisation_id: data.organisationId,
      gamme_id: data.gammeId,
      categorie: data.categorie,
      type: data.type,
      actif: data.actif,
      promotion_active: data.promotionActive,
      search: data.search,
      pagination: data.pagination ? {
        page: data.pagination.page,
        limit: data.pagination.limit,
        sort_by: data.pagination.sortBy,
        sort_order: data.pagination.sortOrder,
      } : undefined,
    });
    return {
      ...result,
      produits: result.produits.map((p: any) => this.serializeEntity(p)),
    };
  }

  @GrpcMethod('ProduitService', 'Delete')
  async delete(data: DeleteProduitRequest) {
    const success = await this.produitService.delete(data.id);
    return { success };
  }
}
