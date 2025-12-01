import { FactureEntity } from '../domain/facture.entity';
import { BaseRepositoryPort } from './repository.port';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface FactureRepositoryPort
  extends BaseRepositoryPort<FactureEntity> {
  // Add custom repository methods here
}
