import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { PaypalAccountRepositoryPort } from '../../../core/port/paypal-account-repository.port';

@Injectable()
export class DeletePaypalAccountUseCase {
  constructor(
    @Inject('PaypalAccountRepositoryPort')
    private readonly repository: PaypalAccountRepositoryPort,
  ) {}

  async execute(id: string): Promise<void> {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundException(`Compte PayPal non trouvé (ID: ${id})`);
    }

    await this.repository.delete(id);
  }
}
