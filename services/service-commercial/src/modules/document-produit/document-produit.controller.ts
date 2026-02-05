import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { DocumentProduitService } from './document-produit.service';

import type {
  CreateProduitDocumentRequest,
  UpdateProduitDocumentRequest,
  GetProduitDocumentRequest,
  ListProduitDocumentsRequest,
} from '@crm/proto/products';

@Controller()
export class DocumentProduitController {
  constructor(private readonly documentProduitService: DocumentProduitService) {}

  @GrpcMethod('ProduitDocumentService', 'Create')
  async create(data: CreateProduitDocumentRequest) {
    return this.documentProduitService.create(data);
  }

  @GrpcMethod('ProduitDocumentService', 'Update')
  async update(data: UpdateProduitDocumentRequest) {
    return this.documentProduitService.update(data);
  }

  @GrpcMethod('ProduitDocumentService', 'Get')
  async get(data: GetProduitDocumentRequest) {
    return this.documentProduitService.findById(data);
  }

  @GrpcMethod('ProduitDocumentService', 'ListByVersion')
  async listByVersion(data: ListProduitDocumentsRequest) {
    return { documents: await this.documentProduitService.findByVersion(data) };
  }
}
