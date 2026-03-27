import { Controller, Logger } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import type { SyncCatalogueRequest, SyncCatalogueResponse } from '@proto/products';
import { CatalogueOutgoingWebhookService } from '../../../domain/catalogue-webhook/services/catalogue-outgoing-webhook.service';

@Controller()
export class CatalogueWebhookGrpcController {
  private readonly logger = new Logger(CatalogueWebhookGrpcController.name);

  constructor(private readonly catalogueOutgoingWebhookService: CatalogueOutgoingWebhookService) {}

  @GrpcMethod('ProduitService', 'SyncCatalogue')
  async syncCatalogue(request: SyncCatalogueRequest): Promise<SyncCatalogueResponse> {
    this.logger.log(`SyncCatalogue RPC called for organisation ${request.organisationId}`);

    const result = await this.catalogueOutgoingWebhookService.pushAllProducts(request.organisationId);

    return {
      success: result.success,
      productsSynced: result.productsSynced,
      error: result.error || '',
    };
  }
}
