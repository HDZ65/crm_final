import { PeriodeFacturationEntity } from '../../core/domain/periode-facturation.entity';
import { PeriodeFacturationEntity as PeriodeFacturationOrmEntity } from '../../infrastructure/db/entities/periode-facturation.entity';

export class PeriodeFacturationMapper {
  static toDomain(
    ormEntity: PeriodeFacturationOrmEntity,
  ): PeriodeFacturationEntity {
    return new PeriodeFacturationEntity({
      id: ormEntity.id,
      code: ormEntity.code,
      nom: ormEntity.nom,
      description: ormEntity.description,
      createdAt: ormEntity.createdAt,
      updatedAt: ormEntity.updatedAt,
    });
  }

  static toPersistence(
    entity: PeriodeFacturationEntity,
  ): Partial<PeriodeFacturationOrmEntity> {
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
