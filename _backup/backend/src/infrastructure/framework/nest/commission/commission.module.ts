import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Controllers
import { CommissionController } from './controllers/commission.controller';
import { BaremeCommissionController } from './controllers/bareme-commission.controller';
import { PalierCommissionController } from './controllers/palier-commission.controller';
import { RepriseCommissionController } from './controllers/reprise-commission.controller';
import { BordereauCommissionController } from './controllers/bordereau-commission.controller';
import { LigneBordereauController } from './controllers/ligne-bordereau.controller';
import { StatutCommissionController } from './controllers/statut-commission.controller';
import { ApporteurController } from './controllers/apporteur.controller';
import { CommissionEngineController } from './controllers/commission-engine.controller';

// Entities
import { CommissionEntity } from '../../../db/entities/commission.entity';
import { BaremeCommissionEntity } from '../../../db/entities/bareme-commission.entity';
import { PalierCommissionEntity } from '../../../db/entities/palier-commission.entity';
import { RepriseCommissionEntity } from '../../../db/entities/reprise-commission.entity';
import { BordereauCommissionEntity } from '../../../db/entities/bordereau-commission.entity';
import { LigneBordereauEntity } from '../../../db/entities/ligne-bordereau.entity';
import { StatutCommissionEntity } from '../../../db/entities/statut-commission.entity';
import { ApporteurEntity } from '../../../db/entities/apporteur.entity';

// Repositories
import { TypeOrmCommissionRepository } from '../../../repositories/typeorm-commission.repository';
import { TypeOrmBaremeCommissionRepository } from '../../../repositories/typeorm-bareme-commission.repository';
import { TypeOrmPalierCommissionRepository } from '../../../repositories/typeorm-palier-commission.repository';
import { TypeOrmRepriseCommissionRepository } from '../../../repositories/typeorm-reprise-commission.repository';
import { TypeOrmBordereauCommissionRepository } from '../../../repositories/typeorm-bordereau-commission.repository';
import { TypeOrmLigneBordereauRepository } from '../../../repositories/typeorm-ligne-bordereau.repository';
import { TypeOrmStatutCommissionRepository } from '../../../repositories/typeorm-statut-commission.repository';
import { TypeOrmApporteurRepository } from '../../../repositories/typeorm-apporteur.repository';

// Services
import { CommissionEngineService } from '../../../services/commission-engine.service';

// Use Cases - Commission
import { CreateCommissionUseCase } from '../../../../applications/usecase/commission/create-commission.usecase';
import { GetCommissionUseCase } from '../../../../applications/usecase/commission/get-commission.usecase';
import { GetCommissionWithDetailsUseCase } from '../../../../applications/usecase/commission/get-commission-with-details.usecase';
import { UpdateCommissionUseCase } from '../../../../applications/usecase/commission/update-commission.usecase';
import { DeleteCommissionUseCase } from '../../../../applications/usecase/commission/delete-commission.usecase';

// Use Cases - BaremeCommission
import { CreateBaremeCommissionUseCase } from '../../../../applications/usecase/bareme-commission/create-bareme-commission.usecase';
import { GetBaremeCommissionUseCase } from '../../../../applications/usecase/bareme-commission/get-bareme-commission.usecase';
import { UpdateBaremeCommissionUseCase } from '../../../../applications/usecase/bareme-commission/update-bareme-commission.usecase';
import { DeleteBaremeCommissionUseCase } from '../../../../applications/usecase/bareme-commission/delete-bareme-commission.usecase';

// Use Cases - PalierCommission
import { CreatePalierCommissionUseCase } from '../../../../applications/usecase/palier-commission/create-palier-commission.usecase';
import { GetPalierCommissionUseCase } from '../../../../applications/usecase/palier-commission/get-palier-commission.usecase';
import { UpdatePalierCommissionUseCase } from '../../../../applications/usecase/palier-commission/update-palier-commission.usecase';
import { DeletePalierCommissionUseCase } from '../../../../applications/usecase/palier-commission/delete-palier-commission.usecase';

// Use Cases - RepriseCommission
import { CreateRepriseCommissionUseCase } from '../../../../applications/usecase/reprise-commission/create-reprise-commission.usecase';
import { GetRepriseCommissionUseCase } from '../../../../applications/usecase/reprise-commission/get-reprise-commission.usecase';
import { UpdateRepriseCommissionUseCase } from '../../../../applications/usecase/reprise-commission/update-reprise-commission.usecase';
import { DeleteRepriseCommissionUseCase } from '../../../../applications/usecase/reprise-commission/delete-reprise-commission.usecase';

// Use Cases - BordereauCommission
import { CreateBordereauCommissionUseCase } from '../../../../applications/usecase/bordereau-commission/create-bordereau-commission.usecase';
import { GetBordereauCommissionUseCase } from '../../../../applications/usecase/bordereau-commission/get-bordereau-commission.usecase';
import { UpdateBordereauCommissionUseCase } from '../../../../applications/usecase/bordereau-commission/update-bordereau-commission.usecase';
import { DeleteBordereauCommissionUseCase } from '../../../../applications/usecase/bordereau-commission/delete-bordereau-commission.usecase';

