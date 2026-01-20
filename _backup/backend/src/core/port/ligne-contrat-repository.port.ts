import { LigneContratEntity } from '../domain/ligne-contrat.entity';
import { BaseRepositoryPort } from './repository.port';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface LigneContratRepositoryPort extends BaseRepositoryPort<LigneContratEntity> {
  // Add custom repository methods here
}
