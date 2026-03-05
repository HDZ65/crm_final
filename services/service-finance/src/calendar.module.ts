import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OptimizationSuggestionQueryService } from './application/queries/optimization-suggestion-query.service';

// Domain entities
import {
  SystemDebitConfigurationEntity,
  CutoffConfigurationEntity,
  CompanyDebitConfigurationEntity,
  ClientDebitConfigurationEntity,
  ContractDebitConfigurationEntity,
  HolidayZoneEntity,
  HolidayEntity,
  DebitLotEntity,
  PlannedDebitEntity,
  VolumeForecastEntity,
  VolumeThresholdEntity,
  CalendarAuditLogEntity,
} from './domain/calendar/entities';
import {
  PaymentIntentEntity,
  ScheduleEntity,
  RiskScoreEntity,
} from './domain/payments/entities';

// Infrastructure services
import {
  ConfigurationService,
  CalendarAdminService,
  OptimizationSuggestionService,
  AnalyticsAggregationService,
  LotService,
} from './infrastructure/persistence/typeorm/repositories/calendar';

// Interface controllers
import {
  ConfigurationController,
  CalendarAdminController,
  OptimizationSuggestionController,
  AnalyticsController,
  LotController,
} from './infrastructure/grpc/calendar';
import { I_OPTIMIZATION_SUGGESTION_REPOSITORY } from './domain/calendar/repositories';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SystemDebitConfigurationEntity,
      CutoffConfigurationEntity,
      CompanyDebitConfigurationEntity,
      ClientDebitConfigurationEntity,
      ContractDebitConfigurationEntity,
      HolidayZoneEntity,
      HolidayEntity,
      DebitLotEntity,
      PlannedDebitEntity,
      VolumeForecastEntity,
      VolumeThresholdEntity,
      CalendarAuditLogEntity,
      PaymentIntentEntity,
      ScheduleEntity,
      RiskScoreEntity,
    ]),
  ],
  controllers: [
    ConfigurationController,
    CalendarAdminController,
    OptimizationSuggestionController,
    AnalyticsController,
    LotController,
  ],
  providers: [
    ConfigurationService,
    CalendarAdminService,
    OptimizationSuggestionService,
    {
      provide: I_OPTIMIZATION_SUGGESTION_REPOSITORY,
      useExisting: OptimizationSuggestionService,
    },
    OptimizationSuggestionQueryService,
    AnalyticsAggregationService,
    LotService,
  ],
  exports: [
    ConfigurationService,
    CalendarAdminService,
    OptimizationSuggestionService,
    OptimizationSuggestionQueryService,
    AnalyticsAggregationService,
    LotService,
  ],
})
export class CalendarModule {}
