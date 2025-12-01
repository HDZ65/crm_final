import { RolePartenaireEntity } from '../../core/domain/role-partenaire.entity';
import { RolePartenaireEntity as RolePartenaireOrmEntity } from '../../infrastructure/db/entities/role-partenaire.entity';

export class RolePartenaireMapper {
  static toDomain(ormEntity: RolePartenaireOrmEntity): RolePartenaireEntity {
    return new RolePartenaireEntity({
      id: ormEntity.id,
      code: ormEntity.code,
      nom: ormEntity.nom,
      description: ormEntity.description,
      createdAt: ormEntity.createdAt,
      updatedAt: ormEntity.updatedAt,
    });
  }

  static toPersistence(
    entity: RolePartenaireEntity,
  ): Partial<RolePartenaireOrmEntity> {
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
