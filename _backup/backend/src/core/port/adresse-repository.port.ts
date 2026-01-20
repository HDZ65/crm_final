import { AdresseEntity } from '../domain/adresse.entity';
import { BaseRepositoryPort } from './repository.port';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface AdresseRepositoryPort extends BaseRepositoryPort<AdresseEntity> {
  // Add custom repository methods here
}
