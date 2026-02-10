import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Domain entities
import {
  StatutContratEntity,
  ContratEntity,
  LigneContratEntity,
  HistoriqueStatutContratEntity,
  OrchestrationHistoryEntity,
} from './domain/contrats/entities';

// Infrastructure services
import { ContratService } from './infrastructure/persistence/typeorm/repositories/contrats';

// Domain services
import { ContratImportService } from './domain/contrats/services/contrat-import.service';
import { ImportMapperService } from './domain/import/services/import-mapper.service';
import { ImportOrchestratorService } from './domain/import/services/import-orchestrator.service';

// Infrastructure services
import { ContratImportSchedulerService } from './infrastructure/scheduling/contrat-import-scheduler.service';

// Interface controllers
import { ContratController, ContratImportController } from './infrastructure/grpc/contrats';
import { ImportOrchestratorController } from './infrastructure/grpc/import/import-orchestrator.controller';

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
    ]),
    forwardRef(() => CommercialModule),
    forwardRef(() => ProductsModule),
    SubscriptionsModule,
  ],
  controllers: [
    ContratController,
    ContratImportController,
    ImportOrchestratorController,
  ],
  providers: [
    ContratService,
    ContratImportService,
    ImportMapperService,
    ImportOrchestratorService,
    ContratImportSchedulerService,
  ],
  exports: [
    ContratService,
  ],
})
export class ContratsModule {}
