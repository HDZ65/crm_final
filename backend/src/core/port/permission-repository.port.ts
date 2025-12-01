import { PermissionEntity } from '../domain/permission.entity';
import { BaseRepositoryPort } from './repository.port';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface PermissionRepositoryPort
  extends BaseRepositoryPort<PermissionEntity> {
  // Add custom repository methods here
}
