import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RetryScheduleEntity } from './entities/retry-schedule.entity';
import { RetryScheduleService } from './retry-schedule.service';

@Module({
  imports: [TypeOrmModule.forFeature([RetryScheduleEntity])],
  providers: [RetryScheduleService],
  exports: [RetryScheduleService],
})
export class RetryScheduleModule {}
