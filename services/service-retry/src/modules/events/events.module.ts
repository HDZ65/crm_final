import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProcessedEvent, ProcessedEventsRepository } from '@crm/nats-utils';
import { RetryScheduleEntity } from '../retry-schedule/entities/retry-schedule.entity';
import { RetryPolicyEntity } from '../retry-policy/entities/retry-policy.entity';
import { PaymentRejectedHandler } from './payment-rejected.handler';

@Module({
  imports: [
    TypeOrmModule.forFeature([ProcessedEvent, RetryScheduleEntity, RetryPolicyEntity]),
  ],
  providers: [ProcessedEventsRepository, PaymentRejectedHandler],
})
export class EventsModule {}
