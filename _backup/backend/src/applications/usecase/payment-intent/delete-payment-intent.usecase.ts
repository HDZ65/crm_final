import { Injectable, Inject } from '@nestjs/common';
import type { PaymentIntentRepositoryPort } from '../../../core/port/payment-intent-repository.port';

@Injectable()
export class DeletePaymentIntentUseCase {
  constructor(
    @Inject('PaymentIntentRepositoryPort')
    private readonly repository: PaymentIntentRepositoryPort,
  ) {}

  async execute(id: string): Promise<void> {
    return await this.repository.delete(id);
  }
}
