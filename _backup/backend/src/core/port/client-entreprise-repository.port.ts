import { ClientEntrepriseEntity } from '../domain/client-entreprise.entity';
import { BaseRepositoryPort } from './repository.port';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface ClientEntrepriseRepositoryPort extends BaseRepositoryPort<ClientEntrepriseEntity> {
  // Add custom repository methods here
}
