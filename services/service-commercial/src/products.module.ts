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
import { TarificationService } from './domain/products/services/tarification.engine';

// Infrastructure services
import { BundleEngineService, ProduitService, GammeService, FormuleProduitService } from './infrastructure/persistence/typeorm/repositories/products';

// Interface controllers
import {
  BundleController,
  CatalogController,
  ProduitController,
  GammeController,
  FormuleProduitController,
} from './infrastructure/grpc/products';

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
    CatalogController,
    FormuleProduitController,
  ],
  providers: [
    ProduitService,
    BundleEngineService,
    GammeService,
    FormuleProduitService,
    TarificationService,
  ],
  exports: [
    ProduitService,
    BundleEngineService,
    GammeService,
    FormuleProduitService,
    TarificationService,
  ],
})
export class ProductsModule {}
