import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { VersionProduitService } from './version-produit.service';

import type {
  CreateProduitVersionRequest,
  UpdateProduitVersionRequest,
  GetProduitVersionRequest,
  ListProduitVersionsRequest,
} from '@crm/proto/products';

@Controller()
export class VersionProduitController {
  constructor(private readonly versionProduitService: VersionProduitService) {}

  @GrpcMethod('ProduitVersionService', 'Create')
  async create(data: CreateProduitVersionRequest) {
    return this.versionProduitService.create(data);
  }

  @GrpcMethod('ProduitVersionService', 'Update')
  async update(data: UpdateProduitVersionRequest) {
    return this.versionProduitService.update(data);
  }

  @GrpcMethod('ProduitVersionService', 'Get')
  async get(data: GetProduitVersionRequest) {
    return this.versionProduitService.findById(data);
  }

  @GrpcMethod('ProduitVersionService', 'ListByProduit')
  async listByProduit(data: ListProduitVersionsRequest) {
    return this.versionProduitService.findByProduit(data);
  }
}
