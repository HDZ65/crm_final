import { StatutCommissionEntity } from '../../core/domain/statut-commission.entity';
import { StatutCommissionEntity as StatutCommissionOrmEntity } from '../../infrastructure/db/entities/statut-commission.entity';
import { StatutCommissionResponseDto } from '../dto/statut-commission/statut-commission-response.dto';

export class StatutCommissionMapper {
  static toDomain(
    ormEntity: StatutCommissionOrmEntity,
  ): StatutCommissionEntity {
    return new StatutCommissionEntity({
      id: ormEntity.id,
      code: ormEntity.code,
      nom: ormEntity.nom,
      description: ormEntity.description,
      ordreAffichage: ormEntity.ordreAffichage,
      createdAt: ormEntity.createdAt,
      updatedAt: ormEntity.updatedAt,
    });
  }

  static toPersistence(
    entity: StatutCommissionEntity,
  ): Partial<StatutCommissionOrmEntity> {
    return {
      id: entity.id,
      code: entity.code,
      nom: entity.nom,
      description: entity.description,
      ordreAffichage: entity.ordreAffichage,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  static toResponse(
    entity: StatutCommissionEntity,
  ): StatutCommissionResponseDto {
    return new StatutCommissionResponseDto({
      id: entity.id,
      code: entity.code,
      nom: entity.nom,
      description: entity.description,
      ordreAffichage: entity.ordreAffichage,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    });
  }
}
