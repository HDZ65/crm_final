import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';

import { RetryScheduleEntity } from '../retry-schedule/entities/retry-schedule.entity';
import { RetryAttemptEntity } from '../retry-attempt/entities/retry-attempt.entity';
import { RetryJobEntity } from '../retry-job/entities/retry-job.entity';

import { RetrySchedulerService } from './retry-scheduler.service';
import { RetryPolicyModule } from '../retry-policy/retry-policy.module';
import { AuditLogModule } from '../audit-log/audit-log.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    TypeOrmModule.forFeature([
      RetryScheduleEntity,
      RetryAttemptEntity,
      RetryJobEntity,
    ]),
    RetryPolicyModule,
    AuditLogModule,
  ],
  providers: [RetrySchedulerService],
  exports: [RetrySchedulerService],
})
export class SchedulerModule {}
