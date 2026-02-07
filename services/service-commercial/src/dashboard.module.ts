import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Domain entities (cross-context)
import { ContratEntity } from './domain/contrats/entities/contrat.entity';
import { LigneContratEntity } from './domain/contrats/entities/ligne-contrat.entity';
import { ProduitEntity } from './domain/products/entities/produit.entity';

// Infrastructure services
import { DashboardService } from './infrastructure/persistence/typeorm/repositories/dashboard';

// Interface controllers
import {
  AlertesController,
  KpisCommerciauxController,
  RepartitionProduitsController,
} from './infrastructure/grpc/dashboard';

// Cross-context dependencies
import { ContratsModule } from './contrats.module';
import { ProductsModule } from './products.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ContratEntity,
      LigneContratEntity,
      ProduitEntity,
    ]),
    forwardRef(() => ContratsModule),
    forwardRef(() => ProductsModule),
  ],
  controllers: [
    AlertesController,
    KpisCommerciauxController,
    RepartitionProduitsController,
  ],
  providers: [
    DashboardService,
  ],
  exports: [
    DashboardService,
  ],
})
export class DashboardModule {}
