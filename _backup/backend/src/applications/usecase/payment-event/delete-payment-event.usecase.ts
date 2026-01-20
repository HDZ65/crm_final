import { Injectable, Inject } from '@nestjs/common';
import type { PaymentEventRepositoryPort } from '../../../core/port/payment-event-repository.port';

@Injectable()
export class DeletePaymentEventUseCase {
  constructor(
    @Inject('PaymentEventRepositoryPort')
    private readonly repository: PaymentEventRepositoryPort,
  ) {}

  async execute(id: string): Promise<void> {
    return await this.repository.delete(id);
  }
}
