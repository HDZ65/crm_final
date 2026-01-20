import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import type { MembreCompteRepositoryPort } from '../../../core/port/membre-compte-repository.port';

@Injectable()
export class DeleteMembreCompteUseCase {
  constructor(
    @Inject('MembreCompteRepositoryPort')
    private readonly repository: MembreCompteRepositoryPort,
  ) {}

  async execute(id: string): Promise<void> {
    const existing = await this.repository.findById(id);

    if (!existing) {
      throw new NotFoundException('MembreCompte with id ' + id + ' not found');
    }

    await this.repository.delete(id);
  }
}
