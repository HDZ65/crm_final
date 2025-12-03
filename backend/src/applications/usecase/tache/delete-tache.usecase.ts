import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import type { TacheRepositoryPort } from '../../../core/port/tache-repository.port';

@Injectable()
export class DeleteTacheUseCase {
  constructor(
    @Inject('TacheRepositoryPort')
    private readonly repository: TacheRepositoryPort,
  ) {}

  async execute(id: string): Promise<void> {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundException(`Tâche avec l'id ${id} non trouvée`);
    }

    await this.repository.delete(id);
  }
}
