import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Controllers
import { RegleRelanceController } from './controllers/regle-relance.controller';
import { HistoriqueRelanceController } from './controllers/historique-relance.controller';

// Entities
import { RegleRelanceEntity } from '../../../db/entities/regle-relance.entity';
import { HistoriqueRelanceEntity } from '../../../db/entities/historique-relance.entity';

// Repositories
import { TypeOrmRegleRelanceRepository } from '../../../repositories/typeorm-regle-relance.repository';
import { TypeOrmHistoriqueRelanceRepository } from '../../../repositories/typeorm-historique-relance.repository';

// Services
import { RelanceEngineService } from '../../../services/relance-engine.service';

// Use Cases - RegleRelance
import { CreateRegleRelanceUseCase } from '../../../../applications/usecase/regle-relance/create-regle-relance.usecase';
import { GetRegleRelanceUseCase } from '../../../../applications/usecase/regle-relance/get-regle-relance.usecase';
import { UpdateRegleRelanceUseCase } from '../../../../applications/usecase/regle-relance/update-regle-relance.usecase';
import { DeleteRegleRelanceUseCase } from '../../../../applications/usecase/regle-relance/delete-regle-relance.usecase';

// Use Cases - HistoriqueRelance
import { CreateHistoriqueRelanceUseCase } from '../../../../applications/usecase/historique-relance/create-historique-relance.usecase';
import { GetHistoriqueRelanceUseCase } from '../../../../applications/usecase/historique-relance/get-historique-relance.usecase';
import { DeleteHistoriqueRelanceUseCase } from '../../../../applications/usecase/historique-relance/delete-historique-relance.usecase';

// Modules providing dependencies for RelanceEngineService
import { ActiviteModule } from '../activite/activite.module';
import { ContratModule } from '../contrat/contrat.module';
import { FactureModule } from '../facture/facture.module';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      RegleRelanceEntity,
      HistoriqueRelanceEntity,
    ]),
    // Import modules that export dependencies needed by RelanceEngineService
    ActiviteModule,       // exports TacheRepositoryPort
    ContratModule,        // exports ContratRepositoryPort
    FactureModule,        // exports FactureRepositoryPort
    NotificationModule,   // exports NotificationService
  ],
  controllers: [
    RegleRelanceController,
    HistoriqueRelanceController,
  ],
  providers: [
    // RegleRelance
    {
      provide: 'RegleRelanceRepositoryPort',
      useClass: TypeOrmRegleRelanceRepository,
    },
    CreateRegleRelanceUseCase,
    GetRegleRelanceUseCase,
    UpdateRegleRelanceUseCase,
    DeleteRegleRelanceUseCase,

    // HistoriqueRelance
    {
      provide: 'HistoriqueRelanceRepositoryPort',
      useClass: TypeOrmHistoriqueRelanceRepository,
    },
    CreateHistoriqueRelanceUseCase,
    GetHistoriqueRelanceUseCase,
    DeleteHistoriqueRelanceUseCase,

    // Service
    RelanceEngineService,
  ],
  exports: [
    'RegleRelanceRepositoryPort',
    'HistoriqueRelanceRepositoryPort',
    RelanceEngineService,
  ],
})
export class RelanceModule {}
