import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { PlannedDebitEntity } from './entities/planned-debit.entity.js';
import { VolumeForecastEntity } from './entities/volume-forecast.entity.js';
import { VolumeThresholdEntity } from './entities/volume-threshold.entity.js';
import { CalendarEngineService } from './calendar-engine.service.js';
import { ConfigurationModule } from '../configuration/configuration.module.js';
import { HolidaysModule } from '../holidays/holidays.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PlannedDebitEntity,
      VolumeForecastEntity,
      VolumeThresholdEntity,
    ]),
    forwardRef(() => ConfigurationModule),
    forwardRef(() => HolidaysModule),
  ],
  providers: [CalendarEngineService],
  exports: [CalendarEngineService],
})
export class EngineModule {}
