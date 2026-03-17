import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { resolveProtoPath, EmailSenderService } from '@crm/shared-kernel';
// Domain entities
import {
  CarrierAccountEntity,
  ColisEntity,
  ExpeditionEntity,
  TrackingEventEntity,
  RetourExpeditionEntity,
} from './domain/logistics/entities';
// Note: FulfillmentCutoffConfigEntity is now managed by FulfillmentModule

// Infrastructure services
import {
  CarrierService,
  ColisService,
  ExpeditionService,
  TrackingService,
  RetourExpeditionService,
} from './infrastructure/persistence/typeorm/repositories/logistics';
// Note: FulfillmentCutoffConfigService is now managed by FulfillmentModule

// Infrastructure external
import { MailevaService } from './infrastructure/external/maileva';

// Infrastructure messaging (NATS handlers)
import { ShippingNotificationHandler } from './infrastructure/messaging/nats/handlers/shipping-notification.handler';

// Domain services
import { ReturnLabelService } from './domain/logistics/services/return-label.service';

// Interface controllers
import {
  CarrierController,
  ColisController,
  ExpeditionController,
  TrackingController,
  MailevaController,
  ReturnLabelController,
} from './infrastructure/grpc';

const grpcLoaderOptions = {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
};

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CarrierAccountEntity,
      ColisEntity,
      ExpeditionEntity,
      TrackingEventEntity,
      RetourExpeditionEntity,
    ]),
    // gRPC clients for cross-service communication
    ClientsModule.register([
      {
        name: 'CORE_PACKAGE',
        transport: Transport.GRPC,
        options: {
          package: 'clients',
          protoPath: resolveProtoPath('clients/clients.proto'),
          url: process.env.GRPC_CORE_URL || 'localhost:50052',
          loader: grpcLoaderOptions,
        },
      },
      {
        name: 'ENGAGEMENT_PACKAGE',
        transport: Transport.GRPC,
        options: {
          package: 'notifications',
          protoPath: resolveProtoPath('notifications/notifications.proto'),
          url: process.env.GRPC_ENGAGEMENT_URL || 'localhost:50051',
          loader: grpcLoaderOptions,
        },
      },
    ]),
  ],
  controllers: [
    CarrierController,
    ColisController,
    ExpeditionController,
    TrackingController,
    MailevaController,
    ReturnLabelController,
  ],
  providers: [
    // Repository services
    CarrierService,
    ColisService,
    ExpeditionService,
    TrackingService,
    RetourExpeditionService,
    // External services
    MailevaService,
    EmailSenderService,
    // Domain services
    ReturnLabelService,
    // NATS handlers
    ShippingNotificationHandler,
  ],
  exports: [
    CarrierService,
    ColisService,
    ExpeditionService,
    TrackingService,
    RetourExpeditionService,
    MailevaService,
    ReturnLabelService,
  ],
})
export class LogisticsModule {}
