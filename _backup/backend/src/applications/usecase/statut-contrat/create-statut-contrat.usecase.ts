import { Injectable, Inject } from '@nestjs/common';
import { StatutContratEntity } from '../../../core/domain/statut-contrat.entity';
import type { StatutContratRepositoryPort } from '../../../core/port/statut-contrat-repository.port';
import { CreateStatutContratDto } from '../../dto/statut-contrat/create-statut-contrat.dto';

@Injectable()
export class CreateStatutContratUseCase {
  constructor(
    @Inject('StatutContratRepositoryPort')
    private readonly repository: StatutContratRepositoryPort,
  ) {}

  async execute(dto: CreateStatutContratDto): Promise<StatutContratEntity> {
    const entity = new StatutContratEntity({
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
