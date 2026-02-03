import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReminderEntity } from './entities/reminder.entity';
import { ReminderService } from './reminder.service';
import { ReminderController } from './reminder.controller';
import { ReminderPolicyModule } from '../reminder-policy/reminder-policy.module';
import { AuditLogModule } from '../audit-log/audit-log.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ReminderEntity]),
    ReminderPolicyModule,
    AuditLogModule,
  ],
  controllers: [ReminderController],
  providers: [ReminderService],
  exports: [ReminderService],
})
export class ReminderModule {}
