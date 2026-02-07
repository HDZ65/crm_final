import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Domain entities
import {
  SubscriptionPlanEntity,
  SubscriptionEntity,
  SubscriptionCycleEntity,
  SubscriptionStatusHistoryEntity,
} from './domain/subscriptions/entities';

// Infrastructure services (repositories)
import {
  SubscriptionPlanService,
  SubscriptionService,
  SubscriptionCycleService,
  SubscriptionStatusHistoryService,
} from './infrastructure/persistence/typeorm/repositories/subscriptions';

// Interface controllers (gRPC)
import {
  SubscriptionPlanController,
  SubscriptionController,
  SubscriptionPreferenceController,
  WooCommerceController,
} from './infrastructure/grpc/subscriptions';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SubscriptionPlanEntity,
      SubscriptionEntity,
      SubscriptionCycleEntity,
      SubscriptionStatusHistoryEntity,
    ]),
  ],
  controllers: [
    SubscriptionPlanController,
    SubscriptionController,
    SubscriptionPreferenceController,
    WooCommerceController,
  ],
  providers: [
    SubscriptionPlanService,
    SubscriptionService,
    SubscriptionCycleService,
    SubscriptionStatusHistoryService,
  ],
  exports: [
    SubscriptionPlanService,
    SubscriptionService,
    SubscriptionCycleService,
    SubscriptionStatusHistoryService,
  ],
})
export class SubscriptionsModule {}
