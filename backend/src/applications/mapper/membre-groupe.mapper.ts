import { MembreGroupeEntity } from '../../core/domain/membre-groupe.entity';
import { MembreGroupeEntity as MembreGroupeOrmEntity } from '../../infrastructure/db/entities/membre-groupe.entity';

export class MembreGroupeMapper {
  static toDomain(ormEntity: MembreGroupeOrmEntity): MembreGroupeEntity {
    return new MembreGroupeEntity({
      id: ormEntity.id,
      membreCompteId: ormEntity.membreCompteId,
      groupeId: ormEntity.groupeId,
      roleLocal: ormEntity.roleLocal,
      createdAt: ormEntity.createdAt,
      updatedAt: ormEntity.updatedAt,
    });
  }

  static toPersistence(
    entity: MembreGroupeEntity,
  ): Partial<MembreGroupeOrmEntity> {
    return {
      id: entity.id,
      membreCompteId: entity.membreCompteId,
      groupeId: entity.groupeId,
      roleLocal: entity.roleLocal,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
