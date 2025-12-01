import { CompteEntity } from '../domain/compte.entity';
import { BaseRepositoryPort } from './repository.port';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface CompteRepositoryPort extends BaseRepositoryPort<CompteEntity> {
  // Add custom repository methods here
}
