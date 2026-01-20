import { StatutClientEntity } from '../../core/domain/statut-client.entity';
import { StatutClientEntity as StatutClientOrmEntity } from '../../infrastructure/db/entities/statut-client.entity';

export class StatutClientMapper {
  static toDomain(ormEntity: StatutClientOrmEntity): StatutClientEntity {
    return new StatutClientEntity({
      id: ormEntity.id,
      code: ormEntity.code,
      nom: ormEntity.nom,
      description: ormEntity.description,
      ordreAffichage: ormEntity.ordreAffichage,
      createdAt: ormEntity.createdAt,
      updatedAt: ormEntity.updatedAt,
    });
  }

  static toPersistence(
    entity: StatutClientEntity,
  ): Partial<StatutClientOrmEntity> {
    return {
      id: entity.id,
      code: entity.code,
      nom: entity.nom,
      description: entity.description,
      ordreAffichage: entity.ordreAffichage,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
