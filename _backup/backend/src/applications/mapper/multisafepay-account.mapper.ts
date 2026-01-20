import { MultisafepayAccountEntity } from '../../core/domain/multisafepay-account.entity';
import { MultisafepayAccountEntity as MultisafepayAccountOrmEntity } from '../../infrastructure/db/entities/multisafepay-account.entity';

export class MultisafepayAccountMapper {
  static toDomain(orm: MultisafepayAccountOrmEntity): MultisafepayAccountEntity {
    return new MultisafepayAccountEntity({
      id: orm.id,
      societeId: orm.societeId,
      nom: orm.nom,
      apiKey: orm.apiKey,
      siteId: orm.siteId,
      secureCode: orm.secureCode,
      accountId: orm.accountId,
      environment: orm.environment,
      actif: orm.actif,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt,
    });
  }

  static toPersistence(domain: MultisafepayAccountEntity): Partial<MultisafepayAccountOrmEntity> {
    return {
      id: domain.id,
      societeId: domain.societeId,
      nom: domain.nom,
      apiKey: domain.apiKey,
      siteId: domain.siteId,
      secureCode: domain.secureCode,
      accountId: domain.accountId,
      environment: domain.environment,
      actif: domain.actif,
    };
  }
}
