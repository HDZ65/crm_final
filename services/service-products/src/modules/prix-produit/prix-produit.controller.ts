import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { PrixProduitService } from './prix-produit.service';

import type {
  CreatePrixProduitRequest,
  UpdatePrixProduitRequest,
  GetPrixProduitRequest,
  GetPrixForProduitRequest,
  ListPrixProduitsRequest,
  DeletePrixProduitRequest,
  BulkCreatePrixProduitsRequest,
} from '@crm/proto/products';

@Controller()
export class PrixProduitController {
  constructor(private readonly prixProduitService: PrixProduitService) {}

  @GrpcMethod('PrixProduitService', 'Create')
  async create(data: CreatePrixProduitRequest) {
    return this.prixProduitService.create(data);
  }

  @GrpcMethod('PrixProduitService', 'Update')
  async update(data: UpdatePrixProduitRequest) {
    return this.prixProduitService.update(data);
  }

  @GrpcMethod('PrixProduitService', 'Get')
  async get(data: GetPrixProduitRequest) {
    return this.prixProduitService.findById(data);
  }

  @GrpcMethod('PrixProduitService', 'GetForProduit')
  async getForProduit(data: GetPrixForProduitRequest) {
    return this.prixProduitService.findForProduit(data);
  }

  @GrpcMethod('PrixProduitService', 'List')
  async list(data: ListPrixProduitsRequest) {
    return this.prixProduitService.findAll(data);
  }

  @GrpcMethod('PrixProduitService', 'Delete')
  async delete(data: DeletePrixProduitRequest) {
    const success = await this.prixProduitService.delete(data);
    return { success };
  }

  @GrpcMethod('PrixProduitService', 'BulkCreate')
  async bulkCreate(data: BulkCreatePrixProduitsRequest) {
    const result = await this.prixProduitService.bulkCreate(data);
    return { created: result.created, count: result.count };
  }
}
