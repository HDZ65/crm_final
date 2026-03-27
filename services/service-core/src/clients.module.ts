import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Domain entities
import {
  AdresseEntity,
  ClientBaseEntity,
  ClientEntrepriseEntity,
  ClientPartenaireEntity,
  ConditionPaiementEntity,
  EmissionFactureEntity,
  FacturationParEntity,
  PeriodeFacturationEntity,
  StatutClientEntity,
  TransporteurCompteEntity,
} from './domain/clients/entities';
// Interface controllers
import {
  AdresseController,
  ClientBaseController,
  ClientEntrepriseController,
  ClientPartenaireController,
  ConditionPaiementController,
  EmissionFactureController,
  FacturationParController,
  PeriodeFacturationController,
  StatutClientController,
  TransporteurCompteController,
} from './infrastructure/grpc/clients';

// NATS handlers
import {
  AdresseCreateHandler,
  ClientCreateHandler,
  ClientDeleteHandler,
  ClientNatsWorkersService,
  ClientSearchHandler,
  ClientUpdateHandler,
} from './infrastructure/messaging/nats/handlers';
// Infrastructure services
import {
  AdresseService,
  ClientBaseService,
  ClientEntrepriseService,
  ClientPartenaireService,
  ConditionPaiementService,
  EmissionFactureService,
  FacturationParService,
  PeriodeFacturationService,
  StatutClientService,
  TransporteurCompteService,
} from './infrastructure/persistence/typeorm/repositories/clients';

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
    ClientNatsWorkersService,
    ClientSearchHandler,
    ClientCreateHandler,
    ClientUpdateHandler,
    ClientDeleteHandler,
    AdresseCreateHandler,
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
