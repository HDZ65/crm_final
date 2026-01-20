import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { GoCardlessAccountRepositoryPort } from '../../../core/port/gocardless-account-repository.port';

@Injectable()
export class DeleteGoCardlessAccountUseCase {
  constructor(
    @Inject('GoCardlessAccountRepositoryPort')
    private readonly repository: GoCardlessAccountRepositoryPort,
  ) {}

  async execute(id: string): Promise<void> {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundException(`Compte GoCardless avec l'id ${id} non trouvé`);
    }

    await this.repository.delete(id);
  }
}
