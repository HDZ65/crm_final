import { PaypalAccountEntity } from '../../core/domain/paypal-account.entity';
import { PaypalAccountEntity as PaypalAccountOrmEntity } from '../../infrastructure/db/entities/paypal-account.entity';

export class PaypalAccountMapper {
  static toDomain(orm: PaypalAccountOrmEntity): PaypalAccountEntity {
    return new PaypalAccountEntity({
      id: orm.id,
      societeId: orm.societeId,
      nom: orm.nom,
      clientId: orm.clientId,
      clientSecret: orm.clientSecret,
      webhookId: orm.webhookId,
      environment: orm.environment,
      actif: orm.actif,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt,
    });
  }

  static toPersistence(domain: PaypalAccountEntity): Partial<PaypalAccountOrmEntity> {
    return {
      id: domain.id,
      societeId: domain.societeId,
      nom: domain.nom,
      clientId: domain.clientId,
      clientSecret: domain.clientSecret,
      webhookId: domain.webhookId,
      environment: domain.environment,
      actif: domain.actif,
    };
  }
}
