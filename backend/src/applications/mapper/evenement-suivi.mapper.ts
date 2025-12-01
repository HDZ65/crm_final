import { EvenementSuiviEntity } from '../../core/domain/evenement-suivi.entity';
import { EvenementSuiviEntity as EvenementSuiviOrmEntity } from '../../infrastructure/db/entities/evenement-suivi.entity';

export class EvenementSuiviMapper {
  static toDomain(ormEntity: EvenementSuiviOrmEntity): EvenementSuiviEntity {
    return new EvenementSuiviEntity({
      id: ormEntity.id,
      expeditionId: ormEntity.expeditionId,
      code: ormEntity.code,
      label: ormEntity.label,
      dateEvenement: ormEntity.dateEvenement,
      lieu: ormEntity.lieu,
      raw: ormEntity.raw,
      createdAt: ormEntity.createdAt,
      updatedAt: ormEntity.updatedAt,
    });
  }

  static toPersistence(
    entity: EvenementSuiviEntity,
  ): Partial<EvenementSuiviOrmEntity> {
    return {
      id: entity.id,
      expeditionId: entity.expeditionId,
      code: entity.code,
      label: entity.label,
      dateEvenement: entity.dateEvenement,
      lieu: entity.lieu,
      raw: entity.raw,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
