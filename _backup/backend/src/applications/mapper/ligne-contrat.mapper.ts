import { LigneContratEntity } from '../../core/domain/ligne-contrat.entity';
import { LigneContratEntity as LigneContratOrmEntity } from '../../infrastructure/db/entities/ligne-contrat.entity';

export class LigneContratMapper {
  static toDomain(ormEntity: LigneContratOrmEntity): LigneContratEntity {
    return new LigneContratEntity({
      id: ormEntity.id,
      quantite: ormEntity.quantite,
      prixUnitaire: ormEntity.prixUnitaire,
      contratId: ormEntity.contratId,
      periodeFacturationId: ormEntity.periodeFacturationId,
      produitId: ormEntity.produitId,
      createdAt: ormEntity.createdAt,
      updatedAt: ormEntity.updatedAt,
    });
  }

  static toPersistence(
    entity: LigneContratEntity,
  ): Partial<LigneContratOrmEntity> {
    return {
      id: entity.id,
      quantite: entity.quantite,
      prixUnitaire: entity.prixUnitaire,
      contratId: entity.contratId,
      periodeFacturationId: entity.periodeFacturationId,
      produitId: entity.produitId,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
