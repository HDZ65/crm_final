import { StatutPartenaireEntity } from '../domain/statut-partenaire.entity';
import { BaseRepositoryPort } from './repository.port';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface StatutPartenaireRepositoryPort
  extends BaseRepositoryPort<StatutPartenaireEntity> {
  // Add custom repository methods here
}
