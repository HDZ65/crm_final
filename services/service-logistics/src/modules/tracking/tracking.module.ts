import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TrackingEventEntity } from './entities/tracking-event.entity.js';
import { TrackingService } from './tracking.service.js';
import { TrackingController } from './tracking.controller.js';

@Module({
  imports: [TypeOrmModule.forFeature([TrackingEventEntity])],
  controllers: [TrackingController],
  providers: [TrackingService],
  exports: [TrackingService],
})
export class TrackingModule {}
