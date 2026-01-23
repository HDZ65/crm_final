import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { HolidayZoneEntity } from './entities/holiday-zone.entity';
import { HolidayEntity } from './entities/holiday.entity';
import { HolidaysService } from './holidays.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      HolidayZoneEntity,
      HolidayEntity,
    ]),
  ],
  providers: [HolidaysService],
  exports: [HolidaysService, TypeOrmModule],
})
export class HolidaysModule {}
