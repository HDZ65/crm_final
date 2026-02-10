import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Domain entities
import {
  CarrierAccountEntity,
  ColisEntity,
  ExpeditionEntity,
  TrackingEventEntity,
} from './domain/logistics/entities';
// Note: FulfillmentCutoffConfigEntity is now managed by FulfillmentModule

// Infrastructure services
import {
  CarrierService,
  ColisService,
  ExpeditionService,
  TrackingService,
} from './infrastructure/persistence/typeorm/repositories/logistics';
// Note: FulfillmentCutoffConfigService is now managed by FulfillmentModule

// Infrastructure external
import { MailevaService } from './infrastructure/external/maileva';

// Interface controllers
import {
  CarrierController,
  ColisController,
  ExpeditionController,
  TrackingController,
  MailevaController,
} from './infrastructure/grpc';

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
