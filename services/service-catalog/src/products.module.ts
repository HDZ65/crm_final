import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
// Domain entities
import {
  AccountingExportLogEntity,
  ConfigurationBundleEntity,
  DocumentProduitEntity,
  FormuleProduitEntity,
  GammeEntity,
  GrilleTarifaireEntity,
  ModeleDistributionEntity,
  PricingRuleEntity,
  PrixProduitEntity,
  ProductAccountingMappingEntity,
  ProductBadgeEntity,
  ProductExternalMappingEntity,
  ProduitEntity,
  PublicationProduitEntity,
  VersionProduitEntity,
} from './domain/products/entities';
import { DocumentAlertEntity } from './domain/products/entities/document-alert.entity';
import { ProductValidationService } from './domain/products/services/product-validation.service';
import { TarificationService } from './domain/products/services/tarification.engine';
// Interface controllers
import {
  BundleController,
  CatalogController,
  FormuleProduitController,
  GammeController,
  ProduitController,
} from './infrastructure/grpc/products';
// Infrastructure services
import {
  BundleEngineService,
  FormuleProduitService,
  GammeService,
  ProduitService,
} from './infrastructure/persistence/typeorm/repositories/products';

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
      PricingRuleEntity,
      ProductExternalMappingEntity,
      ProductAccountingMappingEntity,
      AccountingExportLogEntity,
      ProductBadgeEntity,
      DocumentAlertEntity,
    ]),
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
    ProductValidationService,
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
