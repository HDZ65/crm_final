import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Domain entities
import {
  SystemDebitConfigurationEntity,
  CutoffConfigurationEntity,
  CompanyDebitConfigurationEntity,
  ClientDebitConfigurationEntity,
  ContractDebitConfigurationEntity,
  HolidayZoneEntity,
  HolidayEntity,
  PlannedDebitEntity,
  VolumeForecastEntity,
  VolumeThresholdEntity,
  CalendarAuditLogEntity,
} from './domain/calendar/entities';

// Infrastructure services
import { ConfigurationService, CalendarAdminService } from './infrastructure/persistence/typeorm/repositories/calendar';

// Interface controllers
import { ConfigurationController, CalendarAdminController } from './infrastructure/grpc/calendar';

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
      PlannedDebitEntity,
      VolumeForecastEntity,
      VolumeThresholdEntity,
      CalendarAuditLogEntity,
    ]),
  ],
  controllers: [
    ConfigurationController,
    CalendarAdminController,
  ],
  providers: [
    ConfigurationService,
    CalendarAdminService,
  ],
  exports: [
    ConfigurationService,
    CalendarAdminService,
  ],
})
export class CalendarModule {}
