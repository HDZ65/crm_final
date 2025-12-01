import { ClientPartenaireEntity } from '../../core/domain/client-partenaire.entity';
import { ClientPartenaireEntity as ClientPartenaireOrmEntity } from '../../infrastructure/db/entities/client-partenaire.entity';

export class ClientPartenaireMapper {
  static toDomain(
    ormEntity: ClientPartenaireOrmEntity,
  ): ClientPartenaireEntity {
    return new ClientPartenaireEntity({
      id: ormEntity.id,
      clientBaseId: ormEntity.clientBaseId,
      partenaireId: ormEntity.partenaireId,
      rolePartenaireId: ormEntity.rolePartenaireId,
      validFrom: ormEntity.validFrom,
      validTo: ormEntity.validTo,
      createdAt: ormEntity.createdAt,
      updatedAt: ormEntity.updatedAt,
    });
  }

  static toPersistence(
    entity: ClientPartenaireEntity,
  ): Partial<ClientPartenaireOrmEntity> {
    return {
      id: entity.id,
      clientBaseId: entity.clientBaseId,
      partenaireId: entity.partenaireId,
      rolePartenaireId: entity.rolePartenaireId,
      validFrom: entity.validFrom,
      validTo: entity.validTo,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