// Use Cases - LigneBordereau
import { CreateLigneBordereauUseCase } from '../../../../applications/usecase/ligne-bordereau/create-ligne-bordereau.usecase';
import { GetLigneBordereauUseCase } from '../../../../applications/usecase/ligne-bordereau/get-ligne-bordereau.usecase';
import { UpdateLigneBordereauUseCase } from '../../../../applications/usecase/ligne-bordereau/update-ligne-bordereau.usecase';
import { DeleteLigneBordereauUseCase } from '../../../../applications/usecase/ligne-bordereau/delete-ligne-bordereau.usecase';

// Use Cases - StatutCommission
import { CreateStatutCommissionUseCase } from '../../../../applications/usecase/statut-commission/create-statut-commission.usecase';
import { GetStatutCommissionUseCase } from '../../../../applications/usecase/statut-commission/get-statut-commission.usecase';
import { UpdateStatutCommissionUseCase } from '../../../../applications/usecase/statut-commission/update-statut-commission.usecase';
import { DeleteStatutCommissionUseCase } from '../../../../applications/usecase/statut-commission/delete-statut-commission.usecase';

// Use Cases - Apporteur
import { CreateApporteurUseCase } from '../../../../applications/usecase/apporteur/create-apporteur.usecase';
import { GetApporteurUseCase } from '../../../../applications/usecase/apporteur/get-apporteur.usecase';
import { UpdateApporteurUseCase } from '../../../../applications/usecase/apporteur/update-apporteur.usecase';
import { DeleteApporteurUseCase } from '../../../../applications/usecase/apporteur/delete-apporteur.usecase';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CommissionEntity,
      BaremeCommissionEntity,
      PalierCommissionEntity,
      RepriseCommissionEntity,
      BordereauCommissionEntity,
      LigneBordereauEntity,
      StatutCommissionEntity,
      ApporteurEntity,
    ]),
  ],
  controllers: [
    CommissionController,
    BaremeCommissionController,
    PalierCommissionController,
    RepriseCommissionController,
    BordereauCommissionController,
    LigneBordereauController,
    StatutCommissionController,
    ApporteurController,
    CommissionEngineController,
  ],
  providers: [
    // Commission
    {
      provide: 'CommissionRepositoryPort',
      useClass: TypeOrmCommissionRepository,
    },
    CreateCommissionUseCase,
    GetCommissionUseCase,
    GetCommissionWithDetailsUseCase,
    UpdateCommissionUseCase,
    DeleteCommissionUseCase,

    // BaremeCommission
    {
      provide: 'BaremeCommissionRepositoryPort',
      useClass: TypeOrmBaremeCommissionRepository,
    },
    CreateBaremeCommissionUseCase,
    GetBaremeCommissionUseCase,
    UpdateBaremeCommissionUseCase,
    DeleteBaremeCommissionUseCase,

    // PalierCommission
    {
      provide: 'PalierCommissionRepositoryPort',
      useClass: TypeOrmPalierCommissionRepository,
    },
    CreatePalierCommissionUseCase,
    GetPalierCommissionUseCase,
    UpdatePalierCommissionUseCase,
    DeletePalierCommissionUseCase,

    // RepriseCommission
    {
      provide: 'RepriseCommissionRepositoryPort',
      useClass: TypeOrmRepriseCommissionRepository,
    },
    CreateRepriseCommissionUseCase,
    GetRepriseCommissionUseCase,
    UpdateRepriseCommissionUseCase,
    DeleteRepriseCommissionUseCase,

    // BordereauCommission
    {
      provide: 'BordereauCommissionRepositoryPort',
      useClass: TypeOrmBordereauCommissionRepository,
    },
    CreateBordereauCommissionUseCase,
    GetBordereauCommissionUseCase,
    UpdateBordereauCommissionUseCase,
    DeleteBordereauCommissionUseCase,

    // LigneBordereau
    {
      provide: 'LigneBordereauRepositoryPort',
      useClass: TypeOrmLigneBordereauRepository,
    },
    CreateLigneBordereauUseCase,
    GetLigneBordereauUseCase,
    UpdateLigneBordereauUseCase,
    DeleteLigneBordereauUseCase,

    // StatutCommission
    {
      provide: 'StatutCommissionRepositoryPort',
      useClass: TypeOrmStatutCommissionRepository,
    },
    CreateStatutCommissionUseCase,
    GetStatutCommissionUseCase,
    UpdateStatutCommissionUseCase,
    DeleteStatutCommissionUseCase,

    // Apporteur
    {
      provide: 'ApporteurRepositoryPort',
      useClass: TypeOrmApporteurRepository,
    },
    CreateApporteurUseCase,
    GetApporteurUseCase,
    UpdateApporteurUseCase,
    DeleteApporteurUseCase,

    // Commission Engine Service
    CommissionEngineService,
  ],
  exports: [
    'CommissionRepositoryPort',
    'BaremeCommissionRepositoryPort',
    'PalierCommissionRepositoryPort',
    'RepriseCommissionRepositoryPort',
    'BordereauCommissionRepositoryPort',
    'LigneBordereauRepositoryPort',
    'StatutCommissionRepositoryPort',
    'ApporteurRepositoryPort',
    CommissionEngineService,
  ],
})
export class CommissionModule {}
