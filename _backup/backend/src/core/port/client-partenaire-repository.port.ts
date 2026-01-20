import { ClientPartenaireEntity } from '../domain/client-partenaire.entity';
import { BaseRepositoryPort } from './repository.port';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface ClientPartenaireRepositoryPort extends BaseRepositoryPort<ClientPartenaireEntity> {
  // Add custom repository methods here
}
