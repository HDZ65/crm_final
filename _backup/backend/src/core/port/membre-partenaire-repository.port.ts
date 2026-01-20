import { MembrePartenaireEntity } from '../domain/membre-partenaire.entity';
import { BaseRepositoryPort } from './repository.port';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface MembrePartenaireRepositoryPort extends BaseRepositoryPort<MembrePartenaireEntity> {
  // Add custom repository methods here
}
