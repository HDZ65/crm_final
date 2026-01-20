import { ModeleDistributionEntity } from '../../core/domain/modele-distribution.entity';
import { ModeleDistributionEntity as ModeleDistributionOrmEntity } from '../../infrastructure/db/entities/modele-distribution.entity';

export class ModeleDistributionMapper {
  static toDomain(
    ormEntity: ModeleDistributionOrmEntity,
  ): ModeleDistributionEntity {
    return new ModeleDistributionEntity({
      id: ormEntity.id,
      code: ormEntity.code,
      nom: ormEntity.nom,
      description: ormEntity.description,
      createdAt: ormEntity.createdAt,
      updatedAt: ormEntity.updatedAt,
    });
  }

  static toPersistence(
    entity: ModeleDistributionEntity,
  ): Partial<ModeleDistributionOrmEntity> {
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
