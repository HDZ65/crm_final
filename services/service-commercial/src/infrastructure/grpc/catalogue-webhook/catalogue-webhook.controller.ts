import { Controller, Logger } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { CatalogueOutgoingWebhookService } from '../../../domain/catalogue-webhook/services/catalogue-outgoing-webhook.service';
import type {
  SyncCatalogueRequest,
  SyncCatalogueResponse,
} from '@proto/products';

@Controller()
export class CatalogueWebhookGrpcController {
  private readonly logger = new Logger(CatalogueWebhookGrpcController.name);

  constructor(
    private readonly catalogueOutgoingWebhookService: CatalogueOutgoingWebhookService,
  ) {}

  @GrpcMethod('ProduitService', 'SyncCatalogue')
  async syncCatalogue(
    request: SyncCatalogueRequest,
  ): Promise<SyncCatalogueResponse> {
    this.logger.log(
      `SyncCatalogue RPC called for organisation ${request.organisation_id}`,
    );

    const result = await this.catalogueOutgoingWebhookService.pushAllProducts(
      request.organisation_id,
    );

    return {
      success: result.success,
      products_synced: result.productsSynced,
      error: result.error || '',
    };
  }
}
