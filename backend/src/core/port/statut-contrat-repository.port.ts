import { StatutContratEntity } from '../domain/statut-contrat.entity';
import { BaseRepositoryPort } from './repository.port';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface StatutContratRepositoryPort
  extends BaseRepositoryPort<StatutContratEntity> {
  // Add custom repository methods here
}
