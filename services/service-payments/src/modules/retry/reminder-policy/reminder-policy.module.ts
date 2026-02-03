import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReminderPolicyEntity } from './entities/reminder-policy.entity';
import { ReminderPolicyService } from './reminder-policy.service';

@Module({
  imports: [TypeOrmModule.forFeature([ReminderPolicyEntity])],
  providers: [ReminderPolicyService],
  exports: [ReminderPolicyService],
})
export class ReminderPolicyModule {}
