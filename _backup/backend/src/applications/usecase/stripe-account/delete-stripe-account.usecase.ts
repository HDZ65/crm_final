import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { StripeAccountRepositoryPort } from '../../../core/port/stripe-account-repository.port';

@Injectable()
export class DeleteStripeAccountUseCase {
  constructor(
    @Inject('StripeAccountRepositoryPort')
    private readonly repository: StripeAccountRepositoryPort,
  ) {}

  async execute(id: string): Promise<void> {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundException(`Compte Stripe non trouvé (ID: ${id})`);
    }

    await this.repository.delete(id);
  }
}
