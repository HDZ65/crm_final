import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Controllers
import { FactureController } from './controllers/facture.controller';
import { StatutFactureController } from './controllers/statut-facture.controller';
import { EmissionFactureController } from './controllers/emission-facture.controller';
import { FacturationParController } from './controllers/facturation-par.controller';
import { PeriodeFacturationController } from './controllers/periode-facturation.controller';

// Entities
import { FactureEntity } from '../../../db/entities/facture.entity';
import { StatutFactureEntity } from '../../../db/entities/statut-facture.entity';
import { EmissionFactureEntity } from '../../../db/entities/emission-facture.entity';
import { FacturationParEntity } from '../../../db/entities/facturation-par.entity';
import { PeriodeFacturationEntity } from '../../../db/entities/periode-facturation.entity';

// Repositories
import { TypeOrmFactureRepository } from '../../../repositories/typeorm-facture.repository';
import { TypeOrmStatutFactureRepository } from '../../../repositories/typeorm-statut-facture.repository';
import { TypeOrmEmissionFactureRepository } from '../../../repositories/typeorm-emission-facture.repository';
import { TypeOrmFacturationParRepository } from '../../../repositories/typeorm-facturation-par.repository';
import { TypeOrmPeriodeFacturationRepository } from '../../../repositories/typeorm-periode-facturation.repository';

// Use Cases - Facture
import { CreateFactureUseCase } from '../../../../applications/usecase/facture/create-facture.usecase';
import { GetFactureUseCase } from '../../../../applications/usecase/facture/get-facture.usecase';
import { UpdateFactureUseCase } from '../../../../applications/usecase/facture/update-facture.usecase';
import { DeleteFactureUseCase } from '../../../../applications/usecase/facture/delete-facture.usecase';

// Use Cases - StatutFacture
import { CreateStatutFactureUseCase } from '../../../../applications/usecase/statut-facture/create-statut-facture.usecase';
import { GetStatutFactureUseCase } from '../../../../applications/usecase/statut-facture/get-statut-facture.usecase';
import { UpdateStatutFactureUseCase } from '../../../../applications/usecase/statut-facture/update-statut-facture.usecase';
import { DeleteStatutFactureUseCase } from '../../../../applications/usecase/statut-facture/delete-statut-facture.usecase';

// Use Cases - EmissionFacture
import { CreateEmissionFactureUseCase } from '../../../../applications/usecase/emission-facture/create-emission-facture.usecase';
import { GetEmissionFactureUseCase } from '../../../../applications/usecase/emission-facture/get-emission-facture.usecase';
import { UpdateEmissionFactureUseCase } from '../../../../applications/usecase/emission-facture/update-emission-facture.usecase';
import { DeleteEmissionFactureUseCase } from '../../../../applications/usecase/emission-facture/delete-emission-facture.usecase';

// Use Cases - FacturationPar
import { CreateFacturationParUseCase } from '../../../../applications/usecase/facturation-par/create-facturation-par.usecase';
import { GetFacturationParUseCase } from '../../../../applications/usecase/facturation-par/get-facturation-par.usecase';
import { UpdateFacturationParUseCase } from '../../../../applications/usecase/facturation-par/update-facturation-par.usecase';
import { DeleteFacturationParUseCase } from '../../../../applications/usecase/facturation-par/delete-facturation-par.usecase';

// Use Cases - PeriodeFacturation
import { CreatePeriodeFacturationUseCase } from '../../../../applications/usecase/periode-facturation/create-periode-facturation.usecase';
import { GetPeriodeFacturationUseCase } from '../../../../applications/usecase/periode-facturation/get-periode-facturation.usecase';
import { UpdatePeriodeFacturationUseCase } from '../../../../applications/usecase/periode-facturation/update-periode-facturation.usecase';
import { DeletePeriodeFacturationUseCase } from '../../../../applications/usecase/periode-facturation/delete-periode-facturation.usecase';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      FactureEntity,
      StatutFactureEntity,
      EmissionFactureEntity,
      FacturationParEntity,
      PeriodeFacturationEntity,
    ]),
  ],
  controllers: [
    FactureController,
    StatutFactureController,
    EmissionFactureController,
    FacturationParController,
    PeriodeFacturationController,
  ],
  providers: [
    // Facture
    {
      provide: 'FactureRepositoryPort',
      useClass: TypeOrmFactureRepository,
    },
    CreateFactureUseCase,
    GetFactureUseCase,
    UpdateFactureUseCase,
    DeleteFactureUseCase,

    // StatutFacture
    {
      provide: 'StatutFactureRepositoryPort',
      useClass: TypeOrmStatutFactureRepository,
    },
    CreateStatutFactureUseCase,
    GetStatutFactureUseCase,
    UpdateStatutFactureUseCase,
    DeleteStatutFactureUseCase,

    // EmissionFacture
    {
      provide: 'EmissionFactureRepositoryPort',
      useClass: TypeOrmEmissionFactureRepository,
    },
    CreateEmissionFactureUseCase,
    GetEmissionFactureUseCase,
    UpdateEmissionFactureUseCase,
    DeleteEmissionFactureUseCase,

    // FacturationPar
    {
      provide: 'FacturationParRepositoryPort',
      useClass: TypeOrmFacturationParRepository,
    },
    CreateFacturationParUseCase,
    GetFacturationParUseCase,
    UpdateFacturationParUseCase,
    DeleteFacturationParUseCase,

    // PeriodeFacturation
    {
      provide: 'PeriodeFacturationRepositoryPort',
      useClass: TypeOrmPeriodeFacturationRepository,
    },
    CreatePeriodeFacturationUseCase,
    GetPeriodeFacturationUseCase,
    UpdatePeriodeFacturationUseCase,
    DeletePeriodeFacturationUseCase,
  ],
  exports: [
    'FactureRepositoryPort',
    'StatutFactureRepositoryPort',
    'EmissionFactureRepositoryPort',
    'FacturationParRepositoryPort',
    'PeriodeFacturationRepositoryPort',
  ],
})
export class FactureModule {}
