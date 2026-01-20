import { CompteEntity } from '../../core/domain/compte.entity';
import { CompteEntity as CompteOrmEntity } from '../../infrastructure/db/entities/compte.entity';

export class CompteMapper {
  static toDomain(ormEntity: CompteOrmEntity): CompteEntity {
    return new CompteEntity({
      id: ormEntity.id,
      nom: ormEntity.nom,
      etat: ormEntity.etat,
      dateCreation: ormEntity.dateCreation,
      createdByUserId: ormEntity.createdByUserId,
      createdAt: ormEntity.createdAt,
      updatedAt: ormEntity.updatedAt,
    });
  }

  static toPersistence(entity: CompteEntity): Partial<CompteOrmEntity> {
    return {
      id: entity.id,
      nom: entity.nom,
      etat: entity.etat,
      dateCreation: entity.dateCreation,
      createdByUserId: entity.createdByUserId,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
