import { RoleEntity } from '../domain/role.entity';
import { BaseRepositoryPort } from './repository.port';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface RoleRepositoryPort extends BaseRepositoryPort<RoleEntity> {
  // Add custom repository methods here
}
