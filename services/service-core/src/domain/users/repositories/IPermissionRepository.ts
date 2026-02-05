import { PermissionEntity } from '../entities/permission.entity';

export interface IPermissionRepository {
  findById(id: string): Promise<PermissionEntity | null>;
  findAll(): Promise<PermissionEntity[]>;
  save(entity: PermissionEntity): Promise<PermissionEntity>;
  delete(id: string): Promise<void>;
  findByCode(code: string): Promise<PermissionEntity | null>;
}
