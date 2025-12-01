import { RoleEntity } from '../../core/domain/role.entity';
import { RoleEntity as RoleOrmEntity } from '../../infrastructure/db/entities/role.entity';

export class RoleMapper {
  static toDomain(ormEntity: RoleOrmEntity): RoleEntity {
    return new RoleEntity({
      id: ormEntity.id,
      code: ormEntity.code,
      nom: ormEntity.nom,
      description: ormEntity.description,
      createdAt: ormEntity.createdAt,
      updatedAt: ormEntity.updatedAt,
    });
  }

  static toPersistence(entity: RoleEntity): Partial<RoleOrmEntity> {
    return {
      id: entity.id,
      code: entity.code,
      nom: entity.nom,
      description: entity.description,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
