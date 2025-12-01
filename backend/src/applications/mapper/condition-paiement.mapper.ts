import { ConditionPaiementEntity } from '../../core/domain/condition-paiement.entity';
import { ConditionPaiementEntity as ConditionPaiementOrmEntity } from '../../infrastructure/db/entities/condition-paiement.entity';

export class ConditionPaiementMapper {
  static toDomain(
    ormEntity: ConditionPaiementOrmEntity,
  ): ConditionPaiementEntity {
    return new ConditionPaiementEntity({
      id: ormEntity.id,
      code: ormEntity.code,
      nom: ormEntity.nom,
      description: ormEntity.description,
      delaiJours: ormEntity.delaiJours,
      createdAt: ormEntity.createdAt,
      updatedAt: ormEntity.updatedAt,
    });
  }

  static toPersistence(
    entity: ConditionPaiementEntity,
  ): Partial<ConditionPaiementOrmEntity> {
    return {
      id: entity.id,
      code: entity.code,
      nom: entity.nom,
      description: entity.description,
      delaiJours: entity.delaiJours,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
