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

// Interface controllers
import { ContratController } from './interfaces/grpc/controllers/contrats';

// Cross-context dependencies
import { CommercialModule } from './commercial.module';
import { ProductsModule } from './products.module';

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
  ],
  controllers: [
    ContratController,
  ],
  providers: [
    ContratService,
  ],
  exports: [
    ContratService,
  ],
})
export class ContratsModule {}
