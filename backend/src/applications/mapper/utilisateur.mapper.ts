import { UtilisateurEntity } from '../../core/domain/utilisateur.entity';
import { UtilisateurEntity as UtilisateurOrmEntity } from '../../infrastructure/db/entities/utilisateur.entity';

export class UtilisateurMapper {
  static toDomain(ormEntity: UtilisateurOrmEntity): UtilisateurEntity {
    return new UtilisateurEntity({
      id: ormEntity.id,
      keycloakId: ormEntity.keycloakId,
      nom: ormEntity.nom,
      prenom: ormEntity.prenom,
      email: ormEntity.email,
      telephone: ormEntity.telephone,
      actif: ormEntity.actif,
      createdAt: ormEntity.createdAt,
      updatedAt: ormEntity.updatedAt,
    });
  }

  static toPersistence(
    entity: UtilisateurEntity,
  ): Partial<UtilisateurOrmEntity> {
    return {
      id: entity.id,
      keycloakId: entity.keycloakId,
      nom: entity.nom,
      prenom: entity.prenom,
      email: entity.email,
      telephone: entity.telephone,
      actif: entity.actif,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
