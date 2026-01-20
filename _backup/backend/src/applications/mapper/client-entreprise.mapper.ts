import { ClientEntrepriseEntity } from '../../core/domain/client-entreprise.entity';
import { ClientEntrepriseEntity as ClientEntrepriseOrmEntity } from '../../infrastructure/db/entities/client-entreprise.entity';

export class ClientEntrepriseMapper {
  static toDomain(
    ormEntity: ClientEntrepriseOrmEntity,
  ): ClientEntrepriseEntity {
    return new ClientEntrepriseEntity({
      id: ormEntity.id,
      raisonSociale: ormEntity.raisonSociale,
      numeroTVA: ormEntity.numeroTVA,
      siren: ormEntity.siren,
      createdAt: ormEntity.createdAt,
      updatedAt: ormEntity.updatedAt,
    });
  }

  static toPersistence(
    entity: ClientEntrepriseEntity,
  ): Partial<ClientEntrepriseOrmEntity> {
    return {
      id: entity.id,
      raisonSociale: entity.raisonSociale,
      numeroTVA: entity.numeroTVA,
      siren: entity.siren,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
