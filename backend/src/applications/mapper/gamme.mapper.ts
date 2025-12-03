import { GammeEntity } from '../../core/domain/gamme.entity';
import { GammeEntity as GammeOrmEntity } from '../../infrastructure/db/entities/gamme.entity';

export class GammeMapper {
  static toDomain(ormEntity: GammeOrmEntity): GammeEntity {
    return new GammeEntity({
      id: ormEntity.id,
      societeId: ormEntity.societeId,
      nom: ormEntity.nom,
      description: ormEntity.description,
      icone: ormEntity.icone,
      actif: ormEntity.actif,
      createdAt: ormEntity.createdAt,
      updatedAt: ormEntity.updatedAt,
    });
  }

  static toPersistence(entity: GammeEntity): Partial<GammeOrmEntity> {
    return {
      id: entity.id,
      societeId: entity.societeId,
      nom: entity.nom,
      description: entity.description,
      icone: entity.icone,
      actif: entity.actif,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
