import {
  GoCardlessMandateEntity,
  GoCardlessMandateStatus,
  GoCardlessScheme,
} from '../../core/domain/gocardless-mandate.entity';
import { GoCardlessMandateEntity as GoCardlessMandateOrmEntity } from '../../infrastructure/db/entities/gocardless-mandate.entity';

export class GoCardlessMandateMapper {
  static toDomain(ormEntity: GoCardlessMandateOrmEntity): GoCardlessMandateEntity {
    return new GoCardlessMandateEntity({
      id: ormEntity.id,
      clientId: ormEntity.clientId,
      gocardlessCustomerId: ormEntity.gocardlessCustomerId,
      gocardlessBankAccountId: ormEntity.gocardlessBankAccountId,
      mandateId: ormEntity.mandateId,
      mandateReference: ormEntity.mandateReference,
      mandateStatus: ormEntity.mandateStatus as GoCardlessMandateStatus,
      scheme: ormEntity.scheme as GoCardlessScheme,
      subscriptionId: ormEntity.subscriptionId,
      subscriptionStatus: ormEntity.subscriptionStatus,
      nextChargeDate: ormEntity.nextChargeDate,
      metadata: ormEntity.metadata,
      createdAt: ormEntity.createdAt,
      updatedAt: ormEntity.updatedAt,
    });
  }

  static toPersistence(
    entity: GoCardlessMandateEntity,
  ): Partial<GoCardlessMandateOrmEntity> {
    return {
      id: entity.id,
      clientId: entity.clientId,
      gocardlessCustomerId: entity.gocardlessCustomerId,
      gocardlessBankAccountId: entity.gocardlessBankAccountId,
      mandateId: entity.mandateId,
      mandateReference: entity.mandateReference,
      mandateStatus: entity.mandateStatus,
      scheme: entity.scheme,
      subscriptionId: entity.subscriptionId,
      subscriptionStatus: entity.subscriptionStatus,
      nextChargeDate: entity.nextChargeDate,
      metadata: entity.metadata,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
