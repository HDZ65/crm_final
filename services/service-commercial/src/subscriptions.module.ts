import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Domain entities — Subscriptions
import {
  SubscriptionPlanEntity,
  SubscriptionEntity,
  SubscriptionHistoryEntity,
  SubscriptionCycleEntity,
  SubscriptionStatusHistoryEntity,
  SubscriptionPreferenceSchemaEntity,
  SubscriptionPreferenceEntity,
  SubscriptionPreferenceHistoryEntity,
} from './domain/subscriptions/entities';

// Domain services
import { PreferenceValidationService } from './domain/subscriptions/services/preference-validation.service';

// Infrastructure services (repositories) — Subscriptions
import {
  SubscriptionPlanService,
  SubscriptionService,
  SubscriptionHistoryService,
  SubscriptionCycleService,
  SubscriptionStatusHistoryService,
  SubscriptionPreferenceSchemaService,
  SubscriptionPreferenceService,
  SubscriptionPreferenceHistoryService,
} from './infrastructure/persistence/typeorm/repositories/subscriptions';

// Interface controllers (gRPC)
import {
  SubscriptionPlanController,
  SubscriptionController,
  SubscriptionPreferenceController,
} from './infrastructure/grpc/subscriptions';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SubscriptionPlanEntity,
      SubscriptionEntity,
      SubscriptionHistoryEntity,
      SubscriptionCycleEntity,
      SubscriptionStatusHistoryEntity,
      SubscriptionPreferenceSchemaEntity,
      SubscriptionPreferenceEntity,
      SubscriptionPreferenceHistoryEntity,
    ]),
  ],
  controllers: [
    SubscriptionPlanController,
    SubscriptionController,
    SubscriptionPreferenceController,
  ],
  providers: [
    SubscriptionPlanService,
    SubscriptionService,
    SubscriptionHistoryService,
    SubscriptionCycleService,
    SubscriptionStatusHistoryService,
    PreferenceValidationService,
    SubscriptionPreferenceSchemaService,
    SubscriptionPreferenceService,
    SubscriptionPreferenceHistoryService,
  ],
  exports: [
    SubscriptionPlanService,
    SubscriptionService,
    SubscriptionHistoryService,
    SubscriptionCycleService,
    SubscriptionStatusHistoryService,
    PreferenceValidationService,
    SubscriptionPreferenceSchemaService,
    SubscriptionPreferenceService,
    SubscriptionPreferenceHistoryService,
  ],
})
export class SubscriptionsModule {}
