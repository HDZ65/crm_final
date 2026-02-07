import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Domain entities
import {
  WooCommerceConfigEntity,
  WooCommerceMappingEntity,
  WooCommerceWebhookEventEntity,
} from './domain/woocommerce/entities';
import { ImsWebhookEventEntity } from './domain/mondial-tv/entities/ims-webhook-event.entity';

// Infrastructure services (TypeORM repositories)
import {
  WooCommerceWebhookEventService,
  WooCommerceMappingService,
  WooCommerceConfigService,
} from './infrastructure/persistence/typeorm/repositories/woocommerce';
import { ImsWebhookEventService } from './infrastructure/persistence/typeorm/repositories/mondial-tv/ims-webhook-event.service';
import { MockImsClient } from './infrastructure/external/mondial-tv/mock-ims-client';
import { IMS_CLIENT } from './domain/mondial-tv/ports/IImsClient';

// Domain services
import { WooCommerceWebhookService } from './domain/woocommerce/services/woocommerce-webhook.service';
import { WooCommerceSyncService } from './domain/woocommerce/services/woocommerce-sync.service';
import { WooCommerceNatsWorkersService } from './domain/woocommerce/services/woocommerce-nats-workers.service';

// HTTP controllers
import { WooCommerceWebhookController } from './infrastructure/http/woocommerce/webhook.controller';
import { ImsWebhookController } from './infrastructure/http/mondial-tv/ims-webhook.controller';

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
      ImsWebhookEventEntity,
    ]),
    forwardRef(() => SubscriptionsModule),
  ],
  controllers: [WooCommerceWebhookController, ImsWebhookController, WooCommerceController],
  providers: [
    // TypeORM repository services
    WooCommerceWebhookEventService,
    WooCommerceMappingService,
    WooCommerceConfigService,
    ImsWebhookEventService,
    MockImsClient,
    {
      provide: IMS_CLIENT,
      useExisting: MockImsClient,
    },
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
    ImsWebhookEventService,
    MockImsClient,
    IMS_CLIENT,
    WooCommerceWebhookService,
    WooCommerceSyncService,
  ],
})
export class WooCommerceModule {}
