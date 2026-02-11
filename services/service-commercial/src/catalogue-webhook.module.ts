import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Domain entities
import { CatalogueWebhookEventEntity } from './domain/catalogue-webhook/entities/catalogue-webhook-event.entity';
import { ProduitEntity } from './domain/products/entities/produit.entity';

// Domain services
import { CatalogueWebhookMappingService } from './domain/catalogue-webhook/services/catalogue-webhook-mapping.service';
import { CatalogueOutgoingWebhookService } from './domain/catalogue-webhook/services/catalogue-outgoing-webhook.service';

// Infrastructure services (TypeORM repositories)
import { CatalogueWebhookEventRepoService } from './infrastructure/persistence/typeorm/repositories/catalogue-webhook/catalogue-webhook-event.service';

// Infrastructure NATS handler
import { CatalogueWebhookNatsWorker } from './infrastructure/messaging/nats/handlers/catalogue-webhook/catalogue-webhook.handler';

// HTTP controllers
import { CatalogueWebhookController } from './infrastructure/http/catalogue-webhook/catalogue-webhook.controller';

// Cross-module dependency — ProduitService for worker (Task 4)
import { ProductsModule } from './products.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([CatalogueWebhookEventEntity, ProduitEntity]),
    forwardRef(() => ProductsModule),
  ],
  controllers: [CatalogueWebhookController],
  providers: [
    CatalogueWebhookEventRepoService,
    CatalogueWebhookMappingService,
    CatalogueOutgoingWebhookService,
    CatalogueWebhookNatsWorker,
  ],
  exports: [
    CatalogueWebhookEventRepoService,
    CatalogueWebhookMappingService,
    CatalogueOutgoingWebhookService,
  ],
})
export class CatalogueWebhookModule {}
