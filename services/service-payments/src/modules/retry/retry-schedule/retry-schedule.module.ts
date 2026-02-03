import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RetryScheduleEntity } from './entities/retry-schedule.entity';
import { RetryScheduleService } from './retry-schedule.service';
import { RetryScheduleController } from './retry-schedule.controller';
import { RetryAttemptModule } from '../retry-attempt/retry-attempt.module';
import { RetryJobModule } from '../retry-job/retry-job.module';
import { ReminderModule } from '../reminder/reminder.module';
import { AuditLogModule } from '../audit-log/audit-log.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([RetryScheduleEntity]),
    RetryAttemptModule,
    RetryJobModule,
    forwardRef(() => ReminderModule),
    AuditLogModule,
  ],
  controllers: [RetryScheduleController],
  providers: [RetryScheduleService],
  exports: [RetryScheduleService],
})
export class RetryScheduleModule {}
