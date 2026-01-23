import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { PlannedDebitEntity } from './entities/planned-debit.entity';
import { VolumeForecastEntity } from './entities/volume-forecast.entity';
import { VolumeThresholdEntity } from './entities/volume-threshold.entity';
import { CalendarEngineService } from './calendar-engine.service';
import { ConfigurationModule } from '../configuration/configuration.module';
import { HolidaysModule } from '../holidays/holidays.module';

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
