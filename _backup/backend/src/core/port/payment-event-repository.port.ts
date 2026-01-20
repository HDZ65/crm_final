import { PaymentEventEntity } from '../domain/payment-event.entity';
import { BaseRepositoryPort } from './repository.port';

export interface PaymentEventRepositoryPort extends BaseRepositoryPort<PaymentEventEntity> {
  findByPaymentIntentId(paymentIntentId: string): Promise<PaymentEventEntity[]>;
  findByPspEventId(pspEventId: string): Promise<PaymentEventEntity | null>;
  findUnprocessed(): Promise<PaymentEventEntity[]>;
}
