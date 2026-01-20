import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TrackingEventEntity } from './entities/tracking-event.entity.js';
import { TrackingService } from './tracking.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([TrackingEventEntity])],
  providers: [TrackingService],
  exports: [TrackingService],
})
export class TrackingModule {}
