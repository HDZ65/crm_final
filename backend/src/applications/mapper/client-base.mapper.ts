import { ClientBaseEntity } from '../../core/domain/client-base.entity';
import { ClientBaseEntity as ClientBaseOrmEntity } from '../../infrastructure/db/entities/client-base.entity';

export class ClientBaseMapper {
  static toDomain(ormEntity: ClientBaseOrmEntity): ClientBaseEntity {
    return new ClientBaseEntity({
      id: ormEntity.id,
      organisationId: ormEntity.organisationId,
      typeClient: ormEntity.typeClient,
      nom: ormEntity.nom,
      prenom: ormEntity.prenom,
      dateNaissance: ormEntity.dateNaissance ?? null,
      compteCode: ormEntity.compteCode,
      partenaireId: ormEntity.partenaireId,
      dateCreation: ormEntity.dateCreation,
      telephone: ormEntity.telephone,
      email: ormEntity.email,
      statutId: ormEntity.statutId,
      createdAt: ormEntity.createdAt,
      updatedAt: ormEntity.updatedAt,
    });
  }

  static toPersistence(entity: ClientBaseEntity): Partial<ClientBaseOrmEntity> {
    return {
      id: entity.id,
      organisationId: entity.organisationId,
      typeClient: entity.typeClient,
      nom: entity.nom,
      prenom: entity.prenom,
      dateNaissance: entity.dateNaissance ?? null,
      compteCode: entity.compteCode,
      partenaireId: entity.partenaireId,
      dateCreation: entity.dateCreation,
      telephone: entity.telephone,
      email: entity.email,
      statutId: entity.statutId,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
