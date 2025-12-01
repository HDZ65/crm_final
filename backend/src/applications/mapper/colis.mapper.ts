import { ColisEntity } from '../../core/domain/colis.entity';
import { ColisEntity as ColisOrmEntity } from '../../infrastructure/db/entities/colis.entity';

export class ColisMapper {
  static toDomain(ormEntity: ColisOrmEntity): ColisEntity {
    return new ColisEntity({
      id: ormEntity.id,
      expeditionId: ormEntity.expeditionId,
      poidsGr: ormEntity.poidsGr,
      longCm: ormEntity.longCm,
      largCm: ormEntity.largCm,
      hautCm: ormEntity.hautCm,
      valeurDeclaree: ormEntity.valeurDeclaree,
      contenu: ormEntity.contenu,
      createdAt: ormEntity.createdAt,
      updatedAt: ormEntity.updatedAt,
    });
  }

  static toPersistence(entity: ColisEntity): Partial<ColisOrmEntity> {
    return {
      id: entity.id,
      expeditionId: entity.expeditionId,
      poidsGr: entity.poidsGr,
      longCm: entity.longCm,
      largCm: entity.largCm,
      hautCm: entity.hautCm,
      valeurDeclaree: entity.valeurDeclaree,
      contenu: entity.contenu,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
