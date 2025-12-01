import { TypeActiviteEntity } from '../../core/domain/type-activite.entity';
import { TypeActiviteEntity as TypeActiviteOrmEntity } from '../../infrastructure/db/entities/type-activite.entity';

export class TypeActiviteMapper {
  static toDomain(ormEntity: TypeActiviteOrmEntity): TypeActiviteEntity {
    return new TypeActiviteEntity({
      id: ormEntity.id,
      code: ormEntity.code,
      nom: ormEntity.nom,
      description: ormEntity.description,
      createdAt: ormEntity.createdAt,
      updatedAt: ormEntity.updatedAt,
    });
  }

  static toPersistence(
    entity: TypeActiviteEntity,
  ): Partial<TypeActiviteOrmEntity> {
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
