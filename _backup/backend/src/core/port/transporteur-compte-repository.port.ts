import { TransporteurCompteEntity } from '../domain/transporteur-compte.entity';
import { BaseRepositoryPort } from './repository.port';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface TransporteurCompteRepositoryPort extends BaseRepositoryPort<TransporteurCompteEntity> {
  // Add custom repository methods here
}
