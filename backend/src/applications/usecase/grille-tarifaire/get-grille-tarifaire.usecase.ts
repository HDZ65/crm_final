import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { GrilleTarifaireEntity } from '../../../core/domain/grille-tarifaire.entity';
import type { GrilleTarifaireRepositoryPort } from '../../../core/port/grille-tarifaire-repository.port';

@Injectable()
export class GetGrilleTarifaireUseCase {
  constructor(
    @Inject('GrilleTarifaireRepositoryPort')
    private readonly repository: GrilleTarifaireRepositoryPort,
  ) {}

  async execute(id: string): Promise<GrilleTarifaireEntity> {
    const entity = await this.repository.findById(id);

    if (!entity) {
      throw new NotFoundException(
        'GrilleTarifaire with id ' + id + ' not found',
      );
    }

    return entity;
  }

  async executeAll(): Promise<GrilleTarifaireEntity[]> {
    return await this.repository.findAll();
  }
}
