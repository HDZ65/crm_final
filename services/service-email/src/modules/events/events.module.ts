import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProcessedEvent, ProcessedEventsRepository } from '@crm/nats-utils';
import { ClientCreatedHandler } from './client-created.handler';
import { ContractSignedHandler } from './contract-signed.handler';
import { InvoiceCreatedHandler } from './invoice-created.handler';
import { PaymentRejectedHandler } from './payment-rejected.handler';

@Module({
  imports: [TypeOrmModule.forFeature([ProcessedEvent])],
  providers: [ProcessedEventsRepository, ClientCreatedHandler, ContractSignedHandler, InvoiceCreatedHandler, PaymentRejectedHandler],
})
export class EventsModule {}
