import { ColisEntity } from '../domain/colis.entity';
import { BaseRepositoryPort } from './repository.port';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface ColisRepositoryPort extends BaseRepositoryPort<ColisEntity> {
  // Add custom repository methods here
}
