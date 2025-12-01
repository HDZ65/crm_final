import { PieceJointeEntity } from '../../core/domain/piece-jointe.entity';
import { PieceJointeEntity as PieceJointeOrmEntity } from '../../infrastructure/db/entities/piece-jointe.entity';

export class PieceJointeMapper {
  static toDomain(ormEntity: PieceJointeOrmEntity): PieceJointeEntity {
    return new PieceJointeEntity({
      id: ormEntity.id,
      nomFichier: ormEntity.nomFichier,
      url: ormEntity.url,
      dateUpload: ormEntity.dateUpload,
      createdAt: ormEntity.createdAt,
      updatedAt: ormEntity.updatedAt,
    });
  }

  static toPersistence(
    entity: PieceJointeEntity,
  ): Partial<PieceJointeOrmEntity> {
    return {
      id: entity.id,
      nomFichier: entity.nomFichier,
      url: entity.url,
      dateUpload: entity.dateUpload,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
