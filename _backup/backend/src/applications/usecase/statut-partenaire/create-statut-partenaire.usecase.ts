import { Injectable, Inject } from '@nestjs/common';
import { StatutPartenaireEntity } from '../../../core/domain/statut-partenaire.entity';
import type { StatutPartenaireRepositoryPort } from '../../../core/port/statut-partenaire-repository.port';
import { CreateStatutPartenaireDto } from '../../dto/statut-partenaire/create-statut-partenaire.dto';

@Injectable()
export class CreateStatutPartenaireUseCase {
  constructor(
    @Inject('StatutPartenaireRepositoryPort')
    private readonly repository: StatutPartenaireRepositoryPort,
  ) {}

  async execute(
    dto: CreateStatutPartenaireDto,
  ): Promise<StatutPartenaireEntity> {
    const entity = new StatutPartenaireEntity({
      code: dto.code,
      nom: dto.nom,
      description: dto.description,
      ordreAffichage: dto.ordreAffichage,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Add business logic here (if needed)

    return await this.repository.create(entity);
  }
}
