import { Injectable, Inject } from '@nestjs/common';
import { StatutFactureEntity } from '../../../core/domain/statut-facture.entity';
import type { StatutFactureRepositoryPort } from '../../../core/port/statut-facture-repository.port';
import { CreateStatutFactureDto } from '../../dto/statut-facture/create-statut-facture.dto';

@Injectable()
export class CreateStatutFactureUseCase {
  constructor(
    @Inject('StatutFactureRepositoryPort')
    private readonly repository: StatutFactureRepositoryPort,
  ) {}

  async execute(dto: CreateStatutFactureDto): Promise<StatutFactureEntity> {
    const entity = new StatutFactureEntity({
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
