import { MembreGroupeEntity } from '../domain/membre-groupe.entity';
import { BaseRepositoryPort } from './repository.port';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface MembreGroupeRepositoryPort
  extends BaseRepositoryPort<MembreGroupeEntity> {
  // Add custom repository methods here
}
