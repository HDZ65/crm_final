import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Domain entities
import {
  ClientBaseEntity,
  ClientEntrepriseEntity,
  ClientPartenaireEntity,
  AdresseEntity,
  StatutClientEntity,
  ConditionPaiementEntity,
  EmissionFactureEntity,
  FacturationParEntity,
  PeriodeFacturationEntity,
  TransporteurCompteEntity,
} from './domain/clients/entities';

// Infrastructure services
import {
  ClientBaseService,
  ClientEntrepriseService,
  ClientPartenaireService,
  AdresseService,
  StatutClientService,
  ConditionPaiementService,
  EmissionFactureService,
  FacturationParService,
  PeriodeFacturationService,
  TransporteurCompteService,
} from './infrastructure/persistence/typeorm/repositories/clients';

// Interface controllers
import {
  ClientBaseController,
  ClientEntrepriseController,
  ClientPartenaireController,
  AdresseController,
  StatutClientController,
  ConditionPaiementController,
  EmissionFactureController,
  FacturationParController,
  PeriodeFacturationController,
  TransporteurCompteController,
} from './infrastructure/grpc/clients';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ClientBaseEntity,
      ClientEntrepriseEntity,
      ClientPartenaireEntity,
      AdresseEntity,
      StatutClientEntity,
      ConditionPaiementEntity,
      EmissionFactureEntity,
      FacturationParEntity,
      PeriodeFacturationEntity,
      TransporteurCompteEntity,
    ]),
  ],
  controllers: [
    ClientBaseController,
    ClientEntrepriseController,
    ClientPartenaireController,
    AdresseController,
    StatutClientController,
    ConditionPaiementController,
    EmissionFactureController,
    FacturationParController,
    PeriodeFacturationController,
    TransporteurCompteController,
  ],
  providers: [
    ClientBaseService,
    ClientEntrepriseService,
    ClientPartenaireService,
    AdresseService,
    StatutClientService,
    ConditionPaiementService,
    EmissionFactureService,
    FacturationParService,
    PeriodeFacturationService,
    TransporteurCompteService,
  ],
  exports: [
    ClientBaseService,
    ClientEntrepriseService,
    ClientPartenaireService,
    AdresseService,
    StatutClientService,
    ConditionPaiementService,
    EmissionFactureService,
    FacturationParService,
    PeriodeFacturationService,
    TransporteurCompteService,
  ],
})
export class ClientsModule {}
