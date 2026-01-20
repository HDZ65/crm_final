import { MembrePartenaireEntity } from '../../core/domain/membre-partenaire.entity';
import { MembrePartenaireEntity as MembrePartenaireOrmEntity } from '../../infrastructure/db/entities/membre-partenaire.entity';

export class MembrePartenaireMapper {
  static toDomain(
    ormEntity: MembrePartenaireOrmEntity,
  ): MembrePartenaireEntity {
    return new MembrePartenaireEntity({
      id: ormEntity.id,
      utilisateurId: ormEntity.utilisateurId,
      partenaireMarqueBlancheId: ormEntity.partenaireMarqueBlancheId,
      role: ormEntity.role,
      createdAt: ormEntity.createdAt,
      updatedAt: ormEntity.updatedAt,
    });
  }

  static toPersistence(
    entity: MembrePartenaireEntity,
  ): Partial<MembrePartenaireOrmEntity> {
    return {
      id: entity.id,
      utilisateurId: entity.utilisateurId,
      partenaireMarqueBlancheId: entity.partenaireMarqueBlancheId,
      role: entity.role,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
