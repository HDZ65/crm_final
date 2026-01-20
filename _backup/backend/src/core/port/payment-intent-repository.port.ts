import { PaymentIntentEntity } from '../domain/payment-intent.entity';
import { BaseRepositoryPort } from './repository.port';

export interface PaymentIntentRepositoryPort extends BaseRepositoryPort<PaymentIntentEntity> {
  findByScheduleId(scheduleId: string): Promise<PaymentIntentEntity[]>;
  findByIdempotencyKey(
    idempotencyKey: string,
  ): Promise<PaymentIntentEntity | null>;
  findByPspPaymentId(pspPaymentId: string): Promise<PaymentIntentEntity | null>;
}
