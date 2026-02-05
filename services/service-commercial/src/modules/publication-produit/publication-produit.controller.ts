import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { PublicationProduitService } from './publication-produit.service';

import type {
  CreateProduitPublicationRequest,
  UpdateProduitPublicationRequest,
  GetProduitPublicationRequest,
  ListProduitPublicationsByVersionRequest,
  ListProduitPublicationsBySocieteRequest,
} from '@crm/proto/products';

@Controller()
export class PublicationProduitController {
  constructor(private readonly publicationProduitService: PublicationProduitService) {}

  @GrpcMethod('ProduitPublicationService', 'Create')
  async create(data: CreateProduitPublicationRequest) {
    return this.publicationProduitService.create(data);
  }

  @GrpcMethod('ProduitPublicationService', 'Update')
  async update(data: UpdateProduitPublicationRequest) {
    return this.publicationProduitService.update(data);
  }

  @GrpcMethod('ProduitPublicationService', 'Get')
  async get(data: GetProduitPublicationRequest) {
    return this.publicationProduitService.findById(data);
  }

  @GrpcMethod('ProduitPublicationService', 'ListByVersion')
  async listByVersion(data: ListProduitPublicationsByVersionRequest) {
    return { publications: await this.publicationProduitService.findByVersion(data) };
  }

  @GrpcMethod('ProduitPublicationService', 'ListBySociete')
  async listBySociete(data: ListProduitPublicationsBySocieteRequest) {
    return { publications: await this.publicationProduitService.findBySociete(data) };
  }
}
