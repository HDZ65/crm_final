import { RolePermissionEntity } from '../../core/domain/role-permission.entity';
import { RolePermissionEntity as RolePermissionOrmEntity } from '../../infrastructure/db/entities/role-permission.entity';

export class RolePermissionMapper {
  static toDomain(ormEntity: RolePermissionOrmEntity): RolePermissionEntity {
    return new RolePermissionEntity({
      id: ormEntity.id,
      roleId: ormEntity.roleId,
      permissionId: ormEntity.permissionId,
      createdAt: ormEntity.createdAt,
      updatedAt: ormEntity.updatedAt,
    });
  }

  static toPersistence(
    entity: RolePermissionEntity,
  ): Partial<RolePermissionOrmEntity> {
    return {
      id: entity.id,
      roleId: entity.roleId,
      permissionId: entity.permissionId,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
