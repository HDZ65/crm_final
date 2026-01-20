import { Injectable, Inject } from '@nestjs/common';
import { PaymentEventEntity } from '../../../core/domain/payment-event.entity';
import type { PaymentEventRepositoryPort } from '../../../core/port/payment-event-repository.port';

@Injectable()
export class GetPaymentEventUseCase {
  constructor(
    @Inject('PaymentEventRepositoryPort')
    private readonly repository: PaymentEventRepositoryPort,
  ) {}

  async execute(id: string): Promise<PaymentEventEntity | null> {
    return await this.repository.findById(id);
  }

  async findAll(): Promise<PaymentEventEntity[]> {
    return await this.repository.findAll();
  }

  async findByPaymentIntentId(
    paymentIntentId: string,
  ): Promise<PaymentEventEntity[]> {
    return await this.repository.findByPaymentIntentId(paymentIntentId);
  }

  async findUnprocessed(): Promise<PaymentEventEntity[]> {
    return await this.repository.findUnprocessed();
  }
}
