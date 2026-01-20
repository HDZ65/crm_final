import { MembreCompteEntity } from '../../core/domain/membre-compte.entity';
import { MembreOrganisationEntity as MembreOrganisationOrmEntity } from '../../infrastructure/db/entities/membre-compte.entity';

export class MembreCompteMapper {
  static toDomain(ormEntity: MembreOrganisationOrmEntity): MembreCompteEntity {
    return new MembreCompteEntity({
      id: ormEntity.id,
      organisationId: ormEntity.organisationId,
      utilisateurId: ormEntity.utilisateurId,
      roleId: ormEntity.roleId,
      etat: ormEntity.etat,
      dateInvitation: ormEntity.dateInvitation
        ? new Date(ormEntity.dateInvitation)
        : null,
      dateActivation: ormEntity.dateActivation
        ? new Date(ormEntity.dateActivation)
        : null,
      createdAt: ormEntity.createdAt,
      updatedAt: ormEntity.updatedAt,
    });
  }

  static toPersistence(
    entity: MembreCompteEntity,
  ): Partial<MembreOrganisationOrmEntity> {
    return {
      id: entity.id,
      organisationId: entity.organisationId,
      utilisateurId: entity.utilisateurId,
      roleId: entity.roleId,
      etat: entity.etat,
      dateInvitation: entity.dateInvitation ?? null,
      dateActivation: entity.dateActivation ?? null,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
