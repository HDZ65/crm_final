import { PaymentIntentEntity } from '../entities/payment-intent.entity';

export interface IPaymentIntentRepository {
  findById(id: string): Promise<PaymentIntentEntity | null>;
  findByIdempotencyKey(key: string): Promise<PaymentIntentEntity | null>;
  findBySchedule(scheduleId: string): Promise<PaymentIntentEntity[]>;
  findByClient(clientId: string): Promise<PaymentIntentEntity[]>;
  save(entity: PaymentIntentEntity): Promise<PaymentIntentEntity>;
}
