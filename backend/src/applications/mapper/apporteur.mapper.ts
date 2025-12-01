import { ApporteurEntity } from '../../core/domain/apporteur.entity';
import { ApporteurEntity as ApporteurOrmEntity } from '../../infrastructure/db/entities/apporteur.entity';
import { ApporteurResponseDto } from '../dto/apporteur/apporteur-response.dto';

export class ApporteurMapper {
  static toDomain(ormEntity: ApporteurOrmEntity): ApporteurEntity {
    return new ApporteurEntity({
      id: ormEntity.id,
      organisationId: ormEntity.organisationId,
      utilisateurId: ormEntity.utilisateurId,
      nom: ormEntity.nom,
      prenom: ormEntity.prenom,
      typeApporteur: ormEntity.typeApporteur,
      email: ormEntity.email,
      telephone: ormEntity.telephone,
      actif: ormEntity.actif,
      createdAt: ormEntity.createdAt,
      updatedAt: ormEntity.updatedAt,
    });
  }

  static toPersistence(entity: ApporteurEntity): Partial<ApporteurOrmEntity> {
    return {
      id: entity.id,
      organisationId: entity.organisationId,
      utilisateurId: entity.utilisateurId,
      nom: entity.nom,
      prenom: entity.prenom,
      typeApporteur: entity.typeApporteur,
      email: entity.email,
      telephone: entity.telephone,
      actif: entity.actif,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  static toResponse(entity: ApporteurEntity): ApporteurResponseDto {
    return new ApporteurResponseDto({
      id: entity.id,
      organisationId: entity.organisationId,
      utilisateurId: entity.utilisateurId,
      nom: entity.nom,
      prenom: entity.prenom,
      typeApporteur: entity.typeApporteur,
      email: entity.email,
      telephone: entity.telephone,
      actif: entity.actif,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    });
  }
}
