import { PaymentIntentEntity } from '../domain/payment-intent.entity';
import { PaymentIntentEntity as PaymentIntentOrm } from '../../infrastructure/db/entities/payment-intent.entity';

export class PaymentIntentMapper {
  static toDomain(orm: PaymentIntentOrm): PaymentIntentEntity {
    return new PaymentIntentEntity({
      id: orm.id,
      organisationId: orm.organisationId,
      scheduleId: orm.scheduleId,
      societeId: orm.societeId,
      pspName: orm.pspName,
      pspPaymentId: orm.pspPaymentId,
      amount: orm.amount,
      currency: orm.currency,
      status: orm.status,
      idempotencyKey: orm.idempotencyKey,
      mandateReference: orm.mandateReference,
      metadata: orm.metadata,
      errorCode: orm.errorCode,
      errorMessage: orm.errorMessage,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt,
    });
  }

  static toPersistence(domain: PaymentIntentEntity): Partial<PaymentIntentOrm> {
    return {
      id: domain.id,
      organisationId: domain.organisationId,
      scheduleId: domain.scheduleId,
      societeId: domain.societeId,
      pspName: domain.pspName,
      pspPaymentId: domain.pspPaymentId,
      amount: domain.amount,
      currency: domain.currency,
      status: domain.status,
      idempotencyKey: domain.idempotencyKey,
      mandateReference: domain.mandateReference,
      metadata: domain.metadata,
      errorCode: domain.errorCode,
      errorMessage: domain.errorMessage,
    };
  }
}
