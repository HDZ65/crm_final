import { StatutPartenaireEntity } from '../../core/domain/statut-partenaire.entity';
import { StatutPartenaireEntity as StatutPartenaireOrmEntity } from '../../infrastructure/db/entities/statut-partenaire.entity';

export class StatutPartenaireMapper {
  static toDomain(
    ormEntity: StatutPartenaireOrmEntity,
  ): StatutPartenaireEntity {
    return new StatutPartenaireEntity({
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
    entity: StatutPartenaireEntity,
  ): Partial<StatutPartenaireOrmEntity> {
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
