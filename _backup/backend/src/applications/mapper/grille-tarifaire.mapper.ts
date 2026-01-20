import { GrilleTarifaireEntity } from '../../core/domain/grille-tarifaire.entity';
import { GrilleTarifaireEntity as GrilleTarifaireOrmEntity } from '../../infrastructure/db/entities/grille-tarifaire.entity';

export class GrilleTarifaireMapper {
  static toDomain(ormEntity: GrilleTarifaireOrmEntity): GrilleTarifaireEntity {
    return new GrilleTarifaireEntity({
      id: ormEntity.id,
      nom: ormEntity.nom,
      dateDebut: ormEntity.dateDebut,
      dateFin: ormEntity.dateFin,
      estParDefaut: ormEntity.estParDefaut,
      createdAt: ormEntity.createdAt,
      updatedAt: ormEntity.updatedAt,
    });
  }

  static toPersistence(
    entity: GrilleTarifaireEntity,
  ): Partial<GrilleTarifaireOrmEntity> {
    return {
      id: entity.id,
      nom: entity.nom,
      dateDebut: entity.dateDebut,
      dateFin: entity.dateFin,
      estParDefaut: entity.estParDefaut,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
