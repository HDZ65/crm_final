import { FacturationParEntity } from '../../core/domain/facturation-par.entity';
import { FacturationParEntity as FacturationParOrmEntity } from '../../infrastructure/db/entities/facturation-par.entity';

export class FacturationParMapper {
  static toDomain(ormEntity: FacturationParOrmEntity): FacturationParEntity {
    return new FacturationParEntity({
      id: ormEntity.id,
      code: ormEntity.code,
      nom: ormEntity.nom,
      description: ormEntity.description,
      createdAt: ormEntity.createdAt,
      updatedAt: ormEntity.updatedAt,
    });
  }

  static toPersistence(
    entity: FacturationParEntity,
  ): Partial<FacturationParOrmEntity> {
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
