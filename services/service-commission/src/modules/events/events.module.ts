import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProcessedEvent, ProcessedEventsRepository } from '@crm/nats-utils';
import { PaymentReceivedHandler } from './payment-received.handler';

@Module({
  imports: [TypeOrmModule.forFeature([ProcessedEvent])],
  providers: [ProcessedEventsRepository, PaymentReceivedHandler],
})
export class EventsModule {}
