import { StatutFactureEntity } from '../domain/statut-facture.entity';
import { BaseRepositoryPort } from './repository.port';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface StatutFactureRepositoryPort extends BaseRepositoryPort<StatutFactureEntity> {
  // Add custom repository methods here
}
