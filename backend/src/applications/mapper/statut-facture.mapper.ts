import { StatutFactureEntity } from '../../core/domain/statut-facture.entity';
import { StatutFactureEntity as StatutFactureOrmEntity } from '../../infrastructure/db/entities/statut-facture.entity';

export class StatutFactureMapper {
  static toDomain(ormEntity: StatutFactureOrmEntity): StatutFactureEntity {
    return new StatutFactureEntity({
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
    entity: StatutFactureEntity,
  ): Partial<StatutFactureOrmEntity> {
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
