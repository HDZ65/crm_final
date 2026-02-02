import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProcessedEvent, ProcessedEventsRepository } from '@crm/nats-utils';
import { ClientCreatedHandler } from './client-created.handler';

@Module({
  imports: [TypeOrmModule.forFeature([ProcessedEvent])],
  providers: [ProcessedEventsRepository, ClientCreatedHandler],
})
export class EventsModule {}
