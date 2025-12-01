import { GroupeEntiteEntity } from '../../core/domain/groupe-entite.entity';
import { GroupeEntiteEntity as GroupeEntiteOrmEntity } from '../../infrastructure/db/entities/groupe-entite.entity';

export class GroupeEntiteMapper {
  static toDomain(ormEntity: GroupeEntiteOrmEntity): GroupeEntiteEntity {
    return new GroupeEntiteEntity({
      id: ormEntity.id,
      groupeId: ormEntity.groupeId,
      entiteId: ormEntity.entiteId,
      type: ormEntity.type,
      createdAt: ormEntity.createdAt,
      updatedAt: ormEntity.updatedAt,
    });
  }

  static toPersistence(
    entity: GroupeEntiteEntity,
  ): Partial<GroupeEntiteOrmEntity> {
    return {
      id: entity.id,
      groupeId: entity.groupeId,
      entiteId: entity.entiteId,
      type: entity.type,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
