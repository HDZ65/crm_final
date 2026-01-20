import { StripeAccountEntity } from '../../core/domain/stripe-account.entity';
import { StripeAccountEntity as StripeAccountOrmEntity } from '../../infrastructure/db/entities/stripe-account.entity';

export class StripeAccountMapper {
  static toDomain(orm: StripeAccountOrmEntity): StripeAccountEntity {
    return new StripeAccountEntity({
      id: orm.id,
      societeId: orm.societeId,
      nom: orm.nom,
      stripeSecretKey: orm.stripeSecretKey,
      stripePublishableKey: orm.stripePublishableKey,
      stripeWebhookSecret: orm.stripeWebhookSecret,
      isTestMode: orm.isTestMode,
      actif: orm.actif,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt,
    });
  }

  static toPersistence(domain: StripeAccountEntity): Partial<StripeAccountOrmEntity> {
    return {
      id: domain.id,
      societeId: domain.societeId,
      nom: domain.nom,
      stripeSecretKey: domain.stripeSecretKey,
      stripePublishableKey: domain.stripePublishableKey,
      stripeWebhookSecret: domain.stripeWebhookSecret,
      isTestMode: domain.isTestMode,
      actif: domain.actif,
    };
  }
}
