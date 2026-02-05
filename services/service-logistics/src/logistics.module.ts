import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Domain entities
import {
  CarrierAccountEntity,
  ColisEntity,
  ExpeditionEntity,
  TrackingEventEntity,
} from './domain/logistics/entities';

// Infrastructure services
import {
  CarrierService,
  ColisService,
  ExpeditionService,
  TrackingService,
} from './infrastructure/persistence/typeorm/repositories/logistics';

// Infrastructure external
import { MailevaService } from './infrastructure/external/maileva';

// Interface controllers
import {
  CarrierController,
  ColisController,
  ExpeditionController,
  TrackingController,
  MailevaController,
} from './interfaces/grpc/controllers/logistics';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CarrierAccountEntity,
      ColisEntity,
      ExpeditionEntity,
      TrackingEventEntity,
    ]),
  ],
  controllers: [
    CarrierController,
    ColisController,
    ExpeditionController,
    TrackingController,
    MailevaController,
  ],
  providers: [
    // Repository services
    CarrierService,
    ColisService,
    ExpeditionService,
    TrackingService,
    // External services
    MailevaService,
  ],
  exports: [
    CarrierService,
    ColisService,
    ExpeditionService,
    TrackingService,
    MailevaService,
  ],
})
export class LogisticsModule {}
