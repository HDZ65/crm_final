import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProcessedEvent, ProcessedEventsRepository } from '@crm/nats-utils';
import { ClientCreatedHandler } from './client-created.handler';
import { InvoiceCreatedHandler } from './invoice-created.handler';
import { PaymentReceivedHandler } from './payment-received.handler';
import { PaymentRejectedHandler } from './payment-rejected.handler';

@Module({
  imports: [TypeOrmModule.forFeature([ProcessedEvent])],
  providers: [ProcessedEventsRepository, ClientCreatedHandler, InvoiceCreatedHandler, PaymentReceivedHandler, PaymentRejectedHandler],
})
export class EventsModule {}
