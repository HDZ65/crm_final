import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { SlimpayAccountRepositoryPort } from '../../../core/port/slimpay-account-repository.port';

@Injectable()
export class DeleteSlimpayAccountUseCase {
  constructor(
    @Inject('SlimpayAccountRepositoryPort')
    private readonly repository: SlimpayAccountRepositoryPort,
  ) {}

  async execute(id: string): Promise<void> {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundException(`Compte Slimpay avec l'id ${id} non trouvé`);
    }

    await this.repository.delete(id);
  }
}
