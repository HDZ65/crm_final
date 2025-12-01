import { StatutClientEntity } from '../domain/statut-client.entity';
import { BaseRepositoryPort } from './repository.port';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface StatutClientRepositoryPort
  extends BaseRepositoryPort<StatutClientEntity> {
  // Add custom repository methods here
}
