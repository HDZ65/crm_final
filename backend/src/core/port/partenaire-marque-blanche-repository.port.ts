import { PartenaireMarqueBlancheEntity } from '../domain/partenaire-marque-blanche.entity';
import { BaseRepositoryPort } from './repository.port';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface PartenaireMarqueBlancheRepositoryPort
  extends BaseRepositoryPort<PartenaireMarqueBlancheEntity> {
  // Add custom repository methods here
}
