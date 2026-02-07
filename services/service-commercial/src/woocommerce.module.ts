import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Domain entities
import {
  WooCommerceConfigEntity,
  WooCommerceMappingEntity,
  WooCommerceWebhookEventEntity,
} from './domain/woocommerce/entities';

// Infrastructure services (TypeORM repositories)
import {
  WooCommerceWebhookEventService,
  WooCommerceMappingService,
  WooCommerceConfigService,
} from './infrastructure/persistence/typeorm/repositories/woocommerce';

// Domain services
import { WooCommerceWebhookService } from './domain/woocommerce/services/woocommerce-webhook.service';
import { WooCommerceSyncService } from './domain/woocommerce/services/woocommerce-sync.service';
import { WooCommerceNatsWorkersService } from './domain/woocommerce/services/woocommerce-nats-workers.service';

// HTTP controllers
import { WooCommerceWebhookController } from './infrastructure/http/woocommerce/webhook.controller';

// gRPC controllers
import { WooCommerceController } from './infrastructure/grpc/subscriptions/woocommerce.controller';

// Cross-module dependency — SubscriptionService for sync
import { SubscriptionsModule } from './subscriptions.module';
import { SubscriptionService } from './infrastructure/persistence/typeorm/repositories/subscriptions';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      WooCommerceConfigEntity,
      WooCommerceMappingEntity,
      WooCommerceWebhookEventEntity,
    ]),
    forwardRef(() => SubscriptionsModule),
  ],
  controllers: [WooCommerceWebhookController, WooCommerceController],
  providers: [
    // TypeORM repository services
    WooCommerceWebhookEventService,
    WooCommerceMappingService,
    WooCommerceConfigService,
    // Domain services
    {
      provide: WooCommerceWebhookService,
      useFactory: (
        webhookEventRepo: WooCommerceWebhookEventService,
        configRepo: WooCommerceConfigService,
      ) => new WooCommerceWebhookService(webhookEventRepo, configRepo),
      inject: [WooCommerceWebhookEventService, WooCommerceConfigService],
    },
    {
      provide: WooCommerceSyncService,
      useFactory: (
        mappingRepo: WooCommerceMappingService,
        subscriptionRepo: SubscriptionService,
      ) => new WooCommerceSyncService(mappingRepo, subscriptionRepo),
      inject: [WooCommerceMappingService, SubscriptionService],
    },
    {
      provide: WooCommerceNatsWorkersService,
      useFactory: (
        syncService: WooCommerceSyncService,
        webhookService: WooCommerceWebhookService,
      ) => new WooCommerceNatsWorkersService(syncService, webhookService),
      inject: [WooCommerceSyncService, WooCommerceWebhookService],
    },
  ],
  exports: [
    WooCommerceWebhookEventService,
    WooCommerceMappingService,
    WooCommerceConfigService,
    WooCommerceWebhookService,
    WooCommerceSyncService,
  ],
})
export class WooCommerceModule {}
