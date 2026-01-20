import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CalendarClientService } from './calendar-client.service.js';

@Module({
  imports: [ConfigModule],
  providers: [CalendarClientService],
  exports: [CalendarClientService],
})
export class CalendarModule {}
