import { GoCardlessAccountEntity } from '../../core/domain/gocardless-account.entity';
import { GoCardlessAccountEntity as GoCardlessAccountOrmEntity } from '../../infrastructure/db/entities/gocardless-account.entity';

export class GoCardlessAccountMapper {
  static toDomain(orm: GoCardlessAccountOrmEntity): GoCardlessAccountEntity {
    return new GoCardlessAccountEntity({
      id: orm.id,
      societeId: orm.societeId,
      nom: orm.nom,
      accessToken: orm.accessToken,
      webhookSecret: orm.webhookSecret,
      environment: orm.environment,
      actif: orm.actif,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt,
    });
  }

  static toPersistence(domain: GoCardlessAccountEntity): Partial<GoCardlessAccountOrmEntity> {
    return {
      id: domain.id,
      societeId: domain.societeId,
      nom: domain.nom,
      accessToken: domain.accessToken,
      webhookSecret: domain.webhookSecret,
      environment: domain.environment,
      actif: domain.actif,
    };
  }
}
