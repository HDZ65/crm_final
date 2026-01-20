import { ActiviteEntity } from '../../core/domain/activite.entity';
import { ActiviteEntity as ActiviteOrmEntity } from '../../infrastructure/db/entities/activite.entity';

export class ActiviteMapper {
  static toDomain(ormEntity: ActiviteOrmEntity): ActiviteEntity {
    return new ActiviteEntity({
      id: ormEntity.id,
      typeId: ormEntity.typeId,
      dateActivite: ormEntity.dateActivite,
      sujet: ormEntity.sujet,
      commentaire: ormEntity.commentaire,
      echeance: ormEntity.echeance,
      clientBaseId: ormEntity.clientBaseId,
      contratId: ormEntity.contratId,
      clientPartenaireId: ormEntity.clientPartenaireId,
      createdAt: ormEntity.createdAt,
      updatedAt: ormEntity.updatedAt,
    });
  }

  static toPersistence(entity: ActiviteEntity): Partial<ActiviteOrmEntity> {
    return {
      id: entity.id,
      typeId: entity.typeId,
      dateActivite: entity.dateActivite,
      sujet: entity.sujet,
      commentaire: entity.commentaire,
      echeance: entity.echeance,
      clientBaseId: entity.clientBaseId,
      contratId: entity.contratId,
      clientPartenaireId: entity.clientPartenaireId,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
