import { SocieteEntity } from '../../core/domain/societe.entity';
import { SocieteEntity as SocieteOrmEntity } from '../../infrastructure/db/entities/societe.entity';

export class SocieteMapper {
  static toDomain(ormEntity: SocieteOrmEntity): SocieteEntity {
    return new SocieteEntity({
      id: ormEntity.id,
      organisationId: ormEntity.organisationId,
      raisonSociale: ormEntity.raisonSociale,
      siren: ormEntity.siren,
      numeroTVA: ormEntity.numeroTVA,
      createdAt: ormEntity.createdAt,
      updatedAt: ormEntity.updatedAt,
    });
  }

  static toPersistence(entity: SocieteEntity): Partial<SocieteOrmEntity> {
    return {
      id: entity.id,
      organisationId: entity.organisationId,
      raisonSociale: entity.raisonSociale,
      siren: entity.siren,
      numeroTVA: entity.numeroTVA,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
