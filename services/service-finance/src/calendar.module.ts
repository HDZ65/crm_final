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
import { ConfigurationService } from './infrastructure/persistence/typeorm/repositories/calendar';

// Interface controllers
import { ConfigurationController } from './interfaces/grpc/controllers/calendar';

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
  ],
  providers: [
    ConfigurationService,
  ],
  exports: [
    ConfigurationService,
  ],
})
export class CalendarModule {}
