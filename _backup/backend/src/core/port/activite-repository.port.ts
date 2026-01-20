import { ActiviteEntity } from '../domain/activite.entity';
import { BaseRepositoryPort } from './repository.port';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface ActiviteRepositoryPort extends BaseRepositoryPort<ActiviteEntity> {
  // Add custom repository methods here
}
