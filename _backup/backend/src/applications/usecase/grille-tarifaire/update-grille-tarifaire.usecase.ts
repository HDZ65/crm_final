import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { GrilleTarifaireEntity } from '../../../core/domain/grille-tarifaire.entity';
import type { GrilleTarifaireRepositoryPort } from '../../../core/port/grille-tarifaire-repository.port';
import { UpdateGrilleTarifaireDto } from '../../dto/grille-tarifaire/update-grille-tarifaire.dto';

@Injectable()
export class UpdateGrilleTarifaireUseCase {
  constructor(
    @Inject('GrilleTarifaireRepositoryPort')
    private readonly repository: GrilleTarifaireRepositoryPort,
  ) {}

  async execute(
    id: string,
    dto: UpdateGrilleTarifaireDto,
  ): Promise<GrilleTarifaireEntity> {
    const existing = await this.repository.findById(id);

    if (!existing) {
      throw new NotFoundException(
        'GrilleTarifaire with id ' + id + ' not found',
      );
    }

    if (dto.nom !== undefined) {
      existing.nom = dto.nom;
    }
    if (dto.dateDebut !== undefined) {
      existing.dateDebut = dto.dateDebut;
    }
    if (dto.dateFin !== undefined) {
      existing.dateFin = dto.dateFin;
    }
    if (dto.estParDefaut !== undefined) {
      existing.estParDefaut = dto.estParDefaut;
    }
    existing.updatedAt = new Date();

    // Add business logic here (if needed)

    return await this.repository.update(id, existing);
  }
}
