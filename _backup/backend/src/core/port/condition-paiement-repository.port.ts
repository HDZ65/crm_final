import { ConditionPaiementEntity } from '../domain/condition-paiement.entity';
import { BaseRepositoryPort } from './repository.port';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface ConditionPaiementRepositoryPort extends BaseRepositoryPort<ConditionPaiementEntity> {
  // Add custom repository methods here
}
