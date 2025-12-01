import { PartenaireMarqueBlancheEntity } from '../../core/domain/partenaire-marque-blanche.entity';
import { PartenaireMarqueBlancheEntity as PartenaireMarqueBlancheOrmEntity } from '../../infrastructure/db/entities/partenaire-marque-blanche.entity';

export class PartenaireMarqueBlancheMapper {
  static toDomain(
    ormEntity: PartenaireMarqueBlancheOrmEntity,
  ): PartenaireMarqueBlancheEntity {
    return new PartenaireMarqueBlancheEntity({
      id: ormEntity.id,
      denomination: ormEntity.denomination,
      siren: ormEntity.siren,
      numeroTVA: ormEntity.numeroTVA,
      contactSupportEmail: ormEntity.contactSupportEmail,
      telephone: ormEntity.telephone,
      statutId: ormEntity.statutId,
      createdAt: ormEntity.createdAt,
      updatedAt: ormEntity.updatedAt,
    });
  }

  static toPersistence(
    entity: PartenaireMarqueBlancheEntity,
  ): Partial<PartenaireMarqueBlancheOrmEntity> {
    return {
      id: entity.id,
      denomination: entity.denomination,
      siren: entity.siren,
      numeroTVA: entity.numeroTVA,
      contactSupportEmail: entity.contactSupportEmail,
      telephone: entity.telephone,
      statutId: entity.statutId,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
