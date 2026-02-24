import { Controller, Logger } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { ProduitService } from '../../persistence/typeorm/repositories/products/produit.service';
import type {
  CreateProduitRequest,
  UpdateProduitRequest,
  GetProduitRequest,
  GetProduitBySkuRequest,
  ListProduitsRequest,
  DeleteProduitRequest,
} from '@proto/products';

@Controller()
export class ProduitController {
  private readonly logger = new Logger(ProduitController.name);

  constructor(private readonly produitService: ProduitService) {}

  /** Serialize jsonb metadata back to string for gRPC (proto expects string) */
  private serializeEntity(entity: any): any {
    if (entity && entity.metadata && typeof entity.metadata === 'object') {
      entity.metadata = JSON.stringify(entity.metadata);
    }
    return entity;
  }

  @GrpcMethod('ProduitService', 'Create')
  async create(data: CreateProduitRequest) {
    return this.serializeEntity(await this.produitService.create(data));
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
    return this.serializeEntity(await this.produitService.findBySku(data.organisation_id, data.sku));
  }

  @GrpcMethod('ProduitService', 'List')
  async list(data: ListProduitsRequest) {
    const result = await this.produitService.findAll(data);
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
