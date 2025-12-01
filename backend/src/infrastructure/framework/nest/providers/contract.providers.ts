/**
 * Contract Providers - Contrat, LigneContrat, StatutContrat, etc.
 * Regroupement des providers liés à la gestion des contrats
 */

import { CreateContratUseCase } from '../../../../applications/usecase/contrat/create-contrat.usecase';
import { GetContratUseCase } from '../../../../applications/usecase/contrat/get-contrat.usecase';
import { UpdateContratUseCase } from '../../../../applications/usecase/contrat/update-contrat.usecase';
import { DeleteContratUseCase } from '../../../../applications/usecase/contrat/delete-contrat.usecase';
import { TypeOrmContratRepository } from '../../../repositories/typeorm-contrat.repository';

import { CreateLigneContratUseCase } from '../../../../applications/usecase/ligne-contrat/create-ligne-contrat.usecase';
import { GetLigneContratUseCase } from '../../../../applications/usecase/ligne-contrat/get-ligne-contrat.usecase';
import { UpdateLigneContratUseCase } from '../../../../applications/usecase/ligne-contrat/update-ligne-contrat.usecase';
import { DeleteLigneContratUseCase } from '../../../../applications/usecase/ligne-contrat/delete-ligne-contrat.usecase';
import { TypeOrmLigneContratRepository } from '../../../repositories/typeorm-ligne-contrat.repository';

import { CreateStatutContratUseCase } from '../../../../applications/usecase/statut-contrat/create-statut-contrat.usecase';
import { GetStatutContratUseCase } from '../../../../applications/usecase/statut-contrat/get-statut-contrat.usecase';
import { UpdateStatutContratUseCase } from '../../../../applications/usecase/statut-contrat/update-statut-contrat.usecase';
import { DeleteStatutContratUseCase } from '../../../../applications/usecase/statut-contrat/delete-statut-contrat.usecase';
import { TypeOrmStatutContratRepository } from '../../../repositories/typeorm-statut-contrat.repository';

import { CreateConditionPaiementUseCase } from '../../../../applications/usecase/condition-paiement/create-condition-paiement.usecase';
import { GetConditionPaiementUseCase } from '../../../../applications/usecase/condition-paiement/get-condition-paiement.usecase';
import { UpdateConditionPaiementUseCase } from '../../../../applications/usecase/condition-paiement/update-condition-paiement.usecase';
import { DeleteConditionPaiementUseCase } from '../../../../applications/usecase/condition-paiement/delete-condition-paiement.usecase';
import { TypeOrmConditionPaiementRepository } from '../../../repositories/typeorm-condition-paiement.repository';

import { CreateTypeActiviteUseCase } from '../../../../applications/usecase/type-activite/create-type-activite.usecase';
import { GetTypeActiviteUseCase } from '../../../../applications/usecase/type-activite/get-type-activite.usecase';
import { UpdateTypeActiviteUseCase } from '../../../../applications/usecase/type-activite/update-type-activite.usecase';
import { DeleteTypeActiviteUseCase } from '../../../../applications/usecase/type-activite/delete-type-activite.usecase';
import { TypeOrmTypeActiviteRepository } from '../../../repositories/typeorm-type-activite.repository';

export const CONTRACT_PROVIDERS = [
  // Contrat Use Cases
  CreateContratUseCase,
  GetContratUseCase,
  UpdateContratUseCase,
  DeleteContratUseCase,

  // Contrat Repository
  {
    provide: 'ContratRepositoryPort',
    useClass: TypeOrmContratRepository,
  },

  // LigneContrat Use Cases
  CreateLigneContratUseCase,
  GetLigneContratUseCase,
  UpdateLigneContratUseCase,
  DeleteLigneContratUseCase,

  // LigneContrat Repository
  {
    provide: 'LigneContratRepositoryPort',
    useClass: TypeOrmLigneContratRepository,
  },

  // StatutContrat Use Cases
  CreateStatutContratUseCase,
  GetStatutContratUseCase,
  UpdateStatutContratUseCase,
  DeleteStatutContratUseCase,

  // StatutContrat Repository
  {
    provide: 'StatutContratRepositoryPort',
    useClass: TypeOrmStatutContratRepository,
  },

  // ConditionPaiement Use Cases
  CreateConditionPaiementUseCase,
  GetConditionPaiementUseCase,
  UpdateConditionPaiementUseCase,
  DeleteConditionPaiementUseCase,

  // ConditionPaiement Repository
  {
    provide: 'ConditionPaiementRepositoryPort',
    useClass: TypeOrmConditionPaiementRepository,
  },

  // TypeActivite Use Cases
  CreateTypeActiviteUseCase,
  GetTypeActiviteUseCase,
  UpdateTypeActiviteUseCase,
  DeleteTypeActiviteUseCase,

  // TypeActivite Repository
  {
    provide: 'TypeActiviteRepositoryPort',
    useClass: TypeOrmTypeActiviteRepository,
  },
];
