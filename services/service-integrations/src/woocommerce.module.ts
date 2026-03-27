import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
// Domain entities
import { SubscriptionEntity } from './domain/subscriptions/entities/subscription.entity';
import {
  WooCommerceConfigEntity,
  WooCommerceMappingEntity,
  WooCommerceWebhookEventEntity,
} from './domain/woocommerce/entities';
import { WooCommerceNatsWorkersService } from './domain/woocommerce/services/woocommerce-nats-workers.service';
import { WooCommerceSyncService } from './domain/woocommerce/services/woocommerce-sync.service';
import { WooCommerceWebhookService } from './domain/woocommerce/services/woocommerce-webhook.service';
// Infrastructure services
import { SubscriptionService } from './infrastructure/persistence/typeorm/repositories/subscriptions/subscription.service';
import {
  WooCommerceConfigService,
  WooCommerceMappingService,
  WooCommerceWebhookEventService,
} from './infrastructure/persistence/typeorm/repositories/woocommerce';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      WooCommerceConfigEntity,
      WooCommerceMappingEntity,
      WooCommerceWebhookEventEntity,
      SubscriptionEntity,
    ]),
  ],
  controllers: [],
  providers: [
    WooCommerceWebhookEventService,
    WooCommerceMappingService,
    WooCommerceConfigService,
    WooCommerceWebhookService,
    WooCommerceSyncService,
    WooCommerceNatsWorkersService,
    SubscriptionService,
  ],
  exports: [
    WooCommerceWebhookEventService,
    WooCommerceMappingService,
    WooCommerceConfigService,
    WooCommerceWebhookService,
    WooCommerceSyncService,
    WooCommerceNatsWorkersService,
    SubscriptionService,
  ],
})
export class WooCommerceModule {}
