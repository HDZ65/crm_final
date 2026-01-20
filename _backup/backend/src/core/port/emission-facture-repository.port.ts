import { EmissionFactureEntity } from '../domain/emission-facture.entity';
import { BaseRepositoryPort } from './repository.port';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface EmissionFactureRepositoryPort extends BaseRepositoryPort<EmissionFactureEntity> {
  // Add custom repository methods here
}
