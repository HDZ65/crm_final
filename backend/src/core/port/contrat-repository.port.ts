import { ContratEntity } from '../domain/contrat.entity';
import { BaseRepositoryPort } from './repository.port';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface ContratRepositoryPort
  extends BaseRepositoryPort<ContratEntity> {
  // Add custom repository methods here
}
