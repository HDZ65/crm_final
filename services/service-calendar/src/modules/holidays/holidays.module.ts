import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { HolidayZoneEntity } from './entities/holiday-zone.entity.js';
import { HolidayEntity } from './entities/holiday.entity.js';
import { HolidaysService } from './holidays.service.js';

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
