import { HistoriqueRelanceEntity, RelanceResultat } from '../../core/domain/historique-relance.entity';
import { HistoriqueRelanceEntity as HistoriqueRelanceOrmEntity } from '../../infrastructure/db/entities/historique-relance.entity';

export class HistoriqueRelanceMapper {
  static toDomain(ormEntity: HistoriqueRelanceOrmEntity): HistoriqueRelanceEntity {
    return new HistoriqueRelanceEntity({
      id: ormEntity.id,
      organisationId: ormEntity.organisationId,
      regleRelanceId: ormEntity.regleRelanceId,
      clientId: ormEntity.clientId,
      contratId: ormEntity.contratId,
      factureId: ormEntity.factureId,
      tacheCreeeId: ormEntity.tacheCreeeId,
      dateExecution: ormEntity.dateExecution,
      resultat: ormEntity.resultat as RelanceResultat,
      messageErreur: ormEntity.messageErreur,
      metadata: ormEntity.metadata,
      createdAt: ormEntity.createdAt,
      updatedAt: ormEntity.updatedAt,
    });
  }

  static toPersistence(entity: HistoriqueRelanceEntity): Partial<HistoriqueRelanceOrmEntity> {
    return {
      id: entity.id,
      organisationId: entity.organisationId,
      regleRelanceId: entity.regleRelanceId,
      clientId: entity.clientId,
      contratId: entity.contratId,
      factureId: entity.factureId,
      tacheCreeeId: entity.tacheCreeeId,
      dateExecution: entity.dateExecution,
      resultat: entity.resultat,
      messageErreur: entity.messageErreur,
      metadata: entity.metadata,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
