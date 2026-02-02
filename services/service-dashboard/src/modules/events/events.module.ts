import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProcessedEvent, ProcessedEventsRepository } from '@crm/nats-utils';
import { ClientCreatedHandler } from './client-created.handler';
import { InvoiceCreatedHandler } from './invoice-created.handler';
import { PaymentReceivedHandler } from './payment-received.handler';

@Module({
  imports: [TypeOrmModule.forFeature([ProcessedEvent])],
  providers: [ProcessedEventsRepository, ClientCreatedHandler, InvoiceCreatedHandler, PaymentReceivedHandler],
})
export class EventsModule {}
