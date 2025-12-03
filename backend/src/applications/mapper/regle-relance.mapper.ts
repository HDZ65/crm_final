import { RegleRelanceEntity, RelanceDeclencheur, RelanceActionType } from '../../core/domain/regle-relance.entity';
import { RegleRelanceEntity as RegleRelanceOrmEntity } from '../../infrastructure/db/entities/regle-relance.entity';

export class RegleRelanceMapper {
  static toDomain(ormEntity: RegleRelanceOrmEntity): RegleRelanceEntity {
    return new RegleRelanceEntity({
      id: ormEntity.id,
      organisationId: ormEntity.organisationId,
      nom: ormEntity.nom,
      description: ormEntity.description,
      declencheur: ormEntity.declencheur as RelanceDeclencheur,
      delaiJours: ormEntity.delaiJours,
      actionType: ormEntity.actionType as RelanceActionType,
      prioriteTache: ormEntity.prioriteTache as 'HAUTE' | 'MOYENNE' | 'BASSE',
      templateEmailId: ormEntity.templateEmailId,
      templateTitreTache: ormEntity.templateTitreTache,
      templateDescriptionTache: ormEntity.templateDescriptionTache,
      assigneParDefaut: ormEntity.assigneParDefaut,
      actif: ormEntity.actif,
      ordre: ormEntity.ordre,
      metadata: ormEntity.metadata,
      createdAt: ormEntity.createdAt,
      updatedAt: ormEntity.updatedAt,
    });
  }

  static toPersistence(entity: RegleRelanceEntity): Partial<RegleRelanceOrmEntity> {
    return {
      id: entity.id,
      organisationId: entity.organisationId,
      nom: entity.nom,
      description: entity.description,
      declencheur: entity.declencheur,
      delaiJours: entity.delaiJours,
      actionType: entity.actionType,
      prioriteTache: entity.prioriteTache,
      templateEmailId: entity.templateEmailId,
      templateTitreTache: entity.templateTitreTache,
      templateDescriptionTache: entity.templateDescriptionTache,
      assigneParDefaut: entity.assigneParDefaut,
      actif: entity.actif,
      ordre: entity.ordre,
      metadata: entity.metadata,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
