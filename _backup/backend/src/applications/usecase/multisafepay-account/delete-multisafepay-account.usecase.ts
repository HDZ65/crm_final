import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { MultisafepayAccountRepositoryPort } from '../../../core/port/multisafepay-account-repository.port';

@Injectable()
export class DeleteMultisafepayAccountUseCase {
  constructor(
    @Inject('MultisafepayAccountRepositoryPort')
    private readonly repository: MultisafepayAccountRepositoryPort,
  ) {}

  async execute(id: string): Promise<void> {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundException(`Compte MultiSafepay avec l'id ${id} non trouvé`);
    }

    await this.repository.delete(id);
  }
}
