import { PermissionEntity } from '../../core/domain/permission.entity';
import { PermissionEntity as PermissionOrmEntity } from '../../infrastructure/db/entities/permission.entity';

export class PermissionMapper {
  static toDomain(ormEntity: PermissionOrmEntity): PermissionEntity {
    return new PermissionEntity({
      id: ormEntity.id,
      code: ormEntity.code,
      description: ormEntity.description,
      createdAt: ormEntity.createdAt,
      updatedAt: ormEntity.updatedAt,
    });
  }

  static toPersistence(entity: PermissionEntity): Partial<PermissionOrmEntity> {
    return {
      id: entity.id,
      code: entity.code,
      description: entity.description,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
