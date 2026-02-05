import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { ProduitService } from './produit.service';

import type {
  CreateProduitRequest,
  UpdateProduitRequest,
  GetProduitRequest,
  GetProduitBySkuRequest,
  ListProduitsRequest,
  DeleteProduitRequest,
  SetPromotionRequest,
  ClearPromotionRequest,
} from '@crm/proto/products';

@Controller()
export class ProduitController {
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
    return this.produitService.findById(data);
  }

  @GrpcMethod('ProduitService', 'GetBySku')
  async getBySku(data: GetProduitBySkuRequest) {
    return this.produitService.findBySku(data);
  }

  @GrpcMethod('ProduitService', 'List')
  async list(data: ListProduitsRequest) {
    return this.produitService.findAll(data);
  }

  @GrpcMethod('ProduitService', 'Delete')
  async delete(data: DeleteProduitRequest) {
    const success = await this.produitService.delete(data);
    return { success };
  }

  @GrpcMethod('ProduitService', 'SetPromotion')
  async setPromotion(data: SetPromotionRequest) {
    return this.produitService.setPromotion(data);
  }

  @GrpcMethod('ProduitService', 'ClearPromotion')
  async clearPromotion(data: ClearPromotionRequest) {
    return this.produitService.clearPromotion(data);
  }
}
