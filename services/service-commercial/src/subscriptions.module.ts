import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Domain entities — Subscriptions
import {
  SubscriptionPlanEntity,
  SubscriptionEntity,
  SubscriptionLineEntity,
  SubscriptionHistoryEntity,
  SubscriptionCycleEntity,
  SubscriptionStatusHistoryEntity,
  SubscriptionPreferenceSchemaEntity,
  SubscriptionPreferenceEntity,
  SubscriptionPreferenceHistoryEntity,
} from './domain/subscriptions/entities';

// Domain services
import { PreferenceValidationService } from './domain/subscriptions/services/preference-validation.service';
import { PreferenceCutoffService } from './domain/subscriptions/services/preference-cutoff.service';

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
      SubscriptionLineEntity,
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
    PreferenceCutoffService,
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
    PreferenceCutoffService,
    SubscriptionPreferenceSchemaService,
    SubscriptionPreferenceService,
    SubscriptionPreferenceHistoryService,
  ],
})
export class SubscriptionsModule {}
