import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import type { UtilisateurRepositoryPort } from '../../../core/port/utilisateur-repository.port';

@Injectable()
export class DeleteUtilisateurUseCase {
  constructor(
    @Inject('UtilisateurRepositoryPort')
    private readonly repository: UtilisateurRepositoryPort,
  ) {}

  async execute(id: string): Promise<void> {
    const existing = await this.repository.findById(id);

    if (!existing) {
      throw new NotFoundException('Utilisateur with id ' + id + ' not found');
    }

    await this.repository.delete(id);
  }
}
