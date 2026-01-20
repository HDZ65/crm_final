import { PaymentEventEntity } from '../domain/payment-event.entity';
import { PaymentEventEntity as PaymentEventOrm } from '../../infrastructure/db/entities/payment-event.entity';

export class PaymentEventMapper {
  static toDomain(orm: PaymentEventOrm): PaymentEventEntity {
    return new PaymentEventEntity({
      id: orm.id,
      pspEventId: orm.pspEventId,
      organisationId: orm.organisationId,
      paymentIntentId: orm.paymentIntentId,
      eventType: orm.eventType,
      rawPayload: orm.rawPayload,
      receivedAt: orm.receivedAt,
      processed: orm.processed,
      processedAt: orm.processedAt,
      errorMessage: orm.errorMessage,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt,
    });
  }

  static toPersistence(domain: PaymentEventEntity): Partial<PaymentEventOrm> {
    return {
      id: domain.id,
      pspEventId: domain.pspEventId,
      organisationId: domain.organisationId,
      paymentIntentId: domain.paymentIntentId,
      eventType: domain.eventType,
      rawPayload: domain.rawPayload,
      receivedAt: domain.receivedAt,
      processed: domain.processed,
      processedAt: domain.processedAt,
      errorMessage: domain.errorMessage,
    };
  }
}
