import { SlimpayAccountEntity } from '../../core/domain/slimpay-account.entity';
import { SlimpayAccountEntity as SlimpayAccountOrmEntity } from '../../infrastructure/db/entities/slimpay-account.entity';

export class SlimpayAccountMapper {
  static toDomain(orm: SlimpayAccountOrmEntity): SlimpayAccountEntity {
    return new SlimpayAccountEntity({
      id: orm.id,
      societeId: orm.societeId,
      nom: orm.nom,
      appId: orm.appId,
      appSecret: orm.appSecret,
      creditorReference: orm.creditorReference,
      environment: orm.environment,
      actif: orm.actif,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt,
    });
  }

  static toPersistence(domain: SlimpayAccountEntity): Partial<SlimpayAccountOrmEntity> {
    return {
      id: domain.id,
      societeId: domain.societeId,
      nom: domain.nom,
      appId: domain.appId,
      appSecret: domain.appSecret,
      creditorReference: domain.creditorReference,
      environment: domain.environment,
      actif: domain.actif,
    };
  }
}
