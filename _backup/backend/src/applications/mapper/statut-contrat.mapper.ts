import { StatutContratEntity } from '../../core/domain/statut-contrat.entity';
import { StatutContratEntity as StatutContratOrmEntity } from '../../infrastructure/db/entities/statut-contrat.entity';

export class StatutContratMapper {
  static toDomain(ormEntity: StatutContratOrmEntity): StatutContratEntity {
    return new StatutContratEntity({
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
    entity: StatutContratEntity,
  ): Partial<StatutContratOrmEntity> {
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
