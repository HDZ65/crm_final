import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Domain entities
import {
  ConsentementEntity,
  AbonnementDepanssurEntity,
  OptionAbonnementEntity,
  CompteurPlafondEntity,
  HistoriqueStatutAbonnementEntity,
  DossierDeclaratifEntity,
  HistoriqueStatutDossierEntity,
} from './domain/depanssur/entities';

// Infrastructure services
import {
  AbonnementService,
  OptionAbonnementService,
  CompteurPlafondService,
  DossierDeclaratifService,
} from './infrastructure/persistence/typeorm/repositories/depanssur';

// Interface controllers
import { DepanssurController } from './infrastructure/grpc/depanssur';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ConsentementEntity,
      AbonnementDepanssurEntity,
      OptionAbonnementEntity,
      CompteurPlafondEntity,
      HistoriqueStatutAbonnementEntity,
      DossierDeclaratifEntity,
      HistoriqueStatutDossierEntity,
    ]),
  ],
  controllers: [
    DepanssurController,
  ],
  providers: [
    AbonnementService,
    OptionAbonnementService,
    CompteurPlafondService,
    DossierDeclaratifService,
  ],
  exports: [
    AbonnementService,
    OptionAbonnementService,
    CompteurPlafondService,
    DossierDeclaratifService,
  ],
})
export class DepanssurModule {}
