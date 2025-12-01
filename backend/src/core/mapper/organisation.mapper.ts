import { OrganisationEntity } from '../domain/organisation.entity';
import { OrganisationEntity as OrganisationOrmEntity } from '../../infrastructure/db/entities/organisation.entity';

export class OrganisationMapper {
  static toDomain(ormEntity: OrganisationOrmEntity): OrganisationEntity {
    return new OrganisationEntity({
      id: ormEntity.id,
      nom: ormEntity.nom,
      description: ormEntity.description,
      siret: ormEntity.siret,
      adresse: ormEntity.adresse,
      telephone: ormEntity.telephone,
      email: ormEntity.email,
      actif: ormEntity.actif,
      createdAt: ormEntity.createdAt,
      updatedAt: ormEntity.updatedAt,
    });
  }

  static toPersistence(
    entity: OrganisationEntity,
  ): Partial<OrganisationOrmEntity> {
    return {
      id: entity.id,
      nom: entity.nom,
      description: entity.description,
      siret: entity.siret,
      adresse: entity.adresse,
      telephone: entity.telephone,
      email: entity.email,
      actif: entity.actif,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
