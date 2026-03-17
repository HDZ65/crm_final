import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { EmailSenderService, resolveProtoPath } from '@crm/shared-kernel';

// Domain entities
import {
  StatutContratEntity,
  ContratEntity,
  LigneContratEntity,
  HistoriqueStatutContratEntity,
  OrchestrationHistoryEntity,
  ReconductionTaciteLogEntity,
} from './domain/contrats/entities';

// Infrastructure services
import { ContratService, ReconductionTaciteLogService } from './infrastructure/persistence/typeorm/repositories/contrats';

// Domain services
import { ContratImportService } from './domain/contrats/services/contrat-import.service';
import { ImportMapperService } from './domain/import/services/import-mapper.service';
import { ImportOrchestratorService } from './domain/import/services/import-orchestrator.service';

// Infrastructure services
import { ContratImportSchedulerService } from './infrastructure/scheduling/contrat-import-scheduler.service';
import { ReconductionTaciteSchedulerService } from './infrastructure/scheduling/reconduction-tacite-scheduler.service';

// Interface controllers
import { ContratController, ContratImportController, ContractOrchestrationController } from './infrastructure/grpc/contrats';
import { ImportOrchestratorController } from './infrastructure/grpc/import/import-orchestrator.controller';
import { ContratLifecycleService } from './domain/contrats/services/contrat-lifecycle.service';
import { ContratHistoryService } from './domain/contrats/services/contrat-history.service';
import { ContratLifecyclePublisher } from './infrastructure/messaging/nats/publishers/contrat-lifecycle.publisher';
import { DunningContractSuspensionHandler } from './infrastructure/messaging/nats/handlers/dunning-contract-suspension.handler';
import { ProvisioningContractActivationHandler } from './infrastructure/messaging/nats/handlers/provisioning-contract-activation.handler';
import { ReconductionNotificationHandler } from './infrastructure/messaging/nats/handlers/reconduction-notification.handler';

const grpcLoaderOptions = {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
};

// Cross-context dependencies
import { CommercialModule } from './commercial.module';
import { ProductsModule } from './products.module';
import { SubscriptionsModule } from './subscriptions.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      StatutContratEntity,
      ContratEntity,
      LigneContratEntity,
      HistoriqueStatutContratEntity,
      OrchestrationHistoryEntity,
      ReconductionTaciteLogEntity,
    ]),
    forwardRef(() => CommercialModule),
    forwardRef(() => ProductsModule),
    SubscriptionsModule,
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
        name: 'LOGISTICS_PACKAGE',
        transport: Transport.GRPC,
        options: {
          package: 'logistics',
          protoPath: resolveProtoPath('logistics/logistics.proto'),
          url: process.env.GRPC_LOGISTICS_URL || 'localhost:50054',
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
    ContratController,
    ContratImportController,
    ImportOrchestratorController,
    ContractOrchestrationController,
  ],
  providers: [
    ContratService,
    ReconductionTaciteLogService,
    {
      provide: 'IReconductionTaciteRepository',
      useExisting: ReconductionTaciteLogService,
    },
    ContratImportService,
    ImportMapperService,
    ImportOrchestratorService,
    ContratImportSchedulerService,
    ReconductionTaciteSchedulerService,
    EmailSenderService,
    ContratHistoryService,
    ContratLifecyclePublisher,
    {
      provide: 'IContratRepository',
      useExisting: ContratService,
    },
    {
      provide: ContratLifecycleService,
      useFactory: (repo: any, historyService: ContratHistoryService, publisher: ContratLifecyclePublisher) => {
        return new ContratLifecycleService(repo, historyService, publisher);
      },
      inject: ['IContratRepository', ContratHistoryService, ContratLifecyclePublisher],
    },
    DunningContractSuspensionHandler,
    ProvisioningContractActivationHandler,
    ReconductionNotificationHandler,
  ],
  exports: [
    ContratService,
    ReconductionTaciteLogService,
    ContratLifecycleService,
  ],
})
export class ContratsModule {}
