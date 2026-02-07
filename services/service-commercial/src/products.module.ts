import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Domain entities
import {
  ModeleDistributionEntity,
  GammeEntity,
  GrilleTarifaireEntity,
  ProduitEntity,
  PrixProduitEntity,
  VersionProduitEntity,
  PublicationProduitEntity,
  DocumentProduitEntity,
  ConfigurationBundleEntity,
  FormuleProduitEntity,
} from './domain/products/entities';

// Infrastructure services
import { BundleEngineService, ProduitService, GammeService, FormuleProduitService } from './infrastructure/persistence/typeorm/repositories/products';

// Interface controllers
import { BundleController, ProduitController, GammeController } from './infrastructure/grpc/products';

// Cross-context dependencies
import { ContratsModule } from './contrats.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ModeleDistributionEntity,
      GammeEntity,
      GrilleTarifaireEntity,
      ProduitEntity,
      PrixProduitEntity,
      VersionProduitEntity,
      PublicationProduitEntity,
      DocumentProduitEntity,
      ConfigurationBundleEntity,
      FormuleProduitEntity,
    ]),
    forwardRef(() => ContratsModule),
  ],
  controllers: [
    ProduitController,
    BundleController,
    GammeController,
  ],
  providers: [
    ProduitService,
    BundleEngineService,
    GammeService,
    FormuleProduitService,
  ],
  exports: [
    ProduitService,
    BundleEngineService,
    GammeService,
    FormuleProduitService,
  ],
})
export class ProductsModule {}
