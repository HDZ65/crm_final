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
} from './domain/products/entities';

// Infrastructure services
import { ProduitService } from './infrastructure/persistence/typeorm/repositories/products';

// Interface controllers
import { ProduitController } from './interfaces/grpc/controllers/products';

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
    ]),
    forwardRef(() => ContratsModule),
  ],
  controllers: [
    ProduitController,
  ],
  providers: [
    ProduitService,
  ],
  exports: [
    ProduitService,
  ],
})
export class ProductsModule {}
