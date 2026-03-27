import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Domain entities — Subscriptions
import {
  SubscriptionCycleEntity,
  SubscriptionEntity,
  SubscriptionHistoryEntity,
  SubscriptionLineEntity,
  SubscriptionPlanEntity,
  SubscriptionPreferenceEntity,
  SubscriptionPreferenceHistoryEntity,
  SubscriptionPreferenceSchemaEntity,
  SubscriptionStatusHistoryEntity,
} from './domain/subscriptions/entities';
import { PreferenceCutoffService } from './domain/subscriptions/services/preference-cutoff.service';
// Domain services
import { PreferenceValidationService } from './domain/subscriptions/services/preference-validation.service';
// Interface controllers (gRPC)
import {
  SubscriptionController,
  SubscriptionPlanController,
  SubscriptionPreferenceController,
} from './infrastructure/grpc/subscriptions';
// Infrastructure services (repositories) — Subscriptions
import {
  SubscriptionCycleService,
  SubscriptionHistoryService,
  SubscriptionPlanService,
  SubscriptionPreferenceHistoryService,
  SubscriptionPreferenceSchemaService,
  SubscriptionPreferenceService,
  SubscriptionService,
  SubscriptionStatusHistoryService,
} from './infrastructure/persistence/typeorm/repositories/subscriptions';

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
  controllers: [SubscriptionPlanController, SubscriptionController, SubscriptionPreferenceController],
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
