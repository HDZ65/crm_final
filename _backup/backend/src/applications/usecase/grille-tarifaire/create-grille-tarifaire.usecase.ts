import { Injectable, Inject } from '@nestjs/common';
import { GrilleTarifaireEntity } from '../../../core/domain/grille-tarifaire.entity';
import type { GrilleTarifaireRepositoryPort } from '../../../core/port/grille-tarifaire-repository.port';
import { CreateGrilleTarifaireDto } from '../../dto/grille-tarifaire/create-grille-tarifaire.dto';

@Injectable()
export class CreateGrilleTarifaireUseCase {
  constructor(
    @Inject('GrilleTarifaireRepositoryPort')
    private readonly repository: GrilleTarifaireRepositoryPort,
  ) {}

  async execute(dto: CreateGrilleTarifaireDto): Promise<GrilleTarifaireEntity> {
    const entity = new GrilleTarifaireEntity({
      nom: dto.nom,
      dateDebut: dto.dateDebut,
      dateFin: dto.dateFin,
      estParDefaut: dto.estParDefaut,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Add business logic here (if needed)

    return await this.repository.create(entity);
  }
}
