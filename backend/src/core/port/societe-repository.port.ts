import { SocieteEntity } from '../domain/societe.entity';
import { BaseRepositoryPort } from './repository.port';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface SocieteRepositoryPort
  extends BaseRepositoryPort<SocieteEntity> {
  // Add custom repository methods here
}
