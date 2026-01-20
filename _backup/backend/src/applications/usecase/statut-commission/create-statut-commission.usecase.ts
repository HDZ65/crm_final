import { Injectable, Inject } from '@nestjs/common';
import { StatutCommissionEntity } from '../../../core/domain/statut-commission.entity';
import type { StatutCommissionRepositoryPort } from '../../../core/port/statut-commission-repository.port';
import { CreateStatutCommissionDto } from '../../dto/statut-commission/create-statut-commission.dto';

@Injectable()
export class CreateStatutCommissionUseCase {
  constructor(
    @Inject('StatutCommissionRepositoryPort')
    private readonly repository: StatutCommissionRepositoryPort,
  ) {}

  async execute(
    dto: CreateStatutCommissionDto,
  ): Promise<StatutCommissionEntity> {
    const entity = new StatutCommissionEntity({
      code: dto.code,
      nom: dto.nom,
      description: dto.description ?? null,
      ordreAffichage: dto.ordreAffichage ?? 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return await this.repository.create(entity);
  }
}
