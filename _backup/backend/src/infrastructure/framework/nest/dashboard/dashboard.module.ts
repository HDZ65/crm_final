import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Controllers
import { DashboardController } from './controllers/dashboard.controller';

// Entities needed for dashboard queries
import { ContratEntity } from '../../../db/entities/contrat.entity';
import { FactureEntity } from '../../../db/entities/facture.entity';
import { ClientBaseEntity } from '../../../db/entities/client-base.entity';
import { SocieteEntity } from '../../../db/entities/societe.entity';
import { LigneContratEntity } from '../../../db/entities/ligne-contrat.entity';
import { ProduitEntity } from '../../../db/entities/produit.entity';
import { StatutContratEntity } from '../../../db/entities/statut-contrat.entity';
import { UtilisateurEntity } from '../../../db/entities/utilisateur.entity';

// Use Cases
import { GetDashboardKpisUseCase } from '../../../../applications/usecase/dashboard/get-dashboard-kpis.usecase';
import { GetEvolutionCaUseCase } from '../../../../applications/usecase/dashboard/get-evolution-ca.usecase';
import { GetRepartitionProduitsUseCase } from '../../../../applications/usecase/dashboard/get-repartition-produits.usecase';
import { GetStatsSocietesUseCase } from '../../../../applications/usecase/dashboard/get-stats-societes.usecase';
import { GetAlertesUseCase } from '../../../../applications/usecase/dashboard/get-alertes.usecase';
import { GetKpisCommerciauxUseCase } from '../../../../applications/usecase/dashboard/get-kpis-commerciaux.usecase';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ContratEntity,
      FactureEntity,
      ClientBaseEntity,
      SocieteEntity,
      LigneContratEntity,
      ProduitEntity,
      StatutContratEntity,
      UtilisateurEntity,
    ]),
  ],
  controllers: [DashboardController],
  providers: [
    GetDashboardKpisUseCase,
    GetEvolutionCaUseCase,
    GetRepartitionProduitsUseCase,
    GetStatsSocietesUseCase,
    GetAlertesUseCase,
    GetKpisCommerciauxUseCase,
  ],
  exports: [
    GetDashboardKpisUseCase,
    GetEvolutionCaUseCase,
    GetRepartitionProduitsUseCase,
    GetStatsSocietesUseCase,
    GetAlertesUseCase,
    GetKpisCommerciauxUseCase,
  ],
})
export class DashboardModule {}
