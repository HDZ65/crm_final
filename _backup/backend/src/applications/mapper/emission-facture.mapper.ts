import { EmissionFactureEntity } from '../../core/domain/emission-facture.entity';
import { EmissionFactureEntity as EmissionFactureOrmEntity } from '../../infrastructure/db/entities/emission-facture.entity';

export class EmissionFactureMapper {
  static toDomain(ormEntity: EmissionFactureOrmEntity): EmissionFactureEntity {
    return new EmissionFactureEntity({
      id: ormEntity.id,
      code: ormEntity.code,
      nom: ormEntity.nom,
      description: ormEntity.description,
      createdAt: ormEntity.createdAt,
      updatedAt: ormEntity.updatedAt,
    });
  }

  static toPersistence(
    entity: EmissionFactureEntity,
  ): Partial<EmissionFactureOrmEntity> {
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
