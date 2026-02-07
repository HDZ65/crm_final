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

  @GrpcMethod('ProduitService', 'Create')
  async create(data: CreateProduitRequest) {
    return this.produitService.create(data);
  }

  @GrpcMethod('ProduitService', 'Update')
  async update(data: UpdateProduitRequest) {
    return this.produitService.update(data);
  }

  @GrpcMethod('ProduitService', 'Get')
  async get(data: GetProduitRequest) {
    return this.produitService.findById(data.id);
  }

  @GrpcMethod('ProduitService', 'GetBySku')
  async getBySku(data: GetProduitBySkuRequest) {
    return this.produitService.findBySku(data.organisation_id, data.sku);
  }

  @GrpcMethod('ProduitService', 'List')
  async list(data: ListProduitsRequest) {
    return this.produitService.findAll(data);
  }

  @GrpcMethod('ProduitService', 'Delete')
  async delete(data: DeleteProduitRequest) {
    const success = await this.produitService.delete(data.id);
    return { success };
  }
}
