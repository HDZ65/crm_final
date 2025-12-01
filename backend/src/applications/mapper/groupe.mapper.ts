import { GroupeEntity } from '../../core/domain/groupe.entity';
import { GroupeEntity as GroupeOrmEntity } from '../../infrastructure/db/entities/groupe.entity';

export class GroupeMapper {
  static toDomain(ormEntity: GroupeOrmEntity): GroupeEntity {
    return new GroupeEntity({
      id: ormEntity.id,
      organisationId: ormEntity.organisationId,
      nom: ormEntity.nom,
      description: ormEntity.description,
      type: ormEntity.type,
      createdAt: ormEntity.createdAt,
      updatedAt: ormEntity.updatedAt,
    });
  }

  static toPersistence(entity: GroupeEntity): Partial<GroupeOrmEntity> {
    return {
      id: entity.id,
      organisationId: entity.organisationId,
      nom: entity.nom,
      description: entity.description,
      type: entity.type,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
