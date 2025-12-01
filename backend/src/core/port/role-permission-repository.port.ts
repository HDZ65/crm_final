import { RolePermissionEntity } from '../domain/role-permission.entity';
import { BaseRepositoryPort } from './repository.port';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface RolePermissionRepositoryPort
  extends BaseRepositoryPort<RolePermissionEntity> {
  // Add custom repository methods here
}
