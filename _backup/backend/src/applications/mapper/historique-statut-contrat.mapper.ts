import { HistoriqueStatutContratEntity } from '../../core/domain/historique-statut-contrat.entity';
import { HistoriqueStatutContratEntity as HistoriqueStatutContratOrmEntity } from '../../infrastructure/db/entities/historique-statut-contrat.entity';

export class HistoriqueStatutContratMapper {
  static toDomain(
    ormEntity: HistoriqueStatutContratOrmEntity,
  ): HistoriqueStatutContratEntity {
    return new HistoriqueStatutContratEntity({
      id: ormEntity.id,
      contratId: ormEntity.contratId,
      ancienStatutId: ormEntity.ancienStatutId,
      nouveauStatutId: ormEntity.nouveauStatutId,
      dateChangement: ormEntity.dateChangement,
      createdAt: ormEntity.createdAt,
      updatedAt: ormEntity.updatedAt,
    });
  }

  static toPersistence(
    entity: HistoriqueStatutContratEntity,
  ): Partial<HistoriqueStatutContratOrmEntity> {
    return {
      id: entity.id,
      contratId: entity.contratId,
      ancienStatutId: entity.ancienStatutId,
      nouveauStatutId: entity.nouveauStatutId,
      dateChangement: entity.dateChangement,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
