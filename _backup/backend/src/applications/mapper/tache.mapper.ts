import {
  TacheEntity,
  TacheType,
  TachePriorite,
  TacheStatut,
} from '../../core/domain/tache.entity';
import { TacheEntity as TacheOrmEntity } from '../../infrastructure/db/entities/tache.entity';

export class TacheMapper {
  static toDomain(ormEntity: TacheOrmEntity): TacheEntity {
    return new TacheEntity({
      id: ormEntity.id,
      organisationId: ormEntity.organisationId,
      titre: ormEntity.titre,
      description: ormEntity.description,
      type: ormEntity.type as TacheType,
      priorite: ormEntity.priorite as TachePriorite,
      statut: ormEntity.statut as TacheStatut,
      dateEcheance: ormEntity.dateEcheance,
      dateCompletion: ormEntity.dateCompletion,
      assigneA: ormEntity.assigneA,
      creePar: ormEntity.creePar,
      clientId: ormEntity.clientId,
      contratId: ormEntity.contratId,
      factureId: ormEntity.factureId,
      regleRelanceId: ormEntity.regleRelanceId,
      metadata: ormEntity.metadata,
      createdAt: ormEntity.createdAt,
      updatedAt: ormEntity.updatedAt,
    });
  }

  static toPersistence(entity: TacheEntity): Partial<TacheOrmEntity> {
    return {
      id: entity.id,
      organisationId: entity.organisationId,
      titre: entity.titre,
      description: entity.description,
      type: entity.type,
      priorite: entity.priorite,
      statut: entity.statut,
      dateEcheance: entity.dateEcheance,
      dateCompletion: entity.dateCompletion,
      assigneA: entity.assigneA,
      creePar: entity.creePar,
      clientId: entity.clientId,
      contratId: entity.contratId,
      factureId: entity.factureId,
      regleRelanceId: entity.regleRelanceId,
      metadata: entity.metadata,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
