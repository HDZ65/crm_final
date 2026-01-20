import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Controllers
import {
  ContratController,
  LigneContratController,
  StatutContratController,
  ConditionPaiementController,
  HistoriqueStatutContratController,
  ContractOrchestrationController,
} from './controllers';

// Entities
import { ContratEntity } from '../../../db/entities/contrat.entity';
import { LigneContratEntity } from '../../../db/entities/ligne-contrat.entity';
import { StatutContratEntity } from '../../../db/entities/statut-contrat.entity';
import { ConditionPaiementEntity } from '../../../db/entities/condition-paiement.entity';
import { HistoriqueStatutContratEntity } from '../../../db/entities/historique-statut-contrat.entity';
import { ContractOrchestrationHistoryEntity } from '../../../db/entities/contract-orchestration-history.entity';

// Repositories
import { TypeOrmContratRepository } from '../../../repositories/typeorm-contrat.repository';
import { TypeOrmLigneContratRepository } from '../../../repositories/typeorm-ligne-contrat.repository';
import { TypeOrmStatutContratRepository } from '../../../repositories/typeorm-statut-contrat.repository';
import { TypeOrmConditionPaiementRepository } from '../../../repositories/typeorm-condition-paiement.repository';
import { TypeOrmHistoriqueStatutContratRepository } from '../../../repositories/typeorm-historique-statut-contrat.repository';
import { TypeOrmContractOrchestrationHistoryRepository } from '../../../repositories/typeorm-contract-orchestration-history.repository';

// Services
import { ContractOrchestrationService } from '../../../services/contract-orchestration.service';

// Use Cases - Contrat
import { CreateContratUseCase } from '../../../../applications/usecase/contrat/create-contrat.usecase';
import { GetContratUseCase } from '../../../../applications/usecase/contrat/get-contrat.usecase';
import { UpdateContratUseCase } from '../../../../applications/usecase/contrat/update-contrat.usecase';
import { DeleteContratUseCase } from '../../../../applications/usecase/contrat/delete-contrat.usecase';

// Use Cases - LigneContrat
import { CreateLigneContratUseCase } from '../../../../applications/usecase/ligne-contrat/create-ligne-contrat.usecase';
import { GetLigneContratUseCase } from '../../../../applications/usecase/ligne-contrat/get-ligne-contrat.usecase';
import { UpdateLigneContratUseCase } from '../../../../applications/usecase/ligne-contrat/update-ligne-contrat.usecase';
import { DeleteLigneContratUseCase } from '../../../../applications/usecase/ligne-contrat/delete-ligne-contrat.usecase';

// Use Cases - StatutContrat
import { CreateStatutContratUseCase } from '../../../../applications/usecase/statut-contrat/create-statut-contrat.usecase';
import { GetStatutContratUseCase } from '../../../../applications/usecase/statut-contrat/get-statut-contrat.usecase';
import { UpdateStatutContratUseCase } from '../../../../applications/usecase/statut-contrat/update-statut-contrat.usecase';
import { DeleteStatutContratUseCase } from '../../../../applications/usecase/statut-contrat/delete-statut-contrat.usecase';

// Use Cases - ConditionPaiement
import { CreateConditionPaiementUseCase } from '../../../../applications/usecase/condition-paiement/create-condition-paiement.usecase';
import { GetConditionPaiementUseCase } from '../../../../applications/usecase/condition-paiement/get-condition-paiement.usecase';
import { UpdateConditionPaiementUseCase } from '../../../../applications/usecase/condition-paiement/update-condition-paiement.usecase';
import { DeleteConditionPaiementUseCase } from '../../../../applications/usecase/condition-paiement/delete-condition-paiement.usecase';

// Use Cases - HistoriqueStatutContrat
import { CreateHistoriqueStatutContratUseCase } from '../../../../applications/usecase/historique-statut-contrat/create-historique-statut-contrat.usecase';
import { GetHistoriqueStatutContratUseCase } from '../../../../applications/usecase/historique-statut-contrat/get-historique-statut-contrat.usecase';
import { UpdateHistoriqueStatutContratUseCase } from '../../../../applications/usecase/historique-statut-contrat/update-historique-statut-contrat.usecase';
import { DeleteHistoriqueStatutContratUseCase } from '../../../../applications/usecase/historique-statut-contrat/delete-historique-statut-contrat.usecase';

// Use Cases - Contract Orchestration
import { ActivateContractUseCase } from '../../../../applications/usecase/contract-orchestration/activate-contract.usecase';
import { SuspendContractUseCase } from '../../../../applications/usecase/contract-orchestration/suspend-contract.usecase';
import { TerminateContractUseCase } from '../../../../applications/usecase/contract-orchestration/terminate-contract.usecase';
import { PortInContractUseCase } from '../../../../applications/usecase/contract-orchestration/port-in-contract.usecase';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ContratEntity,
      LigneContratEntity,
      StatutContratEntity,
      ConditionPaiementEntity,
      HistoriqueStatutContratEntity,
      ContractOrchestrationHistoryEntity,
    ]),
  ],
  controllers: [
    ContratController,
    LigneContratController,
    StatutContratController,
    ConditionPaiementController,
    HistoriqueStatutContratController,
    ContractOrchestrationController,
  ],
  providers: [
    // Contrat
    {
      provide: 'ContratRepositoryPort',
      useClass: TypeOrmContratRepository,
    },
    CreateContratUseCase,
    GetContratUseCase,
    UpdateContratUseCase,
    DeleteContratUseCase,

    // LigneContrat
    {
      provide: 'LigneContratRepositoryPort',
      useClass: TypeOrmLigneContratRepository,
    },
    CreateLigneContratUseCase,
    GetLigneContratUseCase,
    UpdateLigneContratUseCase,
    DeleteLigneContratUseCase,

    // StatutContrat
    {
      provide: 'StatutContratRepositoryPort',
      useClass: TypeOrmStatutContratRepository,
    },
    CreateStatutContratUseCase,
    GetStatutContratUseCase,
    UpdateStatutContratUseCase,
    DeleteStatutContratUseCase,

    // ConditionPaiement
    {
      provide: 'ConditionPaiementRepositoryPort',
      useClass: TypeOrmConditionPaiementRepository,
    },
    CreateConditionPaiementUseCase,
    GetConditionPaiementUseCase,
    UpdateConditionPaiementUseCase,
    DeleteConditionPaiementUseCase,

    // HistoriqueStatutContrat
    {
      provide: 'HistoriqueStatutContratRepositoryPort',
      useClass: TypeOrmHistoriqueStatutContratRepository,
    },
    CreateHistoriqueStatutContratUseCase,
    GetHistoriqueStatutContratUseCase,
    UpdateHistoriqueStatutContratUseCase,
    DeleteHistoriqueStatutContratUseCase,

    // Contract Orchestration
    {
      provide: 'ContractOrchestrationHistoryRepositoryPort',
      useClass: TypeOrmContractOrchestrationHistoryRepository,
    },
    {
      provide: 'ContractOrchestrationPort',
      useClass: ContractOrchestrationService,
    },
    ActivateContractUseCase,
    SuspendContractUseCase,
    TerminateContractUseCase,
    PortInContractUseCase,
  ],
  exports: [
    'ContratRepositoryPort',
    'LigneContratRepositoryPort',
    'StatutContratRepositoryPort',
    'ConditionPaiementRepositoryPort',
    'HistoriqueStatutContratRepositoryPort',
  ],
})
export class ContratModule {}
