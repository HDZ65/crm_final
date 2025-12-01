import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import type { GrilleTarifaireRepositoryPort } from '../../../core/port/grille-tarifaire-repository.port';

@Injectable()
export class DeleteGrilleTarifaireUseCase {
  constructor(
    @Inject('GrilleTarifaireRepositoryPort')
    private readonly repository: GrilleTarifaireRepositoryPort,
  ) {}

  async execute(id: string): Promise<void> {
    const existing = await this.repository.findById(id);

    if (!existing) {
      throw new NotFoundException(
        'GrilleTarifaire with id ' + id + ' not found',
      );
    }

    await this.repository.delete(id);
  }
}
