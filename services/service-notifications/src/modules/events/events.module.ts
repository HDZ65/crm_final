import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProcessedEvent, ProcessedEventsRepository } from '@crm/nats-utils';
import { NotificationModule } from '../notification/notification.module';
import { ClientCreatedHandler } from './client-created.handler';
import { InvoiceCreatedHandler } from './invoice-created.handler';

@Module({
  imports: [TypeOrmModule.forFeature([ProcessedEvent]), NotificationModule],
  providers: [ProcessedEventsRepository, ClientCreatedHandler, InvoiceCreatedHandler],
})
export class EventsModule {}
