import { InvitationCompteEntity } from '../../core/domain/invitation-compte.entity';
import { InvitationCompteEntity as InvitationCompteOrmEntity } from '../../infrastructure/db/entities/invitation-compte.entity';

export class InvitationCompteMapper {
  static toDomain(
    ormEntity: InvitationCompteOrmEntity,
  ): InvitationCompteEntity {
    return new InvitationCompteEntity({
      id: ormEntity.id,
      organisationId: ormEntity.organisationId,
      emailInvite: ormEntity.emailInvite,
      roleId: ormEntity.roleId,
      token: ormEntity.token,
      expireAt: ormEntity.expireAt,
      etat: ormEntity.etat,
      createdAt: ormEntity.createdAt,
      updatedAt: ormEntity.updatedAt,
    });
  }

  static toPersistence(
    entity: InvitationCompteEntity,
  ): Partial<InvitationCompteOrmEntity> {
    return {
      id: entity.id,
      organisationId: entity.organisationId,
      emailInvite: entity.emailInvite,
      roleId: entity.roleId,
      token: entity.token,
      expireAt: entity.expireAt,
      etat: entity.etat,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
