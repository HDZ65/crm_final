import { Injectable, Inject } from '@nestjs/common';
import { StatutClientEntity } from '../../../core/domain/statut-client.entity';
import type { StatutClientRepositoryPort } from '../../../core/port/statut-client-repository.port';
import { CreateStatutClientDto } from '../../dto/statut-client/create-statut-client.dto';

@Injectable()
export class CreateStatutClientUseCase {
  constructor(
    @Inject('StatutClientRepositoryPort')
    private readonly repository: StatutClientRepositoryPort,
  ) {}

  async execute(dto: CreateStatutClientDto): Promise<StatutClientEntity> {
    const entity = new StatutClientEntity({
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
