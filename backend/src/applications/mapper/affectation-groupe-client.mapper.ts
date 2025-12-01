import { AffectationGroupeClientEntity } from '../../core/domain/affectation-groupe-client.entity';
import { AffectationGroupeClientEntity as AffectationGroupeClientOrmEntity } from '../../infrastructure/db/entities/affectation-groupe-client.entity';

export class AffectationGroupeClientMapper {
  static toDomain(
    ormEntity: AffectationGroupeClientOrmEntity,
  ): AffectationGroupeClientEntity {
    return new AffectationGroupeClientEntity({
      id: ormEntity.id,
      groupeId: ormEntity.groupeId,
      clientBaseId: ormEntity.clientBaseId,
      createdAt: ormEntity.createdAt,
      updatedAt: ormEntity.updatedAt,
    });
  }

  static toPersistence(
    entity: AffectationGroupeClientEntity,
  ): Partial<AffectationGroupeClientOrmEntity> {
    return {
      id: entity.id,
      groupeId: entity.groupeId,
      clientBaseId: entity.clientBaseId,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
