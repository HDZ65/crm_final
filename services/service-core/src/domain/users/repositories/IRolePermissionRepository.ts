import { RolePermissionEntity } from '../entities/role-permission.entity';

export interface IRolePermissionRepository {
  findById(id: string): Promise<RolePermissionEntity | null>;
  findAll(): Promise<RolePermissionEntity[]>;
  save(entity: RolePermissionEntity): Promise<RolePermissionEntity>;
  delete(id: string): Promise<void>;
  findByRoleId(roleId: string): Promise<RolePermissionEntity[]>;
  findByPermissionId(permissionId: string): Promise<RolePermissionEntity[]>;
}
