import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Domain entities
import { CatalogueWebhookEventEntity } from './domain/catalogue-webhook/entities/catalogue-webhook-event.entity';

// Infrastructure services (TypeORM repositories)
import { CatalogueWebhookEventRepoService } from './infrastructure/persistence/typeorm/repositories/catalogue-webhook/catalogue-webhook-event.service';

// HTTP controllers
import { CatalogueWebhookController } from './infrastructure/http/catalogue-webhook/catalogue-webhook.controller';

// Cross-module dependency — ProduitService for worker (Task 4)
import { ProductsModule } from './products.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([CatalogueWebhookEventEntity]),
    forwardRef(() => ProductsModule),
  ],
  controllers: [CatalogueWebhookController],
  providers: [CatalogueWebhookEventRepoService],
  exports: [CatalogueWebhookEventRepoService],
})
export class CatalogueWebhookModule {}
